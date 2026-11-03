const { test, expect } = require("@playwright/test");

const archivePath = "/music/bands/astra-vale/sets";
const dossierPath = "/music/bands/astra-vale/010124";
const band = { band_id: "astra-vale", band: "Astra Vale", name: "Astra Vale" };
const show = { show_id: "010124", date: "2024-01-01", name: "Test show", bands: ["Astra Vale"], photo_count: 78 };
const image = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="navy"/></svg>';

function albumPage(origin, count, extra = {}, start = 1) {
  return {
    count,
    photos: Array.from({ length: count }, (_, index) => ({
      image_key: "fixture-" + (start + index),
      small_url: origin + "/fixture-set-photo.svg",
      caption: "Fixture photo " + (start + index),
    })),
    ...extra,
  };
}

for (const viewport of [{ width: 360, height: 800 }, { width: 412, height: 915 }, { width: 1920, height: 1080 }]) {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    test.describe(`Set Dossier ${viewport.width}x${viewport.height} ${reducedMotion}`, () => {
      test.use({ viewport, reducedMotion, serviceWorkers: "block" });

      test("reports verified album totals and actual photo counts across gallery states", async ({ page, baseURL }) => {
        test.setTimeout(90000);
        const origin = new URL(baseURL).origin;
        const headers = { "access-control-allow-origin": "*" };
        let withAlbum = true;
        let respondToPhotos = () => albumPage(origin, 0, { total: 0 });
        await page.route("**/*", async route => {
          const request = route.request();
          const url = new URL(request.url());
          if (request.method() !== "GET") return route.abort();
          if (url.origin === origin && url.pathname === "/fixture-set-photo.svg") return route.fulfill({ contentType: "image/svg+xml", body: image });
          if (url.origin === origin && !url.pathname.startsWith("/api/")) return route.continue();
          if (request.resourceType() === "script") return route.fulfill({ contentType: "application/javascript", body: "" });
          if (request.resourceType() === "stylesheet") return route.fulfill({ contentType: "text/css", body: "" });
          if (url.pathname === "/api/music/smugmug/albums/fixture/photos") {
            const payload = await respondToPhotos(Number(url.searchParams.get("limit")), Number(url.searchParams.get("start")));
            return route.fulfill({ headers, status: payload === null ? 503 : 200, json: payload ?? {} });
          }
          const data = url.pathname === "/api/music/bands" ? [band] : url.pathname === "/api/music/shows/db" ? [
            { ...show, smug_albums: withAlbum ? [{ album_id: "fixture", band_id: "astra-vale" }] : [] },
          ] : [];
          return route.fulfill({ headers, json: { data, total: data.length, totalPages: 1 } });
        });

        const gallery = page.locator("[data-set-dossier-viewport] [data-set-gallery]");
        const summary = gallery.locator("[data-gallery-count]");
        const tiles = gallery.locator("[data-gallery-grid] [data-gallery-photo]");
        const viewAll = gallery.getByRole("button", { name: "View All", exact: true });
        await page.goto(archivePath, { waitUntil: "domcontentloaded" });
        const reject = page.getByRole("button", { name: "Reject", exact: true });
        if (await reject.isVisible()) await reject.click();

        let release;
        respondToPhotos = () => new Promise(resolve => { release = resolve; });
        await page.locator("[data-sets-archive] [data-sets-list] [data-set-row]").click();
        await expect(page).toHaveURL(origin + dossierPath);
        await expect(gallery.locator('[data-gallery-state="loading"]')).toBeVisible();
        await expect(summary).toHaveText("Loading photos...");
        await expect.poll(() => Boolean(release)).toBe(true);
        release(albumPage(origin, 0, { total: 0 }));
        await expect(gallery.locator('[data-gallery-state="empty"]')).toBeVisible();
        await expect(summary).toHaveText("0 Photos");
        await expect(tiles).toHaveCount(0);
        await page.goBack();
        await expect(page).toHaveURL(origin + archivePath);
        await expect(page.locator("[data-sets-archive] [data-sets-list] [data-set-row]")).toBeVisible();

        respondToPhotos = () => albumPage(origin, 5, { total_count: "5" });
        await page.goto(dossierPath, { waitUntil: "domcontentloaded" });
        await expect(summary).toHaveText("Showing 5 of 5 Photos");
        await expect(tiles).toHaveCount(5);

        respondToPhotos = (limit, start) => {
          if (limit === 12) return albumPage(origin, 12, { total: 25, has_more: true, next_start: 13 });
          if (start === 1) return albumPage(origin, 16, { count: 16, has_more: true, next_start: 17 });
          return albumPage(origin, 9, { has_more: false }, 17);
        };
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(summary).toHaveText("Showing 12 of 25 Photos");
        await viewAll.click();
        await expect(summary).toHaveText("Showing 16 of 25 Photos");
        await gallery.getByRole("button", { name: "Load More Photos" }).click();
        await expect(summary).toHaveText("Showing All 25 Photos");
        await expect(tiles).toHaveCount(25);
        await tiles.last().scrollIntoViewIfNeeded();
        await expect(tiles.last()).toBeInViewport();
        expect(await gallery.evaluate(el => el.scrollWidth <= el.clientWidth + 1 &&
          document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        await page.goBack();
        await expect(viewAll).toBeVisible();
        await expect(summary).toHaveText("Showing 12 of 25 Photos");

        respondToPhotos = limit => albumPage(origin, limit === 12 ? 12 : 16, { has_more: true, next_start: limit === 12 ? 13 : 17 });
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(summary).toHaveText("Showing 12 Photos • Total unavailable");
        await viewAll.click();
        await expect(summary).toHaveText("Showing 16 Photos • Total unavailable");
        await page.goBack();
        await expect(summary).toHaveText("Showing 12 Photos • Total unavailable");

        respondToPhotos = () => null;
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(gallery.getByText("Photo preview unavailable.", { exact: true })).toBeVisible();
        await expect(summary).toHaveText("Photo total unavailable");

        respondToPhotos = () => albumPage(origin, 0, { has_more: false });
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(summary).toHaveText("0 Photos");

        withAlbum = false;
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(gallery.locator('[data-gallery-state="empty"]')).toBeVisible();
        await expect(summary).toHaveText("Photo total unavailable");
      });
    });
  }
}
