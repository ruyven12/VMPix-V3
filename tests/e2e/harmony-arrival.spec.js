const { test, expect } = require("@playwright/test");

const harborPath = "/music/venues";
const venues = Array.from({ length: 90 }, (_, i) => ({
  venue_id: "signal-" + i,
  name: "Signal Hall " + String(i).padStart(2, "0"),
  city: i < 85 ? "Portland" : "Concord",
  state: i < 85 ? "ME" : "NH",
  created_at: new Date(Date.UTC(2024, 0, i + 1)).toISOString(),
  ...(i === 86 ? { stats: { photos: 2 } } : {}),
}));

const shows = [
  { show_id: "positive", venue_id: "signal-89", name: "Known photographs", stats: { photos: 5 } },
  { show_id: "zero", venue_id: "signal-88", name: "Verified zero", photo_count: 0 },
  { show_id: "unknown", venue_id: "signal-87", name: "No photo count", bands: ["One", "Two"] },
];

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
    const { status = 200, data = [] } = url.pathname === "/api/music/venues" ? await venueResponse()
      : url.pathname === "/api/music/shows/db" ? { data: shows } : {};
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
      desktop: innerWidth >= 1024,
    };
  });
  expect(metrics.viewportOverflow).toBeLessThanOrEqual(1);
  expect(metrics.chamberOverflow).toBeLessThanOrEqual(1);
  expect(metrics.chamberScroll).toBeLessThanOrEqual(1);
  expect(metrics.widthRatio).toBeGreaterThan(metrics.desktop ? 0.99 : 0.8);
  expect(Math.abs(metrics.clearance - 20)).toBeLessThanOrEqual(2);
  return harbor;
}

async function expectSectorGeometry(archive, expectedCount = 6) {
  const markers = archive.locator("[data-music-venues-connections] circle");
  await expect(markers).toHaveCount(expectedCount);
  await expect(archive.locator("[data-music-venues-connections] line")).toHaveCount(expectedCount);
  const geometry = await archive.evaluate(node => {
    const engineBar = document.querySelector("[data-portfolio-engine]");
    const rect = node.getBoundingClientRect();
    const scroll = node.querySelector("[data-music-venues-list]");
    const footer = node.querySelector("[data-music-venues-sectors]").getBoundingClientRect();
    const labels = [...node.querySelectorAll(".music-venue-beacon")].map(beacon => beacon.getBoundingClientRect());
    const artwork = [[844, 485], [866, 515], [824, 548], [874, 583], [794, 618], [878, 650]];
    const scale = Math.max(rect.width / 1672, rect.height / 941);
    const left = (rect.width - 1672 * scale) / 2;
    const top = (rect.height - 941 * scale) * 0.62;
    const markers = [...node.querySelectorAll("[data-music-venues-connections] circle")];
    return {
      clearance: engineBar.getBoundingClientRect().top - rect.bottom,
      widthRatio: rect.width / innerWidth,
      width: innerWidth,
      overflow: scroll.scrollWidth - scroll.clientWidth,
      footerGap: rect.bottom - footer.bottom,
      art: getComputedStyle(node).backgroundImage.includes("zhento-harmony.png"),
      anchors: markers.every((marker, index) => {
        const [artX, artY] = artwork[index];
        const x = Number(marker.getAttribute("cx"));
        const y = Number(marker.getAttribute("cy"));
        return Math.abs(x - (left + artX * scale)) < 1 && Math.abs(y - (top + artY * scale)) < 1
          && x > 0 && x < rect.width && y > 0 && y < rect.height
          && !labels.some(label => rect.left + x > label.left && rect.left + x < label.right
            && rect.top + y > label.top && rect.top + y < label.bottom);
      }),
      labelsFit: labels.every((label, index) =>
        label.left >= rect.left && label.right <= rect.right && label.top >= rect.top && label.bottom <= footer.top
        && !labels.slice(index + 1).some(other => label.left < other.right && label.right > other.left
          && label.top < other.bottom && label.bottom > other.top)),
    };
  });
  expect(Math.abs(geometry.clearance - 20)).toBeLessThanOrEqual(2);
  expect(geometry.widthRatio).toBeGreaterThan(geometry.width >= 1024 ? 0.99 : 0.8);
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  expect(geometry.footerGap).toBeGreaterThanOrEqual(0);
  expect(geometry.footerGap).toBeLessThan(10);
  expect(geometry.art).toBe(true);
  expect(geometry.anchors).toBe(true);
  expect(geometry.labelsFit).toBe(true);
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
        await expect(page.getByRole("heading", { name: "Beacon Registry", exact: true })).toBeFocused();
        await expect(harbor).toBeHidden();
        const archive = page.locator("[data-music-venues-index]");
        const list = page.locator("[data-music-venues-list]");
        const beacons = list.getByRole("list", { name: "Venue beacons" });
        const search = page.getByRole("searchbox", { name: "Search Venue" });
        const state = page.getByRole("combobox", { name: "Filter venues by state" });
        const sort = page.getByRole("combobox", { name: "Filter venues by sort" });
        const venueFilter = page.getByRole("combobox", { name: "Filter venues by venue" });
        const filters = list.locator("summary");
        const previous = list.getByRole("button", { name: "Previous Sector" });
        const next = list.getByRole("button", { name: "Next Sector" });
        const count = list.locator("[data-music-venues-count]");
        const range = list.locator("[data-music-venues-range]");
        const inspect = number => beacons.getByRole("link", { name: "Inspect Signal Hall " + number });
        await expect(beacons.getByRole("listitem")).toHaveCount(6);
        await expect(count).toHaveText("Showing 6 Venues");
        await expect(range).toHaveText("Maine Venues — S");
        await expect(search).toBeHidden();
        await expect(inspect("00")).toHaveAttribute("href", harborPath + "/signal-0");
        expect(await inspect("00").evaluate(node => node.getBoundingClientRect().width)).toBeGreaterThanOrEqual(44);
        expect(await page.evaluate(() => history.length)).toBe(beforeBrowse);
        expect(requests).toBe(1);
        await expectSectorGeometry(archive);

        if (reducedMotion === "no-preference") {
          await page.screenshot({ path: testInfo.outputPath("beacon-sectors-" + width + "x" + height + ".png") });
        }

        await previous.press("Enter");
        await expect(inspect("84")).toBeVisible();
        await expect(range).toHaveText("ME / NH Venues — S");
        await next.press("Enter");
        await expect(inspect("00")).toBeVisible();

        await filters.press("Enter");
        await search.fill("Concord");
        await expect(beacons.getByRole("listitem")).toHaveCount(5);
        await expect(beacons.getByRole("listitem").first()).toContainText("Concord, NH");
        await expect(count).toHaveText("Showing 5 Venues");
        await expect(range).toHaveText("New Hampshire Venues — S");
        await expect(next).toBeDisabled();
        await sort.selectOption("photos");
        await expect(beacons.locator("strong")).toHaveText(["Signal Hall 89", "Signal Hall 86", "Signal Hall 88", "Signal Hall 85", "Signal Hall 87"]);
        await search.fill("Signal Hall");
        await state.focus();
        await state.selectOption("ME");
        await expect(state).toBeFocused();
        await sort.selectOption("newest");
        await expect(inspect("84")).toBeVisible();
        await venueFilter.selectOption("signal-30");
        await expect(beacons.getByRole("listitem")).toHaveCount(1);
        await expect(count).toHaveText("Showing 1 Venue");
        await expect(inspect("30")).toBeVisible();
        await venueFilter.selectOption("");
        await filters.press("Enter");
        await expect(search).toBeHidden();

        await previous.press("Enter");
        await expect(beacons.getByRole("listitem")).toHaveCount(1);
        await expect(count).toHaveText("Showing 1 Venue");
        await expect(inspect("00")).toBeVisible();
        await next.press("Enter");
        await expect(inspect("84")).toBeVisible();
        await next.press("Enter");
        await expect(inspect("78")).toBeVisible();
        await next.press("Enter");
        await expect(inspect("72")).toBeVisible();
        await expect(inspect("84")).toHaveCount(0);
        const venue = inspect("72");
        await venue.scrollIntoViewIfNeeded();
        const scroll = await list.evaluate(node => node.scrollTop);
        await venue.press("Enter");
        await expect(page).toHaveURL(baseURL + harborPath + "/signal-72");
        await expect(page.getByRole("heading", { name: "Signal Hall 72" })).toBeVisible();
        await expect(harbor).toBeHidden();

        async function expectRestoredArchive() {
          await expect(page).toHaveURL(baseURL + harborPath);
          await expect(list.locator('[data-music-venues-filter="search"]')).toHaveValue("Signal Hall");
          await expect(list.locator('[data-music-venues-filter="state"]')).toHaveValue("ME");
          await expect(list.locator('[data-music-venues-filter="sort"]')).toHaveValue("newest");
          await expect(search).toBeHidden();
          await expect(beacons.getByRole("listitem")).toHaveCount(6);
          await expect(inspect("72")).toBeVisible();
          await expect.poll(() => list.evaluate((node, saved) => Math.abs(node.scrollTop - saved), scroll)).toBeLessThan(2);
          await expect(harbor).toBeHidden();
        }
        await page.locator("[data-prototype-engine-return]").press("Enter");
        await expectRestoredArchive();
        await page.goForward();
        await expect(page.getByRole("heading", { name: "Signal Hall 72" })).toBeVisible();
        if (width === 412 && reducedMotion === "reduce") {
          await page.reload({ waitUntil: "domcontentloaded" });
          await expect(page.getByRole("heading", { name: "Signal Hall 72" })).toBeVisible();
        }
        await page.goBack();
        await expectRestoredArchive();
        await next.press("Enter");
        await expect(inspect("66")).toBeVisible();
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
        await expect(archive.getByText("Establishing venue beacon signals.")).toBeVisible();
        release({ status: 503 });
        await expect(archive.getByText("Venue records could not load from the archive source.")).toBeVisible();
        await expect(archive.locator("[data-music-venues-count]")).toHaveText("");
        await expect(archive.getByRole("listitem")).toHaveCount(0);
        await archive.getByRole("button", { name: "Retry Venues" }).click();
        await expect(archive.getByText("No venues match the current filters.")).toBeVisible();
        await expect(archive.locator("[data-music-venues-count]")).toHaveText("Showing 0 Venues");
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
  await harbor.getByRole("button", { name: "Browse Venues" }).click();
  const scroller = page.locator("[data-music-venues-list]");
  const search = page.getByRole("searchbox", { name: "Search Venue" });
  await expect(scroller.getByRole("listitem")).toHaveCount(6);
  const inlinePadding = await scroller.evaluate(node => {
    const style = getComputedStyle(node);
    return [parseFloat(style.paddingRight), parseFloat(style.paddingLeft)];
  });
  expect(inlinePadding).toEqual([insets.right, insets.left]);
  await page.setViewportSize({ width: 412, height: 330 });
  await scroller.locator("summary").press("Enter");
  await search.fill("Concord");
  await expect(search).toBeFocused();
  await expect(search).toBeInViewport({ ratio: 1 });
  const lastResult = scroller.getByRole("link", { name: "Inspect Signal Hall 89" });
  await lastResult.scrollIntoViewIfNeeded();
  await expect(lastResult).toBeInViewport({ ratio: 1 });
  await expect(scroller.getByRole("listitem")).toHaveCount(5);
  await scroller.locator("summary").press("Enter");
  await page.setViewportSize({ width: 915, height: 412 });
  await expectSectorGeometry(page.locator("[data-music-venues-index]"), 5);
});

test("Harbor sector caption reports actual mixed-state bounds in newest order", async ({ page, baseURL }) => {
  const venues = [
    { venue_id: "foundry", name: "Foundry", state: "NH", created_at: "2024-03-01" },
    { venue_id: "atlas", name: "Atlas", state: "ME", created_at: "2024-02-01" },
    { venue_id: "cedar", name: "Cedar", city: "Portland", created_at: "2024-01-01" },
  ];
  await mockArchive(page, baseURL, () => ({ data: venues }));
  await page.goto(harborPath, { waitUntil: "domcontentloaded" });
  const reject = page.getByRole("button", { name: "Reject", exact: true });
  if (await reject.isVisible()) await reject.click();
  await page.getByRole("button", { name: "Browse Venues" }).click();

  const range = page.locator("[data-music-venues-range]");
  const names = page.getByRole("list", { name: "Venue beacons" }).locator("strong");
  await expect(names).toHaveText(["Atlas", "Cedar", "Foundry"]);
  await expect(range).toHaveText("ME / NH Venues (state pending) — A–F");
  await page.locator("[data-music-venues-tools] summary").press("Enter");
  await page.getByRole("combobox", { name: "Filter venues by sort" }).selectOption("newest");
  await expect(names).toHaveText(["Foundry", "Atlas", "Cedar"]);
  await expect(range).toHaveText("ME / NH Venues (state pending) — A–F");
});
