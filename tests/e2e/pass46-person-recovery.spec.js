const { test, expect } = require('@playwright/test');
const HALL = '/wrestling/people';
const A = 'ace-romero';
const B = 'alex-test';
const records = [
  { person_id: A, slug: A, name: 'Ace Romero', display_name: 'Ace Romero', category: 'Wrestler', team: 'Archive Team', photo_count: 0 },
  { person_id: B, slug: B, name: 'Alex Test', display_name: 'Alex Test', category: 'Wrestler', team: 'Archive Team', photo_count: 0 },
];
const payload = data => ({ data, total: data.length, totalPages: 1, page: 1 });
const nameNode = '[data-wrestling-person-dossier-prototype-name]';
const hallNode = '[data-wrestling-people-prototype-shell]';
async function navigate(page, path) {
  await page.evaluate(path => navigateToRoute(path), path);
  await expect(page).toHaveURL(new RegExp(path + '$'));
}
async function setup(page) {
  const control = { identity: {}, history: {}, held: new Map(), hold: new Set(), fail: new Set(), holdHistory: false, heldHistory: null, errors: [] };
  page.on('pageerror', e => control.errors.push(e.message));
  await page.route('**/api/wrestling/people/db**', async route => {
    const search = new URL(route.request().url()).searchParams.get('search');
    if (!search) return route.fulfill({ json: payload(records) });
    const record = records.find(r => [r.slug, r.name.toLowerCase()].includes(search.toLowerCase()));
    const key = record?.slug || search;
    control.identity[key] = (control.identity[key] || 0) + 1;
    if (control.hold.has(key)) {
      control.held.set(key, route);
      return;
    }
    await route.fulfill(control.fail.has(key) ? { status: 503, json: { error: 'fixture unavailable' } } : { json: payload(record ? [record] : []) });
  });
  await page.route('**/api/wrestling/shows/db**', route => {
    const participant = new URL(route.request().url()).searchParams.get('participant')?.toLowerCase();
    if (participant) control.history[participant] = (control.history[participant] || 0) + 1;
    if (participant && control.holdHistory) { control.heldHistory = route; return; }
    return route.fulfill({ json: payload([]) });
  });
  control.release = async key => {
    await expect.poll(() => control.held.has(key)).toBe(true);
    control.hold.delete(key);
    const route = control.held.get(key);
    control.held.delete(key);
    await route.fulfill({ json: payload([records.find(r => r.slug === key)]) });
    // Drain the actual response/body/promise chain, then observe the stable next paint.
    await page.waitForTimeout(150);
  };
  return control;
}
async function openHall(page) {
  await expect(page.locator(hallNode)).toBeVisible();
  const hall = page.locator(hallNode);
  if (await hall.getAttribute('data-hall-of-champions-expanded') !== 'true') {
    await hall.locator('[data-hall-of-champions-crystal-trigger]').click();
  }
  const selector = hall.locator('[data-hall-of-champions-mode-selector]');
  if (await selector.getAttribute('data-hall-of-champions-mode-index') === '0') {
    await hall.getByRole('button', { name: 'Next archive mode' }).click();
  }
  await expect(hall.getByRole('link', { name: 'Open Ace Romero dossier' })).toBeVisible();
  return hall;
}
async function shellSnapshot(page) {
  return page.evaluate(() => ({ title: document.title, current: document.querySelector('[data-current-view]')?.textContent,
    engine: document.querySelector('[data-portfolio-engine-current-view]')?.textContent,
    identity: { status: wrestlingPersonDossierPrototypeSelectedPersonState.status, record: wrestlingPersonDossierPrototypeSelectedPersonState.record },
    history: { status: wrestlingPersonDossierPrototypeEventHistoryState.status, events: wrestlingPersonDossierPrototypeEventHistoryState.events },
    dossier: document.querySelector('[data-wrestling-person-dossier-prototype-workspace]')?.textContent || null,
  }));
}
for (const viewport of [{ width: 360, height: 800 }, { width: 412, height: 915 }, { width: 1920, height: 1080 }]) {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    test.describe(`${viewport.width}x${viewport.height} ${reducedMotion}`, () => {
      test.use({ viewport, reducedMotion });
      test('Hall accessible expansion, keyboard entry, hidden modes, Back/Forward', async ({ page }) => {
        const c = await setup(page);
        await page.goto(HALL);
        const hologram = page.locator(hallNode).locator('[data-hall-of-champions-expanded-hologram]');
        expect(await hologram.evaluate(el => !!el.closest('[aria-hidden="true"], [inert]'))).toBe(true);
        const hall = await openHall(page);
        const link = hall.getByRole('link', { name: 'Open Ace Romero dossier' });
        expect(await link.evaluate(el => !!el.closest('[aria-hidden="true"], [inert], [hidden]'))).toBe(false);
        expect(await hall.locator('[data-hall-of-champions-workspace]').evaluateAll(nodes => nodes.filter(n => !n.hidden && !n.inert && n.getAttribute('aria-hidden') !== 'true').length)).toBe(1);
        await link.focus();
        await page.keyboard.press('Tab');
        await expect(hall.getByRole('link', { name: 'Open Alex Test dossier' })).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(link).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.locator(nameNode)).toHaveText('Ace Romero');
        await page.goBack();
        await expect(page).toHaveURL(new RegExp(HALL + '$'));
        await page.goForward();
        await expect(page.locator(nameNode)).toHaveText('Ace Romero');
        expect(c.identity[A]).toBe(1);
        await navigate(page, HALL);
        const reopened = await openHall(page);
        await reopened.getByRole('button', { name: 'Next archive mode' }).click();
        await expect(reopened.locator('[data-hall-of-champions-workspace="category"]')).toBeVisible();
        expect(await reopened.locator('[data-hall-of-champions-workspace="az"]').evaluate(el => el.hidden && el.inert)).toBe(true);
        expect(await reopened.getByRole('link', { name: 'Open Ace Romero dossier' }).count()).toBe(1);
        expect(c.errors).toEqual([]);
      });
      test('delayed lookup leaves Hall state unchanged and starts no history', async ({ page }) => {
        const c = await setup(page);
        c.hold.add(A);
        await page.goto(HALL + '/' + A);
        await expect.poll(() => c.identity[A]).toBe(1);
        await navigate(page, HALL);
        const before = await shellSnapshot(page);
        await c.release(A);
        expect(await shellSnapshot(page)).toEqual(before);
        expect(c.history).toEqual({});
        await navigate(page, HALL + '/' + A);
        await expect(page.locator(nameNode)).toHaveText('Ace Romero');
        expect(c.identity[A]).toBe(1);
        expect(c.errors).toEqual([]);
        console.log('PASS46 late completion:', JSON.stringify({ viewport, reducedMotion, identity: c.identity, history: c.history }));
      });
      test('delayed history completion cannot mutate Hall state', async ({ page }) => {
        const c = await setup(page);
        c.holdHistory = true;
        await page.goto(HALL + '/' + A);
        await expect(page.locator(nameNode)).toHaveText('Ace Romero');
        await expect.poll(() => !!c.heldHistory).toBe(true);
        await navigate(page, HALL);
        const before = await shellSnapshot(page);
        await c.heldHistory.fulfill({ json: payload([]) });
        await page.waitForTimeout(150);
        expect(await shellSnapshot(page)).toEqual(before);
        c.holdHistory = false;
        await navigate(page, HALL + '/' + A);
        await expect(page.locator(nameNode)).toHaveText('Ace Romero');
        expect(c.identity[A]).toBe(1);
        expect(c.history['ace romero']).toBe(1);
        expect(c.errors).toEqual([]);
      });
      test('failed identity retries, recovers, then caches successful reopen', async ({ page }) => {
        const c = await setup(page);
        c.fail.add(A);
        await page.goto(HALL + '/' + A);
        await expect(page.locator(nameNode)).toHaveText('ARCHIVE RECORD UNAVAILABLE');
        await navigate(page, HALL);
        expect(c.identity[A]).toBe(1);
        c.fail.delete(A);
        await navigate(page, HALL + '/' + A);
        await expect(page.locator(nameNode)).toHaveText('Ace Romero');
        expect(c.identity[A]).toBe(2);
        await navigate(page, HALL);
        await navigate(page, HALL + '/' + A);
        await expect(page.locator(nameNode)).toHaveText('Ace Romero');
        expect(c.identity[A]).toBe(2);
        expect(c.errors).toEqual([]);
        console.log('PASS46 retry/cache:', JSON.stringify({ viewport, reducedMotion, identity: c.identity }));
      });
      test('rapid A-B-A adopts in-flight work; stale B cannot replace A', async ({ page }) => {
        const c = await setup(page);
        c.hold.add(A); c.hold.add(B);
        await page.goto(HALL + '/' + A);
        await expect.poll(() => c.identity[A]).toBe(1);
        await navigate(page, HALL + '/' + B);
        await expect.poll(() => c.identity[B]).toBe(1);
        await navigate(page, HALL + '/' + A);
        await c.release(A);
        await expect(page.locator(nameNode)).toHaveText('Ace Romero');
        const before = await shellSnapshot(page);
        await c.release(B);
        expect(await shellSnapshot(page)).toEqual(before);
        expect(c.identity).toEqual({ [A]: 1, [B]: 1 });
        expect(c.history['alex test']).toBeUndefined();
        await navigate(page, HALL + '/' + B);
        await expect(page.locator(nameNode)).toHaveText('Alex Test');
        expect(c.identity[B]).toBe(1);
        expect(c.errors).toEqual([]);
        console.log('PASS46 rapid switch:', JSON.stringify({ viewport, reducedMotion, identity: c.identity, history: c.history }));
      });
    });
  }
}



