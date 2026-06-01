/* =========================================================
   VMPix V3 wrestling module.
   Static placeholder wrestling archive surfaces only.
   ========================================================= */

function normalizeWrestlingPersonId(personId) {
  return String(personId || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getWrestlingPersonRouteUrl(personId) {
  const fallbackId = wrestlingPeopleRows[0]?.personId || "";
  const normalizedPersonId = normalizeWrestlingPersonId(personId) || fallbackId;
  return normalizedPersonId
    ? `${routePaths.wrestlingPeople}/${encodeURIComponent(normalizedPersonId)}`
    : routePaths.wrestlingPeople;
}

function findWrestlingPersonById(personId) {
  const normalizedPersonId = normalizeWrestlingPersonId(personId);
  return wrestlingPeopleRows.find((person) => person.personId === normalizedPersonId) || wrestlingPeopleRows[0];
}

function normalizeWrestlingVenueId(venueId) {
  return String(venueId || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getWrestlingVenueRouteUrl(venueId) {
  const fallbackId = wrestlingVenueRows[0]?.venueId || "";
  const normalizedVenueId = normalizeWrestlingVenueId(venueId) || fallbackId;
  return normalizedVenueId
    ? `${routePaths.wrestlingVenues}/${encodeURIComponent(normalizedVenueId)}`
    : routePaths.wrestlingVenues;
}

function findWrestlingVenueById(venueId) {
  const normalizedVenueId = normalizeWrestlingVenueId(venueId);
  return wrestlingVenueRows.find((venue) => venue.venueId === normalizedVenueId) || wrestlingVenueRows[0];
}

function getWrestlingRelationshipIds(items, key = "") {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      return item?.[key] || item?.personId || item?.showId || item?.matchId || item?.venueId || item?.id || "";
    })
    .filter(Boolean);
}

function setWrestlingDatasetList(element, datasetKey, values, key = "") {
  if (!element) {
    return;
  }

  const ids = getWrestlingRelationshipIds(values, key);
  if (ids.length > 0) {
    element.dataset[datasetKey] = ids.join(" ");
  } else {
    delete element.dataset[datasetKey];
  }
}

function setWrestlingRelationshipDataset(element, relationship = {}) {
  if (!element || !relationship) {
    return;
  }

  element.dataset.wrestlingRelationshipSchema = "placeholder-v1";
  if (relationship.showId || relationship.eventId) {
    element.dataset.wrestlingShowId = relationship.showId || relationship.eventId;
  }
  if (relationship.eventId) {
    element.dataset.wrestlingEventId = relationship.eventId;
  }
  if (relationship.matchId) {
    element.dataset.wrestlingMatchId = relationship.matchId;
  }
  if (relationship.personId) {
    element.dataset.wrestlingPersonId = relationship.personId;
  }
  if (relationship.venueId) {
    element.dataset.wrestlingVenueId = relationship.venueId;
  }

  setWrestlingDatasetList(element, "wrestlingShowIds", relationship.showIds, "showId");
  setWrestlingDatasetList(element, "wrestlingMatchIds", relationship.matchIds, "matchId");
  setWrestlingDatasetList(element, "wrestlingPersonIds", relationship.personIds, "personId");
  setWrestlingDatasetList(element, "wrestlingVenueIds", relationship.venueIds, "venueId");
  setWrestlingDatasetList(element, "wrestlingTaggedPeople", relationship.taggedPeople, "personId");
  setWrestlingDatasetList(element, "wrestlingReferees", relationship.refereeIds, "personId");
  setWrestlingDatasetList(element, "wrestlingManagers", relationship.managerIds, "personId");
  setWrestlingDatasetList(element, "wrestlingCommentators", relationship.commentatorIds, "personId");
  setWrestlingDatasetList(element, "wrestlingContributors", relationship.contributorIds, "personId");
  setWrestlingDatasetList(element, "wrestlingTeams", relationship.teamIds, "teamId");
  setWrestlingDatasetList(element, "wrestlingFactions", relationship.factionIds, "factionId");
  setWrestlingDatasetList(element, "wrestlingPhotoIds", relationship.photoIds, "photoId");

  const taggedPeople = Array.isArray(relationship.taggedPeople) ? relationship.taggedPeople : [];
  if (taggedPeople.length > 0) {
    element.dataset.wrestlingTaggedPeopleCount = String(taggedPeople.length);
  } else {
    delete element.dataset.wrestlingTaggedPeopleCount;
  }
}

function findWrestlingShowRelationshipById(showId) {
  return wrestlingShowRelationshipRows.find((show) => show.showId === String(showId || "").trim()) || null;
}

function findWrestlingMatchRelationshipById(matchId, showId = "") {
  const normalizedMatchId = String(matchId || "").trim();
  const normalizedShowId = String(showId || "").trim();
  return wrestlingMatchRelationshipRows.find((match) => (
    match.matchId === normalizedMatchId &&
    (!normalizedShowId || match.showId === normalizedShowId)
  )) || null;
}

function formatWrestlingCount(count, label) {
  return `${Number(count).toLocaleString()} ${label}`;
}

function getWrestlingPeopleCardLabel(person) {
  return [
    `Open ${person.name}`,
    person.role,
    person.factionTeam,
    formatWrestlingCount(person.matches, "Matches"),
    formatWrestlingCount(person.photos, "Photos"),
  ].filter(Boolean).join(", ");
}

function getWrestlingMatchRouteUrlByIds(showId, matchId) {
  return `${routePaths.wrestlingShows}/${encodeURIComponent(String(showId || "").trim())}/match/${encodeURIComponent(String(matchId || "").trim())}`;
}

function getWrestlingMatchRouteUrl(eventRow) {
  return getWrestlingMatchRouteUrlByIds(eventRow.showId || eventRow.eventId, eventRow.matchId);
}

function getWrestlingShowRouteUrl(showId) {
  return `${routePaths.wrestlingShows}/${encodeURIComponent(String(showId || "").trim())}`;
}

function getWrestlingLightboxRouteUrl(showId, matchId, photoId) {
  return `${getWrestlingMatchRouteUrlByIds(showId, matchId)}/photo/${encodeURIComponent(String(photoId || "").trim())}`;
}

function setActiveWrestlingPeopleCard(personId = activeWrestlingPersonId) {
  if (!wrestlingPeopleList) {
    return;
  }

  const normalizedPersonId = normalizeWrestlingPersonId(personId);
  wrestlingPeopleList.querySelectorAll("[data-wrestling-person-id]").forEach((card) => {
    const isActive = card.dataset.wrestlingPersonId === normalizedPersonId;
    card.classList.toggle("is-active", isActive);
    card.setAttribute("aria-pressed", String(isActive));
  });
}

function setActiveWrestlingVenueCard(venueId = activeWrestlingVenueId) {
  if (!wrestlingVenuesList) {
    return;
  }

  const normalizedVenueId = normalizeWrestlingVenueId(venueId);
  wrestlingVenuesList.querySelectorAll("[data-wrestling-venue-id]").forEach((card) => {
    const isActive = card.dataset.wrestlingVenueId === normalizedVenueId;
    card.classList.toggle("is-active", isActive);
    card.setAttribute("aria-pressed", String(isActive));
  });
}

function createWrestlingPeopleStat(label, value) {
  const stat = document.createElement("span");
  stat.className = "wrestling-person-card-stat";

  const statValue = document.createElement("strong");
  statValue.textContent = Number(value).toLocaleString();

  const statLabel = document.createElement("span");
  statLabel.textContent = label;

  stat.append(statValue, statLabel);
  return stat;
}

function createWrestlingPeopleCard(person) {
  const card = document.createElement("button");
  card.className = "wrestling-person-card";
  card.type = "button";
  card.dataset.wrestlingPersonId = person.personId;
  card.dataset.wrestlingPersonRoute = getWrestlingPersonRouteUrl(person.personId);
  setWrestlingRelationshipDataset(card, person);
  card.setAttribute("aria-pressed", "false");
  card.setAttribute("aria-label", getWrestlingPeopleCardLabel(person));

  const thumb = document.createElement("span");
  thumb.className = "wrestling-person-card-thumb";
  thumb.setAttribute("aria-hidden", "true");
  thumb.textContent = person.thumb || person.name.slice(0, 2).toUpperCase();

  const body = document.createElement("span");
  body.className = "wrestling-person-card-body";

  const name = document.createElement("span");
  name.className = "wrestling-person-card-name";
  name.textContent = person.name;

  const meta = document.createElement("span");
  meta.className = "wrestling-person-card-meta";
  meta.textContent = person.role;

  const faction = document.createElement("span");
  faction.className = "wrestling-person-card-team";
  faction.textContent = person.factionTeam;

  const stats = document.createElement("span");
  stats.className = "wrestling-person-card-stats";
  stats.setAttribute("aria-hidden", "true");
  stats.append(
    createWrestlingPeopleStat("Matches", person.matches),
    createWrestlingPeopleStat("Photos", person.photos)
  );

  body.append(name, meta);
  if (person.factionTeam) {
    body.append(faction);
  }
  body.append(stats);

  const arrow = document.createElement("span");
  arrow.className = "wrestling-person-card-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = ">";

  card.append(thumb, body, arrow);
  card.addEventListener("click", () => {
    activeWrestlingPersonId = person.personId;
    setActiveWrestlingPeopleCard(person.personId);
    navigateToRoute(getWrestlingPersonRouteUrl(person.personId), {
      historyState: { fromWrestlingPeopleIndex: true },
    });
  });

  return card;
}

function renderWrestlingPeopleIndex() {
  if (!wrestlingPeopleList) {
    return;
  }

  wrestlingPeopleList.replaceChildren();
  wrestlingPeopleRows.forEach((person) => {
    wrestlingPeopleList.append(createWrestlingPeopleCard(person));
  });
  setActiveWrestlingPeopleCard();
}

function getWrestlingVenueCardLabel(venue) {
  return [
    `${venue.name} venue detail placeholder`,
    `${venue.city}, ${venue.state}`,
    formatWrestlingCount(venue.eventCount, "Events"),
    formatWrestlingCount(venue.photoCount, "Photos"),
  ].filter(Boolean).join(", ");
}

function createWrestlingVenueStat(label, value) {
  const stat = document.createElement("span");
  stat.className = "wrestling-venue-card-stat";

  const statValue = document.createElement("strong");
  statValue.textContent = Number(value).toLocaleString();

  const statLabel = document.createElement("span");
  statLabel.textContent = label;

  stat.append(statValue, statLabel);
  return stat;
}

function createWrestlingVenueCard(venue) {
  const card = document.createElement("button");
  card.className = "wrestling-venue-card";
  card.type = "button";
  card.setAttribute("aria-pressed", "false");
  card.setAttribute("aria-label", `Open ${getWrestlingVenueCardLabel(venue)}`);
  card.dataset.wrestlingVenueId = venue.venueId;
  card.dataset.wrestlingVenueRoute = getWrestlingVenueRouteUrl(venue.venueId);
  setWrestlingRelationshipDataset(card, venue);

  const media = document.createElement("div");
  media.className = "wrestling-venue-card-media";
  media.setAttribute("role", "img");
  media.setAttribute("aria-label", `${venue.name} venue image placeholder`);

  const mediaLabel = document.createElement("span");
  mediaLabel.setAttribute("aria-hidden", "true");
  mediaLabel.textContent = venue.imageLabel || venue.name.slice(0, 2).toUpperCase();
  media.append(mediaLabel);

  const body = document.createElement("div");
  body.className = "wrestling-venue-card-body";

  const name = document.createElement("h3");
  name.className = "wrestling-venue-card-name";
  name.textContent = venue.name;

  const location = document.createElement("p");
  location.className = "wrestling-venue-card-location";
  location.textContent = `${venue.city}, ${venue.state}`;

  const stats = document.createElement("div");
  stats.className = "wrestling-venue-card-stats";
  stats.append(
    createWrestlingVenueStat("Events", venue.eventCount),
    createWrestlingVenueStat("Photos", venue.photoCount)
  );

  const action = document.createElement("span");
  action.className = "wrestling-venue-card-action";
  action.setAttribute("aria-hidden", "true");
  action.textContent = "Detail >";

  body.append(name, location, stats, action);
  card.append(media, body);
  card.addEventListener("click", () => {
    activeWrestlingVenueId = venue.venueId;
    setActiveWrestlingVenueCard(venue.venueId);
    navigateToRoute(getWrestlingVenueRouteUrl(venue.venueId), {
      historyState: { fromWrestlingVenuesIndex: true },
    });
  });

  return card;
}

function renderWrestlingVenuesIndex() {
  if (!wrestlingVenuesList) {
    return;
  }

  wrestlingVenuesList.replaceChildren();
  wrestlingVenueRows.forEach((venue) => {
    wrestlingVenuesList.append(createWrestlingVenueCard(venue));
  });
  setActiveWrestlingVenueCard();
}

function createWrestlingVenueMeta(label, value) {
  const fact = document.createElement("div");
  fact.className = "wrestling-venue-fact";

  const factLabel = document.createElement("dt");
  factLabel.textContent = label;

  const factValue = document.createElement("dd");
  factValue.textContent = value;

  fact.append(factLabel, factValue);
  return fact;
}

function createWrestlingVenueEventRow(eventRow) {
  const row = document.createElement("article");
  row.className = "wrestling-venue-event-row";
  row.setAttribute("role", "listitem");
  row.dataset.wrestlingShowId = eventRow.showId;
  row.dataset.wrestlingShowRoute = getWrestlingShowRouteUrl(eventRow.showId);
  setWrestlingRelationshipDataset(row, eventRow);

  const eventBlock = document.createElement("div");
  eventBlock.className = "wrestling-venue-event-name";

  const eventName = document.createElement("h4");
  eventName.textContent = eventRow.eventName;

  const promotion = document.createElement("p");
  promotion.textContent = eventRow.promotion;

  eventBlock.append(eventName, promotion);

  const date = document.createElement("p");
  date.className = "wrestling-venue-event-date";
  date.textContent = eventRow.eventDate;

  const photos = document.createElement("p");
  photos.className = "wrestling-venue-event-photos";
  photos.textContent = formatWrestlingCount(eventRow.photoCount, "Photos");

  const openButton = document.createElement("button");
  openButton.className = "wrestling-venue-event-open";
  openButton.type = "button";
  openButton.disabled = true;
  openButton.setAttribute("aria-disabled", "true");
  openButton.setAttribute("aria-label", `Open event ${eventRow.eventName}`);
  openButton.title = `Future route: ${getWrestlingShowRouteUrl(eventRow.showId)}`;
  openButton.dataset.wrestlingShowId = eventRow.showId;
  openButton.dataset.wrestlingShowRoute = getWrestlingShowRouteUrl(eventRow.showId);
  setWrestlingRelationshipDataset(openButton, eventRow);
  openButton.textContent = "Open Event";

  row.append(eventBlock, date, photos, openButton);
  return row;
}

function returnToWrestlingVenuesRoute() {
  const currentRoute = getRouteFromUrl();
  if (
    currentRoute.name === "wrestling-venue-detail" &&
    window.history?.state?.fromWrestlingVenuesIndex &&
    window.history.length > 1
  ) {
    window.history.back();
    return;
  }

  navigateToRoute(routePaths.wrestlingVenues);
}

function renderWrestlingVenueDetailRoute(venueId) {
  if (!wrestlingVenueDetailShell) {
    return;
  }

  const venue = findWrestlingVenueById(venueId);
  activeWrestlingVenueId = venue.venueId;
  setActiveWrestlingVenueCard(venue.venueId);
  setWrestlingRelationshipDataset(wrestlingVenueDetailShell, venue);

  const backButton = document.createElement("button");
  backButton.className = "wrestling-venue-detail-back";
  backButton.type = "button";
  backButton.textContent = "Back to Wrestling Venues";
  backButton.addEventListener("click", returnToWrestlingVenuesRoute);

  const hero = document.createElement("section");
  hero.className = "wrestling-venue-detail-hero";
  hero.setAttribute("aria-label", `${venue.name} placeholder venue dossier`);

  const image = document.createElement("div");
  image.className = "wrestling-venue-detail-image";
  image.setAttribute("role", "img");
  image.setAttribute("aria-label", `${venue.name} venue image placeholder`);

  const imageLabel = document.createElement("span");
  imageLabel.setAttribute("aria-hidden", "true");
  imageLabel.textContent = venue.imageLabel;
  image.append(imageLabel);

  const summary = document.createElement("div");
  summary.className = "wrestling-venue-detail-summary";

  const name = document.createElement("h2");
  name.className = "wrestling-venue-detail-title";
  name.id = "wrestling-venue-detail-title";
  name.textContent = venue.name;

  const location = document.createElement("p");
  location.className = "wrestling-venue-detail-location";
  location.textContent = `${venue.city}, ${venue.state}`;

  const facts = document.createElement("dl");
  facts.className = "wrestling-venue-facts";
  facts.append(
    createWrestlingVenueMeta("Events", Number(venue.eventCount).toLocaleString()),
    createWrestlingVenueMeta("Total Photos", Number(venue.photoCount).toLocaleString()),
    createWrestlingVenueMeta("Region", venue.region),
    createWrestlingVenueMeta("Archive State", venue.archiveState)
  );

  summary.append(name, location, facts);
  hero.append(image, summary);

  const eventHistory = document.createElement("section");
  eventHistory.className = "wrestling-venue-event-history";
  eventHistory.setAttribute("aria-labelledby", "wrestling-venue-event-history-title");

  const eventTitle = document.createElement("h3");
  eventTitle.className = "wrestling-venue-event-history-title";
  eventTitle.id = "wrestling-venue-event-history-title";
  eventTitle.textContent = "EVENT HISTORY";

  const eventList = document.createElement("div");
  eventList.className = "wrestling-venue-event-list";
  eventList.setAttribute("role", "list");
  wrestlingVenueEventHistoryRows.forEach((eventRow) => {
    eventList.append(createWrestlingVenueEventRow(eventRow));
  });

  eventHistory.append(eventTitle, eventList);
  wrestlingVenueDetailShell.replaceChildren(backButton, hero, eventHistory);
}

function createWrestlingPersonMeta(label, value) {
  const fact = document.createElement("div");
  fact.className = "wrestling-person-fact";

  const factLabel = document.createElement("dt");
  factLabel.textContent = label;

  const factValue = document.createElement("dd");
  factValue.textContent = value;

  fact.append(factLabel, factValue);
  return fact;
}

function createWrestlingPersonEventRow(eventRow) {
  const row = document.createElement("article");
  row.className = "wrestling-event-history-row";
  row.setAttribute("role", "listitem");
  row.dataset.wrestlingEventId = eventRow.eventId;
  row.dataset.wrestlingShowId = eventRow.showId || eventRow.eventId;
  row.dataset.wrestlingMatchId = eventRow.matchId;
  row.dataset.wrestlingMatchRoute = getWrestlingMatchRouteUrl(eventRow);
  setWrestlingRelationshipDataset(row, eventRow);

  const eventBlock = document.createElement("div");
  eventBlock.className = "wrestling-event-history-event";

  const eventName = document.createElement("h4");
  eventName.textContent = eventRow.eventName;

  const eventDate = document.createElement("p");
  eventDate.textContent = eventRow.eventDate;

  eventBlock.append(eventName, eventDate);

  const matchBlock = document.createElement("div");
  matchBlock.className = "wrestling-event-history-match";

  const matchName = document.createElement("p");
  matchName.className = "wrestling-event-history-match-name";
  matchName.textContent = eventRow.matchName;

  const matchType = document.createElement("p");
  matchType.className = "wrestling-event-history-match-type";
  matchType.textContent = eventRow.matchType;

  matchBlock.append(matchName, matchType);

  const photoCount = document.createElement("p");
  photoCount.className = "wrestling-event-history-photos";
  photoCount.textContent = formatWrestlingCount(eventRow.photoCount, "Photos");

  const openButton = document.createElement("button");
  openButton.className = "wrestling-event-history-open";
  openButton.type = "button";
  openButton.disabled = true;
  openButton.setAttribute("aria-disabled", "true");
  openButton.setAttribute("aria-label", `Open match ${eventRow.matchName}`);
  openButton.title = `Future route: ${getWrestlingMatchRouteUrl(eventRow)}`;
  openButton.dataset.wrestlingEventId = eventRow.eventId;
  openButton.dataset.wrestlingShowId = eventRow.showId || eventRow.eventId;
  openButton.dataset.wrestlingMatchId = eventRow.matchId;
  openButton.dataset.wrestlingMatchRoute = getWrestlingMatchRouteUrl(eventRow);
  setWrestlingRelationshipDataset(openButton, eventRow);
  openButton.textContent = "Open Match";

  row.append(eventBlock, matchBlock, photoCount, openButton);
  return row;
}

function returnToWrestlingPeopleRoute() {
  const currentRoute = getRouteFromUrl();
  if (
    currentRoute.name === "wrestling-person-detail" &&
    window.history?.state?.fromWrestlingPeopleIndex &&
    window.history.length > 1
  ) {
    window.history.back();
    return;
  }

  navigateToRoute(routePaths.wrestlingPeople);
}

function renderWrestlingPersonDetailRoute(personId) {
  if (!wrestlingPersonDetailShell) {
    return;
  }

  const person = findWrestlingPersonById(personId);
  activeWrestlingPersonId = person.personId;
  setActiveWrestlingPeopleCard(person.personId);
  setWrestlingRelationshipDataset(wrestlingPersonDetailShell, person);

  const backButton = document.createElement("button");
  backButton.className = "wrestling-person-detail-back";
  backButton.type = "button";
  backButton.textContent = "Back to Wrestling People";
  backButton.addEventListener("click", returnToWrestlingPeopleRoute);

  const hero = document.createElement("section");
  hero.className = "wrestling-person-detail-hero";
  hero.setAttribute("aria-label", `${person.name} placeholder profile`);

  const photo = document.createElement("div");
  photo.className = "wrestling-person-detail-photo";
  photo.setAttribute("role", "img");
  photo.setAttribute("aria-label", `${person.name} placeholder archive portrait`);

  const photoInitials = document.createElement("span");
  photoInitials.setAttribute("aria-hidden", "true");
  photoInitials.textContent = person.thumb;
  photo.append(photoInitials);

  const summary = document.createElement("div");
  summary.className = "wrestling-person-detail-summary";

  const name = document.createElement("h2");
  name.className = "wrestling-person-detail-title";
  name.id = "wrestling-person-detail-title";
  name.textContent = person.name;

  const facts = document.createElement("dl");
  facts.className = "wrestling-person-facts";
  facts.append(
    createWrestlingPersonMeta("Aliases", person.aliases.join(" / ")),
    createWrestlingPersonMeta("Role", person.role),
    createWrestlingPersonMeta("Faction / Team", person.factionTeam),
    createWrestlingPersonMeta("Debut Year", person.debutYear),
    createWrestlingPersonMeta("Total Matches", Number(person.matches).toLocaleString()),
    createWrestlingPersonMeta("Total Photos", Number(person.photos).toLocaleString())
  );

  summary.append(name, facts);
  hero.append(photo, summary);

  const eventHistory = document.createElement("section");
  eventHistory.className = "wrestling-event-history";
  eventHistory.setAttribute("aria-labelledby", "wrestling-event-history-title");

  const eventTitle = document.createElement("h3");
  eventTitle.className = "wrestling-event-history-title";
  eventTitle.id = "wrestling-event-history-title";
  eventTitle.textContent = "EVENT HISTORY";

  const eventList = document.createElement("div");
  eventList.className = "wrestling-event-history-list";
  eventList.setAttribute("role", "list");
  wrestlingPersonEventHistoryRows.forEach((eventRow) => {
    eventList.append(createWrestlingPersonEventRow(eventRow));
  });

  eventHistory.append(eventTitle, eventList);
  wrestlingPersonDetailShell.replaceChildren(backButton, hero, eventHistory);
}

function getWrestlingDefaultShowRelationship(showId = "warzone-26") {
  return findWrestlingShowRelationshipById(showId) || wrestlingShowRelationshipRows[0];
}

function getWrestlingDefaultMatchRelationship(matchId = "daron-richardson-vs-bear-bronson", showId = "warzone-26") {
  return findWrestlingMatchRelationshipById(matchId, showId) ||
    findWrestlingMatchRelationshipById(getWrestlingDefaultShowRelationship(showId)?.galleryMatchId, showId) ||
    wrestlingMatchRelationshipRows[0];
}

function updateWrestlingShowDetailRelationshipHooks(showId = "warzone-26") {
  if (!wrestlingShowDetailShell) {
    return;
  }

  const showRelationship = getWrestlingDefaultShowRelationship(showId);
  const activeShowId = showId || showRelationship.showId;
  setWrestlingRelationshipDataset(wrestlingShowDetailShell, { ...showRelationship, showId: activeShowId });
  wrestlingShowDetailShell.dataset.wrestlingShowRoute = getWrestlingShowRouteUrl(activeShowId);

  wrestlingShowDetailShell.querySelectorAll(".wrestling-match-card").forEach((card, index) => {
    const matchRelationship = wrestlingMatchRelationshipRows[index];
    if (!matchRelationship) {
      return;
    }

    setWrestlingRelationshipDataset(card, matchRelationship);
    card.dataset.wrestlingMatchRoute = getWrestlingMatchRouteUrlByIds(matchRelationship.showId, matchRelationship.matchId);
  });

  const galleryButton = wrestlingShowDetailShell.querySelector(".wrestling-gallery-button");
  const galleryMatchId = showRelationship.galleryMatchId || showRelationship.matchIds?.[0] || wrestlingMatchRelationshipRows[0]?.matchId || "";
  const galleryMatch = getWrestlingDefaultMatchRelationship(galleryMatchId, showRelationship.showId);
  if (galleryButton && galleryMatch) {
    setWrestlingRelationshipDataset(galleryButton, galleryMatch);
    galleryButton.dataset.wrestlingMatchRoute = getWrestlingMatchRouteUrlByIds(galleryMatch.showId, galleryMatch.matchId);
    if (!galleryButton.dataset.wrestlingRouteBound) {
      galleryButton.dataset.wrestlingRouteBound = "true";
      galleryButton.addEventListener("click", () => {
        if (galleryButton.dataset.wrestlingMatchRoute) {
          navigateToRoute(galleryButton.dataset.wrestlingMatchRoute);
        }
      });
    }
  }
}

function updateWrestlingMatchGalleryRelationshipHooks(showId = "warzone-26", matchId = "daron-richardson-vs-bear-bronson") {
  if (!wrestlingMatchGalleryShell) {
    return;
  }

  const matchRelationship = getWrestlingDefaultMatchRelationship(matchId, showId);
  const activeShowId = showId || matchRelationship.showId;
  const activeMatchId = matchId || matchRelationship.matchId;
  setWrestlingRelationshipDataset(wrestlingMatchGalleryShell, { ...matchRelationship, showId: activeShowId, matchId: activeMatchId });
  wrestlingMatchGalleryShell.dataset.wrestlingMatchRoute = getWrestlingMatchRouteUrlByIds(activeShowId, activeMatchId);

  wrestlingPhotoTiles.forEach((tile) => {
    const photoId = tile.dataset.wrestlingPhotoId;
    const photoRelationship = {
      ...matchRelationship,
      showId: activeShowId,
      matchId: activeMatchId,
      photoIds: photoId ? [photoId] : matchRelationship.photoIds,
    };
    setWrestlingRelationshipDataset(tile, photoRelationship);
    if (photoId) {
      tile.dataset.wrestlingLightboxRoute = getWrestlingLightboxRouteUrl(activeShowId, activeMatchId, photoId);
    }
  });
}

function updateWrestlingLightboxRelationshipHooks(showId = "warzone-26", matchId = "daron-richardson-vs-bear-bronson", photoId = "001") {
  if (!wrestlingLightboxShell) {
    return;
  }

  const matchRelationship = getWrestlingDefaultMatchRelationship(matchId, showId);
  const activeShowId = showId || matchRelationship.showId;
  const activeMatchId = matchId || matchRelationship.matchId;
  const activePhotoId = photoId || "001";
  setWrestlingRelationshipDataset(wrestlingLightboxShell, {
    ...matchRelationship,
    showId: activeShowId,
    matchId: activeMatchId,
    photoIds: [activePhotoId],
  });
  wrestlingLightboxShell.dataset.wrestlingPhotoId = activePhotoId;
  wrestlingLightboxShell.dataset.wrestlingLightboxRoute = getWrestlingLightboxRouteUrl(activeShowId, activeMatchId, activePhotoId);
}

function applyStaticWrestlingRelationshipHooks() {
  wrestlingShowEntries.forEach((entry) => {
    const showId = entry.dataset.wrestlingShowId;
    const showRelationship = getWrestlingDefaultShowRelationship(showId);
    if (!showRelationship) {
      return;
    }

    setWrestlingRelationshipDataset(entry, showRelationship);
    entry.dataset.wrestlingShowRoute = getWrestlingShowRouteUrl(showRelationship.showId);
  });

  updateWrestlingShowDetailRelationshipHooks(wrestlingShowDetailShell?.dataset.wrestlingShowId || "warzone-26");
  updateWrestlingMatchGalleryRelationshipHooks(
    wrestlingMatchGalleryShell?.dataset.wrestlingShowId || "warzone-26",
    wrestlingMatchGalleryShell?.dataset.wrestlingMatchId || "daron-richardson-vs-bear-bronson"
  );
  updateWrestlingLightboxRelationshipHooks(
    wrestlingLightboxShell?.dataset.wrestlingShowId || "warzone-26",
    wrestlingLightboxShell?.dataset.wrestlingMatchId || "daron-richardson-vs-bear-bronson",
    wrestlingLightboxShell?.dataset.wrestlingPhotoId || wrestlingLightboxShell?.dataset.photoNumber || "001"
  );
}

function initWrestlingPeopleModule() {
  renderWrestlingPeopleIndex();
  renderWrestlingVenuesIndex();
  applyStaticWrestlingRelationshipHooks();
}
