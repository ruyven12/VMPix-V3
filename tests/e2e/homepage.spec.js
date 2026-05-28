const { test, expect } = require("@playwright/test");

const viewportChecks = [
  { name: "small phone", size: { width: 320, height: 740 } },
  { name: "large phone", size: { width: 390, height: 844 } },
  { name: "desktop", size: { width: 1366, height: 768 } },
];

const ignoredConsoleErrors = [
  /fonts\.googleapis\.com/i,
  /fonts\.gstatic\.com/i,
];

async function gotoHomepage(page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".site-shell")).toBeVisible();
}

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return {
      documentOverflow: doc.scrollWidth - doc.clientWidth,
      bodyOverflow: body.scrollWidth - doc.clientWidth,
    };
  });

  expect(overflow.documentOverflow).toBeLessThanOrEqual(1);
  expect(overflow.bodyOverflow).toBeLessThanOrEqual(1);
}

async function activateHub(page) {
  await page.getByRole("button", { name: "Start Voodoo Media" }).click();
  await expect(page.locator(".portfolio-hub")).toBeVisible({ timeout: 4_000 });
  await expect(page.locator(".site-shell")).toHaveClass(/has-entered-hub/);
}

test.describe("Interactive Portfolio Hub v1", () => {
  test("loads the homepage without obvious console errors", async ({ page }) => {
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

    await gotoHomepage(page);
    await page.waitForTimeout(500);

    await expect(page.getByRole("button", { name: "Start Voodoo Media" })).toBeVisible();
    await expect(page.locator("[data-current-view]")).toHaveText("Homepage");
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test("START reveals the Portfolio Hub and updates the bottom rail", async ({ page }) => {
    await gotoHomepage(page);

    await expect(page.getByRole("button", { name: "Start Voodoo Media" })).toBeVisible();
    await activateHub(page);

    await expect(page.locator("[data-shell-bottom-rail]")).toBeVisible();
    await expect(page.locator("[data-current-view]")).toHaveText("Interactive Portfolio");
    await expect(page.locator('[data-module-card="music"]')).toBeVisible();
    await expect(page.locator('[data-module-card="wrestling"]')).toBeVisible();
  });

  test("opens and closes the global drawer from the bottom rail", async ({ page }) => {
    await gotoHomepage(page);

    await page.getByRole("button", { name: "Open global navigation menu" }).click();
    await expect(page.locator("[data-global-menu-drawer]")).toBeVisible();
    await expect(page.locator(".site-shell")).toHaveClass(/is-global-menu-open/);

    await page.locator("[data-global-menu-close]").click();
    await expect(page.locator(".site-shell")).not.toHaveClass(/is-global-menu-open/);
    await expect(page.locator("[data-global-menu-drawer]")).toBeHidden();

    await page.getByRole("button", { name: "Open global navigation menu" }).click();
    await expect(page.locator("[data-global-menu-drawer]")).toBeVisible();
    await expect(page.locator(".site-shell")).toHaveClass(/is-global-menu-open/);
    await page.keyboard.press("Escape");
    await expect(page.locator(".site-shell")).not.toHaveClass(/is-global-menu-open/);
  });

  test("Music Nexus flow updates selector context and returns to the hub", async ({ page }) => {
    await gotoHomepage(page);
    await activateHub(page);

    await page.getByRole("button", { name: "Open Music Nexus" }).click();
    await expect(page.locator("[data-current-view]")).toHaveText("Music Nexus");
    await expect(page.locator("[data-music-nexus-shell]")).toBeVisible();
    await expect(page.getByRole("heading", { name: "MUSIC NEXUS" })).toBeVisible();
    await expect(page.getByText("Recent Music Activity")).toBeVisible();
    await expect(page.getByRole("button", { name: "Bands" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("Latest bands placeholder")).toBeVisible();

    await page.getByRole("button", { name: "Bands" }).click();
    await expect(page.locator("[data-current-view]")).toHaveText("Bands");

    await page.getByRole("button", { name: "Shows", exact: true }).click();
    await expect(page.locator("[data-current-view]")).toHaveText("Shows");
    await expect(page.getByRole("button", { name: "Shows", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Bands", exact: true })).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByText("Spring Voltage")).toBeVisible();

    await page.getByRole("button", { name: "People" }).click();
    await expect(page.locator("[data-current-view]")).toHaveText("People");
    await expect(page.getByText("Adam Begin")).toBeVisible();

    await page.getByRole("button", { name: "Venues" }).click();
    await expect(page.locator("[data-current-view]")).toHaveText("Venue Detail");
    await expect(page.locator("[data-venue-detail]")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Asylum" })).toBeVisible();

    await page.getByRole("button", { name: "Open global navigation menu" }).click();
    await page.locator('[data-shell-nav-target="hub"]').click();
    await expect(page.locator("[data-current-view]")).toHaveText("Interactive Portfolio");
    await expect(page.locator("[data-music-nexus-shell]")).toBeHidden();
    await expect(page.locator("[data-hub-carousel]")).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });

  test("reduced-motion users still reach the Portfolio Hub", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoHomepage(page);

    const reducedMotionEnabled = await page.evaluate(() =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
    expect(reducedMotionEnabled).toBe(true);

    await activateHub(page);
    await expect(page.locator("[data-current-view]")).toHaveText("Interactive Portfolio");
    await page.getByRole("button", { name: "Open Music Nexus" }).click();
    await expect(page.locator("[data-current-view]")).toHaveText("Music Nexus");
    await page.getByRole("button", { name: "Shows" }).click();
    await expect(page.locator("[data-current-view]")).toHaveText("Shows");
    await expectNoHorizontalOverflow(page);
  });

  for (const viewport of viewportChecks) {
    test(`has no horizontal overflow at ${viewport.name} (${viewport.size.width}x${viewport.size.height})`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport.size);
      await gotoHomepage(page);

      await expectNoHorizontalOverflow(page);
      await activateHub(page);
      await expectNoHorizontalOverflow(page);
      await page.getByRole("button", { name: "Open Music Nexus" }).click();
      await expect(page.locator("[data-music-nexus-shell]")).toBeVisible();
      await page.getByRole("button", { name: "Venues" }).click();
      await expect(page.locator("[data-current-view]")).toHaveText("Venue Detail");
      await expect(page.locator("[data-venue-detail]")).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expect(page.locator("[data-shell-bottom-rail]")).toBeVisible();
    });
  }
});
