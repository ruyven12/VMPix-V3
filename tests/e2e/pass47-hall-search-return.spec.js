const { test, expect } = require('@playwright/test');
const HALL = '/wrestling/people';
const hallSelector = '[data-wrestling-people-prototype-shell]';
const people = [
  { person_id: 'ace-alpha', slug: 'ace-alpha', name: 'Ace Alpha', aliases: ['Flash'], category: 'Manager', team: 'Alpha' },
  { person_id: 'beta-bravo', slug: 'beta-bravo', name: 'Beta Bravo', aliases: ['Iron Test'], category: 'Wrestler', team: 'Omega' },
];
async function fixture(page) {
  const counts = { collection: 0, identity: 0, errors: [] };
  page.on('pageerror', e => counts.errors.push(e.message));
  await page.route('**/api/wrestling/people/db**', route => {
    const query = new URL(route.request().url()).searchParams.get('search');
    counts[query ? 'identity' : 'collection']++;
    const data = query ? people.filter(p => [p.name.toLowerCase(), p.slug].includes(query.toLowerCase())) : people;
    return route.fulfill({ json: { data, total: data.length, totalPages: 1 } });
  });
  await page.route('**/api/wrestling/shows/db**', route => route.fulfill({ json: { data: [], total: 0, totalPages: 1 } }));
  return counts;
}
async function open(page) {
  await page.goto(HALL);
  const hall = page.locator(hallSelector);
  await hall.locator('[data-hall-of-champions-crystal-trigger]').click();
  await expect(hall).toHaveAttribute('data-hall-of-champions-mode-selector-ready', 'true');
  await expect(hall.getByRole('searchbox')).toBeVisible();
  return hall;
}
async function mode(hall, index) {
  for (let n = 1; n <= index; n++) {
    await hall.getByRole('button', { name: 'Next archive mode' }).click();
    await expect(hall.locator('[data-hall-of-champions-mode-selector]')).toHaveAttribute('data-hall-of-champions-mode-index', String(n));
  }
}
async function state(hall) {
  return hall.evaluate(el => ({
    mode: el.querySelector('[data-hall-of-champions-mode-selector]').dataset.hallOfChampionsModeIndex,
    expanded: el.dataset.hallOfChampionsExpanded,
    query: el.querySelector('input[type="search"]').value,
    filter: el.querySelector('[data-hall-of-champions-letter-label="current"]')?.textContent,
    links: [...el.querySelectorAll('[role="link"]')].filter(n => !n.closest('[hidden], [inert], [aria-hidden="true"]')).map(n => n.getAttribute('aria-label')),
  }));
}
for (const viewport of [{width:360,height:800},{width:412,height:915},{width:1920,height:1080}]) {
  test.describe(`${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport, reducedMotion: 'no-preference' });
    test('SEARCH uses local names and aliases with standby/empty and safe input', async ({page}) => {
      const counts = await fixture(page);
      const hall = await open(page);
      const input = hall.getByRole('searchbox');
      await expect(hall.getByText('SEARCH WORKSPACE STANDBY')).toBeVisible();
      const before = counts.collection;
      await input.pressSequentially('bEtA');
      await expect(hall.getByRole('link', {name:'Open Beta Bravo dossier'})).toBeVisible();
      await expect(hall.getByRole('link')).toHaveCount(1);
      await input.fill('iRoN');
      await expect(hall.getByRole('link', {name:'Open Beta Bravo dossier'})).toBeVisible();
      await input.fill('zzz-nobody');
      await expect(hall.getByRole('link')).toHaveCount(0);
      await expect(hall.locator('[data-hall-of-champions-workspace-results="search"]')).toContainText(/NO .*RECORD|NO .*RESULT/i);
      await input.fill('');
      await expect(hall.getByText('SEARCH WORKSPACE STANDBY')).toBeVisible();
      await expect(hall.getByRole('link')).toHaveCount(0);
      expect(counts.collection).toBe(before);
      expect(counts.identity).toBe(0);
      const box = await input.boundingBox();
      expect(box.width).toBeGreaterThan(100);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(counts.errors).toEqual([]);
    });
    for (const [label,index] of [['SEARCH',0],['A-Z',1],['CATEGORY',2],['TEAM',3]]) {
      test(`${label} restores filter/results/focus through browser Back/Forward`, async ({page}) => {
        const counts = await fixture(page);
        const hall = await open(page);
        await mode(hall,index);
        if (index === 0) await hall.getByRole('searchbox').fill('iRoN');
        else await hall.locator('[data-hall-of-champions-letter-nav="next"]').click();
        const link = hall.getByRole('link', {name:'Open Beta Bravo dossier'});
        await expect(link).toBeVisible();
        const before = await state(hall);
        await link.focus();
        await page.keyboard.press('Enter');
        await expect(page.locator('[data-wrestling-person-dossier-prototype-name]')).toHaveText('Beta Bravo');
        // Exercise browser history within the same document.
        await page.goBack();
        await expect(page).toHaveURL(new RegExp(HALL+'$'));
        await expect(page.locator(hallSelector)).toHaveAttribute('data-hall-of-champions-mode-selector-ready','true');
        await expect(page.locator(hallSelector).getByRole('link',{name:'Open Beta Bravo dossier'})).toBeFocused();
        expect(await state(page.locator(hallSelector))).toEqual(before);
        await page.goForward();
        await expect(page).toHaveURL(new RegExp(HALL+'/beta-bravo$'));
        await expect(page.locator('[data-wrestling-person-dossier-prototype-name]')).toHaveText('Beta Bravo');
        await page.goBack();
        await expect(page.locator(hallSelector).getByRole('link',{name:'Open Beta Bravo dossier'})).toBeFocused();
        expect(await state(page.locator(hallSelector))).toEqual(before);
        expect(counts.identity).toBe(1);
        expect(counts.errors).toEqual([]);
      });
    }
    test('direct person entry returns to default Hall without snapshot', async ({page}) => {
      const counts = await fixture(page);
      await page.goto(HALL+'/beta-bravo');
      await expect(page.locator('[data-wrestling-person-dossier-prototype-name]')).toHaveText('Beta Bravo');
      await page.evaluate(() => navigateToRoute(getShellBackTarget()));
      await expect(page).toHaveURL(new RegExp(HALL+'$'));
      const hall = page.locator(hallSelector);
      await expect(hall).toBeVisible();
      await expect(hall.locator('[data-hall-of-champions-mode-selector]')).toHaveAttribute('data-hall-of-champions-mode-index','0');
      expect(await hall.getAttribute('data-hall-of-champions-expanded')).not.toBe('true');
      expect(await hall.locator('input[type="search"]').inputValue()).toBe('');
      expect(counts.errors).toEqual([]);
    });
  });
}

