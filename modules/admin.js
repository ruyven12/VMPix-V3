/* Admin owns its local login state; the bearer exists only in this document's memory. */
(function () {
  "use strict";
  const API = "https://vmpix-data.onrender.com/api/v3/admin/auth";
  const host = document.querySelector("[data-admin-shell]");
  const password = host?.querySelector("[data-admin-password]");
  const toggle = host?.querySelector("[data-admin-password-toggle]");
  const connect = host?.querySelector("[data-admin-connect]");
  const feedback = host?.querySelector("[data-admin-feedback]");
  if (!host || !password || !toggle || !connect || !feedback) return;
  let active = false;
  let bearer = null;
  let expiresAt = 0;
  let state = "idle";
  let generation = 0;
  let controller = null;

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
  function present(next, message) {
    state = next;
    password.disabled = busy() || bearer !== null;
    toggle.disabled = password.disabled;
    connect.disabled = busy();
    connect.setAttribute("aria-busy", String(busy()));
    connect.textContent = state === "connecting" ? "CONNECTING…" : state === "checking" ? "CHECKING…" :
      state === "logging-out" ? "LOGGING OUT…" : state === "authenticated" || state === "logout-uncertain" ?
        "LOGOUT" : bearer ? "RETRY" : "CONNECT";
    feedback.textContent = message;
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
        present("authenticated", "Authenticated. Your session is active.");
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
  function connectAction() {
    if (!available() || busy()) return;
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
  password.addEventListener("keydown", (event) => {
    if (!available() || event.key !== "Enter" || event.isComposing || password.disabled) return;
    event.preventDefault(); connectAction();
  });
  window.addEventListener("pagehide", () => {
    cancelRequest(); clearSession(); clearPassword();
    present("idle", "Enter your password to connect securely.");
  });
  clearPassword();
  present("idle", "Enter your password to connect securely.");
  window.V3AdminModule = Object.freeze({
    activate() {
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
