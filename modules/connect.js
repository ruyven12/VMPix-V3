/* =========================================================
   VMPix V3 Connect page.
   Standalone NFC/social hub with scoped V2 HUD-inspired effects.
   ========================================================= */

(function () {
  "use strict";

  const root = document.documentElement;
  const connectStage = document.querySelector("[data-connect-stage]");
  const canvas = document.querySelector("[data-connect-embers]");
  const logoFrame = document.querySelector("[data-connect-logo-frame]");
  const logoVideo = document.querySelector("[data-connect-logo-video]");
  const logoFallback = document.querySelector("[data-connect-logo-fallback]");
  const reducedMotionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  const ua = navigator.userAgent || "";
  const isMessenger = /\bFBAN\/Messenger\b|\bMessenger\b/i.test(ua);
  const isFacebook = /\bFBAN\/FB4A\b|\bFBAV\/\d+/i.test(ua) && !isMessenger;
  const isInstagram = /\bInstagram\b/i.test(ua);
  const isTwitterX = /\bTwitter\b|\bTwitterAndroid\b|\bTwitter for iPhone\b/i.test(ua);
  const isSocialWebview = isMessenger || isFacebook || isInstagram || isTwitterX;
  const particles = [];

  let ctx = null;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let frameId = 0;
  let lastTick = 0;
  let active = false;
  let resizeObserver = null;
  let viewportFrame = 0;

  function markWebviewContext() {
    root.classList.toggle("connect-webview", Boolean(isSocialWebview));
    root.classList.toggle("connect-messenger", Boolean(isMessenger));
    root.classList.toggle("connect-facebook", Boolean(isFacebook));
    root.classList.toggle("connect-instagram", Boolean(isInstagram));
    root.classList.toggle("connect-twitter", Boolean(isTwitterX));
    root.classList.toggle("connect-x", Boolean(isTwitterX));
    root.classList.toggle("connect-touch", window.matchMedia && window.matchMedia("(hover: none)").matches);
  }

  function setConnectViewportVars() {
    const viewport = window.visualViewport;
    const viewportHeight = viewport && viewport.height ? viewport.height : window.innerHeight || document.documentElement.clientHeight;
    const viewportTop = viewport && typeof viewport.offsetTop === "number" ? viewport.offsetTop : 0;
    const viewportBottom = viewport && viewport.height
      ? Math.max(0, (window.innerHeight || viewport.height) - (viewport.height + viewportTop))
      : 0;

    if (viewportHeight) {
      root.style.setProperty("--connect-vh", `${viewportHeight * 0.01}px`);
    }
    root.style.setProperty("--connect-vv-top", `${Math.round(viewportTop)}px`);
    root.style.setProperty("--connect-vv-bottom", `${Math.round(viewportBottom)}px`);
  }

  function scheduleViewportSync() {
    if (viewportFrame) {
      window.cancelAnimationFrame(viewportFrame);
    }
    viewportFrame = window.requestAnimationFrame(() => {
      viewportFrame = 0;
      setConnectViewportVars();
    });
  }

  function getParticleCount() {
    const shortSide = Math.min(width || 360, height || 720);
    if (isSocialWebview || shortSide < 520) {
      return 86;
    }
    if (shortSide < 760) {
      return 112;
    }
    return 148;
  }

  function resizeCanvas() {
    if (!connectStage || !canvas || !ctx) {
      return;
    }

    const rect = connectStage.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.floor(rect.width));
    const nextHeight = Math.max(1, Math.floor(rect.height));
    const nextDpr = Math.min(isSocialWebview ? 1.25 : 1.5, window.devicePixelRatio || 1);

    if (nextWidth === width && nextHeight === height && nextDpr === dpr) {
      return;
    }

    width = nextWidth;
    height = nextHeight;
    dpr = nextDpr;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedParticles();
  }

  function spawnParticle(index) {
    particles[index] = {
      x: Math.random() * width,
      y: height + Math.random() * (height * 0.2),
      radius: 0.65 + Math.random() * 1.65,
      velocityY: 0.28 + Math.random() * 0.84,
      velocityX: (Math.random() - 0.5) * 0.48,
      alpha: 0.1 + Math.random() * 0.24,
      twinkle: 0.7 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
    };
  }

  function seedParticles() {
    const count = getParticleCount();
    particles.length = count;
    for (let index = 0; index < count; index += 1) {
      spawnParticle(index);
      particles[index].y = Math.random() * height;
    }
  }

  function drawPlasma(now, pulse) {
    const previousComposite = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = "lighter";

    const cx = width * 0.5;
    const cy = height * 0.9;
    const rx = Math.max(72, width * 0.25);
    const ry = Math.max(22, height * 0.055);
    const baseGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
    baseGlow.addColorStop(0, `rgba(0,255,255,${0.085 * pulse})`);
    baseGlow.addColorStop(0.45, `rgba(160,70,255,${0.065 * pulse})`);
    baseGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = baseGlow;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    const ribbons = isSocialWebview || width < 520 ? 4 : 6;
    for (let ribbon = 0; ribbon < ribbons; ribbon += 1) {
      const phase = (now / 1700) + (ribbon * 2.15);
      const midpoint = (ribbons - 1) * 0.5;
      const spread = (ribbon - midpoint) / (midpoint || 1);
      const originX = width * (0.5 + spread * 0.16 + 0.014 * Math.sin(phase * 0.78));
      const originY = height * 0.95;

      ctx.beginPath();
      ctx.moveTo(originX, originY);

      const steps = 16;
      for (let step = 1; step <= steps; step += 1) {
        const progress = step / steps;
        const driftX = Math.sin(phase + progress * 3.35) * (width * 0.09) * Math.pow(1 - progress, 0.85);
        const wiggleY = Math.cos((phase * 1.18) + progress * 4.2) * (height * 0.014);
        ctx.lineTo(originX + driftX, originY - (progress * height * 0.66) + wiggleY);
      }

      const weight = 1 - Math.min(1, Math.abs(spread) * 0.55);
      const coreAlpha = (0.07 + ribbon * 0.01) * pulse * weight;
      const haloAlpha = (0.04 + ribbon * 0.008) * pulse * weight;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = `rgba(255,255,255,${coreAlpha * 0.4})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.strokeStyle = `rgba(0,255,255,${coreAlpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = `rgba(160,70,255,${haloAlpha})`;
      ctx.lineWidth = 4.2;
      ctx.stroke();
    }

    ctx.globalCompositeOperation = previousComposite;
  }

  function drawParticles(delta, pulse) {
    for (let index = 0; index < particles.length; index += 1) {
      const particle = particles[index];
      particle.y -= particle.velocityY * (delta / 16.7);
      particle.x += particle.velocityX * (delta / 16.7);
      particle.phase += 0.024 * particle.twinkle;

      if (particle.y < -28 || particle.x < -50 || particle.x > width + 50) {
        spawnParticle(index);
      }

      const flicker = 0.78 + 0.22 * Math.sin(particle.phase);
      const alpha = particle.alpha * flicker * pulse;

      ctx.beginPath();
      ctx.fillStyle = `rgba(0,255,255,${alpha})`;
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = `rgba(160,70,255,${alpha * 0.52})`;
      ctx.arc(particle.x + 1.2, particle.y, particle.radius * 0.96, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = `rgba(0,255,255,${alpha * 0.5})`;
      ctx.lineWidth = 1;
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(particle.x - particle.velocityX * 11, particle.y + particle.velocityY * 13);
      ctx.stroke();
    }
  }

  function tick(now) {
    if (!active || reducedMotionQuery.matches || document.hidden) {
      frameId = 0;
      return;
    }

    const delta = Math.min(40, now - (lastTick || now));
    lastTick = now;
    resizeCanvas();

    ctx.clearRect(0, 0, width, height);
    const pulse = 0.84 + 0.16 * Math.sin((now / 2200) * Math.PI * 2);
    const glow = ctx.createRadialGradient(width * 0.5, height * 0.55, 10, width * 0.5, height * 0.55, Math.max(width, height) * 0.72);
    glow.addColorStop(0, "rgba(0,255,255,0.055)");
    glow.addColorStop(0.35, "rgba(160,70,255,0.05)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    drawPlasma(now, pulse);
    drawParticles(delta, pulse);

    frameId = window.requestAnimationFrame(tick);
  }

  function startEmbers() {
    if (!canvas || !connectStage || reducedMotionQuery.matches || document.hidden) {
      return;
    }
    if (!ctx) {
      ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) {
        return;
      }
    }
    resizeCanvas();
    if (!frameId) {
      lastTick = performance.now();
      frameId = window.requestAnimationFrame(tick);
    }
  }

  function stopEmbers() {
    if (frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }
    if (ctx && width && height) {
      ctx.clearRect(0, 0, width, height);
    }
  }

  function pauseConnectLogoVideo() {
    if (logoVideo && typeof logoVideo.pause === "function") {
      logoVideo.pause();
    }
  }

  function setConnectLogoFallback(isFallback) {
    if (!logoFrame || !logoVideo || !logoFallback) {
      return;
    }

    logoFrame.classList.toggle("is-fallback", Boolean(isFallback));
    if (isFallback) {
      pauseConnectLogoVideo();
    }
  }

  function syncConnectLogoPlayback() {
    if (!logoVideo || !logoFrame) {
      return;
    }

    const shouldUseFallback = reducedMotionQuery.matches || Boolean(logoVideo.error);
    setConnectLogoFallback(shouldUseFallback);
    logoVideo.muted = true;
    logoVideo.loop = true;
    logoVideo.playsInline = true;
    logoVideo.setAttribute("playsinline", "");
    logoVideo.removeAttribute("controls");

    if (shouldUseFallback || !active || document.hidden) {
      pauseConnectLogoVideo();
      return;
    }

    const playResult = logoVideo.play();
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(() => setConnectLogoFallback(true));
    }
  }

  function setElementHidden(element, isHidden) {
    if (!element) {
      return;
    }
    element.setAttribute("aria-hidden", String(isHidden));
    if (isHidden) {
      element.setAttribute("inert", "");
    } else {
      element.removeAttribute("inert");
    }
  }

  function hideConnectShell() {
    active = false;
    document.body.classList.remove("is-connect-route");
    if (shell) {
      shell.classList.remove("is-connect-view");
    }
    setElementHidden(connectShell, true);
    stopEmbers();
    pauseConnectLogoVideo();
  }

  function hideOtherShellSurfaces() {
    setElementHidden(homeFrame, true);
    setElementHidden(portfolioHub, true);
    setElementHidden(modulePlaceholder, true);
    setElementHidden(musicNexusShell, true);
    setElementHidden(ringArchiveShell, true);
    setElementHidden(aboutShell, true);
    setElementHidden(calendarShell, true);
    setElementHidden(contactShell, true);

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
  }

  function showConnectShell() {
    if (!connectShell) {
      return;
    }

    active = true;
    scheduleViewportSync();
    if (typeof closeGlobalMenu === "function") {
      closeGlobalMenu({ shouldRestoreFocus: false });
    }
    window.clearTimeout(activationTimer);
    if (shell) {
      shell.classList.remove(
        "is-activating",
        "is-reduced-activation",
        "is-module-view",
        "is-placeholder-view",
        "is-music-nexus-view",
        "is-ring-archive-view",
        "is-wrestling-people-view",
        "is-wrestling-person-detail-view",
        "is-wrestling-venues-view",
        "is-wrestling-venue-detail-view",
        "is-wrestling-shows-view",
        "is-wrestling-show-detail-view",
        "is-wrestling-match-gallery-view",
        "is-wrestling-lightbox-view",
        "is-about-view",
        "is-calendar-view",
        "is-contact-view"
      );
      shell.classList.add("has-entered-hub", "is-connect-view");
    }
    document.body.classList.add("is-connect-route");
    hideOtherShellSurfaces();
    setElementHidden(connectShell, false);
    if (typeof setHubChromeHidden === "function") {
      setHubChromeHidden(true);
    }
    if (typeof setCurrentView === "function") {
      setCurrentView("Connect");
    }
    if (typeof setActiveGlobalNav === "function") {
      setActiveGlobalNav("connect");
    }
    if (startButton) {
      startButton.disabled = true;
      startButton.setAttribute("aria-busy", "false");
    }
    if (typeof connectShell.scrollTo === "function") {
      connectShell.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    startEmbers();
    syncConnectLogoPlayback();
  }

  function handleInternalRouteClick(event) {
    const link = event.currentTarget;
    if (!link || !link.getAttribute("href") || typeof navigateToRoute !== "function") {
      return;
    }

    event.preventDefault();
    navigateToRoute(link.getAttribute("href"));
  }

  function syncMotionPreference() {
    if (!active) {
      return;
    }
    if (reducedMotionQuery.matches) {
      stopEmbers();
    } else {
      startEmbers();
    }
    syncConnectLogoPlayback();
  }

  function initConnectPage() {
    markWebviewContext();
    setConnectViewportVars();
    setConnectLogoFallback(reducedMotionQuery.matches);

    document.querySelectorAll("[data-connect-internal-route]").forEach((link) => {
      link.addEventListener("click", handleInternalRouteClick);
    });

    if (canvas && connectStage && "ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(() => {
        if (active) {
          resizeCanvas();
        }
      });
      resizeObserver.observe(connectStage);
    } else {
      window.addEventListener("resize", () => {
        if (active) {
          resizeCanvas();
        }
      }, { passive: true });
    }

    window.addEventListener("resize", scheduleViewportSync, { passive: true });
    window.addEventListener("orientationchange", scheduleViewportSync, { passive: true });
    window.addEventListener("pageshow", scheduleViewportSync, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", scheduleViewportSync, { passive: true });
      window.visualViewport.addEventListener("scroll", scheduleViewportSync, { passive: true });
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopEmbers();
        pauseConnectLogoVideo();
      } else if (active) {
        startEmbers();
        syncConnectLogoPlayback();
      }
    });

    if (logoVideo) {
      logoVideo.addEventListener("error", () => setConnectLogoFallback(true));
      logoVideo.addEventListener("canplay", syncConnectLogoPlayback);
    }

    if (typeof reducedMotionQuery.addEventListener === "function") {
      reducedMotionQuery.addEventListener("change", syncMotionPreference);
    } else if (typeof reducedMotionQuery.addListener === "function") {
      reducedMotionQuery.addListener(syncMotionPreference);
    }

    window.addEventListener("pagehide", () => {
      stopEmbers();
      pauseConnectLogoVideo();
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    });
  }

  window.showConnectShell = showConnectShell;
  window.hideConnectShell = hideConnectShell;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initConnectPage, { once: true });
  } else {
    initConnectPage();
  }
})();
