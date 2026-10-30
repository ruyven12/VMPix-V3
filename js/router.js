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

function getWrestlingVenueDetailPrototypePath(venueSlug = "colisee") {
  const rawVenueSlug = String(venueSlug || "").trim().replace(/2$/i, "") || "colisee";
  return `${routePaths.wrestlingVenues}/${encodeURIComponent(rawVenueSlug)}`;
}

function getWrestlingVenueDetailPrototypeSlugFromRoutePart(routePart) {
  const decodedRoutePart = decodeRoutePart(routePart).trim();
  if (!decodedRoutePart || !/2$/i.test(decodedRoutePart)) {
    return "";
  }
  return decodedRoutePart.slice(0, -1).trim();
}

function createWrestlingVenueDetailPrototypeRoute(venueSlug = "colisee") {
  const prototypeVenueSlug = String(venueSlug || "").trim().replace(/2$/i, "") || "colisee";
  const canonicalUrl = getWrestlingVenueDetailPrototypePath(prototypeVenueSlug);
  return {
    name: "wrestling-venue-detail-prototype",
    venueId: prototypeVenueSlug,
    prototypeVenueSlug,
    canonicalUrl,
    venuesPrototype: "fields-of-conflict",
    wrestlingVenueDetailPrototype: prototypeVenueSlug,
  };
}

function getWrestlingVenueDetailPrototypeRouteFromUrl() {
  return null;
}
function getRouteFromUrlWithPrototypePrecedence(url = window.location.href) {
  return getRouteFromUrl(url);
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

  if (routePath === "/wrestling2") {
    return { name: "wrestling", canonicalUrl: routePaths.wrestling, shouldReplaceUrl: true };
  }
  if (routePath === "/shows2" || routePath === "/wrestling/shows2") {
    return { name: "wrestling-shows", canonicalUrl: routePaths.wrestlingShows, showsVariant: "hall-of-crusades", shouldReplaceUrl: true };
  }

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
    return { name: "wrestling-people-prototype", canonicalUrl: routePaths.wrestlingPeople, wrestlingPeoplePrototype: "hall-of-champions" };
  }
  const wrestlingPersonDetailPrefix = `${routePaths.wrestlingPeople}/`;
  if (routePath.startsWith(wrestlingPersonDetailPrefix)) {
    const routeParts = routePath.slice(wrestlingPersonDetailPrefix.length).split("/");
    if (routeParts.length === 1 && routeParts[0]) {
      const personId = decodeRoutePart(routeParts[0]);
      if (normalizeRoutePath(`${routePaths.wrestlingPeople}/${personId}`) === `${routePaths.wrestlingPeople}/proto`) {
        return unknownRoute("wrestling-route-not-found");
      }
      return { name: "wrestling-person-detail", personId, canonicalUrl: getWrestlingPersonRouteUrl(personId) };
    }
  }
  if (routePath === routePaths.wrestlingVenues) {
    return { name: "wrestling-venues", canonicalUrl: routePaths.wrestlingVenues, venuesPrototype: "fields-of-conflict", wrestlingVenuesPrototype: "fields-of-conflict" };
  }
  const wrestlingVenueDetailPrefix = `${routePaths.wrestlingVenues}/`;
  if (routePath.startsWith(wrestlingVenueDetailPrefix)) {
    const routeParts = routePath.slice(wrestlingVenueDetailPrefix.length).split("/");
    if (routeParts.length === 1 && routeParts[0]) {
      const venueId = decodeRoutePart(routeParts[0]);
      if (/2$/i.test(String(venueId || "").trim())) {
        return unknownRoute("wrestling-route-not-found");
      }
      return { name: "wrestling-venue-detail", venueId, canonicalUrl: getWrestlingVenueRouteUrl(venueId) };
    }
  }
  if (routePath === routePaths.wrestlingShows) {
    return { name: "wrestling-shows", canonicalUrl: routePaths.wrestlingShows, showsVariant: "hall-of-crusades" };
  }
  const wrestlingShowDetailPrefix = `${routePaths.wrestlingShows}/`;
  if (routePath.startsWith(wrestlingShowDetailPrefix)) {
    const routeParts = routePath.slice(wrestlingShowDetailPrefix.length).split("/");
    if (routeParts.length === 4 && routeParts[0] && routeParts[1] && routeParts[2] === "photo" && routeParts[3]) {
      const dateKey = decodeRoutePart(routeParts[0]);
      const matchRef = decodeWrestlingMatchRouteSegment(routeParts[1]);
      const photoId = decodeRoutePart(routeParts[3]);
      return { name: "wrestling-match-detail-photo", showId: dateKey, dateKey, matchId: matchRef, matchRef, photoId, canonicalUrl: `${routePaths.wrestlingShows}/${encodeURIComponent(dateKey)}/${encodeURIComponent(matchRef)}/photo/${encodeURIComponent(photoId)}` };
    }
    if (routeParts.length === 2 && routeParts[0] && routeParts[1]) {
      const dateKey = decodeRoutePart(routeParts[0]);
      const matchRef = decodeWrestlingMatchRouteSegment(routeParts[1]);
      return { name: "wrestling-match-detail", showId: dateKey, dateKey, matchId: matchRef, matchRef, canonicalUrl: `${routePaths.wrestlingShows}/${encodeURIComponent(dateKey)}/${encodeURIComponent(matchRef)}` };
    }
    if (routeParts.length === 5 && routeParts[0] && routeParts[1] === "match" && routeParts[2] && routeParts[3] === "photo" && routeParts[4]) {
      const dateKey = decodeRoutePart(routeParts[0]);
      const matchRef = decodeLegacyWrestlingMatchRouteSegment(routeParts[2]);
      const photoId = decodeRoutePart(routeParts[4]);
      return { name: "wrestling-match-detail-photo", showId: dateKey, dateKey, matchId: matchRef, matchRef, photoId, canonicalUrl: `${routePaths.wrestlingShows}/${encodeURIComponent(dateKey)}/${encodeURIComponent(matchRef)}/photo/${encodeURIComponent(photoId)}` };
    }
    if (routeParts.length === 3 && routeParts[0] && routeParts[1] === "match" && routeParts[2]) {
      const dateKey = decodeRoutePart(routeParts[0]);
      const matchRef = decodeLegacyWrestlingMatchRouteSegment(routeParts[2]);
      return { name: "wrestling-match-detail", showId: dateKey, dateKey, matchId: matchRef, matchRef, canonicalUrl: `${routePaths.wrestlingShows}/${encodeURIComponent(dateKey)}/${encodeURIComponent(matchRef)}` };
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
  if (routePath === routePaths.upcoming) {
    return { name: "upcoming", canonicalUrl: routePaths.upcoming };
  }
  if (routePath === routePaths.privacy) {
    return { name: "privacy", canonicalUrl: routePaths.privacy };
  }
  if (routePath === routePaths.contact) {
    return { name: "contact", canonicalUrl: routePaths.contact };
  }
  if (routePath === routePaths.admin) {
    const station = routeUrl.searchParams.get("station");
    const adminStation = ["api", "database", "imports"].includes(station) ? station : "deck";
    return { name: "admin", adminStation, canonicalUrl: adminStation === "deck" ? routePaths.admin : `${routePaths.admin}?station=${adminStation}` };
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


// Refresh supplements one history entry; ordinary SPA history remains authoritative.
const V3_RESUME_VERSION = 1;
const v3InitialNavigationCause = performance.getEntriesByType('navigation')[0]?.type === 'reload' ? 'reload' : performance.getEntriesByType('navigation')[0]?.type === 'back_forward' ? 'back-forward' : 'deep-link';
let v3RouteContext = { navigationCause: v3InitialNavigationCause, skipEntryAnimation: false, isResume: false };
const v3EntriesRenderedInDocument = new Set();
let v3RouteStarted = false, v3ResumeWake = null, v3ResumeObserver = null, v3ResumeDeadline = 0, v3CheckpointTimer = 0;
const v3Text = (value, fallback = '') => typeof value === 'string' && value.length <= 300 ? value : fallback;
const v3Number = (value, fallback = 0, max = 1000000) => Number.isFinite(value) ? Math.max(0, Math.min(max, value)) : fallback;
function isCurrentV3Route(route) {
  return ['music','music-shows','music-bands','band-detail','set-detail','wrestling','wrestling-shows','wrestling-show-detail','wrestling-match-detail','wrestling-match-detail-photo','wrestling-people-prototype','wrestling-person-detail','wrestling-venues','wrestling-venue-detail'].includes(route?.name);
}
// Restoration eligibility is deliberately separate from presentation ownership.
function isScopedRouteResume(route) {
  return ['music-venue-detail','person-detail','show-detail','sets-archive',
    'wrestling-show-detail','wrestling-person-detail','wrestling-venue-detail'].includes(route?.name);
}
function isV3ResumeRoute(route) { return isCurrentV3Route(route) || isScopedRouteResume(route); }
function isMusicResumeRoute(route) {
  return route.name.startsWith('music') || ['band-detail','set-detail','person-detail','show-detail','sets-archive'].includes(route.name);
}
// Bounded cache of the same snapshots, for SPA traversal when storage is unavailable.
const v3ResumeSnapshots = new Map();
let v3ResumeFrame = 0;
function createV3EntryId() { return crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2); }
function ensureV3EntryId() {
  const state = window.history.state || {};
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(state.v3EntryId || '')) window.history.replaceState({ ...state, v3EntryId: createV3EntryId() }, '', location.href);
  return window.history.state.v3EntryId;
}
function v3ResumeKey(entry, url) { return 'v3:resume:' + V3_RESUME_VERSION + ':' + entry + ':' + url; }
function v3ResumeUI() { return v3RouteContext.pending ? v3RouteContext.snapshot?.ui || {} : {}; }
function getV3ResumeScrollers(route = v3RouteContext.route) {
  const selectors = route.name === 'music-bands' ? ['.rhythm-pillar','[data-rhythm-rolodex]','#rhythm-search-panel','[data-bands-search-results]']
    : route.name === 'band-detail' ? ['[data-band-detail-content]']
    : route.name === 'wrestling-people-prototype' ? ['[data-wrestling-people-prototype-shell]',...['search','az','category','team'].map(mode=>'[data-hall-of-champions-workspace-results="'+mode+'"]')]
    : route.name === 'wrestling-person-detail' ? ['[data-wrestling-person-dossier-prototype-shell]','.wrestling-person-dossier-prototype-framework','[data-wrestling-person-dossier-prototype-event-archive-photo-grid]','.wrestling-person-dossier-prototype-event-history__card']
    : route.name === 'wrestling-venue-detail' ? ['.fields-of-conflict-dossier']
    : route.name.startsWith('wrestling-') ? ['.wrestling-show-prototype-surface','.wrestling-show-prototype-encounters','.wrestling-show-prototype-encounter-list'] : [];
  return new Map([['shell',getActiveShellScroller(route)],...selectors.map(selector=>[selector,document.querySelector(selector)])]);
}
function captureV3Scroll() {
  return [...getV3ResumeScrollers()].filter(([,node])=>node?.isConnected).map(([key,node])=>({key,top:node.scrollTop,left:node.scrollLeft}));
}
function restoreV3Scroll(rows) {
  if(!Array.isArray(rows))return;
  const scrollers=getV3ResumeScrollers();
  rows.slice(0,12).forEach(row=>{const node=scrollers.get(row?.key);if(node?.isConnected)node.scrollTo({top:v3Number(row.top),left:v3Number(row.left),behavior:'instant'});});
}
function checkpointV3Resume(allowDeparted = false) {
  clearTimeout(v3CheckpointTimer);
  const context=v3RouteContext;
  if(!context.entry || context.pending || !isV3ResumeRoute(context.route) || (allowDeparted !== true && context.url!==(getRouteFromUrl().canonicalUrl || getPathWithSearch())))return;
  try {
    const ui=isMusicResumeRoute(context.route) ? captureMusicResumeState(context.route) : captureWrestlingResumeState(context.route);
    rememberShellLocalDrilldownUI(context, ui);
    if (getShellLocalDrilldown(history.state, context.route) && history.state.v3EntryId === context.entry) {
      history.replaceState({ ...history.state, localDrilldown: { ...history.state.localDrilldown, ui } }, "", location.href);
    }
    const snapshot={version:V3_RESUME_VERSION,entry:context.entry,url:context.url,ui,scroll:captureV3Scroll()};
    if (context.route.name === "set-detail" && history.state?.v3EntryId === context.entry) {
      history.replaceState({ ...history.state, setDossier: { ...history.state.setDossier, ui } }, "", location.href);
    }
    const value=JSON.stringify(snapshot);
    if(value.length<=16000){
      if(isScopedRouteResume(context.route)){
        const key=v3ResumeKey(context.entry,context.url);
        v3ResumeSnapshots.delete(key);v3ResumeSnapshots.set(key,snapshot);
        while(v3ResumeSnapshots.size>24)v3ResumeSnapshots.delete(v3ResumeSnapshots.keys().next().value);
        if(history.state?.v3EntryId===context.entry)history.replaceState({...history.state,v3Resume:snapshot},'',location.href);
      }
      sessionStorage.setItem(v3ResumeKey(context.entry,context.url),value);
    }
  } catch { /* Storage is optional; navigation and real data rendering must continue. */ }
}
function notifyV3ResumeReady(){v3ResumeWake?.();}
function cancelV3ResumeRestore(){cancelAnimationFrame(v3ResumeFrame);v3ResumeFrame=0;v3ResumeWake=null;v3ResumeObserver?.disconnect();v3ResumeObserver=null;clearTimeout(v3ResumeDeadline);}
function beginV3RouteContext(route,options){
  if ((route.name === "wrestling" || v3RouteContext.route?.name === "wrestling") && typeof resetDaiionArchivePresentation === "function") resetDaiionArchivePresentation();
  cancelV3ResumeRestore();
  const cause=options.navigationCause || (v3RouteStarted ? 'spa' : v3InitialNavigationCause);
  v3RouteStarted=true;
  const entry=ensureV3EntryId(),url=route.canonicalUrl || getPathWithSearch();
  if(route.name==='music-bands' && musicSourceResume?.entry && musicSourceResume.entry!==entry)musicSourceResume=null;
  // A reload also discards ancestors' in-memory return state. Recover only the first
  // visit to such an entry; entries already alive here retain normal SPA restoration.
  const reloadGap = ['reload','back-forward'].includes(v3InitialNavigationCause) && cause==='back-forward' && !v3EntriesRenderedInDocument.has(entry);
  v3EntriesRenderedInDocument.add(entry);
  let snapshot=null;
  if((cause==='reload' || reloadGap || ((['band-detail','music-shows','set-detail'].includes(route.name) || isScopedRouteResume(route)) && cause==='back-forward')) && isV3ResumeRoute(route))try{
    const raw=sessionStorage.getItem(v3ResumeKey(entry,url));
    const value=raw && raw.length<=16000 ? JSON.parse(raw) : null;
    if(value?.version===V3_RESUME_VERSION && value.entry===entry && value.url===url && value.ui && typeof value.ui==='object' && !Array.isArray(value.ui))snapshot=value;
  }catch{}
  if(isScopedRouteResume(route) && ['reload','back-forward'].includes(cause)){
    const cached=v3ResumeSnapshots.get(v3ResumeKey(entry,url)) || snapshot || history.state?.v3Resume;
    if(cached?.version===V3_RESUME_VERSION && cached.entry===entry && cached.url===url && cached.ui && typeof cached.ui==='object' && !Array.isArray(cached.ui))snapshot=cached;
  }
  if (!snapshot && route.name === "set-detail" && ['reload','back-forward'].includes(cause) && history.state?.setDossier?.ui) {
    snapshot = { version: V3_RESUME_VERSION, entry, url, ui: history.state.setDossier.ui, scroll: [] };
  }
  const local = getShellLocalDrilldown(history.state, route);
  if (local && ['reload','back-forward'].includes(cause)) {
    const ui = { ...(snapshot?.ui || local.ui || {}), [route.name === "music-shows" ? "drawerOpen" : "open"]: local.open };
    snapshot = { version: V3_RESUME_VERSION, entry, url, ui, scroll: snapshot?.scroll || [] };
  }
  // Band identification replays on a fresh visit or a top-of-page reload only.
  const bandScrolled = Array.isArray(snapshot?.scroll) && snapshot.scroll.some(row =>
    ['shell','[data-band-detail-content]'].includes(row?.key) && v3Number(row.top) > 1);
  const bandEntranceEligible = route.name === 'band-detail' && !['back-forward','bfcache'].includes(cause)
    && (cause !== 'reload' || !bandScrolled);
  v3RouteContext={bandEntranceEligible,navigationCause:cause,skipEntryAnimation:(cause==='reload' || (reloadGap && snapshot)) && isCurrentV3Route(route),isResume:Boolean(snapshot),entry,url,route,snapshot,pending:Boolean(snapshot),applied:false};
  v3RouteContext.localFamily = local?.family;
  if(snapshot)try{if(isMusicResumeRoute(route))seedMusicResumeState(route,snapshot.ui);else seedWrestlingResumeState(route,snapshot.ui);}catch{v3RouteContext.snapshot=null;v3RouteContext.pending=false;v3RouteContext.isResume=false;}
  queueMicrotask(()=>{
    const context=v3RouteContext;
    if(context.route!==route)return;
    const restore=()=>{
      if(v3RouteContext!==context)return;
      // Run scoped restoration after synchronous mounts and resolved data callbacks.
      if(isScopedRouteResume(route) && !context.inResumeFrame){
        if(!context.pending)return;
        if(!v3ResumeFrame)v3ResumeFrame=requestAnimationFrame(()=>{v3ResumeFrame=0;context.inResumeFrame=true;restore();context.inResumeFrame=false;});
        return;
      }
      v3ResumeObserver?.disconnect();
      let ready=true;
      try{if(context.pending && !context.uiReady)ready=isMusicResumeRoute(route) ? restoreMusicResumeState(route,context.snapshot.ui) : restoreWrestlingResumeState(route,context.snapshot.ui);}catch{ready=true;}
      if(ready)context.uiReady=true;
      if(context.pending && document.fonts?.status==='loading'){ready=false;if(!context.fontWait){context.fontWait=true;document.fonts.ready.then(()=>{context.fontWait=false;if(v3RouteContext===context && context.pending)restore();});}}
      if(ready && context.pending && isScopedRouteResume(route))ready=[...getV3ResumeScrollers(route).values()].some(node=>node?.isConnected && node.clientHeight>0);
      if(ready){if(context.pending)restoreV3Scroll(context.snapshot.scroll);context.pending=false;cancelV3ResumeRestore();if(route.name==="set-detail")queueMicrotask(scheduleSetReadoutCycle);}
      else v3ResumeObserver?.observe(document.querySelector('.site-shell'),{childList:true,subtree:true,attributes:true,attributeFilter:['data-record-info-state','data-wrestling-person-dossier-prototype-event-archive-photo-state','data-bands-data-state']});
    };
    if(context.pending){v3ResumeWake=restore;v3ResumeObserver=new MutationObserver(restore);v3ResumeDeadline=setTimeout(()=>{context.pending=false;cancelV3ResumeRestore();},20000);}
    restore();
    if(context.skipEntryAnimation && route.name==='music')settleMusicResumeLanding();
  });
}
for(const type of ['click','input','change','scroll'])document.addEventListener(type,()=>{clearTimeout(v3CheckpointTimer);v3CheckpointTimer=setTimeout(checkpointV3Resume,180);},{capture:true,passive:true});
window.addEventListener('pagehide',checkpointV3Resume,{capture:true});
// Trusted intent takes precedence over a data-delayed restore; programmatic rendering does not.
for(const type of ['pointerdown','touchstart','wheel','keydown','input'])document.addEventListener(type,event=>{
  if(!event.isTrusted || !v3RouteContext.pending || !isScopedRouteResume(v3RouteContext.route) ||
    (event.type==='keydown' && ['Shift','Control','Alt','Meta'].includes(event.key)))return;
  v3RouteContext.pending=false;v3RouteContext.restoreCancelled=true;cancelV3ResumeRestore();
},{capture:true,passive:true});

const SHELL_HISTORY_INDEX_KEY = "__v3ShellHistoryIndex";
let shellHistoryIndex = null;
let shellRenderedRoute = null;

function getShellHistoryIndex(state) {
  const value = state?.[SHELL_HISTORY_INDEX_KEY];
  return Number.isSafeInteger(value) ? value : null;
}

function seedShellHistoryIndex() {
  ensureV3EntryId();
  shellHistoryIndex = getShellHistoryIndex(window.history?.state);
  if (shellHistoryIndex === null && typeof window.history?.replaceState === "function") {
    shellHistoryIndex = 0;
    window.history.replaceState({ ...(window.history.state || {}), [SHELL_HISTORY_INDEX_KEY]: shellHistoryIndex }, "", window.location.href);
  }
}

function pushRouteUrl(url, state = {}) {
  checkpointV3Resume();
  if (!window.history || typeof window.history.pushState !== "function") {
    return;
  }

  const targetUrl = new URL(url, window.location.href);
  const targetPath = `${targetUrl.pathname}${targetUrl.search}`;
  if (typeof cancelShellBackSweep === "function") cancelShellBackSweep();
  const currentIndex = getShellHistoryIndex(window.history.state);
  const nextIndex = (currentIndex ?? shellHistoryIndex ?? 0) + 1;
  const routeState = { ...state, v3EntryId: targetPath !== getPathWithSearch() ? createV3EntryId() : ensureV3EntryId(), route: targetPath, [SHELL_HISTORY_INDEX_KEY]: targetPath !== getPathWithSearch() ? nextIndex : currentIndex ?? shellHistoryIndex ?? 0 };
  if (targetPath !== getPathWithSearch()) {
    routeState.__v3ShellPreviousRoute = getPathWithSearch();
    window.history.pushState(routeState, "", targetPath);
    shellHistoryIndex = nextIndex;
  } else if (Object.keys(state).length > 0) {
    window.history.replaceState({ ...(window.history.state || {}), ...routeState }, "", targetPath);
  }
}

function replaceRouteUrl(url, state = {}, resetEntry = false) {
  checkpointV3Resume();
  if (!window.history || typeof window.history.replaceState !== "function") {
    return;
  }

  const targetUrl = new URL(url, window.location.href);
  const targetPath = `${targetUrl.pathname}${targetUrl.search}`;
  const routeState = { ...(resetEntry ? {} : window.history.state || {}), ...state, v3EntryId: resetEntry ? createV3EntryId() : ensureV3EntryId(), route: targetPath, [SHELL_HISTORY_INDEX_KEY]: getShellHistoryIndex(window.history.state) ?? shellHistoryIndex ?? 0 };
  if (targetPath !== getPathWithSearch()) {
    window.history.replaceState(routeState, "", targetPath);
  } else if (resetEntry || Object.keys(state).length > 0) {
    window.history.replaceState(routeState, "", targetPath);
  }
  if (v3RouteContext.entry === window.history.state?.v3EntryId) v3RouteContext.url = getRouteFromUrl().canonicalUrl || getPathWithSearch();
}

// Same-URL Set modes use Shell entry IDs/indices and the existing resume snapshots.
function ensureSetDossierHistory() {
  if (getRouteFromUrl().name !== "set-detail") return;
  if (history.state?.setDossier) { v3RouteContext.setFamily = history.state.setDossier.family; return; }
  history.replaceState({ ...history.state, setDossier: { family: ensureV3EntryId(), mode: "preview", origin: "preview" } }, "", location.href);
  v3RouteContext.setFamily = history.state.setDossier.family;
}
function pushSetDossierMode(mode, origin = activeSetGalleryPhotoMode) {
  if (getRouteFromUrl().name !== "set-detail") return;
  ensureSetDossierHistory();
  checkpointV3Resume();
  const previous = history.state, index = (getShellHistoryIndex(previous) ?? 0) + 1;
  const entry = createV3EntryId();
  history.pushState({ ...previous, v3EntryId: entry, [SHELL_HISTORY_INDEX_KEY]: index,
    setDossier: { family: previous.setDossier.family, mode, origin, previousEntry: previous.v3EntryId } }, "", location.href);
  shellHistoryIndex = index;
  v3RouteContext.entry = entry;
  setReadoutState.entry = entry;
  v3EntriesRenderedInDocument.add(entry);
}
function backSetDossierMode() {
  if (getRouteFromUrl().name !== "set-detail" || (!setFocusSession && activeSetGalleryPhotoMode !== "all")) return false;
  if (history.state?.setDossier?.previousEntry) {
    if (!v3RouteContext.setBackPending) {
      checkpointV3Resume(); v3RouteContext.setBackPending = true; history.back();
    }
  } else {
    // A restored/copy-pasted entry may have no local predecessor; stay in the Dossier.
    const ui = captureSetDossierState();
    ui.mode = setFocusSession ? ui.origin : "preview";
    history.replaceState({ ...history.state, setDossier: { ...history.state?.setDossier, mode: ui.mode } }, "", location.href);
    beginSetDossierLocalRestore(ui);
  }
  return true;
}
function beginSetDossierLocalRestore(ui) {
  v3RouteContext.setBackPending = false;
  cancelV3ResumeRestore();
  const context = v3RouteContext;
  context.pending = true;
  context.snapshot = { ui, scroll: [] };
  const restore = () => {
    if (v3RouteContext !== context) return;
    if (restoreSetDossierState(ui)) { context.pending = false; cancelV3ResumeRestore(); scheduleSetReadoutCycle(); }
  };
  v3ResumeWake = restore;
  v3ResumeDeadline = setTimeout(() => { context.pending = false; cancelV3ResumeRestore(); }, 20000);
  restore();
}
function handleSetDossierHistory(event) {
  const route = getRouteFromUrl(), context = v3RouteContext;
  if (route.name !== "set-detail" || context.route?.name !== "set-detail" || route.canonicalUrl !== context.url ||
      !setDossierVisit || setDossierVisit.context !== context || setGallery.getAttribute("aria-hidden") !== "false") return false;
  const state = event.state;
  if (!state?.setDossier || state.setDossier.family !== context.setFamily) return false;
  let ui = state.setDossier.ui || { mode: state.setDossier.mode, origin: state.setDossier.origin };
  try { const saved = JSON.parse(sessionStorage.getItem(v3ResumeKey(state.v3EntryId, context.url))); if (saved?.entry === state.v3EntryId && saved.url === context.url && saved.version === V3_RESUME_VERSION) ui = saved.ui; } catch {}
  // Going back from preview Focus adopts the currently viewed preview photograph.
  if (setFocusSession?.origin === "preview" && ui.mode === "preview" && getShellHistoryIndex(state) < shellHistoryIndex) {
    ui = { ...ui, heroKey: setDossierPhotoKey(), stripLeft: galleryGrid.scrollLeft, revealHero: true };
  }
  const readout = { readout: setReadoutState.index, paused: setReadoutState.paused, manualUntil: setReadoutState.manualUntil };
  context.entry = state.v3EntryId;
  shellHistoryIndex = getShellHistoryIndex(state);
  beginSetDossierLocalRestore({ ...ui, ...readout });
  return true;
}

// Two supported local drilldowns share Shell history IDs and resume storage.
// A base entry is annotated only on an explicit opening; boot never pushes history.
function getShellLocalDrilldownKind(route = getRouteFromUrl()) {
  return route.name === "music-shows" ? "synchronicity-drawer"
    : route.name === "wrestling-person-detail" ? "person-event-archive" : "";
}
function getShellLocalDrilldown(state = history.state, route = getRouteFromUrl()) {
  const local = state?.localDrilldown, kind = getShellLocalDrilldownKind(route);
  if (!kind || !local || local.kind !== kind || local.url !== route.canonicalUrl ||
      typeof local.open !== "boolean" || !/^[a-zA-Z0-9-]{8,80}$/.test(local.family || "") ||
      !/^[a-zA-Z0-9-]{8,80}$/.test(state.v3EntryId || "") || getShellHistoryIndex(state) === null ||
      (local.open && !/^[a-zA-Z0-9-]{8,80}$/.test(local.previousEntry || ""))) return null;
  return local;
}
function captureShellLocalDrilldownUI(route) {
  const ui = route.name === "music-shows" ? captureMusicResumeState(route) : captureWrestlingResumeState(route);
  // A native Back can arrive before the passive scroll checkpoint runs.
  if (route.name === "music-shows") {
    const content = document.querySelector('[data-synchronicity-archive-content]');
    if (content && !content.closest('[data-synchronicity-drawer-layer]')?.hidden) ui.drawerScroll = content.scrollTop;
  }
  return ui;
}
function rememberShellLocalDrilldownUI(context, ui) {
  if (!context.localFamily) return;
  const snapshots = context.localSnapshots || (context.localSnapshots = new Map());
  snapshots.set(context.entry, ui);
  // One parent and its current local child; no separate route-history stack.
  while (snapshots.size > 2) snapshots.delete(snapshots.keys().next().value);
}
function adoptShellLocalDrilldownEntry(entry) {
  v3RouteContext.entry = entry;
  v3EntriesRenderedInDocument.add(entry);
  if (v3RouteContext.route.name === "music-shows") {
    if (synchronicityArchiveDrawer) synchronicityArchiveDrawer.entry = entry;
    if (synchronicityMemoriesSession) synchronicityMemoriesSession.entry = entry;
  }
}
function pushShellLocalDrilldown(kind) {
  const route = getRouteFromUrl(), context = v3RouteContext;
  if (kind !== getShellLocalDrilldownKind(route) || route.canonicalUrl !== context.url ||
      context.entry !== history.state?.v3EntryId || context.pending || context.localBackPending) return false;
  let local = getShellLocalDrilldown();
  if (local?.open) return false;
  checkpointV3Resume();
  const ui = captureShellLocalDrilldownUI(route);
  local = { kind, url: context.url, family: local?.family || context.entry, open: false, ui };
  history.replaceState({ ...history.state, localDrilldown: local }, "", location.href);
  context.localFamily = local.family;
  rememberShellLocalDrilldownUI(context, ui);
  const previous = history.state, entry = createV3EntryId(), index = (getShellHistoryIndex(previous) ?? 0) + 1;
  history.pushState({ ...previous, v3EntryId: entry, [SHELL_HISTORY_INDEX_KEY]: index,
    localDrilldown: { ...local, open: true, previousEntry: previous.v3EntryId } }, "", location.href);
  shellHistoryIndex = index;
  adoptShellLocalDrilldownEntry(entry);
  return true;
}
function backShellLocalDrilldown(kind = getShellLocalDrilldownKind()) {
  const local = getShellLocalDrilldown();
  if (!local?.open || local.kind !== kind || local.family !== v3RouteContext.localFamily) return false;
  if (!v3RouteContext.localBackPending) {
    checkpointV3Resume();
    v3RouteContext.localBackPending = true;
    history.back();
  }
  return true;
}
function handleShellLocalDrilldownHistory(event) {
  const route = getRouteFromUrl(), context = v3RouteContext, local = getShellLocalDrilldown(event.state, route);
  if (!local || route.canonicalUrl !== context.url || route.name !== context.route?.name || local.family !== context.localFamily) return false;
  rememberShellLocalDrilldownUI(context, captureShellLocalDrilldownUI(route));
  let ui = context.localSnapshots?.get(event.state.v3EntryId);
  if (!ui) try {
    const saved = JSON.parse(sessionStorage.getItem(v3ResumeKey(event.state.v3EntryId, context.url)));
    if (saved?.version === V3_RESUME_VERSION && saved.entry === event.state.v3EntryId && saved.url === context.url) ui = saved.ui;
  } catch { /* History's compact snapshot also works without storage. */ }
  ui = { ...(ui || local.ui || {}), [route.name === "music-shows" ? "drawerOpen" : "open"]: local.open };
  cancelShellBackSweep();
  cancelV3ResumeRestore();
  adoptShellLocalDrilldownEntry(event.state.v3EntryId);
  shellHistoryIndex = getShellHistoryIndex(event.state);
  context.localBackPending = false;
  context.pending = true;
  context.applied = false;
  context.snapshot = { ui, scroll: [] };
  const restore = () => {
    if (v3RouteContext !== context) return;
    const ready = route.name === "music-shows"
      ? synchronicityArchiveDrawer?.restoreLocalHistory?.(local.open, ui)
      : restoreWrestlingPersonArchiveHistory(local.open, ui);
    if (ready) { context.pending = false; cancelV3ResumeRestore(); checkpointV3Resume(); }
  };
  v3ResumeWake = restore;
  v3ResumeObserver = new MutationObserver(restore);
  v3ResumeObserver.observe(document.querySelector('.site-shell'), { childList: true, subtree: true,
    attributes: true, attributeFilter: ['data-wrestling-person-dossier-prototype-event-archive-photo-state'] });
  v3ResumeDeadline = setTimeout(() => { context.pending = false; cancelV3ResumeRestore(); }, 20000);
  restore();
  return true;
}

function notifyV3AnalyticsView(route) {
  try { window.__v3AnalyticsBoot?.commit(route); } catch { /* Optional analytics never changes routing. */ }
}

// Adopt an already-painted persistent destination without running its mount path again.
function adoptPersistentWrestlingRoute(route, { worldName = "battleground" } = {}) {
  beginV3RouteContext(route, { navigationCause: "spa" });
  if (typeof cancelShellBackSweep === "function") cancelShellBackSweep();
  shellRenderedRoute = route;
  if (worldName === "soundtrack") {
    showMusicNexus({ fromPortfolioTransport: true });
    shell.dataset.musicTransportEntry = "arriving";
    updateShellRouteContext(route, "music");
    musicNexusShell.inert = true;
  }
  setActiveGlobalNavForRoute(route.name, { preservePresentation: true });
  updateShellBreadcrumb(route);
  updateShellBackState(route);
  updatePrototypeEngineReturnEmitter(route);
  stabilizeShellViewport(route);
  notifyV3AnalyticsView(route);
}

function syncRoute(route, options = {}) {
  if (typeof syncContactRoute === "function" && syncContactRoute(route)) return;
  if (typeof syncCalendarRoute === "function" && syncCalendarRoute(route)) return;
  if (typeof syncTrajectoryRoute === "function" && syncTrajectoryRoute(route)) return;
  try { window.__v3AnalyticsBoot?.protectAdmin(route); } catch { /* Optional analytics never changes mounting. */ }
  if (route.name !== "privacy" && typeof hidePrivacyShell === "function") hidePrivacyShell();
  if (typeof cancelAdminStationTravel === "function") cancelAdminStationTravel();
  if (route.name !== "admin" && typeof hideAdminShell === "function") hideAdminShell();
  beginV3RouteContext(route, options);
  if (bandRecordOpening && !bandRecordOpening.promoting) cancelBandRecordOpening();
  if (typeof zhentoRhythmEntry !== "undefined" && zhentoRhythmEntry && !zhentoRhythmEntry.promoting) cancelZhentoRhythmEntry();
  syncRhythmPresentationOwnership(route, options);
  if (typeof cancelShellBackSweep === "function") cancelShellBackSweep();
  shellRenderedRoute = route;
  if (route.name === "wrestling-shows" && typeof primeWrestlingShowsRouteSurface === "function") {
    primeWrestlingShowsRouteSurface();
  }

  if (route.name !== "connect" && typeof hideConnectShell === "function") {
    hideConnectShell();
  }

  if (route.name !== "wrestling-person-detail" && typeof setWrestlingPersonDossierPrototypeActive === "function") {
    setWrestlingPersonDossierPrototypeActive(false);
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
    showMusicShowsViewport();
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
    if (route.shouldReplaceUrl && options.shouldCanonicalize !== false && route.canonicalUrl) {
      replaceRouteUrl(route.canonicalUrl);
    }
    if (typeof setWrestlingVenuesPrototypeActive === "function") {
      setWrestlingVenuesPrototypeActive(false);
    }
    if (typeof setWrestlingPeoplePrototypeActive === "function") {
      setWrestlingPeoplePrototypeActive(false);
    }
    const animationStartedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
    showBattlegroundGatewayArrivalSurface();
    if (typeof initDaiionArchiveStatsPanel === "function") {
      initDaiionArchiveStatsPanel({ animationStartedAt });
    }
    return;
  }

  if (route.name === "wrestling-people-prototype") {
    showWrestlingPeoplePrototypeRoute(route);
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl);
    }
    return;
  }

  if (route.name === "wrestling-people") {
    if (typeof setWrestlingPeoplePrototypeActive === "function") {
      setWrestlingPeoplePrototypeActive(false);
    }
    showWrestlingPeopleIndex();
    return;
  }

  if (route.name === "wrestling-person-detail") {
    showWrestlingPersonDossierRoute(route.personId);
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
    if (typeof showWrestlingVenueDetailPrototype === "function") {
      showWrestlingVenueDetailPrototype(route);
    } else {
      showWrestlingVenueDetail(route.venueId);
    }
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl);
    }
    return;
  }

  if (route.name === "wrestling-shows") {
    if (route.shouldReplaceUrl && options.shouldCanonicalize !== false && route.canonicalUrl) {
      replaceRouteUrl(route.canonicalUrl);
    }
    showWrestlingShowsIndex({ showsVariant: route.showsVariant });
    return;
  }

  if (route.name === "wrestling-show-detail") {
    if (route.showDetailVariant) {
      showWrestlingShowDetail(route.showId, { showDetailVariant: route.showDetailVariant, routeShowId: route.routeShowId });
    } else {
      showWrestlingShowDetail(route.showId);
    }
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl);
    }
    return;
  }

  if (route.name === "wrestling-match-detail") {
    if (
      typeof showWrestlingMatchDetailPrototype === "function" &&
      typeof isWrestlingMatchDetailRoute === "function" &&
      isWrestlingMatchDetailRoute(route)
    ) {
      showWrestlingMatchDetailPrototype(route);
    }
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl);
    }
    return;
  }

  if (route.name === "wrestling-match-detail-photo") {
    if (
      typeof showWrestlingMatchDetailPrototypePhoto === "function" &&
      typeof isWrestlingMatchDetailPhotoRoute === "function" &&
      isWrestlingMatchDetailPhotoRoute(route)
    ) {
      showWrestlingMatchDetailPrototypePhoto(route);
    }
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

  if (route.name === "privacy") {
    showPrivacyShell();
    return;
  }


  if (route.name === "admin") {
    showAdminShell(route);
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
    showRhythmPillar();
    setBandsView(route.view, Boolean(options.shouldFocusBandsView));
    if (options.shouldCanonicalize !== false) {
      replaceRouteUrl(route.canonicalUrl);
    }
    return;
  }

  if (route.name === "band-detail") {
    const historyState = options.historyState || window.history.state || {};
    bandsIndexReturnUrl = normalizeBandsReturnUrl(historyState.returnUrl || bandsIndexReturnUrl);
    showRhythmPillar({ detail: true });
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
  const route = getRouteFromUrlWithPrototypePrecedence();
  syncRoute(route, options);
  if (route.name !== "upcoming" && !trajectorySession && !calendarSession && !contactSession && typeof stabilizeShellViewport === "function") {
    stabilizeShellViewport(route, options);
  }
  notifyV3AnalyticsView(route);
}

function navigateToRoute(url, options = {}) {
  // Passage intent stays in memory and never enters history or resume snapshots.
  const { dataConduitIntent, ...routeOptions } = options;
  options = routeOptions;
  if (typeof isRepeatedShellDataConduitIntent === "function" && isRepeatedShellDataConduitIntent(dataConduitIntent)) return;
  if (typeof cancelShellDataConduit === "function") cancelShellDataConduit("navigation");
  if (typeof navigateContactRoute === "function" && navigateContactRoute(getRouteFromUrlWithPrototypePrecedence(url), options)) return;
  if (typeof navigateCalendarRoute === "function" && navigateCalendarRoute(getRouteFromUrlWithPrototypePrecedence(url), options)) return;
  if (typeof navigateTrajectoryRoute === "function" && navigateTrajectoryRoute(getRouteFromUrlWithPrototypePrecedence(url), options)) return;
  try {
    const target = new URL(url, window.location.href);
    if (/^\/admin(?:\/|$)/i.test(target.pathname)) window.__v3AnalyticsBoot?.protectAdmin({ name: "admin" });
  } catch { /* An optional exclusion never changes the navigation outcome. */ }
  if (bandRecordOpening && !bandRecordOpening.promoting) cancelBandRecordOpening();
  if (typeof zhentoRhythmEntry !== "undefined" && zhentoRhythmEntry && !zhentoRhythmEntry.promoting) cancelZhentoRhythmEntry();
  const route = getRouteFromUrlWithPrototypePrecedence(url);
  const targetUrl = route.isUnknown ? url : route.canonicalUrl;
  const restore = () => {
    if (options.replaceHistory === true) replaceRouteUrl(targetUrl, options.historyState || {}, true);
    else pushRouteUrl(targetUrl, options.historyState || {});
    syncRoute(route, { ...options, shouldCanonicalize: false });
    if (typeof stabilizeShellViewport === "function") {
      stabilizeShellViewport(route, options);
    }
    notifyV3AnalyticsView(route);
  };
  if (typeof runShellBackSweep === "function") {
    runShellBackSweep(route, restore, options.navigationDirection === "back", dataConduitIntent);
  } else {
    restore();
  }
}
