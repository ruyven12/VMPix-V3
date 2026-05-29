const { test, expect } = require("@playwright/test");

const viewports = [
  { name: "mobile-samsung", size: { width: 360, height: 800 } },
  { name: "desktop", size: { width: 1366, height: 768 } },
];

const routes = [
  { path: "/", rail: "Homepage", visibleShell: ".home-frame" },
  { path: "/portfolio", rail: "Interactive Portfolio", visibleShell: ".portfolio-hub" },
  {
    path: "/music",
    rail: "Music Nexus",
    visibleShell: "[data-music-nexus-shell]",
    landingRoutes: [
      { name: "Bands - Browse Artists", route: "/music/bands" },
      { name: "Shows - Browse Events", route: "/music/shows" },
      { name: "People - Musicians & Staff", route: "/music/people" },
      { name: "Venues - Music Locations", route: "/music/venues" },
    ],
  },
  { path: "/music/bands", rail: "Bands", visibleShell: "[data-music-bands-index]", text: "BANDS INDEX", hiddenText: "Recent Music Activity" },
  { path: "/music/shows", rail: "Shows", visibleShell: "[data-music-nexus-shell]", text: "Load More" },
  { path: "/music/people", rail: "People", visibleShell: "[data-music-nexus-shell]" },
  { path: "/music/people/adam-begin", rail: "Person Detail", visibleShell: ".person-detail-screen", text: "Adam Begin" },
  { path: "/music/venues", rail: "Venues", visibleShell: "[data-music-nexus-landing]", text: "Music Locations" },
  { path: "/wrestling", rail: "Ring Archive", visibleShell: "[data-ring-archive-shell]" },
  { path: "/calendar", rail: "Calendar", visibleShell: "[data-calendar-shell]" },
  { path: "/about", rail: "About", visibleShell: "[data-about-shell]" },
  { path: "/contact", rail: "Contact", visibleShell: "[data-contact-shell]" },
];

const ignoredConsoleErrors = [
  /fonts\.googleapis\.com/i,
  /fonts\.gstatic\.com/i,
];

function screenshotName(viewportName, routePath) {
  const routeName = routePath === "/" ? "home" : routePath.replace(/^\/+/, "").replace(/[/?#]+/g, "-");
  return `${viewportName}-${routeName}.png`;
}

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return Math.max(doc.scrollWidth - doc.clientWidth, body.scrollWidth - doc.clientWidth);
  });

  expect(overflow).toBeLessThanOrEqual(2);
}

for (const viewport of viewports) {
  test.describe(`core route smoke: ${viewport.name}`, () => {
    test.use({ viewport: viewport.size });

    for (const route of routes) {
      test(`${route.path} loads the V3 shell`, async ({ page }, testInfo) => {
        const consoleErrors = [];
        const pageErrors = [];

        page.on("console", (message) => {
          if (
            message.type() === "error" &&
            !ignoredConsoleErrors.some((pattern) => pattern.test(message.text()))
          ) {
            consoleErrors.push(message.text());
          }
        });
        page.on("pageerror", (error) => pageErrors.push(error.message));

        const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });

        expect(response && response.ok()).toBe(true);
        await expect(page.locator(".site-shell")).toBeVisible();
        const visibleShell = page.locator(route.visibleShell);

        await expect(visibleShell).toBeVisible();
        await expect(page.locator("[data-current-view]")).toHaveText(route.rail);
        await expect(page.locator("[data-shell-bottom-rail]")).toBeVisible();

        if (route.text) {
          await expect(visibleShell.getByText(route.text).first()).toBeVisible();
        }

        if (route.landingRoutes) {
          for (const link of route.landingRoutes) {
            await expect(visibleShell.getByRole("link", { name: link.name })).toHaveAttribute("data-music-landing-route", link.route);
          }
        }

        if (route.hiddenText) {
          await expect(page.getByText(route.hiddenText).first()).toBeHidden();
        }

        await expect(page.getByText(/Render Not Found/i)).toHaveCount(0);
        await expect(page.getByText(/^Not found$/i)).toHaveCount(0);
        await expectNoHorizontalOverflow(page);

        await page.screenshot({
          path: testInfo.outputPath(screenshotName(viewport.name, route.path)),
          fullPage: false,
        });

        expect(pageErrors).toEqual([]);
        expect(consoleErrors).toEqual([]);
      });
    }
  });
}
