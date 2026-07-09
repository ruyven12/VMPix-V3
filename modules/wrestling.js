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
  const includeStaticRows = options.includeStatic !== false;
  const peopleSources = [
    ...getWrestlingPeopleCollection(),
    ...(includeStaticRows && Array.isArray(wrestlingPeopleRows) ? wrestlingPeopleRows : []),
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

function getWrestlingVenuePublicSlug(venue) {
  const rawVenueId = venue && typeof venue === "object"
    ? getWrestlingText(
      venue?.venue_id ||
      venue?.backend_record?.venue_id ||
      venue?.venueId ||
      venue?.id ||
      venue?.slug ||
      getWrestlingVenueRowName(venue)
    )
    : getWrestlingText(venue);
  return rawVenueId
    .trim()
    .replace(/^wv[_-]+/i, "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\s+/g, "_");
}

function normalizeWrestlingVenuePublicSlug(venue) {
  return normalizeWrestlingVenueId(getWrestlingVenuePublicSlug(venue));
}

function getWrestlingVenueRouteUrl(venueId) {
  const fallbackId = wrestlingVenueRows[0]?.venueId || "";
  const publicVenueSlug = getWrestlingVenuePublicSlug(venueId) || getWrestlingVenuePublicSlug(fallbackId);
  return publicVenueSlug
    ? `${routePaths.wrestlingVenues}/${encodeURIComponent(publicVenueSlug)}`
    : routePaths.wrestlingVenues;
}

function findWrestlingVenueById(venueId, options = {}) {
  const normalizedVenueId = normalizeWrestlingVenueId(venueId);
  const normalizedPublicVenueId = normalizeWrestlingVenuePublicSlug(venueId);
  const lookupIds = new Set([
    normalizedVenueId,
    normalizedPublicVenueId,
    normalizeWrestlingVenueId(`wv-${normalizedPublicVenueId || normalizedVenueId}`),
    normalizeWrestlingVenueId(`wv_${normalizedPublicVenueId || normalizedVenueId}`),
  ].filter(Boolean));
  const includeStaticRows = options.includeStatic !== false;
  const venueSources = [
    ...(Array.isArray(wrestlingVenuesCollection) ? wrestlingVenuesCollection : []),
    ...(includeStaticRows && Array.isArray(wrestlingVenueRows) ? wrestlingVenueRows : []),
    ...(includeStaticRows ? getMockCollection("wrestlingVenues", { clone: false }) : []),
  ];
  const seenVenues = new Set();
  const resolvedVenue = venueSources.find((venue) => {
    if (!venue || typeof venue !== "object") {
      return false;
    }
    const venueKey = getWrestlingVenueRowId(venue) || normalizeWrestlingVenueId(venue?.venue_id || venue?.id || venue?.slug);
    if (venueKey && seenVenues.has(venueKey)) {
      return false;
    }
    if (venueKey) {
      seenVenues.add(venueKey);
    }
    return [
      getWrestlingVenueRowId(venue),
      venue?.venueId,
      venue?.venue_id,
      venue?.id,
      venue?.slug,
      venue?.backend_record?.venue_id,
      venue?.backend_record?.id,
    ].some((candidate) => {
      const normalizedCandidate = normalizeWrestlingVenueId(candidate);
      const publicCandidate = normalizeWrestlingVenuePublicSlug(candidate);
      return lookupIds.has(normalizedCandidate) || lookupIds.has(publicCandidate);
    });
  });

  if (resolvedVenue || options.allowFallback === false) {
    return resolvedVenue || null;
  }

  return wrestlingVenueRows[0] || null;
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
const WRESTLING_PEOPLE_API_LIMIT = 100;
const WRESTLING_PEOPLE_TIMEOUT_MS = 20000;
const WRESTLING_VENUES_API_ROUTE = "/api/wrestling/venues/db";
const WRESTLING_VENUES_API_LIMIT = 100;
const WRESTLING_VENUES_TIMEOUT_MS = 8000;
const wrestlingShowList = document.querySelector("[data-wrestling-show-list]") || document.querySelector(".wrestling-show-list");
const wrestlingShowYearChips = document.querySelectorAll(".wrestling-year-chip");
const wrestlingShowSearchInput = document.querySelector("[data-wrestling-shows-filter='search']");
const wrestlingShowYearSelect = document.querySelector("[data-wrestling-shows-filter='year']");
const wrestlingShowPromotionSelect = document.querySelector("[data-wrestling-shows-filter='promotion']");
const wrestlingShowVenueSelect = document.querySelector("[data-wrestling-shows-filter='venue']");
const wrestlingShowFilterReset = document.querySelector("[data-wrestling-shows-filter-reset]");
const wrestlingShowSortSelect = document.querySelector("#wrestling-shows-sort");
const wrestlingShowPagination = document.querySelector("[data-wrestling-pagination]") || document.querySelector(".wrestling-pagination");
const hallCrusadesPosterStrip = document.querySelector("[data-hall-crusades-poster-strip]");
const hallCrusadesCampaignInfoPanel = document.querySelector("[data-hall-crusades-campaign-info-panel]");
const hallCrusadesYearCrystal = document.querySelector("[data-hall-crusades-year-crystal]");
const hallCrusadesYearDrawer = document.querySelector("[data-hall-crusades-year-drawer]");
const hallCrusadesYearOptions = document.querySelectorAll("[data-hall-crusades-year-option]");
const hallCrusadesBannerCrystal = document.querySelector("[data-hall-crusades-banner-crystal]");
const hallCrusadesBannerDrawer = document.querySelector("[data-hall-crusades-banner-drawer]");
const hallCrusadesFieldCrystal = document.querySelector("[data-hall-crusades-field-crystal]");
const hallCrusadesFieldDrawer = document.querySelector("[data-hall-crusades-field-drawer]");
const wrestlingPeopleSearchInput = document.querySelector("[data-wrestling-people-filter='search']");
const wrestlingPeopleLetterSelect = document.querySelector("[data-wrestling-people-filter='letter']");
const wrestlingPeopleCategorySelect = document.querySelector("[data-wrestling-people-filter='category']");
const wrestlingPeopleFilterReset = document.querySelector("[data-wrestling-people-filter-reset]");
const wrestlingVenuesFilters = document.querySelector("[data-wrestling-venues-filters]");
const wrestlingVenuesCount = document.querySelector("[data-wrestling-venues-count]");
const WRESTLING_SHOWS_SEARCH_DEBOUNCE_MS = 180;
const HALL_CRUSADES_POSTER_STRIP_LIMIT = 7;
const HALL_CRUSADES_POSTER_ACTIVE_SLOT = Math.floor(HALL_CRUSADES_POSTER_STRIP_LIMIT / 2);
const HALL_CRUSADES_POSTER_SWIPE_THRESHOLD = 36;
const HALL_CRUSADES_POSTER_WHEEL_THRESHOLD = 48;
const wrestlingPeopleAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const wrestlingPeopleLetterOptions = ["#", ...wrestlingPeopleAlphabet];
let wrestlingShowsCollection = [];
let wrestlingShowsRequest = null;
let wrestlingMatchPhotoRequests = new Map();
let wrestlingPersonTaggedPhotoRequests = new Map();
let wrestlingPersonTaggedPhotoRequestToken = 0;
let wrestlingShowsDataState = "idle";
let wrestlingShowsDataRequested = false;
let wrestlingShowsSearchRenderTimer = 0;
let activeWrestlingShowsSearch = "";
let activeWrestlingShowsYearFilter = "";
let activeWrestlingShowsPromotionFilter = "";
let activeWrestlingShowsVenueFilter = "";
let activeWrestlingShowsSort = "newest";
let hallCrusadesPosterActiveIndex = HALL_CRUSADES_POSTER_ACTIVE_SLOT;
let hallCrusadesPosterPointerId = null;
let hallCrusadesPosterPointerStartX = 0;
let hallCrusadesPosterPointerStartY = 0;
let hallCrusadesPosterSuppressClick = false;
let hallCrusadesPosterSuppressClickTimer = 0;
let hallCrusadesPosterWheelDelta = 0;
let isHallCrusadesPosterStripInteractionBound = false;
let activeHallCrusadesYearFilter = "";
let activeHallCrusadesBannerFilter = "all";
let activeHallCrusadesFieldFilter = "all";
let isHallCrusadesYearDrawerOpen = false;
let isHallCrusadesBannerDrawerOpen = false;
let isHallCrusadesFieldDrawerOpen = false;
let isHallCrusadesYearCrystalInteractionBound = false;
let isHallCrusadesBannerCrystalInteractionBound = false;
let isHallCrusadesFieldCrystalInteractionBound = false;
let wrestlingPeopleCollection = [];
let wrestlingPeopleRequest = null;
let wrestlingPeopleLoaded = false;
let wrestlingPeopleDataState = "idle";
let wrestlingPeopleFiltersInitialized = false;
let wrestlingPeopleRequestToken = 0;
let wrestlingPeopleRenderFrame = 0;
let wrestlingPeopleHydrationIdleHandle = 0;
let wrestlingPeopleRequestController = null;
let wrestlingPeopleAllowOffIndexHydration = false;
const wrestlingPeoplePagePayloadCache = new Map();
const wrestlingPeoplePageRequests = new Map();
const wrestlingPersonDetailPayloadCache = new Map();
const wrestlingPersonDetailRequests = new Map();
let activeWrestlingPeopleSearch = "";
let activeWrestlingPeopleLetterFilter = "";
let activeWrestlingPeopleCategoryFilter = "";
let activeWrestlingPersonLightboxContext = null;
let isWrestlingPersonLightboxCloseBridgeBound = false;
let wrestlingMatchLightboxRouteObserver = null;
let wrestlingMatchLightboxRouteSyncFrame = 0;
let wrestlingMatchLightboxRoutePath = "";
let wrestlingVenuesCollection = [];
let wrestlingVenuesRequest = null;
let wrestlingVenuesLoaded = false;
let wrestlingVenuesDataState = "idle";
let activeWrestlingVenueSearch = "";
let activeWrestlingVenueStateFilter = "";

function retryWrestlingShowsState() {
  if (wrestlingShowsRequest) {
    return;
  }

  wrestlingShowsDataRequested = false;
  setWrestlingShowsCollection([], "loading");
  renderWrestlingShowsArchive({ skipDataRequest: true });
  requestWrestlingShowsData();
}

function retryWrestlingPeopleState() {
  wrestlingPeopleLoaded = false;
  if (wrestlingPeopleRequest) {
    return;
  }

  resetWrestlingPeopleSessionCache();
  setWrestlingPeopleCollection([], "loading");
  renderWrestlingPeopleIndex({ skipDataRequest: true });
  requestWrestlingPeopleData();
}

function retryWrestlingVenuesState() {
  wrestlingVenuesLoaded = false;
  if (wrestlingVenuesRequest) {
    return;
  }

  setWrestlingVenuesCollection([], "loading");
  renderWrestlingVenuesIndex({ skipDataRequest: true });
  requestWrestlingVenuesData();
}

function getWrestlingV3StateOptions(scope, stateName, options = {}) {
  const stateOptions = { ...options, scope };
  const retryByScope = {
    wrestlingShows: { label: "Retry Shows", onClick: retryWrestlingShowsState },
    wrestlingPeople: { label: "Retry People", onClick: retryWrestlingPeopleState },
    wrestlingVenues: { label: "Retry Venues", onClick: retryWrestlingVenuesState },
  };
  if (stateOptions.retry === true && stateName === "error" && retryByScope[scope]) {
    stateOptions.retry = retryByScope[scope];
  }
  return stateOptions;
}

function createWrestlingV3StateCard(stateName = "empty", scope = "wrestling", options = {}) {
  const stateOptions = getWrestlingV3StateOptions(scope, stateName, options);
  if (stateName === "loading" && typeof createV3LoadingState === "function") {
    return createV3LoadingState(stateOptions);
  }
  if (stateName === "error" && typeof createV3ErrorState === "function") {
    return createV3ErrorState(stateOptions);
  }
  if (stateName === "empty" && typeof createV3EmptyState === "function") {
    return createV3EmptyState(stateOptions);
  }
  return createV3StateCard(stateName, stateOptions);
}

function renderWrestlingV3State(container, stateName = "empty", scope = "wrestling", options = {}) {
  const stateOptions = getWrestlingV3StateOptions(scope, stateName, options);
  if (stateName === "loading" && typeof renderV3LoadingState === "function") {
    return renderV3LoadingState(container, stateOptions);
  }
  if (stateName === "error" && typeof renderV3ErrorState === "function") {
    return renderV3ErrorState(container, stateOptions);
  }
  if (stateName === "empty" && typeof renderV3EmptyState === "function") {
    return renderV3EmptyState(container, stateOptions);
  }
  return renderV3State(container, stateName, stateOptions);
}

function createWrestlingV3StateItem(stateName = "empty", scope = "wrestling", options = {}) {
  const item = document.createElement(options.itemTag || "li");
  item.className = options.itemClass || "wrestling-state-item";
  item.append(createWrestlingV3StateCard(stateName, scope, options));
  return item;
}

function getWrestlingRequestTimeoutMs(timeoutMs) {
  const baseTimeoutMs = Number.parseInt(timeoutMs, 10);
  const overrideMs = Number.parseInt(window.__V3_FRONTEND_REQUEST_TIMEOUT_MS__, 10);
  if (Number.isFinite(overrideMs) && overrideMs > 0) {
    return Math.max(50, Math.min(Number.isFinite(baseTimeoutMs) && baseTimeoutMs > 0 ? baseTimeoutMs : overrideMs, overrideMs));
  }
  return Number.isFinite(baseTimeoutMs) && baseTimeoutMs > 0 ? baseTimeoutMs : 0;
}

function createWrestlingRequestTimeoutError(label, timeoutMs) {
  const error = new Error(`${label || "Wrestling request"} timed out after ${timeoutMs}ms`);
  error.name = "AbortError";
  return error;
}

function withWrestlingRequestTimeout(request, controller = null, timeoutMs = 0, label = "Wrestling request") {
  const safeTimeoutMs = getWrestlingRequestTimeoutMs(timeoutMs);
  if (!request || !safeTimeoutMs || typeof window.setTimeout !== "function") {
    return request;
  }

  let timeoutId = 0;
  const timeoutRequest = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      if (controller && typeof controller.abort === "function" && !controller.signal?.aborted) {
        controller.abort();
      }
      reject(createWrestlingRequestTimeoutError(label, safeTimeoutMs));
    }, safeTimeoutMs);
  });

  return Promise.race([request, timeoutRequest]).finally(() => {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  });
}

function applyWrestlingGalleryImageLoading(image, index = 0, options = {}) {
  if (!image) {
    return;
  }

  const isFirstVisible = options.firstVisible === true && index === 0;
  image.loading = isFirstVisible ? "eager" : "lazy";
  image.decoding = "async";
  if (!isFirstVisible) {
    image.setAttribute("fetchpriority", "low");
  }
}

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

function getWrestlingMatchRouteSegment(value) {
  return getWrestlingText(value)
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();
}

function getWrestlingMatchRouteRef(match, index = -1) {
  if (match && typeof match === "object") {
    const source = match.backend_record && typeof match.backend_record === "object"
      ? { ...match.backend_record, ...match }
      : match;
    const stableCandidates = [
      source.match_url,
      source.matchUrl,
      source.matchId,
      source.match_id,
      source.id,
      source.slug,
      source.matchRef,
      source.match_ref,
    ];
    for (const candidate of stableCandidates) {
      const routeRef = getWrestlingMatchRouteSegment(candidate);
      if (routeRef) {
        return routeRef;
      }
    }

    const numericFallback = getWrestlingMatchRefNumber(source.matchNumber || source.match_number || source.matchOrder || source.match_order || source.order);
    if (numericFallback) {
      return `match-${numericFallback}`;
    }
    if (Number.isInteger(index) && index >= 0) {
      return `match-${index + 1}`;
    }
  }

  const number = getWrestlingMatchRefNumber(match);
  return number && /^\d+$/.test(String(match || "").trim()) ? `match-${number}` : getWrestlingMatchRouteSegment(match);
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

function isValidWrestlingPosterUrl(value) {
  const poster = getWrestlingText(value);
  return /^(https?:\/\/|data:image\/|\/|\.\.?\/)/i.test(poster);
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
  const sourceMatchUrl = getWrestlingMatchRouteSegment(
    record.match_url ||
    record.matchUrl ||
    record.match_id ||
    record.matchId ||
    record.id ||
    record.slug
  );
  const matchId = sourceMatchUrl || `match-${order}`;
  const photoCount = getWrestlingPhotoCount(record);
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
    match_url: sourceMatchUrl || matchId,
    matchUrl: sourceMatchUrl || matchId,
    venueId: show.venueId,
    matchName: title,
    matchType,
    matchOrder: order,
    matchRef: matchId,
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
    photoCount: getWrestlingPhotoCount(source),
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

function getWrestlingShowsApiUrl(page = 1, options = {}) {
  const apiUrl = new URL(WRESTLING_SHOWS_API_ROUTE, WRESTLING_SHOWS_API_BASE_URL);
  apiUrl.searchParams.set("limit", String(options.limit || WRESTLING_SHOWS_API_LIMIT));
  apiUrl.searchParams.set("page", String(page));
  if (options.includePhotos) {
    apiUrl.searchParams.set("include_photos", "1");
  }
  if (options.search) {
    apiUrl.searchParams.set("search", String(options.search));
  }
  return apiUrl;
}

function getWrestlingPayloadPageCount(payload) {
  const totalPages = Number(payload?.totalPages || payload?.meta?.pagination?.totalPages);
  return Number.isFinite(totalPages) && totalPages > 0 ? Math.trunc(totalPages) : 1;
}

function fetchWrestlingShowsPage(page, signal, options = {}) {
  return withWrestlingRequestTimeout(fetch(getWrestlingShowsApiUrl(page, options), {
    cache: "no-store",
    signal,
  }), null, WRESTLING_SHOWS_TIMEOUT_MS, "Wrestling shows").then((response) => {
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
      } else if (route.name === "wrestling-person-detail") {
        renderWrestlingPersonDetailRoute(route.personId || route.params?.personId);
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
      } else if (route.name === "wrestling-person-detail") {
        renderWrestlingPersonDetailRoute(route.personId || route.params?.personId);
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

function getWrestlingShowIdCandidates(show) {
  return [
    getWrestlingShowRouteCode(show),
    show?.dateKey,
    show?.date_key,
    getWrestlingShowDateKey(show?.rawDate || show?.date || show?.eventDate || show?.show_date),
    show?.showId,
    show?.eventId,
    show?.showKey,
    show?.show_id,
    show?.id,
    ...(Array.isArray(show?.aliases) ? show.aliases : []),
  ].map((candidate) => normalizeWrestlingArchiveSlug(candidate, "")).filter(Boolean);
}

function doesWrestlingShowMatchId(show, showId) {
  const targetId = normalizeWrestlingArchiveSlug(showId, "");
  return Boolean(targetId && getWrestlingShowIdCandidates(show).includes(targetId));
}

function findWrestlingShowInRowsById(rows = [], showId) {
  return (Array.isArray(rows) ? rows : []).find((show) => doesWrestlingShowMatchId(show, showId)) || null;
}

function mergeWrestlingShowIntoCollection(nextShow) {
  if (!nextShow) {
    return null;
  }
  const index = wrestlingShowsCollection.findIndex((show) => (
    getWrestlingShowIdCandidates(nextShow).some((candidate) => doesWrestlingShowMatchId(show, candidate))
  ));
  if (index === -1) {
    wrestlingShowsCollection.push(nextShow);
    return nextShow;
  }
  wrestlingShowsCollection[index] = {
    ...wrestlingShowsCollection[index],
    ...nextShow,
    matches: Array.isArray(nextShow.matches) && nextShow.matches.length > 0
      ? nextShow.matches
      : wrestlingShowsCollection[index].matches,
  };
  return wrestlingShowsCollection[index];
}

function getWrestlingShowPhotoRequestSearch(show, showId) {
  return getWrestlingText(
    show?.showKey ||
    show?.show_key ||
    show?.title ||
    show?.eventName ||
    show?.showName ||
    show?.show_name ||
    showId
  );
}

function requestWrestlingMatchPhotosForRoute(showId, matchRef, show) {
  if (typeof fetch !== "function") {
    return Promise.resolve(false);
  }

  const requestKey = [
    normalizeWrestlingArchiveSlug(showId, ""),
    normalizeWrestlingArchiveSlug(matchRef, ""),
  ].join("|");
  if (wrestlingMatchPhotoRequests.has(requestKey)) {
    return wrestlingMatchPhotoRequests.get(requestKey);
  }

  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), WRESTLING_SHOWS_TIMEOUT_MS)
    : 0;

  const request = fetchWrestlingShowsPage(1, controller?.signal, {
    includePhotos: true,
    limit: 5,
    search: getWrestlingShowPhotoRequestSearch(show, showId),
  })
    .then((payload) => {
      const rows = normalizeLiveWrestlingShows(payload);
      const enrichedShow = findWrestlingShowInRowsById(rows, showId) || rows[0] || null;
      const mergedShow = mergeWrestlingShowIntoCollection(enrichedShow);
      if (!mergedShow) {
        return false;
      }
      const route = typeof getRouteFromUrl === "function" ? getRouteFromUrl() : null;
      if (route?.name === "wrestling-show-detail") {
        renderWrestlingShowDetailRoute(route.dateKey || route.showId || showId, { skipDataRequest: true });
      } else if (route?.name === "wrestling-match-gallery") {
        updateWrestlingMatchGalleryRelationshipHooks(
          route.dateKey || route.showId || showId,
          route.matchRef || route.matchId || matchRef,
          { skipDataRequest: true, skipCanonicalize: true, skipPhotoRequest: true }
        );
      } else if (route?.name === "wrestling-lightbox") {
        updateWrestlingLightboxRelationshipHooks(
          route.dateKey || route.showId || showId,
          route.matchRef || route.matchId || matchRef,
          route.photoId
        );
        openWrestlingMatchPhotoRouteLightbox(
          route.dateKey || route.showId || showId,
          route.matchRef || route.matchId || matchRef,
          route.photoId,
          { skipPhotoRequest: true }
        );
      } else if (route?.name === "wrestling-venue-detail") {
        renderWrestlingVenueDetailRoute(route.venueId, { skipDataRequest: true, skipPhotoRequest: true });
      }
      return true;
    })
    .catch(() => false)
    .finally(() => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    });

  wrestlingMatchPhotoRequests.set(requestKey, request);
  return request;
}

function findLiveWrestlingShowById(showId) {
  return findWrestlingShowInRowsById(wrestlingShowsCollection, showId);
}

function findLiveWrestlingMatchById(matchId, showId = "") {
  const show = findLiveWrestlingShowById(showId);
  const searchRows = show ? show.matches : wrestlingShowsCollection.flatMap((row) => row.matches || []);
  return findWrestlingMatchInRowsByRef(searchRows, matchId);
}

function findWrestlingMatchInRowsByRef(rows = [], matchRef = "") {
  const matchRows = Array.isArray(rows) ? rows : [];
  const targetSlug = normalizeWrestlingArchiveSlug(matchRef, "");
  if (!targetSlug) {
    return null;
  }

  const exactMatch = matchRows.find((match, index) => {
    const source = match?.backend_record && typeof match.backend_record === "object"
      ? { ...match.backend_record, ...match }
      : match;
    const candidates = [
      getWrestlingMatchRouteRef(match, index),
      source?.match_url,
      source?.matchUrl,
      source?.matchId,
      source?.match_id,
      source?.id,
      source?.slug,
    ];
    return candidates
      .map((candidate) => normalizeWrestlingArchiveSlug(candidate, ""))
      .some((candidate) => candidate === targetSlug);
  });
  if (exactMatch) {
    return exactMatch;
  }

  const targetNumber = getWrestlingMatchRefNumber(matchRef);
  if (targetNumber) {
    return matchRows.find((match, index) => {
      const routeRef = getWrestlingMatchRefNumber(getWrestlingMatchRouteRef(match, index));
      const source = match?.backend_record && typeof match.backend_record === "object"
        ? { ...match.backend_record, ...match }
        : match;
      const orderNumber = getWrestlingPositiveNumber(source?.matchOrder || source?.match_order || source?.order) || index + 1;
      return routeRef === targetNumber || orderNumber === targetNumber;
    }) || null;
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

function createWrestlingShowState(stateName, options = {}) {
  const stateCopy = wrestlingShowsStateCopy[stateName] || wrestlingShowsStateCopy.empty;
  const item = document.createElement("li");
  item.className = `wrestling-show-state wrestling-show-state--${stateName}`;
  item.dataset.wrestlingShowsState = stateName;
  item.append(createWrestlingV3StateCard(stateName, "wrestlingShows", {
    title: stateCopy.title,
    text: stateCopy.copy,
    retry: options.retry,
  }));
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

function isHallCrusadesShowsVariantActive() {
  return wrestlingShowsShell?.dataset.wrestlingShowsVariant === "hall-of-crusades";
}

function getHallCrusadesYearFilterRows(rows = getWrestlingShowsIndexRows()) {
  const sourceRows = Array.isArray(rows) ? rows : [];
  if (activeHallCrusadesYearFilter === "Upcoming") {
    const startOfToday = getWrestlingStartOfToday();
    return sourceRows.filter((show) => getWrestlingShowTimestamp(show) >= startOfToday);
  }

  if (/^\d{4}$/.test(activeHallCrusadesYearFilter)) {
    return sourceRows.filter((show) => show.year === activeHallCrusadesYearFilter);
  }

  return sourceRows;
}

function normalizeHallCrusadesBannerFilterValue(value) {
  const nextValue = String(value || "").trim();
  return nextValue && nextValue !== "all" ? nextValue : "all";
}

function getHallCrusadesBannerOptionRows(rows = getWrestlingShowsIndexRows()) {
  return [
    { value: "all", label: "All Banners" },
    ...getWrestlingShowsUniqueOptions(rows, (show) => show.promotion === "Promotion Pending" ? "" : show.promotion)
      .map((promotion) => ({ value: promotion, label: promotion })),
  ];
}

function normalizeActiveHallCrusadesBannerFilter(rows = getWrestlingShowsIndexRows()) {
  if (activeHallCrusadesBannerFilter === "all") {
    return;
  }

  const promotions = new Set(getWrestlingShowsUniqueOptions(rows, (show) => show.promotion === "Promotion Pending" ? "" : show.promotion));
  if (!promotions.has(activeHallCrusadesBannerFilter)) {
    activeHallCrusadesBannerFilter = "all";
  }
}

function getHallCrusadesBannerFilterRows(rows = getWrestlingShowsIndexRows()) {
  const sourceRows = Array.isArray(rows) ? rows : [];
  if (activeHallCrusadesBannerFilter === "all") {
    return sourceRows;
  }

  return sourceRows.filter((show) => show.promotion === activeHallCrusadesBannerFilter);
}


function normalizeHallCrusadesFieldFilterValue(value) {
  const nextValue = String(value || "").trim();
  return nextValue && nextValue !== "all" ? nextValue : "all";
}

function getHallCrusadesFieldOptionValue(show) {
  const field = getWrestlingText(show?.venue);
  if (!field || field === "Venue Pending" || field === "Location Pending" || /^unknown(?: venue| field| location)?$/i.test(field)) {
    return "";
  }
  return field;
}

function getHallCrusadesFieldOptionRows(rows = getWrestlingShowsIndexRows()) {
  return [
    { value: "all", label: "All Fields" },
    ...getWrestlingShowsUniqueOptions(rows, getHallCrusadesFieldOptionValue)
      .map((field) => ({ value: field, label: field })),
  ];
}

function normalizeActiveHallCrusadesFieldFilter(rows = getWrestlingShowsIndexRows()) {
  if (activeHallCrusadesFieldFilter === "all") {
    return;
  }

  const fields = new Set(getWrestlingShowsUniqueOptions(rows, getHallCrusadesFieldOptionValue));
  if (!fields.has(activeHallCrusadesFieldFilter)) {
    activeHallCrusadesFieldFilter = "all";
  }
}

function getHallCrusadesFieldFilterRows(rows = getWrestlingShowsIndexRows()) {
  const sourceRows = Array.isArray(rows) ? rows : [];
  if (activeHallCrusadesFieldFilter === "all") {
    return sourceRows;
  }

  return sourceRows.filter((show) => getHallCrusadesFieldOptionValue(show) === activeHallCrusadesFieldFilter);
}
function getHallCrusadesPosterSourceRows() {
  const rows = getWrestlingShowsIndexRows();
  normalizeActiveHallCrusadesBannerFilter(rows);
  normalizeActiveHallCrusadesFieldFilter(rows);
  return getHallCrusadesFieldFilterRows(getHallCrusadesBannerFilterRows(getHallCrusadesYearFilterRows(rows)));
}

function isHallCrusadesShowAwaitingCommunication(show) {
  const showTimestamp = getWrestlingShowTimestamp(show);
  return Number.isFinite(showTimestamp) && showTimestamp >= getWrestlingStartOfToday();
}

function syncHallCrusadesYearControls() {
  const isYearFiltered = activeHallCrusadesYearFilter !== "";
  const isDrawerVisible = isHallCrusadesShowsVariantActive() && isHallCrusadesYearDrawerOpen;

  if (hallCrusadesYearCrystal) {
    hallCrusadesYearCrystal.classList.toggle("is-active", isYearFiltered);
    hallCrusadesYearCrystal.setAttribute("aria-expanded", String(isDrawerVisible));
    hallCrusadesYearCrystal.setAttribute("aria-pressed", String(isYearFiltered));
    hallCrusadesYearCrystal.dataset.hallCrusadesYearFilter = activeHallCrusadesYearFilter || "all";
  }

  if (hallCrusadesYearDrawer) {
    hallCrusadesYearDrawer.hidden = !isDrawerVisible;
  }

  hallCrusadesYearOptions.forEach((option) => {
    const optionValue = option.dataset.hallCrusadesYearOption || "";
    const isActive = optionValue === activeHallCrusadesYearFilter;
    option.classList.toggle("is-active", isActive);
    option.setAttribute("aria-checked", String(isActive));
  });
}

function setHallCrusadesYearDrawerOpen(isOpen) {
  isHallCrusadesYearDrawerOpen = Boolean(isOpen && isHallCrusadesShowsVariantActive());
  if (isHallCrusadesYearDrawerOpen) {
    isHallCrusadesBannerDrawerOpen = false;
    syncHallCrusadesBannerControls();
    isHallCrusadesFieldDrawerOpen = false;
    syncHallCrusadesFieldControls();
  }
  syncHallCrusadesYearControls();
}

function updateHallCrusadesYearFilter(value) {
  const nextValue = String(value || "").trim();
  if (nextValue !== activeHallCrusadesYearFilter) {
    activeHallCrusadesYearFilter = nextValue;
    hallCrusadesPosterActiveIndex = 0;
    if (hallCrusadesPosterStrip) {
      delete hallCrusadesPosterStrip.dataset.hallCrusadesFlowDirection;
    }
  }

  setHallCrusadesYearDrawerOpen(false);
  renderHallCrusadesPosterStrip();
}

function handleHallCrusadesYearCrystalClick(event) {
  if (!isHallCrusadesShowsVariantActive()) {
    return;
  }

  event.preventDefault();
  setHallCrusadesYearDrawerOpen(!isHallCrusadesYearDrawerOpen);
}

function handleHallCrusadesYearOptionClick(event) {
  updateHallCrusadesYearFilter(event.currentTarget?.dataset?.hallCrusadesYearOption || "");
}

function handleHallCrusadesYearDocumentClick(event) {
  if (!isHallCrusadesYearDrawerOpen) {
    return;
  }

  const crystalGroup = hallCrusadesYearCrystal?.closest(".hall-crusades-archive-crystals");
  if (crystalGroup?.contains(event.target)) {
    return;
  }

  setHallCrusadesYearDrawerOpen(false);
}

function handleHallCrusadesYearKeydown(event) {
  if (event.key === "Escape" && isHallCrusadesYearDrawerOpen) {
    event.preventDefault();
    setHallCrusadesYearDrawerOpen(false);
    hallCrusadesYearCrystal?.focus();
  }
}

function bindHallCrusadesYearCrystalInteraction() {
  if (isHallCrusadesYearCrystalInteractionBound) {
    return;
  }

  isHallCrusadesYearCrystalInteractionBound = true;
  hallCrusadesYearCrystal?.addEventListener("click", handleHallCrusadesYearCrystalClick);
  hallCrusadesYearOptions.forEach((option) => {
    option.addEventListener("click", handleHallCrusadesYearOptionClick);
  });
  document.addEventListener("click", handleHallCrusadesYearDocumentClick, true);
  document.addEventListener("keydown", handleHallCrusadesYearKeydown);
  syncHallCrusadesYearControls();
}


function renderHallCrusadesBannerOptions() {
  if (!hallCrusadesBannerDrawer) {
    return;
  }

  const optionRows = getHallCrusadesBannerOptionRows(getWrestlingShowsIndexRows());
  const signature = optionRows.map((option) => `${option.value}\u0000${option.label}`).join("\u0001");
  if (hallCrusadesBannerDrawer.dataset.optionsSignature === signature) {
    return;
  }

  const fragment = document.createDocumentFragment();
  optionRows.forEach((optionRow) => {
    const option = document.createElement("button");
    option.className = "hall-crusades-year-drawer__option";
    option.type = "button";
    option.setAttribute("role", "menuitemradio");
    option.setAttribute("aria-checked", "false");
    option.dataset.hallCrusadesBannerOption = optionRow.value;
    option.textContent = optionRow.label;
    fragment.append(option);
  });
  hallCrusadesBannerDrawer.replaceChildren(fragment);
  hallCrusadesBannerDrawer.dataset.optionsSignature = signature;
}

function syncHallCrusadesBannerControls() {
  normalizeActiveHallCrusadesBannerFilter(getWrestlingShowsIndexRows());
  renderHallCrusadesBannerOptions();
  const isBannerFiltered = activeHallCrusadesBannerFilter !== "all";
  const isDrawerVisible = isHallCrusadesShowsVariantActive() && isHallCrusadesBannerDrawerOpen;

  if (hallCrusadesBannerCrystal) {
    hallCrusadesBannerCrystal.classList.toggle("is-active", isBannerFiltered);
    hallCrusadesBannerCrystal.setAttribute("aria-expanded", String(isDrawerVisible));
    hallCrusadesBannerCrystal.setAttribute("aria-pressed", String(isBannerFiltered));
    hallCrusadesBannerCrystal.setAttribute("aria-label", isBannerFiltered
      ? `Banner archive query: ${activeHallCrusadesBannerFilter}`
      : "Banner archive query: All Banners");
    hallCrusadesBannerCrystal.dataset.hallCrusadesBannerFilter = activeHallCrusadesBannerFilter;
  }

  if (hallCrusadesBannerDrawer) {
    hallCrusadesBannerDrawer.hidden = !isDrawerVisible;
  }

  hallCrusadesBannerDrawer?.querySelectorAll("[data-hall-crusades-banner-option]").forEach((option) => {
    const optionValue = normalizeHallCrusadesBannerFilterValue(option.dataset.hallCrusadesBannerOption);
    const isActive = optionValue === activeHallCrusadesBannerFilter;
    option.classList.toggle("is-active", isActive);
    option.setAttribute("aria-checked", String(isActive));
  });
}

function setHallCrusadesBannerDrawerOpen(isOpen) {
  isHallCrusadesBannerDrawerOpen = Boolean(isOpen && isHallCrusadesShowsVariantActive());
  if (isHallCrusadesBannerDrawerOpen) {
    isHallCrusadesYearDrawerOpen = false;
    syncHallCrusadesYearControls();
    isHallCrusadesFieldDrawerOpen = false;
    syncHallCrusadesFieldControls();
  }
  syncHallCrusadesBannerControls();
}

function updateHallCrusadesBannerFilter(value) {
  const nextValue = normalizeHallCrusadesBannerFilterValue(value);
  if (nextValue !== activeHallCrusadesBannerFilter) {
    activeHallCrusadesBannerFilter = nextValue;
    hallCrusadesPosterActiveIndex = 0;
    if (hallCrusadesPosterStrip) {
      delete hallCrusadesPosterStrip.dataset.hallCrusadesFlowDirection;
    }
  }

  setHallCrusadesBannerDrawerOpen(false);
  renderHallCrusadesPosterStrip();
}

function handleHallCrusadesBannerCrystalClick(event) {
  if (!isHallCrusadesShowsVariantActive()) {
    return;
  }

  event.preventDefault();
  setHallCrusadesBannerDrawerOpen(!isHallCrusadesBannerDrawerOpen);
}

function handleHallCrusadesBannerDrawerClick(event) {
  const option = event.target?.closest?.("[data-hall-crusades-banner-option]");
  if (!option || !hallCrusadesBannerDrawer?.contains(option)) {
    return;
  }

  updateHallCrusadesBannerFilter(option.dataset.hallCrusadesBannerOption);
}

function handleHallCrusadesBannerDocumentClick(event) {
  if (!isHallCrusadesBannerDrawerOpen) {
    return;
  }

  const crystalGroup = hallCrusadesBannerCrystal?.closest(".hall-crusades-archive-crystals");
  if (crystalGroup?.contains(event.target)) {
    return;
  }

  setHallCrusadesBannerDrawerOpen(false);
}

function handleHallCrusadesBannerKeydown(event) {
  if (event.key === "Escape" && isHallCrusadesBannerDrawerOpen) {
    event.preventDefault();
    setHallCrusadesBannerDrawerOpen(false);
    hallCrusadesBannerCrystal?.focus();
  }
}

function bindHallCrusadesBannerCrystalInteraction() {
  if (isHallCrusadesBannerCrystalInteractionBound) {
    return;
  }

  isHallCrusadesBannerCrystalInteractionBound = true;
  hallCrusadesBannerCrystal?.addEventListener("click", handleHallCrusadesBannerCrystalClick);
  hallCrusadesBannerDrawer?.addEventListener("click", handleHallCrusadesBannerDrawerClick);
  document.addEventListener("click", handleHallCrusadesBannerDocumentClick, true);
  document.addEventListener("keydown", handleHallCrusadesBannerKeydown);
  syncHallCrusadesBannerControls();
}


function renderHallCrusadesFieldOptions() {
  if (!hallCrusadesFieldDrawer) {
    return;
  }

  const optionRows = getHallCrusadesFieldOptionRows(getWrestlingShowsIndexRows());
  const signature = optionRows.map((option) => `${option.value}\u0000${option.label}`).join("\u0001");
  if (hallCrusadesFieldDrawer.dataset.optionsSignature === signature) {
    return;
  }

  const fragment = document.createDocumentFragment();
  optionRows.forEach((optionRow) => {
    const option = document.createElement("button");
    option.className = "hall-crusades-year-drawer__option";
    option.type = "button";
    option.setAttribute("role", "menuitemradio");
    option.setAttribute("aria-checked", "false");
    option.dataset.hallCrusadesFieldOption = optionRow.value;
    option.textContent = optionRow.label;
    fragment.append(option);
  });
  hallCrusadesFieldDrawer.replaceChildren(fragment);
  hallCrusadesFieldDrawer.dataset.optionsSignature = signature;
}

function syncHallCrusadesFieldControls() {
  normalizeActiveHallCrusadesFieldFilter(getWrestlingShowsIndexRows());
  renderHallCrusadesFieldOptions();
  const isFieldFiltered = activeHallCrusadesFieldFilter !== "all";
  const isDrawerVisible = isHallCrusadesShowsVariantActive() && isHallCrusadesFieldDrawerOpen;

  if (hallCrusadesFieldCrystal) {
    hallCrusadesFieldCrystal.classList.toggle("is-active", isFieldFiltered);
    hallCrusadesFieldCrystal.setAttribute("aria-expanded", String(isDrawerVisible));
    hallCrusadesFieldCrystal.setAttribute("aria-pressed", String(isFieldFiltered));
    hallCrusadesFieldCrystal.setAttribute("aria-label", isFieldFiltered
      ? `Field archive query: ${activeHallCrusadesFieldFilter}`
      : "Field archive query: All Fields");
    hallCrusadesFieldCrystal.dataset.hallCrusadesFieldFilter = activeHallCrusadesFieldFilter;
  }

  if (hallCrusadesFieldDrawer) {
    hallCrusadesFieldDrawer.hidden = !isDrawerVisible;
  }

  hallCrusadesFieldDrawer?.querySelectorAll("[data-hall-crusades-field-option]").forEach((option) => {
    const optionValue = normalizeHallCrusadesFieldFilterValue(option.dataset.hallCrusadesFieldOption);
    const isActive = optionValue === activeHallCrusadesFieldFilter;
    option.classList.toggle("is-active", isActive);
    option.setAttribute("aria-checked", String(isActive));
  });
}

function setHallCrusadesFieldDrawerOpen(isOpen) {
  isHallCrusadesFieldDrawerOpen = Boolean(isOpen && isHallCrusadesShowsVariantActive());
  if (isHallCrusadesFieldDrawerOpen) {
    isHallCrusadesYearDrawerOpen = false;
    isHallCrusadesBannerDrawerOpen = false;
    syncHallCrusadesYearControls();
    syncHallCrusadesBannerControls();
  }
  syncHallCrusadesFieldControls();
}

function updateHallCrusadesFieldFilter(value) {
  const nextValue = normalizeHallCrusadesFieldFilterValue(value);
  if (nextValue !== activeHallCrusadesFieldFilter) {
    activeHallCrusadesFieldFilter = nextValue;
    hallCrusadesPosterActiveIndex = 0;
    if (hallCrusadesPosterStrip) {
      delete hallCrusadesPosterStrip.dataset.hallCrusadesFlowDirection;
    }
  }

  setHallCrusadesFieldDrawerOpen(false);
  renderHallCrusadesPosterStrip();
}

function handleHallCrusadesFieldCrystalClick(event) {
  if (!isHallCrusadesShowsVariantActive()) {
    return;
  }

  event.preventDefault();
  setHallCrusadesFieldDrawerOpen(!isHallCrusadesFieldDrawerOpen);
}

function handleHallCrusadesFieldDrawerClick(event) {
  const option = event.target?.closest?.("[data-hall-crusades-field-option]");
  if (!option || !hallCrusadesFieldDrawer?.contains(option)) {
    return;
  }

  updateHallCrusadesFieldFilter(option.dataset.hallCrusadesFieldOption);
}

function handleHallCrusadesFieldDocumentClick(event) {
  if (!isHallCrusadesFieldDrawerOpen) {
    return;
  }

  const crystalGroup = hallCrusadesFieldCrystal?.closest(".hall-crusades-archive-crystals");
  if (crystalGroup?.contains(event.target)) {
    return;
  }

  setHallCrusadesFieldDrawerOpen(false);
}

function handleHallCrusadesFieldKeydown(event) {
  if (event.key === "Escape" && isHallCrusadesFieldDrawerOpen) {
    event.preventDefault();
    setHallCrusadesFieldDrawerOpen(false);
    hallCrusadesFieldCrystal?.focus();
  }
}

function bindHallCrusadesFieldCrystalInteraction() {
  if (isHallCrusadesFieldCrystalInteractionBound) {
    return;
  }

  isHallCrusadesFieldCrystalInteractionBound = true;
  hallCrusadesFieldCrystal?.addEventListener("click", handleHallCrusadesFieldCrystalClick);
  hallCrusadesFieldDrawer?.addEventListener("click", handleHallCrusadesFieldDrawerClick);
  document.addEventListener("click", handleHallCrusadesFieldDocumentClick, true);
  document.addEventListener("keydown", handleHallCrusadesFieldKeydown);
  syncHallCrusadesFieldControls();
}

function normalizeHallCrusadesPosterActiveIndex(total) {
  if (total <= 0) {
    hallCrusadesPosterActiveIndex = HALL_CRUSADES_POSTER_ACTIVE_SLOT;
    return;
  }
  const activeIndex = Number.isFinite(hallCrusadesPosterActiveIndex)
    ? Math.trunc(hallCrusadesPosterActiveIndex)
    : HALL_CRUSADES_POSTER_ACTIVE_SLOT;
  hallCrusadesPosterActiveIndex = ((activeIndex % total) + total) % total;
}

function getHallCrusadesPosterWindowRows(rows) {
  const sourceRows = Array.isArray(rows) ? rows : [];
  const total = sourceRows.length;
  const limit = Math.min(total, HALL_CRUSADES_POSTER_STRIP_LIMIT);
  if (limit === 0) {
    return [];
  }

  normalizeHallCrusadesPosterActiveIndex(total);
  const activeSlot = Math.floor(limit / 2);
  return Array.from({ length: limit }, (_, slotIndex) => {
    const sourceIndex = (hallCrusadesPosterActiveIndex + slotIndex - activeSlot + total) % total;
    return {
      show: sourceRows[sourceIndex],
      sourceIndex,
      isActive: slotIndex === activeSlot,
    };
  });
}

function advanceHallCrusadesPosterActive(direction) {
  const rows = getHallCrusadesPosterSourceRows();
  const total = rows.length;
  if (!isHallCrusadesShowsVariantActive() || total < 2) {
    return false;
  }

  normalizeHallCrusadesPosterActiveIndex(total);
  const nextIndex = (hallCrusadesPosterActiveIndex + direction + total) % total;
  if (nextIndex === hallCrusadesPosterActiveIndex) {
    return false;
  }

  hallCrusadesPosterActiveIndex = nextIndex;
  if (hallCrusadesPosterStrip) {
    hallCrusadesPosterStrip.dataset.hallCrusadesFlowDirection = direction > 0 ? "next" : "previous";
  }
  renderHallCrusadesPosterStrip();
  return true;
}

function handleHallCrusadesPosterPointerDown(event) {
  if (!isHallCrusadesShowsVariantActive() || event.pointerType === "mouse") {
    return;
  }
  hallCrusadesPosterPointerId = event.pointerId;
  hallCrusadesPosterPointerStartX = event.clientX;
  hallCrusadesPosterPointerStartY = event.clientY;
  try {
    hallCrusadesPosterStrip?.setPointerCapture?.(event.pointerId);
  } catch (error) {
    // Pointer capture is optional; swipe handling still works without it.
  }
}

function handleHallCrusadesPosterPointerMove(event) {
  if (event.pointerId !== hallCrusadesPosterPointerId) {
    return;
  }
  const deltaX = event.clientX - hallCrusadesPosterPointerStartX;
  const deltaY = event.clientY - hallCrusadesPosterPointerStartY;
  if (Math.abs(deltaX) > 12 && Math.abs(deltaX) > Math.abs(deltaY)) {
    event.preventDefault();
  }
}

function handleHallCrusadesPosterPointerEnd(event) {
  if (event.pointerId !== hallCrusadesPosterPointerId) {
    return;
  }

  const deltaX = event.clientX - hallCrusadesPosterPointerStartX;
  const deltaY = event.clientY - hallCrusadesPosterPointerStartY;
  hallCrusadesPosterPointerId = null;
  try {
    hallCrusadesPosterStrip?.releasePointerCapture?.(event.pointerId);
  } catch (error) {
    // Ignore missing pointer capture on synthetic or cancelled touch streams.
  }

  if (Math.abs(deltaX) < HALL_CRUSADES_POSTER_SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) {
    return;
  }

  hallCrusadesPosterSuppressClick = advanceHallCrusadesPosterActive(deltaX < 0 ? 1 : -1);
  if (hallCrusadesPosterSuppressClick) {
    window.clearTimeout(hallCrusadesPosterSuppressClickTimer);
    hallCrusadesPosterSuppressClickTimer = window.setTimeout(() => {
      hallCrusadesPosterSuppressClick = false;
      hallCrusadesPosterSuppressClickTimer = 0;
    }, 0);
    event.preventDefault();
  }
}

function handleHallCrusadesPosterClick(event) {
  if (!hallCrusadesPosterSuppressClick) {
    return;
  }
  hallCrusadesPosterSuppressClick = false;
  window.clearTimeout(hallCrusadesPosterSuppressClickTimer);
  hallCrusadesPosterSuppressClickTimer = 0;
  event.preventDefault();
  event.stopImmediatePropagation();
}

function handleHallCrusadesPosterWheel(event) {
  if (!isHallCrusadesShowsVariantActive()) {
    return;
  }

  const absX = Math.abs(event.deltaX);
  const absY = Math.abs(event.deltaY);
  const isDesktopWheel = typeof window === "undefined"
    || typeof window.matchMedia !== "function"
    || window.matchMedia("(min-width: 760px)").matches;
  const horizontalDelta = absX > absY
    ? event.deltaX
    : isDesktopWheel && event.shiftKey
      ? event.deltaY
      : 0;
  if (Math.abs(horizontalDelta) < 1) {
    return;
  }

  event.preventDefault();
  hallCrusadesPosterWheelDelta += horizontalDelta;
  if (Math.abs(hallCrusadesPosterWheelDelta) < HALL_CRUSADES_POSTER_WHEEL_THRESHOLD) {
    return;
  }

  advanceHallCrusadesPosterActive(hallCrusadesPosterWheelDelta > 0 ? 1 : -1);
  hallCrusadesPosterWheelDelta = 0;
}

function bindHallCrusadesPosterStripInteraction() {
  if (!hallCrusadesPosterStrip || isHallCrusadesPosterStripInteractionBound) {
    return;
  }

  isHallCrusadesPosterStripInteractionBound = true;
  hallCrusadesPosterStrip.addEventListener("pointerdown", handleHallCrusadesPosterPointerDown);
  hallCrusadesPosterStrip.addEventListener("pointermove", handleHallCrusadesPosterPointerMove, { passive: false });
  hallCrusadesPosterStrip.addEventListener("pointerup", handleHallCrusadesPosterPointerEnd);
  hallCrusadesPosterStrip.addEventListener("pointercancel", handleHallCrusadesPosterPointerEnd);
  hallCrusadesPosterStrip.addEventListener("click", handleHallCrusadesPosterClick, true);
  hallCrusadesPosterStrip.addEventListener("wheel", handleHallCrusadesPosterWheel, { passive: false });
}

function createHallCrusadesPosterStripItem(show, index = 0, options = {}) {
  const item = document.createElement("li");
  item.className = "hall-crusades-poster-strip__item";
  item.dataset.wrestlingShowId = show.showId;
  item.dataset.wrestlingShowIndex = String(options.sourceIndex ?? index);
  const isAwaitingCommunication = isHallCrusadesShowAwaitingCommunication(show);
  if (isAwaitingCommunication) {
    item.classList.add("is-awaiting-communication");
    item.dataset.hallCrusadesAwaitingCommunication = "true";
  }

  if (options.isActive) {
    item.classList.add("is-active");
  }

  const showRoute = getWrestlingShowRouteUrl(show);
  const record = document.createElement("button");
  record.className = "hall-crusades-poster-strip__record";
  record.type = "button";
  record.dataset.wrestlingShowRoute = showRoute;
  if (isAwaitingCommunication) {
    record.classList.add("is-awaiting-communication");
    record.dataset.hallCrusadesAwaitingCommunication = "true";
  }
  record.setAttribute("aria-label", `Open ${show.title}`);
  if (options.isActive) {
    record.setAttribute("aria-current", "true");
  }
  setWrestlingRelationshipDataset(record, show);

  const posterImage = document.createElement("img");
  posterImage.className = "hall-crusades-poster-strip__image";
  posterImage.alt = "";
  posterImage.loading = options.isActive || index === 0 ? "eager" : "lazy";
  posterImage.decoding = "async";
  posterImage.hidden = true;

  const posterFallback = document.createElement("span");
  posterFallback.className = "hall-crusades-poster-strip__fallback";
  posterFallback.textContent = getWrestlingShowPosterLabel(show);

  const posterUrl = getWrestlingText(show.poster);
  if (isValidWrestlingPosterUrl(posterUrl)) {
    record.classList.add("has-poster");
    posterImage.src = posterUrl;
    posterImage.hidden = false;
    posterImage.addEventListener("error", () => {
      record.classList.remove("has-poster");
      posterImage.hidden = true;
      posterImage.removeAttribute("src");
    }, { once: true });
  }

  record.append(posterImage, posterFallback);
  record.addEventListener("click", () => {
    navigateToRoute(showRoute, {
      historyState: { fromWrestlingShowsIndex: true },
    });
  });

  item.append(record);
  return item;
}

function clearHallCrusadesCampaignInfoPanel() {
  if (!hallCrusadesCampaignInfoPanel) {
    return;
  }

  hallCrusadesCampaignInfoPanel.hidden = true;
  hallCrusadesCampaignInfoPanel.replaceChildren();
  hallCrusadesCampaignInfoPanel.setAttribute("aria-label", "Campaign Information");
  delete hallCrusadesCampaignInfoPanel.dataset.wrestlingShowId;
  delete hallCrusadesCampaignInfoPanel.dataset.wrestlingShowRoute;
  hallCrusadesCampaignInfoPanel.classList.remove("is-awaiting-communication");
  delete hallCrusadesCampaignInfoPanel.dataset.hallCrusadesAwaitingCommunication;
}

function createHallCrusadesCampaignInfoText(className, text, tagName = "span") {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function getHallCrusadesCampaignCountText(count, singularLabel, pluralLabel) {
  const number = Number.parseInt(count, 10) || 0;
  return formatWrestlingCount(number, number === 1 ? singularLabel : pluralLabel);
}

function renderHallCrusadesCampaignInfoPanel(show) {
  if (!hallCrusadesCampaignInfoPanel || !isHallCrusadesShowsVariantActive() || !show) {
    clearHallCrusadesCampaignInfoPanel();
    return;
  }

  const title = getWrestlingText(show.title || show.showName, "Campaign Pending");
  const promotion = getWrestlingText(show.promotion, "Promotion Pending");
  const date = getWrestlingText(show.eventDate || formatWrestlingShowDate(show.rawDate || show.date || show.dateKey), "Date Pending");
  const venue = getWrestlingText(show.venue, "Venue Pending");
  const location = getWrestlingText(show.location || getWrestlingShowLocation(show), "Location Pending");
  const matchCount = Number.parseInt(show.matchCount, 10) || getWrestlingArray(show.matches).length;
  const showRoute = getWrestlingShowRouteUrl(show);
  const isAwaitingCommunication = isHallCrusadesShowAwaitingCommunication(show);

  const promotionElement = createHallCrusadesCampaignInfoText("hall-crusades-campaign-info-panel__promotion", promotion, "p");
  const titleElement = createHallCrusadesCampaignInfoText("hall-crusades-campaign-info-panel__title", title, "h3");
  const topSeparator = createHallCrusadesCampaignInfoText("hall-crusades-campaign-info-panel__separator", "", "span");
  topSeparator.setAttribute("aria-hidden", "true");

  const venueBlock = document.createElement("div");
  venueBlock.className = "hall-crusades-campaign-info-panel__venue-block";
  venueBlock.dataset.hallCrusadesVenueBlock = "";
  venueBlock.append(
    createHallCrusadesCampaignInfoText("hall-crusades-campaign-info-panel__venue", venue, "p"),
    createHallCrusadesCampaignInfoText("hall-crusades-campaign-info-panel__location", location, "p")
  );

  const dateElement = createHallCrusadesCampaignInfoText("hall-crusades-campaign-info-panel__date", date, "p");
  const bottomSeparator = createHallCrusadesCampaignInfoText("hall-crusades-campaign-info-panel__separator", "", "span");
  bottomSeparator.setAttribute("aria-hidden", "true");
  const segmentCount = createHallCrusadesCampaignInfoText(
    "hall-crusades-campaign-info-panel__segment-count",
    getHallCrusadesCampaignCountText(matchCount, "Segment", "Segments"),
    "p"
  );

  hallCrusadesCampaignInfoPanel.hidden = false;
  hallCrusadesCampaignInfoPanel.dataset.wrestlingShowId = show.showId;
  hallCrusadesCampaignInfoPanel.dataset.wrestlingShowRoute = showRoute;
  hallCrusadesCampaignInfoPanel.classList.toggle("is-awaiting-communication", isAwaitingCommunication);
  if (isAwaitingCommunication) {
    hallCrusadesCampaignInfoPanel.dataset.hallCrusadesAwaitingCommunication = "true";
  } else {
    delete hallCrusadesCampaignInfoPanel.dataset.hallCrusadesAwaitingCommunication;
  }
  hallCrusadesCampaignInfoPanel.setAttribute("aria-label", `Campaign Information: ${title}`);
  hallCrusadesCampaignInfoPanel.replaceChildren(
    promotionElement,
    titleElement,
    topSeparator,
    venueBlock,
    dateElement,
    bottomSeparator,
    segmentCount
  );
}

function renderHallCrusadesPosterStrip() {
  if (!hallCrusadesPosterStrip) {
    clearHallCrusadesCampaignInfoPanel();
    return;
  }

  if (!isHallCrusadesShowsVariantActive() || wrestlingShowsDataState !== "live") {
    setHallCrusadesYearDrawerOpen(false);
    setHallCrusadesBannerDrawerOpen(false);
    setHallCrusadesFieldDrawerOpen(false);
    hallCrusadesPosterStrip.hidden = true;
    hallCrusadesPosterStrip.replaceChildren();
    clearHallCrusadesCampaignInfoPanel();
    return;
  }

  bindHallCrusadesYearCrystalInteraction();
  bindHallCrusadesBannerCrystalInteraction();
  bindHallCrusadesFieldCrystalInteraction();
  bindHallCrusadesPosterStripInteraction();
  const posterSourceRows = getHallCrusadesPosterSourceRows();
  const posterRows = getHallCrusadesPosterWindowRows(posterSourceRows);
  const activeShow = posterSourceRows[hallCrusadesPosterActiveIndex] || null;
  hallCrusadesPosterStrip.hidden = posterRows.length === 0;
  renderHallCrusadesCampaignInfoPanel(activeShow);
  const fragment = document.createDocumentFragment();
  posterRows.forEach((row, index) => {
    fragment.append(createHallCrusadesPosterStripItem(row.show, index, row));
  });
  hallCrusadesPosterStrip.dataset.hallCrusadesActiveIndex = String(hallCrusadesPosterActiveIndex);
  hallCrusadesPosterStrip.dataset.hallCrusadesYearFilter = activeHallCrusadesYearFilter || "all";
  hallCrusadesPosterStrip.dataset.hallCrusadesBannerFilter = activeHallCrusadesBannerFilter;
  hallCrusadesPosterStrip.dataset.hallCrusadesFieldFilter = activeHallCrusadesFieldFilter;
  hallCrusadesPosterStrip.replaceChildren(fragment);
  syncHallCrusadesYearControls();
  syncHallCrusadesBannerControls();
  syncHallCrusadesFieldControls();
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
  const posterImage = document.createElement("img");
  posterImage.className = "wrestling-show-poster-image";
  posterImage.alt = "";
  posterImage.loading = "lazy";
  posterImage.decoding = "async";
  posterImage.hidden = true;
  const posterLabel = document.createElement("span");
  posterLabel.className = "wrestling-show-poster-fallback";
  posterLabel.textContent = getWrestlingShowPosterLabel(show);
  const posterUrl = getWrestlingText(show.poster);
  if (isValidWrestlingPosterUrl(posterUrl)) {
    poster.classList.add("has-poster");
    posterImage.src = posterUrl;
    posterImage.hidden = false;
    posterImage.addEventListener("error", () => {
      poster.classList.remove("has-poster");
      posterImage.hidden = true;
      posterImage.removeAttribute("src");
    }, { once: true });
  }
  poster.append(posterImage, posterLabel);

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

  cancelWrestlingPeopleBackgroundHydrationIfRouteUnneeded();

  if (!options.skipDataRequest && wrestlingShowsDataState !== "live" && !wrestlingShowsRequest && !wrestlingShowsDataRequested) {
    requestWrestlingShowsData();
  }

  syncWrestlingShowsControls();
  renderHallCrusadesPosterStrip();
  wrestlingShowList.replaceChildren();

  if (wrestlingShowsDataState === "loading" || wrestlingShowsDataState === "idle") {
    wrestlingShowList.append(createWrestlingShowState("loading"));
    return;
  }

  if (wrestlingShowsDataState === "error") {
    wrestlingShowList.append(createWrestlingShowState("error", { retry: true }));
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

function getWrestlingShowGalleryCountInfo(show, galleryMatch) {
  const declaredMatchCount = getWrestlingDeclaredMatchPhotoCount(galleryMatch);
  if (declaredMatchCount > 0) {
    return {
      label: formatWrestlingCount(declaredMatchCount, "Photos"),
      state: "total",
    };
  }

  const renderedPhotoCount = getWrestlingMatchPhotoItems(galleryMatch).length;
  if (renderedPhotoCount > 0) {
    return {
      label: formatWrestlingCount(renderedPhotoCount, "Preview Photos"),
      state: "preview",
    };
  }

  const sourcePhotoCount = getWrestlingPhotoCount(galleryMatch);
  if (sourcePhotoCount > 0) {
    return {
      label: formatWrestlingCount(sourcePhotoCount, "Preview Photos"),
      state: "preview",
    };
  }

  const sourcePhotoIds = getWrestlingMatchSourcePhotoIds(galleryMatch);
  if (sourcePhotoIds.length > 0) {
    return {
      label: formatWrestlingCount(sourcePhotoIds.length, "Preview Photos"),
      state: "preview",
    };
  }

  const eventPhotoCount = getWrestlingPhotoCount(show);
  if (eventPhotoCount !== null && eventPhotoCount > 0) {
    return {
      label: formatWrestlingCount(eventPhotoCount, "Event Photos"),
      state: "event",
    };
  }

  return {
    label: formatWrestlingCount(0, "Photos"),
    state: "empty",
  };
}

function createWrestlingShowGalleryCard(show, matches = []) {
  const matchRows = Array.isArray(matches) ? matches : [];
  const galleryMatchId = show?.galleryMatchId || show?.gallery_match_id || show?.matchIds?.[0] || show?.match_ids?.[0] || "";
  const galleryMatch = findWrestlingMatchInRowsByRef(matchRows, galleryMatchId) || matchRows[0];
  if (!galleryMatch) {
    return null;
  }

  const galleryMatchIndex = matchRows.indexOf(galleryMatch);
  const galleryMatchRef = getWrestlingMatchRouteRef(galleryMatch, galleryMatchIndex);
  const galleryRoute = getWrestlingMatchRouteUrlByIds(show, galleryMatchRef);
  const countInfo = getWrestlingShowGalleryCountInfo(show, galleryMatch);

  const gallerySection = document.createElement("section");
  gallerySection.className = "wrestling-gallery-card";
  gallerySection.dataset.wrestlingPhotoCountState = countInfo.state;
  gallerySection.setAttribute("aria-labelledby", "wrestling-gallery-title");

  const copy = document.createElement("div");
  copy.className = "wrestling-gallery-copy";

  const title = document.createElement("h3");
  title.className = "wrestling-gallery-title";
  title.id = "wrestling-gallery-title";
  title.textContent = "Photo Gallery";

  const count = document.createElement("p");
  count.className = "wrestling-gallery-count";
  count.textContent = countInfo.label;
  copy.append(title, count);

  const button = document.createElement("button");
  button.className = "wrestling-gallery-button";
  button.type = "button";
  button.textContent = "Open Gallery";
  button.dataset.wrestlingMatchRef = galleryMatchRef;
  button.dataset.wrestlingShowRoute = getWrestlingShowRouteUrl(show);
  button.dataset.wrestlingMatchRoute = galleryRoute;
  setWrestlingRelationshipDataset(button, {
    ...galleryMatch,
    showId: show?.showId || show?.eventId || galleryMatch.showId,
    matchId: galleryMatchRef || galleryMatch.matchId,
  });
  button.addEventListener("click", () => navigateToRoute(galleryRoute));

  gallerySection.append(copy, button);
  return gallerySection;
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
  const copy = wrestlingShowsStateCopy[stateName] || wrestlingShowsStateCopy.empty;

  stateSection.append(createWrestlingV3StateCard(stateName, "wrestlingShows", {
    detail: showId ? `Route: ${showId}` : "",
    title: stateName === "empty" && showId
      ? "Archive Record Unavailable"
      : stateName === "error"
        ? "Unable To Load Archive Data"
        : copy.title,
    text: stateName === "empty" && showId
      ? "No matching archive record was found."
      : stateName === "error"
        ? "Unable to load archive data."
        : copy.copy,
    retry: stateName === "error",
  }));
  wrestlingShowDetailShell.replaceChildren(backButton, stateSection);
}

function renderWrestlingShowDetailRoute(showId = "warzone-26", options = {}) {
  if (!wrestlingShowDetailShell) {
    return;
  }

  cancelWrestlingPeopleBackgroundHydrationIfRouteUnneeded();

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
  const posterImage = document.createElement("img");
  posterImage.className = "wrestling-detail-poster-image";
  posterImage.alt = "";
  posterImage.loading = "eager";
  posterImage.decoding = "async";
  posterImage.hidden = true;
  const posterLabel = document.createElement("span");
  posterLabel.className = "wrestling-detail-poster-fallback";
  posterLabel.textContent = getWrestlingShowPosterLabel(show);
  const posterUrl = getWrestlingText(show.poster);
  if (isValidWrestlingPosterUrl(posterUrl)) {
    poster.classList.add("has-poster");
    posterImage.src = posterUrl;
    posterImage.hidden = false;
    posterImage.addEventListener("error", () => {
      poster.classList.remove("has-poster");
      posterImage.hidden = true;
      posterImage.removeAttribute("src");
    }, { once: true });
  }
  poster.append(posterImage, posterLabel);

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
    createWrestlingDetailFact("Location", show.location)
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
    emptyMatch.append(createWrestlingV3StateCard("empty", "wrestlingShows", {
      small: true,
      text: "No matches listed for this event.",
    }));
    matchList.append(emptyMatch);
  }
  detailSection.append(matchTitle, matchList);

  const gallerySection = createWrestlingShowGalleryCard(show, matches);
  wrestlingShowDetailShell.replaceChildren(backButton, hero, detailSection);
  if (gallerySection) {
    wrestlingShowDetailShell.append(gallerySection);
  }

  if (!options.skipPhotoRequest && matches.length > 0) {
    const galleryMatchId = show?.galleryMatchId || show?.gallery_match_id || show?.matchIds?.[0] || show?.match_ids?.[0] || "";
    const galleryMatch = findWrestlingMatchInRowsByRef(matches, galleryMatchId) || matches[0];
    if (galleryMatch && getWrestlingPhotoCount(galleryMatch) === 0) {
      requestWrestlingMatchPhotosForRoute(
        show.dateKey || show.date_key || show.showId || show.eventId || showId,
        getWrestlingMatchRouteRef(galleryMatch, matches.indexOf(galleryMatch)),
        show
      );
    }
  }
}

function getWrestlingPeopleCardLabel(person) {
  return [
    `Open ${person.name}`,
    person.categoryDisplay || person.role,
    person.affiliationText || person.factionTeam,
    formatWrestlingCount(person.events, "Events"),
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
    : getWrestlingMatchRouteRef(matchRef);
  const routeMatchRef = rawRouteMatchRef || (Number.isInteger(matchIndex) && matchIndex >= 0 ? `match-${matchIndex + 1}` : "");
  return `${routePaths.wrestlingShows}/${encodeURIComponent(showRouteCode)}/${encodeURIComponent(routeMatchRef)}`;
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
    const isHydratingLiveRows = stateName === "live" && Boolean(wrestlingPeopleRequest) && !wrestlingPeopleLoaded;
    wrestlingPeopleShell.dataset.peopleDataState = stateName;
    wrestlingPeopleShell.setAttribute("aria-busy", String(stateName === "loading" || isHydratingLiveRows));
  }
}

function resetWrestlingPeopleSessionCache() {
  wrestlingPeopleRequestToken += 1;
  wrestlingPeoplePagePayloadCache.clear();
  wrestlingPeoplePageRequests.clear();
  wrestlingPersonDetailPayloadCache.clear();
  wrestlingPersonDetailRequests.clear();
}

function setWrestlingPeopleBusy(isBusy) {
  if (wrestlingPeopleShell) {
    wrestlingPeopleShell.setAttribute("aria-busy", String(Boolean(isBusy)));
  }
}

function getActiveWrestlingPeopleRouteName() {
  if (typeof getRouteFromUrl !== "function") {
    return "";
  }
  return getRouteFromUrl()?.name || "";
}

function isWrestlingPeopleIndexRouteActive() {
  const routeName = getActiveWrestlingPeopleRouteName();
  if (!routeName) {
    return !wrestlingPeopleShell || wrestlingPeopleShell.getAttribute("aria-hidden") !== "true";
  }
  return routeName === "wrestling-people";
}

function isWrestlingPeopleDataRouteActive() {
  const routeName = getActiveWrestlingPeopleRouteName();
  if (!routeName) {
    return true;
  }
  return routeName === "wrestling-people" || routeName === "wrestling-person-detail";
}

function isCurrentWrestlingPeopleRequest(requestToken) {
  return requestToken === wrestlingPeopleRequestToken;
}

function renderWrestlingPeopleIndexForRequest(requestToken) {
  if (!isCurrentWrestlingPeopleRequest(requestToken) || !isWrestlingPeopleIndexRouteActive()) {
    return;
  }
  renderWrestlingPeopleIndex({ skipDataRequest: true });
}

function scheduleWrestlingPeopleIndexRender(requestToken) {
  if (!isCurrentWrestlingPeopleRequest(requestToken) || !isWrestlingPeopleIndexRouteActive()) {
    return;
  }
  if (wrestlingPeopleRenderFrame) {
    return;
  }

  const renderFrame = () => {
    wrestlingPeopleRenderFrame = 0;
    renderWrestlingPeopleIndexForRequest(requestToken);
  };

  if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    wrestlingPeopleRenderFrame = window.requestAnimationFrame(renderFrame);
  } else {
    renderFrame();
  }
}

function waitForWrestlingPeopleHydrationFrame() {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => resolve());
      return;
    }
    setTimeout(resolve, 0);
  });
}

function clearWrestlingPeopleHydrationIdleWait() {
  if (!wrestlingPeopleHydrationIdleHandle || typeof window === "undefined") {
    wrestlingPeopleHydrationIdleHandle = 0;
    return;
  }

  if (typeof window.cancelIdleCallback === "function") {
    window.cancelIdleCallback(wrestlingPeopleHydrationIdleHandle);
  } else {
    window.clearTimeout(wrestlingPeopleHydrationIdleHandle);
  }
  wrestlingPeopleHydrationIdleHandle = 0;
}

function shouldContinueWrestlingPeopleBackgroundHydration(requestToken) {
  if (!isCurrentWrestlingPeopleRequest(requestToken) || !isWrestlingPeopleDataRouteActive()) {
    return false;
  }
  return isWrestlingPeopleIndexRouteActive() || wrestlingPeopleAllowOffIndexHydration;
}

function waitForWrestlingPeopleBackgroundHydrationIdle(requestToken) {
  if (!shouldContinueWrestlingPeopleBackgroundHydration(requestToken)) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const finish = () => {
      wrestlingPeopleHydrationIdleHandle = 0;
      resolve(shouldContinueWrestlingPeopleBackgroundHydration(requestToken));
    };

    if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
      wrestlingPeopleHydrationIdleHandle = window.requestIdleCallback(finish, { timeout: 1200 });
      return;
    }

    if (typeof window !== "undefined" && typeof window.setTimeout === "function") {
      wrestlingPeopleHydrationIdleHandle = window.setTimeout(finish, 240);
      return;
    }

    setTimeout(finish, 240);
  });
}

function cancelWrestlingPeopleBackgroundHydrationIfRouteUnneeded() {
  if (!wrestlingPeopleRequest || isWrestlingPeopleIndexRouteActive() || wrestlingPeopleAllowOffIndexHydration) {
    return;
  }

  clearWrestlingPeopleHydrationIdleWait();
  if (wrestlingPeopleRequestController && !wrestlingPeopleRequestController.signal?.aborted) {
    wrestlingPeopleRequestController.abort();
  }
}

function getWrestlingPeopleCollectionKey(person) {
  return normalizeWrestlingPersonId(getWrestlingPersonRouteId(person));
}

function getWrestlingPeopleCollectionSortName(person) {
  return getWrestlingText(person?.display_name || person?.ring_name || person?.name || person?.title);
}

function mergeWrestlingPeopleCollection(rows, stateName = "live") {
  const mergedRows = new Map();
  const mergeRow = (row) => {
    const rowKey = getWrestlingPeopleCollectionKey(row);
    if (!rowKey) {
      return;
    }
    const existingRow = mergedRows.get(rowKey);
    if (existingRow) {
      mergedRows.set(rowKey, {
        ...existingRow,
        ...row,
        backend_record: {
          ...(existingRow.backend_record || existingRow),
          ...(row.backend_record || row),
        },
      });
      return;
    }
    mergedRows.set(rowKey, row);
  };

  getWrestlingPeopleCollection().forEach(mergeRow);
  (Array.isArray(rows) ? rows : []).forEach(mergeRow);
  const nextRows = Array.from(mergedRows.values())
    .sort((left, right) => getWrestlingPeopleCollectionSortName(left).localeCompare(getWrestlingPeopleCollectionSortName(right)));
  setWrestlingPeopleCollection(nextRows, stateName);
  return nextRows;
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
  const payloads = Array.isArray(payload) ? payload : [payload];
  const seenPersonIds = new Set();
  return payloads
    .flatMap(getWrestlingPeoplePayloadRows)
    .map((person) => ({
      ...person,
      backend_record: person.backend_record || person,
    }))
    .filter((person) => getWrestlingText(person.display_name || person.ring_name || person.name || person.title))
    .filter((person) => {
      const personId = normalizeWrestlingPersonId(getWrestlingPersonRouteId(person));
      if (!personId || seenPersonIds.has(personId)) {
        return false;
      }
      seenPersonIds.add(personId);
      return true;
    })
    .sort((left, right) => getWrestlingText(left.display_name || left.ring_name || left.name || left.title).localeCompare(
      getWrestlingText(right.display_name || right.ring_name || right.name || right.title)
    ));
}

function getWrestlingPeopleApiUrl(page = 1) {
  const apiUrl = new URL(WRESTLING_PEOPLE_API_ROUTE, WRESTLING_SHOWS_API_BASE_URL);
  apiUrl.searchParams.set("limit", String(WRESTLING_PEOPLE_API_LIMIT));
  apiUrl.searchParams.set("page", String(page));
  return apiUrl;
}

function getWrestlingPersonDetailSearchTerm(personId) {
  return normalizeWrestlingPersonId(personId).replace(/-/g, " ").trim();
}

function getWrestlingPersonDetailApiUrl(personId) {
  const apiUrl = getWrestlingPeopleApiUrl(1);
  apiUrl.searchParams.set("limit", "25");
  apiUrl.searchParams.set("search", getWrestlingPersonDetailSearchTerm(personId));
  return apiUrl;
}

function fetchWrestlingPersonDetailPayload(personId, signal) {
  return withWrestlingRequestTimeout(fetch(getWrestlingPersonDetailApiUrl(personId), {
    cache: "no-store",
    signal,
  }), null, WRESTLING_PEOPLE_TIMEOUT_MS, "Wrestling person").then((response) => {
    if (!response.ok) {
      throw new Error(`Wrestling person request failed (${response.status})`);
    }
    return response.json();
  });
}

function getCachedWrestlingPersonDetailPayload(personId, signal) {
  const personKey = normalizeWrestlingPersonId(personId);
  if (!personKey) {
    return Promise.resolve(null);
  }
  if (wrestlingPersonDetailPayloadCache.has(personKey)) {
    return Promise.resolve(wrestlingPersonDetailPayloadCache.get(personKey));
  }
  if (wrestlingPersonDetailRequests.has(personKey)) {
    return wrestlingPersonDetailRequests.get(personKey);
  }

  const request = fetchWrestlingPersonDetailPayload(personKey, signal)
    .then((payload) => {
      wrestlingPersonDetailPayloadCache.set(personKey, payload);
      return payload;
    })
    .finally(() => {
      wrestlingPersonDetailRequests.delete(personKey);
    });
  wrestlingPersonDetailRequests.set(personKey, request);
  return request;
}

function requestWrestlingPersonDetailData(personId) {
  const personKey = normalizeWrestlingPersonId(personId);
  if (!personKey) {
    return Promise.resolve(false);
  }
  if (findWrestlingPersonById(personKey, { allowFallback: false, includeStatic: false })) {
    return Promise.resolve(true);
  }

  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), WRESTLING_PEOPLE_TIMEOUT_MS)
    : 0;

  return getCachedWrestlingPersonDetailPayload(personKey, controller?.signal)
    .then((payload) => {
      const liveRows = normalizeLiveWrestlingPeople(payload);
      if (liveRows.length > 0) {
        mergeWrestlingPeopleCollection(liveRows, "live");
      }
      return Boolean(findWrestlingPersonById(personKey, { allowFallback: false, includeStatic: false }));
    })
    .catch(() => false)
    .finally(() => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    });
}

function requestWrestlingPersonDetailLiveLookup(personId) {
  const personKey = normalizeWrestlingPersonId(personId);
  if (!personKey) {
    return Promise.resolve(false);
  }
  if (findWrestlingPersonById(personKey, { allowFallback: false, includeStatic: false })) {
    return Promise.resolve(true);
  }

  return requestWrestlingPersonDetailData(personKey).then((foundPerson) => {
    if (foundPerson) {
      return true;
    }
    if (wrestlingPeopleLoaded || wrestlingPeopleDataState === "error" || wrestlingPeopleDataState === "empty") {
      return false;
    }
    if (wrestlingPeopleRequest) {
      wrestlingPeopleAllowOffIndexHydration = true;
    }
    const pendingPeopleRequest = wrestlingPeopleRequest || requestWrestlingPeopleData({ allowHydrationOffIndex: true });
    return pendingPeopleRequest.then(() => Boolean(
      findWrestlingPersonById(personKey, { allowFallback: false, includeStatic: false })
    ));
  });
}

function getWrestlingPeoplePayloadTotalPages(payload) {
  const explicitTotalPages = Number.parseInt(payload?.totalPages || payload?.total_pages, 10);
  if (Number.isFinite(explicitTotalPages) && explicitTotalPages > 0) {
    return explicitTotalPages;
  }

  const totalRows = Number.parseInt(payload?.total || payload?.count, 10);
  const pageLimit = Number.parseInt(payload?.limit, 10) || WRESTLING_PEOPLE_API_LIMIT;
  return Number.isFinite(totalRows) && totalRows > pageLimit
    ? Math.ceil(totalRows / pageLimit)
    : 1;
}

function fetchWrestlingPeoplePayload(page, signal, retries = 1) {
  const runRequest = (attemptsRemaining) => withWrestlingRequestTimeout(fetch(getWrestlingPeopleApiUrl(page), {
    cache: "no-store",
    signal,
  }), null, WRESTLING_PEOPLE_TIMEOUT_MS, "Wrestling people").then((response) => {
    if (!response.ok) {
      throw new Error(`Wrestling people request failed (${response.status})`);
    }
    return response.json();
  }).catch((error) => {
    if (attemptsRemaining > 0 && !signal?.aborted) {
      return runRequest(attemptsRemaining - 1);
    }
    throw error;
  });

  return runRequest(Math.max(Number.parseInt(retries, 10) || 0, 0));
}

function getCachedWrestlingPeoplePayload(page, signal, retries = 1) {
  const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
  if (wrestlingPeoplePagePayloadCache.has(pageNumber)) {
    return Promise.resolve(wrestlingPeoplePagePayloadCache.get(pageNumber));
  }
  if (wrestlingPeoplePageRequests.has(pageNumber)) {
    return wrestlingPeoplePageRequests.get(pageNumber);
  }

  const request = fetchWrestlingPeoplePayload(pageNumber, signal, retries)
    .then((payload) => {
      wrestlingPeoplePagePayloadCache.set(pageNumber, payload);
      return payload;
    })
    .finally(() => {
      wrestlingPeoplePageRequests.delete(pageNumber);
    });
  wrestlingPeoplePageRequests.set(pageNumber, request);
  return request;
}

function fetchOptionalWrestlingPeoplePayload(page, signal) {
  return getCachedWrestlingPeoplePayload(page, signal, 1).catch(() => null);
}

function requestWrestlingPeopleData(options = {}) {
  if (options.allowHydrationOffIndex === true) {
    wrestlingPeopleAllowOffIndexHydration = true;
  }
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

  const requestToken = wrestlingPeopleRequestToken + 1;
  wrestlingPeopleRequestToken = requestToken;
  if (getWrestlingPeopleCollection().length > 0) {
    setWrestlingPeopleCollection(getWrestlingPeopleCollection(), "live");
  } else {
    setWrestlingPeopleCollection([], "loading");
  }
  setWrestlingPeopleBusy(true);
  wrestlingPeopleAllowOffIndexHydration = options.allowHydrationOffIndex === true;
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  wrestlingPeopleRequestController = controller;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), WRESTLING_PEOPLE_TIMEOUT_MS)
    : 0;

  const applyPayloadRows = (payload, options = {}) => {
    if (!isCurrentWrestlingPeopleRequest(requestToken) || !isWrestlingPeopleDataRouteActive()) {
      return false;
    }
    const liveRows = normalizeLiveWrestlingPeople(payload);
    if (liveRows.length === 0) {
      return false;
    }
    mergeWrestlingPeopleCollection(liveRows, "live");
    if (options.immediate) {
      renderWrestlingPeopleIndexForRequest(requestToken);
    } else {
      scheduleWrestlingPeopleIndexRender(requestToken);
    }
    return true;
  };

  wrestlingPeopleRequest = (async () => {
    try {
      const firstPayload = await getCachedWrestlingPeoplePayload(1, controller?.signal, 2);
      if (!isCurrentWrestlingPeopleRequest(requestToken) || !isWrestlingPeopleDataRouteActive()) {
        return getWrestlingPeopleCollection().length > 0;
      }

      applyPayloadRows(firstPayload, { immediate: true });
      const totalPages = getWrestlingPeoplePayloadTotalPages(firstPayload);
      for (let page = 2; page <= totalPages; page += 1) {
        if (!shouldContinueWrestlingPeopleBackgroundHydration(requestToken)) {
          if (controller && !controller.signal.aborted) {
            controller.abort();
          }
          return getWrestlingPeopleCollection().length > 0;
        }

        const shouldHydratePage = await waitForWrestlingPeopleBackgroundHydrationIdle(requestToken);
        if (!shouldHydratePage) {
          if (controller && !controller.signal.aborted) {
            controller.abort();
          }
          return getWrestlingPeopleCollection().length > 0;
        }

        const payload = await fetchOptionalWrestlingPeoplePayload(page, controller?.signal);
        if (!shouldContinueWrestlingPeopleBackgroundHydration(requestToken)) {
          if (controller && !controller.signal.aborted) {
            controller.abort();
          }
          return getWrestlingPeopleCollection().length > 0;
        }
        if (payload) {
          applyPayloadRows(payload);
          await waitForWrestlingPeopleHydrationFrame();
        }
      }

      if (!isCurrentWrestlingPeopleRequest(requestToken)) {
        return getWrestlingPeopleCollection().length > 0;
      }
      const hasLiveRows = getWrestlingPeopleCollection().length > 0;
      wrestlingPeopleLoaded = true;
      if (hasLiveRows) {
        setWrestlingPeopleCollection(getWrestlingPeopleCollection(), "live");
      } else {
        setWrestlingPeopleCollection([], "empty");
      }
      renderWrestlingPeopleIndexForRequest(requestToken);
      return hasLiveRows;
    } catch {
      if (!isCurrentWrestlingPeopleRequest(requestToken)) {
        return false;
      }
      const hasLiveRows = getWrestlingPeopleCollection().length > 0;
      if (hasLiveRows) {
        setWrestlingPeopleCollection(getWrestlingPeopleCollection(), "live");
        renderWrestlingPeopleIndexForRequest(requestToken);
        return true;
      }
      if (isWrestlingPeopleIndexRouteActive() && Array.isArray(wrestlingPeopleRows) && wrestlingPeopleRows.length > 0) {
        setWrestlingPeopleCollection([], "fallback");
        renderWrestlingPeopleIndexForRequest(requestToken);
        return false;
      }
      if (isWrestlingPeopleDataRouteActive()) {
        setWrestlingPeopleCollection([], "error");
        renderWrestlingPeopleIndexForRequest(requestToken);
      }
      return false;
    } finally {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      clearWrestlingPeopleHydrationIdleWait();
      if (isCurrentWrestlingPeopleRequest(requestToken)) {
        setWrestlingPeopleBusy(false);
        wrestlingPeopleRequest = null;
        wrestlingPeopleRequestController = null;
        wrestlingPeopleAllowOffIndexHydration = false;
      }
    }
  })();

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
  return getOptionalWrestlingPeopleCountValue(...values) ?? 0;
}

function getOptionalWrestlingPeopleCountValue(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value.length;
    }
    if (value === undefined || value === null || String(value).trim() === "") {
      continue;
    }
    const parsedValue = Number.parseInt(value, 10);
    if (Number.isFinite(parsedValue) && parsedValue >= 0) {
      return parsedValue;
    }
  }
  return null;
}

function getWrestlingTaggedPeoplePhotoCount(person) {
  const taggedPeople = getWrestlingArray(person?.taggedPeople || person?.tagged_people);
  const counts = taggedPeople
    .map((taggedPerson) => getOptionalWrestlingPeopleCountValue(
      taggedPerson?.tagCount,
      taggedPerson?.tag_count,
      taggedPerson?.photoCount,
      taggedPerson?.photo_count
    ))
    .filter((count) => count !== null);
  return counts.length > 0 ? counts.reduce((total, count) => total + count, 0) : null;
}

function getWrestlingPersonInitials(name) {
  const characters = getWrestlingText(name)
    .split(/\s+/)
    .map((part) => part.match(/[a-z0-9]/i)?.[0] || "")
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return characters || "WP";
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
    ...getWrestlingLabelArray(person?.associations || person?.association || person?.associationIds || person?.association_ids),
    ...getWrestlingLabelArray(person?.stables || person?.stableIds || person?.stable_ids),
    ...getWrestlingLabelArray(person?.factions || person?.factionIds || person?.faction_ids),
  ]
    .filter(Boolean)
    .map((value) => value.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()))
    .filter((value, index, values) => values.findIndex((candidate) => candidate.toLowerCase() === value.toLowerCase()) === index);
}

function getWrestlingPersonTeamsAndStables(person) {
  return [
    getWrestlingText(person?.factionTeam || person?.stable || person?.team),
    ...getWrestlingLabelArray(person?.teams || person?.teamIds || person?.team_ids),
    ...getWrestlingLabelArray(person?.associations || person?.association || person?.associationIds || person?.association_ids),
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
  const teamsAndStables = getWrestlingPersonTeamsAndStables(source);
  const eventCount = getOptionalWrestlingPeopleCountValue(
    source.event_count,
    source.events_count,
    source.show_count,
    source.shows_count,
    source.stats?.event_count,
    source.stats?.show_count,
    source.events,
    source.appearances,
    source.appearance_count,
    source.showIds,
    source.show_ids,
    source.stats?.eventCount,
    source.stats?.showCount
  );
  const matchCount = getOptionalWrestlingPeopleCountValue(
    source.match_count,
    source.matches_count,
    source.stats?.match_count,
    source.matches,
    source.matchIds,
    source.match_ids,
    source.stats?.matchCount
  );
  const taggedPhotoCount = getOptionalWrestlingPeopleCountValue(
    source.tagged_photo_count,
    source.taggedPhotoCount,
    source.stats?.taggedPhotoCount,
    source.stats?.tagged_photo_count,
    getWrestlingTaggedPeoplePhotoCount(source)
  );
  const photoCount = getOptionalWrestlingPeopleCountValue(
    source.photo_count,
    source.stats?.photo_count,
    source.photoCount,
    source.photos,
    source.photoIds,
    source.photo_ids,
    source.stats?.photoCount
  ) ?? taggedPhotoCount;
  const firstSeen = getWrestlingText(
    source.first_seen ||
    source.firstSeen ||
    source.first_seen_date ||
    source.firstSeenDate ||
    source.first_event_date ||
    source.firstEventDate ||
    source.debutYear ||
    source.debut_year ||
    source.stats?.firstSeen ||
    source.stats?.first_seen
  );
  const latestSeen = getWrestlingText(
    source.latest_seen ||
    source.latestSeen ||
    source.latest_seen_date ||
    source.latestSeenDate ||
    source.last_seen ||
    source.lastSeen ||
    source.last_event_date ||
    source.lastEventDate ||
    source.stats?.latestSeen ||
    source.stats?.latest_seen ||
    source.stats?.lastSeen ||
    source.stats?.last_seen
  );

  return {
    ...source,
    personId,
    name,
    legalName,
    aliases,
    teamsAndStables,
    teamsAndAssociations: teamsAndStables,
    category,
    categoryDisplay,
    categoryFilterValue,
    affiliationText: affiliations.length > 0 ? affiliations.join(" / ") : aliases.join(" / "),
    affiliations,
    firstSeen,
    latestSeen,
    eventCount,
    matchCount,
    taggedPhotoCount,
    photoCount,
    events: eventCount ?? 0,
    matches: matchCount ?? 0,
    photos: photoCount ?? 0,
    thumb: getWrestlingText(source.thumb || source.initials || source.imageLabel || source.image_label, getWrestlingPersonInitials(name)),
    isDbBacked: !!source.backend_record,
    letter: getWrestlingPersonLetter({ name }),
    searchText: [
      name,
      legalName,
      aliases.join(" "),
      teamsAndStables.join(" "),
      affiliations.join(" "),
      category,
    ].join(" ").toLowerCase(),
  };
}

function getWrestlingPeopleIndexRows() {
  const collectionRows = getWrestlingPeopleCollection();
  const sourceRows = wrestlingPeopleDataState === "live" || wrestlingPeopleDataState === "empty" || collectionRows.length > 0
    ? collectionRows
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

function createWrestlingPeopleStat(label, value, iconType = "") {
  const stat = document.createElement("span");
  stat.className = "wrestling-person-row-stat wrestling-person-card-stat";
  stat.setAttribute("aria-label", `${Number(value).toLocaleString()} ${label.toLowerCase()}`);

  const statIcon = document.createElement("span");
  statIcon.className = `wrestling-person-card-stat-icon wrestling-person-card-stat-icon--${iconType || label.toLowerCase()}`;
  statIcon.setAttribute("aria-hidden", "true");

  const statValue = document.createElement("strong");
  statValue.textContent = Number(value).toLocaleString();

  stat.append(statIcon, statValue);
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
  stats.append(createWrestlingPeopleStat("Events", person.events, "events"));
  const divider = document.createElement("span");
  divider.className = "wrestling-person-row-stat-divider";
  divider.setAttribute("aria-hidden", "true");
  divider.textContent = "/";
  stats.append(divider);
  stats.append(createWrestlingPeopleStat("Photos", person.photos, "photos"));

  const arrow = document.createElement("span");
  arrow.className = "wrestling-person-row-arrow wrestling-person-card-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = ">";

  row.append(name, category);
  if (affiliation.textContent) {
    row.append(affiliation);
  }
  row.append(stats);
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
  const empty = createWrestlingV3StateCard("empty", "wrestlingPeople", {
    text: copy,
  });
  empty.classList.add("wrestling-people-empty");
  return empty;
}

function renderWrestlingPeopleIndex(options = {}) {
  if (!wrestlingPeopleList) {
    return;
  }

  if (
    !options.skipDataRequest &&
    !wrestlingPeopleRequest &&
    !wrestlingPeopleLoaded &&
    ["idle", "loading", "live"].includes(wrestlingPeopleDataState)
  ) {
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
    renderWrestlingV3State(wrestlingPeopleList, forcedState, "wrestlingPeople");
    return;
  }
  if (wrestlingPeopleDataState === "idle" || (wrestlingPeopleDataState === "loading" && filteredRows.length === 0)) {
    fragment.append(createWrestlingV3StateCard("loading", "wrestlingPeople"));
  } else if (wrestlingPeopleDataState === "error") {
    fragment.append(createWrestlingV3StateCard("error", "wrestlingPeople", { retry: true }));
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

function getWrestlingVenueRowName(venue) {
  return getWrestlingText(
    venue?.name ||
    venue?.venueName ||
    venue?.venue_name ||
    venue?.venue ||
    venue?.title ||
    venue?.venue_details?.name ||
    venue?.venue_details?.venue_name,
    "Venue Pending"
  );
}

function getWrestlingVenueDisplayState(venue) {
  return getWrestlingText(
    venue?.stateDisplay ||
    venue?.state_display ||
    venue?.state ||
    venue?.state_abbr ||
    venue?.stateAbbr ||
    venue?.location_state ||
    venue?.locationState ||
    venue?.venue_details?.state ||
    venue?.venueDetails?.state
  );
}

function getWrestlingVenueRowId(venue) {
  return normalizeWrestlingVenueId(
    venue?.venueId ||
    venue?.venue_id ||
    venue?.id ||
    venue?.slug ||
    getWrestlingVenueRowName(venue)
  );
}

function normalizeWrestlingVenueState(value) {
  const rawState = String(value || "").trim();
  if (!rawState) {
    return "";
  }

  const upperState = rawState.toUpperCase();
  const stateAliases = {
    MAINE: "ME",
    "NEW HAMPSHIRE": "NH",
    MASSACHUSETTS: "MA",
    CONNECTICUT: "CT",
    "RHODE ISLAND": "RI",
    VERMONT: "VT",
  };
  return stateAliases[upperState] || upperState;
}

function getWrestlingVenueState(venue) {
  return normalizeWrestlingVenueState(
    venue?.state ||
    venue?.state_abbr ||
    venue?.stateAbbr ||
    venue?.location_state ||
    venue?.locationState ||
    venue?.venue_details?.state ||
    venue?.venueDetails?.state
  );
}

function getWrestlingVenueCity(venue) {
  return getWrestlingText(
    venue?.city ||
    venue?.location_city ||
    venue?.locationCity ||
    venue?.venue_details?.city ||
    venue?.venueDetails?.city
  );
}

function getWrestlingVenueLocationText(venue) {
  return [getWrestlingVenueCity(venue), getWrestlingVenueDisplayState(venue) || getWrestlingVenueState(venue)].filter(Boolean).join(", ")
    || getWrestlingText(venue?.location, "Location Pending");
}

function getWrestlingVenueCountValue(venue, candidates) {
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.length;
    }
    const count = Number.parseInt(candidate, 10);
    if (Number.isFinite(count) && count >= 0) {
      return count;
    }
  }
  return null;
}

function getWrestlingVenueEventCount(venue) {
  return getWrestlingVenueCountValue(venue, [
    venue?.eventCount,
    venue?.event_count,
    venue?.showCount,
    venue?.show_count,
    venue?.related_shows,
    venue?.showIds,
    venue?.stats?.eventCount,
    venue?.stats?.events,
    venue?.stats?.showCount,
  ]);
}

function getWrestlingVenuePhotoCount(venue) {
  const displayPhotoCount = getWrestlingPhotoCount(venue);
  if (displayPhotoCount > 0) {
    return displayPhotoCount;
  }
  return getWrestlingVenueCountValue(venue, [
    venue?.photoCount,
    venue?.photo_count,
    venue?.photos,
    venue?.stats?.photoCount,
    venue?.stats?.photos,
    venue?.stats?.totalPhotos,
  ]);
}

function getWrestlingVenueSearchText(venue) {
  return [
    getWrestlingVenueRowName(venue),
    getWrestlingVenueCity(venue),
    getWrestlingVenueDisplayState(venue),
    getWrestlingVenueState(venue),
    venue?.state,
    venue?.region,
    venue?.archiveState,
    getWrestlingVenueLocationText(venue),
  ].map((value) => String(value || "").toLowerCase()).join(" ");
}

function getWrestlingVenuesPayloadRows(payload) {
  const candidates = [
    payload?.items,
    payload?.data,
    payload?.rows,
    payload?.venues,
    payload?.source?.items,
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

function normalizeLiveWrestlingVenueRow(record = {}) {
  const source = record?.backend_record && typeof record.backend_record === "object"
    ? { ...record.backend_record, ...record }
    : record;
  const venueName = getWrestlingText(
    source?.venue_name ||
    source?.venueName ||
    source?.venue ||
    source?.name ||
    source?.title
  );
  const venueId = normalizeWrestlingVenueId(
    source?.venueId ||
    source?.venue_id ||
    source?.id ||
    source?.slug ||
    venueName
  );
  const city = getWrestlingText(source?.city || source?.location_city || source?.locationCity || source?.venue_details?.city);
  const stateDisplay = getWrestlingVenueDisplayState(source);
  const eventCount = getWrestlingVenueEventCount(source);
  const photoCount = getWrestlingVenuePhotoCount(source);

  return {
    ...source,
    backend_record: source?.backend_record || source,
    venueId,
    venue_id: source?.venue_id || venueId,
    slug: normalizeWrestlingVenueId(source?.slug || venueId),
    name: venueName,
    venueName,
    venue_name: source?.venue_name || venueName,
    city,
    state: stateDisplay,
    stateDisplay,
    region: getWrestlingText(source?.region || source?.venue_details?.region),
    archiveState: getWrestlingText(source?.archiveState || source?.archive_state || source?.status),
    eventCount: eventCount ?? null,
    photoCount: photoCount ?? null,
    imageLabel: source?.imageLabel || getWrestlingVenueInitials(venueName),
  };
}

function normalizeLiveWrestlingVenues(payloads) {
  const seenVenueIds = new Set();
  return (Array.isArray(payloads) ? payloads : [payloads])
    .flatMap(getWrestlingVenuesPayloadRows)
    .map(normalizeLiveWrestlingVenueRow)
    .filter((venue) => venue.venueId && getWrestlingVenueRowName(venue) !== "Venue Pending")
    .filter((venue) => {
      if (seenVenueIds.has(venue.venueId)) {
        return false;
      }
      seenVenueIds.add(venue.venueId);
      return true;
    })
    .sort((left, right) => getWrestlingVenueRowName(left).localeCompare(getWrestlingVenueRowName(right)));
}

function setWrestlingVenuesCollection(rows, stateName = "fallback") {
  wrestlingVenuesCollection = Array.isArray(rows) ? rows : [];
  wrestlingVenuesDataState = stateName;
  if (typeof mockCollections !== "undefined" && wrestlingVenuesCollection.length > 0) {
    mockCollections.wrestlingVenues = wrestlingVenuesCollection;
  }
  if (wrestlingVenuesShell) {
    wrestlingVenuesShell.dataset.wrestlingVenuesDataState = stateName;
    wrestlingVenuesShell.setAttribute("aria-busy", String(stateName === "loading"));
  }
}

function getWrestlingVenuesApiUrl(page = 1) {
  const apiUrl = new URL(WRESTLING_VENUES_API_ROUTE, WRESTLING_SHOWS_API_BASE_URL);
  apiUrl.searchParams.set("limit", String(WRESTLING_VENUES_API_LIMIT));
  apiUrl.searchParams.set("page", String(page));
  return apiUrl;
}

function getWrestlingVenuesPayloadTotalPages(payload) {
  const explicitTotalPages = Number.parseInt(payload?.totalPages || payload?.total_pages || payload?.meta?.pagination?.totalPages, 10);
  if (Number.isFinite(explicitTotalPages) && explicitTotalPages > 0) {
    return explicitTotalPages;
  }

  const totalRows = Number.parseInt(payload?.total || payload?.count || payload?.meta?.pagination?.total, 10);
  const pageLimit = Number.parseInt(payload?.limit || payload?.meta?.pagination?.limit, 10) || WRESTLING_VENUES_API_LIMIT;
  return Number.isFinite(totalRows) && totalRows > pageLimit
    ? Math.ceil(totalRows / pageLimit)
    : 1;
}

function fetchWrestlingVenuesPayload(page, signal) {
  return withWrestlingRequestTimeout(fetch(getWrestlingVenuesApiUrl(page), {
    cache: "no-store",
    signal,
  }), null, WRESTLING_VENUES_TIMEOUT_MS, "Wrestling venues").then((response) => {
    if (!response.ok) {
      throw new Error(`Wrestling venues request failed (${response.status})`);
    }
    return response.json();
  });
}

function requestWrestlingVenuesData() {
  if (wrestlingVenuesLoaded) {
    return Promise.resolve(true);
  }
  if (wrestlingVenuesRequest) {
    return wrestlingVenuesRequest;
  }
  if (typeof fetch !== "function") {
    setWrestlingVenuesCollection([], "error");
    renderWrestlingVenuesIndex({ skipDataRequest: true });
    return Promise.resolve(false);
  }

  setWrestlingVenuesCollection([], "loading");
  renderWrestlingVenuesIndex({ skipDataRequest: true });
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), WRESTLING_VENUES_TIMEOUT_MS)
    : 0;

  wrestlingVenuesRequest = fetchWrestlingVenuesPayload(1, controller?.signal)
    .then((firstPayload) => {
      const totalPages = getWrestlingVenuesPayloadTotalPages(firstPayload);
      const remainingPages = Array.from({ length: Math.max(totalPages - 1, 0) }, (_, index) => index + 2);
      if (remainingPages.length === 0) {
        return [firstPayload];
      }
      return Promise.all(remainingPages.map((page) => fetchWrestlingVenuesPayload(page, controller?.signal)))
        .then((additionalPayloads) => [firstPayload, ...additionalPayloads]);
    })
    .then((payloads) => {
      const liveRows = normalizeLiveWrestlingVenues(payloads);
      if (liveRows.length === 0) {
        setWrestlingVenuesCollection([], "empty");
      } else {
        setWrestlingVenuesCollection(liveRows, "live");
        wrestlingVenuesLoaded = true;
      }
      renderWrestlingVenuesIndex({ skipDataRequest: true });
      return liveRows.length > 0;
    })
    .catch(() => {
      setWrestlingVenuesCollection([], "error");
      renderWrestlingVenuesIndex({ skipDataRequest: true });
      return false;
    })
    .finally(() => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      if (wrestlingVenuesShell) {
        wrestlingVenuesShell.setAttribute("aria-busy", "false");
      }
      wrestlingVenuesRequest = null;
    });

  return wrestlingVenuesRequest;
}

function getWrestlingVenueArchiveRows() {
  const sourceRows = wrestlingVenuesDataState === "live" || wrestlingVenuesDataState === "loading" || wrestlingVenuesDataState === "empty" || wrestlingVenuesDataState === "error"
    ? wrestlingVenuesCollection
    : wrestlingVenueRows;
  return (Array.isArray(sourceRows) ? sourceRows : [])
    .filter((venue) => getWrestlingVenueRowId(venue))
    .sort((left, right) => getWrestlingVenueRowName(left).localeCompare(getWrestlingVenueRowName(right)));
}

function normalizeActiveWrestlingVenueFilters(rows) {
  const stateOptions = new Set(rows.map(getWrestlingVenueState).filter(Boolean));
  if (activeWrestlingVenueStateFilter && !stateOptions.has(activeWrestlingVenueStateFilter)) {
    activeWrestlingVenueStateFilter = "";
  }
}

function getFilteredWrestlingVenues() {
  const rows = getWrestlingVenueArchiveRows();
  normalizeActiveWrestlingVenueFilters(rows);
  const searchTerm = activeWrestlingVenueSearch.trim().toLowerCase();

  return rows.filter((venue) => {
    if (activeWrestlingVenueStateFilter && getWrestlingVenueState(venue) !== activeWrestlingVenueStateFilter) {
      return false;
    }
    if (!searchTerm) {
      return true;
    }
    return getWrestlingVenueSearchText(venue).includes(searchTerm);
  });
}

function setWrestlingVenuesCount(count) {
  if (!wrestlingVenuesCount) {
    return;
  }
  const numericCount = Number(count) || 0;
  wrestlingVenuesCount.textContent = `${numericCount.toLocaleString()} venue${numericCount === 1 ? "" : "s"}`;
}

function updateWrestlingVenueFilter(filterName, value) {
  if (filterName === "search") {
    activeWrestlingVenueSearch = String(value || "");
    renderWrestlingVenuesResults();
    return;
  }
  if (filterName === "state") {
    activeWrestlingVenueStateFilter = normalizeWrestlingVenueState(value);
    normalizeActiveWrestlingVenueFilters(getWrestlingVenueArchiveRows());
    renderWrestlingVenuesFilters();
    renderWrestlingVenuesResults();
  }
}

function resetWrestlingVenueFilters() {
  activeWrestlingVenueSearch = "";
  activeWrestlingVenueStateFilter = "";
  renderWrestlingVenuesIndex();
}

function createWrestlingVenueFilterField(labelText, fieldName, options, activeValue, allLabel = "") {
  const label = document.createElement("label");
  label.className = "wrestling-venues-filter-field";

  const labelSpan = document.createElement("span");
  labelSpan.className = "wrestling-venues-filter-label";
  labelSpan.textContent = labelText;

  const select = document.createElement("select");
  select.className = "wrestling-venues-filter-select";
  select.dataset.wrestlingVenuesFilter = fieldName;
  select.setAttribute("aria-label", `Filter wrestling venues by ${labelText.toLowerCase()}`);

  if (allLabel) {
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = allLabel;
    select.append(allOption);
  }

  options.forEach((option) => {
    const optionElement = document.createElement("option");
    optionElement.value = option.value;
    optionElement.textContent = option.label;
    select.append(optionElement);
  });

  select.value = activeValue;
  select.addEventListener("change", () => {
    updateWrestlingVenueFilter(fieldName, select.value);
  });

  label.append(labelSpan, select);
  return label;
}

function createWrestlingVenueFilters(rows) {
  const filters = document.createElement("section");
  filters.className = "wrestling-venues-filter-bar";
  filters.setAttribute("aria-label", "Venue archive filters");

  const searchLabel = document.createElement("label");
  searchLabel.className = "wrestling-venues-filter-field wrestling-venues-filter-field--search";

  const searchText = document.createElement("span");
  searchText.className = "wrestling-venues-filter-label";
  searchText.textContent = "Search Venues";

  const searchInput = document.createElement("input");
  searchInput.className = "wrestling-venues-search-input";
  searchInput.type = "search";
  searchInput.autocomplete = "off";
  searchInput.placeholder = "Search name or city";
  searchInput.value = activeWrestlingVenueSearch;
  searchInput.dataset.wrestlingVenuesFilter = "search";
  searchInput.addEventListener("input", () => {
    updateWrestlingVenueFilter("search", searchInput.value);
  });

  searchLabel.append(searchText, searchInput);

  const states = getWrestlingShowsUniqueOptions(rows, getWrestlingVenueState)
    .map((state) => ({ value: state, label: state }));

  const resetButton = document.createElement("button");
  resetButton.className = "wrestling-venues-filter-reset";
  resetButton.type = "button";
  resetButton.textContent = "Reset Filters";
  resetButton.addEventListener("click", resetWrestlingVenueFilters);

  filters.append(
    searchLabel,
    createWrestlingVenueFilterField("State", "state", states, activeWrestlingVenueStateFilter, "All States"),
    resetButton
  );

  return filters;
}

function renderWrestlingVenuesFilters(rows = getWrestlingVenueArchiveRows()) {
  if (!wrestlingVenuesFilters) {
    return;
  }

  const activeElement = document.activeElement;
  const shouldRestoreSearchFocus = activeElement?.matches?.("[data-wrestling-venues-filter='search']");
  const selectionStart = shouldRestoreSearchFocus ? activeElement.selectionStart : null;
  const selectionEnd = shouldRestoreSearchFocus ? activeElement.selectionEnd : null;

  wrestlingVenuesFilters.replaceChildren(createWrestlingVenueFilters(rows));

  if (shouldRestoreSearchFocus) {
    const searchInput = wrestlingVenuesFilters.querySelector("[data-wrestling-venues-filter='search']");
    if (searchInput) {
      searchInput.focus({ preventScroll: true });
      if (Number.isInteger(selectionStart) && Number.isInteger(selectionEnd)) {
        searchInput.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  }
}

function getWrestlingVenueInitials(name) {
  const parts = String(name || "").split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "VN";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return parts.slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();
}

function navigateToWrestlingVenueDetail(venue) {
  const venueId = getWrestlingVenueRowId(venue);
  activeWrestlingVenueId = venueId;
  setActiveWrestlingVenueCard(venueId);
  navigateToRoute(getWrestlingVenueRouteUrl(venue), {
    historyState: { fromWrestlingVenuesIndex: true },
  });
}

function getWrestlingVenueCardLabel(venue) {
  const eventCount = getWrestlingVenueEventCount(venue);
  const photoCount = getWrestlingVenuePhotoCount(venue);
  return [
    `${getWrestlingVenueRowName(venue)} venue detail`,
    getWrestlingVenueLocationText(venue),
    eventCount !== null ? formatWrestlingCount(eventCount, "Events") : "",
    photoCount !== null ? formatWrestlingCount(photoCount, "Photos") : "",
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
  const venueId = getWrestlingVenueRowId(venue);
  const venueName = getWrestlingVenueRowName(venue);
  const eventCount = getWrestlingVenueEventCount(venue);
  const photoCount = getWrestlingVenuePhotoCount(venue);
  card.className = "wrestling-venue-card";
  card.type = "button";
  card.setAttribute("aria-pressed", "false");
  card.setAttribute("aria-label", `Open ${getWrestlingVenueCardLabel(venue)}`);
  card.dataset.wrestlingVenueId = venueId;
  card.dataset.wrestlingVenueState = getWrestlingVenueState(venue);
  card.dataset.wrestlingVenueRoute = getWrestlingVenueRouteUrl(venue);
  setWrestlingRelationshipDataset(card, venue);

  const mark = document.createElement("span");
  mark.className = "wrestling-venue-card-mark";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = venue.imageLabel || getWrestlingVenueInitials(venueName);

  const body = document.createElement("div");
  body.className = "wrestling-venue-card-body";

  const name = document.createElement("h3");
  name.className = "wrestling-venue-card-name";
  name.textContent = venueName;

  const location = document.createElement("p");
  location.className = "wrestling-venue-card-location";
  location.textContent = getWrestlingVenueLocationText(venue);

  const stats = document.createElement("div");
  stats.className = "wrestling-venue-card-stats";
  if (eventCount !== null) {
    stats.append(createWrestlingVenueStat("Events", eventCount));
  }
  if (photoCount !== null) {
    stats.append(createWrestlingVenueStat("Photos", photoCount));
  }

  const action = document.createElement("span");
  action.className = "wrestling-venue-card-action";
  action.setAttribute("aria-hidden", "true");
  action.textContent = ">";

  body.append(name, location);
  if (stats.children.length > 0) {
    body.append(stats);
  }
  card.append(mark, body, action);
  card.addEventListener("click", () => {
    navigateToWrestlingVenueDetail(venue);
  });

  return card;
}

function createWrestlingVenuesEmptyState(message = "No venues match the current filters.") {
  const emptyState = createWrestlingV3StateCard("empty", "wrestlingVenues", {
    text: message,
  });
  emptyState.classList.add("wrestling-venues-empty");
  return emptyState;
}

function renderWrestlingVenuesResults() {
  if (!wrestlingVenuesList) {
    return;
  }

  const forcedState = getForcedMockState("wrestlingVenues");
  wrestlingVenuesList.replaceChildren();
  if (forcedState && forcedState !== "partial") {
    renderWrestlingV3State(wrestlingVenuesList, forcedState, "wrestlingVenues");
    setWrestlingVenuesCount(0);
    return;
  }

  const visibleRows = getFilteredWrestlingVenues();
  if (wrestlingVenuesDataState === "loading" || wrestlingVenuesDataState === "idle") {
    renderWrestlingV3State(wrestlingVenuesList, "loading", "wrestlingVenues");
  } else if (wrestlingVenuesDataState === "error") {
    renderWrestlingV3State(wrestlingVenuesList, "error", "wrestlingVenues", { retry: true });
  } else if (wrestlingVenuesDataState === "empty") {
    wrestlingVenuesList.append(createWrestlingVenuesEmptyState("No wrestling venues found."));
  } else if (visibleRows.length === 0) {
    wrestlingVenuesList.append(createWrestlingVenuesEmptyState());
  } else {
    visibleRows.forEach((venue) => {
      wrestlingVenuesList.append(createWrestlingVenueCard(venue));
    });
  }
  if (forcedState === "partial") {
    wrestlingVenuesList.append(createMockStateCard("partial", "wrestlingVenues"));
  }
  setWrestlingVenuesCount(visibleRows.length);
  setActiveWrestlingVenueCard();
}

function renderWrestlingVenuesIndex(options = {}) {
  cancelWrestlingPeopleBackgroundHydrationIfRouteUnneeded();

  if (!options.skipDataRequest && wrestlingVenuesDataState === "idle" && !wrestlingVenuesRequest && !wrestlingVenuesLoaded) {
    requestWrestlingVenuesData();
  }
  const rows = getWrestlingVenueArchiveRows();
  normalizeActiveWrestlingVenueFilters(rows);
  renderWrestlingVenuesFilters(rows);
  renderWrestlingVenuesResults();
}

function getWrestlingVenueGeo(venue) {
  return venue?.geo ||
    venue?.venue_details?.geo ||
    venue?.venueDetails?.geo ||
    venue?.backend_record?.geo ||
    venue?.backend_record?.venue_details?.geo ||
    {};
}

function getWrestlingVenueDetailLatitude(venue) {
  return getWrestlingText(
    venue?.latitude ||
    venue?.venue_details?.latitude ||
    venue?.venueDetails?.latitude ||
    venue?.backend_record?.latitude ||
    venue?.backend_record?.venue_details?.latitude
  );
}

function getWrestlingVenueDetailLongitude(venue) {
  return getWrestlingText(
    venue?.longitude ||
    venue?.venue_details?.longitude ||
    venue?.venueDetails?.longitude ||
    venue?.backend_record?.longitude ||
    venue?.backend_record?.venue_details?.longitude
  );
}

function getWrestlingVenueCountry(venue) {
  return getWrestlingText(
    venue?.country ||
    venue?.venue_details?.country ||
    venue?.venueDetails?.country ||
    venue?.backend_record?.country ||
    venue?.backend_record?.venue_details?.country
  );
}

function getWrestlingVenueType(venue) {
  return getWrestlingText(
    venue?.venue_type ||
    venue?.venueType ||
    venue?.type ||
    venue?.venue_details?.venue_type ||
    venue?.backend_record?.venue_type
  );
}

function getWrestlingVenueStatus(venue) {
  return getWrestlingText(
    venue?.archiveState ||
    venue?.archive_state ||
    venue?.status ||
    venue?.venue_details?.status ||
    venue?.backend_record?.status
  );
}

function getWrestlingVenueShowVenueId(show) {
  return normalizeWrestlingVenueId(
    show?.venueId ||
    show?.venue_id ||
    show?.venue_details?.venue_id ||
    show?.venueDetails?.venue_id ||
    show?.venueDetails?.venueId ||
    show?.backend_record?.venue_id ||
    show?.backend_record?.venue_details?.venue_id ||
    getWrestlingVenueName(show)
  );
}

function getWrestlingVenueRelatedShowRows(venue) {
  const venueId = getWrestlingVenueRowId(venue);
  if (!venueId) {
    return [];
  }

  const liveShows = Array.isArray(wrestlingShowsCollection) && wrestlingShowsCollection.length > 0
    ? wrestlingShowsCollection
    : [];
  const relatedShows = liveShows.filter((show) => getWrestlingVenueShowVenueId(show) === venueId);
  const relatedShowIds = getWrestlingArray(venue?.related_shows || venue?.relatedShows || venue?.showIds || venue?.show_ids);
  relatedShowIds.forEach((showId) => {
    const show = findLiveWrestlingShowById(showId) || getMockRecordById("wrestlingShows", showId, ["showId", "eventId", "show_id", "show_key", "id", "slug"]);
    if (show && !relatedShows.some((row) => getWrestlingShowRouteCode(row) === getWrestlingShowRouteCode(show))) {
      relatedShows.push(show);
    }
  });

  if (relatedShows.length === 0 && liveShows.length === 0) {
    wrestlingVenueEventHistoryRows
      .filter((eventRow) => normalizeWrestlingVenueId(eventRow.venueId || eventRow.venue_id) === venueId)
      .forEach((eventRow) => relatedShows.push(eventRow));
  }

  return relatedShows.sort((left, right) => {
    const sortDelta = getWrestlingVenueEventTimestamp(right) - getWrestlingVenueEventTimestamp(left);
    return sortDelta || getWrestlingVenueEventName(left).localeCompare(getWrestlingVenueEventName(right));
  });
}

function getWrestlingVenueEventTimestamp(eventRow) {
  const explicitTimestamp = Number(eventRow?.dateSort || eventRow?.date_sort || 0);
  if (Number.isFinite(explicitTimestamp) && explicitTimestamp > 0) {
    return explicitTimestamp;
  }
  const parsedDate = parseWrestlingShowDate(eventRow?.rawDate || eventRow?.date || eventRow?.eventDate || eventRow?.show_date);
  return parsedDate ? parsedDate.getTime() : 0;
}

function getWrestlingVenueEventName(eventRow) {
  return getWrestlingText(
    eventRow?.title ||
    eventRow?.showName ||
    eventRow?.show_name ||
    eventRow?.eventName ||
    eventRow?.event_name ||
    eventRow?.name,
    "Event Pending"
  );
}

function getWrestlingVenueEventDate(eventRow) {
  return getWrestlingText(
    eventRow?.eventDate ||
    eventRow?.formattedDate ||
    formatWrestlingShowDate(eventRow?.rawDate || eventRow?.date || eventRow?.show_date),
    "Date Pending"
  );
}

function getWrestlingVenueEventPromotion(eventRow) {
  return getWrestlingText(eventRow?.promotion, "Promotion Pending");
}

function getWrestlingShowMatchesPhotoCount(eventRow) {
  const matches = getWrestlingArray(eventRow?.matches || eventRow?.matchRows || eventRow?.match_rows)
    .filter((match) => match && typeof match === "object");
  const matchPhotoCounts = matches
    .map((match) => getWrestlingPhotoCount(match))
    .filter((count) => count > 0);
  return matchPhotoCounts.length > 0 ? matchPhotoCounts.reduce((total, count) => total + count, 0) : 0;
}

function getWrestlingVenueEventPhotoCount(eventRow) {
  const displayPhotoCount = getWrestlingPhotoCount(eventRow);
  if (displayPhotoCount > 0) {
    return displayPhotoCount;
  }
  const matchPhotoCount = getWrestlingShowMatchesPhotoCount(eventRow);
  if (matchPhotoCount > 0) {
    return matchPhotoCount;
  }
  return getWrestlingVenueCountValue(eventRow, [
    eventRow?.photoCount,
    eventRow?.photo_count,
    eventRow?.stats?.photoCount,
    eventRow?.stats?.photos,
    eventRow?.photoIds,
    eventRow?.photo_ids,
  ]);
}

function getWrestlingVenueDetailStats(venue, relatedShows = []) {
  const eventCount = relatedShows.length || getWrestlingVenueEventCount(venue);
  const relatedPhotoCount = relatedShows
    .map(getWrestlingVenueEventPhotoCount)
    .filter((count) => count !== null && count > 0)
    .reduce((total, count) => total + count, 0);
  const photoCount = relatedPhotoCount > 0 ? relatedPhotoCount : getWrestlingVenuePhotoCount(venue);
  const sortedEvents = [...relatedShows].sort((left, right) => getWrestlingVenueEventTimestamp(left) - getWrestlingVenueEventTimestamp(right));
  const firstEvent = sortedEvents.find((eventRow) => getWrestlingVenueEventTimestamp(eventRow) > 0) || sortedEvents[0] || null;
  const latestEvent = [...sortedEvents].reverse().find((eventRow) => getWrestlingVenueEventTimestamp(eventRow) > 0) || sortedEvents[sortedEvents.length - 1] || null;

  return {
    events: eventCount,
    photos: photoCount,
    firstEvent: firstEvent ? getWrestlingVenueEventDate(firstEvent) : "",
    latestEvent: latestEvent ? getWrestlingVenueEventDate(latestEvent) : "",
  };
}

function createWrestlingVenueDetailBackButton() {
  const backButton = document.createElement("button");
  backButton.className = "wrestling-venue-detail-back";
  backButton.type = "button";
  backButton.textContent = "Back to Wrestling Venues";
  backButton.addEventListener("click", returnToWrestlingVenuesRoute);
  return backButton;
}

function createWrestlingVenueDetailState(stateName = "loading", copy = {}) {
  const statePanel = document.createElement("section");
  statePanel.className = "wrestling-venue-event-history";
  statePanel.append(createWrestlingV3StateCard(stateName, "wrestlingVenues", {
    title: copy.title,
    text: copy.text || copy.copy,
    retry: stateName === "error",
  }));
  return statePanel;
}

function appendWrestlingVenueMeta(facts, label, value) {
  const displayValue = getWrestlingText(value);
  if (!facts || !displayValue) {
    return;
  }
  facts.append(createWrestlingVenueMeta(label, displayValue));
}

function appendWrestlingVenueCountMeta(facts, label, value) {
  const numericValue = Number.parseInt(value, 10);
  if (!facts || !Number.isFinite(numericValue) || numericValue < 0) {
    return;
  }
  facts.append(createWrestlingVenueMeta(label, numericValue.toLocaleString()));
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
  const eventNameText = getWrestlingVenueEventName(eventRow);
  const eventDateText = getWrestlingVenueEventDate(eventRow);
  const eventPromotionText = getWrestlingVenueEventPromotion(eventRow);
  const eventPhotoCount = getWrestlingVenueEventPhotoCount(eventRow);
  const showRoute = getWrestlingShowRouteUrl(eventRow);
  row.className = "wrestling-venue-event-row";
  row.setAttribute("role", "listitem");
  row.dataset.wrestlingShowId = eventRow.showId || eventRow.eventId || eventRow.show_id || "";
  row.dataset.wrestlingShowRoute = showRoute;
  setWrestlingRelationshipDataset(row, eventRow);

  const eventBlock = document.createElement("div");
  eventBlock.className = "wrestling-venue-event-name";

  const eventName = document.createElement("h4");
  eventName.textContent = eventNameText;

  const promotion = document.createElement("p");
  promotion.textContent = eventPromotionText;

  eventBlock.append(eventName, promotion);

  const date = document.createElement("p");
  date.className = "wrestling-venue-event-date";
  date.textContent = eventDateText;

  const photos = document.createElement("p");
  photos.className = "wrestling-venue-event-photos";
  photos.textContent = eventPhotoCount !== null ? formatWrestlingCount(eventPhotoCount, "Photos") : "";

  const openButton = document.createElement("button");
  openButton.className = "wrestling-venue-event-open";
  openButton.type = "button";
  openButton.setAttribute("aria-label", `Open event ${eventNameText}`);
  openButton.dataset.wrestlingShowId = row.dataset.wrestlingShowId;
  openButton.dataset.wrestlingShowRoute = showRoute;
  setWrestlingRelationshipDataset(openButton, eventRow);
  openButton.textContent = "Open Event";
  openButton.addEventListener("click", () => {
    navigateToRoute(showRoute, {
      historyState: {
        fromWrestlingVenueDetail: true,
        venueUrl: getWrestlingVenueRouteUrl(findWrestlingVenueById(activeWrestlingVenueId, { allowFallback: false }) || activeWrestlingVenueId),
      },
    });
  });

  row.append(eventBlock, date);
  if (photos.textContent) {
    row.append(photos);
  }
  row.append(openButton);
  return row;
}

function requestWrestlingVenueRelatedEventPhotoCounts(relatedEvents = [], options = {}) {
  if (options.skipPhotoRequest) {
    return;
  }
  relatedEvents
    .filter((eventRow) => getWrestlingVenueEventPhotoCount(eventRow) === 0)
    .slice(0, 5)
    .forEach((eventRow) => {
      const matches = getWrestlingArray(eventRow?.matches || eventRow?.matchRows || eventRow?.match_rows)
        .filter((match) => match && typeof match === "object");
      if (matches.length === 0) {
        return;
      }
      const galleryMatchId = eventRow?.galleryMatchId || eventRow?.gallery_match_id || eventRow?.matchIds?.[0] || eventRow?.match_ids?.[0] || "";
      const galleryMatch = findWrestlingMatchInRowsByRef(matches, galleryMatchId) || matches[0];
      if (!galleryMatch) {
        return;
      }
      requestWrestlingMatchPhotosForRoute(
        eventRow.dateKey || eventRow.date_key || eventRow.showId || eventRow.eventId || eventRow.show_id,
        getWrestlingMatchRouteRef(galleryMatch, matches.indexOf(galleryMatch)),
        eventRow
      );
    });
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

function renderWrestlingVenueDetailRoute(venueId, options = {}) {
  if (!wrestlingVenueDetailShell) {
    return;
  }

  cancelWrestlingPeopleBackgroundHydrationIfRouteUnneeded();

  const normalizedVenueId = normalizeWrestlingVenueId(venueId);
  const normalizedPublicVenueId = normalizeWrestlingVenuePublicSlug(venueId);
  const pendingRequests = [];
  if (!options.skipDataRequest) {
    if (wrestlingVenuesDataState !== "live") {
      if (wrestlingVenuesRequest) {
        pendingRequests.push(wrestlingVenuesRequest);
      } else if (!wrestlingVenuesLoaded) {
        pendingRequests.push(requestWrestlingVenuesData());
      }
    }
    if (wrestlingShowsDataState !== "live") {
      if (wrestlingShowsRequest) {
        pendingRequests.push(wrestlingShowsRequest);
      } else if (!wrestlingShowsDataRequested) {
        pendingRequests.push(requestWrestlingShowsData());
      }
    }
    if (pendingRequests.length > 0) {
      Promise.allSettled(pendingRequests).then(() => {
        const route = getRouteFromUrl();
        const routeVenueIds = new Set([
          normalizeWrestlingVenueId(route.venueId),
          normalizeWrestlingVenuePublicSlug(route.venueId),
        ].filter(Boolean));
        if (route.name === "wrestling-venue-detail" && (routeVenueIds.has(normalizedVenueId) || routeVenueIds.has(normalizedPublicVenueId))) {
          renderWrestlingVenueDetailRoute(venueId, { skipDataRequest: true });
        }
      });
    }
  }

  const venue = findWrestlingVenueById(venueId, { allowFallback: false });
  activeWrestlingVenueId = venue ? getWrestlingVenueRowId(venue) : normalizedVenueId;
  setActiveWrestlingVenueCard(activeWrestlingVenueId);

  const backButton = createWrestlingVenueDetailBackButton();

  if (!venue) {
    const isLoading = wrestlingVenuesDataState === "idle" || wrestlingVenuesDataState === "loading";
    const stateName = wrestlingVenuesDataState === "error" ? "error" : isLoading ? "loading" : "empty";
    const copy = stateName === "empty"
      ? { title: "Archive Record Unavailable", text: "No matching archive record was found." }
      : stateName === "error"
        ? { title: "Unable To Load Archive Data", text: "Unable to load archive data." }
      : {};
    wrestlingVenueDetailShell.replaceChildren(backButton, createWrestlingVenueDetailState(stateName, copy));
    return;
  }

  const relatedEvents = getWrestlingVenueRelatedShowRows(venue);
  const venueStats = getWrestlingVenueDetailStats(venue, relatedEvents);
  const venueName = getWrestlingVenueRowName(venue);
  const geo = getWrestlingVenueGeo(venue);
  setWrestlingRelationshipDataset(wrestlingVenueDetailShell, venue);
  wrestlingVenueDetailShell.dataset.wrestlingVenueId = activeWrestlingVenueId;

  const hero = document.createElement("section");
  hero.className = "wrestling-venue-detail-hero";
  hero.setAttribute("aria-label", `${venueName} venue dossier`);

  const image = document.createElement("div");
  image.className = "wrestling-venue-detail-image";
  image.setAttribute("role", "img");
  image.setAttribute("aria-label", `${venueName} venue mark`);

  const imageLabel = document.createElement("span");
  imageLabel.setAttribute("aria-hidden", "true");
  imageLabel.textContent = venue.imageLabel || getWrestlingVenueInitials(venueName);
  image.append(imageLabel);

  const summary = document.createElement("div");
  summary.className = "wrestling-venue-detail-summary";

  const name = document.createElement("h2");
  name.className = "wrestling-venue-detail-title";
  name.id = "wrestling-venue-detail-title";
  name.textContent = venueName;

  const location = document.createElement("p");
  location.className = "wrestling-venue-detail-location";
  location.textContent = getWrestlingVenueLocationText(venue);

  const facts = document.createElement("dl");
  facts.className = "wrestling-venue-facts";
  appendWrestlingVenueMeta(facts, "City", getWrestlingVenueCity(venue));
  appendWrestlingVenueMeta(facts, "State", getWrestlingVenueDisplayState(venue));
  appendWrestlingVenueMeta(facts, "Country", getWrestlingVenueCountry(venue));
  appendWrestlingVenueMeta(facts, "Address", geo.formatted_address);
  appendWrestlingVenueMeta(facts, "Postal Code", geo.postal_code);
  appendWrestlingVenueMeta(facts, "County", geo.county);
  appendWrestlingVenueMeta(facts, "Timezone", geo.timezone);
  appendWrestlingVenueMeta(facts, "Latitude", getWrestlingVenueDetailLatitude(venue));
  appendWrestlingVenueMeta(facts, "Longitude", getWrestlingVenueDetailLongitude(venue));
  appendWrestlingVenueMeta(facts, "GeoHash", geo.geohash);
  appendWrestlingVenueMeta(facts, "Elevation", geo.elevation);
  appendWrestlingVenueMeta(facts, "Venue Type", getWrestlingVenueType(venue));
  appendWrestlingVenueMeta(facts, "Region", venue.region);
  appendWrestlingVenueMeta(facts, "Status", getWrestlingVenueStatus(venue));
  appendWrestlingVenueMeta(facts, "First Event", venueStats.firstEvent);
  appendWrestlingVenueMeta(facts, "Latest Event", venueStats.latestEvent);
  appendWrestlingVenueCountMeta(facts, "Event Count", venueStats.events);
  appendWrestlingVenueCountMeta(facts, "Photo Count", venueStats.photos);
  appendWrestlingVenueMeta(facts, "Notes", venue.notes || venue.backend_record?.notes);

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
    renderWrestlingV3State(eventList, forcedState, "wrestlingVenues");
  } else if (wrestlingShowsDataState === "loading" || wrestlingShowsDataState === "idle") {
    eventList.append(createWrestlingV3StateCard("loading", "wrestlingVenues", {
      text: "Loading venue event history.",
    }));
  } else if (wrestlingShowsDataState === "error") {
    eventList.append(createWrestlingV3StateCard("error", "wrestlingVenues", {
      text: "Event history could not load from the wrestling show archive.",
    }));
  } else if (relatedEvents.length === 0) {
    eventList.append(createWrestlingVenuesEmptyState("No event history indexed for this venue yet."));
  } else {
    relatedEvents.forEach((eventRow) => {
      eventList.append(createWrestlingVenueEventRow(eventRow));
    });
    if (forcedState === "partial") {
      eventList.append(createMockStateCard("partial", "wrestlingVenues"));
    }
  }

  eventHistory.append(eventTitle, eventList);
  wrestlingVenueDetailShell.replaceChildren(backButton, hero, eventHistory);
  requestWrestlingVenueRelatedEventPhotoCounts(relatedEvents, options);
}

function createWrestlingPersonMeta(label, value) {
  const displayValue = getWrestlingPersonFactText(value);
  if (!displayValue) {
    return null;
  }

  const fact = document.createElement("div");
  fact.className = "wrestling-person-fact";

  const factLabel = document.createElement("dt");
  factLabel.textContent = label;

  const factValue = document.createElement("dd");
  factValue.textContent = displayValue;

  fact.append(factLabel, factValue);
  return fact;
}

function getWrestlingPersonFactText(value) {
  if (Array.isArray(value)) {
    return value.map((item) => getWrestlingText(item)).filter(Boolean).join(" / ");
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toLocaleString() : "";
  }
  return getWrestlingText(value);
}

function getWrestlingPersonDetailFacts(person) {
  const teamAssociationValue = person.teamsAndAssociations || person.teamsAndStables;
  return [
    ["Legal Name", person.legalName],
    ["Category", person.categoryDisplay || person.role],
    ["Aliases", person.aliases],
    ["Teams / Associations", teamAssociationValue],
    ["Events", getWrestlingPeopleCountValue(person.eventCount, person.events, person.event_count, person.show_count)],
    ["Matches", getWrestlingPeopleCountValue(person.matchCount, person.matches, person.match_count)],
    ["Photos", getWrestlingPeopleCountValue(person.photoCount, person.photos, person.photo_count)],
  ]
    .map(([label, value]) => createWrestlingPersonMeta(label, value))
    .filter(Boolean);
}

function getWrestlingPersonCandidateValues(value, target = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => getWrestlingPersonCandidateValues(item, target));
    return target;
  }

  if (value && typeof value === "object") {
    [
      value.personId,
      value.person_id,
      value.wrestling_person_id,
      value.id,
      value.slug,
      value.name,
      value.display_name,
      value.displayName,
      value.ring_name,
      value.ringName,
      value.legal_name,
      value.legalName,
      value.real_name,
      value.birth_name,
      value.title,
      value.alias,
      value.aliases,
      value.ring_names,
      value.ringNames,
      value.person,
      value.wrestler,
      value.participant,
      value.manager,
      value.referee,
    ].forEach((item) => getWrestlingPersonCandidateValues(item, target));
    return target;
  }

  const text = getWrestlingText(value);
  if (text) {
    target.push(text);
  }
  return target;
}

function getWrestlingPersonNameParts(value) {
  const text = getWrestlingText(value);
  if (!text) {
    return [];
  }

  const cleanText = text
    .replace(/\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const parts = [text, cleanText];
  if (/[,&+\/]|\s+(?:and|vs\.?|v\.)\s+/i.test(cleanText)) {
    parts.push(...cleanText.split(/\s*(?:,|\/|&|\+)\s*|\s+(?:and|vs\.?|v\.)\s+/i));
  }

  return parts
    .map((part) => getWrestlingText(part))
    .filter((part, index, values) => part && values.findIndex((candidate) => candidate.toLowerCase() === part.toLowerCase()) === index);
}

function getWrestlingPersonCandidateTokens(value) {
  return getWrestlingPersonCandidateValues(value)
    .flatMap(getWrestlingPersonNameParts)
    .map((part) => normalizeWrestlingPersonId(part))
    .filter(Boolean);
}

function getWrestlingPersonHistoryNeedles(person) {
  const source = person?.backend_record && typeof person.backend_record === "object"
    ? { ...person.backend_record, ...person }
    : person;
  return new Set(getWrestlingPersonCandidateTokens([
    person?.personId,
    source?.personId,
    source?.person_id,
    source?.wrestling_person_id,
    source?.id,
    source?.slug,
    person?.name,
    source?.display_name,
    source?.displayName,
    source?.ring_name,
    source?.ringName,
    source?.name,
    source?.title,
    person?.legalName,
    source?.legal_name,
    source?.legalName,
    source?.real_name,
    source?.birth_name,
    person?.aliases,
    source?.aliases,
    source?.alias,
    source?.ring_names,
    source?.ringNames,
  ]));
}

function doesWrestlingPersonMatchValue(value, personNeedles) {
  if (!personNeedles || personNeedles.size === 0) {
    return false;
  }
  return getWrestlingPersonCandidateTokens(value).some((token) => personNeedles.has(token));
}

function getWrestlingMatchFieldValues(match, fields) {
  const backendRecord = match?.backend_record && typeof match.backend_record === "object" ? match.backend_record : {};
  return fields.flatMap((field) => [match?.[field], backendRecord?.[field]]);
}

function doesWrestlingPersonMatchFields(match, fields, personNeedles) {
  return getWrestlingMatchFieldValues(match, fields).some((value) => doesWrestlingPersonMatchValue(value, personNeedles));
}

function getWrestlingMatchPersonRole(match, personNeedles) {
  const roleFields = [
    { label: "Winner", fields: ["winner", "winners"] },
    { label: "Participant", fields: ["participants", "personIds", "person_ids", "side_1", "side1", "side_2", "side2", "team_1", "team1", "team_2", "team2", "related_people"] },
    { label: "Referee", fields: ["referee", "referees", "refereeIds", "referee_ids"] },
    { label: "Manager", fields: ["manager", "managers", "managerIds", "manager_ids"] },
    { label: "Featured", fields: ["extra_people", "extraPeople", "commentators", "commentatorIds", "commentator_ids", "contributors", "contributorIds", "contributor_ids"] },
    { label: "Tagged", fields: ["tagged_people", "taggedPeople"] },
  ];
  const roles = roleFields
    .filter((role) => doesWrestlingPersonMatchFields(match, role.fields, personNeedles))
    .map((role) => role.label);

  if (roles.includes("Winner")) {
    return roles.filter((role) => role !== "Participant" && role !== "Tagged").join(" / ");
  }
  if (roles.some((role) => role !== "Tagged")) {
    return roles.filter((role) => role !== "Tagged").join(" / ");
  }
  return roles.join(" / ");
}

function createWrestlingPersonHistoryRowFromMatch(show, match, person, matchIndex = 0) {
  const personNeedles = getWrestlingPersonHistoryNeedles(person);
  const personRole = getWrestlingMatchPersonRole(match, personNeedles);
  if (!personRole) {
    return null;
  }

  const matchSource = match?.backend_record && typeof match.backend_record === "object" ? match.backend_record : {};
  const rawDate = show?.rawDate || show?.date || show?.eventDate || show?.show_date;
  const matchOrder = Number.parseInt(match?.matchOrder || match?.match_order || match?.order || matchIndex + 1, 10) || matchIndex + 1;
  const matchRef = getWrestlingMatchRouteRef(match, matchIndex);
  return {
    ...match,
    showId: show?.showId || show?.eventId,
    eventId: show?.eventId || show?.showId,
    dateKey: show?.dateKey || show?.date_key || getWrestlingShowDateKey(rawDate),
    matchId: match?.matchId || match?.match_id || match?.id || normalizeWrestlingArchiveSlug(getWrestlingMatchDisplayName(match), `match-${matchOrder}`),
    matchRef,
    venueId: show?.venueId || show?.venue_id,
    eventName: getWrestlingText(show?.title || show?.eventName || show?.showName || show?.show_name, "Wrestling Event"),
    eventDate: getWrestlingText(show?.eventDate || formatWrestlingShowDate(rawDate)),
    eventTimestamp: getWrestlingShowTimestamp(show),
    promotion: getWrestlingText(show?.promotion),
    venue: getWrestlingText(show?.venue || getWrestlingVenueName(show)),
    location: getWrestlingText(show?.location || getWrestlingShowLocation(show)),
    matchName: getWrestlingMatchDisplayName(match),
    matchType: getWrestlingText(
      matchSource.match_type ||
      matchSource.matchType ||
      matchSource.stipulation ||
      match?.matchType ||
      match?.match_type ||
      matchSource.notes ||
      match?.notes ||
      match?.type,
      "Match"
    ),
    matchOrder,
    personRole,
    photoCount: getWrestlingPhotoCount(match),
    personIds: match?.personIds || match?.person_ids || [],
    refereeIds: match?.refereeIds || match?.referee_ids || [],
    managerIds: match?.managerIds || match?.manager_ids || [],
    contributorIds: match?.contributorIds || match?.contributor_ids || [],
    taggedPeople: match?.taggedPeople || match?.tagged_people || [],
  };
}

function getWrestlingPersonShowMatchHistoryRows(person) {
  if (!Array.isArray(wrestlingShowsCollection) || wrestlingShowsCollection.length === 0) {
    return [];
  }

  return wrestlingShowsCollection.flatMap((show) => {
    const matches = Array.isArray(show?.matches) ? show.matches : [];
    return matches
      .map((match, matchIndex) => createWrestlingPersonHistoryRowFromMatch(show, match, person, matchIndex))
      .filter(Boolean);
  });
}

function getWrestlingPersonHistoryTimestamp(row) {
  const explicitTimestamp = Number(row?.eventTimestamp || row?.dateSort);
  if (Number.isFinite(explicitTimestamp) && explicitTimestamp > 0) {
    return explicitTimestamp;
  }
  const parsed = parseWrestlingShowDate(row?.rawDate || row?.date || row?.eventDate || row?.showDate || row?.show_date);
  return parsed ? parsed.getTime() : 0;
}

function getWrestlingPersonHistoryDedupeKey(row) {
  const showKey = normalizeWrestlingArchiveSlug(row?.dateKey || row?.showId || row?.eventId || row?.eventName, "");
  const matchKey = normalizeWrestlingArchiveSlug(row?.matchRef || row?.matchId || row?.matchName, "");
  const roleKey = normalizeWrestlingPersonId(row?.personRole || "");
  return [showKey, matchKey, roleKey].join("|");
}

function getUniqueSortedWrestlingPersonHistoryRows(rows) {
  const uniqueRows = new Map();
  rows.filter(Boolean).forEach((row) => {
    const key = getWrestlingPersonHistoryDedupeKey(row);
    if (key && !uniqueRows.has(key)) {
      uniqueRows.set(key, row);
    }
  });

  return Array.from(uniqueRows.values()).sort((left, right) => {
    const leftTimestamp = getWrestlingPersonHistoryTimestamp(left);
    const rightTimestamp = getWrestlingPersonHistoryTimestamp(right);
    if (leftTimestamp || rightTimestamp) {
      const dateSort = rightTimestamp - leftTimestamp;
      if (dateSort !== 0) {
        return dateSort;
      }
    }

    const leftOrder = Number.parseInt(left.matchOrder || left.match_order, 10) || 0;
    const rightOrder = Number.parseInt(right.matchOrder || right.match_order, 10) || 0;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return getWrestlingText(left.eventName).localeCompare(getWrestlingText(right.eventName));
  });
}

function getWrestlingHistoryMetaText(...values) {
  return values
    .map((value) => getWrestlingText(value))
    .filter((value) => value && !/^(?:date|promotion|venue|location) pending$/i.test(value))
    .filter((value, index, allValues) => allValues.findIndex((candidate) => candidate.toLowerCase() === value.toLowerCase()) === index)
    .join(" / ");
}

function normalizeWrestlingPersonHistoryRow(row, person) {
  const source = row && typeof row === "object" ? { ...row } : { matchName: getWrestlingText(row) };
  const eventName = getWrestlingText(
    source.eventName ||
    source.event_name ||
    source.showName ||
    source.show_name ||
    source.title ||
    source.name
  );
  const matchName = getWrestlingText(
    source.matchName ||
    source.match_name ||
    source.matchTitle ||
    source.match_title ||
    source.name
  );
  const rawDate = source.eventDate || source.event_date || source.date || source.showDate || source.show_date;
  const matchOrder = Number.parseInt(source.matchOrder || source.match_order || source.order, 10) || 0;

  if (!eventName && !matchName) {
    return null;
  }

  return {
    ...source,
    showId: getWrestlingText(source.showId || source.show_id || source.eventId || source.event_id || source.id, normalizeWrestlingArchiveSlug(eventName || matchName, "")),
    eventId: getWrestlingText(source.eventId || source.event_id || source.showId || source.show_id || source.id, normalizeWrestlingArchiveSlug(eventName || matchName, "")),
    dateKey: getWrestlingText(source.dateKey || source.date_key || getWrestlingShowDateKey(rawDate)),
    matchId: getWrestlingText(source.matchId || source.match_id || source.id, normalizeWrestlingArchiveSlug(matchName || eventName, "")),
    matchRef: getWrestlingText(source.matchRef || source.match_ref || getWrestlingMatchRouteRef(source, matchOrder ? matchOrder - 1 : -1)),
    eventName: eventName || matchName,
    eventDate: getWrestlingText(rawDate),
    eventTimestamp: getWrestlingPersonHistoryTimestamp(source),
    promotion: getWrestlingText(source.promotion),
    venue: getWrestlingText(source.venue || source.venue_name || source.venueName),
    location: getWrestlingText(source.location || [source.city, source.state].filter(Boolean).join(", ")),
    matchName: matchName || eventName,
    matchType: getWrestlingText(source.matchType || source.match_type || source.type || person.categoryDisplay),
    matchOrder,
    personRole: getWrestlingText(source.personRole || source.person_role || source.role),
    photoCount: getWrestlingPhotoCount(source),
    personIds: source.personIds || source.person_ids || [person.personId],
    taggedPeople: source.taggedPeople || source.tagged_people || [],
  };
}

function getWrestlingPersonDbHistoryRows(person) {
  const source = person?.backend_record && typeof person.backend_record === "object"
    ? { ...person.backend_record, ...person }
    : person;
  return [
    source?.event_history,
    source?.eventHistory,
    source?.match_history,
    source?.matchHistory,
    source?.history,
    Array.isArray(source?.events) ? source.events : [],
    Array.isArray(source?.matches) ? source.matches : [],
  ]
    .flatMap((rows) => Array.isArray(rows) ? rows : [])
    .map((row) => normalizeWrestlingPersonHistoryRow(row, person))
    .filter(Boolean);
}

function doesWrestlingHistoryRowReferencePerson(row, personId) {
  const normalizedPersonId = normalizeWrestlingPersonId(personId);
  if (!normalizedPersonId) {
    return false;
  }

  const taggedPeople = getWrestlingArray(row?.taggedPeople || row?.tagged_people)
    .map((person) => person?.personId || person?.person_id || person?.id || person);
  const candidateIds = [
    row?.personId,
    row?.person_id,
    ...getWrestlingArray(row?.personIds || row?.person_ids),
    ...taggedPeople,
    ...getWrestlingArray(row?.refereeIds || row?.referee_ids),
    ...getWrestlingArray(row?.managerIds || row?.manager_ids),
    ...getWrestlingArray(row?.commentatorIds || row?.commentator_ids),
    ...getWrestlingArray(row?.contributorIds || row?.contributor_ids),
  ];

  return candidateIds.some((candidate) => normalizeWrestlingPersonId(candidate) === normalizedPersonId);
}

function getWrestlingPersonEventHistoryRows(person) {
  const dbHistoryRows = getWrestlingPersonDbHistoryRows(person);
  const showMatchHistoryRows = getWrestlingPersonShowMatchHistoryRows(person);
  if (person.isDbBacked || dbHistoryRows.length > 0 || showMatchHistoryRows.length > 0) {
    return getUniqueSortedWrestlingPersonHistoryRows([...dbHistoryRows, ...showMatchHistoryRows]);
  }
  return getUniqueSortedWrestlingPersonHistoryRows(
    wrestlingPersonEventHistoryRows.filter((eventRow) => doesWrestlingHistoryRowReferencePerson(eventRow, person.personId))
  );
}

function getWrestlingPersonEventMatchRoute(eventRow) {
  const showRouteCode = getWrestlingText(
    eventRow?.dateKey ||
    eventRow?.date_key ||
    getWrestlingShowDateKey(eventRow?.eventDate || eventRow?.date || eventRow?.showDate || eventRow?.show_date) ||
    eventRow?.showId ||
    eventRow?.eventId
  );
  const matchRef = getWrestlingText(eventRow?.matchRef || eventRow?.match_ref || getWrestlingMatchRouteRef(eventRow));
  return showRouteCode && matchRef ? getWrestlingMatchRouteUrlByIds(showRouteCode, matchRef) : "";
}

function toggleWrestlingPersonEventRow(row, eventRow = null, person = null) {
  if (!row) {
    return;
  }
  const isExpanded = !row.classList.contains("is-expanded");
  const panel = row.querySelector(".wrestling-event-history-expanded");
  const toggle = row.querySelector(".wrestling-event-history-toggle");
  row.classList.toggle("is-expanded", isExpanded);
  row.setAttribute("aria-expanded", String(isExpanded));
  if (panel) {
    panel.hidden = !isExpanded;
  }
  if (toggle) {
    toggle.textContent = isExpanded ? "-" : "+";
  }
  if (isExpanded && eventRow && person) {
    hydrateWrestlingPersonEventRowTaggedPhotos(row, eventRow, person);
  } else if (!isExpanded && row.dataset.wrestlingTaggedPhotoState === "loading") {
    row.dataset.wrestlingTaggedPhotoRequestToken = String(++wrestlingPersonTaggedPhotoRequestToken);
    row.dataset.wrestlingTaggedPhotoState = "idle";
  }
}

function navigateToWrestlingPersonEventMatch(eventRow) {
  const matchRoute = getWrestlingPersonEventMatchRoute(eventRow);
  if (matchRoute) {
    navigateToRoute(matchRoute);
  }
}

function createWrestlingEventHistoryPhotoPlaceholder(text) {
  const placeholder = document.createElement("span");
  placeholder.className = "wrestling-event-history-photo-placeholder";
  placeholder.textContent = text;
  return placeholder;
}

function getWrestlingPersonCaptionMatchNames(person) {
  const source = person?.backend_record && typeof person.backend_record === "object"
    ? { ...person.backend_record, ...person }
    : person;
  return [
    person?.name,
    source?.name,
    source?.display_name,
    source?.displayName,
    source?.ring_name,
    source?.ringName,
    ...getWrestlingPersonAliases(source),
    ...getWrestlingPersonAliases(person),
  ]
    .map((value) => getWrestlingText(value))
    .filter((value, index, values) => value && values.findIndex((candidate) => candidate.toLowerCase() === value.toLowerCase()) === index);
}

function getWrestlingPersonCaptionNameParts(photo) {
  return getWrestlingText(photo?.caption || photo?.Caption)
    .split(";")
    .map((name) => name.trim())
    .filter(Boolean);
}

function doesWrestlingPersonCaptionMatch(photo, matchNames) {
  const normalizedNames = new Set((Array.isArray(matchNames) ? matchNames : [])
    .map((name) => getWrestlingText(name).toLowerCase())
    .filter(Boolean));
  if (normalizedNames.size === 0) {
    return false;
  }
  return getWrestlingPersonCaptionNameParts(photo)
    .some((name) => normalizedNames.has(name.toLowerCase()));
}

function getWrestlingPersonMatchedPhotoUrl(photo) {
  return getWrestlingPhotoField(photo, [
    "thumbnail_url",
    "thumbnailUrl",
    "small_url",
    "smallUrl",
    "medium_url",
    "mediumUrl",
    "large_url",
    "largeUrl",
    "url",
    "image_url",
    "imageUrl",
    "cover_image_url",
    "coverImageUrl",
    "poster",
    "poster_url",
    "posterUrl",
    "smugmug_url",
    "smugmugUrl",
    "thumbnailSrc",
  ]);
}

function getWrestlingPersonPhotoOriginalTimestamp(photo) {
  const rawDate = getWrestlingText(photo?.date_time_original || photo?.dateTimeOriginal || photo?.DateTimeOriginal);
  const timestamp = rawDate ? Date.parse(rawDate) : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function compareWrestlingPersonTaggedPhotos(left, right) {
  const leftTime = getWrestlingPersonPhotoOriginalTimestamp(left);
  const rightTime = getWrestlingPersonPhotoOriginalTimestamp(right);
  if (rightTime !== leftTime) {
    return rightTime - leftTime;
  }
  return getWrestlingText(right?.photoId || right?.image_key || right?.imageKey)
    .localeCompare(getWrestlingText(left?.photoId || left?.image_key || left?.imageKey));
}

function getWrestlingPersonEventRowLiveMatch(eventRow) {
  const showCandidates = [
    eventRow?.dateKey,
    eventRow?.date_key,
    eventRow?.showId,
    eventRow?.show_id,
    eventRow?.eventId,
    eventRow?.event_id,
  ].map((value) => getWrestlingText(value)).filter(Boolean);
  const matchCandidates = [
    eventRow?.matchRef,
    eventRow?.match_ref,
    getWrestlingMatchRouteRef(eventRow),
    eventRow?.matchId,
    eventRow?.match_id,
  ].map((value) => getWrestlingText(value)).filter(Boolean);

  for (const showId of showCandidates) {
    const show = findLiveWrestlingShowById(showId);
    if (!show) {
      continue;
    }
    for (const matchRef of matchCandidates) {
      const match = findWrestlingMatchInRowsByRef(show.matches, matchRef);
      if (match) {
        return match;
      }
    }
  }

  return null;
}

function getWrestlingPersonEventRowTaggedPhotos(eventRow, person) {
  const match = getWrestlingPersonEventRowLiveMatch(eventRow) || eventRow;
  return getWrestlingPersonTaggedPhotosFromMatch(match, person);
}

function getWrestlingPersonTaggedPhotosFromMatch(match, person) {
  const matchNames = getWrestlingPersonCaptionMatchNames(person);
  return getWrestlingMatchPhotoItems(match)
    .filter((photo) => getWrestlingPersonMatchedPhotoUrl(photo))
    .filter((photo) => doesWrestlingPersonCaptionMatch(photo, matchNames))
    .slice()
    .sort(compareWrestlingPersonTaggedPhotos);
}

function getWrestlingPersonEventRowPhotoShowId(eventRow) {
  return getWrestlingText(
    eventRow?.dateKey ||
    eventRow?.date_key ||
    eventRow?.showId ||
    eventRow?.show_id ||
    eventRow?.eventId ||
    eventRow?.event_id
  );
}

function getWrestlingPersonEventRowPhotoMatchRef(eventRow) {
  return getWrestlingText(
    eventRow?.matchRef ||
    eventRow?.match_ref ||
    getWrestlingMatchRouteRef(eventRow) ||
    eventRow?.matchId ||
    eventRow?.match_id
  );
}

function getWrestlingPersonEventRowPhotoSearch(eventRow, showId) {
  return getWrestlingText(
    eventRow?.dateKey ||
    eventRow?.date_key ||
    showId ||
    eventRow?.showKey ||
    eventRow?.show_key ||
    eventRow?.eventName ||
    eventRow?.event_name ||
    eventRow?.showName ||
    eventRow?.show_name
  );
}

function findWrestlingPersonPhotoPayloadShow(rows, eventRow, showId) {
  const candidates = [
    showId,
    eventRow?.dateKey,
    eventRow?.date_key,
    eventRow?.showId,
    eventRow?.show_id,
    eventRow?.eventId,
    eventRow?.event_id,
  ].map((value) => getWrestlingText(value)).filter(Boolean);

  for (const candidate of candidates) {
    const show = findWrestlingShowInRowsById(rows, candidate);
    if (show) {
      return show;
    }
  }

  return rows[0] || null;
}

function getWrestlingPersonEventRowPhotoEvidence(eventRow, match = null) {
  const source = match || getWrestlingPersonEventRowLiveMatch(eventRow) || eventRow;
  const photos = getWrestlingMatchPhotoItems(source);
  const sourcePhotoIds = getWrestlingMatchSourcePhotoIds(source);
  const photoCount = Math.max(
    getWrestlingPhotoCount(source),
    photos.length,
    sourcePhotoIds.length
  );

  return {
    match: source || null,
    photos,
    photoCount,
    hasPhotoEvidence: photoCount > 0 || photos.length > 0 || sourcePhotoIds.length > 0,
  };
}

function requestWrestlingPersonEventTaggedPhotos(eventRow, person) {
  const baseEvidence = getWrestlingPersonEventRowPhotoEvidence(eventRow);
  if (typeof fetch !== "function") {
    return Promise.reject(new Error("Wrestling person tagged photo request unavailable."));
  }

  const showId = getWrestlingPersonEventRowPhotoShowId(eventRow);
  const matchRef = getWrestlingPersonEventRowPhotoMatchRef(eventRow);
  const personId = normalizeWrestlingPersonId(person?.personId || person?.name);
  if (!showId || !matchRef || !personId) {
    return Promise.resolve({
      ok: true,
      photos: [],
      match: baseEvidence.match,
      matchPhotoCount: baseEvidence.photoCount,
      matchPhotosAvailable: baseEvidence.hasPhotoEvidence,
      confirmedEmpty: !baseEvidence.hasPhotoEvidence,
    });
  }

  const requestKey = [
    personId,
    normalizeWrestlingArchiveSlug(showId, ""),
    normalizeWrestlingArchiveSlug(matchRef, ""),
  ].join("|");
  if (wrestlingPersonTaggedPhotoRequests.has(requestKey)) {
    return wrestlingPersonTaggedPhotoRequests.get(requestKey);
  }

  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), WRESTLING_SHOWS_TIMEOUT_MS)
    : 0;
  const request = fetchWrestlingShowsPage(1, controller?.signal, {
    includePhotos: true,
    limit: 5,
    search: getWrestlingPersonEventRowPhotoSearch(eventRow, showId),
  })
    .then((payload) => {
      const rows = normalizeLiveWrestlingShows(payload);
      const enrichedShow = findWrestlingPersonPhotoPayloadShow(rows, eventRow, showId);
      const mergedShow = mergeWrestlingShowIntoCollection(enrichedShow);
      const showSource = mergedShow || enrichedShow;
      const match = showSource?.matches
        ? findWrestlingMatchInRowsByRef(showSource.matches, matchRef)
        : null;
      const photos = getWrestlingPersonTaggedPhotosFromMatch(match, person);
      const evidence = getWrestlingPersonEventRowPhotoEvidence(eventRow, match);
      return {
        ok: true,
        photos,
        match: evidence.match,
        matchPhotoCount: evidence.photoCount,
        matchPhotosAvailable: evidence.hasPhotoEvidence,
        confirmedEmpty: photos.length === 0 && !evidence.hasPhotoEvidence,
      };
    })
    .catch((error) => {
      wrestlingPersonTaggedPhotoRequests.delete(requestKey);
      throw error;
    })
    .finally(() => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    });

  wrestlingPersonTaggedPhotoRequests.set(requestKey, request);
  return request;
}

function getWrestlingPersonTaggedPhotoLightboxUrl(photo) {
  return getWrestlingPhotoField(photo, [
    "large_url",
    "largeUrl",
    "medium_url",
    "mediumUrl",
    "small_url",
    "smallUrl",
    "thumbnail_url",
    "thumbnailUrl",
    "lightboxSrc",
  ]);
}

function getWrestlingPersonTaggedLightboxPhotos(items) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => item && typeof item === "object" && getWrestlingPersonTaggedPhotoLightboxUrl(item));
}

function getWrestlingPersonTaggedLightboxPhotoLabel(photo, index = 0, person = {}) {
  return getWrestlingText(
    photo?.label ||
    photo?.title ||
    photo?.caption ||
    photo?.Caption ||
    photo?.image_key ||
    photo?.imageKey,
    `${person?.name || "Person"} tagged photo ${index + 1}`
  );
}

function createWrestlingPersonTaggedLightboxTile(photo, index = 0, eventRow = {}, person = {}) {
  const imageSrc = getWrestlingPersonMatchedPhotoUrl(photo) || getWrestlingPersonTaggedPhotoLightboxUrl(photo);
  const lightboxSrc = getWrestlingPersonTaggedPhotoLightboxUrl(photo) || imageSrc;
  const imageKey = getWrestlingText(photo?.photoId || photo?.image_key || photo?.imageKey || photo?.dedupeKey || lightboxSrc, `wrestling-person-tagged-photo-${index + 1}`);
  const label = getWrestlingPersonTaggedLightboxPhotoLabel(photo, index, person);
  const tile = document.createElement("button");
  tile.className = `archive-gallery-tile set-gallery-photo-tile${index === 0 ? " is-active" : ""}`;
  tile.type = "button";
  tile.dataset.galleryPhoto = "";
  tile.dataset.galleryPhotoLabel = label;
  tile.dataset.galleryKind = "image";
  tile.dataset.galleryMediaId = imageKey;
  tile.dataset.galleryLightboxId = `wrestling-person-tagged-photo-${normalizeWrestlingArchiveSlug(imageKey, String(index + 1))}`;
  tile.dataset.galleryLightboxSrc = lightboxSrc;
  tile.dataset.galleryBandTags = getWrestlingText(person?.name, "Wrestling");
  tile.dataset.galleryShow = getWrestlingText(eventRow?.eventName || eventRow?.showName || eventRow?.show_name, "Event Pending");
  tile.dataset.galleryVenue = getWrestlingText(eventRow?.venue, "Venue Pending");
  tile.dataset.galleryLocation = getWrestlingText(eventRow?.location, "Location Pending");
  tile.dataset.galleryDate = getWrestlingText(eventRow?.eventDate || eventRow?.date || eventRow?.showDate || eventRow?.show_date, "Date Pending");
  tile.dataset.galleryPerformance = getWrestlingHistoryMetaText(eventRow?.matchName, eventRow?.matchType, eventRow?.personRole);
  tile.setAttribute("aria-label", label);
  tile.setAttribute("aria-pressed", String(index === 0));

  const image = document.createElement("img");
  image.className = "archive-gallery-image";
  image.alt = "";
  if (imageSrc || lightboxSrc) {
    image.dataset.galleryImageSrc = imageSrc || lightboxSrc;
  }
  applyWrestlingGalleryImageLoading(image, index);
  if (typeof protectArchiveImage === "function") {
    protectArchiveImage(image);
  }
  tile.append(image);
  return tile;
}

function closeWrestlingPersonLightboxBridge() {
  if (musicNexusShell) {
    musicNexusShell.setAttribute("aria-hidden", "true");
    musicNexusShell.setAttribute("inert", "");
  }
  if (shell) {
    shell.classList.remove("is-music-nexus-view");
    shell.classList.add("is-wrestling-person-detail-view");
  }
  if (typeof setWrestlingPersonDetailHidden === "function") {
    setWrestlingPersonDetailHidden(false);
  } else if (wrestlingPersonDetailShell) {
    wrestlingPersonDetailShell.setAttribute("aria-hidden", "false");
    wrestlingPersonDetailShell.removeAttribute("inert");
  }
  if (wrestlingLightboxShell) {
    wrestlingLightboxShell.setAttribute("aria-hidden", "true");
    wrestlingLightboxShell.setAttribute("inert", "");
  }
}

function installWrestlingPersonLightboxBridge() {
  if (typeof shouldPreserveLightboxCustomTiles === "function" && !shouldPreserveLightboxCustomTiles.__wrestlingPersonBridge) {
    const preserveSharedLightboxCustomTiles = shouldPreserveLightboxCustomTiles;
    shouldPreserveLightboxCustomTiles = (returnContext) => {
      return returnContext?.source === "wrestling-person-detail" || preserveSharedLightboxCustomTiles(returnContext);
    };
    shouldPreserveLightboxCustomTiles.__wrestlingPersonBridge = true;
  }

  if (typeof returnToSetGalleryFromLightbox === "function" && !returnToSetGalleryFromLightbox.__wrestlingPersonBridge) {
    const returnToSharedLightboxSource = returnToSetGalleryFromLightbox;
    returnToSetGalleryFromLightbox = function returnToLightboxSourceWithWrestlingPersonBridge(...args) {
      if (activeWrestlingPersonLightboxContext) {
        closeWrestlingPersonTaggedPhotoLightbox();
        return;
      }
      return returnToSharedLightboxSource.apply(this, args);
    };
    returnToSetGalleryFromLightbox.__wrestlingPersonBridge = true;
  }
}

function bindWrestlingPersonLightboxCloseBridge() {
  if (isWrestlingPersonLightboxCloseBridgeBound) {
    return;
  }
  document.addEventListener("click", handleWrestlingPersonLightboxCloseClick, true);
  window.addEventListener("keydown", handleWrestlingPersonLightboxCloseKeydown, true);
  isWrestlingPersonLightboxCloseBridgeBound = true;
}

function unbindWrestlingPersonLightboxCloseBridge() {
  if (!isWrestlingPersonLightboxCloseBridgeBound) {
    return;
  }
  document.removeEventListener("click", handleWrestlingPersonLightboxCloseClick, true);
  window.removeEventListener("keydown", handleWrestlingPersonLightboxCloseKeydown, true);
  isWrestlingPersonLightboxCloseBridgeBound = false;
}

function closeWrestlingPersonTaggedPhotoLightbox() {
  const returnContext = activeWrestlingPersonLightboxContext;
  if (!returnContext) {
    return false;
  }

  const focusTarget = returnContext.focusElement && document.contains(returnContext.focusElement)
    ? returnContext.focusElement
    : null;
  const scrollTop = Number.isFinite(returnContext.scrollTop) ? returnContext.scrollTop : null;
  activeWrestlingPersonLightboxContext = null;
  unbindWrestlingPersonLightboxCloseBridge();
  if (typeof setLightboxVisible === "function") {
    setLightboxVisible(false);
  }
  closeWrestlingPersonLightboxBridge();
  if (typeof setCurrentView === "function") {
    setCurrentView("Person Detail");
  }
  window.requestAnimationFrame(() => {
    if (wrestlingPersonDetailShell && scrollTop !== null) {
      wrestlingPersonDetailShell.scrollTo({ top: scrollTop, behavior: "auto" });
    }
    if (focusTarget) {
      focusTarget.focus({ preventScroll: true });
    }
  });
  return true;
}

function handleWrestlingPersonLightboxCloseClick(event) {
  if (!activeWrestlingPersonLightboxContext) {
    return;
  }

  const target = event.target instanceof Element ? event.target : null;
  const lightboxPhotoTarget = typeof lightboxPhoto !== "undefined"
    ? lightboxPhoto
    : document.querySelector("[data-lightbox-photo]");
  const shouldClose = target?.closest?.("[data-lightbox-back]") || target === lightboxPhotoTarget;
  if (!shouldClose) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  closeWrestlingPersonTaggedPhotoLightbox();
}

function handleWrestlingPersonLightboxCloseKeydown(event) {
  if (!activeWrestlingPersonLightboxContext || event.key !== "Escape" || event.defaultPrevented) {
    return;
  }

  const sharedLightbox = typeof lightboxScreen !== "undefined"
    ? lightboxScreen
    : document.querySelector("[data-lightbox-screen]");
  if (sharedLightbox?.classList.contains("is-info-open")) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  closeWrestlingPersonTaggedPhotoLightbox();
}

function openWrestlingPersonTaggedPhotoLightbox(photos, photoIndex, trigger, eventRow = {}, person = {}) {
  installWrestlingPersonLightboxBridge();
  const lightboxPhotos = getWrestlingPersonTaggedLightboxPhotos(photos);
  if (
    lightboxPhotos.length === 0 ||
    typeof showLightbox !== "function" ||
    typeof activeLightboxCustomTiles === "undefined"
  ) {
    return;
  }

  const safeIndex = Math.max(0, Math.min(Number.parseInt(photoIndex, 10) || 0, lightboxPhotos.length - 1));
  const returnContext = {
    source: "wrestling-person-detail",
    focusElement: trigger || null,
    scrollTop: wrestlingPersonDetailShell ? wrestlingPersonDetailShell.scrollTop : 0,
  };
  activeWrestlingPersonLightboxContext = returnContext;
  bindWrestlingPersonLightboxCloseBridge();
  activeLightboxCustomTiles = lightboxPhotos.map((item, index) => createWrestlingPersonTaggedLightboxTile(item, index, eventRow, person));
  const targetTile = activeLightboxCustomTiles[safeIndex] || activeLightboxCustomTiles[0] || null;
  if (!targetTile) {
    activeWrestlingPersonLightboxContext = null;
    unbindWrestlingPersonLightboxCloseBridge();
    return;
  }

  if (musicNexusShell) {
    musicNexusShell.setAttribute("aria-hidden", "false");
    musicNexusShell.removeAttribute("inert");
  }
  if (shell) {
    shell.classList.add("is-music-nexus-view");
  }
  if (wrestlingPersonDetailShell) {
    wrestlingPersonDetailShell.setAttribute("aria-hidden", "true");
    wrestlingPersonDetailShell.setAttribute("inert", "");
  }
  if (wrestlingLightboxShell) {
    wrestlingLightboxShell.setAttribute("aria-hidden", "true");
    wrestlingLightboxShell.setAttribute("inert", "");
  }
  showLightbox(targetTile, { returnContext });
  const sharedLightboxOpen = typeof lightboxScreen !== "undefined" && lightboxScreen?.getAttribute("aria-hidden") === "false";
  if (!sharedLightboxOpen) {
    activeWrestlingPersonLightboxContext = null;
    unbindWrestlingPersonLightboxCloseBridge();
  }
}

function createWrestlingPersonEventTaggedThumb(photo, index = 0, eventRow = {}, person = {}, lightboxPhotos = []) {
  const imageUrl = getWrestlingPersonMatchedPhotoUrl(photo);
  if (!imageUrl) {
    return null;
  }

  const safeLightboxPhotos = getWrestlingPersonTaggedLightboxPhotos(lightboxPhotos);
  const lightboxIndex = safeLightboxPhotos.indexOf(photo);
  const canOpenLightbox = lightboxIndex >= 0;
  const thumb = document.createElement(canOpenLightbox ? "button" : "span");
  thumb.className = "wrestling-event-history-tagged-thumb";
  thumb.dataset.wrestlingPhotoId = getWrestlingText(photo?.photoId || photo?.image_key || photo?.imageKey || `tagged-photo-${index + 1}`);
  if (canOpenLightbox) {
    thumb.type = "button";
    thumb.setAttribute(
      "aria-label",
      `Open ${person?.name || "person"} tagged photo ${lightboxIndex + 1} of ${safeLightboxPhotos.length} from ${eventRow?.matchName || "this match"}`
    );
    thumb.addEventListener("click", (event) => {
      event.stopPropagation();
      openWrestlingPersonTaggedPhotoLightbox(safeLightboxPhotos, lightboxIndex, thumb, eventRow, person);
    });
  }

  const image = document.createElement("img");
  image.src = imageUrl;
  image.alt = getWrestlingText(photo?.caption || photo?.Caption, `${person?.name || "Person"} tagged photo`);
  applyWrestlingGalleryImageLoading(image, index);
  image.onerror = () => {
    image.remove();
    if (!thumb.textContent.trim()) {
      thumb.textContent = String(index + 1).padStart(2, "0");
    }
  };

  thumb.append(image);
  return thumb;
}

function setWrestlingPersonEventRowPhotoCountText(row, displayLabel) {
  const summaryCount = row?.querySelector(".wrestling-event-history-photos");
  if (summaryCount) {
    summaryCount.textContent = displayLabel;
  }
  const placeholderCounts = row?.querySelectorAll(".wrestling-event-history-photo-placeholder");
  if (placeholderCounts?.length > 1) {
    placeholderCounts[1].textContent = displayLabel;
  }
}

function updateWrestlingPersonEventRowPhotoCount(row, photoCount) {
  const displayCount = Number.parseInt(photoCount, 10) || 0;
  setWrestlingPersonEventRowPhotoCountText(row, formatWrestlingCount(displayCount, "Photos"));
}

function getWrestlingPersonEventRowStatusEvidence(eventRow, options = {}) {
  const evidence = options.evidence && typeof options.evidence === "object"
    ? options.evidence
    : getWrestlingPersonEventRowPhotoEvidence(eventRow, options.match);
  const optionPhotoCount = Number.parseInt(options.matchPhotoCount, 10);
  const photoCount = Math.max(
    Number.parseInt(evidence.photoCount, 10) || 0,
    Number.isFinite(optionPhotoCount) ? optionPhotoCount : 0
  );
  return {
    ...evidence,
    photoCount,
    hasPhotoEvidence: Boolean(evidence.hasPhotoEvidence || photoCount > 0 || options.matchPhotosAvailable === true),
  };
}

function hasWrestlingPersonEventRowTaggedPhotos(row) {
  const taggedCount = Number.parseInt(row?.dataset?.wrestlingTaggedPhotoCount, 10) || 0;
  return row?.dataset?.wrestlingTaggedPhotoState === "loaded" &&
    (taggedCount > 0 || Boolean(row?.querySelector(".wrestling-event-history-tagged-thumb")));
}

function setWrestlingPersonEventRowTaggedPhotoStatus(row, eventRow, person, options = {}) {
  if (!row || hasWrestlingPersonEventRowTaggedPhotos(row)) {
    return;
  }

  const photoGrid = row.querySelector(".wrestling-event-history-photo-placeholders");
  if (!photoGrid) {
    return;
  }

  const evidence = getWrestlingPersonEventRowStatusEvidence(eventRow, options);
  const confirmedEmpty = options.confirmedEmpty === true && !evidence.hasPhotoEvidence;
  const hasMatchPhotoEvidence = evidence.hasPhotoEvidence || evidence.photoCount > 0;
  const statusText = confirmedEmpty
    ? "No tagged photos loaded"
    : options.reason === "no-exact"
      ? "No exact tagged photos loaded"
      : "Tagged photos unavailable";
  const summaryText = confirmedEmpty
    ? formatWrestlingCount(0, "Photos")
    : hasMatchPhotoEvidence && evidence.photoCount > 0
      ? formatWrestlingCount(evidence.photoCount, "Photos")
      : "Photos unavailable";

  photoGrid.classList.remove("has-tagged-photos");
  photoGrid.classList.add("has-tagged-photo-status");
  photoGrid.setAttribute("aria-label", `${eventRow.matchName || "Match"} ${person.name || "person"} tagged photo status`);
  setWrestlingPersonEventRowPhotoCountText(row, summaryText);
  photoGrid.replaceChildren(
    createWrestlingEventHistoryPhotoPlaceholder(hasMatchPhotoEvidence ? "Match Gallery" : "Tagged Photos"),
    createWrestlingEventHistoryPhotoPlaceholder(statusText)
  );

  row.dataset.wrestlingTaggedPhotoState = confirmedEmpty ? "empty" : "unavailable";
  delete row.dataset.wrestlingTaggedPhotoCount;
  delete row.dataset.wrestlingTaggedPhotoPreviewCount;
  if (evidence.photoCount > 0) {
    row.dataset.wrestlingMatchPhotoCount = String(evidence.photoCount);
  } else {
    delete row.dataset.wrestlingMatchPhotoCount;
  }
}

function setWrestlingPersonEventRowTaggedPhotos(row, eventRow, person, photos) {
  const photoGrid = row?.querySelector(".wrestling-event-history-photo-placeholders");
  if (!photoGrid || !Array.isArray(photos) || photos.length === 0) {
    return;
  }

  const lightboxPhotos = getWrestlingPersonTaggedLightboxPhotos(photos);
  const previewPhotos = photos.slice(0, 4);
  const fragment = document.createDocumentFragment();
  previewPhotos.forEach((photo, index) => {
    const thumb = createWrestlingPersonEventTaggedThumb(photo, index, eventRow, person, lightboxPhotos);
    if (thumb) {
      fragment.append(thumb);
    }
  });

  if (!fragment.childNodes.length) {
    return;
  }

  const renderedCount = fragment.childNodes.length;
  photoGrid.classList.add("has-tagged-photos");
  photoGrid.classList.remove("has-tagged-photo-status");
  photoGrid.setAttribute("aria-label", `${eventRow.matchName || "Match"} ${person.name || "person"} tagged photos`);
  photoGrid.replaceChildren(fragment);
  row.dataset.wrestlingTaggedPhotoState = "loaded";
  row.dataset.wrestlingTaggedPhotoCount = String(photos.length);
  row.dataset.wrestlingTaggedPhotoPreviewCount = String(renderedCount);
  updateWrestlingPersonEventRowPhotoCount(row, photos.length);
}

function isWrestlingPersonEventRowHydrationCurrent(row, eventRow, person, requestToken = "") {
  if (!row || !eventRow || !person || !row.isConnected) {
    return false;
  }
  if (requestToken && row.dataset.wrestlingTaggedPhotoRequestToken !== requestToken) {
    return false;
  }
  if (row.getAttribute("aria-expanded") !== "true") {
    return false;
  }
  const eventMatchRoute = getWrestlingPersonEventMatchRoute(eventRow);
  if (eventMatchRoute && row.dataset.wrestlingMatchRoute && row.dataset.wrestlingMatchRoute !== eventMatchRoute) {
    return false;
  }
  if (typeof getRouteFromUrl === "function") {
    const route = getRouteFromUrl();
    if (route?.name !== "wrestling-person-detail") {
      return false;
    }
    const routePersonId = normalizeWrestlingPersonId(route.personId || route.params?.personId);
    const currentPersonId = normalizeWrestlingPersonId(person.personId || person.name);
    if (routePersonId && currentPersonId && routePersonId !== currentPersonId) {
      return false;
    }
  }
  return true;
}

function applyWrestlingPersonEventRowPhotoResult(row, eventRow, person, result, requestToken = "") {
  if (!isWrestlingPersonEventRowHydrationCurrent(row, eventRow, person, requestToken)) {
    return;
  }

  const requestedPhotos = Array.isArray(result?.photos) ? result.photos : [];
  const matchedPhotos = requestedPhotos.length > 0
    ? requestedPhotos
    : getWrestlingPersonEventRowTaggedPhotos(eventRow, person);
  if (matchedPhotos.length > 0) {
    setWrestlingPersonEventRowTaggedPhotos(row, eventRow, person, matchedPhotos);
    return;
  }

  const evidence = getWrestlingPersonEventRowStatusEvidence(eventRow, {
    match: result?.match,
    matchPhotoCount: result?.matchPhotoCount,
    matchPhotosAvailable: result?.matchPhotosAvailable,
  });
  if (evidence.hasPhotoEvidence) {
    setWrestlingPersonEventRowTaggedPhotoStatus(row, eventRow, person, {
      evidence,
      reason: "no-exact",
      matchPhotosAvailable: true,
    });
    return;
  }

  setWrestlingPersonEventRowTaggedPhotoStatus(row, eventRow, person, {
    evidence,
    confirmedEmpty: result?.confirmedEmpty === true,
  });
}

function hydrateWrestlingPersonEventRowTaggedPhotos(row, eventRow, person) {
  if (!row || !eventRow || !person || row.dataset.wrestlingTaggedPhotoState === "loading" || hasWrestlingPersonEventRowTaggedPhotos(row)) {
    return;
  }

  const currentPhotos = getWrestlingPersonEventRowTaggedPhotos(eventRow, person);
  if (currentPhotos.length > 0) {
    setWrestlingPersonEventRowTaggedPhotos(row, eventRow, person, currentPhotos);
    return;
  }

  const evidence = getWrestlingPersonEventRowPhotoEvidence(eventRow);
  if (evidence.photos.length > 0) {
    setWrestlingPersonEventRowTaggedPhotoStatus(row, eventRow, person, {
      evidence,
      reason: "no-exact",
      matchPhotosAvailable: true,
    });
    return;
  }

  const showId = getWrestlingPersonEventRowPhotoShowId(eventRow);
  const matchRef = getWrestlingPersonEventRowPhotoMatchRef(eventRow);
  if (!showId || !matchRef) {
    setWrestlingPersonEventRowTaggedPhotoStatus(row, eventRow, person, {
      evidence,
      confirmedEmpty: !evidence.hasPhotoEvidence,
      reason: evidence.hasPhotoEvidence ? "no-exact" : "empty",
      matchPhotosAvailable: evidence.hasPhotoEvidence,
    });
    return;
  }

  const requestToken = String(++wrestlingPersonTaggedPhotoRequestToken);
  row.dataset.wrestlingTaggedPhotoRequestToken = requestToken;
  row.dataset.wrestlingTaggedPhotoState = "loading";
  requestWrestlingPersonEventTaggedPhotos(eventRow, person)
    .then((result) => {
      applyWrestlingPersonEventRowPhotoResult(row, eventRow, person, result, requestToken);
    })
    .catch(() => {
      if (!isWrestlingPersonEventRowHydrationCurrent(row, eventRow, person, requestToken) || hasWrestlingPersonEventRowTaggedPhotos(row)) {
        return;
      }
      const latestPhotos = getWrestlingPersonEventRowTaggedPhotos(eventRow, person);
      if (latestPhotos.length > 0) {
        setWrestlingPersonEventRowTaggedPhotos(row, eventRow, person, latestPhotos);
        return;
      }
      setWrestlingPersonEventRowTaggedPhotoStatus(row, eventRow, person, {
        evidence: getWrestlingPersonEventRowPhotoEvidence(eventRow),
        reason: "failed",
      });
    });
}

function createWrestlingPersonEventRow(eventRow, person) {
  const row = document.createElement("article");
  const matchRoute = getWrestlingPersonEventMatchRoute(eventRow);
  const photoCountValue = getWrestlingPhotoCount(eventRow);
  row.className = "wrestling-event-history-row";
  row.setAttribute("role", "listitem");
  row.tabIndex = 0;
  row.setAttribute("aria-expanded", "false");
  row.dataset.wrestlingEventId = eventRow.eventId;
  row.dataset.wrestlingShowId = eventRow.showId || eventRow.eventId;
  row.dataset.wrestlingMatchId = eventRow.matchId;
  row.dataset.wrestlingMatchRef = getWrestlingMatchRouteRef(eventRow);
  row.dataset.wrestlingShowDateKey = eventRow.dateKey || eventRow.date_key || "";
  row.dataset.wrestlingMatchRoute = matchRoute;
  setWrestlingRelationshipDataset(row, eventRow);

  const eventBlock = document.createElement("div");
  eventBlock.className = "wrestling-event-history-event";

  const eventName = document.createElement("h4");
  eventName.textContent = eventRow.eventName;

  const eventDate = document.createElement("p");
  eventDate.textContent = getWrestlingHistoryMetaText(eventRow.eventDate, eventRow.promotion, eventRow.venue, eventRow.location);

  eventBlock.append(eventName, eventDate);

  const matchBlock = document.createElement("div");
  matchBlock.className = "wrestling-event-history-match";

  const matchName = document.createElement("p");
  matchName.className = "wrestling-event-history-match-name";
  matchName.textContent = eventRow.matchName;

  const matchType = document.createElement("p");
  matchType.className = "wrestling-event-history-match-type";
  matchType.textContent = getWrestlingHistoryMetaText(eventRow.matchType, eventRow.personRole);

  matchBlock.append(matchName, matchType);

  const photoCount = document.createElement("p");
  photoCount.className = "wrestling-event-history-photos";
  photoCount.textContent = formatWrestlingCount(photoCountValue, "Photos");

  const openButton = document.createElement("button");
  openButton.className = "wrestling-event-history-open";
  openButton.type = "button";
  openButton.setAttribute("aria-label", `Open match ${eventRow.matchName}`);
  openButton.title = row.dataset.wrestlingMatchRoute;
  openButton.dataset.wrestlingEventId = eventRow.eventId;
  openButton.dataset.wrestlingShowId = eventRow.showId || eventRow.eventId;
  openButton.dataset.wrestlingMatchId = eventRow.matchId;
  openButton.dataset.wrestlingMatchRef = row.dataset.wrestlingMatchRef;
  openButton.dataset.wrestlingShowDateKey = row.dataset.wrestlingShowDateKey;
  openButton.dataset.wrestlingMatchRoute = row.dataset.wrestlingMatchRoute;
  setWrestlingRelationshipDataset(openButton, eventRow);
  openButton.textContent = "Open Match";
  if (!matchRoute) {
    openButton.disabled = true;
    openButton.setAttribute("aria-disabled", "true");
  }
  openButton.addEventListener("click", (event) => {
    event.stopPropagation();
    navigateToWrestlingPersonEventMatch(eventRow);
  });

  const toggle = document.createElement("span");
  toggle.className = "wrestling-event-history-toggle";
  toggle.setAttribute("aria-hidden", "true");
  toggle.textContent = "+";

  const expanded = document.createElement("div");
  expanded.className = "wrestling-event-history-expanded";
  expanded.hidden = true;

  const placeholders = document.createElement("div");
  placeholders.className = "wrestling-event-history-photo-placeholders";
  placeholders.setAttribute("aria-label", `${eventRow.matchName} photo summary`);
  placeholders.append(
    createWrestlingEventHistoryPhotoPlaceholder("Match Gallery"),
    createWrestlingEventHistoryPhotoPlaceholder(formatWrestlingCount(photoCountValue, "Photos"))
  );

  const expandedMeta = document.createElement("p");
  expandedMeta.className = "wrestling-event-history-expanded-meta";
  expandedMeta.textContent = getWrestlingHistoryMetaText(eventRow.eventName, eventRow.eventDate, eventRow.promotion, eventRow.venue, eventRow.location);

  const expandedNotes = document.createElement("p");
  expandedNotes.className = "wrestling-event-history-expanded-notes";
  expandedNotes.textContent = getWrestlingHistoryMetaText(eventRow.matchName, eventRow.matchType, eventRow.personRole);

  const expandedAction = document.createElement("button");
  expandedAction.className = "wrestling-event-history-open wrestling-event-history-expanded-open";
  expandedAction.type = "button";
  expandedAction.textContent = "Open Match";
  expandedAction.setAttribute("aria-label", `Open match ${eventRow.matchName}`);
  expandedAction.dataset.wrestlingMatchRoute = row.dataset.wrestlingMatchRoute;
  if (!matchRoute) {
    expandedAction.disabled = true;
    expandedAction.setAttribute("aria-disabled", "true");
  }
  expandedAction.addEventListener("click", (event) => {
    event.stopPropagation();
    navigateToWrestlingPersonEventMatch(eventRow);
  });

  expanded.append(placeholders, expandedMeta, expandedNotes, expandedAction);

  row.addEventListener("click", (event) => {
    if (event.target.closest("button")) {
      return;
    }
    toggleWrestlingPersonEventRow(row, eventRow, person);
  });
  row.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.target.closest("button")) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleWrestlingPersonEventRow(row, eventRow, person);
    }
  });

  row.append(eventBlock, matchBlock, photoCount, openButton, toggle, expanded);
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

function renderWrestlingPersonDetailState(stateName, personId, copy = {}) {
  if (!wrestlingPersonDetailShell) {
    return;
  }

  const stateCard = createWrestlingV3StateCard(stateName, "wrestlingPeople", {
    title: copy.title,
    text: copy.text || copy.copy,
    detail: personId ? `Person: ${personId}` : "",
    retry: stateName === "error",
  });
  stateCard.dataset.wrestlingPersonId = normalizeWrestlingPersonId(personId);
  wrestlingPersonDetailShell.replaceChildren(createWrestlingPersonDetailBackButton(), stateCard);
}

function renderWrestlingPersonDetailPending(personId) {
  renderWrestlingPersonDetailState("loading", personId, {
    title: "Loading Person",
    text: "Fetching wrestling person data.",
  });
}

function renderWrestlingPersonDetailRoute(personId) {
  if (!wrestlingPersonDetailShell) {
    return;
  }

  const normalizedPersonId = normalizeWrestlingPersonId(personId);
  const livePerson = normalizedPersonId
    ? findWrestlingPersonById(normalizedPersonId, { allowFallback: false, includeStatic: false })
    : null;
  if (
    !livePerson &&
    !wrestlingPeopleLoaded &&
    (wrestlingPeopleDataState === "idle" || wrestlingPeopleDataState === "loading" || wrestlingPeopleDataState === "live" || wrestlingPeopleRequest)
  ) {
    const pendingPeopleRequest = requestWrestlingPersonDetailLiveLookup(normalizedPersonId);
    renderWrestlingPersonDetailPending(normalizedPersonId || personId);
    const rerenderCurrentPersonRoute = () => {
      const currentRoute = getRouteFromUrl();
      if (
        currentRoute.name === "wrestling-person-detail" &&
        normalizeWrestlingPersonId(currentRoute.personId || currentRoute.params?.personId) === normalizedPersonId
      ) {
        renderWrestlingPersonDetailRoute(normalizedPersonId || personId);
      }
    };
    pendingPeopleRequest.then(rerenderCurrentPersonRoute, rerenderCurrentPersonRoute);
    return;
  }

  let person = livePerson || (normalizedPersonId
    ? findWrestlingPersonById(normalizedPersonId, { allowFallback: false, includeStatic: true })
    : null);

  if (!person) {
    const stateName = wrestlingPeopleDataState === "error" && !wrestlingPeopleLoaded
      ? "error"
      : "empty";
    renderWrestlingPersonDetailState(
      stateName,
      personId,
      {
        title: stateName === "error" ? "Unable To Load Archive Data" : "Archive Record Unavailable",
        text: stateName === "error"
          ? "Unable to load archive data."
          : "No matching archive record was found.",
      }
    );
    return;
  }

  if (wrestlingShowsDataState === "idle" && !wrestlingShowsRequest) {
    requestWrestlingShowsData();
  }

  activeWrestlingPersonId = person.personId;
  setActiveWrestlingPeopleCard(person.personId);
  setWrestlingRelationshipDataset(wrestlingPersonDetailShell, person);

  const backButton = createWrestlingPersonDetailBackButton();

  const hero = document.createElement("section");
  hero.className = "wrestling-person-detail-hero";
  hero.setAttribute("aria-label", `${person.name} profile`);

  const photo = document.createElement("div");
  photo.className = "wrestling-person-detail-photo";
  photo.setAttribute("role", "img");
  photo.setAttribute("aria-label", `${person.name} archive profile mark`);

  const photoInitials = document.createElement("span");
  photoInitials.setAttribute("aria-hidden", "true");
  photoInitials.textContent = person.thumb || getWrestlingPersonInitials(person.name);
  photo.append(photoInitials);

  const summary = document.createElement("div");
  summary.className = "wrestling-person-detail-summary";

  const name = document.createElement("h2");
  name.className = "wrestling-person-detail-title";
  name.id = "wrestling-person-detail-title";
  name.textContent = person.name;

  const facts = document.createElement("dl");
  facts.className = "wrestling-person-facts";
  const factRows = getWrestlingPersonDetailFacts(person);
  if (factRows.length > 0) {
    facts.append(...factRows);
  }

  summary.append(name);
  if (factRows.length > 0) {
    summary.append(facts);
  }
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
    renderWrestlingV3State(eventList, forcedState, "wrestlingPeople");
  } else {
    const eventRows = getWrestlingPersonEventHistoryRows(person);
    if (eventRows.length > 0) {
      eventRows.forEach((eventRow) => {
        eventList.append(createWrestlingPersonEventRow(eventRow, person));
      });
    } else if (wrestlingShowsDataState === "loading" || wrestlingShowsRequest) {
      eventList.append(createWrestlingV3StateCard("loading", "wrestlingPeople", {
        text: "Loading event history.",
      }));
    } else if (wrestlingShowsDataState === "error") {
      eventList.append(createWrestlingV3StateCard("error", "wrestlingPeople", {
        text: "Event history could not load from the wrestling show archive.",
      }));
    } else {
      eventList.append(createWrestlingPeopleEmptyState("No event history indexed for this person yet."));
    }
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

function getWrestlingPhotoSourceObject(item) {
  return item?.backend_record && typeof item.backend_record === "object"
    ? { ...item.backend_record, ...item }
    : item;
}

function getWrestlingPhotoSourceArrays(item) {
  const source = getWrestlingPhotoSourceObject(item);
  return [
    source?.photos,
    source?.match_photos,
    source?.matchPhotos,
    source?.gallery,
    source?.gallery_photos,
    source?.galleryPhotos,
    source?.images,
    source?.tagged_photos,
    source?.taggedPhotos,
    source?.matched_photos,
    source?.matchedPhotos,
    source?.album?.photos,
    source?.album?.images,
    source?.gallery_album?.photos,
    source?.galleryAlbum?.photos,
    source?.smugmug?.photos,
    source?.smugmug?.images,
    source?.smugmug_album?.photos,
    source?.smugmugAlbum?.photos,
    source?.stats?.photos,
    source?.stats?.match_photos,
    source?.stats?.matchPhotos,
    source?.stats?.gallery,
    source?.stats?.images,
    source?.stats?.tagged_photos,
    source?.stats?.taggedPhotos,
  ].filter(Array.isArray);
}

function getWrestlingMatchPhotoSourceArrays(match) {
  return getWrestlingPhotoSourceArrays(match);
}

function getWrestlingPositivePhotoCountValue(...values) {
  for (const value of values) {
    if (Array.isArray(value) || (value && typeof value === "object")) {
      continue;
    }
    const parsedValue = Number.parseInt(value, 10);
    if (Number.isFinite(parsedValue) && parsedValue > 0) {
      return parsedValue;
    }
  }
  return 0;
}

function getWrestlingPhotoRef(photo) {
  if (typeof photo === "string") {
    return photo.trim();
  }
  return getWrestlingText(
    photo?.dedupeKey ||
    photo?.photo_id ||
    photo?.photoId ||
    photo?.image_key ||
    photo?.imageKey ||
    photo?.image_id ||
    photo?.imageId ||
    photo?.key ||
    photo?.id ||
    getWrestlingPhotoField(photo, [
      "thumbnail_url",
      "thumbnailUrl",
      "thumb_url",
      "thumbUrl",
      "small_url",
      "smallUrl",
      "medium_url",
      "mediumUrl",
      "large_url",
      "largeUrl",
      "url",
      "image_url",
      "imageUrl",
      "cover_image_url",
      "coverImageUrl",
      "poster",
      "poster_url",
      "posterUrl",
      "smugmug_url",
      "smugmugUrl",
    ])
  );
}

function getWrestlingPhotoArrayCount(item) {
  const seen = new Set();
  getWrestlingPhotoSourceArrays(item).forEach((photoArray, arrayIndex) => {
    photoArray.forEach((photo, photoIndex) => {
      const photoRef = getWrestlingPhotoRef(photo) || `array-${arrayIndex}-photo-${photoIndex}`;
      if (photoRef) {
        seen.add(photoRef);
      }
    });
  });
  return seen.size;
}

function getWrestlingPhotoIdCount(item) {
  const source = getWrestlingPhotoSourceObject(item);
  const photoIdArrays = [
    source?.photoIds,
    source?.photo_ids,
    source?.imageIds,
    source?.image_ids,
    source?.album?.photoIds,
    source?.album?.photo_ids,
    source?.album?.imageIds,
    source?.album?.image_ids,
    source?.smugmug?.photoIds,
    source?.smugmug?.photo_ids,
    source?.smugmug_album?.photoIds,
    source?.smugmug_album?.photo_ids,
    source?.smugmugAlbum?.photoIds,
    source?.smugmugAlbum?.photo_ids,
    source?.stats?.photoIds,
    source?.stats?.photo_ids,
    source?.stats?.imageIds,
    source?.stats?.image_ids,
  ].filter(Array.isArray);
  return new Set(photoIdArrays.flat().map((photoId) => getWrestlingText(photoId)).filter(Boolean)).size;
}

function getWrestlingExplicitPhotoCount(item) {
  const source = getWrestlingPhotoSourceObject(item);
  return getWrestlingPositivePhotoCountValue(
    source?.photoCount,
    source?.photo_count,
    source?.photosCount,
    source?.photos_count,
    source?.imageCount,
    source?.image_count,
    source?.taggedPhotoCount,
    source?.tagged_photo_count,
    source?.totalPhotos,
    source?.total_photos,
    source?.photos,
    source?.images,
    source?.gallery,
    source?.stats?.photoCount,
    source?.stats?.photo_count,
    source?.stats?.photosCount,
    source?.stats?.photos_count,
    source?.stats?.imageCount,
    source?.stats?.image_count,
    source?.stats?.taggedPhotoCount,
    source?.stats?.tagged_photo_count,
    source?.stats?.totalPhotos,
    source?.stats?.total_photos,
    source?.stats?.photos,
    source?.stats?.images
  );
}

function getWrestlingAlbumPhotoCount(item) {
  const source = getWrestlingPhotoSourceObject(item);
  return getWrestlingPositivePhotoCountValue(
    source?.albumPhotoCount,
    source?.album_photo_count,
    source?.galleryPhotoCount,
    source?.gallery_photo_count,
    source?.smugmugPhotoCount,
    source?.smugmug_photo_count,
    source?.album?.photoCount,
    source?.album?.photo_count,
    source?.album?.photosCount,
    source?.album?.photos_count,
    source?.album?.imageCount,
    source?.album?.image_count,
    source?.gallery_album?.photoCount,
    source?.gallery_album?.photo_count,
    source?.galleryAlbum?.photoCount,
    source?.galleryAlbum?.photo_count,
    source?.smugmug?.photoCount,
    source?.smugmug?.photo_count,
    source?.smugmug?.imageCount,
    source?.smugmug?.image_count,
    source?.smugmug_album?.photoCount,
    source?.smugmug_album?.photo_count,
    source?.smugmugAlbum?.photoCount,
    source?.smugmugAlbum?.photo_count
  );
}

function getWrestlingPhotoCount(item) {
  const explicitCount = getWrestlingExplicitPhotoCount(item);
  if (explicitCount > 0) {
    return explicitCount;
  }

  const photoArrayCount = getWrestlingPhotoArrayCount(item);
  if (photoArrayCount > 0) {
    return photoArrayCount;
  }

  const albumPhotoCount = getWrestlingAlbumPhotoCount(item);
  if (albumPhotoCount > 0) {
    return albumPhotoCount;
  }

  return getWrestlingPhotoIdCount(item);
}

function getWrestlingDeclaredMatchPhotoCount(match) {
  return getWrestlingExplicitPhotoCount(match);
}

function getWrestlingPhotoField(photo, fields = []) {
  if (typeof photo === "string") {
    return photo.trim();
  }
  for (const field of fields) {
    const value = String(photo?.[field] || "").trim();
    if (value) {
      return value;
    }
  }
  return "";
}

function getWrestlingPreviewPhoto(item) {
  if (!item) {
    return "";
  }
  if (Array.isArray(item)) {
    for (const photo of item) {
      const previewUrl = getWrestlingPreviewPhoto(photo);
      if (previewUrl) {
        return previewUrl;
      }
    }
    return "";
  }

  const source = getWrestlingPhotoSourceObject(item);
  const directUrl = getWrestlingPhotoField(source, [
    "thumbnail_url",
    "thumbnailUrl",
    "thumb_url",
    "thumbUrl",
    "small_url",
    "smallUrl",
    "medium_url",
    "mediumUrl",
    "large_url",
    "largeUrl",
    "url",
    "image_url",
    "imageUrl",
    "cover_image_url",
    "coverImageUrl",
    "poster",
    "poster_url",
    "posterUrl",
    "smugmug_url",
    "smugmugUrl",
  ]);
  if (directUrl) {
    return directUrl;
  }

  for (const photoArray of getWrestlingPhotoSourceArrays(source)) {
    for (const photo of photoArray) {
      const previewUrl = getWrestlingPreviewPhoto(photo);
      if (previewUrl) {
        return previewUrl;
      }
    }
  }
  return "";
}

function getWrestlingMatchPhotoThumbnailUrl(photo) {
  return getWrestlingPhotoField(photo, [
    "thumbnail_url",
    "thumbnailUrl",
    "thumb_url",
    "thumbUrl",
    "small_url",
    "smallUrl",
    "medium_url",
    "mediumUrl",
    "url",
    "image_url",
    "imageUrl",
    "cover_image_url",
    "coverImageUrl",
    "poster",
    "poster_url",
    "posterUrl",
  ]);
}

function getWrestlingMatchPhotoSmallUrl(photo) {
  return getWrestlingPhotoField(photo, [
    "small_url",
    "smallUrl",
    "medium_url",
    "mediumUrl",
    "large_url",
    "largeUrl",
    "thumbnail_url",
    "thumbnailUrl",
    "thumb_url",
    "thumbUrl",
    "url",
    "image_url",
    "imageUrl",
    "cover_image_url",
    "coverImageUrl",
    "poster",
    "poster_url",
    "posterUrl",
  ]);
}

function getWrestlingMatchPhotoLightboxUrl(photo) {
  return getWrestlingPhotoField(photo, [
    "large_url",
    "largeUrl",
    "medium_url",
    "mediumUrl",
    "small_url",
    "smallUrl",
    "thumbnail_url",
    "thumbnailUrl",
    "thumb_url",
    "thumbUrl",
    "url",
    "image_url",
    "imageUrl",
    "cover_image_url",
    "coverImageUrl",
    "poster",
    "poster_url",
    "posterUrl",
    "smugmug_url",
    "smugmugUrl",
  ]);
}

function getWrestlingMatchPhotoId(photo, index = 0) {
  return getWrestlingText(
    photo?.photo_id ||
    photo?.photoId ||
    photo?.image_key ||
    photo?.imageKey ||
    photo?.key ||
    photo?.id ||
    `photo-${index + 1}`
  );
}

function getWrestlingMatchPhotoLabel(photo, index = 0) {
  return getWrestlingText(
    photo?.label ||
    photo?.title ||
    photo?.caption ||
    photo?.Caption ||
    photo?.filename ||
    getWrestlingMatchPhotoId(photo, index),
    `Photo ${String(index + 1).padStart(2, "0")}`
  );
}

function getWrestlingMatchPhotoItems(match) {
  const seen = new Set();
  return getWrestlingMatchPhotoSourceArrays(match)
    .flat()
    .map((photo, index) => {
      const lightboxSrc = getWrestlingMatchPhotoLightboxUrl(photo);
      const thumbnailSrc = getWrestlingMatchPhotoThumbnailUrl(photo);
      const smallSrc = getWrestlingMatchPhotoSmallUrl(photo);
      if (!thumbnailSrc && !smallSrc && !lightboxSrc) {
        return null;
      }
      const photoId = getWrestlingMatchPhotoId(photo, index);
      const dedupeKey = getWrestlingText(photo?.dedupeKey || photoId || lightboxSrc || thumbnailSrc || smallSrc);
      if (dedupeKey && seen.has(dedupeKey)) {
        return null;
      }
      if (dedupeKey) {
        seen.add(dedupeKey);
      }
      return {
        ...(
          photo && typeof photo === "object"
            ? photo
            : { image_url: getWrestlingText(photo) }
        ),
        photoId,
        label: getWrestlingMatchPhotoLabel(photo, index),
        thumbnailSrc,
        smallSrc,
        lightboxSrc,
      };
    })
    .filter(Boolean);
}

function getWrestlingMatchSourcePhotoIds(match) {
  const source = match?.backend_record && typeof match.backend_record === "object"
    ? { ...match.backend_record, ...match }
    : match;
  const ids = [
    source?.photoIds,
    source?.photo_ids,
    source?.imageIds,
    source?.image_ids,
    source?.album?.photoIds,
    source?.album?.photo_ids,
    source?.album?.imageIds,
    source?.album?.image_ids,
    source?.smugmug?.photoIds,
    source?.smugmug?.photo_ids,
    source?.smugmug_album?.photoIds,
    source?.smugmug_album?.photo_ids,
    source?.smugmugAlbum?.photoIds,
    source?.smugmugAlbum?.photo_ids,
    source?.stats?.photoIds,
    source?.stats?.photo_ids,
    source?.stats?.imageIds,
    source?.stats?.image_ids,
  ].find(Array.isArray);
  if (ids && ids.length > 0) {
    return ids.map((photoId) => getWrestlingText(photoId)).filter(Boolean);
  }
  return [];
}

function getWrestlingMatchPhotoIds(match) {
  const sourcePhotoIds = getWrestlingMatchSourcePhotoIds(match);
  if (sourcePhotoIds.length > 0) {
    return sourcePhotoIds;
  }
  return Array.from(wrestlingPhotoTiles || [])
    .map((tile) => getWrestlingText(tile?.dataset?.wrestlingPhotoId))
    .filter(Boolean);
}

function createWrestlingMatchPhotoLightboxTile(photo, index = 0, show = {}, match = {}) {
  const imageSrc = photo.thumbnailSrc || photo.smallSrc || photo.lightboxSrc;
  const lightboxSrc = photo.lightboxSrc || imageSrc;
  const imageKey = getWrestlingText(photo.photoId || photo.image_key || photo.imageKey || lightboxSrc, `wrestling-match-photo-${index + 1}`);
  const matchRef = getWrestlingMatchRouteRef(match) ||
    wrestlingMatchGalleryShell?.dataset.wrestlingMatchRef ||
    wrestlingMatchGalleryShell?.dataset.wrestlingMatchId ||
    match?.matchId ||
    "match-1";
  const showRouteSource = show?.showId || show?.eventId ? show : (match?.showId || wrestlingMatchGalleryShell?.dataset.wrestlingShowId || "warzone-26");
  const matchRoute = getWrestlingMatchRouteUrlByIds(showRouteSource, matchRef);
  const routePhotoId = String(index + 1).padStart(3, "0");
  const tile = document.createElement("button");
  tile.className = `archive-gallery-tile set-gallery-photo-tile${index === 0 ? " is-active" : ""}`;
  tile.type = "button";
  tile.dataset.galleryPhoto = "";
  tile.dataset.galleryPhotoLabel = photo.label;
  tile.dataset.galleryKind = "image";
  tile.dataset.galleryMediaId = imageKey;
  tile.dataset.galleryLightboxId = `wrestling-match-photo-${normalizeWrestlingArchiveSlug(imageKey, String(index + 1))}`;
  tile.dataset.galleryLightboxSrc = lightboxSrc;
  tile.dataset.galleryBandTags = getWrestlingText(show?.promotion, "Wrestling");
  tile.dataset.galleryShow = getWrestlingText(show?.title || show?.eventName || show?.showName || show?.show_name, "Event Pending");
  tile.dataset.galleryVenue = getWrestlingText(show?.venue || getWrestlingVenueName(show), "Venue Pending");
  tile.dataset.galleryLocation = getWrestlingText(show?.location || getWrestlingShowLocation(show), "Location Pending");
  tile.dataset.galleryDate = getWrestlingText(show?.eventDate || formatWrestlingShowDate(show?.rawDate || show?.date || show?.show_date), "Date Pending");
  tile.dataset.galleryPerformance = getWrestlingText(match?.matchType || match?.match_type || match?.stipulation, "Match");
  tile.dataset.galleryCamera = [show?.camera_1, show?.camera_2].map(getWrestlingText).filter(Boolean).join(" / ");
  tile.dataset.wrestlingShowId = show?.showId || show?.eventId || match?.showId || wrestlingMatchGalleryShell?.dataset.wrestlingShowId || "warzone-26";
  tile.dataset.wrestlingMatchId = matchRef;
  tile.dataset.wrestlingMatchRef = matchRef;
  tile.dataset.wrestlingMatchRoute = matchRoute;
  tile.dataset.wrestlingPhotoId = photo.photoId || routePhotoId;
  tile.dataset.wrestlingPhotoRouteId = routePhotoId;
  tile.dataset.wrestlingLightboxRoute = `${matchRoute}/photo/${encodeURIComponent(routePhotoId)}`;
  tile.setAttribute("aria-label", photo.label);
  tile.setAttribute("aria-pressed", String(index === 0));

  const image = document.createElement("img");
  image.className = "archive-gallery-image";
  image.alt = "";
  if (imageSrc) {
    image.dataset.galleryImageSrc = imageSrc;
  }
  applyWrestlingGalleryImageLoading(image, index);
  if (typeof protectArchiveImage === "function") {
    protectArchiveImage(image);
  }
  tile.append(image);
  return tile;
}

function getActiveWrestlingMatchLightboxTile() {
  if (typeof activeLightboxCustomTiles === "undefined" || !Array.isArray(activeLightboxCustomTiles)) {
    return null;
  }

  const activeTile = activeLightboxCustomTiles.find((tile) => (
    tile?.dataset?.wrestlingLightboxRoute &&
    tile.getAttribute("aria-pressed") === "true"
  ));
  if (activeTile) {
    return activeTile;
  }

  const index = typeof activeLightboxIndex === "number" ? activeLightboxIndex : 0;
  return activeLightboxCustomTiles[index] || activeLightboxCustomTiles[0] || null;
}

function isWrestlingMatchLightboxRouteSyncActive() {
  return Boolean(
    lightboxScreen?.dataset?.wrestlingLightboxRouteSync === "match-gallery" &&
    lightboxScreen.getAttribute("aria-hidden") === "false" &&
    typeof activeLightboxCustomTiles !== "undefined" &&
    Array.isArray(activeLightboxCustomTiles)
  );
}

function syncWrestlingMatchLightboxRoute() {
  wrestlingMatchLightboxRouteSyncFrame = 0;
  if (!isWrestlingMatchLightboxRouteSyncActive() || typeof getRouteFromUrl !== "function") {
    return;
  }

  const route = getRouteFromUrl();
  if (route?.name !== "wrestling-lightbox") {
    return;
  }

  const activeTile = getActiveWrestlingMatchLightboxTile();
  const nextRoute = activeTile?.dataset?.wrestlingLightboxRoute || "";
  if (!nextRoute) {
    return;
  }

  const nextUrl = new URL(nextRoute, window.location.href);
  const nextPath = `${nextUrl.pathname}${nextUrl.search}`;
  if (nextPath !== wrestlingMatchLightboxRoutePath && nextPath !== `${window.location.pathname}${window.location.search}` && typeof replaceRouteUrl === "function") {
    replaceRouteUrl(nextRoute, { source: "wrestling-match-lightbox" });
  }
  wrestlingMatchLightboxRoutePath = nextPath;

  updateWrestlingLightboxRelationshipHooks(
    activeTile.dataset.wrestlingShowId,
    activeTile.dataset.wrestlingMatchRef || activeTile.dataset.wrestlingMatchId,
    activeTile.dataset.wrestlingPhotoRouteId || activeTile.dataset.wrestlingPhotoId || route.photoId || "001"
  );
}

function scheduleWrestlingMatchLightboxRouteSync() {
  if (wrestlingMatchLightboxRouteSyncFrame || typeof window.requestAnimationFrame !== "function") {
    return;
  }
  wrestlingMatchLightboxRouteSyncFrame = window.requestAnimationFrame(syncWrestlingMatchLightboxRoute);
}

function ensureWrestlingMatchLightboxRouteObserver() {
  if (wrestlingMatchLightboxRouteObserver || typeof MutationObserver !== "function") {
    return;
  }

  const targets = [
    [lightboxPhoto, { attributes: true, attributeFilter: ["aria-label", "data-gallery-lightbox-id", "data-gallery-media-id"] }],
    [lightboxImage, { attributes: true, attributeFilter: ["src"] }],
    [lightboxCounter, { childList: true, characterData: true, subtree: true }],
  ].filter(([target]) => target);

  if (targets.length === 0) {
    return;
  }

  wrestlingMatchLightboxRouteObserver = new MutationObserver(scheduleWrestlingMatchLightboxRouteSync);
  targets.forEach(([target, options]) => {
    wrestlingMatchLightboxRouteObserver.observe(target, options);
  });
}

function setWrestlingMatchLightboxRouteSyncActive(isActive) {
  if (!lightboxScreen) {
    return;
  }

  if (isActive) {
    lightboxScreen.dataset.wrestlingLightboxRouteSync = "match-gallery";
    ensureWrestlingMatchLightboxRouteObserver();
    scheduleWrestlingMatchLightboxRouteSync();
    return;
  }

  delete lightboxScreen.dataset.wrestlingLightboxRouteSync;
  wrestlingMatchLightboxRoutePath = "";
  if (wrestlingMatchLightboxRouteSyncFrame && typeof window.cancelAnimationFrame === "function") {
    window.cancelAnimationFrame(wrestlingMatchLightboxRouteSyncFrame);
  }
  wrestlingMatchLightboxRouteSyncFrame = 0;
}

function closeWrestlingMatchLightboxBridge() {
  const route = typeof getRouteFromUrl === "function" ? getRouteFromUrl() : null;
  const routeMatchRoute = route?.name === "wrestling-lightbox"
    ? getWrestlingMatchRouteUrlByIds(route.dateKey || route.showId, route.matchRef || route.matchId)
    : "";
  const matchRoute = routeMatchRoute || wrestlingMatchGalleryShell?.dataset.wrestlingMatchRoute;
  if (
    matchRoute &&
    typeof replaceRouteUrl === "function" &&
    route?.name === "wrestling-lightbox"
  ) {
    replaceRouteUrl(matchRoute);
  }
  setWrestlingMatchLightboxRouteSyncActive(false);
  if (musicNexusShell) {
    musicNexusShell.setAttribute("aria-hidden", "true");
    musicNexusShell.setAttribute("inert", "");
  }
  if (shell) {
    shell.classList.remove("is-music-nexus-view");
    shell.classList.add("is-wrestling-match-gallery-view");
  }
  if (typeof setWrestlingMatchGalleryHidden === "function") {
    setWrestlingMatchGalleryHidden(false);
  } else if (wrestlingMatchGalleryShell) {
    wrestlingMatchGalleryShell.setAttribute("aria-hidden", "false");
    wrestlingMatchGalleryShell.removeAttribute("inert");
  }
  if (wrestlingLightboxShell) {
    wrestlingLightboxShell.setAttribute("aria-hidden", "true");
    wrestlingLightboxShell.setAttribute("inert", "");
  }
}

function getWrestlingRoutePhotoIndex(photos, photoId = "001") {
  const safePhotos = Array.isArray(photos) ? photos : [];
  const numericPhoto = Number.parseInt(photoId, 10);
  if (Number.isFinite(numericPhoto) && numericPhoto > 0) {
    return Math.max(0, Math.min(numericPhoto - 1, Math.max(safePhotos.length - 1, 0)));
  }

  const targetPhotoId = normalizeWrestlingArchiveSlug(photoId, "");
  const matchedIndex = safePhotos.findIndex((photo, index) => {
    const candidates = [
      photo?.photoId,
      photo?.photo_id,
      photo?.image_key,
      photo?.imageKey,
      photo?.key,
      photo?.id,
      String(index + 1).padStart(3, "0"),
    ];
    return candidates
      .map((candidate) => normalizeWrestlingArchiveSlug(candidate, ""))
      .some((candidate) => candidate && candidate === targetPhotoId);
  });
  return matchedIndex >= 0 ? matchedIndex : 0;
}

function openWrestlingMatchPhotoRouteLightbox(showId, matchRef, photoId = "001", options = {}) {
  const show = findLiveWrestlingShowById(showId);
  const match = show?.matches ? findWrestlingMatchInRowsByRef(show.matches, matchRef) : null;
  const photos = getWrestlingMatchPhotoItems(match);
  if (show && match && photos.length > 0) {
    const photoIndex = getWrestlingRoutePhotoIndex(photos, photoId);
    updateWrestlingLightboxRelationshipHooks(showId, matchRef, photoId);
    openWrestlingMatchPhotoLightbox(photos, photoIndex, null, show, match);
    return true;
  }

  if (!options.skipPhotoRequest && showId && matchRef) {
    requestWrestlingMatchPhotosForRoute(showId, matchRef, show);
  }
  return false;
}

function openWrestlingMatchPhotoLightbox(photos, photoIndex, trigger, show, match) {
  const lightboxPhotos = (Array.isArray(photos) ? photos : []).filter((photo) => photo?.lightboxSrc || photo?.thumbnailSrc);
  if (
    lightboxPhotos.length === 0 ||
    typeof showLightbox !== "function" ||
    typeof activeLightboxCustomTiles === "undefined"
  ) {
    return;
  }

  const safeIndex = Math.max(0, Math.min(Number.parseInt(photoIndex, 10) || 0, lightboxPhotos.length - 1));
  const returnContext = {
    source: "wrestling-match-gallery",
    focusElement: trigger || null,
    scrollTop: wrestlingMatchGalleryShell ? wrestlingMatchGalleryShell.scrollTop : 0,
  };
  activeLightboxCustomTiles = lightboxPhotos.map((photo, index) => createWrestlingMatchPhotoLightboxTile(photo, index, show, match));
  const targetTile = activeLightboxCustomTiles[safeIndex] || activeLightboxCustomTiles[0] || null;
  if (!targetTile) {
    return;
  }

  if (musicNexusShell) {
    musicNexusShell.setAttribute("aria-hidden", "false");
    musicNexusShell.removeAttribute("inert");
  }
  if (shell) {
    shell.classList.add("is-music-nexus-view");
  }
  if (wrestlingMatchGalleryShell) {
    wrestlingMatchGalleryShell.setAttribute("aria-hidden", "true");
    wrestlingMatchGalleryShell.setAttribute("inert", "");
  }
  if (wrestlingLightboxShell) {
    wrestlingLightboxShell.setAttribute("aria-hidden", "true");
    wrestlingLightboxShell.setAttribute("inert", "");
  }
  showLightbox(targetTile, { returnContext });
  setWrestlingMatchLightboxRouteSyncActive(true);
}

function applyWrestlingMatchPhotoRoute(tile, show = {}, match = {}, index = 0) {
  if (!tile) {
    return;
  }

  const showRouteSource = show?.showId || show?.eventId ? show : (match?.showId || wrestlingMatchGalleryShell?.dataset.wrestlingShowId || "warzone-26");
  const matchRef = getWrestlingMatchRouteRef(match) ||
    wrestlingMatchGalleryShell?.dataset.wrestlingMatchRef ||
    wrestlingMatchGalleryShell?.dataset.wrestlingMatchId ||
    match?.matchId ||
    "match-1";
  const routePhotoId = String(index + 1).padStart(3, "0");
  const matchRoute = getWrestlingMatchRouteUrlByIds(showRouteSource, matchRef);

  tile.dataset.wrestlingShowId = show?.showId || show?.eventId || match?.showId || wrestlingMatchGalleryShell?.dataset.wrestlingShowId || "warzone-26";
  tile.dataset.wrestlingMatchId = matchRef;
  tile.dataset.wrestlingMatchRef = matchRef;
  tile.dataset.wrestlingShowRoute = getWrestlingShowRouteUrl(showRouteSource);
  tile.dataset.wrestlingMatchRoute = matchRoute;
  tile.dataset.wrestlingLightboxRoute = `${matchRoute}/photo/${encodeURIComponent(routePhotoId)}`;
  setWrestlingRelationshipDataset(tile, {
    ...match,
    showId: tile.dataset.wrestlingShowId,
    matchId: matchRef,
    photoIds: [routePhotoId],
  });
}

function createWrestlingMatchPhotoTile(photo, index = 0, photos = [], show = {}, match = {}) {
  const tile = document.createElement("li");
  tile.className = "wrestling-photo-tile has-photo";
  tile.dataset.wrestlingPhotoId = photo.photoId || String(index + 1).padStart(3, "0");
  tile.dataset.wrestlingPhotoIndex = String(index);
  tile.setAttribute("role", "button");
  tile.tabIndex = 0;
  tile.setAttribute("aria-label", `Open ${photo.label}`);
  applyWrestlingMatchPhotoRoute(tile, show, match, index);

  const image = document.createElement("img");
  image.className = "wrestling-photo-image";
  image.src = photo.thumbnailSrc || photo.smallSrc || photo.lightboxSrc;
  image.alt = "";
  applyWrestlingGalleryImageLoading(image, index, { firstVisible: true });
  image.onerror = () => {
    tile.classList.remove("has-photo");
    image.remove();
    if (!tile.textContent.trim()) {
      const label = document.createElement("span");
      label.textContent = String(index + 1).padStart(2, "0");
      tile.append(label);
    }
  };

  tile.append(image);
  tile.addEventListener("click", () => {
    if (tile.dataset.wrestlingLightboxRoute) {
      navigateToRoute(tile.dataset.wrestlingLightboxRoute);
      return;
    }
    openWrestlingMatchPhotoLightbox(photos, index, tile, show, match);
  });
  tile.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      tile.click();
    }
  });
  return tile;
}

function createWrestlingMatchPhotoPlaceholderTile(photoId, index = 0, show = {}, match = {}) {
  const tile = document.createElement("li");
  tile.className = "wrestling-photo-tile";
  tile.dataset.wrestlingPhotoId = photoId || String(index + 1).padStart(3, "0");
  tile.setAttribute("role", "button");
  tile.tabIndex = 0;
  tile.setAttribute("aria-label", `Photo ${index + 1} unavailable`);
  applyWrestlingMatchPhotoRoute(tile, show, match, index);

  const label = document.createElement("span");
  label.textContent = String(index + 1).padStart(2, "0");
  tile.append(label);
  tile.addEventListener("click", () => {
    if (tile.dataset.wrestlingLightboxRoute) {
      navigateToRoute(tile.dataset.wrestlingLightboxRoute);
    }
  });
  tile.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      tile.click();
    }
  });
  return tile;
}

function renderWrestlingMatchGalleryGridState(stateName = "empty", options = {}) {
  const grid = wrestlingMatchGalleryShell?.querySelector(".wrestling-photo-grid");
  if (!grid) {
    return;
  }

  const item = document.createElement("li");
  item.className = "wrestling-photo-state";
  item.style.gridColumn = "1 / -1";
  item.append(createWrestlingV3StateCard(stateName, "wrestlingShows", {
    small: true,
    title: options.title,
    text: options.text,
    retry: options.retry,
  }));
  grid.replaceChildren(item);
}

function renderWrestlingMatchPhotoGrid(show, match) {
  const grid = wrestlingMatchGalleryShell?.querySelector(".wrestling-photo-grid");
  if (!grid) {
    return;
  }

  const photos = getWrestlingMatchPhotoItems(match);
  const photoIds = getWrestlingMatchPhotoIds(match);
  const fragment = document.createDocumentFragment();
  if (photos.length > 0) {
    photos.forEach((photo, index) => {
      fragment.append(createWrestlingMatchPhotoTile(photo, index, photos, show, match));
    });
    grid.setAttribute("aria-label", `${getWrestlingMatchDisplayName(match)} photos`);
  } else if (photoIds.length === 0) {
    renderWrestlingMatchGalleryGridState("empty", {
      text: "No photo records are available for this match yet.",
    });
    grid.setAttribute("aria-label", `${getWrestlingMatchDisplayName(match)} state`);
    return;
  } else {
    photoIds.forEach((photoId, index) => {
      fragment.append(createWrestlingMatchPhotoPlaceholderTile(photoId, index, show, match));
    });
    grid.setAttribute("aria-label", `${getWrestlingMatchDisplayName(match)} photo placeholders`);
  }
  grid.replaceChildren(fragment);
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
  const photos = getWrestlingMatchPhotoItems(match);
  const declaredPhotoCount = getWrestlingDeclaredMatchPhotoCount(match);
  if (declaredPhotoCount > 0) {
    return Math.max(declaredPhotoCount, photos.length);
  }
  if (photos.length > 0) {
    return photos.length;
  }
  const sourcePhotoCount = getWrestlingPhotoCount(match);
  if (sourcePhotoCount > 0) {
    return sourcePhotoCount;
  }
  const sourcePhotoIds = getWrestlingMatchSourcePhotoIds(match);
  if (sourcePhotoIds.length > 0) {
    return sourcePhotoIds.length;
  }
  return wrestlingPhotoTiles.length;
}

function getWrestlingGalleryRenderedPhotoCount(match, totalCount = getWrestlingGalleryPhotoCount(match)) {
  const photos = getWrestlingMatchPhotoItems(match);
  if (photos.length > 0) {
    return Math.min(photos.length, totalCount || photos.length);
  }
  const photoIds = getWrestlingMatchPhotoIds(match);
  if (photoIds.length > 0) {
    return Math.min(photoIds.length, totalCount || photoIds.length);
  }
  return totalCount;
}

function formatWrestlingGalleryPhotoSummary(match) {
  const totalCount = getWrestlingGalleryPhotoCount(match);
  const renderedCount = getWrestlingGalleryRenderedPhotoCount(match, totalCount);
  return totalCount > 0
    ? `Showing ${Number(renderedCount).toLocaleString()} of ${Number(totalCount).toLocaleString()} Photos`
    : "Showing 0 Photos";
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
    count.textContent = formatWrestlingGalleryPhotoSummary(match);
  }

  const grid = wrestlingMatchGalleryShell.querySelector(".wrestling-photo-grid");
  if (grid) {
    renderWrestlingMatchPhotoGrid(show, match);
  }
}

function updateWrestlingMatchGalleryState(showId, matchRef, stateName) {
  const show = findLiveWrestlingShowById(showId);
  const title = stateName === "loading"
    ? "Loading Match"
    : stateName === "error"
      ? "Unable To Load Archive Data"
      : "Archive Record Unavailable";
  const type = stateName === "loading" ? "Loading" : "Unavailable";
  const showRouteSource = show || showId;
  const routeMatchRef = getWrestlingMatchRouteRef(matchRef);
  wrestlingMatchGalleryShell.dataset.wrestlingShowId = show?.showId || showId;
  wrestlingMatchGalleryShell.dataset.wrestlingMatchId = routeMatchRef;
  wrestlingMatchGalleryShell.dataset.wrestlingMatchRef = routeMatchRef;
  wrestlingMatchGalleryShell.dataset.wrestlingShowRoute = getWrestlingShowRouteUrl(showRouteSource);
  wrestlingMatchGalleryShell.dataset.wrestlingMatchRoute = getWrestlingMatchRouteUrlByIds(showRouteSource, routeMatchRef);
  updateWrestlingMatchGalleryDisplay(show, { matchName: title, matchType: type, photoCount: 0 });
  renderWrestlingMatchGalleryGridState(stateName, {
    title,
    text: stateName === "loading"
      ? "Preparing match gallery relationships."
      : stateName === "error"
        ? "Unable to load archive data."
        : "No matching archive record was found.",
    retry: stateName === "error",
  });
}

function updateWrestlingMatchGalleryRelationshipHooks(showId = "warzone-26", matchRef = "1", options = {}) {
  if (!wrestlingMatchGalleryShell) {
    return;
  }

  cancelWrestlingPeopleBackgroundHydrationIfRouteUnneeded();

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
  if (shouldRequestLiveShows && wrestlingShowsDataState === "error") {
    updateWrestlingMatchGalleryState(showId, matchRef, "error");
    return;
  }

  const liveShowRelationship = findLiveWrestlingShowById(showId);
  const showRelationship = liveShowRelationship || (shouldRequestLiveShows || wrestlingShowsDataState === "live" || wrestlingShowsDataState === "empty"
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
  const matchRows = Array.isArray(showRelationship.matches) ? showRelationship.matches : [];
  const matchIndex = matchRows.indexOf(matchRelationship);
  const activeMatchRef = getWrestlingMatchRouteRef(matchRelationship, matchIndex);
  const activeMatchId = activeMatchRef || matchRelationship.matchId || matchRef;
  setWrestlingRelationshipDataset(wrestlingMatchGalleryShell, { ...matchRelationship, showId: activeShowId, matchId: activeMatchId });
  wrestlingMatchGalleryShell.dataset.wrestlingShowId = activeShowId;
  wrestlingMatchGalleryShell.dataset.wrestlingMatchId = activeMatchId;
  wrestlingMatchGalleryShell.dataset.wrestlingMatchRef = activeMatchRef;
  wrestlingMatchGalleryShell.dataset.wrestlingShowRoute = getWrestlingShowRouteUrl(showRelationship);
  const activeMatchRoute = getWrestlingMatchRouteUrlByIds(showRelationship, activeMatchRef);
  wrestlingMatchGalleryShell.dataset.wrestlingMatchRoute = activeMatchRoute;
  if (!options.skipCanonicalize && (liveShowRelationship || !shouldRequestLiveShows) && typeof getRouteFromUrl === "function" && typeof replaceRouteUrl === "function") {
    const route = getRouteFromUrl();
    if (route.name === "wrestling-match-gallery" && route.canonicalUrl !== activeMatchRoute) {
      replaceRouteUrl(activeMatchRoute);
    }
  }
  updateWrestlingMatchGalleryDisplay(showRelationship, matchRelationship);
  if (
    liveShowRelationship &&
    !options.skipPhotoRequest &&
    getWrestlingMatchPhotoItems(matchRelationship).length === 0
  ) {
    requestWrestlingMatchPhotosForRoute(activeShowId, activeMatchRef || activeMatchId, showRelationship);
  }

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
  const matchRows = Array.isArray(showRelationship.matches) ? showRelationship.matches : [];
  const activeMatchRef = getWrestlingMatchRouteRef(matchRelationship, matchRows.indexOf(matchRelationship));
  const activeMatchId = activeMatchRef || matchRelationship.matchId || matchId;
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
    { skipDataRequest: true, skipCanonicalize: true }
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
  bindHallCrusadesYearCrystalInteraction();
  bindHallCrusadesBannerCrystalInteraction();
  bindHallCrusadesFieldCrystalInteraction();
  if (wrestlingShowList && wrestlingShowList.children.length === 0) {
    wrestlingShowList.append(createWrestlingShowState("loading"));
  }
}

function initWrestlingPeopleModule() {
  initWrestlingPeopleFilters();
  renderWrestlingPeopleIndex({ skipDataRequest: true });
  renderWrestlingVenuesIndex({ skipDataRequest: true });
  initWrestlingShowsArchive();
  applyStaticWrestlingRelationshipHooks();
}
