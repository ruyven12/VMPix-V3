/* Admin owns only its local, inactive login presentation. */
(function () {
  "use strict";
  const host = document.querySelector("[data-admin-shell]");
  const password = host?.querySelector("[data-admin-password]");
  const toggle = host?.querySelector("[data-admin-password-toggle]");
  const connect = host?.querySelector("[data-admin-connect]");
  const feedback = host?.querySelector("[data-admin-feedback]");
  if (!host || !password || !toggle || !connect || !feedback) return;
  let active = false;

  function reset() {
    password.value = "";
    password.type = "password";
    password.removeAttribute("aria-invalid");
    toggle.setAttribute("aria-pressed", "false");
    toggle.setAttribute("aria-label", "Show password");
    toggle.textContent = "SHOW";
    feedback.textContent = "Authentication is not connected yet.";
  }
  function available() {
    return active && !host.hidden && !host.hasAttribute("inert") && host.getAttribute("aria-hidden") === "false";
  }
  function connectPreview() {
    if (!available()) return;
    if (password.value.length === 0) {
      password.setAttribute("aria-invalid", "true");
      feedback.textContent = "Enter a password to continue.";
      password.focus();
      return;
    }
    password.removeAttribute("aria-invalid");
    feedback.textContent = "Secure login connection pending.";
  }
  toggle.addEventListener("click", () => {
    if (!available()) return;
    const show = password.type === "password";
    password.type = show ? "text" : "password";
    toggle.setAttribute("aria-pressed", String(show));
    toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
    toggle.textContent = show ? "HIDE" : "SHOW";
  });
  connect.addEventListener("click", connectPreview);
  password.addEventListener("keydown", (event) => {
    if (!available() || event.key !== "Enter" || event.isComposing) return;
    event.preventDefault();
    connectPreview();
  });
  window.addEventListener("pagehide", reset);
  window.V3AdminModule = Object.freeze({
    activate() { active = true; },
    deactivate() {
      active = false;
      if (host.contains(document.activeElement)) document.activeElement.blur();
      reset();
    },
  });
})();
