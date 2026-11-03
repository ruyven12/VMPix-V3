const { test, expect } = require("@playwright/test");

const showsPath = "/music/shows";
const detailPath = showsPath + "/concert-fixture";
const partialPath = showsPath + "/partial-fixture";
const aster = { band_id: "aster-live", name: "Aster", band: "Aster" };
const brume = { band_id: "brume-live", name: "Brume", band: "Brume" };
const third = { band_id: "third-live", name: "Third", band: "Third" };
const concert = {
  show_id: "concert-fixture", name: "Fixture Concert", date: "2024-01-01", venue_id: "stage-one", photo_count: 8,
  bands: [aster, brume, third],
  smug_albums: [
    { album_id: "aster-album", status: "resolved", band_id: aster.band_id, band: aster.name, photo_count: 3 },
    { album_id: "brume-album", status: "resolved", band_id: brume.band_id, band: brume.name, photo_count: 5 },
    { album_id: "orphan", status: "resolved", band_id: "orphan-band", band: "Orphan", photo_count: 99 },
  ],
};
const partial = { show_id: "partial-fixture", name: "Uncatalogued Event", bands: ["Unresolved performer"] };
const fixtureShows = [{ show_id: "same-day", name: "Different Concert", date: "2024-01-01", bands: [] }, concert, partial];

async function mockArchive(page, baseURL, shows) {
  const origin = new URL(baseURL).origin;
  await page.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== "GET") return route.abort();
    if (url.origin === origin && url.pathname === "/fixture-show-photo.svg") {
      return route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="navy"/></svg>' });
    }
    if (url.origin === origin && !url.pathname.startsWith("/api/")) return route.continue();
    if (request.resourceType() === "script") return route.fulfill({ contentType: "application/javascript", body: "" });
    if (request.resourceType() === "stylesheet") return route.fulfill({ contentType: "text/css", body: "" });
    const headers = { "access-control-allow-origin": "*" };
    if (url.pathname === "/api/music/shows/db") {
      const { status, rows } = await shows();
      return route.fulfill({ status, headers, json: { data: rows, total: rows.length, totalPages: 1 } });
    }
    if (/^\/api\/music\/smugmug\/albums\/(aster|brume)-album\/photos$/.test(url.pathname)) {
      const total = url.pathname.includes("aster") ? 3 : 5;
      const photos = Array.from({ length: total }, (_, i) => ({ image_key: "photo-" + i, small_url: origin + "/fixture-show-photo.svg" }));
      return route.fulfill({ headers, json: { photos, total, has_more: false } });
    }
    const data = url.pathname === "/api/music/bands" ? [aster, brume, third] : url.pathname === "/api/music/venues"
      ? [{ venue_id: "stage-one", venue: "Archive Stage", city: "Portland", state: "ME" }] : [];
    return route.fulfill({ headers, json: { data, total: data.length, totalPages: 1 } });
  });
  return origin;
}

async function rejectAnalytics(page) {
  const reject = page.getByRole("button", { name: "Reject", exact: true });
  if (await reject.isVisible()) await reject.click();
}

for (const viewport of [{ width: 360, height: 800 }, { width: 412, height: 915 }, { width: 1920, height: 1080 }]) {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    test.describe(`Show Detail ${viewport.width}x${viewport.height} ${reducedMotion}`, () => {
      test.use({ viewport, reducedMotion, serviceWorkers: "block" });

      test("opens the correct show and restores archive, band, and set navigation", async ({ page, baseURL }) => {
        test.setTimeout(90000);
        const origin = await mockArchive(page, baseURL, () => ({ status: 200, rows: fixtureShows }));
        const detail = page.locator("[data-show-detail]");
        const selected = page.locator(".synchronicity-show");
        const search = page.locator('[data-music-shows-filter="search"]');
        const activeCard = scope => scope.locator(".show-set-carousel-slide.is-active .show-set-card");
        await page.goto(showsPath, { waitUntil: "domcontentloaded" });
        await rejectAnalytics(page);
        await page.locator("[data-synchronicity-explore]").click();
        await expect(page.locator('[data-timeline-show-id="same-day"]')).toBeVisible();
        await search.click();
        await search.pressSequentially("Fixture");
        await expect(page.locator('[data-timeline-show-id="same-day"]')).toHaveCount(0);
        await page.locator('[data-timeline-show-id="concert-fixture"]').click();
        await expect(selected.getByRole("heading", { name: "Fixture Concert" })).toBeVisible();
        await selected.getByRole("button", { name: "Next band set" }).click();
        await expect(activeCard(selected)).toHaveAttribute("data-band-id", brume.band_id);
        const archiveRoot = await page.locator("[data-synchronicity-viewport]").elementHandle();
        const viewDetails = selected.getByRole("button", { name: "View Show Details" });
        await viewDetails.scrollIntoViewIfNeeded();
        const archiveScroll = await archiveRoot.evaluate(el => el.scrollTop);
        await viewDetails.click();
        await expect(page).toHaveURL(origin + detailPath);
        await expect(detail.getByRole("heading", { name: "Fixture Concert" })).toBeVisible();
        await expect(detail.locator(".show-detail-line")).toHaveText(["January 1st, 2024", "Archive Stage", "Portland, ME"]);
        await expect(detail.locator(".show-detail-stat-value")).toHaveText(["concert-fixture", "3", "8"]);
        await expect(detail.locator(".show-set-card-title")).toHaveText(["Aster", "Brume", "Third"]);
        await expect(detail.locator(".show-detail-bill-slot")).toHaveCount(0);
        await detail.getByRole("button", { name: "Next band set" }).click();
        await expect(detail.getByRole("link", { name: "Brume", exact: true })).toHaveAttribute("href", "/music/bands/brume-live");
        await detail.getByRole("link", { name: "Brume", exact: true }).click();
        await expect(page).toHaveURL(origin + "/music/bands/brume-live");
        await expect(page.locator("[data-band-detail-viewport] [data-band-detail-name]")).toHaveText("Brume");
        await page.goBack();
        await expect(page).toHaveURL(origin + detailPath);
        await expect(activeCard(detail)).toHaveAttribute("data-band-id", brume.band_id);

        await expect(activeCard(detail)).toHaveAttribute("data-show-album-route", "/music/bands/brume-live/010124");
        await activeCard(detail).click();
        await expect(page).toHaveURL(origin + "/music/bands/brume-live/010124");
        const gallery = page.locator("[data-set-dossier-viewport] [data-set-gallery]");
        await expect(gallery).toHaveAttribute("data-album-id", "brume-album");
        await expect(gallery.locator("[data-gallery-count]")).toHaveText("Showing 5 of 5 Photos");
        await page.goBack();
        await expect(activeCard(detail)).toHaveAttribute("data-band-id", brume.band_id);
        await detail.getByRole("button", { name: "Next band set" }).click();
        await expect(activeCard(detail)).toBeDisabled();
        await expect(activeCard(detail)).toContainText("Captured photography unavailable");
        await activeCard(detail).scrollIntoViewIfNeeded();
        await expect(activeCard(detail)).toBeInViewport();
        expect(await detail.evaluate(el => el.scrollWidth <= el.clientWidth + 1 &&
          document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

        await page.locator("[data-prototype-engine-return]").press("Enter");
        await expect(page).toHaveURL(origin + showsPath);
        await expect(selected.getByRole("heading", { name: "Fixture Concert" })).toBeVisible();
        await expect(activeCard(selected)).toHaveAttribute("data-band-id", brume.band_id);
        await expect(search).toHaveValue("Fixture");
        await expect.poll(async () => Math.abs(await archiveRoot.evaluate(el => el.scrollTop) - archiveScroll)).toBeLessThan(2);
        expect(await archiveRoot.evaluate(node => node === document.querySelector("[data-synchronicity-viewport]"))).toBe(true);
        await page.goForward();
        await expect(page).toHaveURL(origin + detailPath);
        await expect(activeCard(detail)).toHaveAttribute("data-band-id", third.band_id);
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(detail.getByRole("heading", { name: "Fixture Concert" })).toBeVisible();
        await expect(activeCard(detail)).toHaveAttribute("data-band-id", third.band_id);
      });

      test("settles delayed, failed, empty, and partial responses truthfully", async ({ page, baseURL }) => {
        test.setTimeout(60000);
        let release;
        let response = new Promise(resolve => { release = resolve; });
        await mockArchive(page, baseURL, () => response);
        const detail = page.locator("[data-show-detail]");
        await page.goto(detailPath, { waitUntil: "domcontentloaded" });
        await rejectAnalytics(page);
        await expect(detail.getByText("Loading Show Archive", { exact: true })).toBeVisible();
        release({ status: 503, rows: [] });
        await expect(detail.getByText("Unable To Load Archive Data", { exact: true }).first()).toBeVisible();
        response = new Promise(resolve => { release = resolve; });
        await detail.getByRole("button", { name: "Retry Shows" }).click();
        await expect(detail.getByText("Loading Show Archive", { exact: true })).toBeVisible();
        release({ status: 200, rows: fixtureShows });
        await expect(detail.getByRole("heading", { name: "Fixture Concert" })).toBeVisible();

        await page.goto(partialPath, { waitUntil: "domcontentloaded" });
        await expect(detail.getByRole("heading", { name: "Uncatalogued Event" })).toBeVisible();
        await expect(detail.locator(".show-detail-line")).toHaveText(["Date Pending", "Venue Pending", "Location Pending"]);
        await expect(detail.locator(".show-detail-stat-value")).toHaveText(["partial-fixture", "1", "Pending"]);
        await expect(detail.getByRole("button", { name: "Unresolved performer: captured gallery unavailable" })).toBeDisabled();
        await expect(detail.locator(".show-detail-bill-active-name")).not.toHaveAttribute("href", /./);

        response = Promise.resolve({ status: 200, rows: [] });
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(detail.getByText("Archive Record Unavailable", { exact: true })).toBeVisible();
        await expect(detail.getByRole("button", { name: "Retry Shows" })).toHaveCount(0);
      });
    });
  }
}
