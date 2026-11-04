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

async function mockArchive(page, baseURL, venueResponse, showsResponse = () => ({ data: shows })) {
  const origin = new URL(baseURL).origin;
  await page.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== "GET") return route.abort();
    if (url.origin === origin && !url.pathname.startsWith("/api/")) return route.continue();
    if (["fonts.googleapis.com", "fonts.gstatic.com"].includes(url.hostname)) return route.continue();
    if (request.resourceType() === "script") return route.fulfill({ contentType: "application/javascript", body: "" });
    if (request.resourceType() === "stylesheet") return route.fulfill({ contentType: "text/css", body: "" });
    const { status = 200, data = [], payload } = url.pathname === "/api/music/venues" ? await venueResponse()
      : url.pathname === "/api/music/shows/db" ? await showsResponse() : {};
    return route.fulfill({ status, headers: { "access-control-allow-origin": "*" }, json: payload ?? { data, total: data.length, totalPages: 1 } });
  });
}

async function expectHarmonyFilterGeometry(page) {
  const archive = page.locator("[data-music-venues-index]");
  await expect.poll(() => archive.evaluate(node => {
    const rect = selector => document.querySelector(selector).getBoundingClientRect();
    const hit = rect("[data-harmony-filter-sigil]");
    const sigil = rect("[data-harmony-sigil]");
    const panel = rect("[data-music-venues-tools]");
    const cue = rect("[data-harmony-filter-cue]");
    const footer = rect("[data-music-venues-sectors]");
    const engine = rect(".portfolio-engine");
    const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const labels = [...node.querySelectorAll(".music-venue-beacon")].map(label => label.getBoundingClientRect());
    const centerX = (hit.left + hit.right) / 2;
    const centerY = (hit.top + hit.bottom) / 2;
    return panel.width > 0 && panel.height > 44 && hit.width >= 44 && hit.height >= 44
      && Math.abs(centerX - (sigil.left + sigil.right) / 2) < 1
      && Math.abs(centerY - (sigil.top + sigil.bottom) / 2) < 1
      && document.elementFromPoint(centerX, centerY) === node.querySelector("[data-harmony-filter-sigil]")
      && cue.top >= sigil.bottom - 1 && cue.bottom <= footer.top
      && panel.left >= 0 && panel.right <= innerWidth && panel.bottom < engine.top
      && !intersects(panel, sigil) && labels.every(label => !intersects(panel, label));
  })).toBe(true);
}

async function expectReachableHarmonyFilter(control) {
  await expect.poll(() => control.evaluate(node => {
    const body = node.closest("[data-music-venues-filters]");
    const bodyBox = body.getBoundingClientRect();
    const controlBox = node.getBoundingClientRect();
    const target = document.elementFromPoint(
      (controlBox.left + controlBox.right) / 2,
      (controlBox.top + controlBox.bottom) / 2
    );
    return body.scrollWidth <= body.clientWidth + 1 && controlBox.width >= 44 && controlBox.height >= 44
      && controlBox.top >= bodyBox.top - 1 && controlBox.bottom <= bodyBox.bottom + 1 && node.contains(target);
  })).toBe(true);
}

async function expectHarmonyEnvironment(page) {
  const environment = page.locator("[data-harmony-environment]");
  const sigil = environment.locator("[data-harmony-sigil]");
  await expect(environment).toBeInViewport({ ratio: 1 });
  await expect(environment).toHaveAttribute("aria-hidden", "true");
  await expect(sigil).toHaveCount(1);
  await expect(sigil).toBeInViewport({ ratio: 1 });
  const geometry = await environment.evaluate(async node => {
    const style = getComputedStyle(node);
    const art = node.querySelector("[data-harmony-art]");
    const artStyle = getComputedStyle(art);
    const url = artStyle.backgroundImage.match(/url\("([^"]+zhento-harmony\.png)"\)/)?.[1];
    if (!url || artStyle.backgroundSize !== "cover") return null;
    const image = new Image();
    image.src = url;
    await image.decode();
    const outer = node.getBoundingClientRect();
    const paint = art.getBoundingClientRect();
    const shell = node.closest(".site-shell").getBoundingClientRect();
    const engine = document.querySelector("[data-portfolio-engine]").getBoundingClientRect();
    const sigil = node.querySelector("[data-harmony-sigil]").getBoundingClientRect();
    const scale = Math.max(paint.width / 1672, paint.height / 941);
    const crop = Number(artStyle.getPropertyValue("--harmony-art-crop-y"));
    const sigilArtY = Number(artStyle.getPropertyValue("--harmony-sigil-art-y"));
    const expectedX = paint.left + (paint.width - 1672 * scale) / 2 + 836 * scale;
    const expectedY = paint.top + (paint.height - 941 * scale) * crop + sigilArtY * scale;
    const hit = document.elementFromPoint(engine.left + engine.width / 2, engine.top + engine.height / 2);
    return {
      fullBleed: [outer.left - shell.left, outer.top - shell.top, outer.right - shell.right, outer.bottom - shell.bottom,
        outer.left, outer.top, outer.right - innerWidth, outer.bottom - innerHeight].every(offset => Math.abs(offset) < 1),
      paintCoversShell: paint.left <= outer.left && paint.top <= outer.top && paint.right >= outer.right && paint.bottom >= outer.bottom,
      behindEngine: engine.top < outer.bottom && engine.bottom <= outer.bottom + 1 && !node.contains(hit),
      pointerTransparent: style.pointerEvents === "none",
      source: [image.naturalWidth, image.naturalHeight],
      sigilAnchored: Math.abs((sigil.left + sigil.right) / 2 - expectedX) < 1
        && Math.abs((sigil.top + sigil.bottom) / 2 - expectedY) < 1,
    };
  });
  expect(geometry).toEqual({
    fullBleed: true,
    paintCoversShell: true,
    behindEngine: true,
    pointerTransparent: true,
    source: [1672, 941],
    sigilAnchored: true,
  });
  return sigil;
}

async function expectHarbor(page) {
  const harbor = page.locator("[data-harmony-arrival]");
  await expect(harbor.getByRole("heading", { name: "Harbor of Harmony" })).toBeInViewport({ ratio: 1 });
  await expect(harbor.getByText("The Music Venue Archive")).toBeInViewport({ ratio: 1 });
  const sigil = await expectHarmonyEnvironment(page);
  await expect(page.locator("[data-music-venues-index]")).toBeHidden();
  await expect(page.getByRole("searchbox", { name: "Search Venue" })).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready.then(() => true));
  const browse = harbor.getByRole("button", { name: "Browse Venues" });
  await expect(browse).toBeInViewport({ ratio: 1 });
  const sigilBox = await sigil.boundingBox();
  const buttonBox = await browse.boundingBox();
  expect(sigilBox.y + sigilBox.height).toBeLessThanOrEqual(buttonBox.y + 1);
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

async function expectSectorGeometry(archive, expectedCount = 8) {
  const markers = archive.locator("[data-music-venues-connections] .music-venue-beacon-stud");
  await expect(markers).toHaveCount(expectedCount);
  await expect(markers.locator("path")).toHaveCount(expectedCount * 2);
  await expect(archive.locator("[data-music-venues-connections] circle")).toHaveCount(0);
  await expect(archive.locator("[data-music-venues-connections] line")).toHaveCount(expectedCount);
  const geometry = await archive.evaluate(node => {
    const engineBar = document.querySelector("[data-portfolio-engine]");
    const rect = node.getBoundingClientRect();
    const scroll = node.querySelector("[data-music-venues-list]");
    const footer = node.querySelector("[data-music-venues-sectors]").getBoundingClientRect();
    const labels = [...node.querySelectorAll(".music-venue-beacon")].map(beacon => beacon.getBoundingClientRect());
    const artwork = [[846, 478], [864, 481], [844, 485], [866, 515], [824, 548], [874, 583], [794, 618], [878, 650]];
    const svg = node.querySelector("[data-music-venues-connections]");
    const stage = svg.getBoundingClientRect();
    const art = document.querySelector("[data-harmony-art]");
    const paint = art.getBoundingClientRect();
    const sigil = document.querySelector("[data-harmony-sigil]").getBoundingClientRect();
    const scale = Math.max(paint.width / 1672, paint.height / 941);
    const left = paint.left + (paint.width - 1672 * scale) / 2 - stage.left;
    const top = paint.top + (paint.height - 941 * scale) * Number(getComputedStyle(art).getPropertyValue("--harmony-art-crop-y")) - stage.top;
    const markers = [...svg.querySelectorAll(".music-venue-beacon-stud")];
    const lines = [...svg.querySelectorAll("line")];
    const segments = lines.map(line => ["x1", "y1", "x2", "y2"].map(attr => Number(line.getAttribute(attr))));
    const side = ([x1, y1, x2, y2], x, y) => (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1);
    const crosses = (first, second) => side(first, second[0], second[1]) * side(first, second[2], second[3]) < 0
      && side(second, first[0], first[1]) * side(second, first[2], first[3]) < 0;
    const overlapsSigil = box => box.left < sigil.right && box.right > sigil.left && box.top < sigil.bottom && box.bottom > sigil.top;
    const insideSigil = (x, y) => x > sigil.left && x < sigil.right && y > sigil.top && y < sigil.bottom;
    return {
      clearance: engineBar.getBoundingClientRect().top - rect.bottom,
      widthRatio: rect.width / innerWidth,
      width: innerWidth,
      overflow: scroll.scrollWidth - scroll.clientWidth,
      footerGap: rect.bottom - footer.bottom,
      sigilClear: !labels.some(overlapsSigil) && !overlapsSigil(footer)
        && lines.every(line => {
          const [x1, y1, x2, y2] = ["x1", "y1", "x2", "y2"].map(attr => Number(line.getAttribute(attr)));
          return Array.from({ length: 101 }, (_, step) => step / 100).every(fraction =>
            !insideSigil(stage.left + x1 + (x2 - x1) * fraction, stage.top + y1 + (y2 - y1) * fraction));
        }),
      newConnectorsClear: segments.slice(0, 2).every((segment, index) =>
        segments.slice(index + 1).every(other => !crosses(segment, other))),
      anchors: markers.every((marker, index) => {
        const [artX, artY] = artwork[index];
        const center = new DOMPoint().matrixTransform(marker.getScreenCTM());
        const x = center.x - stage.left;
        const y = center.y - stage.top;
        const box = marker.getBoundingClientRect();
        const line = lines[index];
        return Math.abs(x - (left + artX * scale)) < 1 && Math.abs(y - (top + artY * scale)) < 1
          && Math.abs(x - Number(line.getAttribute("x2"))) < 1 && Math.abs(y - Number(line.getAttribute("y2"))) < 1
          && Math.abs(box.width - (7.2 + index * 0.4)) < 0.05 && box.height < box.width / 2
          && box.left >= stage.left && box.right <= stage.right && box.top >= stage.top && box.bottom <= stage.bottom
          && !overlapsSigil(box)
          && !labels.some(label => box.left < label.right && box.right > label.left
            && box.top < label.bottom && box.bottom > label.top)
          && markers.slice(index + 1).every(other => {
            const bounds = other.getBoundingClientRect();
            return box.right <= bounds.left || box.left >= bounds.right
              || box.bottom <= bounds.top || box.top >= bounds.bottom;
          });
      }),
      touchTargets: [...node.querySelectorAll(".music-venue-beacon-link")].every(link => {
        const box = link.getBoundingClientRect();
        return box.width >= 44 && box.height >= 44;
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
  expect(geometry.sigilClear).toBe(true);
  expect(geometry.anchors).toBe(true);
  expect(geometry.newConnectorsClear).toBe(true);
  expect(geometry.labelsFit).toBe(true);
  expect(geometry.touchTargets).toBe(true);
}

for (const [width, height] of [[360, 800], [412, 915], [915, 412], [1920, 1080]]) {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    test.describe("Harbor " + width + "x" + height + " " + reducedMotion, () => {
      test.use({ viewport: { width, height }, serviceWorkers: "block" });
      test.beforeEach(async ({ page }) => {
        await page.emulateMedia({ reducedMotion });
        expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches))
          .toBe(reducedMotion === "reduce");
      });

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
        await page.getByRole("button", { name: "Reject", exact: true }).click();
        const harbor = await expectHarbor(page);
        expect(requests).toBe(0);

        if (reducedMotion === "no-preference") {
          await page.screenshot({ path: testInfo.outputPath("harbor-" + width + "x" + height + ".png") });
        }
        const sigil = page.locator("[data-harmony-sigil]");
        const sigilNode = await sigil.elementHandle();
        const ignitions = await sigil.evaluateHandle(node => {
          const calls = [];
          const animate = node.animate.bind(node);
          node.animate = (frames, options) => {
            // Inspect and its matching return are separate from the Browse ignition.
            if (!node.closest('[data-harmony-venue-passage="converging"], [data-harmony-venue-return]')) {
              calls.push({ frames, duration: options.duration });
            }
            return animate(frames, options);
          };
          return calls;
        });
        const expectedIgnitions = reducedMotion === "reduce" ? [] : [
          { frames: [{ opacity: 0.82 }, { opacity: 1 }], duration: 160 },
        ];
        const arrivalSigilBox = await sigil.boundingBox();
        const beforeBrowse = await page.evaluate(() => history.length);
        await harbor.getByRole("button", { name: "Browse Venues" }).press("Enter");
        await expect(page.getByRole("heading", { name: "Beacon Registry", exact: true })).toBeFocused();
        await expect(harbor).toBeHidden();
        expect(await ignitions.jsonValue()).toEqual(expectedIgnitions);
        const archive = page.locator("[data-music-venues-index]");
        await expect(archive).not.toHaveAttribute("data-harmony-activation", /.+/);
        await expect(archive.locator(".harmony-registry-pulse")).toHaveCount(0);
        const list = page.locator("[data-music-venues-list]");
        const beacons = list.getByRole("list", { name: "Venue beacons" });
        const search = page.getByRole("searchbox", { name: "Search Venue" });
        const state = page.getByRole("combobox", { name: "Filter venues by state" });
        const sort = page.getByRole("combobox", { name: "Filter venues by sort" });
        const reset = page.getByRole("button", { name: "Reset Filters" });
        const filters = archive.getByRole("button", { name: "Venue filters", exact: true });
        const previous = list.getByRole("button", { name: "Previous Sector" });
        const next = list.getByRole("button", { name: "Next Sector" });
        const range = list.locator("[data-music-venues-range]");
        const inspect = number => beacons.getByRole("link", { name: "Inspect Signal Hall " + number });
        const changeSector = async (control) => {
          await control.press("Enter");
          await expect(control).not.toHaveAttribute("aria-disabled", "true");
        };
        await expect(beacons.getByRole("listitem")).toHaveCount(8);
        await expect(archive.locator("[data-music-venues-count]")).toHaveCount(0);
        await expect(range).toHaveText("Maine Venues — S");
        await expect(search).toBeHidden();
        await expect(inspect("00")).toHaveAttribute("href", harborPath + "/signal-0");
        expect(await inspect("00").evaluate(node => node.getBoundingClientRect().width)).toBeGreaterThanOrEqual(44);
        expect(await page.evaluate(() => history.length)).toBe(beforeBrowse);
        expect(requests).toBe(1);
        await expectHarmonyEnvironment(page);
        expect(await sigil.evaluate((node, original) => node === original, sigilNode)).toBe(true);
        expect(await sigil.boundingBox()).toEqual(arrivalSigilBox);
        await expectSectorGeometry(archive);

        if (reducedMotion === "no-preference") {
          await expect(sigil).toHaveCSS("opacity", "1");
          await page.screenshot({ path: testInfo.outputPath("beacon-sectors-" + width + "x" + height + ".png") });
        }

        await changeSector(previous);
        await expect(inspect("88")).toBeVisible();
        await expect(beacons.getByRole("listitem")).toHaveCount(2);
        await expect(range).toHaveText("New Hampshire Venues — S");
        await changeSector(next);
        await expect(inspect("00")).toBeVisible();

        await filters.locator("[data-harmony-filter-cue]").click();
        await expect(filters).toHaveAttribute("aria-expanded", "true");
        await expect(search).toBeFocused();
        await expect(archive).not.toHaveAttribute("data-harmony-filter-motion", /.+/);
        await expectHarmonyFilterGeometry(page);
        await expect(page.getByRole("combobox", { name: "Filter venues by venue" })).toHaveCount(0);
        const filterBody = archive.locator("[data-music-venues-filters]");
        if (height > width) {
          expect(await filterBody.evaluate(node => node.scrollHeight - node.clientHeight)).toBeLessThanOrEqual(1);
        }
        for (const control of [search, state, sort, reset]) {
          await expect(control).toBeFocused();
          await expectReachableHarmonyFilter(control);
          if (control !== reset) await page.keyboard.press("Tab");
        }
        await search.fill("Concord");
        await expect(beacons.getByRole("listitem")).toHaveCount(5);
        await expect(beacons.getByRole("listitem").first()).toContainText("Concord, NH");
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
        await search.fill("Signal Hall 30");
        await expect(beacons.getByRole("listitem")).toHaveCount(1);
        await expect(inspect("30")).toBeVisible();
        await reset.click();
        await expect(search).toBeFocused();
        await expect(search).toHaveValue("");
        await expect(state).toHaveValue("");
        await expect(sort).toHaveValue("az");
        expect(await filterBody.evaluate(node => node.scrollTop)).toBe(0);
        await expect(inspect("00")).toBeVisible();
        await search.fill("Signal Hall");
        await state.selectOption("ME");
        await sort.selectOption("newest");
        await search.press("Escape");
        await expect(filters).toBeFocused();
        await expect(filters).toHaveAttribute("aria-expanded", "false");
        await expect(search).toBeHidden();

        await changeSector(previous);
        await expect(beacons.getByRole("listitem")).toHaveCount(5);
        await expect(inspect("00")).toBeVisible();
        await changeSector(next);
        await expect(inspect("84")).toBeVisible();
        await changeSector(next);
        await expect(inspect("76")).toBeVisible();
        await changeSector(next);
        await expect(inspect("68")).toBeVisible();
        await expect(inspect("84")).toHaveCount(0);
        const venue = inspect("68");
        await venue.scrollIntoViewIfNeeded();
        const scroll = await list.evaluate(node => node.scrollTop);
        await venue.press("Enter");
        await expect(page).toHaveURL(baseURL + harborPath + "/signal-68");
        await expect(page.getByRole("heading", { name: "Signal Hall 68" })).toBeFocused();
        expect(await page.evaluate(() => history.length)).toBe(beforeBrowse + 1);
        const projection = page.locator("[data-harmony-venue-projection]");
        await expect(projection).toBeHidden();
        await expect(archive).not.toHaveAttribute("data-harmony-projection", /.+/);
        await expect(harbor).toBeHidden();
        await expect(page.locator("[data-harmony-environment]")).toBeVisible();
        await expect(sigil).toBeHidden();

        async function expectRestoredArchive() {
          await expect(page).toHaveURL(baseURL + harborPath);
          await expect(archive.locator('[data-music-venues-filter="search"]')).toHaveValue("Signal Hall");
          await expect(archive.locator('[data-music-venues-filter="state"]')).toHaveValue("ME");
          await expect(archive.locator('[data-music-venues-filter="sort"]')).toHaveValue("newest");
          await expect(search).toBeHidden();
          await expect(beacons.getByRole("listitem")).toHaveCount(8);
          await expect(inspect("68")).toBeFocused();
          await expect(projection).toBeHidden();
          await expect.poll(() => list.evaluate((node, saved) => Math.abs(node.scrollTop - saved), scroll)).toBeLessThan(2);
          await expect(harbor).toBeHidden();
          await expect(archive).not.toHaveAttribute("data-harmony-activation", /.+/);
        }
        await page.locator("[data-prototype-engine-return]").press("Enter");
        await expectRestoredArchive();
        await page.goForward();
        await expect(page.getByRole("heading", { name: "Signal Hall 68" })).toBeVisible();
        expect(await ignitions.jsonValue()).toEqual(expectedIgnitions);
        if (width === 412 && reducedMotion === "reduce") {
          await page.reload({ waitUntil: "domcontentloaded" });
          await expect(page.getByRole("heading", { name: "Signal Hall 68" })).toBeVisible();
        }
        await page.goBack();
        await expectRestoredArchive();
        await changeSector(next);
        await expect(inspect("60")).toBeVisible();
        if (!(width === 412 && reducedMotion === "reduce")) {
          expect(await ignitions.jsonValue()).toEqual(expectedIgnitions);
        }
        const beforeRefresh = requests;
        await page.reload({ waitUntil: "domcontentloaded" });
        await expectHarbor(page);
        expect(requests).toBe(beforeRefresh);
        await page.locator("[data-prototype-engine-return]").press("Enter");
        await expect(page).toHaveURL(baseURL + "/music");
        await expect(harbor).toBeHidden();
        expect(errors).toEqual([]);
      });

      test("keeps one Harbor loading, Retry, and empty state behind Browse Venues", async ({ page, baseURL }) => {
        let releaseFailure;
        let releaseRetry;
        let venueRequests = 0;
        let showsRequests = 0;
        const failure = new Promise(resolve => { releaseFailure = resolve; });
        const retry = new Promise(resolve => { releaseRetry = resolve; });
        await mockArchive(page, baseURL, () => ++venueRequests === 1 ? failure : retry, () => {
          showsRequests++;
          return { data: shows };
        });
        await page.goto(harborPath, { waitUntil: "domcontentloaded" });
        const reject = page.getByRole("button", { name: "Reject", exact: true });
        if (await reject.isVisible()) await reject.click();
        const harbor = await expectHarbor(page);
        expect(venueRequests).toBe(0);
        expect(showsRequests).toBe(0);

        await harbor.getByRole("button", { name: "Browse Venues" }).click();
        const archive = page.locator("[data-music-venues-index]");
        const signal = archive.locator(".harmony-registry-signal");
        await expect(signal).toHaveCount(1);
        await expect(signal).toBeVisible();
        await expect(signal).toHaveAttribute("role", "status");
        await expect(signal).toContainText("Establishing Beacon Signals");
        await expect(archive.getByText("Loading Venue Grid", { exact: true })).toHaveCount(0);
        await expect(archive.getByRole("listitem")).toHaveCount(0);
        await expectHarmonyEnvironment(page);
        await expect(page.locator("[data-prototype-engine-return]")).toBeVisible();

        releaseFailure({ status: 503 });
        await expect(signal).toHaveAttribute("role", "alert");
        await expect(signal).toContainText("Beacon Signals Unavailable");
        await expect(archive.locator("[data-music-venues-range]")).toHaveText("");
        expect(venueRequests).toBe(1);
        expect(showsRequests).toBe(0);

        await signal.getByRole("button", { name: "Retry Venues" }).press("Enter");
        await expect(signal).toContainText("Establishing Beacon Signals");
        releaseRetry({ data: [] });
        await expect(signal).toContainText("No venue records are available in the archive.");
        await expect(signal.getByRole("button")).toHaveCount(0);
        await expect(archive).not.toHaveAttribute("data-harmony-activation", /.+/);
        await expect(archive.locator(".harmony-registry-pulse")).toHaveCount(0);
        await expect(archive.locator("[data-music-venues-range]")).toHaveText("");
        expect(venueRequests).toBe(2);
        expect(showsRequests).toBe(0);
        await expect(harbor).toBeHidden();
      });
    });
  }
}

test("Harbor Inspect preserves native link intent and restores open filters, focus, and nonzero scroll", async ({ page, baseURL }) => {
  test.setTimeout(45000);
  await page.setViewportSize({ width: 915, height: 412 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockArchive(page, baseURL, () => ({ data: venues }));
  await page.goto(harborPath, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  await page.getByRole("button", { name: "Browse Venues" }).press("Enter");

  const archive = page.locator("[data-music-venues-index]");
  const registry = page.locator("[data-music-venues-list]");
  const search = page.getByRole("searchbox", { name: "Search Venue" });
  const inspect = registry.getByRole("link", { name: "Inspect Signal Hall 06" });
  const sigil = page.locator("[data-harmony-filter-sigil]");
  const originalLength = await page.evaluate(() => history.length);
  await expect(inspect).toHaveAttribute("href", harborPath + "/signal-6");
  const intercepted = await inspect.evaluate(link => {
    return [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }].map(input => {
      let prevented;
      // Observe after the link handler and suppress the browser's native destination in this mock.
      document.addEventListener("click", event => {
        prevented = event.defaultPrevented;
        event.preventDefault();
      }, { once: true });
      link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ...input }));
      return prevented;
    });
  });
  expect(intercepted).toEqual([false, false, false, false, false]);
  await expect(page).toHaveURL(baseURL + harborPath);
  expect(await page.evaluate(() => history.length)).toBe(originalLength);

  await sigil.press("Enter");
  await search.fill("Signal Hall");
  const scroll = await registry.evaluate(node => {
    // Constrain the Registry scrollport to exercise scroll preservation in landscape.
    node.style.maxHeight = "14rem";
    node.scrollTop = 24;
    return node.scrollTop;
  });
  expect(scroll).toBeGreaterThan(0);
  await inspect.click();
  await expect(page).toHaveURL(baseURL + harborPath + "/signal-6");
  const dossier = page.locator("[data-venue-detail]");
  await expect(dossier.getByRole("heading", { name: "Signal Hall 06", exact: true })).toBeFocused();
  await expect(dossier).toHaveAttribute("data-venue-id", "signal-6");
  await expect(dossier.locator("[data-venue-detail-location]")).toHaveText("Portland, ME");
  await expect(page.locator("[data-harmony-venue-projection]")).toBeHidden();
  await expect(archive).not.toHaveAttribute("data-harmony-projection", /.+/);
  expect(await page.evaluate(() => history.length)).toBe(originalLength + 1);

  const expectRestoredRegistry = async () => {
    await expect(page).toHaveURL(baseURL + harborPath);
    await expect(inspect).toBeFocused();
    await expect(sigil).toHaveAttribute("aria-expanded", "true");
    await expect(search).toHaveValue("Signal Hall");
    expect(await registry.evaluate(node => node.scrollTop)).toBe(scroll);
  };
  await page.goBack();
  await expectRestoredRegistry();
  await page.goForward();
  await expect(dossier.getByRole("heading", { name: "Signal Hall 06", exact: true })).toBeVisible();
  await page.locator("[data-prototype-engine-return]").press("Enter");
  await expectRestoredRegistry();
});

for (const [width, height, clipped] of [[412, 915], [915, 412], [915, 412, true]]) {
  test("Harbor venue passage converges, holds, and hands off to one exact dossier title at " + width + "x" + height + (clipped ? " with clipped source plates" : ""), async ({ page, baseURL }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await mockArchive(page, baseURL, () => ({ data: venues }));
    await page.goto(harborPath, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Reject", exact: true }).click();
    await page.getByRole("button", { name: "Browse Venues" }).press("Enter");
    const archive = page.locator("[data-music-venues-index]");
    await expect(archive).not.toHaveAttribute("data-harmony-activation", /.+/);

    const shell = page.locator(".site-shell");
    const layer = shell.locator(".harmony-venue-passage");
    const plates = layer.locator(".harmony-venue-passage__plate");
    const ghost = layer.locator(".harmony-venue-passage__title");
    const selected = layer.locator("[data-harmony-passage-selected]");
    const engine = page.locator("[data-portfolio-engine]");
    const source = page.getByRole("link", { name: "Inspect Signal Hall 03" });
    const target = page.locator("[data-venue-detail-title]");
    const originalEngine = await engine.boundingBox();
    const sourceClip = clipped ? await archive.locator("[data-music-venues-list]").evaluate(list => {
      list.style.maxHeight = "14rem";
      list.scrollTop = 9;
      const box = list.getBoundingClientRect();
      return { top: box.top + list.clientTop, bottom: box.top + list.clientTop + list.clientHeight, scroll: list.scrollTop };
    }) : null;
    if (sourceClip) expect(sourceClip.scroll).toBeGreaterThan(0);
    const originalLength = await page.evaluate(() => {
      const animate = Element.prototype.animate;
      window.harmonyArtBeforePassage = document.querySelector("[data-harmony-art]");
      window.harmonyPassageAnimations = [];
      Element.prototype.animate = function (frames, options) {
        const animation = animate.call(this, frames, options);
        if (this.closest("[data-harmony-venue-passage] .harmony-venue-passage")) {
          animation.pause();
          window.harmonyPassageAnimations.push(animation);
        }
        return animation;
      };
      return history.length;
    });
    const finish = durations => page.evaluate(values => {
      window.harmonyPassageAnimations
        .filter(animation => values.includes(animation.effect.getTiming().duration))
        .forEach(animation => animation.finish());
    }, durations);

    await source.press("Enter");
    await expect(shell).toHaveAttribute("data-harmony-venue-passage", "converging");
    await expect(layer).toHaveAttribute("inert", "");
    await expect(layer).toHaveAttribute("aria-hidden", "true");
    if (sourceClip) {
      expect(await layer.evaluate(node => getComputedStyle(node).clipPath)).toMatch(/^inset\(/);
      expect(await plates.evaluateAll(nodes => Math.max(...nodes.map(node => node.getBoundingClientRect().bottom))))
        .toBeGreaterThan(sourceClip.bottom);
    } else {
      await expect(plates).toHaveCount(8);
    }
    await expect(selected).toContainText("Signal Hall 03");
    await expect(page).toHaveURL(baseURL + harborPath);
    await page.locator('[data-music-venues-beacons] [data-venue-slug="signal-3"] a').evaluate(link => link.click());
    expect(await page.evaluate(() => history.length)).toBe(originalLength);
    await finish([340]);
    await expect(shell).toHaveAttribute("data-harmony-venue-passage", "hold");
    const aboveStack = await selected.evaluate(node => {
      const centerY = box => (box.top + box.bottom) / 2;
      return [...node.parentElement.children].every(plate => plate === node
        || centerY(node.getBoundingClientRect()) < centerY(plate.getBoundingClientRect()));
    });
    expect(aboveStack).toBe(true);
    const stackBox = await selected.boundingBox();
    expect(stackBox.y + stackBox.height).toBeLessThan(originalEngine.y);
    if (sourceClip) {
      const stack = await plates.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()));
      expect(Math.min(...stack.map(box => box.top))).toBeGreaterThanOrEqual(sourceClip.top - 1);
      expect(Math.max(...stack.map(box => box.bottom))).toBeLessThanOrEqual(sourceClip.bottom + 1);
    }
    await expect(page).toHaveURL(baseURL + harborPath);
    await finish([125]);

    await expect(page).toHaveURL(baseURL + harborPath + "/signal-3");
    await expect(shell).toHaveAttribute("data-harmony-venue-passage", "handoff");
    await expect(ghost).toHaveText("Signal Hall 03");
    expect(await layer.evaluate(node => getComputedStyle(node).clipPath)).toBe("none");
    await expect(target).toBeHidden();
    expect(await engine.boundingBox()).toEqual(originalEngine);
    expect(await page.evaluate(() => window.harmonyArtBeforePassage === document.querySelector("[data-harmony-art]"))).toBe(true);
    const titleTravel = await ghost.evaluate((node, minimumTravel) => {
      const animation = node.getAnimations()[0];
      const centerY = box => (box.top + box.bottom) / 2;
      animation.currentTime = 0;
      const from = centerY(node.getBoundingClientRect());
      animation.currentTime = 360;
      const ghostBox = node.getBoundingClientRect();
      const titleBox = document.querySelector("[data-venue-detail-title]").getBoundingClientRect();
      return { rises: from - centerY(ghostBox) > minimumTravel,
        exact: ["left", "top", "width", "height"].every(property => Math.abs(ghostBox[property] - titleBox[property]) < 1) };
    }, sourceClip ? 30 : 48);
    expect(titleTravel).toEqual({ rises: true, exact: true });
    await finish([260, 360]);
    await expect(layer).toHaveCount(0);
    await expect(target).toHaveText("Signal Hall 03");
    await expect(target).toBeFocused();
    expect(await page.evaluate(() => history.length)).toBe(originalLength + 1);
    await page.goBack();
    await expect(source).toBeFocused();
    await expect(layer).toHaveCount(0);
  });
}

test("Harbor venue passage yields to Engine Back at the handoff boundary", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await mockArchive(page, baseURL, () => ({ data: venues }));
  await page.goto(harborPath, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  await page.getByRole("button", { name: "Browse Venues" }).click();
  const archive = page.locator("[data-music-venues-index]");
  const shell = page.locator(".site-shell");
  await expect(archive).not.toHaveAttribute("data-harmony-activation", /.+/);
  await page.evaluate(() => {
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      const animation = animate.call(this, frames, options);
      if (this.matches(".harmony-venue-passage__plate") && options.duration === 125) {
        animation.pause();
        animation.currentTime = 124;
      }
      return animation;
    };
  });
  await page.getByRole("link", { name: "Inspect Signal Hall 03" }).click();
  await expect(shell).toHaveAttribute("data-harmony-venue-passage", "hold");
  const originalLength = await page.evaluate(() => history.length);
  await page.locator("[data-prototype-engine-return]").press("Enter");
  await expect(shell).not.toHaveAttribute("data-harmony-venue-passage", /.+/);
  await expect(page.locator(".harmony-venue-passage")).toHaveCount(0);
  await expect(page).toHaveURL(baseURL + "/music");
  expect(await page.evaluate(() => history.length)).toBe(originalLength);
});

test("Harbor Engine Back keeps the unfinished forward title covered until native history returns", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await mockArchive(page, baseURL, () => ({ data: venues }));
  await page.goto(harborPath, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  await page.getByRole("button", { name: "Browse Venues" }).press("Enter");
  const archive = page.locator("[data-music-venues-index]");
  const shell = page.locator(".site-shell");
  const detail = page.locator("[data-venue-detail]");
  const title = detail.locator("[data-venue-detail-title]");
  const ghost = shell.locator(".harmony-venue-passage__title");
  const inspect = archive.getByRole("link", { name: "Inspect Signal Hall 03" });
  await expect(archive).not.toHaveAttribute("data-harmony-activation", /.+/);
  await page.evaluate(() => {
    const animate = Element.prototype.animate;
    const nativeBack = history.back.bind(history);
    history.back = () => { window.releaseHeldHarborBack = nativeBack; };
    Element.prototype.animate = function (frames, options) {
      const animation = animate.call(this, frames, options);
      if (this.matches(".harmony-venue-passage__title") && options.duration === 360) {
        animation.pause();
        animation.currentTime = 350;
      }
      return animation;
    };
  });
  await inspect.press("Enter");
  await expect(ghost).toBeVisible();
  await expect(title).toBeHidden();
  const heldFrames = await page.evaluate(async () => {
    const ghost = document.querySelector(".harmony-venue-passage__title");
    const title = document.querySelector("[data-venue-detail-title]");
    const animation = ghost.getAnimations()[0];
    animation.play();
    document.querySelector("[data-prototype-engine-return]").click();
    const frames = [];
    for (let index = 0; index < 3; index++) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      frames.push({ carried: ghost.isConnected, hidden: getComputedStyle(title).visibility === "hidden", time: animation.currentTime });
    }
    return frames;
  });
  expect(heldFrames).toEqual(Array(3).fill({ carried: true, hidden: true, time: 350 }));
  await expect(page).toHaveURL(baseURL + harborPath + "/signal-3");
  const restored = await page.evaluate(() => new Promise(resolve => {
    window.addEventListener("popstate", () => requestAnimationFrame(() => {
      const shell = document.querySelector(".site-shell");
      resolve({ route: shell.dataset.shellRoute, passage: Boolean(document.querySelector(".harmony-venue-passage, .shell-back-sweep")),
        dossierHidden: document.querySelector("[data-venue-detail]").getAttribute("aria-hidden") === "true" });
    }), { once: true });
    window.releaseHeldHarborBack();
  }));
  expect(restored).toEqual({ route: "music-venues", passage: false, dossierHidden: true });
  await expect(page).toHaveURL(baseURL + harborPath);
  await expect(shell).not.toHaveAttribute("data-harmony-venue-return", /.+/);
  await expect(inspect).toBeFocused();
});

for (const [width, height, partial] of [[915, 412, false], [412, 915, true]]) {
  test("Harbor venue return restores the real Registry with " + (partial ? "a partially clipped title" : "an offscreen title") + " and keeps Engine Back single", async ({ page, baseURL }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    let venueRequests = 0;
    await mockArchive(page, baseURL, () => { venueRequests++; return { data: venues }; });
    await page.goto(harborPath, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Reject", exact: true }).click();
    await page.getByRole("button", { name: "Browse Venues" }).press("Enter");
    const shell = page.locator(".site-shell");
    const archive = page.locator("[data-music-venues-index]");
    const list = archive.locator("[data-music-venues-list]");
    const inspect = archive.getByRole("link", { name: "Inspect Signal Hall 03" });
    const detail = page.locator("[data-venue-detail]");
    const title = detail.locator("[data-venue-detail-title]");
    const engine = page.locator("[data-portfolio-engine]");
    const layer = shell.locator(".harmony-venue-passage");
    const ghost = layer.locator(".harmony-venue-passage__title");
    const selected = layer.locator("[data-harmony-passage-selected]");
    await expect(archive).not.toHaveAttribute("data-harmony-activation", /.+/);
    const scroll = await list.evaluate((node, hasClippedHeading) => {
      if (hasClippedHeading) return node.scrollTop;
      node.style.maxHeight = "14rem";
      node.scrollTop = 9;
      return node.scrollTop;
    }, partial);
    if (!partial) expect(scroll).toBeGreaterThan(0);
    const originalBox = await inspect.locator("..").boundingBox();
    const engineBox = await engine.boundingBox();
    await inspect.press("Enter");
    await expect(title).toBeFocused();
    if (partial) await page.addStyleTag({ content: ".music-nexus-shell.is-venue-detail { max-height: 28rem; }" });
    const source = await title.evaluate((node, hasClippedHeading) => {
      const scroller = node.closest("[data-music-nexus-shell]");
      const top = scroller.getBoundingClientRect().top + scroller.clientTop;
      const before = node.getBoundingClientRect();
      const target = hasClippedHeading ? before.top - top + before.height / 2 : scroller.scrollHeight;
      scroller.scrollTo({ top: target, behavior: "instant" });
      const box = node.getBoundingClientRect();
      return { top, bottom: box.bottom, titleTop: box.top };
    }, partial);
    expect(source.titleTop).toBeLessThan(source.top);
    if (partial) expect(source.bottom).toBeGreaterThan(source.top);
    else expect(source.bottom).toBeLessThan(source.top);
    const originalHistory = await page.evaluate(() => {
      const animate = Element.prototype.animate;
      window.harmonyReturnArt = document.querySelector("[data-harmony-art]");
      window.harmonyReturnAnimations = [];
      Element.prototype.animate = function (frames, options) {
        const animation = animate.call(this, frames, options);
        if (this.closest(".site-shell[data-harmony-venue-return]")
            && (this.matches("[data-venue-detail]") || this.closest(".harmony-venue-passage"))) {
          animation.pause();
          window.harmonyReturnAnimations.push(animation);
        }
        return animation;
      };
      return history.length;
    });
    const finish = durations => page.evaluate(values => {
      window.harmonyReturnAnimations.filter(animation => values.includes(animation.effect.getTiming().duration))
        .forEach(animation => animation.finish());
    }, durations);
    // Activate the existing local Back control without its offscreen focus changing the deliberate scroll fixture.
    await detail.locator("[data-venue-detail-back]").evaluate(button => button.click());
    await expect(page).toHaveURL(baseURL + harborPath);
    await expect(shell).toHaveAttribute("data-harmony-venue-return", "departing");
    await expect(ghost).toHaveText("Signal Hall 03");
    await expect(ghost).toHaveCSS("opacity", partial ? "1" : "0");
    if (partial) {
      expect((await ghost.boundingBox()).y).toBeCloseTo(source.titleTop, 0);
      expect(await layer.evaluate(node => getComputedStyle(node).clipPath)).toMatch(/^inset\(/);
    } else {
      expect((await ghost.boundingBox()).y).toBeGreaterThanOrEqual(source.top);
    }
    await finish([130]);
    await expect(shell).toHaveAttribute("data-harmony-venue-return", "descending");
    await expect(archive).toHaveCSS("opacity", "0");
    const travel = await ghost.evaluate(node => {
      const animation = node.getAnimations().find(item => item.effect.getTiming().duration === 360);
      animation.currentTime = 0;
      const textBox = element => {
        const range = document.createRange();
        range.selectNodeContents(element);
        return range.getBoundingClientRect();
      };
      const start = textBox(node);
      animation.currentTime = 360;
      const end = textBox(node);
      const name = textBox(node.parentElement.querySelector("[data-harmony-passage-selected] strong"));
      return { descends: end.y - start.y > 30,
        centered: Math.abs((end.left + end.right - name.left - name.right) / 2) < 1
          && Math.abs((end.top + end.bottom - name.top - name.bottom) / 2) < 1 };
    });
    expect(travel).toEqual({ descends: true, centered: true });
    await page.locator("[data-prototype-engine-return]").press("Enter");
    await expect(page).toHaveURL(baseURL + harborPath);
    await expect(shell).toHaveAttribute("data-harmony-venue-return", "descending");
    await finish([220, 360]);
    await expect(shell).toHaveAttribute("data-harmony-venue-return", "hold");
    expect(await layer.evaluate(node => getComputedStyle(node).clipPath)).toBe("none");
    await expect(ghost).toHaveCount(0);
    await expect(selected).toContainText("Signal Hall 03");
    await finish([125]);
    await expect(shell).toHaveAttribute("data-harmony-venue-return", "spreading");
    await finish([340]);
    await expect(layer).toHaveCount(0);
    await expect(inspect).toBeFocused();
    expect(await list.evaluate(node => node.scrollTop)).toBe(scroll);
    expect(await inspect.locator("..").boundingBox()).toEqual(originalBox);
    expect(await engine.boundingBox()).toEqual(engineBox);
    expect(await page.evaluate(() => window.harmonyReturnArt === document.querySelector("[data-harmony-art]"))).toBe(true);
    expect(await page.evaluate(() => history.length)).toBe(originalHistory);
    expect(venueRequests).toBe(1);
  });
}

test("Venue Dossier presents a fixed Harbor backdrop and verified metadata only", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockArchive(page, baseURL, () => ({ payload: { rows: [
    { venue_id: "aura", venue: "Aura", city: "Portland", state: "Maine", established_year: "1996", latitude: "0", gps_lng: 0, region: "New England" },
    { venue_id: "partial", venue: "Partial Venue", city: "Portland", state: "unknown", establishedyear: 1997, gpslat: "44.03", gpslon: "181", region: "N/A" },
    { venue_id: "recorded-location", venue: "Recorded Location", location_label: "Riverfront District" },
    { venue_id: "unrecorded", venue: "Unrecorded Details", city: "—", state: "Pending", created_at: "2001-01-01", latitude: "", longitude: 0, region: { name: "New England" } },
  ] } }), () => ({ data: [] }));
  await page.goto(harborPath + "/aura", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Reject", exact: true }).click();

  const dossier = page.locator("[data-venue-detail]");
  const identity = dossier.locator("[data-venue-detail-identity]");
  const title = identity.getByRole("heading", { name: "Aura", exact: true });
  const metadata = dossier.getByRole("region", { name: "Venue metadata" });
  const field = name => metadata.locator('[data-venue-detail-field="' + name + '"]');
  const missing = metadata.locator("[data-venue-detail-missing]");
  const environment = page.locator("[data-harmony-environment]");
  const art = environment.locator("[data-harmony-art]");
  const engine = page.locator("[data-portfolio-engine]");
  const shell = page.locator(".site-shell");
  await expect(title).toBeVisible();
  await expect(field("location").locator("dd")).toHaveText("Portland, ME");
  await expect(field("established").locator("dd")).toHaveText("1996");
  await expect(field("gps").locator("dd")).toHaveText("0, 0");
  await expect(field("region").locator("dd")).toHaveText("New England");
  await expect(missing).toBeHidden();
  await expect(dossier.locator(".venue-detail-logo-card, .venue-detail-kicker, .venue-detail-visual")).toHaveCount(0);
  await expect(environment).toBeVisible();
  await expect(art).toHaveCSS("background-image", /zhento-harmony\.png/);
  await expect(environment.locator("[data-harmony-sigil]")).toBeHidden();
  const background = await environment.boundingBox();
  const shellBox = await shell.boundingBox();
  const headingBox = await title.boundingBox();
  const metadataBox = await metadata.boundingBox();
  const engineBox = await engine.boundingBox();
  expect(background).toEqual(shellBox);
  expect(Math.abs((headingBox.x + headingBox.width / 2) - (shellBox.x + shellBox.width / 2))).toBeLessThanOrEqual(8);
  const gap = metadataBox.y - headingBox.y - headingBox.height;
  expect(gap / (engineBox.y - shellBox.y)).toBeGreaterThan(0.26);
  expect(gap / (engineBox.y - shellBox.y)).toBeLessThan(0.4);
  const scrollHost = page.locator(".music-nexus-shell");
  await scrollHost.evaluate(node => node.scrollTo({ top: node.scrollHeight, behavior: "instant" }));
  expect(await scrollHost.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  expect(await environment.boundingBox()).toEqual(background);
  expect(await engine.boundingBox()).toEqual(engineBox);

  await page.evaluate(path => navigateToRoute(path), harborPath + "/partial");
  await expect(identity.getByRole("heading", { name: "Partial Venue", exact: true })).toBeVisible();
  await expect(field("location").locator("dd")).toHaveText("Portland");
  await expect(field("established").locator("dd")).toHaveText("1997");
  await expect(field("gps")).toBeHidden();
  await expect(field("region")).toBeHidden();
  await expect(missing).toHaveText("Unavailable Data: State, GPS, Region");

  await page.evaluate(path => navigateToRoute(path), harborPath + "/recorded-location");
  await expect(identity.getByRole("heading", { name: "Recorded Location", exact: true })).toBeVisible();
  await expect(field("location").locator("dd")).toHaveText("Riverfront District");
  await expect(missing).toHaveText("Unavailable Data: Established, GPS, Region");

  await page.evaluate(path => navigateToRoute(path), harborPath + "/unrecorded");
  await expect(identity.getByRole("heading", { name: "Unrecorded Details", exact: true })).toBeVisible();
  await expect(metadata.locator("[data-venue-detail-fields]")).toBeHidden();
  await expect(missing).toHaveText("Unavailable Data: City, State, Established, GPS, Region");
});

test("Venue Dossier keeps the compact archive truthful and opens stable filmstrip photos in the shared lightbox", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const caption = "A recorded caption with enough detail to continue across multiple lines in the shared photo info drawer without truncation.";
  const photos = Array.from({ length: 22 }, (_, index) => ({
    image_key: "venue-photo-" + index,
    thumbnail_url: "/assets/branding/voodoo-media-logo-transparent.png?venue-thumb=" + index,
    large_url: "/assets/branding/voodoo-media-logo-transparent.png?venue-original=" + index,
    caption: index === 5 ? caption : index === 7 ? "" : "Recorded frame " + index,
  }));
  const shows = [
    { show_id: "first", venue_id: "aura", name: "First Event", date: "2024-08-01",
      bands: [{ band: "Signal Artist" }, { name: "signal artist" }, { name: { invalid: "record" } }, "TBA"] },
    { show_id: "last", venue_id: "aura", name: "Last Event", date: "February 2, 2025", performers: [{ artist: "Second Artist" }] },
    { show_id: "partial", venue_id: "aura", name: "Title Guess with Imaginary Artist", date: "2010" },
    { show_id: "invalid", venue_id: "aura", name: "Invalid Date", date: "February 31, 2000" },
    { show_id: "no-lineup", venue_id: "no-lineup", name: "Unverified Title with Guess", date: "2019" },
  ];
  await mockArchive(page, baseURL, () => ({ data: [
    { venue_id: "aura", venue: "Aura", region: "New England", photo_count: 12 },
    { venue_id: "no-lineup", venue: "No Lineup" },
  ] }), () => ({ data: shows }));
  const galleryRequests = [];
  await page.route(/\?venue-thumb=0$/, route => route.fulfill({ status: 404, body: "" }));
  await page.route(/\/api\/music\/venues\/[^/]+\/photos\?/, route => {
    const url = new URL(route.request().url());
    galleryRequests.push([url.pathname, url.searchParams.get("page"), url.searchParams.get("limit")]);
    return route.fulfill({
      headers: { "access-control-allow-origin": "*" },
      json: { photos: url.pathname.endsWith("/aura/photos") ? [photos[0], ...photos] : [] },
    });
  });
  await page.goto(harborPath + "/aura", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Reject", exact: true }).click();

  const dossier = page.locator("[data-venue-detail]");
  const archive = dossier.getByRole("region", { name: "Venue Archive" });
  const card = name => archive.locator('[data-venue-relationship="' + name + '"]');
  const value = name => card(name).locator(".venue-relationship-media span");
  await expect(archive.getByRole("heading", { name: "Venue Archive" })).toBeVisible();
  await expect(archive.locator(".venue-relationship-title")).toHaveText([
    "Archive Events", "Featured Artists", "Total Photos", "Regional Context", "Archive History",
  ]);
  await expect(value("shows")).toHaveText("4");
  await expect(value("bands")).toHaveText("2");
  await expect(value("photos")).toHaveText("12");
  await expect(value("region")).toHaveText("New England");
  await expect(value("history")).toHaveText("Aug 1, 2024 → Feb 2, 2025");
  await expect(card("shows")).toHaveAccessibleDescription("4");
  await expect(card("bands")).toHaveAccessibleDescription("2");
  expect(await archive.evaluate(node => {
    const [events, artists, photos, region, history] = [...node.querySelectorAll("[data-venue-relationship]")];
    const box = element => element.getBoundingClientRect();
    return box(events).top === box(artists).top && box(photos).top === box(region).top
      && box(history).left === box(events).left && box(history).right === box(artists).right
      && [photos, region, history].every(tile => getComputedStyle(tile, "::after").content === "none");
  })).toBe(true);
  await card("bands").press("Enter");
  const artistPanel = dossier.locator("[data-venue-artists-panel]");
  await expect(artistPanel).toContainText("Signal Artist");
  await expect(artistPanel).not.toContainText("Imaginary Artist");
  await artistPanel.getByRole("searchbox", { name: "Search Artists" }).fill("Second");
  await expect(artistPanel.locator(".venue-artists-grid")).toContainText("Second Artist");
  await expect(artistPanel.locator(".venue-artists-grid")).not.toContainText("Signal Artist");
  await card("bands").press("Enter");

  const strip = dossier.locator("[data-venue-photo-filmstrip]");
  const tiles = strip.locator("[data-venue-photo-highlight]");
  await expect(tiles).toHaveCount(19);
  const firstImage = tiles.first().locator("img");
  await expect(firstImage).toHaveCSS("object-fit", "cover");
  await expect(firstImage).toHaveAttribute("draggable", "false");
  await firstImage.scrollIntoViewIfNeeded();
  await expect(firstImage).toHaveAttribute("src", /archive-gallery-placeholder\.svg$/);
  await expect(tiles.first()).toHaveText("");
  const tile = tiles.nth(5);
  await tile.scrollIntoViewIfNeeded();
  const bounds = await tile.boundingBox();
  expect(Math.abs(bounds.width - bounds.height)).toBeLessThanOrEqual(1);
  const stripScroll = await strip.evaluate(node => node.scrollLeft);
  const scroller = page.locator(".music-nexus-shell");
  const dossierScroll = await scroller.evaluate(node => node.scrollTop);
  expect(stripScroll).toBeGreaterThan(0);
  await tile.click();

  const lightbox = page.getByRole("dialog");
  const info = lightbox.getByRole("button", { name: "Photo Info" });
  await expect(lightbox).toBeVisible();
  await expect(page).toHaveURL(baseURL + harborPath + "/aura");
  await expect(lightbox.locator("[data-lightbox-image]")).toHaveAttribute("src", /venue-original=5$/);
  await expect(lightbox.locator("[data-lightbox-image]")).toHaveCSS("object-fit", "contain");
  await info.press("Enter");
  await expect(lightbox.locator("[data-venue-lightbox-caption]")).toBeVisible();
  await expect(lightbox.locator("[data-venue-lightbox-caption]")).toHaveText(caption);
  await lightbox.getByRole("button", { name: "Close photo info" }).press("Enter");
  await lightbox.getByRole("button", { name: "Next photo" }).press("Enter");
  await expect(lightbox.locator("[data-lightbox-image]")).toHaveAttribute("src", /venue-original=6$/);
  await info.press("Enter");
  await lightbox.getByRole("button", { name: "Close photo info" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(lightbox.locator("[data-lightbox-image]")).toHaveAttribute("src", /venue-original=7$/);
  await expect(info).toBeHidden();
  await expect(lightbox.locator("[data-lightbox-info-panel]")).toHaveAttribute("aria-hidden", "true");
  const closeLightbox = lightbox.getByRole("button", { name: "Close lightbox" });
  await expect(closeLightbox).toBeFocused();
  await closeLightbox.press("Enter");
  await expect(lightbox).toBeHidden();
  await expect(tile).toBeFocused();
  expect(await strip.evaluate(node => node.scrollLeft)).toBe(stripScroll);
  expect(await scroller.evaluate(node => node.scrollTop)).toBe(dossierScroll);
  expect(galleryRequests).toEqual([["/api/music/venues/aura/photos", "1", "20"]]);

  await page.evaluate(path => navigateToRoute(path), harborPath + "/no-lineup");
  await expect(value("shows")).toHaveText("1");
  await expect(value("bands")).toHaveText("—");
  await expect(value("history")).toHaveText("—");
  await card("bands").press("Enter");
  await expect(artistPanel).toContainText("No verified artist records for these linked shows.");
});

test("Venue Dossier shows verified Sheet totals without deriving counts from linked or sampled photos", async ({ page, baseURL }) => {
  test.setTimeout(75000);
  await page.setViewportSize({ width: 412, height: 915 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const cases = [
    [{ photo_count: 96 }, "96"],
    [{ photo_count: 0, total_photos: "0" }, "0"],
    [{ photo_count: 0 }, "—"],
    [{ photo_count: 0, totalphotos: "147" }, "147"],
    [{ photo_count: 9, totalPhotos: "10" }, "—"],
    [{ photo_count: 3, photoCount: "3.5", photosTotal: { toString: "invalid" } }, "—"],
    [{ stats: { photos: 999 } }, "—"],
    [{ photo_count: 0, total_photos: "9007199254740992" }, "—"],
  ];
  const sourceRows = cases.map(([fields], index) => ({ ...venues[index], ...fields }));
  const duplicateShows = [
    { show_id: "count-a", name: "Count A", venue_id: "signal-2", album_id: "shared", photo_count: 48 },
    { show_id: "count-b", name: "Count B", venue_id: "signal-2", album_id: "shared", photo_count: 48 },
    { show_id: "count-c", name: "Count C", venue_id: "signal-2", photo_count: 0, bands: ["One", "Two"] },
  ];
  await mockArchive(page, baseURL, () => ({
    payload: { source: "Music-Venue", rows: sourceRows, stats: { photo_count: 0 } },
  }), () => ({ data: duplicateShows }));

  const sample = { image_key: "same-photo", thumbnail_url: "/assets/branding/voodoo-media-logo-transparent.png" };
  await page.route(/\/api\/music\/venues\/[^/]+\/photos\?/, route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith("/signal-0/photos")) {
      return route.fulfill({ status: 503, headers: { "access-control-allow-origin": "*" }, json: {} });
    }
    if (pathname.endsWith("/signal-7/photos")) {
      return route.fulfill({
        headers: { "access-control-allow-origin": "*" },
        json: { photos: [{ thumbnail_url: "invalid" }] },
      });
    }
    if (pathname.endsWith("/signal-1/photos")) {
      return route.fulfill({
        headers: { "access-control-allow-origin": "*" },
        json: {
          photos: [],
          summary: { venue_total_photos: 0, aggregated_photo_count: 0, returned_count: 0 },
          pagination: { total: 0, limit: 20, page: 1 },
        },
      });
    }
    return route.fulfill({
      headers: { "access-control-allow-origin": "*" },
      json: {
        photos: [sample, sample],
        summary: { venue_total_photos: 999, aggregated_photo_count: 11, scanned_photo_count: 11 },
        pagination: { total: 11, limit: 20, page: 1 },
        warnings: ["Album scan limited to 12 of 15 linked albums.", "One linked album fetch failed."],
      },
    });
  });
  await page.goto(harborPath, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  await page.getByRole("button", { name: "Browse Venues" }).press("Enter");
  const dossier = page.locator("[data-venue-detail]");
  const count = dossier.locator('[data-venue-relationship="photos"] .venue-relationship-media span');
  for (const [index, [, expected]] of cases.entries()) {
    const inspect = page.getByRole("link", { name: "Inspect " + venues[index].name });
    await inspect.press("Enter");
    await expect(page).toHaveURL(baseURL + harborPath + "/signal-" + index);
    await expect(dossier.getByRole("heading", { name: venues[index].name, exact: true })).toBeVisible();
    const highlights = dossier.locator("[data-venue-photo-highlights]");
    if (index === 0 || index === 7) {
      await expect(highlights).toContainText("Photo highlights unavailable.");
    } else if (index === 1) {
      await expect(highlights).toContainText("No photo highlights available.");
    } else {
      await expect(highlights.locator("[data-venue-photo-highlight]")).toHaveCount(1);
    }
    if (index === 2) {
      await expect(dossier.locator('[data-venue-relationship="shows"] .venue-relationship-media span')).toHaveText("3");
    }
    await expect(count).toHaveText(expected);
    await page.locator("[data-prototype-engine-return]").press("Enter");
    await expect(inspect).toBeFocused();
  }
});

test("Venue Dossier keeps identity and totals unknown while verified Venue data is unavailable", async ({ page, baseURL }) => {
  let releaseVenues;
  let showsRequests = 0;
  let highlightsRequests = 0;
  const pending = new Promise(resolve => { releaseVenues = resolve; });
  await mockArchive(page, baseURL, () => pending, () => {
    showsRequests++;
    return { data: shows };
  });
  page.on("request", request => {
    if (/\/api\/music\/venues\/[^/]+\/photos$/.test(new URL(request.url()).pathname)) highlightsRequests++;
  });
  const venueRequest = page.waitForRequest(request => new URL(request.url()).pathname === "/api/music/venues");
  await page.goto(harborPath + "/the-electric-hall", { waitUntil: "domcontentloaded" });
  const breadcrumb = page.getByRole("navigation", { name: /Current location.*Venue Detail/ });
  const count = page.locator('[data-venue-detail] [data-venue-relationship="photos"] .venue-relationship-media span');
  try {
    await venueRequest;
    await expect(page.locator("[data-venue-detail-identity]")).toBeHidden();
    await expect(page.locator("[data-venue-detail-metadata]")).toBeHidden();
    await expect(page.locator('[data-music-venue-detail-state="loading"]')).toContainText("Loading Venue Archive");
    await expect(page.getByRole("heading", { name: "The Electric Hall", exact: true })).toHaveCount(0);
    await expect(breadcrumb).toBeAttached();
    await expect(breadcrumb).not.toContainText("The Electric Hall");
    await expect(count).toHaveText("—");
  } finally {
    releaseVenues({ status: 503 });
  }
  await expect(page.locator('[data-music-venue-detail-state="error"]')).toBeVisible();
  await expect(page.locator("[data-venue-detail-identity]")).toBeHidden();
  await expect(page.locator("[data-venue-detail-metadata]")).toBeHidden();
  await expect(page.getByRole("heading", { name: "The Electric Hall", exact: true })).toHaveCount(0);
  await expect(breadcrumb).toBeAttached();
  await expect(breadcrumb).not.toContainText("The Electric Hall");
  await expect(count).toHaveText("—");
  await page.goto(harborPath + "/missing-venue-total", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-music-venue-detail-state="error"]')).toBeVisible();
  await expect(count).toHaveText("—");
  expect(showsRequests).toBe(0);
  expect(highlightsRequests).toBe(0);
});

test("Venue Dossier Retry keeps the current error on failure and recovers Aura in place", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  let venueRequests = 0;
  let showsRequests = 0;
  let nextVenueResponse = { status: 503 };
  await mockArchive(page, baseURL, () => {
    venueRequests++;
    return nextVenueResponse;
  }, () => {
    showsRequests++;
    return { data: shows };
  });
  await page.goto(harborPath + "/aura", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  const dossier = page.locator("[data-venue-detail]");
  const error = dossier.locator('[data-music-venue-detail-state="error"]');
  const retry = error.getByRole("button", { name: "Retry Venues" });
  await expect(error).toContainText("Unable To Load Archive Data");
  const originalButton = await retry.elementHandle();
  const originalDossier = await dossier.elementHandle();
  const historyLength = await page.evaluate(() => history.length);
  expect(showsRequests).toBe(0);

  const startRetry = async () => {
    let release;
    nextVenueResponse = new Promise(resolve => { release = resolve; });
    const expectedRequests = venueRequests + 1;
    await retry.press("Enter");
    await retry.press("Enter");
    await expect.poll(() => venueRequests).toBe(expectedRequests);
    await expect(error).toBeVisible();
    await expect(retry).toBeFocused();
    expect(await retry.evaluate((node, original) => node === original, originalButton)).toBe(true);
    return async (payload) => {
      release(payload);
      await expect.poll(() => page.evaluate(() => musicVenuesRequest === null)).toBe(true);
      expect(venueRequests).toBe(expectedRequests);
    };
  };
  await (await startRetry())({ status: 503 });
  await expect(retry).toBeFocused();
  expect(await retry.evaluate((node, original) => node === original, originalButton)).toBe(true);
  await expect(page).toHaveURL(baseURL + harborPath + "/aura");
  expect(showsRequests).toBe(0);

  await (await startRetry())({
    payload: { rows: [{ venue_id: "aura", venue: "Aura", city: "Portland", state: "ME", photo_count: 123 }] },
  });
  await expect(dossier.getByRole("heading", { name: "Aura", exact: true })).toBeVisible();
  await expect(dossier.locator("[data-venue-detail-location]")).toHaveText("Portland, ME");
  await expect(dossier.locator('[data-venue-relationship="photos"] .venue-relationship-media span')).toHaveText("123");
  await expect(dossier.locator("[data-venue-relationships]")).toBeVisible();
  await expect(error).toHaveCount(0);
  await expect(page).toHaveURL(baseURL + harborPath + "/aura");
  expect(await dossier.evaluate((node, original) => node === original, originalDossier)).toBe(true);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  await expect.poll(() => showsRequests).toBe(1);
});

test("Venue Dossier Retry cannot repaint a different dossier after navigation", async ({ page, baseURL }) => {
  let release;
  const pendingRetry = new Promise(resolve => { release = resolve; });
  let shouldHold = false;
  await mockArchive(page, baseURL, () => shouldHold ? pendingRetry : { status: 503 });
  await page.goto(harborPath + "/aura", { waitUntil: "domcontentloaded" });
  const retry = page.getByRole("button", { name: "Retry Venues" });
  await expect(retry).toBeVisible();
  shouldHold = true;
  const retryRequested = page.waitForRequest(request => new URL(request.url()).pathname === "/api/music/venues");
  try {
    await retry.press("Enter");
    await retryRequested;
    await page.evaluate(path => navigateToRoute(path), harborPath + "/other-room");
    await expect(page).toHaveURL(baseURL + harborPath + "/other-room");
    await expect(page.locator('[data-music-venue-detail-state="loading"]')).toBeVisible();
    await page.locator("[data-venue-detail-title]").evaluate(node => {
      window.dossierRetryTitleChanges = [];
      new MutationObserver(records => {
        for (const record of records) {
          for (const added of record.addedNodes) window.dossierRetryTitleChanges.push(added.textContent);
        }
      }).observe(node, { childList: true });
    });
  } finally {
    release({ data: [
      { venue_id: "aura", venue: "Aura" },
      { venue_id: "other-room", venue: "Other Room" },
    ] });
  }
  await expect(page.getByRole("heading", { name: "Other Room", exact: true })).toBeVisible();
  const titleChanges = await page.evaluate(() => window.dossierRetryTitleChanges);
  expect(titleChanges).toContain("Other Room");
  expect(titleChanges).not.toContain("Aura");
  await expect(page).toHaveURL(baseURL + harborPath + "/other-room");
});

test("Venue Dossier Retry recovers the same dossier beneath a retained Shell overlay", async ({ page, baseURL }) => {
  let release;
  const pendingRetry = new Promise(resolve => { release = resolve; });
  let shouldHold = false;
  await mockArchive(page, baseURL, () => shouldHold ? pendingRetry : { status: 503 });
  await page.goto(harborPath + "/aura", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  const retry = page.getByRole("button", { name: "Retry Venues" });
  await expect(retry).toBeVisible();
  shouldHold = true;
  const retryRequested = page.waitForRequest(request => new URL(request.url()).pathname === "/api/music/venues");
  try {
    await retry.press("Enter");
    await retryRequested;
    await page.evaluate(() => navigateToRoute("/calendar"));
    await expect(page).toHaveURL(baseURL + "/calendar");
    await expect(page.locator("[data-calendar-overlay]")).toBeVisible();
  } finally {
    release({ data: [{ venue_id: "aura", venue: "Aura" }] });
  }
  await expect(page.locator("[data-venue-detail-title]")).toHaveText("Aura");
  await expect(page.locator("[data-calendar-overlay]")).toBeVisible();
  await page.locator("[data-calendar-close]").press("Enter");
  await expect(page).toHaveURL(baseURL + harborPath + "/aura");
  await expect(page.getByRole("heading", { name: "Aura", exact: true })).toBeVisible();
  await expect(page.locator("[data-music-venue-detail-state]")).toHaveCount(0);
});

test("Venue Dossier paints verified identity and Highlights while linked Shows are pending", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  let releaseVenues;
  let releaseShows;
  const pendingVenues = new Promise(resolve => { releaseVenues = resolve; });
  const pendingShows = new Promise(resolve => { releaseShows = resolve; });
  let showsRequests = 0;
  let highlightsRequests = 0;
  await mockArchive(page, baseURL, () => pendingVenues, () => {
    showsRequests++;
    return pendingShows;
  });
  page.on("request", request => {
    if (/\/api\/music\/venues\/aura\/photos$/.test(new URL(request.url()).pathname)) highlightsRequests++;
  });
  const requested = page.waitForRequest(request => new URL(request.url()).pathname === "/api/music/venues");
  await page.goto(harborPath + "/aura", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  const dossier = page.locator("[data-venue-detail]");
  const title = dossier.locator("[data-venue-detail-title]");
  const events = dossier.locator('[data-venue-relationship="shows"]');
  const artists = dossier.locator('[data-venue-relationship="bands"]');
  const highlights = dossier.locator("[data-venue-photo-highlights]");
  try {
    await requested;
    await expect(title).toHaveText("Venue Dossier");
    await expect(dossier.locator('[data-music-venue-detail-state="loading"]')).toBeVisible();
    expect(showsRequests).toBe(0);
    expect(highlightsRequests).toBe(0);
  } finally {
    releaseVenues({ payload: { rows: [{ venue_id: "aura", venue: "Aura", city: "Portland", state: "ME", photo_count: 123 }] } });
  }

  let originalTitle;
  let originalHighlights;
  let highlightsTop;
  try {
    await expect(title).toHaveText("Aura");
    await expect(page.getByRole("navigation", { name: /Current location.*Aura/ })).toBeAttached();
    await expect(dossier.locator("[data-venue-detail-location]")).toHaveText("Portland, ME");
    await expect(dossier.locator('[data-venue-relationship="photos"] .venue-relationship-media span')).toHaveText("123");
    await expect(events.getByRole("status")).toHaveText("Event Index Loading");
    await expect(artists.getByRole("status")).toHaveText("Artist Index Loading");
    await expect(events.locator(".venue-relationship-media span")).toHaveText("—");
    await expect(artists.locator(".venue-relationship-media span")).toHaveText("—");
    await expect(events).not.toHaveAttribute("role", "button");
    await expect(artists).not.toHaveAttribute("role", "button");
    await expect(highlights).toContainText("No photo highlights available.");
    expect(showsRequests).toBe(1);
    expect(highlightsRequests).toBe(1);
    originalTitle = await title.evaluateHandle(node => node.firstChild);
    originalHighlights = await highlights.locator("[data-venue-photo-highlights-body] > *").elementHandle();
    await page.evaluate(() => document.fonts.ready);
    highlightsTop = (await highlights.boundingBox()).y;
  } finally {
    releaseShows({ data: [
      { show_id: "aura-august", venue_id: "aura", name: "August at Aura", date: "2024-08-01", bands: ["Arrival Band"] },
    ] });
  }

  await expect(events.locator(".venue-relationship-media span")).toHaveText("1");
  await expect(artists.locator(".venue-relationship-media span")).toHaveText("1");
  expect(Math.abs((await highlights.boundingBox()).y - highlightsTop)).toBeLessThanOrEqual(1);
  await events.press("Enter");
  await expect(dossier.locator("[data-venue-shows-panel]")).toContainText("August at Aura");
  await events.press("Enter");
  await artists.press("Enter");
  await expect(dossier.locator("[data-venue-artists-panel]")).toContainText("Arrival Band");
  expect(await title.evaluate((node, original) => node.firstChild === original, originalTitle)).toBe(true);
  expect(await highlights.locator("[data-venue-photo-highlights-body] > *").evaluate((node, original) => node === original, originalHighlights)).toBe(true);
  expect(highlightsRequests).toBe(1);
});

test("Venue Dossier preserves verified identity on Shows failure and exposes confirmed empty relationships", async ({ page, baseURL }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  let showsRequests = 0;
  await mockArchive(page, baseURL, () => ({ data: [
    { venue_id: "aura", venue: "Aura", photo_count: 12 },
    { venue_id: "other-room", venue: "Other Room", photo_count: 2 },
  ] }), () => ++showsRequests === 1 ? { status: 503 } : { data: [] });
  await page.goto(harborPath + "/aura", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  const dossier = page.locator("[data-venue-detail]");
  const events = dossier.locator('[data-venue-relationship="shows"]');
  const artists = dossier.locator('[data-venue-relationship="bands"]');
  const highlights = dossier.locator("[data-venue-photo-highlights]");
  await expect(dossier.getByRole("heading", { name: "Aura", exact: true })).toBeVisible();
  await expect(events.getByRole("status")).toHaveText("Event Index Unavailable");
  await expect(artists.getByRole("status")).toHaveText("Artist Index Unavailable");
  await expect(events.locator(".venue-relationship-media span")).toHaveText("—");
  await expect(artists.locator(".venue-relationship-media span")).toHaveText("—");
  await expect(dossier.locator('[data-venue-relationship="photos"] .venue-relationship-media span')).toHaveText("12");
  await expect(highlights).toBeVisible();

  await page.evaluate(path => navigateToRoute(path), harborPath + "/other-room");
  await expect(dossier.getByRole("heading", { name: "Other Room", exact: true })).toBeVisible();
  await expect(events.locator(".venue-relationship-media span")).toHaveText("0");
  await expect(artists.locator(".venue-relationship-media span")).toHaveText("0");
  await expect(events).toHaveAttribute("role", "button");
  await expect(artists).toHaveAttribute("role", "button");
  await artists.press("Enter");
  await expect(dossier.locator("[data-venue-artists-panel]")).toContainText("No artists linked to this venue.");
});

test("Harbor fades sector records out before a single verified swap and fades the new sector in", async ({ page, baseURL }) => {
  test.setTimeout(45000);
  await page.setViewportSize({ width: 412, height: 915 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await mockArchive(page, baseURL, () => ({ data: venues }));
  await page.goto(harborPath, { waitUntil: "domcontentloaded" });
  const reject = page.getByRole("button", { name: "Reject", exact: true });
  if (await reject.isVisible()) await reject.click();
  await page.getByRole("button", { name: "Browse Venues" }).press("Enter");
  const archive = page.locator("[data-music-venues-index]");
  await expect(archive).not.toHaveAttribute("data-harmony-activation", /.+/);
  const previous = archive.getByRole("button", { name: "Previous Sector" });
  const next = archive.getByRole("button", { name: "Next Sector" });
  const names = archive.locator(".music-venue-beacon strong");
  const wrappers = archive.locator("[data-music-venues-beacons], [data-music-venues-connections]");
  const animations = await archive.evaluateHandle(node => {
    const calls = [];
    node.querySelectorAll("[data-music-venues-beacons], [data-music-venues-connections]").forEach(surface => {
      const animate = surface.animate.bind(surface);
      surface.animate = (frames, timing) => {
        const animation = animate(frames, timing);
        animation.pause();
        animation.currentTime = 0;
        calls.push({ frames, duration: timing.duration, animation });
        return animation;
      };
    });
    return calls;
  });
  const motions = () => animations.evaluate(calls => calls.map(({ frames, duration }) => ({ frames, duration })));
  const outgoing = { frames: [{ opacity: 1 }, { opacity: 0 }], duration: 180 };
  const incoming = { frames: [{ opacity: 0 }, { opacity: 1 }], duration: 220 };

  await previous.press("Enter");
  await expect.poll(motions).toEqual([outgoing, outgoing]);
  await expect(previous).toBeFocused();
  await expect(previous).toHaveAttribute("aria-disabled", "true");
  await previous.press("Enter");
  await animations.evaluate(calls => calls.forEach(({ animation }) => { animation.currentTime = 90; }));
  await expect(names.first()).toHaveText("Signal Hall 00");
  await expect(names).toHaveCount(8);
  expect(await wrappers.evaluateAll(nodes => nodes.every(node => {
    const opacity = Number(getComputedStyle(node).opacity);
    return opacity > 0 && opacity < 1;
  }))).toBe(true);
  await expect(archive.locator("[data-music-venues-beacons]")).toHaveAttribute("inert", "");
  await archive.locator(".music-venue-beacon-link").first().evaluate(link => link.focus());
  await expect(previous).toBeFocused();

  await animations.evaluate(calls => calls.forEach(({ animation }) => animation.finish()));
  await expect.poll(motions).toEqual([outgoing, outgoing, incoming, incoming]);
  await expect(names).toHaveText(["Signal Hall 88", "Signal Hall 89"]);
  await expect(names).toHaveCount(2);
  expect(await wrappers.evaluateAll(nodes => nodes.map(node => getComputedStyle(node).opacity))).toEqual(["0", "0"]);
  await expect(archive.locator("[data-music-venues-connections] line")).toHaveCount(2);
  await animations.evaluate(calls => calls.slice(-2).forEach(({ animation }) => animation.finish()));
  await expect(previous).not.toHaveAttribute("aria-disabled", "true");
  await expect(previous).toBeFocused();
  await expectSectorGeometry(archive, 2);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await next.press("Enter");
  await expect(names.first()).toHaveText("Signal Hall 00");
  await expect(names).toHaveCount(8);
  expect(await motions()).toEqual([outgoing, outgoing, incoming, incoming]);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await previous.press("Enter");
  await expect.poll(motions).toHaveLength(6);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(previous).not.toHaveAttribute("aria-disabled", "true");
  await expect(previous).toBeFocused();
  await expect(names).toHaveCount(2);
  expect(await motions()).toHaveLength(6);
  await next.press("Enter");
  await expect(names).toHaveCount(8);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await next.press("Enter");
  await expect.poll(motions).toHaveLength(8);
  await archive.locator("[data-harmony-filter-sigil]").press("Enter");
  await archive.getByRole("searchbox", { name: "Search Venue" }).fill("Signal Hall 23");
  await expect(names).toHaveText(["Signal Hall 23"]);
  await expect(names).toHaveCount(1);
  expect(await motions()).toHaveLength(8);
  expect(await wrappers.evaluateAll(nodes => nodes.map(node => getComputedStyle(node).opacity))).toEqual(["1", "1"]);

  await archive.getByRole("searchbox", { name: "Search Venue" }).fill("");
  await archive.locator("[data-harmony-filter-sigil]").press("Enter");
  await next.press("Enter");
  await expect.poll(motions).toHaveLength(10);
  await animations.evaluate(calls => calls.slice(-2).forEach(({ animation }) => { animation.currentTime = 100; }));
  await page.locator("[data-prototype-engine-return]").press("Enter");
  await expect(page).toHaveURL(baseURL + "/music");
  await expect.poll(() => animations.evaluate(calls => calls.slice(-2).map(({ animation }) => animation.playState)))
    .toEqual(["idle", "idle"]);
  await expect(archive.locator("[data-music-venues-beacons]")).not.toHaveAttribute("inert", "");
  await expect(archive.locator("[data-music-venues-sector-step][aria-disabled]")).toHaveCount(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator('[data-zhento-information="pulse"]').press("Enter");
  await page.getByRole("button", { name: /Pillar of Harmony/ }).press("Enter");
  await page.getByRole("button", { name: "Enter the Archive", exact: true }).press("Enter");
  await expect(page).toHaveURL(baseURL + harborPath);
  await page.getByRole("button", { name: "Browse Venues" }).press("Enter");
  await expect(names.first()).toHaveText("Signal Hall 00");
  await expect(names).toHaveCount(8);
  await expect(next).toBeEnabled();
  await expect(archive).not.toHaveAttribute("data-harmony-activation", /.+/);
  expect(await motions()).toHaveLength(10);
});

test("holds a single Browse activation for verified data and continues it through rotation", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  let releaseVenues;
  const pendingVenues = new Promise(resolve => { releaseVenues = resolve; });
  await mockArchive(page, baseURL, () => pendingVenues);
  await page.goto(harborPath, { waitUntil: "domcontentloaded" });
  const reject = page.getByRole("button", { name: "Reject", exact: true });
  if (await reject.isVisible()) await reject.click();
  const archive = page.locator("[data-music-venues-index]");
  const trace = await archive.evaluateHandle(node => {
    const phases = [];
    const pulseY = [];
    const strength = [];
    const lit = [];
    const shifts = [];
    const stagger = [];
    const plateStarts = [];
    const ordering = { earlyPlate: false };
    const readPulse = (pulse, opacity) => {
      const art = document.querySelector("[data-harmony-art]");
      const paint = art.getBoundingClientRect();
      const scale = Math.max(paint.width / 1672, paint.height / 941);
      const crop = Number(getComputedStyle(art).getPropertyValue("--harmony-art-crop-y"));
      pulseY.push((pulse.getBoundingClientRect().top - paint.top - (paint.height - 941 * scale) * crop) / scale);
      strength.push({ opacity, width: parseFloat(getComputedStyle(pulse).strokeWidth) });
    };
    const onset = new MutationObserver(() => {
      if (node.dataset.harmonyActivation !== "pulse") return;
      const pulse = node.querySelector(".harmony-registry-pulse");
      if (pulse?.hasAttribute("d")) readPulse(pulse, Number(getComputedStyle(pulse).opacity));
      onset.disconnect();
    });
    onset.observe(node, { attributes: true, attributeFilter: ["data-harmony-activation"] });
    let active = false;
    const sample = () => {
      const phase = node.dataset.harmonyActivation;
      if (phase && phases.at(-1) !== phase) phases.push(phase);
      if (active && !phase) return;
      active ||= Boolean(phase);
      const pulse = node.querySelector(".harmony-registry-pulse");
      const pulseOpacity = pulse ? Number(getComputedStyle(pulse).opacity) : 0;
      if (phase === "pulse" && pulse?.hasAttribute("d")) readPulse(pulse, pulseOpacity);
      if (phase === "pulse" || phase === "nameplates") {
        const plates = [...node.querySelectorAll(".music-venue-beacon")];
        const lines = [...node.querySelectorAll("[data-music-venues-connections] line")];
        const inlays = [...node.querySelectorAll(".music-venue-beacon-stud__inlay")];
        if (plates.length === 8 && inlays.length === 8) {
          const near = Number(getComputedStyle(plates.at(-1)).opacity);
          const far = Number(getComputedStyle(plates[0]).opacity);
          shifts.push(Math.abs(parseFloat(getComputedStyle(plates.at(-1)).translate)));
          if (!plateStarts.length) {
            plateStarts.push(...plates.map(plate => Number(plate.style.getPropertyValue("--harmony-nameplate-start"))));
          }
          if (lines.length === plates.length) {
            stagger.push({ near, far, nearLine: Number(getComputedStyle(lines.at(-1)).opacity), pulseOpacity });
          }
          inlays.forEach((inlay, index) => {
            const light = Number(getComputedStyle(inlay).opacity);
            if (light > 0.2 && !lit.includes(index)) lit.push(index);
            if (light <= 0.2 && Number(getComputedStyle(plates[index]).opacity) > 0.02) ordering.earlyPlate = true;
          });
        }
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
    return { phases, pulseY, strength, lit, shifts, stagger, plateStarts, ordering };
  });

  await page.getByRole("button", { name: "Browse Venues" }).press("Enter");
  await expect(archive).toHaveAttribute("data-harmony-activation", "waiting");
  await expect(archive.getByText("Establishing Beacon Signals")).toBeVisible();
  await expect(archive.getByRole("link", { name: /^Inspect / })).toHaveCount(0);
  await expect(archive.locator(".harmony-registry-pulse")).toHaveCount(0);
  await expect(archive.locator("[data-harmony-filter-sigil]")).toBeHidden();
  await expect(page.locator("[data-prototype-engine-return]")).toBeInViewport();
  releaseVenues({ data: venues });

  await expect(archive).toHaveAttribute("data-harmony-activation", "pulse");
  expect(await archive.locator("[data-music-venues-beacons]").evaluate(node => node.inert)).toBe(true);
  await page.setViewportSize({ width: 915, height: 412 });
  await expect(archive).not.toHaveAttribute("data-harmony-activation", /.+/);
  await expect(archive.locator("[data-harmony-filter-sigil]")).toBeVisible();
  await expect(archive.getByRole("button", { name: "Next Sector" })).toBeEnabled();
  await expect(archive.locator(".harmony-registry-pulse")).toHaveCount(0);
  await expectSectorGeometry(archive);

  const { phases, pulseY, strength, lit, shifts, stagger, plateStarts, ordering } = await trace.jsonValue();
  expect(phases).toEqual(["sigil", "waiting", "pulse", "nameplates"]);
  expect(pulseY[0]).toBeGreaterThan(650);
  expect(pulseY.at(-1)).toBeLessThan(510);
  expect(strength[0].opacity).toBeGreaterThan(0.5);
  expect(strength.some(({ opacity, width }) => opacity >= 0.9 && width >= 2)).toBe(true);
  expect(lit[0]).toBe(7);
  expect(lit).toContain(0);
  expect(lit).toContain(1);
  expect(ordering.earlyPlate).toBe(false);
  expect(plateStarts[0] - plateStarts.at(-1)).toBeGreaterThan(280);
  expect(shifts[0]).toBeGreaterThan(3);
  expect(shifts.at(-1)).toBeLessThan(shifts[0]);
  await expect(archive.locator(".music-venue-beacon").first()).toHaveCSS("translate", "none");
  expect(stagger.some(({ near, far, nearLine, pulseOpacity }) =>
    pulseOpacity > 0.7 && near > 0.12 && near > far && near === nearLine
  )).toBe(true);
  await archive.getByRole("button", { name: "Next Sector" }).press("Enter");
  await expect(archive.getByRole("link", { name: "Inspect Signal Hall 08" })).toBeVisible();
  await expect(archive).not.toHaveAttribute("data-harmony-activation", /.+/);
});

test("clears pending activation when Engine Back leaves Harbor", async ({ page, baseURL }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  let releaseVenues;
  const pendingVenues = new Promise(resolve => { releaseVenues = resolve; });
  await mockArchive(page, baseURL, () => pendingVenues);
  await page.goto(harborPath, { waitUntil: "domcontentloaded" });
  const reject = page.getByRole("button", { name: "Reject", exact: true });
  if (await reject.isVisible()) await reject.click();
  const archive = page.locator("[data-music-venues-index]");
  try {
    await page.getByRole("button", { name: "Browse Venues" }).press("Enter");
    await expect(archive).toHaveAttribute("data-harmony-activation", "waiting");
    await page.locator("[data-prototype-engine-return]").press("Enter");
    await expect(page).toHaveURL(baseURL + "/music");
    await expect(archive).not.toHaveAttribute("data-harmony-activation", /.+/);
    expect(await archive.locator("[data-music-venues-beacons]").evaluate(node => node.inert)).toBe(false);
  } finally {
    releaseVenues({ data: venues });
  }
});

test("paints the Harbor environment before delayed Shell startup and enters it from Zhento", async ({ page, baseURL }) => {
  test.setTimeout(45000);
  await page.setViewportSize({ width: 412, height: 915 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const frames = { harbor: 0, homeVisible: 0 };
    window.harmonyArrivalFrames = frames;
    const sample = () => {
      const home = document.querySelector('.site-shell[data-shell-route="music-venues"] .home-frame');
      if (home && !document.documentElement.hasAttribute("data-v3-booting")) {
        frames.harbor++;
        const style = getComputedStyle(home);
        if (style.display !== "none" && style.visibility === "visible" && Number(style.opacity) > 0) {
          frames.homeVisible++;
        }
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  let requests = 0;
  await mockArchive(page, baseURL, () => {
    requests++;
    return { data: venues };
  });
  let releaseShell;
  const pendingShell = new Promise(resolve => { releaseShell = resolve; });
  await page.route("**/js/shell.js", async route => {
    await pendingShell;
    await route.continue();
  });

  await page.goto(harborPath, { waitUntil: "commit" });
  const environment = page.locator("[data-harmony-environment]");
  const sigil = environment.locator("[data-harmony-sigil]");
  let bootSigil;
  try {
    await expect(page.locator("html")).toHaveAttribute("data-v3-booting", "");
    await expect(environment).toBeInViewport({ ratio: 1 });
    await expect(sigil).toBeInViewport({ ratio: 1 });
    await expect(sigil).toBeVisible();
    const art = environment.locator("[data-harmony-art]");
    await expect(art).toHaveCSS("background-size", "cover");
    expect(await art.evaluate(async node => {
      const source = getComputedStyle(node).backgroundImage.match(/url\("([^"]+)"\)/)?.[1];
      const image = new Image();
      image.src = source;
      await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    })).toEqual([1672, 941]);
    await expect(page.locator(".public-home")).toBeHidden();
    await expect(page.locator("[data-portfolio-engine]")).toBeHidden();
    await expect(page.getByText("Loading Venue Grid", { exact: true })).toHaveCount(0);
    bootSigil = await sigil.boundingBox();
    expect(requests).toBe(0);
  } finally {
    releaseShell();
  }
  await expect(page.locator("html")).not.toHaveAttribute("data-v3-booting", "");
  await expect(page.locator(".home-frame")).toHaveCSS("display", "none");
  const reject = page.getByRole("button", { name: "Reject", exact: true });
  if (await reject.isVisible()) await reject.click();
  await expectHarbor(page);
  const mountedSigil = await sigil.boundingBox();
  expect(Math.abs(bootSigil.x - mountedSigil.x)).toBeLessThan(1);
  expect(Math.abs(bootSigil.y - mountedSigil.y)).toBeLessThan(1);
  const coldFrames = await page.evaluate(() => window.harmonyArrivalFrames);
  expect(coldFrames.harbor).toBeGreaterThan(0);
  expect(coldFrames.homeVisible).toBe(0);

  await page.locator("[data-prototype-engine-return]").press("Enter");
  await expect(page).toHaveURL(baseURL + "/music");
  await expect(environment).toBeHidden();
  await page.locator('[data-zhento-information="pulse"]').press("Enter");
  await page.getByRole("button", { name: /Pillar of Harmony/ }).press("Enter");
  const enter = page.getByRole("button", { name: "Enter the Archive", exact: true });
  await expect(enter).toBeEnabled();
  await enter.press("Enter");
  await expect(page).toHaveURL(baseURL + harborPath);
  await expectHarbor(page);
  await expect(page.locator(".home-frame")).toHaveCSS("display", "none");
  await expect.poll(() => page.evaluate(() => window.harmonyArrivalFrames.harbor)).toBeGreaterThan(coldFrames.harbor);
  expect(await page.evaluate(() => window.harmonyArrivalFrames.homeVisible)).toBe(0);
  expect(requests).toBe(0);
});

test("shows and restores verified venue beacons while linked Shows are still loading", async ({ page, baseURL }) => {
  test.setTimeout(45000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  let venueRequests = 0;
  let releaseShows;
  const pendingShows = new Promise(resolve => { releaseShows = resolve; });
  await mockArchive(page, baseURL, () => {
    venueRequests++;
    return { data: venues };
  }, () => pendingShows);
  await page.goto(harborPath, { waitUntil: "domcontentloaded" });
  const reject = page.getByRole("button", { name: "Reject", exact: true });
  if (await reject.isVisible()) await reject.click();

  const showsRequested = page.waitForRequest(request => new URL(request.url()).pathname === "/api/music/shows/db");
  await page.getByRole("button", { name: "Browse Venues" }).press("Enter");
  try {
    await showsRequested;
    const inspect = page.getByRole("link", { name: "Inspect Signal Hall 00" });
    await expect(inspect).toBeVisible();
    await expect(page.locator(".harmony-registry-signal")).toHaveCount(0);
    await inspect.press("Enter");
    await expect(page).toHaveURL(baseURL + harborPath + "/signal-0");
    await expect(page.getByRole("heading", { name: "Signal Hall 00", exact: true })).toBeFocused();
    await page.locator("[data-prototype-engine-return]").press("Enter");
    await expect(page).toHaveURL(baseURL + harborPath);
    await expect(inspect).toBeVisible();
    await expect.poll(() => page.evaluate(() => v3RouteContext.pending)).toBe(false);
    expect(venueRequests).toBe(1);
  } finally {
    releaseShows({ data: shows });
  }
  await expect(page.getByRole("link", { name: "Inspect Signal Hall 00" })).toBeVisible();
});

test("an earlier Shows request does not retry Harbor Venues", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  let venueRequests = 0;
  let releaseShows;
  const pendingShows = new Promise(resolve => { releaseShows = resolve; });
  await mockArchive(page, baseURL, () => ++venueRequests === 1 ? { status: 503 } : { data: venues }, () => pendingShows);
  const showsRequested = page.waitForRequest(request => new URL(request.url()).pathname === "/api/music/shows/db");
  try {
    await page.goto("/music/shows", { waitUntil: "domcontentloaded" });
    await showsRequested;
    const reject = page.getByRole("button", { name: "Reject", exact: true });
    if (await reject.isVisible()) await reject.click();
    await page.locator("[data-prototype-engine-return]").press("Enter");
    await expect(page).toHaveURL(baseURL + "/music");
    await page.locator('[data-zhento-information="pulse"]').press("Enter");
    await page.getByRole("button", { name: /Pillar of Harmony/ }).press("Enter");
    await page.getByRole("button", { name: "Enter the Archive", exact: true }).press("Enter");
    await expect(page).toHaveURL(baseURL + harborPath);
    expect(venueRequests).toBe(0);

    await page.getByRole("button", { name: "Browse Venues" }).press("Enter");
    const signal = page.locator(".harmony-registry-signal");
    await expect(signal).toHaveAttribute("data-v3-state", "error");
    expect(venueRequests).toBe(1);
    expect(await page.evaluate(() => Boolean(musicShowsSetsRequest))).toBe(true);

    releaseShows({ data: shows });
    await expect.poll(() => page.evaluate(() => musicShowsSetsDataState)).toBe("live");
    await expect(signal).toHaveAttribute("data-v3-state", "error");
    expect(venueRequests).toBe(1);
    await signal.getByRole("button", { name: "Retry Venues" }).press("Enter");
    await expect(page.getByRole("link", { name: "Inspect Signal Hall 00" })).toBeVisible();
    expect(venueRequests).toBe(2);
  } finally {
    releaseShows({ data: shows });
  }
});

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
  await expect(scroller.getByRole("listitem")).toHaveCount(8);
  const inlinePadding = await scroller.evaluate(node => {
    const style = getComputedStyle(node);
    return [parseFloat(style.paddingRight), parseFloat(style.paddingLeft)];
  });
  expect(inlinePadding).toEqual([insets.right, insets.left]);
  await page.setViewportSize({ width: 412, height: 330 });
  await page.locator("[data-harmony-filter-sigil]").press("Enter");
  await search.fill("Concord");
  await expect(search).toBeFocused();
  await expect(search).toBeInViewport({ ratio: 1 });
  const controls = [
    search,
    page.getByRole("combobox", { name: "Filter venues by state" }),
    page.getByRole("combobox", { name: "Filter venues by sort" }),
    page.getByRole("button", { name: "Reset Filters" }),
  ];
  for (const [index, control] of controls.entries()) {
    await expect(control).toBeFocused();
    await expectReachableHarmonyFilter(control);
    if (index < controls.length - 1) await page.keyboard.press("Tab");
  }
  const lastResult = scroller.getByRole("link", { name: "Inspect Signal Hall 89" });
  await lastResult.scrollIntoViewIfNeeded();
  await expect(lastResult).toBeInViewport({ ratio: 1 });
  await expect(scroller.getByRole("listitem")).toHaveCount(5);
  await page.locator("[data-harmony-filter-sigil]").press("Enter");
  await page.setViewportSize({ width: 915, height: 412 });
  await expectHarmonyEnvironment(page);
  await expectSectorGeometry(page.locator("[data-music-venues-index]"), 5);
  await page.locator("[data-harmony-filter-sigil]").press("Enter");
  await expectHarmonyFilterGeometry(page);
});

test("Harbor keeps the Sigil clear in intermediate desktop and short portrait viewports", async ({ page, baseURL }) => {
  test.setTimeout(75000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockArchive(page, baseURL, () => ({ data: venues }));

  for (const [width, height] of [[1280, 720], [1366, 768], [1280, 600], [412, 420], [412, 500]]) {
    await test.step(width + "×" + height, async () => {
      await page.setViewportSize({ width, height });
      await page.goto(harborPath, { waitUntil: "domcontentloaded" });
      const reject = page.getByRole("button", { name: "Reject", exact: true });
      if (await reject.isVisible()) await reject.click();
      const harbor = await expectHarbor(page);
      await harbor.getByRole("button", { name: "Browse Venues" }).press("Enter");
      await expectSectorGeometry(page.locator("[data-music-venues-index]"));
    });
  }
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
  const filters = page.locator("[data-harmony-filter-sigil]");
  await expect(filters).toBeVisible();
  await filters.press("Enter");
  await page.getByRole("combobox", { name: "Filter venues by sort" }).selectOption("newest");
  await expect(names).toHaveText(["Foundry", "Atlas", "Cedar"]);
  await expect(range).toHaveText("ME / NH Venues (state pending) — A–F");
});

test("Harbor Engine shares the Music cutout and alternates Current View in reduced motion", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockArchive(page, baseURL, () => ({ data: venues }));
  await page.addInitScript(() => {
    const titleSelector = "[data-portfolio-engine-current-view]";
    window.harborEngineChanges = [];
    new MutationObserver(() => {
      const value = document.querySelector(titleSelector)?.textContent;
      if (value && value !== window.harborEngineChanges.at(-1)?.value) {
        window.harborEngineChanges.push({ value, time: performance.now() });
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto(harborPath, { waitUntil: "domcontentloaded" });
  const reject = page.getByRole("button", { name: "Reject", exact: true });
  if (await reject.isVisible()) await reject.click();
  const readout = page.locator("[data-portfolio-engine-current-view]");
  const mask = page.locator(".engine-lightning-overlay");
  const harborCutout = await mask.evaluate(node => getComputedStyle(node).maskImage);
  expect(harborCutout.match(/linear-gradient/g)).toHaveLength(3);

  const changes = () => page.evaluate(() => {
    const recorded = window.harborEngineChanges;
    return recorded.slice(recorded.findIndex(({ value }) => value === "Harbor of Harmony"));
  });
  await expect.poll(async () => (await changes()).length).toBeGreaterThanOrEqual(3);
  const firstThree = (await changes()).slice(0, 3);
  expect(firstThree.map(({ value }) => value)).toEqual(["Harbor of Harmony", "Music Venues", "Harbor of Harmony"]);
  for (let index = 1; index < firstThree.length; index++) {
    expect(Math.abs(firstThree[index].time - firstThree[index - 1].time - 1500)).toBeLessThan(140);
  }
  expect(await readout.evaluate(node => node.getAnimations().length)).toBe(0);
  await page.locator("[data-prototype-engine-return]").press("Enter");
  await expect(page).toHaveURL(baseURL + "/music");
  await expect(readout).toHaveText("Outskirts of Zhento");
  expect(await mask.evaluate(node => getComputedStyle(node).maskImage)).toBe(harborCutout);
  const changesAtExit = (await changes()).filter(({ value }) => /^(Harbor of Harmony|Music Venues)$/.test(value));
  await page.waitForTimeout(1650);
  expect((await changes()).filter(({ value }) => /^(Harbor of Harmony|Music Venues)$/.test(value))).toEqual(changesAtExit);
  await expect(readout).toHaveText("Outskirts of Zhento");
});


test("Harbor Sigil filters dissolve, reverse cleanly, and respect reduced motion", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await mockArchive(page, baseURL, () => ({ data: venues }));
  await page.goto(harborPath, { waitUntil: "domcontentloaded" });
  const reject = page.getByRole("button", { name: "Reject", exact: true });
  if (await reject.isVisible()) await reject.click();
  await page.getByRole("button", { name: "Browse Venues" }).press("Enter");
  const archive = page.locator("[data-music-venues-index]");
  await expect(archive).not.toHaveAttribute("data-harmony-activation", /.+/);
  const sigil = archive.getByRole("button", { name: "Venue filters", exact: true });
  const panel = archive.locator("[data-music-venues-tools]");
  const search = panel.getByRole("searchbox", { name: "Search Venue" });
  const motions = await panel.evaluateHandle(node => {
    const calls = [];
    const animate = node.animate.bind(node);
    node.animate = (frames, options) => {
      const animation = animate(frames, options);
      animation.pause();
      calls.push(animation);
      return animation;
    };
    return calls;
  });
  const sample = (time) => motions.evaluate((calls, currentTime) => {
    const animation = calls.at(-1);
    animation.currentTime = currentTime;
    const style = getComputedStyle(animation.effect.target);
    return { opacity: Number(style.opacity), core: parseFloat(style.getPropertyValue("--harmony-filter-core")) };
  }, time);
  const finish = () => motions.evaluate(calls => calls.at(-1).finish());
  const durations = () => motions.evaluate(calls => calls.map(animation => animation.effect.getTiming().duration));

  await sigil.press("Enter");
  await expect(sigil).toHaveAttribute("aria-expanded", "true");
  await expect(search).toBeFocused();
  await expect(archive).toHaveAttribute("data-harmony-filter-motion", "opening");
  expect(await sigil.evaluate(node => getComputedStyle(node, "::before").animationName)).toBe("harmonyFilterSigilResponse");
  expect(await panel.evaluate(node => getComputedStyle(node, "::after").animationIterationCount)).toBe("1");
  const opening = await sample(180);
  expect(opening.opacity).toBeGreaterThan(0);
  expect(opening.opacity).toBeLessThan(1);
  expect(opening.core).toBeGreaterThan(0);
  expect(opening.core).toBeLessThan(115);
  await search.fill("Signal Hall");
  await search.press("Escape");
  await expect(sigil).toBeFocused();
  await expect(sigil).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toHaveAttribute("inert", "");
  await expect(archive).toHaveAttribute("data-harmony-filter-motion", "closing");
  expect(await sample(0)).toEqual(opening);
  const closing = await sample(150);
  expect(closing.opacity).toBeLessThan(opening.opacity);
  expect(closing.core).toBeGreaterThan(opening.core);
  await sigil.press("Enter");
  await expect(search).toHaveValue("Signal Hall");
  expect(await sample(0)).toEqual(closing);
  expect(await durations()).toEqual([410, 300, 410]);
  await finish();
  await expect(archive).not.toHaveAttribute("data-harmony-filter-motion", /.+/);
  await expect(panel).toBeVisible();
  await expectHarmonyFilterGeometry(page);

  const next = archive.getByRole("button", { name: "Next Sector" });
  await next.click();
  await expect(next).toBeFocused();
  await expect(sigil).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toHaveAttribute("inert", "");
  await expect(archive).toHaveAttribute("data-harmony-filter-motion", "closing");
  await finish();
  await expect(panel).toBeHidden();
  await expect(archive.getByRole("link", { name: "Inspect Signal Hall 08" })).toBeVisible();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await sigil.press("Enter");
  await expect(search).toBeFocused();
  await expect(archive).not.toHaveAttribute("data-harmony-filter-motion", /.+/);
  await panel.getByRole("button", { name: "Close venue filters" }).press("Enter");
  await expect(panel).toBeHidden();
  await expect(sigil).toBeFocused();
  expect(await durations()).toEqual([410, 300, 410, 300]);
});
