const { test, expect } = require('@playwright/test');
const http = require('node:http');
const fixtures = require('../../qa/pass55/fixtures.json');
const HALL = '/wrestling/people';
const NAME = '[data-wrestling-person-dossier-prototype-name]';
const WORK = '[data-wrestling-person-dossier-prototype-workspace]';
const HISTORY = '[data-wrestling-person-dossier-prototype-event-history-state]';
const RETRY = '[data-wrestling-person-dossier-prototype-retry]';
let server, endpoint, streams = [];
test.beforeAll(async () => {
  server = http.createServer((req, res) => {
    const entry = { path: req.url, closed: false, headers: req.url === '/body' };
    streams.push(entry);
    res.on('close', () => { entry.closed = true; });
    if (entry.headers) {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.write('{"data":'); // Real headers arrive; the body deliberately never completes.
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  endpoint = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
async function setup(page, hang = null) {
  const c = { mode: 'ok', identity: {}, history: {}, errors: [] };
  page.on('pageerror', e => c.errors.push(e.message));
  await page.addInitScript(({ endpoint, hang }) => {
    window.__lookupCalls = []; window.__hang = hang;
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (url, options) => {
      if (String(url).includes('/api/wrestling/people/db?search=')) {
        const call = { url: String(url), start: performance.now(), aborted: false,
          shellExists: !!document.querySelector('[data-wrestling-person-dossier-prototype-shell]') };
        window.__lookupCalls.push(call);
        options?.signal?.addEventListener('abort', () => { call.aborted = true; call.abortAt = performance.now(); });
        if (window.__hang) return nativeFetch(endpoint + '/' + window.__hang, options);
      }
      return nativeFetch(url, options);
    };
  }, { endpoint, hang });
  await page.route('**/api/wrestling/people/db**', async route => {
    const search = new URL(route.request().url()).searchParams.get('search');
    if (!search) return route.fulfill({ json: { data: Object.values(fixtures).flatMap(f => f.people.data), total: 2, totalPages: 1 } });
    c.identity[search] = (c.identity[search] || 0) + 1;
    if (c.mode === 'fail') return route.fulfill({ status: 503, json: { error: 'fixture failure' } });
    if (c.mode === 'slow') await new Promise(resolve => setTimeout(resolve, 250));
    return route.fulfill({ json: fixtures[search].people });
  });
  await page.route('**/api/wrestling/shows/db**', route => {
    const person = new URL(route.request().url()).searchParams.get('participant');
    c.history[person] = (c.history[person] || 0) + 1;
    return route.fulfill({ json: fixtures[person]?.shows || { data: [] } });
  });
  await page.route('https://photos.smugmug.com/**', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#333"/></svg>' }));
  return c;
}
async function loaded(page, name = 'Aaron Rourke') {
  await expect(page.locator(WORK)).toHaveAttribute('data-wrestling-person-dossier-prototype-state', 'loaded');
  await expect(page.locator(NAME)).toHaveText(name);
  await expect(page.locator(HISTORY)).toHaveAttribute('data-wrestling-person-dossier-prototype-event-history-state', 'loaded');
}
async function hall(page, search = 'Aaron') {
  await expect(page.locator('[data-wrestling-people-prototype-shell]')).toBeVisible();
  const root = page.locator('[data-wrestling-people-prototype-shell]');
  if (await root.getAttribute('data-hall-of-champions-expanded') !== 'true') await root.locator('[data-hall-of-champions-crystal-trigger]').click();
  await page.locator('[data-hall-of-champions-search]').fill(search);
  await expect(page.getByRole('link', { name: 'Open Aaron Rourke dossier', exact: true })).toBeVisible();
}
async function layout(page) {
  return page.evaluate(() => {
    const b = document.querySelector('[data-wrestling-person-dossier-prototype-retry]').getBoundingClientRect();
    const face = document.querySelector('[data-wrestling-person-dossier-prototype-portrait]').getBoundingClientRect();
    const panel = document.querySelector('[data-wrestling-person-dossier-prototype-recovery]');
    return { overflow: document.documentElement.scrollWidth > innerWidth, inside: b.left >= face.left && b.right <= face.right && b.top >= face.top && b.bottom <= face.bottom,
      height: b.height, textClipped: panel.scrollHeight > face.height || panel.scrollWidth > face.width };
  });
}
for (const motion of ['no-preference', 'reduce']) {
  test.describe(`412 ${motion}`, () => {
    test.use({ viewport: { width: 412, height: 915 }, reducedMotion: motion, hasTouch: true });
    test('failed identity keeps timeline; keyboard retry fails then tap retry succeeds once', async ({ page }) => {
      const c = await setup(page); c.mode = 'fail';
      await page.goto(HALL + '/aaron-rourke');
      await expect(page.locator(RETRY)).toBeVisible();
      await expect(page.locator(HISTORY)).toHaveAttribute('data-wrestling-person-dossier-prototype-event-history-state', 'loaded');
      await page.locator('[data-wrestling-person-dossier-prototype-event-nav="next"]').click();
      await page.evaluate(() => { window.__retained = { workspace: document.querySelector('[data-wrestling-person-dossier-prototype-workspace]'), timeline: document.querySelector('[data-wrestling-person-dossier-prototype-event-history-state]') }; window.__retained.text = window.__retained.timeline.innerText; });
      expect(await layout(page)).toEqual({ overflow: false, inside: true, height: 44, textClipped: false });
      await page.screenshot({ path: test.info().outputPath('recovery.png') });
      await page.locator(RETRY).focus(); await page.keyboard.press('Enter');
      await expect.poll(() => c.identity['aaron rourke']).toBe(2);
      await expect(page.locator(RETRY)).toBeVisible();
      c.mode = 'slow'; await page.locator(RETRY).tap();
      await page.evaluate(() => retryWrestlingPersonDossierPrototypeRecord()); // Same activation while pending must not duplicate.
      await loaded(page);
      expect(c.identity['aaron rourke']).toBe(3); expect(c.history['aaron rourke']).toBe(1);
      expect(await page.evaluate(() => window.__retained.workspace === document.querySelector('[data-wrestling-person-dossier-prototype-workspace]') && window.__retained.timeline === document.querySelector('[data-wrestling-person-dossier-prototype-event-history-state]') && window.__retained.text === window.__retained.timeline.innerText)).toBe(true);
      await expect(page.locator(RETRY)).toBeHidden(); await expect(page.locator(WORK)).toHaveCount(1);
      expect(c.errors).toEqual([]);
      console.log(motion, 'retry counts:', JSON.stringify({ identity: c.identity, history: c.history }));
    });
    test('cold success; retained Hall Back and cached Forward', async ({ page }) => {
      const c = await setup(page); await page.goto(HALL + '/ace-romero'); await loaded(page, 'Ace Romero');
      expect(await page.evaluate(() => window.__lookupCalls[0].shellExists)).toBe(false);
      await page.evaluate(path => navigateToRoute(path), HALL); await hall(page);
      await page.getByRole('link', { name: 'Open Aaron Rourke dossier', exact: true }).click(); await loaded(page);
      await page.goBack(); await hall(page); await page.goForward(); await loaded(page);
      expect(c.identity).toEqual({ 'ace romero': 1, 'aaron rourke': 1 });
      expect(c.errors).toEqual([]);
    });
    test('Back cancels pending lookup; Forward retries; switching cannot adopt stale Person', async ({ page }) => {
      const c = await setup(page); await page.goto(HALL); await hall(page);
      await page.evaluate(() => { window.__hang = 'headers'; });
      await page.getByRole('link', { name: 'Open Aaron Rourke dossier', exact: true }).click();
      await expect(page.locator(WORK)).toHaveAttribute('data-wrestling-person-dossier-prototype-state', 'loading');
      await page.goBack(); await hall(page);
      expect(await page.evaluate(() => window.__lookupCalls[0].aborted)).toBe(true);
      expect(c.history['aaron rourke']).toBeUndefined();
      await page.evaluate(() => { window.__hang = null; }); await page.goForward(); await loaded(page);
      await page.evaluate(() => { window.__hang = 'headers'; navigateToRoute('/wrestling/people/ace-romero'); });
      await expect(page.locator(WORK)).toHaveAttribute('data-wrestling-person-dossier-prototype-state', 'loading');
      await page.evaluate(() => { window.__hang = null; navigateToRoute('/wrestling/people/aaron-rourke'); }); await loaded(page);
      expect(await page.evaluate(() => window.__lookupCalls.find(c => c.url.includes('ace+romero')).aborted)).toBe(true);
      expect(c.history['ace romero']).toBeUndefined();
      expect(c.identity['aaron rourke']).toBe(1); expect(c.errors).toEqual([]);
    });
  });
}
for (const kind of ['headers', 'body']) {
  test(`real 20-second ${kind} stall aborts, leaves timeline usable, then retry recovers`, async ({ page }) => {
    test.setTimeout(45000); await page.setViewportSize({ width: 412, height: 915 });
    const c = await setup(page, kind); await page.goto(HALL + '/aaron-rourke');
    await expect(page.locator(NAME)).toHaveText('RETRIEVING RECORD');
    await expect(page.locator(RETRY)).toBeVisible({ timeout: 24000 });
    await expect(page.locator(HISTORY)).toHaveAttribute('data-wrestling-person-dossier-prototype-event-history-state', 'loaded');
    const call = await page.evaluate(() => window.__lookupCalls[0]);
    expect(call.aborted).toBe(true); expect(call.abortAt - call.start).toBeGreaterThanOrEqual(19900); expect(call.abortAt - call.start).toBeLessThan(22000);
    await expect.poll(() => streams.some(s => s.path === '/' + kind && s.closed)).toBe(true);
    await page.evaluate(() => { window.__hang = null; }); await page.locator(RETRY).click(); await loaded(page);
    expect(c.identity['aaron rourke']).toBe(1); expect(c.history['aaron rourke']).toBe(1); expect(c.errors).toEqual([]);
    console.log(kind, 'aborted at', Math.round(call.abortAt - call.start), 'ms; retry recovered');
  });
}
test('360 recovery containment', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 }); const c = await setup(page); c.mode = 'fail';
  await page.goto(HALL + '/aaron-rourke'); await expect(page.locator(RETRY)).toBeVisible();
  expect(await layout(page)).toEqual({ overflow: false, inside: true, height: 44, textClipped: false });
});
