/* Admin owns its local login state; the bearer exists only in this document's memory. */
(function () {
  "use strict";
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
    if (shouldFocus && !(requestedStation === "api" && visualPhase === "ready")) focusTitle(deckTitle);
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
    renderPresentation(animateArrival);
    updateStationControl();
  }
  function clearSession() { bearer = null; expiresAt = 0; }
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
    if (!signalBusy) apiCheck.disabled = !signalAllowed() || monitorRun !== null;
    updateMonitorControls();
  }
  function updateStationPresentation(shouldFocus = true) {
    if (available() && state === "authenticated" && bearer && expiresAt <= Date.now()) {
      clearSession(); present("idle", "Your session has expired. Connect again."); return;
    }
    const wasApi = stage.dataset.adminView === "api";
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
        if (wasApi && shouldFocus) focusTitle(deckTitle);
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
    apiStatus.textContent = "AWAITING SIGNAL";
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
    if (!signalAllowed() || signalBusy || monitorRun !== null) return;
    const at = ++signalGeneration;
    const ownController = new AbortController();
    signalController = ownController;
    signalBusy = true;
    updateMonitorControls();
    apiCheck.disabled = true;
    apiCheck.setAttribute("aria-busy", "true");
    apiStatus.textContent = "ACQUIRING SIGNAL";
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
    apiVerified.textContent = completed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    apiVerified.title = `Most recent completed check: ${completed.toLocaleString()}`;
    apiResponse.textContent = elapsed === null ? "—" : `${Math.round(elapsed)} ms`;
    apiConnection.textContent = outcome === "connected" ? "CONNECTED" : outcome === "unavailable" ? "UNAVAILABLE" : "ERROR";
    apiStatus.textContent = outcome === "connected" ? "SIGNAL VERIFIED" : outcome === "unavailable" ? "SIGNAL UNAVAILABLE" : "CHECK FAILED";
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
    const disabled = !monitorAllowed() || signalBusy || monitorRun !== null;
    if (monitorAll) { monitorAll.disabled = disabled; monitorAll.setAttribute("aria-busy", String(monitorRun !== null)); }
    endpointRows.forEach(row => { const button = row?.querySelector("[data-admin-endpoint-check]"); if (button) button.disabled = disabled; });
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
    if (monitorTotals) monitorTotals.textContent = `Latest per endpoint: ${successful} successful · ${failed} failed · ${unavailable} unavailable`;
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
      if (monitorProgress) monitorProgress.textContent = `Canceled. ${run.completed}/${run.ids.length} checked.`;
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
    if (signalBusy || monitorRun) return;
    if (!prepareStationEntry() || !monitorAllowed()) return;
    if (ids.length === endpointCatalog.length) endpointCatalog.forEach(spec => { endpointResults.set(spec.id, uncheckedEndpoint()); renderEndpoint(spec.id); });
    const run = { generation: ++monitorGeneration, ids, cursor: 0, completed: 0, controllers: new Set(), readers: new Set(), timers: new Set() };
    monitorRun = run;
    updateStationControl(); updateMonitorControls(); renderMonitorTotals();
    if (monitorProgress) monitorProgress.textContent = `0/${ids.length} checked. Checking endpoints…`;
    async function worker() {
      while (run.cursor < ids.length && monitorCurrent(run)) {
        const id = ids[run.cursor++], spec = endpointCatalog.find(item => item.id === id);
        endpointResults.set(id, { state: "Checking", http: null, elapsed: null, reason: "Waiting for a verified response." });
        renderEndpoint(id); renderMonitorTotals();
        const result = await checkEndpoint(spec, run);
        if (!monitorCurrent(run)) return;
        endpointResults.set(id, result); renderEndpoint(id);
        run.completed += 1;
        if (monitorProgress) monitorProgress.textContent = `${run.completed}/${ids.length} checked.`;
        renderMonitorTotals();
      }
    }
    await Promise.all(Array.from({ length: Math.min(2, ids.length) }, worker));
    if (!monitorCurrent(run)) return;
    monitorRun = null;
    const completed = new Date();
    monitorCompleted.dateTime = completed.toISOString();
    monitorCompleted.textContent = completed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    monitorCompleted.title = completed.toLocaleString();
    monitorProgress.textContent = `Complete. ${run.completed}/${ids.length} checked.`;
    updateStationControl(); updateMonitorControls();
  }
  monitorAll?.addEventListener("click", () => runEndpointChecks(endpointCatalog.map(spec => spec.id)));
  endpointCatalog.forEach(spec => endpointRows.get(spec.id)?.querySelector("[data-admin-endpoint-check]")?.addEventListener("click", () => runEndpointChecks([spec.id])));

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
      requestedStation = station === "api" ? "api" : "deck";
      updateStationPresentation();
    },
    activate({ station = "deck" } = {}) {
      requestedStation = station === "api" ? "api" : "deck";
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
