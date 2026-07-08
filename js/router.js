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

function decodeWrestlingMatchRouteSegment(routePart) {
  return decodeRoutePart(routePart).trim().toLowerCase();
}

function decodeLegacyWrestlingMatchRouteSegment(routePart) {
  const routeSegment = decodeWrestlingMatchRouteSegment(routePart);
  return /^\d+$/.test(routeSegment) ? `match-${routeSegment}` : routeSegment;
}

function getPathWithSearch(url = window.location.href) {
  const routeUrl = new URL(url, window.location.href);
  return `${routeUrl.pathname}${routeUrl.search}`;
}

function getRouteFromUrl(url = window.location.href) {
  const routeUrl = new URL(url, window.location.href);
  const routePath = normalizeRoutePath(routeUrl.pathname);
  const unknownRoute = (name, canonicalUrl = routePath) => ({
    name,
    canonicalUrl,
    path: routePath,
    isUnknown: true,
  });

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
  const musicVenueDetailPrefix = `${routePaths.musicVenues}/`;
  if (routePath.startsWith(musicVenueDetailPrefix)) {
    const routeParts = routePath.slice(musicVenueDetailPrefix.length).split("/");
    if (routeParts.length === 1 && routeParts[0]) {
      const venueSlug = decodeRoutePart(routeParts[0]);
      return { name: "music-venue-detail", venueSlug, canonicalUrl: getMusicVenueRouteUrl(venueSlug) };
    }
  }
  if (routePath === routePaths.wrestling) {
    return { name: "wrestling", canonicalUrl: routePaths.wrestling };
  }
  if (routePath === routePaths.wrestlingPeople) {
    return { name: "wrestling-people", canonicalUrl: routePaths.wrestlingPeople };
  }
  const wrestlingPersonDetailPrefix = `${routePaths.wrestlingPeople}/`;
  if (routePath.startsWith(wrestlingPersonDetailPrefix)) {
    const routeParts = routePath.slice(wrestlingPersonDetailPrefix.length).split("/");
    if (routeParts.length === 1 && routeParts[0]) {
      const personId = decodeRoutePart(routeParts[0]);
      return { name: "wrestling-person-detail", personId, canonicalUrl: getWrestlingPersonRouteUrl(personId) };
    }
  }
  if (routePath === routePaths.wrestlingVenues) {
    return { name: "wrestling-venues", canonicalUrl: routePaths.wrestlingVenues };
  }
  const wrestlingVenueDetailPrefix = `${routePaths.wrestlingVenues}/`;
  if (routePath.startsWith(wrestlingVenueDetailPrefix)) {
    const routeParts = routePath.slice(wrestlingVenueDetailPrefix.length).split("/");
    if (routeParts.length === 1 && routeParts[0]) {
      const venueId = decodeRoutePart(routeParts[0]);
      return { name: "wrestling-venue-detail", venueId, canonicalUrl: getWrestlingVenueRouteUrl(venueId) };
    }
  }
  if (routePath === routePaths.wrestlingShows) {
    return { name: "wrestling-shows", canonicalUrl: routePaths.wrestlingShows };
  }
  const wrestlingShowDetailPrefix = `${routePaths.wrestlingShows}/`;
  if (routePath.startsWith(wrestlingShowDetailPrefix)) {
    const routeParts = routePath.slice(wrestlingShowDetailPrefix.length).split("/");
    if (routeParts.length === 4 && routeParts[0] && routeParts[1] && routeParts[2] === "photo" && routeParts[3]) {
      const dateKey = decodeRoutePart(routeParts[0]);
      const matchRef = decodeWrestlingMatchRouteSegment(routeParts[1]);
      const photoId = decodeRoutePart(routeParts[3]);
      return { name: "wrestling-lightbox", showId: dateKey, dateKey, matchId: matchRef, matchRef, photoId, canonicalUrl: `${routePaths.wrestlingShows}/${encodeURIComponent(dateKey)}/${encodeURIComponent(matchRef)}/photo/${encodeURIComponent(photoId)}` };
    }
    if (routeParts.length === 2 && routeParts[0] && routeParts[1]) {
      const dateKey = decodeRoutePart(routeParts[0]);
      const matchRef = decodeWrestlingMatchRouteSegment(routeParts[1]);
      return { name: "wrestling-match-gallery", showId: dateKey, dateKey, matchId: matchRef, matchRef, canonicalUrl: `${routePaths.wrestlingShows}/${encodeURIComponent(dateKey)}/${encodeURIComponent(matchRef)}` };
    }
    if (routeParts.length === 5 && routeParts[0] && routeParts[1] === "match" && routeParts[2] && routeParts[3] === "photo" && routeParts[4]) {
      const dateKey = decodeRoutePart(routeParts[0]);
      const matchRef = decodeLegacyWrestlingMatchRouteSegment(routeParts[2]);
      const photoId = decodeRoutePart(routeParts[4]);
      return { name: "wrestling-lightbox", showId: dateKey, dateKey, matchId: matchRef, matchRef, photoId, canonicalUrl: `${routePaths.wrestlingShows}/${encodeURIComponent(dateKey)}/${encodeURIComponent(matchRef)}/photo/${encodeURIComponent(photoId)}` };
    }
    if (routeParts.length === 3 && routeParts[0] && routeParts[1] === "match" && routeParts[2]) {
      const dateKey = decodeRoutePart(routeParts[0]);
      const matchRef = decodeLegacyWrestlingMatchRouteSegment(routeParts[2]);
      return { name: "wrestling-match-gallery", showId: dateKey, dateKey, matchId: matchRef, matchRef, canonicalUrl: `${routePaths.wrestlingShows}/${encodeURIComponent(dateKey)}/${encodeURIComponent(matchRef)}` };
    }
    if (routeParts.length === 1 && routeParts[0]) {
      const dateKey = decodeRoutePart(routeParts[0]);
      return { name: "wrestling-show-detail", showId: dateKey, dateKey, canonicalUrl: `${routePaths.wrestlingShows}/${encodeURIComponent(dateKey)}` };
    }
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
  if (routePath === routePaths.connect) {
    return { name: "connect", canonicalUrl: routePaths.connect };
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
    if (routeParts.length === 2 && routeParts[0] && routeParts[1] === "sets") {
      const bandId = decodeRoutePart(routeParts[0]);
      return { name: "sets-archive", bandId, canonicalUrl: getBandSetsRouteUrl(bandId) };
    }
    if (routeParts.length === 2 && routeParts[0] && routeParts[1] !== "sets") {
      const bandId = decodeRoutePart(routeParts[0]);
      const setCode = normalizeSetCode(decodeRoutePart(routeParts[1]));
      return { name: "set-detail", bandId, setCode, canonicalUrl: getSetRouteUrl(bandId, setCode) };
    }
    if (routeParts.length === 3 && routeParts[0] && routeParts[1] === "sets" && routeParts[2]) {
      const bandId = decodeRoutePart(routeParts[0]);
      const setCode = normalizeSetCode(decodeRoutePart(routeParts[2]));
      return { name: "set-detail", bandId, setCode, canonicalUrl: getSetRouteUrl(bandId, setCode) };
    }
  }

  if (routePath === routePaths.music || routePath.startsWith(`${routePaths.music}/`)) {
    return unknownRoute("music-route-not-found");
  }

  if (routePath === routePaths.wrestling || routePath.startsWith(`${routePaths.wrestling}/`)) {
    return unknownRoute("wrestling-route-not-found");
  }

  return unknownRoute("route-not-found");
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
  if (route.name !== "connect" && typeof hideConnectShell === "function") {
    hideConnectShell();
  }

  if (typeof setActiveGlobalNavForRoute === "function") {
    setActiveGlobalNavForRoute(route.name);
  }
  if (typeof updateShellBreadcrumb === "function") {
    updateShellBreadcrumb(route);
  }
  if (typeof updateShellBackState === "function") {
    updateShellBackState(route);
  }

  if (route.name === "home") {
    showHomepage();
    return;
  }

  if (route.name === "route-not-found" || route.name === "music-route-not-found" || route.name === "wrestling-route-not-found") {
    if (typeof showRouteNotFound === "function") {
      showRouteNotFound(route);
    } else {
      showPortfolioHubView();
    }
    return;
  }

  if (route.name === "portfolio") {
    revealHub({
      shouldPlayPortfolioArrival: Boolean(options.shouldPlayPortfolioArrival),
      shouldPlayDirectPortfolioArrival: Boolean(options.shouldPlayDirectPortfolioArrival),
      shouldPlayDirectPortfolioEntrySequence: Boolean(options.shouldPlayDirectPortfolioEntrySequence),
    });
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
    showMusicNexus({ initialSection: "venues", currentView: "Venues" });
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl);
    }
    return;
  }

  if (route.name === "music-venue-detail") {
    showMusicNexus({ initialSection: "venues", currentView: "Venue Detail" });
    showMusicVenueDetail(route.venueSlug);
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl);
    }
    return;
  }

  if (route.name === "wrestling") {
    const animationStartedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
    showBattlegroundGatewayArrivalSurface();
    if (typeof initDaiionArchiveStatsPanel === "function") {
      initDaiionArchiveStatsPanel({ animationStartedAt });
    }
    return;
  }

  if (route.name === "wrestling-people") {
    showWrestlingPeopleIndex();
    return;
  }

  if (route.name === "wrestling-person-detail") {
    showWrestlingPersonDetail(route.personId);
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl);
    }
    return;
  }

  if (route.name === "wrestling-venues") {
    showWrestlingVenuesIndex();
    return;
  }

  if (route.name === "wrestling-venue-detail") {
    showWrestlingVenueDetail(route.venueId);
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl);
    }
    return;
  }

  if (route.name === "wrestling-shows") {
    showWrestlingShowsIndex();
    return;
  }

  if (route.name === "wrestling-show-detail") {
    showWrestlingShowDetail(route.showId);
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl);
    }
    return;
  }

  if (route.name === "wrestling-match-gallery") {
    showWrestlingMatchGallery(route.dateKey || route.showId, route.matchRef || route.matchId);
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl);
    }
    return;
  }

  if (route.name === "wrestling-lightbox") {
    showWrestlingLightbox(route.dateKey || route.showId, route.matchRef || route.matchId, route.photoId);
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl);
    }
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

  if (route.name === "connect") {
    showConnectShell();
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
    if (typeof showBandDetailRoute === "function") {
      showBandDetailRoute(route.bandId);
    } else {
      showBandDetail(findBandById(route.bandId) || createUnknownBand(route.bandId));
      requestMusicBandsIndexData().then(() => {
        const currentRoute = getRouteFromUrl();
        if (currentRoute.name !== "band-detail" || String(currentRoute.bandId || "").toLowerCase() !== String(route.bandId || "").toLowerCase()) {
          return;
        }

        showBandDetail(findBandById(currentRoute.bandId) || createUnknownBand(currentRoute.bandId));
      });
    }
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl, {
        returnUrl: bandsIndexReturnUrl,
        fromBandsIndex: Boolean(historyState.fromBandsIndex),
      });
    }
    return;
  }

  if (route.name === "sets-archive") {
    const historyState = options.historyState || window.history.state || {};
    bandsIndexReturnUrl = normalizeBandsReturnUrl(historyState.returnUrl || bandsIndexReturnUrl);
    showMusicNexus({ initialSection: "bands" });
    showSetsArchiveRoute(findBandById(route.bandId) || createUnknownBand(route.bandId));
    requestMusicBandsIndexData().then(() => {
      const currentRoute = getRouteFromUrl();
      if (currentRoute.name !== "sets-archive" || String(currentRoute.bandId || "").toLowerCase() !== String(route.bandId || "").toLowerCase()) {
        return;
      }

      showSetsArchiveRoute(findBandById(currentRoute.bandId) || createUnknownBand(currentRoute.bandId));
    });
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

  if (route.name === "set-detail") {
    const historyState = options.historyState || window.history.state || {};
    bandsIndexReturnUrl = normalizeBandsReturnUrl(
      historyState.returnUrl ||
      ((historyState.fromSetsArchive || historyState.fromBandDetail) ? bandsIndexReturnUrl : getBandsRouteUrl("radar"))
    );
    showMusicNexus({ initialSection: "bands" });
    showSetDetailRoute(findBandById(route.bandId) || createUnknownBand(route.bandId), route.setCode);
    requestMusicBandsIndexData().then(() => {
      const currentRoute = getRouteFromUrl();
      if (
        currentRoute.name !== "set-detail" ||
        String(currentRoute.bandId || "").toLowerCase() !== String(route.bandId || "").toLowerCase()
      ) {
        return;
      }

      showSetDetailRoute(findBandById(currentRoute.bandId) || createUnknownBand(currentRoute.bandId), currentRoute.setCode);
    });
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl, {
        bandUrl: getBandRouteUrl(route.bandId),
        setsArchiveUrl: getBandSetsRouteUrl(route.bandId),
        returnUrl: bandsIndexReturnUrl,
        fromSetsArchive: Boolean(historyState.fromSetsArchive),
        fromBandsIndex: Boolean(historyState.fromBandsIndex),
      });
    }
    return;
  }

  showHomepage();
}

function syncRouteFromLocation(options = {}) {
  const route = getRouteFromUrl();
  syncRoute(route, options);
  if (typeof stabilizeShellViewport === "function") {
    stabilizeShellViewport(route, options);
  }
}

function navigateToRoute(url, options = {}) {
  const route = getRouteFromUrl(url);
  const targetUrl = route.isUnknown ? url : route.canonicalUrl;
  pushRouteUrl(targetUrl, options.historyState || {});
  syncRoute(route, { ...options, shouldCanonicalize: false });
  if (typeof stabilizeShellViewport === "function") {
    stabilizeShellViewport(route, options);
  }
}
