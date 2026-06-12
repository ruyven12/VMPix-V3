/* =========================================================
   VMPix V3 Music module.
   Music Nexus, Bands Index, Band Detail, Sets Archive, Gallery, and Lightbox behavior.
   Extracted mechanically from router.js and shell.js; shell/router still own layout and route mounting.
   ========================================================= */

const MUSIC_BANDS_INDEX_API_BASE_URL = "https://vmpix-data.onrender.com";
const MUSIC_BANDS_INDEX_API_ROUTE = "/api/music/bands";
const MUSIC_BANDS_INDEX_TIMEOUT_MS = 8000;
const MUSIC_PEOPLE_INDEX_API_ROUTE = "/api/music/people";
const MUSIC_PEOPLE_INDEX_TIMEOUT_MS = 8000;
const MUSIC_SHOWS_SETS_API_ROUTE = "/api/music/shows/db";
const MUSIC_SHOWS_SETS_API_LIMIT = 100;
const MUSIC_SHOWS_SETS_TIMEOUT_MS = 15000;
const MUSIC_SMUGMUG_ALBUM_PHOTOS_API_ROUTE = "/api/music/smugmug/albums";
const MUSIC_SMUGMUG_ALBUM_PHOTOS_PREVIEW_LIMIT = 12;
const MUSIC_SMUGMUG_ALBUM_PHOTOS_PAGE_LIMIT = 25;
const MUSIC_SMUGMUG_ALBUM_PHOTOS_MAX_PAGES = 40;
const MUSIC_VENUES_API_ROUTE = "/api/music/venues";
const MUSIC_VENUES_TIMEOUT_MS = 8000;
const SET_GALLERY_NO_POSTER_IMAGE_SRC = "/assets/media/placeholders/no-poster-available.svg";
const bandsRegionFilterLabels = {
  local: "Local",
  regional: "Regional",
  national: "National",
  international: "International",
};
const bandsStatusFilterLabels = {
  complete: "Complete",
  partial: "Partial",
  needs: "Needs Work",
};
let musicBandsIndexCollection = getMockCollection("musicBands", { clone: false });
let musicBandsIndexRequest = null;
let musicBandsIndexLoaded = false;
let musicPeopleIndexCollection = [];
let musicPeopleIndexRequest = null;
let musicPeopleIndexLoaded = false;
let musicPeopleIndexDataState = "idle";
let musicShowsSetsCollection = [];
let musicShowsSetsRequest = null;
let musicShowsSetsLoaded = false;
let musicShowsSetsDataState = "fallback";
let musicShowsIndexDataRequested = false;
let musicShowsIndexRowsCache = null;
let musicShowsIndexRowsCacheState = "";
let musicShowsIndexRowsCacheSource = null;
let musicShowsIndexRowsCacheLength = 0;
const musicSmugmugAlbumPhotosCache = new Map();
const musicSmugmugAlbumPhotosRequests = new Map();
let activeSetGalleryAlbumRequestKey = "";
let musicVenuesCollection = getMockCollection("musicVenues", { clone: false });
let musicVenuesRequest = null;
let musicVenuesLoaded = false;
let activeMusicVenueSearch = "";
let activeMusicVenueStateFilter = "";
let activeMusicVenueSlugFilter = "";
let activeMusicVenueSort = "az";
let activeMusicVenueDetailSlug = "";
let activeVenueRelationship = "";
const musicVenueStateCodes = ["ME", "NH", "MA", "CT", "RI", "VT"];
const musicVenueStateAliases = {
  MAINE: "ME",
  "NEW HAMPSHIRE": "NH",
  MASSACHUSETTS: "MA",
  CONNECTICUT: "CT",
  "RHODE ISLAND": "RI",
  VERMONT: "VT",
};
const musicVenueSortOptions = [
  { value: "az", label: "A–Z" },
  { value: "events", label: "Most Events" },
  { value: "photos", label: "Most Photos" },
  { value: "newest", label: "Newest Added" },
];
const musicPeopleAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const musicPeopleCategoryFilters = [
  { value: "", label: "All" },
  { value: "performers", label: "Performers" },
  { value: "friend", label: "Friend" },
  { value: "the fallen", label: "The Fallen" },
];
let activeMusicPeopleSearch = "";
let activeMusicPeopleLetterFilter = "";
let activeMusicPeopleCategoryFilter = "";
let activeMusicPeopleInstrumentFilter = "";

function normalizeBandsView(viewName) {
  return routedBandsViews.includes(viewName) ? viewName : "radar";
}

function getBandsRouteUrl(viewName = activeBandsView) {
  const normalizedView = normalizeBandsView(viewName);
  return `${routePaths.musicBands}?view=${normalizedView}`;
}

function getBandId(band) {
  return band && typeof band.bandId === "string" ? band.bandId.trim() : "";
}

function getBandRouteUrl(bandId) {
  return `${routePaths.musicBands}/${encodeURIComponent(String(bandId || "").trim())}`;
}

function getBandSetsRouteUrl(bandId) {
  return `${getBandRouteUrl(bandId)}/sets`;
}

function normalizeMusicPersonId(personId) {
  return String(personId || "").trim().toLowerCase();
}

function getMusicPersonRouteUrl(personId) {
  const normalizedPersonId = normalizeMusicPersonId(personId) || musicPersonDetailPlaceholder.personId;
  return `${routePaths.musicPeople}/${encodeURIComponent(normalizedPersonId)}`;
}

function findMusicPersonById(personId) {
  const normalizedPersonId = normalizeMusicPersonId(personId);
  const peopleSources = [
    ...getMusicPeopleIndexCollection(),
    ...(Array.isArray(musicPeopleRows) ? musicPeopleRows : []),
  ];
  return peopleSources.find((person) => {
    const source = person?.backend_record && typeof person.backend_record === "object"
      ? { ...person.backend_record, ...person }
      : person;
    return [
      source?.personId,
      source?.id,
      source?.slug,
      source?.person_id,
      getMusicPeopleRouteId(source),
      createMusicPeopleSlug(source?.name),
    ].some((candidate) => normalizeMusicPersonId(candidate) === normalizedPersonId);
  }) || null;
}

function createMusicPersonDetailStateData(stateName, personId) {
  const normalizedPersonId = normalizeMusicPersonId(personId) || "unknown-person";
  const person = findMusicPersonById(normalizedPersonId);
  const stateCopy = musicPersonDetailStateCopy[stateName] || musicPersonDetailStateCopy.error;
  return {
    state: stateName,
    personId: normalizedPersonId,
    name: person ? person.name.toUpperCase() : "PERSON ARCHIVE",
    title: stateCopy.title,
    copy: stateCopy.copy,
  };
}

function getMusicPersonDetailData(personId) {
  const normalizedPersonId = normalizeMusicPersonId(personId);
  if (normalizedPersonId === "loading") {
    return createMusicPersonDetailStateData("loading", normalizedPersonId);
  }

  const sourcePerson = findMusicPersonById(normalizedPersonId);
  const placeholderData = normalizedPersonId === musicPersonDetailPlaceholder.personId
    ? musicPersonDetailPlaceholder
    : null;
  if (!sourcePerson && !placeholderData) {
    return createMusicPersonDetailStateData("error", normalizedPersonId);
  }

  return getMusicPersonDetailViewData({ ...placeholderData, ...sourcePerson }, normalizedPersonId);
}

function findBandById(bandId) {
  const normalizedBandId = String(bandId || "").trim().toLowerCase();
  if (!normalizedBandId) {
    return null;
  }

  const liveBand = getMusicBandsIndexCollection().find((band) => {
    const bandKeys = [
      getBandId(band),
      band?.band_id,
      band?.id,
      band?.slug,
    ];
    return bandKeys.some((key) => String(key || "").trim().toLowerCase() === normalizedBandId);
  });

  return liveBand || getMockRecordById("musicBands", bandId, ["bandId", "id", "slug", "band_id"]) || null;
}

function createUnknownBand(bandId) {
  const safeBandId = String(bandId || "unknown-band").trim() || "unknown-band";
  return {
    bandId: safeBandId,
    name: safeBandId,
    region: "Pending Index",
    status: "Placeholder Detail",
    statusKey: "needs",
    albums: 0,
    thumb: "ID",
    general: {
      name: safeBandId,
      logo_url: "",
      tags: [],
    },
    personnel: {
      members: [],
      past_members: [],
    },
    stats: {
      region: "Pending Index",
      location: "",
      state: "",
      totalPhotos: 0,
      archived_sets: 0,
      total_sets: 0,
    },
  };
}

function normalizeSetCode(setCode) {
  return String(setCode || "").trim().toLowerCase();
}

function getSetCodeFromDateValue(dateValue) {
  const parsedDate = parseMusicShowDate(dateValue);
  if (!parsedDate) {
    return "";
  }

  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  const year = String(parsedDate.getFullYear()).slice(-2);
  return `${month}${day}${year}`;
}

function getSetCode(row, fallbackIndex = 0) {
  if (!row || !row.dataset) {
    return "";
  }

  return normalizeSetCode(
    row.dataset.setCode ||
    getSetCodeFromDateValue(row.dataset.setRawDate || row.dataset.setDate) ||
    String(fallbackIndex + 1).padStart(6, "0")
  );
}

function hydrateSetRouteMetadata() {
  getSetsRows().forEach((row, index) => {
    const setCode = normalizeSetCode(
      getSetCodeFromDateValue(row.dataset.setRawDate || row.dataset.setDate) ||
      row.dataset.setCode ||
      mockSetCodes[index]
    );
    if (setCode) {
      row.dataset.setCode = setCode;
    }
  });
}

function getSetRouteUrl(bandId, setCode) {
  return `${getBandRouteUrl(bandId)}/${encodeURIComponent(normalizeSetCode(setCode))}`;
}

function findSetRowByCode(setCode) {
  const normalizedSetCode = normalizeSetCode(setCode);
  return getSetsRows().find((row, index) => getSetCode(row, index) === normalizedSetCode) || null;
}

function findSetDataByCode(setCode, band = activeMusicBand) {
  const normalizedSetCode = normalizeSetCode(setCode);
  if (!normalizedSetCode) {
    return null;
  }

  return getSetsArchiveRowsForBand(band)
    .find((show) => normalizeSetCode(show?.setCode) === normalizedSetCode) || null;
}

function createUnknownSetRow(setCode) {
  const safeSetCode = normalizeSetCode(setCode) || "unknown-set";
  return {
    dataset: {
      setCode: safeSetCode,
      setYear: "Pending",
      setDate: safeSetCode.toUpperCase(),
      setTitle: `Set ${safeSetCode}`,
      setLocation: "Pending Index",
      setPhotos: "0",
      setContributors: "0",
      setComplete: "0%",
      setThumb: activeMusicBand ? activeMusicBand.thumb : "SET",
    },
  };
}

function normalizeBandsReturnUrl(url) {
  const route = getRouteFromUrl(url || getBandsRouteUrl("radar"));
  return route.name === "music-bands" ? route.canonicalUrl : getBandsRouteUrl("radar");
}

function getActiveBandsReturnUrl() {
  const route = getRouteFromUrl();
  if (route.name === "music-bands") {
    return route.canonicalUrl;
  }
  return normalizeBandsReturnUrl(bandsIndexReturnUrl || getBandsRouteUrl(activeBandsView));
}

function navigateToBandDetail(band) {
  const bandId = getBandId(band);
  if (!bandId) {
    return;
  }

  const returnUrl = getActiveBandsReturnUrl();
  bandsIndexReturnUrl = returnUrl;
  navigateToRoute(getBandRouteUrl(bandId), { historyState: { returnUrl, fromBandsIndex: true } });
}

function returnToBandsIndexRoute() {
  const historyState = window.history.state || {};
  const returnUrl = normalizeBandsReturnUrl(historyState.returnUrl || bandsIndexReturnUrl);
  bandsIndexReturnUrl = returnUrl;
  if (getRouteFromUrl().name === "band-detail" && historyState.returnUrl && historyState.fromBandsIndex) {
    window.history.back();
    return;
  }
  navigateToRoute(returnUrl, { shouldFocusBandsView: true });
}

function navigateToSetDetail(row) {
  const setCode = getSetCode(row, getSetsRows().indexOf(row));
  const bandId = getBandId(activeMusicBand) || getRouteFromUrl().bandId;
  if (!bandId || !setCode) {
    return;
  }

  const historyState = window.history.state || {};
  const returnUrl = normalizeBandsReturnUrl(historyState.returnUrl || bandsIndexReturnUrl);
  const setsArchiveUrl = getBandSetsRouteUrl(bandId);
  bandsIndexReturnUrl = returnUrl;
  navigateToRoute(getSetRouteUrl(bandId, setCode), {
    historyState: {
      bandUrl: getBandRouteUrl(bandId),
      setsArchiveUrl,
      returnUrl,
      fromSetsArchive: true,
      fromBandsIndex: Boolean(historyState.fromBandsIndex),
    },
  });
}

function navigateToBandSetsArchive() {
  const bandId = getBandId(activeMusicBand) || getRouteFromUrl().bandId;
  if (!bandId) {
    showSetsArchive();
    return;
  }

  const historyState = window.history.state || {};
  const returnUrl = normalizeBandsReturnUrl(historyState.returnUrl || bandsIndexReturnUrl);
  bandsIndexReturnUrl = returnUrl;
  navigateToRoute(getBandSetsRouteUrl(bandId), {
    historyState: {
      bandUrl: getBandRouteUrl(bandId),
      returnUrl,
      fromBandDetail: true,
      fromBandsIndex: Boolean(historyState.fromBandsIndex),
    },
  });
}

function returnToBandDetailRoute() {
  const historyState = window.history.state || {};
  const route = getRouteFromUrl();
  const bandId = route.bandId || getBandId(activeMusicBand);
  if (!bandId) {
    returnToBandsIndexRoute();
    return;
  }

  const bandUrl = historyState.bandUrl || getBandRouteUrl(bandId);
  const setsArchiveUrl = historyState.setsArchiveUrl || getBandSetsRouteUrl(bandId);
  if (route.name === "set-detail" && historyState.setsArchiveUrl && historyState.fromSetsArchive) {
    window.history.back();
    return;
  }
  if (route.name === "set-detail") {
    navigateToRoute(setsArchiveUrl, {
      historyState: {
        bandUrl,
        returnUrl: normalizeBandsReturnUrl(historyState.returnUrl || bandsIndexReturnUrl),
        fromBandDetail: true,
        fromBandsIndex: Boolean(historyState.fromBandsIndex),
      },
    });
    return;
  }

  navigateToRoute(bandUrl, {
    historyState: {
      returnUrl: normalizeBandsReturnUrl(historyState.returnUrl || bandsIndexReturnUrl),
      fromBandsIndex: Boolean(historyState.fromBandsIndex),
    },
  });
}

function showSetGalleryRoute(row, options = {}) {
  if (!row || !setGallery) {
    return;
  }

  updateSetsFeaturedFromRow(row);
  updateSetGalleryFromRow(row);
  setGalleryViewMode("grid");
  setBandsIndexVisible(false);
  setBandDetailVisible(false);
  setSetDetailVisible(false);
  setSetsArchiveVisible(false);
  setSetGalleryVisible(true);
  setGalleryModeVisible(false);
  const tiles = getCurrentGalleryPhotoTiles();
  if (tiles[0]) {
    selectGalleryPhoto(tiles[0]);
  }
  setCurrentView(row.dataset.setTitle || "Set Detail");
  if (options.shouldScroll !== false && musicNexusShell) {
    musicNexusShell.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }
}

function showSetDetailRoute(band, setCode) {
  if (!band) {
    return;
  }

  activeMusicBand = band;
  const selectedSetCode = normalizeSetCode(setCode);
  if (!musicShowsSetsLoaded && musicShowsSetsCollection.length === 0) {
    restoreMusicShowsSetsFallback();
  }

  renderSetsArchiveRows(getSetsArchiveRowsForBand(band), { selectedSetCode });
  showSetGalleryRoute(findSetRowByCode(selectedSetCode) || createUnknownSetRow(selectedSetCode), { shouldScroll: false });
  requestMusicShowsSetsData().then(() => {
    const route = getRouteFromUrl();
    if (
      route.name !== "set-detail" ||
      String(route.bandId || "").toLowerCase() !== String(getBandId(band) || "").toLowerCase()
    ) {
      return;
    }

    const currentSetCode = normalizeSetCode(route.setCode || selectedSetCode);
    renderSetsArchiveRows(getSetsArchiveRowsForBand(band), { selectedSetCode: currentSetCode });
    showSetGalleryRoute(findSetRowByCode(currentSetCode) || createUnknownSetRow(currentSetCode), { shouldScroll: false });
  });
}

function showSetsArchiveRoute(band) {
  if (!band) {
    return;
  }

  showBandDetail(band);
  showSetsArchive({ shouldScroll: false });
}

function getMusicBandsIndexCollection() {
  return Array.isArray(musicBandsIndexCollection) ? musicBandsIndexCollection : [];
}

function setMusicBandsIndexCollection(rows, stateName = "fallback") {
  musicBandsIndexCollection = Array.isArray(rows) ? rows : getMockCollection("musicBands", { clone: false });
  if (typeof mockCollections !== "undefined") {
    mockCollections.musicBands = musicBandsIndexCollection;
  }
  if (musicBandsIndex) {
    musicBandsIndex.dataset.bandsDataState = stateName;
    musicBandsIndex.setAttribute("aria-busy", String(stateName === "loading"));
  }
}

function formatBandIndexNumber(value, fallback = "0") {
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return numericValue.toLocaleString();
  }

  return String(fallback);
}

function getBandIndexNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function createBandSlug(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "unknown-band";
}

function getBandInitials(name) {
  const initials = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "ID";
}

function getBandArchiveStatus(archivedSets, totalSets) {
  const archivedCount = getBandIndexNumber(archivedSets);
  const totalCount = getBandIndexNumber(totalSets);

  if (archivedCount === null || totalCount === null) {
    return { label: "Archive Pending", key: "neutral" };
  }
  if (archivedCount === 0) {
    return { label: "Needs Work", key: "needs" };
  }
  if (archivedCount > 0 && archivedCount < totalCount) {
    return { label: "Partial", key: "partial" };
  }
  if (archivedCount === totalCount && archivedCount > 0) {
    return { label: "Complete", key: "complete" };
  }

  return { label: "Archive Pending", key: "neutral" };
}

function formatBandDetailNumber(value, fallback = "0") {
  return formatBandIndexNumber(value, fallback);
}

function getBandDetailObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function getBandDetailGeneral(band) {
  return getBandDetailObject(band?.general);
}

function getBandDetailStats(band) {
  return getBandDetailObject(band?.stats);
}

function getBandDetailPersonnel(band) {
  return getBandDetailObject(band?.personnel);
}

function getBandDetailName(band) {
  const general = getBandDetailGeneral(band);
  return String(general.name || band?.name || band?.band || band?.title || "Band Detail").trim() || "Band Detail";
}

function getBandDetailLogoUrl(band, general = getBandDetailGeneral(band)) {
  return String(general.logo_url || band?.logoUrl || band?.logo_url || band?.logo || band?.image_url || "").trim();
}

function getBandDetailTags(general) {
  const sourceTags = general?.tags;
  const tags = Array.isArray(sourceTags)
    ? sourceTags
    : String(sourceTags || "")
        .split(/[,|]/)
        .map((tag) => tag.trim());

  return tags
    .map((tag) => String(tag || "").trim())
    .filter(Boolean);
}

function getBandDetailLocation(stats, band) {
  const locationParts = [
    stats.location || band?.location,
    stats.state || band?.state,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean);

  return locationParts.length > 0 ? locationParts.join(", ") : "Location Pending";
}

function getBandDetailCount(...values) {
  for (const value of values) {
    const numericValue = getBandIndexNumber(value);
    if (numericValue !== null) {
      return numericValue;
    }
  }

  return 0;
}

function getBandDetailCompletion(archivedSets, totalSets) {
  if (totalSets <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((archivedSets / totalSets) * 100)));
}

function getBandDetailMemberName(member) {
  if (typeof member === "string") {
    return member;
  }

  return String(member?.name || member?.member || member?.person || member?.title || "").trim();
}

function getBandDetailMemberRole(member) {
  if (!member || typeof member !== "object") {
    return "Role Pending";
  }

  const roleParts = Array.isArray(member.instruments) ? member.instruments : [];
  return String(member.role || member.instrument || member.position || member.category || roleParts.join(" / ") || "Role Pending").trim();
}

function getBandDetailMemberKey(member) {
  return getBandDetailMemberName(member).toLowerCase().replace(/\s+/g, " ").trim();
}

function getUniqueBandDetailMembers(members, excludedKeys = new Set()) {
  const seenKeys = new Set();
  return (Array.isArray(members) ? members : []).filter((member) => {
    const key = getBandDetailMemberKey(member);
    if (!key || excludedKeys.has(key) || seenKeys.has(key)) {
      return false;
    }

    seenKeys.add(key);
    return true;
  });
}

function normalizeBandDetailMembers(members) {
  return (Array.isArray(members) ? members : [])
    .map((member) => {
      const name = getBandDetailMemberName(member);
      if (!name) {
        return null;
      }

      return {
        name,
        role: getBandDetailMemberRole(member),
        thumb: getBandInitials(name),
      };
    })
    .filter(Boolean);
}

function renderBandDetailMembers(container, members, emptyText) {
  if (!container) {
    return;
  }

  const normalizedMembers = normalizeBandDetailMembers(members);
  const fragment = document.createDocumentFragment();

  if (normalizedMembers.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "band-member band-member--empty";
    const thumb = document.createElement("span");
    thumb.className = "band-member-thumb";
    thumb.setAttribute("aria-hidden", "true");
    thumb.textContent = "ID";
    const copy = document.createElement("div");
    copy.className = "band-member-copy";
    const name = document.createElement("p");
    name.className = "band-member-name";
    name.textContent = emptyText;
    const role = document.createElement("p");
    role.className = "band-member-role";
    role.textContent = "Ready for future personnel data";
    copy.append(name, role);
    emptyItem.append(thumb, copy);
    fragment.append(emptyItem);
  } else {
    normalizedMembers.forEach((member) => {
      const item = document.createElement("li");
      item.className = "band-member";
      const thumb = document.createElement("span");
      thumb.className = "band-member-thumb";
      thumb.setAttribute("aria-hidden", "true");
      thumb.textContent = member.thumb;
      const copy = document.createElement("div");
      copy.className = "band-member-copy";
      const name = document.createElement("p");
      name.className = "band-member-name";
      name.textContent = member.name;
      const role = document.createElement("p");
      role.className = "band-member-role";
      role.textContent = member.role;
      copy.append(name, role);
      item.append(thumb, copy);
      fragment.append(item);
    });
  }

  container.replaceChildren(fragment);
}

function setBandDetailLogo(logoUrl, name) {
  const logoShell = bandDetailLogoImage?.closest(".band-detail-logo");
  if (logoShell) {
    logoShell.classList.remove("has-live-logo");
  }
  if (bandDetailThumb) {
    bandDetailThumb.hidden = false;
    bandDetailThumb.textContent = getBandInitials(name);
  }
  if (!bandDetailLogoImage) {
    return;
  }

  bandDetailLogoImage.onload = null;
  bandDetailLogoImage.onerror = null;
  bandDetailLogoImage.hidden = true;
  bandDetailLogoImage.removeAttribute("src");

  if (!logoUrl) {
    return;
  }

  bandDetailLogoImage.onload = () => {
    bandDetailLogoImage.hidden = false;
    if (bandDetailThumb) {
      bandDetailThumb.hidden = true;
    }
    if (logoShell) {
      logoShell.classList.add("has-live-logo");
    }
  };
  bandDetailLogoImage.onerror = () => {
    bandDetailLogoImage.hidden = true;
    bandDetailLogoImage.removeAttribute("src");
    if (bandDetailThumb) {
      bandDetailThumb.hidden = false;
    }
    if (logoShell) {
      logoShell.classList.remove("has-live-logo");
    }
  };
  bandDetailLogoImage.src = logoUrl;
}

function getMusicBandsPayloadRows(payload) {
  const candidates = [
    payload?.data,
    payload?.rows,
    payload?.bands,
    payload?.source?.data,
    payload?.source?.rows,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
    if (candidate && typeof candidate === "object") {
      const nestedRows = Object.values(candidate).flatMap((value) => (Array.isArray(value) ? value : []));
      if (nestedRows.length > 0) {
        return nestedRows;
      }
    }
  }

  return [];
}

function normalizeLiveMusicBandRow(record, index = 0) {
  const source = record && typeof record === "object" ? record : {};
  const general = source.general && typeof source.general === "object" ? source.general : {};
  const stats = source.stats && typeof source.stats === "object" ? source.stats : {};
  const name = String(general.name || source.name || source.band || source.title || `Band ${index + 1}`).trim();
  const bandId = String(source.band_id || source.bandId || source.id || source.slug || createBandSlug(name)).trim();
  const archivedSets = getBandIndexNumber(stats.archived_sets);
  const totalSets = getBandIndexNumber(stats.total_sets);
  const totalPhotos = getBandIndexNumber(stats.totalPhotos ?? stats.total_photos ?? source.photo_count);
  const status = getBandArchiveStatus(archivedSets, totalSets);
  const region = String(stats.region || source.region || general.region || "Unmapped").trim() || "Unmapped";
  const logoUrl = String(general.logo_url || source.logo_url || source.logo || source.image_url || "").trim();
  const safeArchivedSets = archivedSets ?? 0;
  const safeTotalSets = totalSets ?? safeArchivedSets;
  const safeTotalPhotos = totalPhotos ?? 0;

  return {
    ...source,
    bandId,
    band_id: bandId,
    id: source.id || bandId,
    slug: source.slug || bandId,
    name,
    title: source.title || name,
    region,
    status: status.label,
    statusKey: status.key,
    albums: safeTotalSets,
    thumb: getBandInitials(name),
    logoUrl,
    image_url: logoUrl,
    photo_count: safeTotalPhotos,
    photos: safeTotalPhotos,
    archived_sets: safeArchivedSets,
    total_sets: safeTotalSets,
    general: {
      ...general,
      name,
      logo_url: logoUrl,
    },
    stats: {
      ...stats,
      region,
      totalPhotos: safeTotalPhotos,
      archived_sets: safeArchivedSets,
      total_sets: safeTotalSets,
    },
    backend_record: source,
  };
}

function normalizeLiveMusicBands(payload) {
  return getMusicBandsPayloadRows(payload)
    .map(normalizeLiveMusicBandRow)
    .filter((band) => band.name && getBandId(band))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function restoreMusicBandsFallback() {
  setMusicBandsIndexCollection(musicBandIndexRows, "fallback");
}

function requestMusicBandsIndexData() {
  if (musicBandsIndexLoaded) {
    return Promise.resolve(true);
  }
  if (musicBandsIndexRequest) {
    return musicBandsIndexRequest;
  }
  if (typeof fetch !== "function") {
    restoreMusicBandsFallback();
    return Promise.resolve(false);
  }

  if (musicBandsIndex) {
    musicBandsIndex.dataset.bandsDataState = "loading";
    musicBandsIndex.setAttribute("aria-busy", "true");
  }
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), MUSIC_BANDS_INDEX_TIMEOUT_MS)
    : 0;

  const apiUrl = new URL(MUSIC_BANDS_INDEX_API_ROUTE, MUSIC_BANDS_INDEX_API_BASE_URL);
  musicBandsIndexRequest = fetch(apiUrl, {
    cache: "no-store",
    signal: controller?.signal,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Music bands request failed (${response.status})`);
      }
      return response.json();
    })
    .then((payload) => {
      const liveRows = normalizeLiveMusicBands(payload);
      if (liveRows.length === 0) {
        throw new Error("Music bands response contained no rows");
      }

      setMusicBandsIndexCollection(liveRows, "live");
      musicBandsIndexLoaded = true;
      syncBandsIndex();
      return true;
    })
    .catch(() => {
      restoreMusicBandsFallback();
      syncBandsIndex();
      return false;
    })
    .finally(() => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      if (musicBandsIndex) {
        musicBandsIndex.setAttribute("aria-busy", "false");
      }
      musicBandsIndexRequest = null;
    });

  return musicBandsIndexRequest;
}

function getMusicPeopleIndexCollection() {
  return Array.isArray(musicPeopleIndexCollection) ? musicPeopleIndexCollection : [];
}

function setMusicPeopleIndexCollection(rows, stateName = "fallback") {
  musicPeopleIndexCollection = Array.isArray(rows) ? rows : [];
  musicPeopleIndexDataState = stateName;
  if (typeof mockCollections !== "undefined") {
    mockCollections.musicPeople = musicPeopleIndexCollection;
  }
  if (musicPeopleIndex) {
    musicPeopleIndex.dataset.peopleDataState = stateName;
    musicPeopleIndex.setAttribute("aria-busy", String(stateName === "loading"));
  }
}

function getMusicPeoplePayloadRows(payload) {
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

function normalizeLiveMusicPeople(payload) {
  return getMusicPeoplePayloadRows(payload)
    .map((person) => ({
      ...person,
      backend_record: person.backend_record || person,
    }))
    .filter((person) => getMusicPeopleText(person.name ?? person.title))
    .sort((left, right) => getMusicPeopleText(left.name ?? left.title).localeCompare(getMusicPeopleText(right.name ?? right.title)));
}

function restoreMusicPeopleFallback() {
  setMusicPeopleIndexCollection([], "error");
}

function requestMusicPeopleIndexData() {
  if (musicPeopleIndexLoaded) {
    return Promise.resolve(true);
  }
  if (musicPeopleIndexRequest) {
    return musicPeopleIndexRequest;
  }
  if (typeof fetch !== "function") {
    restoreMusicPeopleFallback();
    renderMusicPeopleIndex({ shouldResetScroll: false });
    return Promise.resolve(false);
  }

  setMusicPeopleIndexCollection([], "loading");
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), MUSIC_PEOPLE_INDEX_TIMEOUT_MS)
    : 0;

  const apiUrl = new URL(MUSIC_PEOPLE_INDEX_API_ROUTE, MUSIC_BANDS_INDEX_API_BASE_URL);
  musicPeopleIndexRequest = fetch(apiUrl, {
    cache: "no-store",
    signal: controller?.signal,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Music people request failed (${response.status})`);
      }
      return response.json();
    })
    .then((payload) => {
      const liveRows = normalizeLiveMusicPeople(payload);
      if (liveRows.length === 0) {
        throw new Error("Music people response contained no rows");
      }

      setMusicPeopleIndexCollection(liveRows, "live");
      musicPeopleIndexLoaded = true;
      renderMusicPeopleIndex({ shouldResetScroll: false });
      return true;
    })
    .catch(() => {
      restoreMusicPeopleFallback();
      renderMusicPeopleIndex({ shouldResetScroll: false });
      return false;
    })
    .finally(() => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      if (musicPeopleIndex) {
        musicPeopleIndex.setAttribute("aria-busy", "false");
      }
      musicPeopleIndexRequest = null;
    });

  return musicPeopleIndexRequest;
}

function getMusicShowsPayloadRows(payload) {
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
      const nestedRows = Object.values(candidate).flatMap((value) => {
        if (Array.isArray(value)) {
          return value;
        }
        return value && typeof value === "object" ? [value] : [];
      });
      if (nestedRows.length > 0) {
        return nestedRows;
      }
    }
  }

  return [];
}

function getMusicVenuesPayloadRows(payload) {
  const candidates = [
    payload?.data,
    payload?.rows,
    payload?.venues,
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
        return nestedRows;
      }
    }
  }

  return [];
}

function normalizeMusicVenueSlugValue(value) {
  return String(value || "")
    .trim()
    .replace(/^mv[_-]/i, "")
    .replace(/_/g, "-")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getMusicVenueId(venue) {
  return String(venue?.venue_id || venue?.venueId || venue?.id || "").trim();
}

function venueIdToSlug(venueId, venueRecord = null) {
  const explicitSlug = normalizeMusicVenueSlugValue(
    venueRecord?.slug
    || venueRecord?.venue_slug
    || venueRecord?.venueSlug
  );
  if (explicitSlug) {
    return explicitSlug;
  }

  const idSlug = normalizeMusicVenueSlugValue(venueId);
  if (idSlug) {
    return idSlug;
  }

  return normalizeMusicVenueSlugValue(getMusicVenueName(venueRecord));
}

function getMusicVenueSlug(venue) {
  return venueIdToSlug(getMusicVenueId(venue), venue);
}

function venueSlugToVenue(slug, venues = getMusicVenuesRows()) {
  const normalizedSlug = normalizeMusicVenueSlugValue(slug);
  if (!normalizedSlug) {
    return null;
  }

  const fallbackVenues = getMockCollection("musicVenues", { clone: false });
  const searchRows = [
    ...(Array.isArray(venues) ? venues : []),
    ...(Array.isArray(fallbackVenues) ? fallbackVenues : []),
  ];

  return searchRows.find((venue) => {
    const slugCandidates = [
      getMusicVenueSlug(venue),
      venue?.slug,
      venue?.venue_slug,
      venue?.venueSlug,
      venue?.venue_id,
      venue?.venueId,
      venue?.id,
    ];
    return slugCandidates
      .map(normalizeMusicVenueSlugValue)
      .some((candidate) => candidate === normalizedSlug);
  }) || null;
}

function getMusicVenueRouteUrl(venue) {
  const slug = typeof venue === "object"
    ? getMusicVenueSlug(venue)
    : normalizeMusicVenueSlugValue(venue);
  return `${routePaths.musicVenues}/${encodeURIComponent(slug || "venue-pending")}`;
}

function normalizeMusicVenueRow(record) {
  const source = record && typeof record === "object" ? record : {};
  const venueId = String(source.venue_id || source.venueId || source.id || source.slug || "").trim();
  const venueName = String(source.venue_name || source.venueName || source.venue || source.name || source.title || "").trim();

  return {
    ...source,
    venueId,
    venueName,
  };
}

function normalizeMusicVenues(payload) {
  return getMusicVenuesPayloadRows(payload)
    .map(normalizeMusicVenueRow)
    .filter((venue) => venue.venueId && isReadableMusicVenueName(venue.venueName));
}

function setMusicVenuesCollection(rows) {
  musicVenuesCollection = Array.isArray(rows) ? rows : [];
}

function findMusicVenueById(venueId) {
  const normalizedVenueId = String(venueId || "").trim().toLowerCase();
  const normalizedSlug = normalizeMusicVenueSlugValue(venueId);
  if (!normalizedVenueId) {
    return null;
  }

  const fallbackVenues = getMockCollection("musicVenues", { clone: false });
  const searchRows = [
    ...(Array.isArray(musicVenuesCollection) ? musicVenuesCollection : []),
    ...(Array.isArray(fallbackVenues) ? fallbackVenues : []),
  ];

  return searchRows.find((venue) => {
    const venueKeys = [
      venue.venueId,
      venue.venue_id,
      venue.id,
      venue.slug,
    ];
    return venueKeys.some((key) => String(key || "").trim().toLowerCase() === normalizedVenueId)
      || getMusicVenueSlug(venue) === normalizedSlug;
  }) || null;
}

function requestMusicVenuesData() {
  if (musicVenuesLoaded) {
    return Promise.resolve(true);
  }
  if (musicVenuesRequest) {
    return musicVenuesRequest;
  }
  if (typeof fetch !== "function") {
    return Promise.resolve(false);
  }

  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), MUSIC_VENUES_TIMEOUT_MS)
    : 0;
  const apiUrl = new URL(MUSIC_VENUES_API_ROUTE, MUSIC_BANDS_INDEX_API_BASE_URL);

  musicVenuesRequest = fetch(apiUrl, {
    cache: "no-store",
    signal: controller?.signal,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Music venues request failed (${response.status})`);
      }
      return response.json();
    })
    .then((payload) => {
      const liveRows = normalizeMusicVenues(payload);
      if (liveRows.length === 0) {
        throw new Error("Music venues response contained no rows");
      }

      setMusicVenuesCollection(liveRows);
      musicVenuesLoaded = true;
      return true;
    })
    .catch(() => false)
    .finally(() => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      musicVenuesRequest = null;
    });

  return musicVenuesRequest;
}

function getMusicVenuesRows() {
  return musicVenuesCollection.length > 0
    ? musicVenuesCollection
    : getMockCollection("musicVenues", { clone: false });
}

function normalizeMusicVenueState(value) {
  const rawState = String(value || "").trim();
  if (!rawState) {
    return "";
  }
  const uppercaseState = rawState.toUpperCase();
  if (musicVenueStateCodes.includes(uppercaseState)) {
    return uppercaseState;
  }
  return musicVenueStateAliases[uppercaseState] || "";
}

function getMusicVenueState(venue) {
  return normalizeMusicVenueState(
    venue?.state
    || venue?.state_abbr
    || venue?.stateAbbr
    || venue?.location_state
    || venue?.locationState
    || venue?.venue_details?.state
    || venue?.venueDetails?.state
  );
}

function getMusicVenueName(venue) {
  return String(venue?.venueName || venue?.venue_name || venue?.venue || venue?.name || venue?.title || "Venue Pending").trim();
}

function getMusicVenueLocationText(venue) {
  const city = String(venue?.city || venue?.location_city || venue?.locationCity || venue?.venue_details?.city || venue?.venueDetails?.city || "").trim();
  const state = getMusicVenueState(venue) || String(venue?.state || venue?.venue_details?.state || venue?.venueDetails?.state || "").trim();
  return [city, state].filter(Boolean).join(", ") || String(venue?.location || "Location Pending").trim();
}

function getMusicVenueShowCount(venue) {
  const count = Number.parseInt(
    venue?.showCount
    || venue?.show_count
    || venue?.eventCount
    || venue?.event_count
    || venue?.stats?.showCount
    || venue?.stats?.shows
    || venue?.stats?.eventCount,
    10
  );
  return Number.isFinite(count) && count >= 0 ? count : null;
}

function getMusicVenuePhotoCount(venue) {
  const count = Number.parseInt(
    venue?.photoCount
    || venue?.photo_count
    || venue?.photos
    || venue?.stats?.photoCount
    || venue?.stats?.photos
    || venue?.stats?.totalPhotos,
    10
  );
  return Number.isFinite(count) && count >= 0 ? count : null;
}

function getMusicVenueBandCount(venue) {
  const count = Number.parseInt(
    venue?.bandCount
    || venue?.band_count
    || venue?.bandsCount
    || venue?.stats?.bandCount
    || venue?.stats?.bands,
    10
  );
  return Number.isFinite(count) && count >= 0 ? count : null;
}

function getMusicVenueArchiveMetrics(venue) {
  const linkedShows = getMusicVenueShows(venue);
  const fallbackEvents = getMusicVenueShowCount(venue);
  const fallbackPhotos = getMusicVenuePhotoCount(venue);
  let linkedPhotos = 0;

  linkedShows.forEach((show) => {
    const photoCount = Number.parseInt(getMusicShowPhotoCount(show), 10);
    if (Number.isFinite(photoCount) && photoCount > 0) {
      linkedPhotos += photoCount;
    }
  });

  return {
    events: linkedShows.length > 0 ? linkedShows.length : fallbackEvents ?? 0,
    photos: linkedPhotos > 0 ? linkedPhotos : fallbackPhotos ?? 0,
  };
}

function getMusicVenueArchiveStatus(venue, metrics = getMusicVenueArchiveMetrics(venue)) {
  const rawStatus = String(
    venue?.archiveStatus
    || venue?.archive_status
    || venue?.status
    || venue?.venue_status
    || venue?.stats?.status
    || ""
  ).trim().toLowerCase();

  if (/new|added|fresh|pending|staged/.test(rawStatus)) {
    return { key: "new", label: "New" };
  }
  if (/partial|incomplete|needs|draft|working/.test(rawStatus)) {
    return { key: "partial", label: "Partial" };
  }
  if (/complete|ready|active|archived/.test(rawStatus)) {
    return { key: "complete", label: "Complete" };
  }

  return (metrics.events > 0 || metrics.photos > 0)
    ? { key: "complete", label: "Complete" }
    : { key: "new", label: "New" };
}

function getMusicVenueAddedTimestamp(venue) {
  const dateCandidates = [
    venue?.created_at,
    venue?.createdAt,
    venue?.date_added,
    venue?.dateAdded,
    venue?.added_at,
    venue?.addedAt,
    venue?.updated_at,
    venue?.updatedAt,
    venue?.imported_at,
    venue?.importedAt,
  ];

  for (const candidate of dateCandidates) {
    const timestamp = Date.parse(String(candidate || ""));
    if (Number.isFinite(timestamp)) {
      return timestamp;
    }
  }

  return null;
}

function getMusicVenueSearchText(venue) {
  return [
    getMusicVenueName(venue),
    venue?.city,
    venue?.state,
    getMusicVenueState(venue),
    venue?.region,
    venue?.location_label,
    getMusicVenueLocationText(venue),
  ].map((value) => String(value || "").toLowerCase()).join(" ");
}

function setMusicVenuesCount(count) {
  if (!musicVenuesCount) {
    return;
  }
  const numericCount = Number(count) || 0;
  musicVenuesCount.textContent = `${numericCount.toLocaleString()} venue${numericCount === 1 ? "" : "s"}`;
}

function getMusicVenuesArchiveRows() {
  return getMusicVenuesRows()
    .filter((venue) => getMusicVenueSlug(venue))
    .sort((left, right) => getMusicVenueName(left).localeCompare(getMusicVenueName(right)));
}

function getMusicVenueRowsForState(rows, stateFilter = activeMusicVenueStateFilter) {
  return stateFilter
    ? rows.filter((venue) => getMusicVenueState(venue) === stateFilter)
    : rows;
}

function getMusicVenueSelectOptions(rows, stateFilter = activeMusicVenueStateFilter) {
  const options = new Map();
  getMusicVenueRowsForState(rows, stateFilter).forEach((venue) => {
    const slug = getMusicVenueSlug(venue);
    const label = getMusicVenueName(venue);
    if (slug && label && !options.has(slug)) {
      options.set(slug, { value: slug, label });
    }
  });
  return Array.from(options.values()).sort((left, right) => left.label.localeCompare(right.label));
}

function normalizeActiveMusicVenueFilters(rows) {
  const stateOptions = new Set(rows.map(getMusicVenueState).filter(Boolean));
  if (activeMusicVenueStateFilter && !stateOptions.has(activeMusicVenueStateFilter)) {
    activeMusicVenueStateFilter = "";
  }
  const venueOptions = new Set(
    getMusicVenueSelectOptions(rows, activeMusicVenueStateFilter).map((venue) => venue.value)
  );
  if (activeMusicVenueSlugFilter && !venueOptions.has(activeMusicVenueSlugFilter)) {
    activeMusicVenueSlugFilter = "";
  }
}

function getFilteredMusicVenues() {
  const rows = getMusicVenuesArchiveRows();
  normalizeActiveMusicVenueFilters(rows);
  const searchTerm = activeMusicVenueSearch.trim().toLowerCase();

  const filteredRows = rows.filter((venue) => {
    if (activeMusicVenueStateFilter && getMusicVenueState(venue) !== activeMusicVenueStateFilter) {
      return false;
    }
    if (activeMusicVenueSlugFilter && getMusicVenueSlug(venue) !== activeMusicVenueSlugFilter) {
      return false;
    }
    if (!searchTerm) {
      return true;
    }
    return getMusicVenueSearchText(venue).includes(searchTerm);
  });

  return sortMusicVenueRows(filteredRows);
}

function sortMusicVenueRows(rows) {
  const sortValue = musicVenueSortOptions.some((option) => option.value === activeMusicVenueSort)
    ? activeMusicVenueSort
    : "az";
  const sortedRows = [...rows];
  const sortByName = (left, right) => getMusicVenueName(left).localeCompare(getMusicVenueName(right));

  if (sortValue === "events") {
    return sortedRows.sort((left, right) =>
      getMusicVenueArchiveMetrics(right).events - getMusicVenueArchiveMetrics(left).events || sortByName(left, right)
    );
  }
  if (sortValue === "photos") {
    return sortedRows.sort((left, right) =>
      getMusicVenueArchiveMetrics(right).photos - getMusicVenueArchiveMetrics(left).photos || sortByName(left, right)
    );
  }
  if (sortValue === "newest") {
    return sortedRows.sort((left, right) => {
      const leftTimestamp = getMusicVenueAddedTimestamp(left);
      const rightTimestamp = getMusicVenueAddedTimestamp(right);
      if (Number.isFinite(leftTimestamp) && Number.isFinite(rightTimestamp)) {
        return rightTimestamp - leftTimestamp || sortByName(left, right);
      }
      if (Number.isFinite(leftTimestamp)) {
        return -1;
      }
      if (Number.isFinite(rightTimestamp)) {
        return 1;
      }
      return sortByName(left, right);
    });
  }

  return sortedRows.sort(sortByName);
}

function updateMusicVenuesFilter(filterName, value) {
  if (filterName === "search") {
    activeMusicVenueSearch = String(value || "");
    renderMusicVenuesResults();
    return;
  } else if (filterName === "state") {
    activeMusicVenueStateFilter = normalizeMusicVenueState(value);
    normalizeActiveMusicVenueFilters(getMusicVenuesArchiveRows());
    renderMusicVenuesFilters();
  } else if (filterName === "venue") {
    activeMusicVenueSlugFilter = normalizeMusicVenueSlugValue(value);
    normalizeActiveMusicVenueFilters(getMusicVenuesArchiveRows());
  } else if (filterName === "sort") {
    activeMusicVenueSort = musicVenueSortOptions.some((option) => option.value === value) ? value : "az";
  }
  renderMusicVenuesResults();
}

function resetMusicVenuesFilters() {
  activeMusicVenueSearch = "";
  activeMusicVenueStateFilter = "";
  activeMusicVenueSlugFilter = "";
  activeMusicVenueSort = "az";
  renderMusicVenuesArchive();
}

function createMusicVenuesFilterField(labelText, fieldName, options, activeValue, allLabel = "") {
  const label = document.createElement("label");
  label.className = "music-venues-filter-field";

  const labelSpan = document.createElement("span");
  labelSpan.className = "music-venues-filter-label";
  labelSpan.textContent = labelText;

  const select = document.createElement("select");
  select.className = "music-venues-filter-select";
  select.dataset.musicVenuesFilter = fieldName;
  select.setAttribute("aria-label", `Filter venues by ${labelText.toLowerCase()}`);

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
    updateMusicVenuesFilter(fieldName, select.value);
  });

  label.append(labelSpan, select);
  return label;
}

function createMusicVenuesFilters(rows) {
  const filters = document.createElement("section");
  filters.className = "music-venues-filter-bar";
  filters.setAttribute("aria-label", "Venue archive filters");

  const searchLabel = document.createElement("label");
  searchLabel.className = "music-venues-filter-field music-venues-filter-field--search";
  const searchText = document.createElement("span");
  searchText.className = "music-venues-filter-label";
  searchText.textContent = "Search Venue";
  const searchInput = document.createElement("input");
  searchInput.className = "music-venues-search-input";
  searchInput.type = "search";
  searchInput.autocomplete = "off";
  searchInput.placeholder = "Search name or city";
  searchInput.value = activeMusicVenueSearch;
  searchInput.dataset.musicVenuesFilter = "search";
  searchInput.addEventListener("input", () => {
    updateMusicVenuesFilter("search", searchInput.value);
  });
  searchLabel.append(searchText, searchInput);

  const states = getMusicShowsUniqueOptions(rows, getMusicVenueState)
    .map((state) => ({ value: state, label: state }));
  const venues = getMusicVenueSelectOptions(rows, activeMusicVenueStateFilter);

  const resetButton = document.createElement("button");
  resetButton.className = "music-venues-filter-reset";
  resetButton.type = "button";
  resetButton.textContent = "Reset Filters";
  resetButton.addEventListener("click", resetMusicVenuesFilters);

  filters.append(
    searchLabel,
    createMusicVenuesFilterField("State", "state", states, activeMusicVenueStateFilter, "All States"),
    createMusicVenuesFilterField("Venue", "venue", venues, activeMusicVenueSlugFilter, "All Venues"),
    createMusicVenuesFilterField("Sort", "sort", musicVenueSortOptions, activeMusicVenueSort),
    resetButton
  );

  return filters;
}

function renderMusicVenuesFilters(rows = getMusicVenuesArchiveRows()) {
  if (!musicVenuesFilters) {
    return;
  }

  const activeElement = document.activeElement;
  const shouldRestoreSearchFocus = activeElement?.matches?.("[data-music-venues-filter='search']");
  const selectionStart = shouldRestoreSearchFocus ? activeElement.selectionStart : null;
  const selectionEnd = shouldRestoreSearchFocus ? activeElement.selectionEnd : null;

  musicVenuesFilters.replaceChildren(createMusicVenuesFilters(rows));

  if (shouldRestoreSearchFocus) {
    const searchInput = musicVenuesFilters.querySelector("[data-music-venues-filter='search']");
    if (searchInput) {
      searchInput.focus({ preventScroll: true });
      if (Number.isInteger(selectionStart) && Number.isInteger(selectionEnd)) {
        searchInput.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  }
}

function createMusicVenueMetric(label, value, iconType) {
  const metric = document.createElement("span");
  metric.className = "music-venue-card-metric";
  metric.setAttribute("aria-label", `${Number(value || 0).toLocaleString()} ${label}`);

  const icon = document.createElement("span");
  icon.className = `music-venue-card-metric-icon music-venue-card-metric-icon--${iconType}`;
  icon.setAttribute("aria-hidden", "true");

  const count = document.createElement("span");
  count.textContent = Number(value || 0).toLocaleString();

  metric.append(icon, count);
  return metric;
}

function createMusicVenueCard(venue) {
  const card = document.createElement("article");
  card.className = "music-venue-card";
  card.dataset.venueState = getMusicVenueState(venue);
  card.dataset.venueSlug = getMusicVenueSlug(venue);
  card.dataset.venueDetailRoute = getMusicVenueRouteUrl(venue);
  card.setAttribute("role", "listitem");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", `Open ${getMusicVenueName(venue)} venue detail`);

  const mark = document.createElement("span");
  mark.className = "music-venue-card-mark";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = getBandInitials(getMusicVenueName(venue)) || "VN";

  const copy = document.createElement("div");
  copy.className = "music-venue-card-copy";

  const name = document.createElement("h5");
  name.className = "music-venue-card-name";
  name.textContent = getMusicVenueName(venue);

  const location = document.createElement("p");
  location.className = "music-venue-card-location";
  location.textContent = getMusicVenueLocationText(venue);

  const metrics = getMusicVenueArchiveMetrics(venue);
  const stats = document.createElement("div");
  stats.className = "music-venue-card-stats";
  stats.append(
    createMusicVenueMetric("events", metrics.events, "events"),
    createMusicVenueMetric("photos", metrics.photos, "photos")
  );

  const status = getMusicVenueArchiveStatus(venue, metrics);
  const badge = document.createElement("span");
  badge.className = `music-venue-card-status music-venue-card-status--${status.key}`;
  badge.textContent = status.label;

  const action = document.createElement("span");
  action.className = "music-venue-card-action";
  action.setAttribute("aria-hidden", "true");
  action.textContent = "View";

  copy.append(name, location, stats, badge);
  card.append(mark, copy, action);
  card.addEventListener("click", () => {
    navigateToMusicVenueDetail(venue);
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigateToMusicVenueDetail(venue);
    }
  });
  return card;
}

function renderMusicVenuesResults() {
  if (!musicVenuesList) {
    return;
  }

  const visibleRows = getFilteredMusicVenues();

  musicVenuesList.replaceChildren();
  visibleRows.forEach((venue) => {
    musicVenuesList.append(createMusicVenueCard(venue));
  });
  if (visibleRows.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "music-venues-empty";
    emptyState.textContent = "No venues match the current filters.";
    musicVenuesList.append(emptyState);
  }
  setMusicVenuesCount(visibleRows.length);
}

function renderMusicVenuesArchive() {
  const rows = getMusicVenuesArchiveRows();
  normalizeActiveMusicVenueFilters(rows);
  renderMusicVenuesFilters(rows);
  renderMusicVenuesResults();
}

function syncMusicVenuesArchive() {
  renderMusicVenuesArchive();
  Promise.allSettled([
    requestMusicVenuesData(),
    requestMusicShowsSetsData(),
  ]).then(() => {
    if (getRouteFromUrl().name === "music-venues") {
      renderMusicVenuesArchive();
    }
  });
}

function returnToMusicVenuesRoute() {
  navigateToRoute(routePaths.musicVenues);
}

function navigateToMusicVenueDetail(venue) {
  navigateToRoute(getMusicVenueRouteUrl(venue), {
    historyState: {
      fromMusicVenuesIndex: true,
    },
  });
}

function getMusicShowVenueId(show) {
  return String(
    show?.venue_id
    || show?.venueId
    || show?.venue_details?.venue_id
    || show?.venueDetails?.venue_id
    || show?.venueDetails?.venueId
    || ""
  ).trim();
}

function getMusicVenueShows(venue) {
  const venueId = getMusicVenueId(venue).toLowerCase();
  if (!venueId) {
    return [];
  }

  return getMusicShowsIndexRows()
    .filter((show) => getMusicShowVenueId(show).toLowerCase() === venueId)
    .sort((left, right) => getMusicShowTimestamp(right) - getMusicShowTimestamp(left) || getMusicShowTitle(left).localeCompare(getMusicShowTitle(right)));
}

function getMusicVenueDetailStats(venue, linkedShows = null) {
  const shows = Array.isArray(linkedShows) ? linkedShows : getMusicVenueShows(venue);
  const uniqueBands = new Set();
  let photoTotal = 0;

  shows.forEach((show) => {
    getMusicShowBandNames(show).forEach((bandName) => {
      const normalizedName = String(bandName || "").trim().toLowerCase();
      if (normalizedName) {
        uniqueBands.add(normalizedName);
      }
    });
    const photoCount = Number.parseInt(getMusicShowPhotoCount(show), 10);
    if (Number.isFinite(photoCount) && photoCount > 0) {
      photoTotal += photoCount;
    }
  });

  return {
    shows: shows.length,
    bands: uniqueBands.size || getMusicVenueBandCount(venue),
    photos: photoTotal || getMusicVenuePhotoCount(venue),
  };
}

function collectMusicVenueArtistNames(value, target = []) {
  if (!value) {
    return target;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectMusicVenueArtistNames(item, target));
    return target;
  }

  if (typeof value === "object") {
    [
      value.band,
      value.name,
      value.band_name,
      value.bandName,
      value.artist,
      value.artist_name,
      value.artistName,
      value.title,
    ].forEach((item) => collectMusicVenueArtistNames(item, target));
    return target;
  }

  const name = String(value || "").trim();
  if (name) {
    target.push(name);
  }
  return target;
}

function cleanMusicVenueTitleArtistName(value) {
  return String(value || "")
    .replace(/\s+(?:&|\+)\s+guests?.*$/i, "")
    .replace(/\bguests?\b.*$/i, "")
    .replace(/\b(?:cd|album)\s+release.*$/i, "")
    .replace(/\s+-\s+night\s+\d+.*$/i, "")
    .replace(/\s+\d{4}$/i, "")
    .trim();
}

function getMusicVenueShowTitleArtistNames(show) {
  const title = getMusicShowTitle(show);
  if (!title) {
    return [];
  }

  return title
    .split(/\s+(?:w\/|with)\s+|\s*\/\s*|[,;]+/i)
    .map(cleanMusicVenueTitleArtistName)
    .filter((name) => name && !/^(guest|guests|archive|show|event)$/i.test(name));
}

function getMusicVenueShowArtistNames(show) {
  const structuredNames = [
    ...getMusicShowBandNames(show),
    ...collectMusicVenueArtistNames(show?.bandNames),
    ...collectMusicVenueArtistNames(show?.artists),
    ...collectMusicVenueArtistNames(show?.artistNames),
    ...collectMusicVenueArtistNames(show?.performers),
    ...collectMusicVenueArtistNames(show?.lineup),
    ...collectMusicVenueArtistNames(show?.bill),
    ...collectMusicVenueArtistNames(show?.backend_record?.bands),
    ...collectMusicVenueArtistNames(show?.backendRecord?.bands),
    ...collectMusicVenueArtistNames(show?.backend_record?.artists),
    ...collectMusicVenueArtistNames(show?.backendRecord?.artists),
  ].map((name) => String(name || "").trim()).filter(Boolean);

  return structuredNames.length > 0
    ? structuredNames
    : getMusicVenueShowTitleArtistNames(show);
}

function getMusicVenueArtists(venue, linkedShows = null) {
  const artistsByKey = new Map();
  const shows = Array.isArray(linkedShows) ? linkedShows : getMusicVenueShows(venue);
  shows.forEach((show) => {
    const showArtists = new Map();
    getMusicVenueShowArtistNames(show).forEach((bandName) => {
      const name = String(bandName || "").trim();
      const key = name.toLowerCase();
      if (name && !showArtists.has(key)) {
        showArtists.set(key, name);
      }
    });

    showArtists.forEach((name, key) => {
      const artist = artistsByKey.get(key) || {
        name,
        slug: createBandSlug(name),
        appearances: 0,
      };
      artist.appearances += 1;
      artistsByKey.set(key, artist);
    });
  });

  return Array.from(artistsByKey.values())
    .sort((left, right) => right.appearances - left.appearances || left.name.localeCompare(right.name));
}

function formatMusicVenueDetailCount(value) {
  const numericValue = Number.parseInt(value, 10);
  return Number.isFinite(numericValue) && numericValue >= 0
    ? numericValue.toLocaleString()
    : "—";
}

function setMusicVenueDetailRelationshipCount(type, value) {
  if (!venueDetail) {
    return;
  }
  const relationshipValue = venueDetail.querySelector(`[data-venue-relationship="${type}"] .venue-relationship-media span`);
  if (relationshipValue) {
    relationshipValue.textContent = formatMusicVenueDetailCount(value);
  }
}

function getMusicVenueShowYear(show) {
  const parsedDate = parseMusicShowDate(show?.rawDate || show?.date || show?.show_date || show?.eventDate || show?.formattedDate);
  if (parsedDate) {
    return String(parsedDate.getFullYear());
  }

  const year = String(show?.year || "").trim();
  return /^\d{4}$/.test(year) ? year : "Pending";
}

function getMusicVenueShowSafeCountMeta(show) {
  const photoCount = Number.parseInt(
    show?.photo_count
    || show?.photoCount
    || show?.tagged_photo_count
    || show?.stats?.photoCount
    || show?.stats?.photos,
    10
  );
  if (Number.isFinite(photoCount) && photoCount > 0) {
    return `${photoCount.toLocaleString()} photo${photoCount === 1 ? "" : "s"}`;
  }

  const setCount = Number.parseInt(
    show?.set_count
    || show?.setCount
    || show?.stats?.setCount
    || show?.stats?.sets,
    10
  );
  return Number.isFinite(setCount) && setCount > 0
    ? `${setCount.toLocaleString()} set${setCount === 1 ? "" : "s"}`
    : "";
}

function createVenueShowsEmptyState() {
  const empty = document.createElement("p");
  empty.className = "venue-shows-empty";
  empty.textContent = "No shows linked to this venue.";
  return empty;
}

function createVenueShowRow(show) {
  const row = document.createElement("button");
  row.className = "venue-show-row";
  row.type = "button";
  row.dataset.venueShowRow = "";
  row.dataset.showDetailRoute = getMusicShowRouteUrl(show);
  row.setAttribute("aria-label", `Open ${getMusicShowTitle(show)} show detail`);

  const copy = document.createElement("span");
  copy.className = "venue-show-row-copy";

  const title = document.createElement("span");
  title.className = "venue-show-title";
  title.textContent = getMusicShowTitle(show);

  const date = document.createElement("span");
  date.className = "venue-show-date";
  date.textContent = getMusicShowDateLabel(show);

  copy.append(title, date);
  row.append(copy);

  const countMeta = getMusicVenueShowSafeCountMeta(show);
  if (countMeta) {
    const meta = document.createElement("span");
    meta.className = "venue-show-meta";
    meta.textContent = countMeta;
    row.append(meta);
  }

  row.addEventListener("click", (event) => {
    event.stopPropagation();
    navigateToRoute(getMusicShowRouteUrl(show), {
      historyState: {
        fromVenueDetail: true,
        venueUrl: getMusicVenueRouteUrl(activeMusicVenueDetailSlug),
      },
    });
  });

  return row;
}

function renderVenueShowsPanel(panel, shows) {
  panel.replaceChildren();
  const inner = document.createElement("div");
  inner.className = "venue-shows-panel-inner";
  panel.append(inner);

  if (!Array.isArray(shows) || shows.length === 0) {
    inner.append(createVenueShowsEmptyState());
    return;
  }

  const groupedShows = shows.reduce((groups, show) => {
    const year = getMusicVenueShowYear(show);
    if (!groups.has(year)) {
      groups.set(year, []);
    }
    groups.get(year).push(show);
    return groups;
  }, new Map());

  const years = Array.from(groupedShows.keys()).sort((left, right) => {
    const leftYear = Number.parseInt(left, 10);
    const rightYear = Number.parseInt(right, 10);
    if (Number.isFinite(leftYear) && Number.isFinite(rightYear)) {
      return rightYear - leftYear;
    }
    if (Number.isFinite(leftYear)) {
      return -1;
    }
    if (Number.isFinite(rightYear)) {
      return 1;
    }
    return left.localeCompare(right);
  });

  years.forEach((year) => {
    const group = document.createElement("section");
    group.className = "venue-shows-year-group";
    group.setAttribute("aria-label", `${year} linked shows`);

    const heading = document.createElement("h6");
    heading.className = "venue-shows-year";
    heading.textContent = year;

    const list = document.createElement("div");
    list.className = "venue-shows-list";
    list.setAttribute("role", "list");
    const yearShows = groupedShows.get(year)
      .sort((left, right) => getMusicShowTimestamp(right) - getMusicShowTimestamp(left) || getMusicShowTitle(left).localeCompare(getMusicShowTitle(right)));
    list.classList.toggle("venue-shows-list--split", yearShows.length > 1);
    yearShows.forEach((show) => {
      const item = document.createElement("div");
      item.className = "venue-show-item";
      item.setAttribute("role", "listitem");
      item.append(createVenueShowRow(show));
      list.append(item);
    });

    group.append(heading, list);
    inner.append(group);
  });
}

function createVenueArtistsEmptyState(text = "No artists linked to this venue.") {
  const empty = document.createElement("p");
  empty.className = "venue-shows-empty venue-artists-empty";
  empty.textContent = text;
  return empty;
}

function createVenueArtistPill(artist) {
  const item = document.createElement("span");
  item.className = "venue-artist-pill";
  item.setAttribute("role", "listitem");
  item.dataset.futureBandRoute = `/music/bands/${encodeURIComponent(artist.slug || createBandSlug(artist.name))}`;
  item.textContent = artist.name;
  return item;
}

function createVenueArtistLeaderboardCard(artist, index) {
  const item = document.createElement("li");
  item.className = "venue-artists-top-card";

  const rank = document.createElement("span");
  rank.className = "venue-artist-rank";
  rank.textContent = `#${index + 1}`;

  const count = document.createElement("span");
  count.className = "venue-artist-count";
  count.textContent = artist.appearances.toLocaleString();

  const name = document.createElement("span");
  name.className = "venue-artist-name";
  name.textContent = artist.name;

  const label = document.createElement("span");
  label.className = "venue-artist-label";
  label.textContent = "Documented";

  item.append(rank, count, name, label);
  return item;
}

function updateVenueArtistsGrid(grid, artists, searchTerm) {
  if (!grid) {
    return;
  }

  const normalizedSearch = String(searchTerm || "").trim().toLowerCase();
  const filteredArtists = (Array.isArray(artists) ? artists : [])
    .filter((artist) => !normalizedSearch || artist.name.toLowerCase().includes(normalizedSearch))
    .sort((left, right) => left.name.localeCompare(right.name));

  grid.replaceChildren();
  if (filteredArtists.length === 0) {
    grid.append(createVenueArtistsEmptyState(normalizedSearch ? "No artists match this search." : "No artists linked to this venue."));
    return;
  }

  filteredArtists.forEach((artist) => {
    grid.append(createVenueArtistPill(artist));
  });
}

function renderVenueArtistsPanel(panel, artists, card) {
  const venueArtists = Array.isArray(artists) ? artists : [];
  panel.replaceChildren();
  const inner = document.createElement("div");
  inner.className = "venue-shows-panel-inner venue-artists-panel-inner";
  panel.append(inner);

  if (venueArtists.length === 0) {
    inner.append(createVenueArtistsEmptyState());
    return;
  }

  const summary = document.createElement("section");
  summary.className = "venue-artists-summary";

  const title = document.createElement("h5");
  title.className = "venue-artists-title";
  title.textContent = "Featured Artists";

  const copy = document.createElement("p");
  copy.className = "venue-artists-copy";
  copy.textContent = `${venueArtists.length.toLocaleString()} artist${venueArtists.length === 1 ? "" : "s"} documented at this venue`;

  const topArtists = document.createElement("div");
  topArtists.className = "venue-artists-top";

  const topTitle = document.createElement("h6");
  topTitle.className = "venue-artists-top-title";
  topTitle.textContent = "Most Documented Artists";

  const topList = document.createElement("ol");
  topList.className = "venue-artists-top-list";
  venueArtists.slice(0, 3).forEach((artist) => {
    topList.append(createVenueArtistLeaderboardCard(artist, topList.children.length));
  });
  topArtists.append(topTitle, topList);
  summary.append(title, copy, topArtists);

  const searchLabel = document.createElement("label");
  searchLabel.className = "venue-artists-search-field";
  const searchText = document.createElement("span");
  searchText.className = "venue-artists-search-label";
  searchText.textContent = "Search Artists";
  const searchInput = document.createElement("input");
  searchInput.className = "venue-artists-search-input";
  searchInput.type = "search";
  searchInput.autocomplete = "off";
  searchInput.placeholder = "Search artist name";
  searchInput.value = String(card?._venueArtistSearch || "");
  searchLabel.append(searchText, searchInput);

  const grid = document.createElement("div");
  grid.className = "venue-artists-grid";
  grid.setAttribute("role", "list");

  searchInput.addEventListener("input", () => {
    if (card) {
      card._venueArtistSearch = searchInput.value;
    }
    updateVenueArtistsGrid(grid, venueArtists, searchInput.value);
  });

  inner.append(summary, searchLabel, grid);
  updateVenueArtistsGrid(grid, venueArtists, searchInput.value);
}

function getVenueShowsRelationshipPanel() {
  if (!venueDetail) {
    return null;
  }

  const relationships = venueDetail.querySelector("[data-venue-relationships]");
  const grid = relationships?.querySelector(".venue-relationship-grid");
  if (!relationships || !grid) {
    return null;
  }

  let panel = Array.from(relationships.children).find((child) => child.hasAttribute("data-venue-shows-panel"));
  if (!panel) {
    panel = document.createElement("div");
    panel.className = "venue-shows-panel";
    panel.dataset.venueShowsPanel = "";
    panel.id = "venue-relationship-shows-panel";
    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute("inert", "");
  }

  if (panel.previousElementSibling !== grid) {
    grid.insertAdjacentElement("afterend", panel);
  }

  return panel;
}

function getVenueArtistsRelationshipPanel() {
  if (!venueDetail) {
    return null;
  }

  const relationships = venueDetail.querySelector("[data-venue-relationships]");
  const grid = relationships?.querySelector(".venue-relationship-grid");
  if (!relationships || !grid) {
    return null;
  }

  let panel = Array.from(relationships.children).find((child) => child.hasAttribute("data-venue-artists-panel"));
  if (!panel) {
    panel = document.createElement("div");
    panel.className = "venue-shows-panel venue-artists-panel";
    panel.dataset.venueArtistsPanel = "";
    panel.id = "venue-relationship-artists-panel";
    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute("inert", "");
  }

  if (panel.previousElementSibling !== grid) {
    grid.insertAdjacentElement("afterend", panel);
  }

  return panel;
}

function setVenueRelationshipFocus(activeType = "") {
  if (!venueDetail) {
    return;
  }

  const relationships = venueDetail.querySelector("[data-venue-relationships]");
  if (!relationships) {
    return;
  }

  const cards = Array.from(relationships.querySelectorAll("[data-venue-relationship]"));
  const normalizedType = String(activeType || "").trim();
  activeVenueRelationship = cards.some((card) => card.dataset.venueRelationship === normalizedType)
    ? normalizedType
    : "";

  relationships.classList.toggle("is-focused", Boolean(activeVenueRelationship));
  if (activeVenueRelationship) {
    relationships.dataset.activeVenueRelationship = activeVenueRelationship;
  } else {
    delete relationships.dataset.activeVenueRelationship;
  }

  cards.forEach((card) => {
    const isInactive = Boolean(activeVenueRelationship) && card.dataset.venueRelationship !== activeVenueRelationship;
    card.classList.toggle("is-inactive", isInactive);
    card.hidden = isInactive;
    if (isInactive) {
      card.setAttribute("aria-hidden", "true");
      card.setAttribute("inert", "");
    } else {
      card.removeAttribute("aria-hidden");
      card.removeAttribute("inert");
    }
  });
}

function updateVenueRelationshipFocusWithMotion(card, updateFocus) {
  if (typeof updateFocus !== "function") {
    return;
  }

  const shouldReduceMotion = typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!card || shouldReduceMotion) {
    updateFocus();
    return;
  }

  const before = card.getBoundingClientRect();
  updateFocus();
  const after = card.getBoundingClientRect();
  const deltaX = before.left - after.left;
  const deltaY = before.top - after.top;
  if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) {
    return;
  }

  let didCleanup = false;
  const cleanup = () => {
    if (didCleanup) {
      return;
    }
    didCleanup = true;
    card.style.transition = "";
    card.style.transform = "";
    card.removeEventListener("transitionend", handleTransitionEnd);
  };
  const handleTransitionEnd = (event) => {
    if (event.propertyName === "transform") {
      cleanup();
    }
  };

  card.style.transition = "none";
  card.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
  card.getBoundingClientRect();
  card.addEventListener("transitionend", handleTransitionEnd);
  card.style.transition = "transform var(--motion-standard) var(--ease-standard)";
  card.style.transform = "";
  window.setTimeout(cleanup, 420);
}

function setVenueShowsPanelOpen(card, isOpen) {
  const panel = getVenueShowsRelationshipPanel();
  if (!panel) {
    return;
  }

  if (isOpen && panel.dataset.lazyRendered !== "true") {
    renderVenueShowsPanel(panel, card._linkedVenueShows || []);
    panel.dataset.lazyRendered = "true";
  }

  updateVenueRelationshipFocusWithMotion(card, () => {
    card.classList.toggle("is-expanded", isOpen);
    card.setAttribute("aria-expanded", String(isOpen));
    setVenueRelationshipFocus(isOpen ? "shows" : "");
    panel.classList.toggle("is-expanded", isOpen);
    panel.setAttribute("aria-hidden", String(!isOpen));
    if (isOpen) {
      panel.removeAttribute("inert");
    } else {
      panel.setAttribute("inert", "");
    }
  });
}

function setVenueArtistsPanelOpen(card, isOpen) {
  const panel = getVenueArtistsRelationshipPanel();
  if (!panel) {
    return;
  }

  if (isOpen && panel.dataset.lazyRendered !== "true") {
    renderVenueArtistsPanel(panel, card._linkedVenueArtists || [], card);
    panel.dataset.lazyRendered = "true";
  }

  updateVenueRelationshipFocusWithMotion(card, () => {
    card.classList.toggle("is-expanded", isOpen);
    card.setAttribute("aria-expanded", String(isOpen));
    setVenueRelationshipFocus(isOpen ? "bands" : "");
    panel.classList.toggle("is-expanded", isOpen);
    panel.setAttribute("aria-hidden", String(!isOpen));
    if (isOpen) {
      panel.removeAttribute("inert");
    } else {
      panel.setAttribute("inert", "");
    }
  });
}

function setupVenueArtistsRelationshipCard(venue, artists) {
  if (!venueDetail) {
    return;
  }

  const card = venueDetail.querySelector('[data-venue-relationship="bands"]');
  if (!card) {
    return;
  }

  const panelId = "venue-relationship-artists-panel";
  const staleCardPanel = card.querySelector("[data-venue-artists-panel]");
  if (staleCardPanel) {
    staleCardPanel.remove();
  }

  const panel = getVenueArtistsRelationshipPanel();
  if (!panel) {
    return;
  }

  panel.id = panelId;
  card.classList.add("venue-relationship-card--expandable");
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-controls", panelId);
  card.setAttribute("aria-expanded", "false");
  card.setAttribute("aria-label", `Toggle featured artists for ${venue ? getMusicVenueName(venue) : "this venue"}`);
  card._linkedVenueArtists = Array.isArray(artists) ? artists : [];
  card._venueArtistSearch = "";
  panel.dataset.lazyRendered = "false";
  panel.replaceChildren();
  setVenueArtistsPanelOpen(card, false);

  const status = card.querySelector(".venue-relationship-status");
  if (status) {
    status.textContent = "Band Relationships";
  }

  card.onclick = (event) => {
    if (event.target.closest(".venue-artist-pill")) {
      return;
    }
    setVenueArtistsPanelOpen(card, card.getAttribute("aria-expanded") !== "true");
  };
  card.onkeydown = (event) => {
    if (event.target.closest(".venue-artist-pill")) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setVenueArtistsPanelOpen(card, card.getAttribute("aria-expanded") !== "true");
    }
  };
}

function setupVenueShowsRelationshipCard(venue, shows) {
  if (!venueDetail) {
    return;
  }

  const card = venueDetail.querySelector('[data-venue-relationship="shows"]');
  if (!card) {
    return;
  }

  const panelId = "venue-relationship-shows-panel";
  const staleCardPanel = card.querySelector("[data-venue-shows-panel]");
  if (staleCardPanel) {
    staleCardPanel.remove();
  }

  const panel = getVenueShowsRelationshipPanel();
  if (!panel) {
    return;
  }

  panel.id = panelId;
  card.classList.add("venue-relationship-card--expandable");
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-controls", panelId);
  card.setAttribute("aria-expanded", "false");
  card.setAttribute("aria-label", `Toggle linked shows for ${venue ? getMusicVenueName(venue) : "this venue"}`);
  card._linkedVenueShows = Array.isArray(shows) ? shows : [];
  panel.dataset.lazyRendered = "false";
  panel.replaceChildren();
  setVenueShowsPanelOpen(card, false);

  const status = card.querySelector(".venue-relationship-status");
  if (status) {
    status.textContent = "Open Event Index";
  }

  card.onclick = (event) => {
    if (event.target.closest("[data-venue-show-row]")) {
      return;
    }
    setVenueShowsPanelOpen(card, card.getAttribute("aria-expanded") !== "true");
  };
  card.onkeydown = (event) => {
    if (event.target.closest("[data-venue-show-row]")) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setVenueShowsPanelOpen(card, card.getAttribute("aria-expanded") !== "true");
    }
  };
}

function renderMusicVenueDetail(venue, requestedSlug = "") {
  if (!venueDetail) {
    return;
  }

  const hasVenue = Boolean(venue);
  const name = hasVenue ? getMusicVenueName(venue) : "Venue Not Found";
  const city = String(venue?.city || venue?.venue_details?.city || venue?.venueDetails?.city || "").trim();
  const state = getMusicVenueState(venue) || String(venue?.state || venue?.venue_details?.state || venue?.venueDetails?.state || "").trim();
  const location = hasVenue
    ? ([city, state].filter(Boolean).join(", ") || getMusicVenueLocationText(venue))
    : "Return to Venue Archive";
  const region = hasVenue
    ? String(venue?.region || venue?.venue_details?.region || venue?.venueDetails?.region || state || "Pending").trim()
    : "Pending";
  const slug = hasVenue ? getMusicVenueSlug(venue) : normalizeMusicVenueSlugValue(requestedSlug);
  const linkedShows = hasVenue ? getMusicVenueShows(venue) : [];
  const stats = hasVenue ? getMusicVenueDetailStats(venue, linkedShows) : { shows: null, bands: null, photos: null };
  const linkedArtists = hasVenue ? getMusicVenueArtists(venue, linkedShows) : [];
  const initials = getBandInitials(name) || "VN";

  venueDetail.classList.toggle("is-missing", !hasVenue);
  venueDetail.dataset.venueSlug = slug;
  venueDetail.dataset.venueId = hasVenue ? getMusicVenueId(venue) : "";

  if (venueDetailLogoCard) {
    venueDetailLogoCard.setAttribute("aria-label", `${name} venue mark`);
  }
  if (venueDetailLogoMark) {
    venueDetailLogoMark.textContent = initials;
  }
  if (venueDetailLogoLabel) {
    venueDetailLogoLabel.textContent = name;
  }
  if (venueDetailTitle) {
    venueDetailTitle.textContent = name;
  }
  if (venueDetailLocation) {
    venueDetailLocation.textContent = location;
  }
  if (venueDetailRegion) {
    venueDetailRegion.textContent = region || "Pending";
  }
  if (venueDetailVisual) {
    venueDetailVisual.setAttribute("aria-label", `Compact location visualization for ${name}${location ? ` in ${location}` : ""}`);
  }
  if (venueDetailVisualPrimary) {
    venueDetailVisualPrimary.textContent = city ? `${city} Core` : "Location Pending";
  }
  if (venueDetailVisualSecondary) {
    venueDetailVisualSecondary.textContent = region && region !== "Pending" ? `${region} Signal` : "Archive Signal";
  }
  setMusicVenueDetailRelationshipCount("shows", linkedShows.length);
  setMusicVenueDetailRelationshipCount("bands", hasVenue ? linkedArtists.length : stats.bands);
  setMusicVenueDetailRelationshipCount("photos", stats.photos);
  setupVenueShowsRelationshipCard(venue, linkedShows);
  setupVenueArtistsRelationshipCard(venue, linkedArtists);
}

function showMusicVenueDetail(venueSlug) {
  activeMusicVenueDetailSlug = normalizeMusicVenueSlugValue(venueSlug);
  const venue = venueSlugToVenue(activeMusicVenueDetailSlug);
  renderMusicVenueDetail(venue, activeMusicVenueDetailSlug);
  setBandsIndexVisible(false);
  setPeopleIndexVisible(false);
  setMusicVenueIndexVisible(false);
  setMusicActivityPanelVisible(false);
  setVenueDetailVisible(true);
  setCurrentView("Venue Detail");
  if (musicNexusShell) {
    musicNexusShell.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }

  Promise.allSettled([
    requestMusicVenuesData(),
    requestMusicShowsSetsData(),
  ]).then(() => {
    const route = getRouteFromUrl();
    if (route.name !== "music-venue-detail" || normalizeMusicVenueSlugValue(route.venueSlug) !== activeMusicVenueDetailSlug) {
      return;
    }
    renderMusicVenueDetail(venueSlugToVenue(activeMusicVenueDetailSlug), activeMusicVenueDetailSlug);
  });
}

function parseMusicShowDate(dateValue) {
  const rawDate = String(dateValue || "").trim();
  if (!rawDate) {
    return null;
  }

  const shortDateMatch = rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (shortDateMatch) {
    const month = Number.parseInt(shortDateMatch[1], 10);
    const day = Number.parseInt(shortDateMatch[2], 10);
    const yearValue = Number.parseInt(shortDateMatch[3], 10);
    const year = shortDateMatch[3].length === 2 ? 2000 + yearValue : yearValue;
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return date;
    }
  }

  const isoDateMatch = rawDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|[T\s])/);
  if (isoDateMatch) {
    const year = Number.parseInt(isoDateMatch[1], 10);
    const month = Number.parseInt(isoDateMatch[2], 10);
    const day = Number.parseInt(isoDateMatch[3], 10);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return date;
    }
  }

  const cleanedDate = rawDate.replace(/\b(\d{1,2})(st|nd|rd|th)\b/gi, "$1");
  const parsedDate = new Date(cleanedDate);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function getOrdinalSuffix(day) {
  const remainder = day % 100;
  if (remainder >= 11 && remainder <= 13) {
    return "th";
  }

  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function formatOrdinalNumber(value, fallbackValue = "Coming Soon") {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallbackValue;
  }

  const integerValue = Math.trunc(numericValue);
  return `${integerValue}${getOrdinalSuffix(integerValue)}`;
}

function formatMusicShowDate(dateValue) {
  const parsedDate = parseMusicShowDate(dateValue);
  if (!parsedDate) {
    return String(dateValue || "Date Pending").trim() || "Date Pending";
  }

  const month = parsedDate.toLocaleString("en-US", { month: "long" });
  const day = parsedDate.getDate();
  return `${month} ${day}${getOrdinalSuffix(day)}, ${parsedDate.getFullYear()}`;
}

function getMusicShowYear(dateValue) {
  const parsedDate = parseMusicShowDate(dateValue);
  return parsedDate ? String(parsedDate.getFullYear()) : "Pending";
}

function getMusicShowLocation(show) {
  const locationParts = [show?.city, show?.state]
    .map((part) => String(part || "").trim())
    .filter(Boolean);
  return locationParts.length > 0 ? locationParts.join(", ") : "Location Pending";
}

function getMusicShowBandNames(show) {
  if (!show) {
    return [];
  }

  const bandCandidates = [
    show.band,
    show.band_name,
    show.bandName,
  ];
  if (Array.isArray(show.bands)) {
    show.bands.forEach((band) => {
      bandCandidates.push(band?.band, band?.name, band);
    });
  }

  return bandCandidates
    .map((band) => String(band?.band || band?.name || band || "").trim())
    .filter(Boolean);
}

function getMusicShowBandSlugs(show) {
  const slugCandidates = [
    show?.band_slug,
    show?.bandSlug,
    show?.band_id,
    show?.bandId,
    show?.band,
    show?.band_name,
    show?.bandName,
    show?.slug,
  ];
  if (Array.isArray(show?.bands)) {
    show.bands.forEach((band) => {
      if (band && typeof band === "object") {
        slugCandidates.push(band.band_slug, band.bandSlug, band.band_id, band.bandId, band.slug, band.band, band.name);
      } else {
        slugCandidates.push(band);
      }
    });
  }

  return slugCandidates
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .map((value) => createBandSlug(value))
    .filter(Boolean);
}

function isReadableMusicVenueName(venueName) {
  const normalizedVenue = String(venueName || "").trim();
  if (!normalizedVenue) {
    return false;
  }

  return !normalizedVenue.includes("_") && !/^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(normalizedVenue);
}

function getMusicShowVenueName(show) {
  const venueRecord = findMusicVenueById(show?.venue_id || show?.venueId);
  const displayCandidates = [
    show?.venue_details?.venue,
    show?.venue_details?.name,
    show?.venueDetails?.venue,
    show?.venueDetails?.name,
    show?.venue,
    venueRecord?.venueName,
    venueRecord?.venue,
    venueRecord?.name,
  ];

  return displayCandidates
    .map((venue) => String(venue || "").trim())
    .find(isReadableMusicVenueName) || "";
}

function getMusicShowIdValue(show) {
  return String(show?.show_id ?? show?.showId ?? "").trim();
}

function getMusicShowBandPerformanceValue(show, band, fallbackValue = "Coming Soon") {
  const showBands = Array.isArray(show?.bands) ? show.bands : [];
  if (showBands.length === 0) {
    return fallbackValue;
  }

  const bandNameKeys = [
    band?.name,
    band?.general?.name,
    band?.band,
    band?.title,
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
  const bandSlugKeys = [
    getBandId(band),
    band?.band_id,
    band?.slug,
    ...bandNameKeys.map(createBandSlug),
  ]
    .map((value) => createBandSlug(value))
    .filter(Boolean);

  const matchingBand = showBands.find((showBand) => {
    const candidateNames = [
      showBand?.band,
      showBand?.name,
      showBand?.band_name,
      showBand?.bandName,
    ]
      .map((value) => String(value || "").trim().toLowerCase())
      .filter(Boolean);
    const candidateSlugs = [
      showBand?.band_slug,
      showBand?.bandSlug,
      showBand?.band_id,
      showBand?.bandId,
      showBand?.slug,
      ...candidateNames.map(createBandSlug),
    ]
      .map((value) => createBandSlug(value))
      .filter(Boolean);

    return candidateNames.some((candidate) => bandNameKeys.includes(candidate)) ||
      candidateSlugs.some((candidate) => bandSlugKeys.includes(candidate));
  }) || (showBands.length === 1 ? showBands[0] : null);

  const rawCount = matchingBand?.bandViewCount ??
    matchingBand?.band_view_count ??
    matchingBand?.performanceCount ??
    matchingBand?.performance_count;

  return formatOrdinalNumber(rawCount, fallbackValue);
}

function getMusicShowContributorValue(show, fallbackValue = "Coming Soon") {
  const candidates = [
    show?.contributors,
    show?.contributor_count,
    show?.contributorCount,
    show?.contributors_count,
    show?.stats?.contributors,
    show?.stats?.contributorCount,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.length > 0 ? String(candidate.length) : fallbackValue;
    }
    if (candidate !== undefined && candidate !== null && String(candidate).trim()) {
      return String(candidate).trim();
    }
  }

  return fallbackValue;
}

function formatMusicShowCameras(show) {
  const cameras = [show?.camera_1, show?.camera_2]
    .map((camera) => String(camera || "").trim())
    .filter(Boolean);
  return cameras.length > 0 ? cameras.join("\n") : "N/A";
}

function getMusicShowNotes(show) {
  const notes = String(show?.notes || "").trim();
  return notes || "No notes at the moment.";
}

function getMusicShowPosterValue(show) {
  const candidates = [
    show?.poster,
    show?.poster_url,
    show?.posterUrl,
    show?.poster_image,
    show?.posterImage,
    show?.image_url,
    show?.imageUrl,
    show?.image,
    show?.media?.poster,
    show?.media?.image,
    show?.images?.poster,
    show?.images?.full,
    show?.images?.large,
    show?.logo_url,
  ];

  return candidates
    .map((candidate) => String(candidate || "").trim())
    .find(Boolean) || "";
}

function normalizeMusicShowSetRow(record, index = 0) {
  const source = record && typeof record === "object" ? record : {};
  const name = String(source.name || source.title || source.show_name || `Show ${index + 1}`).trim();
  const rawDate = String(source.date || source.show_date || source.eventDate || "").trim();
  const date = parseMusicShowDate(rawDate);
  const setCode = getSetCodeFromDateValue(rawDate) || createBandSlug(`${rawDate || index + 1}-${name}`);
  const poster = getMusicShowPosterValue(source);
  const city = String(source.city || source.location_city || source.venue_details?.city || source.venueDetails?.city || "").trim();
  const state = String(source.state || source.location_state || source.venue_details?.state || source.venueDetails?.state || "").trim();
  const venue = getMusicShowVenueName(source);
  const contributors = getMusicShowContributorValue(source);

  return {
    ...source,
    showId: getMusicShowIdValue(source),
    setCode,
    year: getMusicShowYear(rawDate),
    rawDate,
    formattedDate: formatMusicShowDate(rawDate),
    name,
    title: name,
    city,
    state,
    location: getMusicShowLocation({ city, state }),
    venue,
    poster,
    bandNames: getMusicShowBandNames(source),
    bandSlugs: getMusicShowBandSlugs(source),
    contributors,
    camera: formatMusicShowCameras(source),
    notes: getMusicShowNotes(source),
    dateSort: date ? date.getTime() : 0,
  };
}

function normalizeMusicShowSetRows(payload) {
  return getMusicShowsPayloadRows(payload)
    .map(normalizeMusicShowSetRow)
    .filter((show) => show.name)
    .sort((a, b) => b.dateSort - a.dateSort || a.name.localeCompare(b.name));
}

function resetMusicShowsIndexRowsCache() {
  musicShowsIndexRowsCache = null;
  musicShowsIndexRowsCacheState = "";
  musicShowsIndexRowsCacheSource = null;
  musicShowsIndexRowsCacheLength = 0;
}

function getFallbackSetRowsData() {
  return Array.from(setsRows).map((row, index) => {
    const dataset = row.dataset || {};
    return {
      showId: dataset.setShowId || "",
      setCode: getSetCode(row, index),
      year: String(dataset.setYear || "2026"),
      rawDate: dataset.setDate || "",
      formattedDate: formatMusicShowDate(dataset.setDate),
      name: dataset.setTitle || `Set ${index + 1}`,
      title: dataset.setTitle || `Set ${index + 1}`,
      city: "",
      state: "",
      location: dataset.setLocation || "Location Pending",
      venue: dataset.setVenue || "",
      poster: "",
      bandNames: activeMusicBand ? [activeMusicBand.name] : [],
      bandSlugs: activeMusicBand ? [getBandId(activeMusicBand), createBandSlug(activeMusicBand.name)] : [],
      contributors: dataset.setContributors || "Coming Soon",
      camera: dataset.setCamera || "N/A",
      notes: dataset.setNotes || "No notes at the moment.",
      dateSort: parseMusicShowDate(dataset.setDate)?.getTime() || 0,
      fallbackDataset: { ...dataset },
    };
  });
}

function setMusicShowsSetsCollection(rows, stateName = "fallback") {
  musicShowsSetsCollection = Array.isArray(rows) ? rows : [];
  musicShowsSetsDataState = stateName;
  resetMusicShowsIndexRowsCache();
  if (setsArchive) {
    setsArchive.dataset.setsDataState = stateName;
    setsArchive.setAttribute("aria-busy", String(stateName === "loading"));
  }
}

function restoreMusicShowsSetsFallback() {
  setMusicShowsSetsCollection(getFallbackSetRowsData(), "fallback");
}

function getMusicShowsSetsApiUrl(page = 1) {
  const apiUrl = new URL(MUSIC_SHOWS_SETS_API_ROUTE, MUSIC_BANDS_INDEX_API_BASE_URL);
  apiUrl.searchParams.set("limit", String(MUSIC_SHOWS_SETS_API_LIMIT));
  apiUrl.searchParams.set("page", String(page));
  return apiUrl;
}

function fetchMusicShowsSetsPage(page, signal) {
  return fetch(getMusicShowsSetsApiUrl(page), {
    cache: "no-store",
    signal,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Music shows request failed (${response.status})`);
      }
      return response.json();
    });
}

function getMusicShowsPayloadPageCount(payload) {
  const pageCount = Number(payload?.totalPages || payload?.meta?.pagination?.totalPages);
  return Number.isFinite(pageCount) && pageCount > 0 ? Math.trunc(pageCount) : 1;
}

function mergeMusicShowsPayloadPages(payloads) {
  const rows = payloads.flatMap(getMusicShowsPayloadRows);
  return {
    ...(payloads[0] || {}),
    data: rows,
    source: {
      ...(payloads[0]?.source && typeof payloads[0].source === "object" ? payloads[0].source : {}),
      data: rows,
    },
  };
}

function requestMusicShowsSetsData() {
  if (musicShowsSetsLoaded) {
    return Promise.resolve(true);
  }
  if (musicShowsSetsRequest) {
    return musicShowsSetsRequest;
  }
  if (typeof fetch !== "function") {
    restoreMusicShowsSetsFallback();
    return Promise.resolve(false);
  }

  if (setsArchive) {
    setsArchive.dataset.setsDataState = "loading";
    setsArchive.setAttribute("aria-busy", "true");
  }
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), MUSIC_SHOWS_SETS_TIMEOUT_MS)
    : 0;
  musicShowsSetsRequest = fetchMusicShowsSetsPage(1, controller?.signal)
    .then((firstPayload) => {
      const totalPages = getMusicShowsPayloadPageCount(firstPayload);
      if (totalPages <= 1) {
        return firstPayload;
      }

      const pageRequests = [];
      for (let page = 2; page <= totalPages; page += 1) {
        pageRequests.push(fetchMusicShowsSetsPage(page, controller?.signal));
      }

      return Promise.all(pageRequests)
        .then((remainingPayloads) => mergeMusicShowsPayloadPages([firstPayload, ...remainingPayloads]));
    })
    .then((payload) => requestMusicVenuesData().then(() => payload))
    .then((payload) => {
      const liveRows = normalizeMusicShowSetRows(payload);
      if (liveRows.length === 0) {
        throw new Error("Music shows response contained no rows");
      }

      setMusicShowsSetsCollection(liveRows, "live");
      musicShowsSetsLoaded = true;
      return true;
    })
    .catch(() => {
      restoreMusicShowsSetsFallback();
      return false;
    })
    .finally(() => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      if (setsArchive) {
        setsArchive.setAttribute("aria-busy", "false");
      }
      musicShowsSetsRequest = null;
    });

  return musicShowsSetsRequest;
}

function getSetsRows() {
  return Array.from(document.querySelectorAll("[data-set-row]"));
}

function getBandLetter(band) {
  return band.name.slice(0, 1).toUpperCase();
}

function getRadarPointOffset(index, total) {
  const safeTotal = Math.max(1, total);
  const angle = (index * 137.508) * (Math.PI / 180);
  const radius = 8 + (41 * Math.sqrt((index + 1) / (safeTotal + 1)));
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  return [`${x.toFixed(2)}%`, `${y.toFixed(2)}%`];
}

function shouldUseBandsPanelFilters() {
  return activeBandsView === "list" || activeBandsView === "search";
}

function normalizeBandsRegionFilter(value) {
  const normalizedValue = String(value || "").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(bandsRegionFilterLabels, normalizedValue) ? normalizedValue : "";
}

function normalizeBandsStatusFilter(value) {
  const normalizedValue = String(value || "").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(bandsStatusFilterLabels, normalizedValue) ? normalizedValue : "";
}

function normalizeBandsLetterFilter(value) {
  const normalizedValue = String(value || "").trim().toUpperCase();
  return bandsAlphabet.includes(normalizedValue) ? normalizedValue : "";
}

function getBandRegionKey(band) {
  return String(band?.region || band?.stats?.region || "").trim().toLowerCase();
}

function getBandStatusKey(band) {
  const statusKey = String(band?.statusKey || band?.status_key || "").trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(bandsStatusFilterLabels, statusKey)) {
    return statusKey;
  }

  const statusLabel = String(band?.status || "").trim().toLowerCase();
  if (statusLabel.includes("complete")) {
    return "complete";
  }
  if (statusLabel.includes("partial")) {
    return "partial";
  }
  if (statusLabel.includes("needs")) {
    return "needs";
  }
  return "";
}

function getBandSearchText(band) {
  return `${band.name} ${band.region} ${band.status} ${band.statusKey} ${band.archived_sets}/${band.total_sets} sets ${band.photo_count} photos`.toLowerCase();
}

function getBandsRegionStatusRows(rows) {
  let filteredRows = rows;
  if (activeBandsRegionFilter) {
    filteredRows = filterMockCollection(filteredRows, (band) => getBandRegionKey(band) === activeBandsRegionFilter);
  }
  if (activeBandsStatusFilter) {
    filteredRows = filterMockCollection(filteredRows, (band) => getBandStatusKey(band) === activeBandsStatusFilter);
  }
  return filteredRows;
}

function getBandsFilterOptionRows() {
  return getBandsRegionStatusRows(getMusicBandsIndexCollection());
}

function hasActiveBandsPanelFilters() {
  return Boolean(activeBandsFilterLetter || activeBandsRegionFilter || activeBandsStatusFilter);
}

function getVisibleBands() {
  let rows = getMusicBandsIndexCollection();
  if (!shouldUseBandsPanelFilters()) {
    return rows;
  }

  rows = getBandsRegionStatusRows(rows);
  if (activeBandsFilterLetter) {
    rows = filterMockCollection(rows, (band) => getBandLetter(band) === activeBandsFilterLetter);
  }

  if (activeBandsView === "search") {
    const query = bandsSearchTerm.trim().toLowerCase();
    if (query) {
      rows = filterMockCollection(rows, (band) => getBandSearchText(band).includes(query));
    }
  }

  return rows;
}

function getListBands(rows) {
  if (!activeBandsFilterLetter) {
    return rows;
  }

  return filterMockCollection(rows, (band) => getBandLetter(band) === activeBandsFilterLetter);
}

function getBandsListScroller() {
  return bandsList ? bandsList.closest(".bands-list-panel") || bandsList : null;
}

function getBandLetterCounts(rows) {
  return rows.reduce((counts, band) => {
    const letter = getBandLetter(band);
    counts.set(letter, (counts.get(letter) || 0) + 1);
    return counts;
  }, new Map());
}

function syncActiveBandLetter(rows) {
  if (activeBandsView === "radar" && !activeBandsLetter) {
    return;
  }

  if (activeBandsFilterLetter) {
    activeBandsLetter = activeBandsFilterLetter;
    return;
  }

  if (rows.length === 0) {
    activeBandsLetter = activeBandsView === "radar" ? "" : "A";
    return;
  }

  const visibleLetters = new Set(rows.map(getBandLetter));
  if (!visibleLetters.has(activeBandsLetter)) {
    activeBandsLetter = getBandLetter(rows[0]);
  }
}

function setMusicPersonDetailVisible(isVisible) {
  if (!musicNexusShell || !personDetail) {
    return;
  }

  musicNexusShell.classList.toggle("is-person-detail", isVisible);
  if (isVisible) {
    setMusicShowDetailVisible(false);
    setBandDetailVisible(false);
    setSetsArchiveVisible(false);
    setSetGalleryVisible(false);
    setLightboxVisible(false);
  }
  personDetail.setAttribute("aria-hidden", String(!isVisible));
  if (isVisible) {
    personDetail.removeAttribute("inert");
  } else {
    personDetail.setAttribute("inert", "");
  }
}

function setMusicShowDetailVisible(isVisible) {
  if (!musicNexusShell || !showDetail) {
    return;
  }

  musicNexusShell.classList.toggle("is-show-detail", isVisible);
  if (isVisible) {
    setMusicPersonDetailVisible(false);
    setBandDetailVisible(false);
    setSetsArchiveVisible(false);
    setSetGalleryVisible(false);
    setLightboxVisible(false);
  }
  showDetail.setAttribute("aria-hidden", String(!isVisible));
  if (isVisible) {
    showDetail.removeAttribute("inert");
  } else {
    showDetail.setAttribute("inert", "");
  }
}

function setVenueDetailVisible(isVisible) {
  if (!musicNexusShell || !venueDetail) {
    return;
  }

  musicNexusShell.classList.toggle("is-venue-detail", isVisible);
  if (isVisible) {
    setMusicVenueIndexVisible(false);
    setMusicPersonDetailVisible(false);
    setMusicShowDetailVisible(false);
    setBandDetailVisible(false);
    setSetsArchiveVisible(false);
    setSetGalleryVisible(false);
    setLightboxVisible(false);
  }
  venueDetail.setAttribute("aria-hidden", String(!isVisible));
  if (isVisible) {
    venueDetail.removeAttribute("inert");
  } else {
    venueDetail.setAttribute("inert", "");
  }
}

function setMusicVenueIndexVisible(isVisible) {
  if (!musicVenuesIndex) {
    return;
  }

  if (musicNexusShell) {
    musicNexusShell.classList.toggle("is-venues-index", isVisible);
  }
  musicVenuesIndex.classList.toggle("is-active", isVisible);
  musicVenuesIndex.setAttribute("aria-hidden", String(!isVisible));
  if (isVisible) {
    setVenueDetailVisible(false);
    renderMusicVenuesArchive();
    requestMusicVenuesData().then(() => {
      if (getRouteFromUrl().name === "music-venues") {
        renderMusicVenuesArchive();
      }
    });
    musicVenuesIndex.removeAttribute("inert");
  } else {
    musicVenuesIndex.setAttribute("inert", "");
  }
}

function setBandDetailVisible(isVisible) {
  if (!musicNexusShell || !bandDetail) {
    return;
  }

  musicNexusShell.classList.toggle("is-band-detail", isVisible);
  if (isVisible) {
    setMusicPersonDetailVisible(false);
    setMusicShowDetailVisible(false);
    setSetsArchiveVisible(false);
    setSetGalleryVisible(false);
    setLightboxVisible(false);
  }
  bandDetail.setAttribute("aria-hidden", String(!isVisible));
  if (isVisible) {
    bandDetail.removeAttribute("inert");
  } else {
    bandDetail.setAttribute("inert", "");
  }
}

function setSetsArchiveVisible(isVisible) {
  if (!musicNexusShell || !setsArchive) {
    return;
  }

  musicNexusShell.classList.toggle("is-sets-archive", isVisible);
  if (isVisible) {
    setSetGalleryVisible(false);
    setLightboxVisible(false);
  }
  if (!isVisible) {
    setSetDetailVisible(false);
  }
  setsArchive.setAttribute("aria-hidden", String(!isVisible));
  if (isVisible) {
    setsArchive.removeAttribute("inert");
  } else {
    setsArchive.setAttribute("inert", "");
  }
}

function setSetGalleryVisible(isVisible) {
  if (!musicNexusShell || !setGallery) {
    return;
  }

  musicNexusShell.classList.toggle("is-set-gallery", isVisible);
  if (isVisible) {
    setLightboxVisible(false);
  }
  if (shell) {
    shell.classList.toggle("is-set-gallery-view", isVisible);
  }
  if (setsFeaturedOpen) {
    setsFeaturedOpen.setAttribute("aria-expanded", String(isVisible));
  }
  if (!isVisible) {
    setGalleryModeVisible(false);
  }
  setGallery.setAttribute("aria-hidden", String(!isVisible));
  if (isVisible) {
    setGallery.removeAttribute("inert");
  } else {
    setGallery.setAttribute("inert", "");
  }
}

function setLightboxInfoVisible(isVisible) {
  if (isVisible) {
    setLightboxThumbnailStripVisible(false);
  }
  if (lightboxScreen) {
    lightboxScreen.classList.toggle("is-info-open", isVisible);
  }
  if (lightboxInfoToggle) {
    lightboxInfoToggle.setAttribute("aria-expanded", String(isVisible));
    lightboxInfoToggle.setAttribute("aria-pressed", String(isVisible));
  }
  if (lightboxInfoPanel) {
    lightboxInfoPanel.setAttribute("aria-hidden", String(!isVisible));
    if (isVisible) {
      lightboxInfoPanel.removeAttribute("inert");
    } else {
      lightboxInfoPanel.setAttribute("inert", "");
    }
  }
}

function setLightboxVisible(isVisible) {
  if (!musicNexusShell || !lightboxScreen) {
    return;
  }

  musicNexusShell.classList.toggle("is-lightbox", isVisible);
  if (shell) {
    shell.classList.toggle("is-lightbox-view", isVisible);
  }
  if (!isVisible) {
    setLightboxInfoVisible(false);
    setLightboxThumbnailStripVisible(false);
    setLightboxControlsHidden(false);
    resetLightboxSwipeState();
    lightboxScreen.classList.remove("is-entering");
    getCurrentGalleryPhotoTiles().forEach((tile) => {
      tile.classList.remove("is-transition-source");
    });
  } else {
    setLightboxControlsHidden(false);
  }
  if (galleryViewAll) {
    galleryViewAll.setAttribute("aria-expanded", String(isVisible));
  }
  lightboxScreen.setAttribute("aria-hidden", String(!isVisible));
  if (isVisible) {
    lightboxScreen.removeAttribute("inert");
    window.requestAnimationFrame(() => {
      const focusTarget = lightboxBack || lightboxScreen;
      if (focusTarget) {
        focusTarget.focus({ preventScroll: true });
      }
    });
  } else {
    lightboxScreen.setAttribute("inert", "");
  }
}

function showBandsIndexView(options = {}) {
  setLightboxVisible(false);
  setSetGalleryVisible(false);
  setSetsArchiveVisible(false);
  setBandDetailVisible(false);
  setMusicPersonDetailVisible(false);
  setMusicVenueIndexVisible(false);
  setMusicActivityPanelVisible(false);
  setBandsIndexVisible(true);
  syncBandsIndex();
  requestMusicBandsIndexData();
  if (options.shouldScroll !== false && musicNexusShell) {
    musicNexusShell.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }
  if (options.shouldFocus && musicBandsIndex) {
    const activeTab = musicBandsIndex.querySelector("[data-bands-view-target][aria-selected='true']");
    if (activeTab) {
      activeTab.focus({ preventScroll: true });
    }
  }
  if (options.shouldUpdateRail !== false) {
    setCurrentView("Music Nexus");
  }
}

function showBandDetail(band) {
  if (!band || !bandDetail) {
    return;
  }

  const general = getBandDetailGeneral(band);
  const stats = getBandDetailStats(band);
  const personnel = getBandDetailPersonnel(band);
  const name = getBandDetailName(band);
  const region = String(stats.region || band.region || "Region Pending").trim() || "Region Pending";
  const logoUrl = getBandDetailLogoUrl(band, general);
  const tags = getBandDetailTags(general);
  const archivedSets = getBandDetailCount(stats.archived_sets, band.archived_sets);
  const totalSets = getBandDetailCount(stats.total_sets, band.total_sets, band.albums);
  const photoCount = getBandDetailCount(stats.totalPhotos, stats.total_photos, band.photo_count, band.photos);
  const rawPastMembers = Array.isArray(personnel.past_members) ? personnel.past_members : [];
  const pastMembers = getUniqueBandDetailMembers(rawPastMembers);
  const pastMemberKeys = new Set(pastMembers.map(getBandDetailMemberKey));
  const members = getUniqueBandDetailMembers(personnel.members, pastMemberKeys);
  const status = getBandArchiveStatus(archivedSets, totalSets);
  const completion = getBandDetailCompletion(archivedSets, totalSets);

  activeMusicBand = {
    ...band,
    name,
    region,
    status: status.label,
    statusKey: status.key,
    albums: totalSets,
    thumb: getBandInitials(name),
    logoUrl,
    archived_sets: archivedSets,
    total_sets: totalSets,
    photo_count: photoCount,
    personnel: {
      ...personnel,
      members,
      past_members: pastMembers,
    },
  };
  if (bandDetailPoster) {
    bandDetailPoster.setAttribute("aria-label", `${name} band logo panel`);
  }
  setBandDetailLogo(logoUrl, name);
  if (bandDetailLogoName) {
    bandDetailLogoName.textContent = name;
  }
  if (bandDetailName) {
    bandDetailName.textContent = name;
  }
  if (bandDetailRegion) {
    bandDetailRegion.textContent = region;
  }
  if (bandDetailTags) {
    bandDetailTags.textContent = tags.join(" / ");
    bandDetailTags.hidden = tags.length === 0;
  }
  if (bandDetailStatus) {
    bandDetailStatus.className = `band-detail-tag band-detail-tag--${status.key}`;
    bandDetailStatus.textContent = status.label;
  }
  if (bandDetailLocation) {
    bandDetailLocation.textContent = getBandDetailLocation(stats, band);
  }
  if (bandDetailCompletionValue) {
    bandDetailCompletionValue.textContent = `${completion}%`;
  }
  if (bandDetailProgressFill) {
    bandDetailProgressFill.style.width = `${completion}%`;
  }
  if (bandDetailSets) {
    bandDetailSets.textContent = formatBandDetailNumber(archivedSets);
  }
  if (bandDetailTotalSets) {
    bandDetailTotalSets.textContent = formatBandDetailNumber(totalSets);
  }
  if (bandDetailPhotos) {
    bandDetailPhotos.textContent = formatBandDetailNumber(photoCount);
  }
  if (bandDetailContributors) {
    bandDetailContributors.textContent = formatBandDetailNumber(members.length);
  }
  renderBandDetailMembers(bandDetailCoreMembers, members, "No core members indexed");
  renderBandDetailMembers(bandDetailPastMembers, pastMembers, "No past members indexed");

  setBandsIndexVisible(false);
  setBandDetailVisible(true);
  setCurrentView("Band Detail");
  if (musicNexusShell) {
    musicNexusShell.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }
}

function getSetImageLabel(row) {
  if (!row) {
    return activeMusicBand ? activeMusicBand.thumb : "SET";
  }

  const dateCode = (row.dataset.setDate || "").replace(/,.*/, "");
  return dateCode || row.dataset.setThumb || (activeMusicBand ? activeMusicBand.thumb : "SET");
}

function getSetImageAccent(row) {
  const key = `${row ? row.dataset.setDate : ""}${row ? row.dataset.setTitle : ""}`;
  const checksum = Array.from(key).reduce((total, character) => total + character.charCodeAt(0), 0);
  return setImageAccents[checksum % setImageAccents.length];
}

function updateSetDetailFromRow(row) {
  if (!row) {
    return;
  }

  const setData = row.dataset;
  if (setDetailBand) {
    setDetailBand.textContent = activeMusicBand ? activeMusicBand.name : "Band Detail";
  }
  if (setDetailTitle) {
    setDetailTitle.textContent = setData.setTitle || "";
  }
  if (setDetailCopy) {
    setDetailCopy.textContent = `${setData.setDate || "Date Pending"} / ${setData.setLocation || "Location Pending"}`;
  }
  if (setDetailDate) {
    setDetailDate.textContent = setData.setDate || "";
  }
  if (setDetailLocation) {
    setDetailLocation.textContent = setData.setLocation || "";
  }
  if (setDetailPhotos) {
    setDetailPhotos.textContent = setData.setPhotos || "";
  }
  if (setDetailContributors) {
    setDetailContributors.textContent = setData.setContributors || "";
  }
  if (setDetailComplete) {
    setDetailComplete.textContent = setData.setComplete || "";
  }
}

function setSetDetailVisible(isVisible) {
  isSetDetailOpen = isVisible;
  if (!setDetailPlaceholder) {
    return;
  }

  setDetailPlaceholder.classList.toggle("is-active", isVisible);
  setDetailPlaceholder.setAttribute("aria-hidden", String(!isVisible));
  if (isVisible) {
    setDetailPlaceholder.removeAttribute("inert");
  } else {
    setDetailPlaceholder.setAttribute("inert", "");
  }
  if (setsFeaturedOpen) {
    setsFeaturedOpen.setAttribute("aria-expanded", String(isVisible));
  }
}

function getFirstVisibleSetRow() {
  return getSetsRows().find((candidate) => {
    const item = candidate.closest("li");
    return !item || !item.hidden;
  });
}

function getSetVenue(row) {
  if (!row) {
    return "Venue Pending";
  }

  const show = findSetDataByCode(getSetCode(row), activeMusicBand);
  const liveVenue = show ? getMusicShowVenueName(show) : "";
  if (liveVenue) {
    return liveVenue;
  }

  if (isReadableMusicVenueName(row.dataset.setVenue)) {
    return row.dataset.setVenue;
  }
  return "Venue Pending";
}

function getSetShowId(row) {
  if (!row) {
    return "Pending";
  }

  const show = findSetDataByCode(getSetCode(row), activeMusicBand);
  const liveShowId = getMusicShowIdValue(show);
  if (liveShowId) {
    return liveShowId;
  }

  return String(row.dataset.setShowId || "").trim() || "Pending";
}

function getMusicShowAlbumForBand(show, band = activeMusicBand, dateFolder = "") {
  const albums = getMusicShowSmugAlbums(show);
  if (albums.length === 0) {
    return null;
  }

  const bandKeys = new Set([
    getBandId(band),
    band?.band_id,
    band?.id,
    band?.slug,
    band?.name,
    band?.general?.name,
    band?.band,
    band?.title,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .map(createBandSlug));
  const setCode = normalizeSetCode(dateFolder || getMusicShowRouteCode(show));

  const matchedAlbum = albums.find((album) => {
    const albumBandKeys = [
      getMusicShowAlbumBandId(album),
      getMusicShowAlbumBandName(album),
      album?.lineupBand,
      album?.lineup_band,
      album?.band_folder,
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .map(createBandSlug);
    const bandMatches = bandKeys.size === 0 || albumBandKeys.some((key) => bandKeys.has(key));
    const albumDateFolder = getMusicShowAlbumDateFolder(show, album);
    const dateMatches = !setCode || !albumDateFolder || albumDateFolder === setCode;
    return bandMatches && dateMatches;
  });

  return matchedAlbum || (albums.length === 1 ? albums[0] : null);
}

function getSetSmugAlbum(row) {
  if (!row) {
    return null;
  }

  const show = findSetDataByCode(getSetCode(row), activeMusicBand);
  return show ? getMusicShowAlbumForBand(show, activeMusicBand, getSetCode(row)) : null;
}

function getMusicShowAlbumPhotoCount(album) {
  return getMusicShowDetailCountCandidate(
    album?.photo_count,
    album?.photoCount,
    album?.photos,
    album?.image_count,
    album?.imageCount
  );
}

function formatSetPhotoCount(row) {
  const albumPhotoCount = getMusicShowAlbumPhotoCount(getSetSmugAlbum(row));
  if (albumPhotoCount !== null && albumPhotoCount > 0) {
    return albumPhotoCount.toLocaleString();
  }

  const rowPhotoCount = getMusicShowDetailCountCandidate(row?.dataset?.setPhotos);
  return rowPhotoCount !== null && rowPhotoCount > 0
    ? rowPhotoCount.toLocaleString()
    : "Pending";
}

function getSetAlbumPhotoTotal(row) {
  const albumPhotoCount = getMusicShowAlbumPhotoCount(getSetSmugAlbum(row));
  if (albumPhotoCount !== null && albumPhotoCount > 0) {
    return albumPhotoCount;
  }

  const rowPhotoCount = getMusicShowDetailCountCandidate(row?.dataset?.setPhotos);
  return rowPhotoCount !== null && rowPhotoCount > 0 ? rowPhotoCount : 0;
}

function getAlbumStatusLabelFromValue(value) {
  const status = String(value || "").trim().toLowerCase();
  if (!status) {
    return "Pending";
  }
  if (["resolved", "synced", "sync", "complete", "completed", "success", "ok"].includes(status)) {
    return "Synced";
  }
  if (["error", "failed", "fail", "failure"].includes(status)) {
    return "Error";
  }
  return "Pending";
}

function getSetAlbumStatus(row) {
  const album = getSetSmugAlbum(row);
  return getAlbumStatusLabelFromValue(album?.status || row?.dataset?.setAlbumStatus);
}

function getSetAlbumId(row) {
  const album = getSetSmugAlbum(row);
  return String(album?.album_id || album?.albumId || album?.gallery_id || album?.galleryId || "").trim();
}

function getSetPerformanceValue(row) {
  const setPerformance = String(row?.dataset?.setPerformance || "").trim();
  if (setPerformance && setPerformance.toLowerCase() !== "coming soon") {
    return setPerformance;
  }

  const album = getSetSmugAlbum(row);
  return formatOrdinalNumber(album?.bandViewCount ?? album?.band_view_count, "Pending");
}

function getSetCamera(row) {
  return row && row.dataset.setCamera ? row.dataset.setCamera : "N/A";
}

function getSetNotes(row) {
  return row && row.dataset.setNotes
    ? row.dataset.setNotes
    : "No notes at the moment.";
}

function updateSetGalleryFromRow(row) {
  if (!row) {
    return;
  }

  const setData = row.dataset;
  const imageAccent = getSetImageAccent(row);
  if (setGalleryBand) {
    setGalleryBand.textContent = activeMusicBand ? activeMusicBand.name : "Band Detail";
  }
  if (setGalleryImage) {
    setGalleryImage.setAttribute("aria-label", `${setData.setTitle || "Set"} poster`);
    setGalleryImage.style.setProperty("--set-image-x", imageAccent.x);
    setGalleryImage.style.setProperty("--set-image-y", imageAccent.y);
    setGalleryImage.style.setProperty("--set-image-accent", imageAccent.color);
  }
  setArchivePosterImage(
    setGalleryPoster,
    setData.setPoster || SET_GALLERY_NO_POSTER_IMAGE_SRC,
    setGalleryThumb,
    "has-poster"
  );
  if (setGalleryThumb) {
    setGalleryThumb.textContent = setData.setPoster ? getSetImageLabel(row) : "No Poster Available";
  }
  if (setGalleryDate) {
    setGalleryDate.textContent = setData.setDate || "";
  }
  if (setGalleryTitle) {
    setGalleryTitle.textContent = setData.setTitle || "";
  }
  if (setGalleryShowId) {
    setGalleryShowId.textContent = getSetShowId(row);
  }
  if (setGalleryCity) {
    setGalleryCity.textContent = setData.setLocation || "";
  }
  if (setGalleryVenue) {
    setGalleryVenue.textContent = getSetVenue(row);
  }
  if (setGalleryPerformance) {
    setGalleryPerformance.textContent = getSetPerformanceValue(row);
  }
  if (setGalleryPhotos) {
    setGalleryPhotos.textContent = formatSetPhotoCount(row);
  }
  if (setGalleryContributors) {
    setGalleryContributors.textContent = getSetAlbumStatus(row);
  }
  if (setGalleryCamera) {
    setGalleryCamera.textContent = getSetCamera(row);
  }
  if (setGalleryNotes) {
    setGalleryNotes.textContent = getSetNotes(row);
  }
  activeSetGalleryPhotoMode = "preview";
  activeSetGalleryPhotoTotal = getSetAlbumPhotoTotal(row);
  setSetGalleryPhotoWarning("");
  updateSetGalleryPhotoSummary(0, activeSetGalleryPhotoTotal, activeSetGalleryPhotoMode);
  loadSetGalleryPhotoHighlights(row);
}

function getPhotoCountLabel(count) {
  return Number(count) === 1 ? "Photo" : "Photos";
}

function updateSetGalleryPhotoSummary(visibleCount = 0, totalCount = activeSetGalleryPhotoTotal, mode = activeSetGalleryPhotoMode) {
  if (!galleryPhotoCount) {
    return;
  }

  const safeVisibleCount = Math.max(0, Number(visibleCount) || 0);
  const safeTotalCount = Math.max(0, Number(totalCount) || 0);
  if (mode === "all") {
    if (safeTotalCount > 0 && safeVisibleCount === 0) {
      galleryPhotoCount.textContent = `Loading ${safeTotalCount.toLocaleString()} ${getPhotoCountLabel(safeTotalCount)}`;
      return;
    }
    if (safeTotalCount > 0 && safeVisibleCount > 0 && safeVisibleCount < safeTotalCount) {
      galleryPhotoCount.textContent = `Showing ${safeVisibleCount.toLocaleString()} of ${safeTotalCount.toLocaleString()} ${getPhotoCountLabel(safeTotalCount)}`;
      return;
    }
    const allCount = safeTotalCount || safeVisibleCount;
    galleryPhotoCount.textContent = allCount > 0
      ? `Showing All ${allCount.toLocaleString()} ${getPhotoCountLabel(allCount)}`
      : "Showing All Photos";
    return;
  }

  const previewCount = Math.min(
    safeVisibleCount || MUSIC_SMUGMUG_ALBUM_PHOTOS_PREVIEW_LIMIT,
    safeTotalCount || MUSIC_SMUGMUG_ALBUM_PHOTOS_PREVIEW_LIMIT
  );
  const totalText = safeTotalCount > 0 ? safeTotalCount.toLocaleString() : previewCount.toLocaleString();
  galleryPhotoCount.textContent = `Showing ${previewCount.toLocaleString()} of ${totalText} ${getPhotoCountLabel(safeTotalCount || previewCount)}`;
}

function setSetGalleryPhotoWarning(message = "") {
  if (!galleryPhotoWarning) {
    return;
  }

  const warningText = String(message || "").trim();
  galleryPhotoWarning.textContent = warningText;
  galleryPhotoWarning.hidden = !warningText;
}

function setSetGalleryLoadingCopy(title = "Loading archive photos...", text = "Preparing preview frames.") {
  const loadingState = Array.from(galleryStates || []).find((statePanel) => statePanel.dataset.galleryState === "loading");
  if (!loadingState) {
    return;
  }

  const titleNode = loadingState.querySelector(".archive-gallery-state-title");
  const textNode = loadingState.querySelector(".archive-gallery-state-text");
  if (titleNode) {
    titleNode.textContent = title;
  }
  if (textNode) {
    textNode.textContent = text;
  }
}

function syncSetGalleryPhotoToggleButton(stateName = "ready") {
  if (!galleryViewAll) {
    return;
  }

  const canTogglePhotos = stateName === "ready" && activeSetGalleryPhotoTotal > MUSIC_SMUGMUG_ALBUM_PHOTOS_PREVIEW_LIMIT;
  galleryViewAll.disabled = !canTogglePhotos;
  galleryViewAll.hidden = stateName !== "ready" && activeSetGalleryPhotoTotal <= MUSIC_SMUGMUG_ALBUM_PHOTOS_PREVIEW_LIMIT;
  galleryViewAll.setAttribute("aria-disabled", String(!canTogglePhotos));
  galleryViewAll.setAttribute("aria-expanded", String(activeSetGalleryPhotoMode === "all"));
  galleryViewAll.textContent = activeSetGalleryPhotoMode === "all" ? "Show Less" : "Show All Photos";
}

function setGalleryState(stateName = "ready") {
  const activeState = ["loading", "empty", "error"].includes(stateName) ? stateName : "ready";
  const shouldShowGrid = activeState === "ready";

  if (!shouldShowGrid) {
    setGalleryModeVisible(false);
  }
  if (galleryGrid) {
    galleryGrid.classList.toggle("is-gallery-hidden", !shouldShowGrid);
  }
  if (galleryStatesShell) {
    galleryStatesShell.classList.toggle("is-active", !shouldShowGrid);
  }
  getCurrentGalleryPhotoTiles().forEach((tile) => {
    if (shouldShowGrid) {
      tile.removeAttribute("tabindex");
    } else {
      tile.setAttribute("tabindex", "-1");
    }
  });
  galleryStates.forEach((statePanel) => {
    const isActive = statePanel.dataset.galleryState === activeState;
    statePanel.classList.toggle("is-active", isActive);
    statePanel.setAttribute("aria-hidden", String(!isActive));
    if (isActive) {
      statePanel.removeAttribute("inert");
    } else {
      statePanel.setAttribute("inert", "");
    }
  });
  syncSetGalleryPhotoToggleButton(activeState);
}

function getGalleryPhotoLabel(photoTile) {
  return photoTile ? photoTile.dataset.galleryPhotoLabel || photoTile.textContent.trim() : "Photo 01";
}

function syncLightboxPrepTitle() {
  if (!galleryLightboxTitle) {
    return;
  }

  galleryLightboxTitle.textContent = `${getGalleryPhotoLabel(activeGalleryPhoto)} selected`;
}

function selectGalleryPhoto(photoTile) {
  if (!photoTile) {
    return;
  }

  activeGalleryPhoto = photoTile;
  getCurrentGalleryPhotoTiles().forEach((tile) => {
    const isActive = tile === photoTile;
    tile.classList.toggle("is-active", isActive);
    tile.setAttribute("aria-pressed", String(isActive));
  });
  syncLightboxPrepTitle();
}

function setGalleryViewMode(viewMode = "grid") {
  const normalizedMode = viewMode === "list" ? "list" : "grid";
  activeGalleryViewMode = normalizedMode;
  if (galleryGrid) {
    galleryGrid.classList.toggle("is-list-view", normalizedMode === "list");
    galleryGrid.setAttribute("data-gallery-view-mode", normalizedMode);
  }
  galleryViewOptions.forEach((option) => {
    const isActive = option.dataset.galleryViewOption === normalizedMode;
    option.classList.toggle("is-active", isActive);
    option.setAttribute("aria-pressed", String(isActive));
  });
}

function setGalleryModeVisible(isVisible) {
  isGalleryModeOpen = isVisible;
  if (galleryLightboxPrep) {
    galleryLightboxPrep.classList.toggle("is-active", isVisible);
    galleryLightboxPrep.setAttribute("aria-hidden", String(!isVisible));
    if (isVisible) {
      galleryLightboxPrep.removeAttribute("inert");
    } else {
      galleryLightboxPrep.setAttribute("inert", "");
    }
  }
}

function toggleGalleryMode() {
  const nextState = !isGalleryModeOpen;
  const tiles = getCurrentGalleryPhotoTiles();
  if (!activeGalleryPhoto && tiles[0]) {
    selectGalleryPhoto(tiles[0]);
  }
  setGalleryModeVisible(nextState);
  if (nextState && galleryLightboxPrep) {
    galleryLightboxPrep.scrollIntoView({
      block: "nearest",
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }
}

function getGalleryPhotoIndex(photoTile) {
  const index = getCurrentGalleryPhotoTiles().indexOf(photoTile);
  return index >= 0 ? index : 0;
}

function getGalleryPhotoImageSrc(photoTile) {
  const image = photoTile ? photoTile.querySelector(".archive-gallery-image") : null;
  return image && image.getAttribute("src")
    ? image.getAttribute("src")
    : galleryImageFallbackSrc;
}

function markLightboxTransitionSource(photoTile) {
  getCurrentGalleryPhotoTiles().forEach((tile) => {
    tile.classList.remove("is-transition-source");
  });
  window.clearTimeout(lightboxTransitionSourceTimer);
  if (!photoTile || reducedMotion.matches) {
    return;
  }

  photoTile.classList.add("is-transition-source");
  lightboxTransitionSourceTimer = window.setTimeout(() => {
    photoTile.classList.remove("is-transition-source");
  }, lightboxTransitionDuration);
}

function runLightboxEntryTransition() {
  window.clearTimeout(lightboxEntryTimer);
  if (!lightboxScreen || reducedMotion.matches) {
    return;
  }

  lightboxScreen.classList.remove("is-entering");
  void lightboxScreen.offsetWidth;
  lightboxScreen.classList.add("is-entering");
  lightboxEntryTimer = window.setTimeout(() => {
    lightboxScreen.classList.remove("is-entering");
  }, lightboxTransitionDuration);
}

function runLightboxImageTransition() {
  window.clearTimeout(lightboxImageTransitionTimer);
  if (!lightboxPhoto || reducedMotion.matches) {
    return;
  }

  lightboxPhoto.classList.remove("is-image-changing");
  void lightboxPhoto.offsetWidth;
  lightboxPhoto.classList.add("is-image-changing");
  lightboxImageTransitionTimer = window.setTimeout(() => {
    lightboxPhoto.classList.remove("is-image-changing");
  }, lightboxImageTransitionDuration);
}

function setLightboxImageStatus(status) {
  if (!lightboxPhoto || !lightboxImage) {
    return;
  }

  const nextStatus = ["loading", "loaded", "error"].includes(status) ? status : "loaded";
  lightboxPhoto.dataset.imageStatus = nextStatus;
  lightboxImage.dataset.imageStatus = nextStatus;
  lightboxPhoto.classList.toggle("is-image-loading", nextStatus === "loading");
  lightboxPhoto.classList.toggle("is-image-loaded", nextStatus === "loaded");
  lightboxPhoto.classList.toggle("is-image-error", nextStatus === "error");
}

function setLightboxImageSource(imageSrc) {
  if (!lightboxImage) {
    return;
  }

  const nextSrc = imageSrc || galleryImageFallbackSrc;
  lightboxFallbackAttempted = false;
  setLightboxImageStatus("loading");
  if (lightboxImage.getAttribute("src") !== nextSrc) {
    lightboxImage.setAttribute("src", nextSrc);
    return;
  }

  if (lightboxImage.complete) {
    if (lightboxImage.naturalWidth > 0) {
      setLightboxImageStatus("loaded");
    } else {
      handleLightboxImageError();
    }
  }
}

function handleLightboxImageLoad() {
  lightboxFallbackAttempted = false;
  setLightboxImageStatus("loaded");
}

function handleLightboxImageError() {
  if (!lightboxImage) {
    return;
  }

  if (!lightboxFallbackAttempted && lightboxImage.getAttribute("src") !== galleryImageFallbackSrc) {
    lightboxFallbackAttempted = true;
    setLightboxImageStatus("loading");
    lightboxImage.setAttribute("src", galleryImageFallbackSrc);
    return;
  }

  setLightboxImageStatus("error");
}

function preventArchiveImageDrag(event) {
  event.preventDefault();
}

function protectArchiveImage(image) {
  if (!image) {
    return;
  }

  image.setAttribute("draggable", "false");
  image.addEventListener("dragstart", preventArchiveImageDrag);
}

function getCurrentGalleryPhotoTiles() {
  return galleryGrid
    ? Array.from(galleryGrid.querySelectorAll("[data-gallery-photo]"))
    : Array.from(galleryPhotoTiles || []);
}

function normalizeMusicSmugmugAlbumPhotoLimit(limit) {
  const parsedLimit = Number.parseInt(limit, 10);
  return Number.isFinite(parsedLimit) && parsedLimit > 0
    ? parsedLimit
    : MUSIC_SMUGMUG_ALBUM_PHOTOS_PREVIEW_LIMIT;
}

function normalizeMusicSmugmugAlbumPhotoStart(start) {
  const parsedStart = Number.parseInt(start, 10);
  return Number.isFinite(parsedStart) && parsedStart > 0 ? parsedStart : 1;
}

function normalizeMusicSmugmugHasMore(value) {
  if (typeof value === "boolean") {
    return value;
  }
  return ["1", "true", "yes"].includes(String(value || "").trim().toLowerCase());
}

function getMusicSmugmugAlbumPhotosApiUrl(albumId, limit = MUSIC_SMUGMUG_ALBUM_PHOTOS_PREVIEW_LIMIT, start = 1) {
  const apiUrl = new URL(
    `${MUSIC_SMUGMUG_ALBUM_PHOTOS_API_ROUTE}/${encodeURIComponent(albumId)}/photos`,
    MUSIC_BANDS_INDEX_API_BASE_URL
  );
  apiUrl.searchParams.set("limit", String(normalizeMusicSmugmugAlbumPhotoLimit(limit)));
  apiUrl.searchParams.set("start", String(normalizeMusicSmugmugAlbumPhotoStart(start)));
  return apiUrl;
}

function getMusicAlbumPhotoImageSrc(photo) {
  return String(
    photo?.medium_url ||
    photo?.mediumUrl ||
    photo?.small_url ||
    photo?.smallUrl ||
    photo?.thumbnail_url ||
    photo?.thumbnailUrl ||
    photo?.large_url ||
    photo?.largeUrl ||
    ""
  ).trim();
}

function normalizeMusicAlbumPhoto(photo, index = 0) {
  const imageSrc = getMusicAlbumPhotoImageSrc(photo);
  if (!imageSrc) {
    return null;
  }

  const rawImageKey = String(photo?.image_key || photo?.imageKey || "").trim();
  const label = String(photo?.caption || photo?.title || rawImageKey || `Preview photo ${index + 1}`).trim();
  return {
    dedupeKey: rawImageKey || imageSrc,
    imageKey: rawImageKey || `album-photo-${index + 1}`,
    imageSrc,
    label: label || `Preview photo ${index + 1}`,
  };
}

function normalizeMusicAlbumPhotosPayload(payload, limit = MUSIC_SMUGMUG_ALBUM_PHOTOS_PREVIEW_LIMIT) {
  const safeLimit = normalizeMusicSmugmugAlbumPhotoLimit(limit);
  const photos = Array.isArray(payload?.photos) ? payload.photos : [];
  const normalizedPhotos = photos
    .slice(0, safeLimit)
    .map(normalizeMusicAlbumPhoto)
    .filter(Boolean);
  const nextStart = Number.parseInt(payload?.next_start ?? payload?.nextStart, 10);

  return {
    count: getMusicShowDetailCountCandidate(payload?.count, photos.length, normalizedPhotos.length) || normalizedPhotos.length,
    hasMore: normalizeMusicSmugmugHasMore(payload?.has_more ?? payload?.hasMore),
    nextStart: Number.isFinite(nextStart) && nextStart > 0 ? nextStart : null,
    photos: normalizedPhotos,
    total: getMusicShowDetailCountCandidate(payload?.total, payload?.total_count, payload?.totalCount, payload?.count),
  };
}

function getMusicSmugmugAlbumPhotoCacheKey(albumId, type, limit = MUSIC_SMUGMUG_ALBUM_PHOTOS_PREVIEW_LIMIT, start = 1) {
  return `${String(albumId || "").trim()}:${type}:${normalizeMusicSmugmugAlbumPhotoLimit(limit)}:${normalizeMusicSmugmugAlbumPhotoStart(start)}`;
}

function requestMusicSmugmugAlbumPhotosPage(albumId, limit = MUSIC_SMUGMUG_ALBUM_PHOTOS_PREVIEW_LIMIT, start = 1) {
  const safeAlbumId = String(albumId || "").trim();
  const safeLimit = normalizeMusicSmugmugAlbumPhotoLimit(limit);
  const safeStart = normalizeMusicSmugmugAlbumPhotoStart(start);
  const cacheKey = getMusicSmugmugAlbumPhotoCacheKey(safeAlbumId, "page", safeLimit, safeStart);
  if (!safeAlbumId || typeof fetch !== "function") {
    return Promise.resolve({ count: 0, hasMore: false, nextStart: null, photos: [], total: 0 });
  }
  if (musicSmugmugAlbumPhotosCache.has(cacheKey)) {
    return Promise.resolve(musicSmugmugAlbumPhotosCache.get(cacheKey));
  }
  if (musicSmugmugAlbumPhotosRequests.has(cacheKey)) {
    return musicSmugmugAlbumPhotosRequests.get(cacheKey);
  }

  const request = fetch(getMusicSmugmugAlbumPhotosApiUrl(safeAlbumId, safeLimit, safeStart), { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Album photos request failed (${response.status})`);
      }
      return response.json();
    })
    .then((payload) => {
      const result = normalizeMusicAlbumPhotosPayload(payload, safeLimit);
      musicSmugmugAlbumPhotosCache.set(cacheKey, result);
      return result;
    })
    .finally(() => {
      musicSmugmugAlbumPhotosRequests.delete(cacheKey);
    });

  musicSmugmugAlbumPhotosRequests.set(cacheKey, request);
  return request;
}

function getUniqueMusicAlbumPhotos(photos) {
  const seenKeys = new Set();
  return photos.filter((photo) => {
    const uniqueKey = String(photo?.dedupeKey || photo?.imageKey || photo?.imageSrc || "").trim();
    if (!uniqueKey || seenKeys.has(uniqueKey)) {
      return false;
    }
    seenKeys.add(uniqueKey);
    return true;
  });
}

function requestAllMusicSmugmugAlbumPhotos(albumId) {
  const safeAlbumId = String(albumId || "").trim();
  const cacheKey = getMusicSmugmugAlbumPhotoCacheKey(safeAlbumId, "all", MUSIC_SMUGMUG_ALBUM_PHOTOS_PAGE_LIMIT, 1);
  if (!safeAlbumId || typeof fetch !== "function") {
    return Promise.resolve({ isComplete: false, partialError: true, photos: [], total: 0 });
  }
  if (musicSmugmugAlbumPhotosCache.has(cacheKey)) {
    return Promise.resolve(musicSmugmugAlbumPhotosCache.get(cacheKey));
  }
  if (musicSmugmugAlbumPhotosRequests.has(cacheKey)) {
    return musicSmugmugAlbumPhotosRequests.get(cacheKey);
  }

  const request = (async () => {
    const photos = [];
    let start = 1;
    let total = 0;
    let hasMore = true;
    let partialError = false;

    for (let pageIndex = 0; pageIndex < MUSIC_SMUGMUG_ALBUM_PHOTOS_MAX_PAGES && hasMore; pageIndex += 1) {
      let page;
      try {
        page = await requestMusicSmugmugAlbumPhotosPage(safeAlbumId, MUSIC_SMUGMUG_ALBUM_PHOTOS_PAGE_LIMIT, start);
      } catch (error) {
        partialError = true;
        break;
      }

      photos.push(...page.photos);
      total = page.total || total || page.count || photos.length;
      hasMore = Boolean(page.hasMore);
      if (!hasMore) {
        break;
      }
      if (!page.nextStart || page.nextStart <= start) {
        partialError = true;
        break;
      }
      start = page.nextStart;
    }

    if (hasMore) {
      partialError = true;
    }

    const uniquePhotos = getUniqueMusicAlbumPhotos(photos);
    const isComplete = !partialError && (!total || uniquePhotos.length >= total || !hasMore);
    const result = {
      count: uniquePhotos.length,
      isComplete,
      partialError,
      photos: uniquePhotos,
      total: total || uniquePhotos.length,
    };
    if (isComplete) {
      musicSmugmugAlbumPhotosCache.set(cacheKey, result);
    }
    return result;
  })().finally(() => {
    musicSmugmugAlbumPhotosRequests.delete(cacheKey);
  });

  musicSmugmugAlbumPhotosRequests.set(cacheKey, request);
  return request;
}

function requestMusicSmugmugAlbumPhotos(albumId, options = {}) {
  return options.mode === "all"
    ? requestAllMusicSmugmugAlbumPhotos(albumId)
    : requestMusicSmugmugAlbumPhotosPage(albumId, MUSIC_SMUGMUG_ALBUM_PHOTOS_PREVIEW_LIMIT, 1);
}

function createSetGalleryPhotoTile(photo, index = 0) {
  const tile = document.createElement("button");
  tile.className = `archive-gallery-tile set-gallery-photo-tile${index === 0 ? " is-active" : ""}`;
  tile.type = "button";
  tile.dataset.galleryPhoto = "";
  tile.dataset.galleryPhotoLabel = photo.label;
  tile.dataset.galleryKind = "image";
  tile.dataset.galleryMediaId = photo.imageKey;
  tile.dataset.galleryLightboxId = `music-album-photo-${photo.imageKey || index + 1}`;
  tile.setAttribute("aria-label", photo.label);
  tile.setAttribute("aria-pressed", String(index === 0));

  const image = document.createElement("img");
  image.className = "archive-gallery-image";
  image.src = photo.imageSrc;
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";
  image.onerror = () => {
    image.onerror = null;
    image.src = galleryImageFallbackSrc;
  };
  protectArchiveImage(image);
  tile.append(image);
  tile.addEventListener("click", () => {
    selectGalleryPhoto(tile);
  });
  return tile;
}

function renderSetGalleryPhotoHighlights(photos) {
  if (!galleryGrid) {
    return;
  }

  const fragment = document.createDocumentFragment();
  photos.forEach((photo, index) => {
    fragment.append(createSetGalleryPhotoTile(photo, index));
  });
  galleryGrid.replaceChildren(fragment);
  activeGalleryPhoto = null;
  const firstTile = getCurrentGalleryPhotoTiles()[0] || null;
  if (firstTile) {
    selectGalleryPhoto(firstTile);
  }
}

function loadSetGalleryPhotoHighlights(row, options = {}) {
  const albumId = getSetAlbumId(row);
  const requestedMode = options.mode === "all" ? "all" : "preview";
  const requestKey = `${albumId}:${requestedMode}`;
  activeSetGalleryPhotoMode = requestedMode;
  activeSetGalleryPhotoTotal = getSetAlbumPhotoTotal(row);
  activeSetGalleryAlbumRequestKey = requestKey;
  if (setGallery) {
    setGallery.dataset.albumId = albumId;
    setGallery.dataset.albumPhotoMode = activeSetGalleryPhotoMode;
  }
  setSetGalleryPhotoWarning("");
  if (!albumId) {
    if (galleryGrid) {
      galleryGrid.replaceChildren();
    }
    updateSetGalleryPhotoSummary(0, activeSetGalleryPhotoTotal, activeSetGalleryPhotoMode);
    setGalleryState("empty");
    return;
  }

  updateSetGalleryPhotoSummary(0, activeSetGalleryPhotoTotal, activeSetGalleryPhotoMode);
  setSetGalleryLoadingCopy(
    requestedMode === "all" ? "Loading full archive..." : "Loading archive photos...",
    requestedMode === "all" ? "Fetching album pages." : "Preparing preview frames."
  );
  setGalleryState("loading");
  requestMusicSmugmugAlbumPhotos(albumId, { mode: requestedMode })
    .then((result) => {
      if (activeSetGalleryAlbumRequestKey !== requestKey) {
        return;
      }
      const photos = result?.photos || [];
      if (result?.total) {
        activeSetGalleryPhotoTotal = result.total;
      }
      if (photos.length === 0) {
        if (galleryGrid) {
          galleryGrid.replaceChildren();
        }
        updateSetGalleryPhotoSummary(0, activeSetGalleryPhotoTotal, activeSetGalleryPhotoMode);
        setGalleryState("empty");
        return;
      }
      renderSetGalleryPhotoHighlights(photos);
      if (requestedMode === "all" && result?.partialError) {
        setSetGalleryPhotoWarning("Full archive could not fully load.");
      }
      updateSetGalleryPhotoSummary(photos.length, activeSetGalleryPhotoTotal, activeSetGalleryPhotoMode);
      setGalleryState("ready");
    })
    .catch(() => {
      if (activeSetGalleryAlbumRequestKey !== requestKey) {
        return;
      }
      if (requestedMode === "all") {
        activeSetGalleryPhotoMode = "preview";
        if (setGallery) {
          setGallery.dataset.albumPhotoMode = activeSetGalleryPhotoMode;
        }
        setSetGalleryPhotoWarning("Full archive could not fully load.");
        updateSetGalleryPhotoSummary(getCurrentGalleryPhotoTiles().length, activeSetGalleryPhotoTotal, activeSetGalleryPhotoMode);
        setGalleryState("ready");
        return;
      }
      if (galleryGrid) {
        galleryGrid.replaceChildren();
      }
      updateSetGalleryPhotoSummary(0, activeSetGalleryPhotoTotal, activeSetGalleryPhotoMode);
      setGalleryState("error");
    });
}

function toggleSetGalleryPhotoRange() {
  const row = activeSetRow || getFirstVisibleSetRow() || getSetsRows()[0] || null;
  if (!row || !galleryViewAll || galleryViewAll.disabled || galleryViewAll.getAttribute("aria-disabled") === "true") {
    return;
  }

  const nextMode = activeSetGalleryPhotoMode === "all" ? "preview" : "all";
  loadSetGalleryPhotoHighlights(row, { mode: nextMode });
  if (galleryGrid && nextMode === "preview") {
    galleryGrid.scrollIntoView({
      block: "nearest",
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }
}

function normalizeLightboxIndex(index) {
  const photoCount = Math.max(getCurrentGalleryPhotoTiles().length, 1);
  return ((index % photoCount) + photoCount) % photoCount;
}

function getLightboxPhotoData(index) {
  const normalizedIndex = normalizeLightboxIndex(index);
  const tile = getCurrentGalleryPhotoTiles()[normalizedIndex] || null;
  const label = getGalleryPhotoLabel(tile) || `Photo ${String(normalizedIndex + 1).padStart(2, "0")}`;
  const accent = setImageAccents[normalizedIndex % setImageAccents.length];

  return {
    accent,
    imageSrc: getGalleryPhotoImageSrc(tile),
    label,
    lightboxId: tile ? tile.dataset.galleryLightboxId || "" : "",
    mediaId: tile ? tile.dataset.galleryMediaId || "" : "",
    mockIndex: lightboxBasePhotoIndex + normalizedIndex,
    normalizedIndex,
    tile,
  };
}

function syncLightboxThumbButtons() {
  lightboxThumbButtons.forEach((button, index) => {
    const data = getLightboxPhotoData(index);
    const isActive = index === activeLightboxIndex;

    button.textContent = data.label;
    button.setAttribute("aria-label", `Open ${data.label}`);
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    if (data.accent) {
      button.style.setProperty("--thumb-x", data.accent.x);
      button.style.setProperty("--thumb-y", data.accent.y);
      button.style.setProperty("--thumb-accent", data.accent.color);
    }
  });
}

function setLightboxActivePhoto(index, options = {}) {
  const data = getLightboxPhotoData(index);
  const didChangePhoto = activeLightboxIndex !== data.normalizedIndex;
  activeLightboxIndex = data.normalizedIndex;

  if (options.shouldSyncGallery !== false && data.tile) {
    selectGalleryPhoto(data.tile);
  }
  if (lightboxPhoto) {
    lightboxPhoto.setAttribute("aria-label", `${data.label} placeholder lightbox image`);
    lightboxPhoto.dataset.galleryMediaId = data.mediaId;
    lightboxPhoto.dataset.galleryLightboxId = data.lightboxId;
    lightboxPhoto.style.setProperty("--lightbox-photo-ratio", lightboxPhotoRatios[activeLightboxIndex % lightboxPhotoRatios.length]);
    if (data.accent) {
      lightboxPhoto.style.setProperty("--lightbox-photo-x", data.accent.x);
      lightboxPhoto.style.setProperty("--lightbox-photo-y", data.accent.y);
      lightboxPhoto.style.setProperty("--lightbox-photo-accent", data.accent.color);
    }
  }
  if (lightboxImage && data.imageSrc) {
    setLightboxImageSource(data.imageSrc);
  }
  if (lightboxPhotoTitle) {
    lightboxPhotoTitle.textContent = data.label;
  }
  if (lightboxCounter) {
    lightboxCounter.textContent = `${data.mockIndex} / ${lightboxTotalPhotos}`;
  }
  if (lightboxMetaTitle) {
    lightboxMetaTitle.textContent = data.label;
  }
  if (lightboxMetaBandTags) {
    lightboxMetaBandTags.textContent = activeMusicBand ? activeMusicBand.name : "13 High";
  }
  if (lightboxMetaShow) {
    lightboxMetaShow.textContent = activeSetRow && activeSetRow.dataset.setTitle
      ? activeSetRow.dataset.setTitle
      : "In Yo Face Tour 2018";
  }
  if (lightboxMetaVenue) {
    lightboxMetaVenue.textContent = activeSetRow ? getSetVenue(activeSetRow) : "O'Donoghues Pub";
  }
  if (lightboxMetaLocation) {
    lightboxMetaLocation.textContent = activeSetRow && activeSetRow.dataset.setLocation
      ? activeSetRow.dataset.setLocation
      : "Brunswick, Maine";
  }
  if (lightboxMetaDate) {
    lightboxMetaDate.textContent = activeSetRow && activeSetRow.dataset.setDate
      ? activeSetRow.dataset.setDate
      : "July 14th, 2018";
  }
  if (lightboxMetaPerformance) {
    lightboxMetaPerformance.textContent = activeSetRow && activeSetRow.dataset.setPerformance
      ? activeSetRow.dataset.setPerformance
      : "11th";
  }
  if (lightboxMetaCamera) {
    lightboxMetaCamera.textContent = activeSetRow && activeSetRow.dataset.setCamera
      ? activeSetRow.dataset.setCamera
      : "Canon EOS 80D";
  }
  if (didChangePhoto || options.forceTransition) {
    runLightboxImageTransition();
  }
  syncLightboxThumbButtons();
  if (isLightboxThumbnailStripOpen) {
    const activeThumb = Array.from(lightboxThumbButtons)[activeLightboxIndex];
    if (activeThumb && lightboxThumbnailStrip) {
      const maxLeft = Math.max(0, lightboxThumbnailStrip.scrollWidth - lightboxThumbnailStrip.clientWidth);
      const targetLeft = activeThumb.offsetLeft - (lightboxThumbnailStrip.clientWidth - activeThumb.offsetWidth) / 2;
      lightboxThumbnailStrip.scrollTo({
        left: Math.max(0, Math.min(targetLeft, maxLeft)),
        behavior: "auto",
      });
    }
  }
}

function setLightboxThumbnailStripVisible(isVisible) {
  if (isVisible) {
    setLightboxInfoVisible(false);
  }
  isLightboxThumbnailStripOpen = isVisible;
  if (lightboxThumbnailStrip) {
    lightboxThumbnailStrip.classList.toggle("is-active", isVisible);
    lightboxThumbnailStrip.setAttribute("aria-hidden", String(!isVisible));
    if (isVisible) {
      lightboxThumbnailStrip.removeAttribute("inert");
    } else {
      lightboxThumbnailStrip.setAttribute("inert", "");
    }
  }
  lightboxViewToggles.forEach((button) => {
    const shouldBeActive = isVisible
      ? button.dataset.lightboxViewToggle === "thumbs"
      : button.dataset.lightboxViewToggle === "grid";
    button.classList.toggle("is-active", shouldBeActive);
    button.setAttribute("aria-pressed", String(shouldBeActive));
  });
  if (isVisible) {
    syncLightboxThumbButtons();
  }
}

function setLightboxControlsHidden(isHidden) {
  areLightboxControlsHidden = isHidden;
  if (isHidden) {
    setLightboxInfoVisible(false);
    setLightboxThumbnailStripVisible(false);
  }
  if (lightboxScreen) {
    lightboxScreen.classList.toggle("is-controls-hidden", isHidden);
  }
}

function showLightbox(photoTile = activeGalleryPhoto) {
  if (!lightboxScreen) {
    return;
  }

  const requestedTile = photoTile && typeof photoTile.matches === "function" && photoTile.matches("[data-gallery-photo]")
    ? photoTile
    : null;
  const targetTile = requestedTile || activeGalleryPhoto || getCurrentGalleryPhotoTiles()[0] || null;
  if (targetTile) {
    selectGalleryPhoto(targetTile);
  }
  markLightboxTransitionSource(targetTile);
  setGalleryModeVisible(false);
  setLightboxActivePhoto(getGalleryPhotoIndex(targetTile), { forceTransition: true, shouldSyncGallery: false });
  setLightboxInfoVisible(false);
  setLightboxThumbnailStripVisible(false);
  setSetGalleryVisible(false);
  setLightboxVisible(true);
  runLightboxEntryTransition();
  setCurrentView("Lightbox");
  if (musicNexusShell) {
    musicNexusShell.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }
}

function returnToSetGalleryFromLightbox() {
  setLightboxVisible(false);
  setSetGalleryVisible(true);
  setCurrentView(activeSetRow?.dataset.setTitle || "Set Gallery");
  window.requestAnimationFrame(() => {
    const focusTarget = activeGalleryPhoto || galleryViewAll;
    if (focusTarget) {
      focusTarget.focus({ preventScroll: true });
    }
  });
  if (musicNexusShell) {
    musicNexusShell.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }
}

function getLightboxGesturePoint(event) {
  return {
    x: Number.isFinite(event.clientX) ? event.clientX : 0,
    y: Number.isFinite(event.clientY) ? event.clientY : 0,
  };
}

function clampLightboxSwipeOffset(deltaX) {
  const maxOffset = 42;
  return Math.max(-maxOffset, Math.min(maxOffset, deltaX * 0.32));
}

function resetLightboxSwipeState() {
  if (lightboxPhoto) {
    lightboxPhoto.classList.remove("is-swipe-tracking");
    lightboxPhoto.style.setProperty("--lightbox-swipe-x", "0px");
  }
  lightboxSwipeGesture = null;
}

function handleLightboxSwipeStart(event) {
  if (
    !isLightboxOpen() ||
    event.defaultPrevented ||
    event.pointerType === "mouse" ||
    event.isPrimary === false ||
    (lightboxScreen && lightboxScreen.classList.contains("is-info-open"))
  ) {
    return;
  }

  const point = getLightboxGesturePoint(event);
  lightboxSwipeGesture = {
    pointerId: event.pointerId,
    startX: point.x,
    startY: point.y,
    latestX: point.x,
    latestY: point.y,
    startedAt: window.performance.now(),
    isTracking: false,
  };
  if (lightboxPhoto && typeof lightboxPhoto.setPointerCapture === "function") {
    try {
      lightboxPhoto.setPointerCapture(event.pointerId);
    } catch (error) {
      // Synthetic or older webview pointer streams may not support capture.
    }
  }
}

function handleLightboxSwipeMove(event) {
  if (!lightboxSwipeGesture || event.pointerId !== lightboxSwipeGesture.pointerId) {
    return;
  }

  const point = getLightboxGesturePoint(event);
  const deltaX = point.x - lightboxSwipeGesture.startX;
  const deltaY = point.y - lightboxSwipeGesture.startY;
  lightboxSwipeGesture.latestX = point.x;
  lightboxSwipeGesture.latestY = point.y;

  if (!lightboxSwipeGesture.isTracking && Math.abs(deltaY) > lightboxGestureVerticalLimit) {
    resetLightboxSwipeState();
    return;
  }

  if (Math.abs(deltaX) < 8 && !lightboxSwipeGesture.isTracking) {
    return;
  }

  lightboxSwipeGesture.isTracking = true;
  lightboxGestureSuppressClick = true;
  if (lightboxPhoto) {
    lightboxPhoto.classList.add("is-swipe-tracking");
    lightboxPhoto.style.setProperty("--lightbox-swipe-x", `${clampLightboxSwipeOffset(deltaX)}px`);
  }
  event.preventDefault();
}

function commitLightboxSwipe(direction) {
  if (!lightboxPhoto) {
    return;
  }

  window.clearTimeout(lightboxSwipeCommitTimer);
  lightboxPhoto.classList.remove("is-swipe-tracking");
  lightboxPhoto.classList.add("is-swipe-committing");
  lightboxPhoto.style.setProperty("--lightbox-swipe-x", direction < 0 ? "-32px" : "32px");
  lightboxSwipeCommitTimer = window.setTimeout(() => {
    lightboxPhoto.classList.remove("is-swipe-committing");
    lightboxPhoto.style.setProperty("--lightbox-swipe-x", "0px");
  }, lightboxImageTransitionDuration);
}

function handleLightboxSwipeEnd(event) {
  if (!lightboxSwipeGesture || event.pointerId !== lightboxSwipeGesture.pointerId) {
    return;
  }

  const point = getLightboxGesturePoint(event);
  const deltaX = point.x - lightboxSwipeGesture.startX;
  const deltaY = point.y - lightboxSwipeGesture.startY;
  const gestureDuration = window.performance.now() - lightboxSwipeGesture.startedAt;
  const isSwipe = Math.abs(deltaX) >= lightboxGestureThreshold &&
    Math.abs(deltaY) <= lightboxGestureVerticalLimit &&
    gestureDuration <= lightboxGestureMaxDuration;

  resetLightboxSwipeState();
  if (isSwipe) {
    const direction = deltaX < 0 ? 1 : -1;
    lightboxGestureSuppressClick = true;
    setLightboxControlsHidden(false);
    commitLightboxSwipe(direction);
    setLightboxActivePhoto(activeLightboxIndex + direction);
  }
}

function handleLightboxSwipeCancel(event) {
  if (!lightboxSwipeGesture || event.pointerId !== lightboxSwipeGesture.pointerId) {
    return;
  }

  resetLightboxSwipeState();
}

function isLightboxOpen() {
  return Boolean(lightboxScreen && lightboxScreen.getAttribute("aria-hidden") === "false");
}

function handleLightboxKeydown(event) {
  if (!isLightboxOpen() || event.defaultPrevented) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    if (lightboxScreen && lightboxScreen.classList.contains("is-info-open")) {
      setLightboxInfoVisible(false);
      if (lightboxInfoToggle) {
        lightboxInfoToggle.focus({ preventScroll: true });
      }
      return;
    }
    returnToSetGalleryFromLightbox();
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    setLightboxControlsHidden(false);
    setLightboxActivePhoto(activeLightboxIndex - 1);
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    setLightboxControlsHidden(false);
    setLightboxActivePhoto(activeLightboxIndex + 1);
  }
}

function openSelectedSetDetail() {
  const row = activeSetRow || getFirstVisibleSetRow() || getSetsRows()[0];
  if (!row) {
    return;
  }

  navigateToSetDetail(row);
}

function closeSelectedSetDetail() {
  if (getRouteFromUrl().name === "set-detail") {
    returnToBandDetailRoute();
    return;
  }

  setSetDetailVisible(false);
  if (setsFeaturedOpen) {
    setsFeaturedOpen.focus({ preventScroll: true });
  }
}

function showSetGallery() {
  const row = activeSetRow || getFirstVisibleSetRow() || getSetsRows()[0];
  if (!row || !setGallery) {
    return;
  }

  showSetGalleryRoute(row);
}

function returnToSetsArchiveFromGallery() {
  const route = getRouteFromUrl();
  if (route.name === "set-detail") {
    const historyState = window.history.state || {};
    const bandId = route.bandId || getBandId(activeMusicBand);
    if (!bandId) {
      returnToBandsIndexRoute();
      return;
    }

    const setsArchiveUrl = historyState.setsArchiveUrl || getBandSetsRouteUrl(bandId);
    if (historyState.setsArchiveUrl && historyState.fromSetsArchive) {
      window.history.back();
      return;
    }

    navigateToRoute(setsArchiveUrl, {
      historyState: {
        bandUrl: historyState.bandUrl || getBandRouteUrl(bandId),
        returnUrl: normalizeBandsReturnUrl(historyState.returnUrl || bandsIndexReturnUrl),
        fromBandDetail: true,
        fromBandsIndex: Boolean(historyState.fromBandsIndex),
      },
    });
    return;
  }

  setSetGalleryVisible(false);
  setSetsArchiveVisible(true);
  setCurrentView(activeMusicBand ? `Sets ${activeMusicBand.name}` : "Sets Archive");
  if (musicNexusShell) {
    musicNexusShell.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }
}

function getSetsArchiveRowsForBand(band) {
  const rows = musicShowsSetsCollection.length > 0 ? musicShowsSetsCollection : getFallbackSetRowsData();
  if (musicShowsSetsDataState !== "live" || !band) {
    return rows;
  }

  const bandNames = [
    band.name,
    band.general?.name,
    band.band,
    band.title,
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
  const bandSlugs = new Set([
    getBandId(band),
    band.band_id,
    band.id,
    band.slug,
    ...bandNames,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .map(createBandSlug));

  return rows.filter((show) => {
    const showBands = show.bandNames || [];
    const showBandMatches = showBands.some((showBand) => {
      const normalizedBand = String(showBand || "").trim().toLowerCase();
      return bandNames.includes(normalizedBand) || bandSlugs.has(createBandSlug(normalizedBand));
    });
    const showSlugMatches = (show.bandSlugs || []).some((showSlug) => bandSlugs.has(createBandSlug(showSlug)));
    return showBandMatches || showSlugMatches;
  });
}

function getSetsArchiveDateSort(row) {
  const existingSort = Number(row?.dateSort);
  if (Number.isFinite(existingSort) && existingSort > 0) {
    return existingSort;
  }

  return parseMusicShowDate(row?.rawDate || row?.date || row?.formattedDate)?.getTime() || 0;
}

function getSortedSetsArchiveRows(rows) {
  return [...rows].sort((a, b) => {
    const dateDelta = getSetsArchiveDateSort(b) - getSetsArchiveDateSort(a);
    if (dateDelta !== 0) {
      return dateDelta;
    }

    return String(a?.name || "").localeCompare(String(b?.name || ""));
  });
}

function setArchivePosterImage(image, imageSrc, fallbackElement, loadedClassName) {
  if (!image) {
    return;
  }

  const shell = image.parentElement;
  if (shell && loadedClassName) {
    shell.classList.remove(loadedClassName);
  }
  image.onload = null;
  image.onerror = null;
  image.hidden = true;
  image.removeAttribute("src");
  if (fallbackElement) {
    fallbackElement.hidden = false;
  }

  if (!imageSrc) {
    return;
  }

  image.onload = () => {
    image.hidden = false;
    if (fallbackElement) {
      fallbackElement.hidden = true;
    }
    if (shell && loadedClassName) {
      shell.classList.add(loadedClassName);
    }
  };
  image.onerror = () => {
    image.hidden = true;
    image.removeAttribute("src");
    if (fallbackElement) {
      fallbackElement.hidden = false;
    }
    if (shell && loadedClassName) {
      shell.classList.remove(loadedClassName);
    }
  };
  image.src = imageSrc;
}

function createSetsListRow(show, isActive = false) {
  const item = document.createElement("li");
  const row = document.createElement("button");
  const setAlbum = getMusicShowAlbumForBand(show, activeMusicBand, show.setCode);
  const setAlbumPhotoCount = getMusicShowAlbumPhotoCount(setAlbum);
  const setAlbumStatus = getAlbumStatusLabelFromValue(setAlbum?.status);
  const setPerformance = getMusicShowBandPerformanceValue(
    show,
    activeMusicBand,
    formatOrdinalNumber(setAlbum?.bandViewCount ?? setAlbum?.band_view_count, "Pending")
  );
  row.className = "sets-list-row";
  row.type = "button";
  row.dataset.setRow = "";
  row.dataset.setCode = show.setCode;
  row.dataset.setShowId = getMusicShowIdValue(show);
  row.dataset.setYear = show.year;
  row.dataset.setDate = show.formattedDate;
  row.dataset.setRawDate = show.rawDate || "";
  row.dataset.setTitle = show.name;
  row.dataset.setLocation = show.location;
  row.dataset.setCity = show.city || "";
  row.dataset.setState = show.state || "";
  row.dataset.setPoster = show.poster || "";
  row.dataset.setVenue = getMusicShowVenueName(show);
  row.dataset.setPerformance = setPerformance;
  row.dataset.setPhotos = setAlbumPhotoCount !== null && setAlbumPhotoCount > 0
    ? String(setAlbumPhotoCount)
    : "Pending";
  row.dataset.setAlbumStatus = setAlbumStatus;
  row.dataset.setContributors = show.contributors || "Coming Soon";
  row.dataset.setComplete = "";
  row.dataset.setCamera = show.camera || "N/A";
  row.dataset.setNotes = show.notes || "No notes at the moment.";
  row.dataset.setThumb = getSetImageLabel({ dataset: { setDate: show.formattedDate, setThumb: activeMusicBand?.thumb || "" } });
  row.setAttribute("aria-label", `Open ${show.name}, ${show.formattedDate}, ${show.location}`);
  if (isActive) {
    row.classList.add("is-active");
    row.setAttribute("aria-pressed", "true");
  } else {
    row.setAttribute("aria-pressed", "false");
  }

  const thumb = document.createElement("span");
  thumb.className = "sets-row-thumb";
  thumb.setAttribute("aria-hidden", "true");
  const poster = document.createElement("img");
  poster.className = "sets-row-poster";
  poster.alt = "";
  poster.loading = "lazy";
  poster.decoding = "async";
  poster.hidden = true;
  const fallback = document.createElement("span");
  fallback.className = "sets-row-fallback";
  fallback.textContent = row.dataset.setThumb;
  thumb.append(poster, fallback);
  setArchivePosterImage(poster, show.poster, fallback, "has-poster");

  const copy = document.createElement("span");
  copy.className = "sets-list-copy";
  const date = document.createElement("span");
  date.className = "sets-list-date";
  date.textContent = show.formattedDate;
  const title = document.createElement("span");
  title.className = "sets-list-title";
  title.textContent = show.name;
  const location = document.createElement("span");
  location.className = "sets-list-location";
  location.textContent = show.location;
  copy.append(date, title, location);
  row.append(thumb, copy);
  row.addEventListener("click", () => {
    navigateToSetDetail(row);
  });
  item.append(row);
  return item;
}

function renderSetsEmptyState(message = "No live shows indexed for this band yet.") {
  if (!setsList) {
    return;
  }

  const item = document.createElement("li");
  item.className = "sets-list-empty";
  item.textContent = message;
  setsList.replaceChildren(item);
}

function renderSetsListRows(rows, selectedSetCode = "") {
  if (!setsList) {
    return;
  }

  if (rows.length === 0) {
    renderSetsEmptyState();
    return;
  }

  const activeCode = selectedSetCode || rows[0].setCode;
  const fragment = document.createDocumentFragment();
  rows.forEach((show) => {
    fragment.append(createSetsListRow(show, show.setCode === activeCode));
  });
  setsList.replaceChildren(fragment);
}

function getSetsArchiveYearValue(row) {
  const parsedDate = parseMusicShowDate(row?.rawDate || row?.date || row?.formattedDate);
  if (parsedDate) {
    return parsedDate.getFullYear();
  }

  const yearValue = Number.parseInt(row?.year, 10);
  return Number.isFinite(yearValue) ? yearValue : null;
}

function updateSetsArchiveSummary(rows = []) {
  if (!setsArchiveSummary) {
    return;
  }

  const setCount = rows.length;
  const years = rows
    .map(getSetsArchiveYearValue)
    .filter((year) => Number.isFinite(year));
  const minYear = years.length > 0 ? Math.min(...years) : null;
  const maxYear = years.length > 0 ? Math.max(...years) : null;
  const yearRange = minYear && maxYear
    ? (minYear === maxYear ? String(minYear) : `${minYear}\u2013${maxYear}`)
    : "YEAR PENDING";

  setsArchiveSummary.textContent = `${setCount} SET${setCount === 1 ? "" : "S"} \u2022 ${yearRange}`;
}

function renderSetsArchiveRows(rows, options = {}) {
  const archiveRows = getSortedSetsArchiveRows(rows);
  const selectedSetCode = normalizeSetCode(options.selectedSetCode || "");
  const selectedRowData = archiveRows.find((row) => normalizeSetCode(row.setCode) === selectedSetCode) || archiveRows[0] || null;

  updateSetsArchiveSummary(archiveRows);
  renderSetsListRows(archiveRows, selectedRowData?.setCode || selectedSetCode);
  updateSetsFeaturedFromRow(
    findSetRowByCode(selectedRowData?.setCode || selectedSetCode) || getSetsRows()[0] || null
  );
}

function updateSetsFeaturedFromRow(row) {
  if (!row) {
    activeSetRow = null;
    setArchivePosterImage(setsFeaturedPoster, "", setsFeaturedThumb, "has-poster");
    if (setsFeaturedImage) {
      setsFeaturedImage.setAttribute("aria-label", "Featured set placeholder image");
    }
    if (setsFeaturedThumb) {
      setsFeaturedThumb.textContent = activeMusicBand ? getBandInitials(activeMusicBand.name) : "SET";
    }
    if (setsFeaturedDate) {
      setsFeaturedDate.textContent = "Date Pending";
    }
    if (setsFeaturedTitle) {
      setsFeaturedTitle.textContent = "No live shows indexed";
    }
    if (setsFeaturedLocation) {
      setsFeaturedLocation.textContent = "Location Pending";
    }
    return;
  }

  activeSetRow = row;
  getSetsRows().forEach((candidate) => {
    const isActive = candidate === row;
    candidate.classList.toggle("is-active", isActive);
    candidate.setAttribute("aria-pressed", String(isActive));
  });

  const setData = row.dataset;
  const imageAccent = getSetImageAccent(row);
  if (setsFeaturedImage) {
    setsFeaturedImage.setAttribute("aria-label", `${setData.setTitle} featured show poster`);
    setsFeaturedImage.style.setProperty("--set-image-x", imageAccent.x);
    setsFeaturedImage.style.setProperty("--set-image-y", imageAccent.y);
    setsFeaturedImage.style.setProperty("--set-image-accent", imageAccent.color);
  }
  setArchivePosterImage(setsFeaturedPoster, setData.setPoster || "", setsFeaturedThumb, "has-poster");
  if (setsFeaturedThumb) {
    setsFeaturedThumb.textContent = getSetImageLabel(row);
  }
  if (setsFeaturedDate) {
    setsFeaturedDate.textContent = setData.setDate || "";
  }
  if (setsFeaturedTitle) {
    setsFeaturedTitle.textContent = setData.setTitle || "";
  }
  if (setsFeaturedLocation) {
    setsFeaturedLocation.textContent = setData.setLocation || "";
  }
  if (isSetDetailOpen) {
    updateSetDetailFromRow(row);
  }
}

function showSetsArchive(options = {}) {
  const band = activeMusicBand || musicBandIndexRows[0];
  if (!band || !setsArchive) {
    return;
  }

  const selectedSetRow = options.selectedSetRow || null;
  const selectedSetCode = normalizeSetCode(options.selectedSetCode || getSetCode(selectedSetRow));
  activeMusicBand = band;
  if (setsArchiveBand) {
    setsArchiveBand.textContent = band.name;
  }

  setBandsIndexVisible(false);
  setBandDetailVisible(false);
  setSetsArchiveVisible(true);
  setSetDetailVisible(false);
  if (!musicShowsSetsLoaded && musicShowsSetsCollection.length === 0) {
    restoreMusicShowsSetsFallback();
  }
  renderSetsArchiveRows(getSetsArchiveRowsForBand(band), { selectedSetCode });
  setCurrentView(`Sets ${band.name}`);
  requestMusicShowsSetsData().then(() => {
    const route = getRouteFromUrl();
    const isStillSetsContext = setsArchive.getAttribute("aria-hidden") === "false" || route.name === "set-detail";
    if (!isStillSetsContext || getBandId(activeMusicBand) !== getBandId(band)) {
      return;
    }

    renderSetsArchiveRows(getSetsArchiveRowsForBand(band), { selectedSetCode });
  });
  if (options.shouldScroll !== false && musicNexusShell) {
    musicNexusShell.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }
}

function returnToBandDetailFromSets() {
  if (!activeMusicBand) {
    showBandsIndexView({ shouldFocus: true });
    return;
  }

  setSetsArchiveVisible(false);
  setSetDetailVisible(false);
  setBandDetailVisible(true);
  setCurrentView("Band Detail");
  if (musicNexusShell) {
    musicNexusShell.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }
}

function createBandsFilterOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function syncActiveBandsFilterOptions() {
  if (!shouldUseBandsPanelFilters()) {
    return;
  }

  activeBandsRegionFilter = normalizeBandsRegionFilter(activeBandsRegionFilter);
  activeBandsStatusFilter = normalizeBandsStatusFilter(activeBandsStatusFilter);
  activeBandsFilterLetter = normalizeBandsLetterFilter(activeBandsFilterLetter);

  if (!activeBandsFilterLetter) {
    return;
  }

  const availableLetters = new Set(getBandsFilterOptionRows().map(getBandLetter));
  if (!availableLetters.has(activeBandsFilterLetter)) {
    activeBandsFilterLetter = "";
  }
}

function renderBandsFilterSelects() {
  if (bandsFilterSelects.length === 0) {
    return;
  }

  const letterCounts = getBandLetterCounts(getBandsFilterOptionRows());
  bandsFilterSelects.forEach((select) => {
    const filterType = select.dataset.bandsFilter;
    if (filterType === "letter") {
      const fragment = document.createDocumentFragment();
      fragment.append(createBandsFilterOption("", "All"));
      bandsAlphabet.forEach((letter) => {
        if ((letterCounts.get(letter) || 0) > 0) {
          fragment.append(createBandsFilterOption(letter, letter));
        }
      });
      select.replaceChildren(fragment);
      select.value = activeBandsFilterLetter && letterCounts.has(activeBandsFilterLetter)
        ? activeBandsFilterLetter
        : "";
      return;
    }

    if (filterType === "region") {
      select.value = activeBandsRegionFilter;
      return;
    }

    if (filterType === "status") {
      select.value = activeBandsStatusFilter;
    }
  });
}

function updateBandsFilterResetButtons() {
  bandsFilterResetButtons.forEach((button) => {
    button.disabled = !hasActiveBandsPanelFilters();
    button.setAttribute("aria-disabled", String(button.disabled));
  });
}

function renderBandsLetterNavs(rows) {
  if (bandsLetterNavs.length === 0) {
    return;
  }

  const counts = getBandLetterCounts(rows);
  bandsLetterNavs.forEach((nav) => {
    const isListNav = nav.hasAttribute("data-bands-letter-nav-list");
    const isRadarNav = nav.hasAttribute("data-bands-letter-nav") && !isListNav;
    const fragment = document.createDocumentFragment();
    if (isListNav || isRadarNav) {
      const allButton = document.createElement("button");
      allButton.className = `bands-letter-button bands-letter-button--all${rows.length > 0 ? " has-signal" : ""}`;
      allButton.type = "button";
      allButton.textContent = "All";
      allButton.disabled = rows.length === 0;
      allButton.setAttribute("aria-pressed", String(isRadarNav ? !activeBandsLetter : !activeBandsFilterLetter));
      allButton.setAttribute("aria-label", `${rows.length} total band signals`);
      allButton.addEventListener("click", () => {
        if (isRadarNav) {
          activeBandsLetter = "";
        } else {
          activeBandsFilterLetter = "";
        }
        syncBandsIndex();
        const listScroller = getBandsListScroller();
        if (!isRadarNav && listScroller) {
          listScroller.scrollTo({
            top: 0,
            behavior: reducedMotion.matches ? "auto" : "smooth",
          });
        }
      });
      fragment.append(allButton);
    }
    bandsAlphabet.forEach((letter) => {
      const count = counts.get(letter) || 0;
      if ((isListNav || isRadarNav) && count === 0) {
        return;
      }
      const button = document.createElement("button");
      const isSearchMatch = activeBandsView === "search" && Boolean(bandsSearchTerm) && count > 0;
      button.className = `bands-letter-button${count > 0 ? " has-signal" : ""}${isSearchMatch ? " is-search-match" : ""}`;
      button.type = "button";
      button.textContent = letter;
      button.disabled = count === 0;
      button.setAttribute("aria-pressed", String(isListNav ? activeBandsFilterLetter === letter : letter === activeBandsLetter));
      button.setAttribute("aria-label", count > 0 ? `${letter}, ${count} band signals` : `${letter}, no band signals`);
      button.addEventListener("click", () => {
        setBandsLetter(letter, {
          shouldFilterList: isListNav,
          shouldOpenList: false,
        });
      });
      fragment.append(button);
    });
    nav.replaceChildren(fragment);
  });
}

function renderBandsRadar(rows) {
  const forcedState = getForcedMockState("musicBands");
  const isAllRadar = !activeBandsLetter;
  const activeRows = isAllRadar ? rows : rows.filter((band) => getBandLetter(band) === activeBandsLetter);

  if (bandsRadarLetter) {
    bandsRadarLetter.textContent = isAllRadar ? "All" : activeBandsLetter;
    const radarCore = bandsRadarLetter.closest(".bands-radar-core");
    if (radarCore) {
      radarCore.classList.toggle("is-all-mode", isAllRadar);
    }
  }
  if (bandsRadarCount) {
    bandsRadarCount.textContent = `${activeRows.length} signal${activeRows.length === 1 ? "" : "s"}`;
  }
  if (bandsRadarSignals) {
    const fragment = document.createDocumentFragment();
    if (forcedState && forcedState !== "partial") {
      const empty = document.createElement("li");
      empty.className = "bands-radar-signal bands-radar-empty";
      empty.textContent = getMockStateCopy(forcedState, "musicBands").title;
      fragment.append(empty);
    } else if (activeRows.length === 0) {
      const empty = document.createElement("li");
      empty.className = "bands-radar-signal bands-radar-empty";
      empty.textContent = "No active signal";
      fragment.append(empty);
    } else {
      const signalRows = activeRows.slice(0, 8);
      signalRows.forEach((band) => {
        const item = document.createElement("li");
        item.className = "bands-radar-signal";
        const button = document.createElement("button");
        button.className = "bands-radar-signal-button";
        button.type = "button";
        button.textContent = band.name;
        button.setAttribute("aria-label", `Open ${band.name} band detail`);
        button.addEventListener("click", () => {
          navigateToBandDetail(band);
        });
        item.append(button);
        fragment.append(item);
      });
      if (activeRows.length > signalRows.length) {
        const summary = document.createElement("li");
        summary.className = "bands-radar-signal bands-radar-more";
        summary.textContent = `${activeRows.length - signalRows.length} more`;
        fragment.append(summary);
      }
    }
    bandsRadarSignals.replaceChildren(fragment);
  }
  if (bandsRadarPoints) {
    const fragment = document.createDocumentFragment();
    rows.forEach((band, index) => {
      const point = document.createElement("span");
      const offset = getRadarPointOffset(index, rows.length);
      point.className = `bands-radar-point${!isAllRadar && getBandLetter(band) === activeBandsLetter ? " is-letter-active" : ""}`;
      point.style.setProperty("--radar-x", offset[0]);
      point.style.setProperty("--radar-y", offset[1]);
      point.setAttribute("title", band.name);
      fragment.append(point);
    });
    bandsRadarPoints.replaceChildren(fragment);
  }
}

function createBandListRow(band, options = {}) {
  const letter = getBandLetter(band);
  const photoCount = getBandIndexNumber(band.photo_count ?? band.photos ?? band.stats?.totalPhotos) ?? 0;
  const archivedSetCount = getBandIndexNumber(band.archived_sets ?? band.stats?.archived_sets) ?? 0;
  const totalSetCount = getBandIndexNumber(band.total_sets ?? band.albums ?? band.stats?.total_sets) ?? 0;
  const shouldShowArchiveSize = band.statusKey !== "needs";
  const archiveSizeLabel = shouldShowArchiveSize
    ? `, ${formatBandIndexNumber(photoCount)} photos, ${formatBandIndexNumber(archivedSetCount)} of ${formatBandIndexNumber(totalSetCount)} sets archived`
    : "";
  const row = document.createElement("button");
  const isLetterActive = Boolean(activeBandsFilterLetter && letter === activeBandsLetter && !options.skipLetterFilter);
  row.className = `bands-list-row${isLetterActive ? " is-letter-active" : ""}`;
  row.type = "button";
  row.dataset.bandLetter = letter;
  row.dataset.bandId = getBandId(band);
  row.setAttribute("aria-label", `Open ${band.name} band detail, ${band.region}, ${band.status}${archiveSizeLabel}`);

  const thumb = document.createElement("span");
  thumb.className = "bands-row-thumb";
  thumb.setAttribute("aria-hidden", "true");
  const initials = document.createElement("span");
  initials.className = "bands-row-initials";
  initials.textContent = band.thumb || getBandInitials(band.name);
  thumb.append(initials);
  if (band.logoUrl) {
    const logo = document.createElement("img");
    logo.className = "bands-row-logo";
    logo.alt = "";
    logo.loading = "lazy";
    logo.decoding = "async";
    logo.addEventListener("load", () => {
      thumb.classList.add("has-logo");
    }, { once: true });
    logo.addEventListener("error", () => {
      thumb.classList.remove("has-logo");
      logo.remove();
    }, { once: true });
    logo.src = band.logoUrl;
    thumb.append(logo);
  }

  const main = document.createElement("span");
  main.className = "bands-row-main";

  const name = document.createElement("span");
  name.className = "bands-row-name";
  name.textContent = band.name;

  const meta = document.createElement("span");
  meta.className = "bands-row-meta";

  const region = document.createElement("span");
  region.className = "bands-row-meta-item bands-row-region";
  region.textContent = band.region;

  const status = document.createElement("span");
  status.className = `bands-row-meta-item bands-row-status bands-row-status--${band.statusKey}`;
  status.textContent = band.status;

  const stats = document.createElement("span");
  stats.className = "bands-row-meta-item bands-row-stats";

  if (shouldShowArchiveSize) {
    const photos = document.createElement("span");
    photos.className = "bands-row-stat";
    photos.setAttribute("aria-label", `${formatBandIndexNumber(photoCount)} photos`);
    const photoLabel = document.createElement("span");
    photoLabel.className = "bands-row-stat-icon bands-row-stat-icon--photos";
    photoLabel.setAttribute("aria-hidden", "true");
    const photoValue = document.createElement("span");
    photoValue.textContent = formatBandIndexNumber(photoCount);
    photos.append(photoLabel, photoValue);

    const sets = document.createElement("span");
    sets.className = "bands-row-stat";
    sets.setAttribute("aria-label", `${formatBandIndexNumber(archivedSetCount)} of ${formatBandIndexNumber(totalSetCount)} sets archived`);
    const setLabel = document.createElement("span");
    setLabel.className = "bands-row-stat-icon bands-row-stat-icon--sets";
    setLabel.setAttribute("aria-hidden", "true");
    const setValue = document.createElement("span");
    setValue.textContent = `${formatBandIndexNumber(archivedSetCount)}/${formatBandIndexNumber(totalSetCount)}`;
    sets.append(setLabel, setValue);
    stats.append(photos, sets);
  }

  const arrow = document.createElement("span");
  arrow.className = "bands-row-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = ">";
  const action = document.createElement("span");
  action.className = "bands-row-action";

  meta.append(region);
  if (shouldShowArchiveSize) {
    action.append(stats);
  }
  main.append(name, meta);
  action.append(arrow);
  row.append(thumb, main, status, action);
  row.addEventListener("click", () => {
    activeBandsLetter = letter;
    navigateToBandDetail(band);
  });

  return row;
}

function renderBandsList(rows) {
  if (!bandsList) {
    return;
  }

  const forcedState = getForcedMockState("musicBands");
  const listRows = getListBands(rows);
  if (forcedState && forcedState !== "partial") {
    renderMockState(bandsList, forcedState, "musicBands", { clear: true });
  } else {
    const fragment = document.createDocumentFragment();
    listRows.forEach((band) => {
      fragment.append(createBandListRow(band));
    });
    if (forcedState === "partial") {
      fragment.append(createMockStateCard("partial", "musicBands"));
    }
    bandsList.replaceChildren(fragment);
  }

  if (bandsEmpty) {
    bandsEmpty.classList.toggle("is-active", !forcedState && listRows.length === 0);
  }
  if (bandsListFilterBar) {
    bandsListFilterBar.hidden = !activeBandsFilterLetter;
  }
  if (bandsFilterLetter) {
    bandsFilterLetter.textContent = activeBandsFilterLetter || activeBandsLetter;
  }
  if (bandsFilterSummary) {
    const letter = activeBandsFilterLetter || activeBandsLetter;
    bandsFilterSummary.textContent = `${letter} lane / ${listRows.length} signal${listRows.length === 1 ? "" : "s"}`;
  }

  if (activeBandsView === "list" && activeBandsFilterLetter) {
    const activeRow = bandsList.querySelector(`[data-band-letter="${activeBandsLetter}"]`);
    if (activeRow) {
      const listScroller = getBandsListScroller();
      if (!listScroller) {
        return;
      }
      const listRect = listScroller.getBoundingClientRect();
      const rowRect = activeRow.getBoundingClientRect();
      const rowTop = rowRect.top - listRect.top + listScroller.scrollTop;
      const rowBottom = rowRect.bottom - listRect.top + listScroller.scrollTop;
      const listBottom = listScroller.scrollTop + listScroller.clientHeight;
      let targetTop = null;

      if (rowTop < listScroller.scrollTop) {
        targetTop = rowTop;
      } else if (rowBottom > listBottom) {
        targetTop = rowBottom - listScroller.clientHeight;
      }

      if (targetTop !== null) {
        listScroller.scrollTo({
          top: Math.max(0, targetTop),
          behavior: reducedMotion.matches ? "auto" : "smooth",
        });
      }
    }
  }
}

function renderBandsSearch(rows) {
  const forcedState = getForcedMockState("musicBands");
  if (bandsSearchInput && bandsSearchInput.value !== bandsSearchTerm) {
    bandsSearchInput.value = bandsSearchTerm;
  }
  if (bandsSearchSummary) {
    bandsSearchSummary.textContent = forcedState && forcedState !== "partial"
      ? getMockStateCopy(forcedState, "musicBands").title
      : `${rows.length} row${rows.length === 1 ? "" : "s"}`;
  }
  if (bandsSearchResults) {
    const fragment = document.createDocumentFragment();
    if (forcedState && forcedState !== "partial") {
      const item = document.createElement("li");
      item.className = "bands-search-result-row";
      item.append(createMockStateCard(forcedState, "musicBands"));
      fragment.append(item);
    } else {
      rows.forEach((band) => {
        const item = document.createElement("li");
        item.className = "bands-search-result-row";
        item.append(createBandListRow(band, { skipLetterFilter: true }));
        fragment.append(item);
      });
      if (forcedState === "partial") {
        const item = document.createElement("li");
        item.className = "bands-search-result-row";
        item.append(createMockStateCard("partial", "musicBands"));
        fragment.append(item);
      }
    }
    if (!forcedState && rows.length === 0) {
      const item = document.createElement("li");
      item.className = "bands-search-result";
      item.textContent = "No matching signal";
      fragment.append(item);
    }
    bandsSearchResults.replaceChildren(fragment);
  }
  bandsSearchChips.forEach((chip) => {
    chip.setAttribute("aria-pressed", String(chip.dataset.bandsSearchTerm === bandsSearchTerm));
  });
}

function updateBandsStatus(rows) {
  if (!bandsStatus) {
    return;
  }

  const listRows = getListBands(rows);
  const activeCount = activeBandsView === "radar" && !activeBandsLetter
    ? rows.length
    : activeBandsFilterLetter
    ? listRows.length
    : rows.filter((band) => getBandLetter(band) === activeBandsLetter).length;
  bandsStatus.textContent = `${activeBandsLetter || "ALL"} / ${activeCount} / ${activeBandsView.toUpperCase()}`;
}

function scrollBandsIndexIntoView() {
  if (!musicBandsIndex || !musicNexusShell) {
    return;
  }

  window.requestAnimationFrame(() => {
    musicNexusShell.scrollTo({
      top: Math.max(0, musicBandsIndex.offsetTop),
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  });
}

function syncBandsIndex() {
  const allRows = getMusicBandsIndexCollection();
  syncActiveBandsFilterOptions();
  const rows = getVisibleBands();
  syncActiveBandLetter(activeBandsView === "radar" ? allRows : rows);
  if (musicBandsIndex) {
    musicBandsIndex.classList.toggle("is-letter-filtered", shouldUseBandsPanelFilters() && Boolean(activeBandsFilterLetter));
    musicBandsIndex.classList.toggle("is-search-filtered", activeBandsView === "search" && Boolean(bandsSearchTerm));
    musicBandsIndex.classList.toggle("is-select-filtered", shouldUseBandsPanelFilters() && hasActiveBandsPanelFilters());
  }
  renderBandsFilterSelects();
  updateBandsFilterResetButtons();
  renderBandsLetterNavs(allRows);
  renderBandsRadar(allRows);
  renderBandsList(rows);
  renderBandsSearch(rows);
  updateBandsStatus(rows);
}

function setBandsLetter(letter, options = {}) {
  if (!bandsAlphabet.includes(letter)) {
    return;
  }

  activeBandsLetter = letter;
  if (options.shouldFilterList) {
    activeBandsFilterLetter = letter;
  }
  if (options.shouldOpenList) {
    setBandsView("list", false, { preserveFilter: true });
    scrollBandsIndexIntoView();
    return;
  }

  syncBandsIndex();
}

function setBandsView(viewName, shouldFocus = false, options = {}) {
  if (!routedBandsViews.includes(viewName)) {
    return;
  }
  if (options.shouldRoute) {
    navigateToRoute(getBandsRouteUrl(viewName), { shouldFocusBandsView: shouldFocus });
    return;
  }

  activeBandsView = viewName;
  if (viewName === "radar" && !options.preserveFilter) {
    activeBandsLetter = "";
    activeBandsFilterLetter = "";
  }
  bandsViewButtons.forEach((button) => {
    const isActive = button.dataset.bandsViewTarget === viewName;
    button.setAttribute("aria-selected", String(isActive));
  });
  bandsViewPanels.forEach((panel) => {
    const isActive = panel.dataset.bandsView === viewName;
    panel.classList.toggle("is-active", isActive);
    panel.setAttribute("aria-hidden", String(!isActive));
    if (isActive) {
      panel.removeAttribute("inert");
    } else {
      panel.setAttribute("inert", "");
    }
  });
  syncBandsIndex();

  if (shouldFocus && viewName === "search" && bandsSearchInput) {
    bandsSearchInput.focus({ preventScroll: true });
  }
}

function setBandsSearchTerm(value) {
  bandsSearchTerm = value.trim();
  syncBandsIndex();
}

function scrollActiveBandsResultsToTop() {
  const scroller = activeBandsView === "search" ? bandsSearchResults : getBandsListScroller();
  if (!scroller) {
    return;
  }
  scroller.scrollTo({
    top: 0,
    behavior: reducedMotion.matches ? "auto" : "smooth",
  });
}

function setBandsFilterValue(filterType, value) {
  if (filterType === "letter") {
    activeBandsFilterLetter = normalizeBandsLetterFilter(value);
    if (activeBandsFilterLetter) {
      activeBandsLetter = activeBandsFilterLetter;
    }
  } else if (filterType === "region") {
    activeBandsRegionFilter = normalizeBandsRegionFilter(value);
  } else if (filterType === "status") {
    activeBandsStatusFilter = normalizeBandsStatusFilter(value);
  }

  syncBandsIndex();
  scrollActiveBandsResultsToTop();
}

function clearBandsPanelFilters() {
  activeBandsFilterLetter = "";
  activeBandsRegionFilter = "";
  activeBandsStatusFilter = "";
  syncBandsIndex();
  scrollActiveBandsResultsToTop();
}

function returnToBandsRadar() {
  activeBandsLetter = "";
  activeBandsFilterLetter = "";
  activeBandsRegionFilter = "";
  activeBandsStatusFilter = "";
  setBandsView("radar", false, { shouldRoute: true });
  scrollBandsIndexIntoView();
}

function setBandsIndexVisible(isVisible) {
  if (!musicBandsIndex) {
    return;
  }

  if (musicNexusShell) {
    musicNexusShell.classList.toggle("is-bands-index", isVisible);
  }
  musicBandsIndex.classList.toggle("is-active", isVisible);
  musicBandsIndex.setAttribute("aria-hidden", String(!isVisible));
  if (isVisible) {
    musicBandsIndex.removeAttribute("inert");
  } else {
    musicBandsIndex.setAttribute("inert", "");
  }
}

function formatMusicPeopleCount(value, label) {
  const count = Number.parseInt(value, 10) || 0;
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}

function formatMusicPeopleNumber(value) {
  const count = Number.parseInt(value, 10) || 0;
  return count.toLocaleString();
}

function getMusicPeopleText(value) {
  return String(value ?? "").trim();
}

function getMusicPeopleObjectText(value, keys) {
  if (!value || typeof value !== "object") {
    return "";
  }
  const key = keys.find((candidate) => getMusicPeopleText(value[candidate]));
  return key ? getMusicPeopleText(value[key]) : "";
}

function collectMusicPeopleTextValues(value, objectKeys = ["name", "title", "band", "association", "label", "value"]) {
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((item) => {
    if (Array.isArray(item)) {
      return collectMusicPeopleTextValues(item, objectKeys);
    }
    if (item && typeof item === "object") {
      const objectText = getMusicPeopleObjectText(item, objectKeys);
      return objectText ? [objectText] : [];
    }
    const text = getMusicPeopleText(item);
    return text ? [text] : [];
  });
}

function uniqueMusicPeopleValues(values) {
  const seen = new Set();
  return values
    .map(getMusicPeopleText)
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function createMusicPeopleSlug(value) {
  return getMusicPeopleText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getMusicPeopleRouteId(person) {
  return getMusicPeopleText(person?.slug)
    || getMusicPeopleText(person?.personId)
    || getMusicPeopleText(person?.id)
    || createMusicPeopleSlug(person?.name)
    || getMusicPeopleText(person?.person_id)
    || "unknown-person";
}

function getMusicPeopleCategory(person) {
  const sourceCategory = getMusicPeopleText(person?.category ?? person?.backend_record?.category ?? person?.role);
  if (/fallen/i.test(sourceCategory)) {
    return "The Fallen";
  }
  if (/friend/i.test(sourceCategory)) {
    return "Friend";
  }
  if (
    !sourceCategory
    || /perform|vocal|guitar|bass|drum|keys|synth|music|artist|band/i.test(sourceCategory)
  ) {
    return "Performers";
  }
  return sourceCategory;
}

function getMusicPeopleCategoryDisplay(category) {
  const categoryFilterValue = getMusicPeopleCategoryFilterValue(category);
  if (categoryFilterValue === "the fallen") {
    return "⚘ The Fallen";
  }
  if (categoryFilterValue === "friend") {
    return "Friend";
  }
  if (categoryFilterValue === "performers") {
    return "Performer";
  }
  return getMusicPeopleText(category) || "Performer";
}

function getMusicPeopleCategoryFilterValue(category) {
  const normalizedCategory = getMusicPeopleText(category).toLowerCase();
  if (normalizedCategory === "the fallen") {
    return "the fallen";
  }
  if (normalizedCategory === "friend") {
    return "friend";
  }
  if (normalizedCategory === "performer" || normalizedCategory === "performers") {
    return "performers";
  }
  return normalizedCategory;
}

function getMusicPeopleBandNames(person) {
  return uniqueMusicPeopleValues([
    ...collectMusicPeopleTextValues(person?.bands, ["band", "name", "title", "label", "value"]),
    ...collectMusicPeopleTextValues(person?.related_bands, ["band", "name", "title", "label", "value"]),
    ...collectMusicPeopleTextValues(person?.backend_record?.bands, ["band", "name", "title", "label", "value"]),
    ...collectMusicPeopleTextValues(person?.band, ["band", "name", "title", "label", "value"]),
  ]);
}

function splitMusicPeopleInstrumentValues(values) {
  return uniqueMusicPeopleValues(
    values.flatMap((value) => getMusicPeopleText(value)
      .split(/\s*(?:,|\/|;|\|)\s*/)
      .map((part) => part.trim())
      .filter(Boolean))
  );
}

function getMusicPeopleInstrumentNames(person) {
  const directInstruments = splitMusicPeopleInstrumentValues([
    ...collectMusicPeopleTextValues(person?.instrument, ["instrument", "name", "title", "label", "value"]),
    ...collectMusicPeopleTextValues(person?.instruments, ["instrument", "name", "title", "label", "value"]),
    ...collectMusicPeopleTextValues(person?.bands, ["instrument", "role", "position"]),
    ...collectMusicPeopleTextValues(person?.related_bands, ["instrument", "role", "position"]),
    ...collectMusicPeopleTextValues(person?.backend_record?.instrument, ["instrument", "name", "title", "label", "value"]),
    ...collectMusicPeopleTextValues(person?.backend_record?.instruments, ["instrument", "name", "title", "label", "value"]),
    ...collectMusicPeopleTextValues(person?.backend_record?.bands, ["instrument", "role", "position"]),
  ]);
  if (directInstruments.length > 0) {
    return directInstruments;
  }

  const roleText = getMusicPeopleText(person?.role ?? person?.category ?? person?.backend_record?.category);
  return splitMusicPeopleInstrumentValues(
    roleText
      .split(/\s*(?:\/|,|;|\|)\s*/)
      .map((part) => part.trim())
      .filter((part) => part && !/^(performer|performers|friend|the fallen)$/i.test(part))
  );
}

function getMusicPeopleAssociationValues(person) {
  return uniqueMusicPeopleValues([
    ...collectMusicPeopleTextValues(person?.association, ["association", "name", "title", "label", "value"]),
    ...collectMusicPeopleTextValues(person?.associations, ["association", "name", "title", "label", "value"]),
    ...collectMusicPeopleTextValues(person?.backend_record?.association, ["association", "name", "title", "label", "value"]),
    ...collectMusicPeopleTextValues(person?.backend_record?.associations, ["association", "name", "title", "label", "value"]),
  ]);
}

function getMusicPeopleAliases(person) {
  return uniqueMusicPeopleValues([
    ...collectMusicPeopleTextValues(person?.aliases, ["alias", "name", "title", "label", "value"]),
    ...collectMusicPeopleTextValues(person?.backend_record?.aliases, ["alias", "name", "title", "label", "value"]),
  ]);
}

function getMusicPeopleCountValue(...values) {
  const foundValue = values.find((value) => {
    const parsedValue = Number.parseInt(value, 10);
    return Number.isFinite(parsedValue) && parsedValue >= 0;
  });
  return Number.parseInt(foundValue, 10) || 0;
}

function getMusicPeopleLetter(person) {
  const firstLetter = getMusicPeopleText(person?.name).charAt(0).toUpperCase();
  return musicPeopleAlphabet.includes(firstLetter) ? firstLetter : "#";
}

function normalizeMusicPeopleIndexRow(person) {
  const source = person?.backend_record && typeof person.backend_record === "object"
    ? { ...person.backend_record, ...person }
    : { ...person };
  const routeId = getMusicPeopleRouteId(source);
  const name = getMusicPeopleText(source.name ?? source.title) || "Unknown Person";
  const category = getMusicPeopleCategory(source);
  const categoryFilterValue = getMusicPeopleCategoryFilterValue(category);
  const categoryDisplay = getMusicPeopleCategoryDisplay(category);
  const isFriend = categoryFilterValue === "friend";
  const bandNames = getMusicPeopleBandNames(source);
  const instrumentNames = getMusicPeopleInstrumentNames(source);
  const appearances = getMusicPeopleCountValue(
    source.appearances,
    source.appearance_count,
    source.appearances_count,
    source.sets,
    source.set_count,
    source.show_count,
    source.stats?.showCount,
    source.stats?.appearanceCount,
    source.backend_record?.stats?.showCount,
    source.backend_record?.stats?.appearanceCount
  );
  const photos = getMusicPeopleCountValue(
    source.photos,
    source.photoCount,
    source.photo_count,
    source.tagged_photo_count,
    source.taggedPhotoCount,
    source.stats?.taggedPhotoCount,
    source.stats?.photoCount,
    source.backend_record?.photoCount,
    source.backend_record?.stats?.taggedPhotoCount,
    source.backend_record?.stats?.photoCount
  );
  const aliases = getMusicPeopleAliases(source);
  const associations = getMusicPeopleAssociationValues(source);

  return {
    ...source,
    personId: routeId,
    name,
    category,
    categoryDisplay,
    categoryFilterValue,
    bandNames,
    bandText: bandNames.length > 0 ? bandNames.join(", ") : (isFriend ? "" : "Bands pending"),
    instrumentNames,
    instrumentText: instrumentNames.length > 0 ? instrumentNames.join(", ") : (isFriend ? "" : "Instrument pending"),
    appearances,
    photos,
    letter: getMusicPeopleLetter({ name }),
    searchText: [
      name,
      category,
      aliases.join(" "),
      bandNames.join(" "),
      instrumentNames.join(" "),
      associations.join(" "),
    ].join(" ").toLowerCase(),
  };
}

function getMusicPeopleRowsWithCategoryNumbers(rows) {
  const categoryCounts = new Map();
  return rows.map((person) => {
    const categoryKey = person.categoryFilterValue || "people";
    const nextCount = (categoryCounts.get(categoryKey) || 0) + 1;
    categoryCounts.set(categoryKey, nextCount);
    return {
      ...person,
      categoryNumberText: `${person.categoryDisplay} #${nextCount}`,
    };
  });
}

function getMusicPeopleIndexRows() {
  return getMusicPeopleIndexCollection()
    .map(normalizeMusicPeopleIndexRow)
    .filter((person) => person.name)
    .sort((left, right) => left.name.localeCompare(right.name));
}

function getMusicPeopleInstrumentOptions(rows) {
  return uniqueMusicPeopleValues(rows.flatMap((person) => person.instrumentNames))
    .sort((left, right) => left.localeCompare(right));
}

function normalizeActiveMusicPeopleFilters(rows) {
  const letters = new Set(rows.map((person) => person.letter));
  const categoryValues = new Set(musicPeopleCategoryFilters.map((filter) => filter.value));
  const instruments = new Set(getMusicPeopleInstrumentOptions(rows));
  if (activeMusicPeopleLetterFilter && !letters.has(activeMusicPeopleLetterFilter)) {
    activeMusicPeopleLetterFilter = "";
  }
  if (activeMusicPeopleCategoryFilter && !categoryValues.has(activeMusicPeopleCategoryFilter)) {
    activeMusicPeopleCategoryFilter = "";
  }
  if (activeMusicPeopleInstrumentFilter && !instruments.has(activeMusicPeopleInstrumentFilter)) {
    activeMusicPeopleInstrumentFilter = "";
  }
}

function getFilteredMusicPeopleRows() {
  const rows = getMusicPeopleIndexRows();
  normalizeActiveMusicPeopleFilters(rows);
  const searchTerm = activeMusicPeopleSearch.trim().toLowerCase();

  return rows.filter((person) => {
    if (activeMusicPeopleLetterFilter && person.letter !== activeMusicPeopleLetterFilter) {
      return false;
    }
    if (activeMusicPeopleCategoryFilter && person.categoryFilterValue !== activeMusicPeopleCategoryFilter) {
      return false;
    }
    if (activeMusicPeopleInstrumentFilter && !person.instrumentNames.includes(activeMusicPeopleInstrumentFilter)) {
      return false;
    }
    if (!searchTerm) {
      return true;
    }
    return person.searchText.includes(searchTerm);
  });
}

function setActiveMusicPeopleRow(personId) {
  activeMusicPeopleId = normalizeMusicPersonId(personId);
  if (!musicPeopleList) {
    return;
  }

  musicPeopleList.querySelectorAll(".music-people-row").forEach((row) => {
    const isActive = normalizeMusicPersonId(row.dataset.personId) === activeMusicPeopleId;
    row.classList.toggle("is-active", isActive);
    row.setAttribute("aria-pressed", String(isActive));
  });
}

function getMusicPersonDisplayName(value) {
  const name = getMusicPeopleText(value);
  if (!name) {
    return "Person Archive";
  }
  if (/[a-z]/.test(name)) {
    return name;
  }
  return name.toLowerCase().replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

function getMusicPersonSummaryCount(source, matcher) {
  const summaryItems = Array.isArray(source?.summaryItems) ? source.summaryItems : [];
  const summaryItem = summaryItems.find((item) => matcher.test(getMusicPeopleText(item)));
  if (!summaryItem) {
    return null;
  }
  const countMatch = getMusicPeopleText(summaryItem).match(/\d[\d,]*/);
  if (!countMatch) {
    return null;
  }
  const parsedCount = Number.parseInt(countMatch[0].replace(/,/g, ""), 10);
  return Number.isFinite(parsedCount) ? parsedCount : null;
}

function getMusicPersonSeenValue(source, type) {
  const sourceKeys = type === "first"
    ? ["firstSeen", "first_seen", "first_seen_at", "first_show", "firstShow"]
    : ["latestSeen", "latest_seen", "latest_seen_at", "latest_show", "latestShow"];
  const directValue = sourceKeys
    .map((key) => getMusicPeopleText(source?.[key] ?? source?.stats?.[key] ?? source?.backend_record?.[key]))
    .find(Boolean);
  if (directValue) {
    return directValue;
  }

  const label = type === "first" ? "First Seen" : "Latest Seen";
  const seenItems = Array.isArray(source?.seenItems) ? source.seenItems : [];
  const seenItem = seenItems.find((item) => new RegExp(`^${label}\\b`, "i").test(getMusicPeopleText(item)));
  return seenItem ? getMusicPeopleText(seenItem).replace(new RegExp(`^${label}\\s*`, "i"), "") : "Pending";
}

function getMusicPersonInstrumentPills(source, person) {
  const roleItems = collectMusicPeopleTextValues(source?.roleItems, ["name", "title", "label", "value"]);
  return uniqueMusicPeopleValues([
    ...person.instrumentNames,
    ...roleItems,
  ]).filter((item) => {
    return isMusicPersonDisplayInstrument(item);
  });
}

function isMusicPersonDisplayInstrument(value) {
  const normalizedValue = getMusicPeopleText(value).toLowerCase();
  return Boolean(normalizedValue) && !/^(performer|performers|friend|the fallen)$/.test(normalizedValue);
}

function findMusicBandByName(bandName) {
  const normalizedBandName = createBandSlug(bandName);
  if (!normalizedBandName) {
    return null;
  }
  const bandSources = [
    ...getMusicBandsIndexCollection(),
    ...(Array.isArray(musicBandIndexRows) ? musicBandIndexRows : []),
  ];
  return bandSources.find((band) => {
    const general = getBandDetailGeneral(band);
    return [
      getBandId(band),
      band?.band_id,
      band?.id,
      band?.slug,
      general.slug,
      getBandDetailName(band),
    ].some((candidate) => createBandSlug(candidate) === normalizedBandName);
  }) || null;
}

function getMusicPersonBandAssociationName(association) {
  return getMusicPeopleObjectText(association, ["band", "band_name", "bandName", "band_title", "bandTitle", "name", "title", "label", "value"])
    || getMusicPeopleText(association);
}

function getMusicPersonBandAssociationEntries(source) {
  return [
    source?.associatedBands,
    source?.associated_bands,
    source?.bands,
    source?.relatedBands,
    source?.related_bands,
    source?.bandDetails,
    source?.band_details,
    source?.backend_record?.associatedBands,
    source?.backend_record?.associated_bands,
    source?.backend_record?.bands,
    source?.backend_record?.relatedBands,
    source?.backend_record?.related_bands,
    source?.backend_record?.bandDetails,
    source?.backend_record?.band_details,
    source?.band,
    source?.backend_record?.band,
  ].flatMap((value) => Array.isArray(value) ? value : [value])
    .filter(Boolean);
}

function getMusicPersonBandAssociationInstruments(association) {
  if (!association || typeof association !== "object") {
    return [];
  }

  return splitMusicPeopleInstrumentValues([
    ...collectMusicPeopleTextValues(association.instrument, ["instrument", "instrument_name", "instrumentName", "name", "title", "label", "value"]),
    ...collectMusicPeopleTextValues(association.instruments, ["instrument", "instrument_name", "instrumentName", "name", "title", "label", "value"]),
    ...collectMusicPeopleTextValues(association.instrument_name, ["instrument", "instrument_name", "instrumentName", "name", "title", "label", "value"]),
    ...collectMusicPeopleTextValues(association.instrumentName, ["instrument", "instrument_name", "instrumentName", "name", "title", "label", "value"]),
    ...collectMusicPeopleTextValues(association.role, ["role", "instrument", "instrument_name", "instrumentName", "position", "name", "title", "label", "value"]),
    ...collectMusicPeopleTextValues(association.roles, ["role", "instrument", "instrument_name", "instrumentName", "position", "name", "title", "label", "value"]),
    ...collectMusicPeopleTextValues(association.position, ["position", "instrument", "instrument_name", "instrumentName", "role", "name", "title", "label", "value"]),
    ...collectMusicPeopleTextValues(association.positions, ["position", "instrument", "instrument_name", "instrumentName", "role", "name", "title", "label", "value"]),
  ]).filter(isMusicPersonDisplayInstrument);
}

function getMusicPersonBandSpecificInstruments(source, bandName) {
  const normalizedBandName = createBandSlug(bandName);
  if (!normalizedBandName) {
    return [];
  }

  return uniqueMusicPeopleValues(getMusicPersonBandAssociationEntries(source)
    .filter((association) => createBandSlug(getMusicPersonBandAssociationName(association)) === normalizedBandName)
    .flatMap(getMusicPersonBandAssociationInstruments));
}

function getMusicPersonAssociatedBandItems(source, person) {
  const associatedBandNames = uniqueMusicPeopleValues([
    ...collectMusicPeopleTextValues(source?.associatedBands, ["band", "name", "title", "label", "value"]),
    ...getMusicPeopleBandNames(source),
    ...person.bandNames,
  ]);

  return associatedBandNames.map((bandName) => {
    const band = findMusicBandByName(bandName);
    const name = bandName;
    const bandInstruments = getMusicPersonBandSpecificInstruments(source, name);
    const instruments = bandInstruments.length > 0
      ? bandInstruments
      : (associatedBandNames.length === 1 ? getMusicPersonInstrumentPills(source, person) : []);
    return {
      name,
      bandId: band ? getBandId(band) : "",
      band_id: band?.band_id || "",
      id: band?.id || "",
      slug: band?.slug || "",
      logoUrl: band ? getBandDetailLogoUrl(band) : "",
      initials: getBandInitials(name),
      instruments,
    };
  });
}

function getMusicPersonBandMatchSets(associatedBands) {
  const names = associatedBands
    .map((band) => getMusicPeopleText(band.name).toLowerCase())
    .filter(Boolean);
  const slugs = associatedBands
    .flatMap((band) => [band.name, band.bandId, band.band_id, band.id, band.slug])
    .map(createBandSlug)
    .filter(Boolean);

  return {
    names: new Set(names),
    slugs: new Set(slugs),
  };
}

function doesMusicPersonShowMatchBands(show, bandMatches) {
  if (!show || bandMatches.names.size === 0 && bandMatches.slugs.size === 0) {
    return false;
  }

  const showBandNameMatch = (show.bandNames || []).some((bandName) => {
    const normalizedName = getMusicPeopleText(bandName).toLowerCase();
    return bandMatches.names.has(normalizedName) || bandMatches.slugs.has(createBandSlug(normalizedName));
  });
  if (showBandNameMatch) {
    return true;
  }

  return (show.bandSlugs || []).some((bandSlug) => bandMatches.slugs.has(createBandSlug(bandSlug)));
}

function getMusicPersonTaggedShowBandContext(show, associatedBands) {
  if (!show || !Array.isArray(associatedBands) || associatedBands.length === 0) {
    return "";
  }

  const showBandNames = new Set((show.bandNames || [])
    .map((bandName) => getMusicPeopleText(bandName).toLowerCase())
    .filter(Boolean));
  const showBandSlugs = new Set([
    ...(show.bandSlugs || []),
    ...(show.bandNames || []),
  ].map(createBandSlug).filter(Boolean));

  const matchedBand = associatedBands.find((band) => {
    const bandName = getMusicPeopleText(band.name);
    const bandKeys = [band.name, band.bandId, band.band_id, band.id, band.slug].map(createBandSlug);
    return showBandNames.has(bandName.toLowerCase()) || bandKeys.some((bandKey) => showBandSlugs.has(bandKey));
  });

  return getMusicPeopleText(matchedBand?.name || (associatedBands.length === 1 ? associatedBands[0]?.name : ""));
}

function getMusicPersonShowDateParts(show) {
  const parsedDate = parseMusicShowDate(show?.rawDate || show?.date || show?.show_date || show?.eventDate || show?.formattedDate);
  if (!parsedDate) {
    return { month: "Date", day: "--", year: "Pending" };
  }

  return {
    month: parsedDate.toLocaleString("en-US", { month: "short" }),
    day: String(parsedDate.getDate()).padStart(2, "0"),
    year: String(parsedDate.getFullYear()),
  };
}

function getMusicPersonTaggedPhotosLabel(show) {
  const taggedPhotoCount = getMusicPeopleCountValue(
    show?.taggedPhotos,
    show?.tagged_photos,
    show?.tagged_photo_count,
    show?.person_tagged_photos,
    show?.person_tagged_photo_count
  );

  return taggedPhotoCount > 0 ? formatMusicPeopleCount(taggedPhotoCount, "Tagged Photo") : "Tagged Photos Coming Soon";
}

function getMusicPersonTaggedShowsForBands(associatedBands) {
  if (musicShowsSetsDataState !== "live" || musicShowsSetsCollection.length === 0 || associatedBands.length === 0) {
    return [];
  }

  const bandMatches = getMusicPersonBandMatchSets(associatedBands);
  return musicShowsSetsCollection
    .filter((show) => doesMusicPersonShowMatchBands(show, bandMatches))
    .map((show, index) => {
      const title = getMusicPeopleText(show.name || show.title) || `Tagged Show ${index + 1}`;
      return {
        showId: getMusicPeopleText(show.showId || show.show_id || show.setCode) || createMusicPeopleSlug(`${title}-${index + 1}`),
        date: getMusicPersonShowDateParts(show),
        title,
        venue: getMusicPeopleText(show.venue) || "Venue Pending",
        location: getMusicPeopleText(show.location) || getMusicShowLocation(show),
        bandContext: getMusicPersonTaggedShowBandContext(show, associatedBands),
        taggedPhotosLabel: getMusicPersonTaggedPhotosLabel(show),
        expanded: false,
        contributors: getMusicPeopleText(show.contributors) ? `Contributors: ${show.contributors}` : "Contributors: Coming Soon",
        notes: "Person-tagged thumbnails are staged for future SmugMug captions.",
        thumbnails: ["Photo 01", "Photo 02", "Photo 03", "Photo 04"],
      };
    });
}

function getMusicPersonDetailViewData(source, requestedPersonId) {
  const person = normalizeMusicPeopleIndexRow(source);
  const name = getMusicPersonDisplayName(source?.name ?? person.name);
  const summaryAppearances = getMusicPersonSummaryCount(source, /appearance/i);
  const summaryPhotos = getMusicPersonSummaryCount(source, /photo/i);
  const appearances = summaryAppearances ?? person.appearances;
  const photos = summaryPhotos ?? person.photos;
  const instrumentPills = getMusicPersonInstrumentPills(source, person);
  const associatedBands = getMusicPersonAssociatedBandItems(source, person);

  return {
    ...source,
    state: "ready",
    personId: normalizeMusicPersonId(person.personId || requestedPersonId),
    imageLabel: getMusicPeopleText(source?.imageLabel ?? source?.thumb) || getBandInitials(name),
    name,
    categoryPill: person.categoryDisplay,
    instrumentPills,
    archiveRows: [
      { label: "Appearances", value: Number.isFinite(appearances) ? formatMusicPeopleNumber(appearances) : "Pending" },
      { label: "Photos", value: Number.isFinite(photos) ? formatMusicPeopleNumber(photos) : "Pending" },
      { label: "First Seen", value: getMusicPersonSeenValue(source, "first") },
      { label: "Latest Seen", value: getMusicPersonSeenValue(source, "latest") },
    ],
    associatedBands,
    taggedShows: getMusicPersonTaggedShowsForBands(associatedBands),
  };
}

function createMusicPersonPill(text) {
  const pill = document.createElement("span");
  pill.className = "person-detail-pill band-detail-tag band-detail-tag--neutral";
  pill.textContent = text;
  return pill;
}

function createMusicPersonPillList(data) {
  const pillList = document.createElement("div");
  pillList.className = "person-detail-pill-list";
  const pillValues = uniqueMusicPeopleValues([
    data.categoryPill,
    ...(Array.isArray(data.instrumentPills) ? data.instrumentPills : []),
  ]);
  pillValues.forEach((pillText) => {
    pillList.append(createMusicPersonPill(pillText));
  });
  return pillList;
}

function createMusicPersonArchiveBlock(rows) {
  const archiveBlock = document.createElement("dl");
  archiveBlock.className = "person-detail-archive-data";
  rows.forEach((row) => {
    const item = document.createElement("div");
    item.className = "person-detail-archive-row";
    const label = document.createElement("dt");
    label.className = "person-detail-archive-label";
    label.textContent = row.label;
    const value = document.createElement("dd");
    value.className = "person-detail-archive-value";
    value.textContent = getMusicPeopleText(row.value) || "Pending";
    item.append(label, value);
    archiveBlock.append(item);
  });
  return archiveBlock;
}

function createMusicPersonAssociatedBand(band) {
  const item = document.createElement("div");
  item.className = "person-detail-band-card";

  const logo = document.createElement("span");
  logo.className = "person-detail-band-thumb";
  logo.setAttribute("aria-hidden", "true");

  const mark = document.createElement("span");
  mark.className = "person-detail-band-mark";
  mark.textContent = band.initials;
  mark.hidden = Boolean(band.logoUrl);
  logo.append(mark);

  if (band.logoUrl) {
    const image = document.createElement("img");
    image.className = "person-detail-band-logo";
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.hidden = true;
    image.onload = () => {
      image.hidden = false;
      mark.hidden = true;
      logo.classList.add("has-logo");
    };
    image.onerror = () => {
      image.hidden = true;
      logo.classList.remove("has-logo");
    };
    image.src = band.logoUrl;
    logo.prepend(image);
  }

  const name = document.createElement("span");
  name.className = "person-detail-band-name-pill person-detail-pill band-detail-tag band-detail-tag--neutral";
  name.textContent = band.name;
  item.append(logo, name);

  const instruments = uniqueMusicPeopleValues(Array.isArray(band.instruments) ? band.instruments : []);
  if (instruments.length > 0) {
    const instrumentList = document.createElement("div");
    instrumentList.className = "person-detail-band-instruments";
    instruments.forEach((instrument) => {
      const pill = document.createElement("span");
      pill.className = "person-detail-band-instrument-pill person-detail-pill band-detail-tag band-detail-tag--neutral";
      pill.textContent = instrument;
      instrumentList.append(pill);
    });
    item.append(instrumentList);
  }
  return item;
}

function createMusicPersonEmptyState(text) {
  const emptyState = document.createElement("div");
  emptyState.className = "person-detail-empty-state";
  emptyState.textContent = text;
  return emptyState;
}

function toggleMusicPersonShowCard(card) {
  const isExpanded = !card.classList.contains("is-expanded");
  const summary = card.querySelector(".person-show-summary");
  const panel = card.querySelector(".person-show-expanded");
  const toggle = card.querySelector(".person-show-toggle");

  card.classList.toggle("is-expanded", isExpanded);
  if (summary) {
    summary.setAttribute("aria-expanded", String(isExpanded));
  }
  if (panel) {
    panel.hidden = !isExpanded;
  }
  if (toggle) {
    toggle.textContent = isExpanded ? "-" : "+";
  }
}

function createMusicPersonTaggedThumb(label) {
  const thumb = document.createElement("span");
  thumb.className = "person-show-tagged-thumb";
  thumb.textContent = label;
  return thumb;
}

function createMusicPersonShowCard(show, personName) {
  const card = document.createElement("article");
  const isExpanded = Boolean(show.expanded);
  card.className = "person-show-card";
  card.classList.toggle("is-expanded", isExpanded);
  card.dataset.personShowId = show.showId;

  const summary = document.createElement("button");
  summary.className = "person-show-summary";
  summary.type = "button";
  summary.setAttribute("aria-expanded", String(isExpanded));
  const taggedPhotosLabel = getMusicPeopleText(show.taggedPhotosLabel) || formatMusicPeopleCount(show.taggedPhotos, "Tagged Photo");
  const bandContextLabel = getMusicPeopleText(show.bandContext) ? `with ${show.bandContext}` : "";
  summary.setAttribute("aria-label", `${show.title}, ${show.venue}, ${show.location}${bandContextLabel ? `, ${bandContextLabel}` : ""}, ${taggedPhotosLabel}`);

  const date = document.createElement("span");
  date.className = "person-show-date";

  const month = document.createElement("span");
  month.className = "person-show-date-month";
  month.textContent = show.date.month;

  const day = document.createElement("span");
  day.className = "person-show-date-day";
  day.textContent = show.date.day;

  const year = document.createElement("span");
  year.className = "person-show-date-year";
  year.textContent = show.date.year;
  date.append(month, day, year);

  const copy = document.createElement("span");
  copy.className = "person-show-copy";

  const title = document.createElement("span");
  title.className = "person-show-title";
  title.textContent = show.title;

  const venue = document.createElement("span");
  venue.className = "person-show-venue";
  venue.textContent = show.venue;

  const location = document.createElement("span");
  location.className = "person-show-location";
  location.textContent = show.location;
  copy.append(title, venue, location);

  const bandContext = document.createElement("span");
  bandContext.className = "person-show-band-context";
  bandContext.textContent = bandContextLabel;

  const count = document.createElement("span");
  count.className = "person-show-count";
  count.textContent = taggedPhotosLabel;

  const toggle = document.createElement("span");
  toggle.className = "person-show-toggle";
  toggle.setAttribute("aria-hidden", "true");
  toggle.textContent = isExpanded ? "-" : "+";

  const actionGroup = document.createElement("span");
  actionGroup.className = "person-show-action";
  actionGroup.append(count, toggle);

  summary.append(date, copy, bandContext, actionGroup);
  summary.addEventListener("click", () => {
    toggleMusicPersonShowCard(card);
  });

  const expanded = document.createElement("div");
  expanded.className = "person-show-expanded";
  expanded.hidden = !isExpanded;

  const thumbs = document.createElement("div");
  thumbs.className = "person-show-tagged-thumbs";
  thumbs.setAttribute("aria-label", `${show.title} ${personName} tagged photo placeholders`);
  const taggedThumbnails = Array.isArray(show.thumbnails) ? show.thumbnails : [];
  if (taggedThumbnails.length > 0) {
    taggedThumbnails.forEach((label) => {
      thumbs.append(createMusicPersonTaggedThumb(label));
    });
  } else {
    thumbs.append(createMusicPersonEmptyState("No person-tagged photos in this show yet."));
  }

  const meta = document.createElement("p");
  meta.className = "person-show-expanded-meta";
  meta.textContent = show.contributors;

  const notes = document.createElement("p");
  notes.className = "person-show-expanded-notes";
  notes.textContent = show.notes;

  const action = document.createElement("button");
  action.className = "person-show-view";
  action.type = "button";
  action.textContent = "View Show";

  expanded.append(thumbs, meta, notes, action);
  card.append(summary, expanded);
  return card;
}

function renderMusicPersonDetailState(data) {
  if (!personDetail) {
    return;
  }

  const backButton = document.createElement("button");
  backButton.className = "person-detail-back";
  backButton.type = "button";
  backButton.textContent = "Back To People";
  backButton.addEventListener("click", returnToMusicPeopleRoute);

  const statePanel = document.createElement("section");
  statePanel.className = "person-detail-state";
  statePanel.setAttribute("aria-live", data.state === "loading" ? "polite" : "assertive");
  statePanel.setAttribute("aria-busy", String(data.state === "loading"));

  const title = document.createElement("h3");
  title.className = "person-detail-state-title";
  title.id = "person-detail-title";
  title.textContent = data.title;

  const copy = document.createElement("p");
  copy.className = "person-detail-state-copy";
  copy.textContent = data.copy;

  statePanel.append(title, copy);
  personDetail.replaceChildren(backButton, statePanel);
}

function renderMusicPersonDetail(data) {
  if (!personDetail) {
    return;
  }
  if (data.state && data.state !== "ready") {
    renderMusicPersonDetailState(data);
    return;
  }

  const backButton = document.createElement("button");
  backButton.className = "person-detail-back";
  backButton.type = "button";
  backButton.textContent = "Back To People";
  backButton.addEventListener("click", returnToMusicPeopleRoute);

  const hero = document.createElement("section");
  hero.className = "person-detail-hero";
  hero.setAttribute("aria-labelledby", "person-detail-title");

  const image = document.createElement("div");
  image.className = "person-detail-image";
  image.setAttribute("role", "img");
  image.setAttribute("aria-label", `${data.name} placeholder archive portrait`);

  const imageMark = document.createElement("span");
  imageMark.className = "person-detail-image-mark";
  imageMark.setAttribute("aria-hidden", "true");
  imageMark.textContent = data.imageLabel;
  image.append(imageMark);

  const copy = document.createElement("div");
  copy.className = "person-detail-copy";

  const name = document.createElement("h3");
  name.className = "person-detail-name";
  name.id = "person-detail-title";
  name.textContent = data.name;

  copy.append(
    name,
    createMusicPersonPillList(data),
    createMusicPersonArchiveBlock(data.archiveRows)
  );
  hero.append(image, copy);

  const associated = document.createElement("section");
  associated.className = "person-detail-associated";
  associated.setAttribute("aria-labelledby", "person-associated-title");

  const associatedTitle = document.createElement("h4");
  associatedTitle.className = "person-detail-section-title";
  associatedTitle.id = "person-associated-title";
  associatedTitle.textContent = "Associated Bands";

  const associatedList = document.createElement("div");
  associatedList.className = "person-detail-band-list";
  const associatedBands = Array.isArray(data.associatedBands) ? data.associatedBands : [];
  if (associatedBands.length > 0) {
    associatedBands.forEach((band) => {
      associatedList.append(createMusicPersonAssociatedBand(band));
    });
  } else {
    associatedList.append(createMusicPersonEmptyState("No associated bands indexed yet."));
  }
  associated.append(associatedTitle, associatedList);

  const taggedShows = document.createElement("section");
  taggedShows.className = "person-tagged-shows";
  taggedShows.setAttribute("aria-labelledby", "person-tagged-shows-title");

  const taggedHeader = document.createElement("header");
  taggedHeader.className = "person-tagged-shows-header";

  const taggedTitle = document.createElement("h4");
  taggedTitle.className = "person-detail-section-title";
  taggedTitle.id = "person-tagged-shows-title";
  taggedTitle.textContent = "Tagged Shows";

  const taggedNote = document.createElement("p");
  taggedNote.className = "person-tagged-shows-note";
  taggedNote.textContent = "Inline thumbnails show person-tagged archive photos only.";
  taggedHeader.append(taggedTitle, taggedNote);

  const showList = document.createElement("div");
  showList.className = "person-show-list";
  const taggedShowRows = Array.isArray(data.taggedShows) ? data.taggedShows : [];
  if (taggedShowRows.length > 0) {
    taggedShowRows.forEach((show) => {
      showList.append(createMusicPersonShowCard(show, data.name));
    });
  } else {
    showList.append(createMusicPersonEmptyState("No tagged shows indexed for this person yet."));
  }

  taggedShows.append(taggedHeader, showList);
  personDetail.replaceChildren(backButton, hero, associated, taggedShows);
}

function showMusicPersonDetail(personId) {
  const data = getMusicPersonDetailData(personId);
  activeMusicPersonDetailId = data.personId;
  setActiveMusicPeopleRow(data.personId);
  renderMusicPersonDetail(data);
  setBandsIndexVisible(false);
  setPeopleIndexVisible(false);
  setMusicVenueIndexVisible(false);
  setMusicActivityPanelVisible(false);
  setMusicPersonDetailVisible(true);
  setCurrentView("Person Detail");
  if (musicNexusShell) {
    musicNexusShell.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }
  Promise.allSettled([
    requestMusicPeopleIndexData(),
    requestMusicBandsIndexData(),
    requestMusicShowsSetsData(),
  ]).then(() => {
    const route = getRouteFromUrl();
    if (route.name !== "person-detail" || normalizeMusicPersonId(route.personId) !== normalizeMusicPersonId(personId)) {
      return;
    }
    const refreshedData = getMusicPersonDetailData(personId);
    activeMusicPersonDetailId = refreshedData.personId;
    setActiveMusicPeopleRow(refreshedData.personId);
    renderMusicPersonDetail(refreshedData);
  });
}

function returnToMusicPeopleRoute() {
  navigateToRoute(routePaths.musicPeople);
}

function createMusicPeopleRow(person) {
  const isFriend = person.categoryFilterValue === "friend";
  const row = document.createElement("button");
  row.className = "music-people-row";
  row.type = "button";
  row.dataset.personId = person.personId;
  row.dataset.peopleCategory = person.categoryFilterValue;
  row.classList.toggle("is-friend", isFriend);
  row.classList.toggle("is-fallen", person.categoryFilterValue === "the fallen");
  row.classList.toggle("is-active", person.personId === activeMusicPeopleId);
  row.setAttribute("aria-pressed", String(person.personId === activeMusicPeopleId));
  row.setAttribute(
    "aria-label",
    [
      person.name,
      person.categoryDisplay,
      isFriend ? "" : person.categoryNumberText,
      isFriend ? "" : person.bandText,
      isFriend ? "" : person.instrumentText,
      !isFriend || person.appearances > 0 ? formatMusicPeopleCount(person.appearances, "Appearance") : "",
      !isFriend || person.photos > 0 ? formatMusicPeopleCount(person.photos, "Photo") : "",
    ].filter(Boolean).join(", ")
  );

  const name = document.createElement("span");
  name.className = "music-people-name";
  name.textContent = person.name;

  const category = document.createElement("span");
  category.className = "music-people-category";
  category.textContent = person.categoryDisplay;

  const personId = document.createElement("span");
  personId.className = "music-people-id";
  personId.textContent = person.categoryNumberText;

  const stats = document.createElement("span");
  stats.className = "music-people-stats";
  const renderedStats = [];

  if (!isFriend || person.appearances > 0) {
    const appearances = document.createElement("span");
    appearances.className = "music-people-stat";
    appearances.setAttribute("aria-label", `${formatMusicPeopleNumber(person.appearances)} appearances`);
    const appearancesIcon = document.createElement("span");
    appearancesIcon.className = "bands-row-stat-icon music-people-stat-icon music-people-stat-icon--appearances";
    appearancesIcon.setAttribute("aria-hidden", "true");
    const appearancesValue = document.createElement("span");
    appearancesValue.textContent = formatMusicPeopleNumber(person.appearances);
    appearances.append(appearancesIcon, appearancesValue);
    renderedStats.push(appearances);
  }

  if (!isFriend || person.photos > 0) {
    const photos = document.createElement("span");
    photos.className = "music-people-stat";
    photos.setAttribute("aria-label", `${formatMusicPeopleNumber(person.photos)} photos`);
    const photosIcon = document.createElement("span");
    photosIcon.className = "bands-row-stat-icon bands-row-stat-icon--photos music-people-stat-icon";
    photosIcon.setAttribute("aria-hidden", "true");
    const photosValue = document.createElement("span");
    photosValue.textContent = formatMusicPeopleNumber(person.photos);
    photos.append(photosIcon, photosValue);
    renderedStats.push(photos);
  }

  const arrow = document.createElement("span");
  arrow.className = "music-people-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = ">";

  renderedStats.forEach((stat, index) => {
    if (index > 0) {
      const statDivider = document.createElement("span");
      statDivider.className = "music-people-stat-divider";
      statDivider.setAttribute("aria-hidden", "true");
      statDivider.textContent = "/";
      stats.append(statDivider);
    }
    stats.append(stat);
  });

  row.append(name, category);
  if (!isFriend) {
    const band = document.createElement("span");
    band.className = "music-people-band";
    band.textContent = person.bandText;

    const instrument = document.createElement("span");
    instrument.className = "music-people-instrument";
    instrument.textContent = person.instrumentText;

    row.append(personId, band, instrument);
  }
  if (renderedStats.length > 0) {
    row.append(stats);
  }
  row.append(arrow);
  row.addEventListener("click", () => {
    setActiveMusicPeopleRow(person.personId);
    navigateToRoute(getMusicPersonRouteUrl(person.personId), { historyState: { fromPeopleIndex: true } });
  });

  return row;
}

function createMusicPeopleFilterField(labelText, fieldName, options, activeValue, allLabel = "All") {
  const label = document.createElement("label");
  label.className = "music-people-filter-field";

  const labelSpan = document.createElement("span");
  labelSpan.className = "music-people-filter-label";
  labelSpan.textContent = labelText;

  const select = document.createElement("select");
  select.className = "music-people-filter-select";
  select.dataset.musicPeopleFilter = fieldName;
  select.setAttribute("aria-label", `Filter people by ${labelText.toLowerCase()}`);

  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = allLabel;
  select.append(allOption);
  options.forEach((optionValue) => {
    const option = document.createElement("option");
    if (optionValue && typeof optionValue === "object") {
      option.value = optionValue.value;
      option.textContent = optionValue.label;
    } else {
      option.value = optionValue;
      option.textContent = optionValue;
    }
    select.append(option);
  });
  select.value = activeValue;
  select.addEventListener("change", () => {
    updateMusicPeopleFilter(fieldName, select.value);
  });

  label.append(labelSpan, select);
  return label;
}

function createMusicPeopleFilters(rows) {
  const filters = document.createElement("section");
  filters.className = "music-people-filters";
  filters.dataset.musicPeopleFilters = "";
  filters.setAttribute("aria-label", "People archive filters");

  const searchRow = document.createElement("div");
  searchRow.className = "music-people-filter-row music-people-filter-row--search";
  const selectRow = document.createElement("div");
  selectRow.className = "music-people-filter-row music-people-filter-row--selects";
  const actionRow = document.createElement("div");
  actionRow.className = "music-people-filter-row music-people-filter-row--actions";

  const searchLabel = document.createElement("label");
  searchLabel.className = "music-people-filter-field music-people-filter-field--search";
  const searchText = document.createElement("span");
  searchText.className = "music-people-filter-label";
  searchText.textContent = "Search People";
  const searchInput = document.createElement("input");
  searchInput.className = "music-people-search-input";
  searchInput.type = "search";
  searchInput.autocomplete = "off";
  searchInput.placeholder = "Search name, category, alias, band, instrument";
  searchInput.value = activeMusicPeopleSearch;
  searchInput.dataset.musicPeopleFilter = "search";
  searchInput.addEventListener("input", () => {
    updateMusicPeopleFilter("search", searchInput.value);
  });
  searchLabel.append(searchText, searchInput);

  const letterOptions = musicPeopleAlphabet;
  const categoryOptions = musicPeopleCategoryFilters.filter((filter) => filter.value);
  const instrumentOptions = getMusicPeopleInstrumentOptions(rows);

  const resetButton = document.createElement("button");
  resetButton.className = "music-people-filter-reset";
  resetButton.type = "button";
  resetButton.textContent = "Reset Filters";
  resetButton.addEventListener("click", resetMusicPeopleFilters);

  searchRow.append(searchLabel);
  selectRow.append(
    createMusicPeopleFilterField("Letter", "letter", letterOptions, activeMusicPeopleLetterFilter),
    createMusicPeopleFilterField("Category", "category", categoryOptions, activeMusicPeopleCategoryFilter),
    createMusicPeopleFilterField("Instrument", "instrument", instrumentOptions, activeMusicPeopleInstrumentFilter)
  );
  actionRow.append(resetButton);
  filters.append(searchRow, selectRow, actionRow);

  return filters;
}

function getMusicPeopleFilterFocusMeta() {
  const activeElement = document.activeElement;
  if (!musicPeopleIndex) {
    return null;
  }
  if (!activeElement || !musicPeopleIndex.contains(activeElement)) {
    return null;
  }
  const filterName = activeElement.dataset?.musicPeopleFilter;
  if (!filterName) {
    return null;
  }
  return {
    filterName,
    selectionStart: typeof activeElement.selectionStart === "number" ? activeElement.selectionStart : null,
    selectionEnd: typeof activeElement.selectionEnd === "number" ? activeElement.selectionEnd : null,
  };
}

function restoreMusicPeopleFilterFocus(focusMeta) {
  if (!focusMeta || !musicPeopleIndex) {
    return;
  }
  window.requestAnimationFrame(() => {
    const target = musicPeopleIndex.querySelector(`[data-music-people-filter="${focusMeta.filterName}"]`);
    if (!target) {
      return;
    }
    target.focus({ preventScroll: true });
    if (focusMeta.filterName === "search" && focusMeta.selectionStart !== null && typeof target.setSelectionRange === "function") {
      target.setSelectionRange(focusMeta.selectionStart, focusMeta.selectionEnd ?? focusMeta.selectionStart);
    }
  });
}

function updateMusicPeopleFilter(filterName, value) {
  const nextValue = getMusicPeopleText(value);
  if (filterName === "search") {
    activeMusicPeopleSearch = nextValue;
  } else if (filterName === "letter") {
    activeMusicPeopleLetterFilter = musicPeopleAlphabet.includes(nextValue) ? nextValue : "";
  } else if (filterName === "category") {
    activeMusicPeopleCategoryFilter = nextValue.toLowerCase();
  } else if (filterName === "instrument") {
    activeMusicPeopleInstrumentFilter = nextValue;
  }
  renderMusicPeopleIndex();
}

function resetMusicPeopleFilters() {
  activeMusicPeopleSearch = "";
  activeMusicPeopleLetterFilter = "";
  activeMusicPeopleCategoryFilter = "";
  activeMusicPeopleInstrumentFilter = "";
  renderMusicPeopleIndex();
}

function createMusicPeopleEmptyState() {
  const empty = document.createElement("div");
  empty.className = "music-people-empty";
  empty.textContent = "No people found. Try clearing filters.";
  return empty;
}

function renderMusicPeopleIndex(options = {}) {
  if (!musicPeopleList) {
    return;
  }

  const focusMeta = getMusicPeopleFilterFocusMeta();
  const allRows = getMusicPeopleIndexRows();
  normalizeActiveMusicPeopleFilters(allRows);
  if (musicPeopleIndex) {
    const existingFilters = musicPeopleIndex.querySelector("[data-music-people-filters]");
    if (existingFilters) {
      existingFilters.remove();
    }
    musicPeopleIndex.insertBefore(createMusicPeopleFilters(allRows), musicPeopleList);
    const existingPagination = musicPeopleIndex.querySelector("[data-music-people-pagination]");
    if (existingPagination) {
      existingPagination.remove();
    }
  }

  const forcedState = getForcedMockState("musicPeople");
  const dataState = musicPeopleIndexDataState || musicPeopleIndex?.dataset.peopleDataState || "idle";
  const filteredRows = getFilteredMusicPeopleRows();
  const numberedRows = getMusicPeopleRowsWithCategoryNumbers(filteredRows);
  const fragment = document.createDocumentFragment();
  if (forcedState && forcedState !== "partial") {
    renderMockState(fragment, forcedState, "musicPeople");
  } else if (dataState === "loading" && !musicPeopleIndexLoaded) {
    renderMockState(fragment, "loading", "musicPeople");
  } else if (dataState === "error" && numberedRows.length === 0) {
    renderMockState(fragment, "error", "musicPeople");
  } else {
    numberedRows.forEach((person) => {
      fragment.append(createMusicPeopleRow(person));
    });
    if (forcedState === "partial") {
      fragment.append(createMockStateCard("partial", "musicPeople"));
    }
  }
  if (!forcedState && !["loading", "error"].includes(dataState) && filteredRows.length === 0) {
    fragment.append(createMusicPeopleEmptyState());
  }
  musicPeopleList.replaceChildren(fragment);
  restoreMusicPeopleFilterFocus(focusMeta);

  if (options.shouldResetScroll && typeof musicPeopleList.scrollTo === "function") {
    musicPeopleList.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }
}

const musicShowsStateCopy = {
  empty: {
    title: "No shows found.",
    copy: "Try clearing filters.",
  },
  loading: {
    title: "Loading shows archive",
    copy: "Archive rows are being prepared.",
  },
  error: {
    title: "Unable to load archive",
    copy: "Shows archive data can be retried when the API is connected.",
  },
};
const musicShowsMonthOrder = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

function getMusicShowRouteCode(show) {
  return normalizeSetCode(
    show?.setCode ||
    getSetCodeFromDateValue(show?.rawDate || show?.date || show?.show_date || show?.eventDate) ||
    show?.showId ||
    show?.show_id ||
    ""
  );
}

function getMusicShowRouteUrl(show) {
  return `/music/shows/${encodeURIComponent(getMusicShowRouteCode(show))}`;
}

function findMusicShowById(showId) {
  const targetCode = normalizeSetCode(showId);
  if (!targetCode) {
    return null;
  }

  const indexedShow = getMusicShowsIndexRows().find((show) => {
    const showKeys = [
      getMusicShowRouteCode(show),
      show?.showId,
      show?.show_id,
      show?.id,
      show?.slug,
    ];
    return showKeys
      .map((key) => normalizeSetCode(key))
      .some((key) => key === targetCode);
  });
  if (indexedShow) {
    return indexedShow;
  }

  const mockShow = getMockRecordById("musicShows", showId, ["showId", "id", "slug", "show_id"]);
  return mockShow ? normalizeMusicShowsIndexRow(mockShow) : null;
}

function createUnknownMusicShow(showId) {
  const safeShowId = String(showId || "unknown-show").trim() || "unknown-show";
  return {
    showId: safeShowId,
    name: "Show Detail",
    month: "TBD",
    day: "00",
    year: "Pending",
    title: "Show Detail",
    venue: "Pending Venue",
    location: "Pending City",
    bandCount: "0 bands",
    poster: "",
  };
}

function getMusicShowBandCount(show) {
  const directCount = Number.parseInt(show?.stats?.bandCount ?? show?.bandCount ?? "", 10);
  if (Number.isFinite(directCount) && directCount > 0) {
    return String(directCount);
  }
  if (Array.isArray(show?.bands)) {
    return String(show.bands.length);
  }
  const match = String(show?.bandCount || "").match(/\d+/);
  return match ? match[0] : "0";
}

function getMusicShowPhotoCount(show) {
  const photos = Number.parseInt(show?.photo_count ?? show?.photoCount ?? show?.stats?.photos ?? "", 10);
  if (Number.isFinite(photos) && photos > 0) {
    return String(photos);
  }
  const bands = Number.parseInt(getMusicShowBandCount(show), 10) || 0;
  return String(Math.max(48, bands * 54));
}

function getMusicShowDetailCountCandidate(...candidates) {
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null || candidate === "") {
      continue;
    }

    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return Math.max(0, Math.trunc(candidate));
    }

    const numericMatch = String(candidate).replace(/,/g, "").match(/\d+/);
    if (numericMatch) {
      const parsed = Number.parseInt(numericMatch[0], 10);
      if (Number.isFinite(parsed)) {
        return Math.max(0, parsed);
      }
    }
  }

  return null;
}

function getMusicShowSmugAlbums(show) {
  const candidates = [
    show?.smug_albums,
    show?.smugAlbums,
    show?.smugmug_albums,
    show?.smugmugAlbums,
    show?.stats?.smug_albums,
    show?.stats?.smugAlbums,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (typeof candidate === "string" && candidate.trim().startsWith("[")) {
      try {
        const parsed = JSON.parse(candidate);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (error) {
        return [];
      }
    }
  }

  return [];
}

function getMusicShowDetailBandCount(show) {
  const statsCount = getMusicShowDetailCountCandidate(show?.stats?.bandCount, show?.stats?.band_count);
  if (statsCount !== null) {
    return statsCount;
  }

  if (Array.isArray(show?.bands)) {
    return show.bands.length;
  }

  return getMusicShowDetailCountCandidate(show?.bandCount, show?.band_count) ?? 0;
}

function getMusicShowDetailPhotoCount(show) {
  const statsCount = getMusicShowDetailCountCandidate(show?.stats?.photoCount, show?.stats?.photo_count);
  if (statsCount !== null && statsCount > 0) {
    return statsCount;
  }

  const directCount = getMusicShowDetailCountCandidate(show?.photoCount, show?.photo_count);
  if (directCount !== null && directCount > 0) {
    return directCount;
  }

  return getMusicShowSmugAlbums(show).reduce((total, album) => {
    const albumPhotoCount = getMusicShowDetailCountCandidate(
      album?.photo_count,
      album?.photoCount,
      album?.photos,
      album?.image_count,
      album?.imageCount
    );
    return total + (albumPhotoCount || 0);
  }, 0);
}

function getMusicShowDetailAlbumCount(show) {
  const albums = getMusicShowSmugAlbums(show);
  if (albums.length === 0) {
    return 0;
  }

  const albumsWithStatus = albums.filter((album) => String(album?.status || "").trim());
  const resolvedAlbums = albums.filter((album) => {
    const status = String(album?.status || "").trim().toLowerCase();
    const albumId = String(album?.album_id || album?.albumId || album?.gallery_id || album?.galleryId || "").trim();
    return status === "resolved" && albumId;
  });

  if (resolvedAlbums.length > 0) {
    return resolvedAlbums.length;
  }

  return albumsWithStatus.length === 0 ? albums.length : 0;
}

function formatMusicShowDetailStatValue(value, options = {}) {
  const count = getMusicShowDetailCountCandidate(value);
  if (count !== null && count > 0) {
    return count.toLocaleString();
  }

  return options.pendingWhenEmpty ? "Pending" : "0";
}

function formatMusicShowArchiveStatusValue(value) {
  const status = String(value || "").trim();
  if (!status) {
    return "";
  }

  return status
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getMusicShowArchiveStatus(show, albumCount) {
  if (albumCount > 0) {
    return "Archive Synced";
  }

  return formatMusicShowArchiveStatusValue(show?.smug_sync_status || show?.smugSyncStatus) || "Archive Pending";
}

function getMusicShowDateLabel(show) {
  if (show?.formattedDate) {
    return show.formattedDate;
  }
  if (show?.date || show?.rawDate) {
    return formatMusicShowDate(show.rawDate || show.date);
  }
  return `${show?.month || "TBD"} ${show?.day || "00"}, ${show?.year || "Pending"}`;
}

function getMusicShowTitle(show) {
  return String(show?.name || show?.title || "Show Detail").trim() || "Show Detail";
}

function getMusicShowDetailVenue(show) {
  return getMusicShowVenueName(show) || "Venue Pending";
}

function getMusicShowDetailLocation(show) {
  const city = String(show?.city || show?.venue_details?.city || show?.venueDetails?.city || "").trim();
  const state = String(show?.state || show?.venue_details?.state || show?.venueDetails?.state || "").trim();
  const cityStateLocation = getMusicShowLocation({ city, state });
  if (cityStateLocation !== "Location Pending") {
    return cityStateLocation;
  }
  return String(show?.location || "").trim() || "Location Pending";
}

function getMusicShowDisplayId(show) {
  const showId = getMusicShowIdValue(show);
  if (showId) {
    return showId;
  }
  const month = String(musicShowsMonthOrder[String(show?.month || "").toUpperCase()] || "0").padStart(2, "0");
  const day = String(show?.day || "00").padStart(2, "0");
  const yearText = String(show?.year || "");
  const year = /^\d{4}$/.test(yearText) ? yearText.slice(-2) : "00";
  return `${show?.poster || "SD"}-${month}${day}${year}`;
}

function getMusicArchiveSlug(value, fallback = "archive-item") {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function getMusicShowTimestamp(show) {
  const existingSort = Number(show?.dateSort);
  if (Number.isFinite(existingSort) && existingSort > 0) {
    return existingSort;
  }

  const parsedDate = parseMusicShowDate(show?.rawDate || show?.date || show?.formattedDate);
  if (parsedDate) {
    return parsedDate.getTime();
  }

  const year = Number.parseInt(show?.year || "0", 10);
  const month = musicShowsMonthOrder[String(show?.month || "").toUpperCase()] || 0;
  const day = Number.parseInt(show?.day || "0", 10);
  return (year * 10000) + (month * 100) + day;
}

function isMusicShowPosterImageSrc(value) {
  const poster = String(value || "").trim();
  return /^(https?:|data:image\/|\/|\.\.?\/)/i.test(poster);
}

function getMusicShowDetailCoverValue(show) {
  const candidates = [
    show?.cover_image_url,
    show?.coverImageUrl,
    show?.cover_image,
    show?.coverImage,
    show?.poster,
    show?.poster_url,
    show?.posterUrl,
    show?.poster_image,
    show?.posterImage,
    show?.image_url,
    show?.imageUrl,
    show?.image,
    show?.media?.poster,
    show?.media?.image,
    show?.images?.poster,
    show?.images?.full,
    show?.images?.large,
  ];

  return candidates
    .map((candidate) => String(candidate || "").trim())
    .find(Boolean) || "";
}

function getMusicShowDetailCoverSrc(show) {
  const cover = getMusicShowDetailCoverValue(show);
  return isMusicShowPosterImageSrc(cover) ? cover : SET_GALLERY_NO_POSTER_IMAGE_SRC;
}

function getMusicShowPosterSrc(show) {
  const poster = getMusicShowPosterValue(show);
  return isMusicShowPosterImageSrc(poster) ? poster : SET_GALLERY_NO_POSTER_IMAGE_SRC;
}

function setMusicShowPosterImage(image, imageSrc, fallbackElement) {
  if (!image) {
    return;
  }

  const shell = image.parentElement;
  const nextSrc = String(imageSrc || "").trim();
  const canLoadImage = isMusicShowPosterImageSrc(nextSrc);
  if (shell) {
    shell.classList.remove("has-poster");
    delete shell.dataset.showPosterSrc;
  }
  image.onload = null;
  image.onerror = null;
  image.removeAttribute("src");
  image.hidden = true;
  image.removeAttribute("data-show-poster-src");
  if (fallbackElement) {
    fallbackElement.hidden = false;
  }
  if (!canLoadImage) {
    return;
  }

  image.dataset.showPosterSrc = nextSrc;
  if (shell) {
    shell.dataset.showPosterSrc = nextSrc;
  }
  image.referrerPolicy = "strict-origin-when-cross-origin";
  image.onload = () => {
    image.hidden = false;
    if (fallbackElement) {
      fallbackElement.hidden = true;
    }
    if (shell) {
      shell.classList.add("has-poster");
    }
  };
  image.onerror = () => {
    image.hidden = true;
    image.removeAttribute("src");
    if (fallbackElement) {
      fallbackElement.hidden = false;
    }
    if (shell) {
      shell.classList.remove("has-poster");
    }
  };
  image.hidden = false;
  if (fallbackElement) {
    fallbackElement.hidden = true;
  }
  image.src = nextSrc;
  if (image.complete) {
    if (image.naturalWidth > 0) {
      image.onload();
    } else {
      image.onerror();
    }
  }
}

function normalizeMusicShowsIndexRow(record, index = 0) {
  const source = record && typeof record === "object" ? record : {};
  const normalized = source.name && source.formattedDate !== undefined
    ? { ...source }
    : normalizeMusicShowSetRow(source, index);
  const fallbackTitle = String(source.name || source.title || source.show_name || "").trim() || "Untitled Show";
  const city = String(normalized.city || source.city || source.location_city || source.venue_details?.city || "").trim();
  const state = String(normalized.state || source.state || source.location_state || source.venue_details?.state || "").trim();
  const venue = getMusicShowVenueName(source) || normalized.venue || "Venue Pending";
  const rawDate = String(normalized.rawDate || source.date || source.show_date || source.eventDate || "").trim();
  const formattedDate = formatMusicShowDate(rawDate);
  const parsedDate = parseMusicShowDate(rawDate);

  return {
    ...normalized,
    showId: getMusicShowIdValue(source) || normalized.showId || "",
    year: parsedDate ? String(parsedDate.getFullYear()) : String(normalized.year || "Pending"),
    rawDate,
    formattedDate,
    name: fallbackTitle,
    title: fallbackTitle,
    city,
    state,
    location: getMusicShowLocation({ city, state }),
    venue,
    poster: getMusicShowPosterValue(normalized) || getMusicShowPosterValue(source),
    dateSort: parsedDate ? parsedDate.getTime() : getMusicShowTimestamp(normalized),
  };
}

function getMusicShowsIndexSourceRows() {
  if (musicShowsSetsDataState === "live" && musicShowsSetsCollection.length > 0) {
    return musicShowsSetsCollection;
  }

  return musicShowsArchiveRows.map((show) => show.backend_record || show);
}

function getMusicShowsIndexRows() {
  const isLiveSource = musicShowsSetsDataState === "live" && musicShowsSetsCollection.length > 0;
  const sourceRows = getMusicShowsIndexSourceRows();
  const sourceRef = isLiveSource ? musicShowsSetsCollection : musicShowsArchiveRows;
  const cacheState = isLiveSource ? "live" : musicShowsSetsDataState;

  if (
    musicShowsIndexRowsCache &&
    musicShowsIndexRowsCacheState === cacheState &&
    musicShowsIndexRowsCacheSource === sourceRef &&
    musicShowsIndexRowsCacheLength === sourceRows.length
  ) {
    return musicShowsIndexRowsCache;
  }

  musicShowsIndexRowsCache = sourceRows
    .map(normalizeMusicShowsIndexRow)
    .filter((show) => show.name)
    .sort((left, right) => getMusicShowTimestamp(right) - getMusicShowTimestamp(left) || left.name.localeCompare(right.name));
  musicShowsIndexRowsCacheState = cacheState;
  musicShowsIndexRowsCacheSource = sourceRef;
  musicShowsIndexRowsCacheLength = sourceRows.length;

  return musicShowsIndexRowsCache;
}

function getMusicShowsUniqueOptions(rows, valueGetter, sortMode = "alpha") {
  const values = [...new Set(rows
    .map(valueGetter)
    .map((value) => String(value || "").trim())
    .filter(Boolean))];

  if (sortMode === "year-desc") {
    return values.sort((left, right) => Number.parseInt(right, 10) - Number.parseInt(left, 10));
  }

  return values.sort((left, right) => left.localeCompare(right));
}

function normalizeActiveMusicShowsFilters(rows) {
  const years = new Set(getMusicShowsUniqueOptions(rows, (show) => show.year, "year-desc"));
  const states = new Set(getMusicShowsUniqueOptions(rows, (show) => show.state));
  const venues = new Set(getMusicShowsUniqueOptions(rows, (show) => show.venue === "Venue Pending" ? "" : show.venue));
  if (activeMusicShowsYearFilter && !years.has(activeMusicShowsYearFilter)) {
    activeMusicShowsYearFilter = "";
  }
  if (activeMusicShowsStateFilter && !states.has(activeMusicShowsStateFilter)) {
    activeMusicShowsStateFilter = "";
  }
  if (activeMusicShowsVenueFilter && !venues.has(activeMusicShowsVenueFilter)) {
    activeMusicShowsVenueFilter = "";
  }
}

const MUSIC_SHOWS_SEARCH_DEBOUNCE_MS = 180;
let musicShowsSearchRenderTimer = 0;

function normalizeMusicShowsSearchValue(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function getMusicShowsSearchNeedle(value) {
  const normalized = normalizeMusicShowsSearchValue(value).replace(/["\u201c\u201d]/g, "");
  if (!normalized) {
    return null;
  }
  return {
    phrase: normalized,
    terms: normalized.split(" ").filter(Boolean),
  };
}

function doesMusicShowMatchSearch(show, searchNeedle) {
  if (!searchNeedle) {
    return true;
  }
  const haystack = normalizeMusicShowsSearchValue([
    show.name,
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

function scheduleMusicShowsArchiveRender() {
  window.clearTimeout(musicShowsSearchRenderTimer);
  musicShowsSearchRenderTimer = window.setTimeout(() => {
    renderMusicShowsArchive();
  }, MUSIC_SHOWS_SEARCH_DEBOUNCE_MS);
}

function renderMusicShowsArchiveImmediately() {
  window.clearTimeout(musicShowsSearchRenderTimer);
  renderMusicShowsArchive();
}

function getFilteredMusicShows() {
  const rows = getMusicShowsIndexRows();
  normalizeActiveMusicShowsFilters(rows);
  const searchNeedle = getMusicShowsSearchNeedle(activeMusicShowsSearch);

  return rows.filter((show) => {
    if (activeMusicShowsYearFilter && show.year !== activeMusicShowsYearFilter) {
      return false;
    }
    if (activeMusicShowsStateFilter && show.state !== activeMusicShowsStateFilter) {
      return false;
    }
    if (activeMusicShowsVenueFilter && show.venue !== activeMusicShowsVenueFilter) {
      return false;
    }
    return doesMusicShowMatchSearch(show, searchNeedle);
  });
}

function updateMusicShowsFilter(filterName, value) {
  if (filterName === "search") {
    const nextValue = String(value ?? "");
    if (nextValue === activeMusicShowsSearch) {
      return;
    }
    activeMusicShowsSearch = nextValue;
    scheduleMusicShowsArchiveRender();
    return;
  }

  const nextValue = String(value || "").trim();
  if (filterName === "year") {
    if (nextValue === activeMusicShowsYearFilter) {
      return;
    }
    activeMusicShowsYearFilter = nextValue;
  } else if (filterName === "state") {
    if (nextValue === activeMusicShowsStateFilter) {
      return;
    }
    activeMusicShowsStateFilter = nextValue;
  } else if (filterName === "venue") {
    if (nextValue === activeMusicShowsVenueFilter) {
      return;
    }
    activeMusicShowsVenueFilter = nextValue;
  } else {
    return;
  }
  renderMusicShowsArchiveImmediately();
}

function resetMusicShowsFilters() {
  activeMusicShowsSearch = "";
  activeMusicShowsYearFilter = "";
  activeMusicShowsStateFilter = "";
  activeMusicShowsVenueFilter = "";
  renderMusicShowsArchiveImmediately();
}

function createMusicShowsState(stateName, stateCopy = musicShowsStateCopy[stateName] || musicShowsStateCopy.empty) {
  const state = document.createElement("section");
  state.className = `music-shows-state music-shows-state--${stateName}`;
  state.dataset.musicShowsState = stateName;
  state.setAttribute("aria-live", stateName === "error" ? "assertive" : "polite");
  state.setAttribute("aria-busy", String(stateName === "loading"));

  const title = document.createElement("h5");
  title.className = "music-shows-state-title";
  title.textContent = stateCopy.title;

  const copy = document.createElement("p");
  copy.className = "music-shows-state-copy";
  copy.textContent = stateCopy.copy;

  state.append(title, copy);
  return state;
}

function createMusicShowsStateTemplates() {
  const templates = document.createElement("div");
  templates.className = "music-shows-state-templates";
  templates.dataset.musicShowsStateTemplates = "";
  templates.hidden = true;
  templates.setAttribute("aria-hidden", "true");
  templates.append(
    createMusicShowsState("loading"),
    createMusicShowsState("error")
  );
  return templates;
}

function selectMusicShowDetailHook(show) {
  if (!musicActivityPanel || !show) {
    return;
  }

  const showRoute = getMusicShowRouteUrl(show);
  musicActivityPanel.dataset.selectedShowRoute = showRoute;
  navigateToRoute(showRoute, {
    historyState: {
      fromShowsArchive: true,
      returnUrl: routePaths.musicShows,
    },
  });
}

function createMusicShowsFilterField(labelText, fieldName, options, activeValue) {
  const label = document.createElement("label");
  label.className = "music-shows-filter-field";

  const labelSpan = document.createElement("span");
  labelSpan.className = "music-shows-filter-label";
  labelSpan.textContent = labelText;

  const select = document.createElement("select");
  select.className = "music-shows-filter-select";
  select.dataset.musicShowsFilter = fieldName;
  select.setAttribute("aria-label", `Filter shows by ${labelText.toLowerCase()}`);

  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = fieldName === "year" ? "All Years" : fieldName === "state" ? "All States" : "All Venues";
  select.append(allOption);
  options.forEach((optionValue) => {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = optionValue;
    select.append(option);
  });
  select.value = activeValue;
  select.addEventListener("change", () => {
    updateMusicShowsFilter(fieldName, select.value);
  });

  label.append(labelSpan, select);
  return label;
}

function createMusicShowsFilters(rows) {
  const filters = document.createElement("section");
  filters.className = "music-shows-filters";
  filters.dataset.musicShowsFilters = "";
  filters.setAttribute("aria-label", "Shows archive filters");

  const searchLabel = document.createElement("label");
  searchLabel.className = "music-shows-filter-field music-shows-filter-field--search";
  const searchText = document.createElement("span");
  searchText.className = "music-shows-filter-label";
  searchText.textContent = "Search Shows";
  const searchInput = document.createElement("input");
  searchInput.className = "music-shows-search-input";
  searchInput.type = "search";
  searchInput.autocomplete = "off";
  searchInput.placeholder = "Search name, venue, city, state";
  searchInput.value = activeMusicShowsSearch;
  searchInput.dataset.musicShowsFilter = "search";
  searchInput.addEventListener("input", () => {
    updateMusicShowsFilter("search", searchInput.value);
  });
  searchLabel.append(searchText, searchInput);

  const years = getMusicShowsUniqueOptions(rows, (show) => show.year, "year-desc").filter((year) => /^\d{4}$/.test(year));
  const states = getMusicShowsUniqueOptions(rows, (show) => show.state);
  const venues = getMusicShowsUniqueOptions(rows, (show) => show.venue === "Venue Pending" ? "" : show.venue);

  const resetButton = document.createElement("button");
  resetButton.className = "music-shows-filter-reset";
  resetButton.type = "button";
  resetButton.textContent = "Reset Filters";
  resetButton.addEventListener("click", resetMusicShowsFilters);

  filters.append(
    searchLabel,
    createMusicShowsFilterField("Year", "year", years, activeMusicShowsYearFilter),
    createMusicShowsFilterField("State", "state", states, activeMusicShowsStateFilter),
    createMusicShowsFilterField("Venue", "venue", venues, activeMusicShowsVenueFilter),
    resetButton
  );

  return filters;
}

function createMusicShowIdText(show) {
  const showId = String(show.showId || "").trim();
  return showId ? `Show #${showId}` : "Show Pending";
}

function createMusicShowsCard(show) {
  const card = document.createElement("article");
  card.className = "music-show-card";
  card.dataset.showDetailRoute = getMusicShowRouteUrl(show);
  const posterSrc = getMusicShowPosterSrc(show);
  card.dataset.showPosterSrc = posterSrc;

  const poster = document.createElement("div");
  poster.className = "music-show-poster";
  poster.setAttribute("role", "img");
  poster.setAttribute("aria-label", `${show.name} poster`);
  poster.dataset.showPosterSrc = posterSrc;
  const posterImage = document.createElement("img");
  posterImage.className = "music-show-poster-image";
  posterImage.alt = "";
  posterImage.loading = "eager";
  posterImage.decoding = "async";
  posterImage.hidden = true;
  const posterFallback = document.createElement("span");
  posterFallback.className = "music-show-poster-fallback";
  posterFallback.textContent = "No Poster Available";
  poster.append(posterImage, posterFallback);
  setMusicShowPosterImage(posterImage, posterSrc, posterFallback);

  const body = document.createElement("div");
  body.className = "music-show-body";

  const title = document.createElement("h5");
  title.className = "music-show-title";
  title.textContent = show.name || "Untitled Show";

  const venue = document.createElement("p");
  venue.className = "music-show-venue";
  venue.textContent = show.venue || "Venue Pending";

  const location = document.createElement("p");
  location.className = "music-show-location";
  location.textContent = show.location || "Location Pending";

  const showDate = document.createElement("span");
  showDate.className = "music-show-date-text";
  showDate.textContent = show.formattedDate || "Date Pending";

  const footer = document.createElement("div");
  footer.className = "music-show-footer";

  const showNumber = document.createElement("span");
  showNumber.className = "music-show-number";
  showNumber.textContent = createMusicShowIdText(show);

  const action = document.createElement("button");
  action.className = "music-show-action";
  action.type = "button";
  action.textContent = "View Details";
  action.dataset.showDetailRoute = getMusicShowRouteUrl(show);
  action.setAttribute("aria-label", `View Details for ${show.name || "Untitled Show"}`);
  action.addEventListener("click", (event) => {
    event.stopPropagation();
    selectMusicShowDetailHook(show);
  });

  card.addEventListener("click", (event) => {
    if (event.target.closest("button")) {
      return;
    }
    selectMusicShowDetailHook(show);
  });

  footer.append(showNumber, action);
  body.append(title, venue, location, showDate);
  card.append(poster, body, footer);
  return card;
}

function getMusicShowsFilterFocusMeta() {
  const activeElement = document.activeElement;
  if (!activeElement || !musicActivityPanel || !musicActivityPanel.contains(activeElement)) {
    return null;
  }
  const filterName = activeElement.dataset?.musicShowsFilter;
  if (!filterName) {
    return null;
  }
  return {
    filterName,
    selectionStart: typeof activeElement.selectionStart === "number" ? activeElement.selectionStart : null,
    selectionEnd: typeof activeElement.selectionEnd === "number" ? activeElement.selectionEnd : null,
  };
}

function restoreMusicShowsFilterFocus(focusMeta) {
  if (!focusMeta || !musicActivityPanel) {
    return;
  }
  window.requestAnimationFrame(() => {
    const target = musicActivityPanel.querySelector(`[data-music-shows-filter="${focusMeta.filterName}"]`);
    if (!target) {
      return;
    }
    target.focus({ preventScroll: true });
    if (focusMeta.filterName === "search" && focusMeta.selectionStart !== null && typeof target.setSelectionRange === "function") {
      target.setSelectionRange(focusMeta.selectionStart, focusMeta.selectionEnd ?? focusMeta.selectionStart);
    }
  });
}

function requestMusicShowsIndexData() {
  if (musicShowsSetsDataState === "live" || musicShowsIndexDataRequested) {
    return;
  }
  musicShowsIndexDataRequested = true;
  requestMusicShowsSetsData().then(() => {
    if (getRouteFromUrl().name === "music-shows") {
      renderMusicShowsArchive({ skipDataRequest: true });
    }
  });
}

function renderMusicShowsArchive(options = {}) {
  if (!musicActivityPanel || !musicActivityList) {
    return;
  }

  const focusMeta = getMusicShowsFilterFocusMeta();
  const title = musicActivityPanel.querySelector(".music-nexus-section-title");
  if (title) {
    title.textContent = "";
    title.classList.add("sr-only");
  }

  musicActivityPanel.classList.add("music-shows-archive");
  musicActivityList.className = "music-shows-grid";
  musicActivityList.setAttribute("aria-label", "Shows archive rows");
  musicActivityList.replaceChildren();

  const existingYearBar = musicActivityPanel.querySelector("[data-music-shows-years]");
  if (existingYearBar) {
    existingYearBar.remove();
  }
  const existingFilters = musicActivityPanel.querySelector("[data-music-shows-filters]");
  if (existingFilters) {
    existingFilters.remove();
  }
  const allRows = getMusicShowsIndexRows();
  normalizeActiveMusicShowsFilters(allRows);
  musicActivityPanel.insertBefore(createMusicShowsFilters(allRows), musicActivityList);

  const existingTemplates = musicActivityPanel.querySelector("[data-music-shows-state-templates]");
  if (existingTemplates) {
    existingTemplates.remove();
  }

  const forcedState = getForcedMockState("musicShows");
  const filteredRows = getFilteredMusicShows();
  const fragment = document.createDocumentFragment();
  if (forcedState && forcedState !== "partial") {
    renderMockState(fragment, forcedState, "musicShows", { itemTag: "li", itemClass: "music-shows-empty" });
  } else {
    filteredRows.forEach((show) => {
      const item = document.createElement("li");
      item.className = "music-shows-item";
      item.append(createMusicShowsCard(show));
      fragment.append(item);
    });
    if (forcedState === "partial") {
      renderMockState(fragment, "partial", "musicShows", { itemTag: "li", itemClass: "music-shows-empty" });
    }
  }
  if (!forcedState && filteredRows.length === 0) {
    const empty = document.createElement("li");
    empty.className = "music-shows-empty";
    empty.append(createMusicShowsState("empty"));
    fragment.append(empty);
  }

  musicActivityList.append(fragment);
  musicActivityPanel.append(createMusicShowsStateTemplates());
  restoreMusicShowsFilterFocus(focusMeta);
  if (!options.skipDataRequest) {
    requestMusicShowsIndexData();
  }
}

function renderMusicActivityRows(sectionName, rows) {
  if (!musicActivityPanel || !musicActivityList) {
    return;
  }

  const title = musicActivityPanel.querySelector(".music-nexus-section-title");
  if (title) {
    title.textContent = "Recent Music Activity";
    title.classList.remove("sr-only");
  }

  musicActivityPanel.classList.remove("music-shows-archive");
  const existingYearBar = musicActivityPanel.querySelector("[data-music-shows-years]");
  if (existingYearBar) {
    existingYearBar.remove();
  }
  const existingFilters = musicActivityPanel.querySelector("[data-music-shows-filters]");
  if (existingFilters) {
    existingFilters.remove();
  }
  const existingTemplates = musicActivityPanel.querySelector("[data-music-shows-state-templates]");
  if (existingTemplates) {
    existingTemplates.remove();
  }
  delete musicActivityPanel.dataset.selectedShowRoute;
  musicActivityList.className = "music-activity-list";
  musicActivityList.setAttribute("aria-label", `${sectionName} music activity placeholder rows`);
  musicActivityList.replaceChildren();

  rows.forEach((rowText) => {
    const row = document.createElement("li");
    row.className = "v3-card v3-card--activity music-activity-row";
    row.textContent = rowText;
    musicActivityList.append(row);
  });
}

function returnToMusicShowsArchive() {
  const historyState = window.history.state || {};
  if (getRouteFromUrl().name === "show-detail" && historyState.fromShowsArchive) {
    window.history.back();
    return;
  }

  navigateToRoute(routePaths.musicShows);
}

function createShowDetailStat(label, value) {
  const stat = document.createElement("div");
  stat.className = "show-detail-stat";

  const statValue = document.createElement("span");
  statValue.className = "show-detail-stat-value";
  statValue.textContent = value;

  const statLabel = document.createElement("span");
  statLabel.className = "show-detail-stat-label";
  statLabel.textContent = label;

  stat.append(statValue, statLabel);
  return stat;
}

function getMusicShowBillBands(show) {
  const sourceBands = Array.isArray(show?.bands) ? show.bands : [];
  return sourceBands
    .map((band, index) => {
      if (band && typeof band === "object") {
        const name = String(band.band || band.name || band.band_name || band.bandName || "").trim();
        const slot = String(band.slot || band.bandSlot || band.band_slot || band.position || index + 1).trim();
        return name ? { name, slot, slug: createBandSlug(name) } : null;
      }

      const name = String(band || "").trim();
      return name ? { name, slot: String(index + 1), slug: createBandSlug(name) } : null;
    })
    .filter(Boolean);
}

function getShowBillBandSetRoute(show, band) {
  if (band?.isEmpty) {
    return "";
  }

  const bandSlug = createBandSlug(band?.slug || band?.name);
  const setCode = normalizeSetCode(getSetCodeFromDateValue(show?.date) || getMusicShowRouteCode(show));
  if (!bandSlug || !setCode) {
    return "";
  }

  return getSetRouteUrl(bandSlug, setCode);
}

function navigateToShowBillBandSet(show, band) {
  const targetUrl = getShowBillBandSetRoute(show, band);
  if (!targetUrl) {
    return;
  }

  navigateToRoute(targetUrl, {
    historyState: {
      fromShowDetail: true,
      showDetailUrl: getMusicShowRouteUrl(show),
    },
  });
}

function getMusicShowAlbumBandName(album) {
  return String(album?.band || album?.name || album?.band_name || album?.bandName || "").trim();
}

function getMusicShowAlbumBandId(album) {
  return String(album?.band_id || album?.bandId || album?.slug || "").trim() || createBandSlug(getMusicShowAlbumBandName(album));
}

function getMusicShowAlbumDateFolder(show, album) {
  return normalizeSetCode(
    album?.date_folder ||
    album?.dateFolder ||
    show?.date_folder ||
    show?.dateFolder ||
    getMusicShowRouteCode(show)
  );
}

function getMusicShowAlbumSetRoute(show, album) {
  const bandId = getMusicShowAlbumBandId(album);
  const dateFolder = getMusicShowAlbumDateFolder(show, album);
  if (!bandId || !dateFolder) {
    return "";
  }

  return getSetRouteUrl(bandId, dateFolder);
}

function getMusicShowAlbumPhotoLabel(album) {
  const photoCount = getMusicShowDetailCountCandidate(
    album?.photo_count,
    album?.photoCount,
    album?.photos,
    album?.image_count,
    album?.imageCount
  );
  return photoCount && photoCount > 0
    ? `${photoCount.toLocaleString()} Photos`
    : "Pending Photos";
}

function getMusicShowResolvedAlbums(show) {
  const albums = getMusicShowSmugAlbums(show);
  const albumsWithStatus = albums.filter((album) => String(album?.status || "").trim());
  if (albumsWithStatus.length === 0) {
    return albums;
  }

  return albums.filter((album) => String(album?.status || "").trim().toLowerCase() === "resolved");
}

function getMusicShowAlbumSlotLabel(album, index) {
  const slot = String(album?.slot || album?.lineupSlot || album?.lineup_slot || album?.position || index + 1).trim();
  if (!slot) {
    return "";
  }

  return /^slot\b/i.test(slot) ? slot : `Slot ${slot}`;
}

function getMusicShowAlbumStatusLabel(album) {
  const status = String(album?.status || "").trim();
  if (!status) {
    return "Archive Pending";
  }

  return status.toLowerCase() === "resolved"
    ? "Archive Synced"
    : formatMusicShowArchiveStatusValue(status);
}

function getMusicShowAlbumViewCountLabel(album) {
  const viewCount = getMusicShowDetailCountCandidate(album?.bandViewCount, album?.band_view_count);
  return viewCount && viewCount > 0
    ? `View ${viewCount.toLocaleString()}`
    : "";
}

const showSetPreviewCards = new Set();
let showSetPreviewVisibilityListenerAttached = false;

function isShowSetPreviewReducedMotion() {
  return Boolean(reducedMotion?.matches);
}

function addMusicShowImageUrl(urls, value) {
  const imageUrl = String(value || "").trim();
  if (imageUrl && isMusicShowPosterImageSrc(imageUrl)) {
    urls.push(imageUrl);
  }
}

function addMusicShowImageUrlsFromObject(urls, source, options = {}) {
  if (!source || typeof source !== "object") {
    addMusicShowImageUrl(urls, source);
    return;
  }

  [
    "cover_image_url",
    "coverImageUrl",
    "cover_image",
    "coverImage",
    "image_url",
    "imageUrl",
    "image",
    "photo_url",
    "photoUrl",
    "thumbnail_url",
    "thumbnailUrl",
    "thumb_url",
    "thumbUrl",
    "medium_url",
    "mediumUrl",
    "large_url",
    "largeUrl",
    "x2_url",
    "x2Url",
    "small",
    "medium",
    "large",
    "xlarge",
    "x2",
    "display_url",
    "displayUrl",
    "secure_url",
    "secureUrl",
    "original_url",
    "originalUrl",
    ...(options.includeGenericUrl ? ["url", "src"] : []),
  ].forEach((key) => addMusicShowImageUrl(urls, source[key]));
}

function addMusicShowImageUrlsFromCollection(urls, collection) {
  if (typeof collection === "string" && collection.trim().startsWith("[")) {
    try {
      addMusicShowImageUrlsFromCollection(urls, JSON.parse(collection));
    } catch (error) {
      return;
    }
    return;
  }

  if (!Array.isArray(collection)) {
    return;
  }

  collection.forEach((item) => {
    addMusicShowImageUrlsFromObject(urls, item, { includeGenericUrl: true });
  });
}

function getMusicShowAlbumImageCandidates(show, album) {
  const urls = [];
  [
    album?.preview_images,
    album?.previewImages,
    album?.album_images,
    album?.albumImages,
    album?.smug_images,
    album?.smugImages,
    album?.gallery_images,
    album?.galleryImages,
    album?.album_photos,
    album?.albumPhotos,
    album?.preview_urls,
    album?.previewUrls,
    album?.image_urls,
    album?.imageUrls,
    album?.photo_urls,
    album?.photoUrls,
    album?.photo_previews,
    album?.photoPreviews,
    album?.images,
    Array.isArray(album?.photos) ? album.photos : null,
    album?.thumbnails,
    album?.media,
    album?.items,
    album?.results,
  ].forEach((collection) => addMusicShowImageUrlsFromCollection(urls, collection));

  addMusicShowImageUrlsFromObject(urls, album);
  [
    show?.cover_image_url,
    show?.coverImageUrl,
    show?.poster,
  ].forEach((value) => addMusicShowImageUrl(urls, value));

  return Array.from(new Set(urls));
}

function getRandomizedMusicShowAlbumPreviewImages(show, album) {
  const urls = getMusicShowAlbumImageCandidates(show, album);
  if (urls.length <= 1) {
    return urls.length === 1 ? urls : [SET_GALLERY_NO_POSTER_IMAGE_SRC];
  }

  return [...urls]
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);
}

function getMusicShowAlbumCoverSrc(show, album) {
  const coverSrc = getMusicShowAlbumImageCandidates(show, album)[0] || "";
  return isMusicShowPosterImageSrc(coverSrc) ? coverSrc : SET_GALLERY_NO_POSTER_IMAGE_SRC;
}

function createShowSetCardPreviewImage(src, isActive = false) {
  const image = document.createElement("img");
  image.className = `show-set-card-image show-set-card-preview-image${isActive ? " is-active" : ""}`;
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";
  image.src = src || SET_GALLERY_NO_POSTER_IMAGE_SRC;
  image.onerror = () => {
    image.onerror = null;
    image.src = SET_GALLERY_NO_POSTER_IMAGE_SRC;
  };
  return image;
}

function stopShowSetCardPreview(card) {
  const preview = card?.__showSetPreview;
  if (!preview?.timerId) {
    return;
  }

  window.clearInterval(preview.timerId);
  preview.timerId = 0;
}

function advanceShowSetCardPreview(card) {
  const preview = card?.__showSetPreview;
  if (!preview || !card.isConnected) {
    stopShowSetCardPreview(card);
    return;
  }
  if (preview.urls.length <= 1 || document.hidden || isShowSetPreviewReducedMotion()) {
    return;
  }

  preview.currentIndex = (preview.currentIndex + 1) % preview.urls.length;
  const nextSlot = preview.activeSlot === 0 ? 1 : 0;
  const nextImage = preview.images[nextSlot];
  const activeImage = preview.images[preview.activeSlot];
  nextImage.src = preview.urls[preview.currentIndex];
  nextImage.classList.add("is-active");
  activeImage.classList.remove("is-active");
  preview.activeSlot = nextSlot;
}

function shouldPlayShowSetCardPreview(card) {
  const preview = card?.__showSetPreview;
  return Boolean(
    preview &&
    preview.urls.length > 1 &&
    preview.isCarouselActive &&
    preview.isVisible &&
    card.isConnected &&
    !document.hidden &&
    !isShowSetPreviewReducedMotion()
  );
}

function updateShowSetCardPreviewPlayback(card) {
  const preview = card?.__showSetPreview;
  if (!preview) {
    return;
  }

  if (!card.isConnected) {
    stopShowSetCardPreview(card);
    showSetPreviewCards.delete(card);
    return;
  }

  if (!shouldPlayShowSetCardPreview(card)) {
    stopShowSetCardPreview(card);
    return;
  }

  if (!preview.timerId) {
    preview.timerId = window.setInterval(() => {
      advanceShowSetCardPreview(card);
    }, 2800);
  }
}

function setShowSetCardPreviewActive(card, isActive) {
  if (!card?.__showSetPreview) {
    return;
  }

  card.__showSetPreview.isCarouselActive = isActive;
  updateShowSetCardPreviewPlayback(card);
}

function ensureShowSetPreviewVisibilityListener() {
  if (showSetPreviewVisibilityListenerAttached || typeof document === "undefined") {
    return;
  }

  showSetPreviewVisibilityListenerAttached = true;
  document.addEventListener("visibilitychange", () => {
    showSetPreviewCards.forEach((card) => updateShowSetCardPreviewPlayback(card));
  });
}

function registerShowSetCardPreview(card) {
  const preview = card?.__showSetPreview;
  if (!preview || preview.urls.length <= 1) {
    return;
  }

  showSetPreviewCards.add(card);
  ensureShowSetPreviewVisibilityListener();
  if (typeof IntersectionObserver === "function") {
    preview.visibilityObserver = new IntersectionObserver((entries) => {
      const entry = entries[0];
      preview.isVisible = Boolean(entry?.isIntersecting);
      updateShowSetCardPreviewPlayback(card);
    }, { threshold: 0.35 });
    preview.visibilityObserver.observe(card);
  } else {
    preview.isVisible = true;
    updateShowSetCardPreviewPlayback(card);
  }
}

function createShowDetailAlbumCard(show, album, index) {
  const bandName = getMusicShowAlbumBandName(album) || `Band ${index + 1}`;
  const bandId = getMusicShowAlbumBandId(album);
  const dateFolder = getMusicShowAlbumDateFolder(show, album);
  const targetUrl = getMusicShowAlbumSetRoute(show, album);
  const previewImages = getRandomizedMusicShowAlbumPreviewImages(show, album);

  const card = document.createElement("button");
  card.type = "button";
  card.className = "show-detail-bill-card show-set-card";
  card.dataset.showAlbumRoute = targetUrl;
  card.dataset.bandId = bandId;
  card.dataset.dateFolder = dateFolder;
  card.dataset.previewImageCount = String(previewImages.length);
  card.setAttribute("aria-label", `Open ${bandName} set from ${getMusicShowDateLabel(show)}`);

  const media = document.createElement("div");
  media.className = "show-set-card-media";

  const primaryImage = createShowSetCardPreviewImage(previewImages[0], true);
  const secondaryImage = createShowSetCardPreviewImage(previewImages[1] || previewImages[0], false);

  const overlay = document.createElement("div");
  overlay.className = "show-set-card-overlay";
  media.append(primaryImage, secondaryImage, overlay);

  const body = document.createElement("div");
  body.className = "show-set-card-body";

  const name = document.createElement("span");
  name.className = "show-detail-bill-name show-set-card-title";
  name.textContent = bandName;

  const meta = document.createElement("div");
  meta.className = "show-set-card-meta";

  const metaValues = [
    { className: "show-detail-bill-count", text: getMusicShowAlbumPhotoLabel(album) },
    { className: "show-detail-bill-slot", text: getMusicShowAlbumSlotLabel(album, index) },
    { className: "show-detail-bill-status", text: getMusicShowAlbumStatusLabel(album) },
    { className: "show-detail-bill-view-count", text: getMusicShowAlbumViewCountLabel(album) },
  ];

  metaValues.forEach(({ className, text }) => {
    if (!text) {
      return;
    }

    const item = document.createElement("span");
    item.className = className;
    item.textContent = text;
    meta.append(item);
  });

  body.append(name, meta);
  const action = document.createElement("span");
  action.className = "show-set-card-action";
  action.textContent = "View Set";
  body.append(action);
  card.append(media, body);
  card.__showSetPreview = {
    urls: previewImages,
    images: [primaryImage, secondaryImage],
    activeSlot: 0,
    currentIndex: 0,
    timerId: 0,
    isCarouselActive: false,
    isVisible: false,
    visibilityObserver: null,
  };
  registerShowSetCardPreview(card);
  card.addEventListener("click", () => {
    if (!targetUrl) {
      return;
    }

    navigateToRoute(targetUrl, {
      historyState: {
        fromShowDetail: true,
        showDetailUrl: getMusicShowRouteUrl(show),
      },
    });
  });

  return card;
}

function createShowDetailBandsOnBill(show) {
  const section = document.createElement("section");
  section.className = "show-detail-bill show-detail-viewing";
  section.setAttribute("aria-labelledby", "show-detail-bill-title");

  const albums = getMusicShowResolvedAlbums(show);
  let activeIndex = 0;

  const header = document.createElement("div");
  header.className = "show-detail-viewing-header";

  const heading = document.createElement("div");
  heading.className = "show-detail-viewing-heading";

  const title = document.createElement("h4");
  title.className = "show-detail-viewing-title show-detail-bill-title";
  title.id = "show-detail-bill-title";
  title.textContent = "Bands On The Bill";

  heading.append(title);

  const activeBandName = document.createElement("button");
  activeBandName.type = "button";
  activeBandName.className = "show-detail-bill-active-name";
  activeBandName.addEventListener("click", () => {
    const targetUrl = getMusicShowAlbumSetRoute(show, albums[activeIndex]);
    if (!targetUrl) {
      return;
    }

    navigateToRoute(targetUrl, {
      historyState: {
        fromShowDetail: true,
        showDetailUrl: getMusicShowRouteUrl(show),
      },
    });
  });

  header.append(heading, activeBandName);

  if (albums.length === 0) {
    const empty = document.createElement("p");
    empty.className = "show-detail-bill-empty";
    empty.textContent = "No resolved archive albums available.";
    section.append(header, empty);
    return section;
  }

  const mediaFrame = document.createElement("div");
  mediaFrame.className = "show-detail-media-frame show-detail-bill-frame show-set-carousel";
  mediaFrame.setAttribute("aria-roledescription", "carousel");

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.className = "show-detail-carousel-arrow show-detail-carousel-arrow--prev";
  previousButton.setAttribute("aria-label", "Previous band set");
  previousButton.textContent = "<";

  const viewport = document.createElement("div");
  viewport.className = "show-detail-carousel-viewport show-detail-bill-viewport show-set-carousel-viewport";
  viewport.tabIndex = 0;
  viewport.setAttribute("aria-label", "Bands On The Bill carousel");

  const track = document.createElement("div");
  track.className = "show-detail-carousel-track show-set-carousel-track";

  const slideElements = albums.map((album, index) => {
    const slide = document.createElement("article");
    slide.className = "show-detail-carousel-slide show-set-carousel-slide";
    slide.setAttribute("aria-label", `${index + 1} of ${albums.length}`);
    slide.append(createShowDetailAlbumCard(show, album, index));
    track.append(slide);
    return slide;
  });

  viewport.append(track);

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "show-detail-carousel-arrow show-detail-carousel-arrow--next";
  nextButton.setAttribute("aria-label", "Next band set");
  nextButton.textContent = ">";

  mediaFrame.append(previousButton, viewport, nextButton);

  const dots = document.createElement("div");
  dots.className = "show-detail-dots show-detail-bill-dots";
  dots.setAttribute("aria-label", "Band set carousel position");
  const dotButtons = albums.map((album, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "show-detail-dot";
    dot.setAttribute("aria-label", `Show ${getMusicShowAlbumBandName(album) || `band set ${index + 1}`}`);
    dot.addEventListener("click", () => {
      activeIndex = index;
      updateCarousel();
    });
    dots.append(dot);
    return dot;
  });

  function updateCarousel() {
    activeIndex = normalizeShowDetailSlideIndex(activeIndex, albums.length);
    track.style.transform = `translate3d(-${activeIndex * 100}%, 0, 0)`;
    activeBandName.textContent = getMusicShowAlbumBandName(albums[activeIndex]) || "";
    slideElements.forEach((slide, index) => {
      const isActive = index === activeIndex;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
      setShowSetCardPreviewActive(slide.querySelector(".show-set-card"), isActive);
    });
    dotButtons.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === activeIndex);
      dot.setAttribute("aria-current", index === activeIndex ? "true" : "false");
    });
  }

  previousButton.addEventListener("click", () => {
    activeIndex -= 1;
    updateCarousel();
  });

  nextButton.addEventListener("click", () => {
    activeIndex += 1;
    updateCarousel();
  });

  viewport.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      activeIndex -= 1;
      updateCarousel();
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      activeIndex += 1;
      updateCarousel();
    }
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
    if (event.pointerType === "mouse") {
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
      activeIndex += deltaX < 0 ? 1 : -1;
      updateCarousel();
    }
    clearPointerState();
  });
  viewport.addEventListener("pointercancel", clearPointerState);
  viewport.addEventListener("lostpointercapture", clearPointerState);

  if (albums.length <= 1) {
    previousButton.hidden = true;
    nextButton.hidden = true;
    dots.hidden = true;
  }

  updateCarousel();

  section.append(header, mediaFrame, dots);
  return section;
}

function formatShowDetailSlideCounter(index, total) {
  return `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
}

function normalizeShowDetailSlideIndex(index, total) {
  return ((index % total) + total) % total;
}

function getMusicShowBandRelationships(show) {
  const bandTotal = Number.parseInt(getMusicShowBandCount(show), 10) || 0;
  const relationshipCount = Math.min(Math.max(bandTotal, 1), 4);
  const sourceBands = musicBandIndexRows.slice(0, relationshipCount);

  if (sourceBands.length === 0) {
    return [{
      band_id: `band-${getMusicArchiveSlug(show.showId, "unknown-show")}-pending`,
      name: "Pending Band",
      role: "Lineup placeholder",
      relationship_status: "static-hold",
    }];
  }

  return sourceBands.map((band, index) => ({
    band_id: band.bandId,
    name: band.name,
    role: index === 0 ? "Headliner placeholder" : "Lineup placeholder",
    relationship_status: "static-hook",
  }));
}

function getMusicShowMediaRelationships(show) {
  const showSlug = getMusicArchiveSlug(show.showId, "unknown-show");
  const photoCount = getMusicShowPhotoCount(show);
  const bandCount = getMusicShowBandCount(show);
  const showCode = getMusicShowDisplayId(show);

  return [
    {
      media_id: `${showSlug}-lead-photo`,
      kind: "photo",
      gallery_entry_id: `gallery-${showSlug}`,
      lightbox_entry_id: `lightbox-${showSlug}-lead`,
      tags: ["lead", "photo"],
      kicker: "Lead Frame",
      title: show.title,
      detail: getMusicShowDateLabel(show),
      caption: "Primary archive preview",
    },
    {
      media_id: `${showSlug}-venue-photo`,
      kind: "photo",
      gallery_entry_id: `gallery-${showSlug}`,
      lightbox_entry_id: `lightbox-${showSlug}-venue`,
      tags: ["venue", "room"],
      kicker: "Room View",
      title: show.venue,
      detail: show.location,
      caption: "Venue atmosphere placeholder",
    },
    {
      media_id: `${showSlug}-set-photo`,
      kind: "photo",
      gallery_entry_id: `gallery-${showSlug}`,
      lightbox_entry_id: `lightbox-${showSlug}-set`,
      tags: ["bands", "performance"],
      kicker: "Set Capture",
      title: `${bandCount} Band${bandCount === "1" ? "" : "s"}`,
      detail: "Music Nexus archive",
      caption: "Performance sequence preview",
    },
    {
      media_id: `${showSlug}-gallery-entry`,
      kind: "gallery",
      gallery_entry_id: `gallery-${showSlug}`,
      lightbox_entry_id: `lightbox-${showSlug}-gallery`,
      tags: ["gallery", "photos"],
      kicker: "Gallery Queue",
      title: `${photoCount} Photos`,
      detail: "Media pending live gallery source",
      caption: "Future lightbox entry point",
    },
    {
      media_id: `${showSlug}-video-hold`,
      kind: "video",
      gallery_entry_id: `gallery-${showSlug}`,
      lightbox_entry_id: `lightbox-${showSlug}-video`,
      tags: ["video", "hold"],
      kicker: "Video Hold",
      title: "Video Slot",
      detail: showCode,
      caption: "Reserved media relationship",
    },
  ];
}

function getMusicShowTags(show) {
  const locationParts = String(show.location || "").split(",");
  const region = locationParts.length > 1 ? locationParts[1].trim() : locationParts[0].trim();
  return [
    { tag_id: `tag-year-${getMusicArchiveSlug(show.year, "pending")}`, label: show.year || "Pending" },
    { tag_id: `tag-region-${getMusicArchiveSlug(region, "region")}`, label: region || "Region Hold" },
    { tag_id: `tag-venue-${getMusicArchiveSlug(show.venue, "venue")}`, label: "Venue Linked" },
    { tag_id: "tag-media-gallery", label: "Gallery Ready" },
  ];
}

function getMusicShowRelationshipSnapshot(show) {
  const showSlug = getMusicArchiveSlug(show.showId, "unknown-show");
  const venueId = `venue-${getMusicArchiveSlug(show.venue, "pending-venue")}`;
  const bands = getMusicShowBandRelationships(show);
  const media = getMusicShowMediaRelationships(show);
  const galleryEntryId = `gallery-${showSlug}`;
  const lightboxEntryId = `lightbox-${showSlug}`;

  return {
    show_id: show.showId || showSlug,
    venue_id: venueId,
    venue: {
      venue_id: venueId,
      name: show.venue || "Pending Venue",
      location: show.location || "Pending City",
      relationship_status: "static-hook",
    },
    band_count: getMusicShowBandCount(show),
    band_ids: bands.map((band) => band.band_id),
    bands,
    media_counts: {
      photos: getMusicShowPhotoCount(show),
      videos: "1",
    },
    media_ids: media.map((item) => item.media_id),
    media,
    tags: getMusicShowTags(show),
    archive_meta: {
      show_display_id: getMusicShowDisplayId(show),
      gallery_entry_id: galleryEntryId,
      lightbox_entry_id: lightboxEntryId,
      ingest_state: "static-placeholder",
      relationship_state: "schema-ready",
      source: "Music Nexus V3",
    },
  };
}

function getMusicShowCarouselSlides(show, relationships = getMusicShowRelationshipSnapshot(show)) {
  return relationships.media;
}

function createShowDetailRelationshipRow(label, value) {
  const row = document.createElement("div");
  row.className = "show-detail-relationship-row";

  const rowLabel = document.createElement("span");
  rowLabel.className = "show-detail-relationship-label";
  rowLabel.textContent = label;

  const rowValue = document.createElement("span");
  rowValue.className = "show-detail-relationship-value";
  rowValue.textContent = value;

  row.append(rowLabel, rowValue);
  return row;
}

function createShowDetailRelationshipChip(label, dataset = {}) {
  const chip = document.createElement("span");
  chip.className = "show-detail-relationship-chip";
  chip.textContent = label;
  Object.entries(dataset).forEach(([key, value]) => {
    chip.dataset[key] = value;
  });
  return chip;
}

function createShowDetailRelationshipPanel({ kicker, title, rows = [], chips = [], dataset = {} }) {
  const panel = document.createElement("article");
  panel.className = "show-detail-relationship-panel";
  Object.entries(dataset).forEach(([key, value]) => {
    panel.dataset[key] = value;
  });

  const panelKicker = document.createElement("p");
  panelKicker.className = "show-detail-relationship-kicker";
  panelKicker.textContent = kicker;

  const panelTitle = document.createElement("h5");
  panelTitle.className = "show-detail-relationship-title";
  panelTitle.textContent = title;

  const rowList = document.createElement("div");
  rowList.className = "show-detail-relationship-rows";
  rows.forEach((row) => {
    rowList.append(createShowDetailRelationshipRow(row.label, row.value));
  });

  panel.append(panelKicker, panelTitle, rowList);
  if (chips.length > 0) {
    const chipList = document.createElement("div");
    chipList.className = "show-detail-relationship-chips";
    chips.forEach((chip) => chipList.append(chip));
    panel.append(chipList);
  }

  return panel;
}

function createShowDetailRelationships(relationships) {
  const section = document.createElement("section");
  section.className = "show-detail-relationships";
  section.setAttribute("aria-labelledby", "show-detail-relationships-title");
  section.dataset.showId = relationships.show_id;
  section.dataset.venueId = relationships.venue_id;
  section.dataset.galleryEntryId = relationships.archive_meta.gallery_entry_id;
  section.dataset.lightboxEntryId = relationships.archive_meta.lightbox_entry_id;

  const header = document.createElement("div");
  header.className = "show-detail-relationships-header";

  const title = document.createElement("h4");
  title.className = "show-detail-relationships-title";
  title.id = "show-detail-relationships-title";
  title.textContent = "Archive Links";

  const state = document.createElement("span");
  state.className = "show-detail-relationships-state";
  state.textContent = relationships.archive_meta.relationship_state;

  header.append(title, state);

  const grid = document.createElement("div");
  grid.className = "show-detail-relationships-grid";

  grid.append(
    createShowDetailRelationshipPanel({
      kicker: "Venue",
      title: relationships.venue.name,
      dataset: { venueId: relationships.venue_id },
      rows: [
        { label: "venue_id", value: relationships.venue_id },
        { label: "Location", value: relationships.venue.location },
        { label: "Status", value: relationships.venue.relationship_status },
      ],
    }),
    createShowDetailRelationshipPanel({
      kicker: "Bands",
      title: `${relationships.band_count} Band${relationships.band_count === "1" ? "" : "s"}`,
      dataset: { bandIds: relationships.band_ids.join(",") },
      rows: [
        { label: "Linked", value: `${relationships.band_ids.length} static hooks` },
        { label: "Remaining", value: `${Math.max(0, Number.parseInt(relationships.band_count, 10) - relationships.band_ids.length)} slots` },
      ],
      chips: relationships.bands.map((band) =>
        createShowDetailRelationshipChip(band.name, { bandId: band.band_id })
      ),
    }),
    createShowDetailRelationshipPanel({
      kicker: "Media",
      title: `${relationships.media_counts.photos} Photos / ${relationships.media_counts.videos} Video`,
      dataset: {
        mediaIds: relationships.media_ids.join(","),
        galleryEntryId: relationships.archive_meta.gallery_entry_id,
        lightboxEntryId: relationships.archive_meta.lightbox_entry_id,
      },
      rows: [
        { label: "Gallery", value: relationships.archive_meta.gallery_entry_id },
        { label: "Lightbox", value: relationships.archive_meta.lightbox_entry_id },
        { label: "Media IDs", value: `${relationships.media_ids.length} staged` },
      ],
      chips: [
        createShowDetailRelationshipChip("Gallery Entry", { galleryEntryId: relationships.archive_meta.gallery_entry_id }),
        createShowDetailRelationshipChip("Lightbox Entry", { lightboxEntryId: relationships.archive_meta.lightbox_entry_id }),
      ],
    }),
    createShowDetailRelationshipPanel({
      kicker: "Metadata",
      title: relationships.archive_meta.show_display_id,
      dataset: { relationshipState: relationships.archive_meta.relationship_state },
      rows: [
        { label: "Source", value: relationships.archive_meta.source },
        { label: "Ingest", value: relationships.archive_meta.ingest_state },
      ],
      chips: relationships.tags.map((tag) =>
        createShowDetailRelationshipChip(tag.label, { tagId: tag.tag_id })
      ),
    })
  );

  section.append(header, grid);
  return section;
}

function renderMusicShowDetail(show) {
  if (!showDetail || !show) {
    return;
  }

  const relationships = getMusicShowRelationshipSnapshot(show);
  const showTitle = getMusicShowTitle(show);
  const showVenue = getMusicShowDetailVenue(show);
  const showLocation = getMusicShowDetailLocation(show);
  const showIdValue = getMusicShowIdValue(show) || "Show Pending";
  const bandCount = getMusicShowDetailBandCount(show);
  const photoCount = getMusicShowDetailPhotoCount(show);
  showDetail.dataset.showId = relationships.show_id;
  showDetail.dataset.venueId = relationships.venue_id;
  showDetail.dataset.galleryEntryId = relationships.archive_meta.gallery_entry_id;
  showDetail.dataset.lightboxEntryId = relationships.archive_meta.lightbox_entry_id;

  const backButton = document.createElement("button");
  backButton.className = "show-detail-back";
  backButton.type = "button";
  backButton.textContent = "Back to Shows";
  backButton.addEventListener("click", returnToMusicShowsArchive);

  const hero = document.createElement("section");
  hero.className = "show-detail-hero";
  hero.setAttribute("aria-labelledby", "show-detail-title");

  const poster = document.createElement("div");
  poster.className = "show-detail-poster";
  poster.setAttribute("role", "img");
  poster.setAttribute("aria-label", `${showTitle} poster`);

  const posterImage = document.createElement("img");
  posterImage.className = "show-detail-poster-image";
  posterImage.alt = "";
  posterImage.loading = "eager";
  posterImage.decoding = "async";
  posterImage.hidden = true;

  const posterFallback = document.createElement("span");
  posterFallback.className = "show-detail-poster-fallback";
  posterFallback.textContent = "No Poster Available";
  poster.append(posterImage, posterFallback);
  setMusicShowPosterImage(posterImage, getMusicShowDetailCoverSrc(show), posterFallback);

  const copy = document.createElement("div");
  copy.className = "show-detail-copy";

  const eyebrow = document.createElement("p");
  eyebrow.className = "show-detail-eyebrow";
  eyebrow.textContent = "Show Detail";

  const title = document.createElement("h3");
  title.className = "show-detail-title";
  title.id = "show-detail-title";
  title.textContent = showTitle;

  const details = document.createElement("div");
  details.className = "show-detail-lines";

  [getMusicShowDateLabel(show), showVenue, showLocation].forEach((detailText) => {
    const detail = document.createElement("p");
    detail.className = "show-detail-line";
    detail.textContent = detailText;
    details.append(detail);
  });

  const stats = document.createElement("div");
  stats.className = "show-detail-stats";
  stats.append(
    createShowDetailStat("Show ID", showIdValue),
    createShowDetailStat("Bands", formatMusicShowDetailStatValue(bandCount)),
    createShowDetailStat("Photos", formatMusicShowDetailStatValue(photoCount, { pendingWhenEmpty: true }))
  );

  copy.append(eyebrow, title, details, stats);
  hero.append(poster, copy);

  const bill = createShowDetailBandsOnBill(show);

  showDetail.replaceChildren(backButton, hero, bill);
}

function renderUnusedShowDetailLegacyPreview(show, relationships) {
  const viewing = document.createElement("section");
  viewing.className = "show-detail-viewing";
  viewing.setAttribute("aria-labelledby", "show-detail-viewing-title");

  const viewingHeader = document.createElement("div");
  viewingHeader.className = "show-detail-viewing-header";

  const viewingHeading = document.createElement("div");
  viewingHeading.className = "show-detail-viewing-heading";

  const viewingTitle = document.createElement("h4");
  viewingTitle.className = "show-detail-viewing-title";
  viewingTitle.id = "show-detail-viewing-title";
  viewingTitle.textContent = "Currently Viewing";

  const showId = document.createElement("span");
  showId.className = "show-detail-show-id";
  showId.textContent = `Show ID ${getMusicShowDisplayId(show)}`;

  const counter = document.createElement("span");
  counter.className = "show-detail-slide-counter";
  viewingHeading.append(viewingTitle, showId);
  viewingHeader.append(viewingHeading, counter);

  const mediaFrame = document.createElement("div");
  mediaFrame.className = "show-detail-media-frame";
  mediaFrame.setAttribute("aria-roledescription", "carousel");

  const slides = getMusicShowCarouselSlides(show, relationships);
  let activeSlideIndex = 0;

  const previous = document.createElement("button");
  previous.className = "show-detail-carousel-arrow show-detail-carousel-arrow--prev";
  previous.type = "button";
  previous.textContent = "<";
  previous.setAttribute("aria-label", "Previous carousel item");

  const viewport = document.createElement("div");
  viewport.className = "show-detail-carousel-viewport";
  viewport.setAttribute("tabindex", "0");
  viewport.setAttribute("aria-label", `${show.title} media carousel`);

  const track = document.createElement("div");
  track.className = "show-detail-carousel-track";

  const slideElements = slides.map((slide, index) => {
    const slideElement = document.createElement("article");
    slideElement.className = `show-detail-carousel-slide${index === activeSlideIndex ? " is-active" : ""}`;
    slideElement.dataset.mediaId = slide.media_id;
    slideElement.dataset.mediaKind = slide.kind;
    slideElement.dataset.galleryEntryId = slide.gallery_entry_id;
    slideElement.dataset.lightboxEntryId = slide.lightbox_entry_id;
    slideElement.setAttribute("aria-roledescription", "slide");
    slideElement.setAttribute("aria-label", `${index + 1} of ${slides.length}: ${slide.title}`);
    slideElement.setAttribute("aria-hidden", String(index !== activeSlideIndex));

    const media = document.createElement("div");
    media.className = "show-detail-media";
    media.setAttribute("role", "img");
    media.setAttribute("aria-label", `${slide.title} archive media placeholder`);

    const mediaCopy = document.createElement("div");
    mediaCopy.className = "show-detail-media-copy";

    const mediaKicker = document.createElement("span");
    mediaKicker.className = "show-detail-media-kicker";
    mediaKicker.textContent = slide.kicker;

    const mediaTitle = document.createElement("span");
    mediaTitle.className = "show-detail-media-title";
    mediaTitle.textContent = slide.title;

    const mediaDetail = document.createElement("span");
    mediaDetail.className = "show-detail-media-detail";
    mediaDetail.textContent = slide.detail;

    const mediaCaption = document.createElement("span");
    mediaCaption.className = "show-detail-media-caption";
    mediaCaption.textContent = slide.caption;

    mediaCopy.append(mediaKicker, mediaTitle, mediaDetail, mediaCaption);
    media.append(mediaCopy);
    slideElement.append(media);
    track.append(slideElement);
    return slideElement;
  });

  viewport.append(track);

  const next = document.createElement("button");
  next.className = "show-detail-carousel-arrow show-detail-carousel-arrow--next";
  next.type = "button";
  next.textContent = ">";
  next.setAttribute("aria-label", "Next carousel item");

  mediaFrame.append(previous, viewport, next);

  const dots = document.createElement("div");
  dots.className = "show-detail-dots";
  dots.setAttribute("aria-label", "Carousel position");

  const dotButtons = slides.map((slide, index) => {
    const dot = document.createElement("button");
    dot.className = `show-detail-dot${index === activeSlideIndex ? " is-active" : ""}`;
    dot.type = "button";
    dot.setAttribute("aria-label", `Show carousel item ${index + 1}: ${slide.title}`);
    if (index === activeSlideIndex) {
      dot.setAttribute("aria-current", "true");
    }
    dots.append(dot);
    return dot;
  });

  function updateCarousel(nextIndex) {
    activeSlideIndex = normalizeShowDetailSlideIndex(nextIndex, slides.length);
    track.style.transform = `translate3d(-${activeSlideIndex * 100}%, 0, 0)`;
    counter.textContent = formatShowDetailSlideCounter(activeSlideIndex, slides.length);

    slideElements.forEach((slideElement, index) => {
      const isActive = index === activeSlideIndex;
      slideElement.classList.toggle("is-active", isActive);
      slideElement.setAttribute("aria-hidden", String(!isActive));
    });

    dotButtons.forEach((dot, index) => {
      const isActive = index === activeSlideIndex;
      dot.classList.toggle("is-active", isActive);
      if (isActive) {
        dot.setAttribute("aria-current", "true");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
  }

  previous.addEventListener("click", () => updateCarousel(activeSlideIndex - 1));
  next.addEventListener("click", () => updateCarousel(activeSlideIndex + 1));
  dotButtons.forEach((dot, index) => {
    dot.addEventListener("click", () => updateCarousel(index));
  });

  viewport.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      updateCarousel(activeSlideIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      updateCarousel(activeSlideIndex + 1);
    }
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
    if (event.pointerType === "mouse") {
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
      updateCarousel(activeSlideIndex + (deltaX < 0 ? 1 : -1));
    }
    clearPointerState();
  });

  viewport.addEventListener("pointercancel", clearPointerState);
  viewport.addEventListener("lostpointercapture", clearPointerState);

  updateCarousel(activeSlideIndex);

  viewing.append(viewingHeader, mediaFrame, dots);
  return viewing;
}

function showMusicShowDetail(showId) {
  const routeShowCode = normalizeSetCode(showId);
  const show = findMusicShowById(routeShowCode) || createUnknownMusicShow(routeShowCode);
  renderMusicShowDetail(show);
  setBandsIndexVisible(false);
  setPeopleIndexVisible(false);
  setMusicVenueIndexVisible(false);
  setMusicActivityPanelVisible(false);
  setMusicShowDetailVisible(true);
  setCurrentView("Show Detail");
  if (!musicShowsSetsLoaded || musicShowsSetsDataState !== "live") {
    requestMusicShowsSetsData().then(() => {
      const currentRoute = getRouteFromUrl();
      if (currentRoute.name !== "show-detail" || normalizeSetCode(currentRoute.showId) !== routeShowCode) {
        return;
      }
      renderMusicShowDetail(findMusicShowById(routeShowCode) || createUnknownMusicShow(routeShowCode));
    });
  }
  if (musicNexusShell) {
    musicNexusShell.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }
}

function setPeopleIndexVisible(isVisible) {
  if (!musicPeopleIndex) {
    return;
  }

  musicPeopleIndex.classList.toggle("is-active", isVisible);
  musicPeopleIndex.setAttribute("aria-hidden", String(!isVisible));
  if (isVisible) {
    const peopleRequest = requestMusicPeopleIndexData();
    renderMusicPeopleIndex({ shouldResetScroll: false });
    peopleRequest.then(() => {
      if (getRouteFromUrl().name === "music-people") {
        renderMusicPeopleIndex({ shouldResetScroll: false });
      }
    });
    musicPeopleIndex.removeAttribute("inert");
  } else {
    musicPeopleIndex.setAttribute("inert", "");
  }
}

function setMusicActivityPanelVisible(isVisible) {
  if (!musicActivityPanel) {
    return;
  }

  musicActivityPanel.classList.toggle("is-hidden", !isVisible);
  musicActivityPanel.setAttribute("aria-hidden", String(!isVisible));
  if (isVisible) {
    musicActivityPanel.removeAttribute("inert");
  } else {
    musicActivityPanel.setAttribute("inert", "");
  }
}

function setMusicNexusLandingVisible(isVisible) {
  if (!musicNexusShell || !musicNexusLanding) {
    return;
  }

  musicNexusShell.classList.toggle("is-landing", isVisible);
  musicNexusLanding.setAttribute("aria-hidden", String(!isVisible));
  if (isVisible) {
    musicNexusLanding.removeAttribute("inert");
  } else {
    musicNexusLanding.setAttribute("inert", "");
  }
}

function showMusicNexusLanding(options = {}) {
  setBandDetailVisible(false);
  setSetsArchiveVisible(false);
  setSetGalleryVisible(false);
  setMusicPersonDetailVisible(false);
  setMusicShowDetailVisible(false);
  setVenueDetailVisible(false);
  setBandsIndexVisible(false);
  setPeopleIndexVisible(false);
  setMusicActivityPanelVisible(false);
  setMusicNexusLandingVisible(true);

  if (options.shouldScroll !== false && musicNexusShell) {
    musicNexusShell.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }
}

function setMusicNexusContext(sectionName, shouldFocusCard = false, shouldUpdateRail = true) {
  setMusicNexusLandingVisible(false);

  const rows = musicActivityContent[sectionName] || [];
  if (!musicActivityList) {
    return;
  }

  setBandDetailVisible(false);
  setSetsArchiveVisible(false);
  setSetGalleryVisible(false);
  setMusicPersonDetailVisible(false);
  setMusicShowDetailVisible(false);
  setVenueDetailVisible(false);
  setMusicVenueIndexVisible(false);
  let activeCardLabel = "";
  musicNexusCards.forEach((card) => {
    const isActive = card.dataset.musicNexusCard === sectionName;
    card.setAttribute("aria-pressed", String(isActive));
    if (isActive) {
      activeCardLabel = card.textContent.trim();
      card.setAttribute("tabindex", "0");
      centerCardInScroller(card, card.closest("[data-music-nexus-selector]"));
      if (shouldFocusCard) {
        card.focus({ preventScroll: true });
      }
    } else {
      card.setAttribute("tabindex", "-1");
    }
  });

  setBandsIndexVisible(sectionName === "bands");
  setPeopleIndexVisible(sectionName === "people");
  setMusicVenueIndexVisible(sectionName === "venues");
  if (sectionName === "bands") {
    syncBandsIndex();
  }
  if (sectionName === "venues") {
    syncMusicVenuesArchive();
  }

  const shouldShowActivityPanel = sectionName !== "bands" && sectionName !== "people" && sectionName !== "venues";
  setMusicActivityPanelVisible(shouldShowActivityPanel);
  if (shouldShowActivityPanel) {
    if (sectionName === "shows") {
      renderMusicShowsArchive();
    } else {
      renderMusicActivityRows(sectionName, rows);
    }
  }

  if (shouldUpdateRail && activeCardLabel) {
    setCurrentView(activeCardLabel);
  }
}

function moveMusicNexusSelection(direction) {
  const cards = Array.from(musicNexusCards);
  if (cards.length === 0) {
    return;
  }

  const activeIndex = Math.max(
    0,
    cards.findIndex((card) => card.getAttribute("aria-pressed") === "true")
  );
  const nextIndex = (activeIndex + direction + cards.length) % cards.length;
  setMusicNexusContext(cards[nextIndex].dataset.musicNexusCard, true);
}
function initMusicModule() {
  if (musicNexusBack) {
    musicNexusBack.addEventListener("click", () => {
      navigateToRoute(routePaths.portfolio);
    });
  }
  if (bandDetailBack) {
    bandDetailBack.addEventListener("click", returnToBandsIndexRoute);
  }
  if (setsArchiveBack) {
    setsArchiveBack.addEventListener("click", returnToBandDetailRoute);
  }
  if (bandDetailViewSets) {
    bandDetailViewSets.addEventListener("click", navigateToBandSetsArchive);
  }
  if (setsFeaturedOpen) {
    setsFeaturedOpen.addEventListener("click", openSelectedSetDetail);
  }
  if (setGalleryBack) {
    setGalleryBack.addEventListener("click", returnToSetsArchiveFromGallery);
  }
  if (venueDetailBack) {
    venueDetailBack.addEventListener("click", returnToMusicVenuesRoute);
  }
  galleryPhotoTiles.forEach((tile) => {
    protectArchiveImage(tile.querySelector(".archive-gallery-image"));
    tile.addEventListener("click", () => {
      selectGalleryPhoto(tile);
    });
  });
  galleryViewOptions.forEach((option) => {
    option.addEventListener("click", () => {
      setGalleryViewMode(option.dataset.galleryViewOption);
    });
  });
  if (galleryViewAll) {
    galleryViewAll.addEventListener("click", toggleSetGalleryPhotoRange);
  }
  if (lightboxBack) {
    lightboxBack.addEventListener("click", returnToSetGalleryFromLightbox);
  }
  if (lightboxPrev) {
    lightboxPrev.addEventListener("click", () => {
      setLightboxControlsHidden(false);
      setLightboxActivePhoto(activeLightboxIndex - 1);
    });
  }
  if (lightboxNext) {
    lightboxNext.addEventListener("click", () => {
      setLightboxControlsHidden(false);
      setLightboxActivePhoto(activeLightboxIndex + 1);
    });
  }
  if (lightboxImage) {
    protectArchiveImage(lightboxImage);
    lightboxImage.addEventListener("load", handleLightboxImageLoad);
    lightboxImage.addEventListener("error", handleLightboxImageError);
    setLightboxImageStatus(lightboxImage.complete && lightboxImage.naturalWidth > 0 ? "loaded" : "loading");
  }
  if (lightboxPhoto) {
    lightboxPhoto.addEventListener("click", () => {
      if (lightboxGestureSuppressClick) {
        lightboxGestureSuppressClick = false;
        return;
      }
      setLightboxControlsHidden(!areLightboxControlsHidden);
    });
    if (window.PointerEvent) {
      lightboxPhoto.addEventListener("pointerdown", handleLightboxSwipeStart);
      lightboxPhoto.addEventListener("pointermove", handleLightboxSwipeMove, { passive: false });
      lightboxPhoto.addEventListener("pointerup", handleLightboxSwipeEnd);
      lightboxPhoto.addEventListener("pointercancel", handleLightboxSwipeCancel);
    }
  }
  if (lightboxInfoToggle) {
    lightboxInfoToggle.addEventListener("click", () => {
      setLightboxControlsHidden(false);
      const isInfoOpen = Boolean(lightboxScreen && lightboxScreen.classList.contains("is-info-open"));
      setLightboxInfoVisible(!isInfoOpen);
    });
  }
  if (lightboxDrawerClose) {
    lightboxDrawerClose.addEventListener("click", () => {
      setLightboxControlsHidden(false);
      setLightboxInfoVisible(false);
      if (lightboxInfoToggle) {
        lightboxInfoToggle.focus({ preventScroll: true });
      }
    });
  }
  lightboxViewToggles.forEach((button) => {
    button.addEventListener("click", () => {
      setLightboxControlsHidden(false);
      setLightboxThumbnailStripVisible(
        button.dataset.lightboxViewToggle === "thumbs"
          ? !isLightboxThumbnailStripOpen
          : false
      );
    });
  });
  lightboxThumbButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setLightboxControlsHidden(false);
      setLightboxActivePhoto(Number.parseInt(button.dataset.lightboxThumbIndex || "0", 10));
    });
  });
  if (lightboxFullscreenToggle) {
    lightboxFullscreenToggle.addEventListener("click", () => {
      const nextState = lightboxFullscreenToggle.getAttribute("aria-pressed") !== "true";
      lightboxFullscreenToggle.classList.toggle("is-active", nextState);
      lightboxFullscreenToggle.setAttribute("aria-pressed", String(nextState));
    });
  }
  window.addEventListener("keydown", handleLightboxKeydown);
  if (setDetailClose) {
    setDetailClose.addEventListener("click", closeSelectedSetDetail);
  }
  setsRows.forEach((row) => {
    row.addEventListener("click", () => {
      navigateToSetDetail(row);
    });
  });
  musicLandingRouteCards.forEach((card) => {
    const navigateToLandingRoute = () => {
      navigateToRoute(card.dataset.musicLandingRoute || routePaths.music);
    };
    card.addEventListener("click", navigateToLandingRoute);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        navigateToLandingRoute();
      }
    });
  });
  musicNexusCards.forEach((card) => {
    card.addEventListener("click", () => {
      const musicSection = card.dataset.musicNexusCard;
      if (musicSection === "bands") {
        navigateToRoute(getBandsRouteUrl("radar"));
        return;
      }
      if (musicSection === "people") {
        navigateToRoute(routePaths.musicPeople);
        return;
      }
      if (musicSection === "shows") {
        navigateToRoute(routePaths.musicShows);
        return;
      }
      if (musicSection === "venues") {
        navigateToRoute(routePaths.musicVenues);
        return;
      }
      const currentRoute = getRouteFromUrl().name;
      if (currentRoute === "music-bands" || currentRoute === "music-people" || currentRoute === "person-detail") {
        navigateToRoute(routePaths.music);
      }
      setMusicNexusContext(musicSection);
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        moveMusicNexusSelection(1);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        moveMusicNexusSelection(-1);
      } else if (event.key === "Home") {
        event.preventDefault();
        const firstCard = musicNexusCards[0];
        if (firstCard) {
          setMusicNexusContext(firstCard.dataset.musicNexusCard, true);
        }
      } else if (event.key === "End") {
        event.preventDefault();
        const lastCard = musicNexusCards[musicNexusCards.length - 1];
        if (lastCard) {
          setMusicNexusContext(lastCard.dataset.musicNexusCard, true);
        }
      }
    });
  });
  bandsViewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setBandsView(button.dataset.bandsViewTarget, true, { shouldRoute: true });
    });
  });
  if (bandsSearchInput) {
    bandsSearchInput.addEventListener("input", (event) => {
      setBandsSearchTerm(event.currentTarget.value);
    });
  }
  bandsSearchChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      setBandsSearchTerm(chip.dataset.bandsSearchTerm || "");
      setBandsView("search", true, { shouldRoute: true });
    });
  });
  bandsFilterSelects.forEach((select) => {
    select.addEventListener("change", (event) => {
      setBandsFilterValue(event.currentTarget.dataset.bandsFilter, event.currentTarget.value);
    });
  });
  bandsFilterResetButtons.forEach((button) => {
    button.addEventListener("click", clearBandsPanelFilters);
  });
  if (bandsBackRadar) {
    bandsBackRadar.addEventListener("click", returnToBandsRadar);
  }
  hydrateSetRouteMetadata();
  setBandsView("radar");
}
