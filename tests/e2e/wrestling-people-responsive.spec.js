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

async function expectWrestlingShellState(page, visibleSelector) {
  const state = await page.evaluate((targetSelector) => {
    const selectors = [
      "[data-wrestling-people-shell]",
      "[data-wrestling-person-detail-shell]",
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

test.describe("wrestling people route structure", () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test("Ring Archive, People Index, and Person Detail stay connected", async ({ page }) => {
    const pageErrors = collectPageErrors(page);

    await page.goto("/wrestling", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-ring-archive-shell]")).toBeVisible();
    await page.locator("[data-ring-archive-people]").click();
    await expect(page).toHaveURL(/\/wrestling\/people$/);
    await expect(page.locator("[data-wrestling-people-shell]")).toBeVisible();
    await expectWrestlingShellState(page, "[data-wrestling-people-shell]");

    await page.getByRole("button", { name: "Open Ace Romero" }).click();
    await expect(page).toHaveURL(/\/wrestling\/people\/ace-romero$/);
    await expect(page.locator("[data-wrestling-person-detail-shell]")).toBeVisible();
    await expectWrestlingShellState(page, "[data-wrestling-person-detail-shell]");

    const openMatchButtons = page.locator(".wrestling-event-history-open");
    await expect(openMatchButtons.first()).toBeEnabled();
    await expect(openMatchButtons.first()).toHaveAttribute("data-wrestling-event-id", "warzone-26");
    await expect(openMatchButtons.first()).toHaveAttribute("data-wrestling-match-id", "match-5");
    await expect(openMatchButtons.first()).toHaveAttribute("data-wrestling-match-route", "/wrestling/shows/050826/match-5");

    await openMatchButtons.first().click();
    await expect(page).toHaveURL(/\/wrestling\/shows\/050826\/match-5$/);
    await expect(page.locator("[data-wrestling-match-gallery-shell]")).toBeVisible();
    await page.goBack({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/wrestling\/people\/ace-romero$/);
    await expect(page.locator("[data-wrestling-person-detail-shell]")).toBeVisible();
    await expectWrestlingShellState(page, "[data-wrestling-person-detail-shell]");

    await page.getByRole("button", { name: "Back to Wrestling People" }).click();
    await expect(page).toHaveURL(/\/wrestling\/people$/);
    await expect(page.locator("[data-wrestling-people-shell]")).toBeVisible();
    await expectWrestlingShellState(page, "[data-wrestling-people-shell]");

    await page.getByRole("button", { name: "Back to Ring Archive" }).click();
    await expect(page).toHaveURL(/\/wrestling$/);
    await expect(page.locator("[data-ring-archive-shell]")).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});

for (const target of targets) {
  test.describe(`wrestling people responsive: ${target.name}`, () => {
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

    test("/wrestling/people keeps controls and cards usable", async ({ page }, testInfo) => {
      const pageErrors = collectPageErrors(page);
      const response = await page.goto("/wrestling/people", { waitUntil: "domcontentloaded" });
      expect(response && response.ok()).toBe(true);

      const shell = page.locator("[data-wrestling-people-shell]");
      await expect(shell).toBeVisible();
      await expect(page.locator("[data-current-view]")).toHaveText("Wrestling People");
      await expect(shell.getByRole("heading", { name: /Wrestling People/i })).toBeVisible();
      await expect(shell.locator(".wrestling-person-card").first()).toBeVisible();
      await expectWrestlingShellState(page, "[data-wrestling-people-shell]");
      await expectCoreWrestlingCssVariables(page);

      const search = shell.locator(".wrestling-people-search-input");
      await expect(search).toBeVisible();
      await expect(search).toBeEditable();
      await search.focus();
      await expect(search).toBeFocused();

      await expectNoHorizontalOverflow(page);
      await expectNoHorizontalOverflow(page, "[data-wrestling-people-shell]");
      await expectNoHorizontalOverflow(page, ".wrestling-people-chip-row");
      await expectNoHiddenScrollTraps(page, "[data-wrestling-people-shell]");
      await expectElementsFit(page, ".wrestling-person-card-name, .wrestling-person-card-meta, .wrestling-person-card-team, .wrestling-person-card-stat");
      await expectTouchTargets(page, ".wrestling-people-back, .wrestling-people-search-input, .wrestling-people-chip, .wrestling-person-card");

      await page.screenshot({
        path: testInfo.outputPath(screenshotName(target.name, "/wrestling/people")),
        fullPage: false,
      });

      await page.evaluate(() => {
        const longName = document.querySelector(".wrestling-person-card-name");
        if (longName) {
          longName.textContent = "Alexander Christopher Palace-Romero Invitational";
        }
      });
      await expectNoHorizontalOverflow(page, "[data-wrestling-people-shell]");
      await expectElementsFit(page, ".wrestling-person-card-name");
      expect(pageErrors).toEqual([]);
    });

    test("/wrestling/people/:personId keeps detail readable", async ({ page }, testInfo) => {
      const pageErrors = collectPageErrors(page);
      const response = await page.goto("/wrestling/people/ace-romero", { waitUntil: "domcontentloaded" });
      expect(response && response.ok()).toBe(true);

      const shell = page.locator("[data-wrestling-person-detail-shell]");
      await expect(shell).toBeVisible();
      await expect(page.locator("[data-current-view]")).toHaveText("Person Detail");
      await expectWrestlingShellState(page, "[data-wrestling-person-detail-shell]");
      await expectCoreWrestlingCssVariables(page);
      await expect(shell.getByRole("heading", { name: "Ace Romero" })).toBeVisible();
      await expect(shell.getByText("Role")).toBeVisible();
      await expect(shell.getByText("EVENT HISTORY")).toBeVisible();
      await expect(shell.locator(".wrestling-event-history-row").first()).toBeVisible();
      await expect(shell.locator(".wrestling-event-history-open").first()).toBeEnabled();
      await expect(shell.locator(".wrestling-event-history-open").first()).toHaveAttribute("data-wrestling-match-route", "/wrestling/shows/050826/match-5");

      await expectNoHorizontalOverflow(page);
      await expectNoHorizontalOverflow(page, "[data-wrestling-person-detail-shell]");
      await expectNoHiddenScrollTraps(page, "[data-wrestling-person-detail-shell]");
      await expectElementsFit(page, ".wrestling-person-detail-title, .wrestling-person-fact dt, .wrestling-person-fact dd, .wrestling-event-history-event h4, .wrestling-event-history-match-name, .wrestling-event-history-match-type, .wrestling-event-history-photos");
      await expectTouchTargets(page, ".wrestling-person-detail-back, .wrestling-event-history-open[data-wrestling-match-id]");

      const photoBox = await shell.locator(".wrestling-person-detail-photo").boundingBox();
      expect(photoBox.width).toBeGreaterThanOrEqual(120);
      expect(photoBox.height).toBeLessThanOrEqual(target.size.height * 0.52);

      await page.screenshot({
        path: testInfo.outputPath(screenshotName(target.name, "/wrestling/people/ace-romero")),
        fullPage: false,
      });

      await page.evaluate(() => {
        const title = document.querySelector(".wrestling-person-detail-title");
        const matchName = document.querySelector(".wrestling-event-history-match-name");
        if (title) {
          title.textContent = "Ace Romero Palace-Christopher Invitational";
        }
        if (matchName) {
          matchName.textContent = "Ace Romero and Anthony Gangone vs Alexander James and Andrew Palace";
        }
      });
      await expectNoHorizontalOverflow(page, "[data-wrestling-person-detail-shell]");
      await expectElementsFit(page, ".wrestling-person-detail-title, .wrestling-event-history-match-name");
      expect(pageErrors).toEqual([]);
    });
  });
}
