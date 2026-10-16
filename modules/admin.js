/* Admin owns its local login state; the bearer exists only in this document's memory. */
(function () {
  "use strict";
  // Display only: transport timestamps and authentication deadlines keep their original values.
  let adminEasternFormatter = null;
  function parseAdminTimestamp(value) {
    if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
    if (typeof value !== "string") return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
    if (!match) return null;
    const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
    const days = [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month < 1 || month > 12 || day < 1 || day > days[month - 1] || Number(match[4]) > 23 || Number(match[5]) > 59 || Number(match[6]) > 59 ||
        match[7] !== "Z" && (Number(match[7].slice(1, 3)) > 23 || Number(match[7].slice(4, 6)) > 59)) return null;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  function formatAdminDateTime(value, fallback = "—") {
    const date = parseAdminTimestamp(value);
    if (!date) return fallback;
    try {
      adminEasternFormatter ||= new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: "short" });
      const parts = Object.fromEntries(adminEasternFormatter.formatToParts(date).map(part => [part.type, part.value]));
      return `${parts.month} ${parts.day}, ${parts.year} · ${parts.hour}:${parts.minute} ${parts.dayPeriod} ${parts.timeZoneName}`;
    } catch { return fallback; }
  }

  const API = "https://vmpix-data.onrender.com/api/v3/admin/auth";
  const host = document.querySelector("[data-admin-shell]");
  const password = host?.querySelector("[data-admin-password]");
  const toggle = host?.querySelector("[data-admin-password-toggle]");
  const connect = host?.querySelector("[data-admin-connect]");
  const feedback = host?.querySelector("[data-admin-feedback]");
  const stage = host?.querySelector("[data-admin-stage]");
  const loginPanel = host?.querySelector(".admin-login");
  const loginTitle = host?.querySelector("#admin-access-title");
  const deck = host?.querySelector("[data-admin-console]");
  const deckTitle = host?.querySelector("#admin-console-title");
  const deckFeedback = host?.querySelector("[data-admin-console-feedback]");
  const deckLogout = host?.querySelector("[data-admin-console-logout]");
  const deckReturn = host?.querySelector("[data-admin-console-return]");
  const returnLink = host?.querySelector("[data-admin-return]");
  const apiOpen = host?.querySelector("[data-admin-open-api]");
  const apiPanel = host?.querySelector("[data-admin-api-station]");
  const apiTitle = host?.querySelector("#admin-api-title");
  const apiLogout = host?.querySelector("[data-admin-api-logout]");
  const apiFeedback = host?.querySelector("[data-admin-api-feedback]");
  const apiCheck = host?.querySelector("[data-admin-api-check]");
  const apiStatus = host?.querySelector("[data-admin-api-status]");
  const apiDetail = host?.querySelector("[data-admin-api-detail]");
  const apiConnection = host?.querySelector("[data-admin-api-connection]");
  const apiResponse = host?.querySelector("[data-admin-api-response]");
  const apiVerified = host?.querySelector("[data-admin-api-verified]");
  const databaseOpen = host?.querySelector("[data-admin-open-database]");
  const databasePanel = host?.querySelector("[data-admin-database-station]");
  const databaseTitle = host?.querySelector("#admin-database-title");
  const databaseLogout = host?.querySelector("[data-admin-database-logout]");
  const databaseFeedback = host?.querySelector("[data-admin-database-feedback]");
  if (!host || !password || !toggle || !connect || !feedback || !stage || !loginPanel ||
      !loginTitle || !deck || !deckTitle || !deckFeedback || !deckLogout || !deckReturn || !returnLink ||
      !apiOpen || !apiPanel || !apiTitle || !apiLogout || !apiFeedback || !apiCheck ||
      !apiStatus || !apiDetail || !apiConnection || !apiResponse || !apiVerified) return;
  let active = false;
  let bearer = null;
  let expiresAt = 0;
  let state = "idle";
  let generation = 0;
  let controller = null;
  let requestedStation = "deck";

  let visualGeneration = 0;
  let visualCleanup = null;
  let visualPhase = "login";
  const returnHome = returnLink.parentElement;
  const lastStationBody = deck.querySelector(".admin-console__station:last-of-type .admin-console__station-body");
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

  function surface(element, visible) {
    if (!visible && element.contains(document.activeElement)) document.activeElement.blur();
    element.hidden = !visible;
    element.toggleAttribute("inert", !visible);
    element.setAttribute("aria-hidden", String(!visible));
  }
  function cancelVisuals() {
    visualGeneration += 1;
    visualCleanup?.();
    visualCleanup = null;
    loginPanel.classList.remove("is-admin-collapsing");
    deck.classList.remove("is-admin-assembling", "is-admin-arriving");
  }
  function phase(value) { visualPhase = value; stage.dataset.adminPhase = value; }
  function focusTitle(title) { if (available()) title.focus({ preventScroll: true }); }
  function resetPresentation(shouldFocus = false) {
    const changed = visualPhase !== "login";
    resetSignal();
    surface(apiPanel, false);
    if (databasePanel) surface(databasePanel, false);
    stage.dataset.adminView = "deck";
    cancelVisuals();
    surface(deck, false);
    if (returnLink.parentElement !== returnHome) returnHome.appendChild(returnLink);
    surface(loginPanel, true);
    host.setAttribute("aria-labelledby", "admin-access-title");
    phase("login");
    if (changed && shouldFocus) focusTitle(loginTitle);
  }
  function visualTrack(element, animationName, onComplete) {
    const routeGeneration = generation;
    const ownVisual = visualGeneration;
    let completed = false;
    const complete = (event) => {
      if (event && (event.target !== element || event.animationName !== animationName)) return;
      if (completed) return;
      completed = true;
      cleanup();
      if (visualCleanup === cleanup) visualCleanup = null;
      if (ownVisual !== visualGeneration || routeGeneration !== generation || !available() || !bearer) return;
      onComplete();
    };
    const cleanup = () => {
      element.removeEventListener("animationend", complete);
      element.removeEventListener("animationcancel", complete);
    };
    visualCleanup = cleanup;
    element.addEventListener("animationend", complete);
    element.addEventListener("animationcancel", complete);
    // Missing/disabled presentation CSS must never leave a confirmed session behind an inert panel.
    const animations = typeof stage.getAnimations === "function" ? stage.getAnimations({ subtree: true }) : [];
    const animation = animations.find((item) => item.animationName === animationName && item.effect?.target === element);
    if (!animation) complete();
    else if (animation.finished) animation.finished.then(() => complete(), () => complete());
  }
  function revealDeck(shouldFocus = true) {
    surface(loginPanel, false);
    deckReturn.appendChild(returnLink);
    surface(deck, true);
    host.setAttribute("aria-labelledby", "admin-console-title");
    if (shouldFocus && !(["api", "database"].includes(requestedStation) && visualPhase === "ready")) focusTitle(deckTitle);
  }
  function showDeck(shouldFocus = true) {
    cancelVisuals();
    phase("ready");
    revealDeck(shouldFocus);
    updateStationPresentation(shouldFocus);
  }
  function renderPresentation(animateArrival) {
    const deckState = state === "authenticated" || state === "logout-uncertain" ||
      state === "logging-out" && visualPhase !== "login";
    if (!deckState) { resetPresentation(available()); return; }
    if (visualPhase === "ready") { updateStationPresentation(); return; }
    if (visualPhase === "collapsing" || visualPhase === "assembling") {
      if (state !== "authenticated") showDeck(false);
      return;
    }
    if (!animateArrival || motionPreference.matches) {
      showDeck(); return;
    }
    cancelVisuals();
    if (loginPanel.contains(document.activeElement)) document.activeElement.blur();
    loginPanel.setAttribute("inert", "");
    loginPanel.setAttribute("aria-hidden", "true");
    // Both visual tracks start together; CSS owns the visible 200ms handoff.
    deck.hidden = false;
    deck.setAttribute("inert", "");
    deck.setAttribute("aria-hidden", "true");
    phase("collapsing");
    deck.classList.add("is-admin-arriving", "is-admin-assembling");
    loginPanel.classList.add("is-admin-collapsing");
    visualTrack(loginPanel, "adminLoginCollapse", () => {
      phase("assembling");
      revealDeck();
      visualTrack(lastStationBody, "adminConsoleBuild", () => {
        cancelVisuals();
        phase("ready");
        updateStationPresentation();
      });
    });
  }
  const settleReducedMotion = (event) => {
    if (event.matches && available() && bearer && ["collapsing", "assembling"].includes(visualPhase) &&
        ["authenticated", "logging-out", "logout-uncertain"].includes(state)) showDeck();
  };
  if (typeof motionPreference.addEventListener === "function") motionPreference.addEventListener("change", settleReducedMotion);
  else motionPreference.addListener?.(settleReducedMotion);

  function clearPassword() {
    password.value = "";
    password.type = "password";
    password.removeAttribute("aria-invalid");
    toggle.setAttribute("aria-pressed", "false");
    toggle.setAttribute("aria-label", "Show password");
    toggle.textContent = "SHOW";
  }
  function available() {
    return active && !host.hidden && !host.hasAttribute("inert") && host.getAttribute("aria-hidden") === "false";
  }
  function busy() { return ["connecting", "checking", "logging-out"].includes(state); }
  function present(next, message, animateArrival = false) {
    state = next;
    password.disabled = busy() || bearer !== null;
    toggle.disabled = password.disabled;
    connect.disabled = busy();
    connect.setAttribute("aria-busy", String(busy()));
    connect.textContent = state === "connecting" ? "CONNECTING…" : state === "checking" ? "CHECKING…" :
      state === "logging-out" ? "LOGGING OUT…" : state === "authenticated" || state === "logout-uncertain" ?
        "LOGOUT" : bearer ? "RETRY" : "CONNECT";
    feedback.textContent = message;
    deckFeedback.textContent = message;
    deckLogout.disabled = busy();
    deckLogout.setAttribute("aria-busy", String(busy()));
    deckLogout.textContent = state === "logging-out" ? "LOGGING OUT…" : "LOGOUT";
    apiLogout.disabled = busy();
    apiLogout.textContent = deckLogout.textContent;
    apiFeedback.textContent = message;
    if (databaseLogout) { databaseLogout.disabled = busy(); databaseLogout.textContent = deckLogout.textContent; }
    if (databaseFeedback) databaseFeedback.textContent = message;
    renderPresentation(animateArrival);
    updateStationControl();
  }
  function clearSession() { bearer = null; expiresAt = 0; resetDiagnosticReports(); resetMusicStatus(); resetQueryExplorer(); resetDatabaseOverview(); }
  function cancelRequest() {
    generation += 1;
    controller?.abort();
    controller = null;
  }
  function expiry(value) {
    if (typeof value !== "string") return 0;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) && date.toISOString() === value ? date.getTime() : 0;
  }
  function validPassword(value) {
    if (typeof value !== "string" || !value.length || value.length > 1024) return false;
    try { encodeURIComponent(value); return new TextEncoder().encode(value).length <= 1024; }
    catch { return false; }
  }
  async function request(pathname, method, body, token) {
    const ownController = new AbortController();
    controller = ownController;
    const timer = setTimeout(() => ownController.abort(), 15000);
    const headers = { Accept: "application/json", "X-V3-Admin-Request": "1" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      const response = await fetch(`${API}/${pathname}`, {
        method, headers, body, signal: ownController.signal, mode: "cors", credentials: "omit",
        cache: "no-store", redirect: "error", referrerPolicy: "no-referrer"
      });
      const data = await response.json();
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Unavailable");
      return { status: response.status, data };
    } finally {
      clearTimeout(timer);
      if (controller === ownController) controller = null;
    }
  }
  function current(at) { return at === generation && available(); }
  function unavailable() { return "Authentication is unavailable. Please try again."; }

  async function login() {
    if (!available() || busy()) return;
    if (!validPassword(password.value)) {
      password.setAttribute("aria-invalid", "true");
      feedback.textContent = password.value.length === 0 ? "Enter a password to continue." : "Enter a valid password of at most 1024 UTF-8 bytes.";
      password.focus();
      return;
    }
    const body = JSON.stringify({ password: password.value });
    clearPassword();
    const at = ++generation;
    present("connecting", "Connecting securely…");
    try {
      const result = await request("login", "POST", body);
      if (!current(at)) return;
      const deadline = expiry(result.data.expiresAt);
      if (result.status === 200 && result.data.ok === true && result.data.authenticated === true &&
          typeof result.data.token === "string" && /^[0-9a-f]{64}$/.test(result.data.token) && deadline > Date.now()) {
        bearer = result.data.token; expiresAt = deadline;
        present("authenticated", "Authenticated. Your session is active.", true);
      } else if (result.status === 401 && result.data.error === "invalid_credentials") {
        present("idle", "Incorrect password. Please try again.");
        password.setAttribute("aria-invalid", "true");
        password.focus();
      } else if (result.status === 429) {
        present("idle", "Too many attempts. Please wait before trying again.");
      } else present("idle", unavailable());
    } catch {
      if (current(at)) present("idle", "Connection failed. Please try again.");
    }
  }
  async function checkSession() {
    if (!available() || busy() || !bearer) return;
    if (expiresAt <= Date.now()) {
      clearSession(); present("idle", "Your session has expired. Connect again."); return;
    }
    const at = ++generation;
    present("checking", "Checking your session…");
    try {
      const result = await request("session", "GET", undefined, bearer);
      if (!current(at)) return;
      const deadline = expiry(result.data.expiresAt);
      if (result.status === 200 && result.data.ok === true && result.data.authenticated === true && deadline > Date.now()) {
        expiresAt = deadline; present("authenticated", "Authenticated. Your session is active.");
      } else if (result.status === 401) {
        clearSession(); present("idle", "Your session has expired or ended. Connect again.");
      } else present("unverified", "Session verification is unavailable. Retry before continuing.");
    } catch {
      if (current(at)) present("unverified", "Session verification failed. Please retry.");
    }
  }
  async function logout() {
    if (!available() || busy() || !bearer) return;
    resetSignal();
    const at = ++generation;
    present("logging-out", "Ending your session…");
    try {
      const result = await request("logout", "POST", undefined, bearer);
      if (!current(at)) return;
      if (result.status === 200 && result.data.ok === true && result.data.authenticated === false) {
        clearSession(); clearPassword(); present("idle", "Logged out. Connect again when ready.");
      } else present("logout-uncertain", "Logout could not be confirmed. Please retry LOGOUT.");
    } catch {
      if (current(at)) present("logout-uncertain", "Logout could not be confirmed. Please retry LOGOUT.");
    }
  }
  function prepareStationEntry() {
    if (available() && bearer && expiresAt <= Date.now()) {
      clearSession(); present("idle", "Your session has expired. Connect again."); return false;
    }
    return canEnterStation();
  }
  function canEnterStation() {
    return available() && state === "authenticated" && bearer !== null && expiresAt > Date.now() && visualPhase === "ready";
  }
  function updateStationControl() {
    apiOpen.disabled = !canEnterStation();
    apiOpen.setAttribute("aria-disabled", String(apiOpen.disabled));
    if (databaseOpen) { databaseOpen.disabled = !canEnterStation(); databaseOpen.setAttribute("aria-disabled", String(databaseOpen.disabled)); }
    updateDatabaseControl();
    if (!signalBusy) apiCheck.disabled = !signalAllowed() || monitorRun !== null || diagnosticsRun !== null || musicStatusRun !== null || queryRun !== null;
    updateMonitorControls();
  }
  function updateStationPresentation(shouldFocus = true) {
    if (available() && state === "authenticated" && bearer && expiresAt <= Date.now()) {
      clearSession(); present("idle", "Your session has expired. Connect again."); return;
    }
    const wasApi = stage.dataset.adminView === "api";
    const wasDatabase = stage.dataset.adminView === "database";
    const databaseSelected = requestedStation === "database" && databasePanel && databaseTitle && visualPhase === "ready" && bearer &&
      (state === "authenticated" && expiresAt > Date.now() || wasDatabase && ["logging-out", "logout-uncertain"].includes(state));
    if (databaseSelected) {
      if (wasApi) resetSignal();
      surface(loginPanel, false); surface(deck, false); surface(apiPanel, false); surface(databasePanel, true);
      stage.dataset.adminView = "database";
      host.setAttribute("aria-labelledby", "admin-database-title");
      if (!wasDatabase && shouldFocus) focusTitle(databaseTitle);
      updateStationControl(); return;
    }
    if (wasDatabase) cancelDatabaseOverview();
    if (databasePanel) surface(databasePanel, false);
    const allowed = requestedStation === "api" && visualPhase === "ready" && bearer &&
      (state === "authenticated" && expiresAt > Date.now() || wasApi && ["logging-out", "logout-uncertain"].includes(state));
    if (allowed) {
      surface(loginPanel, false); surface(deck, false); surface(apiPanel, true);
      stage.dataset.adminView = "api";
      host.setAttribute("aria-labelledby", "admin-api-title");
      if (!wasApi && shouldFocus) focusTitle(apiTitle);
    } else {
      if (wasApi) resetSignal();
      surface(apiPanel, false);
      stage.dataset.adminView = "deck";
      if (visualPhase === "ready") {
        surface(deck, true);
        host.setAttribute("aria-labelledby", "admin-console-title");
        if ((wasApi || wasDatabase) && shouldFocus) focusTitle(deckTitle);
      }
    }
    updateStationControl();
  }
  // Public liveness only: this controller never receives the private Admin bearer.
  let signalGeneration = 0;
  let signalController = null;
  let signalBusy = false;
  function signalAllowed() {
    return canEnterStation() && stage.dataset.adminView === "api" && !apiPanel.hidden && !apiPanel.hasAttribute("inert");
  }
  function resetSignal() {
    signalGeneration += 1;
    signalController?.abort();
    signalController = null;
    signalBusy = false;
    cancelMonitor();
    cancelDiagnostics();
    cancelMusicStatus();
    cancelQuery();
    cancelDatabaseOverview();
    apiStatus.textContent = "Awaiting Signal";
    apiDetail.textContent = "Backend connection not yet checked.";
    apiConnection.textContent = "—";
    apiResponse.textContent = "—";
    apiVerified.textContent = "—";
    apiVerified.removeAttribute("datetime");
    apiVerified.removeAttribute("title");
    apiCheck.disabled = !signalAllowed();
    apiCheck.setAttribute("aria-busy", "false");
  }
  async function checkSignal() {
    if (available() && bearer && expiresAt <= Date.now()) {
      clearSession(); present("idle", "Your session has expired. Connect again."); return;
    }
    if (!signalAllowed() || signalBusy || monitorRun !== null || diagnosticsRun !== null || musicStatusRun !== null || queryRun !== null) return;
    const at = ++signalGeneration;
    const ownController = new AbortController();
    signalController = ownController;
    signalBusy = true;
    updateMonitorControls();
    apiCheck.disabled = true;
    apiCheck.setAttribute("aria-busy", "true");
    apiStatus.textContent = "Acquiring Signal";
    apiDetail.textContent = "Checking the public API health endpoint…";
    apiConnection.textContent = "CHECKING";
    apiResponse.textContent = "—";
    const started = performance.now();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; ownController.abort(); }, 15000);
    let outcome = "error";
    let elapsed = null;
    try {
      const response = await fetch("https://vmpix-data.onrender.com/health", {
        method: "GET", headers: { Accept: "application/json" }, credentials: "omit", mode: "cors",
        cache: "no-store", redirect: "error", referrerPolicy: "no-referrer", signal: ownController.signal
      });
      if (!response.ok) {
        elapsed = performance.now() - started;
        outcome = "unavailable";
        await response.body?.cancel();
      } else {
        const data = await response.json();
        const valid = data && typeof data === "object" && !Array.isArray(data) &&
          typeof data.ok === "boolean" && (data.service === undefined || data.service === "vmpix-v3-data");
        if (valid) {
          elapsed = performance.now() - started;
          outcome = data.ok === true ? "connected" : "unavailable";
        }
      }
    } catch { /* Failure is rendered locally without exposing response or credential data. */ }
    finally {
      clearTimeout(timer);
      if (signalController === ownController) signalController = null;
    }
    if (at !== signalGeneration) return;
    if (available() && bearer && expiresAt <= Date.now()) {
      clearSession(); present("idle", "Your session has expired. Connect again."); return;
    }
    if (!signalAllowed()) return;
    signalBusy = false;
    apiCheck.disabled = false;
    apiCheck.setAttribute("aria-busy", "false");
    updateMonitorControls();
    const completed = new Date();
    apiVerified.dateTime = completed.toISOString();
    apiVerified.textContent = formatAdminDateTime(completed);
    apiVerified.title = `Most recent completed check: ${formatAdminDateTime(completed)}`;
    apiResponse.textContent = elapsed === null ? "—" : `${Math.round(elapsed)} ms`;
    apiConnection.textContent = outcome === "connected" ? "CONNECTED" : outcome === "unavailable" ? "UNAVAILABLE" : "ERROR";
    apiStatus.textContent = outcome === "connected" ? "Signal Verified" : outcome === "unavailable" ? "Signal Unavailable" : "Check Failed";
    apiDetail.textContent = outcome === "connected" ? "Primary API connection verified." :
      outcome === "unavailable" ? "The endpoint responded without confirming API liveness." :
      timedOut ? "The health request timed out. API liveness was not confirmed." : "The health check could not be completed. Please retry.";
  }
  apiCheck.addEventListener("click", checkSignal);
  // Fixed public GET catalog only. No Admin credential is passed to this controller.
  const endpointCatalog = Object.freeze([{"id":"core-health","group":"core","name":"API Health","path":"/health","contract":"health"},{"id":"core-database","group":"core","name":"Database Health","path":"/health/db","contract":"database"},{"id":"core-tables","group":"core","name":"Table Endpoint","path":"/health/tables","contract":"tables"},{"id":"music-bands","group":"music","name":"Bands","path":"/api/music/bands/db?limit=1&page=1","contract":"data"},{"id":"music-shows","group":"music","name":"Shows","path":"/api/music/shows/db?limit=1&page=1","contract":"data"},{"id":"music-people","group":"music","name":"People","path":"/api/music/people/db?limit=1&page=1","contract":"data"},{"id":"music-venues","group":"music","name":"Venues","path":"/api/music/venues/db?limit=1&page=1","contract":"data"},{"id":"wrestling-shows","group":"wrestling","name":"Shows","path":"/api/wrestling/shows/db?limit=1&page=1","contract":"data"},{"id":"wrestling-people","group":"wrestling","name":"People","path":"/api/wrestling/people/db?limit=1&page=1","contract":"data"},{"id":"wrestling-venues","group":"wrestling","name":"Venues","path":"/api/wrestling/venues/db?limit=1&page=1","contract":"items"}].map(item => Object.freeze(item)));
  const monitorPanel = host.querySelector("[data-admin-endpoint-monitor]");
  const monitorAll = monitorPanel?.querySelector("[data-admin-monitor-all]");
  const monitorProgress = monitorPanel?.querySelector("[data-admin-monitor-progress]");
  const monitorTotals = monitorPanel?.querySelector("[data-admin-monitor-totals]");
  const monitorIssue = monitorPanel?.querySelector("[data-admin-monitor-issue]");
  const monitorCompleted = monitorPanel?.querySelector("[data-admin-monitor-completed]");
  const endpointRows = new Map(endpointCatalog.map(item => [item.id, monitorPanel?.querySelector(`[data-admin-endpoint="${item.id}"]`)]));
  const endpointResults = new Map(endpointCatalog.map(item => [item.id, uncheckedEndpoint()]));
  let monitorGeneration = 0;
  let monitorRun = null;
  const RESPONSE_LIMIT = 128 * 1024;
  function uncheckedEndpoint(reason = "No check has run.") {
    return { state: "Not Checked", http: null, elapsed: null, reason };
  }
  function monitorAllowed() {
    return signalAllowed() && monitorPanel && monitorAll && monitorProgress && monitorTotals && monitorCompleted &&
      endpointRows.size === 10 && [...endpointRows.values()].every(Boolean);
  }
  function updateMonitorControls() {
    const disabled = !monitorAllowed() || signalBusy || monitorRun !== null || diagnosticsRun !== null || musicStatusRun !== null || queryRun !== null;
    if (monitorAll) { monitorAll.disabled = disabled; monitorAll.setAttribute("aria-busy", String(monitorRun !== null)); }
    endpointRows.forEach(row => { const button = row?.querySelector("[data-admin-endpoint-check]"); if (button) button.disabled = disabled; });
    updateDiagnosticControls();
  }
  function renderEndpoint(id) {
    const row = endpointRows.get(id), result = endpointResults.get(id);
    if (!row || !result) return;
    row.dataset.endpointState = result.state;
    row.querySelector("[data-endpoint-state]").textContent = result.state;
    row.querySelector("[data-endpoint-http]").textContent = result.http === null ? "HTTP —" : `HTTP ${result.http}`;
    row.querySelector("[data-endpoint-time]").textContent = result.elapsed === null ? "Time —" : `Time ${Math.round(result.elapsed)} ms`;
    row.querySelector("[data-endpoint-reason]").textContent = result.reason;
  }
  function renderMonitorTotals() {
    let successful = 0, failed = 0, unavailable = 0;
    endpointResults.forEach(result => {
      if (result.state === "Connected" || result.state === "Slow") successful += 1;
      else if (result.state === "Failed") failed += 1;
      else if (result.state === "Unavailable") unavailable += 1;
    });
    if (monitorTotals) monitorTotals.textContent = `${successful} successful · ${failed} failed · ${unavailable} unavailable`;
    if (monitorIssue) {
      const issue = endpointCatalog.find(spec => ["Failed", "Unavailable"].includes(endpointResults.get(spec.id)?.state));
      const group = issue && ({ core: "", music: "Music ", wrestling: "Wrestling " })[issue.group];
      monitorIssue.textContent = issue ? `First issue: ${group}${issue.name}. ${endpointResults.get(issue.id).reason}` :
        "No failed or unavailable checks.";
    }
  }
  function cancelMonitor() {
    monitorGeneration += 1;
    const run = monitorRun;
    monitorRun = null;
    if (run) {
      run.timers.forEach(clearTimeout);
      run.controllers.forEach(controller => controller.abort());
      run.readers.forEach(reader => { reader.cancel().catch(() => {}); });
      endpointResults.forEach((result, id) => {
        if (result.state === "Checking") { endpointResults.set(id, uncheckedEndpoint("Check canceled before verification.")); renderEndpoint(id); }
      });
      if (monitorProgress) monitorProgress.textContent = `Canceled: ${run.completed} / ${run.ids.length} checked`;
      renderMonitorTotals();
    }
    updateMonitorControls();
  }
  function monitorCurrent(run) {
    if (monitorRun !== run || run.generation !== monitorGeneration) return false;
    if (!signalAllowed()) { cancelMonitor(); prepareStationEntry(); return false; }
    return true;
  }
  function validEndpointPayload(spec, data) {
    if (!data || typeof data !== "object" || Array.isArray(data) || data.ok !== true) return false;
    if (spec.contract === "health") return data.service === "vmpix-v3-data" && typeof data.time === "string" && Number.isFinite(Date.parse(data.time));
    if (spec.contract === "database") return data.database === "connected" && typeof data.time === "string" && Number.isFinite(Date.parse(data.time));
    if (spec.contract === "tables") return Array.isArray(data.tables) && data.tables.every(name => typeof name === "string");
    const items = data[spec.contract];
    return Array.isArray(items) && items.length <= 1 && items.every(item => item && typeof item === "object" && !Array.isArray(item)) &&
      Number.isSafeInteger(data.total) && data.total >= items.length && data.count === items.length &&
      data.page === 1 && data.limit === 1 && Number.isSafeInteger(data.totalPages) && data.totalPages >= 0;
  }
  async function boundedEndpointJson(response, run, controller) {
    const length = response.headers.get("content-length");
    if (length && /^\d+$/.test(length) && Number(length) > RESPONSE_LIMIT) {
      try { await response.body?.cancel(); } catch { /* Cancellation is best effort; the limit outcome stays explicit. */ }
      controller.abort(); return { unavailable: true };
    }
    if (!/^(application\/json|application\/[a-z0-9.+-]+\+json)(?:\s*;|$)/i.test(response.headers.get("content-type") || "")) return { invalid: true };
    if (!response.body || typeof response.body.getReader !== "function") return { unsupported: true };
    const reader = response.body.getReader();
    run.readers.add(reader);
    const chunks = []; let size = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > RESPONSE_LIMIT) {
          try { await reader.cancel(); } catch { /* Preserve the known byte-limit outcome. */ }
          controller.abort(); return { unavailable: true };
        }
        chunks.push(chunk.value);
      }
      const bytes = new Uint8Array(size); let offset = 0;
      chunks.forEach(chunk => { bytes.set(chunk, offset); offset += chunk.byteLength; });
      return { data: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) };
    } finally {
      run.readers.delete(reader);
      reader.releaseLock();
    }
  }
  async function checkEndpoint(spec, run) {
    const controller = new AbortController();
    run.controllers.add(controller);
    let timedOut = false;
    const started = performance.now();
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 15000);
    run.timers.add(timer);
    let http = null;
    let state = "Unavailable", reason = "The request could not be verified.";
    try {
      const response = await fetch(`https://vmpix-data.onrender.com${spec.path}`, {
        method: "GET", headers: { Accept: "application/json" }, credentials: "omit", mode: "cors",
        cache: "no-store", redirect: "error", referrerPolicy: "no-referrer", signal: controller.signal
      });
      http = response.status;
      if (!response.ok) {
        state = "Failed"; reason = `HTTP ${http} did not confirm this endpoint.`;
        await response.body?.cancel();
      } else {
        const parsed = await boundedEndpointJson(response, run, controller);
        if (parsed.unavailable) reason = "Response exceeds the 128 KiB safety limit.";
        else if (parsed.unsupported) { reason = "This browser cannot safely read a bounded response."; controller.abort(); }
        else if (parsed.invalid || !validEndpointPayload(spec, parsed.data)) {
          state = "Failed"; reason = "The expected public response was not verified."; controller.abort();
        } else {
          state = performance.now() - started > 2000 ? "Slow" : "Connected";
          reason = state === "Slow" ? "Verified response exceeded 2 seconds." : "Expected public response verified.";
        }
      }
    } catch {
      if (timedOut) reason = "The request exceeded 15 seconds.";
      else if (!controller.signal.aborted && http !== null) { state = "Failed"; reason = "The response did not match the expected format."; }
    } finally {
      clearTimeout(timer); run.timers.delete(timer); run.controllers.delete(controller);
    }
    return { state, http, elapsed: performance.now() - started, reason };
  }
  async function runEndpointChecks(ids) {
    if (signalBusy || monitorRun || diagnosticsRun || musicStatusRun || queryRun) return;
    if (!prepareStationEntry() || !monitorAllowed()) return;
    if (ids.length === endpointCatalog.length) endpointCatalog.forEach(spec => { endpointResults.set(spec.id, uncheckedEndpoint()); renderEndpoint(spec.id); });
    const run = { generation: ++monitorGeneration, ids, cursor: 0, completed: 0, controllers: new Set(), readers: new Set(), timers: new Set() };
    monitorRun = run;
    updateStationControl(); updateMonitorControls(); renderMonitorTotals();
    if (monitorProgress) monitorProgress.textContent = `0 / ${ids.length} checked`;
    async function worker() {
      while (run.cursor < ids.length && monitorCurrent(run)) {
        const id = ids[run.cursor++], spec = endpointCatalog.find(item => item.id === id);
        endpointResults.set(id, { state: "Checking", http: null, elapsed: null, reason: "Waiting for a verified response." });
        renderEndpoint(id); renderMonitorTotals();
        const result = await checkEndpoint(spec, run);
        if (!monitorCurrent(run)) return;
        endpointResults.set(id, result); renderEndpoint(id);
        run.completed += 1;
        if (monitorProgress) monitorProgress.textContent = `${run.completed} / ${ids.length} checked`;
        renderMonitorTotals();
      }
    }
    await Promise.all(Array.from({ length: Math.min(2, ids.length) }, worker));
    if (!monitorCurrent(run)) return;
    monitorRun = null;
    const completed = new Date();
    monitorCompleted.dateTime = completed.toISOString();
    monitorCompleted.textContent = formatAdminDateTime(completed);
    monitorCompleted.title = formatAdminDateTime(completed);
    monitorProgress.textContent = `Complete: ${run.completed} / ${ids.length} checked`;
    updateStationControl(); updateMonitorControls();
  }
  monitorAll?.addEventListener("click", () => runEndpointChecks(endpointCatalog.map(spec => spec.id)));
  endpointCatalog.forEach(spec => endpointRows.get(spec.id)?.querySelector("[data-admin-endpoint-check]")?.addEventListener("click", () => runEndpointChecks([spec.id])));

  // Fixed read-only diagnostics share the authenticated session, never legacy credentials.
  const diagnosticCatalog = Object.freeze([{"id":"global-overview","group":"global","name":"Overall Backend","path":"/api/admin/diagnostics","section":"global","category":null,"supported":true},{"id":"music-overview","group":"music","name":"Overall Music","path":"/api/admin/diagnostics/music","section":"music","category":null,"supported":true},{"id":"music-bands","group":"music","name":"Bands","path":"/api/admin/diagnostics/music/bands","section":"music","category":"bands","supported":true},{"id":"music-shows","group":"music","name":"Shows","path":"/api/admin/diagnostics/music/shows","section":"music","category":"shows","supported":true},{"id":"music-people","group":"music","name":"People","path":"/api/admin/diagnostics/music/people","section":"music","category":"people","supported":true},{"id":"music-venues","group":"music","name":"Venues","path":"/api/admin/diagnostics/music/venues","section":"music","category":"venues","supported":true},{"id":"wrestling-overview","group":"wrestling","name":"Overall Wrestling","path":"/api/admin/diagnostics/wrestling","section":"wrestling","category":null,"supported":true},{"id":"wrestling-shows","group":"wrestling","name":"Shows","path":"/api/admin/diagnostics/wrestling/shows","section":"wrestling","category":"shows","supported":false},{"id":"wrestling-people","group":"wrestling","name":"People","path":"/api/admin/diagnostics/wrestling/people","section":"wrestling","category":"people","supported":false},{"id":"wrestling-venues","group":"wrestling","name":"Venues","path":"/api/admin/diagnostics/wrestling/venues","section":"wrestling","category":"venues","supported":false},{"id":"smug-config","group":"smug","name":"Configuration","path":"/api/admin/smug/music/config","section":"smug","category":"config","supported":true},{"id":"smug-snapshots","group":"smug","name":"Music snapshots","path":"/api/admin/smug/music/diagnostics","section":"smug","category":"snapshots","supported":true}].map(spec => Object.freeze(spec)));
  const diagnosticsPanel = host.querySelector("[data-admin-diagnostics]");
  const diagnosticsAll = diagnosticsPanel?.querySelector("[data-admin-diagnostic-all]");
  const diagnosticsProgress = diagnosticsPanel?.querySelector("[data-admin-diagnostic-progress]");
  const diagnosticsTotals = diagnosticsPanel?.querySelector("[data-admin-diagnostic-totals]");
  const diagnosticsCompleted = diagnosticsPanel?.querySelector("[data-admin-diagnostic-completed]");
  const diagnosticRows = new Map(diagnosticCatalog.map(spec => [spec.id, diagnosticsPanel?.querySelector(`[data-admin-diagnostic="${spec.id}"]`)]));
  const diagnosticResults = new Map(diagnosticCatalog.map(spec => [spec.id, uncheckedDiagnostic(spec)]));
  let diagnosticsGeneration = 0;
  let diagnosticsRun = null;
  const diagnosticMetrics = Object.freeze({
    music: {
      bands: { total: "total_bands", issues: ["bands_missing_id", "duplicate_band_ids", "bands_missing_name", "duplicate_band_names", "bands_missing_status", "bands_missing_region"] },
      shows: { total: "total_shows", issues: ["shows_missing_show_name", "shows_missing_date", "shows_missing_venue", "duplicate_show_keys"] },
      people: { total: "total_people", issues: ["people_missing_id", "duplicate_person_ids", "people_missing_name", "duplicate_person_names", "people_missing_category"] },
      venues: { total: "total_venues", issues: ["venues_missing_id", "duplicate_venue_ids", "venues_missing_name", "duplicate_venue_names", "venues_missing_city", "venues_missing_state", "venues_missing_gps", "venues_pending_geocode_enrichment", "bad_column_mapping_detected"], information: ["music_shows_total", "music_shows_with_venue_id", "matching_show_venue_relationships", "venues_with_show_count", "venues_with_gps", "venues_with_formatted_address"] }
    },
    wrestling: {
      shows: { total: "total_records", issues: ["records_missing_show_name", "records_missing_date", "records_missing_venue_id", "duplicate_show_keys", "records_with_invalid_venue_id"] },
      people: { total: "total_people", issues: ["people_missing_name", "people_missing_category", "duplicate_person_ids"] },
      venues: { total: "total_venues", issues: ["venues_missing_gps", "venues_missing_name", "duplicate_venue_ids"], information: ["venues_with_gps"] },
      matches: { total: "total_matches", issues: ["matches_missing_participants", "matches_missing_winner", "matches_missing_match_type", "matches_missing_match_order"], information: ["total_records"] }
    }
  });
  function diagnosticObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
  function diagnosticCount(value) { return Number.isSafeInteger(value) && value >= 0; }
  function diagnosticLabel(key) { const words = key.replace(/_/g, " "); return words.charAt(0).toUpperCase() + words.slice(1); }
  function uncheckedDiagnostic(spec, reason = "Run this diagnostic to inspect its report.") {
    return { state: spec.supported ? "Not Checked" : "Unavailable", http: null, elapsed: null,
      reason: spec.supported ? reason : "Not implemented by the current API.", facts: [], details: [], technical: null, issues: null, checkedAt: null };
  }
  function diagnosticsAllowed() {
    return signalAllowed() && diagnosticsPanel && diagnosticsAll && diagnosticsProgress && diagnosticsTotals && diagnosticsCompleted &&
      diagnosticRows.size === 12 && [...diagnosticRows.values()].every(Boolean);
  }
  function updateDiagnosticControls() {
    const disabled = !diagnosticsAllowed() || signalBusy || monitorRun !== null || diagnosticsRun !== null || musicStatusRun !== null || queryRun !== null;
    diagnosticsPanel?.querySelectorAll("[data-admin-diagnostic-run], [data-admin-diagnostic-category], [data-admin-diagnostic-all]").forEach(button => {
      const spec = diagnosticCatalog.find(item => item.id === button.dataset.adminDiagnosticRun);
      button.disabled = disabled || Boolean(spec && !spec.supported);
      button.setAttribute("aria-busy", String(diagnosticsRun !== null));
    });
    updateMusicStatusControl();
  }
  function renderDiagnostic(id) {
    const row = diagnosticRows.get(id), result = diagnosticResults.get(id);
    if (!row || !result) return;
    const technical = row.querySelector(".admin-diagnostic__technical"), checking = result.state === "Checking";
    if (checking && technical.contains(document.activeElement)) document.activeElement.blur();
    technical.toggleAttribute("inert", checking);
    ["aria-disabled", "aria-busy"].forEach(attribute => {
      if (checking) technical.setAttribute(attribute, "true"); else technical.removeAttribute(attribute);
    });
    technical.querySelectorAll("summary").forEach(summary => {
      if (checking) { summary.setAttribute("aria-disabled", "true"); summary.setAttribute("tabindex", "-1"); }
      else { summary.removeAttribute("aria-disabled"); summary.removeAttribute("tabindex"); }
    });
    row.dataset.diagnosticState = result.state;
    row.querySelector("[data-diagnostic-state]").textContent = result.state;
    row.querySelector("[data-diagnostic-http]").textContent = result.http === null ? "HTTP —" : `HTTP ${result.http}`;
    row.querySelector("[data-diagnostic-time]").textContent = result.elapsed === null ? "Time —" : `Time ${Math.round(result.elapsed)} ms`;
    row.querySelector("[data-diagnostic-reason]").textContent = result.reason;
    row.querySelector("[data-diagnostic-issues]").textContent = result.issues === null ? "Reported issues: —" : result.issues;
    const checked = row.querySelector("[data-diagnostic-checked]");
    checked.textContent = result.checkedAt === null ? "—" : formatAdminDateTime(result.checkedAt);
    if (result.checkedAt === null) { checked.removeAttribute("datetime"); checked.removeAttribute("title"); }
    else { checked.dateTime = result.checkedAt; checked.title = formatAdminDateTime(result.checkedAt); }
    const facts = row.querySelector("[data-diagnostic-facts]");
    facts.replaceChildren();
    result.facts.forEach(([label, value]) => {
      const term = document.createElement("dt"), detail = document.createElement("dd");
      term.textContent = label; detail.textContent = String(value); facts.append(term, detail);
    });
    facts.hidden = result.facts.length === 0;
    const details = row.querySelector("[data-diagnostic-details]"); details.replaceChildren();
    result.details.forEach(text => { const item = document.createElement("li"); item.textContent = text; details.appendChild(item); });
    row.querySelector("[data-diagnostic-json]").textContent = result.technical === null ? "No report available." : result.technical;
  }
  function renderDiagnosticTotals() {
    let healthy = 0, findings = 0, failed = 0, unavailable = 0;
    diagnosticCatalog.filter(spec => spec.supported).forEach(spec => {
      const state = diagnosticResults.get(spec.id).state;
      if (state === "Healthy") healthy += 1;
      else if (state === "Warning") findings += 1;
      else if (state === "Error") failed += 1;
      else if (state === "Unavailable") unavailable += 1;
    });
    if (diagnosticsTotals) diagnosticsTotals.textContent = `${healthy} healthy · ${findings} warnings · ${failed} errors · ${unavailable} unavailable. 3 diagnostics are not implemented.`;
  }
  function cancelDiagnostics() {
    diagnosticsGeneration += 1;
    const run = diagnosticsRun; diagnosticsRun = null;
    if (run) {
      run.timers.forEach(clearTimeout);
      run.controllers.forEach(item => item.abort());
      run.readers.forEach(reader => { reader.cancel().catch(() => {}); });
      diagnosticCatalog.forEach(spec => {
        if (diagnosticResults.get(spec.id).state === "Checking") {
          diagnosticResults.set(spec.id, uncheckedDiagnostic(spec, "Check canceled before verification.")); renderDiagnostic(spec.id);
        }
      });
      if (diagnosticsProgress) diagnosticsProgress.textContent = `Canceled: ${run.completed} / ${run.ids.length} checked`;
      renderDiagnosticTotals();
    }
    updateStationControl();
  }
  function resetDiagnosticReports() {
    cancelDiagnostics();
    diagnosticCatalog.forEach(spec => { diagnosticResults.set(spec.id, uncheckedDiagnostic(spec)); renderDiagnostic(spec.id); });
    if (diagnosticsProgress) diagnosticsProgress.textContent = "0 / 9 supported diagnostics checked";
    if (diagnosticsCompleted) { diagnosticsCompleted.textContent = "—"; diagnosticsCompleted.removeAttribute("datetime"); diagnosticsCompleted.removeAttribute("title"); }
    renderDiagnosticTotals();
  }
  function diagnosticCurrent(run) {
    if (diagnosticsRun !== run || run.generation !== diagnosticsGeneration) return false;
    if (!signalAllowed()) { cancelDiagnostics(); prepareStationEntry(); return false; }
    return true;
  }
  function sanitizeDiagnosticResponse(input, privateToken) {
    let nodes = 0, characters = 0, omitted = false, unverified = false;
    const sensitiveKey = key => /auth|cookie|token|session|password|passwd|pwd|passphrase|secret|hash|apikey|credential|privatekey|bearer|signingkey|connectionstring|connectionurl|databaseurl|dburl|dsn|stack|trace/.test(key.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const redactString = (input, keyName = false) => {
      let value = input.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
      const context = value.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!keyName && /password|passwd|passphrase|apikey|secret|accesstoken|accesskey|sessiontoken|refreshtoken|authorization|bearer|cookie|credential|privatekey/.test(context)) return "[REDACTED: credential context]";
      if (privateToken) value = value.split(privateToken).join("[REDACTED]");
      value = value.replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g, "[REDACTED PRIVATE KEY]")
        .replace(/scrypt\$v1\$[0-9a-f]{32}\$[0-9a-f]{64}/gi, "[REDACTED PASSWORD HASH]")
        .replace(/\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/g, "[REDACTED PASSWORD HASH]")
        .replace(/\$argon2(?:id|i|d)\$(?:v=\d+\$)?[^\s$]+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+/g, "[REDACTED PASSWORD HASH]")
        .replace(/\b(?:Bearer|Basic)\s+[^\s<>"']+/gi, "[REDACTED AUTHORIZATION]")
        .replace(/\b[0-9a-f]{64}\b/gi, "[REDACTED TOKEN]")
        .replace(/\b[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g, "[REDACTED JWT]")
        .replace(/\b(?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?|rediss?|amqps?):\/\/[^\s<>"']+/gi, "[REDACTED CONNECTION URL]")
        .replace(/\b[a-z0-9_-]*(?:password|passwd|pwd|passphrase|api[_-]?key|token|session|secret|credential|hash|connection[_-]?(?:string|url)|database[_-]?url|db[_-]?url)[a-z0-9_-]*\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, "[REDACTED CREDENTIAL]")
        .replace(/https?:\/\/[^\s<>"']+/gi, text => {
          try { const url = new URL(text); return url.username || url.password || [...url.searchParams.keys()].some(sensitiveKey) ? "[REDACTED URL]" : text; }
          catch { return "[OMITTED URL]"; }
        });
      if (value.length > 1024) { omitted = true; value = value.slice(0, 1024) + " [OMITTED: string limit]"; }
      characters += value.length;
      return value;
    };
    const visit = (value, depth) => {
      if (++nodes > 2500 || characters > 36000 || depth > 8) { omitted = true; return "[OMITTED: safety limit]"; }
      if (value === null || typeof value === "boolean") return value;
      if (typeof value === "number") { if (Number.isFinite(value)) return value; omitted = true; return "[OMITTED: invalid number]"; }
      if (typeof value === "string") return redactString(value);
      if (Array.isArray(value)) {
        const result = value.slice(0, 100).map(item => visit(item, depth + 1));
        if (value.length > 100) { omitted = true; result.push("[OMITTED: item limit]"); }
        return result;
      }
      if (!diagnosticObject(value)) { omitted = true; return "[OMITTED: unsupported value]"; }
      const result = Object.create(null), keys = Object.keys(value);
      keys.slice(0, 100).forEach(key => {
        const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (["proto", "prototype", "constructor"].includes(normalized)) { omitted = true; unverified = true; return; }
        const cleanedKey = redactString(key, true), safeKey = cleanedKey.slice(0, 128);
        // Rewriting an incoming key must never manufacture a valid contract field.
        if (safeKey !== key || Object.prototype.hasOwnProperty.call(result, safeKey)) { omitted = true; unverified = true; return; }
        result[safeKey] = sensitiveKey(key) ? "[REDACTED]" : visit(value[key], depth + 1);
      });
      if (keys.length > 100) { omitted = true; result.omitted_fields = "[OMITTED: field limit]"; }
      return result;
    };
    const data = visit(input, 0), text = JSON.stringify(data, null, 2);
    if (new TextEncoder().encode(text).length > 65536) return { data: null, omitted: true, unverified: true, text: '{"omitted":"Sanitized response exceeded the 64 KiB display limit."}' };
    return { data, text, omitted, unverified };
  }
  function diagnosticDetails(data, spec) {
    if (spec.section === "smug") return smugReportDetails(data);
    const details = [], sampleFields = ["id", "band_id", "band", "show_id", "show_name", "date", "person_id", "name", "category", "venue_id", "venue_name", "venue", "city", "state", "count"];
    let bounded = false;
    const describe = value => ["string", "number"].includes(typeof value) ? String(value) : diagnosticObject(value) ? ["code", "type", "message", "description", "reason", "error"].filter(key => ["string", "number"].includes(typeof value[key])).map(key => `${key}: ${value[key]}`).join(" · ") : "";
    const append = (label, value) => { const text = describe(value); if (text && details.length < 60) details.push(`${label}: ${text}`); };
    const inspect = (value, label, category) => {
      if (!diagnosticObject(value)) return;
      ["code", "error", "message", "description", "reason"].forEach(key => append(`${label} · ${diagnosticLabel(key)}`, value[key]));
      [value.warnings, value.summary?.warnings, value.importHealth?.staleWarnings].forEach(warnings => {
        if (Array.isArray(warnings)) { if (warnings.length > 10) bounded = true; warnings.slice(0, 10).forEach(item => append(`${label} · Warning`, item)); }
      });
      const dates = [["Generated", value.generatedAt], ["Latest successful import", value.importHealth?.lastSuccessfulImportAt],
        ["Latest failed import", value.importHealth?.lastFailedImportAt], ["Statistics last rebuilt", value.statsHealth?.lastRebuiltAt]];
      dates.forEach(([name, timestamp]) => { if (timestamp !== undefined) append(`${label} · ${name}`, formatAdminDateTime(timestamp, "Not recorded")); });
      if (typeof value.importHealth?.latestFailureReason === "string") append(`${label} · Import failure`, value.importHealth.latestFailureReason);
      if (Array.isArray(value.importHealth?.latestImports)) {
        if (value.importHealth.latestImports.length > 10) bounded = true;
        value.importHealth.latestImports.slice(0, 10).forEach(item => {
          if (!diagnosticObject(item)) return;
          if (typeof item.status === "string") append(`${label} · Import status`, item.status);
          if (typeof item.sync_health === "string") append(`${label} · Import health`, item.sync_health);
          if (typeof item.error_message === "string") append(`${label} · Import message`, item.error_message);
        });
      }
      if (typeof value.shows?.refresh_hint === "string") append(`${label} · Backend hint`, value.shows.refresh_hint);
      if (typeof value.relationships?.refresh_hint === "string") append(`${label} · Backend hint`, value.relationships.refresh_hint);
      const groups = category ? [category] : Object.keys(diagnosticMetrics[label === "Wrestling" ? "wrestling" : "music"] || {});
      groups.forEach(name => {
        const samples = value[name]?.samples;
        if (!diagnosticObject(samples)) return;
        if (Object.keys(samples).length > 20) bounded = true;
        Object.entries(samples).slice(0, 20).forEach(([issue, records]) => {
          if (!Array.isArray(records)) return;
          if (records.length > 5) bounded = true;
          records.slice(0, 5).forEach(record => {
            if (!diagnosticObject(record)) return;
            const fields = sampleFields.filter(key => ["string", "number", "boolean"].includes(typeof record[key])).map(key => `${diagnosticLabel(key)}: ${key === "date" && parseAdminTimestamp(record[key]) ? formatAdminDateTime(record[key]) : String(record[key])}`);
            if (fields.length && details.length < 60) details.push(`${label} · ${diagnosticLabel(name)} · ${diagnosticLabel(issue)}: ${fields.join(" · ")}`);
          });
        });
      });
      if (diagnosticObject(value.relationships)) {
        if (Object.keys(value.relationships).length > 20) bounded = true;
        Object.entries(value.relationships).slice(0, 20).forEach(([key, field]) => {
        if (diagnosticCount(field)) append(`${label} · Relationship`, `${diagnosticLabel(key)}: ${field}`);
        else if (Array.isArray(field)) {
          if (field.length > 10) bounded = true;
          field.slice(0, 10).forEach(item => { if (["string", "number"].includes(typeof item)) append(`${label} · ${diagnosticLabel(key)}`, String(item)); });
        }
        });
      }
    };
    if (spec.section === "global") { inspect(data, "Global", null); inspect(data?.music, "Music", null); inspect(data?.wrestling, "Wrestling", null); }
    else inspect(data, spec.section === "music" ? "Music" : "Wrestling", spec.category);
    if (bounded || details.length === 60) details.push("Some structured details are omitted by display limits. Technical Response may also be bounded.");
    return details;
  }
  function diagnosticDomain(data, domain, category = null) {
    if (diagnosticObject(data) && data.ok === false) return { unavailable: false, error: true, findings: false, findingCounters: null, facts: [["Report verified", "No"]] };
    if (!diagnosticObject(data) || data.ok !== true || !diagnosticObject(data.summary)) throw new Error("Invalid report");
    const summary = data.summary, names = domain === "music" ? ["bands", "shows", "people", "venues"] : ["shows", "people", "venues"];
    if (typeof summary.database_connected !== "boolean" || !diagnosticObject(summary.tables) || !diagnosticCount(summary.warning_count) ||
        names.some(name => typeof summary.tables[`${domain}_${name}`] !== "boolean")) throw new Error("Invalid context");
    const facts = [["Database connected", summary.database_connected ? "Yes" : "No"], ["Reported warnings", summary.warning_count]];
    const clean = { ok: true, summary: { database_connected: summary.database_connected, tables: {}, warning_count: summary.warning_count } };
    names.forEach(name => { clean.summary.tables[`${domain}_${name}`] = summary.tables[`${domain}_${name}`]; });
    let unavailable = !summary.database_connected || (category ? !summary.tables[`${domain}_${category}`] : names.some(name => !summary.tables[`${domain}_${name}`]));
    if (unavailable) return { unavailable: true, error: false, findings: false, findingCounters: null, facts };
    let findingCounters = 0, unknownHealth = false, error = false, importUnverified = false;
    const selected = category ? [category] : Object.keys(diagnosticMetrics[domain]);
    selected.forEach(name => {
      const definition = diagnosticMetrics[domain][name], values = data[name];
      if (!diagnosticObject(values) || !diagnosticCount(values[definition.total])) {
        if (!unavailable) throw new Error("Missing metrics");
        return;
      }
      const output = {}; clean[name] = output;
      output[definition.total] = values[definition.total]; facts.push([`${diagnosticLabel(name)} · Total`, values[definition.total]]);
      definition.issues.forEach(key => {
        if (!diagnosticCount(values[key])) throw new Error("Invalid metric");
        output[key] = values[key];
        facts.push([diagnosticLabel(key), values[key]]);
        if (values[key] > 0) findingCounters += 1;
      });
      (definition.information || []).forEach(key => { if (diagnosticCount(values[key])) output[key] = values[key]; });
    });
    if (category) {
      const imports = data.importHealth;
      if (!diagnosticObject(imports) || typeof imports.ok !== "boolean" || !Array.isArray(imports.latestImports)) throw new Error("Invalid category import context");
      importUnverified = imports.ok !== true || imports.latestImports.length === 0;
      facts.push(["Recent import records", imports.latestImports.length]);
      imports.latestImports.forEach((item, index) => {
        if (!diagnosticObject(item) || !diagnosticCount(item.errors_count) || !diagnosticCount(item.warnings_count)) throw new Error("Invalid import metrics");
        const failed = item.status === "failed" || item.status === "error" || item.sync_health === "failed" || item.errors_count > 0;
        const warning = item.status === "warning" || item.sync_health === "warning" || item.warnings_count > 0;
        const known = ["success", "warning", "failed", "error"].includes(item.status) && ["healthy", "warning", "failed"].includes(item.sync_health);
        if (failed) error = true;
        if (failed || warning) findingCounters += 1;
        if (!known) importUnverified = true;
        if (index < 10) facts.push([`Import ${index + 1} · Errors`, item.errors_count], [`Import ${index + 1} · Warnings`, item.warnings_count]);
      });
      facts.push(["Import history context", importUnverified ? "Unverified" : "Observed history"]);
    } else {
      const relationship = data.relationshipHealth, stats = data.statsHealth, imports = data.importHealth, locks = data.lockHealth;
      if (!diagnosticObject(relationship) || !["unknown", "failed", "warning", "healthy"].includes(relationship.overallHealth) ||
          ![relationship.errors, relationship.warnings, relationship.info].every(diagnosticCount) ||
          !diagnosticObject(stats) || !["unknown", "healthy"].includes(stats.overallHealth) || !diagnosticCount(stats.snapshots) ||
          !diagnosticObject(imports) || !diagnosticCount(imports.failingImportsLast24h) || !diagnosticCount(imports.warningImportsLast24h) || !Array.isArray(imports.staleWarnings) ||
          !diagnosticObject(locks) || !diagnosticCount(locks.activeLocks) || !diagnosticCount(locks.staleLocks)) throw new Error("Invalid health context");
      clean.relationshipHealth = { overallHealth: relationship.overallHealth, errors: relationship.errors, warnings: relationship.warnings, info: relationship.info };
      clean.statsHealth = { overallHealth: stats.overallHealth, snapshots: stats.snapshots };
      clean.importHealth = { failingImportsLast24h: imports.failingImportsLast24h, warningImportsLast24h: imports.warningImportsLast24h, stale_warning_count: imports.staleWarnings.length };
      clean.lockHealth = { activeLocks: locks.activeLocks, staleLocks: locks.staleLocks };
      facts.push(["Relationship errors", relationship.errors], ["Relationship warnings", relationship.warnings], ["Statistics snapshots", stats.snapshots],
        ["Failed imports · 24h", imports.failingImportsLast24h], ["Import warnings · 24h", imports.warningImportsLast24h], ["Stale locks", locks.staleLocks]);
      findingCounters += [relationship.errors, relationship.warnings, imports.failingImportsLast24h, imports.warningImportsLast24h, imports.staleWarnings.length, locks.staleLocks].filter(value => value > 0).length;
      unknownHealth = relationship.overallHealth === "unknown" || stats.overallHealth === "unknown" || stats.snapshots === 0 ||
        relationship.ok !== true || stats.ok !== true || imports.ok !== true || locks.ok !== true;
      if (relationship.overallHealth === "failed" || relationship.overallHealth === "warning") findingCounters += 1;
      error = relationship.overallHealth === "failed" || relationship.errors > 0 || imports.failingImportsLast24h > 0;
    }
    facts.push(["Counters with findings", findingCounters]);
    const returnedWarnings = [data.warnings, summary.warnings].some(value => Array.isArray(value) && value.length > 0);
    return { unavailable, error, findings: findingCounters > 0 || summary.warning_count > 0 || unknownHealth || returnedWarnings || importUnverified, importUnverified, findingCounters, facts };
  }
  // SmugMug reports use a strict limited projection before the unchanged general redactor.
  function projectSmugReport(spec, input) {
    if (!diagnosticObject(input) || typeof input.ok !== "boolean") throw new Error("Invalid SmugMug envelope");
    let omitted = false;
    const text = value => {
      if (typeof value !== "string") throw new Error("Invalid text");
      if (/oauth|consumerkey|consumersecret|signature|accesskey/.test(value.toLowerCase().replace(/[^a-z0-9]/g, ""))) return "[REDACTED: SmugMug credential context]";
      value = value.replace(/https?:\/\/[^\s<>"']+/gi, "[OMITTED URL]");
      if (value.length > 1024) { omitted = true; return value.slice(0, 1024); } return value;
    };
    const bool = value => { if (typeof value !== "boolean") throw new Error("Invalid readiness"); return value; };
    const count = value => { if (!diagnosticCount(value)) throw new Error("Invalid count"); return value; };
    const timestamp = value => { if (value === null) return null; if (!parseAdminTimestamp(value)) throw new Error("Invalid timestamp"); return value; };
    const warnings = value => { if (!Array.isArray(value) || value.some(item => typeof item !== "string")) throw new Error("Invalid warnings"); if (value.length > 50) omitted = true; return value.slice(0, 50).map(text); };
    const output = { projection: "Limited redacted SmugMug projection; private/provider fields and URLs are omitted.", kind: spec.category, ok: input.ok };
    if (input.generatedAt !== undefined) output.generatedAt = timestamp(input.generatedAt);
    if (input.ok === false) {
      ["error", "code", "message"].forEach(key => { if (typeof input[key] === "string") output[key] = text(input[key]); });
      return { data: output, omitted };
    }
    const expected = spec.category === "config" ? "smug_config" : "smug_diagnostics";
    if (input.type !== expected || input.section !== "music" || input.route !== `/admin/smug/music/${spec.category === "config" ? "config" : "diagnostics"}` || !output.generatedAt) throw new Error("Unexpected SmugMug report");
    output.warnings = warnings(input.warnings);
    output.warningCount = count(input.warnings.length);
    const sourceSnapshot = input.snapshotFields;
    if (!diagnosticObject(sourceSnapshot) || !Array.isArray(sourceSnapshot.missing) || sourceSnapshot.missing.some(item => typeof item !== "string") || !diagnosticObject(sourceSnapshot.tables)) throw new Error("Invalid snapshot context");
    const fields = ["gallery_id", "album_id", "cover_image_url", "photo_count", "smug_last_synced_at", "smug_sync_status", "smug_sync_error"];
    output.snapshot = { present: bool(sourceSnapshot.present), missingCount: sourceSnapshot.missing.length, tables: {} };
    ["music_bands", "music_shows"].forEach(name => {
      const table = sourceSnapshot.tables[name];
      if (table === undefined && !sourceSnapshot.present) return;
      if (!diagnosticObject(table) || !diagnosticObject(table.fields)) throw new Error("Invalid snapshot table");
      const target = { tablePresent: bool(table.tablePresent), fields: {} };
      fields.forEach(field => { target.fields[field] = bool(table.fields[field]); }); output.snapshot.tables[name] = target;
    });
    if (!diagnosticObject(input.summary)) throw new Error("Missing summary");
    if (spec.category === "config") {
      const config = input.config, helper = input.helper;
      if (!diagnosticObject(config) || !diagnosticObject(helper) || !Array.isArray(config.missing) || !Array.isArray(input.summary.missingRequirements)) throw new Error("Invalid configuration");
      output.configuration = { apiReady: bool(config.smugApiKeyConfigured), nicknameReady: bool(config.smugNicknameConfigured), configured: bool(config.configured), userAgentReady: bool(config.userAgentConfigured), missingCount: config.missing.length };
      output.helper = { available: bool(helper.available), requestReady: bool(helper.requestHelperAvailable), urlReady: bool(helper.urlHelperAvailable), retrySupported: bool(helper.rateLimitRetrySupported), concurrency: count(helper.lowConcurrencyDefault) };
      output.readiness = { diagnosticsCapable: bool(input.summary.readyForDiagnostics), syncReady: bool(input.summary.readyForSync), missingCount: input.summary.missingRequirements.length };
      return { data: output, omitted };
    }
    const summary = input.summary;
    output.summary = { databaseReady: bool(summary.databaseConnected), snapshotReady: bool(summary.snapshotFieldsPresent), heavyScan: bool(summary.heavyScan), providerCalls: count(summary.smugApiCalls) };
    if (summary.heavyScan !== false || summary.smugApiCalls !== 0) throw new Error("Unexpected diagnostic work");
    if (!summary.databaseConnected) return { data: output, omitted };
    const samples = source => {
      if (!Array.isArray(source)) throw new Error("Invalid samples");
      if (source.length > 10) omitted = true;
      return source.slice(0, 10).map(item => {
        if (!diagnosticObject(item)) throw new Error("Invalid sample");
        const target = {};
        ["band_id", "band", "show_id", "name", "smug_sync_status", "smug_sync_error"].forEach(key => { if (["string", "number"].includes(typeof item[key])) target[key] = typeof item[key] === "string" ? text(item[key]) : item[key]; });
        ["date", "smug_last_synced_at"].forEach(key => {
          if (item[key] === undefined) return;
          if (item[key] === null) target[key] = null;
          else if (parseAdminTimestamp(item[key]) || typeof item[key] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item[key]) && parseAdminTimestamp(item[key] + "T00:00:00Z")) target[key] = item[key];
          else omitted = true;
        });
        return target;
      });
    };
    const finding = source => { if (!diagnosticObject(source)) throw new Error("Invalid finding"); const target = { count: count(source.count), samples: source.samples === undefined ? [] : samples(source.samples) }; if (typeof source.meaning === "string") target.meaning = text(source.meaning); return target; };
    const age = source => {
      if (source === null) return null;
      if (!diagnosticObject(source)) throw new Error("Invalid age");
      const target = { latest_synced_at: timestamp(source.latest_synced_at), oldest_synced_at: timestamp(source.oldest_synced_at) };
      ["synced_rows", "never_synced_rows", "stale_7d_rows", "stale_30d_rows"].forEach(key => { target[key] = count(source[key]); }); return target;
    };
    ["bands", "shows"].forEach(name => {
      const source = input[name];
      if (!diagnosticObject(source)) throw new Error("Invalid archive context");
      const target = { tablePresent: bool(source.tablePresent) }; output[name] = target;
      if (!source.tablePresent) return;
      const findingKeys = name === "bands" ? ["missingSmugFolder", "missingSyncData"] : ["missingPosterOrShowUrl", "missingSyncData"];
      findingKeys.forEach(key => { target[key] = finding(source[key]); });
      if (!Array.isArray(source.syncStatus)) throw new Error("Invalid sync distribution");
      if (source.syncStatus.length > 50) omitted = true;
      target.syncStatus = source.syncStatus.slice(0, 50).map(item => { if (!diagnosticObject(item)) throw new Error("Invalid sync state"); return { status: text(item.status), count: count(item.count) }; });
      target.snapshotAge = age(source.snapshotAge);
      if (name === "shows") {
        target.showUrlColumnPresent = bool(source.showUrlColumnPresent);
        if (source.rawSheetColumnPresent !== undefined) target.rawSheetColumnPresent = bool(source.rawSheetColumnPresent);
        if (source.coverage !== undefined) {
          target.coverage = source.coverage === null ? null : {};
          if (target.coverage !== null) { if (!diagnosticObject(source.coverage)) throw new Error("Invalid coverage"); ["total_shows", "resolved_shows", "unresolved_shows", "skipped_logo_sources", "skipped_venue_logo_sources", "missing_image_key", "missing_album_key", "missing_cover_image", "never_synced", "stale_syncs_30d"].forEach(key => { target.coverage[key] = count(source.coverage[key]); }); }
        }
        ["unresolved", "missingCoverImage", "posterFallbackUsage"].forEach(key => { if (source[key] !== undefined) target[key] = finding(source[key]); });
      }
    });
    return { data: output, omitted };
  }
  function interpretSmugReport(spec, data) {
    if (data.ok !== true) return { state: "Error", reason: "SmugMug returned an error.", issues: null, facts: [] };
    const tablesReady = ["music_bands", "music_shows"].every(name => data.snapshot.tables[name]?.tablePresent === true && Object.values(data.snapshot.tables[name].fields).every(value => value === true));
    let unavailable = !data.snapshot.present || data.snapshot.missingCount > 0 || !tablesReady, warning = data.warningCount > 0, error = false, checks = 0;
    const facts = [["Snapshot fields ready", data.snapshot.present ? "Yes" : "No"], ["Missing snapshot fields", data.snapshot.missingCount], ["Reported warnings", data.warningCount]];
    if (spec.category === "config") {
      const config = data.configuration, helper = data.helper;
      unavailable ||= !config.apiReady || !config.nicknameReady || !config.configured || !helper.available || !helper.requestReady || !helper.urlReady || !data.readiness.diagnosticsCapable;
      warning ||= !config.userAgentReady || !data.readiness.syncReady || config.missingCount > 0 || data.readiness.missingCount > 0;
      facts.push(["API configuration present", config.apiReady ? "Yes" : "No"], ["Nickname configuration present", config.nicknameReady ? "Yes" : "No"], ["Configured", config.configured ? "Yes" : "No"], ["User agent present", config.userAgentReady ? "Yes" : "No"], ["Helper available", helper.available ? "Yes" : "No"], ["Ready for sync", data.readiness.syncReady ? "Yes" : "No"], ["Missing requirements", data.readiness.missingCount]);
    } else {
      unavailable ||= !data.summary.databaseReady;
      warning ||= data.summary.snapshotReady !== data.snapshot.present;
      facts.push(["Database connected", data.summary.databaseReady ? "Yes" : "No"], ["SmugMug API calls", data.summary.providerCalls]);
      ["bands", "shows"].forEach(name => {
        const source = data[name];
        if (!source) return;
        unavailable ||= !source.tablePresent;
        Object.entries(source).forEach(([key, finding]) => {
          if (diagnosticObject(finding) && diagnosticCount(finding.count)) {
            const label = key === "missingPosterOrShowUrl" ? "Source findings" : key.replace(/([A-Z])/g, " $1");
            facts.push([`${diagnosticLabel(name)} · ${label}`, finding.count]); if (finding.count > 0) checks += 1;
          }
        });
        source.syncStatus?.forEach(item => { facts.push([`${diagnosticLabel(name)} · Sync ${item.status}`, item.count]); if (item.count > 0 && !["resolved", "synced"].includes(item.status)) checks += 1; if (item.count > 0 && ["error", "failed"].includes(item.status)) error = true; });
        if (source.snapshotAge) Object.entries(source.snapshotAge).forEach(([key, value]) => {
          facts.push([`${diagnosticLabel(name)} · ${diagnosticLabel(key)}`, key.endsWith("_at") ? formatAdminDateTime(value, "Not recorded") : value]);
          if (["never_synced_rows", "stale_7d_rows", "stale_30d_rows"].includes(key) && value > 0) checks += 1;
        });
        else if (source.tablePresent) warning = true;
        if (source.coverage) Object.entries(source.coverage).forEach(([key, value]) => { facts.push([`Shows · ${diagnosticLabel(key)}`, value]); if (!["total_shows", "resolved_shows"].includes(key) && value > 0) checks += 1; });
      });
      warning ||= checks > 0;
    }
    facts.push(["Report generated", formatAdminDateTime(data.generatedAt)]);
    return { state: error ? "Error" : unavailable ? "Unavailable" : warning ? "Warning" : "Healthy", reason: error ? "Snapshot errors require review." : unavailable ? "SmugMug prerequisites are unavailable." : warning ? "SmugMug findings require review." : spec.category === "config" ? "Configuration prerequisites are present." : "Snapshot checks report no findings.", issues: `Checks with findings: ${checks}`, facts };
  }
  function smugReportDetails(data) {
    const details = ["Limited redacted projection: private/provider fields and URLs are omitted."];
    ["error", "code", "message"].forEach(key => { if (typeof data[key] === "string") details.push(`Backend ${key}: ${data[key]}`); });
    data.warnings?.slice(0, 20).forEach(warning => details.push(`Backend warning: ${warning}`));
    ["bands", "shows"].forEach(name => {
      const source = data[name]; if (!source) return;
      Object.entries(source).forEach(([key, finding]) => {
        if (!diagnosticObject(finding) || !Array.isArray(finding.samples)) return;
        if (finding.meaning) details.push(`${diagnosticLabel(name)} · Source meaning: ${finding.meaning}`);
        finding.samples.slice(0, 5).forEach(sample => details.push(`${diagnosticLabel(name)} · ${key}: ${Object.entries(sample).map(([field, value]) => `${diagnosticLabel(field)}: ${field.endsWith("_at") || field === "date" && parseAdminTimestamp(value) ? formatAdminDateTime(value, "Not recorded") : String(value)}`).join(" · ")}`));
        if (finding.samples.length > 5) details.push("Further projected samples are omitted from these details. See Technical Response.");
      });
    });
    return details;
  }

  function interpretDiagnostic(spec, data) {
    if (spec.section === "smug") return interpretSmugReport(spec, data);
    let report;
    if (spec.section === "global") {
      if (!diagnosticObject(data) || data.ok !== true || !diagnosticObject(data.summary) || !diagnosticObject(data.database)) throw new Error("Invalid overview");
      const summary = data.summary;
      if (![summary.total_music_issues, summary.total_wrestling_issues, summary.total_warnings].every(diagnosticCount) ||
          ![summary.overall_status, summary.music_status, summary.wrestling_status].every(status => ["ok", "warnings", "issues"].includes(status)) ||
          typeof data.database.database_connected !== "boolean" || !Array.isArray(data.database.missing_tables) ||
          !data.database.missing_tables.every(table => typeof table === "string")) throw new Error("Invalid overview context");
      const music = diagnosticDomain(data.music, "music"), wrestling = diagnosticDomain(data.wrestling, "wrestling");
      report = { unavailable: !data.database.database_connected || data.database.missing_tables.length > 0 || music.unavailable || wrestling.unavailable,
        error: [summary.overall_status, summary.music_status, summary.wrestling_status].includes("issues") || summary.total_music_issues > 0 || summary.total_wrestling_issues > 0 || music.error || wrestling.error,
        findings: [summary.overall_status, summary.music_status, summary.wrestling_status].includes("warnings") || summary.total_music_issues > 0 || summary.total_wrestling_issues > 0 || summary.total_warnings > 0 || music.findings || wrestling.findings || Array.isArray(data.warnings) && data.warnings.length > 0,
        findingCounters: null, issueCount: summary.total_music_issues + summary.total_wrestling_issues,
        facts: [["Music issues", summary.total_music_issues], ["Wrestling issues", summary.total_wrestling_issues], ["Reported warnings", summary.total_warnings],
          ["Music status", summary.music_status], ["Wrestling status", summary.wrestling_status], ["Missing tables", data.database.missing_tables.length],
          ...music.facts.map(([label, value]) => [`Music · ${label}`, value]), ...wrestling.facts.map(([label, value]) => [`Wrestling · ${label}`, value])] };
    } else report = diagnosticDomain(data, spec.section, spec.category);
    return { state: report.error ? "Error" : report.unavailable ? "Unavailable" : report.findings ? "Warning" : "Healthy",
      reason: report.error ? "Errors require review." : report.unavailable ? "Required context is unavailable." : report.importUnverified ? "Import history is unverified." : report.findings ? "Warnings require review." : "No findings reported in verified checks.",
      issues: diagnosticCount(report.issueCount) ? `Reported issues: ${report.issueCount}` : diagnosticCount(report.findingCounters) ? `Checks with findings: ${report.findingCounters}` : null,
      facts: report.facts };
  }
  async function checkDiagnostic(spec, run) {
    const ownController = new AbortController(); run.controllers.add(ownController);
    const started = performance.now(), privateToken = bearer; let timedOut = false, http = null;
    const timer = setTimeout(() => { timedOut = true; ownController.abort(); }, 15000); run.timers.add(timer);
    let result = { state: "Unavailable", reason: "The diagnostic request could not be verified.", facts: [], details: [], technical: null, issues: null };
    try {
      const response = await fetch(`https://vmpix-data.onrender.com${spec.path}`, {
        method: "GET", headers: { Accept: "application/json", "X-V3-Admin-Request": "1", Authorization: `Bearer ${privateToken}` },
        credentials: "omit", mode: "cors", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer", signal: ownController.signal
      });
      http = response.status;
      if (http === 401 || http === 403) {
        if (diagnosticCurrent(run)) {
          cancelDiagnostics(); clearSession(); clearPassword();
          present("idle", http === 401 ? "Your session has expired or ended. Connect again." : "Access denied. Connect again to continue.");
        }
        try { await response.body?.cancel(); } catch { /* No raw error body is displayed. */ }
      } else {
        const parsed = await boundedEndpointJson(response, run, ownController);
        if (!response.ok) result = { ...result, state: "Error", reason: `HTTP ${http}: report unavailable.` };
        if (parsed.unavailable) result.reason = "Response exceeds the 128 KiB safety limit.";
        else if (parsed.unsupported) { result.reason = "This browser cannot safely read a bounded response."; ownController.abort(); }
        else if (parsed.invalid) { result = { ...result, state: "Error", reason: "The diagnostic response was not valid JSON." }; ownController.abort(); }
        else {
          const projection = spec.section === "smug" ? projectSmugReport(spec, parsed.data) : { data: parsed.data, omitted: false };
          const safe = sanitizeDiagnosticResponse(projection.data, privateToken);
          safe.omitted ||= projection.omitted;
          result.technical = safe.text;
          if (safe.data === null) result.reason = "Report exceeds the safe display limit.";
          else {
            result.details = diagnosticDetails(safe.data, spec);
            if (safe.omitted || safe.unverified) result.details.push("Response content was omitted by safety limits; the displayed report is incomplete.");
            if (response.ok) result = { ...result, ...interpretDiagnostic(spec, safe.data) };
            if (safe.omitted || safe.unverified) {
              if (result.state === "Healthy") { result.state = "Warning"; result.reason = "The displayed report is incomplete."; }
            }
          }
        }
      }
    } catch {
      if (timedOut) result.reason = "The request exceeded 15 seconds.";
      else if (!ownController.signal.aborted && http !== null) result = { ...result, state: "Error", reason: "The response did not match this diagnostic contract." };
    } finally {
      clearTimeout(timer); run.timers.delete(timer); run.controllers.delete(ownController);
    }
    return { ...result, http, elapsed: performance.now() - started, checkedAt: new Date().toISOString() };
  }
  async function runDiagnostics(ids) {
    if (diagnosticsRun || signalBusy || monitorRun || musicStatusRun || queryRun) return;
    if (!prepareStationEntry() || !diagnosticsAllowed()) return;
    const supported = ids.filter(id => diagnosticCatalog.some(spec => spec.id === id && spec.supported));
    if (supported.length === 0 || supported.length !== new Set(supported).size) return;
    // Collapse only refreshed technical views within this explicit user action, before async content changes.
    supported.forEach(id => diagnosticRows.get(id)?.querySelectorAll(".admin-diagnostic__technical, .admin-diagnostic__technical details").forEach(view => { view.open = false; }));
    const run = { generation: ++diagnosticsGeneration, ids: supported, cursor: 0, completed: 0, controllers: new Set(), readers: new Set(), timers: new Set() };
    diagnosticsRun = run;
    supported.forEach(id => {
      const spec = diagnosticCatalog.find(item => item.id === id);
      diagnosticResults.set(id, { ...uncheckedDiagnostic(spec), state: "Checking", reason: "Queued for this diagnostic…" });
      renderDiagnostic(id);
    });
    renderDiagnosticTotals();
    updateStationControl();
    diagnosticsProgress.textContent = `0 / ${supported.length} supported diagnostics checked`;
    async function worker() {
      while (run.cursor < supported.length && diagnosticCurrent(run)) {
        const id = supported[run.cursor++], spec = diagnosticCatalog.find(item => item.id === id);
        diagnosticResults.set(id, { ...uncheckedDiagnostic(spec), state: "Checking", reason: "Checking this diagnostic…" });
        renderDiagnostic(id); renderDiagnosticTotals();
        const result = await checkDiagnostic(spec, run);
        if (!diagnosticCurrent(run)) return;
        diagnosticResults.set(id, result); renderDiagnostic(id); run.completed += 1;
        diagnosticsProgress.textContent = `${run.completed} / ${supported.length} supported diagnostics checked`;
        renderDiagnosticTotals();
      }
    }
    await Promise.all(Array.from({ length: Math.min(2, supported.length) }, worker));
    if (!diagnosticCurrent(run)) return;
    diagnosticsRun = null;
    const completed = new Date(); diagnosticsCompleted.dateTime = completed.toISOString();
    diagnosticsCompleted.textContent = formatAdminDateTime(completed);
    diagnosticsCompleted.title = formatAdminDateTime(completed);
    diagnosticsProgress.textContent = `Complete: ${run.completed} / ${supported.length} checked`;
    updateStationControl();
  }
  diagnosticsAll?.addEventListener("click", () => runDiagnostics(diagnosticCatalog.filter(spec => spec.supported).map(spec => spec.id)));
  diagnosticsPanel?.querySelectorAll("[data-admin-diagnostic-category]").forEach(button => button.addEventListener("click", () =>
    runDiagnostics(diagnosticCatalog.filter(spec => spec.supported && spec.group === button.dataset.adminDiagnosticCategory).map(spec => spec.id))));
  diagnosticCatalog.filter(spec => spec.supported).forEach(spec => diagnosticRows.get(spec.id)?.querySelector("[data-admin-diagnostic-run]")?.addEventListener("click", () => runDiagnostics([spec.id])));

  // Public status is a separate manual check; it is never part of diagnostic Run All.
  const musicStatusPanel = host.querySelector("[data-admin-music-status]");
  const musicStatusCheck = musicStatusPanel?.querySelector("[data-admin-music-status-check]");
  const musicStatusRow = musicStatusPanel?.querySelector("[data-admin-music-status-report]");
  let musicStatusGeneration = 0, musicStatusRun = null;
  let musicStatusResult = uncheckedMusicStatus();
  function uncheckedMusicStatus(reason = "No status check has run.") {
    return { state: "Not Checked", http: null, elapsed: null, checkedAt: null, warnings: null, reason, facts: [], details: [], technical: null };
  }
  function musicStatusAllowed() { return signalAllowed() && musicStatusPanel && musicStatusCheck && musicStatusRow; }
  function updateMusicStatusControl() {
    if (!musicStatusCheck) return;
    musicStatusCheck.disabled = !musicStatusAllowed() || signalBusy || monitorRun !== null || diagnosticsRun !== null || musicStatusRun !== null || queryRun !== null;
    musicStatusCheck.setAttribute("aria-busy", String(musicStatusRun !== null));
    updateQueryControls();
  }
  function renderMusicStatus() {
    if (!musicStatusRow) return;
    const result = musicStatusResult, technical = musicStatusRow.querySelector(".admin-diagnostic__technical"), checking = result.state === "Checking";
    if (checking && technical.contains(document.activeElement)) document.activeElement.blur();
    technical.toggleAttribute("inert", checking);
    ["aria-disabled", "aria-busy"].forEach(attribute => { if (checking) technical.setAttribute(attribute, "true"); else technical.removeAttribute(attribute); });
    technical.querySelectorAll("summary").forEach(summary => {
      if (checking) { summary.setAttribute("aria-disabled", "true"); summary.setAttribute("tabindex", "-1"); }
      else { summary.removeAttribute("aria-disabled"); summary.removeAttribute("tabindex"); }
    });
    musicStatusRow.dataset.diagnosticState = result.state;
    musicStatusRow.querySelector("[data-diagnostic-state]").textContent = result.state;
    musicStatusRow.querySelector("[data-diagnostic-http]").textContent = result.http === null ? "HTTP —" : `HTTP ${result.http}`;
    musicStatusRow.querySelector("[data-diagnostic-time]").textContent = result.elapsed === null ? "Time —" : `Time ${Math.round(result.elapsed)} ms`;
    musicStatusRow.querySelector("[data-music-status-reason]").textContent = result.reason;
    musicStatusRow.querySelector("[data-music-status-warnings]").textContent = result.warnings === null ? "Reported warnings: —" : `Reported warnings: ${result.warnings}`;
    const checked = musicStatusRow.querySelector("[data-music-status-checked]");
    checked.textContent = result.checkedAt === null ? "—" : formatAdminDateTime(result.checkedAt);
    if (result.checkedAt === null) { checked.removeAttribute("datetime"); checked.removeAttribute("title"); }
    else { checked.dateTime = result.checkedAt; checked.title = formatAdminDateTime(result.checkedAt); }
    const facts = musicStatusRow.querySelector("[data-music-status-facts]"); facts.replaceChildren();
    result.facts.forEach(([label, value]) => { const term = document.createElement("dt"), detail = document.createElement("dd"); term.textContent = label; detail.textContent = String(value); facts.append(term, detail); });
    facts.hidden = result.facts.length === 0;
    const details = musicStatusRow.querySelector("[data-music-status-details]"); details.replaceChildren();
    result.details.forEach(text => { const item = document.createElement("li"); item.textContent = text; details.appendChild(item); });
    musicStatusRow.querySelector("[data-music-status-json]").textContent = result.technical === null ? "No report available." : result.technical;
  }
  function cancelMusicStatus() {
    musicStatusGeneration += 1;
    const run = musicStatusRun; musicStatusRun = null;
    if (run) {
      run.timers.forEach(clearTimeout); run.controllers.forEach(item => item.abort());
      run.readers.forEach(reader => { reader.cancel().catch(() => {}); });
      if (musicStatusResult.state === "Checking") { musicStatusResult = uncheckedMusicStatus("Check canceled before verification."); renderMusicStatus(); }
    }
    updateStationControl();
  }
  function resetMusicStatus() { cancelMusicStatus(); musicStatusResult = uncheckedMusicStatus(); renderMusicStatus(); }
  function musicStatusCurrent(run) {
    if (musicStatusRun !== run || run.generation !== musicStatusGeneration) return false;
    if (!signalAllowed()) { cancelMusicStatus(); prepareStationEntry(); return false; }
    return true;
  }
  function interpretMusicStatus(data) {
    const categories = ["bands", "shows", "people", "venues"], quality = ["venuesMissingGps", "venuesMissingLogo", "showsMissingPoster", "peopleMissingBands", "bandsMissingStatus"];
    const timestamp = value => typeof value === "string" && (value === "" || expiry(value) !== 0);
    if (!diagnosticObject(data) || data.ok !== true || data.route !== "/api/status/music" || !timestamp(data.generatedAt) || data.generatedAt === "" ||
        !diagnosticObject(data.database) || typeof data.database.connected !== "boolean" || !diagnosticObject(data.tables) ||
        !diagnosticObject(data.counts) || !diagnosticObject(data.imports) || !diagnosticObject(data.dataQuality) ||
        !Array.isArray(data.warnings) || !data.warnings.every(warning => typeof warning === "string") ||
        categories.some(category => typeof data.tables[`music_${category}`] !== "boolean" || !diagnosticCount(data.counts[category]) || !timestamp(data.imports[`${category}LastImport`])) ||
        quality.some(key => !diagnosticCount(data.dataQuality[key]))) throw new Error("Invalid music status");
    const unavailable = !data.database.connected || categories.some(category => !data.tables[`music_${category}`]);
    const findings = data.warnings.length > 0 || quality.some(key => data.dataQuality[key] > 0);
    const facts = [["Database connected", data.database.connected ? "Yes" : "No"]];
    categories.forEach(category => {
      facts.push([`${diagnosticLabel(category)} table`, data.tables[`music_${category}`] ? "Available" : "Unavailable"],
        [`${diagnosticLabel(category)} records`, data.counts[category]], [`${diagnosticLabel(category)} · Latest logged import`, formatAdminDateTime(data.imports[`${category}LastImport`], "Not recorded")]);
    });
    const qualityLabels = { venuesMissingGps: "Venues missing GPS", venuesMissingLogo: "Venues missing logo", showsMissingPoster: "Shows missing poster", peopleMissingBands: "People missing bands", bandsMissingStatus: "Bands missing status" };
    quality.forEach(key => facts.push([qualityLabels[key], data.dataQuality[key]]));
    facts.push(["Backend generated at", formatAdminDateTime(data.generatedAt)]);
    return { state: unavailable ? "Unavailable" : findings ? "Warning" : "Healthy",
      reason: unavailable ? "Required music context is unavailable." : findings ? "Music status has warnings." : "Music status is operational.",
      warnings: data.warnings.length, facts, details: data.warnings.slice(0, 20).map(warning => `Backend warning: ${warning}`) };
  }
  async function checkMusicStatus() {
    if (musicStatusRun || signalBusy || monitorRun || diagnosticsRun || queryRun) return;
    if (!prepareStationEntry() || !musicStatusAllowed()) return;
    musicStatusRow.querySelectorAll(".admin-diagnostic__technical, .admin-diagnostic__technical details").forEach(view => { view.open = false; });
    const run = { generation: ++musicStatusGeneration, controllers: new Set(), readers: new Set(), timers: new Set() };
    const ownController = new AbortController(); run.controllers.add(ownController); musicStatusRun = run;
    musicStatusResult = { ...uncheckedMusicStatus("Checking the public music status…"), state: "Checking" }; renderMusicStatus(); updateStationControl();
    const started = performance.now(); let timedOut = false, http = null;
    const timer = setTimeout(() => { timedOut = true; ownController.abort(); }, 15000); run.timers.add(timer);
    let result = { ...uncheckedMusicStatus("The status request could not be verified."), state: "Unavailable" };
    try {
      const response = await fetch("https://vmpix-data.onrender.com/api/status/music", {
        method: "GET", headers: { Accept: "application/json" }, credentials: "omit", mode: "cors", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer", signal: ownController.signal
      });
      http = response.status;
      if (!response.ok) result = { ...result, state: "Error", reason: `HTTP ${http}: music status unavailable.` };
      const parsed = await boundedEndpointJson(response, run, ownController);
      if (parsed.unavailable) result.reason = "Response exceeds the 128 KiB safety limit.";
      else if (parsed.unsupported) { result.reason = "This browser cannot safely read a bounded response."; ownController.abort(); }
      else if (parsed.invalid) { result = { ...result, state: "Error", reason: "The status response was not valid JSON." }; ownController.abort(); }
      else {
        const safe = sanitizeDiagnosticResponse(parsed.data, bearer); result.technical = safe.text;
        if (safe.data === null) result.reason = "Report exceeds the safe display limit.";
        else {
          if (response.ok) result = { ...result, ...interpretMusicStatus(safe.data) };
          else ["code", "error", "message"].forEach(key => { if (typeof safe.data[key] === "string") result.details.push(`Backend ${key}: ${safe.data[key]}`); });
          if (safe.omitted || safe.unverified) {
            result.warnings = null;
            result.details.push("Response content was omitted by safety limits; this report is incomplete.");
            if (result.state === "Healthy") { result.state = "Warning"; result.reason = "The displayed status is incomplete."; }
          }
          if (Array.isArray(safe.data.warnings) && safe.data.warnings.length > 20) result.details.push("Further backend warnings are omitted from these details. See the bounded Technical Response.");
        }
      }
    } catch {
      if (timedOut) result.reason = "The request exceeded 15 seconds.";
      else if (!ownController.signal.aborted && http !== null) result = { ...result, state: "Error", reason: "The music status contract was not verified." };
    } finally {
      clearTimeout(timer); run.timers.delete(timer); run.controllers.delete(ownController);
    }
    if (!musicStatusCurrent(run)) return;
    musicStatusRun = null;
    musicStatusResult = { ...result, http, elapsed: performance.now() - started, checkedAt: new Date().toISOString() };
    renderMusicStatus(); updateStationControl();
  }
  musicStatusCheck?.addEventListener("click", checkMusicStatus);

  // The explorer builds only allowlisted public archive GETs; it never sends the Admin bearer.
  const queryCatalog = Object.freeze([{"id":"music-bands","archive":"music","label":"Bands","path":"/api/music/bands/db","rows":"data","title":"band","filters":["region","status"],"sorts":["band","band_id","region","status","created_at","updated_at"],"tokens":[],"defaultSort":"band","defaultDir":"asc","fields":[["band_id","Band ID"],["region","Region"],["location","Location"],["state","State"],["status","Status"]]},{"id":"music-shows","archive":"music","label":"Shows","path":"/api/music/shows/db","rows":"data","title":"name","filters":["state","city","venue_id","venue","band"],"sorts":["show_id","name","date","venue_id","venue","city","state","created_at","updated_at"],"tokens":[],"defaultSort":"date","defaultDir":"desc","fields":[["show_id","Show ID"],["date","Event date"],["venue_id","Venue ID"],["venue","Venue"],["city","City"],["state","State"],["smug_sync_status","Snapshot status"],["smug_last_synced_at","Snapshot updated","timestamp"]]},{"id":"music-people","archive":"music","label":"People","path":"/api/music/people/db","rows":"data","title":"name","filters":["category","band","instrument","association"],"sorts":["person_id","name","category","created_at","updated_at"],"tokens":[],"defaultSort":"name","defaultDir":"asc","fields":[["person_id","Person ID"],["category","Category"]]},{"id":"music-venues","archive":"music","label":"Venues","path":"/api/music/venues/db","rows":"data","title":"venue","filters":["city","state","country","region","status"],"sorts":["venue_id","venue_key","venue","city","state","country","region","status","created_at","updated_at"],"tokens":[],"defaultSort":"venue","defaultDir":"asc","fields":[["venue_id","Venue ID"],["city","City"],["state","State"],["country","Country"],["region","Region"],["status","Status"],["latitude","Latitude"],["longitude","Longitude"]]},{"id":"wrestling-shows","archive":"wrestling","label":"Shows","path":"/api/wrestling/shows/db","rows":"data","title":"show_name","filters":["promotion","state","city","venue","venue_id","participant","winner","referee","person","tagged_person"],"sorts":["show_id","show_key","promotion","show_name","date","venue_id","venue","city","state","created_at","updated_at"],"tokens":[],"defaultSort":"date","defaultDir":"desc","fields":[["show_id","Show ID"],["show_key","Show key"],["promotion","Promotion"],["date","Event date"],["venue_id","Venue ID"],["venue","Venue"],["city","City"],["state","State"]]},{"id":"wrestling-people","archive":"wrestling","label":"People","path":"/api/wrestling/people/db","rows":"data","title":"name","filters":["category","team"],"sorts":["name_asc","name_desc","newest","oldest"],"tokens":["name_asc","name_desc","newest","oldest"],"defaultSort":"name_asc","defaultDir":"asc","fields":[["id","Person ID"],["slug","Slug"],["category","Category"],["event_count","Events"],["match_count","Matches"],["photo_count","Stored photos"],["photo_count_status","Photo count status"],["photo_count_source","Photo count source"]]},{"id":"wrestling-venues","archive":"wrestling","label":"Venues","path":"/api/wrestling/venues/db","rows":"items","title":"venue_name","filters":["city","state","country","region","venue_type","status"],"sorts":["name_asc","name_desc","city_asc","state_asc","name","venue_name","city","state"],"tokens":["name_asc","name_desc","city_asc","state_asc"],"defaultSort":"name_asc","defaultDir":"asc","fields":[["venue_id","Venue ID"],["city","City"],["state","State"],["country","Country"],["region","Region"],["venue_type","Venue type"],["status","Status"],["latitude","Latitude"],["longitude","Longitude"]]}].map(spec => Object.freeze({ ...spec,
    filters: Object.freeze(spec.filters), sorts: Object.freeze(spec.sorts), tokens: Object.freeze(spec.tokens),
    fields: Object.freeze(spec.fields.map(field => Object.freeze(field))) })));
  const queryPanel = host.querySelector("[data-admin-query-explorer]");
  const queryNodes = Object.fromEntries(["archive", "dataset", "type", "field", "value", "direction", "limit", "page", "run", "previous", "next", "state", "http", "time", "message", "path", "metadata", "checked", "records", "technical", "json"].map(key => [key, queryPanel?.querySelector(`[data-query-${key}]`)]));
  let queryGeneration = 0, queryRun = null;
  let queryResult = uncheckedQuery();
  function uncheckedQuery(message = "Choose a dataset and run a query.") {
    return { state: "Not Run", http: null, elapsed: null, checkedAt: null, message, snapshot: null, pagination: null, records: [], technical: null };
  }
  function queryAllowed() { return signalAllowed() && queryPanel && Object.values(queryNodes).every(Boolean); }
  function querySpec() { return queryCatalog.find(spec => spec.id === queryNodes.dataset?.value && spec.archive === queryNodes.archive?.value); }
  function queryLabel(value) { return ({ name_asc: "Name: ascending", name_desc: "Name: descending", city_asc: "City: ascending", state_asc: "State: ascending", newest: "Newest", oldest: "Oldest" })[value] || diagnosticLabel(value); }
  function queryOptions(select, values, selected) {
    select.replaceChildren();
    values.forEach(value => { const option = document.createElement("option"); option.value = value.value; option.textContent = value.label; select.appendChild(option); });
    select.value = selected;
  }
  function configureQuery(resetDataset = false) {
    if (!queryPanel || !Object.values(queryNodes).every(Boolean)) return;
    if (resetDataset) {
      const specs = queryCatalog.filter(spec => spec.archive === queryNodes.archive.value);
      queryOptions(queryNodes.dataset, specs.map(spec => ({ value: spec.id, label: spec.label })), specs[0]?.id || "");
    }
    const spec = querySpec();
    if (!spec) return;
    const type = queryNodes.type.value, fields = type === "filter" ? spec.filters : type === "sort" ? spec.sorts : [];
    queryOptions(queryNodes.field, fields.map(value => ({ value, label: queryLabel(value) })), type === "sort" ? spec.defaultSort : fields[0] || "");
    queryPanel.querySelector("[data-query-field-wrap]").hidden = !["filter", "sort"].includes(type);
    queryPanel.querySelector("[data-query-value-wrap]").hidden = !["search", "filter"].includes(type);
    queryPanel.querySelector("[data-query-value-wrap]").firstChild.textContent = type === "filter" ? "Filter value" : "Search text";
    queryNodes.direction.value = spec.defaultDir;
    queryNodes.value.value = "";
    queryNodes.page.value = "1";
    queryNodes.value.removeAttribute("aria-invalid");
    updateQueryDirection(); updateQueryControls();
  }
  function updateQueryDirection() {
    const spec = querySpec();
    if (!spec || !queryPanel) return;
    queryPanel.querySelector("[data-query-direction-wrap]").hidden = queryNodes.type.value !== "sort" || spec.tokens.includes(queryNodes.field.value);
  }
  function captureQuery() {
    const spec = querySpec(), type = queryNodes.type.value;
    if (!spec || !["search", "filter", "sort", "pagination"].includes(type)) throw new Error("Choose a supported dataset and test type.");
    const limitText = queryNodes.limit.value, pageText = queryNodes.page.value;
    if (!/^(1|5|10)$/.test(limitText) || !/^[1-9]\d{0,4}$/.test(pageText) || Number(pageText) > 10000) throw new Error("Choose a page size of 1, 5 or 10 and a page from 1 to 10000.");
    const limit = Number(limitText), page = Number(pageText), params = new URLSearchParams({ limit: String(limit), page: String(page) });
    if (type === "search" || type === "filter") {
      const value = queryNodes.value.value.trim();
      if (!value || value.length > 120 || /[\u0000-\u001f\u007f]/.test(value)) throw new Error("Enter 1–120 characters without control characters.");
      if (bearer && value.toLowerCase().includes(bearer.toLowerCase())) throw new Error("Enter valid public query text.");
      try { encodeURIComponent(value); } catch { throw new Error("Enter valid text for this query."); }
      if (type === "filter" && !spec.filters.includes(queryNodes.field.value)) throw new Error("Choose a supported filter field.");
      params.set(type === "search" ? "search" : queryNodes.field.value, value);
    } else if (type === "sort") {
      const field = queryNodes.field.value;
      if (!spec.sorts.includes(field)) throw new Error("Choose a supported sort field.");
      params.set("sort", field);
      if (!spec.tokens.includes(field)) {
        if (!["asc", "desc"].includes(queryNodes.direction.value)) throw new Error("Choose a supported sort direction.");
        params.set("dir", queryNodes.direction.value);
      }
    }
    return Object.freeze({ id: spec.id, archive: spec.archive, label: spec.label, type, page, limit, path: `${spec.path}?${params.toString()}` });
  }
  function queryMatchesSnapshot() {
    try { return queryResult.snapshot?.path === captureQuery().path; } catch { return false; }
  }
  function updateQueryControls() {
    if (!queryPanel || !Object.values(queryNodes).every(Boolean)) return;
    const blocked = !queryAllowed() || signalBusy || monitorRun !== null || diagnosticsRun !== null || musicStatusRun !== null || queryRun !== null;
    ["archive", "dataset", "type", "field", "value", "direction", "limit", "page", "run"].forEach(key => { queryNodes[key].disabled = blocked; });
    queryNodes.run.setAttribute("aria-busy", String(queryRun !== null));
    const paging = queryResult.pagination, matches = queryMatchesSnapshot();
    queryNodes.previous.disabled = blocked || !matches || !paging?.hasPrevPage || paging.page <= 1;
    queryNodes.next.disabled = blocked || !matches || !paging?.hasNextPage || paging.page >= 10000;
  }
  function renderQuery() {
    if (!queryPanel || !Object.values(queryNodes).every(Boolean)) return;
    const result = queryResult, checking = result.state === "Loading";
    queryPanel.dataset.queryState = result.state;
    queryNodes.state.textContent = result.state;
    queryNodes.http.textContent = result.http === null ? "HTTP —" : `HTTP ${result.http}`;
    queryNodes.time.textContent = result.elapsed === null ? "Time —" : `Time ${Math.round(result.elapsed)} ms`;
    queryNodes.message.textContent = result.message;
    queryNodes.path.textContent = result.snapshot?.path || "No query has run.";
    queryNodes.metadata.textContent = result.pagination ? `Returned records: ${result.pagination.count} · Total: ${result.pagination.total} · Page: ${result.pagination.page} / ${result.pagination.totalPages}` : "Returned records: — · Total: — · Page: —";
    queryNodes.checked.textContent = result.checkedAt ? formatAdminDateTime(result.checkedAt) : "—";
    if (result.checkedAt) { queryNodes.checked.dateTime = result.checkedAt; queryNodes.checked.title = formatAdminDateTime(result.checkedAt); }
    else { queryNodes.checked.removeAttribute("datetime"); queryNodes.checked.removeAttribute("title"); }
    if (checking && queryNodes.technical.contains(document.activeElement)) document.activeElement.blur();
    queryNodes.technical.toggleAttribute("inert", checking);
    ["aria-busy", "aria-disabled"].forEach(attribute => { if (checking) queryNodes.technical.setAttribute(attribute, "true"); else queryNodes.technical.removeAttribute(attribute); });
    const summary = queryNodes.technical.querySelector("summary");
    if (checking) { summary.setAttribute("tabindex", "-1"); summary.setAttribute("aria-disabled", "true"); }
    else { summary.removeAttribute("tabindex"); summary.removeAttribute("aria-disabled"); }
    queryNodes.json.textContent = result.technical || "No response available.";
    queryNodes.records.replaceChildren();
    result.records.forEach(record => {
      const article = document.createElement("article"), title = document.createElement("h4"), facts = document.createElement("dl");
      article.className = "admin-query__record"; title.textContent = record.title;
      record.facts.forEach(([label, value]) => { const term = document.createElement("dt"), detail = document.createElement("dd"); term.textContent = label; detail.textContent = value; facts.append(term, detail); });
      article.append(title, facts); queryNodes.records.appendChild(article);
    });
    updateQueryControls();
  }
  function cancelQuery() {
    queryGeneration += 1;
    const run = queryRun; queryRun = null;
    if (run) {
      run.timers.forEach(clearTimeout); run.controllers.forEach(item => item.abort());
      run.readers.forEach(reader => { reader.cancel().catch(() => {}); });
      queryResult = { ...uncheckedQuery("Query canceled before verification."), state: "Canceled", snapshot: run.snapshot }; renderQuery();
    }
    updateStationControl();
  }
  function resetQueryExplorer() { cancelQuery(); queryResult = uncheckedQuery(); renderQuery(); }
  function queryCurrent(run) {
    if (queryRun !== run || run.generation !== queryGeneration) return false;
    if (!queryAllowed()) { cancelQuery(); prepareStationEntry(); return false; }
    try { if (captureQuery().path !== run.snapshot.path) { cancelQuery(); return false; } }
    catch { cancelQuery(); return false; }
    return true;
  }
  function validateQueryPayload(data, snapshot, spec) {
    const routes = spec.id === "wrestling-people" ? [spec.path, "/api/wrestling/people"] : [spec.path];
    if (!diagnosticObject(data) || data.ok !== true || !routes.includes(data.route) || !Array.isArray(data[spec.rows]) || data[spec.rows].length > snapshot.limit ||
        !data[spec.rows].every(diagnosticObject) || !diagnosticCount(data.count) || data.count !== data[spec.rows].length ||
        !diagnosticCount(data.total) || data.total < data.count || data.page !== snapshot.page || data.limit !== snapshot.limit ||
        !diagnosticCount(data.totalPages) || data.totalPages !== Math.ceil(data.total / data.limit)) return null;
    const paging = data.meta?.pagination;
    if (!diagnosticObject(paging) || ["page", "limit", "count", "total", "totalPages"].some(key => paging[key] !== data[key]) ||
        typeof paging.hasNextPage !== "boolean" || typeof paging.hasPrevPage !== "boolean" ||
        paging.hasNextPage !== (data.page < data.totalPages) || paging.hasPrevPage !== (data.page > 1) ||
        data.hasNextPage !== undefined && data.hasNextPage !== paging.hasNextPage || data.hasPrevPage !== undefined && data.hasPrevPage !== paging.hasPrevPage) return null;
    return { page: data.page, limit: data.limit, count: data.count, total: data.total, totalPages: data.totalPages, hasNextPage: paging.hasNextPage, hasPrevPage: paging.hasPrevPage };
  }
  function queryRecords(spec, rows) {
    return rows.map((record, index) => {
      const titleValue = record[spec.title];
      let unsupported = titleValue !== undefined && titleValue !== null && !["string", "number"].includes(typeof titleValue);
      const title = typeof titleValue === "string" && titleValue.trim() || typeof titleValue === "number" && Number.isFinite(titleValue) ? String(titleValue) : `${spec.label} record ${index + 1}`;
      const facts = [];
      spec.fields.forEach(([field, label, type]) => {
        const value = record[field];
        if (value === undefined) return;
        if (value === null || value === "") facts.push([label, "Not recorded"]);
        else if (type === "timestamp") { const formatted = formatAdminDateTime(value, "Unavailable"); if (formatted === "Unavailable") unsupported = true; facts.push([label, formatted]); }
        else if (typeof value === "string" || typeof value === "number" && Number.isFinite(value)) facts.push([label, String(value)]);
        else { unsupported = true; facts.push([label, "Unsupported value omitted"]); }
      });
      const relationshipText = (items, render) => {
        if (!Array.isArray(items)) { if (items !== undefined && items !== null) unsupported = true; return null; }
        if (items.length === 0) return null;
        const rendered = items.slice(0, 4).map(render); if (rendered.some(value => value === null)) unsupported = true;
        const values = rendered.filter(Boolean);
        return values.length ? values.join(" · ") + (items.length > 4 ? " · Additional relationships not shown" : "") : null;
      };
      if (spec.id === "music-people" || spec.id === "music-shows") {
        const bands = relationshipText(record.bands, item => diagnosticObject(item) && typeof item.band === "string" ?
          item.band + (spec.id === "music-people" && typeof item.instrument === "string" && item.instrument ? ` (${item.instrument})` : "") : null);
        if (bands) facts.push(["Bands", bands]);
      }
      if (spec.id === "music-people") {
        const associations = relationshipText(record.associations, item => typeof item === "string" ? item : null);
        if (associations) facts.push(["Associations", associations]);
      }
      if (spec.id === "wrestling-people") {
        const teams = relationshipText(record.teams, item => typeof item === "string" ? item : null);
        if (teams) facts.push(["Teams", teams]);
      }
      return { title, facts, unsupported };
    });
  }
  function scrubQueryResponse(input) {
    let nodes = 0, characters = 0, omitted = false, redacted = false;
    const credentialKey = key => {
      const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      return normalized === "sig" || /oauth|consumerkey|consumersecret|accesskey|signature|auth|cookie|token|session|password|secret|apikey|credential|privatekey/.test(normalized);
    };
    const text = value => {
      const context = value.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (/oauth|consumerkey|consumersecret|accesskey|signature/.test(context)) { redacted = true; return "[REDACTED: provider credential context]"; }
      value = value.replace(/(?:https?:\/\/|\/\/)[^\s<>"']+|[^\s<>"']*\?[^\s<>"']+/gi, candidate => {
        try {
          const url = new URL(candidate, "https://query.invalid/");
          if (url.username || url.password || [...url.searchParams.keys()].some(credentialKey)) { redacted = true; return "[REDACTED URL]"; }
          return candidate;
        } catch { omitted = true; return "[OMITTED URL]"; }
      });
      // Whole-string omission never leaves a truncated credential fragment for the shared redactor.
      if (value.length > 1024 || characters + value.length > 36000) { omitted = true; return "[OMITTED: string safety limit]"; }
      characters += value.length;
      return value;
    };
    const visit = (value, depth) => {
      if (++nodes > 2500 || depth > 8) { omitted = true; return "[OMITTED: safety limit]"; }
      if (typeof value === "string") return text(value);
      if (value === null || typeof value === "boolean" || typeof value === "number") return value;
      if (Array.isArray(value)) {
        const result = value.slice(0, 100).map(item => visit(item, depth + 1));
        if (value.length > 100) { omitted = true; result.push("[OMITTED: item limit]"); }
        return result;
      }
      if (!diagnosticObject(value)) { omitted = true; return "[OMITTED: unsupported value]"; }
      const result = Object.create(null), keys = Object.keys(value);
      keys.slice(0, 100).forEach(key => {
        if (key.length > 128 || /[\u0000-\u001f\u007f]/.test(key) || ["__proto__", "constructor", "prototype"].includes(key)) { omitted = true; return; }
        if (credentialKey(key)) { result[key] = "[REDACTED]"; redacted = true; }
        else result[key] = visit(value[key], depth + 1);
      });
      if (keys.length > 100) { omitted = true; result["[OMITTED]"] = "Object safety limit"; }
      return result;
    };
    return { data: visit(input, 0), omitted, redacted };
  }
  function safeQueryCards(spec, rows) {
    let partial = false;
    const projections = rows.map(record => {
      const projection = Object.create(null), relationshipKeys = [], more = [];
      const scalar = value => {
        if (value === null || typeof value === "string" || typeof value === "number" && Number.isFinite(value)) return value;
        partial = true; return "[Unsupported value omitted]";
      };
      [spec.title, ...spec.fields.map(field => field[0])].forEach(key => { if (record[key] !== undefined) projection[key] = scalar(record[key]); });
      if (spec.id === "music-people" || spec.id === "music-shows") relationshipKeys.push("bands");
      if (spec.id === "music-people") relationshipKeys.push("associations");
      if (spec.id === "wrestling-people") relationshipKeys.push("teams");
      relationshipKeys.forEach(key => {
        if (record[key] === undefined || record[key] === null) return;
        if (!Array.isArray(record[key])) { partial = true; return; }
        if (record[key].length > 4) more.push(key);
        projection[key] = record[key].slice(0, 4).map(item => {
          if (key !== "bands") return scalar(item);
          if (!diagnosticObject(item)) { partial = true; return null; }
          const band = Object.create(null);
          if (item.band !== undefined) band.band = scalar(item.band);
          if (spec.id === "music-people" && item.instrument !== undefined) band.instrument = scalar(item.instrument);
          return band;
        });
      });
      const scrubbed = scrubQueryResponse(projection), safe = sanitizeDiagnosticResponse(scrubbed.data, bearer);
      partial ||= scrubbed.omitted || scrubbed.redacted || safe.omitted || safe.unverified;
      const data = diagnosticObject(safe.data) ? safe.data : Object.create(null);
      if (!diagnosticObject(safe.data)) partial = true;
      // Only already-scrubbed text can be shortened for a compact card.
      const shorten = value => {
        if (typeof value === "string") {
          if (value.length > 240) { partial = true; return value.slice(0, 240) + " [Preview shortened]"; }
          return value;
        }
        if (Array.isArray(value)) return value.map(shorten);
        if (diagnosticObject(value)) { const result = Object.create(null); Object.keys(value).forEach(key => { result[key] = shorten(value[key]); }); return result; }
        return value;
      };
      return { data: shorten(data), more };
    });
    const records = queryRecords(spec, projections.map(item => item.data));
    records.forEach((record, index) => {
      if (projections[index].more.length) record.facts.push(["Relationships", "Additional supplied relationships not shown."]);
      partial ||= record.unsupported;
    });
    return { records, partial };
  }
  async function runQuery(page = null) {
    if (queryRun || signalBusy || monitorRun || diagnosticsRun || musicStatusRun) return;
    if (!prepareStationEntry() || !queryAllowed()) return;
    if (page !== null) {
      if (!queryMatchesSnapshot() || !queryResult.pagination || !Number.isSafeInteger(page) || page < 1 || page > 10000 ||
          page === queryResult.pagination.page - 1 && !queryResult.pagination.hasPrevPage || page === queryResult.pagination.page + 1 && !queryResult.pagination.hasNextPage || Math.abs(page - queryResult.pagination.page) !== 1) return;
      queryNodes.page.value = String(page);
    }
    let snapshot;
    try { snapshot = captureQuery(); }
    catch (error) { queryResult = { ...uncheckedQuery(error.message), state: "Invalid" }; renderQuery(); return; }
    const spec = queryCatalog.find(item => item.id === snapshot.id);
    queryNodes.technical.open = false;
    const run = { generation: ++queryGeneration, snapshot, controllers: new Set(), readers: new Set(), timers: new Set() };
    const ownController = new AbortController(); run.controllers.add(ownController); queryRun = run;
    queryResult = { ...uncheckedQuery("Loading this public archive query…"), state: "Loading", snapshot }; renderQuery(); updateStationControl();
    const started = performance.now(); let timedOut = false, http = null;
    const timer = setTimeout(() => { timedOut = true; ownController.abort(); }, 15000); run.timers.add(timer);
    let result = { ...uncheckedQuery("The query could not be verified."), state: "Unavailable", snapshot };
    try {
      const response = await fetch(`https://vmpix-data.onrender.com${snapshot.path}`, {
        method: "GET", headers: { Accept: "application/json" }, credentials: "omit", mode: "cors", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer", signal: ownController.signal
      });
      http = response.status;
      const parsed = await boundedEndpointJson(response, run, ownController);
      if (parsed.unavailable) result.message = "Response exceeds the 128 KiB safety limit.";
      else if (parsed.unsupported) { result.message = "This browser cannot safely read a bounded response."; ownController.abort(); }
      else if (parsed.invalid) { result.state = "Error"; result.message = response.ok ? "The response was not valid JSON." : `HTTP ${http}: the archive query failed.`; ownController.abort(); }
      else {
        const paging = response.ok ? validateQueryPayload(parsed.data, snapshot, spec) : null;
        const previews = paging ? safeQueryCards(spec, parsed.data[spec.rows]) : null;
        const scrubbed = scrubQueryResponse(parsed.data);
        const safe = sanitizeDiagnosticResponse(scrubbed.data, bearer); result.technical = safe.text;
        safe.omitted ||= scrubbed.omitted;
        if (!response.ok) { result.state = "Error"; result.message = `HTTP ${http}: the archive query failed.`; }
        else if (!paging) { result.state = "Error"; result.message = "The archive response contract was not verified."; }
        else {
          const warnings = Array.isArray(parsed.data.meta?.warnings) && parsed.data.meta.warnings.length > 0 || Array.isArray(parsed.data.warnings) && parsed.data.warnings.length > 0;
          const records = previews.records;
          const limited = safe.omitted || safe.unverified || scrubbed.redacted || previews.partial || warnings;
          result = { ...result, state: limited ? "Partial" : paging.count === 0 ? "Empty" : "Results", pagination: paging,
            records, message: limited ? "Results are limited or include backend warnings. Review the redacted response." : paging.count === 0 ? "No records matched this query." : "Public archive results verified." };
        }
      }
    } catch {
      if (timedOut) result.message = "The query exceeded 15 seconds.";
      else if (!ownController.signal.aborted && http !== null) { result.state = "Error"; result.message = "The response did not match the archive format."; }
    } finally {
      clearTimeout(timer); run.timers.delete(timer); run.controllers.delete(ownController);
    }
    if (!queryCurrent(run)) return;
    queryRun = null;
    queryResult = { ...result, http, elapsed: performance.now() - started, checkedAt: new Date().toISOString() }; renderQuery(); updateStationControl();
  }
  const cancelEditedQuery = () => { if (queryRun) cancelQuery(); };
  queryNodes.archive?.addEventListener("change", () => { cancelEditedQuery(); configureQuery(true); queryResult = uncheckedQuery(); renderQuery(); });
  queryNodes.dataset?.addEventListener("change", () => { cancelEditedQuery(); configureQuery(); queryResult = uncheckedQuery(); renderQuery(); });
  queryNodes.type?.addEventListener("change", () => { cancelEditedQuery(); configureQuery(); });
  queryNodes.field?.addEventListener("change", () => {
    cancelEditedQuery();
    queryNodes.page.value = "1";
    if (queryNodes.type.value === "filter") queryNodes.value.value = "";
    updateQueryDirection(); updateQueryControls();
  });
  ["value", "direction", "limit"].forEach(key => queryNodes[key]?.addEventListener("input", () => { cancelEditedQuery(); queryNodes.page.value = "1"; updateQueryControls(); }));
  queryNodes.page?.addEventListener("input", () => { cancelEditedQuery(); updateQueryControls(); });
  ["value", "page"].forEach(key => queryNodes[key]?.addEventListener("keydown", event => {
    if (event.key !== "Enter" || event.isComposing || queryNodes[key].disabled || !queryAllowed()) return;
    event.preventDefault(); runQuery();
  }));
  queryNodes.run?.addEventListener("click", () => runQuery());
  queryNodes.previous?.addEventListener("click", () => runQuery(queryResult.pagination?.page - 1));
  queryNodes.next?.addEventListener("click", () => runQuery(queryResult.pagination?.page + 1));
  configureQuery(true); renderQuery();


  // Database Overview uses five fixed public read-only sources; response timestamps are not data updates.
  const databaseMetricCatalog = Object.freeze([
    { id: "music-bands", name: "Bands" }, { id: "music-shows", name: "Shows" },
    { id: "music-people", name: "People" }, { id: "music-venues", name: "Venues" },
    { id: "wrestling-shows", name: "Shows" }, { id: "wrestling-people", name: "People" }, { id: "wrestling-venues", name: "Venues" }
  ].map(item => Object.freeze(item)));
  const databaseSources = Object.freeze([
    { id: "connection", path: "/health/db", metrics: [] },
    { id: "music", path: "/api/music/telemetry", metrics: ["music-bands", "music-shows", "music-people", "music-venues"] },
    { id: "wrestling-shows", path: "/api/wrestling/shows/db?limit=1&page=1", metrics: ["wrestling-shows"] },
    { id: "wrestling-people", path: "/api/wrestling/people/db?limit=1&page=1", metrics: ["wrestling-people"] },
    { id: "wrestling-venues", path: "/api/wrestling/venues/db?limit=1&page=1", metrics: ["wrestling-venues"] }
  ].map(item => Object.freeze({ ...item, metrics: Object.freeze(item.metrics) })));
  const databaseOverview = databasePanel?.querySelector("[data-admin-database-overview]");
  const databaseRefresh = databasePanel?.querySelector("[data-database-refresh]");
  const databaseMessage = databasePanel?.querySelector("[data-database-message]");
  const databaseChecked = databasePanel?.querySelector("[data-database-checked]");
  const databaseConnectionNode = databasePanel?.querySelector("[data-database-connection]");
  const databaseVerified = databasePanel?.querySelector("[data-database-verified]");
  const databaseConnectionNote = databasePanel?.querySelector("[data-database-connection-note]");
  const databaseRows = new Map(databaseMetricCatalog.map(item => [item.id, databasePanel?.querySelector(`[data-database-metric="${item.id}"]`)]));
  const databaseMetrics = new Map(databaseMetricCatalog.map(item => [item.id, emptyDatabaseMetric()]));
  let databaseGeneration = 0, databaseRun = null, databaseAutoAttempted = false;
  let databaseLastChecked = null, databaseLastVerified = null, databaseConnection = "Not Checked";
  let databaseConnectionReason = "No connection check has run.";
  function emptyDatabaseMetric() { return { count: null, state: "Not Checked", reason: "No count check has run.", checkedAt: null }; }
  function databaseAllowed() {
    return canEnterStation() && stage.dataset.adminView === "database" && databasePanel && !databasePanel.hidden && !databasePanel.hasAttribute("inert") &&
      databaseOverview && databaseRefresh && databaseMessage && databaseChecked && databaseConnectionNode && databaseVerified && databaseConnectionNote &&
      [...databaseRows.values()].every(Boolean);
  }
  function updateDatabaseControl() {
    if (databaseRefresh) { databaseRefresh.disabled = !databaseAllowed() || databaseRun !== null; databaseRefresh.setAttribute("aria-busy", String(databaseRun !== null)); }
  }
  function databaseTime(node, value) {
    if (!node) return;
    node.textContent = value ? formatAdminDateTime(value) : "—";
    if (value) { node.dateTime = value; node.title = formatAdminDateTime(value); }
    else { node.removeAttribute("datetime"); node.removeAttribute("title"); }
  }
  function renderDatabaseMetric(id) {
    const row = databaseRows.get(id), result = databaseMetrics.get(id);
    if (!row || !result) return;
    row.dataset.databaseState = result.state;
    row.querySelector("[data-database-count]").textContent = result.count === null ? "—" : String(result.count);
    row.querySelector("[data-database-metric-state]").textContent = result.state;
    row.querySelector("[data-database-metric-note]").textContent = result.reason;
    if (result.checkedAt) row.setAttribute("aria-description", `Last count check: ${formatAdminDateTime(result.checkedAt)}. ${result.reason}`);
    else row.removeAttribute("aria-description");
  }
  function renderDatabaseConnection() {
    if (databaseConnectionNode) databaseConnectionNode.textContent = databaseConnection;
    if (databaseConnectionNote) databaseConnectionNote.textContent = databaseConnectionReason;
    databaseTime(databaseVerified, databaseLastVerified);
  }
  function cancelDatabaseOverview() {
    databaseGeneration += 1;
    const run = databaseRun; databaseRun = null;
    if (run) {
      run.timers.forEach(clearTimeout); run.controllers.forEach(item => item.abort());
      run.readers.forEach(reader => { reader.cancel().catch(() => {}); });
      databaseMetrics.forEach((result, id) => {
        if (["Checking", "Refreshing"].includes(result.state)) {
          databaseMetrics.set(id, { ...result, state: result.count === null ? "Canceled" : "Stale", reason: result.count === null ? "Count check canceled." : "Previous count; refresh canceled." });
          renderDatabaseMetric(id);
        }
      });
      if (databaseConnection === "Checking") { databaseConnection = "Unavailable"; databaseConnectionReason = "Connection check canceled."; renderDatabaseConnection(); }
      if (databaseMessage) databaseMessage.textContent = "Overview refresh canceled. Refresh to try again.";
    }
    updateDatabaseControl();
  }
  function resetDatabaseOverview() {
    cancelDatabaseOverview(); databaseAutoAttempted = false;
    databaseLastChecked = null; databaseLastVerified = null; databaseConnection = "Not Checked"; databaseConnectionReason = "No connection check has run.";
    databaseMetricCatalog.forEach(item => { databaseMetrics.set(item.id, emptyDatabaseMetric()); renderDatabaseMetric(item.id); });
    if (databaseOverview) databaseOverview.open = false;
    if (databaseMessage) databaseMessage.textContent = "Expand the overview to check its data.";
    databaseTime(databaseChecked, null); renderDatabaseConnection();
  }
  function databaseCurrent(run) {
    if (databaseRun !== run || run.generation !== databaseGeneration) return false;
    if (!databaseAllowed()) { cancelDatabaseOverview(); prepareStationEntry(); return false; }
    return true;
  }
  function interpretDatabaseSource(source, data) {
    if (!diagnosticObject(data) || data.ok !== true) return null;
    if (source.id === "connection") return data.database === "connected" && parseAdminTimestamp(data.time) ? { connected: true, counts: {} } : null;
    if (source.id === "music") {
      if (data.route !== "/api/music/telemetry" || !["live", "partial", "unavailable"].includes(data.status) || !diagnosticObject(data.totals)) return null;
      const counts = Object.create(null);
      source.metrics.forEach(id => { const value = data.totals[id.slice(6)]; counts[id] = diagnosticCount(value) ? value : null; });
      return { counts };
    }
    const spec = queryCatalog.find(item => item.id === source.id);
    const paging = spec && validateQueryPayload(data, { page: 1, limit: 1 }, spec);
    return paging ? { counts: { [source.id]: paging.total } } : null;
  }
  async function checkDatabaseSource(source, run) {
    const ownController = new AbortController(); run.controllers.add(ownController);
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; ownController.abort(); }, 15000); run.timers.add(timer);
    let result = null, reason = "The source could not be verified.", failureState = "Unavailable", http = null;
    try {
      const response = await fetch(`https://vmpix-data.onrender.com${source.path}`, {
        method: "GET", headers: { Accept: "application/json" }, credentials: "omit", mode: "cors", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer", signal: ownController.signal
      });
      http = response.status;
      if (!response.ok) { failureState = "Error"; reason = `HTTP ${response.status}: source unavailable.`; try { await response.body?.cancel(); } catch {} }
      else {
        const parsed = await boundedEndpointJson(response, run, ownController);
        if (parsed.unavailable) reason = "Response exceeds the 128 KiB limit.";
        else if (parsed.unsupported) { reason = "Bounded responses are unavailable in this browser."; ownController.abort(); }
        else if (parsed.invalid) { failureState = "Error"; reason = "The source response was not valid JSON."; ownController.abort(); }
        else { result = interpretDatabaseSource(source, parsed.data); if (!result) { failureState = "Error"; reason = "The source contract was not verified."; } }
      }
    } catch {
      if (timedOut) reason = "The source request exceeded 15 seconds.";
      else if (http !== null && !ownController.signal.aborted) { failureState = "Error"; reason = "The source contract was not verified."; }
    }
    finally { clearTimeout(timer); run.timers.delete(timer); run.controllers.delete(ownController); }
    return { result, reason, failureState, checkedAt: new Date().toISOString() };
  }
  function applyDatabaseSource(source, outcome) {
    if (source.id === "connection") {
      databaseConnection = outcome.result?.connected ? "Connected" : outcome.failureState || "Unavailable";
      if (outcome.result?.connected) databaseLastVerified = outcome.checkedAt;
      databaseConnectionReason = outcome.result?.connected ? "Database connection verified." : outcome.reason;
      renderDatabaseConnection();
    }
    source.metrics.forEach(id => {
      const previous = databaseMetrics.get(id), count = outcome.result?.counts[id];
      const verified = diagnosticCount(count);
      databaseMetrics.set(id, { count: verified ? count : previous.count, checkedAt: outcome.checkedAt,
        state: verified ? "Verified" : previous.count === null ? outcome.failureState || "Unavailable" : "Stale",
        reason: verified ? "Stored collection count." : previous.count !== null ? "Previous count; latest check failed." : outcome.result ? "This count is unavailable." : outcome.reason });
      renderDatabaseMetric(id);
    });
  }
  async function refreshDatabaseOverview() {
    if (databaseRun) return;
    if (!prepareStationEntry() || !databaseAllowed()) return;
    databaseAutoAttempted = true;
    const run = { generation: ++databaseGeneration, cursor: 0, completed: 0, controllers: new Set(), readers: new Set(), timers: new Set() };
    databaseRun = run;
    databaseMetrics.forEach((result, id) => { databaseMetrics.set(id, { ...result, state: result.count === null ? "Checking" : "Refreshing", reason: result.count === null ? "Checking stored count…" : "Previous count; refreshing…" }); renderDatabaseMetric(id); });
    databaseConnection = "Checking"; databaseConnectionReason = "Checking database connection…"; renderDatabaseConnection();
    databaseMessage.textContent = "Checking 0 of 5 sources…"; updateDatabaseControl();
    async function worker() {
      while (run.cursor < databaseSources.length && databaseCurrent(run)) {
        const source = databaseSources[run.cursor++], outcome = await checkDatabaseSource(source, run);
        if (!databaseCurrent(run)) return;
        applyDatabaseSource(source, outcome); run.completed += 1;
        databaseMessage.textContent = `Checking ${run.completed} of 5 sources…`;
      }
    }
    await Promise.all(Array.from({ length: 2 }, worker));
    if (!databaseCurrent(run)) return;
    databaseRun = null; databaseLastChecked = new Date().toISOString(); databaseTime(databaseChecked, databaseLastChecked);
    const incomplete = databaseConnection !== "Connected" || [...databaseMetrics.values()].some(result => result.state !== "Verified");
    databaseMessage.textContent = incomplete ? "Overview checked. Some data is unavailable or stale." : "Database overview checked.";
    updateDatabaseControl();
  }
  databaseOverview?.addEventListener("toggle", () => { if (databaseOverview.open && !databaseAutoAttempted) refreshDatabaseOverview(); });
  databaseRefresh?.addEventListener("click", refreshDatabaseOverview);


  function connectAction() {
    if (!available() || busy() || loginPanel.hidden || loginPanel.hasAttribute("inert")) return;
    if (!bearer) return login();
    if (state === "authenticated" || state === "logout-uncertain") return logout();
    return checkSession();
  }
  toggle.addEventListener("click", () => {
    if (!available() || password.disabled) return;
    const show = password.type === "password";
    password.type = show ? "text" : "password";
    toggle.setAttribute("aria-pressed", String(show));
    toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
    toggle.textContent = show ? "HIDE" : "SHOW";
  });
  connect.addEventListener("click", connectAction);
  deckLogout.addEventListener("click", () => {
    if (!deck.hidden && !deck.hasAttribute("inert")) logout();
  });
  apiLogout.addEventListener("click", () => {
    if (!apiPanel.hidden && !apiPanel.hasAttribute("inert")) logout();
  });
  databaseLogout?.addEventListener("click", () => {
    if (!databasePanel.hidden && !databasePanel.hasAttribute("inert")) logout();
  });
  password.addEventListener("keydown", (event) => {
    if (!available() || event.key !== "Enter" || event.isComposing || password.disabled) return;
    event.preventDefault(); connectAction();
  });
  window.addEventListener("pagehide", () => {
    cancelRequest(); clearSession(); clearPassword();
    resetPresentation(false);
    present("idle", "Enter your password to connect securely.");
  });
  clearPassword();
  present("idle", "Enter your password to connect securely.");
  window.V3AdminModule = Object.freeze({
    canEnterStation,
    prepareStationEntry,
    setStation(station) {
      requestedStation = ["api", "database"].includes(station) ? station : "deck";
      updateStationPresentation();
    },
    activate({ station = "deck" } = {}) {
      requestedStation = ["api", "database"].includes(station) ? station : "deck";
      cancelRequest(); active = true; clearPassword();
      present(bearer ? "unverified" : "idle", bearer ? "Checking your session…" : "Enter your password to connect securely.");
      if (bearer) checkSession();
    },
    deactivate() {
      active = false; cancelRequest();
      if (host.contains(document.activeElement)) document.activeElement.blur();
      clearPassword();
      present(bearer ? "unverified" : "idle", bearer ? "Verify your session on return." : "Enter your password to connect securely.");
    }
  });
})();
