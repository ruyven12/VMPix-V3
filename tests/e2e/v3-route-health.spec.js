const { test, expect } = require("@playwright/test");

// Opt-in: existing test:e2e behavior remains unchanged unless the runner supplies routes.
const routes = process.env.V3_QA_ROUTES ? JSON.parse(process.env.V3_QA_ROUTES) : [];
const targets = [{ width: 360, height: 800 }, { width: 412, height: 915 }, { width: 1920, height: 1080 }];

for (const route of routes) for (const viewport of targets) for (const reducedMotion of ["no-preference", "reduce"]) {
  test.describe(`route health ${route} ${viewport.width}x${viewport.height} ${reducedMotion}`, () => {
    test.use({ viewport, reducedMotion });
    test("renders a usable V3 route", async ({ page, baseURL }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion });
      const errors = [];
      const externalErrors = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("console", message => {
        if (message.type() !== "error") return;
        const source = message.location().url;
        // Third-party resource failures are recorded, not treated as V3 JavaScript failures.
        if (source && new URL(source, baseURL).origin !== new URL(baseURL).origin) {
          externalErrors.push(message.text());
        } else errors.push(message.text());
      });
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.ok(), "Route document responds successfully").toBe(true);
      await expect(page.locator(".site-shell")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      // Bounded settling window; no networkidle dependency on remote photos/APIs.
      await page.waitForTimeout(1200);
      if (new URL(route, baseURL).pathname !== "/") {
        await expect(page.locator("[data-portfolio-engine]")).toBeVisible();
        await expect(page.locator("[data-portfolio-engine]")).toBeInViewport();
      }
      const health = await page.evaluate(() => {
        const visible = e => e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) &&
          !e.closest('[inert], [aria-hidden="true"]');
        const inView = r => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
        const controls = [...document.querySelectorAll('button, a[href], input, select, textarea, [role="button"]')]
          .filter(e => visible(e) && inView(e.getBoundingClientRect()));
        const clipped = [];
        for (const e of controls) {
          const r = e.getBoundingClientRect();
          // Scrolling/carousel windows intentionally expose only part of adjacent items.
          let scrollWindow = false;
          for (let a = e.parentElement; a; a = a.parentElement) {
            const s = getComputedStyle(a);
            if (/(auto|scroll)/.test(s.overflowX + s.overflowY)) scrollWindow = true;
          }
          if (!scrollWindow && (r.left < -2 || r.right > innerWidth + 2 || r.top < -2 || r.bottom > innerHeight + 2)) {
            clipped.push(e.getAttribute("aria-label") || e.textContent.trim().slice(0, 70) || e.tagName);
          }
        }
        const scrollFailures = [];
        for (const e of [document.scrollingElement, ...document.querySelectorAll("main, section, ul, [role='list']")]) {
          if (!e || !visible(e) || !inView(e.getBoundingClientRect())) continue;
          const s = getComputedStyle(e);
          if (e.scrollHeight > e.clientHeight + 2 && (e === document.scrollingElement || /(auto|scroll)/.test(s.overflowY))) {
            const previous = e.scrollTop;
            e.scrollTop = previous === 0 ? 1 : 0;
            if (e.scrollTop === previous) scrollFailures.push(e.className || e.tagName);
            e.scrollTop = previous;
          }
        }
        const content = [...document.querySelectorAll("h1, h2, h3, p, button, span, [role='heading']")]
          .filter(e => e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) &&
            !e.closest("[data-portfolio-engine], [data-shell-bottom-rail]") &&
            inView(e.getBoundingClientRect()) && e.textContent.trim());
        return {
          overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
          content: content.length, controls: controls.length, clipped, scrollFailures,
          viewport: { width: innerWidth, height: innerHeight },
          reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
        };
      });
      expect(health.viewport).toEqual(viewport);
      expect(health.overflow, "Document horizontal overflow").toBeLessThanOrEqual(2);
      expect(health.content, "Visible primary text/content in viewport").toBeGreaterThan(0);
      expect(health.clipped, "Interactive controls cut by viewport").toEqual([]);
      expect(health.scrollFailures, "Scrollable content responds to scrolling").toEqual([]);
      expect(health.reduced).toBe(reducedMotion === "reduce");
      expect(errors, "Uncaught exceptions / application console errors").toEqual([]);
      if (externalErrors.length) testInfo.annotations.push({ type: "external-resource", description: externalErrors.join("; ") });
    });
  });
}
