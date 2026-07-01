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

const ROUTE_TITLE_LABELS = {
  home: "Welcome to Voodoo Media V3.0.01",
  portfolio: "The Interactive Portfolio - Voodoo Media V3.0.01",
};

function setDocumentTitle(title) {
  if (title) {
    document.title = title;
  }
}

const PORTFOLIO_WORLD_SELECTION_CONFIG = {
  portfolio: {
    id: "portfolio",
    label: "Interactive Portfolio",
    description: "Select a destination star to begin archive analysis.",
    status: "STANDBY",
    statusType: "standby",
  },
  horizon: {
    id: "horizon",
    label: "The Horizon",
    description: "Explore sunsets, landscapes, travel, and the quieter moments that exist beyond the stage and the ring.",
    status: "COMING SOON",
    statusType: "coming-soon",
  },
  soundtrack: {
    id: "soundtrack",
    label: "The Soundtrack",
    description: "Experience the artists, venues, and performances that shaped the soundtrack of the archive.",
    status: "DECODING",
    statusType: "decoding",
  },
  cosmos: {
    id: "cosmos",
    label: "The Cosmos",
    description: "Discover the creative universe where ideas, concepts, and the archive itself continue to evolve.",
    status: "COMING SOON",
    statusType: "coming-soon",
  },
  battleground: {
    id: "battleground",
    label: "The Battleground",
    description: "Step inside the world of professional wrestling through the matches, moments, and personalities captured ringside.",
    status: "DECODING",
    statusType: "decoding",
  },
  wild: {
    id: "wild",
    label: "The Wild",
    description: "Venture into the unexpected with wildlife, nature, and the untamed side of the archive.",
    status: "COMING SOON",
    statusType: "coming-soon",
  },
  story: {
    id: "story",
    label: "The Story",
    description: "Discover the journey, passion, and moments that brought this archive to life.",
    status: "INFORMATION",
    statusType: "information",
  },
  trajectory: {
    id: "trajectory",
    label: "The Trajectory",
    description: "Follow the evolution of the archive through milestones, goals, and what's still to come.",
    status: "INFORMATION",
    statusType: "information",
  },
  comms: {
    id: "comms",
    label: "The Comms",
    description: "Connect for booking, availability, collaboration, and upcoming events.",
    status: "INFORMATION",
    statusType: "information",
  },
};
const PORTFOLIO_GATEWAY_WORLD_CONFIG = {
  horizon: {
    route: "",
    background: "horizon",
    isRouteable: false,
  },
  soundtrack: {
    route: routePaths.music,
    background: "soundtrack",
    isRouteable: true,
  },
  cosmos: {
    route: "",
    background: "cosmos",
    isRouteable: false,
  },
  battleground: {
    route: routePaths.wrestling,
    background: "battleground",
    backgroundSrc: "/assets/media/background/battleground-main.png",
    isRouteable: true,
  },
  wild: {
    route: "",
    background: "wild",
    isRouteable: false,
  },
};

const portfolioEngine = document.querySelector("[data-portfolio-engine]");
const portfolioEngineCurrentView = document.querySelector("[data-portfolio-engine-current-view]");
const portfolioEngineLightningOverlay = portfolioEngine?.querySelector(".engine-lightning-overlay") || null;
const portfolioEngineLightningMainPaths = portfolioEngineLightningOverlay
  ? Array.from(portfolioEngineLightningOverlay.querySelectorAll(".engine-lightning-main"))
  : [];
const portfolioEngineLightningMainPath = portfolioEngineLightningOverlay?.querySelector(".engine-lightning-main--center") || portfolioEngineLightningMainPaths[0] || null;
const portfolioEngineLightningBranchPaths = portfolioEngineLightningOverlay
  ? Array.from(portfolioEngineLightningOverlay.querySelectorAll(".engine-lightning-branch"))
  : [];
const portfolioBeaconHotspots = Array.from(document.querySelectorAll("[data-portfolio-star]"));
const portfolioEngineScanLine = document.querySelector("[data-portfolio-engine-scan-line]");
const portfolioEngineScanAnchor = document.querySelector(".portfolio-engine-left-core");
const portfolioRightEmitter = document.querySelector(".portfolio-engine-reactor");
const portfolioStarFeedOverlay = document.querySelector("[data-portfolio-star-feed-overlay]");
const portfolioStarFeedStrands = portfolioStarFeedOverlay
  ? Array.from(portfolioStarFeedOverlay.querySelectorAll("[data-portfolio-star-feed-strand]"))
  : [];
const portfolioEngineProjection = document.querySelector("[data-portfolio-engine-projection]");
const portfolioWorldGateway = document.querySelector("[data-portfolio-world-gateway]");
const portfolioGatewayTrigger = document.querySelector("[data-portfolio-world-gateway-trigger]");
const portfolioEngineProjectionTitle = document.querySelector("[data-portfolio-projection-title]");
const portfolioEngineProjectionDescription = document.querySelector("[data-portfolio-projection-description]");
const portfolioEngineProjectionStatus = document.querySelector("[data-portfolio-projection-status]");
const PORTFOLIO_ENGINE_SCAN_DURATION_MS = 1320;
const PORTFOLIO_ENGINE_PROJECTION_DELAY_MS = 820;
const PORTFOLIO_ENGINE_PROJECTION_RETRACT_MS = 260;
const PORTFOLIO_ENGINE_GATEWAY_PROJECTION_FADE_MS = 96;
const PORTFOLIO_ENGINE_REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const PORTFOLIO_STAR_FEEDING_DURATION_MS = 180;
const PORTFOLIO_RIGHT_EMITTER_CHARGING_DURATION_MS = 430;
const PORTFOLIO_RIGHT_EMITTER_READY_DURATION_MS = 0;
const PORTFOLIO_GATEWAY_FOCUS_DURATION_MS = 680;
const PORTFOLIO_GATEWAY_REDUCED_FOCUS_DURATION_MS = 180;
const PORTFOLIO_GATEWAY_PULL_DURATION_MS = 720;
const PORTFOLIO_GATEWAY_REDUCED_PULL_DURATION_MS = 180;
const PORTFOLIO_GATEWAY_OPENING_DURATION_MS = 760;
const PORTFOLIO_GATEWAY_REDUCED_OPENING_DURATION_MS = 180;
const PORTFOLIO_GATEWAY_REVEAL_DURATION_MS = 780;
const PORTFOLIO_GATEWAY_REDUCED_REVEAL_DURATION_MS = 180;
const ENGINE_LIGHTNING_BASE_Y = 12;
const ENGINE_LIGHTNING_MIN_DELAY_MS = 96;
const ENGINE_LIGHTNING_MAX_DELAY_MS = 146;
const ENGINE_LIGHTNING_MAIN_SEGMENT_COUNT = 30;
const ENGINE_LIGHTNING_PRIMARY_BOLTS = [
  { yOffset: -2.05, amplitudeScale: 0.66, harmonicOffset: 0.62 },
  { yOffset: 2.05, amplitudeScale: 0.66, harmonicOffset: -0.62 },
  { yOffset: 0, amplitudeScale: 1, harmonicOffset: 0 },
];
const ENGINE_LIGHTNING_CENTER_BOLT_INDEX = 2;
const ENGINE_LIGHTNING_BRANCH_MIN_COUNT = 8;
const ENGINE_LIGHTNING_BRANCH_MAX_COUNT = 12;
const ENGINE_LIGHTNING_MAIN_EASE_MS = 86;
const ENGINE_LIGHTNING_BRANCH_EASE_MS = 74;
let portfolioEngineScanTimer = 0;
let portfolioEngineScanFrame = 0;
let portfolioEngineScanTarget = null;
let portfolioEngineProjectionTimer = 0;
let portfolioEngineProjectionRetractTimer = 0;
let portfolioEngineProjectionGatewayFade = null;
let portfolioStarFeedingTimer = 0;
let portfolioRightEmitterChargingTimer = 0;
let portfolioRightEmitterReadyTimer = 0;
let portfolioGatewayPhaseTimer = 0;
let portfolioStarFeedAnimationCycle = 0;
let portfolioEngineLightningTimer = 0;
let portfolioEngineLightningFrame = 0;
let portfolioEngineLightningBranchPolarity = 0;
let portfolioEngineLightningMainPointSets = [];
let portfolioEngineLightningMainTargetPointSets = [];
let portfolioEngineLightningBranchPointSets = [];
let portfolioEngineLightningBranchTargetPointSets = [];
let portfolioEngineLightningBranchOpacityValues = [];
let portfolioEngineLightningBranchTargetOpacityValues = [];
let portfolioEngineLightningBranchDirections = [];
let portfolioEngineLightningLastFrameAt = 0;
let portfolioEngineLightningNextTargetAt = 0;

function getPortfolioWorldSelectionConfig(worldName) {
  return PORTFOLIO_WORLD_SELECTION_CONFIG[worldName] || PORTFOLIO_WORLD_SELECTION_CONFIG.portfolio;
}

function getPortfolioGatewayConfig(worldName) {
  return PORTFOLIO_GATEWAY_WORLD_CONFIG[worldName] || null;
}

function getPortfolioGatewayRoute(worldName) {
  const config = getPortfolioGatewayConfig(worldName);
  return config?.route || "";
}

function isPortfolioGatewayWorldRouteable(worldName) {
  const config = getPortfolioGatewayConfig(worldName);
  return Boolean(config?.isRouteable && config.route);
}

function getPortfolioGatewayActiveWorld() {
  return shell?.dataset.activeWorld || "portfolio";
}

function isPortfolioGatewayActive() {
  return Boolean(
    shell?.classList.contains("is-portfolio-world-gateway-active") ||
    (shell?.dataset.portfolioGatewayState && shell.dataset.portfolioGatewayState !== "idle")
  );
}

function clearPortfolioGatewayPhaseTimer() {
  window.clearTimeout(portfolioGatewayPhaseTimer);
  portfolioGatewayPhaseTimer = 0;
}

function isPortfolioGatewayPhaseCurrent(state, worldName, route) {
  return Boolean(
    shell &&
    window.location.pathname === routePaths.portfolio &&
    shell.dataset.portfolioGatewayState === state &&
    shell.dataset.portfolioGatewayWorld === worldName &&
    shell.dataset.portfolioGatewayRoute === route &&
    shell.classList.contains("is-portfolio-world-gateway-active")
  );
}

function advancePortfolioGatewayToFillingScreen(worldName, route) {
  portfolioGatewayPhaseTimer = 0;
  if (!isPortfolioGatewayPhaseCurrent("revealing-world", worldName, route)) {
    return;
  }

  shell.dataset.portfolioGatewayState = "filling-screen";
  syncPortfolioGatewayTriggerState();
}

function queuePortfolioGatewayFillingScreen(worldName, route) {
  clearPortfolioGatewayPhaseTimer();
  const delay = isPortfolioEngineReducedMotion()
    ? PORTFOLIO_GATEWAY_REDUCED_REVEAL_DURATION_MS
    : PORTFOLIO_GATEWAY_REVEAL_DURATION_MS;
  portfolioGatewayPhaseTimer = window.setTimeout(() => {
    advancePortfolioGatewayToFillingScreen(worldName, route);
  }, delay);
}

function advancePortfolioGatewayToRevealingWorld(worldName, route) {
  portfolioGatewayPhaseTimer = 0;
  if (!isPortfolioGatewayPhaseCurrent("opening-ring", worldName, route)) {
    return;
  }

  shell.dataset.portfolioGatewayState = "revealing-world";
  queuePortfolioGatewayFillingScreen(worldName, route);
  syncPortfolioGatewayTriggerState();
}

function queuePortfolioGatewayRevealingWorld(worldName, route) {
  clearPortfolioGatewayPhaseTimer();
  const delay = isPortfolioEngineReducedMotion()
    ? PORTFOLIO_GATEWAY_REDUCED_OPENING_DURATION_MS
    : PORTFOLIO_GATEWAY_OPENING_DURATION_MS;
  portfolioGatewayPhaseTimer = window.setTimeout(() => {
    advancePortfolioGatewayToRevealingWorld(worldName, route);
  }, delay);
}

function advancePortfolioGatewayToOpeningRing(worldName, route) {
  portfolioGatewayPhaseTimer = 0;
  if (!isPortfolioGatewayPhaseCurrent("pulling-universe", worldName, route)) {
    return;
  }

  shell.dataset.portfolioGatewayState = "opening-ring";
  queuePortfolioGatewayRevealingWorld(worldName, route);
  syncPortfolioGatewayTriggerState();
}

function queuePortfolioGatewayOpeningRing(worldName, route) {
  clearPortfolioGatewayPhaseTimer();
  const delay = isPortfolioEngineReducedMotion()
    ? PORTFOLIO_GATEWAY_REDUCED_PULL_DURATION_MS
    : PORTFOLIO_GATEWAY_PULL_DURATION_MS;
  portfolioGatewayPhaseTimer = window.setTimeout(() => {
    advancePortfolioGatewayToOpeningRing(worldName, route);
  }, delay);
}

function advancePortfolioGatewayToPullingUniverse(worldName, route) {
  portfolioGatewayPhaseTimer = 0;
  if (!isPortfolioGatewayPhaseCurrent("focusing-star", worldName, route)) {
    return;
  }

  shell.dataset.portfolioGatewayState = "pulling-universe";
  queuePortfolioGatewayOpeningRing(worldName, route);
  syncPortfolioGatewayTriggerState();
}

function queuePortfolioGatewayPullingUniverse(worldName, route) {
  clearPortfolioGatewayPhaseTimer();
  const delay = isPortfolioEngineReducedMotion()
    ? PORTFOLIO_GATEWAY_REDUCED_FOCUS_DURATION_MS
    : PORTFOLIO_GATEWAY_FOCUS_DURATION_MS;
  portfolioGatewayPhaseTimer = window.setTimeout(() => {
    advancePortfolioGatewayToPullingUniverse(worldName, route);
  }, delay);
}

function clearPortfolioGatewayFocusState() {
  if (!shell || shell.dataset.portfolioGatewayState !== "focusing-star") {
    return false;
  }

  clearPortfolioGatewayPhaseTimer();
  shell.classList.remove("is-portfolio-world-gateway-active");
  shell.dataset.portfolioGatewayWorld = "";
  shell.dataset.portfolioGatewayRoute = "";
  shell.dataset.portfolioGatewayState = "idle";
  return true;
}

function shouldEnablePortfolioGatewayTrigger() {
  if (!shell || !portfolioGatewayTrigger || window.location.pathname !== routePaths.portfolio || isPortfolioGatewayActive()) {
    return false;
  }

  const activeWorld = getPortfolioGatewayActiveWorld();
  return Boolean(
    shell.dataset.portfolioEngineReady === "true" &&
    shell.dataset.portfolioStarFeedState === "ready" &&
    shell.dataset.portfolioStarFeedSource === activeWorld &&
    isPortfolioGatewayWorldRouteable(activeWorld)
  );
}

function syncPortfolioGatewayTriggerState() {
  if (!portfolioGatewayTrigger) {
    return;
  }

  const activeWorld = getPortfolioGatewayActiveWorld();
  const route = getPortfolioGatewayRoute(activeWorld);
  const isEnabled = shouldEnablePortfolioGatewayTrigger();
  portfolioGatewayTrigger.disabled = !isEnabled;
  portfolioGatewayTrigger.setAttribute("aria-disabled", String(!isEnabled));
  portfolioGatewayTrigger.dataset.portfolioGatewayWorld = isEnabled ? activeWorld : "";
  portfolioGatewayTrigger.dataset.portfolioGatewayRoute = isEnabled ? route : "";
}

function startPortfolioWorldGateway() {
  if (!shell || window.location.pathname !== routePaths.portfolio || isPortfolioGatewayActive()) {
    return false;
  }

  const activeWorld = getPortfolioGatewayActiveWorld();
  const route = getPortfolioGatewayRoute(activeWorld);
  if (
    shell.dataset.portfolioEngineReady !== "true" ||
    shell.dataset.portfolioStarFeedState !== "ready" ||
    shell.dataset.portfolioStarFeedSource !== activeWorld ||
    !isPortfolioGatewayWorldRouteable(activeWorld) ||
    !route
  ) {
    return false;
  }

  clearPortfolioGatewayPhaseTimer();
  shell.dataset.portfolioGatewayWorld = activeWorld;
  shell.dataset.portfolioGatewayRoute = route;
  shell.dataset.portfolioGatewayState = "focusing-star";
  shell.classList.add("is-portfolio-world-gateway-active");
  fadePortfolioEngineProjectionForGateway();
  queuePortfolioGatewayPullingUniverse(activeWorld, route);
  syncPortfolioGatewayTriggerState();
  return true;
}

function handlePortfolioGatewayTriggerClick(event) {
  event.preventDefault();
  if (portfolioGatewayTrigger?.disabled) {
    syncPortfolioGatewayTriggerState();
    return;
  }

  startPortfolioWorldGateway();
}

function setPortfolioEngineHudCurrentView(viewName) {
  if (portfolioEngineCurrentView) {
    portfolioEngineCurrentView.textContent = viewName;
  }
}

function isPortfolioEngineReducedMotion() {
  return Boolean(window.matchMedia?.(PORTFOLIO_ENGINE_REDUCED_MOTION_QUERY).matches);
}

function getPortfolioEngineLightningRandom(min, max) {
  return min + Math.random() * (max - min);
}

function getPortfolioEngineLightningDelay() {
  return Math.round(getPortfolioEngineLightningRandom(ENGINE_LIGHTNING_MIN_DELAY_MS, ENGINE_LIGHTNING_MAX_DELAY_MS));
}

function clampPortfolioEngineLightningY(value, min = 5.1, max = 18.9) {
  return Math.min(max, Math.max(min, value));
}

function formatPortfolioEngineLightningCoord(value) {
  return Number(value.toFixed(2)).toString();
}

function formatPortfolioEngineLightningPath(points) {
  return points.map((point, index) => {
    const command = index === 0 ? "M" : "L";
    return `${command}${formatPortfolioEngineLightningCoord(point.x)} ${formatPortfolioEngineLightningCoord(point.y)}`;
  }).join(" ");
}

function formatPortfolioStarFeedCoord(value) {
  return Number(value.toFixed(1)).toString();
}

function createPortfolioStarFeedStrandPath(sourceX, sourceY, targetX, targetY, strandIndex = 0) {
  const deltaX = targetX - sourceX;
  const deltaY = targetY - sourceY;
  const distance = Math.max(1, Math.hypot(deltaX, deltaY));
  const normalX = -deltaY / distance;
  const normalY = deltaX / distance;
  const strandOffsets = [-0.86, 0.42, 1.08, -1.18];
  const strandOffset = strandOffsets[strandIndex] || 0;
  const amplitude = Math.min(38, Math.max(11, distance * 0.044)) * (0.72 + strandIndex * 0.1);
  const seed = ((window.performance?.now?.() || Date.now()) % 997) * 0.013 + strandIndex * 1.87;
  const points = [];

  for (let segment = 0; segment <= 7; segment += 1) {
    const t = segment / 7;
    const edgeFade = Math.sin(Math.PI * t);
    const splitOffset = strandOffset * amplitude * 0.34 * edgeFade;
    const wander = Math.sin(seed + t * Math.PI * (2.8 + strandIndex * 0.26)) * amplitude * 0.44 * edgeFade;
    const kink = (segment % 2 ? 1 : -1) * amplitude * 0.12 * edgeFade;
    const offset = splitOffset + wander + kink;
    const x = sourceX + deltaX * t + normalX * offset;
    const y = sourceY + deltaY * t + normalY * offset;
    points.push({ x, y });
  }

  points[0] = { x: sourceX, y: sourceY };
  points[points.length - 1] = { x: targetX, y: targetY };
  return points.map((point, index) => {
    const command = index === 0 ? "M" : "L";
    return `${command}${formatPortfolioStarFeedCoord(point.x)} ${formatPortfolioStarFeedCoord(point.y)}`;
  }).join(" ");
}

function updatePortfolioStarFeedPaths(target) {
  if (!portfolioStarFeedOverlay || !portfolioStarFeedStrands.length || !portfolioRightEmitter || !target) {
    return false;
  }

  const sourceBounds = target.getBoundingClientRect();
  const emitterBounds = portfolioRightEmitter.getBoundingClientRect();
  if (!sourceBounds.width || !sourceBounds.height || !emitterBounds.width || !emitterBounds.height) {
    return false;
  }

  const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  const sourceX = sourceBounds.left + sourceBounds.width / 2;
  const sourceY = sourceBounds.top + sourceBounds.height / 2;
  const targetX = emitterBounds.left + emitterBounds.width / 2;
  const targetY = emitterBounds.top + emitterBounds.height / 2;

  portfolioStarFeedOverlay.setAttribute("viewBox", `0 0 ${formatPortfolioStarFeedCoord(viewportWidth)} ${formatPortfolioStarFeedCoord(viewportHeight)}`);
  portfolioStarFeedStrands.forEach((path, index) => {
    path.setAttribute("d", createPortfolioStarFeedStrandPath(sourceX, sourceY, targetX, targetY, index));
  });
  return true;
}

function clearPortfolioStarFeedAnimation() {
  portfolioStarFeedStrands.forEach((path) => {
    path.style.animation = "";
  });
}

function restartPortfolioStarFeedAnimation() {
  if (!shell) {
    return;
  }

  portfolioStarFeedAnimationCycle = (portfolioStarFeedAnimationCycle + 1) % 2;
  const animationName = portfolioStarFeedAnimationCycle === 0 ? "portfolioStarFeedStrand" : "portfolioStarFeedStrandAlt";
  shell.classList.toggle("is-portfolio-star-feed-cycle-a", portfolioStarFeedAnimationCycle === 0);
  shell.classList.toggle("is-portfolio-star-feed-cycle-b", portfolioStarFeedAnimationCycle === 1);
  portfolioStarFeedStrands.forEach((path) => {
    path.style.animation = "none";
  });
  if (portfolioStarFeedOverlay) {
    portfolioStarFeedOverlay.getBoundingClientRect();
  }
  portfolioStarFeedStrands.forEach((path) => {
    const delay = getComputedStyle(path).getPropertyValue("--portfolio-feed-delay").trim() || "0ms";
    path.style.animation = `${animationName} 162ms cubic-bezier(0.16, 0.82, 0.18, 1) ${delay} both`;
  });
}

function createPortfolioEngineLightningMainPoints(boltIndex = ENGINE_LIGHTNING_CENTER_BOLT_INDEX) {
  const points = [{ x: 0, y: ENGINE_LIGHTNING_BASE_Y }];
  const boltConfig = ENGINE_LIGHTNING_PRIMARY_BOLTS[boltIndex] || ENGINE_LIGHTNING_PRIMARY_BOLTS[ENGINE_LIGHTNING_CENTER_BOLT_INDEX];
  let direction = (Math.random() + boltIndex * 0.33) % 1 > 0.5 ? 1 : -1;

  for (let segment = 1; segment < ENGINE_LIGHTNING_MAIN_SEGMENT_COUNT; segment += 1) {
    const x = (100 / ENGINE_LIGHTNING_MAIN_SEGMENT_COUNT) * segment;
    direction *= -1;
    const edgeScale = Math.min(1, Math.min(x, 100 - x) / 14);
    const laneScale = Math.min(1, Math.min(x, 100 - x) / 18);
    const lowerChannelBias = x > 10 && x < 80 ? 0.38 : 0;
    const amplitude = getPortfolioEngineLightningRandom(0.54, 1.82) * edgeScale * boltConfig.amplitudeScale;
    const harmonic = Math.sin((x / 100) * Math.PI * 3.4 + boltConfig.harmonicOffset + portfolioEngineLightningBranchPolarity * 0.31) * 0.24 * boltConfig.amplitudeScale;
    const noise = getPortfolioEngineLightningRandom(-0.2, 0.2) * boltConfig.amplitudeScale;
    const laneOffset = boltConfig.yOffset * laneScale;
    points.push({
      x,
      y: clampPortfolioEngineLightningY(ENGINE_LIGHTNING_BASE_Y + laneOffset + lowerChannelBias + direction * amplitude + harmonic + noise, 5.6, 18.4),
    });
  }

  points.push({ x: 100, y: ENGINE_LIGHTNING_BASE_Y });
  return points;
}

function blendPortfolioEngineLightningPoints(previousPoints, nextPoints, nextWeight = 0.58) {
  if (!previousPoints || previousPoints.length !== nextPoints.length) {
    return nextPoints;
  }

  return nextPoints.map((point, index) => {
    if (index === 0 || index === nextPoints.length - 1) {
      return point;
    }

    const previousPoint = previousPoints[index];
    return {
      x: previousPoint.x + (point.x - previousPoint.x) * nextWeight,
      y: previousPoint.y + (point.y - previousPoint.y) * nextWeight,
    };
  });
}

function getPortfolioEngineLightningFrameWeight(deltaMs, easeMs) {
  const normalizedDelta = Math.min(48, Math.max(8, deltaMs));
  return Math.min(0.42, Math.max(0.08, normalizedDelta / easeMs));
}

function getPortfolioEngineLightningMainYAt(points, x) {
  for (let index = 1; index < points.length; index += 1) {
    const previousPoint = points[index - 1];
    const nextPoint = points[index];
    if (nextPoint.x < x) {
      continue;
    }

    const span = Math.max(0.001, nextPoint.x - previousPoint.x);
    const progress = (x - previousPoint.x) / span;
    return previousPoint.y + (nextPoint.y - previousPoint.y) * progress;
  }

  return ENGINE_LIGHTNING_BASE_Y;
}

function getPortfolioEngineLightningActiveBranchSlots(branchCapacity, branchCount) {
  if (branchCount >= branchCapacity) {
    return Array.from({ length: branchCapacity }, (_, index) => index);
  }

  if (branchCount <= 1) {
    return [0];
  }

  return Array.from({ length: branchCount }, (_, index) => (
    Math.round(((branchCapacity - 1) * index) / (branchCount - 1))
  ));
}

function createPortfolioEngineLightningBranchPoints(mainPoints, slotIndex, slotCount, direction) {
  const slotSpan = 84 / Math.max(1, slotCount - 1);
  const slotCenter = 8 + slotSpan * slotIndex;
  const startX = Math.min(92, Math.max(7, slotCenter + getPortfolioEngineLightningRandom(-2.35, 2.35)));
  const branchLength = getPortfolioEngineLightningRandom(4.4, 10.2);
  const endX = Math.min(97, startX + branchLength);
  const startY = getPortfolioEngineLightningMainYAt(mainPoints, startX);
  const endY = getPortfolioEngineLightningMainYAt(mainPoints, endX);
  const midPull = getPortfolioEngineLightningRandom(0.08, 0.58);

  return [
    { x: startX, y: startY },
    {
      x: startX + branchLength * getPortfolioEngineLightningRandom(0.18, 0.34),
      y: clampPortfolioEngineLightningY(startY + direction * getPortfolioEngineLightningRandom(1.9, 3.9), 5, 19),
    },
    {
      x: startX + branchLength * getPortfolioEngineLightningRandom(0.48, 0.68),
      y: clampPortfolioEngineLightningY(startY + (endY - startY) * midPull + direction * getPortfolioEngineLightningRandom(2.4, 5.2), 5, 19),
    },
    {
      x: startX + branchLength * getPortfolioEngineLightningRandom(0.72, 0.88),
      y: clampPortfolioEngineLightningY(endY + direction * getPortfolioEngineLightningRandom(1.1, 2.8), 5, 19),
    },
    {
      x: endX,
      y: clampPortfolioEngineLightningY(endY + direction * getPortfolioEngineLightningRandom(0.08, 0.56), 5, 19),
    },
  ];
}

function retargetPortfolioEngineLightning(timestamp = window.performance.now()) {
  portfolioEngineLightningMainTargetPointSets = portfolioEngineLightningMainPaths.map((path, index) => {
    const targetPoints = createPortfolioEngineLightningMainPoints(index);
    if (!portfolioEngineLightningMainPointSets[index]) {
      portfolioEngineLightningMainPointSets[index] = targetPoints;
      path.setAttribute("d", formatPortfolioEngineLightningPath(targetPoints));
    }
    return targetPoints;
  });
  const centerMainTargetPoints = portfolioEngineLightningMainTargetPointSets[ENGINE_LIGHTNING_CENTER_BOLT_INDEX] || portfolioEngineLightningMainTargetPointSets[0];

  const branchCapacity = Math.min(ENGINE_LIGHTNING_BRANCH_MAX_COUNT, portfolioEngineLightningBranchPaths.length);
  portfolioEngineLightningBranchPaths.forEach((path, index) => {
    if (index >= branchCapacity) {
      portfolioEngineLightningBranchTargetPointSets[index] = null;
      portfolioEngineLightningBranchTargetOpacityValues[index] = 0;
      return;
    }

    const branchDirection = index % 2 === 0 ? -1 : 1;
    const targetPoints = createPortfolioEngineLightningBranchPoints(
      centerMainTargetPoints,
      index,
      branchCapacity,
      branchDirection
    );
    portfolioEngineLightningBranchTargetPointSets[index] = targetPoints;
    if (!portfolioEngineLightningBranchPointSets[index]) {
      portfolioEngineLightningBranchPointSets[index] = targetPoints;
      path.setAttribute("d", formatPortfolioEngineLightningPath(targetPoints));
    }
    portfolioEngineLightningBranchDirections[index] = branchDirection;
    portfolioEngineLightningBranchTargetOpacityValues[index] = getPortfolioEngineLightningRandom(0.32, 0.88);
    if (!Number.isFinite(portfolioEngineLightningBranchOpacityValues[index])) {
      portfolioEngineLightningBranchOpacityValues[index] = portfolioEngineLightningBranchTargetOpacityValues[index];
      path.style.strokeOpacity = formatPortfolioEngineLightningCoord(portfolioEngineLightningBranchOpacityValues[index]);
    }
    path.style.setProperty("--engine-lightning-branch-order", String(index));
  });

  portfolioEngineLightningBranchPolarity = (portfolioEngineLightningBranchPolarity + 1) % 8;
  portfolioEngineLightningNextTargetAt = timestamp + getPortfolioEngineLightningDelay();
}

function renderPortfolioEngineLightningPaths(deltaMs = 16) {
  if (!portfolioEngineLightningMainPath || !portfolioEngineLightningMainTargetPointSets.length) {
    return;
  }

  const mainWeight = getPortfolioEngineLightningFrameWeight(deltaMs, ENGINE_LIGHTNING_MAIN_EASE_MS);
  portfolioEngineLightningMainPaths.forEach((path, index) => {
    const targetPoints = portfolioEngineLightningMainTargetPointSets[index];
    if (!targetPoints) {
      return;
    }
    const mainPoints = blendPortfolioEngineLightningPoints(
      portfolioEngineLightningMainPointSets[index],
      targetPoints,
      mainWeight
    );
    portfolioEngineLightningMainPointSets[index] = mainPoints;
    path.setAttribute("d", formatPortfolioEngineLightningPath(mainPoints));
  });

  const branchWeight = getPortfolioEngineLightningFrameWeight(deltaMs, ENGINE_LIGHTNING_BRANCH_EASE_MS);
  portfolioEngineLightningBranchPaths.forEach((path, index) => {
    const targetOpacity = portfolioEngineLightningBranchTargetOpacityValues[index];
    if (Number.isFinite(targetOpacity)) {
      const previousOpacity = Number.isFinite(portfolioEngineLightningBranchOpacityValues[index])
        ? portfolioEngineLightningBranchOpacityValues[index]
        : targetOpacity;
      const nextOpacity = previousOpacity + (targetOpacity - previousOpacity) * branchWeight;
      portfolioEngineLightningBranchOpacityValues[index] = nextOpacity;
      path.style.strokeOpacity = formatPortfolioEngineLightningCoord(nextOpacity);
    }

    const targetPoints = portfolioEngineLightningBranchTargetPointSets[index];
    if (!targetPoints) {
      return;
    }

    const branchPoints = blendPortfolioEngineLightningPoints(
      portfolioEngineLightningBranchPointSets[index],
      targetPoints,
      branchWeight
    );
    portfolioEngineLightningBranchPointSets[index] = branchPoints;
    path.setAttribute("d", formatPortfolioEngineLightningPath(branchPoints));
  });
}

function shouldRunPortfolioEngineLightning() {
  return Boolean(
    portfolioEngine?.isConnected &&
    portfolioEngineLightningOverlay?.isConnected &&
    portfolioEngineLightningMainPath &&
    portfolioEngineLightningMainPaths.length >= ENGINE_LIGHTNING_PRIMARY_BOLTS.length &&
    !isPortfolioEngineReducedMotion() &&
    shell?.dataset.portfolioEngineReady === "true"
  );
}

function stopPortfolioEngineLightning() {
  window.clearTimeout(portfolioEngineLightningTimer);
  portfolioEngineLightningTimer = 0;
  if (portfolioEngineLightningFrame) {
    window.cancelAnimationFrame(portfolioEngineLightningFrame);
    portfolioEngineLightningFrame = 0;
  }
  portfolioEngineLightningLastFrameAt = 0;
  portfolioEngineLightningNextTargetAt = 0;
  portfolioEngineLightningBranchOpacityValues = [];
  portfolioEngineLightningBranchTargetOpacityValues = [];
  portfolioEngineLightningBranchPaths.forEach((path) => {
    path.style.strokeOpacity = "";
  });
  portfolioEngineLightningOverlay?.removeAttribute("data-engine-lightning-state");
}

function stepPortfolioEngineLightning(timestamp) {
  portfolioEngineLightningFrame = 0;
  if (!shouldRunPortfolioEngineLightning()) {
    stopPortfolioEngineLightning();
    return;
  }

  const deltaMs = portfolioEngineLightningLastFrameAt
    ? timestamp - portfolioEngineLightningLastFrameAt
    : 16;
  portfolioEngineLightningLastFrameAt = timestamp;

  if (!portfolioEngineLightningMainTargetPointSets.length || timestamp >= portfolioEngineLightningNextTargetAt) {
    retargetPortfolioEngineLightning(timestamp);
  }

  renderPortfolioEngineLightningPaths(deltaMs);
  portfolioEngineLightningFrame = window.requestAnimationFrame(stepPortfolioEngineLightning);
}

function queuePortfolioEngineLightningTick() {
  if (!shouldRunPortfolioEngineLightning() || portfolioEngineLightningFrame) {
    return;
  }

  portfolioEngineLightningFrame = window.requestAnimationFrame(stepPortfolioEngineLightning);
}

function startPortfolioEngineLightning() {
  if (!shouldRunPortfolioEngineLightning()) {
    stopPortfolioEngineLightning();
    return;
  }

  portfolioEngineLightningOverlay?.setAttribute("data-engine-lightning-state", "live");
  if (!portfolioEngineLightningMainTargetPointSets.length) {
    retargetPortfolioEngineLightning(window.performance.now());
  }
  queuePortfolioEngineLightningTick();
}

function syncPortfolioEngineLightningMotion() {
  if (shouldRunPortfolioEngineLightning()) {
    startPortfolioEngineLightning();
    return;
  }

  stopPortfolioEngineLightning();
}

function initPortfolioEngineLightning() {
  if (!portfolioEngineLightningMainPath) {
    return;
  }

  syncPortfolioEngineLightningMotion();
}

function setPortfolioBeaconHotspotsEnabled(isEnabled) {
  portfolioBeaconHotspots.forEach((button) => {
    button.disabled = !isEnabled;
    button.setAttribute("aria-disabled", String(!isEnabled));
  });
}

function clearPortfolioStarEmitterChargeState() {
  clearPortfolioStarFeedAnimation();
  window.clearTimeout(portfolioStarFeedingTimer);
  window.clearTimeout(portfolioRightEmitterChargingTimer);
  window.clearTimeout(portfolioRightEmitterReadyTimer);
  portfolioStarFeedingTimer = 0;
  portfolioRightEmitterChargingTimer = 0;
  portfolioRightEmitterReadyTimer = 0;

  if (!shell) {
    return;
  }

  shell.classList.remove(
    "is-portfolio-star-feeding",
    "is-portfolio-right-emitter-charging",
    "is-portfolio-right-emitter-ready",
    "is-portfolio-star-feed-cycle-a",
    "is-portfolio-star-feed-cycle-b"
  );
  delete shell.dataset.portfolioStarFeedState;
  delete shell.dataset.portfolioStarFeedSource;
  syncPortfolioGatewayTriggerState();
}

function setPortfolioStarEmitterChargeState(state, sourceWorld) {
  if (!shell) {
    return;
  }

  shell.dataset.portfolioStarFeedState = state;
  shell.dataset.portfolioStarFeedSource = sourceWorld;
  shell.classList.toggle("is-portfolio-star-feeding", state === "feeding");
  shell.classList.toggle("is-portfolio-right-emitter-charging", state === "feeding" || state === "charging");
  shell.classList.toggle("is-portfolio-right-emitter-ready", state === "ready");
  if (state !== "feeding") {
    clearPortfolioStarFeedAnimation();
  }
  syncPortfolioGatewayTriggerState();
}

function triggerPortfolioStarEmitterCharge(target) {
  const worldName = target?.dataset.portfolioStar || "portfolio";
  const config = getPortfolioWorldSelectionConfig(worldName);
  if (
    !shell ||
    !target?.classList.contains("portfolio-beacon--world") ||
    config.id === "portfolio" ||
    window.location.pathname !== routePaths.portfolio ||
    shell.dataset.portfolioEngineReady !== "true"
  ) {
    clearPortfolioStarEmitterChargeState();
    return;
  }

  clearPortfolioStarEmitterChargeState();
  if (!updatePortfolioStarFeedPaths(target)) {
    return;
  }
  restartPortfolioStarFeedAnimation();
  setPortfolioStarEmitterChargeState("feeding", config.id);
  portfolioStarFeedingTimer = window.setTimeout(() => {
    portfolioStarFeedingTimer = 0;
    setPortfolioStarEmitterChargeState("charging", config.id);
  }, PORTFOLIO_STAR_FEEDING_DURATION_MS);
  portfolioRightEmitterChargingTimer = window.setTimeout(() => {
    portfolioRightEmitterChargingTimer = 0;
    setPortfolioStarEmitterChargeState("ready", config.id);
  }, PORTFOLIO_RIGHT_EMITTER_CHARGING_DURATION_MS);
  if (PORTFOLIO_RIGHT_EMITTER_READY_DURATION_MS > 0) {
    portfolioRightEmitterReadyTimer = window.setTimeout(() => {
      clearPortfolioStarEmitterChargeState();
    }, PORTFOLIO_RIGHT_EMITTER_READY_DURATION_MS);
  }
}

function clearPortfolioEngineScan() {
  window.clearTimeout(portfolioEngineScanTimer);
  portfolioEngineScanTimer = 0;
  if (portfolioEngineScanFrame) {
    window.cancelAnimationFrame(portfolioEngineScanFrame);
    portfolioEngineScanFrame = 0;
  }
  portfolioEngineScanTarget = null;
  if (shell) {
    shell.classList.remove("is-portfolio-scan-active");
  }
}

function clearPortfolioEngineProjectionGatewayFadeStyles() {
  if (!portfolioEngineProjection) {
    return;
  }

  portfolioEngineProjection.style.removeProperty("visibility");
  portfolioEngineProjection.style.removeProperty("opacity");
  portfolioEngineProjection.style.removeProperty("filter");
  portfolioEngineProjection.style.removeProperty("transform");
  portfolioEngineProjection.style.removeProperty("transition");
}

function clearPortfolioEngineProjectionGatewayFade() {
  if (!portfolioEngineProjectionGatewayFade) {
    return false;
  }

  window.clearTimeout(portfolioEngineProjectionGatewayFade.startTimer);
  window.clearTimeout(portfolioEngineProjectionGatewayFade.finishTimer);
  portfolioEngineProjectionGatewayFade = null;
  clearPortfolioEngineProjectionGatewayFadeStyles();
  return true;
}

function finishPortfolioEngineProjectionGatewayFade(fade) {
  if (portfolioEngineProjectionGatewayFade !== fade || !portfolioEngineProjection) {
    return;
  }

  portfolioEngineProjection.style.visibility = "hidden";
  portfolioEngineProjection.style.opacity = "0";
  portfolioEngineProjection.style.filter = "blur(0.8px)";
  portfolioEngineProjection.style.transform = "translate3d(0, 0.42rem, 0) scale3d(0.986, 0.968, 1)";
  portfolioEngineProjection.style.transition = "";
  fade.startTimer = 0;
  fade.finishTimer = 0;
}

function fadePortfolioEngineProjectionForGateway() {
  const hadGatewayProjectionFade = clearPortfolioEngineProjectionGatewayFade();
  window.clearTimeout(portfolioEngineProjectionTimer);
  portfolioEngineProjectionTimer = 0;
  window.clearTimeout(portfolioEngineProjectionRetractTimer);
  portfolioEngineProjectionRetractTimer = 0;

  if (!shell || !portfolioEngineProjection) {
    return;
  }

  const projectionStyle = window.getComputedStyle(portfolioEngineProjection);
  const startOpacity = Number.parseFloat(projectionStyle.opacity) || 0;
  const startVisibility = projectionStyle.visibility;
  const startFilter = projectionStyle.filter;
  const startTransform = projectionStyle.transform;

  shell.classList.remove("is-portfolio-projection-active", "is-portfolio-projection-retracting");
  portfolioEngineProjection.setAttribute("aria-hidden", "true");

  if (
    hadGatewayProjectionFade ||
    isPortfolioEngineReducedMotion() ||
    startVisibility === "hidden" ||
    startOpacity <= 0.01
  ) {
    return;
  }

  const projectionFade = {
    startTimer: 0,
    finishTimer: 0,
  };
  const projectionFadeStyle = portfolioEngineProjection.style;

  projectionFadeStyle.transition = "none";
  projectionFadeStyle.visibility = "visible";
  projectionFadeStyle.opacity = String(startOpacity);
  projectionFadeStyle.filter = startFilter === "none" ? "blur(0)" : startFilter;
  projectionFadeStyle.transform = startTransform === "none"
    ? "translate3d(0, 0, 0) scale3d(1, 1, 1)"
    : startTransform;
  void portfolioEngineProjection.offsetWidth;

  portfolioEngineProjectionGatewayFade = projectionFade;
  projectionFadeStyle.transition = `opacity ${PORTFOLIO_ENGINE_GATEWAY_PROJECTION_FADE_MS}ms cubic-bezier(0.34, 0, 0.2, 1), filter ${PORTFOLIO_ENGINE_GATEWAY_PROJECTION_FADE_MS}ms cubic-bezier(0.34, 0, 0.2, 1), transform ${PORTFOLIO_ENGINE_GATEWAY_PROJECTION_FADE_MS}ms cubic-bezier(0.34, 0, 0.2, 1)`;
  projectionFadeStyle.opacity = "0";
  projectionFadeStyle.filter = "blur(0.7px)";
  projectionFadeStyle.transform = "translate3d(0, 0.38rem, 0) scale3d(0.988, 0.972, 1)";

  projectionFade.finishTimer = window.setTimeout(() => {
    finishPortfolioEngineProjectionGatewayFade(projectionFade);
  }, PORTFOLIO_ENGINE_GATEWAY_PROJECTION_FADE_MS + 48);
}

function hidePortfolioEngineProjection({ immediate = false } = {}) {
  const hadGatewayProjectionFade = clearPortfolioEngineProjectionGatewayFade();
  window.clearTimeout(portfolioEngineProjectionTimer);
  portfolioEngineProjectionTimer = 0;
  window.clearTimeout(portfolioEngineProjectionRetractTimer);
  portfolioEngineProjectionRetractTimer = 0;

  if (!shell || !portfolioEngineProjection) {
    return;
  }

  shell.classList.remove("is-portfolio-projection-active");
  portfolioEngineProjection.setAttribute("aria-hidden", "true");

  if (hadGatewayProjectionFade || immediate || isPortfolioEngineReducedMotion()) {
    shell.classList.remove("is-portfolio-projection-retracting");
    return;
  }

  shell.classList.add("is-portfolio-projection-retracting");
  portfolioEngineProjectionRetractTimer = window.setTimeout(() => {
    if (shell) {
      shell.classList.remove("is-portfolio-projection-retracting");
    }
    portfolioEngineProjectionRetractTimer = 0;
  }, PORTFOLIO_ENGINE_PROJECTION_RETRACT_MS);
}

function setPortfolioEngineProjectionContent(worldName) {
  const config = getPortfolioWorldSelectionConfig(worldName);
  if (portfolioEngineProjection) {
    portfolioEngineProjection.dataset.archiveStatus = config.statusType;
  }
  if (portfolioEngineProjectionTitle) {
    portfolioEngineProjectionTitle.textContent = config.label;
  }
  if (portfolioEngineProjectionDescription) {
    portfolioEngineProjectionDescription.textContent = config.description;
  }
  if (portfolioEngineProjectionStatus) {
    portfolioEngineProjectionStatus.textContent = config.status;
  }
}

function showPortfolioEngineProjection(worldName) {
  if (
    !shell ||
    !portfolioEngineProjection ||
    window.location.pathname !== routePaths.portfolio ||
    shell.dataset.portfolioEngineReady !== "true"
  ) {
    return;
  }

  clearPortfolioEngineProjectionGatewayFade();
  setPortfolioEngineProjectionContent(worldName);
  shell.classList.remove("is-portfolio-projection-retracting");
  portfolioEngineProjection.setAttribute("aria-hidden", "false");
  shell.classList.add("is-portfolio-projection-active");
}

function queuePortfolioEngineProjection(worldName) {
  hidePortfolioEngineProjection();
  window.clearTimeout(portfolioEngineProjectionTimer);
  portfolioEngineProjectionTimer = window.setTimeout(
    () => {
      portfolioEngineProjectionTimer = 0;
      showPortfolioEngineProjection(worldName);
    },
    isPortfolioEngineReducedMotion() ? 80 : PORTFOLIO_ENGINE_PROJECTION_DELAY_MS
  );
}

function updatePortfolioEngineScanCoordinates(target) {
  if (!portfolioEngineScanLine || !portfolioEngineScanAnchor || !target) {
    return false;
  }

  const anchorBounds = portfolioEngineScanAnchor.getBoundingClientRect();
  const targetBounds = target.getBoundingClientRect();
  if (!anchorBounds.width || !anchorBounds.height || !targetBounds.width || !targetBounds.height) {
    return false;
  }

  const anchorX = anchorBounds.left + anchorBounds.width / 2;
  const anchorY = anchorBounds.top + anchorBounds.height / 2;
  const targetX = targetBounds.left + targetBounds.width / 2;
  const targetY = targetBounds.top + targetBounds.height / 2;
  const deltaX = targetX - anchorX;
  const deltaY = targetY - anchorY;
  const distance = Math.hypot(deltaX, deltaY);

  portfolioEngineScanLine.style.setProperty("--portfolio-scan-x", `${anchorX}px`);
  portfolioEngineScanLine.style.setProperty("--portfolio-scan-y", `${anchorY}px`);
  portfolioEngineScanLine.style.setProperty("--portfolio-scan-length", `${distance}px`);
  portfolioEngineScanLine.style.setProperty("--portfolio-scan-angle", `${Math.atan2(deltaY, deltaX)}rad`);
  return true;
}

function triggerPortfolioEngineScan(target) {
  if (
    !shell ||
    !portfolioEngineScanLine ||
    !target ||
    window.location.pathname !== routePaths.portfolio ||
    shell.dataset.portfolioEngineReady !== "true"
  ) {
    return;
  }

  portfolioEngineScanTarget = target;
  window.clearTimeout(portfolioEngineScanTimer);
  if (portfolioEngineScanFrame) {
    window.cancelAnimationFrame(portfolioEngineScanFrame);
    portfolioEngineScanFrame = 0;
  }

  if (!updatePortfolioEngineScanCoordinates(target)) {
    return;
  }

  queuePortfolioEngineProjection(target.dataset.portfolioStar || "portfolio");
  shell.classList.remove("is-portfolio-scan-active");
  portfolioEngineScanFrame = window.requestAnimationFrame(() => {
    portfolioEngineScanFrame = 0;
    if (!updatePortfolioEngineScanCoordinates(target)) {
      return;
    }
    shell.classList.add("is-portfolio-scan-active");
    portfolioEngineScanTimer = window.setTimeout(() => {
      if (shell) {
        shell.classList.remove("is-portfolio-scan-active");
      }
      portfolioEngineScanTimer = 0;
    }, PORTFOLIO_ENGINE_SCAN_DURATION_MS);
  });
}

function refreshPortfolioEngineScan() {
  if (!shell || !shell.classList.contains("is-portfolio-scan-active") || !portfolioEngineScanTarget) {
    return;
  }

  updatePortfolioEngineScanCoordinates(portfolioEngineScanTarget);
}

function setPortfolioActiveWorld(worldName = "portfolio") {
  const config = getPortfolioWorldSelectionConfig(worldName);
  const previousWorld = shell?.dataset.activeWorld || "portfolio";
  const didChangeActiveWorld = previousWorld !== config.id;
  if (config.id === "portfolio") {
    clearPortfolioStarEmitterChargeState();
  }
  if (shell) {
    shell.dataset.activeWorld = config.id;
  }
  if (didChangeActiveWorld) {
    clearPortfolioGatewayFocusState();
  }
  setPortfolioEngineHudCurrentView(config.label);
  portfolioBeaconHotspots.forEach((button) => {
    const isSelected = config.id !== "portfolio" && button.dataset.portfolioStar === config.id;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
  syncPortfolioGatewayTriggerState();
}

function handlePortfolioBeaconHotspotClick(event) {
  const button = event.currentTarget;
  if (!button || button.disabled || window.location.pathname !== routePaths.portfolio) {
    return;
  }

  event.preventDefault();
  const worldName = button.dataset.portfolioStar || "portfolio";
  setPortfolioActiveWorld(worldName);
  triggerPortfolioEngineScan(button);
  triggerPortfolioStarEmitterCharge(button);
}

function handlePortfolioBeaconHotspotKeydown(event) {
  if (event.key !== "Enter" && event.key !== " " && event.code !== "Space") {
    return;
  }

  const button = event.currentTarget;
  if (!button || button.disabled || window.location.pathname !== routePaths.portfolio) {
    return;
  }

  event.preventDefault();
  const worldName = button.dataset.portfolioStar || "portfolio";
  setPortfolioActiveWorld(worldName);
  triggerPortfolioEngineScan(button);
  triggerPortfolioStarEmitterCharge(button);
}

function initPortfolioBeaconHotspots() {
  setPortfolioActiveWorld("portfolio");
  setPortfolioBeaconHotspotsEnabled(Boolean(shell?.dataset.portfolioEngineReady === "true"));
  portfolioGatewayTrigger?.addEventListener("click", handlePortfolioGatewayTriggerClick);
  syncPortfolioGatewayTriggerState();
  portfolioBeaconHotspots.forEach((button) => {
    button.addEventListener("click", handlePortfolioBeaconHotspotClick);
    button.addEventListener("keydown", handlePortfolioBeaconHotspotKeydown);
  });
  window.addEventListener("resize", refreshPortfolioEngineScan, { passive: true });
  window.addEventListener("orientationchange", refreshPortfolioEngineScan, { passive: true });
}

function getShellNavModuleContext(targetName) {
  const routeMeta = getShellRouteMeta(targetName);
  if (!routeMeta) {
    return "shell";
  }

  if (["music", "wrestling", "site", "future"].includes(routeMeta.drawerGroup)) {
    return routeMeta.drawerGroup;
  }

  return routeMeta.moduleType === "future-module" ? "future" : "shell";
}

const siteModuleStaticSurfaces = new WeakMap();

function getSiteModuleIntegrationMeta(scope) {
  if (typeof siteModuleIntegrationPlaceholders === "undefined") {
    return null;
  }

  return siteModuleIntegrationPlaceholders[scope] || null;
}

function captureSiteModuleStaticSurface(surface) {
  if (!surface || siteModuleStaticSurfaces.has(surface)) {
    return;
  }

  siteModuleStaticSurfaces.set(surface, surface.innerHTML);
}

function markSiteModuleDataState(surface, scope, stateName) {
  if (!surface || !stateName) {
    return;
  }

  const meta = getSiteModuleIntegrationMeta(scope);
  surface.dataset.siteModuleState = stateName;
  surface.dataset.siteModuleScope = scope;
  if (meta?.source) {
    surface.dataset.siteModuleSource = meta.source;
  }
}

function restoreSiteModuleStaticSurface(surface) {
  if (!surface) {
    return;
  }

  if (surface.dataset.siteModuleState && siteModuleStaticSurfaces.has(surface)) {
    surface.innerHTML = siteModuleStaticSurfaces.get(surface);
  }

  delete surface.dataset.siteModuleState;
  delete surface.dataset.siteModuleScope;
  delete surface.dataset.siteModuleSource;
}

function appendSiteModulePartialState(surface, scope, renderOptions = {}) {
  if (!surface) {
    return null;
  }

  const existingState = surface.querySelector(`[data-mock-state='partial'][data-mock-scope='${scope}']`);
  if (existingState) {
    return existingState;
  }

  const stateCard = createMockStateCard("partial", scope);
  const wrapperTag = renderOptions.itemTag || "";
  if (!wrapperTag) {
    surface.append(stateCard);
    return stateCard;
  }

  const wrapper = document.createElement(wrapperTag);
  wrapper.className = renderOptions.itemClass || "mock-state-item";
  wrapper.append(stateCard);
  surface.append(wrapper);
  return wrapper;
}

function renderSiteModuleMockState(surface, scope, stateName, renderOptions = {}) {
  if (!surface) {
    return null;
  }

  captureSiteModuleStaticSurface(surface);
  if (!stateName) {
    restoreSiteModuleStaticSurface(surface);
    return null;
  }

  restoreSiteModuleStaticSurface(surface);
  markSiteModuleDataState(surface, scope, stateName);
  if (stateName === "partial" && renderOptions.partialMode === "append") {
    return appendSiteModulePartialState(surface, scope, renderOptions);
  }

  return renderMockState(surface, stateName, scope, renderOptions);
}

const MUSIC_NEXUS_STATS_API_BASE_URL = "https://vmpix-data.onrender.com";
const MUSIC_NEXUS_STATS_TIMEOUT_MS = 8000;
const MUSIC_NEXUS_LIVE_STAT_CONFIG = [
  { key: "bands", route: "/api/music/bands", field: "bandsTotal" },
  { key: "shows", route: "/api/music/shows", field: "showsTotal" },
  { key: "people", route: "/api/music/people", field: "peopleTotal" },
  { key: "venues", route: "/api/music/venues", field: "venuesTotal" },
  { key: "photos", route: "/api/music/bands", field: "photosTotal" },
];

let musicLandingStatsRequest = null;
let musicLandingStatsLoaded = false;
let ringArchiveStatsRequest = null;
let ringArchiveStatsLoaded = false;
const ringArchiveApiPayloadRequests = new Map();

function formatMusicLandingStatValue(value, fallbackValue = "") {
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return numericValue.toLocaleString();
  }

  return String(fallbackValue || value || "");
}

function getMusicLandingStatValueElement(key) {
  return document.querySelector(`[data-music-stat-value='${key}']`);
}

function setMusicLandingStatsState(stateName) {
  const statsSurface = document.querySelector("[data-music-landing-stats]");
  if (!statsSurface) {
    return;
  }

  statsSurface.dataset.statsState = stateName;
  statsSurface.setAttribute("aria-busy", String(stateName === "loading"));
}

function getFallbackMusicLandingStatValue(key) {
  const valueElement = getMusicLandingStatValueElement(key);
  if (!valueElement) {
    return "";
  }

  return formatMusicLandingStatValue(valueElement.dataset.fallbackValue || valueElement.textContent);
}

function setMusicLandingStatValue(key, value, sourceName) {
  const valueElement = getMusicLandingStatValueElement(key);
  if (!valueElement) {
    return;
  }

  const fallbackValue = getFallbackMusicLandingStatValue(key);
  valueElement.textContent = formatMusicLandingStatValue(value, fallbackValue);
  valueElement.dataset.statSource = sourceName;
}

function restoreMusicLandingStatFallback(key) {
  setMusicLandingStatValue(key, getFallbackMusicLandingStatValue(key), "fallback");
}

function readMusicLandingStatField(payload, fieldName) {
  const candidates = [
    payload,
    payload?.stats,
    payload?.meta,
    payload?.meta?.stats,
    payload?.data,
    payload?.data?.stats,
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate) &&
      Object.prototype.hasOwnProperty.call(candidate, fieldName)
    ) {
      return candidate[fieldName];
    }
  }

  if (fieldName.endsWith("Total")) {
    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
        continue;
      }
      if (Object.prototype.hasOwnProperty.call(candidate, "count")) {
        return candidate.count;
      }
      if (Object.prototype.hasOwnProperty.call(candidate, "total")) {
        return candidate.total;
      }
    }
  }

  return undefined;
}

async function fetchMusicLandingStat(statConfig) {
  const apiUrl = new URL(statConfig.route, MUSIC_NEXUS_STATS_API_BASE_URL);
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), MUSIC_NEXUS_STATS_TIMEOUT_MS)
    : 0;

  try {
    const response = await fetch(apiUrl.href, {
      cache: "no-store",
      signal: controller?.signal,
    });
    if (!response.ok) {
      throw new Error(`Music stat request failed: ${statConfig.route} (${response.status})`);
    }

    const payload = await response.json();
    const value = readMusicLandingStatField(payload, statConfig.field);
    if (value === undefined || value === null || value === "") {
      throw new Error(`Music stat field missing: ${statConfig.field}`);
    }

    return value;
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  }
}

function requestMusicLandingStats() {
  const statsSurface = document.querySelector("[data-music-landing-stats]");
  if (!statsSurface || typeof fetch !== "function") {
    return Promise.resolve(false);
  }

  if (musicLandingStatsLoaded) {
    return Promise.resolve(true);
  }
  if (musicLandingStatsRequest) {
    return musicLandingStatsRequest;
  }

  setMusicLandingStatsState("loading");
  musicLandingStatsRequest = Promise.all(
    MUSIC_NEXUS_LIVE_STAT_CONFIG.map((statConfig) => (
      fetchMusicLandingStat(statConfig)
        .then((value) => {
          setMusicLandingStatValue(statConfig.key, value, "live");
          return true;
        })
        .catch(() => {
          restoreMusicLandingStatFallback(statConfig.key);
          return false;
        })
    ))
  ).then((results) => {
    const liveCount = results.filter(Boolean).length;
    const hasPartialFallback = liveCount > 0 && liveCount < MUSIC_NEXUS_LIVE_STAT_CONFIG.length;
    musicLandingStatsLoaded = liveCount === MUSIC_NEXUS_LIVE_STAT_CONFIG.length;
    setMusicLandingStatsState(
      musicLandingStatsLoaded ? "live" : hasPartialFallback ? "partial" : "fallback"
    );
    musicLandingStatsRequest = null;
    return liveCount > 0;
  }).catch(() => {
    MUSIC_NEXUS_LIVE_STAT_CONFIG.forEach((statConfig) => restoreMusicLandingStatFallback(statConfig.key));
    setMusicLandingStatsState("fallback");
    musicLandingStatsRequest = null;
    return false;
  });

  return musicLandingStatsRequest;
}

const RING_ARCHIVE_STATS_API_BASE_URL = MUSIC_NEXUS_STATS_API_BASE_URL;
const RING_ARCHIVE_STATS_TIMEOUT_MS = 8000;
const RING_ARCHIVE_STAT_CONFIG = [
  {
    key: "shows",
    statsRoute: "/api/wrestling/shows/stats",
    dbRoute: "/api/wrestling/shows/db",
    fields: ["showsTotal", "totalShows", "shows_total", "total_shows", "showCount", "show_count", "showsCount", "shows_count", "eventsTotal", "totalEvents", "events_total", "total_events", "total", "count"],
    deriveFromDb: getRingArchiveShowCount,
    emptyValue: 0,
  },
  {
    key: "matches",
    statsRoute: "/api/wrestling/shows/stats",
    dbRoute: "/api/wrestling/shows/db",
    fields: ["matchesTotal", "totalMatches", "matches_total", "total_matches", "matchCount", "match_count", "matchesCount", "matches_count"],
    deriveFromDb: getRingArchiveMatchCount,
    emptyValue: 0,
  },
  {
    key: "people",
    statsRoute: "/api/wrestling/people/stats",
    dbRoute: "/api/wrestling/people/db",
    fields: ["peopleTotal", "totalPeople", "people_total", "total_people", "personCount", "person_count", "peopleCount", "people_count", "total", "count"],
    deriveFromDb: getRingArchiveRowCount,
    emptyValue: 0,
  },
  {
    key: "venues",
    statsRoute: "",
    dbRoute: "/api/wrestling/venues/db",
    fields: ["venuesTotal", "totalVenues", "venues_total", "total_venues", "venueCount", "venue_count", "venuesCount", "venues_count", "total", "count"],
    deriveFromDb: getRingArchiveRowCount,
    emptyValue: 0,
  },
  {
    key: "promotions",
    statsRoute: "/api/wrestling/shows/stats",
    dbRoute: "/api/wrestling/shows/db",
    fields: ["promotionsTotal", "totalPromotions", "promotions_total", "total_promotions", "promotionCount", "promotion_count", "promotionsCount", "promotions_count", "uniquePromotions", "uniquePromotionsTotal", "unique_promotions", "unique_promotions_total", "byPromotion", "by_promotion"],
    deriveFromDb: getRingArchivePromotionCount,
    emptyValue: "N/A",
  },
];

function getRingArchiveStatValueElement(key) {
  return document.querySelector(`[data-ring-archive-stat-value='${key}']`);
}

function setRingArchiveStatsState(stateName) {
  const statsSurface = document.querySelector("[data-ring-archive-stats]");
  if (!statsSurface) {
    return;
  }

  statsSurface.dataset.statsState = stateName;
  statsSurface.setAttribute("aria-busy", String(stateName === "loading"));
}

function formatRingArchiveStatValue(value, fallbackValue = "N/A") {
  const fallbackText = String(fallbackValue ?? "N/A").trim() || "N/A";
  const textValue = String(value ?? "").trim();
  if (!textValue) {
    return fallbackText;
  }

  const numericValue = Number(textValue.replace(/,/g, ""));
  if (Number.isFinite(numericValue)) {
    return numericValue.toLocaleString();
  }

  if (/^(undefined|null|nan)$/i.test(textValue)) {
    return fallbackText;
  }

  return textValue;
}

function setRingArchiveStatValue(key, value, sourceName) {
  const valueElement = getRingArchiveStatValueElement(key);
  if (!valueElement) {
    return;
  }

  valueElement.textContent = formatRingArchiveStatValue(value, valueElement.dataset.emptyValue || "N/A");
  valueElement.dataset.statSource = sourceName;
}

function setRingArchiveStatLoading(key) {
  const valueElement = getRingArchiveStatValueElement(key);
  if (!valueElement) {
    return;
  }

  valueElement.textContent = "...";
  valueElement.dataset.statSource = "loading";
}

function readRingArchiveStatField(payload, fieldNames = []) {
  const candidates = [
    payload,
    payload?.totals,
    payload?.summary,
    payload?.stats,
    payload?.meta,
    payload?.meta?.totals,
    payload?.meta?.stats,
    payload?.data,
    payload?.data?.totals,
    payload?.data?.stats,
    payload?.source,
    payload?.source?.stats,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      continue;
    }

    for (const fieldName of fieldNames) {
      if (Object.prototype.hasOwnProperty.call(candidate, fieldName)) {
        return candidate[fieldName];
      }
    }
  }

  return undefined;
}

function getRingArchivePayloadRows(payload) {
  const candidates = [
    payload?.data,
    payload?.rows,
    payload?.items,
    payload?.results,
    payload?.shows,
    payload?.people,
    payload?.venues,
    payload?.source?.data,
    payload?.source?.rows,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter((row) => row && typeof row === "object");
    }
    if (candidate && typeof candidate === "object") {
      const nestedRows = [
        candidate.data,
        candidate.rows,
        candidate.items,
        candidate.results,
        candidate.shows,
        candidate.people,
        candidate.venues,
      ].find(Array.isArray);
      if (nestedRows) {
        return nestedRows.filter((row) => row && typeof row === "object");
      }
    }
  }

  return [];
}

function getRingArchiveNumericValue(value) {
  if (Array.isArray(value)) {
    return value.length;
  }
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const numericValue = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function getRingArchiveDirectStatValue(payload, fields = []) {
  return getRingArchiveNumericValue(readRingArchiveStatField(payload, fields));
}

function getRingArchiveRowCount(payload) {
  const directCount = getRingArchiveDirectStatValue(payload, ["total", "count"]);
  if (directCount !== undefined) {
    return directCount;
  }

  return getRingArchivePayloadRows(payload).length;
}

function getRingArchiveShowCount(payload) {
  const directCount = getRingArchiveDirectStatValue(payload, ["showsTotal", "totalShows", "shows_total", "total_shows", "showCount", "show_count", "showsCount", "shows_count", "eventsTotal", "totalEvents", "events_total", "total_events", "total", "count"]);
  if (directCount !== undefined) {
    return directCount;
  }

  return getRingArchivePayloadRows(payload).length;
}

function getRingArchiveMatchCount(payload) {
  const directCount = getRingArchiveDirectStatValue(payload, ["matchesTotal", "totalMatches", "matches_total", "total_matches", "matchCount", "match_count", "matchesCount", "matches_count"]);
  if (directCount !== undefined) {
    return directCount;
  }

  const rows = getRingArchivePayloadRows(payload);
  if (rows.length === 0) {
    return undefined;
  }

  return rows.reduce((total, row) => {
    const rowCount = getRingArchiveNumericValue(
      row?.stats?.matchCount ??
      row?.stats?.matchesTotal ??
      row?.matchCount ??
      row?.match_count ??
      row?.matchesCount ??
      row?.matches_count
    );
    if (rowCount !== undefined) {
      return total + rowCount;
    }

    if (Array.isArray(row?.matches)) {
      return total + row.matches.length;
    }
    if (Array.isArray(row?.matchIds)) {
      return total + row.matchIds.length;
    }
    if (Array.isArray(row?.match_ids)) {
      return total + row.match_ids.length;
    }

    return total;
  }, 0);
}

function getRingArchivePromotionValues(row) {
  const directValues = [
    row?.promotion,
    row?.promotionName,
    row?.promotion_name,
    row?.promoter,
    row?.company,
    row?.organization,
    row?.general?.promotion,
  ];
  const arrayValues = [
    row?.promotions,
    row?.promotion_names,
  ].flatMap((value) => Array.isArray(value) ? value : []);

  return [...directValues, ...arrayValues]
    .map((value) => String(value ?? "").trim())
    .filter((value) => value && !/^(n\/a|unknown|undefined|null)$/i.test(value));
}

function getRingArchivePromotionCount(payload) {
  const directCount = getRingArchiveDirectStatValue(payload, ["promotionsTotal", "totalPromotions", "promotions_total", "total_promotions", "promotionCount", "promotion_count", "promotionsCount", "promotions_count", "uniquePromotions", "uniquePromotionsTotal", "unique_promotions", "unique_promotions_total", "byPromotion", "by_promotion"]);
  if (directCount !== undefined) {
    return directCount;
  }

  const promotions = new Set();
  getRingArchivePayloadRows(payload).forEach((row) => {
    getRingArchivePromotionValues(row).forEach((promotion) => {
      promotions.add(promotion.toLowerCase());
    });
  });

  return promotions.size > 0 ? promotions.size : undefined;
}

async function fetchRingArchiveJson(route) {
  if (ringArchiveApiPayloadRequests.has(route)) {
    return ringArchiveApiPayloadRequests.get(route);
  }

  const apiUrl = new URL(route, RING_ARCHIVE_STATS_API_BASE_URL);
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), RING_ARCHIVE_STATS_TIMEOUT_MS)
    : 0;

  const request = fetch(apiUrl.href, {
    cache: "no-store",
    signal: controller?.signal,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Ring Archive stat request failed: ${route} (${response.status})`);
      }

      return response.json();
    })
    .catch((error) => {
      ringArchiveApiPayloadRequests.delete(route);
      throw error;
    })
    .finally(() => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    });

  ringArchiveApiPayloadRequests.set(route, request);
  return request;
}

async function fetchRingArchiveStat(statConfig) {
  let statsPayload = null;
  let hadRequestError = false;

  if (statConfig.statsRoute) {
    try {
      statsPayload = await fetchRingArchiveJson(statConfig.statsRoute);
      const directValue = getRingArchiveDirectStatValue(statsPayload, statConfig.fields);
      if (directValue !== undefined) {
        return { value: directValue, source: "stats" };
      }
    } catch {
      hadRequestError = true;
    }
  }

  try {
    const dbPayload = await fetchRingArchiveJson(statConfig.dbRoute);
    const derivedValue = statConfig.deriveFromDb(dbPayload);
    if (derivedValue !== undefined) {
      return { value: derivedValue, source: "db" };
    }

    return { value: statConfig.emptyValue, source: "missing" };
  } catch {
    if (statsPayload) {
      return { value: statConfig.emptyValue, source: "missing" };
    }
    hadRequestError = true;
  }

  if (hadRequestError) {
    return { value: "N/A", source: "error" };
  }

  return { value: statConfig.emptyValue, source: "missing" };
}

function requestRingArchiveStats() {
  const statsSurface = document.querySelector("[data-ring-archive-stats]");
  if (!statsSurface || typeof fetch !== "function") {
    RING_ARCHIVE_STAT_CONFIG.forEach((statConfig) => {
      setRingArchiveStatValue(statConfig.key, "N/A", "error");
    });
    setRingArchiveStatsState("error");
    return Promise.resolve(false);
  }

  if (ringArchiveStatsLoaded) {
    return Promise.resolve(true);
  }
  if (ringArchiveStatsRequest) {
    return ringArchiveStatsRequest;
  }

  setRingArchiveStatsState("loading");
  RING_ARCHIVE_STAT_CONFIG.forEach((statConfig) => setRingArchiveStatLoading(statConfig.key));

  ringArchiveStatsRequest = Promise.all(
    RING_ARCHIVE_STAT_CONFIG.map((statConfig) => (
      fetchRingArchiveStat(statConfig)
        .then((result) => {
          setRingArchiveStatValue(statConfig.key, result.value, result.source);
          return result.source !== "error";
        })
        .catch(() => {
          setRingArchiveStatValue(statConfig.key, "N/A", "error");
          return false;
        })
    ))
  ).then((results) => {
    const resolvedCount = results.filter(Boolean).length;
    ringArchiveStatsLoaded = resolvedCount === RING_ARCHIVE_STAT_CONFIG.length;
    setRingArchiveStatsState(
      ringArchiveStatsLoaded ? "live" : resolvedCount > 0 ? "partial" : "error"
    );
    ringArchiveStatsRequest = null;
    return resolvedCount > 0;
  }).catch(() => {
    RING_ARCHIVE_STAT_CONFIG.forEach((statConfig) => {
      setRingArchiveStatValue(statConfig.key, "N/A", "error");
    });
    setRingArchiveStatsState("error");
    ringArchiveStatsRequest = null;
    return false;
  });

  return ringArchiveStatsRequest;
}

function updateShellRouteContext(route = getRouteFromUrl(), targetName = "") {
  if (!shell || !route) {
    return;
  }

  const activeTarget = targetName || routeNameToGlobalNavTarget[route.name] || "home";
  const moduleContext = getShellNavModuleContext(activeTarget);
  const isHomeRoute = route.name === "home";
  const shouldHideBottomRail = isHomeRoute || route.name === "portfolio";
  shell.dataset.shellRoute = route.name;
  shell.dataset.shellActiveTarget = activeTarget;
  if (route.name !== "portfolio") {
    shell.classList.remove("has-portfolio-entry-constellation");
    clearPortfolioEngineReadyState();
  }
  shell.dataset.shellModule = moduleContext;
  shell.classList.toggle("is-home-route", isHomeRoute);
  if (bottomRail) {
    bottomRail.dataset.shellRoute = route.name;
    bottomRail.dataset.shellActiveTarget = activeTarget;
    bottomRail.dataset.shellModule = moduleContext;
    bottomRail.hidden = shouldHideBottomRail;
    bottomRail.setAttribute("aria-hidden", String(shouldHideBottomRail));
    if (shouldHideBottomRail) {
      bottomRail.setAttribute("inert", "");
    } else {
      bottomRail.removeAttribute("inert");
    }
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
  if (route.name === "music-venue-detail" && typeof venueSlugToVenue === "function" && typeof getMusicVenueName === "function") {
    const venue = venueSlugToVenue(route.venueSlug);
    return venue ? getMusicVenueName(venue) : fallbackLabel;
  }
  if (route.name === "wrestling-person-detail" && typeof findWrestlingPersonById === "function") {
    return findWrestlingPersonById(route.personId, { allowFallback: false, includeStatic: false })?.name || fallbackLabel;
  }
  if (route.name === "wrestling-venue-detail" && typeof findWrestlingVenueById === "function") {
    return findWrestlingVenueById(route.venueId, { allowFallback: false })?.name || fallbackLabel;
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
  if (route.name === "sets-archive") {
    return historyState.bandUrl || getBandRouteUrl(route.bandId);
  }
  if (route.name === "set-detail") {
    return historyState.setsArchiveUrl || getBandSetsRouteUrl(route.bandId);
  }
  if (route.name === "wrestling-match-gallery") {
    if (typeof getWrestlingShowRouteUrl === "function") {
      return getWrestlingShowRouteUrl(route.dateKey || route.showId || "warzone-26");
    }
    return `${routePaths.wrestlingShows}/${encodeURIComponent(route.dateKey || route.showId || "warzone-26")}`;
  }
  if (route.name === "wrestling-lightbox") {
    const showId = route.dateKey || route.showId || "warzone-26";
    const matchRef = route.matchRef || route.matchId || "1";
    if (typeof getWrestlingMatchRouteUrlByIds === "function") {
      return getWrestlingMatchRouteUrlByIds(showId, matchRef);
    }
    return `${routePaths.wrestlingShows}/${encodeURIComponent(showId)}/match-${encodeURIComponent(matchRef)}`;
  }

  return routeNameToShellBackTarget[route.name] || routePaths.portfolio;
}

function shouldShellBackUseHistory(route = getRouteFromUrl(), historyState = window.history.state || {}) {
  if (!window.history || window.history.length <= 1 || !route) {
    return false;
  }

  return (
    (route.name === "band-detail" && historyState.returnUrl && historyState.fromBandsIndex) ||
    (route.name === "sets-archive" && historyState.bandUrl && historyState.fromBandDetail) ||
    (route.name === "set-detail" && historyState.setsArchiveUrl && historyState.fromSetsArchive) ||
    (route.name === "person-detail" && historyState.fromPeopleIndex) ||
    (route.name === "show-detail" && historyState.fromShowsArchive) ||
    (route.name === "music-venue-detail" && historyState.fromMusicVenuesIndex) ||
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
  const visibleRoutes = globalDrawerRouteIds
    .map((routeId) => getShellRouteMeta(routeId))
    .filter(Boolean);

  const list = document.createElement("div");
  list.className = "global-menu-list";
  visibleRoutes.forEach((routeMeta) => {
    list.append(createGlobalMenuButton(routeMeta));
  });

  globalMenuActions.append(list);
  globalNavButtons = document.querySelectorAll("[data-global-nav-target]");
}

function setShellLogoFallback(isFallback) {
  if (bottomRail) {
    bottomRail.classList.toggle("is-logo-fallback", isFallback);
  }
}

function initShellRailLogo() {
  const logoVideo = document.querySelector("[data-shell-logo-video]");
  const logoFallback = document.querySelector("[data-shell-logo-fallback]");
  if (!logoVideo || !logoFallback) {
    return;
  }

  const updateLogoMode = () => {
    const shouldUseFallback = reducedMotion.matches || logoVideo.error;
    setShellLogoFallback(Boolean(shouldUseFallback));
    if (shouldUseFallback) {
      logoVideo.pause();
      return;
    }

    const playResult = logoVideo.play();
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(() => setShellLogoFallback(true));
    }
  };

  logoVideo.addEventListener("error", () => setShellLogoFallback(true));
  logoVideo.addEventListener("canplay", updateLogoMode, { once: true });
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", updateLogoMode);
  }
  updateLogoMode();
}

function setActiveGlobalNav(targetName) {
  updateShellRouteContext(getRouteFromUrl(), targetName);
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

function getCenteredHubCard() {
  if (!hubCarousel) {
    return null;
  }

  const cards = Array.from(hubCarousel.querySelectorAll("[data-module-card]")).filter((card) => (
    !card.closest("[inert]") && card.getClientRects().length > 0
  ));
  if (cards.length === 0) {
    return null;
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

  return nearestCard;
}

function syncSpotlightFromCarousel() {
  const nearestCard = getCenteredHubCard();
  if (!nearestCard) {
    return;
  }

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
  setCurrentView(ROUTE_TITLE_LABELS.portfolio);
  setDocumentTitle(ROUTE_TITLE_LABELS.portfolio);
  setPortfolioActiveWorld("portfolio");
  setActiveGlobalNav("portfolio");
}

function showMusicNexus(options = {}) {
  if (!shell || !portfolioHub || !musicNexusShell) {
    return;
  }
  clearPortfolioArrivalState();
  clearPortfolioOrientationState();
  clearPortfolioDirectArrivalState();
  shell.classList.remove("is-placeholder-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
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
    requestMusicLandingStats();
  } else {
    setMusicNexusContext(initialSection, false, false);
    if (initialSection === "bands") {
      showBandsIndexView({ shouldScroll: false, shouldUpdateRail: false });
    }
  }
  setCurrentView(options.currentView || "Music Nexus");
  setActiveGlobalNav(options.globalNavTarget || "music");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function showRingArchive() {
  if (!shell || !portfolioHub || !ringArchiveShell) {
    return;
  }
  clearPortfolioArrivalState();
  clearPortfolioOrientationState();
  clearPortfolioDirectArrivalState();
  shell.classList.remove("is-placeholder-view", "is-music-nexus-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
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
  requestRingArchiveStats();
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function showWrestlingPeopleIndex() {
  if (!shell || !portfolioHub || !wrestlingPeopleShell) {
    return;
  }
  shell.classList.remove("is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
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
  setActiveGlobalNav("wrestling");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function showWrestlingPersonDetail(personId) {
  if (!shell || !portfolioHub || !wrestlingPersonDetailShell) {
    return;
  }
  shell.classList.remove("is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
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
  setActiveGlobalNav("wrestling");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function showWrestlingVenuesIndex() {
  if (!shell || !portfolioHub || !wrestlingVenuesShell) {
    return;
  }
  shell.classList.remove("is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
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
  shell.classList.remove("is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-venues-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
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
  shell.classList.remove("is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
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
  if (typeof renderWrestlingShowsArchive === "function") {
    renderWrestlingShowsArchive();
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
  setCurrentView("Event Archive");
  setActiveGlobalNav("wrestling");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function showWrestlingShowDetail(showId = "warzone-26") {
  if (!shell || !portfolioHub || !wrestlingShowDetailShell) {
    return;
  }
  shell.classList.remove("is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
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
  if (typeof renderWrestlingShowDetailRoute === "function") {
    renderWrestlingShowDetailRoute(showId);
  }
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
  if (typeof renderWrestlingShowDetailRoute !== "function" && typeof updateWrestlingShowDetailRelationshipHooks === "function") {
    updateWrestlingShowDetailRelationshipHooks(showId);
  }
  setCurrentView("Show Detail");
  setActiveGlobalNav("wrestling");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function showWrestlingMatchGallery(showId = "warzone-26", matchId = "daron-richardson-vs-bear-bronson") {
  if (!shell || !portfolioHub || !wrestlingMatchGalleryShell) {
    return;
  }

  if (typeof setLightboxVisible === "function") {
    setLightboxVisible(false);
  }
  if (typeof setWrestlingMatchLightboxRouteSyncActive === "function") {
    setWrestlingMatchLightboxRouteSyncActive(false);
  }
  shell.classList.remove("is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
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
  setActiveGlobalNav("wrestling");
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
  const showRoute = wrestlingLightboxShell?.dataset.wrestlingShowRoute ||
    wrestlingMatchGalleryShell?.dataset.wrestlingShowRoute ||
    "";
  const fallbackShowId = wrestlingLightboxShell?.dataset.wrestlingShowId ||
    wrestlingLightboxShell?.dataset.showId ||
    wrestlingMatchGalleryShell?.dataset.wrestlingShowId ||
    "warzone-26";
  const showId = showRoute
    ? showRoute.replace(/\/$/, "")
    : `${routePaths.wrestlingShows}/${encodeURIComponent(fallbackShowId)}`;
  const matchRef = wrestlingLightboxShell?.dataset.wrestlingMatchRef ||
    wrestlingMatchGalleryShell?.dataset.wrestlingMatchRef ||
    wrestlingLightboxShell?.dataset.wrestlingMatchId ||
    wrestlingLightboxShell?.dataset.matchId ||
    wrestlingMatchGalleryShell?.dataset.wrestlingMatchId ||
    "1";

  const matchRoute = typeof getWrestlingMatchRouteUrlByIds === "function"
    ? getWrestlingMatchRouteUrlByIds(showId.replace(`${routePaths.wrestlingShows}/`, ""), matchRef)
    : `${showId}/match-${encodeURIComponent(matchRef)}`;
  navigateToRoute(`${matchRoute}/photo/${getWrestlingPhotoIdFromNumber(photoNumber)}`);
}

function showWrestlingLightbox(showId, matchId, photoId) {
  if (!shell || !portfolioHub || !wrestlingLightboxShell) {
    return;
  }

  const activeShowId = showId || "warzone-26";
  const activeMatchId = matchId || "daron-richardson-vs-bear-bronson";
  if (
    typeof openWrestlingMatchPhotoRouteLightbox === "function" &&
    openWrestlingMatchPhotoRouteLightbox(activeShowId, activeMatchId, photoId || "001")
  ) {
    return;
  }

  const photoNumber = getWrestlingPhotoNumber(photoId);
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
  shell.classList.remove("is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-about-view", "is-calendar-view", "is-contact-view");
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
  setActiveGlobalNav("wrestling");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function showAboutShell() {
  if (!shell || !aboutShell) {
    return;
  }
  shell.classList.remove("is-module-view", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-calendar-view", "is-contact-view");
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
  applyAboutMockState();
  setCurrentView("About");
  setActiveGlobalNav("about");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function applyAboutMockState() {
  const forcedState = getForcedMockState("about");
  const stateSurface = aboutShell?.querySelector("[data-about-state-surface]");
  if (!stateSurface) {
    return;
  }

  stateSurface.hidden = true;
  stateSurface.replaceChildren();
  delete stateSurface.dataset.siteModuleState;
  delete stateSurface.dataset.siteModuleScope;
  delete stateSurface.dataset.siteModuleSource;

  if (!forcedState) {
    return;
  }

  stateSurface.hidden = false;
  renderMockState(stateSurface, forcedState, "about");
  markSiteModuleDataState(stateSurface, "about", forcedState);
}

function showCalendarShell() {
  if (!shell || !calendarShell) {
    return;
  }
  shell.classList.remove("is-module-view", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-contact-view");
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
  applyCalendarMockState();
  setCurrentView("Calendar");
  setActiveGlobalNav("calendar");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function applyCalendarMockState() {
  const forcedState = getForcedMockState("calendar");
  const eventList = calendarShell?.querySelector("[data-calendar-event-list]") || calendarShell?.querySelector(".calendar-event-list");
  if (!eventList) {
    return;
  }

  renderSiteModuleMockState(eventList, "calendar", forcedState, {
    itemTag: "li",
    itemClass: "v3-card v3-card--event calendar-event-card",
    partialMode: "append",
  });
}

function showContactShell() {
  if (!shell || !contactShell) {
    return;
  }
  shell.classList.remove("is-module-view", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view");
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
  applyContactMockState();
  setCurrentView("Contact");
  setActiveGlobalNav("contact");
  if (startButton) {
    startButton.disabled = true;
    startButton.setAttribute("aria-busy", "false");
  }
}

function applyContactMockState() {
  const forcedState = getForcedMockState("contact");
  const formShell = contactShell?.querySelector("[data-contact-form-shell]") || contactShell?.querySelector(".contact-form-shell");
  if (!formShell) {
    return;
  }

  renderSiteModuleMockState(formShell, "contact", forcedState, {
    partialMode: "append",
  });
}

function showModulePlaceholder(moduleName) {
  const content = modulePlaceholderContent[moduleName];
  if (!content || !shell || !portfolioHub || !modulePlaceholder) {
    return;
  }

  resetRouteNotFoundPlaceholder();
  shell.classList.remove("is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
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

const routeNotFoundConfigs = {
  "route-not-found": {
    rail: "Route Not Found",
    scope: "routeNotFound",
    title: "Archive Route Not Found",
    text: "No matching archive route could be found.",
    activeNav: "portfolio",
    actions: [
      { label: "Back to Portfolio", route: routePaths.portfolio },
      { label: "Back to Home", route: routePaths.home },
    ],
  },
  "music-route-not-found": {
    rail: "Music Route Not Found",
    scope: "musicRouteNotFound",
    title: "Music Route Not Found",
    text: "No matching Music archive route could be found.",
    activeNav: "music",
    actions: [
      { label: "Back to Music", route: routePaths.music },
      { label: "Back to Portfolio", route: routePaths.portfolio },
    ],
  },
  "wrestling-route-not-found": {
    rail: "Ring Archive Route Not Found",
    scope: "wrestlingRouteNotFound",
    title: "Ring Archive Route Not Found",
    text: "No matching Wrestling archive route could be found.",
    activeNav: "wrestling",
    actions: [
      { label: "Back to Wrestling", route: routePaths.wrestling },
      { label: "Back to Portfolio", route: routePaths.portfolio },
    ],
  },
};

function resetRouteNotFoundPlaceholder() {
  if (!modulePlaceholder) {
    return;
  }

  modulePlaceholder.querySelectorAll("[data-route-not-found-state]").forEach((state) => state.remove());
  const placeholderContent = modulePlaceholder.querySelector(".module-placeholder-content");
  if (placeholderContent) {
    placeholderContent.hidden = false;
  }
  if (moduleBack) {
    moduleBack.hidden = false;
  }
  modulePlaceholder.setAttribute("aria-labelledby", "module-placeholder-title");
  modulePlaceholder.removeAttribute("aria-label");
}

function getRouteNotFoundConfig(route = {}) {
  return routeNotFoundConfigs[route.name] || routeNotFoundConfigs["route-not-found"];
}

function appendRouteNotFoundAction(actions, action = {}) {
  if (!actions || !action.label || !action.route) {
    return;
  }

  const button = document.createElement("button");
  button.className = "v3-state-action";
  button.type = "button";
  button.textContent = action.label;
  button.addEventListener("click", () => navigateToRoute(action.route));
  actions.append(button);
}

function createRouteNotFoundCard(route = {}) {
  const config = getRouteNotFoundConfig(route);
  const card = typeof createV3EmptyState === "function"
    ? createV3EmptyState({
      scope: config.scope,
      title: config.title,
      text: config.text,
      detail: route.path ? `Route: ${route.path}` : "",
    })
    : createV3StateCard("empty", {
      scope: config.scope,
      title: config.title,
      text: config.text,
      detail: route.path ? `Route: ${route.path}` : "",
    });
  card.dataset.routeNotFoundCard = "";

  const body = card.querySelector(".v3-state-copy") || card;
  const actions = document.createElement("span");
  actions.className = "v3-state-actions";
  config.actions.forEach((action) => appendRouteNotFoundAction(actions, action));
  body.append(actions);
  return card;
}

function showRouteNotFound(route = {}) {
  if (!shell || !portfolioHub || !modulePlaceholder) {
    return;
  }

  const config = getRouteNotFoundConfig(route);
  shell.classList.remove("is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
  shell.classList.add("has-entered-hub", "is-module-view", "is-placeholder-view");
  if (homeFrame) {
    homeFrame.setAttribute("aria-hidden", "true");
  }
  portfolioHub.setAttribute("aria-hidden", "false");
  portfolioHub.removeAttribute("inert");
  modulePlaceholder.setAttribute("aria-hidden", "false");
  modulePlaceholder.removeAttribute("inert");
  modulePlaceholder.setAttribute("aria-label", config.rail);
  modulePlaceholder.removeAttribute("aria-labelledby");
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
  resetRouteNotFoundPlaceholder();
  modulePlaceholder.setAttribute("aria-label", config.rail);
  modulePlaceholder.removeAttribute("aria-labelledby");

  const placeholderContent = modulePlaceholder.querySelector(".module-placeholder-content");
  if (placeholderContent) {
    placeholderContent.hidden = true;
  }
  if (moduleBack) {
    moduleBack.hidden = true;
  }

  const statePanel = document.createElement("section");
  statePanel.className = "route-not-found-state";
  statePanel.dataset.routeNotFoundState = route.name || "route-not-found";
  statePanel.append(createRouteNotFoundCard(route));
  modulePlaceholder.append(statePanel);

  setCurrentView(config.rail);
  setActiveGlobalNav(config.activeNav);
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
    "route-not-found": modulePlaceholder,
    music: musicNexusShell,
    "music-route-not-found": modulePlaceholder,
    "music-bands": musicNexusShell,
    "band-detail": musicNexusShell,
    "sets-archive": musicNexusShell,
    "set-detail": musicNexusShell,
    "music-people": musicNexusShell,
    "person-detail": musicNexusShell,
    "music-shows": musicNexusShell,
    "show-detail": musicNexusShell,
    "music-venues": musicNexusShell,
    "music-venue-detail": musicNexusShell,
    wrestling: ringArchiveShell,
    "wrestling-route-not-found": modulePlaceholder,
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

function closeGlobalMenu(options = {}) {
  if (!shell || !railMenuTrigger || !globalMenuDrawer || !globalMenuBackdrop) {
    return;
  }

  shell.classList.remove("is-global-menu-open");
  globalMenuDrawer.setAttribute("aria-hidden", "true");
  railMenuTrigger.setAttribute("aria-expanded", "false");
  if (options.shouldRestoreFocus !== false) {
    railMenuTrigger.focus({ preventScroll: true });
  }
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
  clearHomePortfolioTransitionState();
  clearPortfolioArrivalState();
  clearPortfolioOrientationState();
  clearPortfolioDirectArrivalState();
  clearPortfolioEngineReadyState();
  closeGlobalMenu({ shouldRestoreFocus: false });
  shell.classList.remove("is-home-transitioning", "is-engage-activated", "has-entered-hub", "is-module-view", "is-placeholder-view", "is-music-nexus-view", "is-ring-archive-view", "is-wrestling-people-view", "is-wrestling-person-detail-view", "is-wrestling-shows-view", "is-wrestling-show-detail-view", "is-wrestling-match-gallery-view", "is-wrestling-lightbox-view", "is-about-view", "is-calendar-view", "is-contact-view");
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
  setCurrentView(ROUTE_TITLE_LABELS.home);
  setDocumentTitle(ROUTE_TITLE_LABELS.home);
  setActiveGlobalNav("home");
}

function handleGlobalMenuAction(event) {
  const button = event.currentTarget;
  const routeMeta = getShellRouteMeta(button.dataset.globalNavTarget);
  const navRoute = routeMeta?.route || button.dataset.globalNavRoute;

  if (button.getAttribute("aria-disabled") === "true" || routeMeta?.futurePlaceholder) {
    return;
  }

  closeGlobalMenu({ shouldRestoreFocus: false });
  if (navRoute) {
    window.requestAnimationFrame(() => navigateToRoute(navRoute));
  }
}

function revealHub(options = {}) {
  const shouldPreserveHomeDispatch = Boolean(options.shouldPlayPortfolioArrival);
  const wasHomePortfolioEntrySequence = Boolean(
    shell?.classList.contains("is-portfolio-entry-sequence") &&
    shell.classList.contains("is-home-transitioning") &&
    shell.classList.contains("is-engage-activated")
  );
  if (shouldPreserveHomeDispatch) {
    window.clearTimeout(homePortfolioTransitionTimer);
    homePortfolioTransitionTimer = 0;
  } else {
    clearHomePortfolioTransitionState();
  }
  clearPortfolioArrivalState();
  clearPortfolioOrientationState();
  clearPortfolioDirectArrivalState();
  shell.classList.remove("is-about-view", "is-calendar-view", "is-contact-view");
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
  if (options.shouldUsePortfolioShellRouteContext) {
    applyPortfolioShellRouteContext();
  }
  if (options.shouldPlayPortfolioArrival) {
    startPortfolioArrival();
    if (wasHomePortfolioEntrySequence) {
      shell.classList.add("is-portfolio-entry-sequence", "is-home-transitioning", "is-engage-activated");
    }
  } else if (options.shouldPlayDirectPortfolioEntrySequence) {
    startPortfolioDirectEntrySequenceForQA();
  } else if (options.shouldPlayDirectPortfolioArrival) {
    startPortfolioDirectArrival();
  } else {
    shell.classList.add("has-portfolio-entry-constellation");
    schedulePortfolioEngineReadyGate();
  }
}

const PORTFOLIO_ARRIVAL_DURATION_MS = 860;
const PORTFOLIO_ARRIVAL_REDUCED_MOTION_DURATION_MS = 70;
const PORTFOLIO_ORIENTATION_START_OFFSET_MS = 820;
const PORTFOLIO_ORIENTATION_REDUCED_MOTION_START_OFFSET_MS = 28;
const PORTFOLIO_ORIENTATION_DURATION_MS = 620;
const PORTFOLIO_ORIENTATION_REDUCED_MOTION_DURATION_MS = 70;
const PORTFOLIO_FIRST_TRANSFER_DURATION_MS = 760;
const PORTFOLIO_FIRST_TRANSFER_REDUCED_MOTION_DURATION_MS = 80;
const PORTFOLIO_COORDINATE_SELECTOR = ".portfolio-beacon--world, .portfolio-beacon--system";
const PORTFOLIO_COORDINATE_ONLINE_TOTAL = 8;
const PORTFOLIO_ENGINE_READY_RETRY_MS = 80;
const PORTFOLIO_ENGINE_READY_MAX_WAIT_MS = 1600;
let portfolioArrivalTimer = 0;
let portfolioOrientationStartTimer = 0;
let portfolioOrientationTimer = 0;
let portfolioOrientationFocusCard = null;
let portfolioFirstTransferTimer = 0;
let portfolioFirstTransferTargetCard = null;
// Temporary Experience Build QA flag: direct /portfolio starts at Chapter 2 entry.
const PORTFOLIO_DIRECT_ENTRY_SEQUENCE_FOR_QA = true;
const PORTFOLIO_DIRECT_ENTRY_SEQUENCE_QA_CLEANUP_MS = 2360;
const PORTFOLIO_DIRECT_ARRIVAL_DURATION_MS = 720;
const PORTFOLIO_DIRECT_ARRIVAL_REDUCED_MOTION_DURATION_MS = 80;
let portfolioDirectArrivalTimer = 0;
let portfolioEngineReadyTimer = 0;
let portfolioEngineReadyFrame = 0;
let portfolioEngineReadyGateStartedAt = 0;
let isHomePortfolioRouteHandoffPending = false;

function getPortfolioRouteContext() {
  return getRouteFromUrl(routePaths.portfolio);
}

function isPortfolioExperienceActive() {
  return window.location.pathname === routePaths.portfolio || shell?.dataset.shellRoute === "portfolio";
}

function applyPortfolioShellRouteContext() {
  if (!shell) {
    return;
  }

  updateShellRouteContext(getPortfolioRouteContext(), "portfolio");
}
function cancelPortfolioEngineReadyGate() {
  window.clearTimeout(portfolioEngineReadyTimer);
  portfolioEngineReadyTimer = 0;
  if (portfolioEngineReadyFrame) {
    window.cancelAnimationFrame(portfolioEngineReadyFrame);
    portfolioEngineReadyFrame = 0;
  }
  portfolioEngineReadyGateStartedAt = 0;
}

function clearPortfolioEngineReadyState() {
  cancelPortfolioEngineReadyGate();
  clearPortfolioEngineScan();
  stopPortfolioEngineLightning();
  hidePortfolioEngineProjection({ immediate: true });
  setPortfolioBeaconHotspotsEnabled(false);
  setPortfolioActiveWorld("portfolio");
  if (!shell) {
    return;
  }

  shell.classList.remove("has-portfolio-coordinates-online", "is-portfolio-engine-ready");
  delete shell.dataset.portfolioCoordinatesOnline;
  delete shell.dataset.portfolioEngineReady;
  syncPortfolioGatewayTriggerState();
}

function getPortfolioCoordinateElements() {
  return Array.from(document.querySelectorAll(PORTFOLIO_COORDINATE_SELECTOR));
}

function isPortfolioCoordinateOnline(coordinate) {
  if (!coordinate) {
    return false;
  }

  const styles = window.getComputedStyle(coordinate);
  if (styles.display === "none" || styles.visibility === "hidden" || Number(styles.opacity) <= 0.1) {
    return false;
  }

  const bounds = coordinate.getBoundingClientRect();
  return bounds.width > 0 && bounds.height > 0;
}

function arePortfolioCoordinatesOnline() {
  if (
    !shell ||
    !isPortfolioExperienceActive() ||
    !shell.classList.contains("has-entered-hub") ||
    !shell.classList.contains("has-portfolio-entry-constellation") ||
    shell.classList.contains("is-module-view")
  ) {
    return false;
  }

  const coordinates = getPortfolioCoordinateElements();
  return coordinates.length === PORTFOLIO_COORDINATE_ONLINE_TOTAL && coordinates.every(isPortfolioCoordinateOnline);
}

function markPortfolioEngineReady() {
  if (!arePortfolioCoordinatesOnline()) {
    return false;
  }

  cancelPortfolioEngineReadyGate();
  shell.classList.add("has-portfolio-coordinates-online", "is-portfolio-engine-ready");
  shell.dataset.portfolioCoordinatesOnline = String(PORTFOLIO_COORDINATE_ONLINE_TOTAL);
  shell.dataset.portfolioEngineReady = "true";
  setPortfolioBeaconHotspotsEnabled(true);
  syncPortfolioGatewayTriggerState();
  startPortfolioEngineLightning();
  completeHomePortfolioRouteHandoff();
  shell.dispatchEvent(new CustomEvent("portfolio:engine-ready", {
    detail: { coordinateCount: PORTFOLIO_COORDINATE_ONLINE_TOTAL },
  }));
  return true;
}

function resolvePortfolioEngineReadyGate() {
  portfolioEngineReadyFrame = 0;
  if (markPortfolioEngineReady()) {
    return;
  }

  if (
    portfolioEngineReadyGateStartedAt &&
    window.performance.now() - portfolioEngineReadyGateStartedAt >= PORTFOLIO_ENGINE_READY_MAX_WAIT_MS
  ) {
    cancelPortfolioEngineReadyGate();
    return;
  }

  portfolioEngineReadyTimer = window.setTimeout(() => {
    portfolioEngineReadyTimer = 0;
    portfolioEngineReadyFrame = window.requestAnimationFrame(resolvePortfolioEngineReadyGate);
  }, PORTFOLIO_ENGINE_READY_RETRY_MS);
}

function schedulePortfolioEngineReadyGate() {
  clearPortfolioEngineReadyState();
  if (!shell || !isPortfolioExperienceActive() || !shell.classList.contains("has-entered-hub")) {
    return;
  }

  portfolioEngineReadyGateStartedAt = window.performance.now();
  portfolioEngineReadyFrame = window.requestAnimationFrame(resolvePortfolioEngineReadyGate);
}

function clearPortfolioDirectArrivalState() {
  window.clearTimeout(portfolioDirectArrivalTimer);
  portfolioDirectArrivalTimer = 0;
  if (shell) {
    shell.classList.remove("is-portfolio-direct-arriving");
  }
}

function clearPortfolioFirstTransferState() {
  window.clearTimeout(portfolioFirstTransferTimer);
  portfolioFirstTransferTimer = 0;
  if (portfolioFirstTransferTargetCard) {
    portfolioFirstTransferTargetCard.classList.remove("is-first-transfer-target");
    portfolioFirstTransferTargetCard = null;
  }
  if (shell) {
    shell.classList.remove("is-portfolio-transferring");
    [
      "--portfolio-transfer-source-x",
      "--portfolio-transfer-source-y",
      "--portfolio-transfer-target-x",
      "--portfolio-transfer-target-y",
      "--portfolio-transfer-impact-x",
      "--portfolio-transfer-impact-y",
      "--portfolio-transfer-distance",
      "--portfolio-transfer-angle",
    ].forEach((propertyName) => shell.style.removeProperty(propertyName));
  }
}

function getPortfolioFirstTransferTarget() {
  if (!portfolioHub) {
    return null;
  }

  return portfolioEntryTarget || getCenteredHubCard();
}

function startPortfolioFirstTransfer() {
  if (!shell || !portfolioHub || !shell.classList.contains("has-entered-hub")) {
    return;
  }

  clearPortfolioFirstTransferState();
  portfolioFirstTransferTargetCard = getPortfolioFirstTransferTarget();
  if (!portfolioFirstTransferTargetCard) {
    return;
  }

  const cardRect = portfolioFirstTransferTargetCard.getBoundingClientRect();
  const sourceX = window.innerWidth * 0.5;
  const sourceY = window.innerHeight * 0.5;
  const targetImpactX = 0.5;
  const targetImpactY = 0.38;
  const targetX = cardRect.left + cardRect.width * targetImpactX;
  const targetY = cardRect.top + cardRect.height * targetImpactY;
  const deltaX = targetX - sourceX;
  const deltaY = targetY - sourceY;
  const distance = Math.hypot(deltaX, deltaY);
  const angle = Math.atan2(deltaY, deltaX);

  shell.style.setProperty("--portfolio-transfer-source-x", `${sourceX}px`);
  shell.style.setProperty("--portfolio-transfer-source-y", `${sourceY}px`);
  shell.style.setProperty("--portfolio-transfer-target-x", `${targetX}px`);
  shell.style.setProperty("--portfolio-transfer-target-y", `${targetY}px`);
  shell.style.setProperty("--portfolio-transfer-impact-x", `${targetImpactX * 100}%`);
  shell.style.setProperty("--portfolio-transfer-impact-y", `${targetImpactY * 100}%`);
  shell.style.setProperty("--portfolio-transfer-distance", `${distance}px`);
  shell.style.setProperty("--portfolio-transfer-angle", `${angle}rad`);
  portfolioFirstTransferTargetCard.classList.add("is-first-transfer-target");
  shell.classList.add("is-portfolio-transferring");

  const transferDuration = reducedMotion.matches
    ? PORTFOLIO_FIRST_TRANSFER_REDUCED_MOTION_DURATION_MS
    : PORTFOLIO_FIRST_TRANSFER_DURATION_MS;
  portfolioFirstTransferTimer = window.setTimeout(clearPortfolioFirstTransferState, transferDuration);
}

function startPortfolioDirectArrival() {
  if (
    !shell ||
    !portfolioHub ||
    !shell.classList.contains("has-entered-hub") ||
    shell.classList.contains("is-module-view") ||
    shell.classList.contains("is-portfolio-arriving") ||
    shell.classList.contains("is-portfolio-orienting") ||
    window.location.pathname !== routePaths.portfolio
  ) {
    return;
  }

  clearPortfolioDirectArrivalState();
  shell.classList.add("is-portfolio-direct-arriving");
  const directArrivalDuration = reducedMotion.matches
    ? PORTFOLIO_DIRECT_ARRIVAL_REDUCED_MOTION_DURATION_MS
    : PORTFOLIO_DIRECT_ARRIVAL_DURATION_MS;
  portfolioDirectArrivalTimer = window.setTimeout(clearPortfolioDirectArrivalState, directArrivalDuration);
}

function clearPortfolioArrivalState() {
  window.clearTimeout(portfolioArrivalTimer);
  window.clearTimeout(portfolioOrientationStartTimer);
  clearPortfolioFirstTransferState();
  portfolioArrivalTimer = 0;
  portfolioOrientationStartTimer = 0;
  if (shell) {
    shell.classList.remove("is-portfolio-arriving");
    if (!isPortfolioExperienceActive()) {
      clearPortfolioEngineReadyState();
    }
  }
}

function clearPortfolioOrientationState() {
  window.clearTimeout(portfolioOrientationTimer);
  portfolioOrientationTimer = 0;
  if (portfolioOrientationFocusCard) {
    portfolioOrientationFocusCard.classList.remove("is-world-focus-target");
    portfolioOrientationFocusCard = null;
  }
  if (shell) {
    shell.classList.remove("is-portfolio-orienting");
  }
}

function startPortfolioOrientation() {
  portfolioOrientationStartTimer = 0;
  if (
    !shell ||
    !portfolioHub ||
    !shell.classList.contains("has-entered-hub") ||
    shell.classList.contains("is-module-view") ||
    !isPortfolioExperienceActive()
  ) {
    return;
  }

  clearPortfolioOrientationState();
  portfolioOrientationFocusCard = getCenteredHubCard();
  if (!portfolioOrientationFocusCard) {
    return;
  }
  portfolioOrientationFocusCard.classList.add("is-world-focus-target");
  shell.classList.add("is-portfolio-orienting");

  const orientationDuration = reducedMotion.matches
    ? PORTFOLIO_ORIENTATION_REDUCED_MOTION_DURATION_MS
    : PORTFOLIO_ORIENTATION_DURATION_MS;
  portfolioOrientationTimer = window.setTimeout(clearPortfolioOrientationState, orientationDuration);
}

function startPortfolioArrival() {
  if (!shell || !portfolioHub) {
    return;
  }

  clearPortfolioArrivalState();
  clearPortfolioOrientationState();
  // Portfolio Entry Sequence receives the post-click energy under /portfolio ownership.
  shell.classList.add("is-portfolio-arriving");
  startPortfolioFirstTransfer();
  const arrivalDuration = reducedMotion.matches
    ? PORTFOLIO_ARRIVAL_REDUCED_MOTION_DURATION_MS
    : PORTFOLIO_ARRIVAL_DURATION_MS;
  const orientationStartOffset = reducedMotion.matches
    ? PORTFOLIO_ORIENTATION_REDUCED_MOTION_START_OFFSET_MS
    : PORTFOLIO_ORIENTATION_START_OFFSET_MS;
  portfolioOrientationStartTimer = window.setTimeout(startPortfolioOrientation, orientationStartOffset);
  portfolioArrivalTimer = window.setTimeout(clearPortfolioArrivalState, arrivalDuration);
}

const HOME_PORTFOLIO_TRANSITION_CLEANUP_MS = 2360;
const HOME_PORTFOLIO_REDUCED_MOTION_CLEANUP_MS = 40;
let homePortfolioTransitionTimer = 0;

function clearHomePortfolioTransitionState() {
  window.clearTimeout(homePortfolioTransitionTimer);
  homePortfolioTransitionTimer = 0;
  if (shell) {
    const shouldRevealFirstConstellation = shell.classList.contains("is-portfolio-entry-sequence") &&
      isPortfolioExperienceActive() &&
      shell.classList.contains("has-entered-hub");
    shell.classList.remove("is-portfolio-entry-sequence", "is-home-transitioning", "is-engage-activated");
    shell.classList.toggle("has-portfolio-entry-constellation", shouldRevealFirstConstellation);
    if (shouldRevealFirstConstellation) {
      schedulePortfolioEngineReadyGate();
    } else {
      clearPortfolioEngineReadyState();
    }
  }
  if (startButton) {
    startButton.setAttribute("aria-busy", "false");
  }
}

function activatePortfolioEntrySequenceState() {
  if (!shell) {
    return;
  }

  window.clearTimeout(homePortfolioTransitionTimer);
  homePortfolioTransitionTimer = 0;
  clearPortfolioEngineReadyState();
  shell.classList.remove("has-portfolio-entry-constellation");
  shell.classList.add("is-portfolio-entry-sequence", "is-home-transitioning", "is-engage-activated");
  if (startButton) {
    startButton.setAttribute("aria-busy", "true");
  }
}

function schedulePortfolioEntrySequenceCleanup(cleanupDelayOverride) {
  const transitionCleanupDelay = Number.isFinite(cleanupDelayOverride)
    ? cleanupDelayOverride
    : reducedMotion.matches
      ? HOME_PORTFOLIO_REDUCED_MOTION_CLEANUP_MS
      : HOME_PORTFOLIO_TRANSITION_CLEANUP_MS;

  if (transitionCleanupDelay <= 0) {
    clearHomePortfolioTransitionState();
    return;
  }

  homePortfolioTransitionTimer = window.setTimeout(clearHomePortfolioTransitionState, transitionCleanupDelay);
}

function startPortfolioDirectEntrySequenceForQA() {
  if (!PORTFOLIO_DIRECT_ENTRY_SEQUENCE_FOR_QA || !shell || window.location.pathname !== routePaths.portfolio) {
    return;
  }

  const directEntryStartDelay = reducedMotion.matches ? 0 : 60;
  window.setTimeout(() => {
    if (!shell || window.location.pathname !== routePaths.portfolio || shell.classList.contains("is-portfolio-entry-sequence")) {
      return;
    }

    activatePortfolioEntrySequenceState();
    startPortfolioArrival();
    schedulePortfolioEntrySequenceCleanup(
      reducedMotion.matches ? HOME_PORTFOLIO_REDUCED_MOTION_CLEANUP_MS : PORTFOLIO_DIRECT_ENTRY_SEQUENCE_QA_CLEANUP_MS
    );
  }, directEntryStartDelay);
}

// ENGAGE keeps browser history on /home until the Portfolio Engine is visibly live.
function completeHomePortfolioRouteHandoff() {
  if (!isHomePortfolioRouteHandoffPending) {
    return;
  }

  isHomePortfolioRouteHandoffPending = false;
  homePortfolioTransitionTimer = 0;
  const portfolioRoute = getPortfolioRouteContext();
  if (window.location.pathname !== routePaths.portfolio) {
    pushRouteUrl(routePaths.portfolio, { fromHomeEngage: true });
  }
  applyPortfolioShellRouteContext();
  updateShellBreadcrumb(portfolioRoute);
  updateShellBackState(portfolioRoute);
  stabilizeShellViewport(portfolioRoute, { historyState: { fromHomeEngage: true } });
}

function beginHomePortfolioTransition() {
  if (
    !shell ||
    !startButton ||
    startButton.disabled ||
    shell.classList.contains("is-portfolio-entry-sequence") ||
    shell.classList.contains("is-home-transitioning") ||
    shell.classList.contains("is-engage-activated") ||
    shell.classList.contains("has-entered-hub")
  ) {
    return;
  }

  isHomePortfolioRouteHandoffPending = true;
  activatePortfolioEntrySequenceState();
  revealHub({
    shouldPlayPortfolioArrival: true,
    shouldUsePortfolioShellRouteContext: true,
  });
  schedulePortfolioEntrySequenceCleanup();
}

if (shell && startButton) {
  renderGlobalMenu();
  initShellRailLogo();
  initPortfolioBeaconHotspots();
  initPortfolioEngineLightning();
  startButton.setAttribute("aria-busy", "false");
  setActiveGlobalNav("home");
  startButton.addEventListener("click", beginHomePortfolioTransition);
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
      const showRoute = wrestlingMatchGalleryShell?.dataset.wrestlingShowRoute;
      if (showRoute) {
        navigateToRoute(showRoute);
        return;
      }
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
        if (tile.dataset.wrestlingLightboxRoute) {
          navigateToRoute(tile.dataset.wrestlingLightboxRoute);
          return;
        }
        const showId = tile.dataset.wrestlingShowId ||
          wrestlingMatchGalleryShell?.dataset.wrestlingShowId ||
          "warzone-26";
        const matchId = tile.dataset.wrestlingMatchRef ||
          wrestlingMatchGalleryShell?.dataset.wrestlingMatchRef ||
          tile.dataset.wrestlingMatchId ||
          wrestlingMatchGalleryShell?.dataset.wrestlingMatchId ||
          "1";
        const matchRoute = typeof getWrestlingMatchRouteUrlByIds === "function"
          ? getWrestlingMatchRouteUrlByIds(showId, matchId)
          : `${routePaths.wrestlingShows}/${encodeURIComponent(showId)}/match-${encodeURIComponent(matchId)}`;
        navigateToRoute(`${matchRoute}/photo/${encodeURIComponent(photoId)}`);
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
  const initialRoute = getRouteFromUrl();
  syncRouteFromLocation({
    historyState: window.history.state,
    shouldPlayDirectPortfolioArrival: false,
    shouldPlayDirectPortfolioEntrySequence: PORTFOLIO_DIRECT_ENTRY_SEQUENCE_FOR_QA && initialRoute.name === "portfolio",
  });
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
    reducedMotion.addEventListener("change", syncPortfolioEngineLightningMotion);
  } else if (typeof reducedMotion.addListener === "function") {
    reducedMotion.addListener(syncAmbientMotion);
    reducedMotion.addListener(syncPortfolioEngineLightningMotion);
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
    window.clearTimeout(portfolioArrivalTimer);
    window.clearTimeout(portfolioOrientationStartTimer);
    window.clearTimeout(portfolioDirectArrivalTimer);
    window.clearTimeout(portfolioOrientationTimer);
    window.clearTimeout(portfolioFirstTransferTimer);
    cancelPortfolioEngineReadyGate();
    stopPortfolioEngineLightning();
    window.clearTimeout(drawerCloseTimer);
    if (spotlightFrame) {
      window.cancelAnimationFrame(spotlightFrame);
    }
  });
}
