const { test, expect } = require("@playwright/test");

const bandPath = "/music/bands/astra-vale";
const archivePath = bandPath + "/sets";
const band = { band_id: "astra-vale", band: "Astra Vale", name: "Astra Vale" };
const shows = Array.from({ length: 24 }, (_, index) => ({
  show_id: String(index + 1),
  name: "Archive show " + (index + 1),
  date: (index < 12 ? "2023" : "2024") + "-01-" + String((index % 12) + 1).padStart(2, "0"),
  bands: ["Astra Vale"],
}));
const otherShow = { show_id: "25", name: "Unrelated show", date: "2025-01-01", bands: ["Other Band"] };

function pendingResponse() {
  let release;
  const response = new Promise(resolve => { release = resolve; });
  return { response, release };
}

for (const viewport of [{ width: 360, height: 800 }, { width: 412, height: 915 }, { width: 1920, height: 1080 }]) {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    test.describe(`Sets Archive ${viewport.width}x${viewport.height} ${reducedMotion}`, () => {
      test.use({ viewport, reducedMotion, serviceWorkers: "block" });

      test("shows only verified totals and recovers in place from an unavailable Shows API", async ({ page, baseURL }) => {
        test.setTimeout(60000);
        const origin = new URL(baseURL).origin;
        let showsResponse = pendingResponse();
        let showsRequests = 0;
        await page.route("**/*", async route => {
          const request = route.request();
          const url = new URL(request.url());
          if (request.method() !== "GET") return route.abort();
          if (url.origin === origin && !url.pathname.startsWith("/api/")) return route.continue();
          if (request.resourceType() === "script") return route.fulfill({ contentType: "application/javascript", body: "" });
          if (request.resourceType() === "stylesheet") return route.fulfill({ contentType: "text/css", body: "" });
          const headers = { "access-control-allow-origin": "*" };
          if (url.pathname === "/api/music/shows/db") {
            showsRequests++;
            const { status, data } = await showsResponse.response;
            return route.fulfill({ status, headers, json: { data, total: data.length, totalPages: 1 } });
          }
          const data = url.pathname === "/api/music/bands" ? [band] : [];
          return route.fulfill({ headers, json: { data, total: data.length, totalPages: 1 } });
        });

        const archive = page.locator("[data-sets-archive]");
        const summary = archive.locator("[data-sets-archive-summary]");
        const rows = archive.locator("[data-sets-list] [data-set-row]");
        const retry = archive.getByRole("button", { name: "Retry Shows" });
        const bandName = page.locator("[data-band-detail-viewport] [data-band-detail-name]");
        await page.goto(bandPath, { waitUntil: "domcontentloaded" });
        const reject = page.getByRole("button", { name: "Reject", exact: true });
        if (await reject.isVisible()) await reject.click();
        await expect(bandName).toBeVisible();
        await expect(bandName).toHaveText("Astra Vale");
        const infoTab = page.getByRole("tab", { name: "INFO" });
        await infoTab.click();
        await expect(infoTab).toHaveAttribute("aria-selected", "true");

        await page.evaluate(() => navigateToBandSetsArchive());
        await expect(page).toHaveURL(origin + archivePath);
        await expect(archive).toBeVisible();
        await expect(summary).toHaveText("LOADING");
        await expect(archive.locator('[data-v3-state="loading"]')).toBeVisible();
        await expect(rows).toHaveCount(0);
        await expect.poll(() => showsRequests).toBe(1);
        showsResponse.release({ status: 503, data: [] });
        await expect(summary).toHaveText("SET TOTAL UNAVAILABLE");
        await expect(archive.getByText("Show Archive Offline", { exact: true })).toBeVisible();
        await expect(rows).toHaveCount(0);

        showsResponse = pendingResponse();
        await retry.click();
        await expect(page).toHaveURL(origin + archivePath);
        await expect(summary).toHaveText("LOADING");
        await expect.poll(() => showsRequests).toBe(2);
        showsResponse.release({ status: 200, data: [...shows, otherShow] });
        await expect(summary).toHaveText("24 SETS • 2023–2024");
        await expect(rows).toHaveCount(24);
        await rows.last().scrollIntoViewIfNeeded();
        await expect(rows.last()).toBeInViewport();
        expect(await archive.evaluate(el => {
          const scroller = el.closest("[data-music-nexus-shell]");
          return scroller.scrollTop > 0 && el.scrollWidth <= el.clientWidth + 1
            && document.documentElement.scrollWidth <= innerWidth + 1;
        })).toBe(true);

        const scrollTop = () => archive.evaluate(el => el.closest("[data-music-nexus-shell]").scrollTop);
        const archiveScroll = await scrollTop();
        await rows.last().click();
        await expect(page).toHaveURL(/\/music\/bands\/astra-vale\/\d+$/);
        await expect(page.locator("[data-set-dossier-viewport] [data-set-gallery]")).toBeVisible();
        await page.goBack();
        await expect(page).toHaveURL(origin + archivePath);
        await expect(summary).toHaveText("24 SETS • 2023–2024");
        await expect.poll(async () => Math.abs(await scrollTop() - archiveScroll)).toBeLessThan(2);

        await page.locator("[data-prototype-engine-return]").press("Enter");
        await expect(page).toHaveURL(origin + bandPath);
        await expect(infoTab).toHaveAttribute("aria-selected", "true");
        await page.goForward();
        await expect(page).toHaveURL(origin + archivePath);
        await expect(summary).toHaveText("24 SETS • 2023–2024");

        showsResponse = pendingResponse();
        showsResponse.release({ status: 200, data: [] });
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(summary).toHaveText("0 SETS");
        await expect(archive.getByText("No live shows indexed for this band yet.", { exact: true })).toBeVisible();
        await expect(rows).toHaveCount(0);
        await expect(retry).toHaveCount(0);
      });
    });
  }
}
