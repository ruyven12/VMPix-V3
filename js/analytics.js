/* Shell-owned analytics foundation. Activation requires a separately reviewed source change. */
(() => {
  "use strict";
  const boot = window.__v3AnalyticsBoot;
  if (!boot || window.__v3AnalyticsAdapterInstalled) return;
  window.__v3AnalyticsAdapterInstalled = true;
  const MEASUREMENT_ID = "G-1446TW7YQJ";
  const COLLECTION_REVIEW_CONFIRMED = true;
  // Google-side history tracking and all other Enhanced Measurement events are owner-confirmed off.
  // Live activation is approved; Basic Consent Mode still requires valid visitor acceptance.
  const GA_ADMIN_SETTINGS_REVIEWED = true;
  const REVIEWED_ACTIVATION = COLLECTION_REVIEW_CONFIRMED && GA_ADMIN_SETTINGS_REVIEWED;
  // A draft choice is never restored as informed consent after the reviewed source gates change.
  const NOTICE_VERSION = REVIEWED_ACTIVATION ? "reviewed-basic-1" : "draft-basic-1";
  const STORAGE_KEY = "v3.analytics.preference.v1", PREFERENCE_AGE = 180 * 24 * 60 * 60 * 1000;
  const DENIED = Object.freeze({ analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  const TITLES = Object.freeze({ home: "Home", portfolio: "Portfolio", music: "Music", "music-bands": "Music Bands", "band-detail": "Music Band", "sets-archive": "Music Band Sets", "set-detail": "Music Set", "music-shows": "Music Shows", "show-detail": "Music Show", "music-people": "Music People", "person-detail": "Music Person", "music-venues": "Music Venues", "music-venue-detail": "Music Venue", wrestling: "Wrestling", "wrestling-shows": "Wrestling Shows", "wrestling-show-detail": "Wrestling Show", "wrestling-match-detail": "Wrestling Match", "wrestling-match-detail-photo": "Wrestling Photo", "wrestling-people-prototype": "Wrestling People", "wrestling-person-detail": "Wrestling Person", "wrestling-venues": "Wrestling Venues", "wrestling-venue-detail": "Wrestling Venue", "wrestling-venue-detail-prototype": "Wrestling Venue", calendar: "Calendar", about: "About", privacy: "Privacy", contact: "Contact", connect: "Connect" });
  const PATHS = Object.freeze({ home: /^\/$/, portfolio: /^\/portfolio$/, music: /^\/music$/, "music-bands": /^\/music\/bands$/, "band-detail": /^\/music\/bands\/[^/]+$/, "sets-archive": /^\/music\/bands\/[^/]+\/sets$/, "set-detail": /^\/music\/bands\/[^/]+\/[^/]+$/, "music-shows": /^\/music\/shows$/, "show-detail": /^\/music\/shows\/[^/]+$/, "music-people": /^\/music\/people$/, "person-detail": /^\/music\/people\/[^/]+$/, "music-venues": /^\/music\/venues$/, "music-venue-detail": /^\/music\/venues\/[^/]+$/, wrestling: /^\/wrestling$/, "wrestling-shows": /^\/wrestling\/shows$/, "wrestling-show-detail": /^\/wrestling\/shows\/[^/]+$/, "wrestling-match-detail": /^\/wrestling\/shows\/[^/]+\/[^/]+$/, "wrestling-match-detail-photo": /^\/wrestling\/shows\/[^/]+\/[^/]+\/photo\/[^/]+$/, "wrestling-people-prototype": /^\/wrestling\/people$/, "wrestling-person-detail": /^\/wrestling\/people\/[^/]+$/, "wrestling-venues": /^\/wrestling\/venues$/, "wrestling-venue-detail": /^\/wrestling\/venues\/[^/]+$/, "wrestling-venue-detail-prototype": /^\/wrestling\/venues\/[^/]+$/, calendar: /^\/calendar$/, about: /^\/about$/, privacy: /^\/privacy$/, contact: /^\/contact$/, connect: /^\/connect$/ });
  let preference = null, storageAvailable = true, current = null, previousPublic = "", lastIdentity = null;
  let shellRequested = false, shellReady = false, uiReady = false, observer = null, observerTimer = 0, tagState = "idle", configured = false;
  let restoredRoutePending = false, adminRestricted = /^\/admin(?:\/|$)/i.test(window.location.pathname);
  let expiryTimer = 0, unpersistedDenial = false, storageWritable = false;
  let campaigns = Object.freeze({}), entryReferrer = "", wantPreferences = false, wantPreferencesFocus = false, ui = null;
  let lastConsent = null, currentPageReferrer = "";
  window[`ga-disable-${MEASUREMENT_ID}`] = true;
  window.dataLayer = Array.isArray(window.dataLayer) ? window.dataLayer : [];
  const gtag = function () {
    // Only a fully denied control update may reach an initialized SDK while collection is blocked.
    const deniedUpdate = arguments.length === 3 && arguments[0] === "consent" && arguments[1] === "update" &&
      tagState === "ready" && configured && lastConsent === "granted" && window[`ga-disable-${MEASUREMENT_ID}`] === true &&
      arguments[2] && Object.keys(arguments[2]).length === 4 && Object.keys(DENIED).every(key => arguments[2][key] === "denied");
    if (["event", "config", "js", "consent"].includes(arguments[0]) && arguments[1] !== "default" && (!canCollect() || tagState !== "ready") && !deniedUpdate) {
      window[`ga-disable-${MEASUREMENT_ID}`] = true; return false;
    }
    window.dataLayer.push(arguments); return arguments;
  };
  // Google consumes dataLayer; public module events must use the reviewed Shell interface.
  // Direct SDK commands are not an approved bypass around consent, Admin or the event catalog.
  window.gtag = () => false;
  gtag("consent", "default", { ...DENIED });
  gtag("set", "ads_data_redaction", true);
  function consentValues() {
    checkPreferenceExpiry();
    return { ...DENIED, analytics_storage: preference?.analyticsStorage === "granted" && !adminNow() ? "granted" : "denied" };
  }
  function publishConsent() {
    // Do not let a queued storage event or unreadable/no-op storage revive cached permission.
    window[`ga-disable-${MEASUREMENT_ID}`] = true;
    preference = readPreference(); schedulePreferenceExpiry(); renderChoice();
    const values = consentValues();
    if (!canCollect()) {
      window[`ga-disable-${MEASUREMENT_ID}`] = true;
      // Revoke SDK permission once after an actual loss of consent; route-only locks keep their own gate.
      const permissionDenied = !storageAvailable || !validPreference(preference) || preference.analyticsStorage !== "granted";
      if (permissionDenied && lastConsent === "granted" && gtag("consent", "update", { ...DENIED }) !== false) lastConsent = "denied";
      lastIdentity = null; previousPublic = "";
      return;
    }
    window[`ga-disable-${MEASUREMENT_ID}`] = tagState !== "ready";
    if (tagState !== "ready" || lastConsent === values.analytics_storage) return;
    if (gtag("consent", "update", values) !== false) lastConsent = values.analytics_storage;
  }
  function validPreference(value, now = Date.now()) {
    return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join(",") === "analyticsStorage,expiresAt,noticeVersion,savedAt,version" &&
      value.version === 1 && value.noticeVersion === NOTICE_VERSION && ["granted", "denied"].includes(value.analyticsStorage) &&
      Number.isSafeInteger(value.savedAt) && value.savedAt >= 0 && value.savedAt <= now && Number.isSafeInteger(value.expiresAt) &&
      value.expiresAt - value.savedAt === PREFERENCE_AGE && value.expiresAt > now;
  }
  function decodePreference(text) { try { if (typeof text !== "string" || text.length > 512) return null; const value = JSON.parse(text); return validPreference(value) ? { ...value } : null; } catch { return null; } }
  function readPreference() {
    const probeKey = STORAGE_KEY + ".check";
    try {
      let stored = window.localStorage.getItem(STORAGE_KEY), value = decodePreference(stored);
      if (value?.analyticsStorage === "granted" && !unpersistedDenial && !storageWritable) {
        // A fixed, immediately removed capability marker is not a tracking identifier.
        // Never rewrite the consent record: that could overwrite another tab's newer rejection.
        window.localStorage.setItem(probeKey, "1");
        if (window.localStorage.getItem(probeKey) !== "1") throw new Error("Preference storage is read-only");
        window.localStorage.removeItem(probeKey);
        if (window.localStorage.getItem(probeKey) !== null) throw new Error("Preference cleanup was not verified");
        storageWritable = true;
        stored = window.localStorage.getItem(STORAGE_KEY); value = decodePreference(stored);
      }
      if (stored !== null && !value && window.localStorage.getItem(STORAGE_KEY) === stored) window.localStorage.removeItem(STORAGE_KEY);
      storageAvailable = !unpersistedDenial;
      return unpersistedDenial ? (validPreference(preference) && preference.analyticsStorage === "denied" ? preference : null) : value;
    } catch {
      storageAvailable = false; storageWritable = false;
      try { window.localStorage.removeItem(probeKey); } catch { /* Best-effort removal of a fixed, non-personal marker. */ }
      return null;
    }
  }
  function checkPreferenceExpiry() {
    if (!preference || validPreference(preference)) return false;
    window[`ga-disable-${MEASUREMENT_ID}`] = true;
    preference = null;
    window.clearTimeout(expiryTimer); expiryTimer = 0;
    // Cleanup must never revive a stored grant or publish one while the current choice expires.
    readPreference();
    renderChoice();
    return true;
  }
  function schedulePreferenceExpiry() {
    window.clearTimeout(expiryTimer); expiryTimer = 0;
    if (!preference) return;
    // 180 days exceeds the browser timer range. Each bounded wakeup revalidates, never grants.
    const delay = Math.min(2147483647, Math.max(0, preference.expiresAt - Date.now()));
    expiryTimer = window.setTimeout(() => { expiryTimer = 0; checkPreferenceExpiry(); schedulePreferenceExpiry(); publishConsent(); renderChoice(); }, delay);
  }
  function reconcilePreference() {
    window[`ga-disable-${MEASUREMENT_ID}`] = true;
    preference = readPreference(); schedulePreferenceExpiry(); publishConsent(); renderChoice(); sendCurrent();
  }
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
  function adminNow() { return adminRestricted || current?.name === "admin" || /^\/admin(?:\/|$)/i.test(window.location.pathname); }
  function protectAdmin() {
    adminRestricted = true;
    window[`ga-disable-${MEASUREMENT_ID}`] = true;
    publishConsent();
  }
  function canCollect() {
    return REVIEWED_ACTIVATION && shellReady && uiReady && current && !adminNow() && !restoredRoutePending &&
      storageAvailable && validPreference(preference) && preference.analyticsStorage === "granted";
  }
  // Public content IDs need an adapter-owned resolver reading audited backend identifiers.
  // Caller strings, DOM/route values, filenames, array positions, and "verified" flags are not proof.
  // These ID slots are recognized but intentionally omitted until that resolver is connected:
  // explicit band/album/record IDs or original image keys only; never normalized fallback IDs.
  const CUSTOM_ID_FIELDS = new Set(["gallery_id", "photo_id", "source_content_id", "target_content_id"]);
  const CUSTOM_TYPES = Object.freeze({ music: ["band", "show", "person", "venue", "set", "gallery", "photo"], wrestling: ["show", "person", "venue", "match", "gallery", "photo"] });
  const CUSTOM_DATASETS = Object.freeze({ music: ["bands", "shows", "people", "venues"], wrestling: ["shows", "people", "venues"] });
  const CUSTOM_DATASET_TYPES = Object.freeze({ bands: "band", shows: "show", people: "person", venues: "venue" });
  const CUSTOM_FILTER_KEYS = ["letter", "region", "status", "state", "venue", "sort", "category", "instrument", "year", "promotion", "team", "mode", "banner", "field"];
  const CUSTOM_PANELS = ["relationships", "show_photos", "venue_artists", "show_history", "gallery_range"];
  // Fixed catalog only. Filter values stay unsupported until separately allowlisted; counts are safe.
  // IDs are optional and omitted, rather than inferred or accepted on the caller's assertion.
  const CUSTOM_EVENTS = Object.freeze({
    gallery_open: { required: ["entry_method"], fields: { gallery_id: null, entry_method: ["route", "direct", "history", "tile", "button", "relationship"] } },
    photo_view: { required: ["navigation_method"], fields: { gallery_id: null, photo_id: null, photo_position: [1, 1000000], navigation_method: ["open", "direct", "history", "next", "previous", "swipe", "keyboard", "thumbnail"] } },
    photo_download_click: { required: [], fields: { gallery_id: null, photo_id: null } },
    archive_search: { required: ["dataset", "outcome"], fields: { dataset: "dataset", result_count: [0, 1000000], result_count_scope: ["total", "page", "loaded"], outcome: ["results", "empty", "error", "unavailable"] } },
    archive_filter: { required: ["dataset", "filter_key", "selection_count"], fields: { dataset: "dataset", filter_key: CUSTOM_FILTER_KEYS, selection_count: [0, 100] } },
    relationship_follow: { required: ["source_content_type", "target_content_type"], fields: { source_content_type: "type", target_content_type: "type", source_content_id: null, target_content_id: null } },
    content_expand: { required: ["panel_type"], fields: { panel_type: CUSTOM_PANELS } }
  });
  function validateCustomEvent(name, parameters) {
    if (typeof name !== "string" || !Object.prototype.hasOwnProperty.call(CUSTOM_EVENTS, name) || !parameters || typeof parameters !== "object") return null;
    const prototype = Object.getPrototypeOf(parameters);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const keys = Reflect.ownKeys(parameters);
    if (keys.length > 12 || keys.some(key => typeof key !== "string")) return null;
    const schema = CUSTOM_EVENTS[name], descriptors = Object.getOwnPropertyDescriptors(parameters), values = Object.create(null);
    for (const key of keys) {
      const descriptor = descriptors[key];
      if (!descriptor || !descriptor.enumerable || !("value" in descriptor) || (key !== "archive" && key !== "content_type" && !Object.prototype.hasOwnProperty.call(schema.fields, key))) return null;
      // Do not read or serialize an untrusted ID value; no trusted ID producer exists in this pass.
      if (!CUSTOM_ID_FIELDS.has(key)) values[key] = descriptor.value;
    }
    if (!["music", "wrestling"].includes(values.archive)) return null;
    const types = CUSTOM_TYPES[values.archive];
    if (typeof values.content_type !== "string" || !types.includes(values.content_type)) return null;
    for (const key of schema.required) if (values[key] === undefined) return null;
    const clean = { archive: values.archive, content_type: values.content_type };
    for (const [key, rule] of Object.entries(schema.fields)) {
      if (CUSTOM_ID_FIELDS.has(key) || values[key] === undefined) continue;
      const value = values[key];
      if (rule === "dataset") { if (!CUSTOM_DATASETS[values.archive].includes(value) || CUSTOM_DATASET_TYPES[value] !== values.content_type) return null; }
      else if (rule === "type") { if (!types.includes(value)) return null; }
      else if (typeof rule[0] === "number") { if (!Number.isSafeInteger(value) || value < rule[0] || value > rule[1]) return null; }
      else if (!rule.includes(value)) return null;
      clean[key] = value;
    }
    if (name === "archive_search") {
      const counted = clean.outcome === "results" || clean.outcome === "empty";
      if (counted ? clean.result_count === undefined || !clean.result_count_scope || (clean.outcome === "empty" ? clean.result_count !== 0 : clean.result_count === 0) : clean.result_count !== undefined || clean.result_count_scope !== undefined) return null;
    }
    if (name === "relationship_follow" && clean.content_type !== clean.target_content_type) return null;
    return clean;
  }
  function customEventContextMatches(archive) {
    if (!current?.url || current.name === "not_found") return false;
    const committed = new URL(current.url), actual = new URL(window.location.href);
    const normalize = value => value.replace(/\/+$/, "") || "/";
    const root = "/" + archive, path = normalize(committed.pathname);
    return committed.origin === window.location.origin && normalize(actual.pathname) === path && (path === root || path.startsWith(root + "/"));
  }
  function track(name, parameters) {
    try {
      const clean = validateCustomEvent(name, parameters); if (!clean) return false;
      // No tag initialization, timers, queues, or retries here. Missing permission/readiness drops it.
      publishConsent();
      if (!canCollect() || tagState !== "ready" || !configured || lastIdentity !== current.identity || !customEventContextMatches(clean.archive)) return false;
      return gtag("event", name, { ...clean, send_to: MEASUREMENT_ID, page_location: current.url, page_title: current.title, page_referrer: currentPageReferrer }) !== false;
    } catch { return false; } // Bad callers or blocked Analytics cannot interrupt an interaction.
  }
  function campaignConfig() {
    const source = campaigns.utm_source;
    return ["nfc", "instagram", "facebook", "youtube", "tiktok", "x"].includes(source) ? { campaign_source: source } : {};
  }
  function sendCurrent() {
    publishConsent();
    window[`ga-disable-${MEASUREMENT_ID}`] = !canCollect() || tagState !== "ready";
    if (!canCollect() || tagState === "failed") return;
    if (tagState === "idle") {
      // Revalidate actual stored permission before the first external Analytics request.
      window[`ga-disable-${MEASUREMENT_ID}`] = true;
      preference = readPreference(); schedulePreferenceExpiry(); renderChoice();
      if (!canCollect()) { publishConsent(); return; }
      tagState = "loading";
      const script = document.createElement("script"); script.async = true; script.referrerPolicy = "no-referrer"; script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
      script.onload = () => {
        // Execution may precede onload: keep the tag disabled until the latest grant is checked.
        window[`ga-disable-${MEASUREMENT_ID}`] = true;
        tagState = "ready"; lastConsent = null; reconcilePreference();
      };
      script.onerror = () => { tagState = "failed"; window[`ga-disable-${MEASUREMENT_ID}`] = true; };
      document.head.append(script); return;
    }
    if (tagState !== "ready") return;
    if (!configured) {
      publishConsent();
      gtag("js", new Date());
      const result = gtag("config", MEASUREMENT_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
        page_location: current.url, page_title: current.title, page_referrer: previousPublic || entryReferrer, ...campaignConfig() });
      if (result === false) return;
      configured = true;
    }
    if (lastIdentity === current.identity) return;
    if (gtag("event", "page_view", { send_to: MEASUREMENT_ID, page_location: current.url, page_title: current.title, page_referrer: previousPublic || entryReferrer }) === false) return;
    currentPageReferrer = previousPublic || entryReferrer;
    lastIdentity = current.identity;
    previousPublic = current.url; entryReferrer = "";
  }
  function commit(packet) {
    const next = canonicalView(packet); if (!next) return;
    restoredRoutePending = false;
    if (next.name === "admin") lastIdentity = null;
    current = next;
    adminRestricted = next.name === "admin" || /^\/admin(?:\/|$)/i.test(window.location.pathname);
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
    if (analyticsStorage !== "granted") window[`ga-disable-${MEASUREMENT_ID}`] = true;
    const fromPrompt = ui?.prompt.contains(document.activeElement);
    const now = Date.now(); preference = { version: 1, noticeVersion: NOTICE_VERSION, analyticsStorage, savedAt: now, expiresAt: now + PREFERENCE_AGE };
    unpersistedDenial = analyticsStorage === "denied";
    const storedChoice = JSON.stringify(preference);
    try {
      window.localStorage.setItem(STORAGE_KEY, storedChoice);
      if (window.localStorage.getItem(STORAGE_KEY) !== storedChoice) throw new Error("Preference storage was not verified");
      storageAvailable = true; storageWritable = true; unpersistedDenial = false;
    } catch {
      storageAvailable = false; storageWritable = false; unpersistedDenial = analyticsStorage === "denied";
      if (analyticsStorage === "denied") { try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* The visit-only message remains truthful. */ } }
    }
    schedulePreferenceExpiry(); publishConsent(); renderChoice(); sendCurrent(); if (fromPrompt) ui.revise.focus({ preventScroll: true });
  }
  function privacyPageNow() { return /^\/privacy\/?$/.test(window.location.pathname); }
  function closePreferences(shouldFocus = true) { wantPreferences = false; wantPreferencesFocus = false; if (!ui) return; ui.preferences.hidden = true; renderChoice(); if (shouldFocus !== false) (privacyPageNow() ? document.querySelector("[data-privacy-open-preferences]") : preference ? ui.revise : ui.open)?.focus({ preventScroll: true }); }
  function preferences(shouldFocus = false) { publishConsent(); wantPreferences = true; wantPreferencesFocus ||= shouldFocus; if (!uiReady) return; ui.root.hidden = false; ui.preferences.hidden = false; ui.prompt.hidden = true; ui.revise.setAttribute("aria-expanded", "true"); ui.checkbox.checked = preference?.analyticsStorage === "granted"; if (wantPreferencesFocus) ui.checkbox.focus({ preventScroll: true }); wantPreferencesFocus = false; }
  function renderChoice() {
    if (!ui) return;
    const editing = !ui.preferences.hidden;
    ui.checkbox.checked = preference?.analyticsStorage === "granted";
    ui.root.hidden = privacyPageNow() && !editing;
    ui.prompt.hidden = Boolean(preference) || editing;
    ui.revise.hidden = !preference && !editing;
    ui.revise.setAttribute("aria-expanded", String(editing));
    ui.status.textContent = !REVIEWED_ACTIVATION ? "Analytics is off pending review. You can save a draft choice." : "Optional Analytics runs only if you accept. Reject keeps it off. Advertising stays off.";
    ui.notice.textContent = !REVIEWED_ACTIVATION ? "This choice applies to the draft notice. A new choice will be needed before live Analytics starts." : "Accept lets Google Analytics measure visits. Reject and withdrawal stop optional Analytics.";
    ui.withdraw.hidden = preference?.analyticsStorage !== "granted";
    ui.saved.textContent = !storageAvailable ? "Browser storage is unavailable. Analytics stays off when permission cannot be verified." :
      preference ? `${REVIEWED_ACTIVATION ? "" : "Draft choice: "}${preference.analyticsStorage === "granted" ? "Optional Analytics allowed" : "Optional Analytics declined"} on this browser.` : "No Analytics choice saved.";
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
    const label = element("label", "", prefs), checkbox = element("input", "", label, "storage"); checkbox.type = "checkbox"; element("span", "Allow optional Analytics", label);
    element("p", "Optional Analytics starts only after you accept. You can turn it off here at any time. This stops future collection; it does not automatically delete earlier data. Advertising, Google Signals and ad personalization stay off.", prefs);
    const saved = element("p", "", prefs, "saved"); saved.setAttribute("role", "status"); saved.setAttribute("aria-live", "polite");
    const prefActions = element("div", "", prefs); prefActions.className = "v3-privacy__actions";
    button("Save", prefActions, "save", () => { saveChoice(checkbox.checked ? "granted" : "denied"); closePreferences(); });
    const withdraw = button("Withdraw consent", prefActions, "withdraw", () => { saveChoice("denied"); closePreferences(); });
    button("Close", prefActions, "close", closePreferences);
    root.addEventListener("keydown", event => { if (event.key === "Escape" && !prefs.hidden) { event.preventDefault(); closePreferences(); } });
    ui = { root, prompt, status, notice, preferences: prefs, checkbox, saved, revise, open, withdraw }; uiReady = true; renderChoice(); if (wantPreferences) preferences(); sendCurrent();
  }
  function loadPrivacyStyles() {
    const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "/css/analytics.css";
    link.onload = () => { try { buildPrivacyUI(); } catch { window[`ga-disable-${MEASUREMENT_ID}`] = true; } };
    link.onerror = () => { window[`ga-disable-${MEASUREMENT_ID}`] = true; };
    document.head.append(link);
  }
  preference = readPreference(); schedulePreferenceExpiry(); publishConsent();
  window.addEventListener("storage", event => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    try { if (event.storageArea && event.storageArea !== window.localStorage) return; } catch { /* Reconcile failure is denied below. */ }
    // Event payloads can be queued out of order. Read the current authoritative record instead.
    reconcilePreference();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") reconcilePreference();
  });
  window.addEventListener("focus", reconcilePreference);
  window.addEventListener("pageshow", event => {
    if (!event.persisted) return;
    window[`ga-disable-${MEASUREMENT_ID}`] = true;
    preference = readPreference(); schedulePreferenceExpiry(); lastIdentity = null;
    let matches = false;
    try {
      // Use the Shell's canonical parser without adopting a possibly unpainted restored route.
      const route = getRouteFromUrlWithPrototypePrecedence();
      const url = new URL(route.canonicalUrl, window.location.origin);
      const restored = canonicalView({ name: route.name, path: url.pathname, view: route.view, unknown: route.isUnknown });
      matches = Boolean(current?.identity && restored?.identity === current.identity);
    } catch { /* Missing/mismatched route ownership stays excluded until a successful commit. */ }
    restoredRoutePending = !matches; publishConsent(); renderChoice();
    if (matches) sendCurrent();
  });
  // Preserve the bootstrap preference queue; pre-install references safely remain no-op stubs.
  window.V3Analytics = Object.freeze({ track, preferences: window.V3Analytics.preferences });
  boot.install({
    start(state) { campaigns = state.campaign || Object.freeze({}); entryReferrer = state.referrer || ""; if (state.latest) commit(state.latest); if (state.adminRestricted) protectAdmin(); if (state.ready) activate(); },
    commit, protectAdmin, activate, preferences, closePreferences
  });
})();
