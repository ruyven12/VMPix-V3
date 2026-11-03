const { test, expect } = require("@playwright/test");

const harborPath = "/music/venues";
const venues = Array.from({ length: 90 }, (_, i) => ({
  venue_id: "signal-" + i,
  name: "Signal Hall " + String(i).padStart(2, "0"),
  city: "Portland",
  state: i < 85 ? "ME" : "NH",
  created_at: new Date(Date.UTC(2024, 0, i + 1)).toISOString(),
}));

async function mockArchive(page, baseURL, venueResponse) {
  const origin = new URL(baseURL).origin;
  await page.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== "GET") return route.abort();
    if (url.origin === origin && !url.pathname.startsWith("/api/")) return route.continue();
    if (["fonts.googleapis.com", "fonts.gstatic.com"].includes(url.hostname)) return route.continue();
    if (request.resourceType() === "script") return route.fulfill({ contentType: "application/javascript", body: "" });
    if (request.resourceType() === "stylesheet") return route.fulfill({ contentType: "text/css", body: "" });
    const { status = 200, data = [] } = url.pathname === "/api/music/venues" ? await venueResponse() : {};
    return route.fulfill({ status, headers: { "access-control-allow-origin": "*" }, json: { data, total: data.length, totalPages: 1 } });
  });
}

async function expectHarbor(page) {
  const harbor = page.locator("[data-harmony-arrival]");
  await expect(harbor.getByRole("heading", { name: "Harbor of Harmony" })).toBeInViewport({ ratio: 1 });
  await expect(harbor.getByText("The Music Venue Archive")).toBeInViewport({ ratio: 1 });
  await expect(harbor.locator(".harmony-arrival__sigil")).toBeInViewport({ ratio: 1 });
  await expect(page.locator("[data-music-venues-index]")).toBeHidden();
  await expect(page.getByRole("searchbox", { name: "Search Venue" })).toHaveCount(0);
  const art = await harbor.evaluate(async node => {
    const style = getComputedStyle(node);
    const background = style.backgroundImage;
    const url = background.match(/url\("([^"]+zhento-harmony\.png)"\)/)?.[1];
    if (!url || !style.backgroundSize.endsWith("cover")) return false;
    const image = new Image();
    image.src = url;
    await image.decode();
    return image.naturalWidth > 0;
  });
  expect(art).toBe(true);
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await expect(harbor.getByRole("button", { name: "Browse Venues" })).toBeInViewport({ ratio: 1 });
  const engine = page.locator("[data-prototype-engine-return]");
  await expect(engine).toBeInViewport();
  const metrics = await harbor.evaluate(node => {
    const engineBar = document.querySelector("[data-portfolio-engine]");
    const harborRect = node.getBoundingClientRect();
    return {
      viewportOverflow: document.documentElement.scrollWidth - innerWidth,
      chamberOverflow: node.scrollWidth - node.clientWidth,
      chamberScroll: node.scrollHeight - node.clientHeight,
      clearance: engineBar.getBoundingClientRect().top - harborRect.bottom,
      widthRatio: harborRect.width / innerWidth,
    };
  });
  expect(metrics.viewportOverflow).toBeLessThanOrEqual(1);
  expect(metrics.chamberOverflow).toBeLessThanOrEqual(1);
  expect(metrics.chamberScroll).toBeLessThanOrEqual(1);
  expect(metrics.widthRatio).toBeGreaterThan(0.8);
  expect(Math.abs(metrics.clearance - 20)).toBeLessThanOrEqual(2);
  return harbor;
}

for (const [width, height] of [[360, 800], [412, 915], [915, 412], [1920, 1080]]) {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    test.describe("Harbor " + width + "x" + height + " " + reducedMotion, () => {
      test.use({ viewport: { width, height }, reducedMotion, serviceWorkers: "block" });

      test("opens on entry and refresh and restores the browsed archive through history", async ({ page, baseURL }, testInfo) => {
        test.setTimeout(75000);
        let requests = 0;
        await mockArchive(page, baseURL, () => {
          requests++;
          return { data: venues };
        });
        const errors = [];
        page.on("pageerror", error => errors.push(error.message));
        await page.goto(harborPath, { waitUntil: "domcontentloaded" });
        const reject = page.getByRole("button", { name: "Reject", exact: true });
        if (await reject.isVisible()) await reject.click();
        const harbor = await expectHarbor(page);
        expect(requests).toBe(0);

        if (reducedMotion === "no-preference") {
          await page.screenshot({ path: testInfo.outputPath("harbor-" + width + "x" + height + ".png") });
        }
        const beforeBrowse = await page.evaluate(() => history.length);
        await harbor.getByRole("button", { name: "Browse Venues" }).press("Enter");
        await expect(page.getByRole("heading", { name: "Venues", exact: true })).toBeFocused();
        await expect(harbor).toBeHidden();
        const list = page.locator("[data-music-venues-list]");
        const search = page.getByRole("searchbox", { name: "Search Venue" });
        await expect(list.getByRole("listitem")).toHaveCount(90);
        expect(await page.evaluate(() => history.length)).toBe(beforeBrowse);
        expect(requests).toBe(1);

        await search.fill("Signal Hall");
        await page.getByRole("combobox", { name: "Filter venues by state" }).selectOption("ME");
        await page.getByRole("combobox", { name: "Filter venues by sort" }).selectOption("newest");
        await expect(list.getByRole("listitem")).toHaveCount(85);
        await expect(list.getByRole("listitem").first()).toContainText("Signal Hall 84");
        await page.getByRole("combobox", { name: "Filter venues by venue" }).selectOption("signal-30");
        await expect(list.getByRole("listitem")).toHaveCount(1);
        await expect(list.getByRole("listitem").first()).toContainText("Signal Hall 30");
        await page.getByRole("combobox", { name: "Filter venues by venue" }).selectOption("");
        const card = list.locator('[data-venue-slug="signal-30"]');
        await card.scrollIntoViewIfNeeded();
        const scroll = await list.evaluate(node => node.scrollTop);
        expect(scroll).toBeGreaterThan(0);
        expect(await list.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
        await card.click();
        await expect(page).toHaveURL(baseURL + harborPath + "/signal-30");
        await expect(page.getByRole("heading", { name: "Signal Hall 30" })).toBeVisible();
        await expect(harbor).toBeHidden();

        async function expectRestoredArchive() {
          await expect(page).toHaveURL(baseURL + harborPath);
          await expect(search).toHaveValue("Signal Hall");
          await expect(page.getByRole("combobox", { name: "Filter venues by state" })).toHaveValue("ME");
          await expect(page.getByRole("combobox", { name: "Filter venues by sort" })).toHaveValue("newest");
          await expect(list.getByRole("listitem")).toHaveCount(85);
          await expect.poll(() => list.evaluate((node, saved) => Math.abs(node.scrollTop - saved), scroll)).toBeLessThan(2);
          await expect(harbor).toBeHidden();
        }
        await page.locator("[data-prototype-engine-return]").press("Enter");
        await expectRestoredArchive();
        await page.goForward();
        await expect(page.getByRole("heading", { name: "Signal Hall 30" })).toBeVisible();
        if (width === 412 && reducedMotion === "reduce") {
          await page.reload({ waitUntil: "domcontentloaded" });
          await expect(page.getByRole("heading", { name: "Signal Hall 30" })).toBeVisible();
        }
        await page.goBack();
        await expectRestoredArchive();
        const beforeRefresh = requests;
        await page.reload({ waitUntil: "domcontentloaded" });
        await expectHarbor(page);
        expect(requests).toBe(beforeRefresh);
        await page.locator("[data-prototype-engine-return]").press("Enter");
        await expect(page).toHaveURL(baseURL + "/music");
        await expect(harbor).toBeHidden();
        expect(errors).toEqual([]);
      });

      test("keeps directory loading, Retry, and empty states behind Browse Venues", async ({ page, baseURL }) => {
        let release;
        let requests = 0;
        const pending = new Promise(resolve => { release = resolve; });
        await mockArchive(page, baseURL, () => ++requests === 1 ? pending : { data: [] });
        await page.goto(harborPath, { waitUntil: "domcontentloaded" });
        const reject = page.getByRole("button", { name: "Reject", exact: true });
        if (await reject.isVisible()) await reject.click();
        const harbor = await expectHarbor(page);
        expect(requests).toBe(0);
        await harbor.getByRole("button", { name: "Browse Venues" }).click();
        const archive = page.locator("[data-music-venues-index]");
        await expect(archive.getByText("Preparing venue cards and event relationships.")).toBeVisible();
        release({ status: 503 });
        await expect(archive.getByText("Venue records could not load from the archive source.")).toBeVisible();
        await archive.getByRole("button", { name: "Retry Venues" }).click();
        await expect(archive.getByText("No venues match the current filters.")).toBeVisible();
        await expect(archive.locator("[data-music-venues-count]")).toHaveText("0 venues");
        expect(requests).toBe(2);
        await expect(harbor).toBeHidden();
      });
    });
  }
}

test("keeps the Harbor clear of simulated landscape safe areas", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 915, height: 412 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const devtools = await page.context().newCDPSession(page);
  const insets = { top: 12, right: 28, bottom: 18, left: 32 };
  await devtools.send("Emulation.setSafeAreaInsetsOverride", { insets });
  await mockArchive(page, baseURL, () => ({ data: venues }));
  await page.goto(harborPath, { waitUntil: "domcontentloaded" });
  const reject = page.getByRole("button", { name: "Reject", exact: true });
  if (await reject.isVisible()) await reject.click();
  const harbor = await expectHarbor(page);
  const padding = await harbor.evaluate(node => {
    const style = getComputedStyle(node);
    return ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"].map(side => parseFloat(style[side]));
  });
  expect(padding).toEqual([insets.top, insets.right, insets.bottom, insets.left]);
});
