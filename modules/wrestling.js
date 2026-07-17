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
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
  const publicVenueSlug = normalizeWrestlingVenuePublicSlug(venueId) || normalizeWrestlingVenuePublicSlug(fallbackId);
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
const hallCrusadesPosterNavButtons = document.querySelectorAll("[data-hall-crusades-poster-nav]");
const hallCrusadesArchiveStats = document.querySelector("[data-hall-crusades-archive-stats]");
const hallCrusadesArchiveStatValues = document.querySelectorAll("[data-hall-crusades-archive-stat-value]");
const hallCrusadesCampaignInfoPanel = document.querySelector("[data-hall-crusades-campaign-info-panel]");
const hallCrusadesYearCrystal = document.querySelector("[data-hall-crusades-year-crystal]");
const hallCrusadesYearDrawer = document.querySelector("[data-hall-crusades-year-drawer]");
const hallCrusadesYearOptions = document.querySelectorAll("[data-hall-crusades-year-option]");
const hallCrusadesBannerCrystal = document.querySelector("[data-hall-crusades-banner-crystal]");
const hallCrusadesBannerDrawer = document.querySelector("[data-hall-crusades-banner-drawer]");
const hallCrusadesFieldCrystal = document.querySelector("[data-hall-crusades-field-crystal]");
const hallCrusadesFieldDrawer = document.querySelector("[data-hall-crusades-field-drawer]");
const hallCrusadesSearchCrystal = document.querySelector("[data-hall-crusades-search-crystal]");
const hallCrusadesSearchPanel = document.querySelector("[data-hall-crusades-search-panel]");
const hallCrusadesSearchInput = document.querySelector("[data-hall-crusades-search-input]");
const hallCrusadesSearchClear = document.querySelector("[data-hall-crusades-search-clear]");
const wrestlingPeopleSearchInput = document.querySelector("[data-wrestling-people-filter='search']");
const wrestlingPeopleLetterSelect = document.querySelector("[data-wrestling-people-filter='letter']");
const wrestlingPeopleCategorySelect = document.querySelector("[data-wrestling-people-filter='category']");
const wrestlingPeopleFilterReset = document.querySelector("[data-wrestling-people-filter-reset]");
let wrestlingPeoplePrototypeShell = null;
const wrestlingVenuesFilters = document.querySelector("[data-wrestling-venues-filters]");
const wrestlingVenuesCount = document.querySelector("[data-wrestling-venues-count]");
const WRESTLING_SHOWS_SEARCH_DEBOUNCE_MS = 180;
const HALL_CRUSADES_POSTER_STRIP_LIMIT = 7;
const HALL_CRUSADES_POSTER_ACTIVE_SLOT = Math.floor(HALL_CRUSADES_POSTER_STRIP_LIMIT / 2);
const HALL_CRUSADES_POSTER_SWIPE_THRESHOLD = 36;
const HALL_CRUSADES_POSTER_WHEEL_THRESHOLD = 48;
const HALL_CRUSADES_POSTER_WHEEL_COOLDOWN_MS = 240;
const HALL_CRUSADES_POSTER_WHEEL_IDLE_RESET_MS = 180;
const HALL_CRUSADES_POSTER_WHEEL_MAX_DELTA = 60;
const WRESTLING_MATCH_DETAIL_PROTOTYPE_PHOTO_PAGE_SIZE = 6;
const WRESTLING_MATCH_DETAIL_PROTOTYPE_SWIPE_THRESHOLD = 48;
const WRESTLING_MATCH_DETAIL_PROTOTYPE_PHOTO_RETRY_DELAY_MS = 1800;
const WRESTLING_MATCH_DETAIL_PROTOTYPE_PHOTO_RETRY_LIMIT = 3;
const wrestlingPeopleAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const wrestlingPeopleLetterOptions = ["#", ...wrestlingPeopleAlphabet];
let wrestlingShowsCollection = [];
let wrestlingShowsRequest = null;
let wrestlingMatchPhotoRequests = new Map();
let wrestlingMatchDetailPrototypePhotoCountStates = new Map();
let wrestlingMatchDetailPrototypePhotoRetryAttempts = new Map();
let wrestlingMatchDetailPrototypePhotoRetryTimers = new Map();
let wrestlingMatchDetailPrototypePhotoPageStates = new Map();
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
let hallCrusadesPosterWheelLastAdvanceTime = 0;
let hallCrusadesPosterWheelResetTimer = 0;
let isHallCrusadesPosterDefaultIndexApplied = false;
let isHallCrusadesPosterStripInteractionBound = false;
let isHallCrusadesPosterNavInteractionBound = false;
let isHallCrusadesPosterKeyboardInteractionBound = false;
let activeHallCrusadesYearFilter = "";
let activeHallCrusadesBannerFilter = "all";
let activeHallCrusadesFieldFilter = "all";
let activeHallCrusadesSearchQuery = "";
let isHallCrusadesYearDrawerOpen = false;
let isHallCrusadesBannerDrawerOpen = false;
let isHallCrusadesFieldDrawerOpen = false;
let isHallCrusadesSearchPanelOpen = false;
let isHallCrusadesYearCrystalInteractionBound = false;
let isHallCrusadesBannerCrystalInteractionBound = false;
let isHallCrusadesFieldCrystalInteractionBound = false;
let isHallCrusadesSearchCrystalInteractionBound = false;
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
let fieldsOfConflictDetailHydrationRequest = null;
let fieldsOfConflictDetailHydrationRouteKey = "";
let fieldsOfConflictDetailHydrationToken = 0;
const fieldsOfConflictDetailHydratedRouteKeys = new Set();

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

function getWrestlingNullableText(value) {
  if (value === undefined || value === null || Array.isArray(value) || typeof value === "object") {
    return null;
  }
  const text = String(value).trim();
  return text || null;
}

function getFirstWrestlingNullableText(...values) {
  for (const value of values) {
    const text = getWrestlingNullableText(value);
    if (text !== null) {
      return text;
    }
  }
  return null;
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

  const finishType = getFirstWrestlingNullableText(record.finish_type, record.finishType);
  const matchDuration = getFirstWrestlingNullableText(record.match_duration, record.matchDuration);
  const announcer = getFirstWrestlingNullableText(record.announcer);
  const blood = getFirstWrestlingNullableText(record.blood);

  return {
    ...record,
    showId: show.showId,
    eventId: show.showId,
    matchId,
    match_url: sourceMatchUrl || matchId,
    matchUrl: sourceMatchUrl || matchId,
    venueId: show.venueId,
    finish_type: finishType,
    finishType,
    match_duration: matchDuration,
    matchDuration,
    announcer,
    blood,
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
      if (typeof isWrestlingMatchDetailRoute === "function" && isWrestlingMatchDetailRoute(route)) {
        if (typeof showWrestlingMatchDetailPrototype === "function") {
          showWrestlingMatchDetailPrototype(route);
        }
      } else if (route.name === "wrestling-show-detail") {
        renderWrestlingShowDetailRoute(route.showId, { skipDataRequest: true, showDetailVariant: route.showDetailVariant, routeShowId: route.routeShowId });
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
      if (typeof isWrestlingMatchDetailRoute === "function" && isWrestlingMatchDetailRoute(route)) {
        if (typeof showWrestlingMatchDetailPrototype === "function") {
          showWrestlingMatchDetailPrototype(route);
        }
      } else if (route.name === "wrestling-show-detail") {
        renderWrestlingShowDetailRoute(route.showId, { skipDataRequest: true, showDetailVariant: route.showDetailVariant, routeShowId: route.routeShowId });
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

  let requestLoaded = false;
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
      requestLoaded = true;
      const route = typeof getRouteFromUrl === "function" ? getRouteFromUrl() : null;
      if (typeof isWrestlingMatchDetailPhotoRoute === "function" && isWrestlingMatchDetailPhotoRoute(route)) {
        if (typeof showWrestlingMatchDetailPrototypePhoto === "function") {
          showWrestlingMatchDetailPrototypePhoto(route);
        }
      } else if (typeof isWrestlingMatchDetailRoute === "function" && isWrestlingMatchDetailRoute(route)) {
        if (typeof showWrestlingMatchDetailPrototype === "function") {
          showWrestlingMatchDetailPrototype(route);
        }
      } else if (route?.name === "wrestling-show-detail") {
        renderWrestlingShowDetailRoute(route.dateKey || route.showId || showId, { skipDataRequest: true, showDetailVariant: route.showDetailVariant, routeShowId: route.routeShowId });
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
      if (!requestLoaded) {
        wrestlingMatchPhotoRequests.delete(requestKey);
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
function getHallCrusadesSearchText(show) {
  const matchLabels = getWrestlingArray(show?.matches).flatMap((match) => [
    match?.title,
    match?.matchName,
    match?.matchType,
    getWrestlingArray(match?.participants).join(" "),
    getWrestlingArray(match?.taggedPeople).join(" "),
  ]);
  return normalizeWrestlingShowsSearchValue([
    show?.title,
    show?.eventName,
    show?.showName,
    show?.promotion,
    show?.venue,
    show?.city,
    show?.state,
    show?.location,
    show?.eventDate,
    show?.rawDate,
    show?.dateKey,
    show?.year,
    show?.showKey,
    show?.showId,
    show?.eventId,
    getWrestlingShowPosterLabel(show),
    getWrestlingArray(show?.aliases).join(" "),
    show?.backend_record?.show_name,
    show?.backend_record?.event_name,
    show?.backend_record?.name,
    show?.backend_record?.title,
    show?.backend_record?.promotion,
    show?.backend_record?.venue,
    show?.backend_record?.venue_name,
    show?.backend_record?.city,
    show?.backend_record?.state,
    show?.backend_record?.date,
    ...matchLabels,
  ].filter(Boolean).join(" "));
}

function doesHallCrusadesShowMatchSearch(show, searchNeedle) {
  if (!searchNeedle) {
    return true;
  }

  const haystack = getHallCrusadesSearchText(show);
  if (haystack.includes(searchNeedle.phrase)) {
    return true;
  }
  return searchNeedle.terms.every((term) => haystack.includes(term));
}

function getHallCrusadesSearchFilterRows(rows = getWrestlingShowsIndexRows()) {
  const sourceRows = Array.isArray(rows) ? rows : [];
  const searchNeedle = getWrestlingShowsSearchNeedle(activeHallCrusadesSearchQuery);
  if (!searchNeedle) {
    return sourceRows;
  }

  return sourceRows.filter((show) => doesHallCrusadesShowMatchSearch(show, searchNeedle));
}

function getHallCrusadesPosterSourceRows() {
  const rows = getWrestlingShowsIndexRows();
  normalizeActiveHallCrusadesBannerFilter(rows);
  normalizeActiveHallCrusadesFieldFilter(rows);
  return getHallCrusadesSearchFilterRows(getHallCrusadesFieldFilterRows(getHallCrusadesBannerFilterRows(getHallCrusadesYearFilterRows(rows))));
}

function getHallCrusadesArchiveStatCounts(rows = []) {
  const sourceRows = Array.isArray(rows) ? rows : [];
  return {
    campaigns: sourceRows.length,
    banners: getWrestlingShowsUniqueOptions(sourceRows, (show) => show.promotion === "Promotion Pending" ? "" : show.promotion).length,
    fields: getWrestlingShowsUniqueOptions(sourceRows, getHallCrusadesFieldOptionValue).length,
    years: getWrestlingShowsUniqueOptions(sourceRows, (show) => show.year, "year-desc").filter((year) => /^\d{4}$/.test(year)).length,
  };
}

function renderHallCrusadesArchiveStats(rows = []) {
  if (!hallCrusadesArchiveStats) {
    return;
  }

  const isVisible = isHallCrusadesShowsVariantActive() && wrestlingShowsDataState === "live";
  const counts = getHallCrusadesArchiveStatCounts(isVisible ? rows : []);
  hallCrusadesArchiveStats.hidden = !isVisible;
  hallCrusadesArchiveStatValues.forEach((valueElement) => {
    const statName = valueElement.dataset.hallCrusadesArchiveStatValue;
    valueElement.textContent = String(counts[statName] ?? 0);
  });
  hallCrusadesArchiveStats.setAttribute(
    "aria-label",
    `Hall archive summary: ${counts.campaigns} campaigns, ${counts.banners} banners, ${counts.fields} fields, ${counts.years} years`
  );
}

function isHallCrusadesShowAwaitingCommunication(show) {
  const showTimestamp = getWrestlingShowTimestamp(show);
  return Number.isFinite(showTimestamp) && showTimestamp >= getWrestlingStartOfToday();
}

function isHallCrusadesDefaultPosterState() {
  return activeHallCrusadesYearFilter === ""
    && activeHallCrusadesBannerFilter === "all"
    && activeHallCrusadesFieldFilter === "all"
    && activeHallCrusadesSearchQuery.trim() === "";
}

function getHallCrusadesLatestCompletedPosterIndex(rows = []) {
  const sourceRows = Array.isArray(rows) ? rows : [];
  const startOfToday = getWrestlingStartOfToday();
  let latestCompletedIndex = -1;
  let latestCompletedTimestamp = 0;

  sourceRows.forEach((show, index) => {
    const showTimestamp = getWrestlingShowTimestamp(show);
    if (!Number.isFinite(showTimestamp) || showTimestamp <= 0 || showTimestamp >= startOfToday) {
      return;
    }

    if (showTimestamp > latestCompletedTimestamp) {
      latestCompletedTimestamp = showTimestamp;
      latestCompletedIndex = index;
    }
  });

  return latestCompletedIndex;
}

function applyHallCrusadesDefaultPosterActiveIndex(rows = []) {
  if (isHallCrusadesPosterDefaultIndexApplied || !isHallCrusadesDefaultPosterState()) {
    return;
  }

  const latestCompletedIndex = getHallCrusadesLatestCompletedPosterIndex(rows);
  if (latestCompletedIndex >= 0) {
    hallCrusadesPosterActiveIndex = latestCompletedIndex;
  }
  isHallCrusadesPosterDefaultIndexApplied = true;
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
    isHallCrusadesSearchPanelOpen = false;
    syncHallCrusadesSearchControls();
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
    isHallCrusadesSearchPanelOpen = false;
    syncHallCrusadesSearchControls();
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
    isHallCrusadesSearchPanelOpen = false;
    syncHallCrusadesYearControls();
    syncHallCrusadesBannerControls();
    syncHallCrusadesSearchControls();
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


function syncHallCrusadesSearchControls() {
  const isSearchActive = activeHallCrusadesSearchQuery.trim() !== "";
  const isPanelVisible = isHallCrusadesShowsVariantActive() && isHallCrusadesSearchPanelOpen;

  if (hallCrusadesSearchCrystal) {
    hallCrusadesSearchCrystal.classList.toggle("is-active", isSearchActive);
    hallCrusadesSearchCrystal.setAttribute("aria-expanded", String(isPanelVisible));
    hallCrusadesSearchCrystal.setAttribute("aria-pressed", String(isSearchActive));
    hallCrusadesSearchCrystal.setAttribute("aria-label", isSearchActive
      ? `Search archive query: ${activeHallCrusadesSearchQuery}`
      : "Search archive query");
    hallCrusadesSearchCrystal.dataset.hallCrusadesSearchQuery = activeHallCrusadesSearchQuery;
  }

  if (hallCrusadesSearchPanel) {
    hallCrusadesSearchPanel.hidden = !isPanelVisible;
  }

  if (hallCrusadesSearchInput && hallCrusadesSearchInput.value !== activeHallCrusadesSearchQuery) {
    hallCrusadesSearchInput.value = activeHallCrusadesSearchQuery;
  }

  if (hallCrusadesSearchClear) {
    hallCrusadesSearchClear.disabled = !isSearchActive;
  }
}

function focusHallCrusadesSearchInput() {
  if (!hallCrusadesSearchInput) {
    return;
  }

  window.requestAnimationFrame(() => {
    if (isHallCrusadesSearchPanelOpen && isHallCrusadesShowsVariantActive()) {
      hallCrusadesSearchInput.focus({ preventScroll: true });
    }
  });
}

function setHallCrusadesSearchPanelOpen(isOpen) {
  isHallCrusadesSearchPanelOpen = Boolean(isOpen && isHallCrusadesShowsVariantActive());
  if (isHallCrusadesSearchPanelOpen) {
    isHallCrusadesYearDrawerOpen = false;
    isHallCrusadesBannerDrawerOpen = false;
    isHallCrusadesFieldDrawerOpen = false;
    syncHallCrusadesYearControls();
    syncHallCrusadesBannerControls();
    syncHallCrusadesFieldControls();
  }
  syncHallCrusadesSearchControls();
  if (isHallCrusadesSearchPanelOpen) {
    focusHallCrusadesSearchInput();
  }
}

function updateHallCrusadesSearchQuery(value) {
  const nextValue = String(value ?? "");
  if (nextValue === activeHallCrusadesSearchQuery) {
    syncHallCrusadesSearchControls();
    return;
  }

  activeHallCrusadesSearchQuery = nextValue;
  hallCrusadesPosterActiveIndex = 0;
  if (hallCrusadesPosterStrip) {
    delete hallCrusadesPosterStrip.dataset.hallCrusadesFlowDirection;
  }
  renderHallCrusadesPosterStrip();
}

function handleHallCrusadesSearchCrystalClick(event) {
  if (!isHallCrusadesShowsVariantActive()) {
    return;
  }

  event.preventDefault();
  setHallCrusadesSearchPanelOpen(!isHallCrusadesSearchPanelOpen);
}

function handleHallCrusadesSearchInput(event) {
  updateHallCrusadesSearchQuery(event.currentTarget?.value || "");
}

function handleHallCrusadesSearchClearClick(event) {
  event.preventDefault();
  updateHallCrusadesSearchQuery("");
  setHallCrusadesSearchPanelOpen(true);
}

function handleHallCrusadesSearchDocumentClick(event) {
  if (!isHallCrusadesSearchPanelOpen) {
    return;
  }

  const crystalGroup = hallCrusadesSearchCrystal?.closest(".hall-crusades-archive-crystals");
  if (crystalGroup?.contains(event.target)) {
    return;
  }

  setHallCrusadesSearchPanelOpen(false);
}

function handleHallCrusadesSearchKeydown(event) {
  if (event.key === "Enter" && hallCrusadesSearchInput?.contains(event.target)) {
    event.preventDefault();
    return;
  }

  if (event.key === "Escape" && isHallCrusadesSearchPanelOpen) {
    event.preventDefault();
    setHallCrusadesSearchPanelOpen(false);
    hallCrusadesSearchCrystal?.focus();
  }
}

function bindHallCrusadesSearchCrystalInteraction() {
  if (isHallCrusadesSearchCrystalInteractionBound) {
    return;
  }

  isHallCrusadesSearchCrystalInteractionBound = true;
  hallCrusadesSearchCrystal?.addEventListener("click", handleHallCrusadesSearchCrystalClick);
  hallCrusadesSearchInput?.addEventListener("input", handleHallCrusadesSearchInput);
  hallCrusadesSearchClear?.addEventListener("click", handleHallCrusadesSearchClearClick);
  document.addEventListener("click", handleHallCrusadesSearchDocumentClick, true);
  document.addEventListener("keydown", handleHallCrusadesSearchKeydown);
  syncHallCrusadesSearchControls();
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

function syncHallCrusadesPosterNavControls(total = getHallCrusadesPosterSourceRows().length) {
  const canNavigate = isHallCrusadesShowsVariantActive() && wrestlingShowsDataState === "live" && total > 1;
  hallCrusadesPosterNavButtons.forEach((button) => {
    button.disabled = !canNavigate;
    button.setAttribute("aria-disabled", String(!canNavigate));
    button.classList.toggle("is-muted", !canNavigate);
  });
}

function handleHallCrusadesPosterNavClick(event) {
  if (!isHallCrusadesShowsVariantActive()) {
    return;
  }

  const direction = event.currentTarget?.dataset?.hallCrusadesPosterNav === "previous" ? -1 : 1;
  event.preventDefault();
  advanceHallCrusadesPosterActive(direction);
}

function bindHallCrusadesPosterNavInteraction() {
  if (isHallCrusadesPosterNavInteractionBound) {
    return;
  }

  isHallCrusadesPosterNavInteractionBound = true;
  hallCrusadesPosterNavButtons.forEach((button) => {
    button.addEventListener("click", handleHallCrusadesPosterNavClick);
  });
  syncHallCrusadesPosterNavControls();
}

function isHallCrusadesPosterDesktopKeyboard() {
  return typeof window === "undefined"
    || typeof window.matchMedia !== "function"
    || window.matchMedia("(min-width: 760px)").matches;
}

function isHallCrusadesPosterKeyboardIgnoredTarget(target) {
  return Boolean(target?.closest?.("input, textarea, select, [contenteditable='true'], [role='menu'], .hall-crusades-search-panel"));
}

function handleHallCrusadesPosterKeyboardNavigation(event) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
    return;
  }

  if (event.defaultPrevented || !isHallCrusadesShowsVariantActive() || !isHallCrusadesPosterDesktopKeyboard()) {
    return;
  }

  if (isHallCrusadesYearDrawerOpen || isHallCrusadesBannerDrawerOpen || isHallCrusadesFieldDrawerOpen || isHallCrusadesSearchPanelOpen) {
    return;
  }

  if (isHallCrusadesPosterKeyboardIgnoredTarget(event.target)) {
    return;
  }

  const direction = event.key === "ArrowRight" ? 1 : -1;
  if (advanceHallCrusadesPosterActive(direction)) {
    event.preventDefault();
  }
}

function bindHallCrusadesPosterKeyboardInteraction() {
  if (isHallCrusadesPosterKeyboardInteractionBound) {
    return;
  }

  isHallCrusadesPosterKeyboardInteractionBound = true;
  document.addEventListener("keydown", handleHallCrusadesPosterKeyboardNavigation);
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

function isHallCrusadesPosterDesktopWheel() {
  return typeof window === "undefined"
    || typeof window.matchMedia !== "function"
    || window.matchMedia("(min-width: 760px)").matches;
}

function getHallCrusadesPosterWheelModeScale(event) {
  if (event.deltaMode === 1) {
    return 16;
  }

  if (event.deltaMode === 2) {
    return Math.max(window.innerHeight || 640, 320);
  }

  return 1;
}

function normalizeHallCrusadesPosterWheelDelta(event) {
  const modeScale = getHallCrusadesPosterWheelModeScale(event);
  const deltaX = event.deltaX * modeScale;
  const deltaY = event.deltaY * modeScale;
  const gestureDelta = Math.abs(deltaX) >= 4 ? deltaX : deltaY;
  if (Math.abs(gestureDelta) < 1) {
    return 0;
  }

  return Math.sign(gestureDelta) * Math.min(Math.abs(gestureDelta), HALL_CRUSADES_POSTER_WHEEL_MAX_DELTA);
}

function resetHallCrusadesPosterWheelDeltaSoon() {
  window.clearTimeout(hallCrusadesPosterWheelResetTimer);
  hallCrusadesPosterWheelResetTimer = window.setTimeout(() => {
    hallCrusadesPosterWheelDelta = 0;
    hallCrusadesPosterWheelResetTimer = 0;
  }, HALL_CRUSADES_POSTER_WHEEL_IDLE_RESET_MS);
}

function handleHallCrusadesPosterWheel(event) {
  if (!isHallCrusadesShowsVariantActive() || !isHallCrusadesPosterDesktopWheel()) {
    return;
  }

  if (event.target?.closest?.("input, textarea, select, [contenteditable='true']")) {
    return;
  }

  const visiblePosterCount = hallCrusadesPosterStrip?.querySelectorAll(".hall-crusades-poster-strip__item").length || 0;
  if (visiblePosterCount < 2) {
    return;
  }

  const wheelDelta = normalizeHallCrusadesPosterWheelDelta(event);
  if (Math.abs(wheelDelta) < 1) {
    return;
  }

  event.preventDefault();
  resetHallCrusadesPosterWheelDeltaSoon();

  const now = typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
  if (now - hallCrusadesPosterWheelLastAdvanceTime < HALL_CRUSADES_POSTER_WHEEL_COOLDOWN_MS) {
    return;
  }

  hallCrusadesPosterWheelDelta += wheelDelta;
  if (Math.abs(hallCrusadesPosterWheelDelta) < HALL_CRUSADES_POSTER_WHEEL_THRESHOLD) {
    return;
  }

  const didAdvance = advanceHallCrusadesPosterActive(hallCrusadesPosterWheelDelta > 0 ? 1 : -1);
  hallCrusadesPosterWheelDelta = 0;
  if (didAdvance) {
    hallCrusadesPosterWheelLastAdvanceTime = now;
  }
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
    renderHallCrusadesArchiveStats([]);
    clearHallCrusadesCampaignInfoPanel();
    return;
  }

  if (!isHallCrusadesShowsVariantActive() || wrestlingShowsDataState !== "live") {
    setHallCrusadesYearDrawerOpen(false);
    setHallCrusadesBannerDrawerOpen(false);
    setHallCrusadesFieldDrawerOpen(false);
    setHallCrusadesSearchPanelOpen(false);
    hallCrusadesPosterStrip.hidden = true;
    hallCrusadesPosterStrip.replaceChildren();
    renderHallCrusadesArchiveStats([]);
    syncHallCrusadesPosterNavControls(0);
    clearHallCrusadesCampaignInfoPanel();
    return;
  }

  bindHallCrusadesYearCrystalInteraction();
  bindHallCrusadesBannerCrystalInteraction();
  bindHallCrusadesFieldCrystalInteraction();
  bindHallCrusadesSearchCrystalInteraction();
  bindHallCrusadesPosterStripInteraction();
  bindHallCrusadesPosterNavInteraction();
  bindHallCrusadesPosterKeyboardInteraction();
  const posterSourceRows = getHallCrusadesPosterSourceRows();
  applyHallCrusadesDefaultPosterActiveIndex(posterSourceRows);
  renderHallCrusadesArchiveStats(posterSourceRows);
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
  hallCrusadesPosterStrip.dataset.hallCrusadesSearchQuery = activeHallCrusadesSearchQuery;
  hallCrusadesPosterStrip.replaceChildren(fragment);
  syncHallCrusadesPosterNavControls(posterSourceRows.length);
  syncHallCrusadesYearControls();
  syncHallCrusadesBannerControls();
  syncHallCrusadesFieldControls();
  syncHallCrusadesSearchControls();
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

function createHallPrototypeCampaignInfoField(label, value) {
  const field = document.createElement("div");
  field.className = "wrestling-show-prototype-card__field";

  const labelElement = document.createElement("dt");
  labelElement.className = "wrestling-show-prototype-card__label";
  labelElement.textContent = label;

  const valueElement = document.createElement("dd");
  valueElement.className = "wrestling-show-prototype-card__value";
  valueElement.textContent = value;

  field.append(labelElement, valueElement);
  return field;
}

function getHallPrototypeMatchSource(match = {}) {
  return match?.backend_record && typeof match.backend_record === "object"
    ? { ...match.backend_record, ...match }
    : match || {};
}

function getHallPrototypeRawMatchSource(match = {}) {
  return match?.backend_record && typeof match.backend_record === "object"
    ? match.backend_record
    : match && typeof match === "object"
      ? match
      : {};
}

function getHallPrototypeSafeText(value) {
  if (value && typeof value === "object") {
    return getWrestlingLabelArray(value)
      .map((label) => getWrestlingText(label).replace(/\s+/g, " ").trim())
      .find((label) => label && label !== "[object Object]") || "";
  }
  const text = getWrestlingText(value).replace(/\s+/g, " ").trim();
  return text === "[object Object]" ? "" : text;
}

function getHallPrototypeUniqueLabels(value) {
  const labels = [];
  const seen = new Set();
  getWrestlingLabelArray(value).forEach((valueLabel) => {
    const label = getHallPrototypeSafeText(valueLabel);
    const key = label.toLowerCase();
    if (!label || seen.has(key)) {
      return;
    }
    seen.add(key);
    labels.push(label);
  });
  return labels;
}

function getHallPrototypeExpandedParticipantLabels(values, knownParticipants = []) {
  const knownKeys = new Set(
    getHallPrototypeUniqueLabels(knownParticipants)
      .map(normalizeHallPrototypeWinnerText)
      .filter(Boolean)
  );
  const names = [];
  const seen = new Set();
  const addName = (value) => {
    const name = getHallPrototypeSafeText(value);
    const key = normalizeHallPrototypeWinnerText(name);
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    names.push(name);
  };

  getHallPrototypeUniqueLabels(values).forEach((label) => {
    const isWrappedRoster = /^\s*\(.+\)\s*$/.test(label) && /[,;]|\s+and\s+/i.test(label);
    const participantLabel = isWrappedRoster
      ? label.replace(/^\s*\(\s*/, "").replace(/\s*\)\s*$/, "")
      : label;
    const hasSafeDelimiter = /[,;]/.test(participantLabel);
    const delimitedParts = hasSafeDelimiter
      ? participantLabel.split(/\s*[,;]\s*/).filter(Boolean)
      : [participantLabel];

    delimitedParts.forEach((part) => {
      const andParts = part.split(/\s+and\s+/i).map(getHallPrototypeSafeText).filter(Boolean);
      const canSplitAnd = andParts.length > 1 && (
        hasSafeDelimiter ||
        andParts.every((name) => knownKeys.has(normalizeHallPrototypeWinnerText(name)))
      );
      (canSplitAnd ? andParts : [part]).forEach(addName);
    });
  });

  return names;
}

function getHallPrototypeClassificationData(match = {}) {
  const rawSource = getHallPrototypeRawMatchSource(match);
  const readValues = (fields) => fields
    .map((field) => getHallPrototypeSafeText(rawSource[field]))
    .filter(Boolean);
  const classificationFields = [
    "match_type",
    "matchType",
    "type",
    "record_type",
    "recordType",
    "category",
    "classification",
    "kind",
  ];
  const detailFields = ["stipulation", "segment_type", "segmentType", "title"];
  const classificationValues = readValues(classificationFields);
  const detailValues = readValues(detailFields);
  const battleRoyalClassificationKeys = new Set([
    "battle royal",
    "battle royale",
    "royal rumble",
    "rumble",
  ]);
  const championshipClassificationKeys = new Set([
    "championship",
    "championship match",
  ]);
  const battleRoyalInfo = classificationValues.some((value) =>
    battleRoyalClassificationKeys.has(normalizeHallPrototypeWinnerText(value))
  )
    ? { label: "BATTLE ROYAL" }
    : null;
  const championshipTitle = getHallPrototypeSafeText(rawSource.title);
  const championshipInfo = classificationValues.some((value) =>
    championshipClassificationKeys.has(normalizeHallPrototypeWinnerText(value))
  )
    ? {
        label: "CHAMPIONSHIP",
        heading: (championshipTitle
          ? /\bchampionship\b/i.test(championshipTitle)
            ? championshipTitle
            : championshipTitle + " Championship"
          : "Championship").toUpperCase(),
      }
    : null;
  const segmentValues = [...classificationValues, ...detailValues, getHallPrototypeSafeText(rawSource.notes)].filter(Boolean);
  const isSegmentValue = (value) => /\b(segment|promo|attack|angle|incident|interview)\b/i.test(value);
  const primarySource = segmentValues.find(isSegmentValue);
  let segmentInfo = null;

  if (primarySource) {
    const primary = /\bsegment\b/i.test(primarySource)
      ? "Segment"
      : /\bpromo\b/i.test(primarySource)
        ? "Promo"
        : "Segment";
    const secondary = [...detailValues, ...classificationValues]
      .find((value) => normalizeHallPrototypeWinnerText(value) !== normalizeHallPrototypeWinnerText(primary) && isSegmentValue(value));
    segmentInfo = {
      label: [primary, secondary].filter(Boolean).map((value) => value.toUpperCase()).join(" // "),
    };
  }

  const rawNote = getHallPrototypeSafeText(rawSource.notes);
  const rawNoteVariants = new Set(getHallPrototypeNoteComparisonVariants(rawNote));
  const classificationVariants = new Set(
    [...classificationValues, ...detailValues]
      .flatMap(getHallPrototypeNoteComparisonVariants)
  );
  const noteDuplicatesClassification = [...rawNoteVariants].some((variant) => classificationVariants.has(variant));
  const shortLegacyLabel = rawNote &&
    rawNote.split(/\s+/).filter(Boolean).length <= 5 &&
    !noteDuplicatesClassification
      ? rawNote
      : "";
  const headingCandidates = [
    rawSource.stipulation,
    rawSource.matchType,
    shortLegacyLabel,
    rawSource.match_type,
    rawSource.type,
    rawSource.record_type,
    rawSource.recordType,
    rawSource.category,
    rawSource.classification,
    rawSource.kind,
    rawSource.segment_type,
    rawSource.segmentType,
    rawSource.title,
  ].map(getHallPrototypeSafeText).filter(Boolean);
  const heading = segmentInfo?.label || championshipInfo?.heading || headingCandidates.find((value) => !/^match(?:\s+\d+)?$/i.test(value)) || "Encounter";

  return { heading, segmentInfo, battleRoyalInfo, championshipInfo };
}

function getHallPrototypeMatchTypeText(match = {}) {
  return getHallPrototypeClassificationData(match).heading;
}

function getHallPrototypeSegmentInfo(match = {}) {
  return getHallPrototypeClassificationData(match).segmentInfo;
}

function getHallPrototypeParticipantLabels(match = {}) {
  const rawSource = getHallPrototypeRawMatchSource(match);
  const source = getHallPrototypeMatchSource(match);
  const participantFields = [
    "participants",
    "participant_names",
    "participantNames",
    "related_people",
    "relatedPeople",
  ];
  const candidates = [
    ...participantFields.map((field) => rawSource[field]),
    ...(rawSource === source ? [] : participantFields.map((field) => source[field])),
  ];

  for (const candidate of candidates) {
    const participants = getHallPrototypeExpandedParticipantLabels(candidate);
    if (participants.length > 0) {
      return participants;
    }
  }
  return [];
}

function getHallPrototypeGroupedSideValue(groupedSides, sideNumber = 1) {
  if (Array.isArray(groupedSides)) {
    return groupedSides[sideNumber - 1];
  }
  if (!groupedSides || typeof groupedSides !== "object") {
    return null;
  }

  const groupedFields = sideNumber === 1
    ? ["side_1", "side1", "side_one", "sideOne", "team_1", "team1", "team_one", "teamOne", "participant_1", "participant1"]
    : ["side_2", "side2", "side_two", "sideTwo", "team_2", "team2", "team_two", "teamTwo", "participant_2", "participant2"];
  for (const field of groupedFields) {
    if (getHallPrototypeUniqueLabels(groupedSides[field]).length > 0) {
      return groupedSides[field];
    }
  }
  return groupedSides[sideNumber - 1] || groupedSides[sideNumber] || null;
}

function getHallPrototypeSideLabels(match = {}, sideNumber = 1) {
  const source = getHallPrototypeMatchSource(match);
  const directFields = sideNumber === 1
    ? ["side_1", "side1", "side_one", "sideOne"]
    : ["side_2", "side2", "side_two", "sideTwo"];
  const aliasFields = sideNumber === 1
    ? ["team_1", "team1", "team_one", "teamOne", "participant_1", "participant1", "participants_1", "participants1", "participant_side_1", "participantSide1"]
    : ["team_2", "team2", "team_two", "teamTwo", "participant_2", "participant2", "participants_2", "participants2", "participant_side_2", "participantSide2"];

  for (const field of directFields) {
    const labels = getHallPrototypeUniqueLabels(source[field]);
    if (labels.length > 0) {
      return labels;
    }
  }

  const groupedCandidates = [
    source.participant_sides,
    source.participantSides,
    source.team_sides,
    source.teamSides,
    source.sides,
    source.teams,
  ];
  for (const groupedSides of groupedCandidates) {
    const labels = getHallPrototypeUniqueLabels(getHallPrototypeGroupedSideValue(groupedSides, sideNumber));
    if (labels.length > 0) {
      return labels;
    }
  }

  for (const field of aliasFields) {
    const labels = getHallPrototypeUniqueLabels(source[field]);
    if (labels.length > 0) {
      return labels;
    }
  }
  return [];
}

function getHallPrototypeEncounterSideNames(values, knownParticipants = []) {
  const names = getHallPrototypeExpandedParticipantLabels(values, knownParticipants);
  return names.length > 0 ? names : ["Side Pending"];
}

function getHallPrototypeMatchSides(match = {}) {
  const rawSource = getHallPrototypeRawMatchSource(match);
  const participants = getHallPrototypeParticipantLabels(match);
  const sideOneLabels = getHallPrototypeSideLabels(match, 1);
  const sideTwoLabels = getHallPrototypeSideLabels(match, 2);
  let sideOneNames = sideOneLabels.length > 0
    ? getHallPrototypeExpandedParticipantLabels(sideOneLabels, participants)
    : [];
  let sideTwoNames = sideTwoLabels.length > 0
    ? getHallPrototypeExpandedParticipantLabels(sideTwoLabels, participants)
    : [];
  let normalizedSideOneLabels = sideOneLabels;
  let normalizedSideTwoLabels = sideTwoLabels;

  if (sideOneNames.length === 0 && sideTwoNames.length === 0 && participants.length > 0) {
    const midpoint = Math.ceil(participants.length / 2);
    sideOneNames = participants.slice(0, midpoint);
    sideTwoNames = participants.slice(midpoint);
    normalizedSideOneLabels = [...sideOneNames];
    normalizedSideTwoLabels = [...sideTwoNames];
  }

  if (sideOneNames.length === 0 && sideTwoNames.length === 0) {
    const title = getHallPrototypeSafeText(rawSource.title);
    const titleSides = title.split(/\s+v(?:s\.?|\.?)\s+/i).map(getHallPrototypeSafeText).filter(Boolean);
    if (titleSides.length === 2) {
      normalizedSideOneLabels = [titleSides[0]];
      normalizedSideTwoLabels = [titleSides[1]];
      sideOneNames = getHallPrototypeExpandedParticipantLabels(normalizedSideOneLabels);
      sideTwoNames = getHallPrototypeExpandedParticipantLabels(normalizedSideTwoLabels);
    }
  }


  if (sideOneNames.length === 0) {
    sideOneNames = ["Side Pending"];
    normalizedSideOneLabels = ["Side Pending"];
  }
  if (sideTwoNames.length === 0) {
    sideTwoNames = ["Side Pending"];
    normalizedSideTwoLabels = ["Side Pending"];
  }

  return {
    participants: [...participants],
    sides: [
      { side: 1, labels: [...normalizedSideOneLabels], names: [...sideOneNames] },
      { side: 2, labels: [...normalizedSideTwoLabels], names: [...sideTwoNames] },
    ],
  };
}

function getHallPrototypeMatchOfficialNames(match = {}) {
  const source = getHallPrototypeMatchSource(match);
  const names = [];
  const seen = new Set();
  const addName = (value) => {
    const text = getHallPrototypeSafeText(value);
    const key = normalizeHallPrototypeWinnerText(text);
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    names.push(text);
  };
  const addValues = (values) => {
    values.forEach((value) => {
      getHallPrototypeUniqueLabels(value).forEach((label) => {
        label.split(/\s*[,;]\s*/).forEach(addName);
      });
    });
  };

  addValues([
    source.referees,
    source.referee,
    source.referee_names,
    source.refereeNames,
    source.referee_name,
    source.refereeName,
    source.officials,
    source.official,
    source.match_officials,
    source.matchOfficials,
    source.match_official,
    source.matchOfficial,
  ]);

  if (names.length === 0) {
    addValues([source.refereeIds, source.referee_ids]);
  }

  return names;
}
function normalizeHallPrototypeNoteComparison(value) {
  return getWrestlingText(value)
    .replace(/[\u2018\u2019'":/\\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getHallPrototypeNoteComparisonVariants(value) {
  const normalized = normalizeHallPrototypeNoteComparison(value);
  if (!normalized) {
    return [];
  }
  const variants = new Set([normalized]);
  variants.add(normalized.replace(/\s+match$/i, "").trim());
  return [...variants].filter(Boolean);
}

function isHallPrototypeDuplicateNote(notes, match = {}) {
  const source = getHallPrototypeMatchSource(match);
  const noteVariants = getHallPrototypeNoteComparisonVariants(notes);
  if (noteVariants.length === 0) {
    return true;
  }

  const generatedHeading = getHallPrototypeMatchTypeText(match);
  const generatedHeadingVariants = new Set(getHallPrototypeNoteComparisonVariants(generatedHeading));
  const noteWordCount = noteVariants[0].split(/\s+/).filter(Boolean).length;
  if (noteWordCount >= 6 && !noteVariants.some((variant) => generatedHeadingVariants.has(variant))) {
    return false;
  }

  const headingValues = [
    source.match_type,
    source.matchType,
    source.stipulation,
    source.type,
    generatedHeading,
  ].map((value) => getWrestlingText(value)).filter(Boolean);
  const title = getWrestlingText(source.title);
  if (title && getHallPrototypeNoteComparisonVariants(title).some((variant) => generatedHeadingVariants.has(variant))) {
    headingValues.push(title);
  }

  const combinationValues = [];
  headingValues.forEach((primary, index) => {
    headingValues.slice(index + 1).forEach((secondary) => {
      combinationValues.push(`${primary} ${secondary}`, `${primary} / ${secondary}`, `${primary} // ${secondary}`);
    });
  });

  const duplicateVariants = new Set(
    [...headingValues, ...combinationValues]
      .flatMap(getHallPrototypeNoteComparisonVariants)
  );

  return noteVariants.some((variant) => duplicateVariants.has(variant));
}

function getHallPrototypeMatchNotes(match = {}) {
  const source = getHallPrototypeMatchSource(match);
  const notes = getHallPrototypeSafeText(source.notes);
  if (!notes || isHallPrototypeDuplicateNote(notes, match)) {
    return "";
  }
  return notes;
}

function normalizeHallPrototypeWinnerText(value) {
  return getWrestlingText(value)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getHallPrototypeMatchWinnerNames(match = {}) {
  const source = getHallPrototypeMatchSource(match);
  const names = [];
  const seen = new Set();
  const addName = (value) => {
    const text = getWrestlingText(value);
    const key = normalizeHallPrototypeWinnerText(text);
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    names.push(text);
  };

  [source.winner, source.winners].forEach((value) => {
    getWrestlingLabelArray(value).forEach((label) => {
      addName(label);
      if (label.includes(",")) {
        label.split(/\s*,\s*/).forEach(addName);
      }
    });
  });

  return names;
}

function getHallPrototypeWinnerTarget(match = {}, sides = []) {
  const source = getHallPrototypeMatchSource(match);
  const rawWinnerKeys = new Set(
    [source.winner, source.winners]
      .flatMap(getWrestlingLabelArray)
      .map(normalizeHallPrototypeWinnerText)
      .filter(Boolean)
  );
  const winnerKeys = new Set(
    getHallPrototypeMatchWinnerNames(match)
      .map(normalizeHallPrototypeWinnerText)
      .filter(Boolean)
  );
  const emptyTarget = { side: 0, participantWinnerKeys: [] };
  if (rawWinnerKeys.size === 0 || winnerKeys.size === 0) {
    return emptyTarget;
  }

  const targets = sides.map((side, index) => {
    const names = getHallPrototypeEncounterSideNames(side.names);
    const nameKeys = [...new Set(names.map(normalizeHallPrototypeWinnerText).filter(Boolean))];
    const sideLabels = getWrestlingLabelArray(side.labels).map(getWrestlingText).filter(Boolean);
    const sideLabelNames = sideLabels.map((label) => getHallPrototypeExpandedParticipantLabels([label], names));
    const hasExplicitRosterLabel = sideLabelNames.some((labelNames) => labelNames.length > 1);
    const completeSideKeys = new Set();
    const joinedNames = names.map(getWrestlingText).filter(Boolean);

    if (nameKeys.length === 1) {
      completeSideKeys.add(nameKeys[0]);
    } else if (nameKeys.length > 1) {
      [joinedNames.join(" "), joinedNames.join(", "), joinedNames.join(" and ")]
        .map(normalizeHallPrototypeWinnerText)
        .filter(Boolean)
        .forEach((key) => completeSideKeys.add(key));
    }
    if (sideLabels.length === 1) {
      const sideLabelKey = normalizeHallPrototypeWinnerText(sideLabels[0]);
      if (sideLabelKey) {
        completeSideKeys.add(sideLabelKey);
      }
    } else if (hasExplicitRosterLabel) {
      sideLabels.forEach((sideLabel, labelIndex) => {
        const sideLabelKey = normalizeHallPrototypeWinnerText(sideLabel);
        if (sideLabelNames[labelIndex].length === 1 && nameKeys.includes(sideLabelKey)) {
          completeSideKeys.add(sideLabelKey);
        }
      });
    }

    const matchedParticipantKeys = nameKeys.filter((key) => winnerKeys.has(key));
    const isFullSideWinner = [...rawWinnerKeys].some((key) => completeSideKeys.has(key)) ||
      (nameKeys.length > 1 && matchedParticipantKeys.length === nameKeys.length);
    const participantWinnerKeys = !isFullSideWinner && nameKeys.length > 1 && matchedParticipantKeys.length === 1
      ? matchedParticipantKeys
      : [];

    return {
      side: side.side || index + 1,
      nameKeys,
      completeSideKeys,
      isFullSideWinner,
      participantWinnerKeys,
    };
  });
  const activeTargets = targets.filter((target) => target.isFullSideWinner || target.participantWinnerKeys.length > 0);
  if (activeTargets.length !== 1) {
    return emptyTarget;
  }

  const target = activeTargets[0];
  const allWinnerValuesRecognized = [...rawWinnerKeys].every(
    (key) => target.completeSideKeys.has(key) || target.nameKeys.includes(key)
  );
  if (!allWinnerValuesRecognized) {
    return emptyTarget;
  }

  return {
    side: target.side,
    participantWinnerKeys: target.participantWinnerKeys,
  };
}

function getHallPrototypeBattleRoyalSides(participants = [], fallbackSides = []) {
  const participantNames = participants.map(getHallPrototypeSafeText).filter(Boolean);
  const fallbackNames = fallbackSides
    .flatMap((side) => side.names || [])
    .map(getHallPrototypeSafeText)
    .filter((name) => name && normalizeHallPrototypeWinnerText(name) !== "side pending");
  const entrantNames = participantNames.length > 0 ? participantNames : fallbackNames;
  if (entrantNames.length === 0) {
    return null;
  }

  const midpoint = Math.ceil(entrantNames.length / 2);
  return [
    {
      side: 1,
      labels: entrantNames.slice(0, midpoint),
      names: entrantNames.slice(0, midpoint),
      entrantNumbers: entrantNames.slice(0, midpoint).map((_, index) => index + 1),
    },
    {
      side: 2,
      labels: entrantNames.slice(midpoint),
      names: entrantNames.slice(midpoint),
      entrantNumbers: entrantNames.slice(midpoint).map((_, index) => midpoint + index + 1),
    },
  ];
}

function getHallPrototypeBattleRoyalWinnerTarget(match = {}, sides = []) {
  const winnerNames = getHallPrototypeMatchWinnerNames(match);
  if (winnerNames.length !== 1) {
    return { side: 0, participantWinnerKeys: [] };
  }

  const winnerKey = normalizeHallPrototypeWinnerText(winnerNames[0]);
  const matchingSides = sides.filter((side) =>
    side.names.some((name) => normalizeHallPrototypeWinnerText(name) === winnerKey)
  );
  if (!winnerKey || matchingSides.length !== 1) {
    return { side: 0, participantWinnerKeys: [] };
  }

  return {
    side: matchingSides[0].side,
    participantWinnerKeys: [winnerKey],
  };
}

function getHallPrototypeChampionshipSides(sides = []) {
  const championParticipantKeys = new Set();
  const normalizedSides = sides.map((side) => ({
    ...side,
    names: side.names.map((value) => {
      const sourceName = getHallPrototypeSafeText(value);
      const hasChampionSuffix = /\s*\(c\)\s*$/i.test(sourceName);
      const displayName = hasChampionSuffix
        ? sourceName.replace(/\s*\(c\)\s*$/i, "").trim()
        : sourceName;
      const participantKey = normalizeHallPrototypeWinnerText(displayName);
      if (hasChampionSuffix && participantKey) {
        championParticipantKeys.add(participantKey);
      }
      return displayName || sourceName;
    }),
  }));

  return {
    sides: normalizedSides,
    championParticipantKeys: [...championParticipantKeys],
  };
}

function normalizeHallPrototypeEncounterRecord(match = {}) {
  const classification = getHallPrototypeClassificationData(match);
  const sideData = getHallPrototypeMatchSides(match);
  const normalizedSides = sideData.sides.map((side) => ({
    side: side.side,
    labels: [...side.labels],
    names: [...side.names],
  }));
  const championshipSideData = classification.championshipInfo
    ? getHallPrototypeChampionshipSides(normalizedSides)
    : { sides: normalizedSides, championParticipantKeys: [] };
  const battleRoyalSides = classification.battleRoyalInfo
    ? getHallPrototypeBattleRoyalSides(sideData.participants, championshipSideData.sides)
    : null;
  const sides = battleRoyalSides || championshipSideData.sides;

  return {
    heading: classification.heading,
    segmentInfo: classification.segmentInfo,
    battleRoyalInfo: classification.battleRoyalInfo,
    championshipInfo: classification.championshipInfo,
    championParticipantKeys: championshipSideData.championParticipantKeys,
    participants: [...sideData.participants],
    sides,
    officials: getHallPrototypeMatchOfficialNames(match),
    notes: getHallPrototypeMatchNotes(match),
    winnerTarget: classification.battleRoyalInfo
      ? getHallPrototypeBattleRoyalWinnerTarget(match, sides)
      : getHallPrototypeWinnerTarget(match, sides),
  };
}

function createHallPrototypeSvgElement(tagName, attributes = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  return element;
}

function createHallPrototypeChampionshipBeltWatermark() {
  const watermark = document.createElement("span");
  watermark.className = "wrestling-show-prototype-encounter-belt-watermark";
  watermark.setAttribute("aria-hidden", "true");

  const belt = createHallPrototypeSvgElement("svg", {
    class: "wrestling-show-prototype-encounter-belt-watermark__svg",
    viewBox: "0 0 720 240",
    preserveAspectRatio: "none",
    focusable: "false",
  });
  const strap = createHallPrototypeSvgElement("path", {
    class: "wrestling-show-prototype-encounter-belt-watermark__strap",
    d: "M18 90 C88 70 142 70 205 82 L235 46 H485 L515 82 C578 70 632 70 702 90 V150 C632 170 578 170 515 158 L485 194 H235 L205 158 C142 170 88 170 18 150 Z",
  });
  const leftPlate = createHallPrototypeSvgElement("path", {
    class: "wrestling-show-prototype-encounter-belt-watermark__plate",
    d: "M72 126 L102 92 L180 84 L207 112 L190 148 L102 156 Z",
  });
  const rightPlate = createHallPrototypeSvgElement("path", {
    class: "wrestling-show-prototype-encounter-belt-watermark__plate",
    d: "M648 126 L618 92 L540 84 L513 112 L530 148 L618 156 Z",
  });
  const centerPlate = createHallPrototypeSvgElement("path", {
    class: "wrestling-show-prototype-encounter-belt-watermark__plate wrestling-show-prototype-encounter-belt-watermark__plate--center",
    d: "M264 46 H456 L496 88 L480 160 L438 194 H282 L240 160 L224 88 Z",
  });
  const centerDetail = createHallPrototypeSvgElement("path", {
    class: "wrestling-show-prototype-encounter-belt-watermark__detail",
    d: "M295 76 H425 L458 104 L446 148 L414 170 H306 L274 148 L262 104 Z M326 96 H394 L416 120 L394 144 H326 L304 120 Z",
  });
  belt.append(strap, leftPlate, rightPlate, centerPlate, centerDetail);
  watermark.append(belt);
  return watermark;
}

function createHallPrototypeChampionMarker() {
  const marker = document.createElement("span");
  marker.className = "wrestling-show-prototype-champion-marker";
  marker.setAttribute("aria-hidden", "true");

  const belt = createHallPrototypeSvgElement("svg", {
    viewBox: "0 0 36 18",
    focusable: "false",
  });
  belt.append(
    createHallPrototypeSvgElement("path", {
      class: "wrestling-show-prototype-champion-marker__strap",
      d: "M1 6 L9 5 L12 2 H24 L27 5 L35 6 V12 L27 13 L24 16 H12 L9 13 L1 12 Z",
    }),
    createHallPrototypeSvgElement("path", {
      class: "wrestling-show-prototype-champion-marker__plate",
      d: "M12 4 H24 L28 9 L24 14 H12 L8 9 Z M15 6 H21 L24 9 L21 12 H15 L12 9 Z",
    })
  );
  marker.append(belt);
  return marker;
}

function createHallPrototypeEncounterSide(label, values, options = {}) {
  const side = document.createElement("div");
  side.className = "wrestling-show-prototype-encounter-side";
  if (options.isWinner) {
    side.classList.add("wrestling-show-prototype-encounter-side--winner");
    side.dataset.hallPrototypeWinnerSide = "true";
  }
  side.setAttribute("aria-label", options.isWinner ? label + " winner" : label);

  const sideValue = document.createElement("p");
  sideValue.className = "wrestling-show-prototype-encounter-side-value";
  const participantWinnerKeys = new Set(options.participantWinnerKeys || []);
  const championParticipantKeys = new Set(options.championParticipantKeys || []);

  const entrantNumbers = Array.isArray(options.entrantNumbers) ? options.entrantNumbers : [];

  getHallPrototypeEncounterSideNames(values).forEach((name, index) => {
    const nameLine = document.createElement("span");
    nameLine.className = "wrestling-show-prototype-encounter-side-name";
    const entrantNumber = Number(entrantNumbers[index]);
    if (Number.isInteger(entrantNumber) && entrantNumber > 0) {
      nameLine.classList.add("wrestling-show-prototype-encounter-side-name--numbered");
      nameLine.dataset.hallPrototypeEntrantNumber = String(entrantNumber);

      const number = document.createElement("span");
      number.className = "wrestling-show-prototype-encounter-entrant-number";
      number.textContent = entrantNumber + " -";

      const entrantName = document.createElement("span");
      entrantName.className = "wrestling-show-prototype-encounter-entrant-name";
      entrantName.textContent = name;
      nameLine.append(number, entrantName);
    } else {
      nameLine.textContent = name;
    }
    if (championParticipantKeys.has(normalizeHallPrototypeWinnerText(name))) {
      nameLine.classList.add("wrestling-show-prototype-encounter-side-name--champion");
      nameLine.dataset.hallPrototypeChampionParticipant = "true";
      nameLine.append(createHallPrototypeChampionMarker());
    }
    if (participantWinnerKeys.has(normalizeHallPrototypeWinnerText(name))) {
      nameLine.classList.add("wrestling-show-prototype-encounter-side-name--winner");
      nameLine.dataset.hallPrototypeWinnerParticipant = "true";
      nameLine.setAttribute("aria-label", name + " winner");
    }
    sideValue.append(nameLine);
  });

  side.append(sideValue);
  return side;
}

function createHallPrototypeEncounterCard(match = {}, matchIndex = 0, show = null) {
  const encounter = normalizeHallPrototypeEncounterRecord(match);
  const card = document.createElement("li");
  const matchRef = getWrestlingMatchRouteRef(match, matchIndex);
  const matchRoute = getWrestlingMatchRouteUrlByIds(show || match.showId, matchRef, matchIndex);
  card.className = "wrestling-show-prototype-encounter-card";
  card.dataset.wrestlingMatchRef = matchRef;
  card.dataset.wrestlingMatchRoute = matchRoute;
  card.setAttribute("role", "link");
  card.tabIndex = 0;
  card.setAttribute("aria-label", `Open match ${matchIndex + 1}: ${encounter.heading}`);

  const navigateToMatch = () => {
    if (matchRoute && typeof navigateToRoute === "function") {
      navigateToRoute(matchRoute);
    }
  };
  card.addEventListener("click", navigateToMatch);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigateToMatch();
    }
  });
  if (encounter.segmentInfo) {
    card.classList.add("wrestling-show-prototype-encounter-card--segment");
    card.dataset.hallPrototypeEncounterState = "segment";
  }
  if (encounter.battleRoyalInfo) {
    card.classList.add("wrestling-show-prototype-encounter-card--battle-royal");
    card.dataset.hallPrototypeEncounterState = "battle-royal";
  }
  if (encounter.championshipInfo) {
    card.classList.add("wrestling-show-prototype-encounter-card--championship");
    card.dataset.hallPrototypeEncounterState = "championship";
  }

  const type = document.createElement("p");
  type.className = "wrestling-show-prototype-encounter-type";
  type.textContent = encounter.heading;

  const battleRoyalClassification = encounter.battleRoyalInfo &&
    normalizeHallPrototypeWinnerText(encounter.heading) !== normalizeHallPrototypeWinnerText(encounter.battleRoyalInfo.label)
      ? document.createElement("p")
      : null;
  if (battleRoyalClassification) {
    battleRoyalClassification.className = "wrestling-show-prototype-encounter-classification";
    battleRoyalClassification.textContent = encounter.battleRoyalInfo.label;
  }

  const combatants = document.createElement("div");
  combatants.className = "wrestling-show-prototype-encounter-combatants";

  const versus = document.createElement("span");
  versus.className = "wrestling-show-prototype-encounter-vs";
  versus.textContent = "VS";

  const sideOne = encounter.sides[0];
  const sideTwo = encounter.sides[1];
  const winnerTarget = encounter.winnerTarget;

  combatants.append(
    createHallPrototypeEncounterSide("Side 1", sideOne.names, {
      isWinner: !encounter.battleRoyalInfo && winnerTarget.side === 1 && winnerTarget.participantWinnerKeys.length === 0,
      participantWinnerKeys: winnerTarget.side === 1 ? winnerTarget.participantWinnerKeys : [],
      championParticipantKeys: encounter.championParticipantKeys,
      entrantNumbers: sideOne.entrantNumbers,
    }),
    versus,
    createHallPrototypeEncounterSide("Side 2", sideTwo.names, {
      isWinner: !encounter.battleRoyalInfo && winnerTarget.side === 2 && winnerTarget.participantWinnerKeys.length === 0,
      participantWinnerKeys: winnerTarget.side === 2 ? winnerTarget.participantWinnerKeys : [],
      championParticipantKeys: encounter.championParticipantKeys,
      entrantNumbers: sideTwo.entrantNumbers,
    })
  );

  if (encounter.officials.length > 0) {
    const official = document.createElement("p");
    official.className = "wrestling-show-prototype-encounter-official";
    official.textContent = (encounter.officials.length > 1 ? "OFFICIALS" : "OFFICIAL") +
      " " + String.fromCharCode(8226) + " " + encounter.officials.join(", ");
    combatants.append(official);
  }

  if (encounter.notes) {
    const note = document.createElement("p");
    note.className = "wrestling-show-prototype-encounter-note";
    note.textContent = encounter.notes;
    combatants.append(note);
  }

  card.dataset.wrestlingMatchIndex = String(matchIndex + 1);
  card.append(type);
  if (battleRoyalClassification) {
    card.append(battleRoyalClassification);
  }
  card.append(combatants);
  if (encounter.championshipInfo) {
    card.append(createHallPrototypeChampionshipBeltWatermark());
  }
  return card;
}

function getWrestlingMatchDetailRouteShowId(route = getRouteFromUrl()) {
  return String(route?.dateKey || route?.showId || WRESTLING_MATCH_DETAIL_SHOW_ID || "").trim().toLowerCase();
}

function getWrestlingMatchDetailRouteMatchRef(route = getRouteFromUrl()) {
  return String(route?.matchRef || route?.matchId || WRESTLING_MATCH_DETAIL_MATCH_ID || "").trim().toLowerCase();
}

function getWrestlingMatchDossierPrototypeFallbackMatch(route = getRouteFromUrl()) {
  const matchRef = getWrestlingMatchDetailRouteMatchRef(route) || WRESTLING_MATCH_DETAIL_MATCH_ID;
  const matchNumber = getWrestlingMatchRefNumber(matchRef);
  const matchName = matchNumber ? `Match ${matchNumber}` : "Match";
  return {
    matchId: matchRef,
    matchRef,
    matchName,
    title: matchName,
    matchType: "MATCH",
    match_type: "MATCH",
    stipulation: "MATCH",
    side_1: "Side Pending",
    side_2: "Side Pending",
    participants: ["Side Pending", "Side Pending"],
  };
}

function getWrestlingMatchDossierPrototypeSourceShow(route = getRouteFromUrl()) {
  return findLiveWrestlingShowById(getWrestlingMatchDetailRouteShowId(route));
}

function getWrestlingMatchDossierPrototypeSourceMatch(route = getRouteFromUrl(), show = getWrestlingMatchDossierPrototypeSourceShow(route)) {
  const routeMatchRef = getWrestlingMatchDetailRouteMatchRef(route);
  const liveMatch = show?.matches
    ? findWrestlingMatchInRowsByRef(show.matches, routeMatchRef)
    : null;
  return liveMatch || getWrestlingMatchDossierPrototypeFallbackMatch(route);
}

function getWrestlingMatchDossierHeroTypeText(match = {}) {
  const source = getHallPrototypeMatchSource(match);
  const typeCandidates = [
    source.stipulation,
    source.notes,
    source.matchType,
    source.match_type,
    source.type,
    source.title,
    source.matchName,
  ].map(getHallPrototypeSafeText).filter(Boolean);
  if (typeCandidates.some((value) => /glg\s+reunion/i.test(value))) {
    return "GLG REUNION";
  }
  const sideNames = [
    ...getHallPrototypeSideLabels(match, 1),
    ...getHallPrototypeSideLabels(match, 2),
  ].map(normalizeHallPrototypeWinnerText);
  if (sideNames.includes("lj cleary") && sideNames.includes("jack morris")) {
    return "GLG REUNION";
  }
  return getWrestlingText(getHallPrototypeMatchTypeText(match), "MATCH").toUpperCase();
}

function getWrestlingMatchDossierSides(encounter) {
  const fallbackEncounter = normalizeHallPrototypeEncounterRecord(getWrestlingMatchDossierPrototypeFallbackMatch());
  return [0, 1].map((index) => {
    const side = encounter.sides[index] || {};
    const names = getHallPrototypeEncounterSideNames(side.names);
    const hasPendingSide = names.length === 0 || names.some((name) => normalizeHallPrototypeWinnerText(name) === "side pending");
    return hasPendingSide ? fallbackEncounter.sides[index] : side;
  });
}

function createWrestlingMatchDossierHero(match = {}) {
  const encounter = normalizeHallPrototypeEncounterRecord(match);
  const sides = getWrestlingMatchDossierSides(encounter);
  const card = document.createElement("article");
  card.className = "wrestling-match-dossier-hero wrestling-show-prototype-encounter-card";
  card.dataset.wrestlingMatchDetailPrototype = "dossier-hero";

  const title = document.createElement("h2");
  title.className = "sr-only";
  title.id = "wrestling-match-detail-prototype-title";
  title.textContent = getWrestlingMatchDossierHeroTypeText(match);

  const combatants = document.createElement("div");
  combatants.className = "wrestling-show-prototype-encounter-combatants";

  const versus = document.createElement("span");
  versus.className = "wrestling-show-prototype-encounter-vs";
  versus.textContent = "VS";

  const sideOne = sides[0];
  const sideTwo = sides[1];
  const winnerTarget = encounter.winnerTarget || { side: 0, participantWinnerKeys: [] };

  combatants.append(
    createHallPrototypeEncounterSide("Side 1", sideOne.names, {
      isWinner: winnerTarget.side === 1 && winnerTarget.participantWinnerKeys.length === 0,
      participantWinnerKeys: winnerTarget.side === 1 ? winnerTarget.participantWinnerKeys : [],
      championParticipantKeys: encounter.championParticipantKeys,
    }),
    versus,
    createHallPrototypeEncounterSide("Side 2", sideTwo.names, {
      isWinner: winnerTarget.side === 2 && winnerTarget.participantWinnerKeys.length === 0,
      participantWinnerKeys: winnerTarget.side === 2 ? winnerTarget.participantWinnerKeys : [],
      championParticipantKeys: encounter.championParticipantKeys,
    })
  );

  card.append(title, combatants);
  return card;
}

function getWrestlingMatchDossierMetadataValue(value) {
  const text = getHallPrototypeSafeText(value);
  if (!text || text === "[object Object]" || /^(event|date|venue|location)\s+pending$/i.test(text)) {
    return "";
  }
  return text;
}

function getWrestlingMatchDossierMetadataFirstValue(...values) {
  return values
    .map(getWrestlingMatchDossierMetadataValue)
    .find(Boolean) || "";
}

function getWrestlingMatchDossierMetadataDisplayValue(value) {
  return getWrestlingMatchDossierMetadataValue(value) || "N/A";
}

function createWrestlingMatchDossierMetadataItem(label, value) {
  const item = document.createElement("div");
  item.className = "wrestling-match-dossier-metadata__item";

  const labelElement = document.createElement("dt");
  labelElement.className = "wrestling-match-dossier-metadata__label";
  labelElement.textContent = label;

  const valueElement = document.createElement("dd");
  valueElement.className = "wrestling-match-dossier-metadata__value";
  valueElement.textContent = getWrestlingMatchDossierMetadataDisplayValue(value);

  item.append(labelElement, valueElement);
  return item;
}

function getWrestlingMatchDossierMetadataRows(show = null, match = null) {
  if (!show && !match) {
    return [];
  }

  const safeShow = show || {};
  const matchSource = getHallPrototypeMatchSource(match);
  const officialNames = getHallPrototypeMatchOfficialNames(match || {});
  const officialLabel = officialNames.length > 1 ? "OFFICIALS" : "OFFICIAL";

  const event = getWrestlingMatchDossierMetadataFirstValue(
    safeShow.title,
    safeShow.eventName,
    safeShow.showName,
    safeShow.show_name
  );
  const date = getWrestlingMatchDossierMetadataFirstValue(
    safeShow.eventDate,
    formatWrestlingShowDate(safeShow.rawDate || safeShow.date || safeShow.show_date || safeShow.dateKey)
  );
  const venue = getWrestlingMatchDossierMetadataFirstValue(safeShow.venue, getWrestlingVenueName(safeShow));
  const location = getWrestlingMatchDossierMetadataFirstValue(safeShow.location, getWrestlingShowLocation(safeShow));
  const finish = getWrestlingMatchDossierMetadataFirstValue(matchSource.finish_type, matchSource.finishType);
  const duration = getWrestlingMatchDossierMetadataFirstValue(matchSource.match_duration, matchSource.matchDuration);

  return [
    {
      modifier: "context",
      items: [
        ["EVENT", event],
        ["DATE", date],
        ["VENUE", venue],
        ["LOCATION", location],
      ],
    },
    {
      modifier: "personnel",
      items: [
        [officialLabel, officialNames.join(", ")],
        ["ANNOUNCER", matchSource.announcer],
      ],
    },
    {
      modifier: "outcome",
      items: [
        ["BLOOD", matchSource.blood],
        ["FINISH", finish],
        ["DURATION", duration],
      ],
    },
    {
      modifier: "notes",
      items: [
        ["NOTES", matchSource.notes],
      ],
    },
  ];
}

function createWrestlingMatchDossierMetadata(show = null, match = null) {
  const rows = getWrestlingMatchDossierMetadataRows(show, match);
  if (rows.length === 0) {
    return null;
  }

  const metadata = document.createElement("dl");
  metadata.className = "wrestling-match-dossier-metadata";
  metadata.setAttribute("aria-label", "Match archive metadata");

  rows.forEach((row) => {
    const rowElement = document.createElement("div");
    rowElement.className = [
      "wrestling-match-dossier-metadata__row",
      "wrestling-match-dossier-metadata__row--" + row.modifier,
    ].join(" ");

    row.items.forEach(([label, value]) => {
      rowElement.append(createWrestlingMatchDossierMetadataItem(label, value));
    });

    metadata.append(rowElement);
  });

  return metadata;
}

function getWrestlingMatchDossierPrototypePhotoSource(show = null, route = getRouteFromUrl()) {
  const sourceShow = show || getWrestlingMatchDossierPrototypeSourceShow(route);
  const routeMatchRef = getWrestlingMatchDetailRouteMatchRef(route);
  const matchRows = Array.isArray(sourceShow?.matches) ? sourceShow.matches : [];
  const match = sourceShow
    ? findWrestlingMatchInRowsByRef(matchRows, routeMatchRef)
    : null;
  const matchIndex = matchRows.indexOf(match);
  const matchRef = match
    ? getWrestlingMatchRouteRef(match, matchIndex)
    : routeMatchRef;

  return {
    show: sourceShow,
    match,
    showId: sourceShow?.showId || getWrestlingMatchDetailRouteShowId(route),
    matchRef,
  };
}

function getWrestlingMatchDossierPrototypePhotoRequestKey(showId, matchRef) {
  return [
    normalizeWrestlingArchiveSlug(showId, ""),
    normalizeWrestlingArchiveSlug(matchRef, ""),
  ].join("|");
}

function getWrestlingMatchDossierPhotoCount(match = null) {
  if (!match) {
    return 0;
  }

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

  return getWrestlingMatchSourcePhotoIds(match).length;
}

function getWrestlingMatchDossierActivePhotoRequestKey(route = (typeof getRouteFromUrl === "function" ? getRouteFromUrl() : null)) {
  const source = getWrestlingMatchDossierPrototypePhotoSource(null, route);
  return getWrestlingMatchDossierPrototypePhotoRequestKey(source.showId, source.matchRef);
}

function refreshWrestlingMatchDossierPhotoCountRoute(requestKey = "") {
  const route = typeof getRouteFromUrl === "function" ? getRouteFromUrl() : null;
  const activeRequestKey = getWrestlingMatchDossierActivePhotoRequestKey(route);
  if (requestKey && activeRequestKey && activeRequestKey !== requestKey) {
    return;
  }

  if (
    typeof isWrestlingMatchDetailPhotoRoute === "function" &&
    isWrestlingMatchDetailPhotoRoute(route) &&
    typeof showWrestlingMatchDetailPrototypePhoto === "function"
  ) {
    showWrestlingMatchDetailPrototypePhoto(route);
  } else if (
    typeof isWrestlingMatchDetailRoute === "function" &&
    isWrestlingMatchDetailRoute(route) &&
    typeof showWrestlingMatchDetailPrototype === "function"
  ) {
    showWrestlingMatchDetailPrototype(route);
  }
}

function clearWrestlingMatchDossierPhotoRetryTimer(requestKey) {
  const timerId = wrestlingMatchDetailPrototypePhotoRetryTimers.get(requestKey);
  if (timerId && typeof window !== "undefined" && typeof window.clearTimeout === "function") {
    window.clearTimeout(timerId);
  }
  wrestlingMatchDetailPrototypePhotoRetryTimers.delete(requestKey);
}

function handleWrestlingMatchDossierPhotoCountFailure(requestKey) {
  const attemptCount = Number.parseInt(wrestlingMatchDetailPrototypePhotoRetryAttempts.get(requestKey), 10) || 0;
  if (
    attemptCount >= WRESTLING_MATCH_DETAIL_PROTOTYPE_PHOTO_RETRY_LIMIT ||
    typeof window === "undefined" ||
    typeof window.setTimeout !== "function"
  ) {
    wrestlingMatchDetailPrototypePhotoCountStates.set(requestKey, "error");
    refreshWrestlingMatchDossierPhotoCountRoute(requestKey);
    return;
  }

  wrestlingMatchDetailPrototypePhotoRetryAttempts.set(requestKey, attemptCount + 1);
  wrestlingMatchDetailPrototypePhotoCountStates.set(requestKey, "loading");
  if (!wrestlingMatchDetailPrototypePhotoRetryTimers.has(requestKey)) {
    const timerId = window.setTimeout(() => {
      wrestlingMatchDetailPrototypePhotoRetryTimers.delete(requestKey);
      wrestlingMatchDetailPrototypePhotoCountStates.delete(requestKey);
      const route = typeof getRouteFromUrl === "function" ? getRouteFromUrl() : null;
      const activeRequestKey = getWrestlingMatchDossierActivePhotoRequestKey(route);
      if (requestKey && activeRequestKey && activeRequestKey !== requestKey) {
        return;
      }
      requestWrestlingMatchDossierPrototypePhotoCount(null, { force: true });
    }, WRESTLING_MATCH_DETAIL_PROTOTYPE_PHOTO_RETRY_DELAY_MS);
    wrestlingMatchDetailPrototypePhotoRetryTimers.set(requestKey, timerId);
  }
  refreshWrestlingMatchDossierPhotoCountRoute(requestKey);
}

function requestWrestlingMatchDossierPrototypePhotoCount(show = null, options = {}) {
  if (typeof requestWrestlingMatchPhotosForRoute !== "function") {
    return;
  }

  const route = typeof getRouteFromUrl === "function" ? getRouteFromUrl() : null;
  const source = getWrestlingMatchDossierPrototypePhotoSource(show, route);
  if (!source.show) {
    return;
  }

  const showId = source.showId;
  const matchRef = source.matchRef;
  if (!showId || !matchRef) {
    return;
  }

  const requestKey = getWrestlingMatchDossierPrototypePhotoRequestKey(showId, matchRef);
  if (source.match && getWrestlingMatchPhotoItems(source.match).length > 0) {
    wrestlingMatchDetailPrototypePhotoCountStates.set(requestKey, "loaded");
    wrestlingMatchDetailPrototypePhotoRetryAttempts.delete(requestKey);
    clearWrestlingMatchDossierPhotoRetryTimer(requestKey);
    return;
  }

  const requestState = wrestlingMatchDetailPrototypePhotoCountStates.get(requestKey);
  if (!options.force && (requestState === "loading" || requestState === "loaded" || requestState === "error")) {
    return;
  }

  wrestlingMatchDetailPrototypePhotoCountStates.set(requestKey, "loading");
  requestWrestlingMatchPhotosForRoute(showId, matchRef, source.show || show)
    .then((loaded) => {
      if (loaded === false) {
        handleWrestlingMatchDossierPhotoCountFailure(requestKey);
        return;
      }
      wrestlingMatchDetailPrototypePhotoCountStates.set(requestKey, "loaded");
      wrestlingMatchDetailPrototypePhotoRetryAttempts.delete(requestKey);
      clearWrestlingMatchDossierPhotoRetryTimer(requestKey);
    })
    .catch(() => {
      handleWrestlingMatchDossierPhotoCountFailure(requestKey);
    })
    .finally(() => {
      refreshWrestlingMatchDossierPhotoCountRoute(requestKey);
    });
}

function getWrestlingMatchDossierPhotoCountInfo(show = null, match = null) {
  const source = getWrestlingMatchDossierPrototypePhotoSource(show);
  const isShowDataLoading = wrestlingShowsDataState === "idle" || wrestlingShowsDataState === "loading" || Boolean(wrestlingShowsRequest);
  const requestKey = getWrestlingMatchDossierPrototypePhotoRequestKey(source.showId, source.matchRef);
  const requestState = wrestlingMatchDetailPrototypePhotoCountStates.get(requestKey);
  if (!source.show) {
    return isShowDataLoading || requestState === "loading"
      ? { label: "PHOTO COUNT LOADING", state: "loading" }
      : { label: "PHOTO COUNT UNAVAILABLE", state: "unavailable" };
  }
  if (!source.match) {
    return requestState === "loading"
      ? { label: "PHOTO COUNT LOADING", state: "loading" }
      : { label: "PHOTO COUNT UNAVAILABLE", state: "unavailable" };
  }

  const photoCount = getWrestlingMatchDossierPhotoCount(match || source.match);
  if (photoCount > 0) {
    return {
      label: formatWrestlingCount(photoCount, "Photos").toUpperCase(),
      state: "loaded",
      count: photoCount,
    };
  }

  if (requestState === "loading") {
    return { label: "PHOTO COUNT LOADING", state: "loading" };
  }
  if (requestState === "error" || wrestlingShowsDataState === "error") {
    return { label: "PHOTO COUNT UNAVAILABLE", state: "unavailable" };
  }

  return { label: "NO PHOTOS ARCHIVED", state: "empty", count: 0 };
}

function createWrestlingMatchDossierPhotoHighlights(show = null, match = null, pagination = null) {
  const countInfo = getWrestlingMatchDossierPhotoCountInfo(show, match);
  const section = document.createElement("section");
  section.className = "wrestling-match-dossier-photo-highlights";
  section.dataset.wrestlingPhotoCountState = countInfo.state;
  section.setAttribute("aria-labelledby", "wrestling-match-dossier-photo-highlights-title");

  const title = document.createElement("h3");
  title.className = "wrestling-match-dossier-photo-highlights__title";
  title.id = "wrestling-match-dossier-photo-highlights-title";
  title.textContent = "PHOTO HIGHLIGHTS";

  const count = document.createElement("p");
  count.className = "wrestling-match-dossier-photo-highlights__count";
  count.textContent = countInfo.label;

  section.append(title, count);
  if (pagination?.totalPages > 0) {
    section.append(createWrestlingMatchDossierPhotoPaginationControls(pagination));
  }
  return section;
}

function getWrestlingMatchDossierPreviewPhotos(match = null) {
  return getWrestlingMatchPhotoItems(match)
    .filter((photo) => photo.thumbnailSrc || photo.smallSrc || photo.lightboxSrc);
}

function getWrestlingMatchDossierPreviewPhotoSrc(photo = {}) {
  return photo.lightboxSrc || photo.smallSrc || photo.thumbnailSrc || "";
}

function getWrestlingMatchDetailPrototypeRouteUrl(route = getRouteFromUrl(), show = null, match = null) {
  const showRouteSource = show || getWrestlingMatchDetailRouteShowId(route);
  const matchRef = match ? getWrestlingMatchRouteRef(match) : getWrestlingMatchDetailRouteMatchRef(route);
  return `${routePaths.wrestlingShows}/${encodeURIComponent(getWrestlingShowRouteCode(showRouteSource))}/${encodeURIComponent(matchRef)}`;
}

function getWrestlingMatchDetailPrototypePhotoRouteUrl(photoId = "001", route = getRouteFromUrl(), show = null, match = null) {
  return `${getWrestlingMatchDetailPrototypeRouteUrl(route, show, match)}/photo/${encodeURIComponent(photoId)}`;
}

function getWrestlingMatchDossierPrototypePhotoRouteIndex(photos, photoId = "001") {
  const safePhotos = Array.isArray(photos) ? photos : [];
  if (safePhotos.length === 0) {
    return -1;
  }

  const numericPhoto = Number.parseInt(photoId, 10);
  if (Number.isFinite(numericPhoto) && numericPhoto > 0) {
    const numericIndex = numericPhoto - 1;
    return numericIndex >= 0 && numericIndex < safePhotos.length ? numericIndex : -1;
  }

  const targetPhotoId = normalizeWrestlingArchiveSlug(photoId, "");
  return safePhotos.findIndex((photo, index) => {
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
}

function setWrestlingMatchDossierPhotoPageFromIndex(show = null, match = null, photoIndex = 0) {
  const photos = getWrestlingMatchDossierPreviewPhotos(match);
  if (photos.length === 0) {
    return;
  }

  const safeIndex = Math.max(0, Math.min(Number.parseInt(photoIndex, 10) || 0, photos.length - 1));
  const pageIndex = Math.floor(safeIndex / WRESTLING_MATCH_DETAIL_PROTOTYPE_PHOTO_PAGE_SIZE);
  wrestlingMatchDetailPrototypePhotoPageStates.set(getWrestlingMatchDossierPhotoPageKey(show, match), pageIndex);
}

function getWrestlingMatchDossierPhotoPageKey(show = null, match = null, route = getRouteFromUrl()) {
  const source = getWrestlingMatchDossierPrototypePhotoSource(show, route);
  return getWrestlingMatchDossierPrototypePhotoRequestKey(
    source.showId || getWrestlingMatchDetailRouteShowId(route),
    source.matchRef || (match ? getWrestlingMatchRouteRef(match) : "") || getWrestlingMatchDetailRouteMatchRef(route)
  );
}

function getWrestlingMatchDossierPhotoPagination(show = null, match = null) {
  const photos = getWrestlingMatchDossierPreviewPhotos(match);
  if (photos.length === 0) {
    return {
      pageKey: getWrestlingMatchDossierPhotoPageKey(show, match),
      photos,
      pagePhotos: [],
      pageIndex: 0,
      pageNumber: 0,
      totalPages: 0,
      totalPhotos: 0,
    };
  }

  const totalPages = Math.ceil(photos.length / WRESTLING_MATCH_DETAIL_PROTOTYPE_PHOTO_PAGE_SIZE);
  const pageKey = getWrestlingMatchDossierPhotoPageKey(show, match);
  const storedPageIndex = Number.parseInt(wrestlingMatchDetailPrototypePhotoPageStates.get(pageKey), 10);
  const pageIndex = Math.max(0, Math.min(Number.isFinite(storedPageIndex) ? storedPageIndex : 0, totalPages - 1));
  if (pageIndex !== storedPageIndex) {
    wrestlingMatchDetailPrototypePhotoPageStates.set(pageKey, pageIndex);
  }

  const pageStart = pageIndex * WRESTLING_MATCH_DETAIL_PROTOTYPE_PHOTO_PAGE_SIZE;
  return {
    pageKey,
    photos,
    pagePhotos: photos.slice(pageStart, pageStart + WRESTLING_MATCH_DETAIL_PROTOTYPE_PHOTO_PAGE_SIZE),
    pageIndex,
    pageNumber: pageIndex + 1,
    totalPages,
    totalPhotos: photos.length,
  };
}

function setWrestlingMatchDossierPhotoPage(pagination, nextPageIndex) {
  if (!pagination || pagination.totalPages <= 0) {
    return false;
  }

  const clampedPageIndex = Math.max(0, Math.min(nextPageIndex, pagination.totalPages - 1));
  if (clampedPageIndex === pagination.pageIndex) {
    return false;
  }

  wrestlingMatchDetailPrototypePhotoPageStates.set(pagination.pageKey, clampedPageIndex);
  const route = typeof getRouteFromUrl === "function" ? getRouteFromUrl() : null;
  if (
    typeof isWrestlingMatchDetailRoute === "function" &&
    isWrestlingMatchDetailRoute(route) &&
    typeof showWrestlingMatchDetailPrototype === "function"
  ) {
    showWrestlingMatchDetailPrototype(route);
  }
  return true;
}

function createWrestlingMatchDossierPhotoPaginationButton(label, direction, pagination) {
  const button = document.createElement("button");
  button.className = "wrestling-match-dossier-photo-pagination__button";
  button.type = "button";
  button.textContent = label;
  button.setAttribute("aria-controls", "wrestling-match-dossier-photo-preview-grid");
  button.setAttribute(
    "aria-label",
    direction < 0 ? "Show previous photo preview page" : "Show next photo preview page"
  );

  const isDisabled = direction < 0
    ? pagination.pageIndex <= 0
    : pagination.pageIndex >= pagination.totalPages - 1;
  button.disabled = isDisabled;

  if (!isDisabled) {
    button.addEventListener("click", () => {
      setWrestlingMatchDossierPhotoPage(pagination, pagination.pageIndex + direction);
    });
  }

  return button;
}

function createWrestlingMatchDossierPhotoPaginationControls(pagination) {
  const controls = document.createElement("div");
  controls.className = "wrestling-match-dossier-photo-pagination";
  controls.setAttribute("aria-label", "Photo preview pagination");

  const indicator = document.createElement("p");
  indicator.className = "wrestling-match-dossier-photo-pagination__indicator";
  indicator.id = "wrestling-match-dossier-photo-page-indicator";
  indicator.textContent = `${pagination.pageNumber} / ${pagination.totalPages}`;
  indicator.setAttribute("aria-live", "polite");
  indicator.setAttribute("aria-label", `Page ${pagination.pageNumber} of ${pagination.totalPages}`);

  controls.append(
    createWrestlingMatchDossierPhotoPaginationButton("Prev", -1, pagination),
    indicator,
    createWrestlingMatchDossierPhotoPaginationButton("Next", 1, pagination)
  );
  return controls;
}

function addWrestlingMatchDossierPhotoSwipeHandlers(grid, pagination) {
  if (!grid || !pagination || pagination.totalPages <= 1) {
    return;
  }

  let swipeStartX = 0;
  let swipeStartY = 0;
  let swipePointerId = null;

  grid.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    swipePointerId = event.pointerId;
    swipeStartX = event.clientX;
    swipeStartY = event.clientY;
    delete grid.dataset.wrestlingPointerMoved;
  });

  grid.addEventListener("pointermove", (event) => {
    if (swipePointerId === null || event.pointerId !== swipePointerId) {
      return;
    }

    const deltaX = event.clientX - swipeStartX;
    const deltaY = event.clientY - swipeStartY;
    if (Math.abs(deltaY) > 12 && Math.abs(deltaY) > Math.abs(deltaX)) {
      grid.dataset.wrestlingPointerMoved = "true";
    }
  });

  const finishSwipe = (event) => {
    if (swipePointerId === null || event.pointerId !== swipePointerId) {
      return;
    }

    const deltaX = event.clientX - swipeStartX;
    const deltaY = event.clientY - swipeStartY;
    swipePointerId = null;

    if (
      Math.abs(deltaX) < WRESTLING_MATCH_DETAIL_PROTOTYPE_SWIPE_THRESHOLD ||
      Math.abs(deltaX) <= Math.abs(deltaY) * 1.35
    ) {
      if (grid.dataset.wrestlingPointerMoved === "true") {
        window.setTimeout(() => {
          if (grid.dataset.wrestlingPointerMoved === "true") {
            delete grid.dataset.wrestlingPointerMoved;
          }
        }, 180);
      }
      return;
    }

    grid.dataset.wrestlingSwipeHandled = "true";
    window.setTimeout(() => {
      if (grid.dataset.wrestlingSwipeHandled === "true") {
        delete grid.dataset.wrestlingSwipeHandled;
      }
    }, 180);
    setWrestlingMatchDossierPhotoPage(pagination, pagination.pageIndex + (deltaX < 0 ? 1 : -1));
  };

  grid.addEventListener("pointerup", finishSwipe);
  grid.addEventListener("pointercancel", () => {
    swipePointerId = null;
  });
}

function createWrestlingMatchDossierPhotoPreviewGrid(pagination = null) {
  if (!pagination || pagination.pagePhotos.length === 0) {
    return null;
  }

  const grid = document.createElement("div");
  grid.className = "wrestling-match-dossier-photo-preview-grid";
  grid.id = "wrestling-match-dossier-photo-preview-grid";
  grid.dataset.wrestlingPhotoPreviewCount = String(pagination.pagePhotos.length);
  grid.dataset.wrestlingPhotoPage = String(pagination.pageNumber);
  grid.dataset.wrestlingPhotoTotalPages = String(pagination.totalPages);
  grid.dataset.wrestlingPhotoTotalCount = String(pagination.totalPhotos);
  grid.setAttribute("role", "group");
  grid.setAttribute("aria-describedby", "wrestling-match-dossier-photo-page-indicator");
  grid.setAttribute("aria-label", `Match photo preview page ${pagination.pageNumber} of ${pagination.totalPages}`);

  pagination.pagePhotos.forEach((photo, index) => {
    const imageSrc = getWrestlingMatchDossierPreviewPhotoSrc(photo);
    if (!imageSrc) {
      return;
    }

    const sourceIndex = pagination.pageIndex * WRESTLING_MATCH_DETAIL_PROTOTYPE_PHOTO_PAGE_SIZE + index;
    const routePhotoId = String(sourceIndex + 1).padStart(3, "0");
    const tile = document.createElement("button");
    tile.className = "wrestling-match-dossier-photo-preview-tile";
    tile.type = "button";
    tile.dataset.wrestlingPhotoId = routePhotoId;
    tile.dataset.wrestlingSourcePhotoId = photo.photoId || "";
    tile.dataset.wrestlingPhotoIndex = String(sourceIndex + 1);
    tile.dataset.wrestlingLightboxRoute = getWrestlingMatchDetailPrototypePhotoRouteUrl(routePhotoId);
    tile.setAttribute("aria-label", `Open photo ${sourceIndex + 1} of ${pagination.totalPhotos}`);
    tile.addEventListener("click", () => {
      if (grid.dataset.wrestlingSwipeHandled === "true" || grid.dataset.wrestlingPointerMoved === "true") {
        return;
      }
      wrestlingMatchDetailPrototypePhotoPageStates.set(pagination.pageKey, pagination.pageIndex);
      if (typeof navigateToRoute === "function") {
        navigateToRoute(tile.dataset.wrestlingLightboxRoute);
      }
    });

    const image = document.createElement("img");
    image.className = "wrestling-match-dossier-photo-preview-image";
    image.src = imageSrc;
    image.alt = getWrestlingText(photo.label, `Match photo ${sourceIndex + 1}`);
    image.loading = "eager";
    image.decoding = "async";
    if ("fetchPriority" in image) {
      image.fetchPriority = pagination.pageIndex === 0 ? "high" : "auto";
    }

    tile.append(image);
    grid.append(tile);
  });

  addWrestlingMatchDossierPhotoSwipeHandlers(grid, pagination);
  return grid.childElementCount > 0 ? grid : null;
}

// Canonical production Wrestling Match Detail renderer.
// Extend this shared path rather than creating parallel Match Detail renderers.
function renderWrestlingMatchDetailPrototypeRoute(route = getRouteFromUrl(), options = {}) {
  if (
    !wrestlingMatchDetailPrototypeShell ||
    typeof isWrestlingMatchDetailRoute !== "function" ||
    !isWrestlingMatchDetailRoute(route)
  ) {
    return;
  }

  const show = getWrestlingMatchDossierPrototypeSourceShow(route);
  const match = getWrestlingMatchDossierPrototypeSourceMatch(route, show);
  requestWrestlingMatchDossierPrototypePhotoCount(show);
  const hero = createWrestlingMatchDossierHero(match);
  const metadata = createWrestlingMatchDossierMetadata(show, match);
  const photoPagination = getWrestlingMatchDossierPhotoPagination(show, match);
  const photoHighlights = createWrestlingMatchDossierPhotoHighlights(show, match, photoPagination);
  const photoPreviewGrid = createWrestlingMatchDossierPhotoPreviewGrid(photoPagination);
  wrestlingMatchDetailPrototypeShell.replaceChildren(...[hero, metadata, photoHighlights, photoPreviewGrid].filter(Boolean));

  if (
    !options.skipDataRequest &&
    typeof requestWrestlingShowsData === "function" &&
    wrestlingShowsDataState !== "live" &&
    !wrestlingShowsRequest &&
    !wrestlingShowsDataRequested
  ) {
    requestWrestlingShowsData();
  }
}

function createHallPrototypeEncounterSection(show = {}) {
  const section = document.createElement("section");
  section.className = "wrestling-show-prototype-encounters";
  section.setAttribute("aria-labelledby", "wrestling-show-prototype-encounters-title");

  const title = document.createElement("h3");
  title.className = "wrestling-show-prototype-encounters__title";
  title.id = "wrestling-show-prototype-encounters-title";
  title.textContent = "Matches / Encounters";

  const list = document.createElement("ol");
  list.className = "wrestling-show-prototype-encounter-list";
  list.setAttribute("aria-label", `${show.title || "Campaign"} encounters`);

  const matches = Array.isArray(show.matches) ? show.matches : [];
  if (matches.length > 0) {
    matches.forEach((match, matchIndex) => {
      list.append(createHallPrototypeEncounterCard(match, matchIndex, show));
    });
  } else {
    const emptyCard = document.createElement("li");
    emptyCard.className = "wrestling-show-prototype-encounter-card wrestling-show-prototype-encounter-card--empty";
    emptyCard.textContent = "No encounters logged for this campaign.";
    list.append(emptyCard);
  }

  section.append(title, list);
  return section;
}
// Canonical production Wrestling Show Detail renderer; extend this shared Hall path instead of creating parallel renderers.
function renderHallPrototypeShowDetailSurface(show) {
  const showTitle = getWrestlingText(show.title || show.eventName || show.showName, "Campaign Detail");
  const promotion = getWrestlingText(show.promotion, "Promotion Pending");
  const date = getWrestlingText(show.eventDate || formatWrestlingShowDate(show.rawDate || show.date || show.dateKey), "Date Pending");
  const venue = getWrestlingText(show.venue || getWrestlingVenueName(show), "Venue Pending");
  const location = getWrestlingText(show.location || getWrestlingShowLocation(show), "Location Pending");

  const card = document.createElement("article");
  card.className = "wrestling-show-prototype-card";
  card.setAttribute("aria-labelledby", "wrestling-show-detail-title");

  const poster = document.createElement("figure");
  poster.className = "wrestling-show-prototype-card__poster";
  poster.setAttribute("aria-label", `${showTitle} poster artwork`);

  const posterImage = document.createElement("img");
  posterImage.className = "wrestling-show-prototype-card__poster-image";
  posterImage.alt = "";
  posterImage.loading = "eager";
  posterImage.decoding = "async";
  posterImage.hidden = true;

  const posterFallback = document.createElement("span");
  posterFallback.className = "wrestling-show-prototype-card__poster-fallback";
  posterFallback.textContent = getWrestlingShowPosterLabel(show);

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

  poster.append(posterImage, posterFallback);

  const content = document.createElement("div");
  content.className = "wrestling-show-prototype-card__content";

  const title = document.createElement("h2");
  title.className = "wrestling-show-prototype-card__title";
  title.id = "wrestling-show-detail-title";
  title.textContent = showTitle;

  const fields = document.createElement("dl");
  fields.className = "wrestling-show-prototype-card__fields";
  fields.append(
    createHallPrototypeCampaignInfoField("Promotion", promotion),
    createHallPrototypeCampaignInfoField("Date", date),
    createHallPrototypeCampaignInfoField("Venue", venue),
    createHallPrototypeCampaignInfoField("Location", location)
  );

  content.append(title, fields);
  card.append(poster, content);

  const surface = document.createElement("div");
  surface.className = "wrestling-show-prototype-surface";
  surface.append(card, createHallPrototypeEncounterSection(show));

  wrestlingShowDetailShell.replaceChildren(surface);
  if (typeof setPortfolioEngineHudCurrentViewDetail === "function") {
    setPortfolioEngineHudCurrentViewDetail(showTitle);
  }
}

function getWrestlingShowDetailDisplayName(show) {
  return getWrestlingText(
    show?.showName ||
    show?.show_name ||
    show?.title ||
    show?.eventName ||
    show?.event_name,
    ""
  );
}

function getWrestlingShowDetailEngineTitle(showId = "warzone-26") {
  const show = findLiveWrestlingShowById(showId) || getWrestlingDefaultShowRelationship(showId);
  return getWrestlingShowDetailDisplayName(show);
}

function syncWrestlingShowDetailDocumentTitle(show) {
  const showTitle = getWrestlingShowDetailDisplayName(show);
  if (!showTitle) {
    return;
  }
  document.title = `Campaign - ${showTitle} - Voodoo Media V3.0.01`;
}

function syncWrestlingShowDetailEngineView(show) {
  const showTitle = getWrestlingShowDetailDisplayName(show);
  if (!showTitle || typeof setPortfolioEngineHudCurrentView !== "function") {
    return;
  }
  setPortfolioEngineHudCurrentView(`The Campaign - ${showTitle}`);
}

function renderWrestlingShowDetailRoute(showId = "warzone-26", options = {}) {
  if (!wrestlingShowDetailShell) {
    return;
  }

  setWrestlingVenuesPrototypeActive(false);
  wrestlingShowDetailShell.dataset.wrestlingShowDetailPresentation = "hall";
  delete wrestlingShowDetailShell.dataset.wrestlingShowDetailVariant;
  delete wrestlingShowDetailShell.dataset.wrestlingShowDetailRouteId;

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
  syncWrestlingShowDetailDocumentTitle(show);
  syncWrestlingShowDetailEngineView(show);
  renderHallPrototypeShowDetailSurface(show);
  return;

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

function normalizeWrestlingVenuesPrototypePath(value) {
  try {
    const path = new URL(value || "/wrestling/venues", window.location.href).pathname.replace(/\/+$/, "");
    return path || "/";
  } catch (error) {
    return String(value || "").replace(/\/+$/, "") || "/";
  }
}

function isWrestlingVenueDetailPrototypePath() {
  return false;
}

function isWrestlingVenuesPrototypeRoute(route = (typeof getRouteFromUrl === "function" ? getRouteFromUrl() : null)) {
  if (route?.isUnknown) {
    return false;
  }
  if (route?.wrestlingVenueDetailPrototype === "colisee" || route?.name === "wrestling-venue-detail-prototype") {
    return true;
  }

  if (route?.wrestlingVenuesPrototype === "fields-of-conflict" || route?.venuesPrototype === "fields-of-conflict") {
    return true;
  }

  if (typeof window !== "undefined" && typeof window.isWrestlingVenuesPrototypePath === "function") {
    return window.isWrestlingVenuesPrototypePath();
  }

  if (typeof window !== "undefined") {
    const prototypePath = normalizeWrestlingVenuesPrototypePath(
      typeof routePaths !== "undefined" && routePaths?.wrestlingVenuesPrototype ? routePaths.wrestlingVenuesPrototype : "/wrestling/venues"
    );
    return normalizeWrestlingVenuesPrototypePath(window.location.pathname) === prototypePath;
  }

  return false;
}

function getWrestlingVenuesPrototypeShell() {
  if (typeof wrestlingVenuesPrototypeShell !== "undefined" && wrestlingVenuesPrototypeShell) {
    return wrestlingVenuesPrototypeShell;
  }
  return document.querySelector("[data-wrestling-venues-prototype-shell]");
}

const FIELDS_OF_CONFLICT_DEFAULT_VENUE_ID = "yarmouth-amvets";
const FIELDS_OF_CONFLICT_DETAIL_PROTOTYPE_VENUE_ID = "colisee";
const FIELDS_OF_CONFLICT_DETAIL_MAP_ZOOM = 15;
const FIELDS_OF_CONFLICT_COORDINATE_DEGREE = String.fromCharCode(176);
let fieldsOfConflictVenueLocationMap = null;
let fieldsOfConflictVenueLocationMarker = null;
let fieldsOfConflictVenueLocationGeohashBoundary = null;
let fieldsOfConflictVenueLocationRecenterControl = null;
let fieldsOfConflictVenueLocationHomeView = null;
let fieldsOfConflictVenueLocationMapElement = null;
// TODO: Replace temporary Fields of Conflict venue coordinates with backend-provided venue coordinates when available.
const FIELDS_OF_CONFLICT_VENUE_CONFIG = [
  {
    id: "brick-south",
    name: "Brick South",
    location: "Portland, Maine",
    region: "New England",
    venue_type: "Event Hall",
    status: "Active",
    latitude: `43.6520${FIELDS_OF_CONFLICT_COORDINATE_DEGREE} N`,
    longitude: `70.2568${FIELDS_OF_CONFLICT_COORDINATE_DEGREE} W`
  },
  {
    id: "colisee",
    name: "Colis" + String.fromCharCode(233) + "e",
    location: "Lewiston, Maine",
    region: "New England",
    venue_type: "Sports Arena",
    status: "Active",
    notes: "Home of the Maine Maniacs",
    latitude: `44.1004${FIELDS_OF_CONFLICT_COORDINATE_DEGREE} N`,
    longitude: `70.2148${FIELDS_OF_CONFLICT_COORDINATE_DEGREE} W`
  },
  {
    id: "fairfield-community-center",
    name: "Fairfield Community Center",
    location: "Fairfield, Maine",
    region: "New England",
    venue_type: "Sports Arena",
    status: "Active",
    latitude: `44.5884${FIELDS_OF_CONFLICT_COORDINATE_DEGREE} N`,
    longitude: `69.5987${FIELDS_OF_CONFLICT_COORDINATE_DEGREE} W`
  },
  {
    id: "live-at-madrids",
    name: "Live @ Madrids",
    location: "Portland, Maine",
    region: "New England",
    venue_type: "Event Hall",
    status: "Active",
    latitude: `43.6615${FIELDS_OF_CONFLICT_COORDINATE_DEGREE} N`,
    longitude: `70.2553${FIELDS_OF_CONFLICT_COORDINATE_DEGREE} W`
  },
  {
    id: "morgan-hill-event-center",
    name: "Morgan Hill Event Center",
    location: "Hermon, Maine",
    region: "New England",
    venue_type: "Event Hall",
    status: "Active",
    latitude: `44.8037${FIELDS_OF_CONFLICT_COORDINATE_DEGREE} N`,
    longitude: `68.9134${FIELDS_OF_CONFLICT_COORDINATE_DEGREE} W`
  },
  {
    id: "portland-expo",
    name: "Portland Expo",
    location: "Portland, Maine",
    region: "New England",
    venue_type: "Sports Arena",
    status: "Active",
    notes: "Home of Maine Celtics",
    latitude: `43.6557${FIELDS_OF_CONFLICT_COORDINATE_DEGREE} N`,
    longitude: `70.2790${FIELDS_OF_CONFLICT_COORDINATE_DEGREE} W`
  },
  {
    id: "rumors",
    name: "Rumors",
    location: "Biddeford, Maine",
    region: "New England",
    venue_type: "Event Hall",
    status: "Active",
    latitude: `43.4926${FIELDS_OF_CONFLICT_COORDINATE_DEGREE} N`,
    longitude: `70.4534${FIELDS_OF_CONFLICT_COORDINATE_DEGREE} W`
  },
  {
    id: "westbrook-armory",
    name: "Westbrook Armory",
    location: "Westbrook, Maine",
    region: "New England",
    venue_type: "Sports Arena",
    status: "Active",
    latitude: `43.6770${FIELDS_OF_CONFLICT_COORDINATE_DEGREE} N`,
    longitude: `70.3712${FIELDS_OF_CONFLICT_COORDINATE_DEGREE} W`
  },
  {
    id: "yarmouth-amvets",
    name: "Yarmouth Amvets",
    location: "Yarmouth, Maine",
    region: "New England",
    venue_type: "Legion Hall",
    status: "Active",
    latitude: `43.8000${FIELDS_OF_CONFLICT_COORDINATE_DEGREE} N`,
    longitude: `70.1860${FIELDS_OF_CONFLICT_COORDINATE_DEGREE} W`
  }
];

function parseFieldsOfConflictMapCoordinate(value) {
  const coordinateText = String(value || "").trim();
  const coordinateMatch = coordinateText.match(/-?\d+(?:\.\d+)?/);
  if (!coordinateMatch) {
    return null;
  }

  const numericValue = Number(coordinateMatch[0]);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  if (/\b[SW]\b/i.test(coordinateText) && numericValue > 0) {
    return -numericValue;
  }
  if (/\b[NE]\b/i.test(coordinateText) && numericValue < 0) {
    return Math.abs(numericValue);
  }
  return numericValue;
}

function getFieldsOfConflictVenueLocationMapCoordinates(venue, config) {
  const latitude = parseFieldsOfConflictMapCoordinate(getWrestlingVenueDetailLatitude(venue) || config?.latitude);
  const longitude = parseFieldsOfConflictMapCoordinate(getWrestlingVenueDetailLongitude(venue) || config?.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;
}

function getFieldsOfConflictVenueLocationGeohash(venue) {
  const geo = getWrestlingVenueGeo(venue);
  return getWrestlingText(geo?.geohash || venue?.geohash || venue?.backend_record?.geohash);
}

function decodeFieldsOfConflictGeohashBounds(geohash) {
  const hash = String(geohash || "").trim().toLowerCase();
  const alphabet = "0123456789bcdefghjkmnpqrstuvwxyz";
  if (!hash || /[^0123456789bcdefghjkmnpqrstuvwxyz]/.test(hash)) {
    return null;
  }

  const latitudeRange = [-90, 90];
  const longitudeRange = [-180, 180];
  let isEvenBit = true;
  for (const character of hash) {
    let characterBits = alphabet.indexOf(character);
    if (characterBits < 0) {
      return null;
    }

    for (let mask = 16; mask > 0; mask >>= 1) {
      const range = isEvenBit ? longitudeRange : latitudeRange;
      const midpoint = (range[0] + range[1]) / 2;
      if (characterBits & mask) {
        range[0] = midpoint;
      } else {
        range[1] = midpoint;
      }
      isEvenBit = !isEvenBit;
    }
  }

  return [
    [latitudeRange[0], longitudeRange[0]],
    [latitudeRange[1], longitudeRange[1]],
  ];
}

function getFieldsOfConflictVenueLocationGeohashBounds(venue) {
  return decodeFieldsOfConflictGeohashBounds(getFieldsOfConflictVenueLocationGeohash(venue));
}

function getFieldsOfConflictVenueLocationMapContainer() {
  return document.querySelector("[data-fields-of-conflict-location-map]");
}

function scheduleFieldsOfConflictVenueLocationMapResize() {
  if (!fieldsOfConflictVenueLocationMap) {
    return;
  }

  window.requestAnimationFrame(() => {
    fieldsOfConflictVenueLocationMap?.invalidateSize?.();
    window.setTimeout(() => fieldsOfConflictVenueLocationMap?.invalidateSize?.(), 160);
  });
}

function destroyFieldsOfConflictVenueLocationMap() {
  if (fieldsOfConflictVenueLocationMap) {
    fieldsOfConflictVenueLocationMap.remove();
  }
  fieldsOfConflictVenueLocationMap = null;
  fieldsOfConflictVenueLocationMarker = null;
  fieldsOfConflictVenueLocationGeohashBoundary = null;
  fieldsOfConflictVenueLocationRecenterControl = null;
  fieldsOfConflictVenueLocationHomeView = null;
  fieldsOfConflictVenueLocationMapElement = null;
}

function createFieldsOfConflictVenueLocationMarkerIcon(Leaflet) {
  return Leaflet.divIcon({
    className: "fields-of-conflict-location__marker",
    html: '<span class="fields-of-conflict-location__marker-core" aria-hidden="true"></span>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function syncFieldsOfConflictVenueLocationMapPanes(map) {
  const boundaryPane = map.getPane("fields-of-conflict-geohash-boundary") || map.createPane("fields-of-conflict-geohash-boundary");
  boundaryPane.style.zIndex = "260";
  boundaryPane.style.pointerEvents = "none";

  const labelsPane = map.getPane("fields-of-conflict-labels") || map.createPane("fields-of-conflict-labels");
  labelsPane.style.zIndex = "320";
  labelsPane.style.pointerEvents = "none";
}

function syncFieldsOfConflictVenueLocationGeohashBoundary(Leaflet, venue) {
  if (!fieldsOfConflictVenueLocationMap) {
    return null;
  }

  const bounds = getFieldsOfConflictVenueLocationGeohashBounds(venue);
  if (!bounds) {
    if (fieldsOfConflictVenueLocationGeohashBoundary) {
      fieldsOfConflictVenueLocationGeohashBoundary.remove();
      fieldsOfConflictVenueLocationGeohashBoundary = null;
    }
    return null;
  }

  const rectangleOptions = {
    pane: "fields-of-conflict-geohash-boundary",
    color: "#ff4a2f",
    weight: 1.5,
    opacity: 0.88,
    fillColor: "#ff2a1a",
    fillOpacity: 0.08,
    interactive: false,
  };
  if (!fieldsOfConflictVenueLocationGeohashBoundary) {
    fieldsOfConflictVenueLocationGeohashBoundary = Leaflet.rectangle(bounds, rectangleOptions).addTo(fieldsOfConflictVenueLocationMap);
  } else {
    fieldsOfConflictVenueLocationGeohashBoundary.setBounds(bounds);
    fieldsOfConflictVenueLocationGeohashBoundary.setStyle(rectangleOptions);
  }
  return bounds;
}

function syncFieldsOfConflictVenueLocationHomeView(coordinates) {
  fieldsOfConflictVenueLocationHomeView = {
    center: coordinates,
    zoom: FIELDS_OF_CONFLICT_DETAIL_MAP_ZOOM,
  };
}

function isFieldsOfConflictVenueLocationAtHomeView() {
  if (!fieldsOfConflictVenueLocationMap || !fieldsOfConflictVenueLocationHomeView) {
    return true;
  }

  const center = fieldsOfConflictVenueLocationMap.getCenter();
  const [latitude, longitude] = fieldsOfConflictVenueLocationHomeView.center;
  return Math.abs(center.lat - latitude) < 0.000001 &&
    Math.abs(center.lng - longitude) < 0.000001 &&
    fieldsOfConflictVenueLocationMap.getZoom() === fieldsOfConflictVenueLocationHomeView.zoom;
}

function recenterFieldsOfConflictVenueLocationMap() {
  if (!fieldsOfConflictVenueLocationMap || !fieldsOfConflictVenueLocationHomeView || isFieldsOfConflictVenueLocationAtHomeView()) {
    return;
  }

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const { center, zoom } = fieldsOfConflictVenueLocationHomeView;
  if (prefersReducedMotion || typeof fieldsOfConflictVenueLocationMap.flyTo !== "function") {
    fieldsOfConflictVenueLocationMap.setView(center, zoom);
    return;
  }
  fieldsOfConflictVenueLocationMap.flyTo(center, zoom, {
    animate: true,
    duration: 0.45,
    easeLinearity: 0.25,
  });
}

function createFieldsOfConflictVenueLocationRecenterControl(Leaflet) {
  const control = Leaflet.control({ position: "topleft" });
  control.onAdd = () => {
    const wrapper = Leaflet.DomUtil.create("div", "leaflet-bar fields-of-conflict-location__recenter-control");
    const button = Leaflet.DomUtil.create("button", "fields-of-conflict-location__recenter-button", wrapper);
    button.type = "button";
    button.setAttribute("aria-label", "Recenter venue map");
    button.innerHTML = '<span class="fields-of-conflict-location__recenter-icon" aria-hidden="true"></span>';
    Leaflet.DomEvent.disableClickPropagation(wrapper);
    Leaflet.DomEvent.disableScrollPropagation(wrapper);
    Leaflet.DomEvent.on(button, "click", (event) => {
      Leaflet.DomEvent.preventDefault(event);
      recenterFieldsOfConflictVenueLocationMap();
    });
    return wrapper;
  };
  return control;
}

function syncFieldsOfConflictVenueLocationMap(venue, config) {
  const mapElement = getFieldsOfConflictVenueLocationMapContainer();
  const coordinates = getFieldsOfConflictVenueLocationMapCoordinates(venue, config);
  const Leaflet = typeof window !== "undefined" ? window.L : null;
  if (!mapElement || !Leaflet) {
    return false;
  }
  if (!coordinates) {
    destroyFieldsOfConflictVenueLocationMap();
    return false;
  }

  syncFieldsOfConflictVenueLocationHomeView(coordinates);

  if (fieldsOfConflictVenueLocationMap && fieldsOfConflictVenueLocationMapElement !== mapElement) {
    destroyFieldsOfConflictVenueLocationMap();
  }

  if (!fieldsOfConflictVenueLocationMap) {
    fieldsOfConflictVenueLocationMap = Leaflet.map(mapElement);
    fieldsOfConflictVenueLocationMap.attributionControl?.setPrefix?.(false);
    syncFieldsOfConflictVenueLocationMapPanes(fieldsOfConflictVenueLocationMap);
    fieldsOfConflictVenueLocationRecenterControl = createFieldsOfConflictVenueLocationRecenterControl(Leaflet).addTo(fieldsOfConflictVenueLocationMap);
    Leaflet.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
      attribution: 'Powered by Esri &middot; &copy; Esri &middot; Maxar &middot; Earthstar Geographics <span class="fields-of-conflict-location__attribution-break">&middot; HERE &middot; Garmin &middot; OpenStreetMap contributors &middot; GIS User Community</span>',
    }).addTo(fieldsOfConflictVenueLocationMap);
    Leaflet.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
      pane: "fields-of-conflict-labels",
      attribution: 'Powered by Esri &middot; &copy; Esri &middot; Maxar &middot; Earthstar Geographics <span class="fields-of-conflict-location__attribution-break">&middot; HERE &middot; Garmin &middot; OpenStreetMap contributors &middot; GIS User Community</span>',
    }).addTo(fieldsOfConflictVenueLocationMap);
    Leaflet.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
      pane: "fields-of-conflict-labels",
      attribution: 'Powered by Esri &middot; &copy; Esri &middot; Maxar &middot; Earthstar Geographics <span class="fields-of-conflict-location__attribution-break">&middot; HERE &middot; Garmin &middot; OpenStreetMap contributors &middot; GIS User Community</span>',
    }).addTo(fieldsOfConflictVenueLocationMap);
    syncFieldsOfConflictVenueLocationGeohashBoundary(Leaflet, venue);
    fieldsOfConflictVenueLocationMarker = Leaflet.marker(coordinates, {
      icon: createFieldsOfConflictVenueLocationMarkerIcon(Leaflet),
      interactive: false,
      keyboard: false,
    }).addTo(fieldsOfConflictVenueLocationMap);
    fieldsOfConflictVenueLocationMapElement = mapElement;
  } else {
    syncFieldsOfConflictVenueLocationGeohashBoundary(Leaflet, venue);
    fieldsOfConflictVenueLocationMarker?.setLatLng(coordinates);
  }

  fieldsOfConflictVenueLocationMap.setView(coordinates, FIELDS_OF_CONFLICT_DETAIL_MAP_ZOOM);
  scheduleFieldsOfConflictVenueLocationMapResize();
  return true;
}

function getFieldsOfConflictRouteVenueId(route = (typeof getRouteFromUrl === "function" ? getRouteFromUrl() : null)) {
  return route?.venueId || route?.prototypeVenueSlug || route?.prototypeVenueId || FIELDS_OF_CONFLICT_DETAIL_PROTOTYPE_VENUE_ID;
}

function isWrestlingVenueDetailPrototypeRoute(route = (typeof getRouteFromUrl === "function" ? getRouteFromUrl() : null)) {
  return route?.name === "wrestling-venue-detail" || route?.name === "wrestling-venue-detail-prototype";
}

function findFieldsOfConflictVenueConfig(venueId = FIELDS_OF_CONFLICT_DEFAULT_VENUE_ID) {
  const normalizedVenueId = normalizeWrestlingVenueId(venueId);
  const publicVenueId = normalizeWrestlingVenuePublicSlug(venueId);
  const unprefixedVenueId = normalizedVenueId.replace(/^wv-/, "");
  const underscoredVenueId = normalizedVenueId.replace(/-/g, "_").replace(/^wv_/, "");
  const lookupIds = new Set([normalizedVenueId, publicVenueId, unprefixedVenueId, underscoredVenueId].filter(Boolean));
  return FIELDS_OF_CONFLICT_VENUE_CONFIG.find((venue) => {
    const configId = normalizeWrestlingVenueId(venue.id);
    const configPublicId = normalizeWrestlingVenuePublicSlug(venue.id);
    return lookupIds.has(configId) || lookupIds.has(configPublicId);
  }) || null;
}

function getFieldsOfConflictVenueConfig(venueId = FIELDS_OF_CONFLICT_DEFAULT_VENUE_ID) {
  return findFieldsOfConflictVenueConfig(venueId) ||
    FIELDS_OF_CONFLICT_VENUE_CONFIG.find((venue) => venue.id === FIELDS_OF_CONFLICT_DEFAULT_VENUE_ID) ||
    FIELDS_OF_CONFLICT_VENUE_CONFIG[0];
}

function getFieldsOfConflictVenueSelect() {
  return document.querySelector("[data-fields-of-conflict-venue-select]");
}

function getFieldsOfConflictDossierElement() {
  return document.querySelector("[data-fields-of-conflict-dossier]");
}

function getFieldsOfConflictDetailHydrationRouteKey(route = (typeof getRouteFromUrl === "function" ? getRouteFromUrl() : null)) {
  return normalizeWrestlingVenueId(getFieldsOfConflictRouteVenueId(route));
}

function isFieldsOfConflictDetailHydrationRouteActive(routeKey) {
  const route = typeof getRouteFromUrl === "function" ? getRouteFromUrl() : null;
  return isWrestlingVenueDetailPrototypeRoute(route) && getFieldsOfConflictDetailHydrationRouteKey(route) === routeKey;
}

function loadFieldsOfConflictDetailVenuesData(signal) {
  if (wrestlingVenuesDataState === "live") {
    return Promise.resolve(true);
  }
  if (typeof fetch !== "function") {
    setWrestlingVenuesCollection(wrestlingVenuesCollection, "error");
    return Promise.resolve(false);
  }

  setWrestlingVenuesCollection(wrestlingVenuesCollection, "loading");
  return fetchWrestlingVenuesPayload(1, signal)
    .then((firstPayload) => {
      const totalPages = getWrestlingVenuesPayloadTotalPages(firstPayload);
      const remainingPages = Array.from({ length: Math.max(totalPages - 1, 0) }, (_, index) => index + 2);
      if (remainingPages.length === 0) {
        return [firstPayload];
      }
      return Promise.all(remainingPages.map((page) => fetchWrestlingVenuesPayload(page, signal)))
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
      return liveRows.length > 0;
    })
    .catch(() => {
      setWrestlingVenuesCollection(wrestlingVenuesCollection, "error");
      return false;
    });
}

function loadFieldsOfConflictDetailShowsData(signal) {
  if (wrestlingShowsDataState === "live") {
    return Promise.resolve(true);
  }
  if (typeof fetch !== "function") {
    setWrestlingShowsCollection(wrestlingShowsCollection, "error");
    return Promise.resolve(false);
  }

  wrestlingShowsDataRequested = true;
  setWrestlingShowsCollection(wrestlingShowsCollection, "loading");
  return fetchWrestlingShowsPage(1, signal)
    .then((firstPayload) => {
      const totalPages = getWrestlingPayloadPageCount(firstPayload);
      if (totalPages <= 1) {
        return firstPayload;
      }
      const requests = [];
      for (let page = 2; page <= totalPages; page += 1) {
        requests.push(fetchWrestlingShowsPage(page, signal));
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
      return liveRows.length > 0;
    })
    .catch(() => {
      setWrestlingShowsCollection(wrestlingShowsCollection, "error");
      return false;
    });
}

function requestFieldsOfConflictDetailHydration(route = (typeof getRouteFromUrl === "function" ? getRouteFromUrl() : null)) {
  if (!isWrestlingVenueDetailPrototypeRoute(route)) {
    return Promise.resolve(false);
  }

  const routeKey = getFieldsOfConflictDetailHydrationRouteKey(route);
  if (fieldsOfConflictDetailHydratedRouteKeys.has(routeKey)) {
    return Promise.resolve(true);
  }
  if (fieldsOfConflictDetailHydrationRequest && fieldsOfConflictDetailHydrationRouteKey === routeKey) {
    return fieldsOfConflictDetailHydrationRequest;
  }

  const token = fieldsOfConflictDetailHydrationToken + 1;
  fieldsOfConflictDetailHydrationToken = token;
  fieldsOfConflictDetailHydrationRouteKey = routeKey;
  const controller = typeof AbortController === "function" ? new AbortController() : null;

  fieldsOfConflictDetailHydrationRequest = Promise.allSettled([
    loadFieldsOfConflictDetailVenuesData(controller?.signal),
    loadFieldsOfConflictDetailShowsData(controller?.signal),
  ]).then(() => {
    fieldsOfConflictDetailHydratedRouteKeys.add(routeKey);
    if (fieldsOfConflictDetailHydrationToken === token && isFieldsOfConflictDetailHydrationRouteActive(routeKey)) {
      renderFieldsOfConflictVenueDossier(routeKey);
      const prototypeShell = getWrestlingVenuesPrototypeShell();
      const dossier = getFieldsOfConflictDossierElement();
      if (prototypeShell) {
        prototypeShell.dataset.fieldsOfConflictDossierState = "open";
      }
      if (dossier) {
        dossier.hidden = false;
        dossier.removeAttribute("aria-hidden");
        dossier.removeAttribute("inert");
      }
    }
    return true;
  }).finally(() => {
    if (fieldsOfConflictDetailHydrationToken === token) {
      fieldsOfConflictDetailHydrationRequest = null;
      fieldsOfConflictDetailHydrationRouteKey = "";
    }
  });

  return fieldsOfConflictDetailHydrationRequest;
}

function getFieldsOfConflictActiveVenueId() {
  const select = getFieldsOfConflictVenueSelect();
  if (select?.value) {
    return select.value;
  }

  const activeMarker = document.querySelector(".fields-of-conflict-venue-marker.is-coordinate-locked[data-venue-id]");
  return activeMarker?.dataset?.venueId || FIELDS_OF_CONFLICT_DEFAULT_VENUE_ID;
}

function getFieldsOfConflictVenueLookupCandidates(venueId, config = findFieldsOfConflictVenueConfig(venueId)) {
  const rawId = getWrestlingText(venueId || config?.id);
  const publicId = normalizeWrestlingVenuePublicSlug(rawId);
  const normalizedId = normalizeWrestlingVenueId(rawId);
  const unprefixedId = normalizedId.replace(/^wv-/, "");
  const canonicalUnderscoreId = unprefixedId ? `wv_${unprefixedId.replace(/-/g, "_")}` : "";
  const canonicalHyphenId = unprefixedId ? `wv-${unprefixedId}` : "";
  return [
    config?.venue_id,
    config?.venueId,
    canonicalUnderscoreId,
    canonicalHyphenId,
    rawId,
    publicId,
    normalizedId,
    unprefixedId,
    config?.id,
    config?.name,
  ].filter(Boolean);
}

function getFieldsOfConflictDossierVenueSource(venueId = getFieldsOfConflictActiveVenueId()) {
  let config = findFieldsOfConflictVenueConfig(venueId);
  const resolvedVenue = getFieldsOfConflictVenueLookupCandidates(venueId, config)
    .map((candidate) => findWrestlingVenueById(candidate, { allowFallback: false }))
    .find(Boolean) || null;
  if (!config && resolvedVenue) {
    config = findFieldsOfConflictVenueConfig(getWrestlingVenueRowId(resolvedVenue)) ||
      findFieldsOfConflictVenueConfig(getWrestlingVenuePublicSlug(resolvedVenue));
  }
  return {
    config,
    venue: resolvedVenue || config,
    fallbackConfig: resolvedVenue ? null : config,
  };
}

function getFieldsOfConflictLocationPart(location, partIndex) {
  return String(location || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)[partIndex] || "";
}

function getFieldsOfConflictDossierDisplayValue(value) {
  return getWrestlingText(value, "N/A");
}

function getFieldsOfConflictDossierVenueNotes(venue) {
  return getWrestlingText(
    venue?.notes ||
    venue?.venue_details?.notes ||
    venue?.venueDetails?.notes ||
    venue?.backend_record?.notes ||
    venue?.backend_record?.venue_details?.notes
  );
}

function getFieldsOfConflictDossierChronologicalEvents(relatedEvents = []) {
  return [...relatedEvents].sort((left, right) => getWrestlingVenueEventTimestamp(left) - getWrestlingVenueEventTimestamp(right));
}

function getFieldsOfConflictDossierEventDisplay(eventRow) {
  if (!eventRow) {
    return "";
  }
  const eventName = getWrestlingVenueEventName(eventRow);
  const eventDate = getWrestlingVenueEventDate(eventRow);
  if (!eventName || eventName === "Event Pending") {
    return eventDate === "Date Pending" ? "" : eventDate;
  }
  return eventDate && eventDate !== "Date Pending" ? `${eventName} (${eventDate})` : eventName;
}

function getFieldsOfConflictDossierFactRows(venue, config) {
  if (!venue) {
    return [];
  }

  const city = getWrestlingVenueCity(venue) || getFieldsOfConflictLocationPart(config?.location, 0);
  const state = getWrestlingVenueDisplayState(venue) || getWrestlingVenueState(venue) || getFieldsOfConflictLocationPart(config?.location, 1);
  const latitude = getWrestlingVenueDetailLatitude(venue) || config?.latitude;
  const longitude = getWrestlingVenueDetailLongitude(venue) || config?.longitude;
  const coordinates = [latitude, longitude].filter(Boolean).join(" / ");
  const relatedEvents = getWrestlingVenueRelatedShowRows(venue);
  const venueStats = getWrestlingVenueDetailStats(venue, relatedEvents);
  const chronologicalEvents = getFieldsOfConflictDossierChronologicalEvents(relatedEvents);
  const firstEvent = chronologicalEvents.find((eventRow) => getWrestlingVenueEventTimestamp(eventRow) > 0) || chronologicalEvents[0] || null;
  const latestEvent = [...chronologicalEvents].reverse().find((eventRow) => getWrestlingVenueEventTimestamp(eventRow) > 0) || chronologicalEvents[chronologicalEvents.length - 1] || null;
  const geo = getWrestlingVenueGeo(venue);

  return [
    { label: "Location", value: [city, state].filter(Boolean).join(", ") || venue.location || config?.location },
    { label: "Region", value: venue.region || venue.venue_details?.region || venue.venueDetails?.region || venue.backend_record?.region },
    { label: "Venue Type", value: getWrestlingVenueType(venue) },
    { label: "Status", value: getWrestlingVenueStatus(venue) },
    { label: "First Event", value: getFieldsOfConflictDossierEventDisplay(firstEvent) || venueStats.firstEvent },
    { label: "Last Event", value: getFieldsOfConflictDossierEventDisplay(latestEvent) || venueStats.latestEvent },
    { label: "Event Count", value: venueStats.events },
    { label: "Geohash", value: geo.geohash },
    { label: "GPS Coordinates", value: coordinates, modifier: "full" },
    { label: "Notes", value: getFieldsOfConflictDossierVenueNotes(venue), modifier: "full notes" },
  ].map((row) => ({ ...row, value: getFieldsOfConflictDossierDisplayValue(row.value) }));
}

function createFieldsOfConflictDossierFact(label, value, modifier = "") {
  const fact = document.createElement("div");
  fact.className = ["fields-of-conflict-dossier__fact", ...String(modifier || "").split(/\s+/).filter(Boolean).map((name) => `fields-of-conflict-dossier__fact--${name}`)].join(" ");

  const factLabel = document.createElement("dt");
  factLabel.className = "fields-of-conflict-dossier__fact-label";
  factLabel.textContent = label;

  const factValue = document.createElement("dd");
  factValue.className = "fields-of-conflict-dossier__fact-value";
  factValue.textContent = value;

  fact.append(factLabel, factValue);
  return fact;
}

function createFieldsOfConflictVenueLocationSection() {
  const section = document.createElement("section");
  section.className = "fields-of-conflict-location";
  section.dataset.fieldsOfConflictLocation = "";
  section.setAttribute("aria-labelledby", "fields-of-conflict-location-title");

  const header = document.createElement("div");
  header.className = "fields-of-conflict-location__header";

  const title = document.createElement("h3");
  title.className = "fields-of-conflict-location__title";
  title.id = "fields-of-conflict-location-title";
  title.textContent = "VENUE LOCATION";
  header.append(title);

  const frame = document.createElement("div");
  frame.className = "fields-of-conflict-location__frame";

  const mapElement = document.createElement("div");
  mapElement.className = "fields-of-conflict-location__map";
  mapElement.dataset.fieldsOfConflictLocationMap = "";
  mapElement.setAttribute("aria-label", "Venue location map");
  frame.append(mapElement);

  section.append(header, frame);
  return section;
}

const FIELDS_OF_CONFLICT_DOSSIER_FRAMEWORK_SECTIONS = Object.freeze([
  Object.freeze({
    id: "about",
    title: "ABOUT THE VENUE",
    text: "This section will be about the venue itself overall, some notes on the actual venue, and more. It has to be written still and it will be coming in soon.",
  }),
  Object.freeze({
    id: "events",
    title: "EVENTS HELD / TIMELINE",
    text: "",
  }),
  Object.freeze({
    id: "championship-history",
    title: "CHAMPIONSHIP HISTORY",
    text: "Coming Soon - Championship History",
  }),
  Object.freeze({
    id: "notable-moments",
    title: "NOTABLE MOMENTS",
    text: "Coming Soon - Notable Moments",
  }),
  Object.freeze({
    id: "exterior-gallery",
    title: "EXTERIOR GALLERY",
    text: "Coming Soon - Exterior Gallery",
  }),
  Object.freeze({
    id: "highlights",
    title: "HIGHLIGHTS",
    text: "Coming Soon - Archive Highlights",
  }),
  Object.freeze({
    id: "contributors",
    title: "CONTRIBUTORS",
    text: "Community contributions to a venue will be implemented later on once the site is all set to go, but it is in the works.",
  }),
]);

function getFieldsOfConflictDossierEventHistoryRows(venue) {
  return venue ? getWrestlingVenueRelatedShowRows(venue) : [];
}

function getFieldsOfConflictDossierEventHistoryPhotoText(eventRow) {
  const eventPhotoCount = getWrestlingVenueEventPhotoCount(eventRow);
  return eventPhotoCount !== null ? formatWrestlingCount(eventPhotoCount, "Photos") : "N/A";
}

function getFieldsOfConflictVenueDetailPrototypeUrl(venue = null) {
  const route = typeof getRouteFromUrl === "function" ? getRouteFromUrl() : null;
  const venueSource = venue || getFieldsOfConflictRouteVenueId(route);
  if (typeof getWrestlingVenueRouteUrl === "function") {
    return getWrestlingVenueRouteUrl(venueSource);
  }
  const venueSlug = normalizeWrestlingVenuePublicSlug(venueSource);
  return venueSlug ? `${routePaths.wrestlingVenues}/${encodeURIComponent(venueSlug)}` : routePaths.wrestlingVenues;
}

function getFieldsOfConflictDossierEventHistoryPosterUrl(eventRow) {
  return getWrestlingText(
    eventRow?.poster ||
    eventRow?.poster_url ||
    eventRow?.posterUrl ||
    eventRow?.image_url ||
    eventRow?.imageUrl ||
    eventRow?.coverImageUrl
  );
}

function createFieldsOfConflictDossierEventHistoryPoster(eventRow, eventNameText) {
  const poster = document.createElement("div");
  poster.className = "fields-of-conflict-event-history__poster";

  const posterImage = document.createElement("img");
  posterImage.className = "fields-of-conflict-event-history__poster-image";
  posterImage.alt = eventNameText ? `${eventNameText} event poster` : "Event poster";
  posterImage.loading = "lazy";
  posterImage.decoding = "async";
  posterImage.hidden = true;

  const posterLabel = document.createElement("span");
  posterLabel.className = "fields-of-conflict-event-history__poster-fallback wrestling-show-poster-fallback";
  posterLabel.textContent = getWrestlingShowPosterLabel(eventRow);

  const posterUrl = getFieldsOfConflictDossierEventHistoryPosterUrl(eventRow);
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
  return poster;
}

function createFieldsOfConflictDossierEventHistoryRow(eventRow, venue) {
  const row = document.createElement("article");
  const eventNameText = getWrestlingVenueEventName(eventRow);
  const showRouteCode = getWrestlingShowRouteCode(eventRow);
  const showRoute = showRouteCode ? getWrestlingShowRouteUrl(eventRow) : "";
  row.className = "fields-of-conflict-event-history__row";
  row.setAttribute("role", "listitem");
  row.dataset.wrestlingShowId = eventRow.showId || eventRow.eventId || eventRow.show_id || "";
  row.dataset.wrestlingShowRoute = showRoute;
  setWrestlingRelationshipDataset(row, eventRow);

  const poster = createFieldsOfConflictDossierEventHistoryPoster(eventRow, eventNameText);

  const eventSummary = document.createElement("div");
  eventSummary.className = "fields-of-conflict-event-history__summary";

  const eventName = document.createElement("h5");
  eventName.className = "fields-of-conflict-event-history__event";
  eventName.textContent = eventNameText;

  const promotion = document.createElement("p");
  promotion.className = "fields-of-conflict-event-history__promotion";
  promotion.textContent = getWrestlingVenueEventPromotion(eventRow);
  eventSummary.append(promotion, eventName);

  const date = document.createElement("p");
  date.className = "fields-of-conflict-event-history__date";
  date.textContent = getWrestlingVenueEventDate(eventRow);


  const action = document.createElement("button");
  action.type = "button";
  action.className = "fields-of-conflict-event-history__action";
  action.textContent = "Open Event";
  action.setAttribute("aria-label", `Open event ${eventNameText}`);
  action.dataset.wrestlingShowId = row.dataset.wrestlingShowId;
  action.dataset.wrestlingShowRoute = showRoute;
  setWrestlingRelationshipDataset(action, eventRow);
  if (showRoute) {
    action.addEventListener("click", () => {
      navigateToRoute(showRoute, {
        historyState: {
          fromWrestlingVenueDetail: true,
          venueUrl: getFieldsOfConflictVenueDetailPrototypeUrl(venue),
        },
      });
    });
  } else {
    action.disabled = true;
    action.setAttribute("aria-disabled", "true");
  }

  const eventMeta = document.createElement("div");
  eventMeta.className = "fields-of-conflict-event-history__meta";
  eventMeta.append(date);

  const eventDetails = document.createElement("div");
  eventDetails.className = "fields-of-conflict-event-history__details";
  eventDetails.append(eventSummary, eventMeta, action);

  row.append(poster, eventDetails);
  return row;
}

function createFieldsOfConflictDossierEventHistory(venue) {
  const history = document.createElement("div");
  const relatedEvents = getFieldsOfConflictDossierEventHistoryRows(venue);
  const forcedState = getForcedMockState("wrestlingVenues");
  history.className = "fields-of-conflict-event-history";
  history.setAttribute("aria-label", "Venue event history");

  const viewport = document.createElement("div");
  viewport.className = "fields-of-conflict-event-history__viewport";

  const list = document.createElement("div");
  list.className = "fields-of-conflict-event-history__list";
  list.setAttribute("role", "list");

  if (forcedState && forcedState !== "partial") {
    renderWrestlingV3State(list, forcedState, "wrestlingVenues");
  } else if (relatedEvents.length > 0) {
    relatedEvents.forEach((eventRow) => {
      list.append(createFieldsOfConflictDossierEventHistoryRow(eventRow, venue));
    });
    if (forcedState === "partial") {
      list.append(createMockStateCard("partial", "wrestlingVenues"));
    }
  } else if (wrestlingShowsDataState === "loading" || wrestlingShowsDataState === "idle" || wrestlingShowsRequest) {
    list.append(createWrestlingV3StateCard("loading", "wrestlingVenues", {
      text: "Loading venue event history.",
    }));
  } else if (wrestlingShowsDataState === "error") {
    list.append(createWrestlingV3StateCard("error", "wrestlingVenues", {
      text: "Event history could not load from the wrestling show archive.",
    }));
  } else {
    list.append(createWrestlingVenuesEmptyState("No event history indexed for this venue yet."));
  }

  viewport.append(list);
  history.append(viewport);
  return history;
}

function syncFieldsOfConflictDossierEventHistorySection(section, venue = null) {
  const frame = section?.querySelector?.(".fields-of-conflict-dossier-section__frame");
  if (!frame) {
    return;
  }
  frame.replaceChildren(createFieldsOfConflictDossierEventHistory(venue));
}

function createFieldsOfConflictDossierFrameworkSection(sectionConfig, venue = null) {
  const section = document.createElement("section");
  section.className = `fields-of-conflict-dossier-section fields-of-conflict-dossier-section--${sectionConfig.id}`;
  section.dataset.fieldsOfConflictDossierSection = sectionConfig.id;
  section.setAttribute("aria-labelledby", `fields-of-conflict-${sectionConfig.id}-title`);

  const header = document.createElement("div");
  header.className = "fields-of-conflict-dossier-section__header";

  const title = document.createElement("h3");
  title.className = "fields-of-conflict-dossier-section__title";
  title.id = `fields-of-conflict-${sectionConfig.id}-title`;
  title.textContent = sectionConfig.title;
  header.append(title);

  const frame = document.createElement("div");
  frame.className = sectionConfig.id === "events"
    ? "fields-of-conflict-dossier-section__frame fields-of-conflict-dossier-section__frame--event-history"
    : "fields-of-conflict-dossier-section__frame";

  if (sectionConfig.id === "events") {
    frame.append(createFieldsOfConflictDossierEventHistory(venue));
  } else {
    const placeholder = document.createElement("p");
    placeholder.className = "fields-of-conflict-dossier-section__placeholder";
    placeholder.textContent = sectionConfig.text;
    frame.append(placeholder);
  }

  section.append(header, frame);
  return section;
}
const FIELDS_OF_CONFLICT_DOSSIER_STATIC_SECTION = Object.freeze({
  id: "information",
  label: "Venue Information",
  selector: ".fields-of-conflict-dossier__panel",
});

const FIELDS_OF_CONFLICT_DOSSIER_CAROUSEL_SECTIONS = Object.freeze([
  Object.freeze({
    id: "location",
    label: "Venue Location",
    selector: "[data-fields-of-conflict-location]",
  }),
  Object.freeze({
    id: "about",
    label: "About the Venue",
    selector: "[data-fields-of-conflict-dossier-section=\"about\"]",
  }),
  Object.freeze({
    id: "events",
    label: "Events Held / Timeline",
    selector: "[data-fields-of-conflict-dossier-section=\"events\"]",
  }),
  Object.freeze({
    id: "championship-history",
    label: "Championship History",
    selector: "[data-fields-of-conflict-dossier-section=\"championship-history\"]",
  }),
  Object.freeze({
    id: "notable-moments",
    label: "Notable Moments",
    selector: "[data-fields-of-conflict-dossier-section=\"notable-moments\"]",
  }),
  Object.freeze({
    id: "exterior-gallery",
    label: "Exterior Gallery",
    selector: "[data-fields-of-conflict-dossier-section=\"exterior-gallery\"]",
  }),
  Object.freeze({
    id: "highlights",
    label: "Highlights",
    selector: "[data-fields-of-conflict-dossier-section=\"highlights\"]",
  }),
  Object.freeze({
    id: "contributors",
    label: "Contributors",
    selector: "[data-fields-of-conflict-dossier-section=\"contributors\"]",
  }),
]);

const FIELDS_OF_CONFLICT_DOSSIER_RESTORABLE_SECTIONS = Object.freeze([
  FIELDS_OF_CONFLICT_DOSSIER_STATIC_SECTION,
  ...FIELDS_OF_CONFLICT_DOSSIER_CAROUSEL_SECTIONS,
]);

function normalizeFieldsOfConflictDossierCarouselIndex(index, total) {
  return total > 0 ? ((index % total) + total) % total : 0;
}

function getFieldsOfConflictDossierCarousel(dossier) {
  return dossier?.querySelector?.("[data-fields-of-conflict-dossier-carousel]") || null;
}

function getFieldsOfConflictDossierCarouselTrack(carousel) {
  return carousel?.querySelector?.("[data-fields-of-conflict-dossier-carousel-track]") || null;
}

function getFieldsOfConflictDossierCarouselDots(carousel) {
  return carousel?.querySelector?.("[data-fields-of-conflict-dossier-carousel-dots]") || null;
}

function getFieldsOfConflictDossierCarouselSlides(carousel) {
  return Array.from(carousel?.querySelectorAll?.("[data-fields-of-conflict-dossier-carousel-slide]") || []);
}

function createFieldsOfConflictDossierCarouselSlide(sectionConfig) {
  const slide = document.createElement("section");
  slide.className = "fields-of-conflict-dossier-carousel__slide";
  slide.dataset.fieldsOfConflictDossierCarouselSlide = sectionConfig.id;
  slide.setAttribute("aria-label", sectionConfig.label);
  slide.setAttribute("role", "group");
  return slide;
}

function createFieldsOfConflictDossierCarouselArrow(direction) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `fields-of-conflict-dossier-carousel__arrow fields-of-conflict-dossier-carousel__arrow--${direction}`;
  button.dataset.fieldsOfConflictDossierCarouselAction = direction;
  button.setAttribute("aria-label", direction === "prev" ? "Previous dossier section" : "Next dossier section");
  button.textContent = direction === "prev" ? "<" : ">";
  return button;
}

function updateFieldsOfConflictDossierCarousel(carousel, nextIndex) {
  const track = getFieldsOfConflictDossierCarouselTrack(carousel);
  const dots = Array.from(getFieldsOfConflictDossierCarouselDots(carousel)?.querySelectorAll?.("[data-fields-of-conflict-dossier-carousel-dot]") || []);
  const slides = getFieldsOfConflictDossierCarouselSlides(carousel);
  const activeIndex = normalizeFieldsOfConflictDossierCarouselIndex(Number.parseInt(nextIndex, 10) || 0, slides.length);
  if (!carousel || !track || slides.length === 0) {
    return;
  }

  carousel.dataset.fieldsOfConflictDossierCarouselIndex = String(activeIndex);
  track.style.transform = `translate3d(-${activeIndex * 100}%, 0, 0)`;
  slides.forEach((slide, index) => {
    const isActive = index === activeIndex;
    slide.classList.toggle("is-active", isActive);
    slide.setAttribute("aria-hidden", String(!isActive));
  });
  dots.forEach((dot, index) => {
    const isActive = index === activeIndex;
    dot.classList.toggle("is-active", isActive);
    dot.setAttribute("aria-current", isActive ? "true" : "false");
  });
  scheduleFieldsOfConflictVenueLocationMapResize();
}

function bindFieldsOfConflictDossierCarouselControls(carousel) {
  if (!carousel || carousel.dataset.fieldsOfConflictDossierCarouselBound === "true") {
    return;
  }

  const viewport = carousel.querySelector("[data-fields-of-conflict-dossier-carousel-viewport]");
  carousel.addEventListener("click", (event) => {
    const action = event.target?.closest?.("[data-fields-of-conflict-dossier-carousel-action]")?.dataset.fieldsOfConflictDossierCarouselAction;
    if (!action) {
      return;
    }
    const currentIndex = Number.parseInt(carousel.dataset.fieldsOfConflictDossierCarouselIndex || "0", 10) || 0;
    updateFieldsOfConflictDossierCarousel(carousel, action === "prev" ? currentIndex - 1 : currentIndex + 1);
  });
  carousel.addEventListener("click", (event) => {
    const dot = event.target?.closest?.("[data-fields-of-conflict-dossier-carousel-dot]");
    if (!dot) {
      return;
    }
    updateFieldsOfConflictDossierCarousel(carousel, Number.parseInt(dot.dataset.fieldsOfConflictDossierCarouselDot || "0", 10) || 0);
  });

  if (viewport) {
    viewport.addEventListener("keydown", (event) => {
      if (event.target?.closest?.("[data-fields-of-conflict-location-map]") || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) {
        return;
      }
      event.preventDefault();
      const currentIndex = Number.parseInt(carousel.dataset.fieldsOfConflictDossierCarouselIndex || "0", 10) || 0;
      updateFieldsOfConflictDossierCarousel(carousel, event.key === "ArrowLeft" ? currentIndex - 1 : currentIndex + 1);
    });

    let pointerStartX = 0;
    let pointerStartY = 0;
    let pointerId = null;
    function clearPointerState() {
      pointerId = null;
      pointerStartX = 0;
      pointerStartY = 0;
    }
    viewport.addEventListener("pointerdown", (event) => {
      if (event.target?.closest?.("[data-fields-of-conflict-location-map]") || event.pointerType === "mouse") {
        return;
      }
      pointerId = event.pointerId;
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
    });
    viewport.addEventListener("pointerup", (event) => {
      if (pointerId !== event.pointerId) {
        return;
      }
      const deltaX = event.clientX - pointerStartX;
      const deltaY = event.clientY - pointerStartY;
      if (Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY) * 1.35) {
        const currentIndex = Number.parseInt(carousel.dataset.fieldsOfConflictDossierCarouselIndex || "0", 10) || 0;
        updateFieldsOfConflictDossierCarousel(carousel, currentIndex + (deltaX < 0 ? 1 : -1));
      }
      clearPointerState();
    });
    viewport.addEventListener("pointercancel", clearPointerState);
    viewport.addEventListener("lostpointercapture", clearPointerState);
  }

  carousel.dataset.fieldsOfConflictDossierCarouselBound = "true";
}

function createFieldsOfConflictDossierCarousel() {
  const carousel = document.createElement("div");
  carousel.className = "fields-of-conflict-dossier-carousel";
  carousel.dataset.fieldsOfConflictDossierCarousel = "";
  carousel.dataset.fieldsOfConflictDossierCarouselIndex = "0";

  const previousButton = createFieldsOfConflictDossierCarouselArrow("prev");
  const viewport = document.createElement("div");
  viewport.className = "fields-of-conflict-dossier-carousel__viewport";
  viewport.dataset.fieldsOfConflictDossierCarouselViewport = "";
  viewport.tabIndex = 0;
  viewport.setAttribute("aria-label", "Venue dossier sections");
  viewport.setAttribute("aria-roledescription", "carousel");

  const track = document.createElement("div");
  track.className = "fields-of-conflict-dossier-carousel__track";
  track.dataset.fieldsOfConflictDossierCarouselTrack = "";
  viewport.append(track);

  const nextButton = createFieldsOfConflictDossierCarouselArrow("next");
  const dots = document.createElement("div");
  dots.className = "fields-of-conflict-dossier-carousel__dots";
  dots.dataset.fieldsOfConflictDossierCarouselDots = "";
  dots.setAttribute("aria-label", "Venue dossier section position");

  carousel.append(previousButton, viewport, nextButton, dots);
  bindFieldsOfConflictDossierCarouselControls(carousel);
  return carousel;
}

function unwrapFieldsOfConflictDossierCarousel(dossier) {
  const carousel = getFieldsOfConflictDossierCarousel(dossier);
  if (!dossier || !carousel) {
    return;
  }

  const fragment = document.createDocumentFragment();
  FIELDS_OF_CONFLICT_DOSSIER_RESTORABLE_SECTIONS.forEach((sectionConfig) => {
    const section = carousel.querySelector(sectionConfig.selector);
    if (section) {
      fragment.append(section);
    }
  });
  carousel.replaceWith(fragment);
}

function syncFieldsOfConflictDossierCarousel(dossier) {
  if (!dossier || !isWrestlingVenueDetailPrototypeRoute()) {
    unwrapFieldsOfConflictDossierCarousel(dossier);
    return;
  }

  const sections = FIELDS_OF_CONFLICT_DOSSIER_CAROUSEL_SECTIONS
    .map((sectionConfig) => ({
      ...sectionConfig,
      element: dossier.querySelector(sectionConfig.selector),
    }))
    .filter(({ element }) => Boolean(element));
  if (sections.length === 0) {
    return;
  }

  const existingCarousel = getFieldsOfConflictDossierCarousel(dossier);
  const carousel = existingCarousel || createFieldsOfConflictDossierCarousel();
  const track = getFieldsOfConflictDossierCarouselTrack(carousel);
  const dots = getFieldsOfConflictDossierCarouselDots(carousel);
  const previousIndex = Number.parseInt(carousel.dataset.fieldsOfConflictDossierCarouselIndex || "0", 10) || 0;
  const firstSection = sections[0].element;
  if (!existingCarousel && firstSection.parentElement === dossier) {
    dossier.insertBefore(carousel, firstSection);
  } else if (carousel.parentElement !== dossier) {
    dossier.append(carousel);
  }

  sections.forEach((sectionConfig, index) => {
    const slideSelector = `[data-fields-of-conflict-dossier-carousel-slide="${sectionConfig.id}"]`;
    const slide = track.querySelector(slideSelector) || createFieldsOfConflictDossierCarouselSlide(sectionConfig);
    slide.setAttribute("aria-label", sectionConfig.label);
    if (sectionConfig.element.parentElement !== slide) {
      slide.replaceChildren(sectionConfig.element);
    }
    if (slide.parentElement !== track || track.children[index] !== slide) {
      track.append(slide);
    }
  });

  Array.from(track.children).forEach((slide) => {
    if (!sections.some((sectionConfig) => slide.dataset.fieldsOfConflictDossierCarouselSlide === sectionConfig.id)) {
      slide.remove();
    }
  });

  dots.replaceChildren(...sections.map((sectionConfig, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "fields-of-conflict-dossier-carousel__dot";
    dot.dataset.fieldsOfConflictDossierCarouselDot = String(index);
    dot.setAttribute("aria-label", `Show ${sectionConfig.label}`);
    return dot;
  }));

  bindFieldsOfConflictDossierCarouselControls(carousel);
  updateFieldsOfConflictDossierCarousel(carousel, previousIndex);
}

function syncFieldsOfConflictDossierFrameworkSections(dossier, venue = null) {
  const existingSections = Array.from(dossier?.querySelectorAll?.("[data-fields-of-conflict-dossier-section]") || []);
  if (!dossier || !isWrestlingVenueDetailPrototypeRoute()) {
    existingSections.forEach((section) => section.remove());
    return;
  }

  let anchor = dossier.querySelector("[data-fields-of-conflict-location]") || dossier.querySelector(".fields-of-conflict-dossier__panel");
  FIELDS_OF_CONFLICT_DOSSIER_FRAMEWORK_SECTIONS.forEach((sectionConfig) => {
    const selector = `[data-fields-of-conflict-dossier-section="${sectionConfig.id}"]`;
    const section = dossier.querySelector(selector) || createFieldsOfConflictDossierFrameworkSection(sectionConfig, venue);
    if (sectionConfig.id === "events") {
      syncFieldsOfConflictDossierEventHistorySection(section, venue);
    }
    if (anchor) {
      if (anchor.nextElementSibling !== section) {
        anchor.insertAdjacentElement("afterend", section);
      }
    } else if (section.parentElement !== dossier) {
      dossier.append(section);
    }
    anchor = section;
  });
}

function syncFieldsOfConflictVenueLocationSection(dossier, venue = null) {
  const existingSection = dossier?.querySelector?.("[data-fields-of-conflict-location]");
  if (!dossier || !isWrestlingVenueDetailPrototypeRoute()) {
    destroyFieldsOfConflictVenueLocationMap();
    existingSection?.remove();
    return;
  }

  const section = existingSection || createFieldsOfConflictVenueLocationSection();
  const mapElement = section.querySelector("[data-fields-of-conflict-location-map]");
  if (mapElement && venue) {
    mapElement.setAttribute("aria-label", `${getWrestlingVenueRowName(venue)} venue location map`);
  }
  const panel = dossier.querySelector(".fields-of-conflict-dossier__panel");
  if (panel) {
    if (panel.nextElementSibling !== section) {
      panel.insertAdjacentElement("afterend", section);
    }
    return;
  }

  if (section.parentElement !== dossier) {
    dossier.append(section);
  }
}

function renderFieldsOfConflictVenueDossier(venueId = getFieldsOfConflictActiveVenueId()) {
  const dossier = getFieldsOfConflictDossierElement();
  if (!dossier) {
    return;
  }

  const { config, venue, fallbackConfig } = getFieldsOfConflictDossierVenueSource(venueId);
  if (!venue) {
    return;
  }

  unwrapFieldsOfConflictDossierCarousel(dossier);
  const venueName = getWrestlingVenueRowName(venue);
  const initials = dossier.querySelector("[data-fields-of-conflict-dossier-initials]");
  const name = dossier.querySelector("[data-fields-of-conflict-dossier-name]");
  const facts = dossier.querySelector("[data-fields-of-conflict-dossier-facts]");

  if (initials) {
    initials.textContent = getWrestlingVenueInitials(venueName);
  }
  if (name) {
    name.textContent = venueName;
  }
  if (facts) {
    facts.replaceChildren(...getFieldsOfConflictDossierFactRows(venue, fallbackConfig).map(({ label, value, modifier }) => createFieldsOfConflictDossierFact(label, value, modifier)));
  }
  syncFieldsOfConflictVenueLocationSection(dossier, venue);
  syncFieldsOfConflictDossierFrameworkSections(dossier, venue);
  syncFieldsOfConflictDossierCarousel(dossier);
  syncFieldsOfConflictVenueLocationMap(venue, fallbackConfig);

  dossier.dataset.fieldsOfConflictVenueId = config?.id || getWrestlingVenueRowId(venue);
  dossier.setAttribute("aria-label", `${venueName} venue dossier`);
}

function openFieldsOfConflictVenueDossier() {
  const prototypeShell = getWrestlingVenuesPrototypeShell();
  const dossier = getFieldsOfConflictDossierElement();
  if (!prototypeShell || !dossier) {
    return;
  }

  renderFieldsOfConflictVenueDossier(getFieldsOfConflictActiveVenueId());
  prototypeShell.dataset.fieldsOfConflictDossierState = "open";
  dossier.hidden = false;
  dossier.removeAttribute("aria-hidden");
  dossier.removeAttribute("inert");
}

function closeFieldsOfConflictVenueDossier(options = {}) {
  const prototypeShell = getWrestlingVenuesPrototypeShell();
  const dossier = getFieldsOfConflictDossierElement();
  if (prototypeShell) {
    delete prototypeShell.dataset.fieldsOfConflictDossierState;
  }
  if (dossier) {
    dossier.hidden = true;
    dossier.setAttribute("aria-hidden", "true");
    dossier.setAttribute("inert", "");
  }
  if (options.restoreConnection !== false) {
    scheduleFieldsOfConflictActiveConnectionUpdate();
  }
}

let fieldsOfConflictDossierTriggerDelegated = false;

function handleFieldsOfConflictDossierTriggerClick(event) {
  if (!isWrestlingVenuesPrototypeRoute()) {
    return;
  }

  const trigger = event.target?.closest?.("[data-fields-of-conflict-dossier-trigger]");
  if (!trigger || trigger.disabled || trigger.dataset.fieldsOfConflictCoordinateState !== "locked") {
    return;
  }

  event.preventDefault();
  const venue = getFieldsOfConflictVenueConfig(getFieldsOfConflictActiveVenueId());
  if (!venue) {
    return;
  }
  navigateToRoute(getWrestlingVenueRouteUrl(venue), {
    historyState: { fromWrestlingVenuesIndex: true },
  });
}

function bindFieldsOfConflictVenueDossierControls() {
  ensureFieldsOfConflictCoordinateStatusBox();
  if (!fieldsOfConflictDossierTriggerDelegated) {
    document.addEventListener("click", handleFieldsOfConflictDossierTriggerClick, true);
    fieldsOfConflictDossierTriggerDelegated = true;
  }
}

function getFieldsOfConflictCoordinateStatusText(venue) {
  return `Coordinates: ${venue ? "Locked" : "Pending"}`;
}

function ensureFieldsOfConflictCoordinateStatusBox() {
  const prototypeShell = getWrestlingVenuesPrototypeShell();
  if (!prototypeShell) {
    return null;
  }

  const coordinatePanel = prototypeShell.querySelector("[data-fields-of-conflict-coordinate-hud]");
  coordinatePanel?.querySelectorAll(".fields-of-conflict-coordinate-hud__label, .fields-of-conflict-coordinate-hud__status").forEach((element) => {
    element.hidden = true;
    element.setAttribute("aria-hidden", "true");
  });

  let statusBox = prototypeShell.querySelector("[data-fields-of-conflict-coordinate-status]");
  if (!statusBox) {
    statusBox = document.createElement("button");
    statusBox.type = "button";
    statusBox.className = "fields-of-conflict-coordinate-status";
    statusBox.dataset.fieldsOfConflictCoordinateStatus = "";
    statusBox.dataset.fieldsOfConflictDossierTrigger = "";
    statusBox.setAttribute("aria-live", "polite");
    statusBox.setAttribute("aria-label", getFieldsOfConflictCoordinateStatusText(null));

    const statusText = document.createElement("span");
    statusText.className = "fields-of-conflict-coordinate-status__text";
    statusText.dataset.fieldsOfConflictCoordinateStatusText = "";
    statusText.textContent = getFieldsOfConflictCoordinateStatusText(null);
    statusBox.append(statusText);

    const venueSelectShell = prototypeShell.querySelector("[data-fields-of-conflict-venue-select-shell]");
    if (venueSelectShell?.parentElement === prototypeShell) {
      venueSelectShell.insertAdjacentElement("afterend", statusBox);
    } else if (coordinatePanel?.parentElement === prototypeShell) {
      coordinatePanel.insertAdjacentElement("beforebegin", statusBox);
    } else {
      prototypeShell.append(statusBox);
    }
  }

  return statusBox;
}

function updateFieldsOfConflictCoordinateStatus(venue) {
  const statusBox = ensureFieldsOfConflictCoordinateStatusBox();
  if (!statusBox) {
    return;
  }

  const statusText = getFieldsOfConflictCoordinateStatusText(venue);
  const statusTextElement = statusBox.querySelector("[data-fields-of-conflict-coordinate-status-text]");
  if (statusTextElement) {
    statusTextElement.textContent = statusText;
  }
  statusBox.dataset.fieldsOfConflictCoordinateState = venue ? "locked" : "pending";
  statusBox.disabled = !venue;
  statusBox.setAttribute("aria-label", venue ? `${statusText}. View Venue Dossier for ${venue.name}` : statusText);
}

function getFieldsOfConflictVenueMarkerLayer() {
  return document.querySelector(".fields-of-conflict-globe-markers");
}

function ensureFieldsOfConflictVenueMarkerAccessibility() {
  const markerLayer = getFieldsOfConflictVenueMarkerLayer();
  if (!markerLayer) {
    return;
  }

  markerLayer.querySelectorAll(".fields-of-conflict-venue-marker[data-venue-id]").forEach((marker) => {
    const venue = getFieldsOfConflictVenueConfig(marker.dataset.venueId);
    if (!venue) {
      return;
    }
    marker.setAttribute("role", "button");
    marker.setAttribute("tabindex", "0");
    marker.setAttribute("aria-label", `Select ${venue.name}`);
    marker.setAttribute("aria-pressed", String(marker.classList.contains("is-coordinate-locked")));
  });
}

function getFieldsOfConflictMarkerFromPoint(clientX, clientY) {
  const markerLayer = getFieldsOfConflictVenueMarkerLayer();
  if (!markerLayer) {
    return null;
  }

  let closestMarker = null;
  let closestDistance = Number.POSITIVE_INFINITY;
  markerLayer.querySelectorAll(".fields-of-conflict-venue-marker[data-venue-id]").forEach((marker) => {
    const markerRect = marker.getBoundingClientRect();
    const markerCenterX = markerRect.left + markerRect.width / 2;
    const markerCenterY = markerRect.top + markerRect.height / 2;
    const markerHitRadius = Math.max(14, markerRect.width * 1.85);
    const distance = Math.hypot(clientX - markerCenterX, clientY - markerCenterY);
    if (distance <= markerHitRadius && distance < closestDistance) {
      closestMarker = marker;
      closestDistance = distance;
    }
  });
  return closestMarker;
}

function bindFieldsOfConflictVenueMarkers() {
  const markerLayer = getFieldsOfConflictVenueMarkerLayer();
  if (!markerLayer) {
    return;
  }

  ensureFieldsOfConflictVenueMarkerAccessibility();
  if (markerLayer.dataset.fieldsOfConflictVenueMarkersBound === "true") {
    return;
  }

  document.addEventListener("click", (event) => {
    if (!isWrestlingVenuesPrototypeRoute()) {
      return;
    }
    if (event.target?.closest?.("[data-fields-of-conflict-venue-select-shell]")) {
      return;
    }

    const directMarker = event.target?.closest?.(".fields-of-conflict-venue-marker[data-venue-id]");
    const marker = directMarker && markerLayer.contains(directMarker)
      ? directMarker
      : getFieldsOfConflictMarkerFromPoint(event.clientX, event.clientY);
    if (!marker) {
      return;
    }

    updateFieldsOfConflictVenueLock(marker.dataset.venueId);
  }, true);

  markerLayer.addEventListener("keydown", (event) => {
    const marker = event.target?.closest?.(".fields-of-conflict-venue-marker[data-venue-id]");
    if (!marker || !markerLayer.contains(marker) || (event.key !== "Enter" && event.key !== " ")) {
      return;
    }
    event.preventDefault();
    updateFieldsOfConflictVenueLock(marker.dataset.venueId);
  });
  markerLayer.dataset.fieldsOfConflictVenueMarkersBound = "true";
}

function ensureFieldsOfConflictVenueSelectOptions(select = getFieldsOfConflictVenueSelect()) {
  if (!select) {
    return;
  }

  const existingValues = Array.from(select.options || []).map((option) => option.value).join("|");
  const expectedValues = FIELDS_OF_CONFLICT_VENUE_CONFIG.map((venue) => venue.id).join("|");
  if (existingValues === expectedValues) {
    return;
  }

  const options = FIELDS_OF_CONFLICT_VENUE_CONFIG.map((venue) => {
    const option = document.createElement("option");
    option.value = venue.id;
    option.textContent = venue.name;
    return option;
  });
  select.replaceChildren(...options);
}

function getFieldsOfConflictCoordinateLocationLabel(venue) {
  return String(venue?.location || "").trim().replace(/,\s*Maine$/i, ", ME");
}

function getFieldsOfConflictCoordinateVenueLine(venue) {
  const location = getFieldsOfConflictCoordinateLocationLabel(venue);
  return location ? `${venue.name} - ${location}` : venue.name;
}

function getFieldsOfConflictCoordinateValuesLine(venue) {
  return `${venue.latitude} / ${venue.longitude}`;
}

function getFieldsOfConflictCoordinateLabel(venue) {
  return `${getFieldsOfConflictCoordinateVenueLine(venue)}, ${venue.latitude.replace(FIELDS_OF_CONFLICT_COORDINATE_DEGREE, " degrees")}, ${venue.longitude.replace(FIELDS_OF_CONFLICT_COORDINATE_DEGREE, " degrees")}`;
}

function updateFieldsOfConflictCoordinatePanel(venue) {
  const panel = document.querySelector("[data-fields-of-conflict-coordinate-hud]");
  ensureFieldsOfConflictCoordinateStatusBox();
  if (!panel || !venue) {
    return;
  }

  const venueName = panel.querySelector("[data-fields-of-conflict-coordinate-venue]");
  const coordinateValues = panel.querySelector("[data-fields-of-conflict-coordinate-values]");

  if (venueName) {
    venueName.textContent = getFieldsOfConflictCoordinateVenueLine(venue);
  }
  if (coordinateValues) {
    coordinateValues.textContent = getFieldsOfConflictCoordinateValuesLine(venue);
  }
  panel.setAttribute("aria-label", getFieldsOfConflictCoordinateLabel(venue));
}

let fieldsOfConflictConnectionFrame = 0;
let fieldsOfConflictConnectionResizeBound = false;

function getFieldsOfConflictActiveConnectionLayer() {
  return document.querySelector("[data-fields-of-conflict-active-connection]");
}

function getFieldsOfConflictActiveConnectionPath() {
  return document.querySelector("[data-fields-of-conflict-active-connection-path]");
}

function hideFieldsOfConflictActiveConnection() {
  const connectionLayer = getFieldsOfConflictActiveConnectionLayer();
  const connectionPath = getFieldsOfConflictActiveConnectionPath();
  if (connectionLayer) {
    delete connectionLayer.dataset.fieldsOfConflictConnectionActive;
  }
  if (connectionPath) {
    connectionPath.removeAttribute("d");
  }
}

function hasUsableFieldsOfConflictRect(rect) {
  return Boolean(
    rect &&
    Number.isFinite(rect.left) &&
    Number.isFinite(rect.top) &&
    Number.isFinite(rect.width) &&
    Number.isFinite(rect.height) &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function updateFieldsOfConflictActiveConnection() {
  const connectionLayer = getFieldsOfConflictActiveConnectionLayer();
  const connectionPath = getFieldsOfConflictActiveConnectionPath();
  if (!connectionLayer || !connectionPath || !isWrestlingVenuesPrototypeRoute()) {
    hideFieldsOfConflictActiveConnection();
    return;
  }

  const prototypeShell = getWrestlingVenuesPrototypeShell();
  const activeMarker = document.querySelector(".fields-of-conflict-venue-marker.is-coordinate-locked[data-venue-id]");
  const coordinatePanel = document.querySelector("[data-fields-of-conflict-coordinate-hud]");
  if (!prototypeShell || !activeMarker || !coordinatePanel) {
    hideFieldsOfConflictActiveConnection();
    return;
  }

  const shellRect = prototypeShell.getBoundingClientRect();
  const markerRect = activeMarker.getBoundingClientRect();
  const panelRect = coordinatePanel.getBoundingClientRect();
  if (!hasUsableFieldsOfConflictRect(shellRect) || !hasUsableFieldsOfConflictRect(markerRect) || !hasUsableFieldsOfConflictRect(panelRect)) {
    hideFieldsOfConflictActiveConnection();
    return;
  }

  const markerCenterX = markerRect.left + (markerRect.width / 2) - shellRect.left;
  const markerCenterY = markerRect.top + (markerRect.height / 2) - shellRect.top;
  const panelAnchorX = panelRect.left + (panelRect.width / 2) - shellRect.left;
  const panelAnchorY = panelRect.top - shellRect.top;
  if (
    markerCenterX < 0 ||
    markerCenterX > shellRect.width ||
    markerCenterY < 0 ||
    markerCenterY > shellRect.height ||
    panelAnchorX < 0 ||
    panelAnchorX > shellRect.width ||
    panelAnchorY < 0 ||
    panelAnchorY > shellRect.height
  ) {
    hideFieldsOfConflictActiveConnection();
    return;
  }

  connectionLayer.setAttribute("viewBox", `0 0 ${shellRect.width.toFixed(1)} ${shellRect.height.toFixed(1)}`);
  connectionPath.setAttribute(
    "d",
    `M ${markerCenterX.toFixed(1)} ${markerCenterY.toFixed(1)} L ${panelAnchorX.toFixed(1)} ${panelAnchorY.toFixed(1)}`
  );
  connectionLayer.dataset.fieldsOfConflictConnectionActive = "true";
}

function scheduleFieldsOfConflictActiveConnectionUpdate() {
  if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
    updateFieldsOfConflictActiveConnection();
    return;
  }
  if (fieldsOfConflictConnectionFrame) {
    window.cancelAnimationFrame(fieldsOfConflictConnectionFrame);
  }
  fieldsOfConflictConnectionFrame = window.requestAnimationFrame(() => {
    fieldsOfConflictConnectionFrame = 0;
    updateFieldsOfConflictActiveConnection();
  });
}

function bindFieldsOfConflictActiveConnectionResize() {
  if (fieldsOfConflictConnectionResizeBound || typeof window === "undefined") {
    return;
  }
  window.addEventListener("resize", scheduleFieldsOfConflictActiveConnectionUpdate, { passive: true });
  window.addEventListener("orientationchange", scheduleFieldsOfConflictActiveConnectionUpdate, { passive: true });
  fieldsOfConflictConnectionResizeBound = true;
}

function updateFieldsOfConflictVenueLock(venueId = FIELDS_OF_CONFLICT_DEFAULT_VENUE_ID) {
  const venue = getFieldsOfConflictVenueConfig(venueId);
  updateFieldsOfConflictCoordinateStatus(venue);
  if (!venue) {
    return;
  }

  document.querySelectorAll(".fields-of-conflict-venue-marker[data-venue-id]").forEach((marker) => {
    const isActiveMarker = marker.dataset.venueId === venue.id;
    marker.classList.toggle("is-coordinate-locked", isActiveMarker);
    marker.setAttribute("aria-pressed", String(isActiveMarker));
  });

  const select = getFieldsOfConflictVenueSelect();
  if (select && select.value !== venue.id) {
    select.value = venue.id;
  }
  updateFieldsOfConflictCoordinatePanel(venue);
  if (getWrestlingVenuesPrototypeShell()?.dataset.fieldsOfConflictDossierState === "open") {
    renderFieldsOfConflictVenueDossier(venue.id);
  }
  updateFieldsOfConflictActiveConnection();
  scheduleFieldsOfConflictActiveConnectionUpdate();
}

function bindFieldsOfConflictVenueSelect() {
  const select = getFieldsOfConflictVenueSelect();
  if (!select) {
    updateFieldsOfConflictVenueLock();
    return;
  }

  ensureFieldsOfConflictVenueSelectOptions(select);
  const hasSelectedVenue = FIELDS_OF_CONFLICT_VENUE_CONFIG.some((venue) => venue.id === select.value);
  if (select.dataset.fieldsOfConflictVenueSelectInitialized !== "true" || !hasSelectedVenue) {
    select.value = FIELDS_OF_CONFLICT_DEFAULT_VENUE_ID;
    select.dataset.fieldsOfConflictVenueSelectInitialized = "true";
  }
  if (select.dataset.fieldsOfConflictVenueSelectBound !== "true") {
    select.addEventListener("change", () => {
      updateFieldsOfConflictVenueLock(select.value);
    });
    select.dataset.fieldsOfConflictVenueSelectBound = "true";
  }
  updateFieldsOfConflictVenueLock(select.value || FIELDS_OF_CONFLICT_DEFAULT_VENUE_ID);
}

function ensureWrestlingVenuesPrototypeShellOwnership(shellElement, prototypeShell) {
  if (!shellElement || !prototypeShell || prototypeShell.parentElement === shellElement) {
    return;
  }
  shellElement.appendChild(prototypeShell);
}

function clearFieldsOfConflictDetailPrototypeState() {
  const prototypeShell = getWrestlingVenuesPrototypeShell();
  if (prototypeShell) {
    delete prototypeShell.dataset.fieldsOfConflictDetailPrototype;
  }
}

function clearWrestlingVenuesPrototypeSourceShell() {
  if (typeof wrestlingVenuesList !== "undefined" && wrestlingVenuesList) {
    wrestlingVenuesList.replaceChildren();
  }
  if (wrestlingVenuesFilters) {
    wrestlingVenuesFilters.replaceChildren();
  }
  if (wrestlingVenuesCount) {
    wrestlingVenuesCount.textContent = "";
  }
}

function getWrestlingPeoplePrototypeShell() {
  if (wrestlingPeoplePrototypeShell && document.documentElement.contains(wrestlingPeoplePrototypeShell)) {
    return wrestlingPeoplePrototypeShell;
  }

  wrestlingPeoplePrototypeShell = document.querySelector("[data-wrestling-people-prototype-shell]");
  if (wrestlingPeoplePrototypeShell) {
    return wrestlingPeoplePrototypeShell;
  }

  const prototypeShell = document.createElement("section");
  prototypeShell.className = "wrestling-people-prototype-shell";
  prototypeShell.dataset.wrestlingPeoplePrototypeShell = "hall-of-champions";
  prototypeShell.setAttribute("aria-label", "Hall of Champions arrival");
  prototypeShell.setAttribute("aria-hidden", "true");
  prototypeShell.setAttribute("inert", "");
  prototypeShell.hidden = true;

  const pedestal = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  pedestal.classList.add("hall-of-champions-pedestal");
  pedestal.dataset.hallOfChampionsPedestal = "base-silhouette";
  pedestal.setAttribute("viewBox", "0 0 640 520");
  pedestal.setAttribute("aria-hidden", "true");
  pedestal.setAttribute("focusable", "false");
  pedestal.innerHTML = `
    <g class="hall-of-champions-pedestal__hologram-frame">
      <path d="M252 28 L388 28 L410 112 L374 112 L362 64 L278 64 L266 112 L230 112 Z" />
      <path d="M214 108 L256 108 L236 220 L192 220 Z" />
      <path d="M384 108 L426 108 L448 220 L404 220 Z" />
    </g>
    <g class="hall-of-champions-pedestal__upper-console">
      <path d="M184 226 L456 226 L510 292 L130 292 Z" />
      <path d="M226 244 L414 244 L446 282 L194 282 Z" />
      <ellipse cx="320" cy="263" rx="72" ry="18" />
    </g>
    <g class="hall-of-champions-pedestal__body">
      <path d="M232 292 L408 292 L438 418 L202 418 Z" />
      <path d="M262 312 L378 312 L394 404 L246 404 Z" />
    </g>
    <g class="hall-of-champions-pedestal__base">
      <path d="M176 406 L464 406 L532 454 L108 454 Z" />
      <path d="M88 454 L552 454 L606 492 L34 492 Z" />
      <path d="M18 492 L622 492 L640 520 L0 520 Z" />
    </g>
  `;
  prototypeShell.append(pedestal);

  const shellElement = document.querySelector(".site-shell");
  (shellElement || document.body).appendChild(prototypeShell);
  wrestlingPeoplePrototypeShell = prototypeShell;
  return wrestlingPeoplePrototypeShell;
}

function setWrestlingPeoplePrototypeActive(isActive) {
  const shellElement = document.querySelector(".site-shell");
  const prototypeShell = isActive
    ? getWrestlingPeoplePrototypeShell()
    : wrestlingPeoplePrototypeShell || document.querySelector("[data-wrestling-people-prototype-shell]");

  if (isActive && typeof setWrestlingVenuesPrototypeActive === "function") {
    setWrestlingVenuesPrototypeActive(false);
  }

  if (shellElement) {
    if (isActive) {
      shellElement.dataset.wrestlingPeoplePrototype = "hall-of-champions";
      shellElement.dataset.portfolioGatewayWorld = "battleground";
      shellElement.dataset.portfolioGatewayRoute = "/wrestling";
      shellElement.dataset.portfolioGatewayState = "filling-screen";
      shellElement.dataset.activeWorld = "battleground";
      shellElement.dataset.shellRoute = "portfolio";
      shellElement.dataset.shellActiveTarget = "portfolio";
      shellElement.dataset.shellModule = "shell";
      shellElement.dataset.portfolioGatewayHandoff = "complete";
      shellElement.classList.remove("is-module-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-venues-view", "is-ring-archive-view");
      shellElement.classList.add("has-entered-hub", "has-portfolio-entry-constellation", "is-portfolio-world-gateway-active", "is-portfolio-world-arrived");
    } else {
      delete shellElement.dataset.wrestlingPeoplePrototype;
    }
  }

  if (prototypeShell) {
    prototypeShell.hidden = !isActive;
    prototypeShell.setAttribute("inert", "");
    prototypeShell.setAttribute("aria-hidden", "true");
    prototypeShell.dataset.hallOfChampionsActive = String(Boolean(isActive));
  }

  if (!isActive) {
    return;
  }

  cancelWrestlingPeopleBackgroundHydrationIfRouteUnneeded();

  if (typeof homeFrame !== "undefined" && homeFrame) {
    homeFrame.setAttribute("aria-hidden", "true");
    homeFrame.setAttribute("inert", "");
  }

  if (typeof setWrestlingShowsHidden === "function") {
    setWrestlingShowsHidden(true);
  }
  if (typeof setWrestlingPeopleHidden === "function") {
    setWrestlingPeopleHidden(true);
  }
  if (typeof setWrestlingPersonDetailHidden === "function") {
    setWrestlingPersonDetailHidden(true);
  }
  if (typeof setWrestlingVenuesHidden === "function") {
    setWrestlingVenuesHidden(true);
  }
  if (typeof setWrestlingShowDetailHidden === "function") {
    setWrestlingShowDetailHidden(true);
  }
  if (typeof setWrestlingMatchGalleryHidden === "function") {
    setWrestlingMatchGalleryHidden(true);
  }
  if (typeof setWrestlingLightboxHidden === "function") {
    setWrestlingLightboxHidden(true);
  }

  if (typeof currentView !== "undefined" && currentView) {
    currentView.textContent = "Daiion - Hall of Champions";
  }

  const engineCurrent = document.querySelector("[data-portfolio-engine-current-view]");
  if (engineCurrent) {
    const engineCurrentPanel = engineCurrent.closest("[data-portfolio-engine-panel='current-view']");
    const engineCurrentLabel = engineCurrentPanel?.querySelector(".portfolio-engine-label");
    if (engineCurrentLabel) {
      engineCurrentLabel.textContent = "Current View:";
    }
    engineCurrent.classList.remove("fields-of-conflict-lock-readout");
    engineCurrent.textContent = "Hall of Champions";
  }

  if (typeof setDocumentTitle === "function") {
    setDocumentTitle("Hall of Champions - Voodoo Media V3.0.01");
  }
}

function showWrestlingPeoplePrototypeRoute() {
  setWrestlingPeoplePrototypeActive(true);
}
function setWrestlingVenuesPrototypeActive(isActive) {
  if (isActive && typeof setWrestlingPeoplePrototypeActive === "function") {
    setWrestlingPeoplePrototypeActive(false);
  }

  const shellElement = document.querySelector(".site-shell");
  if (shellElement) {
    if (isActive) {
      shellElement.dataset.wrestlingVenuesPrototype = "fields-of-conflict";
      shellElement.dataset.portfolioGatewayWorld = "battleground";
      shellElement.dataset.portfolioGatewayRoute = "/wrestling";
      shellElement.dataset.portfolioGatewayState = "filling-screen";
      shellElement.dataset.activeWorld = "battleground";
      shellElement.dataset.shellRoute = "portfolio";
      shellElement.dataset.shellActiveTarget = "portfolio";
      shellElement.dataset.shellModule = "shell";
      shellElement.dataset.portfolioGatewayHandoff = "complete";
      shellElement.classList.remove("is-module-view", "is-wrestling-venues-view", "is-ring-archive-view");
      shellElement.classList.add("has-entered-hub", "has-portfolio-entry-constellation", "is-portfolio-world-gateway-active", "is-portfolio-world-arrived");
    } else {
      delete shellElement.dataset.wrestlingVenuesPrototype;
    }
  }

  if (isActive && typeof currentView !== "undefined" && currentView) {
    currentView.textContent = "Daïion — Fields of Conflict";
  }

  const engineCurrent = document.querySelector("[data-portfolio-engine-current-view]");
  if (engineCurrent) {
    const engineCurrentPanel = engineCurrent.closest("[data-portfolio-engine-panel='current-view']");
    const engineCurrentLabel = engineCurrentPanel?.querySelector(".portfolio-engine-label");
    if (isActive) {
      if (engineCurrentLabel) {
        engineCurrentLabel.textContent = "Current View:";
      }
      engineCurrent.classList.remove("fields-of-conflict-lock-readout");
      engineCurrent.textContent = "Daïion — Fields of Conflict";
    } else {
      if (engineCurrentLabel?.textContent?.trim() !== "Current View:") {
        engineCurrentLabel.textContent = "Current View:";
      }
      if (engineCurrent.classList.contains("fields-of-conflict-lock-readout") || engineCurrent.textContent?.trim() === "Daïion — Fields of Conflict") {
        engineCurrent.classList.remove("fields-of-conflict-lock-readout");
        engineCurrent.textContent = "Interactive Portfolio";
      }
    }
  }

  if (typeof wrestlingVenuesShell !== "undefined" && wrestlingVenuesShell) {
    if (isActive) {
      wrestlingVenuesShell.setAttribute("aria-hidden", "true");
      wrestlingVenuesShell.setAttribute("inert", "");
      wrestlingVenuesShell.setAttribute("aria-busy", "false");
    } else {
      let routeName = "";
      try {
        routeName = typeof getRouteFromUrl === "function" ? String(getRouteFromUrl()?.name || "") : "";
      } catch (error) {
        routeName = "";
      }
      if (routeName === "wrestling-venues") {
        wrestlingVenuesShell.removeAttribute("aria-hidden");
        wrestlingVenuesShell.removeAttribute("inert");
      }
    }
  }

  const prototypeShell = getWrestlingVenuesPrototypeShell();
  if (isActive) {
    ensureWrestlingVenuesPrototypeShellOwnership(shellElement, prototypeShell);
  }
  if (prototypeShell) {
    prototypeShell.toggleAttribute("inert", !isActive);
    prototypeShell.setAttribute("aria-hidden", String(!isActive));
    prototypeShell.dataset.fieldsOfConflictActive = String(isActive);
  }

  if (isActive) {
    bindFieldsOfConflictVenueSelect();
    bindFieldsOfConflictVenueMarkers();
    bindFieldsOfConflictVenueDossierControls();
    renderFieldsOfConflictVenueDossier(getFieldsOfConflictActiveVenueId());
    bindFieldsOfConflictActiveConnectionResize();
    scheduleFieldsOfConflictActiveConnectionUpdate();
  } else {
    clearFieldsOfConflictDetailPrototypeState();
    closeFieldsOfConflictVenueDossier({ restoreConnection: false });
    hideFieldsOfConflictActiveConnection();
  }
}

function renderWrestlingVenuesPrototypeShell() {
  cancelWrestlingPeopleBackgroundHydrationIfRouteUnneeded();
  clearWrestlingVenuesPrototypeSourceShell();
  setWrestlingVenuesPrototypeActive(true);
  clearFieldsOfConflictDetailPrototypeState();
  closeFieldsOfConflictVenueDossier({ restoreConnection: false });
  updateFieldsOfConflictVenueLock(getFieldsOfConflictActiveVenueId());
}

function renderWrestlingVenueDetailPrototypeRoute(route = {}) {
  cancelWrestlingPeopleBackgroundHydrationIfRouteUnneeded();
  clearWrestlingVenuesPrototypeSourceShell();
  const routeVenueId = normalizeWrestlingVenueId(getFieldsOfConflictRouteVenueId(route)) || FIELDS_OF_CONFLICT_DETAIL_PROTOTYPE_VENUE_ID;
  setWrestlingVenuesPrototypeActive(true);
  updateFieldsOfConflictVenueLock(routeVenueId);
  renderFieldsOfConflictVenueDossier(routeVenueId);

  const prototypeShell = getWrestlingVenuesPrototypeShell();
  const dossier = getFieldsOfConflictDossierElement();
  if (prototypeShell) {
    prototypeShell.dataset.fieldsOfConflictDetailPrototype = routeVenueId;
    prototypeShell.dataset.fieldsOfConflictDossierState = "open";
  }
  if (dossier) {
    dossier.hidden = false;
    dossier.removeAttribute("aria-hidden");
    dossier.removeAttribute("inert");
  }
  requestFieldsOfConflictDetailHydration(route);
  hideFieldsOfConflictActiveConnection();
}

function showWrestlingVenueDetailPrototype(route = {}) {
  renderWrestlingVenueDetailPrototypeRoute(route);
}

function renderWrestlingVenuesIndex(options = {}) {
  const currentRoute = typeof getRouteFromUrl === "function" ? getRouteFromUrl() : null;
  if (isWrestlingVenueDetailPrototypeRoute(currentRoute)) {
    renderWrestlingVenueDetailPrototypeRoute(currentRoute);
    return;
  }

  if (isWrestlingVenuesPrototypeRoute(currentRoute)) {
    renderWrestlingVenuesPrototypeShell();
    return;
  }

  setWrestlingVenuesPrototypeActive(false);
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
  const currentRoute = typeof getRouteFromUrl === "function" ? getRouteFromUrl() : null;
  const route = currentRoute?.name === "wrestling-venue-detail" && normalizeWrestlingVenueId(currentRoute.venueId) === normalizeWrestlingVenueId(venueId)
    ? currentRoute
    : {
      name: "wrestling-venue-detail",
      venueId,
      canonicalUrl: typeof getWrestlingVenueRouteUrl === "function" ? getWrestlingVenueRouteUrl(venueId) : "",
    };
  renderWrestlingVenueDetailPrototypeRoute(route);
  return;

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

function createWrestlingMatchPhotoLightboxTile(photo, index = 0, show = {}, match = {}, options = {}) {
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
  const routeBuilder = typeof options.routeBuilder === "function" ? options.routeBuilder : null;
  tile.dataset.wrestlingLightboxRoute = routeBuilder
    ? routeBuilder(routePhotoId, photo, index)
    : `${matchRoute}/photo/${encodeURIComponent(routePhotoId)}`;
  tile.setAttribute("aria-label", getWrestlingText(photo.label, `Photo ${index + 1}`));
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
  if (route?.name !== "wrestling-lightbox" && route?.name !== "wrestling-match-detail-photo") {
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

  if (route?.name === "wrestling-match-detail-photo") {
    const activePhotoIndex = Number.parseInt(activeTile.dataset.wrestlingPhotoRouteId || activeTile.dataset.wrestlingPhotoId, 10) - 1;
    setWrestlingMatchDossierPhotoPageFromIndex(
      getWrestlingMatchDossierPrototypeSourceShow(route),
      getWrestlingMatchDossierPrototypeSourceMatch(route),
      activePhotoIndex
    );
  }

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
  const isPrototypePhotoRoute = route?.name === "wrestling-match-detail-photo";
  const routeMatchRoute = route?.name === "wrestling-lightbox"
    ? getWrestlingMatchRouteUrlByIds(route.dateKey || route.showId, route.matchRef || route.matchId)
    : "";
  const matchRoute = isPrototypePhotoRoute
    ? getWrestlingMatchDetailPrototypeRouteUrl(route)
    : (routeMatchRoute || wrestlingMatchGalleryShell?.dataset.wrestlingMatchRoute);
  if (
    matchRoute &&
    typeof replaceRouteUrl === "function" &&
    (route?.name === "wrestling-lightbox" || isPrototypePhotoRoute)
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
    shell.classList.toggle("is-wrestling-match-gallery-view", !isPrototypePhotoRoute);
  }
  if (isPrototypePhotoRoute) {
    if (typeof setWrestlingMatchGalleryHidden === "function") {
      setWrestlingMatchGalleryHidden(true);
    } else if (wrestlingMatchGalleryShell) {
      wrestlingMatchGalleryShell.setAttribute("aria-hidden", "true");
      wrestlingMatchGalleryShell.setAttribute("inert", "");
    }
    if (wrestlingMatchDetailPrototypeShell) {
      wrestlingMatchDetailPrototypeShell.classList.remove("is-lightbox-hidden");
      wrestlingMatchDetailPrototypeShell.setAttribute("aria-hidden", "false");
      wrestlingMatchDetailPrototypeShell.removeAttribute("inert");
    }
    if (typeof renderWrestlingMatchDetailPrototypeRoute === "function") {
      renderWrestlingMatchDetailPrototypeRoute({
        name: "wrestling-match-detail",
        showId: getWrestlingMatchDetailRouteShowId(route),
        dateKey: getWrestlingMatchDetailRouteShowId(route),
        matchId: getWrestlingMatchDetailRouteMatchRef(route),
        matchRef: getWrestlingMatchDetailRouteMatchRef(route),
      }, { skipDataRequest: true });
    }
  } else if (typeof setWrestlingMatchGalleryHidden === "function") {
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

function openWrestlingMatchDetailPrototypePhotoRoute(route = getRouteFromUrl(), options = {}) {
  if (
    typeof isWrestlingMatchDetailPhotoRoute === "function" &&
    !isWrestlingMatchDetailPhotoRoute(route)
  ) {
    return false;
  }

  const show = getWrestlingMatchDossierPrototypeSourceShow(route);
  const match = getWrestlingMatchDossierPrototypeSourceMatch(route, show);
  requestWrestlingMatchDossierPrototypePhotoCount(show);
  const photos = getWrestlingMatchDossierPreviewPhotos(match);
  if (!show || !match || photos.length === 0) {
    if (
      !options.skipDataRequest &&
      typeof requestWrestlingShowsData === "function" &&
      wrestlingShowsDataState !== "live" &&
      !wrestlingShowsRequest &&
      !wrestlingShowsDataRequested
    ) {
      requestWrestlingShowsData();
    }
    return false;
  }

  const photoIndex = getWrestlingMatchDossierPrototypePhotoRouteIndex(photos, route.photoId || "001");
  if (photoIndex < 0) {
    setWrestlingMatchDossierPhotoPageFromIndex(show, match, 0);
    if (typeof renderWrestlingMatchDetailPrototypeRoute === "function") {
      renderWrestlingMatchDetailPrototypeRoute(route, { skipDataRequest: true });
    }
    return false;
  }

  const routePhotoId = String(photoIndex + 1).padStart(3, "0");
  setWrestlingMatchDossierPhotoPageFromIndex(show, match, photoIndex);
  if (typeof renderWrestlingMatchDetailPrototypeRoute === "function") {
    renderWrestlingMatchDetailPrototypeRoute(route, { skipDataRequest: true });
  }
  updateWrestlingLightboxRelationshipHooks(
    show.showId || getWrestlingMatchDetailRouteShowId(route),
    getWrestlingMatchRouteRef(match) || getWrestlingMatchDetailRouteMatchRef(route),
    routePhotoId
  );
  openWrestlingMatchPhotoLightbox(photos, photoIndex, null, show, match, {
    returnScroller: wrestlingMatchDetailPrototypeShell,
    routeBuilder: (photoRouteId) => getWrestlingMatchDetailPrototypePhotoRouteUrl(photoRouteId, route, show, match),
    hidePrototypeShell: true,
  });
  return true;
}

function openWrestlingMatchPhotoLightbox(photos, photoIndex, trigger, show, match, options = {}) {
  const lightboxPhotos = (Array.isArray(photos) ? photos : []).filter((photo) => photo?.lightboxSrc || photo?.thumbnailSrc);
  if (
    lightboxPhotos.length === 0 ||
    typeof showLightbox !== "function" ||
    typeof activeLightboxCustomTiles === "undefined"
  ) {
    return;
  }

  const safeIndex = Math.max(0, Math.min(Number.parseInt(photoIndex, 10) || 0, lightboxPhotos.length - 1));
  const returnScroller = options.returnScroller || wrestlingMatchGalleryShell;
  const returnContext = {
    source: "wrestling-match-gallery",
    focusElement: trigger || null,
    scrollTop: returnScroller ? returnScroller.scrollTop : 0,
  };
  activeLightboxCustomTiles = lightboxPhotos.map((photo, index) => createWrestlingMatchPhotoLightboxTile(photo, index, show, match, options));
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
  if (options.hidePrototypeShell && wrestlingMatchDetailPrototypeShell) {
    wrestlingMatchDetailPrototypeShell.classList.add("is-lightbox-hidden");
    wrestlingMatchDetailPrototypeShell.setAttribute("aria-hidden", "true");
    wrestlingMatchDetailPrototypeShell.setAttribute("inert", "");
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
  const activeRoute = typeof getRouteFromUrl === "function" ? getRouteFromUrl() : null;
  if (typeof isWrestlingMatchDetailRoute === "function" && isWrestlingMatchDetailRoute(activeRoute)) {
    if (typeof showWrestlingMatchDetailPrototype === "function") {
      showWrestlingMatchDetailPrototype(activeRoute);
    }
    return;
  }

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

  const activeRoute = typeof getRouteFromUrl === "function" ? getRouteFromUrl() : null;
  if (typeof isWrestlingMatchDetailRoute === "function" && isWrestlingMatchDetailRoute(activeRoute)) {
    if (typeof showWrestlingMatchDetailPrototype === "function") {
      showWrestlingMatchDetailPrototype(activeRoute);
    }
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
  bindHallCrusadesSearchCrystalInteraction();
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