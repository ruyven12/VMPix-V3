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

function findWrestlingPersonById(personId, options = {}) {
  const normalizedPersonId = normalizeWrestlingPersonId(personId);
  const peopleSources = [
    ...getWrestlingPeopleCollection(),
    ...(Array.isArray(wrestlingPeopleRows) ? wrestlingPeopleRows : []),
  ];
  const resolvedPerson = peopleSources.map(normalizeWrestlingPeopleIndexRow).find((person) => {
    const source = person?.backend_record && typeof person.backend_record === "object"
      ? { ...person.backend_record, ...person }
      : person;
    return [
      source?.personId,
      source?.wrestling_person_id,
      source?.person_id,
      source?.id,
      source?.slug,
      getWrestlingPersonRouteId(source),
    ].some((candidate) => normalizeWrestlingPersonId(candidate) === normalizedPersonId);
  });

  if (resolvedPerson || options.allowFallback === false) {
    return resolvedPerson || null;
  }

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
const WRESTLING_PEOPLE_API_ROUTE = "/api/wrestling/people/db";
const WRESTLING_PEOPLE_TIMEOUT_MS = 8000;
const wrestlingShowList = document.querySelector("[data-wrestling-show-list]") || document.querySelector(".wrestling-show-list");
const wrestlingShowYearChips = document.querySelectorAll(".wrestling-year-chip");
const wrestlingShowSearchInput = document.querySelector("[data-wrestling-shows-filter='search']");
const wrestlingShowYearSelect = document.querySelector("[data-wrestling-shows-filter='year']");
const wrestlingShowPromotionSelect = document.querySelector("[data-wrestling-shows-filter='promotion']");
const wrestlingShowVenueSelect = document.querySelector("[data-wrestling-shows-filter='venue']");
const wrestlingShowFilterReset = document.querySelector("[data-wrestling-shows-filter-reset]");
const wrestlingShowSortSelect = document.querySelector("#wrestling-shows-sort");
const wrestlingShowPagination = document.querySelector("[data-wrestling-pagination]") || document.querySelector(".wrestling-pagination");
const wrestlingPeopleSearchInput = document.querySelector("[data-wrestling-people-filter='search']");
const wrestlingPeopleLetterSelect = document.querySelector("[data-wrestling-people-filter='letter']");
const wrestlingPeopleCategorySelect = document.querySelector("[data-wrestling-people-filter='category']");
const wrestlingPeopleFilterReset = document.querySelector("[data-wrestling-people-filter-reset]");
const WRESTLING_SHOWS_SEARCH_DEBOUNCE_MS = 180;
const wrestlingPeopleAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const wrestlingPeopleLetterOptions = ["#", ...wrestlingPeopleAlphabet];
let wrestlingShowsCollection = [];
let wrestlingShowsRequest = null;
let wrestlingShowsDataState = "idle";
let wrestlingShowsDataRequested = false;
let wrestlingShowsSearchRenderTimer = 0;
let activeWrestlingShowsSearch = "";
let activeWrestlingShowsYearFilter = "";
let activeWrestlingShowsPromotionFilter = "";
let activeWrestlingShowsVenueFilter = "";
let activeWrestlingShowsSort = "newest";
let wrestlingPeopleCollection = [];
let wrestlingPeopleRequest = null;
let wrestlingPeopleLoaded = false;
let wrestlingPeopleDataState = "idle";
let wrestlingPeopleFiltersInitialized = false;
let activeWrestlingPeopleSearch = "";
let activeWrestlingPeopleLetterFilter = "";
let activeWrestlingPeopleCategoryFilter = "";

const wrestlingShowsStateCopy = {
  loading: {
    title: "Loading Event Archive",
    copy: "Wrestling show rows are being prepared.",
  },
  empty: {
    title: "No Events Found",
    copy: "Try a different filter or search term.",
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

function getWrestlingLabelArray(value) {
  const rawValues = Array.isArray(value)
    ? value
    : value === undefined || value === null || String(value).trim() === ""
      ? []
      : [value];
  return rawValues
    .map((item) => {
      if (item && typeof item === "object") {
        return getWrestlingText(
          item.name ||
          item.display_name ||
          item.displayName ||
          item.person_name ||
          item.personName ||
          item.wrestler ||
          item.participant ||
          item.team_name ||
          item.teamName ||
          item.title ||
          item.id
        );
      }
      return getWrestlingText(item);
    })
    .filter(Boolean);
}

function getWrestlingNameIds(values) {
  return getWrestlingArray(values).map((value) => normalizeWrestlingPersonId(value)).filter(Boolean);
}

function getWrestlingPositiveNumber(value) {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function getWrestlingMatchRefNumber(value) {
  const rawValue = String(value || "").trim();
  if (/^\d+$/.test(rawValue)) {
    return getWrestlingPositiveNumber(rawValue);
  }

  const matchNumber = normalizeWrestlingArchiveSlug(rawValue, "").match(/^match-(\d+)$/);
  return matchNumber ? getWrestlingPositiveNumber(matchNumber[1]) : 0;
}

function getWrestlingMatchRouteRef(match, index = -1) {
  if (match && typeof match === "object") {
    const numericCandidates = [
      match.matchRef,
      match.match_ref,
      match.matchNumber,
      match.match_number,
      match.matchOrder,
      match.match_order,
      match.order,
    ];
    for (const candidate of numericCandidates) {
      const number = getWrestlingMatchRefNumber(candidate);
      if (number) {
        return String(number);
      }
    }

    if (Number.isInteger(index) && index >= 0) {
      return String(index + 1);
    }

    return getWrestlingText(match.matchId || match.id || match.slug || match.matchUrl || match.match_url);
  }

  const number = getWrestlingMatchRefNumber(match);
  return number ? String(number) : getWrestlingText(match);
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

function formatWrestlingDateKeyFromDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${month}${day}${year}`;
}

function getWrestlingShowDateKey(value) {
  const rawValue = String(value || "").trim();
  if (!rawValue) {
    return "";
  }

  const compactValue = rawValue.replace(/\D/g, "");
  if (/^\d{6}$/.test(compactValue)) {
    return compactValue;
  }

  const parsed = parseWrestlingShowDate(rawValue);
  return parsed ? formatWrestlingDateKeyFromDate(parsed) : "";
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
  const sideOne = getWrestlingLabelArray(record.side_1 || record.side1);
  const sideTwo = getWrestlingLabelArray(record.side_2 || record.side2);
  const sideTitle = [sideOne.join(", "), sideTwo.join(", ")].filter(Boolean).join(" vs ");
  const title = getWrestlingText(record.title || sideTitle || record.notes, `Match ${order}`);
  const matchType = getWrestlingText(record.stipulation || record.notes || record.match_type || record.matchType, "Match");
  const matchId = normalizeWrestlingArchiveSlug(record.match_url || record.matchUrl || title || `match-${order}`, `match-${order}`);
  const photoCount = Number.parseInt(
    record.photoCount ??
    record.photo_count ??
    record.stats?.photoCount ??
    (Array.isArray(record.photos) ? record.photos.length : "0"),
    10
  ) || 0;
  const participants = getWrestlingLabelArray(record.participants).length > 0
    ? getWrestlingLabelArray(record.participants)
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
    matchRef: String(order),
    photoCount,
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
  const dateKey = getWrestlingShowDateKey(source.dateKey || source.date_key)
    || getWrestlingShowDateKey(rawDate)
    || getWrestlingShowDateKey(showKey);
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
    dateKey,
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
      dateKey,
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
      } else if (route.name === "wrestling-match-gallery") {
        updateWrestlingMatchGalleryRelationshipHooks(route.dateKey || route.showId, route.matchRef || route.matchId, { skipDataRequest: true });
      } else if (route.name === "wrestling-lightbox") {
        updateWrestlingLightboxRelationshipHooks(route.dateKey || route.showId, route.matchRef || route.matchId, route.photoId);
      }
      return liveRows.length > 0;
    })
    .catch(() => {
      setWrestlingShowsCollection([], "error");
      renderWrestlingShowsArchive({ skipDataRequest: true });
      const route = getRouteFromUrl();
      if (route.name === "wrestling-show-detail") {
        renderWrestlingShowDetailRoute(route.showId, { skipDataRequest: true });
      } else if (route.name === "wrestling-match-gallery") {
        updateWrestlingMatchGalleryRelationshipHooks(route.dateKey || route.showId, route.matchRef || route.matchId, { skipDataRequest: true });
      } else if (route.name === "wrestling-lightbox") {
        updateWrestlingLightboxRelationshipHooks(route.dateKey || route.showId, route.matchRef || route.matchId, route.photoId);
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
      getWrestlingShowRouteCode(show),
      show.dateKey,
      show.date_key,
      getWrestlingShowDateKey(show.rawDate || show.date || show.eventDate || show.show_date),
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
  const show = findLiveWrestlingShowById(showId);
  const searchRows = show ? show.matches : wrestlingShowsCollection.flatMap((row) => row.matches || []);
  return findWrestlingMatchInRowsByRef(searchRows, matchId);
}

function findWrestlingMatchInRowsByRef(rows = [], matchRef = "") {
  const matchRows = Array.isArray(rows) ? rows : [];
  const targetNumber = getWrestlingMatchRefNumber(matchRef);
  if (targetNumber) {
    return matchRows.find((match, index) => {
      const routeRef = getWrestlingMatchRefNumber(getWrestlingMatchRouteRef(match, index));
      return routeRef === targetNumber;
    }) || null;
  }

  const targetSlug = normalizeWrestlingArchiveSlug(matchRef, "");
  if (!targetSlug) {
    return null;
  }

  return matchRows.find((match) => {
    const candidates = [
      match.matchId,
      match.id,
      match.slug,
      match.matchUrl,
      match.match_url,
      match.matchName,
      match.title,
    ];
    return candidates
      .map((candidate) => normalizeWrestlingArchiveSlug(candidate, ""))
      .some((candidate) => candidate === targetSlug);
  }) || null;
}

function findStaticWrestlingMatchByRef(matchRef, showId = "") {
  const normalizedShowId = String(showId || "").trim();
  const showRelationship = getMockRecordById("wrestlingShows", normalizedShowId, ["showId", "eventId", "id", "slug", "show_id", "show_key"]);
  const staticShowId = showRelationship?.showId || normalizedShowId;
  const matchRows = filterMockCollection("wrestlingMatches", (match) => (
    !staticShowId || match.showId === staticShowId
  ));
  const targetNumber = getWrestlingMatchRefNumber(matchRef);
  if (targetNumber) {
    const orderedMatchId = Array.isArray(showRelationship?.matchIds) ? showRelationship.matchIds[targetNumber - 1] : "";
    return (orderedMatchId ? findWrestlingMatchRelationshipById(orderedMatchId, staticShowId) : null) ||
      matchRows[targetNumber - 1] ||
      null;
  }

  return findWrestlingMatchRelationshipById(matchRef, staticShowId) ||
    findWrestlingMatchInRowsByRef(matchRows, matchRef);
}

function findWrestlingMatchRelationshipByRef(matchRef, showId = "") {
  const show = findLiveWrestlingShowById(showId);
  if (show) {
    return findWrestlingMatchInRowsByRef(show.matches, matchRef);
  }

  return findStaticWrestlingMatchByRef(matchRef, showId);
}

function getWrestlingShowsIndexRows() {
  return wrestlingShowsCollection.slice().sort((left, right) => {
    const sortDelta = getWrestlingShowTimestamp(right) - getWrestlingShowTimestamp(left);
    return sortDelta || left.title.localeCompare(right.title);
  });
}

function getWrestlingShowsUniqueOptions(rows, valueGetter, sortMode = "alpha") {
  const values = [...new Set(rows
    .map(valueGetter)
    .map((value) => String(value || "").trim())
    .filter(Boolean))];

  if (sortMode === "year-desc") {
    return values.sort((left, right) => Number.parseInt(right, 10) - Number.parseInt(left, 10));
  }

  return values.sort((left, right) => left.localeCompare(right));
}

function normalizeActiveWrestlingShowsFilters(rows) {
  const years = new Set(getWrestlingShowsUniqueOptions(rows, (show) => show.year, "year-desc").filter((year) => /^\d{4}$/.test(year)));
  const promotions = new Set(getWrestlingShowsUniqueOptions(rows, (show) => show.promotion === "Promotion Pending" ? "" : show.promotion));
  const venues = new Set(getWrestlingShowsUniqueOptions(rows, (show) => show.venue === "Venue Pending" ? "" : show.venue));
  if (activeWrestlingShowsYearFilter && activeWrestlingShowsYearFilter !== "Upcoming" && !years.has(activeWrestlingShowsYearFilter)) {
    activeWrestlingShowsYearFilter = "";
  }
  if (activeWrestlingShowsPromotionFilter && !promotions.has(activeWrestlingShowsPromotionFilter)) {
    activeWrestlingShowsPromotionFilter = "";
  }
  if (activeWrestlingShowsVenueFilter && !venues.has(activeWrestlingShowsVenueFilter)) {
    activeWrestlingShowsVenueFilter = "";
  }
}

function normalizeWrestlingShowsSearchValue(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function getWrestlingShowsSearchNeedle(value) {
  const normalized = normalizeWrestlingShowsSearchValue(value).replace(/["\u201c\u201d]/g, "");
  if (!normalized) {
    return null;
  }
  return {
    phrase: normalized,
    terms: normalized.split(" ").filter(Boolean),
  };
}

function doesWrestlingShowMatchSearch(show, searchNeedle) {
  if (!searchNeedle) {
    return true;
  }
  const haystack = normalizeWrestlingShowsSearchValue([
    show.title,
    show.eventName,
    show.showName,
    show.promotion,
    show.venue,
    show.city,
    show.state,
    show.location,
  ].join(" "));
  if (haystack.includes(searchNeedle.phrase)) {
    return true;
  }
  return searchNeedle.terms.every((term) => haystack.includes(term));
}

function scheduleWrestlingShowsArchiveRender() {
  window.clearTimeout(wrestlingShowsSearchRenderTimer);
  wrestlingShowsSearchRenderTimer = window.setTimeout(() => {
    renderWrestlingShowsArchive();
  }, WRESTLING_SHOWS_SEARCH_DEBOUNCE_MS);
}

function renderWrestlingShowsArchiveImmediately() {
  window.clearTimeout(wrestlingShowsSearchRenderTimer);
  renderWrestlingShowsArchive();
}

function getFilteredWrestlingShows() {
  const startOfToday = getWrestlingStartOfToday();
  const rows = getWrestlingShowsIndexRows();
  normalizeActiveWrestlingShowsFilters(rows);
  const searchNeedle = getWrestlingShowsSearchNeedle(activeWrestlingShowsSearch);
  const filteredRows = rows.filter((show) => {
    if (activeWrestlingShowsYearFilter === "Upcoming") {
      const timestamp = getWrestlingShowTimestamp(show);
      if (timestamp < startOfToday) {
        return false;
      }
    }
    if (/^\d{4}$/.test(activeWrestlingShowsYearFilter)) {
      if (show.year !== activeWrestlingShowsYearFilter) {
        return false;
      }
    }
    if (activeWrestlingShowsPromotionFilter && show.promotion !== activeWrestlingShowsPromotionFilter) {
      return false;
    }
    if (activeWrestlingShowsVenueFilter && show.venue !== activeWrestlingShowsVenueFilter) {
      return false;
    }
    return doesWrestlingShowMatchSearch(show, searchNeedle);
  });

  return filteredRows.sort((left, right) => {
    const leftTime = getWrestlingShowTimestamp(left);
    const rightTime = getWrestlingShowTimestamp(right);
    const delta = activeWrestlingShowsSort === "oldest" ? leftTime - rightTime : rightTime - leftTime;
    return delta || left.title.localeCompare(right.title);
  });
}

function updateWrestlingShowsFilter(filterName, value) {
  if (filterName === "search") {
    const nextValue = String(value ?? "");
    if (nextValue === activeWrestlingShowsSearch) {
      return;
    }
    activeWrestlingShowsSearch = nextValue;
    scheduleWrestlingShowsArchiveRender();
    return;
  }

  const nextValue = String(value || "").trim();
  if (filterName === "year") {
    if (nextValue === activeWrestlingShowsYearFilter) {
      return;
    }
    activeWrestlingShowsYearFilter = nextValue;
  } else if (filterName === "promotion") {
    if (nextValue === activeWrestlingShowsPromotionFilter) {
      return;
    }
    activeWrestlingShowsPromotionFilter = nextValue;
  } else if (filterName === "venue") {
    if (nextValue === activeWrestlingShowsVenueFilter) {
      return;
    }
    activeWrestlingShowsVenueFilter = nextValue;
  } else {
    return;
  }
  renderWrestlingShowsArchiveImmediately();
}

function resetWrestlingShowsFilters() {
  activeWrestlingShowsSearch = "";
  activeWrestlingShowsYearFilter = "";
  activeWrestlingShowsPromotionFilter = "";
  activeWrestlingShowsVenueFilter = "";
  renderWrestlingShowsArchiveImmediately();
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

function syncWrestlingFilterSelectOptions(select, options, activeValue) {
  if (!select) {
    return;
  }
  const optionRows = Array.isArray(options) ? options : [];
  const signature = optionRows.map((option) => `${option.value}\u0000${option.label}`).join("\u0001");
  if (select.dataset.optionsSignature !== signature) {
    const fragment = document.createDocumentFragment();
    optionRows.forEach((optionRow) => {
      const option = document.createElement("option");
      option.value = optionRow.value;
      option.textContent = optionRow.label;
      fragment.append(option);
    });
    select.replaceChildren(fragment);
    select.dataset.optionsSignature = signature;
  }
  select.value = activeValue;
  if (select.value !== activeValue) {
    select.value = "";
  }
}

function syncWrestlingShowsControls() {
  const rows = getWrestlingShowsIndexRows();
  normalizeActiveWrestlingShowsFilters(rows);

  wrestlingShowYearChips.forEach((chip) => {
    const chipValue = chip.textContent.trim();
    const isActive = chipValue === activeWrestlingShowsYearFilter;
    chip.classList.toggle("is-active", isActive);
    chip.setAttribute("aria-pressed", String(isActive));
  });
  if (wrestlingShowSearchInput && wrestlingShowSearchInput.value !== activeWrestlingShowsSearch) {
    wrestlingShowSearchInput.value = activeWrestlingShowsSearch;
  }
  syncWrestlingFilterSelectOptions(
    wrestlingShowYearSelect,
    [
      { value: "Upcoming", label: "Upcoming" },
      { value: "", label: "All Years" },
      ...getWrestlingShowsUniqueOptions(rows, (show) => show.year, "year-desc")
        .filter((year) => /^\d{4}$/.test(year))
        .map((year) => ({ value: year, label: year })),
    ],
    activeWrestlingShowsYearFilter
  );
  syncWrestlingFilterSelectOptions(
    wrestlingShowPromotionSelect,
    [
      { value: "", label: "All Promotions" },
      ...getWrestlingShowsUniqueOptions(rows, (show) => show.promotion === "Promotion Pending" ? "" : show.promotion)
        .map((promotion) => ({ value: promotion, label: promotion })),
    ],
    activeWrestlingShowsPromotionFilter
  );
  syncWrestlingFilterSelectOptions(
    wrestlingShowVenueSelect,
    [
      { value: "", label: "All Venues" },
      ...getWrestlingShowsUniqueOptions(rows, (show) => show.venue === "Venue Pending" ? "" : show.venue)
        .map((venue) => ({ value: venue, label: venue })),
    ],
    activeWrestlingShowsVenueFilter
  );
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
  item.dataset.wrestlingShowRoute = getWrestlingShowRouteUrl(show);
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
    navigateToRoute(getWrestlingShowRouteUrl(show), {
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

function createWrestlingMatchCard(match, show = null, matchIndex = -1) {
  const card = document.createElement("li");
  const matchRef = getWrestlingMatchRouteRef(match, matchIndex);
  const matchRoute = getWrestlingMatchRouteUrlByIds(show || match.showId, matchRef);
  card.className = "wrestling-match-card";
  card.dataset.wrestlingShowId = match.showId;
  card.dataset.wrestlingMatchId = match.matchId;
  card.dataset.wrestlingMatchRef = matchRef;
  card.dataset.wrestlingShowRoute = getWrestlingShowRouteUrl(show || match.showId);
  card.dataset.wrestlingMatchRoute = matchRoute;
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
    navigateToRoute(matchRoute);
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
  wrestlingShowDetailShell.dataset.wrestlingShowRoute = getWrestlingShowRouteUrl(show);

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
    matches.forEach((match, matchIndex) => {
      matchList.append(createWrestlingMatchCard(match, show, matchIndex));
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
    galleryButton.dataset.wrestlingMatchRef = getWrestlingMatchRouteRef(galleryMatch, 0);
    galleryButton.dataset.wrestlingShowRoute = getWrestlingShowRouteUrl(show);
    galleryButton.dataset.wrestlingMatchRoute = getWrestlingMatchRouteUrlByIds(show, galleryButton.dataset.wrestlingMatchRef);
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

function getWrestlingMatchRouteUrlByIds(showId, matchRef, matchIndex = -1) {
  const showRouteSource = showId && typeof showId === "object"
    ? showId
    : findLiveWrestlingShowById(showId) || showId;
  const showRouteCode = getWrestlingShowRouteCode(showRouteSource);
  const rawRouteMatchRef = matchRef && typeof matchRef === "object"
    ? getWrestlingMatchRouteRef(matchRef, matchIndex)
    : getWrestlingText(matchRef);
  const routeMatchRefNumber = getWrestlingMatchRefNumber(rawRouteMatchRef);
  const routeMatchRef = routeMatchRefNumber ? String(routeMatchRefNumber) : rawRouteMatchRef;
  return `${routePaths.wrestlingShows}/${encodeURIComponent(showRouteCode)}/match-${encodeURIComponent(routeMatchRef)}`;
}

function getWrestlingMatchRouteUrl(eventRow) {
  return getWrestlingMatchRouteUrlByIds(eventRow.showId || eventRow.eventId, getWrestlingMatchRouteRef(eventRow));
}

function getWrestlingShowRouteCode(show) {
  if (show && typeof show === "object") {
    return getWrestlingText(
      show.dateKey ||
      show.date_key ||
      getWrestlingShowDateKey(show.rawDate || show.date || show.eventDate || show.show_date) ||
      show.showId ||
      show.eventId
    );
  }
  return getWrestlingText(show);
}

function getWrestlingShowRouteUrl(show) {
  const showRouteSource = show && typeof show === "object"
    ? show
    : findLiveWrestlingShowById(show) || show;
  return `${routePaths.wrestlingShows}/${encodeURIComponent(getWrestlingShowRouteCode(showRouteSource))}`;
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

function getWrestlingPeopleCollection() {
  return Array.isArray(wrestlingPeopleCollection) ? wrestlingPeopleCollection : [];
}

function setWrestlingPeopleCollection(rows, stateName = "fallback") {
  wrestlingPeopleCollection = Array.isArray(rows) ? rows : [];
  wrestlingPeopleDataState = stateName;
  if (typeof mockCollections !== "undefined" && wrestlingPeopleCollection.length > 0) {
    mockCollections.wrestlingPeople = wrestlingPeopleCollection;
  }
  if (wrestlingPeopleShell) {
    wrestlingPeopleShell.dataset.peopleDataState = stateName;
    wrestlingPeopleShell.setAttribute("aria-busy", String(stateName === "loading"));
  }
}

function getWrestlingPeoplePayloadRows(payload) {
  const candidates = [
    payload?.data,
    payload?.rows,
    payload?.people,
    payload?.source?.data,
    payload?.source?.rows,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter((row) => row && typeof row === "object");
    }
    if (candidate && typeof candidate === "object") {
      const nestedRows = Object.values(candidate).flatMap((value) => {
        if (Array.isArray(value)) {
          return value;
        }
        return value && typeof value === "object" ? [value] : [];
      });
      if (nestedRows.length > 0) {
        return nestedRows.filter((row) => row && typeof row === "object");
      }
    }
  }

  return [];
}

function normalizeLiveWrestlingPeople(payload) {
  return getWrestlingPeoplePayloadRows(payload)
    .map((person) => ({
      ...person,
      backend_record: person.backend_record || person,
    }))
    .filter((person) => getWrestlingText(person.display_name || person.ring_name || person.name || person.title))
    .sort((left, right) => getWrestlingText(left.display_name || left.ring_name || left.name || left.title).localeCompare(
      getWrestlingText(right.display_name || right.ring_name || right.name || right.title)
    ));
}

function requestWrestlingPeopleData() {
  if (wrestlingPeopleLoaded) {
    return Promise.resolve(true);
  }
  if (wrestlingPeopleRequest) {
    return wrestlingPeopleRequest;
  }
  if (typeof fetch !== "function") {
    setWrestlingPeopleCollection([], "error");
    renderWrestlingPeopleIndex({ skipDataRequest: true });
    return Promise.resolve(false);
  }

  setWrestlingPeopleCollection([], "loading");
  if (wrestlingPeopleShell) {
    wrestlingPeopleShell.setAttribute("aria-busy", "true");
  }
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), WRESTLING_PEOPLE_TIMEOUT_MS)
    : 0;
  const apiUrl = new URL(WRESTLING_PEOPLE_API_ROUTE, WRESTLING_SHOWS_API_BASE_URL);

  wrestlingPeopleRequest = fetch(apiUrl, {
    cache: "no-store",
    signal: controller?.signal,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Wrestling people request failed (${response.status})`);
      }
      return response.json();
    })
    .then((payload) => {
      const liveRows = normalizeLiveWrestlingPeople(payload);
      if (liveRows.length === 0) {
        setWrestlingPeopleCollection([], "empty");
      } else {
        setWrestlingPeopleCollection(liveRows, "live");
        wrestlingPeopleLoaded = true;
      }
      renderWrestlingPeopleIndex({ skipDataRequest: true });
      return liveRows.length > 0;
    })
    .catch(() => {
      setWrestlingPeopleCollection([], "error");
      renderWrestlingPeopleIndex({ skipDataRequest: true });
      return false;
    })
    .finally(() => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      if (wrestlingPeopleShell) {
        wrestlingPeopleShell.setAttribute("aria-busy", "false");
      }
      wrestlingPeopleRequest = null;
    });

  return wrestlingPeopleRequest;
}

function getWrestlingPersonRouteId(person) {
  return getWrestlingText(
    person?.personId ||
    person?.wrestling_person_id ||
    person?.person_id ||
    person?.slug ||
    person?.id ||
    normalizeWrestlingPersonId(person?.display_name || person?.ring_name || person?.name || person?.title)
  );
}

function getWrestlingPeopleCountValue(...values) {
  const foundValue = values.find((value) => {
    const parsedValue = Number.parseInt(value, 10);
    return Number.isFinite(parsedValue) && parsedValue >= 0;
  });
  return Number.parseInt(foundValue, 10) || 0;
}

function getWrestlingPersonCategory(person) {
  const roles = getWrestlingLabelArray(person?.roles || person?.role_ids);
  return getWrestlingText(
    person?.category ||
    person?.role ||
    roles[0] ||
    person?.type,
    "Person"
  );
}

function getWrestlingPersonCategoryFilterValue(category) {
  return normalizeWrestlingArchiveSlug(category, "person");
}

function getWrestlingPersonCategoryDisplay(category) {
  return getWrestlingText(category, "Person")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getWrestlingPersonAffiliations(person) {
  return [
    getWrestlingText(person?.factionTeam || person?.stable || person?.team || person?.notes),
    ...getWrestlingLabelArray(person?.teams || person?.teamIds || person?.team_ids),
    ...getWrestlingLabelArray(person?.stables || person?.stableIds || person?.stable_ids),
    ...getWrestlingLabelArray(person?.factions || person?.factionIds || person?.faction_ids),
  ]
    .filter(Boolean)
    .map((value) => value.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()))
    .filter((value, index, values) => values.findIndex((candidate) => candidate.toLowerCase() === value.toLowerCase()) === index);
}

function getWrestlingPersonAliases(person) {
  return getWrestlingLabelArray(person?.aliases || person?.alias || person?.ring_names || person?.ringNames);
}

function getWrestlingPersonLetter(person) {
  const firstLetter = getWrestlingText(person?.name || person?.display_name || person?.ring_name).charAt(0).toUpperCase();
  return wrestlingPeopleAlphabet.includes(firstLetter) ? firstLetter : "#";
}

function normalizeWrestlingPeopleIndexRow(person = {}) {
  const source = person?.backend_record && typeof person.backend_record === "object"
    ? { ...person.backend_record, ...person }
    : { ...person };
  const personId = getWrestlingPersonRouteId(source);
  const name = getWrestlingText(source.display_name || source.ring_name || source.name || source.title || source.legal_name, "Unknown Person");
  const legalName = getWrestlingText(source.legal_name || source.real_name || source.birth_name);
  const category = getWrestlingPersonCategory(source);
  const categoryDisplay = getWrestlingPersonCategoryDisplay(category);
  const categoryFilterValue = getWrestlingPersonCategoryFilterValue(category);
  const aliases = getWrestlingPersonAliases(source);
  const affiliations = getWrestlingPersonAffiliations(source);
  const matches = getWrestlingPeopleCountValue(
    source.matches,
    source.match_count,
    source.matches_count,
    source.stats?.matchCount,
    source.stats?.match_count
  );
  const photos = getWrestlingPeopleCountValue(
    source.photos,
    source.photoCount,
    source.photo_count,
    source.tagged_photo_count,
    source.taggedPhotoCount,
    source.stats?.taggedPhotoCount,
    source.stats?.photoCount,
    source.stats?.tagged_photo_count,
    source.stats?.photo_count
  );

  return {
    ...source,
    personId,
    name,
    legalName,
    aliases,
    category,
    categoryDisplay,
    categoryFilterValue,
    affiliationText: affiliations.length > 0 ? affiliations.join(" / ") : aliases.join(" / "),
    matches,
    photos,
    letter: getWrestlingPersonLetter({ name }),
    searchText: [
      name,
      legalName,
      aliases.join(" "),
      affiliations.join(" "),
      category,
    ].join(" ").toLowerCase(),
  };
}

function getWrestlingPeopleIndexRows() {
  const sourceRows = wrestlingPeopleDataState === "live" || wrestlingPeopleDataState === "loading" || wrestlingPeopleDataState === "empty"
    ? getWrestlingPeopleCollection()
    : wrestlingPeopleRows;
  return sourceRows
    .map(normalizeWrestlingPeopleIndexRow)
    .filter((person) => person.name)
    .sort((left, right) => left.name.localeCompare(right.name));
}

function getWrestlingPeopleCategoryOptions(rows) {
  return [...new Map(rows.map((person) => [
    person.categoryFilterValue,
    { value: person.categoryFilterValue, label: person.categoryDisplay },
  ])).values()]
    .filter((option) => option.value)
    .sort((left, right) => left.label.localeCompare(right.label));
}

function normalizeActiveWrestlingPeopleFilters(rows) {
  const letters = new Set(rows.map((person) => person.letter));
  const categories = new Set(rows.map((person) => person.categoryFilterValue));
  if (activeWrestlingPeopleLetterFilter && !letters.has(activeWrestlingPeopleLetterFilter)) {
    activeWrestlingPeopleLetterFilter = "";
  }
  if (activeWrestlingPeopleCategoryFilter && !categories.has(activeWrestlingPeopleCategoryFilter)) {
    activeWrestlingPeopleCategoryFilter = "";
  }
}

function getFilteredWrestlingPeopleRows() {
  const rows = getWrestlingPeopleIndexRows();
  normalizeActiveWrestlingPeopleFilters(rows);
  const searchTerm = activeWrestlingPeopleSearch.trim().toLowerCase();

  return rows.filter((person) => {
    if (activeWrestlingPeopleLetterFilter && person.letter !== activeWrestlingPeopleLetterFilter) {
      return false;
    }
    if (activeWrestlingPeopleCategoryFilter && person.categoryFilterValue !== activeWrestlingPeopleCategoryFilter) {
      return false;
    }
    if (searchTerm && !person.searchText.includes(searchTerm)) {
      return false;
    }
    return true;
  });
}

function createWrestlingPeopleStat(label, value) {
  const stat = document.createElement("span");
  stat.className = "wrestling-person-row-stat wrestling-person-card-stat";
  stat.setAttribute("aria-label", `${Number(value).toLocaleString()} ${label.toLowerCase()}`);

  const statValue = document.createElement("strong");
  statValue.textContent = Number(value).toLocaleString();

  const statLabel = document.createElement("span");
  statLabel.textContent = label;

  stat.append(statValue, statLabel);
  return stat;
}

function createWrestlingPeopleRow(person) {
  const row = document.createElement("button");
  row.className = "wrestling-person-row wrestling-person-card";
  row.type = "button";
  row.dataset.wrestlingPersonId = person.personId;
  row.dataset.wrestlingPersonRoute = getWrestlingPersonRouteUrl(person.personId);
  row.dataset.wrestlingPeopleCategory = person.categoryFilterValue;
  row.dataset.wrestlingPeopleLetter = person.letter;
  setWrestlingRelationshipDataset(row, person);
  row.classList.toggle("is-active", person.personId === activeWrestlingPersonId);
  row.setAttribute("aria-pressed", String(person.personId === activeWrestlingPersonId));
  row.setAttribute("aria-label", getWrestlingPeopleCardLabel(person));

  const name = document.createElement("span");
  name.className = "wrestling-person-row-name wrestling-person-card-name";
  name.textContent = person.name;

  const category = document.createElement("span");
  category.className = "wrestling-person-row-category wrestling-person-card-meta";
  category.textContent = person.categoryDisplay;

  const affiliation = document.createElement("span");
  affiliation.className = "wrestling-person-row-affiliation wrestling-person-card-team";
  affiliation.textContent = person.affiliationText || person.aliases.join(" / ");

  const stats = document.createElement("span");
  stats.className = "wrestling-person-row-stats wrestling-person-card-stats";
  stats.setAttribute("aria-hidden", "true");
  if (person.matches > 0) {
    stats.append(createWrestlingPeopleStat("Matches", person.matches));
  }
  if (person.photos > 0) {
    if (stats.children.length > 0) {
      const divider = document.createElement("span");
      divider.className = "wrestling-person-row-stat-divider";
      divider.setAttribute("aria-hidden", "true");
      divider.textContent = "/";
      stats.append(divider);
    }
    stats.append(createWrestlingPeopleStat("Photos", person.photos));
  }

  const arrow = document.createElement("span");
  arrow.className = "wrestling-person-row-arrow wrestling-person-card-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = ">";

  row.append(name, category);
  if (affiliation.textContent) {
    row.append(affiliation);
  }
  if (stats.children.length > 0) {
    row.append(stats);
  }
  row.append(arrow);
  row.addEventListener("click", () => {
    activeWrestlingPersonId = person.personId;
    setActiveWrestlingPeopleCard(person.personId);
    navigateToRoute(getWrestlingPersonRouteUrl(person.personId), {
      historyState: { fromWrestlingPeopleIndex: true },
    });
  });

  return row;
}

function syncWrestlingPeopleFilters(rows) {
  if (wrestlingPeopleSearchInput) {
    wrestlingPeopleSearchInput.value = activeWrestlingPeopleSearch;
  }
  if (wrestlingPeopleLetterSelect) {
    const currentValue = activeWrestlingPeopleLetterFilter;
    wrestlingPeopleLetterSelect.replaceChildren();
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "All";
    wrestlingPeopleLetterSelect.append(allOption);
    const availableLetters = new Set(rows.map((person) => person.letter));
    wrestlingPeopleLetterOptions.forEach((letter) => {
      if (!availableLetters.has(letter)) {
        return;
      }
      const option = document.createElement("option");
      option.value = letter;
      option.textContent = letter;
      wrestlingPeopleLetterSelect.append(option);
    });
    wrestlingPeopleLetterSelect.value = currentValue && availableLetters.has(currentValue) ? currentValue : "";
  }
  if (wrestlingPeopleCategorySelect) {
    const currentValue = activeWrestlingPeopleCategoryFilter;
    wrestlingPeopleCategorySelect.replaceChildren();
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "All";
    wrestlingPeopleCategorySelect.append(allOption);
    const categoryOptions = getWrestlingPeopleCategoryOptions(rows);
    categoryOptions.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.value;
      option.textContent = category.label;
      wrestlingPeopleCategorySelect.append(option);
    });
    wrestlingPeopleCategorySelect.value = categoryOptions.some((category) => category.value === currentValue) ? currentValue : "";
  }
}

function updateWrestlingPeopleFilter(filterName, value) {
  const nextValue = getWrestlingText(value);
  if (filterName === "search") {
    activeWrestlingPeopleSearch = nextValue;
  } else if (filterName === "letter") {
    activeWrestlingPeopleLetterFilter = wrestlingPeopleLetterOptions.includes(nextValue) ? nextValue : "";
  } else if (filterName === "category") {
    activeWrestlingPeopleCategoryFilter = normalizeWrestlingArchiveSlug(nextValue, "");
  } else {
    return;
  }
  renderWrestlingPeopleIndex({ skipDataRequest: true });
}

function resetWrestlingPeopleFilters() {
  activeWrestlingPeopleSearch = "";
  activeWrestlingPeopleLetterFilter = "";
  activeWrestlingPeopleCategoryFilter = "";
  renderWrestlingPeopleIndex({ skipDataRequest: true });
}

function initWrestlingPeopleFilters() {
  if (wrestlingPeopleFiltersInitialized) {
    return;
  }
  wrestlingPeopleFiltersInitialized = true;

  if (wrestlingPeopleSearchInput) {
    wrestlingPeopleSearchInput.addEventListener("input", () => {
      updateWrestlingPeopleFilter("search", wrestlingPeopleSearchInput.value);
    });
  }
  if (wrestlingPeopleLetterSelect) {
    wrestlingPeopleLetterSelect.addEventListener("change", () => {
      updateWrestlingPeopleFilter("letter", wrestlingPeopleLetterSelect.value);
    });
  }
  if (wrestlingPeopleCategorySelect) {
    wrestlingPeopleCategorySelect.addEventListener("change", () => {
      updateWrestlingPeopleFilter("category", wrestlingPeopleCategorySelect.value);
    });
  }
  if (wrestlingPeopleFilterReset) {
    wrestlingPeopleFilterReset.addEventListener("click", resetWrestlingPeopleFilters);
  }
}

function createWrestlingPeopleEmptyState(copy = "No people found. Try clearing filters.") {
  const empty = document.createElement("div");
  empty.className = "wrestling-people-empty";
  empty.textContent = copy;
  return empty;
}

function renderWrestlingPeopleIndex(options = {}) {
  if (!wrestlingPeopleList) {
    return;
  }

  if (!options.skipDataRequest && wrestlingPeopleDataState === "idle" && !wrestlingPeopleRequest && !wrestlingPeopleLoaded) {
    requestWrestlingPeopleData();
  }

  const forcedState = getForcedMockState("wrestlingPeople");
  const allRows = getWrestlingPeopleIndexRows();
  normalizeActiveWrestlingPeopleFilters(allRows);
  syncWrestlingPeopleFilters(allRows);
  const filteredRows = getFilteredWrestlingPeopleRows();
  const fragment = document.createDocumentFragment();
  wrestlingPeopleList.replaceChildren();
  if (forcedState && forcedState !== "partial") {
    renderMockState(wrestlingPeopleList, forcedState, "wrestlingPeople");
    return;
  }
  if (wrestlingPeopleDataState === "loading" || wrestlingPeopleDataState === "idle") {
    renderMockState(fragment, "loading", "wrestlingPeople");
  } else if (wrestlingPeopleDataState === "error") {
    renderMockState(fragment, "error", "wrestlingPeople");
  } else if (wrestlingPeopleDataState === "empty") {
    fragment.append(createWrestlingPeopleEmptyState("No wrestling people found."));
  } else if (filteredRows.length === 0) {
    fragment.append(createWrestlingPeopleEmptyState());
  } else {
    filteredRows.forEach((person) => {
      fragment.append(createWrestlingPeopleRow(person));
    });
  }
  if (forcedState === "partial") {
    fragment.append(createMockStateCard("partial", "wrestlingPeople"));
  }
  wrestlingPeopleList.append(fragment);
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

function createWrestlingPersonDetailBackButton() {
  const backButton = document.createElement("button");
  backButton.className = "wrestling-person-detail-back";
  backButton.type = "button";
  backButton.textContent = "Back to Wrestling People";
  backButton.addEventListener("click", returnToWrestlingPeopleRoute);
  return backButton;
}

function renderWrestlingPersonDetailPending(personId) {
  if (!wrestlingPersonDetailShell) {
    return;
  }

  const stateCard = createMockStateCard("loading", "wrestlingPeople", {
    title: "Loading Person",
    text: "Fetching wrestling person data.",
  });
  stateCard.dataset.wrestlingPersonId = normalizeWrestlingPersonId(personId);
  wrestlingPersonDetailShell.replaceChildren(createWrestlingPersonDetailBackButton(), stateCard);
}

function renderWrestlingPersonDetailRoute(personId) {
  if (!wrestlingPersonDetailShell) {
    return;
  }

  let person = findWrestlingPersonById(personId, { allowFallback: false });
  if (
    !person &&
    !wrestlingPeopleLoaded &&
    (wrestlingPeopleDataState === "idle" || wrestlingPeopleDataState === "loading" || wrestlingPeopleRequest)
  ) {
    const pendingPeopleRequest = wrestlingPeopleRequest || requestWrestlingPeopleData();
    renderWrestlingPersonDetailPending(personId);
    pendingPeopleRequest.then(() => {
      const currentRoute = getRouteFromUrl();
      if (
        currentRoute.name === "wrestling-person-detail" &&
        normalizeWrestlingPersonId(currentRoute.personId || currentRoute.params?.personId) === normalizeWrestlingPersonId(personId)
      ) {
        renderWrestlingPersonDetailRoute(personId);
      }
    });
    return;
  }

  person = person || findWrestlingPersonById(personId);
  activeWrestlingPersonId = person.personId;
  setActiveWrestlingPeopleCard(person.personId);
  setWrestlingRelationshipDataset(wrestlingPersonDetailShell, person);

  const backButton = createWrestlingPersonDetailBackButton();

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
  return findWrestlingMatchRelationshipByRef(matchId, showId) ||
    findWrestlingMatchRelationshipByRef(getWrestlingDefaultShowRelationship(showId)?.galleryMatchId, showId) ||
    wrestlingMatchRelationshipRows[0];
}

function updateWrestlingShowDetailRelationshipHooks(showId = "warzone-26") {
  if (!wrestlingShowDetailShell) {
    return;
  }

  const showRelationship = getWrestlingDefaultShowRelationship(showId);
  const activeShowId = showRelationship.showId || showId;
  const showRouteSource = showRelationship || activeShowId;
  setWrestlingRelationshipDataset(wrestlingShowDetailShell, { ...showRelationship, showId: activeShowId });
  wrestlingShowDetailShell.dataset.wrestlingShowRoute = getWrestlingShowRouteUrl(showRouteSource);
  const matchRows = Array.isArray(showRelationship.matches) && showRelationship.matches.length > 0
    ? showRelationship.matches
    : wrestlingMatchRelationshipRows;

  wrestlingShowDetailShell.querySelectorAll(".wrestling-match-card").forEach((card, index) => {
    const matchRelationship = matchRows[index];
    if (!matchRelationship) {
      return;
    }

    setWrestlingRelationshipDataset(card, matchRelationship);
    card.dataset.wrestlingMatchRef = getWrestlingMatchRouteRef(matchRelationship, index);
    card.dataset.wrestlingShowRoute = getWrestlingShowRouteUrl(showRouteSource);
    card.dataset.wrestlingMatchRoute = getWrestlingMatchRouteUrlByIds(showRouteSource, card.dataset.wrestlingMatchRef);
  });

  const galleryButton = wrestlingShowDetailShell.querySelector(".wrestling-gallery-button");
  const galleryMatchId = showRelationship.galleryMatchId || showRelationship.matchIds?.[0] || matchRows[0]?.matchId || "";
  const galleryMatch = getWrestlingDefaultMatchRelationship(galleryMatchId, showRelationship.showId);
  if (galleryButton && galleryMatch) {
    setWrestlingRelationshipDataset(galleryButton, galleryMatch);
    const galleryMatchIndex = matchRows.indexOf(galleryMatch);
    galleryButton.dataset.wrestlingMatchRef = getWrestlingMatchRouteRef(galleryMatch, galleryMatchIndex);
    galleryButton.dataset.wrestlingShowRoute = getWrestlingShowRouteUrl(showRouteSource);
    galleryButton.dataset.wrestlingMatchRoute = getWrestlingMatchRouteUrlByIds(showRouteSource, galleryButton.dataset.wrestlingMatchRef);
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

function getWrestlingMatchDisplayName(match) {
  return getWrestlingText(match?.matchName || match?.title || match?.name || match?.matchId, "Match");
}

function getWrestlingMatchTitleParts(match) {
  const sideOne = getWrestlingLabelArray(match?.side_1 || match?.side1 || match?.team_1 || match?.team1);
  const sideTwo = getWrestlingLabelArray(match?.side_2 || match?.side2 || match?.team_2 || match?.team2);
  if (sideOne.length > 0 || sideTwo.length > 0) {
    const parts = [];
    if (sideOne.length > 0) {
      parts.push(sideOne.join(", "));
    }
    if (sideOne.length > 0 && sideTwo.length > 0) {
      parts.push("vs");
    }
    if (sideTwo.length > 0) {
      parts.push(sideTwo.join(", "));
    }
    return parts;
  }

  const title = getWrestlingMatchDisplayName(match);
  const splitTitle = title.split(/\s+v(?:s\.?|\.?)\s+/i).map((part) => part.trim()).filter(Boolean);
  return splitTitle.length === 2 ? [splitTitle[0], "vs", splitTitle[1]] : [title];
}

function setWrestlingMatchGalleryTitle(parts) {
  const title = wrestlingMatchGalleryShell?.querySelector(".wrestling-match-gallery-title");
  if (!title) {
    return;
  }

  title.replaceChildren();
  parts.forEach((part) => {
    const span = document.createElement("span");
    span.textContent = part;
    title.append(span);
  });
}

function getWrestlingGalleryPhotoCount(match) {
  const photoCount = Number.parseInt(match?.photoCount ?? match?.photo_count ?? match?.stats?.photoCount ?? "0", 10);
  if (Number.isFinite(photoCount) && photoCount > 0) {
    return photoCount;
  }
  if (Array.isArray(match?.photoIds) && match.photoIds.length > 0) {
    return match.photoIds.length;
  }
  return wrestlingPhotoTiles.length;
}

function updateWrestlingMatchGalleryDisplay(show, match) {
  if (!wrestlingMatchGalleryShell) {
    return;
  }

  const kicker = wrestlingMatchGalleryShell.querySelector(".wrestling-match-gallery-kicker strong");
  if (kicker) {
    kicker.textContent = getWrestlingText(match?.matchType || match?.match_type || match?.stipulation, "Match");
  }

  setWrestlingMatchGalleryTitle(getWrestlingMatchTitleParts(match));

  const metaValues = [
    getWrestlingText(show?.title || show?.eventName || show?.showName, "Event Pending"),
    getWrestlingText(show?.eventDate || formatWrestlingShowDate(show?.rawDate || show?.date || show?.show_date), "Date Pending"),
    getWrestlingText(show?.venue || getWrestlingVenueName(show), "Venue Pending"),
    getWrestlingText(show?.location || getWrestlingShowLocation(show), "Location Pending"),
  ];
  wrestlingMatchGalleryShell.querySelectorAll(".wrestling-match-gallery-meta strong").forEach((field, index) => {
    field.textContent = metaValues[index] || "N/A";
  });

  const count = wrestlingMatchGalleryShell.querySelector(".wrestling-match-gallery-count strong");
  if (count) {
    count.textContent = formatWrestlingCount(getWrestlingGalleryPhotoCount(match), "Photos");
  }

  const grid = wrestlingMatchGalleryShell.querySelector(".wrestling-photo-grid");
  if (grid) {
    grid.setAttribute("aria-label", `${getWrestlingMatchDisplayName(match)} photo placeholders`);
  }
}

function updateWrestlingMatchGalleryState(showId, matchRef, stateName) {
  const show = findLiveWrestlingShowById(showId);
  const title = stateName === "loading" ? "Loading Match" : "Match Not Found";
  const type = stateName === "loading" ? "Loading" : "Unavailable";
  const showRouteSource = show || showId;
  const routeMatchRef = getWrestlingMatchRouteRef(matchRef);
  wrestlingMatchGalleryShell.dataset.wrestlingShowId = show?.showId || showId;
  wrestlingMatchGalleryShell.dataset.wrestlingMatchRef = routeMatchRef;
  wrestlingMatchGalleryShell.dataset.wrestlingShowRoute = getWrestlingShowRouteUrl(showRouteSource);
  wrestlingMatchGalleryShell.dataset.wrestlingMatchRoute = getWrestlingMatchRouteUrlByIds(showRouteSource, routeMatchRef);
  updateWrestlingMatchGalleryDisplay(show, { matchName: title, matchType: type, photoCount: 0 });
}

function updateWrestlingMatchGalleryRelationshipHooks(showId = "warzone-26", matchRef = "1", options = {}) {
  if (!wrestlingMatchGalleryShell) {
    return;
  }

  const hasStaticShowRelationship = Boolean(getMockRecordById(
    "wrestlingShows",
    showId,
    ["showId", "eventId", "id", "slug", "show_id", "show_key"]
  ));
  const shouldRequestLiveShows = Boolean(getWrestlingShowDateKey(showId) || !hasStaticShowRelationship);

  if (shouldRequestLiveShows && !options.skipDataRequest && wrestlingShowsDataState !== "live" && !wrestlingShowsRequest && !wrestlingShowsDataRequested) {
    requestWrestlingShowsData();
  }

  if (shouldRequestLiveShows && (wrestlingShowsDataState === "loading" || wrestlingShowsDataState === "idle")) {
    updateWrestlingMatchGalleryState(showId, matchRef, "loading");
    return;
  }

  const showRelationship = findLiveWrestlingShowById(showId) || (wrestlingShowsDataState === "live" || wrestlingShowsDataState === "empty"
    ? null
    : getWrestlingDefaultShowRelationship(showId));
  const matchRelationship = showRelationship?.matches
    ? findWrestlingMatchInRowsByRef(showRelationship.matches, matchRef)
    : findWrestlingMatchRelationshipByRef(matchRef, showId);
  if (!showRelationship || !matchRelationship) {
    updateWrestlingMatchGalleryState(showId, matchRef, "empty");
    return;
  }

  const activeShowId = showRelationship.showId || showId;
  const activeMatchId = matchRelationship.matchId || matchRef;
  const matchRows = Array.isArray(showRelationship.matches) ? showRelationship.matches : [];
  const matchIndex = matchRows.indexOf(matchRelationship);
  const activeMatchRef = getWrestlingMatchRouteRef(matchRelationship, matchIndex);
  setWrestlingRelationshipDataset(wrestlingMatchGalleryShell, { ...matchRelationship, showId: activeShowId, matchId: activeMatchId });
  wrestlingMatchGalleryShell.dataset.wrestlingShowId = activeShowId;
  wrestlingMatchGalleryShell.dataset.wrestlingMatchId = activeMatchId;
  wrestlingMatchGalleryShell.dataset.wrestlingMatchRef = activeMatchRef;
  wrestlingMatchGalleryShell.dataset.wrestlingShowRoute = getWrestlingShowRouteUrl(showRelationship);
  wrestlingMatchGalleryShell.dataset.wrestlingMatchRoute = getWrestlingMatchRouteUrlByIds(showRelationship, activeMatchRef);
  updateWrestlingMatchGalleryDisplay(showRelationship, matchRelationship);

  wrestlingPhotoTiles.forEach((tile) => {
    const photoId = tile.dataset.wrestlingPhotoId;
    const photoRelationship = {
      ...matchRelationship,
      showId: activeShowId,
      matchId: activeMatchId,
      photoIds: photoId ? [photoId] : matchRelationship.photoIds,
    };
    setWrestlingRelationshipDataset(tile, photoRelationship);
    tile.dataset.wrestlingMatchRef = activeMatchRef;
    tile.dataset.wrestlingShowRoute = getWrestlingShowRouteUrl(showRelationship);
    if (photoId) {
      tile.dataset.wrestlingLightboxRoute = getWrestlingLightboxRouteUrl(showRelationship, activeMatchRef, photoId);
    }
  });
}

function updateWrestlingLightboxRelationshipHooks(showId = "warzone-26", matchId = "daron-richardson-vs-bear-bronson", photoId = "001") {
  if (!wrestlingLightboxShell) {
    return;
  }

  const showRelationship = findLiveWrestlingShowById(showId) || getWrestlingDefaultShowRelationship(showId);
  const matchRelationship = findWrestlingMatchRelationshipByRef(matchId, showId) || getWrestlingDefaultMatchRelationship(matchId, showId);
  const activeShowId = showRelationship.showId || showId;
  const activeMatchId = matchRelationship.matchId || matchId;
  const matchRows = Array.isArray(showRelationship.matches) ? showRelationship.matches : [];
  const activeMatchRef = getWrestlingMatchRouteRef(matchRelationship, matchRows.indexOf(matchRelationship));
  const activePhotoId = photoId || "001";
  setWrestlingRelationshipDataset(wrestlingLightboxShell, {
    ...matchRelationship,
    showId: activeShowId,
    matchId: activeMatchId,
    photoIds: [activePhotoId],
  });
  wrestlingLightboxShell.dataset.wrestlingShowId = activeShowId;
  wrestlingLightboxShell.dataset.wrestlingMatchId = activeMatchId;
  wrestlingLightboxShell.dataset.wrestlingMatchRef = activeMatchRef;
  wrestlingLightboxShell.dataset.wrestlingPhotoId = activePhotoId;
  wrestlingLightboxShell.dataset.wrestlingShowRoute = getWrestlingShowRouteUrl(showRelationship);
  wrestlingLightboxShell.dataset.wrestlingLightboxRoute = getWrestlingLightboxRouteUrl(showRelationship, activeMatchRef, activePhotoId);
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
    wrestlingMatchGalleryShell?.dataset.wrestlingMatchId || "daron-richardson-vs-bear-bronson",
    { skipDataRequest: true }
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

  if (wrestlingShowSearchInput) {
    wrestlingShowSearchInput.value = activeWrestlingShowsSearch;
    wrestlingShowSearchInput.addEventListener("input", () => {
      updateWrestlingShowsFilter("search", wrestlingShowSearchInput.value);
    });
  }
  if (wrestlingShowYearSelect) {
    wrestlingShowYearSelect.addEventListener("change", () => {
      updateWrestlingShowsFilter("year", wrestlingShowYearSelect.value);
    });
  }
  if (wrestlingShowPromotionSelect) {
    wrestlingShowPromotionSelect.addEventListener("change", () => {
      updateWrestlingShowsFilter("promotion", wrestlingShowPromotionSelect.value);
    });
  }
  if (wrestlingShowVenueSelect) {
    wrestlingShowVenueSelect.addEventListener("change", () => {
      updateWrestlingShowsFilter("venue", wrestlingShowVenueSelect.value);
    });
  }
  if (wrestlingShowFilterReset) {
    wrestlingShowFilterReset.addEventListener("click", resetWrestlingShowsFilters);
  }

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
  initWrestlingPeopleFilters();
  renderWrestlingPeopleIndex({ skipDataRequest: true });
  renderWrestlingVenuesIndex();
  initWrestlingShowsArchive();
  applyStaticWrestlingRelationshipHooks();
}
