/* =========================================================
   VMPix V3 shell.
   Universal shell behavior, transitions, module state, and event wiring.
   Extracted from the original single-file shell; keep this pass mechanical.
   ========================================================= */

function setCurrentView(viewName) {
  if (currentView) {
    currentView.textContent = viewName;
  }
}

function getShellNavModuleContext(targetName) {
  const routeMeta = getShellRouteMeta(targetName);
  if (!routeMeta) {
    return "shell";
  }

  if (["music", "wrestling", "site", "future"].includes(routeMeta.drawerGroup)) {
    return routeMeta.drawerGroup;
  }

  return routeMeta.moduleType === "future-module" ? "future" : "shell";
}

const siteModuleStaticSurfaces = new WeakMap();

function getSiteModuleIntegrationMeta(scope) {
  if (typeof siteModuleIntegrationPlaceholders === "undefined") {
    return null;
  }

  return siteModuleIntegrationPlaceholders[scope] || null;
}

function captureSiteModuleStaticSurface(surface) {
  if (!surface || siteModuleStaticSurfaces.has(surface)) {
    return;
  }

  siteModuleStaticSurfaces.set(surface, surface.innerHTML);
}

function markSiteModuleDataState(surface, scope, stateName) {
  if (!surface || !stateName) {
    return;
  }

  const meta = getSiteModuleIntegrationMeta(scope);
  surface.dataset.siteModuleState = stateName;
  surface.dataset.siteModuleScope = scope;
  if (meta?.source) {
    surface.dataset.siteModuleSource = meta.source;
  }
}

function restoreSiteModuleStaticSurface(surface) {
  if (!surface) {
    return;
  }

  if (surface.dataset.siteModuleState && siteModuleStaticSurfaces.has(surface)) {
    surface.innerHTML = siteModuleStaticSurfaces.get(surface);
  }

  delete surface.dataset.siteModuleState;
  delete surface.dataset.siteModuleScope;
  delete surface.dataset.siteModuleSource;
}

function appendSiteModulePartialState(surface, scope, renderOptions = {}) {
  if (!surface) {
    return null;
  }

  const existingState = surface.querySelector(`[data-mock-state='partial'][data-mock-scope='${scope}']`);
  if (existingState) {
    return existingState;
  }

  const stateCard = createMockStateCard("partial", scope);
  const wrapperTag = renderOptions.itemTag || "";
  if (!wrapperTag) {
    surface.append(stateCard);
    return stateCard;
  }

  const wrapper = document.createElement(wrapperTag);
  wrapper.className = renderOptions.itemClass || "mock-state-item";
  wrapper.append(stateCard);
  surface.append(wrapper);
  return wrapper;
}

function renderSiteModuleMockState(surface, scope, stateName, renderOptions = {}) {
  if (!surface) {
    return null;
  }

  captureSiteModuleStaticSurface(surface);
  if (!stateName) {
    restoreSiteModuleStaticSurface(surface);
    return null;
  }

  restoreSiteModuleStaticSurface(surface);
  markSiteModuleDataState(surface, scope, stateName);
  if (stateName === "partial" && renderOptions.partialMode === "append") {
    return appendSiteModulePartialState(surface, scope, renderOptions);
  }

  return renderMockState(surface, stateName, scope, renderOptions);
}

const MUSIC_NEXUS_STATS_API_BASE_URL = "https://vmpix-data.onrender.com";
const MUSIC_NEXUS_STATS_TIMEOUT_MS = 8000;
const MUSIC_NEXUS_LIVE_STAT_CONFIG = [
  { key: "bands", route: "/api/music/bands", field: "bandsTotal" },
  { key: "shows", route: "/api/music/shows", field: "showsTotal" },
  { key: "people", route: "/api/music/people", field: "peopleTotal" },
  { key: "venues", route: "/api/music/venues", field: "venuesTotal" },
  { key: "photos", route: "/api/music/bands", field: "photosTotal" },
];

let musicLandingStatsRequest = null;
let musicLandingStatsLoaded = false;
let ringArchiveStatsRequest = null;
let ringArchiveStatsLoaded = false;
const ringArchiveApiPayloadRequests = new Map();

function formatMusicLandingStatValue(value, fallbackValue = "") {
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return numericValue.toLocaleString();
  }

  return String(fallbackValue || value || "");
}

function getMusicLandingStatValueElement(key) {
  return document.querySelector(`[data-music-stat-value='${key}']`);
}

function setMusicLandingStatsState(stateName) {
  const statsSurface = document.querySelector("[data-music-landing-stats]");
  if (!statsSurface) {
    return;
  }

  statsSurface.dataset.statsState = stateName;
  statsSurface.setAttribute("aria-busy", String(stateName === "loading"));
}

function getFallbackMusicLandingStatValue(key) {
  const valueElement = getMusicLandingStatValueElement(key);
  if (!valueElement) {
    return "";
  }

  return formatMusicLandingStatValue(valueElement.dataset.fallbackValue || valueElement.textContent);
}

function setMusicLandingStatValue(key, value, sourceName) {
  const valueElement = getMusicLandingStatValueElement(key);
  if (!valueElement) {
    return;
  }

  const fallbackValue = getFallbackMusicLandingStatValue(key);
  valueElement.textContent = formatMusicLandingStatValue(value, fallbackValue);
  valueElement.dataset.statSource = sourceName;
}

function restoreMusicLandingStatFallback(key) {
  setMusicLandingStatValue(key, getFallbackMusicLandingStatValue(key), "fallback");
}

function readMusicLandingStatField(payload, fieldName) {
  const candidates = [
    payload,
    payload?.stats,
    payload?.meta,
    payload?.meta?.stats,
    payload?.data,
    payload?.data?.stats,
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate) &&
      Object.prototype.hasOwnProperty.call(candidate, fieldName)
    ) {
      return candidate[fieldName];
    }
  }

  if (fieldName.endsWith("Total")) {
    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
        continue;
      }
      if (Object.prototype.hasOwnProperty.call(candidate, "count")) {
        return candidate.count;
      }
      if (Object.prototype.hasOwnProperty.call(candidate, "total")) {
        return candidate.total;
      }
    }
  }

  return undefined;
}

async function fetchMusicLandingStat(statConfig) {
  const apiUrl = new URL(statConfig.route, MUSIC_NEXUS_STATS_API_BASE_URL);
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), MUSIC_NEXUS_STATS_TIMEOUT_MS)
    : 0;

  try {
    const response = await fetch(apiUrl.href, {
      cache: "no-store",
      signal: controller?.signal,
    });
    if (!response.ok) {
      throw new Error(`Music stat request failed: ${statConfig.route} (${response.status})`);
    }

    const payload = await response.json();
    const value = readMusicLandingStatField(payload, statConfig.field);
    if (value === undefined || value === null || value === "") {
      throw new Error(`Music stat field missing: ${statConfig.field}`);
    }

    return value;
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  }
}

function requestMusicLandingStats() {
  const statsSurface = document.querySelector("[data-music-landing-stats]");
  if (!statsSurface || typeof fetch !== "function") {
    return Promise.resolve(false);
  }

  if (musicLandingStatsLoaded) {
    return Promise.resolve(true);
  }
  if (musicLandingStatsRequest) {
    return musicLandingStatsRequest;
  }

  setMusicLandingStatsState("loading");
  musicLandingStatsRequest = Promise.all(
    MUSIC_NEXUS_LIVE_STAT_CONFIG.map((statConfig) => (
      fetchMusicLandingStat(statConfig)
        .then((value) => {
          setMusicLandingStatValue(statConfig.key, value, "live");
          return true;
        })
        .catch(() => {
          restoreMusicLandingStatFallback(statConfig.key);
          return false;
        })
    ))
  ).then((results) => {
    const liveCount = results.filter(Boolean).length;
    const hasPartialFallback = liveCount > 0 && liveCount < MUSIC_NEXUS_LIVE_STAT_CONFIG.length;
    musicLandingStatsLoaded = liveCount === MUSIC_NEXUS_LIVE_STAT_CONFIG.length;
    setMusicLandingStatsState(
      musicLandingStatsLoaded ? "live" : hasPartialFallback ? "partial" : "fallback"
    );
    musicLandingStatsRequest = null;
    return liveCount > 0;
  }).catch(() => {
    MUSIC_NEXUS_LIVE_STAT_CONFIG.forEach((statConfig) => restoreMusicLandingStatFallback(statConfig.key));
    setMusicLandingStatsState("fallback");
    musicLandingStatsRequest = null;
    return false;
  });

  return musicLandingStatsRequest;
}

const RING_ARCHIVE_STATS_API_BASE_URL = MUSIC_NEXUS_STATS_API_BASE_URL;
const RING_ARCHIVE_STATS_TIMEOUT_MS = 8000;
const RING_ARCHIVE_STAT_CONFIG = [
  {
    key: "shows",
    statsRoute: "/api/wrestling/shows/stats",
    dbRoute: "/api/wrestling/shows/db",
    fields: ["showsTotal", "totalShows", "shows_total", "total_shows", "showCount", "show_count", "showsCount", "shows_count", "eventsTotal", "totalEvents", "events_total", "total_events", "total", "count"],
    deriveFromDb: getRingArchiveShowCount,
    emptyValue: 0,
  },
  {
    key: "matches",
    statsRoute: "/api/wrestling/shows/stats",
    dbRoute: "/api/wrestling/shows/db",
    fields: ["matchesTotal", "totalMatches", "matches_total", "total_matches", "matchCount", "match_count", "matchesCount", "matches_count"],
    deriveFromDb: getRingArchiveMatchCount,
    emptyValue: 0,
  },
  {
    key: "people",
    statsRoute: "/api/wrestling/people/stats",
    dbRoute: "/api/wrestling/people/db",
    fields: ["peopleTotal", "totalPeople", "people_total", "total_people", "personCount", "person_count", "peopleCount", "people_count", "total", "count"],
    deriveFromDb: getRingArchiveRowCount,
    emptyValue: 0,
  },
  {
    key: "venues",
    statsRoute: "",
    dbRoute: "/api/wrestling/venues/db",
    fields: ["venuesTotal", "totalVenues", "venues_total", "total_venues", "venueCount", "venue_count", "venuesCount", "venues_count", "total", "count"],
    deriveFromDb: getRingArchiveRowCount,
    emptyValue: 0,
  },
  {
    key: "promotions",
    statsRoute: "/api/wrestling/shows/stats",
    dbRoute: "/api/wrestling/shows/db",
    fields: ["promotionsTotal", "totalPromotions", "promotions_total", "total_promotions", "promotionCount", "promotion_count", "promotionsCount", "promotions_count", "uniquePromotions", "uniquePromotionsTotal", "unique_promotions", "unique_promotions_total", "byPromotion", "by_promotion"],
    deriveFromDb: getRingArchivePromotionCount,
    emptyValue: "N/A",
  },
];

function getRingArchiveStatValueElement(key) {
  return document.querySelector(`[data-ring-archive-stat-value='${key}']`);
}

function setRingArchiveStatsState(stateName) {
  const statsSurface = document.querySelector("[data-ring-archive-stats]");
  if (!statsSurface) {
    return;
  }

  statsSurface.dataset.statsState = stateName;
  statsSurface.setAttribute("aria-busy", String(stateName === "loading"));
}

function formatRingArchiveStatValue(value, fallbackValue = "N/A") {
  const fallbackText = String(fallbackValue ?? "N/A").trim() || "N/A";
  const textValue = String(value ?? "").trim();
  if (!textValue) {
    return fallbackText;
  }

  const numericValue = Number(textValue.replace(/,/g, ""));
  if (Number.isFinite(numericValue)) {
    return numericValue.toLocaleString();
  }

  if (/^(undefined|null|nan)$/i.test(textValue)) {
    return fallbackText;
  }

  return textValue;
}

function setRingArchiveStatValue(key, value, sourceName) {
  const valueElement = getRingArchiveStatValueElement(key);
  if (!valueElement) {
    return;
  }

  valueElement.textContent = formatRingArchiveStatValue(value, valueElement.dataset.emptyValue || "N/A");
  valueElement.dataset.statSource = sourceName;
}

function setRingArchiveStatLoading(key) {
  const valueElement = getRingArchiveStatValueElement(key);
  if (!valueElement) {
    return;
  }

  valueElement.textContent = "...";
  valueElement.dataset.statSource = "loading";
}

function readRingArchiveStatField(payload, fieldNames = []) {
  const candidates = [
    payload,
    payload?.totals,
    payload?.summary,
    payload?.stats,
    payload?.meta,
    payload?.meta?.totals,
    payload?.meta?.stats,
    payload?.data,
    payload?.data?.totals,
    payload?.data?.stats,
    payload?.source,
    payload?.source?.stats,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      continue;
    }

    for (const fieldName of fieldNames) {
      if (Object.prototype.hasOwnProperty.call(candidate, fieldName)) {
        return candidate[fieldName];
      }
    }
  }

  return undefined;
}

function getRingArchivePayloadRows(payload) {
  const candidates = [
    payload?.data,
    payload?.rows,
    payload?.items,
    payload?.results,
    payload?.shows,
    payload?.people,
    payload?.venues,
    payload?.source?.data,
    payload?.source?.rows,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter((row) => row && typeof row === "object");
    }
    if (candidate && typeof candidate === "object") {
      const nestedRows = [
        candidate.data,
        candidate.rows,
        candidate.items,
        candidate.results,
        candidate.shows,
        candidate.people,
        candidate.venues,
      ].find(Array.isArray);
      if (nestedRows) {
        return nestedRows.filter((row) => row && typeof row === "object");
      }
    }
  }

  return [];
}

function getRingArchiveNumericValue(value) {
  if (Array.isArray(value)) {
    return value.length;
  }
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const numericValue = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function getRingArchiveDirectStatValue(payload, fields = []) {
  return getRingArchiveNumericValue(readRingArchiveStatField(payload, fields));
}

function getRingArchiveRowCount(payload) {
  const directCount = getRingArchiveDirectStatValue(payload, ["total", "count"]);
  if (directCount !== undefined) {
    return directCount;
  }

  return getRingArchivePayloadRows(payload).length;
}

function getRingArchiveShowCount(payload) {
  const directCount = getRingArchiveDirectStatValue(payload, ["showsTotal", "totalShows", "shows_total", "total_shows", "showCount", "show_count", "showsCount", "shows_count", "eventsTotal", "totalEvents", "events_total", "total_events", "total", "count"]);
  if (directCount !== undefined) {
    return directCount;
  }

  return getRingArchivePayloadRows(payload).length;
}

function getRingArchiveMatchCount(payload) {
  const directCount = getRingArchiveDirectStatValue(payload, ["matchesTotal", "totalMatches", "matches_total", "total_matches", "matchCount", "match_count", "matchesCount", "matches_count"]);
  if (directCount !== undefined) {
    return directCount;
  }

  const rows = getRingArchivePayloadRows(payload);
  if (rows.length === 0) {
    return undefined;
  }

  return rows.reduce((total, row) => {
    const rowCount = getRingArchiveNumericValue(
      row?.stats?.matchCount ??
      row?.stats?.matchesTotal ??
      row?.matchCount ??
      row?.match_count ??
      row?.matchesCount ??
      row?.matches_count
    );
    if (rowCount !== undefined) {
      return total + rowCount;
    }

    if (Array.isArray(row?.matches)) {
      return total + row.matches.length;
    }
    if (Array.isArray(row?.matchIds)) {
      return total + row.matchIds.length;
    }
    if (Array.isArray(row?.match_ids)) {
      return total + row.match_ids.length;
    }

    return total;
  }, 0);
}

function getRingArchivePromotionValues(row) {
  const directValues = [
    row?.promotion,
    row?.promotionName,
    row?.promotion_name,
    row?.promoter,
    row?.company,
    row?.organization,
    row?.general?.promotion,
  ];
  const arrayValues = [
    row?.promotions,
    row?.promotion_names,
  ].flatMap((value) => Array.isArray(value) ? value : []);

  return [...directValues, ...arrayValues]
    .map((value) => String(value ?? "").trim())
    .filter((value) => value && !/^(n\/a|unknown|undefined|null)$/i.test(value));
}

function getRingArchivePromotionCount(payload) {
  const directCount = getRingArchiveDirectStatValue(payload, ["promotionsTotal", "totalPromotions", "promotions_total", "total_promotions", "promotionCount", "promotion_count", "promotionsCount", "promotions_count", "uniquePromotions", "uniquePromotionsTotal", "unique_promotions", "unique_promotions_total", "byPromotion", "by_promotion"]);
  if (directCount !== undefined) {
    return directCount;
  }

  const promotions = new Set();
  getRingArchivePayloadRows(payload).forEach((row) => {
    getRingArchivePromotionValues(row).forEach((promotion) => {
      promotions.add(promotion.toLowerCase());
    });
  });

  return promotions.size > 0 ? promotions.size : undefined;
}

async function fetchRingArchiveJson(route) {
  if (ringArchiveApiPayloadRequests.has(route)) {
    return ringArchiveApiPayloadRequests.get(route);
  }

  const apiUrl = new URL(route, RING_ARCHIVE_STATS_API_BASE_URL);
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), RING_ARCHIVE_STATS_TIMEOUT_MS)
    : 0;

  const request = fetch(apiUrl.href, {
    cache: "no-store",
    signal: controller?.signal,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Ring Archive stat request failed: ${route} (${response.status})`);
      }

      return response.json();
    })
    .catch((error) => {
      ringArchiveApiPayloadRequests.delete(route);
      throw error;
    })
    .finally(() => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    });

  ringArchiveApiPayloadRequests.set(route, request);
  return request;
}

async function fetchRingArchiveStat(statConfig) {
  let statsPayload = null;
  let hadRequestError = false;

  if (statConfig.statsRoute) {
    try {
      statsPayload = await fetchRingArchiveJson(statConfig.statsRoute);
      const directValue = getRingArchiveDirectStatValue(statsPayload, statConfig.fields);
      if (directValue !== undefined) {
        return { value: directValue, source: "stats" };
      }
    } catch {
      hadRequestError = true;
    }
  }

  try {
    const dbPayload = await fetchRingArchiveJson(statConfig.dbRoute);
    const derivedValue = statConfig.deriveFromDb(dbPayload);
    if (derivedValue !== undefined) {
      return { value: derivedValue, source: "db" };
    }

    return { value: statConfig.emptyValue, source: "missing" };
  } catch {
    if (statsPayload) {
      return { value: statConfig.emptyValue, source: "missing" };
    }
    hadRequestError = true;
  }

  if (hadRequestError) {
    return { value: "N/A", source: "error" };
  }

  return { value: statConfig.emptyValue, source: "missing" };
}

function requestRingArchiveStats() {
  const statsSurface = document.querySelector("[data-ring-archive-stats]");
  if (!statsSurface || typeof fetch !== "function") {
    RING_ARCHIVE_STAT_CONFIG.forEach((statConfig) => {
      setRingArchiveStatValue(statConfig.key, "N/A", "error");
    });
    setRingArchiveStatsState("error");
    return Promise.resolve(false);
  }

  if (ringArchiveStatsLoaded) {
    return Promise.resolve(true);
  }
  if (ringArchiveStatsRequest) {
    return ringArchiveStatsRequest;
  }

  setRingArchiveStatsState("loading");
  RING_ARCHIVE_STAT_CONFIG.forEach((statConfig) => setRingArchiveStatLoading(statConfig.key));

  ringArchiveStatsRequest = Promise.all(
    RING_ARCHIVE_STAT_CONFIG.map((statConfig) => (
      fetchRingArchiveStat(statConfig)
        .then((result) => {
          setRingArchiveStatValue(statConfig.key, result.value, result.source);
          return result.source !== "error";
        })
        .catch(() => {
          setRingArchiveStatValue(statConfig.key, "N/A", "error");
          return false;
        })
    ))
  ).then((results) => {
    const resolvedCount = results.filter(Boolean).length;
    ringArchiveStatsLoaded = resolvedCount === RING_ARCHIVE_STAT_CONFIG.length;
    setRingArchiveStatsState(
      ringArchiveStatsLoaded ? "live" : resolvedCount > 0 ? "partial" : "error"
    );
    ringArchiveStatsRequest = null;
    return resolvedCount > 0;
  }).catch(() => {
    RING_ARCHIVE_STAT_CONFIG.forEach((statConfig) => {
      setRingArchiveStatValue(statConfig.key, "N/A", "error");
    });
    setRingArchiveStatsState("error");
    ringArchiveStatsRequest = null;
    return false;
  });

  return ringArchiveStatsRequest;
}

function updateShellRouteContext(route = getRouteFromUrl(), targetName = "") {
  if (!shell || !route) {
    return;
  }

  const activeTarget = targetName || routeNameToGlobalNavTarget[route.name] || "home";
  const moduleContext = getShellNavModuleContext(activeTarget);
  const isHomeRoute = route.name === "home";
  shell.dataset.shellRoute = route.name;
  shell.dataset.shellActiveTarget = activeTarget;
  shell.dataset.shellModule = moduleContext;
  shell.classList.toggle("is-home-route", isHomeRoute);
  if (bottomRail) {
    bottomRail.dataset.shellRoute = route.name;
    bottomRail.dataset.shellActiveTarget = activeTarget;
    bottomRail.dataset.shellModule = moduleContext;
    bottomRail.hidden = isHomeRoute;
    bottomRail.setAttribute("aria-hidden", String(isHomeRoute));
    if (isHomeRoute) {
      bottomRail.setAttribute("inert", "");
    } else {
      bottomRail.removeAttribute("inert");
    }
  }
}

function getRouteDrilldownBreadcrumbLabel(route) {
  const fallbackLabel = routeNameToDrilldownBreadcrumb[route.name] || "";

  if (route.name === "band-detail" && typeof findBandById === "function") {
    return findBandById(route.bandId)?.name || fallbackLabel;
  }
  if (route.name === "person-detail" && typeof findMusicPersonById === "function") {
    return findMusicPersonById(route.personId)?.name || fallbackLabel;
  }
  if (route.name === "show-detail" && typeof findMusicShowById === "function") {
    return findMusicShowById(route.showId)?.title || fallbackLabel;
  }
  if (route.name === "music-venue-detail" && typeof venueSlugToVenue === "function" && typeof getMusicVenueName === "function") {
    const venue = venueSlugToVenue(route.venueSlug);
    return venue ? getMusicVenueName(venue) : fallbackLabel;
  }
  if (route.name === "wrestling-person-detail" && typeof findWrestlingPersonById === "function") {
    return findWrestlingPersonById(route.personId, { allowFallback: false, includeStatic: false })?.name || fallbackLabel;
  }
  if (route.name === "wrestling-venue-detail" && typeof findWrestlingVenueById === "function") {
    return findWrestlingVenueById(route.venueId, { allowFallback: false })?.name || fallbackLabel;
  }
  if (route.name === "wrestling-show-detail" && typeof getWrestlingDefaultShowRelationship === "function") {
    return getWrestlingDefaultShowRelationship(route.showId)?.eventName || fallbackLabel;
  }
  if (route.name === "wrestling-match-gallery" && typeof getWrestlingDefaultMatchRelationship === "function") {
    return getWrestlingDefaultMatchRelationship(route.matchId, route.showId)?.matchName || fallbackLabel;
  }

  return fallbackLabel;
}

function updateShellBreadcrumb(route) {
  if (!shellBreadcrumb || !shellBreadcrumbList || !route) {
    return;
  }

  const breadcrumbLabels = (routeNameToBreadcrumbTrail[route.name] || ["home"])
    .map((routeId) => getShellRouteMeta(routeId)?.breadcrumbLabel)
    .filter(Boolean);
  const drilldownLabel = getRouteDrilldownBreadcrumbLabel(route);
  if (drilldownLabel) {
    breadcrumbLabels.push(drilldownLabel);
  }

  shellBreadcrumbList.replaceChildren();
  breadcrumbLabels.forEach((label, index) => {
    const item = document.createElement("li");
    const labelElement = document.createElement("span");
    item.className = "shell-breadcrumb-item";
    labelElement.className = "shell-breadcrumb-label";
    labelElement.textContent = label;
    if (index === breadcrumbLabels.length - 1) {
      item.setAttribute("aria-current", "page");
    }
    item.append(labelElement);
    shellBreadcrumbList.append(item);
  });

  shellBreadcrumb.hidden = breadcrumbLabels.length === 0;
  shellBreadcrumb.dataset.breadcrumbDepth = String(breadcrumbLabels.length);
  shellBreadcrumb.setAttribute("aria-label", `Current location: ${breadcrumbLabels.join(" > ")}`);
}

function getShellBackTarget(route = getRouteFromUrl(), historyState = window.history.state || {}) {
  if (!route || route.name === "home") {
    return "";
  }

  if (route.name === "band-detail") {
    return normalizeBandsReturnUrl(historyState.returnUrl || bandsIndexReturnUrl || routeNameToShellBackTarget[route.name]);
  }
  if (route.name === "sets-archive") {
    return historyState.bandUrl || getBandRouteUrl(route.bandId);
  }
  if (route.name === "set-detail") {
    return historyState.setsArchiveUrl || getBandSetsRouteUrl(route.bandId);
  }
  if (route.name === "wrestling-match-gallery") {
    if (typeof getWrestlingShowRouteUrl === "function") {
      return getWrestlingShowRouteUrl(route.dateKey || route.showId || "warzone-26");
    }
    return `${routePaths.wrestlingShows}/${encodeURIComponent(route.dateKey || route.showId || "warzone-26")}`;
  }
  if (route.name === "wrestling-lightbox") {
    const showId = route.dateKey || route.showId || "warzone-26";
    const matchRef = route.matchRef || route.matchId || "1";
    if (typeof getWrestlingMatchRouteUrlByIds === "function") {
      return getWrestlingMatchRouteUrlByIds(showId, matchRef);
    }
    return `${routePaths.wrestlingShows}/${encodeURIComponent(showId)}/match-${encodeURIComponent(matchRef)}`;
  }

  return routeNameToShellBackTarget[route.name] || routePaths.portfolio;
}

function shouldShellBackUseHistory(route = getRouteFromUrl(), historyState = window.history.state || {}) {
  if (!window.history || window.history.length <= 1 || !route) {
    return false;
  }

  return (
    (route.name === "band-detail" && historyState.returnUrl && historyState.fromBandsIndex) ||
    (route.name === "sets-archive" && historyState.bandUrl && historyState.fromBandDetail) ||
    (route.name === "set-detail" && historyState.setsArchiveUrl && historyState.fromSetsArchive) ||
    (route.name === "person-detail" && historyState.fromPeopleIndex) ||
    (route.name === "show-detail" && historyState.fromShowsArchive) ||
    (route.name === "music-venue-detail" && historyState.fromMusicVenuesIndex) ||
    (route.name === "wrestling-person-detail" && historyState.fromWrestlingPeopleIndex) ||
    (route.name === "wrestling-venue-detail" && historyState.fromWrestlingVenuesIndex)
  );
}

function getShellBackLabel(targetUrl) {
  if (!targetUrl) {
    return "";
  }

  const targetRoute = getRouteFromUrl(targetUrl);
  const targetId = routeNameToGlobalNavTarget[targetRoute.name];
  const targetMeta = targetId ? getShellRouteMeta(targetId) : null;
  return targetMeta?.breadcrumbLabel || targetMeta?.label || "Previous";
}

function updateShellBackState(route = getRouteFromUrl()) {
  if (!shellBackButton) {
    return;
  }

  const targetUrl = getShellBackTarget(route);
  const isDisabled = !targetUrl;
  shellBackButton.disabled = isDisabled;
  shellBackButton.setAttribute("aria-disabled", String(isDisabled));
  shellBackButton.dataset.shellBackTarget = targetUrl;
  shellBackButton.setAttribute("aria-label", isDisabled ? "Back unavailable" : `Back to ${getShellBackLabel(targetUrl)}`);
}

function performShellBack() {
  if (!shellBackButton || shellBackButton.disabled || shellBackButton.getAttribute("aria-disabled") === "true") {
    return;
  }

  const route = getRouteFromUrl();
  const historyState = window.history.state || {};
  if (shouldShellBackUseHistory(route, historyState)) {
    window.history.back();
    return;
  }

  const targetUrl = getShellBackTarget(route, historyState);
  if (targetUrl) {
    navigateToRoute(targetUrl, { shouldFocusBandsView: route.name === "band-detail" });
  }
}

function getShellRouteMeta(routeId) {
  return shellRouteRegistryById.get(routeId) || null;
}

function createGlobalMenuButton(routeMeta) {
  const button = document.createElement("button");
  const buttonClasses = ["v3-card", "v3-card--mini", "global-menu-button"];

  if (!routeMeta.futurePlaceholder && routeMeta.route) {
    buttonClasses.push("v3-card--interactive");
  }
  if (routeMeta.drawerVariant) {
    buttonClasses.push(`global-menu-button--${routeMeta.drawerVariant}`);
  }

  button.className = buttonClasses.join(" ");
  button.type = "button";
  button.dataset.globalNavTarget = routeMeta.id;
  button.dataset.globalNavModuleType = routeMeta.moduleType;
  button.dataset.globalNavParent = routeMeta.parentSection;
  button.dataset.globalNavBreadcrumb = routeMeta.breadcrumbLabel;
  button.dataset.globalNavBottomRail = String(Boolean(routeMeta.bottomRailEligible));
  if (routeMeta.route) {
    button.dataset.globalNavRoute = routeMeta.route;
  }
  if (routeMeta.futurePlaceholder || !routeMeta.route) {
    button.setAttribute("aria-disabled", "true");
  }
  button.textContent = routeMeta.label;

  return button;
}

function renderGlobalMenu() {
  if (!globalMenuActions) {
    return;
  }

  globalMenuActions.replaceChildren();
  const visibleRoutes = globalDrawerRouteIds
    .map((routeId) => getShellRouteMeta(routeId))
    .filter(Boolean);

  const list = document.createElement("div");
  list.className = "global-menu-list";
  visibleRoutes.forEach((routeMeta) => {
    list.append(createGlobalMenuButton(routeMeta));
  });

  globalMenuActions.append(list);
  globalNavButtons = document.querySelectorAll("[data-global-nav-target]");
}

function setShellLogoFallback(isFallback) {
  if (bottomRail) {
    bottomRail.classList.toggle("is-logo-fallback", isFallback);
  }
}

function initShellRailLogo() {
  const logoVideo = document.querySelector("[data-shell-logo-video]");
  const logoFallback = document.querySelector("[data-shell-logo-fallback]");
  if (!logoVideo || !logoFallback) {
    return;
  }

  const updateLogoMode = () => {
    const shouldUseFallback = reducedMotion.matches || logoVideo.error;
    setShellLogoFallback(Boolean(shouldUseFallback));
    if (shouldUseFallback) {
      logoVideo.pause();
      return;
    }

    const playResult = logoVideo.play();
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(() => setShellLogoFallback(true));
    }
  };

  logoVideo.addEventListener("error", () => setShellLogoFallback(true));
  logoVideo.addEventListener("canplay", updateLogoMode, { once: true });
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", updateLogoMode);
  }
  updateLogoMode();
}

function setActiveGlobalNav(targetName) {
  updateShellRouteContext(getRouteFromUrl(), targetName);
  globalNavButtons.forEach((button) => {
    const isCurrent = button.dataset.globalNavTarget === targetName;
    if (isCurrent) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}

function setActiveGlobalNavForRoute(routeName) {
  setActiveGlobalNav(routeNameToGlobalNavTarget[routeName] || "home");
}

function setSpotlight(moduleName) {
  if (!spotlightCopy || !spotlightTags) {
    return;
  }

  const content = spotlightContent[moduleName] || spotlightContent.future;
  spotlightCopy.textContent = content.copy;
  spotlightTags.replaceChildren();
  content.tags.forEach((tagText) => {
    const tag = document.createElement("span");
    tag.className = "v3-card v3-card--state spotlight-tag";
    tag.textContent = tagText;
    spotlightTags.append(tag);
  });
}

function centerCardInScroller(card, scroller) {
  if (!card || !scroller) {
    return;
  }

  const maxLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
  const targetLeft = card.offsetLeft - (scroller.clientWidth - card.offsetWidth) / 2;
  scroller.scrollTo({
    left: Math.max(0, Math.min(targetLeft, maxLeft)),
    behavior: reducedMotion.matches ? "auto" : "smooth",
  });
}

function getCenteredHubCard() {
  if (!hubCarousel) {
    return null;
  }

  const cards = Array.from(hubCarousel.querySelectorAll("[data-module-card]"));
  if (cards.length === 0) {
    return null;
  }

  const carouselRect = hubCarousel.getBoundingClientRect();
  const carouselCenter = carouselRect.left + carouselRect.width / 2;
  let nearestCard = cards[0];
  let nearestDistance = Number.POSITIVE_INFINITY;

  cards.forEach((card) => {
    const cardRect = card.getBoundingClientRect();
    const cardCenter = cardRect.left + cardRect.width / 2;
    const distance = Math.abs(carouselCenter - cardCenter);
    if (distance < nearestDistance) {
      nearestCard = card;
      nearestDistance = distance;
    }
  });

  return nearestCard;
}

function syncSpotlightFromCarousel() {
  const nearestCard = getCenteredHubCard();
  if (!nearestCard) {
    return;
  }

  setSpotlight(nearestCard.dataset.moduleState === "active" ? nearestCard.dataset.moduleCard : "future");
}

function scheduleSpotlightSync() {
  if (spotlightFrame) {
    return;
  }

  spotlightFrame = window.requestAnimationFrame(() => {
    spotlightFrame = 0;
    syncSpotlightFromCarousel();
  });
}

function syncAmbientMotion() {
  if (!fireVideo) {
    return;
  }

  if (reducedMotion.matches) {
    fireVideo.pause();
    return;
  }

  const playback = fireVideo.play();
  if (playback && typeof playback.catch === "function") {
    playback.catch(() => {});
  }
}

function setHubChromeHidden(isHidden) {
  [hubCarousel, hubContext].forEach((element) => {
    if (!element) {
      return;
    }

    element.setAttribute("aria-hidden", String(isHidden));
    if (isHidden) {
      element.setAttribute("inert", "");
    } else {
      element.removeAttribute("inert");
    }
  });
}

function setWrestlingShowsHidden(isHidden) {
  if (!wrestlingShowsShell) {
    return;
  }

  wrestlingShowsShell.setAttribute("aria-hidden", String(isHidden));
  if (isHidden) {
    wrestlingShowsShell.setAttribute("inert", "");
  } else {
    wrestlingShowsShell.removeAttribute("inert");
  }
}

function setWrestlingPeopleHidden(isHidden) {
  if (!wrestlingPeopleShell) {
    return;
  }

  wrestlingPeopleShell.setAttribute("aria-hidden", String(isHidden));
  if (isHidden) {
    wrestlingPeopleShell.setAttribute("inert", "");
  } else {
    wrestlingPeopleShell.removeAttribute("inert");
  }
}

function setWrestlingPersonDetailHidden(isHidden) {
  if (!wrestlingPersonDetailShell) {
    return;
  }

  wrestlingPersonDetailShell.setAttribute("aria-hidden", String(isHidden));
  if (isHidden) {
    wrestlingPersonDetailShell.setAttribute("inert", "");
  } else {
    wrestlingPersonDetailShell.removeAttribute("inert");
  }
}

function setWrestlingVenuesHidden(isHidden) {
  if (!wrestlingVenuesShell) {
    return;
  }

  if (shell && isHidden) {
    shell.classList.remove("is-wrestling-venues-view");
  }
  setWrestlingVenueDetailHidden(true);
  wrestlingVenuesShell.setAttribute("aria-hidden", String(isHidden));
  if (isHidden) {
    wrestlingVenuesShell.setAttribute("inert", "");
  } else {
    wrestlingVenuesShell.removeAttribute("inert");
  }
}

function setWrestlingVenueDetailHidden(isHidden) {
  if (!wrestlingVenueDetailShell) {
    return;
  }

  if (shell && isHidden) {
    shell.classList.remove("is-wrestling-venue-detail-view");
  } else if (shell) {
    shell.classList.add("is-wrestling-venue-detail-view");
  }
  wrestlingVenueDetailShell.setAttribute("aria-hidden", String(isHidden));
  if (isHidden) {
    wrestlingVenueDetailShell.setAttribute("inert", "");
  } else {
    wrestlingVenueDetailShell.removeAttribute("inert");
  }
}

function setWrestlingShowDetailHidden(isHidden) {
  if (!wrestlingShowDetailShell) {
    return;
  }

  wrestlingShowDetailShell.setAttribute("aria-hidden", String(isHidden));
  if (isHidden) {
    wrestlingShowDetailShell.setAttribute("inert", "");
  } else {
    wrestlingShowDetailShell.removeAttribute("inert");
  }
}

function setWrestlingMatchGalleryHidden(isHidden) {
  if (!wrestlingMatchGalleryShell) {
    return;
  }

  wrestlingMatchGalleryShell.setAttribute("aria-hidden", String(isHidden));
  if (isHidden) {
    wrestlingMatchGalleryShell.setAttribute("inert", "");
  } else {
    wrestlingMatchGalleryShell.removeAttribute("inert");
  }
}

function setWrestlingLightboxHidden(isHidden) {
  if (!wrestlingLightboxShell) {
    return;
  }

  wrestlingLightboxShell.setAttribute("aria-hidden", String(isHidden));
  if (isHidden) {
    wrestlingLightboxShell.setAttribute("inert", "");
  } else {
    wrestlingLightboxShell.removeAttribute("inert");
  }
}

function showPortfolioHubView() {
  if (!shell) {
    return;
  }

  shell.classList.remove("is-module-view", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
  if (modulePlaceholder) {
    modulePlaceholder.setAttribute("aria-hidden", "true");
    modulePlaceholder.setAttribute("inert", "");
  }
  if (musicNexusShell) {
    musicNexusShell.setAttribute("aria-hidden", "true");
    musicNexusShell.setAttribute("inert", "");
  }
  if (ringArchiveShell) {
    ringArchiveShell.setAttribute("aria-hidden", "true");
    ringArchiveShell.setAttribute("inert", "");
  }
  setWrestlingShowsHidden(true);
  setWrestlingPeopleHidden(true);
  setWrestlingPersonDetailHidden(true);
  setWrestlingVenuesHidden(true);
  setWrestlingShowDetailHidden(true);
  setWrestlingMatchGalleryHidden(true);
  setWrestlingLightboxHidden(true);
  if (aboutShell) {
    aboutShell.setAttribute("aria-hidden", "true");
    aboutShell.setAttribute("inert", "");
  }
  if (calendarShell) {
    calendarShell.setAttribute("aria-hidden", "true");
    calendarShell.setAttribute("inert", "");
  }
  if (contactShell) {
    contactShell.setAttribute("aria-hidden", "true");
    contactShell.setAttribute("inert", "");
  }
  setHubChromeHidden(false);
  setCurrentView("Interactive Portfolio");
  setActiveGlobalNav("portfolio");
}

function showMusicNexus(options = {}) {
  if (!shell || !portfolioHub || !musicNexusShell) {
    return;
  }

  window.clearTimeout(activationTimer);
  clearPortfolioArrivalState();
  clearPortfolioOrientationState();
  clearPortfolioDirectArrivalState();
  shell.classList.remove("is-activating", "is-reduced-activation", "is-placeholder-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
  shell.classList.add("has-entered-hub", "is-module-view", "is-music-nexus-view");
  if (homeFrame) {
    homeFrame.setAttribute("aria-hidden", "true");
  }
  portfolioHub.setAttribute("aria-hidden", "false");
  portfolioHub.removeAttribute("inert");
  if (modulePlaceholder) {
    modulePlaceholder.setAttribute("aria-hidden", "true");
    modulePlaceholder.setAttribute("inert", "");
  }
  musicNexusShell.setAttribute("aria-hidden", "false");
  musicNexusShell.removeAttribute("inert");
  if (ringArchiveShell) {
    ringArchiveShell.setAttribute("aria-hidden", "true");
    ringArchiveShell.setAttribute("inert", "");
  }
  setWrestlingShowsHidden(true);
  setWrestlingPeopleHidden(true);
  setWrestlingPersonDetailHidden(true);
  setWrestlingVenuesHidden(true);
  setWrestlingShowDetailHidden(true);
  setWrestlingMatchGalleryHidden(true);
  setWrestlingLightboxHidden(true);
  if (aboutShell) {
    aboutShell.setAttribute("aria-hidden", "true");
    aboutShell.setAttribute("inert", "");
  }
  if (calendarShell) {
    calendarShell.setAttribute("aria-hidden", "true");
    calendarShell.setAttribute("inert", "");
  }
  if (contactShell) {
    contactShell.setAttribute("aria-hidden", "true");
    contactShell.setAttribute("inert", "");
  }
  setHubChromeHidden(true);
  const initialSection = options.initialSection || "landing";
  if (initialSection === "landing" && typeof showMusicNexusLanding === "function") {
    showMusicNexusLanding({ shouldScroll: false });
    requestMusicLandingStats();
  } else {
    setMusicNexusContext(initialSection, false, false);
    if (initialSection === "bands") {
      showBandsIndexView({ shouldScroll: false, shouldUpdateRail: false });
    }
  }
  setCurrentView(options.currentView || "Music Nexus");
  setActiveGlobalNav(options.globalNavTarget || "music");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function showRingArchive() {
  if (!shell || !portfolioHub || !ringArchiveShell) {
    return;
  }

  window.clearTimeout(activationTimer);
  clearPortfolioArrivalState();
  clearPortfolioOrientationState();
  clearPortfolioDirectArrivalState();
  shell.classList.remove("is-activating", "is-reduced-activation", "is-placeholder-view", "is-music-nexus-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
  shell.classList.add("has-entered-hub", "is-module-view", "is-ring-archive-view");
  if (homeFrame) {
    homeFrame.setAttribute("aria-hidden", "true");
  }
  portfolioHub.setAttribute("aria-hidden", "false");
  portfolioHub.removeAttribute("inert");
  if (modulePlaceholder) {
    modulePlaceholder.setAttribute("aria-hidden", "true");
    modulePlaceholder.setAttribute("inert", "");
  }
  if (musicNexusShell) {
    musicNexusShell.setAttribute("aria-hidden", "true");
    musicNexusShell.setAttribute("inert", "");
  }
  ringArchiveShell.setAttribute("aria-hidden", "false");
  ringArchiveShell.removeAttribute("inert");
  setWrestlingShowsHidden(true);
  setWrestlingPeopleHidden(true);
  setWrestlingPersonDetailHidden(true);
  setWrestlingVenuesHidden(true);
  setWrestlingShowDetailHidden(true);
  setWrestlingMatchGalleryHidden(true);
  setWrestlingLightboxHidden(true);
  if (aboutShell) {
    aboutShell.setAttribute("aria-hidden", "true");
    aboutShell.setAttribute("inert", "");
  }
  if (calendarShell) {
    calendarShell.setAttribute("aria-hidden", "true");
    calendarShell.setAttribute("inert", "");
  }
  if (contactShell) {
    contactShell.setAttribute("aria-hidden", "true");
    contactShell.setAttribute("inert", "");
  }
  setHubChromeHidden(true);
  setCurrentView("Ring Archive");
  setActiveGlobalNav("wrestling");
  requestRingArchiveStats();
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function showWrestlingPeopleIndex() {
  if (!shell || !portfolioHub || !wrestlingPeopleShell) {
    return;
  }

  window.clearTimeout(activationTimer);
  shell.classList.remove("is-activating", "is-reduced-activation", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
  shell.classList.add("has-entered-hub", "is-module-view", "is-wrestling-people-view");
  if (homeFrame) {
    homeFrame.setAttribute("aria-hidden", "true");
  }
  portfolioHub.setAttribute("aria-hidden", "false");
  portfolioHub.removeAttribute("inert");
  if (modulePlaceholder) {
    modulePlaceholder.setAttribute("aria-hidden", "true");
    modulePlaceholder.setAttribute("inert", "");
  }
  if (musicNexusShell) {
    musicNexusShell.setAttribute("aria-hidden", "true");
    musicNexusShell.setAttribute("inert", "");
  }
  if (ringArchiveShell) {
    ringArchiveShell.setAttribute("aria-hidden", "true");
    ringArchiveShell.setAttribute("inert", "");
  }
  setWrestlingShowsHidden(true);
  setWrestlingPeopleHidden(false);
  setWrestlingPersonDetailHidden(true);
  setWrestlingVenuesHidden(true);
  setWrestlingShowDetailHidden(true);
  setWrestlingMatchGalleryHidden(true);
  setWrestlingLightboxHidden(true);
  if (aboutShell) {
    aboutShell.setAttribute("aria-hidden", "true");
    aboutShell.setAttribute("inert", "");
  }
  if (calendarShell) {
    calendarShell.setAttribute("aria-hidden", "true");
    calendarShell.setAttribute("inert", "");
  }
  if (contactShell) {
    contactShell.setAttribute("aria-hidden", "true");
    contactShell.setAttribute("inert", "");
  }
  setHubChromeHidden(true);
  if (typeof renderWrestlingPeopleIndex === "function") {
    renderWrestlingPeopleIndex();
  }
  if (typeof wrestlingPeopleShell.scrollTo === "function") {
    wrestlingPeopleShell.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }
  setCurrentView("Wrestling People");
  setActiveGlobalNav("wrestling");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function showWrestlingPersonDetail(personId) {
  if (!shell || !portfolioHub || !wrestlingPersonDetailShell) {
    return;
  }

  window.clearTimeout(activationTimer);
  shell.classList.remove("is-activating", "is-reduced-activation", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
  shell.classList.add("has-entered-hub", "is-module-view", "is-wrestling-person-detail-view");
  if (homeFrame) {
    homeFrame.setAttribute("aria-hidden", "true");
  }
  portfolioHub.setAttribute("aria-hidden", "false");
  portfolioHub.removeAttribute("inert");
  if (modulePlaceholder) {
    modulePlaceholder.setAttribute("aria-hidden", "true");
    modulePlaceholder.setAttribute("inert", "");
  }
  if (musicNexusShell) {
    musicNexusShell.setAttribute("aria-hidden", "true");
    musicNexusShell.setAttribute("inert", "");
  }
  if (ringArchiveShell) {
    ringArchiveShell.setAttribute("aria-hidden", "true");
    ringArchiveShell.setAttribute("inert", "");
  }
  setWrestlingShowsHidden(true);
  setWrestlingPeopleHidden(true);
  setWrestlingPersonDetailHidden(false);
  setWrestlingVenuesHidden(true);
  setWrestlingShowDetailHidden(true);
  setWrestlingMatchGalleryHidden(true);
  setWrestlingLightboxHidden(true);
  if (aboutShell) {
    aboutShell.setAttribute("aria-hidden", "true");
    aboutShell.setAttribute("inert", "");
  }
  if (calendarShell) {
    calendarShell.setAttribute("aria-hidden", "true");
    calendarShell.setAttribute("inert", "");
  }
  if (contactShell) {
    contactShell.setAttribute("aria-hidden", "true");
    contactShell.setAttribute("inert", "");
  }
  setHubChromeHidden(true);
  if (typeof renderWrestlingPersonDetailRoute === "function") {
    renderWrestlingPersonDetailRoute(personId);
  }
  if (typeof wrestlingPersonDetailShell.scrollTo === "function") {
    wrestlingPersonDetailShell.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }
  setCurrentView("Person Detail");
  setActiveGlobalNav("wrestling");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function showWrestlingVenuesIndex() {
  if (!shell || !portfolioHub || !wrestlingVenuesShell) {
    return;
  }

  window.clearTimeout(activationTimer);
  shell.classList.remove("is-activating", "is-reduced-activation", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
  shell.classList.add("has-entered-hub", "is-module-view", "is-wrestling-venues-view");
  if (homeFrame) {
    homeFrame.setAttribute("aria-hidden", "true");
  }
  portfolioHub.setAttribute("aria-hidden", "false");
  portfolioHub.removeAttribute("inert");
  if (modulePlaceholder) {
    modulePlaceholder.setAttribute("aria-hidden", "true");
    modulePlaceholder.setAttribute("inert", "");
  }
  if (musicNexusShell) {
    musicNexusShell.setAttribute("aria-hidden", "true");
    musicNexusShell.setAttribute("inert", "");
  }
  if (ringArchiveShell) {
    ringArchiveShell.setAttribute("aria-hidden", "true");
    ringArchiveShell.setAttribute("inert", "");
  }
  setWrestlingShowsHidden(true);
  setWrestlingPeopleHidden(true);
  setWrestlingPersonDetailHidden(true);
  setWrestlingVenuesHidden(false);
  setWrestlingShowDetailHidden(true);
  setWrestlingMatchGalleryHidden(true);
  setWrestlingLightboxHidden(true);
  if (aboutShell) {
    aboutShell.setAttribute("aria-hidden", "true");
    aboutShell.setAttribute("inert", "");
  }
  if (calendarShell) {
    calendarShell.setAttribute("aria-hidden", "true");
    calendarShell.setAttribute("inert", "");
  }
  if (contactShell) {
    contactShell.setAttribute("aria-hidden", "true");
    contactShell.setAttribute("inert", "");
  }
  setHubChromeHidden(true);
  if (typeof renderWrestlingVenuesIndex === "function") {
    renderWrestlingVenuesIndex();
  }
  if (typeof wrestlingVenuesShell.scrollTo === "function") {
    wrestlingVenuesShell.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }
  setCurrentView("Wrestling Venues");
  setActiveGlobalNav("wrestling");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function showWrestlingVenueDetail(venueId) {
  if (!shell || !portfolioHub || !wrestlingVenueDetailShell) {
    return;
  }

  window.clearTimeout(activationTimer);
  shell.classList.remove("is-activating", "is-reduced-activation", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-venues-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
  shell.classList.add("has-entered-hub", "is-module-view", "is-wrestling-venue-detail-view");
  if (homeFrame) {
    homeFrame.setAttribute("aria-hidden", "true");
  }
  portfolioHub.setAttribute("aria-hidden", "false");
  portfolioHub.removeAttribute("inert");
  if (modulePlaceholder) {
    modulePlaceholder.setAttribute("aria-hidden", "true");
    modulePlaceholder.setAttribute("inert", "");
  }
  if (musicNexusShell) {
    musicNexusShell.setAttribute("aria-hidden", "true");
    musicNexusShell.setAttribute("inert", "");
  }
  if (ringArchiveShell) {
    ringArchiveShell.setAttribute("aria-hidden", "true");
    ringArchiveShell.setAttribute("inert", "");
  }
  setWrestlingShowsHidden(true);
  setWrestlingPeopleHidden(true);
  setWrestlingPersonDetailHidden(true);
  setWrestlingVenuesHidden(true);
  setWrestlingVenueDetailHidden(false);
  setWrestlingShowDetailHidden(true);
  setWrestlingMatchGalleryHidden(true);
  setWrestlingLightboxHidden(true);
  if (aboutShell) {
    aboutShell.setAttribute("aria-hidden", "true");
    aboutShell.setAttribute("inert", "");
  }
  if (calendarShell) {
    calendarShell.setAttribute("aria-hidden", "true");
    calendarShell.setAttribute("inert", "");
  }
  if (contactShell) {
    contactShell.setAttribute("aria-hidden", "true");
    contactShell.setAttribute("inert", "");
  }
  setHubChromeHidden(true);
  if (typeof renderWrestlingVenueDetailRoute === "function") {
    renderWrestlingVenueDetailRoute(venueId);
  }
  if (typeof wrestlingVenueDetailShell.scrollTo === "function") {
    wrestlingVenueDetailShell.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }
  setCurrentView("Venue Detail");
  setActiveGlobalNav("wrestling");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function showWrestlingShowsIndex() {
  if (!shell || !portfolioHub || !wrestlingShowsShell) {
    return;
  }

  window.clearTimeout(activationTimer);
  shell.classList.remove("is-activating", "is-reduced-activation", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
  shell.classList.add("has-entered-hub", "is-module-view", "is-wrestling-shows-view");
  if (homeFrame) {
    homeFrame.setAttribute("aria-hidden", "true");
  }
  portfolioHub.setAttribute("aria-hidden", "false");
  portfolioHub.removeAttribute("inert");
  if (modulePlaceholder) {
    modulePlaceholder.setAttribute("aria-hidden", "true");
    modulePlaceholder.setAttribute("inert", "");
  }
  if (musicNexusShell) {
    musicNexusShell.setAttribute("aria-hidden", "true");
    musicNexusShell.setAttribute("inert", "");
  }
  if (ringArchiveShell) {
    ringArchiveShell.setAttribute("aria-hidden", "true");
    ringArchiveShell.setAttribute("inert", "");
  }
  setWrestlingShowsHidden(false);
  setWrestlingPeopleHidden(true);
  setWrestlingPersonDetailHidden(true);
  setWrestlingVenuesHidden(true);
  setWrestlingShowDetailHidden(true);
  setWrestlingMatchGalleryHidden(true);
  setWrestlingLightboxHidden(true);
  if (typeof renderWrestlingShowsArchive === "function") {
    renderWrestlingShowsArchive();
  }
  if (aboutShell) {
    aboutShell.setAttribute("aria-hidden", "true");
    aboutShell.setAttribute("inert", "");
  }
  if (calendarShell) {
    calendarShell.setAttribute("aria-hidden", "true");
    calendarShell.setAttribute("inert", "");
  }
  if (contactShell) {
    contactShell.setAttribute("aria-hidden", "true");
    contactShell.setAttribute("inert", "");
  }
  setHubChromeHidden(true);
  setCurrentView("Event Archive");
  setActiveGlobalNav("wrestling");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function showWrestlingShowDetail(showId = "warzone-26") {
  if (!shell || !portfolioHub || !wrestlingShowDetailShell) {
    return;
  }

  window.clearTimeout(activationTimer);
  shell.classList.remove("is-activating", "is-reduced-activation", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
  shell.classList.add("has-entered-hub", "is-module-view", "is-wrestling-show-detail-view");
  if (homeFrame) {
    homeFrame.setAttribute("aria-hidden", "true");
  }
  portfolioHub.setAttribute("aria-hidden", "false");
  portfolioHub.removeAttribute("inert");
  if (modulePlaceholder) {
    modulePlaceholder.setAttribute("aria-hidden", "true");
    modulePlaceholder.setAttribute("inert", "");
  }
  if (musicNexusShell) {
    musicNexusShell.setAttribute("aria-hidden", "true");
    musicNexusShell.setAttribute("inert", "");
  }
  if (ringArchiveShell) {
    ringArchiveShell.setAttribute("aria-hidden", "true");
    ringArchiveShell.setAttribute("inert", "");
  }
  setWrestlingShowsHidden(true);
  setWrestlingPeopleHidden(true);
  setWrestlingPersonDetailHidden(true);
  setWrestlingVenuesHidden(true);
  if (typeof renderWrestlingShowDetailRoute === "function") {
    renderWrestlingShowDetailRoute(showId);
  }
  setWrestlingShowDetailHidden(false);
  setWrestlingMatchGalleryHidden(true);
  setWrestlingLightboxHidden(true);
  if (aboutShell) {
    aboutShell.setAttribute("aria-hidden", "true");
    aboutShell.setAttribute("inert", "");
  }
  if (calendarShell) {
    calendarShell.setAttribute("aria-hidden", "true");
    calendarShell.setAttribute("inert", "");
  }
  if (contactShell) {
    contactShell.setAttribute("aria-hidden", "true");
    contactShell.setAttribute("inert", "");
  }
  setHubChromeHidden(true);
  if (typeof renderWrestlingShowDetailRoute !== "function" && typeof updateWrestlingShowDetailRelationshipHooks === "function") {
    updateWrestlingShowDetailRelationshipHooks(showId);
  }
  setCurrentView("Show Detail");
  setActiveGlobalNav("wrestling");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function showWrestlingMatchGallery(showId = "warzone-26", matchId = "daron-richardson-vs-bear-bronson") {
  if (!shell || !portfolioHub || !wrestlingMatchGalleryShell) {
    return;
  }

  if (typeof setLightboxVisible === "function") {
    setLightboxVisible(false);
  }
  if (typeof setWrestlingMatchLightboxRouteSyncActive === "function") {
    setWrestlingMatchLightboxRouteSyncActive(false);
  }
  window.clearTimeout(activationTimer);
  shell.classList.remove("is-activating", "is-reduced-activation", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
  shell.classList.add("has-entered-hub", "is-module-view", "is-wrestling-match-gallery-view");
  if (homeFrame) {
    homeFrame.setAttribute("aria-hidden", "true");
  }
  portfolioHub.setAttribute("aria-hidden", "false");
  portfolioHub.removeAttribute("inert");
  if (modulePlaceholder) {
    modulePlaceholder.setAttribute("aria-hidden", "true");
    modulePlaceholder.setAttribute("inert", "");
  }
  if (musicNexusShell) {
    musicNexusShell.setAttribute("aria-hidden", "true");
    musicNexusShell.setAttribute("inert", "");
  }
  if (ringArchiveShell) {
    ringArchiveShell.setAttribute("aria-hidden", "true");
    ringArchiveShell.setAttribute("inert", "");
  }
  setWrestlingShowsHidden(true);
  setWrestlingPeopleHidden(true);
  setWrestlingPersonDetailHidden(true);
  setWrestlingVenuesHidden(true);
  setWrestlingShowDetailHidden(true);
  setWrestlingMatchGalleryHidden(false);
  setWrestlingLightboxHidden(true);
  if (aboutShell) {
    aboutShell.setAttribute("aria-hidden", "true");
    aboutShell.setAttribute("inert", "");
  }
  if (calendarShell) {
    calendarShell.setAttribute("aria-hidden", "true");
    calendarShell.setAttribute("inert", "");
  }
  if (contactShell) {
    contactShell.setAttribute("aria-hidden", "true");
    contactShell.setAttribute("inert", "");
  }
  setHubChromeHidden(true);
  if (typeof updateWrestlingMatchGalleryRelationshipHooks === "function") {
    updateWrestlingMatchGalleryRelationshipHooks(showId, matchId);
  }
  setCurrentView("Match Gallery");
  setActiveGlobalNav("wrestling");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function getWrestlingPhotoIdFromNumber(photoNumber) {
  return String(Math.min(Math.max(photoNumber, 1), 48)).padStart(3, "0");
}

function getWrestlingPhotoNumber(photoId) {
  const photoNumber = Number.parseInt(photoId, 10);
  if (Number.isNaN(photoNumber)) {
    return 12;
  }

  return Math.min(Math.max(photoNumber, 1), 48);
}

function navigateToWrestlingPhoto(photoNumber) {
  const showRoute = wrestlingLightboxShell?.dataset.wrestlingShowRoute ||
    wrestlingMatchGalleryShell?.dataset.wrestlingShowRoute ||
    "";
  const fallbackShowId = wrestlingLightboxShell?.dataset.wrestlingShowId ||
    wrestlingLightboxShell?.dataset.showId ||
    wrestlingMatchGalleryShell?.dataset.wrestlingShowId ||
    "warzone-26";
  const showId = showRoute
    ? showRoute.replace(/\/$/, "")
    : `${routePaths.wrestlingShows}/${encodeURIComponent(fallbackShowId)}`;
  const matchRef = wrestlingLightboxShell?.dataset.wrestlingMatchRef ||
    wrestlingMatchGalleryShell?.dataset.wrestlingMatchRef ||
    wrestlingLightboxShell?.dataset.wrestlingMatchId ||
    wrestlingLightboxShell?.dataset.matchId ||
    wrestlingMatchGalleryShell?.dataset.wrestlingMatchId ||
    "1";

  const matchRoute = typeof getWrestlingMatchRouteUrlByIds === "function"
    ? getWrestlingMatchRouteUrlByIds(showId.replace(`${routePaths.wrestlingShows}/`, ""), matchRef)
    : `${showId}/match-${encodeURIComponent(matchRef)}`;
  navigateToRoute(`${matchRoute}/photo/${getWrestlingPhotoIdFromNumber(photoNumber)}`);
}

function showWrestlingLightbox(showId, matchId, photoId) {
  if (!shell || !portfolioHub || !wrestlingLightboxShell) {
    return;
  }

  const activeShowId = showId || "warzone-26";
  const activeMatchId = matchId || "daron-richardson-vs-bear-bronson";
  if (
    typeof openWrestlingMatchPhotoRouteLightbox === "function" &&
    openWrestlingMatchPhotoRouteLightbox(activeShowId, activeMatchId, photoId || "001")
  ) {
    return;
  }

  const photoNumber = getWrestlingPhotoNumber(photoId);
  const activePhotoId = getWrestlingPhotoIdFromNumber(photoNumber);
  wrestlingLightboxShell.dataset.showId = activeShowId;
  wrestlingLightboxShell.dataset.matchId = activeMatchId;
  wrestlingLightboxShell.dataset.wrestlingShowId = activeShowId;
  wrestlingLightboxShell.dataset.wrestlingMatchId = activeMatchId;
  wrestlingLightboxShell.dataset.wrestlingPhotoId = activePhotoId;
  wrestlingLightboxShell.dataset.photoNumber = String(photoNumber);
  if (wrestlingLightboxCounter) {
    wrestlingLightboxCounter.textContent = `${photoNumber} / 48`;
  }
  if (wrestlingLightboxPhotoNumber) {
    wrestlingLightboxPhotoNumber.textContent = activePhotoId;
  }
  if (typeof updateWrestlingLightboxRelationshipHooks === "function") {
    updateWrestlingLightboxRelationshipHooks(activeShowId, activeMatchId, activePhotoId);
  }

  window.clearTimeout(activationTimer);
  shell.classList.remove("is-activating", "is-reduced-activation", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-about-view", "is-calendar-view", "is-contact-view");
  shell.classList.add("has-entered-hub", "is-module-view", "is-wrestling-lightbox-view");
  if (homeFrame) {
    homeFrame.setAttribute("aria-hidden", "true");
  }
  portfolioHub.setAttribute("aria-hidden", "false");
  portfolioHub.removeAttribute("inert");
  if (modulePlaceholder) {
    modulePlaceholder.setAttribute("aria-hidden", "true");
    modulePlaceholder.setAttribute("inert", "");
  }
  if (musicNexusShell) {
    musicNexusShell.setAttribute("aria-hidden", "true");
    musicNexusShell.setAttribute("inert", "");
  }
  if (ringArchiveShell) {
    ringArchiveShell.setAttribute("aria-hidden", "true");
    ringArchiveShell.setAttribute("inert", "");
  }
  setWrestlingShowsHidden(true);
  setWrestlingPeopleHidden(true);
  setWrestlingPersonDetailHidden(true);
  setWrestlingVenuesHidden(true);
  setWrestlingShowDetailHidden(true);
  setWrestlingMatchGalleryHidden(true);
  setWrestlingLightboxHidden(false);
  if (aboutShell) {
    aboutShell.setAttribute("aria-hidden", "true");
    aboutShell.setAttribute("inert", "");
  }
  if (calendarShell) {
    calendarShell.setAttribute("aria-hidden", "true");
    calendarShell.setAttribute("inert", "");
  }
  if (contactShell) {
    contactShell.setAttribute("aria-hidden", "true");
    contactShell.setAttribute("inert", "");
  }
  setHubChromeHidden(true);
  setCurrentView("Photo");
  setActiveGlobalNav("wrestling");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function showAboutShell() {
  if (!shell || !aboutShell) {
    return;
  }

  window.clearTimeout(activationTimer);
  shell.classList.remove("is-activating", "is-reduced-activation", "is-module-view", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-calendar-view", "is-contact-view");
  shell.classList.add("has-entered-hub", "is-about-view");
  if (homeFrame) {
    homeFrame.setAttribute("aria-hidden", "true");
  }
  if (portfolioHub) {
    portfolioHub.setAttribute("aria-hidden", "true");
    portfolioHub.setAttribute("inert", "");
  }
  if (modulePlaceholder) {
    modulePlaceholder.setAttribute("aria-hidden", "true");
    modulePlaceholder.setAttribute("inert", "");
  }
  if (musicNexusShell) {
    musicNexusShell.setAttribute("aria-hidden", "true");
    musicNexusShell.setAttribute("inert", "");
  }
  if (ringArchiveShell) {
    ringArchiveShell.setAttribute("aria-hidden", "true");
    ringArchiveShell.setAttribute("inert", "");
  }
  setWrestlingShowsHidden(true);
  setWrestlingPeopleHidden(true);
  setWrestlingPersonDetailHidden(true);
  setWrestlingVenuesHidden(true);
  setWrestlingShowDetailHidden(true);
  setWrestlingMatchGalleryHidden(true);
  setWrestlingLightboxHidden(true);
  aboutShell.setAttribute("aria-hidden", "false");
  aboutShell.removeAttribute("inert");
  if (calendarShell) {
    calendarShell.setAttribute("aria-hidden", "true");
    calendarShell.setAttribute("inert", "");
  }
  if (contactShell) {
    contactShell.setAttribute("aria-hidden", "true");
    contactShell.setAttribute("inert", "");
  }
  setHubChromeHidden(true);
  applyAboutMockState();
  setCurrentView("About");
  setActiveGlobalNav("about");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function applyAboutMockState() {
  const forcedState = getForcedMockState("about");
  const stateSurface = aboutShell?.querySelector("[data-about-state-surface]");
  if (!stateSurface) {
    return;
  }

  stateSurface.hidden = true;
  stateSurface.replaceChildren();
  delete stateSurface.dataset.siteModuleState;
  delete stateSurface.dataset.siteModuleScope;
  delete stateSurface.dataset.siteModuleSource;

  if (!forcedState) {
    return;
  }

  stateSurface.hidden = false;
  renderMockState(stateSurface, forcedState, "about");
  markSiteModuleDataState(stateSurface, "about", forcedState);
}

function showCalendarShell() {
  if (!shell || !calendarShell) {
    return;
  }

  window.clearTimeout(activationTimer);
  shell.classList.remove("is-activating", "is-reduced-activation", "is-module-view", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-contact-view");
  shell.classList.add("has-entered-hub", "is-calendar-view");
  if (homeFrame) {
    homeFrame.setAttribute("aria-hidden", "true");
  }
  if (portfolioHub) {
    portfolioHub.setAttribute("aria-hidden", "true");
    portfolioHub.setAttribute("inert", "");
  }
  if (modulePlaceholder) {
    modulePlaceholder.setAttribute("aria-hidden", "true");
    modulePlaceholder.setAttribute("inert", "");
  }
  if (musicNexusShell) {
    musicNexusShell.setAttribute("aria-hidden", "true");
    musicNexusShell.setAttribute("inert", "");
  }
  if (ringArchiveShell) {
    ringArchiveShell.setAttribute("aria-hidden", "true");
    ringArchiveShell.setAttribute("inert", "");
  }
  setWrestlingShowsHidden(true);
  setWrestlingPeopleHidden(true);
  setWrestlingPersonDetailHidden(true);
  setWrestlingVenuesHidden(true);
  setWrestlingShowDetailHidden(true);
  setWrestlingMatchGalleryHidden(true);
  setWrestlingLightboxHidden(true);
  if (aboutShell) {
    aboutShell.setAttribute("aria-hidden", "true");
    aboutShell.setAttribute("inert", "");
  }
  calendarShell.setAttribute("aria-hidden", "false");
  calendarShell.removeAttribute("inert");
  if (contactShell) {
    contactShell.setAttribute("aria-hidden", "true");
    contactShell.setAttribute("inert", "");
  }
  setHubChromeHidden(true);
  applyCalendarMockState();
  setCurrentView("Calendar");
  setActiveGlobalNav("calendar");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function applyCalendarMockState() {
  const forcedState = getForcedMockState("calendar");
  const eventList = calendarShell?.querySelector("[data-calendar-event-list]") || calendarShell?.querySelector(".calendar-event-list");
  if (!eventList) {
    return;
  }

  renderSiteModuleMockState(eventList, "calendar", forcedState, {
    itemTag: "li",
    itemClass: "v3-card v3-card--event calendar-event-card",
    partialMode: "append",
  });
}

function showContactShell() {
  if (!shell || !contactShell) {
    return;
  }

  window.clearTimeout(activationTimer);
  shell.classList.remove("is-activating", "is-reduced-activation", "is-module-view", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view");
  shell.classList.add("has-entered-hub", "is-contact-view");
  if (homeFrame) {
    homeFrame.setAttribute("aria-hidden", "true");
  }
  if (portfolioHub) {
    portfolioHub.setAttribute("aria-hidden", "true");
    portfolioHub.setAttribute("inert", "");
  }
  if (modulePlaceholder) {
    modulePlaceholder.setAttribute("aria-hidden", "true");
    modulePlaceholder.setAttribute("inert", "");
  }
  if (musicNexusShell) {
    musicNexusShell.setAttribute("aria-hidden", "true");
    musicNexusShell.setAttribute("inert", "");
  }
  if (ringArchiveShell) {
    ringArchiveShell.setAttribute("aria-hidden", "true");
    ringArchiveShell.setAttribute("inert", "");
  }
  setWrestlingShowsHidden(true);
  setWrestlingPeopleHidden(true);
  setWrestlingPersonDetailHidden(true);
  setWrestlingVenuesHidden(true);
  setWrestlingShowDetailHidden(true);
  setWrestlingMatchGalleryHidden(true);
  setWrestlingLightboxHidden(true);
  if (aboutShell) {
    aboutShell.setAttribute("aria-hidden", "true");
    aboutShell.setAttribute("inert", "");
  }
  if (calendarShell) {
    calendarShell.setAttribute("aria-hidden", "true");
    calendarShell.setAttribute("inert", "");
  }
  contactShell.setAttribute("aria-hidden", "false");
  contactShell.removeAttribute("inert");
  setHubChromeHidden(true);
  applyContactMockState();
  setCurrentView("Contact");
  setActiveGlobalNav("contact");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function applyContactMockState() {
  const forcedState = getForcedMockState("contact");
  const formShell = contactShell?.querySelector("[data-contact-form-shell]") || contactShell?.querySelector(".contact-form-shell");
  if (!formShell) {
    return;
  }

  renderSiteModuleMockState(formShell, "contact", forcedState, {
    partialMode: "append",
  });
}

function showModulePlaceholder(moduleName) {
  const content = modulePlaceholderContent[moduleName];
  if (!content || !shell || !portfolioHub || !modulePlaceholder) {
    return;
  }

  resetRouteNotFoundPlaceholder();
  window.clearTimeout(activationTimer);
  shell.classList.remove("is-activating", "is-reduced-activation", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
  shell.classList.add("has-entered-hub", "is-module-view", "is-placeholder-view");
  if (homeFrame) {
    homeFrame.setAttribute("aria-hidden", "true");
  }
  portfolioHub.setAttribute("aria-hidden", "false");
  portfolioHub.removeAttribute("inert");
  modulePlaceholder.setAttribute("aria-hidden", "false");
  modulePlaceholder.removeAttribute("inert");
  if (musicNexusShell) {
    musicNexusShell.setAttribute("aria-hidden", "true");
    musicNexusShell.setAttribute("inert", "");
  }
  if (ringArchiveShell) {
    ringArchiveShell.setAttribute("aria-hidden", "true");
    ringArchiveShell.setAttribute("inert", "");
  }
  setWrestlingShowsHidden(true);
  setWrestlingPeopleHidden(true);
  setWrestlingPersonDetailHidden(true);
  setWrestlingVenuesHidden(true);
  setWrestlingShowDetailHidden(true);
  setWrestlingMatchGalleryHidden(true);
  setWrestlingLightboxHidden(true);
  if (aboutShell) {
    aboutShell.setAttribute("aria-hidden", "true");
    aboutShell.setAttribute("inert", "");
  }
  if (calendarShell) {
    calendarShell.setAttribute("aria-hidden", "true");
    calendarShell.setAttribute("inert", "");
  }
  if (contactShell) {
    contactShell.setAttribute("aria-hidden", "true");
    contactShell.setAttribute("inert", "");
  }
  setHubChromeHidden(true);
  if (modulePlaceholderKicker) {
    modulePlaceholderKicker.textContent = content.kicker;
  }
  if (modulePlaceholderTitle) {
    modulePlaceholderTitle.textContent = content.title;
  }
  if (modulePlaceholderCopy) {
    modulePlaceholderCopy.textContent = content.copy;
  }
  setCurrentView(content.rail);
  setActiveGlobalNav("portfolio");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

const routeNotFoundConfigs = {
  "route-not-found": {
    rail: "Route Not Found",
    scope: "routeNotFound",
    title: "Archive Route Not Found",
    text: "No matching archive route could be found.",
    activeNav: "portfolio",
    actions: [
      { label: "Back to Portfolio", route: routePaths.portfolio },
      { label: "Back to Home", route: routePaths.home },
    ],
  },
  "music-route-not-found": {
    rail: "Music Route Not Found",
    scope: "musicRouteNotFound",
    title: "Music Route Not Found",
    text: "No matching Music archive route could be found.",
    activeNav: "music",
    actions: [
      { label: "Back to Music", route: routePaths.music },
      { label: "Back to Portfolio", route: routePaths.portfolio },
    ],
  },
  "wrestling-route-not-found": {
    rail: "Ring Archive Route Not Found",
    scope: "wrestlingRouteNotFound",
    title: "Ring Archive Route Not Found",
    text: "No matching Wrestling archive route could be found.",
    activeNav: "wrestling",
    actions: [
      { label: "Back to Wrestling", route: routePaths.wrestling },
      { label: "Back to Portfolio", route: routePaths.portfolio },
    ],
  },
};

function resetRouteNotFoundPlaceholder() {
  if (!modulePlaceholder) {
    return;
  }

  modulePlaceholder.querySelectorAll("[data-route-not-found-state]").forEach((state) => state.remove());
  const placeholderContent = modulePlaceholder.querySelector(".module-placeholder-content");
  if (placeholderContent) {
    placeholderContent.hidden = false;
  }
  if (moduleBack) {
    moduleBack.hidden = false;
  }
  modulePlaceholder.setAttribute("aria-labelledby", "module-placeholder-title");
  modulePlaceholder.removeAttribute("aria-label");
}

function getRouteNotFoundConfig(route = {}) {
  return routeNotFoundConfigs[route.name] || routeNotFoundConfigs["route-not-found"];
}

function appendRouteNotFoundAction(actions, action = {}) {
  if (!actions || !action.label || !action.route) {
    return;
  }

  const button = document.createElement("button");
  button.className = "v3-state-action";
  button.type = "button";
  button.textContent = action.label;
  button.addEventListener("click", () => navigateToRoute(action.route));
  actions.append(button);
}

function createRouteNotFoundCard(route = {}) {
  const config = getRouteNotFoundConfig(route);
  const card = typeof createV3EmptyState === "function"
    ? createV3EmptyState({
      scope: config.scope,
      title: config.title,
      text: config.text,
      detail: route.path ? `Route: ${route.path}` : "",
    })
    : createV3StateCard("empty", {
      scope: config.scope,
      title: config.title,
      text: config.text,
      detail: route.path ? `Route: ${route.path}` : "",
    });
  card.dataset.routeNotFoundCard = "";

  const body = card.querySelector(".v3-state-copy") || card;
  const actions = document.createElement("span");
  actions.className = "v3-state-actions";
  config.actions.forEach((action) => appendRouteNotFoundAction(actions, action));
  body.append(actions);
  return card;
}

function showRouteNotFound(route = {}) {
  if (!shell || !portfolioHub || !modulePlaceholder) {
    return;
  }

  const config = getRouteNotFoundConfig(route);
  window.clearTimeout(activationTimer);
  shell.classList.remove("is-activating", "is-reduced-activation", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
  shell.classList.add("has-entered-hub", "is-module-view", "is-placeholder-view");
  if (homeFrame) {
    homeFrame.setAttribute("aria-hidden", "true");
  }
  portfolioHub.setAttribute("aria-hidden", "false");
  portfolioHub.removeAttribute("inert");
  modulePlaceholder.setAttribute("aria-hidden", "false");
  modulePlaceholder.removeAttribute("inert");
  modulePlaceholder.setAttribute("aria-label", config.rail);
  modulePlaceholder.removeAttribute("aria-labelledby");
  if (musicNexusShell) {
    musicNexusShell.setAttribute("aria-hidden", "true");
    musicNexusShell.setAttribute("inert", "");
  }
  if (ringArchiveShell) {
    ringArchiveShell.setAttribute("aria-hidden", "true");
    ringArchiveShell.setAttribute("inert", "");
  }
  setWrestlingShowsHidden(true);
  setWrestlingPeopleHidden(true);
  setWrestlingPersonDetailHidden(true);
  setWrestlingVenuesHidden(true);
  setWrestlingShowDetailHidden(true);
  setWrestlingMatchGalleryHidden(true);
  setWrestlingLightboxHidden(true);
  if (aboutShell) {
    aboutShell.setAttribute("aria-hidden", "true");
    aboutShell.setAttribute("inert", "");
  }
  if (calendarShell) {
    calendarShell.setAttribute("aria-hidden", "true");
    calendarShell.setAttribute("inert", "");
  }
  if (contactShell) {
    contactShell.setAttribute("aria-hidden", "true");
    contactShell.setAttribute("inert", "");
  }
  setHubChromeHidden(true);
  resetRouteNotFoundPlaceholder();
  modulePlaceholder.setAttribute("aria-label", config.rail);
  modulePlaceholder.removeAttribute("aria-labelledby");

  const placeholderContent = modulePlaceholder.querySelector(".module-placeholder-content");
  if (placeholderContent) {
    placeholderContent.hidden = true;
  }
  if (moduleBack) {
    moduleBack.hidden = true;
  }

  const statePanel = document.createElement("section");
  statePanel.className = "route-not-found-state";
  statePanel.dataset.routeNotFoundState = route.name || "route-not-found";
  statePanel.append(createRouteNotFoundCard(route));
  modulePlaceholder.append(statePanel);

  setCurrentView(config.rail);
  setActiveGlobalNav(config.activeNav);
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function updateViewportMetrics() {
  const viewportHeight = window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight;
  if (viewportHeight) {
    document.documentElement.style.setProperty("--app-viewport-height", `${Math.round(viewportHeight)}px`);
  }
  syncRailHeight();
}

function setShellDrawerLock(isLocked) {
  document.body.classList.toggle("is-shell-drawer-open", isLocked);
}

function getActiveShellScroller(route = getRouteFromUrl()) {
  const routeScrollerMap = {
    home: homeFrame?.parentElement || document.querySelector(".public-home"),
    portfolio: document.querySelector(".public-home"),
    "route-not-found": modulePlaceholder,
    music: musicNexusShell,
    "music-route-not-found": modulePlaceholder,
    "music-bands": musicNexusShell,
    "band-detail": musicNexusShell,
    "sets-archive": musicNexusShell,
    "set-detail": musicNexusShell,
    "music-people": musicNexusShell,
    "person-detail": musicNexusShell,
    "music-shows": musicNexusShell,
    "show-detail": musicNexusShell,
    "music-venues": musicNexusShell,
    "music-venue-detail": musicNexusShell,
    wrestling: ringArchiveShell,
    "wrestling-route-not-found": modulePlaceholder,
    "wrestling-people": wrestlingPeopleShell,
    "wrestling-person-detail": wrestlingPersonDetailShell,
    "wrestling-venues": wrestlingVenuesShell,
    "wrestling-venue-detail": wrestlingVenueDetailShell,
    "wrestling-shows": wrestlingShowsShell,
    "wrestling-show-detail": wrestlingShowDetailShell,
    "wrestling-match-gallery": wrestlingMatchGalleryShell,
    "wrestling-lightbox": wrestlingLightboxShell,
    calendar: calendarShell,
    about: aboutShell,
    contact: contactShell,
  };

  return routeScrollerMap[route.name] || document.querySelector(".public-home");
}

function resetShellScroller(scroller) {
  if (!scroller || typeof scroller.scrollTo !== "function") {
    return;
  }

  scroller.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function stabilizeShellViewport(route = getRouteFromUrl(), options = {}) {
  updateViewportMetrics();
  if (options.shouldResetScroll === false) {
    return;
  }

  window.requestAnimationFrame(() => {
    resetShellScroller(getActiveShellScroller(route));
  });
}

function syncRailHeight() {
  if (!bottomRail) {
    return;
  }

  const railHeight = Math.ceil(bottomRail.getBoundingClientRect().height);
  document.documentElement.style.setProperty("--rail-height", `${railHeight}px`);
  document.documentElement.style.setProperty("--rail-total-height", `${railHeight + 10}px`);
}

function openGlobalMenu() {
  if (!shell || !railMenuTrigger || !globalMenuDrawer || !globalMenuBackdrop) {
    return;
  }

  window.clearTimeout(drawerCloseTimer);
  syncRailHeight();
  globalMenuDrawer.hidden = false;
  globalMenuBackdrop.hidden = false;
  setShellDrawerLock(true);
  globalMenuDrawer.setAttribute("aria-hidden", "false");
  railMenuTrigger.setAttribute("aria-expanded", "true");
  window.requestAnimationFrame(() => {
    if (
      globalMenuDrawer.hidden ||
      globalMenuDrawer.getAttribute("aria-hidden") !== "false" ||
      railMenuTrigger.getAttribute("aria-expanded") !== "true"
    ) {
      return;
    }
    shell.classList.add("is-global-menu-open");
    if (globalMenuClose) {
      globalMenuClose.focus({ preventScroll: true });
    }
  });
}

function finishGlobalMenuClose() {
  if (!globalMenuDrawer || !globalMenuBackdrop) {
    return;
  }

  globalMenuDrawer.hidden = true;
  globalMenuBackdrop.hidden = true;
}

function closeGlobalMenu(options = {}) {
  if (!shell || !railMenuTrigger || !globalMenuDrawer || !globalMenuBackdrop) {
    return;
  }

  shell.classList.remove("is-global-menu-open");
  globalMenuDrawer.setAttribute("aria-hidden", "true");
  railMenuTrigger.setAttribute("aria-expanded", "false");
  if (options.shouldRestoreFocus !== false) {
    railMenuTrigger.focus({ preventScroll: true });
  }
  setShellDrawerLock(false);
  window.clearTimeout(drawerCloseTimer);
  if (reducedMotion.matches) {
    finishGlobalMenuClose();
    return;
  }

  drawerCloseTimer = window.setTimeout(finishGlobalMenuClose, 320);
}

function showHomepage() {
  if (!shell || !startButton) {
    return;
  }

  window.clearTimeout(activationTimer);
  clearHomePortfolioTransitionState();
  clearPortfolioArrivalState();
  clearPortfolioOrientationState();
  clearPortfolioDirectArrivalState();
  closeGlobalMenu({ shouldRestoreFocus: false });
  shell.classList.remove("is-home-transitioning", "is-engage-activated", "is-activating", "is-reduced-activation", "has-entered-hub", "is-module-view", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
  startButton.disabled = false;
  startButton.setAttribute("aria-busy", "false");
  if (homeFrame) {
    homeFrame.setAttribute("aria-hidden", "false");
  }
  if (portfolioHub) {
    portfolioHub.setAttribute("aria-hidden", "true");
    portfolioHub.setAttribute("inert", "");
  }
  if (modulePlaceholder) {
    modulePlaceholder.setAttribute("aria-hidden", "true");
    modulePlaceholder.setAttribute("inert", "");
  }
  if (musicNexusShell) {
    musicNexusShell.setAttribute("aria-hidden", "true");
    musicNexusShell.setAttribute("inert", "");
  }
  if (ringArchiveShell) {
    ringArchiveShell.setAttribute("aria-hidden", "true");
    ringArchiveShell.setAttribute("inert", "");
  }
  setWrestlingShowsHidden(true);
  setWrestlingPeopleHidden(true);
  setWrestlingPersonDetailHidden(true);
  setWrestlingVenuesHidden(true);
  setWrestlingShowDetailHidden(true);
  setWrestlingMatchGalleryHidden(true);
  setWrestlingLightboxHidden(true);
  if (aboutShell) {
    aboutShell.setAttribute("aria-hidden", "true");
    aboutShell.setAttribute("inert", "");
  }
  if (calendarShell) {
    calendarShell.setAttribute("aria-hidden", "true");
    calendarShell.setAttribute("inert", "");
  }
  if (contactShell) {
    contactShell.setAttribute("aria-hidden", "true");
    contactShell.setAttribute("inert", "");
  }
  setHubChromeHidden(false);
  setCurrentView("Homepage");
  setActiveGlobalNav("home");
}

function handleGlobalMenuAction(event) {
  const button = event.currentTarget;
  const routeMeta = getShellRouteMeta(button.dataset.globalNavTarget);
  const navRoute = routeMeta?.route || button.dataset.globalNavRoute;

  if (button.getAttribute("aria-disabled") === "true" || routeMeta?.futurePlaceholder) {
    return;
  }

  closeGlobalMenu({ shouldRestoreFocus: false });
  if (navRoute) {
    window.requestAnimationFrame(() => navigateToRoute(navRoute));
  }
}

function revealHub(options = {}) {
  clearHomePortfolioTransitionState();
  clearPortfolioArrivalState();
  clearPortfolioOrientationState();
  clearPortfolioDirectArrivalState();
  shell.classList.remove("is-activating", "is-reduced-activation", "is-about-view", "is-calendar-view", "is-contact-view");
  shell.classList.add("has-entered-hub");
  if (homeFrame) {
    homeFrame.setAttribute("aria-hidden", "true");
  }
  if (portfolioHub) {
    portfolioHub.setAttribute("aria-hidden", "false");
    portfolioHub.removeAttribute("inert");
  }
  if (calendarShell) {
    calendarShell.setAttribute("aria-hidden", "true");
    calendarShell.setAttribute("inert", "");
  }
  if (aboutShell) {
    aboutShell.setAttribute("aria-hidden", "true");
    aboutShell.setAttribute("inert", "");
  }
  if (contactShell) {
    contactShell.setAttribute("aria-hidden", "true");
    contactShell.setAttribute("inert", "");
  }
  showPortfolioHubView();
  syncSpotlightFromCarousel();
  if (startButton) {
    startButton.disabled = true;
  }
  startButton.setAttribute("aria-busy", "false");
  setActiveGlobalNav("portfolio");
  if (options.shouldPlayPortfolioArrival) {
    startPortfolioArrival();
  } else if (options.shouldPlayDirectPortfolioArrival) {
    startPortfolioDirectArrival();
  }
}

const PORTFOLIO_ARRIVAL_DURATION_MS = 860;
const PORTFOLIO_ARRIVAL_REDUCED_MOTION_DURATION_MS = 70;
const PORTFOLIO_ORIENTATION_START_OFFSET_MS = 480;
const PORTFOLIO_ORIENTATION_REDUCED_MOTION_START_OFFSET_MS = 28;
const PORTFOLIO_ORIENTATION_DURATION_MS = 760;
const PORTFOLIO_ORIENTATION_REDUCED_MOTION_DURATION_MS = 70;
let portfolioArrivalTimer = 0;
let portfolioOrientationStartTimer = 0;
let portfolioOrientationTimer = 0;
let portfolioOrientationFocusCard = null;
const PORTFOLIO_DIRECT_ARRIVAL_DURATION_MS = 720;
const PORTFOLIO_DIRECT_ARRIVAL_REDUCED_MOTION_DURATION_MS = 80;
let portfolioDirectArrivalTimer = 0;

function clearPortfolioDirectArrivalState() {
  window.clearTimeout(portfolioDirectArrivalTimer);
  portfolioDirectArrivalTimer = 0;
  if (shell) {
    shell.classList.remove("is-portfolio-direct-arriving");
  }
}

function startPortfolioDirectArrival() {
  if (
    !shell ||
    !portfolioHub ||
    !shell.classList.contains("has-entered-hub") ||
    shell.classList.contains("is-module-view") ||
    shell.classList.contains("is-portfolio-arriving") ||
    shell.classList.contains("is-portfolio-orienting") ||
    window.location.pathname !== routePaths.portfolio
  ) {
    return;
  }

  clearPortfolioDirectArrivalState();
  shell.classList.add("is-portfolio-direct-arriving");
  const directArrivalDuration = reducedMotion.matches
    ? PORTFOLIO_DIRECT_ARRIVAL_REDUCED_MOTION_DURATION_MS
    : PORTFOLIO_DIRECT_ARRIVAL_DURATION_MS;
  portfolioDirectArrivalTimer = window.setTimeout(clearPortfolioDirectArrivalState, directArrivalDuration);
}

function clearPortfolioArrivalState() {
  window.clearTimeout(portfolioArrivalTimer);
  window.clearTimeout(portfolioOrientationStartTimer);
  portfolioArrivalTimer = 0;
  portfolioOrientationStartTimer = 0;
  if (shell) {
    shell.classList.remove("is-portfolio-arriving");
  }
}

function clearPortfolioOrientationState() {
  window.clearTimeout(portfolioOrientationTimer);
  portfolioOrientationTimer = 0;
  if (portfolioOrientationFocusCard) {
    portfolioOrientationFocusCard.classList.remove("is-world-focus-target");
    portfolioOrientationFocusCard = null;
  }
  if (shell) {
    shell.classList.remove("is-portfolio-orienting");
  }
}

function startPortfolioOrientation() {
  portfolioOrientationStartTimer = 0;
  if (
    !shell ||
    !portfolioHub ||
    !shell.classList.contains("has-entered-hub") ||
    shell.classList.contains("is-module-view") ||
    window.location.pathname !== routePaths.portfolio
  ) {
    return;
  }

  clearPortfolioOrientationState();
  portfolioOrientationFocusCard = getCenteredHubCard();
  if (portfolioOrientationFocusCard) {
    portfolioOrientationFocusCard.classList.add("is-world-focus-target");
  }
  shell.classList.add("is-portfolio-orienting");

  const orientationDuration = reducedMotion.matches
    ? PORTFOLIO_ORIENTATION_REDUCED_MOTION_DURATION_MS
    : PORTFOLIO_ORIENTATION_DURATION_MS;
  portfolioOrientationTimer = window.setTimeout(clearPortfolioOrientationState, orientationDuration);
}

function startPortfolioArrival() {
  if (!shell || !portfolioHub) {
    return;
  }

  clearPortfolioArrivalState();
  clearPortfolioOrientationState();
  shell.classList.add("is-portfolio-arriving");
  const arrivalDuration = reducedMotion.matches
    ? PORTFOLIO_ARRIVAL_REDUCED_MOTION_DURATION_MS
    : PORTFOLIO_ARRIVAL_DURATION_MS;
  const orientationStartOffset = reducedMotion.matches
    ? PORTFOLIO_ORIENTATION_REDUCED_MOTION_START_OFFSET_MS
    : PORTFOLIO_ORIENTATION_START_OFFSET_MS;
  portfolioOrientationStartTimer = window.setTimeout(startPortfolioOrientation, orientationStartOffset);
  portfolioArrivalTimer = window.setTimeout(clearPortfolioArrivalState, arrivalDuration);
}

const HOME_PORTFOLIO_TRANSITION_ROUTE_DELAY_MS = 1380;
const HOME_PORTFOLIO_REDUCED_MOTION_ROUTE_DELAY_MS = 40;
const HOME_PORTFOLIO_SEAM_REVEAL_DELAY_MS = 80;
const HOME_PORTFOLIO_SEAM_REDUCED_REVEAL_DELAY_MS = 16;
let homePortfolioTransitionTimer = 0;

function clearHomePortfolioTransitionState() {
  window.clearTimeout(homePortfolioTransitionTimer);
  homePortfolioTransitionTimer = 0;
  if (shell) {
    shell.classList.remove("is-home-transitioning", "is-engage-activated");
  }
  if (startButton) {
    startButton.setAttribute("aria-busy", "false");
  }
}

function completeHomePortfolioRouteHandoff() {
  homePortfolioTransitionTimer = 0;
  navigateToRoute(routePaths.portfolio, {
    shouldAnimatePortal: true,
    shouldPlayPortfolioArrival: true,
    historyState: { fromHomeEngage: true },
  });
}

function beginHomePortfolioTransition() {
  if (
    !shell ||
    !startButton ||
    startButton.disabled ||
    shell.classList.contains("is-home-transitioning") ||
    shell.classList.contains("is-engage-activated") ||
    shell.classList.contains("is-activating") ||
    shell.classList.contains("has-entered-hub")
  ) {
    return;
  }

  window.clearTimeout(homePortfolioTransitionTimer);
  shell.classList.add("is-home-transitioning", "is-engage-activated");
  startButton.setAttribute("aria-busy", "true");

  const routeDelay = reducedMotion.matches
    ? HOME_PORTFOLIO_REDUCED_MOTION_ROUTE_DELAY_MS
    : HOME_PORTFOLIO_TRANSITION_ROUTE_DELAY_MS;

  if (routeDelay <= 0) {
    completeHomePortfolioRouteHandoff();
    return;
  }

  homePortfolioTransitionTimer = window.setTimeout(completeHomePortfolioRouteHandoff, routeDelay);
}

function activatePortal(options = {}) {
  if (
    !shell ||
    !startButton ||
    startButton.disabled ||
    shell.classList.contains("is-activating") ||
    shell.classList.contains("has-entered-hub")
  ) {
    return;
  }

  window.clearTimeout(activationTimer);
  startButton.disabled = true;
  startButton.setAttribute("aria-busy", "true");
  shell.classList.toggle("is-reduced-activation", reducedMotion.matches);
  shell.classList.add("is-activating");

  const activationDelay = options.shouldPlayPortfolioArrival
    ? (reducedMotion.matches ? HOME_PORTFOLIO_SEAM_REDUCED_REVEAL_DELAY_MS : HOME_PORTFOLIO_SEAM_REVEAL_DELAY_MS)
    : (reducedMotion.matches ? 460 : 1360);
  activationTimer = window.setTimeout(() => revealHub({ shouldPlayPortfolioArrival: Boolean(options.shouldPlayPortfolioArrival) }), activationDelay);
}

if (shell && startButton) {
  renderGlobalMenu();
  initShellRailLogo();
  startButton.setAttribute("aria-busy", "false");
  setActiveGlobalNav("home");
  startButton.addEventListener("click", beginHomePortfolioTransition);
  updateViewportMetrics();
  if (railMenuTrigger) {
    railMenuTrigger.addEventListener("click", openGlobalMenu);
  }
  if (shellBackButton) {
    shellBackButton.addEventListener("click", performShellBack);
  }
  if (globalMenuBackdrop) {
    globalMenuBackdrop.addEventListener("click", closeGlobalMenu);
  }
  if (globalMenuClose) {
    globalMenuClose.addEventListener("click", closeGlobalMenu);
  }
  globalNavButtons.forEach((button) => {
    button.addEventListener("click", handleGlobalMenuAction);
  });
  moduleCards.forEach((card) => {
    card.addEventListener("click", () => {
      if (card.dataset.moduleCard === "music") {
        navigateToRoute(routePaths.music);
        return;
      }
      if (card.dataset.moduleCard === "wrestling") {
        navigateToRoute(routePaths.wrestling);
        return;
      }

      showModulePlaceholder(card.dataset.moduleCard);
    });
  });
  if (moduleBack) {
    moduleBack.addEventListener("click", revealHub);
  }
  if (ringArchiveBack) {
    ringArchiveBack.addEventListener("click", revealHub);
  }
  if (ringArchiveShows) {
    ringArchiveShows.addEventListener("click", () => {
      navigateToRoute(routePaths.wrestlingShows);
    });
  }
  if (ringArchivePeople) {
    ringArchivePeople.addEventListener("click", () => {
      navigateToRoute(routePaths.wrestlingPeople);
    });
  }
  if (ringArchiveVenues) {
    ringArchiveVenues.addEventListener("click", () => {
      navigateToRoute(routePaths.wrestlingVenues);
    });
  }
  if (wrestlingPeopleBack) {
    wrestlingPeopleBack.addEventListener("click", () => {
      navigateToRoute(routePaths.wrestling);
    });
  }
  if (wrestlingVenuesBack) {
    wrestlingVenuesBack.addEventListener("click", () => {
      navigateToRoute(routePaths.wrestling);
    });
  }
  wrestlingShowEntries.forEach((entry) => {
    const showId = entry.dataset.wrestlingShowId;
    const showTitle = entry.querySelector(".wrestling-show-title")?.textContent?.trim();
    entry.setAttribute("role", "link");
    entry.tabIndex = 0;
    if (showTitle) {
      entry.setAttribute("aria-label", `Open ${showTitle}`);
    }
    entry.addEventListener("click", () => {
      if (showId) {
        navigateToRoute(`${routePaths.wrestlingShows}/${encodeURIComponent(showId)}`);
      }
    });
    entry.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        entry.click();
      }
    });
  });
  if (wrestlingShowDetailBack) {
    wrestlingShowDetailBack.addEventListener("click", () => {
      navigateToRoute(routePaths.wrestlingShows);
    });
  }
  if (wrestlingMatchGalleryBack) {
    wrestlingMatchGalleryBack.addEventListener("click", () => {
      const showRoute = wrestlingMatchGalleryShell?.dataset.wrestlingShowRoute;
      if (showRoute) {
        navigateToRoute(showRoute);
        return;
      }
      const showId = wrestlingMatchGalleryShell?.dataset.wrestlingShowId ||
        wrestlingMatchGalleryShell?.dataset.showId ||
        "warzone-26";
      navigateToRoute(`${routePaths.wrestlingShows}/${encodeURIComponent(showId)}`);
    });
  }
  wrestlingPhotoTiles.forEach((tile) => {
    const photoId = tile.dataset.wrestlingPhotoId;
    tile.addEventListener("click", () => {
      if (photoId) {
        if (tile.dataset.wrestlingLightboxRoute) {
          navigateToRoute(tile.dataset.wrestlingLightboxRoute);
          return;
        }
        const showId = tile.dataset.wrestlingShowId ||
          wrestlingMatchGalleryShell?.dataset.wrestlingShowId ||
          "warzone-26";
        const matchId = tile.dataset.wrestlingMatchRef ||
          wrestlingMatchGalleryShell?.dataset.wrestlingMatchRef ||
          tile.dataset.wrestlingMatchId ||
          wrestlingMatchGalleryShell?.dataset.wrestlingMatchId ||
          "1";
        const matchRoute = typeof getWrestlingMatchRouteUrlByIds === "function"
          ? getWrestlingMatchRouteUrlByIds(showId, matchId)
          : `${routePaths.wrestlingShows}/${encodeURIComponent(showId)}/match-${encodeURIComponent(matchId)}`;
        navigateToRoute(`${matchRoute}/photo/${encodeURIComponent(photoId)}`);
      }
    });
    tile.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        tile.click();
      }
    });
  });
  if (wrestlingLightboxPrev) {
    wrestlingLightboxPrev.addEventListener("click", () => {
      navigateToWrestlingPhoto(getWrestlingPhotoNumber(wrestlingLightboxShell?.dataset.photoNumber) - 1);
    });
  }
  if (wrestlingLightboxNext) {
    wrestlingLightboxNext.addEventListener("click", () => {
      navigateToWrestlingPhoto(getWrestlingPhotoNumber(wrestlingLightboxShell?.dataset.photoNumber) + 1);
    });
  }
  if (wrestlingLightboxShell) {
    let lightboxTouchStartX = 0;
    let lightboxTouchStartY = 0;
    wrestlingLightboxShell.addEventListener("touchstart", (event) => {
      const touch = event.changedTouches[0];
      lightboxTouchStartX = touch.clientX;
      lightboxTouchStartY = touch.clientY;
    }, { passive: true });
    wrestlingLightboxShell.addEventListener("touchend", (event) => {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - lightboxTouchStartX;
      const deltaY = touch.clientY - lightboxTouchStartY;
      if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
        const currentPhoto = getWrestlingPhotoNumber(wrestlingLightboxShell.dataset.photoNumber);
        navigateToWrestlingPhoto(deltaX < 0 ? currentPhoto + 1 : currentPhoto - 1);
      }
    }, { passive: true });
  }
  if (typeof initMusicModule === "function") {
    initMusicModule();
  }
  if (typeof initWrestlingPeopleModule === "function") {
    initWrestlingPeopleModule();
  }
  const initialRoute = getRouteFromUrl();
  syncRouteFromLocation({
    historyState: window.history.state,
    shouldPlayDirectPortfolioArrival: initialRoute.name === "portfolio",
  });
  window.addEventListener("popstate", (event) => {
    syncRouteFromLocation({ historyState: event.state });
  });
  if (hubCarousel) {
    hubCarousel.addEventListener("scroll", scheduleSpotlightSync, { passive: true });
    syncSpotlightFromCarousel();
  }
  syncAmbientMotion();
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", syncAmbientMotion);
  } else if (typeof reducedMotion.addListener === "function") {
    reducedMotion.addListener(syncAmbientMotion);
  }
  window.addEventListener("resize", updateViewportMetrics);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", updateViewportMetrics);
    window.visualViewport.addEventListener("scroll", updateViewportMetrics);
  }
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && globalMenuDrawer && !globalMenuDrawer.hidden) {
      closeGlobalMenu();
    }
  });
  window.addEventListener("pagehide", () => {
    setShellDrawerLock(false);
    window.clearTimeout(activationTimer);
    window.clearTimeout(portfolioArrivalTimer);
    window.clearTimeout(portfolioOrientationStartTimer);
    window.clearTimeout(portfolioDirectArrivalTimer);
    window.clearTimeout(portfolioOrientationTimer);
    window.clearTimeout(drawerCloseTimer);
    if (spotlightFrame) {
      window.cancelAnimationFrame(spotlightFrame);
    }
  });
}
