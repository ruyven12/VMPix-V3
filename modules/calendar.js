(() => {
  "use strict";

  const endpoint = "https://vmpix-data.onrender.com/api/calendar";
  const overlay = document.querySelector("[data-calendar-overlay]");
  const region = overlay?.querySelector("[data-calendar-scroll]");
  const status = overlay?.querySelector("[data-calendar-status]");
  const list = overlay?.querySelector("[data-calendar-gigs]");
  const retry = overlay?.querySelector("[data-calendar-retry]");
  const timezone = overlay?.querySelector("[data-calendar-timezone]");
  if (!overlay || !region || !status || !list || !retry || !timezone) return;

  const dateLabel = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", dateStyle: "long" });
  const monthLabel = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short" });
  let active = false;
  let pending = null;

  function validText(value, limit) {
    return typeof value === "string" && value.trim().length > 0 && value.length <= limit && !/[\u0000-\u001f\u007f]/.test(value);
  }

  function validDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || +value.slice(0, 4) < 1970) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  function readEvents(payload) {
    // A failed or malformed publication is never an empty schedule. Validate the
    // complete list before rendering so partial/private records cannot slip in.
    if (!payload || payload.timezone !== "America/New_York" || !Array.isArray(payload.events) || payload.events.length > 1000 ||
        !(payload.status === "ready" && payload.events.length > 0 || payload.status === "empty" && payload.events.length === 0)) throw new Error("Calendar unavailable");
    const ids = new Set();
    for (const event of payload.events) {
      if (!event || typeof event !== "object" || typeof event.event_id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(event.event_id) ||
          event.event_id.startsWith("tmp-") || ids.has(event.event_id) || event.status !== "confirmed" || !validText(event.title, 500) ||
          !validDate(event.date) || typeof event.all_day !== "boolean" ||
          (event.all_day ? event.start_time !== null : typeof event.start_time !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(event.start_time)) ||
          (event.location != null && !validText(event.location, 300)) || (event.description != null && !validText(event.description, 2000))) throw new Error("Calendar unavailable");
      ids.add(event.event_id);
    }
    return [...payload.events].sort((a, b) => a.date.localeCompare(b.date) || Number(b.all_day) - Number(a.all_day) ||
      (a.start_time || "").localeCompare(b.start_time || "") || a.event_id.localeCompare(b.event_id));
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderEvents(events) {
    const fragment = document.createDocumentFragment();
    for (const event of events) {
      const card = element("li", "calendar-gig");
      const date = new Date(`${event.date}T00:00:00Z`);
      const chip = element("time", "calendar-gig__date");
      chip.dateTime = event.date;
      chip.setAttribute("aria-label", dateLabel.format(date));
      chip.append(element("span", "", monthLabel.format(date).toUpperCase()), element("strong", "", event.date.slice(8)), element("span", "", event.date.slice(0, 4)));
      const copy = element("div", "calendar-gig__copy");
      const hour = event.all_day ? null : Number(event.start_time.slice(0, 2));
      const time = event.all_day ? "All day" : `${hour % 12 || 12}:${event.start_time.slice(3)} ${hour < 12 ? "AM" : "PM"}`;
      copy.append(element("p", "calendar-gig__kind", "CONFIRMED"), element("h3", "", event.title),
        element("p", "calendar-gig__time", time), element("p", "calendar-gig__place", event.location || "Location to be announced."));
      if (event.description) copy.append(element("p", "calendar-gig__description", event.description));
      card.append(chip, copy);
      fragment.append(card);
    }
    list.replaceChildren(fragment);
  }

  function setState(state) {
    // Hiding a focused Retry must not send keyboard focus behind the modal.
    if (state !== "unavailable" && document.activeElement === retry) region.focus({ preventScroll: true });
    region.dataset.calendarState = state;
    list.setAttribute("aria-busy", String(state === "loading"));
    list.hidden = state !== "ready";
    timezone.hidden = state !== "ready";
    retry.hidden = state !== "unavailable";
    retry.disabled = state !== "unavailable";
    if (state !== "ready") list.replaceChildren();
    status.textContent = state === "loading" ? "Retrieving upcoming gigs." : state === "empty" ? "No upcoming gigs scheduled." :
      state === "unavailable" ? "Upcoming gigs are temporarily unavailable. Please try again." : "";
  }

  async function load() {
    if (!active || pending) return;
    const request = { controller: new AbortController(), timer: null };
    pending = request;
    setState("loading");
    request.timer = setTimeout(() => request.controller.abort(), 10000);
    try {
      // The public read needs no credentials and never falls back to Todoist.
      const response = await fetch(endpoint, { method: "GET", credentials: "omit", cache: "no-store", redirect: "error",
        referrerPolicy: "no-referrer", headers: { Accept: "application/json" }, signal: request.controller.signal });
      if (!response.ok) throw new Error("Calendar unavailable");
      const events = readEvents(await response.json());
      if (!active || pending !== request || request.controller.signal.aborted) return;
      renderEvents(events);
      setState(events.length ? "ready" : "empty");
    } catch {
      if (active && pending === request) setState("unavailable");
    } finally {
      clearTimeout(request.timer);
      if (pending === request) pending = null;
    }
  }

  function syncVisibility() {
    const visible = !overlay.hidden;
    if (visible === active) return;
    active = visible;
    if (active) { load(); return; }
    pending?.controller.abort();
    clearTimeout(pending?.timer);
    pending = null;
    setState("loading");
    list.setAttribute("aria-busy", "false");
  }

  retry.addEventListener("click", load);
  // Shell alone controls opening, closing, routing, focus and animation. Observe
  // its existing visibility boundary; content requests cannot hold it open.
  new MutationObserver(syncVisibility).observe(overlay, { attributes: true, attributeFilter: ["hidden"] });
  syncVisibility();
})();
