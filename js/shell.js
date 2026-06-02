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
  if (route.name === "wrestling-person-detail" && typeof findWrestlingPersonById === "function") {
    return findWrestlingPersonById(route.personId)?.name || fallbackLabel;
  }
  if (route.name === "wrestling-venue-detail" && typeof findWrestlingVenueById === "function") {
    return findWrestlingVenueById(route.venueId)?.name || fallbackLabel;
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
  if (route.name === "set-detail") {
    return historyState.bandUrl || getBandRouteUrl(route.bandId);
  }
  if (route.name === "wrestling-match-gallery") {
    return `${routePaths.wrestlingShows}/${encodeURIComponent(route.showId || "warzone-26")}`;
  }
  if (route.name === "wrestling-lightbox") {
    const showId = route.showId || "warzone-26";
    const matchId = route.matchId || "daron-richardson-vs-bear-bronson";
    return `${routePaths.wrestlingShows}/${encodeURIComponent(showId)}/match/${encodeURIComponent(matchId)}`;
  }

  return routeNameToShellBackTarget[route.name] || routePaths.portfolio;
}

function shouldShellBackUseHistory(route = getRouteFromUrl(), historyState = window.history.state || {}) {
  if (!window.history || window.history.length <= 1 || !route) {
    return false;
  }

  return (
    (route.name === "band-detail" && historyState.returnUrl && historyState.fromBandsIndex) ||
    (route.name === "set-detail" && historyState.bandUrl && historyState.fromBandDetail) ||
    (route.name === "person-detail" && historyState.fromPeopleIndex) ||
    (route.name === "show-detail" && historyState.fromShowsArchive) ||
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
  shellDrawerGroups.forEach((group) => {
    const groupRoutes = shellRouteRegistry.filter((routeMeta) => routeMeta.drawerGroup === group.id);
    if (groupRoutes.length === 0) {
      return;
    }

    const section = document.createElement("section");
    const titleId = `global-menu-${group.id}-title`;
    section.className = "global-menu-group";
    section.setAttribute("aria-labelledby", titleId);

    const title = document.createElement("h3");
    title.className = "global-menu-section-title";
    title.id = titleId;
    title.textContent = group.label;

    const list = document.createElement("div");
    list.className = group.id === "future"
      ? "global-menu-list global-menu-list--future"
      : "global-menu-list";
    groupRoutes.forEach((routeMeta) => {
      list.append(createGlobalMenuButton(routeMeta));
    });

    section.append(title, list);
    globalMenuActions.append(section);
  });

  globalNavButtons = document.querySelectorAll("[data-global-nav-target]");
}

function setActiveGlobalNav(targetName) {
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

function syncSpotlightFromCarousel() {
  if (!hubCarousel) {
    return;
  }

  const cards = Array.from(hubCarousel.querySelectorAll("[data-module-card]"));
  if (cards.length === 0) {
    return;
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
  } else {
    setMusicNexusContext(initialSection, false, false);
    if (initialSection === "bands") {
      showBandsIndexView({ shouldScroll: false, shouldUpdateRail: false });
    }
  }
  setCurrentView(options.currentView || "Music Nexus");
  setActiveGlobalNav(options.globalNavTarget || {
    bands: "music-bands",
    people: "music-people",
    shows: "music-shows",
  }[initialSection] || "music");
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
  setActiveGlobalNav("wrestling-people");
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
  setActiveGlobalNav("wrestling-people");
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
  setActiveGlobalNav("wrestling-shows");
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
  if (typeof updateWrestlingShowDetailRelationshipHooks === "function") {
    updateWrestlingShowDetailRelationshipHooks(showId);
  }
  setCurrentView("Show Detail");
  setActiveGlobalNav("wrestling-shows");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function showWrestlingMatchGallery(showId = "warzone-26", matchId = "daron-richardson-vs-bear-bronson") {
  if (!shell || !portfolioHub || !wrestlingMatchGalleryShell) {
    return;
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
  setActiveGlobalNav("wrestling-shows");
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
  const showId = wrestlingLightboxShell?.dataset.wrestlingShowId ||
    wrestlingLightboxShell?.dataset.showId ||
    wrestlingMatchGalleryShell?.dataset.wrestlingShowId ||
    "warzone-26";
  const matchId = wrestlingLightboxShell?.dataset.wrestlingMatchId ||
    wrestlingLightboxShell?.dataset.matchId ||
    wrestlingMatchGalleryShell?.dataset.wrestlingMatchId ||
    "daron-richardson-vs-bear-bronson";

  navigateToRoute(`${routePaths.wrestlingShows}/${encodeURIComponent(showId)}/match/${encodeURIComponent(matchId)}/photo/${getWrestlingPhotoIdFromNumber(photoNumber)}`);
}

function showWrestlingLightbox(showId, matchId, photoId) {
  if (!shell || !portfolioHub || !wrestlingLightboxShell) {
    return;
  }

  const photoNumber = getWrestlingPhotoNumber(photoId);
  const activeShowId = showId || "warzone-26";
  const activeMatchId = matchId || "daron-richardson-vs-bear-bronson";
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
  setActiveGlobalNav("wrestling-shows");
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
  setCurrentView("About");
  setActiveGlobalNav("about");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
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
  setCurrentView("Calendar");
  setActiveGlobalNav("calendar");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
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
  setCurrentView("Contact");
  setActiveGlobalNav("contact");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function showModulePlaceholder(moduleName) {
  const content = modulePlaceholderContent[moduleName];
  if (!content || !shell || !portfolioHub || !modulePlaceholder) {
    return;
  }

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
    music: musicNexusShell,
    "music-bands": musicNexusShell,
    "band-detail": musicNexusShell,
    "set-detail": musicNexusShell,
    "music-people": musicNexusShell,
    "person-detail": musicNexusShell,
    "music-shows": musicNexusShell,
    "show-detail": musicNexusShell,
    "music-venues": musicNexusShell,
    wrestling: ringArchiveShell,
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

function closeGlobalMenu() {
  if (!shell || !railMenuTrigger || !globalMenuDrawer || !globalMenuBackdrop) {
    return;
  }

  shell.classList.remove("is-global-menu-open");
  globalMenuDrawer.setAttribute("aria-hidden", "true");
  railMenuTrigger.setAttribute("aria-expanded", "false");
  railMenuTrigger.focus({ preventScroll: true });
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
  shell.classList.remove("is-activating", "is-reduced-activation", "has-entered-hub", "is-module-view", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
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

  if (navRoute) {
    navigateToRoute(navRoute);
  }

  closeGlobalMenu();
}

function revealHub() {
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
}

function activatePortal() {
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

  activationTimer = window.setTimeout(revealHub, reducedMotion.matches ? 460 : 1360);
}

if (shell && startButton) {
  renderGlobalMenu();
  startButton.setAttribute("aria-busy", "false");
  setActiveGlobalNav("home");
  startButton.addEventListener("click", () => {
    navigateToRoute(routePaths.portfolio, { shouldAnimatePortal: true });
  });
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
        const showId = tile.dataset.wrestlingShowId ||
          wrestlingMatchGalleryShell?.dataset.wrestlingShowId ||
          "warzone-26";
        const matchId = tile.dataset.wrestlingMatchId ||
          wrestlingMatchGalleryShell?.dataset.wrestlingMatchId ||
          "daron-richardson-vs-bear-bronson";
        navigateToRoute(`${routePaths.wrestlingShows}/${encodeURIComponent(showId)}/match/${encodeURIComponent(matchId)}/photo/${encodeURIComponent(photoId)}`);
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
  syncRouteFromLocation({ historyState: window.history.state });
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
    window.clearTimeout(drawerCloseTimer);
    if (spotlightFrame) {
      window.cancelAnimationFrame(spotlightFrame);
    }
  });
}
