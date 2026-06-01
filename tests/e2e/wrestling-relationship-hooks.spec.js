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

  test("people, venues, shows, matches, and lightbox expose future-safe relationship IDs", async ({ page }) => {
    const pageErrors = collectPageErrors(page);

    await page.goto("/wrestling/people/ace-romero", { waitUntil: "domcontentloaded" });
    const personShell = page.locator("[data-wrestling-person-detail-shell]");
    await expect(personShell).toBeVisible();
    await expect(personShell).toHaveAttribute("data-wrestling-relationship-schema", "placeholder-v1");
    await expect(personShell).toHaveAttribute("data-wrestling-person-id", "ace-romero");
    await expect(personShell).toHaveAttribute("data-wrestling-match-ids", /ace-romero-vs-anthony-gangone/);
    await expect(personShell).toHaveAttribute("data-wrestling-venue-ids", /auburn-hall/);

    const openMatch = personShell.locator(".wrestling-event-history-open").first();
    await expect(openMatch).toBeDisabled();
    await expect(openMatch).toHaveAttribute("data-wrestling-show-id", "gnomie-and-the-machine");
    await expect(openMatch).toHaveAttribute("data-wrestling-match-id", "ace-romero-vs-anthony-gangone");
    await expect(openMatch).toHaveAttribute("data-wrestling-venue-id", "auburn-hall");
    await expect(openMatch).toHaveAttribute("data-wrestling-tagged-people", /ace-romero/);
    await expect(openMatch).toHaveAttribute("data-wrestling-referees", /adam-christopher/);
    await expect(openMatch).toHaveAttribute("data-wrestling-contributors", /voodoo-media/);

    await page.goto("/wrestling/venues/portland-expo", { waitUntil: "domcontentloaded" });
    const venueShell = page.locator("[data-wrestling-venue-detail-shell]");
    await expect(venueShell).toBeVisible();
    await expect(venueShell).toHaveAttribute("data-wrestling-relationship-schema", "placeholder-v1");
    await expect(venueShell).toHaveAttribute("data-wrestling-venue-id", "portland-expo");
    await expect(venueShell).toHaveAttribute("data-wrestling-show-ids", /warzone-26/);

    const openEvent = venueShell.locator(".wrestling-venue-event-open").first();
    await expect(openEvent).toBeDisabled();
    await expect(openEvent).toHaveAttribute("data-wrestling-show-id", "warzone-26");
    await expect(openEvent).toHaveAttribute("data-wrestling-show-route", "/wrestling/shows/warzone-26");
    await expect(openEvent).toHaveAttribute("data-wrestling-venue-id", "portland-expo");
    await expect(openEvent).toHaveAttribute("data-wrestling-tagged-people", /daron-richardson/);

    await page.goto("/wrestling/shows/warzone-26", { waitUntil: "domcontentloaded" });
    const showShell = page.locator("[data-wrestling-show-detail-shell]");
    await expect(showShell).toBeVisible();
    await expect(showShell).toHaveAttribute("data-wrestling-relationship-schema", "placeholder-v1");
    await expect(showShell).toHaveAttribute("data-wrestling-show-id", "warzone-26");
    await expect(showShell).toHaveAttribute("data-wrestling-venue-id", "portland-expo");
    await expect(showShell).toHaveAttribute("data-wrestling-match-ids", /daron-richardson-vs-bear-bronson/);

    const firstMatch = showShell.locator(".wrestling-match-card").first();
    await expect(firstMatch).toHaveAttribute("data-wrestling-match-id", "daron-richardson-vs-bear-bronson");
    await expect(firstMatch).toHaveAttribute("data-wrestling-person-ids", /bear-bronson/);
    await expect(firstMatch).toHaveAttribute("data-wrestling-referees", /adam-christopher/);

    const openGallery = showShell.locator(".wrestling-gallery-button");
    await expect(openGallery).toHaveAttribute("data-wrestling-match-route", "/wrestling/shows/warzone-26/match/daron-richardson-vs-bear-bronson");
    await openGallery.click();
    await expect(page).toHaveURL(/\/wrestling\/shows\/warzone-26\/match\/daron-richardson-vs-bear-bronson$/);

    const matchGallery = page.locator("[data-wrestling-match-gallery-shell]");
    await expect(matchGallery).toBeVisible();
    await expect(matchGallery).toHaveAttribute("data-wrestling-show-id", "warzone-26");
    await expect(matchGallery).toHaveAttribute("data-wrestling-match-id", "daron-richardson-vs-bear-bronson");
    await expect(matchGallery).toHaveAttribute("data-wrestling-venue-id", "portland-expo");
    await expect(matchGallery).toHaveAttribute("data-wrestling-tagged-people", /daron-richardson/);

    const firstPhoto = matchGallery.locator(".wrestling-photo-tile").first();
    await expect(firstPhoto).toHaveAttribute("data-wrestling-lightbox-route", "/wrestling/shows/warzone-26/match/daron-richardson-vs-bear-bronson/photo/001");
    await firstPhoto.click();
    await expect(page).toHaveURL(/\/wrestling\/shows\/warzone-26\/match\/daron-richardson-vs-bear-bronson\/photo\/001$/);

    const lightbox = page.locator("[data-wrestling-lightbox-shell]");
    await expect(lightbox).toBeVisible();
    await expect(lightbox).toHaveAttribute("data-wrestling-show-id", "warzone-26");
    await expect(lightbox).toHaveAttribute("data-wrestling-match-id", "daron-richardson-vs-bear-bronson");
    await expect(lightbox).toHaveAttribute("data-wrestling-photo-id", "001");
    await expect(lightbox).toHaveAttribute("data-wrestling-contributors", /voodoo-media/);

    await page.locator("[data-wrestling-lightbox-next]").click();
    await expect(page).toHaveURL(/\/wrestling\/shows\/warzone-26\/match\/daron-richardson-vs-bear-bronson\/photo\/002$/);
    expect(pageErrors).toEqual([]);
  });
});
