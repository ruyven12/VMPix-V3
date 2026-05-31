/* =========================================================
   VMPix V3 router.
   History API route parsing, canonical URLs, and route mounting helpers.
   Extracted from the original single-file shell; keep this pass mechanical.
   ========================================================= */

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
  if (routePath === routePaths.musicShows) {
    return { name: "music-shows", canonicalUrl: routePaths.musicShows };
  }
  if (routePath === routePaths.musicPeople) {
    return { name: "music-people", canonicalUrl: routePaths.musicPeople };
  }
  if (routePath === routePaths.musicVenues) {
    return { name: "music-venues", canonicalUrl: routePaths.musicVenues };
  }
  if (routePath === routePaths.wrestling) {
    return { name: "wrestling", canonicalUrl: routePaths.wrestling };
  }
  if (routePath === routePaths.wrestlingShows) {
    return { name: "wrestling-shows", canonicalUrl: routePaths.wrestlingShows };
  }
  if (routePath === routePaths.calendar) {
    return { name: "calendar", canonicalUrl: routePaths.calendar };
  }
  if (routePath === routePaths.about) {
    return { name: "about", canonicalUrl: routePaths.about };
  }
  if (routePath === routePaths.contact) {
    return { name: "contact", canonicalUrl: routePaths.contact };
  }

  const personDetailPrefix = `${routePaths.musicPeople}/`;
  if (routePath.startsWith(personDetailPrefix)) {
    const routeParts = routePath.slice(personDetailPrefix.length).split("/");
    if (routeParts.length === 1 && routeParts[0]) {
      const personId = decodeRoutePart(routeParts[0]);
      return { name: "person-detail", personId, canonicalUrl: getMusicPersonRouteUrl(personId) };
    }
  }

  const showDetailPrefix = `${routePaths.musicShows}/`;
  if (routePath.startsWith(showDetailPrefix)) {
    const routeParts = routePath.slice(showDetailPrefix.length).split("/");
    if (routeParts.length === 1 && routeParts[0]) {
      const showId = decodeRoutePart(routeParts[0]);
      return { name: "show-detail", showId, canonicalUrl: getMusicShowRouteUrl({ showId }) };
    }
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
    return;
  }

  if (route.name === "music-shows") {
    showMusicNexus({ initialSection: "shows", currentView: "Shows" });
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl);
    }
    return;
  }

  if (route.name === "music-people") {
    showMusicNexus({ initialSection: "people", currentView: "People" });
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl);
    }
    return;
  }

  if (route.name === "music-venues") {
    showMusicNexus({ initialSection: "landing", currentView: "Venues" });
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl);
    }
    return;
  }

  if (route.name === "wrestling") {
    showRingArchive();
    return;
  }

  if (route.name === "wrestling-shows") {
    showWrestlingShowsIndex();
    return;
  }

  if (route.name === "calendar") {
    showCalendarShell();
    return;
  }

  if (route.name === "about") {
    showAboutShell();
    return;
  }

  if (route.name === "contact") {
    showContactShell();
    return;
  }

  if (route.name === "person-detail") {
    showMusicNexus({ initialSection: "people", currentView: "Person Detail" });
    showMusicPersonDetail(route.personId);
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl);
    }
    return;
  }

  if (route.name === "show-detail") {
    showMusicNexus({ initialSection: "shows", currentView: "Show Detail" });
    showMusicShowDetail(route.showId);
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl);
    }
    return;
  }

  if (route.name === "music-bands") {
    bandsIndexReturnUrl = route.canonicalUrl;
    showMusicNexus({ initialSection: "bands", currentView: "Bands" });
    setBandsView(route.view, Boolean(options.shouldFocusBandsView));
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl);
    }
    return;
  }

  if (route.name === "band-detail") {
    const historyState = options.historyState || window.history.state || {};
    bandsIndexReturnUrl = normalizeBandsReturnUrl(historyState.returnUrl || bandsIndexReturnUrl);
    showMusicNexus({ initialSection: "bands" });
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
    showMusicNexus({ initialSection: "bands" });
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
