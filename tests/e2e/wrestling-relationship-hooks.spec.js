const { test, expect } = require("@playwright/test");

const ignoredConsoleErrors = [
  /fonts\.googleapis\.com/i,
  /fonts\.gstatic\.com/i,
];

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

test.describe("wrestling relationship placeholder hooks", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("DB-backed people, venues, shows, matches, and lightbox expose current relationship routes", async ({ page }) => {
    const pageErrors = collectPageErrors(page);

    await page.goto("/wrestling", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-ring-archive-shell]")).toBeVisible();
    await page.locator("[data-ring-archive-shows]").click();
    await expect(page).toHaveURL(/\/wrestling\/shows$/);

    const showsShell = page.locator("[data-wrestling-shows-shell][aria-hidden='false']");
    await expect(showsShell).toBeVisible();
    const warzoneEntry = showsShell.locator(".wrestling-show-entry[data-wrestling-show-route='/wrestling/shows/050826']");
    await expect(warzoneEntry).toHaveCount(1);
    await warzoneEntry.click();
    await expect(page).toHaveURL(/\/wrestling\/shows\/050826$/);

    const showShell = page.locator("[data-wrestling-show-detail-shell][aria-hidden='false']");
    await expect(showShell).toBeVisible();
    await expect(showShell).toHaveAttribute("data-wrestling-relationship-schema", "placeholder-v1");
    await expect(showShell).toHaveAttribute("data-wrestling-show-id", "warzone-26");
    await expect(showShell).toHaveAttribute("data-wrestling-venue-id", "wv-portland-expo");
    await expect(showShell).toHaveAttribute("data-wrestling-match-ids", /match-1/);
    await expect(showShell).toHaveAttribute("data-wrestling-match-ids", /segment/);

    const firstMatch = showShell.locator(".wrestling-match-card[data-wrestling-match-ref='match-1']");
    await expect(firstMatch).toHaveCount(1);
    await expect(firstMatch).toHaveAttribute("data-wrestling-match-id", "match-1");
    await expect(firstMatch).toHaveAttribute("data-wrestling-match-route", "/wrestling/shows/050826/match-1");

    const segmentMatch = showShell.locator(".wrestling-match-card[data-wrestling-match-ref='segment']");
    await expect(segmentMatch).toHaveCount(1);
    await expect(segmentMatch).toHaveAttribute("data-wrestling-match-route", "/wrestling/shows/050826/segment");

    const openGallery = showShell.locator(".wrestling-gallery-button");
    await expect(openGallery).toHaveAttribute("data-wrestling-match-route", "/wrestling/shows/050826/match-1");
    await expect(showShell.locator(".wrestling-gallery-count")).not.toHaveText("12 Photos");
    await firstMatch.click();
    await expect(page).toHaveURL(/\/wrestling\/shows\/050826\/match-1$/);

    const matchGallery = page.locator("[data-wrestling-match-gallery-shell][aria-hidden='false']");
    await expect(matchGallery).toBeVisible();
    await expect(matchGallery).toHaveAttribute("data-wrestling-show-id", "warzone-26");
    await expect(matchGallery).toHaveAttribute("data-wrestling-match-id", "match-1");
    await expect(matchGallery).toHaveAttribute("data-wrestling-match-ref", "match-1");
    await expect(matchGallery).toHaveAttribute("data-wrestling-match-route", "/wrestling/shows/050826/match-1");
    await expect(matchGallery).toHaveAttribute("data-wrestling-venue-id", "wv-portland-expo");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/wrestling\/shows\/050826\/match-1$/);
    await expect(page.locator("[data-wrestling-match-gallery-shell][aria-hidden='false']")).toHaveAttribute("data-wrestling-match-id", "match-1");

    const firstPhoto = page.locator("[data-wrestling-match-gallery-shell][aria-hidden='false'] .wrestling-photo-tile").first();
    await expect(firstPhoto).toHaveAttribute("data-wrestling-lightbox-route", "/wrestling/shows/050826/match-1/photo/001");
    await firstPhoto.click();
    await expect(page).toHaveURL(/\/wrestling\/shows\/050826\/match-1\/photo\/001$/);

    const lightbox = page.locator("[data-lightbox-screen][aria-hidden='false']");
    await expect(lightbox).toBeVisible();
    await expect(page.locator("[data-lightbox-image]")).toBeVisible();
    await expect(page.locator("[data-wrestling-lightbox-shell]")).toHaveAttribute("data-wrestling-show-id", "warzone-26");
    await expect(page.locator("[data-wrestling-lightbox-shell]")).toHaveAttribute("data-wrestling-match-id", "match-1");
    await expect(page.locator("[data-wrestling-lightbox-shell]")).toHaveAttribute("data-wrestling-photo-id", "001");

    const firstLightboxSrc = await page.locator("[data-lightbox-image]").getAttribute("src");
    await page.locator("[data-lightbox-next]").click();
    await expect(page).toHaveURL(/\/wrestling\/shows\/050826\/match-1\/photo\/002$/);
    await expect.poll(async () => page.locator("[data-lightbox-image]").getAttribute("src")).not.toBe(firstLightboxSrc);
    await expect(page.locator("[data-wrestling-lightbox-shell]")).toHaveAttribute("data-wrestling-photo-id", "002");
    await page.locator("[data-lightbox-prev]").click();
    await expect(page).toHaveURL(/\/wrestling\/shows\/050826\/match-1\/photo\/001$/);
    await expect(page.locator("[data-wrestling-lightbox-shell]")).toHaveAttribute("data-wrestling-photo-id", "001");
    await page.locator("[data-lightbox-next]").click();
    await expect(page).toHaveURL(/\/wrestling\/shows\/050826\/match-1\/photo\/002$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/wrestling\/shows\/050826\/match-1$/);
    await expect(page.locator("[data-wrestling-match-gallery-shell][aria-hidden='false']")).toBeVisible();

    await page.goto("/wrestling/shows/050826/match-1/photo/001", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-lightbox-screen][aria-hidden='false']")).toBeVisible();
    await page.locator("[data-lightbox-back]").click();
    await expect(page).toHaveURL(/\/wrestling\/shows\/050826\/match-1$/);
    await expect(page.locator("[data-wrestling-match-gallery-shell][aria-hidden='false']")).toBeVisible();

    await page.goto("/wrestling/shows/050826/match-1/photo/001", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-lightbox-screen][aria-hidden='false']")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/wrestling\/shows\/050826\/match-1$/);
    await expect(page.locator("[data-wrestling-match-gallery-shell][aria-hidden='false']")).toBeVisible();

    await page.goto("/wrestling/people/ace-romero", { waitUntil: "domcontentloaded" });
    const personShell = page.locator("[data-wrestling-person-detail-shell][aria-hidden='false']");
    await expect(personShell).toBeVisible();
    await expect(personShell).toHaveAttribute("data-wrestling-relationship-schema", "placeholder-v1");
    await expect(personShell).toHaveAttribute("data-wrestling-person-id", "ace-romero");

    const openMatch = personShell.locator(".wrestling-event-history-open[data-wrestling-match-id='match-5']").first();
    await expect(openMatch).toBeEnabled();
    await expect(openMatch).toHaveAttribute("data-wrestling-show-id", "warzone-26");
    await expect(openMatch).toHaveAttribute("data-wrestling-match-id", "match-5");
    await expect(openMatch).toHaveAttribute("data-wrestling-match-route", "/wrestling/shows/050826/match-5");
    await expect(openMatch).toHaveAttribute("data-wrestling-venue-id", "wv-portland-expo");
    await expect(openMatch).toHaveAttribute("data-wrestling-tagged-people", /Ace Romero/);
    await openMatch.click();
    await expect(page).toHaveURL(/\/wrestling\/shows\/050826\/match-5$/);
    await expect(page.locator("[data-wrestling-match-gallery-shell][aria-hidden='false']")).toHaveAttribute("data-wrestling-match-id", "match-5");

    await page.goto("/wrestling/venues", { waitUntil: "domcontentloaded" });
    const venuesShell = page.locator("[data-wrestling-venues-shell][aria-hidden='false']");
    await expect(venuesShell).toBeVisible();
    const portlandCard = venuesShell.locator(".wrestling-venue-card[data-wrestling-venue-route='/wrestling/venues/portland_expo']");
    await expect(portlandCard).toHaveCount(1);
    await portlandCard.click();
    await expect(page).toHaveURL(/\/wrestling\/venues\/portland_expo$/);

    const venueShell = page.locator("[data-wrestling-venue-detail-shell][aria-hidden='false']");
    await expect(venueShell).toBeVisible();
    await expect(venueShell).toHaveAttribute("data-wrestling-relationship-schema", "placeholder-v1");
    await expect(venueShell).toHaveAttribute("data-wrestling-venue-id", "wv-portland-expo");

    const openEvent = venueShell.locator(".wrestling-venue-event-open").first();
    await expect(openEvent).toBeEnabled();
    await expect(openEvent).toHaveAttribute("data-wrestling-show-id", "warzone-26");
    await expect(openEvent).toHaveAttribute("data-wrestling-show-route", "/wrestling/shows/050826");
    await expect(openEvent).toHaveAttribute("data-wrestling-venue-id", "wv-portland-expo");
    await expect(openEvent).toHaveAttribute("data-wrestling-tagged-people", /Daron Richardson/);
    await openEvent.click();
    await expect(page).toHaveURL(/\/wrestling\/shows\/050826$/);
    await expect(page.locator("[data-wrestling-show-detail-shell][aria-hidden='false']")).toHaveAttribute("data-wrestling-show-id", "warzone-26");

    expect(pageErrors).toEqual([]);
  });
});
