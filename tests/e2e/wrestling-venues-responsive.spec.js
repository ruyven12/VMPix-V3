const { test, expect } = require("@playwright/test");

const targets = [
  { name: "small-phone", size: { width: 320, height: 640 }, isMobile: true, hasTouch: true, dpr: 2 },
  { name: "samsung-s25-ultra", size: { width: 384, height: 854 }, isMobile: true, hasTouch: true, dpr: 3 },
  { name: "tablet", size: { width: 768, height: 1024 }, isMobile: true, hasTouch: true, dpr: 2 },
  { name: "desktop", size: { width: 1440, height: 900 }, isMobile: false, hasTouch: false, dpr: 1 },
  {
    name: "facebook-webview",
    size: { width: 393, height: 700 },
    isMobile: true,
    hasTouch: true,
    dpr: 3,
    userAgent: "Mozilla/5.0 (Linux; Android 15; SM-S938U) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/520.0.0.0.0;]",
  },
  {
    name: "messenger-webview",
    size: { width: 393, height: 700 },
    isMobile: true,
    hasTouch: true,
    dpr: 3,
    userAgent: "Mozilla/5.0 (Linux; Android 15; SM-S938U) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36 [FBAN/MessengerForAndroid;FBAV/520.0.0.0.0;]",
  },
  {
    name: "instagram-webview",
    size: { width: 390, height: 694 },
    isMobile: true,
    hasTouch: true,
    dpr: 3,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22F76 Instagram 382.0.0.0.0",
  },
  {
    name: "x-twitter-webview",
    size: { width: 412, height: 715 },
    isMobile: true,
    hasTouch: true,
    dpr: 3,
    userAgent: "Mozilla/5.0 (Linux; Android 15; SM-S938U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 TwitterAndroid/10.90.0",
  },
];

const ignoredConsoleErrors = [
  /fonts\.googleapis\.com/i,
  /fonts\.gstatic\.com/i,
];

function screenshotName(targetName, routePath) {
  return `${targetName}-${routePath.replace(/^\/+/, "").replace(/[/?#]+/g, "-")}.png`;
}

function collectPageErrors(page) {
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error" && !ignoredConsoleErrors.some((pattern) => pattern.test(message.text()))) {
      pageErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  return pageErrors;
}

async function expectNoHorizontalOverflow(page, selector = null) {
  const overflow = await page.evaluate((targetSelector) => {
    const target = targetSelector ? document.querySelector(targetSelector) : document.documentElement;
    if (!target) {
      return 0;
    }

    const body = document.body;
    const documentOverflow = Math.max(
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
      body.scrollWidth - document.documentElement.clientWidth
    );
    return targetSelector
      ? target.scrollWidth - target.clientWidth
      : documentOverflow;
  }, selector);

  expect(overflow).toBeLessThanOrEqual(2);
}

async function expectNoHiddenScrollTraps(page, shellSelector) {
  const offenders = await page.evaluate((targetSelector) => {
    const shell = document.querySelector(targetSelector);
    if (!shell) {
      return [];
    }

    return Array.from(shell.querySelectorAll("*"))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        if (style.visibility === "hidden" || style.display === "none") {
          return false;
        }

        const hasVerticalTrap = /(auto|scroll|hidden)/.test(style.overflowY) && element.scrollHeight - element.clientHeight > 2;
        const hasHorizontalTrap = /(auto|scroll|hidden)/.test(style.overflowX) && element.scrollWidth - element.clientWidth > 2;
        return hasVerticalTrap || hasHorizontalTrap;
      })
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        className: element.className,
        text: element.textContent.trim().slice(0, 80),
      }));
  }, shellSelector);

  expect(offenders).toEqual([]);
}

async function expectElementsFit(page, selector) {
  const offenders = await page.locator(selector).evaluateAll((elements) =>
    elements
      .filter((element) => {
        const style = window.getComputedStyle(element);
        if (style.visibility === "hidden" || style.display === "none") {
          return false;
        }

        return element.scrollWidth - element.clientWidth > 2;
      })
      .map((element) => element.textContent.trim())
  );

  expect(offenders).toEqual([]);
}

async function expectCoreWrestlingCssVariables(page) {
  const missingVariables = await page.evaluate(() => {
    const styles = window.getComputedStyle(document.documentElement);
    return [
      "--accent-ring",
      "--color-text",
      "--ease-standard",
      "--motion-standard",
      "--radius-md",
      "--radius-sm",
      "--shell-viewport-pad-block",
      "--tap-target",
    ].filter((variableName) => !styles.getPropertyValue(variableName).trim());
  });

  expect(missingVariables).toEqual([]);
}

async function expectWrestlingVenueShellState(page, visibleSelector) {
  const state = await page.evaluate((targetSelector) => {
    const selectors = [
      "[data-wrestling-people-shell]",
      "[data-wrestling-person-detail-shell]",
      "[data-wrestling-venues-shell]",
      "[data-wrestling-venue-detail-shell]",
      "[data-wrestling-shows-shell]",
      "[data-wrestling-show-detail-shell]",
      "[data-wrestling-match-gallery-shell]",
      "[data-wrestling-lightbox-shell]",
    ];

    return selectors.map((selector) => {
      const element = document.querySelector(selector);
      return {
        selector,
        ariaHidden: element?.getAttribute("aria-hidden"),
        inert: element?.hasAttribute("inert") || false,
        visible: element ? window.getComputedStyle(element).visibility : "missing",
        shouldBeVisible: selector === targetSelector,
      };
    });
  }, visibleSelector);

  expect(state.filter((item) => item.shouldBeVisible)).toEqual([
    expect.objectContaining({ ariaHidden: "false", inert: false, visible: "visible" }),
  ]);
  expect(state.filter((item) => !item.shouldBeVisible)).toEqual(
    expect.arrayContaining(
      state
        .filter((item) => !item.shouldBeVisible)
        .map((item) => expect.objectContaining({ selector: item.selector, ariaHidden: "true", inert: true }))
    )
  );
}

async function expectTouchTargets(page, selector) {
  const offenders = await page.locator(selector).evaluateAll((elements) =>
    elements
      .filter((element) => {
        const style = window.getComputedStyle(element);
        if (style.visibility === "hidden" || style.display === "none") {
          return false;
        }

        const box = element.getBoundingClientRect();
        return box.width < 44 || box.height < 44;
      })
      .map((element) => {
        const box = element.getBoundingClientRect();
        return {
          text: element.textContent.trim(),
          width: Math.round(box.width),
          height: Math.round(box.height),
        };
      })
  );

  expect(offenders).toEqual([]);
}

test.describe("wrestling venues route structure", () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test("Ring Archive, Venues Index, and Venue Detail stay connected", async ({ page }) => {
    const pageErrors = collectPageErrors(page);

    await page.goto("/wrestling", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-ring-archive-shell]")).toBeVisible();
    await page.locator("[data-ring-archive-venues]").click();
    await expect(page).toHaveURL(/\/wrestling\/venues$/);
    await expect(page.locator("[data-wrestling-venues-shell]")).toBeVisible();
    await expectWrestlingVenueShellState(page, "[data-wrestling-venues-shell]");

    await page.getByRole("button", { name: "Open Portland Expo" }).click();
    await expect(page).toHaveURL(/\/wrestling\/venues\/portland_expo$/);
    await expect(page.locator("[data-wrestling-venue-detail-shell]")).toBeVisible();
    await expectWrestlingVenueShellState(page, "[data-wrestling-venue-detail-shell]");

    const openEventButtons = page.locator(".wrestling-venue-event-open");
    await expect(openEventButtons.first()).toBeEnabled();
    await expect(openEventButtons.first()).toHaveAttribute("data-wrestling-show-id", "warzone-26");
    await expect(openEventButtons.first()).toHaveAttribute("data-wrestling-show-route", "/wrestling/shows/050826");

    await openEventButtons.first().click();
    await expect(page).toHaveURL(/\/wrestling\/shows\/050826$/);
    await expect(page.locator("[data-wrestling-show-detail-shell]")).toBeVisible();
    await page.goBack({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/wrestling\/venues\/portland_expo$/);
    await expect(page.locator("[data-wrestling-venue-detail-shell]")).toBeVisible();
    await expectWrestlingVenueShellState(page, "[data-wrestling-venue-detail-shell]");

    await page.getByRole("button", { name: "Back to Wrestling Venues" }).click();
    await expect(page).toHaveURL(/\/wrestling\/venues$/);
    await expect(page.locator("[data-wrestling-venues-shell]")).toBeVisible();
    await expectWrestlingVenueShellState(page, "[data-wrestling-venues-shell]");

    await page.getByRole("button", { name: "Back to Ring Archive" }).click();
    await expect(page).toHaveURL(/\/wrestling$/);
    await expect(page.locator("[data-ring-archive-shell]")).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});

for (const target of targets) {
  test.describe(`wrestling venues responsive: ${target.name}`, () => {
    const useOptions = {
      viewport: target.size,
      deviceScaleFactor: target.dpr,
      hasTouch: target.hasTouch,
      isMobile: target.isMobile,
    };
    if (target.userAgent) {
      useOptions.userAgent = target.userAgent;
    }
    test.use(useOptions);

    test("/wrestling/venues keeps controls and cards usable", async ({ page }, testInfo) => {
      const pageErrors = collectPageErrors(page);
      const response = await page.goto("/wrestling/venues", { waitUntil: "domcontentloaded" });
      expect(response && response.ok()).toBe(true);

      const shell = page.locator("[data-wrestling-venues-shell]");
      await expect(shell).toBeVisible();
      await expect(page.locator("[data-current-view]")).toHaveText("Wrestling Venues");
      await expect(shell.getByRole("heading", { name: /Wrestling Venues/i })).toBeVisible();
      await expect(shell.locator(".wrestling-venue-card").first()).toBeVisible();
      await expect(shell.locator(".wrestling-venue-card[data-wrestling-venue-route='/wrestling/venues/portland_expo']")).toHaveCount(1);
      await expectWrestlingVenueShellState(page, "[data-wrestling-venues-shell]");
      await expectCoreWrestlingCssVariables(page);

      const search = shell.locator(".wrestling-venues-search-input");
      await expect(search).toBeVisible();
      await expect(search).toBeEditable();
      await search.focus();
      await expect(search).toBeFocused();

      await expectNoHorizontalOverflow(page);
      await expectNoHorizontalOverflow(page, "[data-wrestling-venues-shell]");
      await expectNoHorizontalOverflow(page, ".wrestling-venues-chip-row");
      await expectNoHiddenScrollTraps(page, "[data-wrestling-venues-shell]");
      await expectElementsFit(page, ".wrestling-venue-card-name, .wrestling-venue-card-location, .wrestling-venue-card-stat, .wrestling-venue-card-action");
      await expectTouchTargets(page, ".wrestling-venues-back, .wrestling-venues-search-input, .wrestling-venues-chip, .wrestling-venue-card");

      const firstMediaBox = await shell.locator(".wrestling-venue-card-mark").first().boundingBox();
      expect(firstMediaBox.width).toBeGreaterThanOrEqual(32);
      expect(firstMediaBox.height).toBeLessThanOrEqual(target.size.height * 0.42);

      await page.screenshot({
        path: testInfo.outputPath(screenshotName(target.name, "/wrestling/venues")),
        fullPage: false,
      });

      await page.evaluate(() => {
        const longName = document.querySelector(".wrestling-venue-card-name");
        if (longName) {
          longName.textContent = "Bissell Brothers Brewing Company Warehouse Invitational Annex";
        }
      });
      await expectNoHorizontalOverflow(page, "[data-wrestling-venues-shell]");
      await expectElementsFit(page, ".wrestling-venue-card-name");
      expect(pageErrors).toEqual([]);
    });

    test("/wrestling/venues/:venueId keeps detail readable", async ({ page }, testInfo) => {
      const pageErrors = collectPageErrors(page);
      const response = await page.goto("/wrestling/venues/portland_expo", { waitUntil: "domcontentloaded" });
      expect(response && response.ok()).toBe(true);

      const shell = page.locator("[data-wrestling-venue-detail-shell]");
      await expect(shell).toBeVisible();
      await expect(page.locator("[data-current-view]")).toHaveText("Venue Detail");
      await expectWrestlingVenueShellState(page, "[data-wrestling-venue-detail-shell]");
      await expectCoreWrestlingCssVariables(page);
      await expect(shell.getByRole("heading", { name: "Portland Expo" })).toBeVisible();
      await expect(shell.getByText(/Portland, (ME|Maine)/)).toBeVisible();
      await expect(shell.getByText("EVENT HISTORY")).toBeVisible();
      await expect(shell.locator(".wrestling-venue-event-row").first()).toBeVisible();
      await expect(shell.locator(".wrestling-venue-event-open").first()).toBeEnabled();
      await expect(shell.locator(".wrestling-venue-event-open").first()).toHaveAttribute("data-wrestling-show-route", "/wrestling/shows/050826");

      await expectNoHorizontalOverflow(page);
      await expectNoHorizontalOverflow(page, "[data-wrestling-venue-detail-shell]");
      await expectNoHiddenScrollTraps(page, "[data-wrestling-venue-detail-shell]");
      await expectElementsFit(page, ".wrestling-venue-detail-title, .wrestling-venue-detail-location, .wrestling-venue-fact dt, .wrestling-venue-fact dd, .wrestling-venue-event-name h4, .wrestling-venue-event-name p, .wrestling-venue-event-date, .wrestling-venue-event-photos");
      await expectTouchTargets(page, ".wrestling-venue-detail-back, .wrestling-venue-event-open");

      const imageBox = await shell.locator(".wrestling-venue-detail-image").boundingBox();
      expect(imageBox.width).toBeGreaterThanOrEqual(120);
      expect(imageBox.height).toBeLessThanOrEqual(target.size.height * 0.46);

      await page.screenshot({
        path: testInfo.outputPath(screenshotName(target.name, "/wrestling/venues/portland_expo")),
        fullPage: false,
      });

      await page.evaluate(() => {
        const title = document.querySelector(".wrestling-venue-detail-title");
        const eventName = document.querySelector(".wrestling-venue-event-name h4");
        if (title) {
          title.textContent = "Bissell Brothers Brewing Company Warehouse Invitational Annex";
        }
        if (eventName) {
          eventName.textContent = "Limitless Wrestling Championship Invitational Warehouse Show";
        }
      });
      await expectNoHorizontalOverflow(page, "[data-wrestling-venue-detail-shell]");
      await expectElementsFit(page, ".wrestling-venue-detail-title, .wrestling-venue-event-name h4");
      expect(pageErrors).toEqual([]);
    });
  });
}
