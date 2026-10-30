const { test, expect } = require("@playwright/test");
const { endpoint, fulfillCalendar } = require("./fixtures/calendar.cjs");

const viewports = [
  { name: "360x800", size: { width: 360, height: 800 } },
  { name: "412x915", size: { width: 412, height: 915 } },
  { name: "1920x1080", size: { width: 1920, height: 1080 } },
];

// This suite exercises the local presentation only. No backend or OAuth request
// may leave the browser; the real app, local assets and display font still load.
const errors = new WeakMap();
const calendarRequests = new WeakMap();
test.beforeEach(async ({ page, context, baseURL }) => {
  errors.set(page, []);
  calendarRequests.set(page, []);
  page.on("pageerror", error => errors.get(page).push(error.message));
  await context.route("**/*", route => {
    const request = route.request(), url = new URL(request.url());
    const api = url.pathname.startsWith("/api/");
    if (api && /calendar|todoist/i.test(url.pathname)) calendarRequests.get(page).push(url.pathname);
    if (request.url() === endpoint) return fulfillCalendar(route);
    if (!api && (url.origin === new URL(baseURL).origin || (["fonts.googleapis.com", "fonts.gstatic.com"].includes(url.hostname) || url.hostname === "unpkg.com" && url.pathname.startsWith("/leaflet@1.9.4/dist/")))) return route.continue();
    if (request.resourceType() === "script") return route.fulfill({ contentType: "application/javascript", body: "" });
    if (request.resourceType() === "stylesheet") return route.fulfill({ contentType: "text/css", body: "" });
    return route.fulfill({ status: 503, headers: { "access-control-allow-origin": "*" }, contentType: "application/json", body: '{"error":"Isolated Calendar QA"}' });
  });
  await page.addInitScript(() => {
    window.__calendarLegacyExposed = false;
    const inspect = () => {
      const legacy = document.querySelector("[data-calendar-shell]");
      if (legacy && (legacy.getAttribute("aria-hidden") !== "true" || !legacy.inert ||
          legacy.getClientRects().length && getComputedStyle(legacy).visibility !== "hidden" && getComputedStyle(legacy).opacity !== "0")) {
        window.__calendarLegacyExposed = true;
      }
    };
    new MutationObserver(inspect).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "aria-hidden", "inert"] });
  });
  await page.goto("/portfolio", { waitUntil: "domcontentloaded" });
  const reject = page.getByRole("button", { name: "Reject", exact: true });
  if (await reject.isVisible()) await reject.click();
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
  expect(calendarRequests.get(page).length).toBeGreaterThan(0);
  expect(calendarRequests.get(page).every(path => path === "/api/calendar")).toBe(true);
  expect(await page.evaluate(() => window.__calendarLegacyExposed)).toBe(false);
});

async function opened(page) {
  await expect(page).toHaveURL(/\/calendar$/);
  await expect(page.getByRole("dialog", { name: "Upcoming Gigs" })).toBeVisible();
  await expect(page.locator("[data-calendar-overlay]")).toHaveAttribute("data-state", "open");
  await expect(page.locator("[data-calendar-shell]")).toBeHidden();
  await expect(page.locator("[data-calendar-shell]")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("[data-calendar-close]")).toBeFocused();
  await expect(page.locator("[data-calendar-scroll]")).toHaveAttribute("data-calendar-state", "ready");
}
async function closed(page, route = "/portfolio") {
  await expect(page).toHaveURL(new RegExp(`${route}$`));
  await expect(page.locator("[data-calendar-overlay]")).toBeHidden();
  await expect(page.locator("[data-calendar-shell]")).toBeHidden();
}
async function openFromMenu(page) {
  await expect(page.locator("[data-shell-menu-toggle]")).toBeEnabled({ timeout: 15000 });
  await page.locator("[data-shell-menu-toggle]").click();
  await page.locator('[data-shell-menu-route="calendar"]').click();
  await opened(page);
}
async function rememberSource(page) {
  return page.evaluate(() => {
    window.__calendarSource = {
      engine: document.querySelector("[data-portfolio-engine]"),
      route: shellRenderedRoute, context: v3RouteContext,
      scroll: [...getV3ResumeScrollers(shellRenderedRoute).values()].filter(Boolean).map(node => ({ node, top: node.scrollTop })),
    };
    return { title: document.title, shellRoute: document.querySelector(".site-shell").dataset.shellRoute };
  });
}
async function sourcePreserved(page, before, closing = false) {
  expect(await page.evaluate(() => {
    const saved = window.__calendarSource;
    return saved.engine === document.querySelector("[data-portfolio-engine]") && saved.route === shellRenderedRoute && saved.context === v3RouteContext &&
      saved.scroll.every(({ node, top }) => Math.abs(node.scrollTop - top) < 2);
  })).toBe(true);
  await expect(page.locator(".site-shell")).toHaveAttribute("data-shell-route", before.shellRoute);
  if (closing) expect(await page.title()).toBe(before.title);
}

for (const viewport of viewports) {
  for (const reducedMotion of ["reduce", "no-preference"]) {
    test.describe(`Calendar modal: ${viewport.name} ${reducedMotion}`, () => {
      test.use({ viewport: viewport.size, reducedMotion, serviceWorkers: "block" });

      test("direct entry and refresh show the modal without exposing the legacy page", async ({ page }) => {
        const response = await page.goto("/calendar", { waitUntil: "domcontentloaded" });
        expect(response.ok()).toBe(true);
        await opened(page);
        await expect(page.locator(".calendar-preview")).toHaveCount(0);
        await expect(page.locator(".calendar-gig")).toHaveCount(6);
        await page.reload({ waitUntil: "domcontentloaded" });
        await opened(page);
        const historyLength = await page.evaluate(() => history.length);
        await page.locator("[data-calendar-close]").click();
        await closed(page);
        expect(await page.evaluate(() => history.length)).toBe(historyLength);
        await expect(page.locator("[data-shell-menu-toggle]")).toBeFocused();
      });

      test("menu entry, Close, Escape, Back/Forward and refresh preserve a predictable return", async ({ page }) => {
        await page.waitForFunction(() => canOpenCalendar());
        const before = await rememberSource(page);
        await openFromMenu(page);
        await sourcePreserved(page, before);
        await page.locator("[data-calendar-close]").click();
        await closed(page);
        await sourcePreserved(page, before, true);
        await page.goForward(); await opened(page);
        await page.goBack(); await closed(page);
        await sourcePreserved(page, before, true);
        await page.goForward(); await opened(page);
        await page.keyboard.press("Escape"); await closed(page);
        await sourcePreserved(page, before, true);
        await expect(page.locator("[data-shell-menu-toggle]")).toBeFocused();
        await page.goForward(); await opened(page);
        await page.reload({ waitUntil: "domcontentloaded" }); await opened(page);
        await page.goBack(); await closed(page);
        await page.goForward(); await opened(page);
        await page.keyboard.press("Escape"); await closed(page);
      });

      test("focus, scrolling, safe clearance and overflow remain usable", async ({ page }, testInfo) => {
        await page.goto("/calendar", { waitUntil: "domcontentloaded" }); await opened(page);
        await page.evaluate(() => document.fonts.ready);
        const frame = page.locator("[data-calendar-frame]"), scroll = page.locator("[data-calendar-scroll]");
        const layout = await page.evaluate(() => {
          const modal = document.querySelector("[data-calendar-overlay]"), frame = modal.querySelector("[data-calendar-frame]"), close = modal.querySelector("[data-calendar-close]");
          return { frame: frame.getBoundingClientRect().toJSON(), close: close.getBoundingClientRect().toJSON(), engine: document.querySelector("[data-portfolio-engine]").getBoundingClientRect().toJSON(),
            overflow: [document.documentElement, modal, frame, modal.querySelector("[data-calendar-scroll]")].some(el => el.scrollWidth > el.clientWidth + 1),
            isolated: [...document.querySelector(".site-shell").children].filter(el => el !== modal).every(el => el.inert),
          };
        });
        expect(layout.overflow).toBe(false); expect(layout.isolated).toBe(true);
        expect(layout.frame.x).toBeGreaterThanOrEqual(12);
        expect(layout.frame.right).toBeLessThanOrEqual(viewport.size.width - 12);
        expect(layout.frame.bottom).toBeLessThan(layout.engine.top);
        expect(layout.close.width).toBeGreaterThanOrEqual(44); expect(layout.close.height).toBeGreaterThanOrEqual(44);
        await page.keyboard.press("Tab"); await expect(scroll).toBeFocused();
        await page.keyboard.press("Tab"); await expect(page.locator("[data-calendar-close]")).toBeFocused();
        await page.keyboard.press("Shift+Tab"); await expect(scroll).toBeFocused();
        await page.keyboard.press("PageDown");
        await expect.poll(() => scroll.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
        const bounds = await scroll.boundingBox();
        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        await page.mouse.wheel(0, 3000);
        await expect.poll(() => scroll.evaluate(el => Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop))).toBeLessThan(2);
        await scroll.evaluate(el => el.scrollTo({ top: 0, behavior: "instant" }));
        await page.locator("[data-calendar-close]").focus();
        await page.screenshot({ path: testInfo.outputPath(`calendar-${viewport.name}-${reducedMotion}.png`) });
        await page.setViewportSize({ width: viewport.size.width, height: viewport.size.height - 140 });
        await expect.poll(() => frame.evaluate(el => el.getBoundingClientRect().bottom < document.querySelector("[data-portfolio-engine]").getBoundingClientRect().top)).toBe(true);
        await page.setViewportSize(viewport.size);
        await page.keyboard.press("Escape"); await closed(page);
      });
    });
  }
}

test.describe("Calendar returns to the existing world", () => {
  test.use({ viewport: { width: 412, height: 915 }, reducedMotion: "reduce", serviceWorkers: "block" });
  for (const route of ["/about", "/music", "/wrestling"]) {
    test(`preserves ${route} through Calendar and uses the Portfolio fallback on refresh`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => canOpenCalendar());
      await page.evaluate(() => {
        for (const node of getV3ResumeScrollers(shellRenderedRoute).values()) if (node) node.scrollTop = Math.min(150, node.scrollHeight - node.clientHeight);
      });
      const before = await rememberSource(page);
      await openFromMenu(page); await sourcePreserved(page, before);
      await page.goBack(); await closed(page, route); await sourcePreserved(page, before, true);
      await page.goForward(); await opened(page);
      await page.keyboard.press("Escape"); await closed(page, route); await sourcePreserved(page, before, true);
      await openFromMenu(page);
      await page.reload({ waitUntil: "domcontentloaded" }); await opened(page);
      await page.locator("[data-calendar-close]").click(); await closed(page);
    });
  }
});
