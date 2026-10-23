const fs=require('fs');const dir='.codex_tmp/synch-s4';
for(const file of ['index.html','css/modules.css','modules/music.js'])fs.copyFileSync(file,dir+'/'+file.replaceAll('/','--')+'.before');
const edit=(file,anchor,replacement)=>{const bytes=fs.readFileSync(file),i=bytes.indexOf(Buffer.from(anchor));if(i<0||bytes.indexOf(Buffer.from(anchor),i+1)>=0)throw Error('Expected unique anchor: '+file);fs.writeFileSync(file,Buffer.concat([bytes.subarray(0,i),Buffer.from(replacement),bytes.subarray(i+Buffer.byteLength(anchor))]));};
const html='<section class="synchronicity-viewport" data-synchronicity-viewport hidden inert aria-label="Pillar of Synchronicity Shows archive"></section>';
edit('index.html',html,'<section class="synchronicity-viewport" data-synchronicity-viewport hidden inert aria-label="Pillar of Synchronicity Shows archive">\n          <div class="synchronicity-memories" data-synchronicity-memories role="group" aria-label="Preserved performance memories"></div>\n        </section>');
const code=`// S4: static previews only. Stable show IDs, resolved albums, and bounded first-photo pages.
let synchronicityMemoriesSession = null;
let synchronicityMemoriesWide = null;

function clearSynchronicityMemories() {
  const session = synchronicityMemoriesSession;
  synchronicityMemoriesSession = null;
  if (!session) return;
  session.cancelImages.forEach(cancel => cancel());
  session.stage.replaceChildren();
  session.stage.removeAttribute("aria-busy");
  delete session.stage.dataset.memoryCount;
}

function prepareSynchronicityMemories() {
  const viewport = document.querySelector("[data-synchronicity-viewport]");
  const stage = viewport?.querySelector("[data-synchronicity-memories]");
  if (!stage || viewport.hidden || getRouteFromUrl().name !== "music-shows") return;
  if (musicShowsSetsDataState !== "live") { clearSynchronicityMemories(); return; }
  const limit = synchronicityMemoriesWide?.matches ? 5 : 3;
  const source = musicShowsSetsCollection, entry = v3RouteContext.entry;
  if (synchronicityMemoriesSession?.source === source && synchronicityMemoriesSession.entry === entry && synchronicityMemoriesSession.limit === limit) return;
  clearSynchronicityMemories();
  const session = { source, entry, limit, stage, cancelImages: new Set(), results: [], seenImages: new Set() };
  synchronicityMemoriesSession = session;
  stage.setAttribute("aria-busy", "true");
  const current = () => synchronicityMemoriesSession === session && !viewport.hidden &&
    getRouteFromUrl().name === "music-shows" && v3RouteContext.entry === entry && musicShowsSetsCollection === source;
  const usable = src => Boolean(src && isMusicShowPosterImageSrc(src) && src !== SET_GALLERY_NO_POSTER_IMAGE_SRC && !/\\/(?:placeholders|Band-Logos)\\//i.test(src));
  const decode = src => new Promise(resolve => {
    if (!current() || !usable(src) || session.seenImages.has(src)) { resolve(null); return; }
    const image = new Image();
    image.decoding = "async";
    image.referrerPolicy = "strict-origin-when-cross-origin";
    let done = false;
    const finish = ok => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      session.cancelImages.delete(cancel);
      image.onload = image.onerror = null;
      if (!ok) image.removeAttribute("src");
      resolve(ok ? image : null);
    };
    const cancel = () => finish(false);
    const timer = setTimeout(cancel, 8000);
    session.cancelImages.add(cancel);
    image.onerror = cancel;
    image.onload = async () => {
      try { await image.decode(); } catch { cancel(); return; }
      finish(current() && image.naturalWidth > 0 && image.naturalHeight > 0);
    };
    image.src = src;
  });
  const seenShows = new Set();
  // No fallback/demo records and no date-derived route codes are used as identity.
  const candidates = getMusicShowsIndexRows().filter(show => {
    const id = getMusicShowIdValue(show);
    if (!id || seenShows.has(id)) return false;
    seenShows.add(id);
    return true;
  }).slice(0, 20).map(show => ({ show, id: getMusicShowIdValue(show), album: getMusicShowSmugAlbums(show).find(album =>
    String(album.status || "").toLowerCase() === "resolved" &&
    String(album.album_id || album.gallery_id || "").trim() && getMusicShowAlbumPhotoCount(album) !== 0) }));
  const retain = result => {
    if (!result || !current() || session.seenImages.has(result.image.src)) return;
    session.seenImages.add(result.image.src);
    session.results.push(result);
  };
  const render = () => {
    if (!current()) return;
    const fragment = document.createDocumentFragment();
    session.results.forEach(({ show, id, image, kind }) => {
      const frame = document.createElement("figure");
      frame.className = "synchronicity-memory";
      frame.dataset.memoryShowId = id;
      frame.dataset.memoryKind = kind;
      image.alt = (kind === "photo" ? "Concert photograph from " : "Show poster for ") + getMusicShowTitle(show);
      image.draggable = false;
      frame.append(image);
      fragment.append(frame);
    });
    stage.dataset.memoryCount = String(session.results.length);
    stage.replaceChildren(fragment);
  };
  (async () => {
    // Prefer the newest documented concert galleries. At most ten one-photo API pages,
    // two requests at a time; never follow pagination or fetch an entire gallery.
    const albums = candidates.filter(candidate => candidate.album).slice(0, 10);
    for (let start = 0; start < albums.length && current() && session.results.length < limit;) {
      const batch = albums.slice(start, start + Math.min(2, limit - session.results.length));
      start += batch.length;
      const results = await Promise.all(batch.map(async candidate => {
        try {
          const albumId = String(candidate.album.album_id || candidate.album.gallery_id).trim();
          const page = await requestMusicSmugmugAlbumPhotosPage(albumId, 1, 1);
          if (!current()) return null;
          const image = await decode(getMusicAlbumPhotoImageSrc(page.photos[0]));
          return image ? { ...candidate, image, kind: "photo" } : null;
        } catch { return null; }
      }));
      results.forEach(retain);
    }
    // Only explicit poster fields from these real Shows records may fill vacancies.
    for (const candidate of candidates) {
      if (!current() || session.results.length >= limit) break;
      if (session.results.some(result => result.id === candidate.id)) continue;
      const image = await decode(candidate.show.capturedPoster);
      if (image) retain({ ...candidate, image, kind: "poster" });
    }
    render();
  })().catch(() => { render(); }).finally(() => {
    if (current()) stage.setAttribute("aria-busy", "false");
  });
}

function initSynchronicityMemories() {
  const viewport = document.querySelector("[data-synchronicity-viewport]");
  if (!viewport || synchronicityMemoriesWide) return;
  synchronicityMemoriesWide = window.matchMedia("(min-width: 1000px)");
  synchronicityMemoriesWide.addEventListener("change", prepareSynchronicityMemories);
  new MutationObserver(() => {
    if (viewport.hidden) clearSynchronicityMemories();
    else prepareSynchronicityMemories();
  }).observe(viewport, { attributes: true, attributeFilter: ["hidden"] });
  window.addEventListener("pagehide", clearSynchronicityMemories);
  window.addEventListener("pageshow", prepareSynchronicityMemories);
}

`;
edit('modules/music.js','function renderMusicShowsArchive(options = {}) {',code+'function renderMusicShowsArchive(options = {}) {');
edit('modules/music.js','  musicActivityPanel.append(createMusicShowsStateTemplates());','  musicActivityPanel.append(createMusicShowsStateTemplates());\n  prepareSynchronicityMemories();');
edit('modules/music.js','function initMusicModule() {','function initMusicModule() {\n  initSynchronicityMemories();');
fs.appendFileSync('css/modules.css',`\n/* S4: reserved, noninteractive memory scene; archive and scene share the S2 scroller. */
.synchronicity-memories {
  position: relative;
  width: min(100%, 1200px);
  height: clamp(190px, 36svh, 360px);
  margin: 0 auto 12px;
  pointer-events: none;
}
.synchronicity-memory {
  --memory-x: 50%;
  --memory-y: 48%;
  position: absolute;
  left: var(--memory-x);
  top: var(--memory-y);
  transform: translate(-50%, -50%);
  width: 42%;
  max-width: 220px;
  aspect-ratio: 3 / 2;
  box-sizing: border-box;
  margin: 0;
  padding: 2px;
  clip-path: polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px);
  background: linear-gradient(135deg, rgba(174,193,224,.74), rgba(87,104,164,.28) 38%, rgba(142,110,197,.64));
}
.synchronicity-memory img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: .96;
  clip-path: polygon(7px 0, calc(100% - 7px) 0, 100% 7px, 100% calc(100% - 7px), calc(100% - 7px) 100%, 7px 100%, 0 calc(100% - 7px), 0 7px);
  mask-image: linear-gradient(to right, rgba(0,0,0,.72), #000 5%, #000 95%, rgba(0,0,0,.72));
}
.synchronicity-memory[data-memory-kind="poster"] img { object-fit: contain; background: rgba(8,11,24,.5); }
.synchronicity-memory:nth-child(2) { --memory-x: 15%; --memory-y: 24%; width: 26%; }
.synchronicity-memory:nth-child(3) { --memory-x: 85%; --memory-y: 72%; width: 26%; }
.synchronicity-memories[data-memory-count="2"] .synchronicity-memory:first-child { --memory-x: 62%; }
@media (min-width: 1000px) {
  .synchronicity-memories { height: clamp(260px, 39svh, 420px); }
  .synchronicity-memory { width: 26%; max-width: 290px; }
  .synchronicity-memory:nth-child(2) { --memory-x: 15%; --memory-y: 27%; width: 17%; }
  .synchronicity-memory:nth-child(3) { --memory-x: 85%; --memory-y: 37%; width: 17%; }
  .synchronicity-memory:nth-child(4) { --memory-x: 28%; --memory-y: 79%; width: 17%; }
  .synchronicity-memory:nth-child(5) { --memory-x: 75%; --memory-y: 81%; width: 17%; }
}
`);
console.log('S4 additions written; original bytes outside edited regions preserved.');
