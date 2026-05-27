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

function getBandLetter(band) {
  return band.name.slice(0, 1).toUpperCase();
}

function getVisibleBands() {
  const query = bandsSearchTerm.trim().toLowerCase();
  if (!query) {
    return musicBandIndexRows;
  }

  return musicBandIndexRows.filter((band) => {
    const searchText = `${band.name} ${band.region} ${band.status} ${band.statusKey} ${band.albums} albums`.toLowerCase();
    return searchText.includes(query);
  });
}

function getListBands(rows) {
  if (!activeBandsFilterLetter) {
    return rows;
  }

  return rows.filter((band) => getBandLetter(band) === activeBandsFilterLetter);
}

function getBandLetterCounts(rows) {
  return rows.reduce((counts, band) => {
    const letter = getBandLetter(band);
    counts.set(letter, (counts.get(letter) || 0) + 1);
    return counts;
  }, new Map());
}

function syncActiveBandLetter(rows) {
  if (activeBandsFilterLetter) {
    activeBandsLetter = activeBandsFilterLetter;
    return;
  }

  if (rows.length === 0) {
    activeBandsLetter = "A";
    return;
  }

  const visibleLetters = new Set(rows.map(getBandLetter));
  if (!visibleLetters.has(activeBandsLetter)) {
    activeBandsLetter = getBandLetter(rows[0]);
  }
}

function setBandDetailVisible(isVisible) {
  if (!musicNexusShell || !bandDetail) {
    return;
  }

  musicNexusShell.classList.toggle("is-band-detail", isVisible);
  if (isVisible) {
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
  } else {
    setLightboxControlsHidden(false);
  }
  if (galleryViewAll) {
    galleryViewAll.setAttribute("aria-expanded", String(isVisible));
  }
  lightboxScreen.setAttribute("aria-hidden", String(!isVisible));
  if (isVisible) {
    lightboxScreen.removeAttribute("inert");
  } else {
    lightboxScreen.setAttribute("inert", "");
  }
}

function showBandsIndexView(options = {}) {
  setLightboxVisible(false);
  setSetGalleryVisible(false);
  setSetsArchiveVisible(false);
  setBandDetailVisible(false);
  setBandsIndexVisible(true);
  syncBandsIndex();
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

  activeMusicBand = band;
  if (bandDetailPoster) {
    bandDetailPoster.setAttribute("aria-label", `${band.name} placeholder band poster`);
  }
  if (bandDetailThumb) {
    bandDetailThumb.textContent = band.thumb || band.name.slice(0, 2).toUpperCase();
  }
  if (bandDetailLogoName) {
    bandDetailLogoName.textContent = band.name;
  }
  if (bandDetailName) {
    bandDetailName.textContent = band.name;
  }
  if (bandDetailRegion) {
    bandDetailRegion.textContent = band.region;
  }
  if (bandDetailStatus) {
    bandDetailStatus.textContent = band.status;
  }
  if (bandDetailSets) {
    bandDetailSets.textContent = String(band.albums);
  }
  if (bandDetailTotalSets) {
    bandDetailTotalSets.textContent = String(band.albums + 4);
  }
  if (bandDetailPhotos) {
    bandDetailPhotos.textContent = String(band.albums * 36);
  }

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
    label,
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
  activeLightboxIndex = data.normalizedIndex;

  if (options.shouldSyncGallery !== false && data.tile) {
    selectGalleryPhoto(data.tile);
  }
  if (lightboxPhoto) {
    lightboxPhoto.setAttribute("aria-label", `${data.label} placeholder lightbox image`);
    lightboxPhoto.style.setProperty("--lightbox-photo-ratio", lightboxPhotoRatios[activeLightboxIndex % lightboxPhotoRatios.length]);
    if (data.accent) {
      lightboxPhoto.style.setProperty("--lightbox-photo-x", data.accent.x);
      lightboxPhoto.style.setProperty("--lightbox-photo-y", data.accent.y);
      lightboxPhoto.style.setProperty("--lightbox-photo-accent", data.accent.color);
    }
  }
  if (lightboxPhotoTitle) {
    lightboxPhotoTitle.textContent = data.label;
  }
  if (lightboxCounter) {
    lightboxCounter.textContent = `${data.mockIndex} / ${lightboxTotalPhotos}`;
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
  setGalleryModeVisible(false);
  setLightboxActivePhoto(getGalleryPhotoIndex(targetTile), { shouldSyncGallery: false });
  setLightboxThumbnailStripVisible(false);
  setSetGalleryVisible(false);
  setLightboxVisible(true);
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
  if (musicNexusShell) {
    musicNexusShell.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
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

function renderBandsLetterNavs(rows) {
  if (bandsLetterNavs.length === 0) {
    return;
  }

  const counts = getBandLetterCounts(rows);
  bandsLetterNavs.forEach((nav) => {
    const fragment = document.createDocumentFragment();
    bandsAlphabet.forEach((letter) => {
      const count = counts.get(letter) || 0;
      const button = document.createElement("button");
      const isSearchMatch = Boolean(bandsSearchTerm) && count > 0;
      button.className = `bands-letter-button${count > 0 ? " has-signal" : ""}${isSearchMatch ? " is-search-match" : ""}`;
      button.type = "button";
      button.textContent = letter;
      button.disabled = count === 0;
      button.setAttribute("aria-pressed", String(letter === activeBandsLetter));
      button.setAttribute("aria-label", count > 0 ? `${letter}, ${count} band signals` : `${letter}, no band signals`);
      button.addEventListener("click", () => {
        setBandsLetter(letter, {
          shouldFilterList: true,
          shouldOpenList: nav.hasAttribute("data-bands-letter-nav") || nav.hasAttribute("data-bands-letter-nav-search"),
        });
      });
      fragment.append(button);
    });
    nav.replaceChildren(fragment);
  });
}

function renderBandsRadar(rows) {
  const activeRows = rows.filter((band) => getBandLetter(band) === activeBandsLetter);

  if (bandsRadarLetter) {
    bandsRadarLetter.textContent = activeBandsLetter;
  }
  if (bandsRadarCount) {
    bandsRadarCount.textContent = `${activeRows.length} signal${activeRows.length === 1 ? "" : "s"}`;
  }
  if (bandsRadarSignals) {
    const fragment = document.createDocumentFragment();
    if (activeRows.length === 0) {
      const empty = document.createElement("li");
      empty.className = "bands-radar-signal bands-radar-empty";
      empty.textContent = "No active signal";
      fragment.append(empty);
    } else {
      activeRows.slice(0, 4).forEach((band) => {
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
    }
    bandsRadarSignals.replaceChildren(fragment);
  }
  if (bandsRadarPoints) {
    const fragment = document.createDocumentFragment();
    activeRows.slice(0, 4).forEach((band, index) => {
      const point = document.createElement("span");
      const offset = radarPointOffsets[index] || radarPointOffsets[0];
      point.className = "bands-radar-point";
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
  const row = document.createElement("button");
  row.className = `bands-list-row${letter === activeBandsLetter ? " is-letter-active" : ""}`;
  row.type = "button";
  row.dataset.bandLetter = letter;
  row.dataset.bandId = getBandId(band);
  row.setAttribute("aria-label", `Open ${band.name} band detail, ${band.region}, ${band.status}, ${band.albums} Albums`);

  const thumb = document.createElement("span");
  thumb.className = "bands-row-thumb";
  thumb.setAttribute("aria-hidden", "true");
  thumb.textContent = band.thumb;

  const main = document.createElement("span");
  main.className = "bands-row-main";

  const name = document.createElement("span");
  name.className = "bands-row-name";
  name.textContent = band.name;

  const meta = document.createElement("span");
  meta.className = "bands-row-meta";

  const region = document.createElement("span");
  region.className = "bands-row-region";
  region.textContent = band.region;

  const status = document.createElement("span");
  status.className = `bands-row-status bands-row-status--${band.statusKey}`;
  status.textContent = band.status;

  const count = document.createElement("span");
  count.className = "bands-row-count";
  count.textContent = `${band.albums} Albums`;

  const arrow = document.createElement("span");
  arrow.className = "bands-row-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = ">";

  meta.append(region, status, count);
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

  const listRows = getListBands(rows);
  const fragment = document.createDocumentFragment();
  listRows.forEach((band) => {
    fragment.append(createBandListRow(band));
  });
  bandsList.replaceChildren(fragment);

  if (bandsEmpty) {
    bandsEmpty.classList.toggle("is-active", listRows.length === 0);
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

  if (activeBandsView === "list") {
    const activeRow = bandsList.querySelector(`[data-band-letter="${activeBandsLetter}"]`);
    if (activeRow) {
      const listRect = bandsList.getBoundingClientRect();
      const rowRect = activeRow.getBoundingClientRect();
      const rowTop = rowRect.top - listRect.top + bandsList.scrollTop;
      const rowBottom = rowRect.bottom - listRect.top + bandsList.scrollTop;
      const listBottom = bandsList.scrollTop + bandsList.clientHeight;
      let targetTop = null;

      if (rowTop < bandsList.scrollTop) {
        targetTop = rowTop;
      } else if (rowBottom > listBottom) {
        targetTop = rowBottom - bandsList.clientHeight;
      }

      if (targetTop !== null) {
        bandsList.scrollTo({
          top: Math.max(0, targetTop),
          behavior: reducedMotion.matches ? "auto" : "smooth",
        });
      }
    }
  }
}

function renderBandsSearch(rows) {
  if (bandsSearchInput && bandsSearchInput.value !== bandsSearchTerm) {
    bandsSearchInput.value = bandsSearchTerm;
  }
  if (bandsSearchSummary) {
    bandsSearchSummary.textContent = `${rows.length} row${rows.length === 1 ? "" : "s"}`;
  }
  if (bandsSearchResults) {
    const fragment = document.createDocumentFragment();
    rows.slice(0, 5).forEach((band) => {
      const item = document.createElement("li");
      item.className = "bands-search-result-row";
      item.append(createBandListRow(band, { skipLetterFilter: true }));
      fragment.append(item);
    });
    if (rows.length === 0) {
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
  const activeCount = activeBandsFilterLetter
    ? listRows.length
    : rows.filter((band) => getBandLetter(band) === activeBandsLetter).length;
  bandsStatus.textContent = `${activeBandsLetter} / ${activeCount} / ${activeBandsView.toUpperCase()}`;
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
  const rows = getVisibleBands();
  syncActiveBandLetter(rows);
  if (musicBandsIndex) {
    musicBandsIndex.classList.toggle("is-letter-filtered", Boolean(activeBandsFilterLetter));
    musicBandsIndex.classList.toggle("is-search-filtered", Boolean(bandsSearchTerm));
  }
  renderBandsLetterNavs(rows);
  renderBandsRadar(rows);
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
  if (viewName !== "list" || !options.preserveFilter) {
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
  activeBandsFilterLetter = "";
  syncBandsIndex();
}

function returnToBandsRadar() {
  activeBandsFilterLetter = "";
  setBandsView("radar", false, { shouldRoute: true });
  scrollBandsIndexIntoView();
}

function setBandsIndexVisible(isVisible) {
  if (!musicBandsIndex) {
    return;
  }

  musicBandsIndex.classList.toggle("is-active", isVisible);
  musicBandsIndex.setAttribute("aria-hidden", String(!isVisible));
  if (isVisible) {
    musicBandsIndex.removeAttribute("inert");
  } else {
    musicBandsIndex.setAttribute("inert", "");
  }
}

function setMusicNexusContext(sectionName, shouldFocusCard = false, shouldUpdateRail = true) {
  const rows = musicActivityContent[sectionName];
  if (!rows || !musicActivityList) {
    return;
  }

  setBandDetailVisible(false);
  setSetsArchiveVisible(false);
  setSetGalleryVisible(false);
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
  if (sectionName === "bands") {
    syncBandsIndex();
  }

  musicActivityList.replaceChildren();
  rows.forEach((rowText) => {
    const row = document.createElement("li");
    row.className = "v3-card v3-card--activity music-activity-row";
    row.textContent = rowText;
    musicActivityList.append(row);
  });

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

function showPortfolioHubView() {
  if (!shell) {
    return;
  }

  shell.classList.remove("is-module-view", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-about-view", "is-calendar-view", "is-contact-view");
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

function showMusicNexus() {
  if (!shell || !portfolioHub || !musicNexusShell) {
    return;
  }

  window.clearTimeout(activationTimer);
  shell.classList.remove("is-activating", "is-reduced-activation", "is-placeholder-view", "is-ring-archive-view", "is-about-view", "is-calendar-view", "is-contact-view");
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
  setMusicNexusContext("bands", false, false);
  showBandsIndexView({ shouldScroll: false, shouldUpdateRail: false });
  setCurrentView("Music Nexus");
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
  shell.classList.remove("is-activating", "is-reduced-activation", "is-placeholder-view", "is-music-nexus-view", "is-about-view", "is-calendar-view", "is-contact-view");
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


function showAboutShell() {
  if (!shell || !aboutShell) {
    return;
  }

  window.clearTimeout(activationTimer);
  shell.classList.remove("is-activating", "is-reduced-activation", "is-module-view", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-calendar-view", "is-contact-view");
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
  shell.classList.remove("is-activating", "is-reduced-activation", "is-module-view", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-about-view", "is-contact-view");
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
  shell.classList.remove("is-activating", "is-reduced-activation", "is-module-view", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-about-view", "is-calendar-view");
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
  shell.classList.remove("is-activating", "is-reduced-activation", "is-music-nexus-view", "is-ring-archive-view", "is-about-view", "is-calendar-view", "is-contact-view");
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
  shell.classList.remove("is-activating", "is-reduced-activation", "has-entered-hub", "is-module-view", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-about-view", "is-calendar-view", "is-contact-view");
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
    showAboutShell();
  } else if (globalTarget === "calendar") {
    showCalendarShell();
  } else if (globalTarget === "contact") {
    showContactShell();
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
        showRingArchive();
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
  if (lightboxPhoto) {
    lightboxPhoto.addEventListener("click", () => {
      setLightboxControlsHidden(!areLightboxControlsHidden);
    });
  }
  if (lightboxInfoToggle) {
    lightboxInfoToggle.addEventListener("click", () => {
      setLightboxControlsHidden(false);
      setLightboxInfoVisible(!lightboxScreen.classList.contains("is-info-open"));
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
  musicNexusCards.forEach((card) => {
    card.addEventListener("click", () => {
      const musicSection = card.dataset.musicNexusCard;
      if (musicSection === "bands") {
        navigateToRoute(getBandsRouteUrl("radar"));
        return;
      }
      if (getRouteFromUrl().name === "music-bands") {
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
  if (bandsBackRadar) {
    bandsBackRadar.addEventListener("click", returnToBandsRadar);
  }
  hydrateSetRouteMetadata();
  setBandsView("radar");
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
