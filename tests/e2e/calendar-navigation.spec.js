const { test, expect } = require("@playwright/test");

const viewports = [
  { name: "mobile-samsung", size: { width: 360, height: 800 } },
  { name: "desktop", size: { width: 1366, height: 768 } },
];

const ignoredConsoleErrors = [
  /fonts\.googleapis\.com/i,
  /fonts\.gstatic\.com/i,
];

function collectPageErrors(page) {
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

  return { consoleErrors, pageErrors };
}

for (const viewport of viewports) {
  test.describe(`calendar universal navigation: ${viewport.name}`, () => {
    test.use({ viewport: viewport.size });

    test("Calendar uses drawer, active, breadcrumb, rail, and browser back state", async ({ page }) => {
      const { consoleErrors, pageErrors } = collectPageErrors(page);

      await page.goto("/portfolio", { waitUntil: "domcontentloaded" });
      await expect(page.locator(".portfolio-hub")).toBeVisible();

      await page.getByRole("button", { name: "Open global navigation menu" }).click();
      const drawer = page.locator("[data-global-menu-drawer]");
      await expect(drawer).toHaveAttribute("aria-hidden", "false");

      const calendarButton = drawer.locator("[data-global-nav-target='calendar']");
      await expect(calendarButton).toBeVisible();
      await expect(calendarButton).toHaveText("Calendar");
      await expect(calendarButton).toHaveAttribute("data-global-nav-route", "/calendar");
      await expect(calendarButton).toHaveAttribute("data-global-nav-parent", "Site");

      await calendarButton.click();
      await expect(page).toHaveURL(/\/calendar$/);
      await expect(page.locator("[data-calendar-shell]")).toBeVisible();
      await expect(page.locator("[data-calendar-shell]")).toHaveAttribute("aria-hidden", "false");
      await expect(page.locator(".portfolio-hub")).toHaveAttribute("aria-hidden", "true");
      await expect(page.locator(".site-shell")).toHaveAttribute("data-shell-route", "calendar");
      await expect(page.locator(".site-shell")).toHaveAttribute("data-shell-active-target", "calendar");
      await expect(page.locator(".site-shell")).toHaveAttribute("data-shell-module", "site");
      await expect(page.locator("[data-shell-bottom-rail]")).toHaveAttribute("data-shell-route", "calendar");
      await expect(page.locator("[data-shell-bottom-rail]")).toHaveAttribute("data-shell-active-target", "calendar");
      await expect(page.locator("[data-shell-bottom-rail]")).toHaveAttribute("data-shell-module", "site");
      await expect(page.locator("[data-current-view]")).toHaveText("Calendar");
      await expect(page.locator("[data-global-nav-target='calendar']")).toHaveAttribute("aria-current", "page");

      const breadcrumb = page.locator("[data-shell-breadcrumb]");
      await expect(breadcrumb).toHaveAttribute("aria-label", "Current location: Portfolio > Calendar");
      await expect(breadcrumb.locator("[aria-current='page'] .shell-breadcrumb-label")).toHaveText("Calendar");

      await expect(page.locator("[data-shell-back]")).toHaveCount(0);

      await page.getByRole("button", { name: "Open global navigation menu" }).click();
      await expect(drawer).toHaveAttribute("aria-hidden", "false");
      await expect(drawer.locator("[data-global-nav-target='calendar']")).toBeVisible();
      await expect(drawer.locator("[data-global-nav-target='calendar']")).toHaveAttribute("aria-current", "page");
      await page.locator("[data-global-menu-close]").click();
      await expect(drawer).toHaveAttribute("aria-hidden", "true");

      await page.goBack();
      await expect(page).toHaveURL(/\/portfolio$/);
      await expect(page.locator(".portfolio-hub")).toBeVisible();
      await expect(page.locator("[data-calendar-shell]")).toHaveAttribute("aria-hidden", "true");
      await expect(page.locator(".site-shell")).toHaveAttribute("data-shell-route", "portfolio");
      await expect(page.locator("[data-current-view]")).toHaveText("Interactive Portfolio");
      await expect(page.locator("[data-global-nav-target='portfolio']")).toHaveAttribute("aria-current", "page");

      expect(pageErrors).toEqual([]);
      expect(consoleErrors).toEqual([]);
    });
  });
}
