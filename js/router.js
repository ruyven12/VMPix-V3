/* =========================================================
   VMPix V3 router.
   History API route parsing, canonical URLs, and route mounting helpers.
   Extracted from the original single-file shell; keep this pass mechanical.
   ========================================================= */

function normalizeBandsView(viewName) {
  return routedBandsViews.includes(viewName) ? viewName : "radar";
}

function getBandsRouteUrl(viewName = activeBandsView) {
  return `${routePaths.musicBands}?view=${normalizeBandsView(viewName)}`;
}

function getBandId(band) {
  return band && typeof band.bandId === "string" ? band.bandId.trim() : "";
}

function getBandRouteUrl(bandId) {
  return `${routePaths.musicBands}/${encodeURIComponent(String(bandId || "").trim())}`;
}

function findBandById(bandId) {
  return musicBandIndexRows.find((band) => getBandId(band) === bandId) || null;
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

function decodeRoutePart(routePart) {
  try {
    return decodeURIComponent(routePart);
  } catch (error) {
    return "";
  }
}

function normalizeRoutePath(pathname) {
  const routePath = pathname.replace(/\/+$/, "") || routePaths.home;
  return routePath.endsWith("/index.html") ? routePaths.home : routePath;
}

function getPathWithSearch(url = window.location.href) {
  const routeUrl = new URL(url, window.location.href);
  return `${routeUrl.pathname}${routeUrl.search}`;
}

function getRouteFromUrl(url = window.location.href) {
  const routeUrl = new URL(url, window.location.href);
  const routePath = normalizeRoutePath(routeUrl.pathname);

  if (routePath === routePaths.home) {
    return { name: "home", canonicalUrl: routePaths.home };
  }
  if (routePath === routePaths.portfolio) {
    return { name: "portfolio", canonicalUrl: routePaths.portfolio };
  }
  if (routePath === routePaths.music) {
    return { name: "music", canonicalUrl: routePaths.music };
  }
  if (routePath === routePaths.musicBands) {
    const view = normalizeBandsView(routeUrl.searchParams.get("view"));
    return { name: "music-bands", view, canonicalUrl: getBandsRouteUrl(view) };
  }

  const bandDetailPrefix = `${routePaths.musicBands}/`;
  if (routePath.startsWith(bandDetailPrefix)) {
    const routeParts = routePath.slice(bandDetailPrefix.length).split("/");
    if (routeParts.length === 1 && routeParts[0]) {
      const bandId = decodeRoutePart(routeParts[0]);
      return { name: "band-detail", bandId, canonicalUrl: getBandRouteUrl(bandId) };
    }
    if (routeParts.length === 3 && routeParts[0] && routeParts[1] === "sets" && routeParts[2]) {
      const bandId = decodeRoutePart(routeParts[0]);
      const setCode = normalizeSetCode(decodeRoutePart(routeParts[2]));
      return { name: "set-detail", bandId, setCode, canonicalUrl: getSetRouteUrl(bandId, setCode) };
    }
  }

  return { name: "home", canonicalUrl: routePaths.home, isUnknown: true };
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

function pushRouteUrl(url, state = {}) {
  if (!window.history || typeof window.history.pushState !== "function") {
    return;
  }

  const targetUrl = new URL(url, window.location.href);
  const targetPath = `${targetUrl.pathname}${targetUrl.search}`;
  const routeState = { ...state, route: targetPath };
  if (targetPath !== getPathWithSearch()) {
    window.history.pushState(routeState, "", targetPath);
  } else if (Object.keys(state).length > 0) {
    window.history.replaceState({ ...(window.history.state || {}), ...routeState }, "", targetPath);
  }
}

function replaceRouteUrl(url, state = {}) {
  if (!window.history || typeof window.history.replaceState !== "function") {
    return;
  }

  const targetUrl = new URL(url, window.location.href);
  const targetPath = `${targetUrl.pathname}${targetUrl.search}`;
  const routeState = { ...state, route: targetPath };
  if (targetPath !== getPathWithSearch()) {
    window.history.replaceState(routeState, "", targetPath);
  } else if (Object.keys(state).length > 0) {
    window.history.replaceState({ ...(window.history.state || {}), ...routeState }, "", targetPath);
  }
}

function syncRoute(route, options = {}) {
  if (route.name === "home") {
    showHomepage();
    return;
  }

  if (route.name === "portfolio") {
    if (options.shouldAnimatePortal) {
      activatePortal();
    } else {
      revealHub();
    }
    return;
  }

  if (route.name === "music") {
    showMusicNexus();
    setBandsView("radar");
    return;
  }

  if (route.name === "music-bands") {
    bandsIndexReturnUrl = route.canonicalUrl;
    showMusicNexus();
    setBandsView(route.view, Boolean(options.shouldFocusBandsView));
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl);
    }
    return;
  }

  if (route.name === "band-detail") {
    const historyState = options.historyState || window.history.state || {};
    bandsIndexReturnUrl = normalizeBandsReturnUrl(historyState.returnUrl || bandsIndexReturnUrl);
    showMusicNexus();
    showBandDetail(findBandById(route.bandId) || createUnknownBand(route.bandId));
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl, {
        returnUrl: bandsIndexReturnUrl,
        fromBandsIndex: Boolean(historyState.fromBandsIndex),
      });
    }
    return;
  }

  if (route.name === "set-detail") {
    const historyState = options.historyState || window.history.state || {};
    bandsIndexReturnUrl = normalizeBandsReturnUrl(
      historyState.returnUrl ||
      (historyState.fromBandDetail ? bandsIndexReturnUrl : getBandsRouteUrl("radar"))
    );
    showMusicNexus();
    showSetDetailRoute(findBandById(route.bandId) || createUnknownBand(route.bandId), route.setCode);
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl, {
        bandUrl: getBandRouteUrl(route.bandId),
        returnUrl: bandsIndexReturnUrl,
        fromBandDetail: Boolean(historyState.fromBandDetail),
        fromBandsIndex: Boolean(historyState.fromBandsIndex),
      });
    }
    return;
  }

  showHomepage();
}

function syncRouteFromLocation(options = {}) {
  syncRoute(getRouteFromUrl(), options);
}

function navigateToRoute(url, options = {}) {
  const route = getRouteFromUrl(url);
  const targetUrl = route.isUnknown ? url : route.canonicalUrl;
  pushRouteUrl(targetUrl, options.historyState || {});
  syncRoute(route, { ...options, shouldCanonicalize: false });
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
