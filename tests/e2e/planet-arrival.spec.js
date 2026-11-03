const { test, expect } = require("@playwright/test");

const planets = [
  { path: "/music", identity: "zhento-identity", name: "ZHENTO", subtitle: "The Music Archive" },
  { path: "/wrestling", identity: "daiion-title-reveal", name: "DAÏION", subtitle: "The Wrestling Archive" },
];

test.use({ viewport: { width: 412, height: 915 }, reducedMotion: "no-preference", serviceWorkers: "block" });

for (const planet of planets) {
  test(`${planet.name} reveals the full centered identity on entry and refresh`, async ({ page, baseURL }) => {
    const localOrigin = new URL(baseURL).origin;
    await page.route("**/*", route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin === localOrigin && !url.pathname.startsWith("/api/")) return route.continue();
      if (request.resourceType() === "script") return route.fulfill({ contentType: "application/javascript", body: "" });
      if (request.resourceType() === "stylesheet") return route.fulfill({ contentType: "text/css", body: "" });
      return route.fulfill({
        json: { data: [], rows: [], people: [], shows: [], venues: [] },
        headers: { "access-control-allow-origin": "*" },
      });
    });

    async function expectCenteredArrival() {
      await page.waitForFunction(({ identity, name, subtitle }) => {
        const root = document.querySelector(`.${identity}`);
        if (!root?.offsetParent || Number(getComputedStyle(root).opacity) < 0.5) return false;

        const frame = root.offsetParent.getBoundingClientRect();
        const center = frame.left + frame.width / 2;
        return [["planet", "PLANET"], ["name", name], ["subtitle", subtitle]].every(([part, text]) => {
          const label = root.querySelector(`.${identity}__${part}`);
          if (label?.textContent !== text) return false;
          const bounds = label.getBoundingClientRect();
          const style = getComputedStyle(label);
          return style.visibility === "visible" && Number(style.opacity) > 0.5
            && bounds.width > 0 && Math.abs(bounds.left + bounds.width / 2 - center) < 4;
        });
      }, planet, { timeout: 6000 });
      await expect(page.locator(`.${planet.identity}__subtitle`)).toHaveCount(1);
    }

    await page.goto(planet.path, { waitUntil: "domcontentloaded" });
    await expectCenteredArrival();
    await page.reload({ waitUntil: "domcontentloaded" });
    await expectCenteredArrival();
  });
}
