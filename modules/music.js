/* =========================================================
   VMPix V3 Music module.
   Music Nexus, Bands Index, Band Detail, Sets Archive, Gallery, and Lightbox behavior.
   Extracted mechanically from router.js and shell.js; shell/router still own layout and route mounting.
   ========================================================= */

const MUSIC_BANDS_INDEX_API_BASE_URL = "https://vmpix-data.onrender.com";
const MUSIC_BANDS_INDEX_API_ROUTE = "/api/music/bands";
const MUSIC_BANDS_INDEX_TIMEOUT_MS = 8000;
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

function normalizeMusicPersonId(personId) {
  return String(personId || "").trim().toLowerCase();
}

function getMusicPersonRouteUrl(personId) {
  const normalizedPersonId = normalizeMusicPersonId(personId) || musicPersonDetailPlaceholder.personId;
  return `${routePaths.musicPeople}/${encodeURIComponent(normalizedPersonId)}`;
}

function findMusicPersonById(personId) {
  const normalizedPersonId = normalizeMusicPersonId(personId);
  return getMockRecordById("musicPeople", normalizedPersonId, ["personId", "id", "slug"]) || null;
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
  if (normalizedPersonId !== musicPersonDetailPlaceholder.personId) {
    return createMusicPersonDetailStateData("error", normalizedPersonId);
  }

  return { ...musicPersonDetailPlaceholder, state: "ready" };
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

function getSetCodeFromDateLabel(dateLabel) {
  const match = String(dateLabel || "").trim().toUpperCase().match(/^([A-Z]{3})\s+(\d{1,2}),\s+(\d{4})$/);
  if (!match) {
    return "";
  }

  const month = setDateMonthCodes[match[1]];
  if (!month) {
    return "";
  }

  const day = match[2].padStart(2, "0");
  const year = match[3].slice(-2);
  return `${month}${day}${year}`;
}

function getSetCode(row, fallbackIndex = 0) {
  if (!row || !row.dataset) {
    return "";
  }

  return normalizeSetCode(
    row.dataset.setCode ||
    getSetCodeFromDateLabel(row.dataset.setDate) ||
    String(fallbackIndex + 1).padStart(6, "0")
  );
}

function hydrateSetRouteMetadata() {
  setsRows.forEach((row, index) => {
    const setCode = normalizeSetCode(row.dataset.setCode || mockSetCodes[index] || getSetCodeFromDateLabel(row.dataset.setDate));
    if (setCode) {
      row.dataset.setCode = setCode;
    }
  });
}

function getSetRouteUrl(bandId, setCode) {
  return `${getBandRouteUrl(bandId)}/sets/${encodeURIComponent(normalizeSetCode(setCode))}`;
}

function findSetRowByCode(setCode) {
  const normalizedSetCode = normalizeSetCode(setCode);
  return Array.from(setsRows).find((row, index) => getSetCode(row, index) === normalizedSetCode) || null;
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
  const setCode = getSetCode(row, Array.from(setsRows).indexOf(row));
  const bandId = getBandId(activeMusicBand) || getRouteFromUrl().bandId;
  if (!bandId || !setCode) {
    return;
  }

  const historyState = window.history.state || {};
  const returnUrl = normalizeBandsReturnUrl(historyState.returnUrl || bandsIndexReturnUrl);
  bandsIndexReturnUrl = returnUrl;
  navigateToRoute(getSetRouteUrl(bandId, setCode), {
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
  if (route.name === "set-detail" && historyState.bandUrl && historyState.fromBandDetail) {
    window.history.back();
    return;
  }

  navigateToRoute(bandUrl, {
    historyState: {
      returnUrl: normalizeBandsReturnUrl(historyState.returnUrl || bandsIndexReturnUrl),
      fromBandsIndex: Boolean(historyState.fromBandsIndex),
    },
  });
}

function showSetDetailRoute(band, setCode) {
  if (!band) {
    return;
  }

  activeMusicBand = band;
  const setRow = findSetRowByCode(setCode);
  showSetsArchive({
    selectedSetCode: setCode,
    selectedSetRow: setRow,
    shouldOpenDetail: true,
    shouldScroll: false,
  });
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
    galleryPhotoTiles.forEach((tile) => {
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
    setDetailCopy.textContent = `${getSetImageLabel(row)} / SET DETAIL HOLDING STATE`;
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
  return Array.from(setsRows).find((candidate) => {
    const item = candidate.closest("li");
    return !item || !item.hidden;
  });
}

function getSetVenue(row) {
  if (!row) {
    return "Asylum";
  }

  if (row.dataset.setVenue) {
    return row.dataset.setVenue;
  }
  if ((row.dataset.setTitle || "").toLowerCase().includes("asylum")) {
    return "Asylum";
  }
  return "Archive Venue";
}

function getSetQuality(row) {
  if (!row) {
    return "Archive High";
  }

  if (row.dataset.setQuality) {
    return row.dataset.setQuality;
  }
  const completion = Number.parseInt(row.dataset.setComplete || "0", 10);
  return completion >= 70 ? "Archive High" : "Archive Review";
}

function getSetCamera(row) {
  return row && row.dataset.setCamera ? row.dataset.setCamera : "Canon R6 / 35mm";
}

function getSetNotes(row) {
  return row && row.dataset.setNotes
    ? row.dataset.setNotes
    : "Placeholder notes pending final caption pass.";
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
    setGalleryImage.setAttribute("aria-label", `${setData.setTitle} placeholder gallery image`);
    setGalleryImage.style.setProperty("--set-image-x", imageAccent.x);
    setGalleryImage.style.setProperty("--set-image-y", imageAccent.y);
    setGalleryImage.style.setProperty("--set-image-accent", imageAccent.color);
  }
  if (setGalleryThumb) {
    setGalleryThumb.textContent = getSetImageLabel(row);
  }
  if (setGalleryDate) {
    setGalleryDate.textContent = setData.setDate || "";
  }
  if (setGalleryTitle) {
    setGalleryTitle.textContent = setData.setTitle || "";
  }
  if (setGalleryCity) {
    setGalleryCity.textContent = setData.setLocation || "";
  }
  if (setGalleryVenue) {
    setGalleryVenue.textContent = getSetVenue(row);
  }
  if (setGalleryPhotos) {
    setGalleryPhotos.textContent = setData.setPhotos || "";
  }
  if (setGalleryContributors) {
    setGalleryContributors.textContent = setData.setContributors || "";
  }
  if (setGalleryQuality) {
    setGalleryQuality.textContent = getSetQuality(row);
  }
  if (setGalleryCamera) {
    setGalleryCamera.textContent = getSetCamera(row);
  }
  if (setGalleryNotes) {
    setGalleryNotes.textContent = getSetNotes(row);
  }
  if (setGalleryPhotoCount) {
    setGalleryPhotoCount.textContent = `${setData.setPhotos || "0"} Photos`;
  }
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
  galleryPhotoTiles.forEach((tile) => {
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
  if (galleryViewAll) {
    galleryViewAll.disabled = !shouldShowGrid;
    galleryViewAll.setAttribute("aria-disabled", String(!shouldShowGrid));
  }
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
  galleryPhotoTiles.forEach((tile) => {
    const isActive = tile === photoTile;
    tile.classList.toggle("is-active", isActive);
    tile.setAttribute("aria-pressed", String(isActive));
  });
  syncLightboxPrepTitle();
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
  if (galleryViewAll) {
    galleryViewAll.setAttribute("aria-expanded", String(isVisible));
    galleryViewAll.textContent = isVisible ? "GALLERY MODE OPEN" : "VIEW ALL PHOTOS";
  }
}

function toggleGalleryMode() {
  const nextState = !isGalleryModeOpen;
  if (!activeGalleryPhoto && galleryPhotoTiles[0]) {
    selectGalleryPhoto(galleryPhotoTiles[0]);
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
  const index = Array.from(galleryPhotoTiles).indexOf(photoTile);
  return index >= 0 ? index : 0;
}

function getGalleryPhotoImageSrc(photoTile) {
  const image = photoTile ? photoTile.querySelector(".archive-gallery-image") : null;
  return image && image.getAttribute("src")
    ? image.getAttribute("src")
    : galleryImageFallbackSrc;
}

function markLightboxTransitionSource(photoTile) {
  galleryPhotoTiles.forEach((tile) => {
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

function normalizeLightboxIndex(index) {
  const photoCount = Math.max(galleryPhotoTiles.length, 1);
  return ((index % photoCount) + photoCount) % photoCount;
}

function getLightboxPhotoData(index) {
  const normalizedIndex = normalizeLightboxIndex(index);
  const tile = galleryPhotoTiles[normalizedIndex] || null;
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
  if (lightboxMetaPeopleTags) {
    lightboxMetaPeopleTags.textContent = "Pending Curation";
  }
  if (lightboxMetaShow) {
    lightboxMetaShow.textContent = activeSetRow && activeSetRow.dataset.setTitle
      ? activeSetRow.dataset.setTitle
      : "Live @ Asylum";
  }
  if (lightboxMetaVenue) {
    lightboxMetaVenue.textContent = activeSetRow ? getSetVenue(activeSetRow) : "Asylum";
  }
  if (lightboxMetaDate) {
    lightboxMetaDate.textContent = activeSetRow && activeSetRow.dataset.setDate
      ? activeSetRow.dataset.setDate
      : "JAN 18, 2026";
  }
  if (lightboxMetaSource) {
    lightboxMetaSource.textContent = data.mediaId || "Static V3 Placeholder";
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
  const targetTile = requestedTile || activeGalleryPhoto || galleryPhotoTiles[0] || null;
  if (targetTile) {
    selectGalleryPhoto(targetTile);
  }
  markLightboxTransitionSource(targetTile);
  setGalleryModeVisible(false);
  setLightboxActivePhoto(getGalleryPhotoIndex(targetTile), { forceTransition: true, shouldSyncGallery: false });
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
  setCurrentView("LIVE @ ASYLUM");
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
  const row = activeSetRow || getFirstVisibleSetRow() || setsRows[0];
  if (!row) {
    return;
  }

  updateSetsFeaturedFromRow(row);
  updateSetDetailFromRow(row);
  setSetDetailVisible(true);
  if (setDetailClose) {
    setDetailClose.focus({ preventScroll: true });
  }
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
  const row = activeSetRow || getFirstVisibleSetRow() || setsRows[0];
  if (!row || !setGallery) {
    return;
  }

  updateSetsFeaturedFromRow(row);
  updateSetGalleryFromRow(row);
  setGalleryState("ready");
  setSetDetailVisible(false);
  setSetsArchiveVisible(false);
  setSetGalleryVisible(true);
  setGalleryModeVisible(false);
  if (galleryPhotoTiles[0]) {
    selectGalleryPhoto(galleryPhotoTiles[0]);
  }
  setCurrentView("LIVE @ ASYLUM");
  if (musicNexusShell) {
    musicNexusShell.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }
}

function returnToSetsArchiveFromGallery() {
  setSetGalleryVisible(false);
  setSetsArchiveVisible(true);
  setCurrentView("SETS 13 HIGH");
  if (musicNexusShell) {
    musicNexusShell.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }
}

function updateSetsFeaturedFromRow(row) {
  if (!row) {
    return;
  }

  activeSetRow = row;
  setsRows.forEach((candidate) => {
    const isActive = candidate === row;
    candidate.classList.toggle("is-active", isActive);
    candidate.setAttribute("aria-pressed", String(isActive));
  });

  const setData = row.dataset;
  const imageAccent = getSetImageAccent(row);
  if (setsFeaturedImage) {
    setsFeaturedImage.setAttribute("aria-label", `${setData.setTitle} placeholder featured set image`);
    setsFeaturedImage.style.setProperty("--set-image-x", imageAccent.x);
    setsFeaturedImage.style.setProperty("--set-image-y", imageAccent.y);
    setsFeaturedImage.style.setProperty("--set-image-accent", imageAccent.color);
  }
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
  if (setsFeaturedPhotos) {
    setsFeaturedPhotos.textContent = setData.setPhotos || "";
  }
  if (setsFeaturedContributors) {
    setsFeaturedContributors.textContent = setData.setContributors || "";
  }
  if (setsFeaturedComplete) {
    setsFeaturedComplete.textContent = setData.setComplete || "";
  }
  if (isSetDetailOpen) {
    updateSetDetailFromRow(row);
  }
}

function setSetsYear(year, options = {}) {
  let firstVisibleRow = null;

  setsYearButtons.forEach((button) => {
    const isActive = button.dataset.setsYear === year;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    if (isActive && options.shouldCenterYear) {
      button.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: reducedMotion.matches ? "auto" : "smooth",
      });
    }
  });

  setsRows.forEach((row) => {
    const isVisible = row.dataset.setYear === year;
    const rowItem = row.closest("li");
    if (rowItem) {
      rowItem.hidden = !isVisible;
    }
    if (isVisible && !firstVisibleRow) {
      firstVisibleRow = row;
    }
  });

  if (setsListYearLabel) {
    setsListYearLabel.textContent = year;
  }
  updateSetsFeaturedFromRow(firstVisibleRow);
  if (options.shouldFocus && firstVisibleRow) {
    firstVisibleRow.focus({ preventScroll: true });
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
  const bandThumb = band.thumb || band.name.slice(0, 2).toUpperCase();
  if (setsArchiveBand) {
    setsArchiveBand.textContent = band.name;
  }
  setsRows.forEach((row) => {
    row.dataset.setThumb = bandThumb;
    const thumb = row.querySelector(".sets-row-thumb");
    if (thumb) {
      thumb.textContent = bandThumb;
    }
  });

  setBandsIndexVisible(false);
  setBandDetailVisible(false);
  setSetsArchiveVisible(true);
  setSetDetailVisible(false);
  setSetsYear(selectedSetRow ? selectedSetRow.dataset.setYear : "2026");
  if (selectedSetRow) {
    updateSetsFeaturedFromRow(selectedSetRow);
  }
  if (options.shouldOpenDetail) {
    updateSetDetailFromRow(selectedSetRow || createUnknownSetRow(selectedSetCode));
    setSetDetailVisible(true);
    setCurrentView("Set Detail");
  } else {
    setCurrentView("SETS 13 HIGH");
  }
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

  meta.append(region, status);
  if (shouldShowArchiveSize) {
    meta.append(stats);
  }
  main.append(name, meta);
  row.append(thumb, main, arrow);
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

function getMusicPeoplePageCount() {
  return Math.max(1, Math.ceil(musicPeopleRows.length / musicPeoplePageSize));
}

function normalizeMusicPeoplePage(page) {
  const pageNumber = Number.parseInt(page, 10) || 1;
  return Math.min(Math.max(pageNumber, 1), getMusicPeoplePageCount());
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

function createMusicPersonMetaLine(items, className) {
  const line = document.createElement("p");
  line.className = className;
  line.textContent = items.join(" \u2022 ");
  return line;
}

function createMusicPersonTag(text) {
  const tag = document.createElement("span");
  tag.className = "person-detail-band-tag";
  tag.textContent = text;
  return tag;
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
  summary.setAttribute("aria-label", `${show.title}, ${show.venue}, ${show.location}, ${formatMusicPeopleCount(show.taggedPhotos, "tagged photo")}`);

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

  const thumb = document.createElement("span");
  thumb.className = "person-show-thumb";
  thumb.setAttribute("aria-hidden", "true");
  thumb.textContent = show.thumb;

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

  const count = document.createElement("span");
  count.className = "person-show-count";
  count.textContent = formatMusicPeopleCount(show.taggedPhotos, "Tagged Photo");

  const toggle = document.createElement("span");
  toggle.className = "person-show-toggle";
  toggle.setAttribute("aria-hidden", "true");
  toggle.textContent = isExpanded ? "-" : "+";

  summary.append(date, thumb, copy, count, toggle);
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
  backButton.textContent = "Back to People";
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
  backButton.textContent = "Back to People";
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

  const kicker = document.createElement("p");
  kicker.className = "person-detail-kicker";
  kicker.textContent = "Music Person";

  const name = document.createElement("h3");
  name.className = "person-detail-name";
  name.id = "person-detail-title";
  name.textContent = data.name;

  copy.append(
    kicker,
    name,
    createMusicPersonMetaLine(data.roleItems, "person-detail-role-line"),
    createMusicPersonMetaLine(data.summaryItems, "person-detail-meta-line"),
    createMusicPersonMetaLine(data.seenItems, "person-detail-seen-line")
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
    associatedBands.forEach((bandName) => {
      associatedList.append(createMusicPersonTag(bandName));
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
  setMusicActivityPanelVisible(false);
  setMusicPersonDetailVisible(true);
  setCurrentView("Person Detail");
  if (musicNexusShell) {
    musicNexusShell.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }
}

function returnToMusicPeopleRoute() {
  const historyState = window.history.state || {};
  if (getRouteFromUrl().name === "person-detail" && historyState.fromPeopleIndex) {
    window.history.back();
    return;
  }

  navigateToRoute(routePaths.musicPeople);
}

function createMusicPeopleRow(person) {
  const row = document.createElement("button");
  row.className = "music-people-row";
  row.type = "button";
  row.dataset.personId = person.personId;
  row.classList.toggle("is-active", person.personId === activeMusicPeopleId);
  row.setAttribute("aria-pressed", String(person.personId === activeMusicPeopleId));
  row.setAttribute(
    "aria-label",
    `${person.name}, ${person.role}, ${person.band}, ${formatMusicPeopleCount(person.photos, "Photo")}, ${formatMusicPeopleCount(person.sets, "Set")}`
  );

  const thumb = document.createElement("span");
  thumb.className = "music-people-thumb";
  thumb.setAttribute("aria-hidden", "true");
  thumb.textContent = person.thumb || person.name.slice(0, 2).toUpperCase();

  const main = document.createElement("span");
  main.className = "music-people-main";

  const name = document.createElement("span");
  name.className = "music-people-name";
  name.textContent = person.name;

  const meta = document.createElement("span");
  meta.className = "music-people-meta";

  const role = document.createElement("span");
  role.className = "music-people-role";
  role.textContent = person.role;

  const band = document.createElement("span");
  band.className = "music-people-band";
  band.textContent = person.band;

  const counts = document.createElement("span");
  counts.className = "music-people-counts";
  counts.setAttribute("aria-hidden", "true");

  const photoCount = document.createElement("span");
  photoCount.className = "music-people-count-pill";
  photoCount.textContent = formatMusicPeopleCount(person.photos, "Photo");

  const setCount = document.createElement("span");
  setCount.className = "music-people-count-pill";
  setCount.textContent = formatMusicPeopleCount(person.sets, "Set");

  const arrow = document.createElement("span");
  arrow.className = "music-people-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = ">";

  meta.append(role, band);
  main.append(name, meta);
  counts.append(photoCount, setCount);
  row.append(thumb, main, counts, arrow);
  row.addEventListener("click", () => {
    setActiveMusicPeopleRow(person.personId);
    navigateToRoute(getMusicPersonRouteUrl(person.personId), { historyState: { fromPeopleIndex: true } });
  });

  return row;
}

function setMusicPeoplePage(page, options = {}) {
  const nextPage = normalizeMusicPeoplePage(page);
  if (activeMusicPeoplePage === nextPage && !options.forceRender) {
    return;
  }

  activeMusicPeoplePage = nextPage;
  renderMusicPeopleIndex({ shouldResetScroll: options.shouldResetScroll !== false });
}

function renderMusicPeoplePagination() {
  if (!musicPeopleIndex) {
    return;
  }

  const forcedState = getForcedMockState("musicPeople");
  const pageCount = getMusicPeoplePageCount();
  let pagination = musicPeopleIndex.querySelector("[data-music-people-pagination]");
  if (!pagination) {
    pagination = document.createElement("nav");
    pagination.className = "music-people-pagination";
    pagination.dataset.musicPeoplePagination = "";
    pagination.setAttribute("aria-label", "Music people archive pages");
    musicPeopleIndex.append(pagination);
  }

  if (forcedState && forcedState !== "partial") {
    pagination.replaceChildren();
    pagination.hidden = true;
    return;
  }

  pagination.hidden = false;
  const fragment = document.createDocumentFragment();
  const previous = document.createElement("button");
  previous.className = "music-people-page-button music-people-page-button--step";
  previous.type = "button";
  previous.textContent = "<";
  previous.disabled = activeMusicPeoplePage === 1;
  previous.setAttribute("aria-label", "Previous people page");
  previous.addEventListener("click", () => {
    setMusicPeoplePage(activeMusicPeoplePage - 1);
  });
  fragment.append(previous);

  for (let page = 1; page <= pageCount; page += 1) {
    const pageButton = document.createElement("button");
    const isActive = page === activeMusicPeoplePage;
    pageButton.className = "music-people-page-button";
    pageButton.type = "button";
    pageButton.textContent = String(page);
    pageButton.setAttribute("aria-label", `People page ${page}`);
    pageButton.setAttribute("aria-current", isActive ? "page" : "false");
    pageButton.setAttribute("aria-pressed", String(isActive));
    pageButton.addEventListener("click", () => {
      setMusicPeoplePage(page);
    });
    fragment.append(pageButton);
  }

  const next = document.createElement("button");
  next.className = "music-people-page-button music-people-page-button--step";
  next.type = "button";
  next.textContent = ">";
  next.disabled = activeMusicPeoplePage === pageCount;
  next.setAttribute("aria-label", "Next people page");
  next.addEventListener("click", () => {
    setMusicPeoplePage(activeMusicPeoplePage + 1);
  });
  fragment.append(next);

  const status = document.createElement("span");
  status.className = "music-people-pagination-status";
  status.textContent = `${activeMusicPeoplePage} / ${pageCount}`;
  fragment.append(status);

  pagination.replaceChildren(fragment);
}

function renderMusicPeopleIndex(options = {}) {
  if (!musicPeopleList) {
    return;
  }

  const forcedState = getForcedMockState("musicPeople");
  activeMusicPeoplePage = normalizeMusicPeoplePage(activeMusicPeoplePage);
  const pageStart = (activeMusicPeoplePage - 1) * musicPeoplePageSize;
  const pageRows = musicPeopleRows.slice(pageStart, pageStart + musicPeoplePageSize);
  const fragment = document.createDocumentFragment();
  if (forcedState && forcedState !== "partial") {
    renderMockState(fragment, forcedState, "musicPeople");
  } else {
    pageRows.forEach((person) => {
    fragment.append(createMusicPeopleRow(person));
    });
    if (forcedState === "partial") {
      fragment.append(createMockStateCard("partial", "musicPeople"));
    }
  }
  musicPeopleList.replaceChildren(fragment);
  renderMusicPeoplePagination();

  if (options.shouldResetScroll && typeof musicPeopleList.scrollTo === "function") {
    musicPeopleList.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }
}

const musicShowsYearOptions = ["ALL SHOWS", "2026", "2025", "2024", "2023", "2022", "2021", "MORE"];
const musicShowsInitialVisibleCount = 4;
const musicShowsPageSize = 4;
const musicShowsStateCopy = {
  empty: {
    title: "No Shows Found",
    copy: "No archive cards are staged for this year yet.",
  },
  loading: {
    title: "Loading Shows Archive",
    copy: "Archive cards are being prepared.",
  },
  error: {
    title: "Unable To Load Archive",
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

function getMusicShowRouteUrl(show) {
  return `/music/shows/${encodeURIComponent(show.showId || "")}`;
}

function findMusicShowById(showId) {
  return getMockRecordById("musicShows", showId, ["showId", "id", "slug", "show_id"]) || null;
}

function createUnknownMusicShow(showId) {
  const safeShowId = String(showId || "unknown-show").trim() || "unknown-show";
  return {
    showId: safeShowId,
    month: "TBD",
    day: "00",
    year: "Pending",
    title: "Show Detail Event Dossier",
    venue: "Pending Venue",
    location: "Pending City",
    bandCount: "0 bands",
    poster: "SD",
  };
}

function getMusicShowBandCount(show) {
  const match = String(show.bandCount || "").match(/\d+/);
  return match ? match[0] : "0";
}

function getMusicShowPhotoCount(show) {
  const bands = Number.parseInt(getMusicShowBandCount(show), 10) || 0;
  return String(Math.max(48, bands * 54));
}

function getMusicShowDateLabel(show) {
  return `${show.month} ${show.day}, ${show.year}`;
}

function getMusicShowDisplayId(show) {
  const month = String(musicShowsMonthOrder[String(show.month || "").toUpperCase()] || "0").padStart(2, "0");
  const day = String(show.day || "00").padStart(2, "0");
  const yearText = String(show.year || "");
  const year = /^\d{4}$/.test(yearText) ? yearText.slice(-2) : "00";
  return `${show.poster || "SD"}-${month}${day}${year}`;
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
  const year = Number.parseInt(show.year || "0", 10);
  const month = musicShowsMonthOrder[String(show.month || "").toUpperCase()] || 0;
  const day = Number.parseInt(show.day || "0", 10);
  return (year * 10000) + (month * 100) + day;
}

function getSortedMusicShows(rows = musicShowsArchiveRows) {
  return sortMockCollection(rows, (left, right) => getMusicShowTimestamp(right) - getMusicShowTimestamp(left));
}

function getFilteredMusicShows() {
  const sortedRows = getSortedMusicShows();
  if (activeMusicShowsYear === "ALL SHOWS") {
    return sortedRows;
  }
  if (activeMusicShowsYear === "MORE") {
    return filterMockCollection(sortedRows, (show) => Number.parseInt(show.year || "0", 10) <= 2020);
  }
  return filterMockCollection(sortedRows, { year: activeMusicShowsYear });
}

function updateMusicShowsYearSelection(yearLabel) {
  activeMusicShowsYear = musicShowsYearOptions.includes(yearLabel) ? yearLabel : "ALL SHOWS";
  visibleMusicShowsCount = musicShowsInitialVisibleCount;
  renderMusicShowsArchive();
}

function loadMoreMusicShows() {
  const filteredRows = getFilteredMusicShows();
  visibleMusicShowsCount = Math.min(filteredRows.length, visibleMusicShowsCount + musicShowsPageSize);
  renderMusicShowsArchive();
}

function getMusicShowsEmptyCopy() {
  if (activeMusicShowsYear === "MORE") {
    return {
      title: "Older Shows Pending",
      copy: "Pre-2021 archive cards are reserved for a later import.",
    };
  }
  if (activeMusicShowsYear !== "ALL SHOWS") {
    return {
      title: "No Shows Found",
      copy: `${activeMusicShowsYear} archive cards are not staged yet.`,
    };
  }
  return musicShowsStateCopy.empty;
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
  const status = musicActivityPanel.querySelector("[data-music-shows-status]");
  if (status) {
    status.textContent = `Show Detail Event Dossier hook ready: ${show.title}`;
  }
  navigateToRoute(showRoute, { historyState: { fromShowsArchive: true } });
}

function createMusicShowsYearButton(label, isActive = false) {
  const button = document.createElement("button");
  button.className = "music-shows-year";
  button.type = "button";
  button.textContent = label;
  button.setAttribute("aria-pressed", String(isActive));
  button.addEventListener("click", () => {
    updateMusicShowsYearSelection(label);
  });
  return button;
}

function createMusicShowsCard(show) {
  const card = document.createElement("article");
  card.className = "music-show-card";
  card.dataset.showDetailRoute = getMusicShowRouteUrl(show);

  const date = document.createElement("div");
  date.className = "music-show-date";
  date.setAttribute("aria-label", `${show.month} ${show.day}, ${show.year}`);

  const month = document.createElement("span");
  month.className = "music-show-month";
  month.textContent = show.month;

  const day = document.createElement("span");
  day.className = "music-show-day";
  day.textContent = show.day;

  const year = document.createElement("span");
  year.className = "music-show-year";
  year.textContent = show.year;
  date.append(month, day, year);

  const poster = document.createElement("div");
  poster.className = "music-show-poster";
  poster.setAttribute("role", "img");
  poster.setAttribute("aria-label", `${show.title} poster placeholder`);
  poster.dataset.posterMark = show.poster;

  const posterMark = document.createElement("span");
  posterMark.className = "music-show-poster-mark";
  posterMark.setAttribute("aria-hidden", "true");
  posterMark.textContent = show.poster;
  poster.append(posterMark);

  const body = document.createElement("div");
  body.className = "music-show-body";

  const title = document.createElement("h5");
  title.className = "music-show-title";
  title.textContent = show.title;

  const venue = document.createElement("p");
  venue.className = "music-show-venue";
  venue.textContent = show.venue;

  const location = document.createElement("p");
  location.className = "music-show-location";
  location.textContent = show.location;

  const footer = document.createElement("div");
  footer.className = "music-show-footer";

  const bandCount = document.createElement("span");
  bandCount.className = "music-show-band-count";
  bandCount.textContent = show.bandCount;

  const action = document.createElement("button");
  action.className = "music-show-action";
  action.type = "button";
  action.textContent = "View Details";
  action.dataset.showDetailRoute = getMusicShowRouteUrl(show);
  action.setAttribute("aria-label", `View Details for ${show.title}`);
  action.addEventListener("click", () => {
    selectMusicShowDetailHook(show);
  });

  footer.append(bandCount, action);
  body.append(title, venue, location, footer);
  card.append(date, poster, body);
  return card;
}

function renderMusicShowsArchive() {
  if (!musicActivityPanel || !musicActivityList) {
    return;
  }

  const title = musicActivityPanel.querySelector(".music-nexus-section-title");
  if (title) {
    title.textContent = "";
    title.classList.add("sr-only");
  }

  musicActivityPanel.classList.add("music-shows-archive");
  musicActivityList.className = "music-shows-grid";
  musicActivityList.setAttribute("aria-label", "Shows archive placeholder cards");
  musicActivityList.replaceChildren();

  const yearBar = document.createElement("nav");
  yearBar.className = "music-shows-years";
  yearBar.dataset.musicShowsYears = "";
  yearBar.setAttribute("aria-label", "Shows archive years");
  musicShowsYearOptions.forEach((yearLabel) => {
    yearBar.append(createMusicShowsYearButton(yearLabel, yearLabel === activeMusicShowsYear));
  });
  const existingYearBar = musicActivityPanel.querySelector("[data-music-shows-years]");
  if (existingYearBar) {
    existingYearBar.remove();
  }
  musicActivityPanel.insertBefore(yearBar, musicActivityList);

  const existingNav = musicActivityPanel.querySelector("[data-music-shows-nav]");
  if (existingNav) {
    existingNav.remove();
  }
  const existingTemplates = musicActivityPanel.querySelector("[data-music-shows-state-templates]");
  if (existingTemplates) {
    existingTemplates.remove();
  }

  const forcedState = getForcedMockState("musicShows");
  const filteredRows = getFilteredMusicShows();
  const visibleRows = filteredRows.slice(0, visibleMusicShowsCount);
  const fragment = document.createDocumentFragment();
  if (forcedState && forcedState !== "partial") {
    renderMockState(fragment, forcedState, "musicShows", { itemTag: "li", itemClass: "music-shows-empty" });
  } else {
    visibleRows.forEach((show) => {
    const item = document.createElement("li");
    item.className = "music-shows-item";
    item.append(createMusicShowsCard(show));
    fragment.append(item);
    });
    if (forcedState === "partial") {
      renderMockState(fragment, "partial", "musicShows", { itemTag: "li", itemClass: "music-shows-empty" });
    }
  }
  if (!forcedState && visibleRows.length === 0) {
    const empty = document.createElement("li");
    empty.className = "music-shows-empty";
    empty.append(createMusicShowsState("empty", getMusicShowsEmptyCopy()));
    fragment.append(empty);
  }

  musicActivityList.append(fragment);
  musicActivityPanel.append(createMusicShowsStateTemplates());

  const nav = document.createElement("footer");
  nav.className = "music-shows-nav";
  nav.dataset.musicShowsNav = "";

  const status = document.createElement("p");
  status.className = "music-shows-status";
  status.dataset.musicShowsStatus = "";
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / musicShowsPageSize));
  const currentPage = Math.max(1, Math.ceil(Math.min(visibleMusicShowsCount, filteredRows.length || 1) / musicShowsPageSize));
  status.textContent = forcedState && forcedState !== "partial"
    ? getMockStateCopy(forcedState, "musicShows").title
    : `${visibleRows.length} of ${filteredRows.length} shows / Page ${currentPage} of ${pageCount}`;

  const loadMore = document.createElement("button");
  loadMore.className = "music-shows-load-more";
  loadMore.type = "button";
  loadMore.textContent = "Load More";
  loadMore.disabled = Boolean(forcedState && forcedState !== "partial") || visibleRows.length >= filteredRows.length;
  loadMore.addEventListener("click", loadMoreMusicShows);

  nav.append(status, loadMore);
  musicActivityPanel.append(nav);
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
  const existingNav = musicActivityPanel.querySelector("[data-music-shows-nav]");
  if (existingNav) {
    existingNav.remove();
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
  poster.setAttribute("aria-label", `${show.title} show flyer placeholder`);

  const posterMark = document.createElement("span");
  posterMark.className = "show-detail-poster-mark";
  posterMark.textContent = show.poster || "SD";
  poster.append(posterMark);

  const copy = document.createElement("div");
  copy.className = "show-detail-copy";

  const eyebrow = document.createElement("p");
  eyebrow.className = "show-detail-eyebrow";
  eyebrow.textContent = "Show Detail Event Dossier";

  const title = document.createElement("h3");
  title.className = "show-detail-title";
  title.id = "show-detail-title";
  title.textContent = show.title;

  const details = document.createElement("div");
  details.className = "show-detail-lines";

  [getMusicShowDateLabel(show), show.venue, show.location].forEach((detailText) => {
    const detail = document.createElement("p");
    detail.className = "show-detail-line";
    detail.textContent = detailText;
    details.append(detail);
  });

  const mapButton = document.createElement("button");
  mapButton.className = "show-detail-map";
  mapButton.type = "button";
  mapButton.textContent = "Map";
  mapButton.dataset.venueId = relationships.venue_id;
  mapButton.setAttribute("aria-label", `Map placeholder for ${show.venue}`);

  const stats = document.createElement("div");
  stats.className = "show-detail-stats";
  stats.append(
    createShowDetailStat("Bands", relationships.band_count),
    createShowDetailStat("Photos", relationships.media_counts.photos),
    createShowDetailStat("Year", show.year || "Pending")
  );

  copy.append(eyebrow, title, details, mapButton, stats);
  hero.append(poster, copy);

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
  showDetail.replaceChildren(backButton, hero, viewing, createShowDetailRelationships(relationships));
}

function showMusicShowDetail(showId) {
  const show = findMusicShowById(showId) || createUnknownMusicShow(showId);
  renderMusicShowDetail(show);
  setBandsIndexVisible(false);
  setPeopleIndexVisible(false);
  setMusicActivityPanelVisible(false);
  setMusicShowDetailVisible(true);
  setCurrentView("Show Detail");
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
    renderMusicPeopleIndex({ shouldResetScroll: false });
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
  setVenueDetailVisible(sectionName === "venues");
  if (sectionName === "bands") {
    syncBandsIndex();
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
    setCurrentView(sectionName === "venues" ? "Venue Detail" : activeCardLabel);
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
  if (bandDetailViewSets) {
    bandDetailViewSets.addEventListener("click", () => {
      showSetsArchive();
    });
  }
  if (setsArchiveBack) {
    setsArchiveBack.addEventListener("click", returnToBandDetailRoute);
  }
  if (setsFeaturedOpen) {
    setsFeaturedOpen.addEventListener("click", showSetGallery);
  }
  if (setGalleryBack) {
    setGalleryBack.addEventListener("click", returnToSetsArchiveFromGallery);
  }
  galleryPhotoTiles.forEach((tile) => {
    protectArchiveImage(tile.querySelector(".archive-gallery-image"));
    tile.addEventListener("click", () => {
      showLightbox(tile);
    });
  });
  if (galleryViewAll) {
    galleryViewAll.addEventListener("click", () => {
      showLightbox();
    });
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
  setsYearButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setSetsYear(button.dataset.setsYear, { shouldCenterYear: true });
    });
  });
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
