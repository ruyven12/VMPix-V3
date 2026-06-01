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

function setActiveGlobalNav(targetName) {
  globalNavButtons.forEach((button) => {
    if (button.dataset.globalNavTarget === targetName) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
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

  shell.classList.remove("is-module-view", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
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
  shell.classList.remove("is-activating", "is-reduced-activation", "is-placeholder-view", "is-ring-archive-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
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
  setActiveGlobalNav("portfolio");
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
  shell.classList.remove("is-activating", "is-reduced-activation", "is-placeholder-view", "is-music-nexus-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
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
  setActiveGlobalNav("portfolio");
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
  shell.classList.remove("is-activating", "is-reduced-activation", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
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
  setActiveGlobalNav("portfolio");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function showWrestlingShowDetail() {
  if (!shell || !portfolioHub || !wrestlingShowDetailShell) {
    return;
  }

  window.clearTimeout(activationTimer);
  shell.classList.remove("is-activating", "is-reduced-activation", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-shows-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
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
  setCurrentView("Show Detail");
  setActiveGlobalNav("portfolio");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function showWrestlingMatchGallery() {
  if (!shell || !portfolioHub || !wrestlingMatchGalleryShell) {
    return;
  }

  window.clearTimeout(activationTimer);
  shell.classList.remove("is-activating", "is-reduced-activation", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
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
  setCurrentView("Match Gallery");
  setActiveGlobalNav("portfolio");
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
  navigateToRoute(`${routePaths.wrestlingShows}/warzone-26/match/daron-richardson-vs-bear-bronson/photo/${getWrestlingPhotoIdFromNumber(photoNumber)}`);
}

function showWrestlingLightbox(showId, matchId, photoId) {
  if (!shell || !portfolioHub || !wrestlingLightboxShell) {
    return;
  }

  const photoNumber = getWrestlingPhotoNumber(photoId);
  wrestlingLightboxShell.dataset.showId = showId || "warzone-26";
  wrestlingLightboxShell.dataset.matchId = matchId || "daron-richardson-vs-bear-bronson";
  wrestlingLightboxShell.dataset.photoNumber = String(photoNumber);
  if (wrestlingLightboxCounter) {
    wrestlingLightboxCounter.textContent = `${photoNumber} / 48`;
  }
  if (wrestlingLightboxPhotoNumber) {
    wrestlingLightboxPhotoNumber.textContent = getWrestlingPhotoIdFromNumber(photoNumber);
  }

  window.clearTimeout(activationTimer);
  shell.classList.remove("is-activating", "is-reduced-activation", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-about-view", "is-calendar-view", "is-contact-view");
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
  setActiveGlobalNav("portfolio");
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
  shell.classList.remove("is-activating", "is-reduced-activation", "is-module-view", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-calendar-view", "is-contact-view");
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
  shell.classList.remove("is-activating", "is-reduced-activation", "is-module-view", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-contact-view");
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
  shell.classList.remove("is-activating", "is-reduced-activation", "is-module-view", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view");
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
  shell.classList.remove("is-activating", "is-reduced-activation", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
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

function syncRailHeight() {
  if (!bottomRail) {
    return;
  }

  document.documentElement.style.setProperty("--rail-height", `${Math.ceil(bottomRail.getBoundingClientRect().height)}px`);
}

function openGlobalMenu() {
  if (!shell || !railMenuTrigger || !globalMenuDrawer || !globalMenuBackdrop) {
    return;
  }

  window.clearTimeout(drawerCloseTimer);
  syncRailHeight();
  globalMenuDrawer.hidden = false;
  globalMenuBackdrop.hidden = false;
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
  shell.classList.remove("is-activating", "is-reduced-activation", "has-entered-hub", "is-module-view", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
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
  const globalTarget = button.dataset.globalNavTarget;

  if (button.getAttribute("aria-disabled") === "true") {
    return;
  }

  if (globalTarget === "home") {
    navigateToRoute(routePaths.home);
  } else if (globalTarget === "portfolio") {
    navigateToRoute(routePaths.portfolio);
  } else if (globalTarget === "about") {
    navigateToRoute(routePaths.about);
  } else if (globalTarget === "calendar") {
    navigateToRoute(routePaths.calendar);
  } else if (globalTarget === "contact") {
    navigateToRoute(routePaths.contact);
  } else if (globalTarget === "admin") {
    window.location.href = "./admin/index.html";
    return;
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
  startButton.setAttribute("aria-busy", "false");
  setActiveGlobalNav("home");
  startButton.addEventListener("click", () => {
    navigateToRoute(routePaths.portfolio, { shouldAnimatePortal: true });
  });
  syncRailHeight();
  if (railMenuTrigger) {
    railMenuTrigger.addEventListener("click", openGlobalMenu);
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
      navigateToRoute(`${routePaths.wrestlingShows}/warzone-26`);
    });
  }
  wrestlingPhotoTiles.forEach((tile) => {
    const photoId = tile.dataset.wrestlingPhotoId;
    tile.addEventListener("click", () => {
      if (photoId) {
        navigateToRoute(`${routePaths.wrestlingShows}/warzone-26/match/daron-richardson-vs-bear-bronson/photo/${encodeURIComponent(photoId)}`);
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
  window.addEventListener("resize", syncRailHeight);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && globalMenuDrawer && !globalMenuDrawer.hidden) {
      closeGlobalMenu();
    }
  });
  window.addEventListener("pagehide", () => {
    window.clearTimeout(activationTimer);
    window.clearTimeout(drawerCloseTimer);
    if (spotlightFrame) {
      window.cancelAnimationFrame(spotlightFrame);
    }
  });
}
