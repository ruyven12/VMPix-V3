/* Shell-owned analytics foundation. Activation requires a separately reviewed source change. */
(() => {
  "use strict";
  const boot = window.__v3AnalyticsBoot;
  if (!boot || window.__v3AnalyticsAdapterInstalled) return;
  window.__v3AnalyticsAdapterInstalled = true;
  const MEASUREMENT_ID = "G-1446TW7YQJ";
  const COLLECTION_REVIEW_CONFIRMED = false;
  // Prerequisite: GA Admin/history pageviews and automatic form/outbound/search/download/video/scroll
  // detections must be reviewed/off for this manual-only event map. Code cannot change those settings.
  const GA_ADMIN_SETTINGS_REVIEWED = false;
  const REVIEWED_ACTIVATION = COLLECTION_REVIEW_CONFIRMED && GA_ADMIN_SETTINGS_REVIEWED;
  // A draft choice is never restored as informed consent after the reviewed source gates change.
  const NOTICE_VERSION = REVIEWED_ACTIVATION ? "reviewed-1" : "draft-1";
  const STORAGE_KEY = "v3.analytics.preference.v1", PREFERENCE_AGE = 180 * 24 * 60 * 60 * 1000;
  const DENIED = Object.freeze({ analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  const TITLES = Object.freeze({ home: "Home", portfolio: "Portfolio", music: "Music", "music-bands": "Music Bands", "band-detail": "Music Band", "sets-archive": "Music Band Sets", "set-detail": "Music Set", "music-shows": "Music Shows", "show-detail": "Music Show", "music-people": "Music People", "person-detail": "Music Person", "music-venues": "Music Venues", "music-venue-detail": "Music Venue", wrestling: "Wrestling", "wrestling-shows": "Wrestling Shows", "wrestling-show-detail": "Wrestling Show", "wrestling-match-detail": "Wrestling Match", "wrestling-match-detail-photo": "Wrestling Photo", "wrestling-people-prototype": "Wrestling People", "wrestling-person-detail": "Wrestling Person", "wrestling-venues": "Wrestling Venues", "wrestling-venue-detail": "Wrestling Venue", "wrestling-venue-detail-prototype": "Wrestling Venue", calendar: "Calendar", about: "About", privacy: "Privacy", contact: "Contact", connect: "Connect" });
  const PATHS = Object.freeze({ home: /^\/$/, portfolio: /^\/portfolio$/, music: /^\/music$/, "music-bands": /^\/music\/bands$/, "band-detail": /^\/music\/bands\/[^/]+$/, "sets-archive": /^\/music\/bands\/[^/]+\/sets$/, "set-detail": /^\/music\/bands\/[^/]+\/[^/]+$/, "music-shows": /^\/music\/shows$/, "show-detail": /^\/music\/shows\/[^/]+$/, "music-people": /^\/music\/people$/, "person-detail": /^\/music\/people\/[^/]+$/, "music-venues": /^\/music\/venues$/, "music-venue-detail": /^\/music\/venues\/[^/]+$/, wrestling: /^\/wrestling$/, "wrestling-shows": /^\/wrestling\/shows$/, "wrestling-show-detail": /^\/wrestling\/shows\/[^/]+$/, "wrestling-match-detail": /^\/wrestling\/shows\/[^/]+\/[^/]+$/, "wrestling-match-detail-photo": /^\/wrestling\/shows\/[^/]+\/[^/]+\/photo\/[^/]+$/, "wrestling-people-prototype": /^\/wrestling\/people$/, "wrestling-person-detail": /^\/wrestling\/people\/[^/]+$/, "wrestling-venues": /^\/wrestling\/venues$/, "wrestling-venue-detail": /^\/wrestling\/venues\/[^/]+$/, "wrestling-venue-detail-prototype": /^\/wrestling\/venues\/[^/]+$/, calendar: /^\/calendar$/, about: /^\/about$/, privacy: /^\/privacy$/, contact: /^\/contact$/, connect: /^\/connect$/ });
  let preference = null, storageAvailable = true, current = null, previousPublic = "", lastIdentity = null;
  let shellRequested = false, shellReady = false, uiReady = false, observer = null, observerTimer = 0, tagState = "idle", configured = false;
  let restoredRoutePending = false;
  let campaigns = Object.freeze({}), entryReferrer = "", wantPreferences = false, wantPreferencesFocus = false, ui = null;
  let lastConsent = null;
  window[`ga-disable-${MEASUREMENT_ID}`] = true;
  window.dataLayer = Array.isArray(window.dataLayer) ? window.dataLayer : [];
  const gtag = function () { window.dataLayer.push(arguments); return arguments; };
  window.gtag = gtag;
  gtag("consent", "default", { ...DENIED });
  gtag("set", "ads_data_redaction", true);
  function consentValues() { return { ...DENIED, analytics_storage: preference?.analyticsStorage === "granted" && !adminNow() ? "granted" : "denied" }; }
  function publishConsent() {
    window[`ga-disable-${MEASUREMENT_ID}`] = !canCollect() || tagState !== "ready";
    if (tagState !== "ready") return;
    const values = consentValues(); if (lastConsent === values.analytics_storage) return;
    lastConsent = values.analytics_storage;
    gtag("consent", "update", values);
    // Before readiness, preference/current retain only the latest private choice. The queue contains
    // denied defaults/redaction only; no stale grant can execute while the Google script loads.
  }
  function validPreference(value, now = Date.now()) {
    return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join(",") === "analyticsStorage,expiresAt,noticeVersion,savedAt,version" &&
      value.version === 1 && value.noticeVersion === NOTICE_VERSION && ["granted", "denied"].includes(value.analyticsStorage) &&
      Number.isSafeInteger(value.savedAt) && value.savedAt >= 0 && value.savedAt <= now && Number.isSafeInteger(value.expiresAt) &&
      value.expiresAt - value.savedAt === PREFERENCE_AGE && value.expiresAt > now;
  }
  function decodePreference(text) { try { if (typeof text !== "string" || text.length > 512) return null; const value = JSON.parse(text); return validPreference(value) ? { ...value } : null; } catch { return null; } }
  function readPreference() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY), value = decodePreference(stored);
      if (value?.analyticsStorage === "granted") window.localStorage.setItem(STORAGE_KEY, stored);
      return value;
    } catch { storageAvailable = false; return null; }
  }
  function checkPreferenceExpiry() { if (preference && !validPreference(preference)) { preference = null; publishConsent(); renderChoice(); } }
  function canonicalView(packet) {
    if (!packet || packet.name === "admin") return packet?.name === "admin" ? { name: "admin", generation: packet.generation } : null;
    let name = packet.name, path = packet.path;
    const suspicious = /password|passwd|secret|token|session|credential|apikey|privatekey|authorization/i;
    let safe = typeof path === "string" && path.length <= 600 && PATHS[name]?.test(path) && !packet.unknown;
    try { safe &&= path.split("/").every(part => !part || /^[a-z0-9][a-z0-9_.-]{0,119}$/i.test(decodeURIComponent(part)) && !suspicious.test(decodeURIComponent(part)) && !/^[a-f0-9]{32,}$/i.test(decodeURIComponent(part)) && !/^[a-z0-9_-]{32,}$/i.test(decodeURIComponent(part))); } catch { safe = false; }
    if (!safe) { name = "not_found"; path = "/not-found"; }
    const url = new URL(path, window.location.origin);
    if (name === "music-bands") url.searchParams.set("view", packet.view === "search" ? "search" : "list");
    return Object.freeze({ name, url: url.href, title: `${TITLES[name] || "Page not found"} | Voodoo Media`, identity: `${name}:${url.pathname}${url.search}`, generation: packet.generation });
  }
  function adminNow() { return current?.name === "admin" || /^\/admin(?:\/|$)/i.test(window.location.pathname); }
  function canCollect() { return REVIEWED_ACTIVATION && shellReady && uiReady && current && !adminNow() && !restoredRoutePending; }
  function campaignConfig() {
    const config = {}, map = { utm_source: "campaign_source", utm_medium: "campaign_medium", utm_campaign: "campaign_name", utm_id: "campaign_id", utm_content: "campaign_content", utm_term: "campaign_term" };
    Object.keys(map).forEach(key => { if (campaigns[key]) config[map[key]] = campaigns[key]; }); return config;
  }
  function sendCurrent() {
    checkPreferenceExpiry();
    window[`ga-disable-${MEASUREMENT_ID}`] = !canCollect() || tagState !== "ready";
    if (!canCollect() || tagState === "failed") return;
    if (tagState === "idle") {
      tagState = "loading";
      const script = document.createElement("script"); script.async = true; script.referrerPolicy = "no-referrer"; script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
      script.onload = () => { tagState = "ready"; lastConsent = null; publishConsent(); sendCurrent(); };
      script.onerror = () => { tagState = "failed"; window[`ga-disable-${MEASUREMENT_ID}`] = true; };
      document.head.append(script); return;
    }
    if (tagState !== "ready") return;
    if (!configured) {
      publishConsent();
      gtag("js", new Date());
      gtag("config", MEASUREMENT_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
        page_location: current.url, page_title: current.title, page_referrer: previousPublic || entryReferrer, ...campaignConfig() });
      configured = true;
    }
    if (lastIdentity === current.identity) return;
    gtag("event", "page_view", { send_to: MEASUREMENT_ID, page_location: current.url, page_title: current.title, page_referrer: previousPublic || entryReferrer });
    lastIdentity = current.identity;
  }
  function commit(packet) {
    const next = canonicalView(packet); if (!next) return;
    restoredRoutePending = false;
    if (current?.identity && current.identity !== next.identity) previousPublic = next.name === "admin" ? "" : current.url;
    if (next.name === "admin") { previousPublic = ""; lastIdentity = null; }
    if (current?.name === "admin") previousPublic = "";
    current = next;
    window[`ga-disable-${MEASUREMENT_ID}`] = !canCollect() || tagState !== "ready";
    publishConsent(); renderChoice(); sendCurrent();
  }
  function stopObserver() { observer?.disconnect(); observer = null; window.clearTimeout(observerTimer); observerTimer = 0; }
  function readyCheck() {
    const root = document.documentElement;
    if (root.hasAttribute("data-v3-home-boot-failed")) { stopObserver(); return; }
    if (!shellRequested || root.hasAttribute("data-v3-booting")) return;
    stopObserver(); if (shellReady) return; shellReady = true; loadPrivacyStyles();
  }
  function activate() {
    shellRequested = true; readyCheck();
    if (shellReady || observer || document.documentElement.hasAttribute("data-v3-home-boot-failed")) return;
    if (typeof MutationObserver !== "function") return;
    observer = new MutationObserver(readyCheck); observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-v3-booting", "data-v3-home-boot-failed"] });
    observerTimer = window.setTimeout(stopObserver, 20000); // Failure only: elapsed time never grants readiness.
  }
  function element(tag, text, parent, hook) { const node = document.createElement(tag); if (text) node.textContent = text; if (hook) node.setAttribute(`data-v3-privacy-${hook}`, ""); parent?.append(node); return node; }
  function button(text, parent, hook, action) { const node = element("button", text, parent, hook); node.type = "button"; node.addEventListener("click", action); return node; }
  function saveChoice(analyticsStorage) {
    const fromPrompt = ui?.prompt.contains(document.activeElement);
    const now = Date.now(); preference = { version: 1, noticeVersion: NOTICE_VERSION, analyticsStorage, savedAt: now, expiresAt: now + PREFERENCE_AGE };
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preference)); storageAvailable = true; } catch {
      storageAvailable = false;
      if (analyticsStorage === "denied") { try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* The visit-only message remains truthful. */ } }
    }
    publishConsent(); renderChoice(); sendCurrent(); if (fromPrompt) ui.revise.focus({ preventScroll: true });
  }
  function privacyPageNow() { return /^\/privacy\/?$/.test(window.location.pathname); }
  function closePreferences(shouldFocus = true) { wantPreferences = false; wantPreferencesFocus = false; if (!ui) return; ui.preferences.hidden = true; renderChoice(); if (shouldFocus !== false) (privacyPageNow() ? document.querySelector("[data-privacy-open-preferences]") : preference ? ui.revise : ui.open)?.focus({ preventScroll: true }); }
  function preferences(shouldFocus = false) { wantPreferences = true; wantPreferencesFocus ||= shouldFocus; if (!uiReady) return; ui.root.hidden = false; ui.preferences.hidden = false; ui.prompt.hidden = true; ui.revise.setAttribute("aria-expanded", "true"); ui.checkbox.checked = preference?.analyticsStorage === "granted"; if (wantPreferencesFocus) ui.checkbox.focus({ preventScroll: true }); wantPreferencesFocus = false; }
  function renderChoice() {
    if (!ui) return;
    const editing = !ui.preferences.hidden;
    ui.root.hidden = privacyPageNow() && !editing;
    ui.prompt.hidden = Boolean(preference) || editing;
    ui.revise.hidden = !preference && !editing;
    ui.revise.setAttribute("aria-expanded", String(editing));
    ui.status.textContent = !REVIEWED_ACTIVATION ? "Google analytics is inactive pending review. Save a draft storage choice." : "Accept allows analytics storage; Reject denies it. Cookieless measurement may continue; ads stay off.";
    ui.notice.textContent = !REVIEWED_ACTIVATION ? "Privacy review and Google settings are pending. This choice applies to the draft notice; a new choice will be needed after reviewed activation." : "Analytics storage is optional. Advertising storage and ad personalization remain off.";
    ui.saved.textContent = preference ? `${preference.analyticsStorage === "granted" ? "Analytics storage allowed" : "Analytics storage denied"}${storageAvailable ? " on this browser." : " for this visit; browser storage is unavailable."}` : "No storage choice saved.";
  }
  function buildPrivacyUI() {
    const root = element("aside", "", document.body); root.className = "v3-privacy"; root.setAttribute("data-v3-privacy", ""); root.setAttribute("aria-label", "Analytics choices");
    const revise = button("Analytics choices", root, "revise", () => preferences(true)); revise.setAttribute("aria-controls", "v3-privacy-preferences");
    const prompt = element("section", "", root); element("h2", "Analytics choices", prompt);
    const status = element("p", "", prompt, "status");
    const actions = element("div", "", prompt); actions.className = "v3-privacy__actions";
    button("Accept", actions, "accept", () => saveChoice("granted")); button("Reject", actions, "reject", () => saveChoice("denied")); const open = button("Preferences", actions, "preferences", () => preferences(true));
    const prefs = element("section", "", root); prefs.id = "v3-privacy-preferences"; prefs.hidden = true; element("h2", "Analytics preference", prefs);
    const notice = element("p", "", prefs, "notice");
    const policy = element("a", "Read our privacy policy", prefs, "policy"); policy.href = "/privacy";
    const label = element("label", "", prefs), checkbox = element("input", "", label, "storage"); checkbox.type = "checkbox"; element("span", "Allow analytics storage", label);
    element("p", "Accept allows analytics storage; Reject denies it. Advertising storage, Google signals and ad personalization stay off. Denial does not delete earlier data. After reviewed activation, cookieless measurements may still be sent.", prefs);
    const saved = element("p", "", prefs, "saved"); saved.setAttribute("role", "status"); saved.setAttribute("aria-live", "polite");
    const prefActions = element("div", "", prefs); prefActions.className = "v3-privacy__actions";
    button("Save", prefActions, "save", () => { saveChoice(checkbox.checked ? "granted" : "denied"); closePreferences(); }); button("Close", prefActions, "close", closePreferences);
    root.addEventListener("keydown", event => { if (event.key === "Escape" && !prefs.hidden) { event.preventDefault(); closePreferences(); } });
    ui = { root, prompt, status, notice, preferences: prefs, checkbox, saved, revise, open }; uiReady = true; renderChoice(); if (wantPreferences) preferences(); sendCurrent();
  }
  function loadPrivacyStyles() {
    const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "/css/analytics.css";
    link.onload = () => { try { buildPrivacyUI(); } catch { window[`ga-disable-${MEASUREMENT_ID}`] = true; } };
    link.onerror = () => { window[`ga-disable-${MEASUREMENT_ID}`] = true; };
    document.head.append(link);
  }
  preference = readPreference(); publishConsent();
  window.addEventListener("storage", event => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    preference = event.key === null ? null : decodePreference(event.newValue); publishConsent(); renderChoice(); sendCurrent();
  });
  window.addEventListener("pageshow", event => {
    if (!event.persisted) return;
    preference = readPreference(); lastIdentity = null;
    const actual = new URL(window.location.href), restored = current?.url ? new URL(current.url) : null;
    const matches = Boolean(restored && restored.pathname === actual.pathname && (current.name !== "music-bands" || restored.searchParams.get("view") === (actual.searchParams.get("view") === "search" ? "search" : "list")));
    restoredRoutePending = !matches; publishConsent(); renderChoice();
    if (matches) sendCurrent();
  });
  boot.install({
    start(state) { campaigns = state.campaign || Object.freeze({}); entryReferrer = state.referrer || ""; if (state.latest) commit(state.latest); if (state.ready) activate(); },
    commit, activate, preferences, closePreferences
  });
})();
