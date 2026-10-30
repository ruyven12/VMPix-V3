const { test, expect } = require("@playwright/test");
const { endpoint, event, payload, readyPayload, fulfillCalendar } = require("./fixtures/calendar.cjs");
const controls = new WeakMap();

test.beforeEach(async ({ page, context, baseURL }) => {
  const state = { respond: route => fulfillCalendar(route), requests: [], forbidden: [], errors: [] };
  controls.set(page, state);
  page.on("pageerror", error => state.errors.push(error.message));
  await context.addCookies([{ url: endpoint, name: "qa_calendar_cookie", value: "must-not-be-sent" }]);
  await context.route("**/*", route => {
    const request = route.request(), url = new URL(request.url());
    if (request.url() === endpoint) {
      state.requests.push({ method: request.method(), body: request.postData(), authorization: request.headers().authorization, cookie: request.headers().cookie });
      return state.respond(route);
    }
    if (/todoist/i.test(url.hostname) || url.pathname.startsWith("/api/calendar") || url.pathname.startsWith("/api/admin/calendar")) state.forbidden.push(url.pathname);
    if (!url.pathname.startsWith("/api/") && (url.origin === new URL(baseURL).origin || ["fonts.googleapis.com", "fonts.gstatic.com"].includes(url.hostname) ||
      url.hostname === "unpkg.com" && url.pathname.startsWith("/leaflet@1.9.4/dist/"))) return route.continue();
    return route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
  });
  await page.goto("/portfolio", { waitUntil: "domcontentloaded" });
  const reject = page.getByRole("button", { name: "Reject", exact: true });
  if (await reject.isVisible()) await reject.click();
  expect(state.requests).toHaveLength(0); // No prefetch while the modal is closed.
});
test.afterEach(async ({ page }) => {
  const state = controls.get(page);
  expect(state.errors).toEqual([]);
  expect(state.forbidden).toEqual([]);
  expect(state.requests.length).toBeGreaterThan(0);
  for (const request of state.requests) expect(request).toEqual({ method: "GET", body: null, authorization: undefined, cookie: undefined });
});

async function open(page) {
  await page.goto("/calendar", { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-calendar-overlay]")).toHaveAttribute("data-state", "open");
  await expect(page.locator("[data-calendar-shell]")).toBeHidden();
}
async function stateIs(page, state) {
  await expect(page.locator("[data-calendar-scroll]")).toHaveAttribute("data-calendar-state", state);
  await expect(page.locator("[data-calendar-placeholder-event], .calendar-preview, .calendar-preview-end")).toHaveCount(0);
}
async function noOverflow(page) {
  expect(await page.evaluate(() => [document.documentElement, document.querySelector('[data-calendar-frame]'), document.querySelector('[data-calendar-scroll]')]
    .some(node => node.scrollWidth > node.clientWidth + 1))).toBe(false);
}
async function dismiss(page) {
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-calendar-overlay]")).toBeHidden();
  await expect(page).toHaveURL(/\/portfolio$/);
}
async function capture(page, testInfo, name) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`) });
}

for (const [width, height] of [[360,800], [412,915], [1920,1080]]) {
  for (const reducedMotion of ["reduce", "no-preference"]) {
    test.describe(`Calendar data: ${width}x${height} ${reducedMotion}`, () => {
      test.use({ viewport: { width, height }, reducedMotion, timezoneId: "Pacific/Honolulu", serviceWorkers: "block" });

      test("loading becomes safely formatted chronological gigs with long-list scrolling", async ({ page }, testInfo) => {
        const state = controls.get(page);
        let release;
        const gate = new Promise(resolve => { release = resolve; });
        const data = readyPayload();
        data.events.push(event({ event_id: "plain-text", title: '<img src=x onerror="window.calendarInjected=true">', date: "2027-06-20",
          location: "<svg onload=alert(1)> & Studio", description: '<script>window.calendarInjected=true</script>' }));
        for (let i = 1; i <= 24; i++) data.events.push(event({ event_id: `long-${i}`, date: `2027-07-${String(i).padStart(2, '0')}`,
          title: "A longer upcoming event title for the community and visiting performers", description: "Long event details remain readable. ".repeat(40) }));
        state.respond = async route => { await gate; return fulfillCalendar(route, data); };
        await open(page); await stateIs(page, "loading");
        await expect(page.getByRole("status")).toHaveText("Retrieving upcoming gigs.");
        await expect(page.locator(".calendar-gig")).toHaveCount(0);
        await capture(page, testInfo, "loading");
        release(); await stateIs(page, "ready");
        const cards = page.locator(".calendar-gig");
        await expect(cards).toHaveCount(31);
        await expect(cards.nth(0).locator("h3")).toHaveText("All-day festival");
        await expect(cards.nth(0).locator(".calendar-gig__time")).toHaveText("All day");
        await expect(cards.nth(0).locator(".calendar-gig__place")).toHaveText("Location to be announced.");
        await expect(cards.nth(1).locator(".calendar-gig__time")).toHaveText("9:05 AM");
        await expect(cards.nth(2).locator(".calendar-gig__time")).toHaveText("7:30 PM");
        await expect(cards.nth(4).locator(".calendar-gig__time")).toHaveText("12:00 PM");
        await expect(cards.nth(5).locator(".calendar-gig__time")).toHaveText("12:00 AM");
        await expect(cards.nth(0).locator("time")).toHaveAttribute("aria-label", "June 10, 2027");
        await expect(cards.nth(3).locator(".calendar-gig__description")).toHaveCount(0);
        await expect(page.locator("[data-calendar-timezone]")).toContainText("America/New_York");
        await expect(cards.nth(6).locator("h3")).toHaveText(data.events[6].title);
        await expect(cards.nth(6).locator(".calendar-gig__place")).toHaveText(data.events[6].location);
        await expect(cards.nth(6).locator(".calendar-gig__description")).toHaveText(data.events[6].description);
        await expect(page.locator("[data-calendar-gigs] img, [data-calendar-gigs] script, [data-calendar-gigs] svg, [data-calendar-gigs] a")).toHaveCount(0);
        expect(await page.evaluate(() => window.calendarInjected)).toBeUndefined();
        await noOverflow(page); await capture(page, testInfo, "ready");
        const scroll = page.locator("[data-calendar-scroll]");
        await scroll.focus(); await page.keyboard.press("Control+End");
        await expect.poll(() => scroll.evaluate(node => node.scrollHeight - node.clientHeight - node.scrollTop)).toBeLessThan(2);
        await expect(cards.last()).toBeInViewport();
        await noOverflow(page); await dismiss(page);
      });

      test("a successful empty publication is explicitly empty", async ({ page }, testInfo) => {
        controls.get(page).respond = route => fulfillCalendar(route, payload([]));
        await open(page); await stateIs(page, "empty");
        await expect(page.getByRole("status")).toHaveText("No upcoming gigs scheduled.");
        await expect(page.locator(".calendar-gig")).toHaveCount(0);
        await expect(page.getByRole("button", { name: "Retry", exact: true })).toBeHidden();
        await noOverflow(page); await capture(page, testInfo, "empty"); await dismiss(page);
      });

      test("503 is unavailable and Retry recovers without moving focus outside the modal", async ({ page }, testInfo) => {
        const state = controls.get(page);
        // Even an empty-looking body on HTTP 503 is not an empty publication.
        state.respond = route => fulfillCalendar(route, payload([]), 503);
        await open(page); await stateIs(page, "unavailable");
        await expect(page.getByRole("status")).toHaveText("Upcoming gigs are temporarily unavailable. Please try again.");
        await expect(page.locator(".calendar-gig")).toHaveCount(0);
        const retry = page.getByRole("button", { name: "Retry", exact: true });
        await expect(retry).toBeEnabled();
        const bounds = await retry.boundingBox(); expect(bounds.height).toBeGreaterThanOrEqual(44);
        await page.keyboard.press("Tab"); await expect(page.locator("[data-calendar-scroll]")).toBeFocused();
        await page.keyboard.press("Tab"); await expect(retry).toBeFocused();
        await page.keyboard.press("Tab"); await expect(page.locator("[data-calendar-close]")).toBeFocused();
        await noOverflow(page); await capture(page, testInfo, "unavailable");
        state.respond = route => fulfillCalendar(route);
        await retry.click(); await stateIs(page, "ready");
        await expect(page.locator("[data-calendar-scroll]")).toBeFocused();
        await expect(page.locator(".calendar-gig")).toHaveCount(6);
        expect(state.requests).toHaveLength(2);
        await dismiss(page);
      });

      test("malformed JSON, inconsistent states and invalid events never become empty or partial listings", async ({ page }) => {
        const state = controls.get(page);
        const invalid = [null, {}, { ...payload([]), status: "ready" }, { ...readyPayload(), status: "empty" },
          { ...readyPayload(), timezone: "UTC" }, payload([event({ date: "2027-02-30" })]),
          payload([event({ start_time: "25:00" })]), payload([event({ status: "draft" })]),
          payload([event(), event()]), payload([event({ title: { text: "Wrong type" } })]),
          payload([event({ all_day: true })]), payload([event({ location: 123 })]),
          payload([event({ description: "x".repeat(2001) })])];
        state.respond = route => route.fulfill({ contentType: "application/json", body: "{broken" });
        await open(page); await stateIs(page, "unavailable");
        for (const body of invalid) {
          state.respond = route => fulfillCalendar(route, body);
          await page.getByRole("button", { name: "Retry", exact: true }).click();
          await stateIs(page, "unavailable");
          await expect(page.locator(".calendar-gig")).toHaveCount(0);
          await expect(page.getByRole("status")).not.toHaveText("No upcoming gigs scheduled.");
        }
        await dismiss(page);
      });

      test("network failure is recoverable and a later failure never reuses prior events", async ({ page }) => {
        const state = controls.get(page);
        await open(page); await stateIs(page, "ready"); await dismiss(page);
        state.respond = route => route.abort("failed");
        await page.waitForFunction(() => canOpenCalendar());
        await page.evaluate(() => navigateToRoute('/calendar'));
        await stateIs(page, "unavailable");
        await expect(page.locator(".calendar-gig")).toHaveCount(0);
        state.respond = route => fulfillCalendar(route, payload([]));
        await page.getByRole("button", { name: "Retry", exact: true }).click(); await stateIs(page, "empty");
        await page.goBack();
        await expect(page.locator("[data-calendar-overlay]")).toBeHidden();
        await page.goForward(); await stateIs(page, "empty");
        await page.locator("[data-calendar-close]").click();
        await expect(page).toHaveURL(/\/portfolio$/);
      });
    });
  }
}

test.describe("Calendar request lifecycle", () => {
  test.use({ viewport: { width: 412, height: 915 }, reducedMotion: "reduce", serviceWorkers: "block" });

  test("timeout offers Retry and navigation remains available while loading", async ({ page }) => {
    const state = controls.get(page);
    await page.clock.install();
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    state.respond = async route => { await gate; await fulfillCalendar(route).catch(() => {}); };
    await open(page); await stateIs(page, "loading");
    await page.clock.fastForward(10001); await stateIs(page, "unavailable");
    release(); state.respond = route => fulfillCalendar(route);
    await page.getByRole("button", { name: "Retry", exact: true }).click(); await stateIs(page, "ready");
    await dismiss(page);
  });

  test("closing cancels a pending request and an old response cannot replace the reopened schedule", async ({ page }) => {
    const state = controls.get(page);
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    state.respond = async route => { await gate; await fulfillCalendar(route).catch(() => {}); };
    await open(page); await stateIs(page, "loading");
    await page.locator("[data-calendar-close]").click();
    await expect(page.locator("[data-calendar-overlay]")).toBeHidden();
    state.respond = route => fulfillCalendar(route, payload([]));
    await page.waitForFunction(() => canOpenCalendar());
    await page.evaluate(() => navigateToRoute('/calendar'));
    await stateIs(page, "empty");
    release();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await stateIs(page, "empty");
    await expect(page.locator(".calendar-gig")).toHaveCount(0);
    await dismiss(page);
  });
});
