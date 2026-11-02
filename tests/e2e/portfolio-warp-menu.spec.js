const { test, expect } = require('@playwright/test');
const { endpoint, fulfillCalendar } = require('./fixtures/calendar.cjs');

const viewports = [
  { width: 360, height: 800 },
  { width: 412, height: 915 },
  { width: 1920, height: 1080 },
  { width: 915, height: 412 },
];
const otherLinks = ['The Story', 'The Trajectory', 'Calendar', 'Contact', 'Report an Issue', 'Admin Menu'];
const overlays = [
  { label: 'The Trajectory', path: '/upcoming', selector: '[data-trajectory-overlay]' },
  { label: 'Calendar', path: '/calendar', selector: '[data-calendar-overlay]' },
  { label: 'Contact', path: '/contact', selector: '[data-contact-overlay]' },
  { label: 'Report an Issue', path: '/report-issue', selector: '[data-incident-overlay]' },
];

const emitter = page => page.locator('[data-shell-menu-toggle]');
const panel = page => page.locator('[data-shell-menu-panel]');
const warp = page => panel(page).locator('.shell-menu-preview__warp');

async function openMenu(page) {
  await expect(emitter(page)).toBeEnabled({ timeout: 15000 });
  await emitter(page).click();
  await expect(emitter(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(panel(page)).toHaveAttribute('aria-hidden', 'false');
}

async function expectWarpMenu(page, onPortfolio) {
  await expect(warp(page)).toHaveJSProperty('hidden', onPortfolio);
  const links = onPortfolio ? otherLinks : ['Music', 'Wrestling', 'Portfolio', ...otherLinks];
  await expect(panel(page).getByRole('link')).toHaveText(links);
  await expect(panel(page).getByRole('button', { name: 'Analytics' })).toBeDisabled();
  const layout = await panel(page).evaluate(menu => {
    const rows = menu.querySelector('.shell-menu-preview__rows');
    const group = menu.querySelector('.shell-menu-preview__warp');
    const links = menu.querySelector('.shell-menu-preview__links');
    const admin = menu.querySelector('.shell-menu-preview__admin');
    return {
      fits: rows.offsetHeight <= parseFloat(getComputedStyle(menu).maxHeight) && rows.scrollWidth <= rows.clientWidth,
      warpHeight: group.offsetHeight,
      linksFillWidth: links.offsetWidth === admin.offsetWidth,
    };
  });
  expect(layout.fits).toBe(true);
  if (onPortfolio) {
    expect(layout.warpHeight).toBe(0);
    expect(layout.linksFillWidth).toBe(true);
  }
}

for (const viewport of viewports) {
  test.describe(`Portfolio Warp menu ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport, serviceWorkers: 'block' });
    test.beforeEach(async ({ page, context, baseURL }) => {
      const localOrigin = new URL(baseURL).origin;
      await context.route('**/*', route => {
        const request = route.request();
        const url = new URL(request.url());
        if (request.url() === endpoint && request.method() === 'GET') return fulfillCalendar(route);
        if ((url.origin === localOrigin && !url.pathname.startsWith('/api/')) ||
            ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname) ||
            (url.hostname === 'unpkg.com' && url.pathname.startsWith('/leaflet@1.9.4/dist/'))) {
          return route.continue();
        }
        if (request.resourceType() === 'script') return route.fulfill({ contentType: 'application/javascript', body: '' });
        if (request.resourceType() === 'stylesheet') return route.fulfill({ contentType: 'text/css', body: '' });
        return route.fulfill({ status: 503, headers: { 'access-control-allow-origin': '*' }, contentType: 'application/json', body: '{}' });
      });
      await page.goto('/portfolio', { waitUntil: 'domcontentloaded' });
      const reject = page.getByRole('button', { name: 'Reject', exact: true });
      if (await reject.isVisible()) await reject.click();
    });

    test('removes the Warp group from layout and focus on Portfolio, then follows world history', async ({ page }) => {
      test.setTimeout(60000);
      await openMenu(page);
      await expectWarpMenu(page, true);
      const story = panel(page).getByRole('link', { name: 'The Story' });
      await expect(story).toBeFocused();
      await warp(page).locator('a[href="/music"]').evaluate(link => link.focus());
      await warp(page).locator('a[href="/wrestling"]').evaluate(link => link.focus());
      await expect(story).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(panel(page).getByRole('link', { name: 'The Trajectory' })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(emitter(page)).toBeFocused();

      // The Portfolio menu has no world links, so enter Music through the existing Shell router.
      await page.evaluate(() => navigateToRoute('/music'));
      await expect(page).toHaveURL(/\/music$/);
      await openMenu(page);
      await expectWarpMenu(page, false);
      const music = panel(page).getByRole('link', { name: 'Music', exact: true });
      await expect(music).toBeFocused();
      await expect(music).toHaveAttribute('href', '/music');
      const historyLength = await page.evaluate(() => history.length);
      await music.click();
      await expect(emitter(page)).toHaveAttribute('aria-expanded', 'false');
      await expect(page).toHaveURL(/\/music$/);
      expect(await page.evaluate(() => history.length)).toBe(historyLength);

      await openMenu(page);
      const wrestling = panel(page).getByRole('link', { name: 'Wrestling', exact: true });
      await expect(wrestling).toHaveAttribute('href', '/wrestling');
      await wrestling.click();
      await expect(page).toHaveURL(/\/wrestling$/);
      await openMenu(page);
      await expectWarpMenu(page, false);

      for (const [direction, route] of [
        ['goBack', '/music'], ['goBack', '/portfolio'], ['goForward', '/music'], ['goForward', '/wrestling'],
      ]) {
        await page[direction]();
        await expect(page).toHaveURL(new RegExp(`${route}$`));
        await openMenu(page);
        await expectWarpMenu(page, route === '/portfolio');
      }
    });

    test('updates Warp visibility across overlay entry, dismissal and history', async ({ page }) => {
      test.setTimeout(60000);
      for (const overlay of overlays) {
        await openMenu(page);
        await expectWarpMenu(page, true);
        await panel(page).getByRole('link', { name: overlay.label, exact: true }).click();
        await expect(page).toHaveURL(new RegExp(`${overlay.path}$`));
        await expect(page.locator(overlay.selector)).toHaveAttribute('data-state', 'open');
        await expect(warp(page)).toHaveJSProperty('hidden', false);
        await expect(panel(page)).toHaveJSProperty('inert', true);
        await page.keyboard.press('Escape');
        await expect(page).toHaveURL(/\/portfolio$/);
        await expect(page.locator(overlay.selector)).toBeHidden();
        await expect(warp(page)).toHaveJSProperty('hidden', true);
      }
      await page.goForward();
      await expect(page).toHaveURL(/\/report-issue$/);
      await expect(page.locator('[data-incident-overlay]')).toHaveAttribute('data-state', 'open');
      await expect(warp(page)).toHaveJSProperty('hidden', false);
      await page.goBack();
      await expect(page).toHaveURL(/\/portfolio$/);
      await expect(page.locator('[data-incident-overlay]')).toBeHidden();
      await openMenu(page);
      await expectWarpMenu(page, true);
    });
  });
}
