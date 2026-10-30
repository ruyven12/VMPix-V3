(() => {
  "use strict";

  const overlay = document.querySelector("[data-contact-overlay]");
  const viewport = overlay?.querySelector("[data-contact-scroll]");
  const form = overlay?.querySelector("[data-contact-form]");
  const fields = form ? [...form.querySelectorAll("[data-contact-input]")] : [];
  const message = form?.querySelector("textarea");
  const submit = form?.querySelector("[data-contact-submit]");
  const feedback = form?.querySelector("[data-contact-feedback]");
  if (!viewport || !form || fields.length !== 4 || !message || !submit || !feedback) return;

  const reviewed = new Set();
  const labels = { name: "your name", email: "your email address", subject: "a subject", message: "a message" };
  let viewportWidth = 0;

  function showError(field) {
    const error = form.querySelector(`#${field.id}-error`);
    const value = field.value.trim();
    let text = "";
    if (!value) text = `Enter ${labels[field.name]}.`;
    else if (field.value.length > field.maxLength) text = `Use ${field.maxLength.toLocaleString("en-US")} characters or fewer.`;
    else if (field.type === "email" && field.validity.typeMismatch) text = "Enter an email address, such as name@example.com.";
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
    // Scroll only the existing content viewport. A grown textarea stays aligned
    // at its start on focus; the browser handles caret movement during editing.
    if (rect.height > available || rect.top < bounds.top + 8) {
      viewport.scrollTop += rect.top - bounds.top - 8;
    } else if (rect.bottom > bounds.bottom - 8) {
      viewport.scrollTop += rect.bottom - bounds.bottom + 8;
    }
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    const invalid = fields.filter(field => !showError(field));
    if (invalid.length) {
      feedback.textContent = "Check the highlighted fields. Nothing has been sent.";
      invalid[0].focus({ preventScroll: true });
      revealControl(invalid[0]);
      return;
    }
    // CON-03 has no transport, payload, persistence or delivery-success path.
    feedback.textContent = "Delivery is unavailable. Nothing was sent. Use a direct channel to get in touch.";
    submit.focus({ preventScroll: true });
    revealControl(feedback);
  });

  fields.forEach(field => {
    field.addEventListener("input", () => {
      feedback.textContent = "";
      if (reviewed.has(field)) showError(field);
      if (field === message) growMessage();
    });
    field.addEventListener("blur", () => {
      if (field.value || reviewed.has(field)) showError(field);
    });
  });
  viewport.addEventListener("focusin", event => {
    if (event.target.matches("input, textarea, button, a[href]")) revealControl(event.target);
  });
  // Width changes reflow the textarea; height changes keep a focused control
  // visible when the Shell responds to a mobile keyboard or browser chrome.
  const resizeContent = () => {
    if (overlay.hidden) return;
    if (viewport.clientWidth !== viewportWidth) {
      viewportWidth = viewport.clientWidth;
      growMessage();
    }
    if (viewport.contains(document.activeElement) && document.activeElement !== viewport) revealControl(document.activeElement);
  };
  if (typeof ResizeObserver === "function") new ResizeObserver(resizeContent).observe(viewport);
  else window.addEventListener("resize", resizeContent, { passive: true });

  // Enable editing only after the local validation handler exists. The HTML
  // dialog submission method cannot issue an HTTP submission while disconnected.
  form.noValidate = true;
  form.querySelector("fieldset").disabled = false;
  submit.disabled = false;
})();
