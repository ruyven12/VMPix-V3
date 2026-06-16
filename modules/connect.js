/* =========================================================
   VMPix V3 Connect page.
   Standalone NFC/social hub with scoped V2 HUD-inspired effects.
   ========================================================= */

(function () {
  "use strict";

  const root = document.documentElement;
  const connectStage = document.querySelector("[data-connect-stage]");
  const canvas = document.querySelector("[data-connect-embers]");
  const connectPanel = document.querySelector(".connect-panel");
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
  let effectBoundsFrame = 0;
  let dataRoadMetrics = null;

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
      setConnectEffectBounds();
    });
  }

  function setConnectEffectBounds() {
    if (!connectStage || !connectPanel) {
      return;
    }

    const stageRect = connectStage.getBoundingClientRect();
    const panelRect = connectPanel.getBoundingClientRect();
    const top = Math.max(0, panelRect.top - stageRect.top);
    const right = Math.max(0, stageRect.right - panelRect.right);
    const bottom = Math.max(0, stageRect.bottom - panelRect.bottom);
    const left = Math.max(0, panelRect.left - stageRect.left);
    const panelStyle = window.getComputedStyle(connectPanel);
    const radius = panelStyle.borderTopLeftRadius || "22px";

    connectStage.style.setProperty("--connect-effect-top", `${Math.round(top)}px`);
    connectStage.style.setProperty("--connect-effect-right", `${Math.round(right)}px`);
    connectStage.style.setProperty("--connect-effect-bottom", `${Math.round(bottom)}px`);
    connectStage.style.setProperty("--connect-effect-left", `${Math.round(left)}px`);
    connectStage.style.setProperty("--connect-effect-radius", radius);
  }

  function scheduleEffectBoundsSync() {
    if (effectBoundsFrame) {
      window.cancelAnimationFrame(effectBoundsFrame);
    }
    effectBoundsFrame = window.requestAnimationFrame(() => {
      effectBoundsFrame = 0;
      setConnectEffectBounds();
    });
  }

  function getParticleCount() {
    const shortSide = Math.min(width || 360, height || 720);
    if (isSocialWebview || shortSide < 520) {
      return 2322;
    }
    if (shortSide < 760) {
      return 3024;
    }
    return 3996;
  }

  function getDataLaneCount() {
    const shortSide = Math.min(width || 360, height || 720);
    if (shortSide < 520 || isSocialWebview) {
      return 7;
    }
    return 9;
  }

  function buildDataRoadMetrics() {
    let left = 0;
    let top = 0;
    let right = width;
    let bottom = height;
    let targetX = width * 0.5;
    let targetY = height * 0.16;

    if (connectStage && connectPanel) {
      const stageRect = connectStage.getBoundingClientRect();
      const panelRect = connectPanel.getBoundingClientRect();
      if (panelRect.width && panelRect.height) {
        left = Math.max(0, panelRect.left - stageRect.left);
        top = Math.max(0, panelRect.top - stageRect.top);
        right = Math.min(width, panelRect.right - stageRect.left);
        bottom = Math.min(height, panelRect.bottom - stageRect.top);
      }
    }

    if (connectStage && logoFrame) {
      const stageRect = connectStage.getBoundingClientRect();
      const logoRect = logoFrame.getBoundingClientRect();
      if (logoRect.width && logoRect.height) {
        targetX = (logoRect.left - stageRect.left) + (logoRect.width * 0.5);
        targetY = (logoRect.top - stageRect.top) + (logoRect.height * 0.58);
      }
    }

    const roadWidth = Math.max(1, right - left);
    const roadHeight = Math.max(1, bottom - top);
    const maxDistance = Math.max(
      1,
      Math.hypot(
        Math.max(targetX - left, right - targetX),
        Math.max(targetY - top, bottom - targetY)
      )
    );

    return {
      left,
      top,
      right,
      bottom,
      width: roadWidth,
      height: roadHeight,
      centerX: targetX,
      targetX,
      targetY,
      maxDistance,
      sinkRadius: Math.max(15, Math.min(roadWidth, roadHeight) * 0.055),
    };
  }

  function getDataRoadMetrics() {
    return dataRoadMetrics || buildDataRoadMetrics();
  }

  function getDataEdgePoint(road, ratio) {
    const inset = Math.min(10, Math.max(4, Math.min(road.width, road.height) * 0.018));
    const left = road.left + inset;
    const top = road.top + inset;
    const right = road.right - inset;
    const bottom = road.bottom - inset;
    const edgeWidth = Math.max(1, right - left);
    const edgeHeight = Math.max(1, bottom - top);
    const perimeter = (edgeWidth + edgeHeight) * 2;
    let position = ((((ratio % 1) + 1) % 1) * perimeter);

    if (position < edgeWidth) {
      return { x: left + position, y: top };
    }

    position -= edgeWidth;
    if (position < edgeHeight) {
      return { x: right, y: top + position };
    }

    position -= edgeHeight;
    if (position < edgeWidth) {
      return { x: right - position, y: bottom };
    }

    position -= edgeWidth;
    return { x: left, y: bottom - position };
  }

  function getDataLanePoint(particle) {
    const road = getDataRoadMetrics();
    const targetX = road.targetX + particle.targetOffsetX;
    const targetY = road.targetY + particle.targetOffsetY;
    const dx = targetX - particle.x;
    const dy = targetY - particle.y;
    const distance = Math.max(0.001, Math.hypot(dx, dy));
    const distanceProgress = Math.max(0, Math.min(1, distance / road.maxDistance));

    return {
      x: particle.x,
      y: particle.y,
      centerX: road.targetX,
      targetX,
      targetY,
      distance,
      distanceProgress,
      dirX: dx / distance,
      dirY: dy / distance,
      perspective: distanceProgress,
      scale: 0.46 + (0.98 * distanceProgress),
    };
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
      setConnectEffectBounds();
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
    setConnectEffectBounds();
    seedParticles();
  }

  function spawnParticle(index) {
    const road = getDataRoadMetrics();
    const edgeRatio = Math.random();
    const start = getDataEdgePoint(road, edgeRatio);
    const sinkJitter = Math.max(3, Math.min(16, road.width * 0.026));

    particles[index] = {
      x: start.x,
      y: start.y,
      edgeRatio,
      targetOffsetX: (Math.random() - 0.5) * sinkJitter,
      targetOffsetY: (Math.random() - 0.5) * sinkJitter,
      bitOffset: Math.random() * Math.PI * 2,
      bit: Math.random() > 0.5 ? "1" : "0",
      isGlyph: Math.random() < (isSocialWebview ? 0.06 : 0.1),
      dashLength: 2.6 + Math.random() * 7.8,
      dashWidth: 0.8 + Math.random() * 1.4,
      speed: 1.05 + Math.random() * 2.55,
      alpha: 0.3 + Math.random() * 0.28,
      twinkle: 1.1 + Math.random() * 2.4,
      phase: Math.random() * Math.PI * 2,
      wobble: 0.4 + Math.random() * 1.4,
      gust: (Math.random() - 0.5) * 0.9,
      flare: 0.65 + Math.random() * 1.3,
    };
  }

  function seedParticles() {
    const count = getParticleCount();
    particles.length = count;
    for (let index = 0; index < count; index += 1) {
      spawnParticle(index);
      const road = getDataRoadMetrics();
      const particle = particles[index];
      const start = getDataEdgePoint(road, particle.edgeRatio);
      const progress = Math.random();
      const targetX = road.targetX + particle.targetOffsetX;
      const targetY = road.targetY + particle.targetOffsetY;
      const curve = Math.sin(particle.phase) * Math.sin(progress * Math.PI) * Math.min(28, road.width * 0.055);
      particle.x = start.x + ((targetX - start.x) * progress) + curve;
      particle.y = start.y + ((targetY - start.y) * progress) + (Math.cos(particle.phase) * curve * 0.35);
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

  function getParticleDataColor(phase) {
    const palette = [
      { r: 0, g: 214, b: 255 },
      { r: 108, g: 92, b: 255 },
      { r: 255, g: 63, b: 176 },
      { r: 255, g: 142, b: 35 },
      { r: 255, g: 45, b: 24 },
      { r: 150, g: 255, b: 82 },
      { r: 255, g: 235, b: 144 },
    ];
    const cycle = ((Math.sin(phase * 0.52) + 1) * 0.5) * palette.length;
    const startIndex = Math.floor(cycle) % palette.length;
    const endIndex = (startIndex + 1) % palette.length;
    const blend = cycle - Math.floor(cycle);
    const start = palette[startIndex];
    const end = palette[endIndex];

    return {
      r: Math.round(start.r + ((end.r - start.r) * blend)),
      g: Math.round(start.g + ((end.g - start.g) * blend)),
      b: Math.round(start.b + ((end.b - start.b) * blend)),
    };
  }

  function drawDataHighway(now, pulse) {
    const previousComposite = ctx.globalCompositeOperation;
    const road = getDataRoadMetrics();
    const lineCount = isSocialWebview || width < 520 ? 18 : 26;
    const drift = (now / 36000) % 1;
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";

    for (let lane = 0; lane < lineCount; lane += 1) {
      const start = getDataEdgePoint(road, (lane / lineCount) + drift);
      const bend = lane % 2 === 0 ? 1 : -1;
      const controlX = road.targetX + ((start.y - road.targetY) * 0.085 * bend);
      const controlY = road.targetY + ((start.y - road.targetY) * 0.42);

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.quadraticCurveTo(controlX, controlY, road.targetX, road.targetY);
      ctx.strokeStyle = `rgba(0,255,255,${0.026 * pulse})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,82,34,${0.018 * pulse})`;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      const flow = ((now / 1450) + (lane * 0.137)) % 1;
      const head = Math.pow(flow, 0.82);
      const tail = Math.max(0, head - 0.06);
      const headX = start.x + ((road.targetX - start.x) * head);
      const headY = start.y + ((road.targetY - start.y) * head);
      const tailX = start.x + ((road.targetX - start.x) * tail);
      const tailY = start.y + ((road.targetY - start.y) * tail);
      const fade = Math.sin(flow * Math.PI);

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(headX, headY);
      ctx.strokeStyle = `rgba(0,255,255,${0.09 * pulse * fade})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,62,28,${0.052 * pulse * fade})`;
      ctx.lineWidth = 2.6;
      ctx.stroke();
    }

    ctx.globalCompositeOperation = previousComposite;
  }

  function drawParticles(delta, pulse) {
    for (let index = 0; index < particles.length; index += 1) {
      let particle = particles[index];
      const step = delta / 16.7;
      particle.phase += 0.04 * particle.twinkle * step;
      const road = getDataRoadMetrics();
      let point = getDataLanePoint(particle);

      if (point.distance < road.sinkRadius) {
        spawnParticle(index);
        continue;
      }

      const inwardSpeed = particle.speed * step * (0.82 + ((1 - point.distanceProgress) * 2.15));
      const swirl = Math.sin((particle.phase * 1.34) + particle.bitOffset) * particle.wobble * (1 - point.distanceProgress) * 1.35 * step;
      particle.x += (point.dirX * inwardSpeed) + (-point.dirY * swirl);
      particle.y += (point.dirY * inwardSpeed) + (point.dirX * swirl);

      point = getDataLanePoint(particle);
      if (
        point.distance < road.sinkRadius ||
        particle.x < road.left - 18 ||
        particle.x > road.right + 18 ||
        particle.y < road.top - 18 ||
        particle.y > road.bottom + 18
      ) {
        spawnParticle(index);
        continue;
      }

      const flicker = 0.78 + 0.22 * Math.sin(particle.phase);
      const flarePulse = 0.84 + (0.38 * Math.sin(particle.phase * particle.flare));
      const alpha = Math.min(0.35, particle.alpha * flicker * flarePulse * pulse * Math.max(0.18, point.distanceProgress));
      const coreColor = getParticleDataColor(particle.phase + (index * 0.013));
      const haloColor = getParticleDataColor(particle.phase + 1.7 + (index * 0.021));
      const dashLength = particle.dashLength * point.scale;
      const dashWidth = Math.max(0.8, particle.dashWidth * point.scale);

      if (particle.isGlyph && point.distanceProgress > 0.24) {
        ctx.font = `${Math.max(7, 7.5 * point.scale)}px ui-monospace, SFMono-Regular, Consolas, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = `rgba(${haloColor.r},${haloColor.g},${haloColor.b},${alpha * 0.24})`;
        ctx.fillText(particle.bit, point.x + 1.2, point.y + 0.8);
        ctx.fillStyle = `rgba(${coreColor.r},${coreColor.g},${coreColor.b},${alpha})`;
        ctx.fillText(particle.bit, point.x, point.y);
      } else {
        const tail = dashLength * (1.15 + ((1 - point.distanceProgress) * 1.7));
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${haloColor.r},${haloColor.g},${haloColor.b},${alpha * 0.2})`;
        ctx.lineWidth = dashWidth * 3.1;
        ctx.moveTo(point.x - (point.dirX * tail), point.y - (point.dirY * tail));
        ctx.lineTo(point.x + (point.dirX * dashWidth), point.y + (point.dirY * dashWidth));
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = `rgba(${coreColor.r},${coreColor.g},${coreColor.b},${alpha})`;
        ctx.lineWidth = dashWidth;
        ctx.moveTo(point.x - (point.dirX * tail), point.y - (point.dirY * tail));
        ctx.lineTo(point.x + (point.dirX * dashWidth), point.y + (point.dirY * dashWidth));
        ctx.stroke();
      }
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
    dataRoadMetrics = buildDataRoadMetrics();

    ctx.clearRect(0, 0, width, height);
    const pulse = 0.84 + 0.16 * Math.sin((now / 2200) * Math.PI * 2);
    const glow = ctx.createRadialGradient(width * 0.5, height * 0.55, 10, width * 0.5, height * 0.55, Math.max(width, height) * 0.72);
    glow.addColorStop(0, "rgba(0,255,255,0.055)");
    glow.addColorStop(0.35, "rgba(160,70,255,0.05)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    drawDataHighway(now, pulse);
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
    setConnectEffectBounds();
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
    setConnectEffectBounds();
    setConnectLogoFallback(reducedMotionQuery.matches);

    document.querySelectorAll("[data-connect-internal-route]").forEach((link) => {
      link.addEventListener("click", handleInternalRouteClick);
    });

    if (canvas && connectStage && "ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(() => {
        if (active) {
          resizeCanvas();
          setConnectEffectBounds();
        }
      });
      resizeObserver.observe(connectStage);
      if (connectPanel) {
        resizeObserver.observe(connectPanel);
      }
    } else {
      window.addEventListener("resize", () => {
        if (active) {
          resizeCanvas();
          setConnectEffectBounds();
        }
      }, { passive: true });
    }

    window.addEventListener("resize", scheduleViewportSync, { passive: true });
    window.addEventListener("resize", scheduleEffectBoundsSync, { passive: true });
    window.addEventListener("orientationchange", scheduleViewportSync, { passive: true });
    window.addEventListener("orientationchange", scheduleEffectBoundsSync, { passive: true });
    window.addEventListener("pageshow", scheduleViewportSync, { passive: true });
    window.addEventListener("pageshow", scheduleEffectBoundsSync, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", scheduleViewportSync, { passive: true });
      window.visualViewport.addEventListener("resize", scheduleEffectBoundsSync, { passive: true });
      window.visualViewport.addEventListener("scroll", scheduleViewportSync, { passive: true });
      window.visualViewport.addEventListener("scroll", scheduleEffectBoundsSync, { passive: true });
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
      if (effectBoundsFrame) {
        window.cancelAnimationFrame(effectBoundsFrame);
        effectBoundsFrame = 0;
      }
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
