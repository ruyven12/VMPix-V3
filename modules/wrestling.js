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
  return getMockRecordById("wrestlingPeople", normalizedPersonId, ["personId", "id", "slug"]) || wrestlingPeopleRows[0];
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
  return getMockRecordById("wrestlingVenues", normalizedVenueId, ["venueId", "id", "slug", "venue_id"]) || wrestlingVenueRows[0];
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
  return findLiveWrestlingShowById(showId) ||
    getMockRecordById("wrestlingShows", showId, ["showId", "eventId", "id", "slug", "show_id", "show_key"]) ||
    null;
}

function findWrestlingMatchRelationshipById(matchId, showId = "") {
  const liveMatch = findLiveWrestlingMatchById(matchId, showId);
  if (liveMatch) {
    return liveMatch;
  }

  const normalizedMatchId = String(matchId || "").trim();
  const normalizedShowId = String(showId || "").trim();
  return filterMockCollection("wrestlingMatches", (match) => (
    match.matchId === normalizedMatchId &&
    (!normalizedShowId || match.showId === normalizedShowId)
  ))[0] || null;
}

function formatWrestlingCount(count, label) {
  return `${Number(count).toLocaleString()} ${label}`;
}

const WRESTLING_SHOWS_API_BASE_URL = "https://vmpix-data.onrender.com";
const WRESTLING_SHOWS_API_ROUTE = "/api/wrestling/shows/db";
const WRESTLING_SHOWS_API_LIMIT = 100;
const WRESTLING_SHOWS_TIMEOUT_MS = 15000;
const wrestlingShowList = document.querySelector("[data-wrestling-show-list]") || document.querySelector(".wrestling-show-list");
const wrestlingShowYearChips = document.querySelectorAll(".wrestling-year-chip");
const wrestlingShowSortSelect = document.querySelector("#wrestling-shows-sort");
const wrestlingShowPagination = document.querySelector("[data-wrestling-pagination]") || document.querySelector(".wrestling-pagination");
let wrestlingShowsCollection = [];
let wrestlingShowsRequest = null;
let wrestlingShowsDataState = "idle";
let wrestlingShowsDataRequested = false;
let activeWrestlingShowsYearFilter = "Upcoming";
let activeWrestlingShowsSort = "newest";

const wrestlingShowsStateCopy = {
  loading: {
    title: "Loading Event Archive",
    copy: "Wrestling show rows are being prepared.",
  },
  empty: {
    title: "No Events Found",
    copy: "Try a different year or return to Upcoming.",
  },
  error: {
    title: "Event Archive Offline",
    copy: "Live wrestling show data could not be loaded.",
  },
};

function getWrestlingText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeWrestlingArchiveSlug(value, fallback = "wrestling-show") {
  const slug = String(value || "")
    .trim()
    .replace(/['\u2019]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function getWrestlingArray(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== undefined && item !== null && String(item).trim() !== "");
  }
  if (value === undefined || value === null || String(value).trim() === "") {
    return [];
  }
  return [String(value).trim()];
}

function getWrestlingNameIds(values) {
  return getWrestlingArray(values).map((value) => normalizeWrestlingPersonId(value)).filter(Boolean);
}

function parseWrestlingShowDate(value) {
  const rawValue = String(value || "").trim();
  if (!rawValue) {
    return null;
  }

  const shortMatch = rawValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (shortMatch) {
    const month = Number.parseInt(shortMatch[1], 10);
    const day = Number.parseInt(shortMatch[2], 10);
    let year = Number.parseInt(shortMatch[3], 10);
    if (year < 100) {
      year += 2000;
    }
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const normalizedValue = rawValue.replace(/(\d+)(st|nd|rd|th)/gi, "$1");
  const parsed = new Date(normalizedValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getWrestlingOrdinal(value) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) {
    return "";
  }
  const remainder = number % 100;
  if (remainder >= 11 && remainder <= 13) {
    return `${number}th`;
  }
  const suffix = number % 10 === 1 ? "st" : number % 10 === 2 ? "nd" : number % 10 === 3 ? "rd" : "th";
  return `${number}${suffix}`;
}

function formatWrestlingShowDate(value) {
  const parsed = parseWrestlingShowDate(value);
  if (!parsed) {
    return getWrestlingText(value, "Date Pending");
  }
  return `${parsed.toLocaleString("en-US", { month: "long" })} ${getWrestlingOrdinal(parsed.getDate())}, ${parsed.getFullYear()}`;
}

function getWrestlingStartOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

function getWrestlingShowTimestamp(show) {
  const dateSort = Number(show?.dateSort);
  if (Number.isFinite(dateSort) && dateSort > 0) {
    return dateSort;
  }
  const parsed = parseWrestlingShowDate(show?.rawDate || show?.date || show?.eventDate);
  return parsed ? parsed.getTime() : 0;
}

function getWrestlingShowPosterLabel(show) {
  const title = getWrestlingText(show?.title || show?.showName, "Event");
  const parts = title.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return parts.slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();
}

function getWrestlingVenueName(source) {
  return getWrestlingText(
    source?.venue ||
    source?.venue_name ||
    source?.venueName ||
    source?.venue_details?.venue_name ||
    source?.venue_details?.name,
    "Venue Pending"
  );
}

function getWrestlingShowLocation(source) {
  const city = getWrestlingText(source?.city || source?.venue_details?.city);
  const state = getWrestlingText(source?.state || source?.venue_details?.state);
  return [city, state].filter(Boolean).join(", ") || "Location Pending";
}

function getWrestlingShowsPayloadRows(payload) {
  const candidates = [
    payload?.data,
    payload?.rows,
    payload?.shows,
    payload?.source?.data,
    payload?.source?.rows,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter((row) => row && typeof row === "object");
    }
    if (candidate && typeof candidate === "object") {
      const nestedRows = Object.values(candidate).flatMap((value) => (Array.isArray(value) ? value : []));
      if (nestedRows.length > 0) {
        return nestedRows.filter((row) => row && typeof row === "object");
      }
    }
  }

  return [];
}

function normalizeWrestlingMatchRow(record = {}, show = {}, index = 0) {
  const order = Number.parseInt(record.match_order ?? record.order ?? index + 1, 10) || index + 1;
  const sideOne = getWrestlingArray(record.side_1 || record.side1);
  const sideTwo = getWrestlingArray(record.side_2 || record.side2);
  const sideTitle = [sideOne.join(", "), sideTwo.join(", ")].filter(Boolean).join(" vs ");
  const title = getWrestlingText(record.title || sideTitle || record.notes, `Match ${order}`);
  const matchType = getWrestlingText(record.stipulation || record.notes || record.match_type || record.matchType, "Match");
  const matchId = normalizeWrestlingArchiveSlug(record.match_url || record.matchUrl || title || `match-${order}`, `match-${order}`);
  const participants = getWrestlingArray(record.participants).length > 0
    ? getWrestlingArray(record.participants)
    : [...sideOne, ...sideTwo];
  const taggedPeople = getWrestlingArray(record.tagged_people || record.taggedPeople);
  const referees = getWrestlingArray(record.referees);

  return {
    ...record,
    showId: show.showId,
    eventId: show.showId,
    matchId,
    venueId: show.venueId,
    matchName: title,
    matchType,
    matchOrder: order,
    participants,
    winners: getWrestlingArray(record.winner || record.winners),
    taggedPeople,
    personIds: getWrestlingNameIds(participants),
    refereeIds: getWrestlingNameIds(referees),
    matchUrl: record.match_url || record.matchUrl || "",
    backend_record: record,
  };
}

function normalizeWrestlingShowRow(record = {}, index = 0) {
  const source = record && typeof record === "object" ? record : {};
  const rawTitle = getWrestlingText(source.show_name || source.event_name || source.name || source.title, `Wrestling Event ${index + 1}`);
  const routeTitleId = normalizeWrestlingArchiveSlug(rawTitle, "");
  const showKey = getWrestlingText(source.show_key || source.showKey);
  const rawId = getWrestlingText(source.show_id || source.showId || source.id);
  const rawDate = getWrestlingText(source.date || source.dateKey || source.eventDate || source.show_date);
  const parsedDate = parseWrestlingShowDate(rawDate);
  const venueId = normalizeWrestlingArchiveSlug(source.venue_id || source.venue_details?.venue_id || getWrestlingVenueName(source), "pending-venue");
  const city = getWrestlingText(source.city || source.venue_details?.city);
  const state = getWrestlingText(source.state || source.venue_details?.state);
  const showId = routeTitleId || normalizeWrestlingArchiveSlug(showKey || rawId || rawTitle, `wrestling-show-${index + 1}`);
  const show = {
    ...source,
    showId,
    eventId: showId,
    showKey,
    show_id: rawId || source.show_id,
    showName: rawTitle,
    eventName: rawTitle,
    title: rawTitle,
    promotion: getWrestlingText(source.promotion, "Promotion Pending"),
    rawDate,
    eventDate: formatWrestlingShowDate(rawDate),
    dateSort: parsedDate ? parsedDate.getTime() : 0,
    year: parsedDate ? String(parsedDate.getFullYear()) : "Pending",
    venueId,
    venue: getWrestlingVenueName(source),
    city,
    state,
    location: [city, state].filter(Boolean).join(", ") || getWrestlingShowLocation(source),
    poster: getWrestlingText(source.poster || source.poster_url || source.image_url),
    photoCount: Number.parseInt(source.photoCount ?? source.photo_count ?? source.stats?.photoCount ?? "0", 10) || 0,
    matchCount: Number.parseInt(source.stats?.matchCount ?? source.matchCount ?? source.matchesTotal ?? "0", 10) || getWrestlingArray(source.matches).length,
    participantCount: Number.parseInt(source.stats?.participantCount ?? source.participantCount ?? "0", 10) || 0,
    aliases: [
      showKey,
      rawId,
      routeTitleId,
      normalizeWrestlingArchiveSlug(`${rawTitle}-${rawDate}`, ""),
    ].filter(Boolean),
    backend_record: source,
  };
  const matches = getWrestlingArray(source.matches)
    .filter((match) => match && typeof match === "object")
    .map((match, matchIndex) => normalizeWrestlingMatchRow(match, show, matchIndex))
    .sort((left, right) => left.matchOrder - right.matchOrder);

  show.matches = matches;
  show.matchRows = matches;
  show.matchIds = matches.map((match) => match.matchId);
  show.galleryMatchId = show.matchIds[0] || "";
  show.personIds = [...new Set(matches.flatMap((match) => match.personIds || []))];
  show.refereeIds = [...new Set(matches.flatMap((match) => match.refereeIds || []))];
  show.taggedPeople = [...new Set(matches.flatMap((match) => match.taggedPeople || []))];
  return show;
}

function normalizeLiveWrestlingShows(payload) {
  const rows = getWrestlingShowsPayloadRows(payload)
    .map(normalizeWrestlingShowRow)
    .filter((show) => show.title);
  const seenIds = new Map();
  rows.forEach((show) => {
    const count = seenIds.get(show.showId) || 0;
    seenIds.set(show.showId, count + 1);
    if (count > 0) {
      const dateSuffix = normalizeWrestlingArchiveSlug(show.rawDate || show.showKey || String(count + 1), String(count + 1));
      show.aliases.push(show.showId);
      show.showId = `${show.showId}-${dateSuffix}`;
      show.eventId = show.showId;
      show.matches.forEach((match) => {
        match.showId = show.showId;
        match.eventId = show.showId;
      });
    }
  });
  return rows.sort((left, right) => getWrestlingShowTimestamp(right) - getWrestlingShowTimestamp(left) || left.title.localeCompare(right.title));
}

function setWrestlingShowsCollection(rows, stateName = "idle") {
  wrestlingShowsCollection = Array.isArray(rows) ? rows : [];
  wrestlingShowsDataState = stateName;
  if (wrestlingShowsShell) {
    wrestlingShowsShell.dataset.wrestlingShowsDataState = stateName;
    wrestlingShowsShell.setAttribute("aria-busy", String(stateName === "loading"));
  }
}

function getWrestlingShowsApiUrl(page = 1) {
  const apiUrl = new URL(WRESTLING_SHOWS_API_ROUTE, WRESTLING_SHOWS_API_BASE_URL);
  apiUrl.searchParams.set("limit", String(WRESTLING_SHOWS_API_LIMIT));
  apiUrl.searchParams.set("page", String(page));
  return apiUrl;
}

function getWrestlingPayloadPageCount(payload) {
  const totalPages = Number(payload?.totalPages || payload?.meta?.pagination?.totalPages);
  return Number.isFinite(totalPages) && totalPages > 0 ? Math.trunc(totalPages) : 1;
}

function fetchWrestlingShowsPage(page, signal) {
  return fetch(getWrestlingShowsApiUrl(page), {
    cache: "no-store",
    signal,
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Wrestling shows request failed (${response.status})`);
    }
    return response.json();
  });
}

function mergeWrestlingShowsPayloadPages(payloads) {
  const rows = payloads.flatMap(getWrestlingShowsPayloadRows);
  return {
    ...(payloads[0] || {}),
    data: rows,
    source: {
      ...(payloads[0]?.source && typeof payloads[0].source === "object" ? payloads[0].source : {}),
      data: rows,
    },
  };
}

function requestWrestlingShowsData() {
  if (wrestlingShowsDataState === "live") {
    return Promise.resolve(true);
  }
  if (wrestlingShowsRequest) {
    return wrestlingShowsRequest;
  }
  if (typeof fetch !== "function") {
    setWrestlingShowsCollection([], "error");
    renderWrestlingShowsArchive({ skipDataRequest: true });
    return Promise.resolve(false);
  }

  wrestlingShowsDataRequested = true;
  setWrestlingShowsCollection([], "loading");
  renderWrestlingShowsArchive({ skipDataRequest: true });
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), WRESTLING_SHOWS_TIMEOUT_MS)
    : 0;

  wrestlingShowsRequest = fetchWrestlingShowsPage(1, controller?.signal)
    .then((firstPayload) => {
      const totalPages = getWrestlingPayloadPageCount(firstPayload);
      if (totalPages <= 1) {
        return firstPayload;
      }
      const requests = [];
      for (let page = 2; page <= totalPages; page += 1) {
        requests.push(fetchWrestlingShowsPage(page, controller?.signal));
      }
      return Promise.all(requests).then((remainingPayloads) => mergeWrestlingShowsPayloadPages([firstPayload, ...remainingPayloads]));
    })
    .then((payload) => {
      const liveRows = normalizeLiveWrestlingShows(payload);
      if (liveRows.length === 0) {
        setWrestlingShowsCollection([], "empty");
      } else {
        setWrestlingShowsCollection(liveRows, "live");
      }
      renderWrestlingShowsArchive({ skipDataRequest: true });
      const route = getRouteFromUrl();
      if (route.name === "wrestling-show-detail") {
        renderWrestlingShowDetailRoute(route.showId, { skipDataRequest: true });
      }
      return liveRows.length > 0;
    })
    .catch(() => {
      setWrestlingShowsCollection([], "error");
      renderWrestlingShowsArchive({ skipDataRequest: true });
      const route = getRouteFromUrl();
      if (route.name === "wrestling-show-detail") {
        renderWrestlingShowDetailRoute(route.showId, { skipDataRequest: true });
      }
      return false;
    })
    .finally(() => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      if (wrestlingShowsShell) {
        wrestlingShowsShell.setAttribute("aria-busy", "false");
      }
      wrestlingShowsRequest = null;
    });

  return wrestlingShowsRequest;
}

function findLiveWrestlingShowById(showId) {
  const targetId = normalizeWrestlingArchiveSlug(showId, "");
  if (!targetId) {
    return null;
  }

  return wrestlingShowsCollection.find((show) => {
    const candidates = [
      show.showId,
      show.eventId,
      show.showKey,
      show.show_id,
      show.id,
      ...(Array.isArray(show.aliases) ? show.aliases : []),
    ];
    return candidates
      .map((candidate) => normalizeWrestlingArchiveSlug(candidate, ""))
      .some((candidate) => candidate === targetId);
  }) || null;
}

function findLiveWrestlingMatchById(matchId, showId = "") {
  const targetMatchId = normalizeWrestlingArchiveSlug(matchId, "");
  const show = findLiveWrestlingShowById(showId);
  const searchRows = show ? show.matches : wrestlingShowsCollection.flatMap((row) => row.matches || []);
  return searchRows.find((match) => normalizeWrestlingArchiveSlug(match.matchId, "") === targetMatchId) || null;
}

function getWrestlingShowsIndexRows() {
  return wrestlingShowsCollection.slice().sort((left, right) => {
    const sortDelta = getWrestlingShowTimestamp(right) - getWrestlingShowTimestamp(left);
    return sortDelta || left.title.localeCompare(right.title);
  });
}

function getFilteredWrestlingShows() {
  const startOfToday = getWrestlingStartOfToday();
  const rows = getWrestlingShowsIndexRows().filter((show) => {
    if (activeWrestlingShowsYearFilter === "Upcoming") {
      const timestamp = getWrestlingShowTimestamp(show);
      return timestamp >= startOfToday;
    }
    if (/^\d{4}$/.test(activeWrestlingShowsYearFilter)) {
      return show.year === activeWrestlingShowsYearFilter;
    }
    return true;
  });

  return rows.sort((left, right) => {
    const leftTime = getWrestlingShowTimestamp(left);
    const rightTime = getWrestlingShowTimestamp(right);
    const delta = activeWrestlingShowsSort === "oldest" ? leftTime - rightTime : rightTime - leftTime;
    return delta || left.title.localeCompare(right.title);
  });
}

function createWrestlingShowState(stateName) {
  const stateCopy = wrestlingShowsStateCopy[stateName] || wrestlingShowsStateCopy.empty;
  const item = document.createElement("li");
  item.className = `wrestling-show-state wrestling-show-state--${stateName}`;
  item.dataset.wrestlingShowsState = stateName;
  item.setAttribute("aria-live", stateName === "error" ? "assertive" : "polite");
  item.setAttribute("aria-busy", String(stateName === "loading"));

  const title = document.createElement("h3");
  title.className = "wrestling-show-state-title";
  title.textContent = stateCopy.title;

  const copy = document.createElement("p");
  copy.className = "wrestling-show-state-copy";
  copy.textContent = stateCopy.copy;

  item.append(title, copy);
  return item;
}

function syncWrestlingShowsControls() {
  wrestlingShowYearChips.forEach((chip) => {
    const chipValue = chip.textContent.trim();
    const isActive = chipValue === activeWrestlingShowsYearFilter;
    chip.classList.toggle("is-active", isActive);
    chip.setAttribute("aria-pressed", String(isActive));
  });
  if (wrestlingShowSortSelect) {
    wrestlingShowSortSelect.value = activeWrestlingShowsSort;
  }
  if (wrestlingShowPagination) {
    wrestlingShowPagination.hidden = true;
    wrestlingShowPagination.replaceChildren();
  }
}

function createWrestlingShowEntry(show) {
  const item = document.createElement("li");
  item.className = "wrestling-show-entry";
  item.dataset.wrestlingShowId = show.showId;
  item.dataset.wrestlingShowRoute = getWrestlingShowRouteUrl(show.showId);
  item.setAttribute("role", "link");
  item.tabIndex = 0;
  item.setAttribute("aria-label", `Open ${show.title}`);
  setWrestlingRelationshipDataset(item, show);

  const poster = document.createElement("div");
  poster.className = "wrestling-show-poster";
  poster.setAttribute("aria-hidden", "true");
  const posterLabel = document.createElement("span");
  posterLabel.textContent = getWrestlingShowPosterLabel(show);
  poster.append(posterLabel);

  const copy = document.createElement("div");
  copy.className = "wrestling-show-copy";

  const promotion = document.createElement("p");
  promotion.className = "wrestling-show-promotion";
  promotion.textContent = show.promotion;

  const title = document.createElement("h3");
  title.className = "wrestling-show-title";
  title.textContent = show.title;

  const date = document.createElement("p");
  date.className = "wrestling-show-date";
  date.textContent = show.eventDate;

  const venue = document.createElement("p");
  venue.className = "wrestling-show-place";
  venue.textContent = show.venue;

  const location = document.createElement("p");
  location.className = "wrestling-show-location";
  location.textContent = show.location;

  copy.append(promotion, title, date, venue, location);

  const arrow = document.createElement("span");
  arrow.className = "wrestling-show-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = ">";

  const navigateToShow = () => {
    navigateToRoute(getWrestlingShowRouteUrl(show.showId), {
      historyState: { fromWrestlingShowsIndex: true },
    });
  };

  item.addEventListener("click", navigateToShow);
  item.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigateToShow();
    }
  });

  item.append(poster, copy, arrow);
  return item;
}

function renderWrestlingShowsArchive(options = {}) {
  if (!wrestlingShowList) {
    return;
  }

  if (!options.skipDataRequest && wrestlingShowsDataState !== "live" && !wrestlingShowsRequest && !wrestlingShowsDataRequested) {
    requestWrestlingShowsData();
  }

  syncWrestlingShowsControls();
  wrestlingShowList.replaceChildren();

  if (wrestlingShowsDataState === "loading" || wrestlingShowsDataState === "idle") {
    wrestlingShowList.append(createWrestlingShowState("loading"));
    return;
  }

  if (wrestlingShowsDataState === "error") {
    wrestlingShowList.append(createWrestlingShowState("error"));
    return;
  }

  const filteredRows = getFilteredWrestlingShows();
  if (filteredRows.length === 0) {
    wrestlingShowList.append(createWrestlingShowState("empty"));
    return;
  }

  const fragment = document.createDocumentFragment();
  filteredRows.forEach((show) => {
    fragment.append(createWrestlingShowEntry(show));
  });
  wrestlingShowList.append(fragment);
}

function createWrestlingDetailFact(label, value) {
  const fact = document.createElement("div");
  fact.className = "wrestling-detail-fact";

  const term = document.createElement("dt");
  term.textContent = label;

  const description = document.createElement("dd");
  description.textContent = getWrestlingText(value, "N/A");

  fact.append(term, description);
  return fact;
}

function createWrestlingMatchCard(match) {
  const card = document.createElement("li");
  card.className = "wrestling-match-card";
  card.dataset.wrestlingShowId = match.showId;
  card.dataset.wrestlingMatchId = match.matchId;
  card.dataset.wrestlingMatchRoute = getWrestlingMatchRouteUrlByIds(match.showId, match.matchId);
  card.setAttribute("role", "link");
  card.tabIndex = 0;
  card.setAttribute("aria-label", `Open match ${match.matchName}`);
  setWrestlingRelationshipDataset(card, match);

  const type = document.createElement("p");
  type.className = "wrestling-match-type";
  type.textContent = match.matchType;

  const title = document.createElement("h4");
  title.className = "wrestling-match-title";
  title.textContent = match.matchName;

  const navigateToMatch = () => {
    navigateToRoute(getWrestlingMatchRouteUrlByIds(match.showId, match.matchId));
  };
  card.addEventListener("click", navigateToMatch);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigateToMatch();
    }
  });

  card.append(type, title);
  return card;
}

function renderWrestlingShowDetailState(showId, stateName) {
  if (!wrestlingShowDetailShell) {
    return;
  }

  const backButton = document.createElement("button");
  backButton.className = "wrestling-detail-back";
  backButton.type = "button";
  backButton.textContent = "Back to Events";
  backButton.addEventListener("click", () => navigateToRoute(routePaths.wrestlingShows));

  const stateSection = document.createElement("section");
  stateSection.className = `wrestling-show-state wrestling-show-state--${stateName}`;
  stateSection.dataset.wrestlingShowsState = stateName;
  stateSection.setAttribute("aria-live", stateName === "error" ? "assertive" : "polite");
  stateSection.setAttribute("aria-busy", String(stateName === "loading"));
  const copy = wrestlingShowsStateCopy[stateName] || wrestlingShowsStateCopy.empty;

  const title = document.createElement("h2");
  title.className = "wrestling-show-state-title";
  title.textContent = stateName === "empty" && showId ? "Event Not Found" : copy.title;

  const text = document.createElement("p");
  text.className = "wrestling-show-state-copy";
  text.textContent = stateName === "empty" && showId ? "No DB-backed event matches this route." : copy.copy;

  stateSection.append(title, text);
  wrestlingShowDetailShell.replaceChildren(backButton, stateSection);
}

function renderWrestlingShowDetailRoute(showId = "warzone-26", options = {}) {
  if (!wrestlingShowDetailShell) {
    return;
  }

  if (!options.skipDataRequest && wrestlingShowsDataState !== "live" && !wrestlingShowsRequest && !wrestlingShowsDataRequested) {
    requestWrestlingShowsData();
  }

  if (wrestlingShowsDataState === "loading" || wrestlingShowsDataState === "idle") {
    renderWrestlingShowDetailState(showId, "loading");
    return;
  }
  if (wrestlingShowsDataState === "error") {
    renderWrestlingShowDetailState(showId, "error");
    return;
  }

  const liveShow = findLiveWrestlingShowById(showId);
  const show = liveShow || (wrestlingShowsDataState === "live" || wrestlingShowsDataState === "empty"
    ? null
    : findWrestlingShowRelationshipById(showId));
  if (!show) {
    renderWrestlingShowDetailState(showId, "empty");
    return;
  }

  setWrestlingRelationshipDataset(wrestlingShowDetailShell, show);
  wrestlingShowDetailShell.dataset.wrestlingShowRoute = getWrestlingShowRouteUrl(show.showId);

  const backButton = document.createElement("button");
  backButton.className = "wrestling-detail-back";
  backButton.type = "button";
  backButton.textContent = "Back to Events";
  backButton.addEventListener("click", () => navigateToRoute(routePaths.wrestlingShows));

  const hero = document.createElement("section");
  hero.className = "wrestling-detail-hero";
  hero.setAttribute("aria-label", `${show.title || show.eventName} event overview`);

  const poster = document.createElement("div");
  poster.className = "wrestling-detail-poster";
  poster.setAttribute("aria-hidden", "true");
  const posterLabel = document.createElement("span");
  posterLabel.textContent = getWrestlingShowPosterLabel(show);
  poster.append(posterLabel);

  const meta = document.createElement("div");
  meta.className = "wrestling-detail-meta";

  const title = document.createElement("h2");
  title.className = "wrestling-detail-title";
  title.id = "wrestling-show-detail-title";
  title.textContent = show.title || show.eventName || "Event Detail";

  const facts = document.createElement("dl");
  facts.className = "wrestling-detail-facts";
  facts.setAttribute("aria-label", "Event metadata");
  facts.append(
    createWrestlingDetailFact("Promotion", show.promotion),
    createWrestlingDetailFact("Date", show.eventDate),
    createWrestlingDetailFact("Venue", show.venue),
    createWrestlingDetailFact("Location", show.location),
    createWrestlingDetailFact("Type", "Live Wrestling Event")
  );

  meta.append(title, facts);
  hero.append(poster, meta);

  const detailSection = document.createElement("section");
  detailSection.className = "wrestling-detail-section";
  detailSection.setAttribute("aria-labelledby", "wrestling-detail-matches-title");

  const matchTitle = document.createElement("h3");
  matchTitle.className = "wrestling-detail-section-title";
  matchTitle.id = "wrestling-detail-matches-title";
  matchTitle.textContent = "Matches";

  const matchList = document.createElement("ol");
  matchList.className = "wrestling-match-list";
  matchList.setAttribute("aria-label", `${show.title || "Event"} matches`);
  const matches = Array.isArray(show.matches) ? show.matches : [];
  if (matches.length > 0) {
    matches.forEach((match) => {
      matchList.append(createWrestlingMatchCard(match));
    });
  } else {
    const emptyMatch = document.createElement("li");
    emptyMatch.className = "wrestling-match-card";
    const type = document.createElement("p");
    type.className = "wrestling-match-type";
    type.textContent = "Matches";
    const emptyTitle = document.createElement("h4");
    emptyTitle.className = "wrestling-match-title";
    emptyTitle.textContent = "No matches listed for this event.";
    emptyMatch.append(type, emptyTitle);
    matchList.append(emptyMatch);
  }
  detailSection.append(matchTitle, matchList);

  const gallery = document.createElement("section");
  gallery.className = "wrestling-gallery-card";
  gallery.setAttribute("aria-labelledby", "wrestling-gallery-title");

  const galleryCopy = document.createElement("div");
  galleryCopy.className = "wrestling-gallery-copy";
  const galleryTitle = document.createElement("h3");
  galleryTitle.className = "wrestling-gallery-title";
  galleryTitle.id = "wrestling-gallery-title";
  galleryTitle.textContent = "Photo Gallery";
  const galleryCount = document.createElement("p");
  galleryCount.className = "wrestling-gallery-count";
  galleryCount.textContent = matches.length > 0 ? `${matches.length} Matches Indexed` : "No Matches Indexed";
  galleryCopy.append(galleryTitle, galleryCount);

  const galleryButton = document.createElement("button");
  galleryButton.className = "wrestling-gallery-button";
  galleryButton.type = "button";
  galleryButton.textContent = "Open Gallery";
  const galleryMatch = matches[0] || null;
  if (galleryMatch) {
    galleryButton.dataset.wrestlingMatchRoute = getWrestlingMatchRouteUrlByIds(show.showId, galleryMatch.matchId);
    setWrestlingRelationshipDataset(galleryButton, galleryMatch);
    galleryButton.addEventListener("click", () => navigateToRoute(galleryButton.dataset.wrestlingMatchRoute));
  } else {
    galleryButton.disabled = true;
    galleryButton.setAttribute("aria-disabled", "true");
  }

  gallery.append(galleryCopy, galleryButton);
  wrestlingShowDetailShell.replaceChildren(backButton, hero, detailSection, gallery);
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

  const forcedState = getForcedMockState("wrestlingPeople");
  wrestlingPeopleList.replaceChildren();
  if (forcedState && forcedState !== "partial") {
    renderMockState(wrestlingPeopleList, forcedState, "wrestlingPeople");
    return;
  }
  wrestlingPeopleRows.forEach((person) => {
    wrestlingPeopleList.append(createWrestlingPeopleCard(person));
  });
  if (forcedState === "partial") {
    wrestlingPeopleList.append(createMockStateCard("partial", "wrestlingPeople"));
  }
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

  const forcedState = getForcedMockState("wrestlingVenues");
  wrestlingVenuesList.replaceChildren();
  if (forcedState && forcedState !== "partial") {
    renderMockState(wrestlingVenuesList, forcedState, "wrestlingVenues");
    return;
  }
  wrestlingVenueRows.forEach((venue) => {
    wrestlingVenuesList.append(createWrestlingVenueCard(venue));
  });
  if (forcedState === "partial") {
    wrestlingVenuesList.append(createMockStateCard("partial", "wrestlingVenues"));
  }
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
  const forcedState = getForcedMockState("wrestlingVenues");
  if (forcedState && forcedState !== "partial") {
    renderMockState(eventList, forcedState, "wrestlingVenues");
  } else {
    wrestlingVenueEventHistoryRows.forEach((eventRow) => {
    eventList.append(createWrestlingVenueEventRow(eventRow));
    });
    if (forcedState === "partial") {
      eventList.append(createMockStateCard("partial", "wrestlingVenues"));
    }
  }

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
  const forcedState = getForcedMockState("wrestlingPeople");
  if (forcedState && forcedState !== "partial") {
    renderMockState(eventList, forcedState, "wrestlingPeople");
  } else {
    wrestlingPersonEventHistoryRows.forEach((eventRow) => {
    eventList.append(createWrestlingPersonEventRow(eventRow));
    });
    if (forcedState === "partial") {
      eventList.append(createMockStateCard("partial", "wrestlingPeople"));
    }
  }

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
  const matchRows = Array.isArray(showRelationship.matches) && showRelationship.matches.length > 0
    ? showRelationship.matches
    : wrestlingMatchRelationshipRows;

  wrestlingShowDetailShell.querySelectorAll(".wrestling-match-card").forEach((card, index) => {
    const matchRelationship = matchRows[index];
    if (!matchRelationship) {
      return;
    }

    setWrestlingRelationshipDataset(card, matchRelationship);
    card.dataset.wrestlingMatchRoute = getWrestlingMatchRouteUrlByIds(matchRelationship.showId || activeShowId, matchRelationship.matchId);
  });

  const galleryButton = wrestlingShowDetailShell.querySelector(".wrestling-gallery-button");
  const galleryMatchId = showRelationship.galleryMatchId || showRelationship.matchIds?.[0] || matchRows[0]?.matchId || "";
  const galleryMatch = getWrestlingDefaultMatchRelationship(galleryMatchId, showRelationship.showId);
  if (galleryButton && galleryMatch) {
    setWrestlingRelationshipDataset(galleryButton, galleryMatch);
    galleryButton.dataset.wrestlingMatchRoute = getWrestlingMatchRouteUrlByIds(galleryMatch.showId || activeShowId, galleryMatch.matchId);
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

function initWrestlingShowsArchive() {
  wrestlingShowYearChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      activeWrestlingShowsYearFilter = chip.textContent.trim() || "Upcoming";
      renderWrestlingShowsArchive();
    });
  });

  if (wrestlingShowSortSelect) {
    const hasOldestOption = Array.from(wrestlingShowSortSelect.options).some((option) => option.value === "oldest");
    if (!hasOldestOption) {
      const option = document.createElement("option");
      option.value = "oldest";
      option.textContent = "Oldest";
      wrestlingShowSortSelect.append(option);
    }
    wrestlingShowSortSelect.value = activeWrestlingShowsSort;
    wrestlingShowSortSelect.addEventListener("change", () => {
      activeWrestlingShowsSort = wrestlingShowSortSelect.value === "oldest" ? "oldest" : "newest";
      renderWrestlingShowsArchive();
    });
  }

  syncWrestlingShowsControls();
  if (wrestlingShowList && wrestlingShowList.children.length === 0) {
    wrestlingShowList.append(createWrestlingShowState("loading"));
  }
}

function initWrestlingPeopleModule() {
  renderWrestlingPeopleIndex();
  renderWrestlingVenuesIndex();
  initWrestlingShowsArchive();
  applyStaticWrestlingRelationshipHooks();
}
