/* =========================================================
   VMPix V3 wrestling module.
   Static placeholder people archive surfaces only.
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

function formatWrestlingCount(count, label) {
  return `${Number(count).toLocaleString()} ${label}`;
}

function getWrestlingPeopleCardLabel(person) {
  return [
    person.name,
    person.role,
    person.factionTeam,
    formatWrestlingCount(person.matches, "Matches"),
    formatWrestlingCount(person.photos, "Photos"),
    "Open profile",
  ].filter(Boolean).join(", ");
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
  row.dataset.wrestlingMatchId = eventRow.matchId;

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
  openButton.dataset.wrestlingEventId = eventRow.eventId;
  openButton.dataset.wrestlingMatchId = eventRow.matchId;
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

  const backButton = document.createElement("button");
  backButton.className = "wrestling-person-detail-back";
  backButton.type = "button";
  backButton.textContent = "Back to People";
  backButton.addEventListener("click", returnToWrestlingPeopleRoute);

  const hero = document.createElement("section");
  hero.className = "wrestling-person-detail-hero";
  hero.setAttribute("aria-label", `${person.name} placeholder profile`);

  const photo = document.createElement("div");
  photo.className = "wrestling-person-detail-photo";
  photo.setAttribute("aria-hidden", "true");

  const photoInitials = document.createElement("span");
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

function initWrestlingPeopleModule() {
  renderWrestlingPeopleIndex();
}
