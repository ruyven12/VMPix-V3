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

async function expectTitleReadable(page) {
  const title = page.getByRole("heading", { name: "Voodoo Media" });

  await expect(title).toBeVisible();

  const metrics = await title.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      opacity: Number(window.getComputedStyle(element).opacity),
    };
  });

  expect(metrics.width).toBeGreaterThan(0);
  expect(metrics.height).toBeGreaterThan(0);
  expect(metrics.opacity).toBeGreaterThan(0.8);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

test.describe("Homepage shell", () => {
  test("loads without obvious console errors", async ({ page }) => {
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

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test("keeps the environmental video wired to the locked background asset", async ({ page, request }) => {
    await gotoHomepage(page);

    const video = page.locator(".cinema-fire-bg");
    const source = video.locator("source");

    await expect(video).toBeAttached();
    await expect(video).toHaveAttribute("aria-hidden", "true");
    await expect(source).toHaveAttribute("src", "./assets/media/background/background-fire.mp4");

    const response = await request.head("/assets/media/background/background-fire.mp4");
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("video/mp4");
  });

  test("shows the locked title and bottom HUD metadata", async ({ page }) => {
    await gotoHomepage(page);

    await expectTitleReadable(page);
    await expect(page.getByText("Welcome To")).toBeVisible();
    await expect(page.getByText(/Currently Viewing:/i)).toBeVisible();
    await expect(page.getByText("Homepage")).toBeVisible();
    await expect(page.getByText(/Archive Build:/i)).toBeVisible();
    await expect(page.getByText("3.0.01")).toBeVisible();
  });

  test("keeps START visible, reachable, and able to reveal the hub", async ({ page }) => {
    await gotoHomepage(page);

    const shell = page.locator(".site-shell");
    const start = page.getByRole("button", { name: "Start Voodoo Media" });
    const hub = page.locator(".portfolio-hub");

    await expect(start).toBeVisible();

    const startBox = await start.boundingBox();
    expect(startBox).not.toBeNull();
    expect(startBox.width).toBeGreaterThanOrEqual(44);
    expect(startBox.height).toBeGreaterThanOrEqual(44);

    await start.click();

    await expect
      .poll(() => shell.evaluate((element) => element.classList.contains("is-activating")))
      .toBeTruthy();
    await expect(hub).toBeVisible({ timeout: 4_000 });
    await expect(shell).toHaveClass(/has-entered-hub/);
  });

  for (const viewport of viewportChecks) {
    test(`has no horizontal overflow at ${viewport.name} (${viewport.size.width}x${viewport.size.height})`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport.size);
      await gotoHomepage(page);

      await expectNoHorizontalOverflow(page);
      await expectTitleReadable(page);
      await expect(page.getByRole("button", { name: "Start Voodoo Media" })).toBeVisible();
      await expect(page.locator(".status-row")).toBeVisible();
    });
  }

  test("honors reduced motion while still completing the START reveal", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoHomepage(page);

    const reducedMotionEnabled = await page.evaluate(() =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );

    expect(reducedMotionEnabled).toBe(true);

    await page.getByRole("button", { name: "Start Voodoo Media" }).click();

    await expect(page.locator(".portfolio-hub")).toBeVisible({ timeout: 2_000 });
    await expect(page.locator(".site-shell")).toHaveClass(/has-entered-hub/);
    await expectNoHorizontalOverflow(page);
  });
});
