(() => {
  "use strict";

  const overlay = document.querySelector("[data-contact-overlay]");
  const viewport = overlay?.querySelector("[data-contact-scroll]");
  const form = overlay?.querySelector("[data-contact-form]");
  const fields = form ? [...form.querySelectorAll("[data-contact-input]")] : [];
  const message = form?.querySelector("textarea");
  const submit = form?.querySelector("[data-contact-submit]");
  const feedback = form?.querySelector("[data-contact-feedback]");
  const notice = form?.querySelector("#contact-relay-description");
  const challengePanel = form?.querySelector("[data-contact-challenge]");
  const challengeHost = form?.querySelector("[data-contact-widget]");
  const challengeStatus = form?.querySelector("[data-contact-challenge-status]");
  const challengeRetry = form?.querySelector("[data-contact-challenge-retry]");
  const newMessage = form?.querySelector("[data-contact-new-message]");
  if (!viewport || !form || fields.length !== 4 || !message || !submit || !feedback ||
      !notice || !challengePanel || !challengeHost || !challengeStatus || !challengeRetry || !newMessage) return;

  const API = "https://vmpix-data.onrender.com/api/contact";
  const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  const RECEIPT = "v3.contact.receipt.v1";
  const KEY = /^\d{13}\.[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  const reviewed = new Set();
  const labels = { name: "your name", email: "your email address", subject: "a subject", message: "a message" };
  // Public, build-time configuration only. Keep enabled=0 until production setup
  // and native CAPTCHA rejection are separately approved. No URL/secret overrides.
  const sitekey = form.dataset.contactSitekey || "";
  const enabled = form.dataset.contactEnabled === "1" && /^[A-Za-z0-9_-]{3,100}$/.test(sitekey) &&
    typeof crypto.randomUUID === "function" && typeof fetch === "function";
  let phase = enabled ? "ready" : "unavailable";
  let attempt = null;
  let controller = null;
  let viewportWidth = 0;
  let token = "";
  let tokenUntil = 0;
  let tokenTimer = 0;
  let retryUntil = 0;
  let widgetId = null;
  let widgetGeneration = 0;
  let widgetLoading = false;
  let scriptPromise = null;

  const visible = () => !overlay.hidden && overlay.dataset.state === "open";
  const blocked = () => phase === "transmitting" || Boolean(attempt);
  const validToken = value => typeof value === "string" && value.length > 0 && value.length <= 2048 && !/[^\x21-\x7e]/.test(value);
  function state(next, text) {
    phase = next;
    form.dataset.contactState = next;
    form.setAttribute("aria-busy", String(next === "validating" || next === "transmitting"));
    feedback.textContent = text;
    submit.disabled = blocked();
    submit.textContent = next === "transmitting" ? "Transmitting…" : "Transmit Message";
    fields.forEach(field => { field.readOnly = next === "transmitting"; });
    newMessage.hidden = next !== "accepted";
    challengeRetry.disabled = blocked();
  }
  function showError(field) {
    const error = form.querySelector(`#${field.id}-error`);
    const value = field.value.trim();
    let text = "";
    if (!value) text = `Enter ${labels[field.name]}.`;
    else if (field.value.length > field.maxLength) text = `Use ${field.maxLength.toLocaleString("en-US")} characters or fewer.`;
    else if (!field.value.isWellFormed() || (field === message ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/ : /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/).test(field.value)) text = "Remove unsupported characters.";
    else if (field.type === "email" && (field.validity.typeMismatch || value.startsWith(".") || value.includes("..") || value.includes(".@") || value.split("@")[0].length > 64)) text = "Enter an email address, such as name@example.com.";
    error.textContent = text;
    error.hidden = !text;
    if (text) field.setAttribute("aria-invalid", "true");
    else field.removeAttribute("aria-invalid");
    reviewed.add(field);
    return !text;
  }
  function growMessage() {
    if (!message.getClientRects().length) return;
    const style = getComputedStyle(message);
    message.style.height = "auto";
    message.style.height = `${message.scrollHeight + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth)}px`;
  }
  function revealControl(target) {
    if (overlay.hidden || !viewport.contains(target)) return;
    const bounds = viewport.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    const available = bounds.height - 16;
    // Only the approved content viewport scrolls; the frame and Shell remain fixed.
    if (rect.height > available || rect.top < bounds.top + 8) viewport.scrollTop += rect.top - bounds.top - 8;
    else if (rect.bottom > bounds.bottom - 8) viewport.scrollTop += rect.bottom - bounds.bottom + 8;
  }
  function clearChallenge() {
    widgetGeneration++;
    widgetLoading = false;
    token = ""; tokenUntil = 0; clearTimeout(tokenTimer);
    if (widgetId !== null) { try { window.turnstile?.remove(widgetId); } catch { /* Fail closed locally. */ } }
    widgetId = null;
    challengeHost.replaceChildren();
  }
  function challengeFailed(text) {
    token = ""; tokenUntil = 0; clearTimeout(tokenTimer);
    if (blocked()) return;
    challengeStatus.textContent = text;
    challengeRetry.hidden = false;
    state("failed", "Security check required. Your draft is preserved; nothing has been sent.");
  }
  function loadTurnstile() {
    if (scriptPromise) return scriptPromise;
    const script = document.createElement("script");
    script.src = SCRIPT; script.async = true; script.referrerPolicy = "no-referrer";
    scriptPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(fail, 10000);
      function fail() { clearTimeout(timer); script.remove(); reject(new Error("challenge_unavailable")); }
      script.onerror = fail;
      script.onload = () => {
        try {
          window.turnstile.ready(() => { clearTimeout(timer); resolve(window.turnstile); });
        } catch { fail(); }
      };
      document.head.append(script);
    }).catch(error => { scriptPromise = null; throw error; });
    return scriptPromise;
  }
  async function startChallenge() {
    if (!enabled || !visible() || blocked() || widgetLoading || widgetId !== null) return;
    widgetLoading = true;
    const generation = ++widgetGeneration;
    challengePanel.hidden = false;
    challengeRetry.hidden = true;
    challengeStatus.textContent = "Loading security check…";
    try {
      const api = await loadTurnstile();
      if (generation !== widgetGeneration || !visible() || blocked()) return;
      challengeStatus.textContent = "Complete the security check before transmitting.";
      const current = () => generation === widgetGeneration && visible() && !blocked();
      widgetId = api.render(challengeHost, {
        sitekey, action: "contact", theme: "dark", size: "compact", tabindex: 0,
        "response-field": false, retry: "never", "refresh-expired": "never", "refresh-timeout": "never",
        callback(value) {
          if (!current()) return;
          if (!validToken(value)) { challengeFailed("Security check failed. Try again."); return; }
          token = value; tokenUntil = performance.now() + 300000;
          clearTimeout(tokenTimer);
          tokenTimer = setTimeout(() => { if (current()) challengeFailed("Security check expired. Complete a new check."); }, 300000);
          challengeStatus.textContent = "Security check complete.";
          challengeRetry.hidden = true;
          state("ready", "Ready to transmit.");
        },
        "expired-callback": () => { if (current()) challengeFailed("Security check expired. Complete a new check."); },
        "error-callback": () => { if (current()) challengeFailed("Security check unavailable. Try again or use a direct channel."); return true; },
        "timeout-callback": () => { if (current()) challengeFailed("Security check timed out. Try again."); },
        "unsupported-callback": () => { if (current()) challengeFailed("Security check is unsupported in this browser. Use a direct channel."); }
      });
    } catch { if (generation === widgetGeneration && visible()) challengeFailed("Security check could not load. Try again or use a direct channel."); }
    finally { if (generation === widgetGeneration) widgetLoading = false; }
  }
  function saveReceipt(status) {
    // No draft, email or token in storage. A pending dispatch is stored as uncertain
    // BEFORE fetch, so reload/BFCache cannot silently create a replacement request.
    sessionStorage.setItem(RECEIPT, JSON.stringify({ key: attempt.key, status }));
  }
  function uncertain() {
    if (!attempt) return;
    try { saveReceipt("uncertain"); } catch { /* The pre-dispatch receipt remains. */ }
    state("uncertain", "Delivery status is uncertain. Your message may have been accepted. Your draft is preserved. Do not resend; use a direct channel to confirm.");
  }
  async function readReply(response) {
    if (!/^application\/json(?:;|$)/i.test(response.headers.get("content-type") || "") || !response.body) throw new Error("invalid_response");
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let text = "", bytes = 0;
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 16384) throw new Error("invalid_response");
        text += decoder.decode(value, { stream: true });
      }
      return JSON.parse(text + decoder.decode());
    } finally { void reader.cancel().catch(() => {}); }
  }
  function receive(response, body) {
    if (response.status === 202 && body?.ok === true && body.code === "provider_accepted" && body.delivery === "accepted" && body.retryable === false && !Object.hasOwn(body, "error") && !Object.hasOwn(body, "errors")) {
      try { saveReceipt("accepted"); } catch { /* A reload remains conservative. */ }
      state("accepted", "Accepted for delivery. Your message was accepted by the delivery service; inbox delivery is not yet confirmed.");
      return;
    }
    const before = { invalid_request: 400, invalid_fields: 400, invalid_idempotency_key: 400, origin_not_allowed: 403,
      not_found: 404, method_not_allowed: 405, request_timeout: 408, payload_too_large: 413, unsupported_content_type: 415,
      rate_limited: 429, contact_busy: 503, contact_unavailable: 503 };
    const rejected = { provider_validation_failed: 422, provider_rate_limited: 429, delivery_unavailable: 502 };
    if (body?.ok === false && body.delivery === "not_attempted" && Object.hasOwn(before, body.code) && before[body.code] === response.status &&
        body.retryable === ["rate_limited", "contact_busy"].includes(body.code)) {
      // This exact contract confirms no dispatch. Only a later user action may retry.
      try { sessionStorage.removeItem(RECEIPT); } catch { uncertain(); return; }
      attempt = null;
      const delay = response.headers.get("retry-after");
      retryUntil = Date.now() + (/^\d{1,7}$/.test(delay || "") ? Math.min(Number(delay), 86400) : 0) * 1000;
      state("failed", body.code === "contact_unavailable" ? "Delivery is unavailable. Nothing was sent. Your draft is preserved; use a direct channel." :
        "The message was not sent. Check your details and complete a new security check before trying again. Your draft is preserved.");
      challengeStatus.textContent = "Complete a new security check when you are ready to try again.";
      challengeRetry.hidden = false;
      return;
    }
    if (body?.ok === false && body.delivery === "rejected" && body.retryable === false && Object.hasOwn(rejected, body.code) && rejected[body.code] === response.status) {
      try { saveReceipt("rejected"); } catch { /* A reload remains conservative. */ }
      state("failed", "The delivery service rejected this submission. Your draft is preserved. Use a direct channel; this submission will not be replayed.");
      return;
    }
    uncertain();
  }
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (blocked() || !visible()) return;
    state("validating", "Checking your message…");
    const invalid = fields.filter(field => !showError(field));
    if (invalid.length) {
      state("failed", "Check the highlighted fields. Nothing has been sent.");
      invalid[0].focus({ preventScroll: true }); revealControl(invalid[0]); return;
    }
    if (!enabled) {
      state("unavailable", "Delivery is unavailable. Nothing was sent. Use a direct channel to get in touch.");
      submit.focus({ preventScroll: true }); revealControl(feedback); return;
    }
    if (Date.now() < retryUntil) {
      state("failed", "Please wait before trying again. Nothing new was sent; your draft is preserved."); revealControl(feedback); return;
    }
    if (!validToken(token) || performance.now() >= tokenUntil) {
      challengeFailed("Complete a new security check before transmitting."); revealControl(challengePanel); return;
    }
    const payload = Object.fromEntries(fields.map(field => [field.name, field.value.replace(/\r\n?/g, "\n").trim()]));
    const challenge = token;
    try {
      attempt = { key: `${Date.now()}.${crypto.randomUUID()}` };
      if (!KEY.test(attempt.key)) throw new Error("invalid_clock");
      saveReceipt("uncertain");
    } catch {
      attempt = null;
      state("failed", "Safe transmission is unavailable in this browser. Nothing was sent. Your draft is preserved; use a direct channel."); return;
    }
    state("transmitting", "Transmitting your message… Please wait for confirmation.");
    clearChallenge(); challengeRetry.hidden = true; challengeStatus.textContent = "Security check submitted.";
    controller = new AbortController();
    const currentController = controller;
    const timer = setTimeout(() => currentController.abort(), 25000);
    try {
      const response = await fetch(API, { method: "POST", mode: "cors", credentials: "omit", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer",
        headers: { "Content-Type": "application/json", "Idempotency-Key": attempt.key },
        body: JSON.stringify({ ...payload, turnstileToken: challenge }), signal: currentController.signal });
      const body = await readReply(response);
      if (currentController.signal.aborted) uncertain(); else receive(response, body);
    } catch { uncertain(); }
    finally {
      clearTimeout(timer); controller = null;
      if (visible()) revealControl(feedback);
    }
  });
  challengeRetry.addEventListener("click", () => {
    if (blocked() || !enabled) return;
    clearChallenge(); void startChallenge();
  });
  newMessage.addEventListener("click", () => {
    if (phase !== "accepted") return;
    try { sessionStorage.removeItem(RECEIPT); } catch { return; }
    attempt = null; reviewed.clear();
    fields.forEach(field => { field.value = ""; field.removeAttribute("aria-invalid"); form.querySelector(`#${field.id}-error`).hidden = true; });
    state("ready", "Ready for a new message."); growMessage(); void startChallenge();
    fields[0].focus({ preventScroll: true }); revealControl(fields[0]);
  });
  fields.forEach(field => {
    field.addEventListener("input", () => {
      if (!blocked()) state(enabled ? "ready" : "unavailable", "");
      if (reviewed.has(field)) showError(field);
      if (field === message) growMessage();
    });
    field.addEventListener("blur", () => { if (field.value || reviewed.has(field)) showError(field); });
  });
  viewport.addEventListener("focusin", event => {
    if (event.target.matches("input, textarea, button, a[href], iframe")) revealControl(event.target);
  });
  // The Shell's enumerated Tab controls cannot see into a provider's closed shadow
  // root. At this one embedded-widget boundary, let native Tab traversal enter it.
  // Inert world surfaces and all other Shell keys/focus behavior remain in charge.
  window.addEventListener("keydown", event => {
    if (event.key !== "Tab" || !visible() || blocked() || widgetId === null) return;
    const afterWidget = challengeRetry.hidden ? submit : challengeRetry;
    if (!event.shiftKey && document.activeElement === message || event.shiftKey && document.activeElement === afterWidget) {
      revealControl(challengeHost);
      event.stopImmediatePropagation();
    }
  }, true);
  const resizeContent = () => {
    if (overlay.hidden) return;
    if (viewport.clientWidth !== viewportWidth) { viewportWidth = viewport.clientWidth; growMessage(); }
    if (viewport.contains(document.activeElement) && document.activeElement !== viewport) revealControl(document.activeElement);
  };
  if (typeof ResizeObserver === "function") new ResizeObserver(resizeContent).observe(viewport);
  else window.addEventListener("resize", resizeContent, { passive: true });

  const syncVisibility = () => {
    if (visible()) { if (!blocked()) void startChallenge(); }
    else { clearChallenge(); if (controller) { controller.abort(); uncertain(); } }
  };
  new MutationObserver(syncVisibility).observe(overlay, { attributes: true, attributeFilter: ["hidden", "data-state"] });
  window.addEventListener("pagehide", () => { clearChallenge(); if (controller) { controller.abort(); uncertain(); } });
  window.addEventListener("pageshow", syncVisibility);
  if (enabled) {
    notice.textContent = "Messages are submitted securely. Acceptance does not confirm inbox delivery.";
    try {
      const raw = sessionStorage.getItem(RECEIPT);
      if (raw) {
        const saved = JSON.parse(raw);
        if (!saved || !KEY.test(saved.key) || !["accepted", "rejected", "uncertain"].includes(saved.status)) throw new Error("invalid_receipt");
        attempt = { key: saved.key };
        if (saved.status === "accepted") state("accepted", "An earlier message was accepted for delivery. Inbox delivery is not confirmed.");
        else if (saved.status === "rejected") state("failed", "The earlier submission was rejected. It will not be replayed. Use a direct channel.");
        else uncertain();
      } else state("ready", "Ready to compose your message.");
    } catch {
      attempt = { key: "" };
      state("uncertain", "Previous submission status cannot be established. Transmission is blocked to prevent duplicates. Use a direct channel.");
    }
  } else state("unavailable", "");
  // Preserve the no-JavaScript method=dialog safety net and local draft editing.
  form.noValidate = true;
  form.querySelector("fieldset").disabled = false;
  syncVisibility();
})();
