'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../modules/music.js'), 'utf8');
function load(ctx, name) {
  const start = source.search(new RegExp('^function ' + name + '\\(', 'm'));
  assert(start >= 0, name);
  const rest = source.slice(start), next = rest.slice(1).search(/\n(?:async )?function /);
  vm.runInContext(next < 0 ? rest : rest.slice(0, next + 1), ctx);
}
function identityFixture(rows = []) {
  const ctx = vm.createContext({
    Map, Set, Number, URL, musicPersonDetailArchiveRows: new Map(),
    normalizeMusicPersonId: value => String(value ?? '').trim().toLowerCase(),
    getMusicPeopleText: value => value == null ? '' : String(value),
    createMusicPeopleSlug: value => String(value || '').toLowerCase().replace(/\s+/g, '-'),
    getMusicPeopleIndexCollection: () => rows,
    getMusicPersonArchiveCacheKeys: row => [String(row.person_id || row.backend_record?.person_id), String(row.name || '').toLowerCase().replace(/\s+/g, '-')],
    getMusicPeoplePayloadRows: payload => Array.isArray(payload.data) ? payload.data : [],
  });
  ['isMusicPersonRouteAmbiguous', 'findMusicPersonById', 'getCachedMusicPersonDetailArchiveRow',
    'getMusicPersonDetailPayloadRows', 'isExactMusicPersonDetailPayloadRow', 'getMusicPersonDetailPayloadRow'].forEach(name => load(ctx, name));
  return ctx;
}
test('canonical homonyms resolve individually while ambiguous slugs never select a cached first person', () => {
  const rows = [{ person_id: 1, name: 'Alex Doe' }, { person_id: 2, name: 'Alex Doe' }], ctx = identityFixture(rows);
  ctx.musicPersonDetailArchiveRows.set('1', rows[0]);
  assert.equal(ctx.findMusicPersonById('alex-doe'), null);
  assert.equal(ctx.getCachedMusicPersonDetailArchiveRow('alex-doe'), null);
  assert.equal(ctx.getMusicPersonDetailPayloadRow({ data: [rows[0]] }, 'alex-doe', 'Alex Doe'), null);
  assert.equal(ctx.findMusicPersonById('2').person_id, 2);
  assert.equal(ctx.getMusicPersonDetailPayloadRow({ data: rows }, '2', 'Alex Doe').person_id, 2);
});
test('native Detail object extraction ignores nested bands/stats and explicit ID conflict defeats matching name', () => {
  const ctx = identityFixture([{ person_id: 1, name: 'Alex Doe' }]);
  const row = { person_id: 1, name: 'Alex Doe', bands: [{ name: 'Band' }], stats: { photo_count: 12 } };
  assert.equal(ctx.getMusicPersonDetailPayloadRow({ ok: true, data: row }, '1', 'Alex Doe'), row);
  assert.equal(ctx.getMusicPersonDetailPayloadRow({ data: [{ ...row, person_id: 2 }] }, '1', 'Alex Doe'), null);
  assert.throws(() => ctx.getMusicPersonDetailPayloadRow({ ok: false, data: row }, '1', 'Alex Doe'));
});
test('Detail cache never mutates the accepted atomic Index owner', () => {
  const ctx = identityFixture();
  Object.assign(ctx, { normalizeLiveMusicPeople: payload => payload.data,
    normalizeMusicPeopleIndexRow: row => row, isPublicMusicPeopleIndexRow: () => true,
    setMusicPeopleIndexCollection() { throw Error('Index mutation'); } });
  load(ctx, 'mergeMusicPersonDetailArchiveRow');
  const row = { person_id: 1, name: 'Person One' };
  assert.equal(ctx.mergeMusicPersonDetailArchiveRow(row), row);
  assert.equal(ctx.musicPersonDetailArchiveRows.get('1'), row);
  assert.equal(ctx.musicPersonDetailArchiveRows.size, 1);
});
test('known canonical ID uses existing native endpoint; unresolved legacy slug remains an ambiguity-safe search', () => {
  const ctx = identityFixture([{ person_id: 1, name: 'Person One' }]);
  Object.assign(ctx, { MUSIC_PEOPLE_INDEX_API_ROUTE: '/api/music/people/db', MUSIC_BANDS_INDEX_API_BASE_URL: 'https://fixture.invalid',
    MUSIC_PERSON_DETAIL_SEARCH_LIMIT: 100, getMusicPersonDetailSearchName: () => 'Person One' });
  load(ctx, 'getMusicPersonDetailApiUrl');
  assert.equal(ctx.getMusicPersonDetailApiUrl('1').pathname, '/api/music/people/db/1');
  assert.equal(ctx.getMusicPersonDetailApiUrl('person-one').pathname, '/api/music/people/db/1');
  assert.equal(ctx.getMusicPersonDetailApiUrl('missing').searchParams.get('archive'), 'cache');
  assert.equal(ctx.getMusicPersonDetailApiUrl('missing').searchParams.get('search'), 'person one');
});
test('error wins over uninitialized loading; legitimate shared preparation remains pending', () => {
  const ctx = vm.createContext({ normalizeMusicPersonId: String, findMusicPersonById: () => null,
    getCachedMusicPersonDetailArchiveRow: () => null, musicPersonDetailArchiveStates: new Map([['1', 'error']]),
    musicPeopleIndexRequest: null, musicPeopleIndexDataState: 'error', musicPeopleIndexLoaded: false,
    createMusicPersonDetailStateData: state => ({ state }) });
  load(ctx, 'getMusicPersonDetailData');
  assert.equal(ctx.getMusicPersonDetailData('1').state, 'error');
  ctx.musicPersonDetailArchiveStates.set('1', 'preparing'); ctx.musicPeopleIndexDataState = 'loading'; ctx.musicPeopleIndexRequest = {};
  assert.equal(ctx.getMusicPersonDetailData('1').state, 'loading');
});
test('verified-zero is authoritative; Shows never inherit Set count or bounded sample length', () => {
  const ctx = vm.createContext({ Map, Set, Number, normalizeMusicPeopleIndexRow: source => ({ ...source, instrumentNames: [], name: source.name }),
    getMusicPersonAssociatedBandItems: () => [], getMusicPersonTaggedShowRows: source => source.tagged_shows || [],
    getMusicPersonTaggedShowsFromMatchedPhotos: () => [], getMusicPersonTaggedShowPhotos: show => show.matched_photos || [],
    getMusicPersonTaggedShowAlbumId: photo => photo.album_id || '',
    getMusicPeopleText: value => value || '', getMusicPersonDisplayName: value => value,
    formatMusicPeopleNumber: String, getMusicPersonSeenValue: () => 'Pending',
    normalizeMusicPersonId: String, getMusicPersonInstrumentPills: () => [],
    collectMusicPeopleTextValues: value => value || [], uniqueMusicPeopleValues: value => [...new Set(value)] });
  load(ctx, 'getMusicPersonDetailViewData');
  const data = ctx.getMusicPersonDetailViewData({ name: 'Person', person_id: 1,
    photo_count_status: 'verified', verified_photo_count: 0, photo_count: 999, set_count: 7,
    matched_photos: [{ image_key: 'sample' }] }, '1');
  assert.equal(data.archiveRows.find(row => row.label === 'Verified photographs').value, '0');
  assert.equal(data.archiveRows.find(row => row.label === 'Archived sets').value, '7');
  assert(!data.archiveRows.some(row => row.label === 'Documented shows'));
  const unavailable = ctx.getMusicPersonDetailViewData({ name: 'Person', photo_count_status: 'unavailable',
    verified_photo_count: null, photo_count: 999 }, '1');
  assert.equal(unavailable.archiveRows.length, 0);
});
test('explicit mismatched album cannot borrow an associated band Set; Show linking remains separate', () => {
  const ctx = vm.createContext({ getMusicPersonTaggedShowMatchedShow: () => ({ id: 4 }),
    getMusicPersonTaggedShowAlbumId: show => show.album_id,
    getMusicShowSmugAlbums: () => [{ album_id: 'real' }],
    getMusicPersonTaggedShowAlbumKey: album => album.album_id,
    getMusicShowAlbumSetRoute: () => '/music/bands/verified/sets/010126' });
  load(ctx, 'getMusicPersonTaggedShowRoute');
  assert.equal(ctx.getMusicPersonTaggedShowRoute({ album_id: 'other' }, [{ name: 'Wrong band' }]), '');
  assert.equal(ctx.getMusicPersonTaggedShowRoute({ album_id: 'real' }), '/music/bands/verified/sets/010126');
});

function galleryFixture({ result = { isComplete: true, matchedPhotos: [] }, cached = null } = {}) {
  const opened = [], requests = [], cache = new Map(), ctx = vm.createContext({
    Map, Set, Number, v3RouteContext: {}, musicPersonTaggedShowHydrationToken: 7,
    musicPersonTaggedShowHydrationCache: cache,
    getMusicPersonTaggedShowHydrationContext: value => value,
    getMusicPersonTaggedLightboxPhotos: photos => photos,
    getMusicPersonTaggedShowHydrationCacheEntry: () => cached,
    getMusicPersonTaggedShowHydrationKey: () => 'person|show|album',
    getMusicPersonTaggedLightboxIndexForPhoto: (photos, item) => photos.findIndex(photo => photo.key === item.key),
    isMusicPersonTaggedShowHydrationCurrent: () => true,
    requestMusicPersonTaggedShowMatchedPhotos: async (...args) => { requests.push(args); return typeof result === 'function' ? result() : result; },
    openMusicPersonTaggedPhotoLightbox: (...args) => opened.push(args),
  });
  // This function is async, so use its explicit next declaration boundary.
  const a = source.indexOf('async function openMusicPersonTaggedPhotoLightboxFromThumb(');
  const b = source.indexOf('\nfunction openMusicPersonTaggedPhotoLightbox(', a);
  vm.runInContext(source.slice(a, b), ctx);
  const attrs = new Map();
  const trigger = { isConnected: true, closest: () => null, getAttribute: key => attrs.get(key),
    setAttribute: (key, value) => attrs.set(key, value), removeAttribute: key => attrs.delete(key) };
  const show = { personId: '1', personName: 'Person One', showId: 'show1', albumId: 'album1', expectedPhotoCount: 3 };
  return { ctx, opened, requests, trigger, show, cache };
}
test('first open uses a verified complete payload without provider calls or the top24 preview cache', async () => {
  const f = galleryFixture({ cached: { isComplete: true, allPhotos: [{ key: 'old' }] } });
  const photos = [{ key: 'a' }, { key: 'b' }, { key: 'c' }];
  await f.ctx.openMusicPersonTaggedPhotoLightboxFromThumb(photos[1], photos, 1, f.trigger, { show: { ...f.show, photosComplete: true } });
  assert.equal(f.requests.length, 0); assert.equal(f.opened[0][0].length, 3); assert.equal(f.opened[0][1], 1);
});
test('incomplete first open awaits every page and preserves clicked identity after full-order change', async () => {
  const complete = [{ key: 'newest' }, { key: 'other' }, { key: 'clicked' }];
  const f = galleryFixture({ result: { isComplete: true, matchedPhotos: complete } });
  await f.ctx.openMusicPersonTaggedPhotoLightboxFromThumb({ key: 'clicked' }, [{ key: 'clicked' }], 0, f.trigger, { show: f.show, personName: "Person One" });
  assert.equal(f.requests.length, 1); assert.equal(f.requests[0][1].mode, 'all');
  assert.equal(f.opened[0][0], complete); assert.equal(f.opened[0][1], 2);
});
test('fewer matches than verified count and stale completion never open a falsely complete gallery', async () => {
  const short = galleryFixture({ result: { isComplete: true, matchedPhotos: [{ key: 'one' }] } });
  await short.ctx.openMusicPersonTaggedPhotoLightboxFromThumb({ key: 'one' }, [{ key: 'one' }], 0, short.trigger, { show: short.show, personName: "Person One" });
  assert.equal(short.opened.length, 0);
  let resolve; const stale = galleryFixture({ result: () => new Promise(done => { resolve = done; }) });
  const promise = stale.ctx.openMusicPersonTaggedPhotoLightboxFromThumb({ key: 'one' }, [{ key: 'one' }], 0, stale.trigger, { show: stale.show, personName: "Person One" });
  stale.ctx.v3RouteContext = {}; resolve({ isComplete: true, matchedPhotos: [{ key: 'one' }, { key: 'two' }, { key: 'three' }] });
  await promise; assert.equal(stale.opened.length, 0);
});

test('canonical ID outranks an alias collision, and excluded Index categories cannot render publicly', () => {
  const ctx = identityFixture([{ person_id: 1, name: 'Person One' }, { person_id: 2, name: '1' }]);
  ctx.musicPersonDetailArchiveRows.set('1', { person_id: 1, name: 'Person One' });
  assert.equal(ctx.isMusicPersonRouteAmbiguous('1'), false);
  assert.equal(ctx.getCachedMusicPersonDetailArchiveRow('1').person_id, 1);
  Object.assign(ctx, { findMusicPersonById: () => ({ person_id: 9, category: 'Friend' }),
    getCachedMusicPersonDetailArchiveRow: () => null, normalizeMusicPeopleIndexRow: row => row,
    isPublicMusicPeopleIndexRow: row => row.category !== 'Friend',
    createMusicPersonDetailStateData: state => ({ state }),
    getMusicPersonDetailViewData() { throw Error('Excluded presentation'); } });
  load(ctx, 'getMusicPersonDetailData');
  assert.equal(ctx.getMusicPersonDetailData('9').state, 'empty');
});

test('Person-only Band ambiguity is unlinked while the shared default retains its baseline fallback', () => {
  const rows = [{ band_id: 'one', name: 'Echo' }, { band_id: 'two', name: 'Echo' }];
  const ctx = vm.createContext({
    getMusicBandsIndexCollection: () => rows, musicBandIndexRows: [{ band_id: 'sample', name: 'Fallback' }],
    createBandSlug: value => String(value || '').toLowerCase(),
    getBandId: band => band.band_id, getBandDetailGeneral: band => band, getBandDetailName: band => band.name
  });
  load(ctx, 'findMusicBandByName');
  assert.equal(ctx.findMusicBandByName('Echo', true), null);
  assert.equal(ctx.findMusicBandByName('Echo').band_id, 'one');
  assert.equal(ctx.findMusicBandByName('Fallback').band_id, 'sample');
  assert.equal(ctx.findMusicBandByName('Fallback', true), null);
});
test('stable Show ID wins; a shared legacy date/key never selects the first Show', () => {
  const rows = [{ show_id: 17, show_key: 'same-day' }, { show_id: 18, show_key: 'same-day' }];
  const ctx = vm.createContext({ musicShowsSetsDataState: 'live',
    getMusicShowsIndexRows: () => rows, getMusicPeopleText: value => String(value ?? ''),
    getMusicShowRouteCode: row => row.show_key });
  load(ctx, 'getMusicPersonTaggedShowMatchedShow');
  assert.equal(ctx.getMusicPersonTaggedShowMatchedShow({ show_id: 18, show_key: 'same-day' }).show_id, 18);
  assert.equal(ctx.getMusicPersonTaggedShowMatchedShow({ show_key: 'same-day' }), null);
  assert.equal(ctx.getMusicPersonTaggedShowMatchedShow({ show_id: 'unknown' }), null);
  assert.equal(ctx.getMusicPersonTaggedShowMatchedShow({ show_id: 999, show_key: "same-day" }), null);
});
test('Detail request dedupes and its existing timeout owns body decoding as well as fetch', async () => {
  let resolveBody, wrappedDone = false, count = 0;
  const row = { person_id: 1, name: 'Person One' };
  const body = new Promise(resolve => { resolveBody = resolve; });
  const ctx = vm.createContext({ Promise, Map, AbortController,
    normalizeMusicPersonId: String, getCachedMusicPersonDetailArchiveRow: () => null,
    musicPersonDetailArchiveRequests: new Map(), musicPersonDetailArchiveStates: new Map(),
    MUSIC_PERSON_DETAIL_TIMEOUT_MS: 20000, getMusicPersonDetailApiUrl: () => 'https://fixture.invalid/person/1',
    fetch: async () => { count++; return { ok: true, json: () => body }; },
    withMusicRequestTimeout: (promise, controller, timeout) => {
      assert.equal(timeout, 20000);
      promise.then(() => { wrappedDone = true; }, () => {});
      return promise;
    },
    getMusicPersonDetailPayloadRows: payload => [payload.data],
    getMusicPeopleRelationshipReadiness: payload => {
      assert.equal(payload.data.length, 1); assert.equal(payload.data[0], row);
      return { status: 'ready', authoritative: true };
    },
    getMusicPersonDetailPayloadRow: payload => payload.data,
    getMusicPersonDetailSearchName: () => 'Person One',
    mergeMusicPersonDetailArchiveRow: value => value
  });
  load(ctx, 'requestMusicPersonDetailArchive');
  const request = ctx.requestMusicPersonDetailArchive('1');
  assert.equal(ctx.requestMusicPersonDetailArchive('1'), request);
  await Promise.resolve(); await Promise.resolve();
  assert.equal(wrappedDone, false);
  assert.equal(ctx.musicPersonDetailArchiveStates.get('1'), 'loading');
  resolveBody({ ok: true, data: row });
  assert.equal(await request, row); assert.equal(count, 1);
  assert.equal(ctx.musicPersonDetailArchiveStates.get('1'), 'ready');
});

function motionFixture() {
  let hidden = false, booting = false, failFocus = false, sequence = 0;
  const frames = new Map(), attributes = new Map([['aria-hidden', 'true']]);
  const root = { parentElement: null, hasAttribute: key => key === 'data-v3-booting' && booting };
  const body = { closest: () => null };
  const document = { body, activeElement: body, documentElement: root, hidden: false, addEventListener() {}, removeEventListener() {} };
  const heading = { focus() { if (!failFocus) document.activeElement = heading; }, closest: () => null };
  const parent = { parentElement: root, closest: () => hidden ? parent : null };
  const effect = { shimmer: { setAttribute() {} } };
  const note = { isConnected: true, parentElement: parent, dataset: { signatureId: '1' },
    _echoNoteEffect: effect, style: {},
    // The glyph is intentionally decorative; treating this as ownership must fail.
    closest: () => note, setAttribute: key => attributes.set(key, ''),
    removeAttribute: key => attributes.delete(key) };
  let intersection, mutation;
  const ctx = vm.createContext({
    musicPersonIdentityMotion: null, musicPersonSelection: null, musicPersonFocusOwners: new WeakSet(),
    v3RouteContext: {}, document, performance: { now: () => 100 },
    getRouteFromUrl: () => ({ name: 'person-detail' }), getComputedStyle: () => ({ visibility: 'visible' }),
    personDetail: { querySelector: selector => selector === '[data-person-signature]' ? note : heading, querySelectorAll: () => [] },
    reducedMotion: { matches: false, addEventListener() {}, removeEventListener() {} },
    IntersectionObserver: class { constructor(callback) { intersection = callback; } observe() {} disconnect() {} },
    MutationObserver: class { constructor(callback) { mutation = callback; } observe() {} disconnect() {} },
    requestAnimationFrame: callback => { const id = ++sequence; frames.set(id, callback); return id; },
    cancelAnimationFrame: id => frames.delete(id),
    advanceMusicPeopleSignatureShimmer() {},
  });
  load(ctx, 'startMusicPersonIdentityMotion');
  return { ctx, document, heading, frames, attributes,
    hide(value) { hidden = value; mutation(); }, boot(value) { booting = value; mutation?.(); },
    fail(value) { failFocus = value; },
    start() { ctx.startMusicPersonIdentityMotion(); intersection([{ isIntersecting: true }]); },
    frame() { const item = frames.entries().next().value; assert(item); frames.delete(item[0]); item[1](100); } };
}
test('decorative glyph ARIA does not block owned motion/focus; a hidden ancestor pauses it', () => {
  const f = motionFixture(); f.start();
  assert.equal(f.document.activeElement, f.heading);
  f.frame(); assert(f.attributes.has('data-signature-visible'));
  assert.equal(f.frames.size, 1);
  f.hide(true); assert.equal(f.frames.size, 0); assert(!f.attributes.has('data-signature-visible'));
  f.hide(false); assert.equal(f.frames.size, 1);
  f.ctx.musicPersonIdentityMotion.dispose(); assert.equal(f.frames.size, 0);
});
test('boot wake and successful focus, rather than an attempted focus, certify the owner', () => {
  const f = motionFixture(); f.boot(true); f.start();
  assert.equal(f.document.activeElement, f.document.body);
  assert.equal(f.frames.size, 0); assert(!f.ctx.musicPersonFocusOwners.has(f.ctx.v3RouteContext));
  f.fail(true); f.boot(false);
  assert(!f.ctx.musicPersonFocusOwners.has(f.ctx.v3RouteContext));
  f.fail(false); f.hide(false);
  assert.equal(f.document.activeElement, f.heading);
  assert(f.ctx.musicPersonFocusOwners.has(f.ctx.v3RouteContext));
  f.ctx.musicPersonIdentityMotion.dispose();
});

test('photo-only Legacy evidence splits one Show across explicit albums without invented contributor/location copy', () => {
  const photos = [{ image_key: 'a1', show_id: '17', album_id: 'A' }, { image_key: 'b1', show_id: '17', album_id: 'B' }];
  const ctx = vm.createContext({ Map, JSON, getMusicPersonMatchedPhotos: () => photos,
    getMusicPersonMatchedPhotoUrl: () => 'https://fixture.invalid/photo.jpg',
    compareMusicPersonMatchedPhotosByOriginalDate: () => 0, getMusicPeopleText: value => String(value ?? ''),
    getMusicPersonTaggedShowAlbumId: photo => photo.album_id,
    getMusicPersonShowDateParts: () => ({ month: 'Jan', day: '01', year: '2026' }),
    getMusicPersonTaggedShowVenue: () => '', getMusicPersonTaggedShowRoute: show => show.albumId,
    getMusicPersonTaggedShowSetCode: () => '', getMusicPersonTaggedShowMatchedShow: () => null,
    formatMusicPeopleCount: (count, label) => count + ' ' + label });
  load(ctx, 'getMusicPersonTaggedShowsFromMatchedPhotos');
  const groups = ctx.getMusicPersonTaggedShowsFromMatchedPhotos({});
  assert.equal(groups.length, 2);
  assert(groups.every(group => group.expanded === false));
  assert.equal(groups[0].showId, '17'); assert.equal(groups[1].showId, '17');
  assert.equal(groups[0].albumId, 'A'); assert.equal(groups[1].albumId, 'B');
  assert.equal(groups[0].thumbnails[0].image_key, 'a1'); assert.equal(groups[1].thumbnails[0].image_key, 'b1');
  assert.equal(groups[0].contributors, ''); assert.equal(groups[0].location, '');
});
test('reduced and no-WAAPI selections do not retain a future handoff that can replay', () => {
  for (const reduced of [true, false]) {
    let navigated = 0;
    const person = { personId: 'one' };
    const ctx = vm.createContext({ musicPersonSelection: null, v3RouteContext: {}, reducedMotion: { matches: reduced },
      getRouteFromUrl: () => ({ name: 'music-people' }), getMusicPeopleSignatureDescriptor: () => ({ id: '1' }),
      performance: { now: () => 100 }, getMusicPeopleIndexCollection: () => [person],
      getMusicPeopleRouteId: row => row.personId, getMusicPersonRouteUrl: id => '/music/people/' + id,
      setActiveMusicPeopleRow() {}, navigateToRoute() { navigated++; } });
    load(ctx, 'enterMusicPersonNote');
    ctx.enterMusicPersonNote(person, { focus() {}, querySelector: () => ({ getBoundingClientRect: () => ({ width: 64 }) }) });
    assert.equal(navigated, 1); assert.equal(ctx.musicPersonSelection, null);
  }
});

test('People resume waits for an interactive owner and confirms source focus before settling', () => {
  let blocked = true, focusAllowed = false;
  const doc = { activeElement: { id: 'engine-back' }, documentElement: { hasAttribute: () => false },
    getElementById: () => focus };
  const focus = { disabled: false, closest: () => null, focus() { if (focusAllowed) doc.activeElement = focus; } };
  const ctx = vm.createContext({ document: doc, musicPeopleIndexRequest: null, musicPeopleIndexDataState: 'live',
    musicPeopleList: { clientHeight: 700, closest: () => blocked ? {} : null, contains: node => node === focus },
    musicPeopleIndex: { classList: { contains: () => true } }, getComputedStyle: () => ({ visibility: 'visible' }),
    v3Text: value => value });
  load(ctx, 'restoreMusicResumeState');
  assert.equal(ctx.restoreMusicResumeState({ name: 'music-people' }, { focus: 'person-echo-1' }), false);
  blocked = false;
  assert.equal(ctx.restoreMusicResumeState({ name: 'music-people' }, { focus: 'person-echo-1' }), false);
  focusAllowed = true;
  assert.equal(ctx.restoreMusicResumeState({ name: 'music-people' }, { focus: 'person-echo-1' }), true);
  assert.equal(doc.activeElement, focus);
});

test('authoritative zero suppresses real stale photo fallbacks while retaining authored Bands', () => {
  const photo = { image_key: 'stale', show_id: '17', album_id: 'A', thumbnail_url: 'https://fixture.invalid/stale.jpg' };
  const band = { name: 'Documented Band' };
  const ctx = vm.createContext({ Map, Set, Number, JSON,
    normalizeMusicPeopleIndexRow: source => ({ ...source, instrumentNames: [] }),
    getMusicPeopleText: value => value == null ? '' : String(value),
    getMusicPersonAssociatedBandItems: () => [band], getMusicPersonMatchedPhotoUrl: row => row.thumbnail_url,
    compareMusicPersonMatchedPhotosByOriginalDate: () => 0, getMusicPersonTaggedShowAlbumId: row => row.album_id,
    getMusicPersonShowDateParts: () => ({}), getMusicPersonTaggedShowVenue: () => '',
    getMusicPersonTaggedShowRoute: () => '', getMusicPersonTaggedShowSetCode: () => '',
    getMusicPersonTaggedShowMatchedShow: () => null, formatMusicPeopleCount: (count, label) => count + ' ' + label,
    formatMusicPeopleNumber: String, getMusicPersonSeenValue: () => 'Pending', normalizeMusicPersonId: String,
    getMusicPersonDisplayName: String, getMusicPersonInstrumentPills: () => [],
    collectMusicPeopleTextValues: value => value || [], uniqueMusicPeopleValues: value => [...new Set(value)] });
  ['getMusicPersonMatchedPhotos', 'getMusicPersonTaggedShowRows', 'getMusicPersonTaggedShowPhotos',
    'getMusicPersonTaggedShowsFromMatchedPhotos', 'getMusicPersonDetailViewData'].forEach(name => load(ctx, name));
  const poisoned = { person_id: 1, name: 'Person One', photo_count_status: 'verified',
    verified_photo_count: 0, photo_count: 999, matched_photos: [photo] };
  assert.equal(ctx.getMusicPersonTaggedShowsFromMatchedPhotos(poisoned).length, 1, 'fixture exercises the actual stale fallback');
  const result = ctx.getMusicPersonDetailViewData(poisoned, '1');
  assert.equal(result.taggedShows.length, 0); assert.equal(result.associatedBands[0], band);
  assert.equal(result.archiveRows.find(row => row.label === 'Verified photographs').value, '0');
});

function resonanceFixture(state = 'live') {
  const created = [], navigation = [];
  function node(tag) {
    const value = { tag, dataset: {}, children: [], hidden: false, listeners: {}, textContent: '',
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children = children; },
      addEventListener(name, handler) { this.listeners[name] = handler; },
      getAttribute(name) { return this[name] ?? null; },
      querySelectorAll() { return []; }, contains() { return false; } };
    Object.defineProperty(value, 'childNodes', { get() { return this.children; } });
    created.push(value); return value;
  }
  const ctx = vm.createContext({ document: { createElement: node }, musicBandsIndex: { dataset: { bandsDataState: state } },
    createMusicPersonAssociatedBand: band => Object.assign(node('article'), { band }),
    getMusicPersonControlId: (kind, key) => 'person-' + kind + '-1|' + key,
    getBandRouteUrl: id => '/music/bands/' + id,
    navigateToRoute: url => navigation.push(url) });
  load(ctx, 'createMusicPersonConnectionLink'); load(ctx, 'renderMusicPersonConnections');
  return { ctx, created, navigation, node };
}
test('Resonance directly renders every documented Band and preserves native stable-ID links without disclosures', () => {
  const f = resonanceFixture();
  const section = f.ctx.renderMusicPersonConnections({
    associatedBands: [{ name: 'First Band', bandId: 'first' }, { name: 'Second Band', bandId: 'second' }],
    get taggedShows() { throw Error('Resonance must not create Show or Venue sections'); }
  });
  assert.equal(section.hidden, false); assert.equal(section.children[0].textContent, 'Resonance');
  assert.equal(section.children[1].children.length, 2);
  assert(!f.created.some(node => ['details', 'summary'].includes(node.tag)));
  const links = f.created.filter(node => node.tag === 'a');
  assert.equal(links.length, 2); assert.equal(links[0].href, '/music/bands/first');
  assert(links.every(node => node.id.startsWith('person-connection-1|')));
});
test('Resonance hides without documented Bands and keeps optional Band recovery beside populated cards', () => {
  const f = resonanceFixture('error');
  const empty = f.ctx.renderMusicPersonConnections({ associatedBands: [] });
  assert.equal(empty.hidden, true);
  assert(!empty.children.some(node => node.className === 'person-band-status'));
  const populated = f.ctx.renderMusicPersonConnections({ associatedBands: [{ name: 'Authored Band' }] });
  assert.equal(populated.hidden, false);
  const status = populated.children.find(node => node.className === 'person-band-status');
  assert.equal(status.textContent, 'Band details are unavailable.');
  assert(status.children.some(node => node.tag === 'button' && node.textContent === 'Retry connections'));
});
test('retained Resonance wrapper follows late no-band/populated/no-band data without replacing identity or Legacy', () => {
  const f = resonanceFixture(), resonance = f.node('section'), legacy = f.node('section'), hero = {}, title = {};
  resonance.hidden = true;
  const copy = { querySelector(selector) { return selector === 'h3' ? title : selector === '.person-detail-pill-list' ? { replaceWith() {} } : null; } };
  const body = {};
  const root = { dataset: { personIdentity: '1' }, scrollTop: 145,
    querySelector(selector) { return ({ '[data-person-note]': hero, '.person-detail-copy': copy,
      '.person-detail-archive-data': { replaceChildren() {} }, '[data-person-resonance]': resonance,
      '[data-person-legacy]': legacy })[selector] || null; },
    querySelectorAll() { return []; }, replaceChildren() { throw Error('Identity replaced'); },
    append() { throw Error('Retained wrappers replaced'); } };
  Object.assign(f.ctx, { document: { ...f.ctx.document, activeElement: body, body }, personDetail: root, v3RouteContext: { entry: 'visit' },
    disconnectMusicPersonTaggedShowHydrationObserver() {}, musicPersonTaggedShowHydrationToken: 1,
    createMusicPersonPillList: () => f.node('div'), createMusicPersonArchiveBlock: () => f.node('dl'),
    createMusicPersonEmptyState: () => f.node('p'), hydrateMusicPersonTaggedShowPhotos() {},
    startMusicPersonIdentityMotion() {}, toggleMusicPersonShowCard() {} });
  load(f.ctx, 'renderMusicPersonDetail');
  const data = { state: 'ready', personId: '1', name: 'Person', aliases: [], taggedShows: [], associatedBands: [], archiveRows: [] };
  f.ctx.renderMusicPersonDetail(data); assert.equal(resonance.hidden, true);
  f.ctx.renderMusicPersonDetail({ ...data, associatedBands: [{ name: 'Late Band', bandId: 'late' }] });
  assert.equal(resonance.hidden, false); assert.equal(resonance.children[1].children.length, 1);
  f.ctx.renderMusicPersonDetail(data); assert.equal(resonance.hidden, true);
  assert.equal(root.scrollTop, 145);
});
test('direct Band links preserve modified clicks while ordinary activation uses the existing router', () => {
  const f = resonanceFixture();
  const link = f.ctx.createMusicPersonConnectionLink('Band Detail', '/music/bands/first', 'first');
  let prevented = 0;
  link.listeners.click({ button: 0, ctrlKey: true, preventDefault() { prevented++; } });
  assert.equal(prevented, 0); assert.equal(f.navigation.length, 0);
  link.listeners.click({ button: 0, preventDefault() { prevented++; } });
  assert.equal(prevented, 1); assert.equal(f.navigation[0], '/music/bands/first');
});

test('Person resume waits through covered-sweep and failed focus, restoring expansion before source focus', () => {
  let blocked = true, focusAllowed = false, expanded = false;
  const doc = { activeElement: { id: 'engine-back' }, documentElement: { hasAttribute: () => false },
    getElementById: () => focus };
  const focus = { disabled: false, closest: () => expanded ? null : {},
    focus() { if (focusAllowed) doc.activeElement = focus; } };
  const card = { dataset: { personShowId: 'S1', personShowAlbumId: 'A1' }, classList: { contains: () => expanded } };
  const ctx = vm.createContext({ document: doc, musicShowsSetsRequest: null,
    musicPeopleIndexDataState: 'live', musicShowsSetsDataState: 'live',
    musicBandsIndex: { dataset: { bandsDataState: 'live' } },
    musicPersonDetailArchiveRequests: new Map(), normalizeMusicPersonId: String,
    personDetail: { isConnected: true, clientHeight: 700, closest: () => blocked ? {} : null,
      contains: node => node === focus, querySelectorAll: selector => selector === '.person-legacy-show' ? [{ querySelectorAll: () => [card] }] : [] },
    getComputedStyle: () => ({ visibility: 'visible' }), v3Text: value => value || '',
    setMusicPersonLegacyShowExpanded(group, value) { expanded = value; } });
  load(ctx, 'restoreMusicResumeState');
  const route = { name: 'person-detail', personId: '1' }, ui = { focus: 'person-connection-1', expanded: ['S1|A1'] };
  assert.equal(ctx.restoreMusicResumeState(route, ui), false);
  blocked = false;
  assert.equal(ctx.restoreMusicResumeState(route, ui), false);
  assert.equal(expanded, true);
  focusAllowed = true;
  assert.equal(ctx.restoreMusicResumeState(route, ui), true);
  assert.equal(doc.activeElement, focus);
});

function legacyFixture() {
  const document = { activeElement: {}, body: {}, documentElement: { hasAttribute: () => false } };
  function matches(node, selector) {
    if (selector.includes(',')) return selector.split(',').some(part => matches(node, part.trim()));
    const parts = selector.split(/\s+/);
    if (parts.length > 1) {
      if (!matches(node, parts.pop())) return false;
      let ancestor = node.parentElement;
      while (parts.length) { const part = parts.pop(); while (ancestor && !matches(ancestor, part)) ancestor = ancestor.parentElement; if (!ancestor) return false; ancestor = ancestor.parentElement; }
      return true;
    }
    if (selector === '[hidden]') return node.hidden;
    if (selector.startsWith('.')) return selector.slice(1).split('.').every(name => node.className.split(/\s+/).includes(name));
    if (selector.startsWith('#')) return node.id === selector.slice(1);
    const attr = selector.match(/^\[data-([a-z-]+)\]$/);
    return attr ? Object.prototype.hasOwnProperty.call(node.dataset, attr[1].replace(/-([a-z])/g, (_, char) => char.toUpperCase())) : node.tag === selector;
  }
  function node(tag) {
    const value = { tag, className: '', id: '', dataset: {}, children: [], parentElement: null,
      hidden: false, textContent: '', attributes: {}, events: {}, isConnected: true, clientHeight: 700,
      append(...items) { items.forEach(item => { if (item && typeof item === 'object') { item.remove(); item.parentElement = this; } this.children.push(item); }); },
      replaceChildren(...items) { this.children.forEach(item => { if (item && typeof item === 'object') item.parentElement = null; }); this.children = []; this.append(...items); },
      remove() { if (this.parentElement) { this.parentElement.children = this.parentElement.children.filter(item => item !== this); this.parentElement = null; } },
      insertBefore(next, reference) { if (next === reference) return; next.remove(); next.parentElement = this; const index = reference ? this.children.indexOf(reference) : -1; if (index < 0) this.children.push(next); else this.children.splice(index, 0, next); },
      replaceWith(next) { if (!this.parentElement) return; const parent = this.parentElement, index = parent.children.indexOf(this); this.parentElement = null; next.parentElement = parent; parent.children.splice(index, 1, next); },
      querySelectorAll(selector) { const found = []; const visit = item => { if (!item || typeof item !== 'object') return; if (matches(item, selector)) found.push(item); item.children.forEach(visit); }; this.children.forEach(visit); return found; },
      querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
      closest(selector) { for (let item = this; item; item = item.parentElement) if (matches(item, selector)) return item; return null; },
      contains(target) { return target === this || this.children.some(item => item && typeof item === 'object' && item.contains(target)); },
      setAttribute(name, value) { this.attributes[name] = value; },
      getAttribute(name) { return name === 'href' ? this.href : this.attributes[name] ?? null; },
      hasAttribute(name) { return name === 'href' ? !!this.href : name in this.attributes; },
      addEventListener(name, handler) { this.events[name] = handler; },
      focus() { document.activeElement = this; }
    };
    value.classList = { contains: name => value.className.split(/\s+/).includes(name), toggle(name, enabled) {
      const names = new Set(value.className.split(/\s+/).filter(Boolean));
      if (enabled) names.add(name); else names.delete(name); value.className = [...names].join(' ');
    } };
    Object.defineProperty(value, 'childNodes', { get() { return this.children; } });
    return value;
  }
  const root = node('article'); root.scrollTop = 125;
  document.createElement = node; document.getElementById = id => id ? root.querySelector('#' + id) : null;
  document.activeElement = document.body;
  const ctx = vm.createContext({ document, Map, Set, Number, Array, Promise, v3RouteContext: { entry: 'fixture' },
    fetch() { throw Error("Unexpected direct network request"); },
    musicPersonTaggedShowHydrationToken: 7, musicPersonTaggedShowHydrationCache: new Map(),
    getRouteFromUrl: () => ({ name: 'person-detail', personId: '1' }),
    isMusicPersonTaggedShowHydrationCurrent: () => true, isLightboxVisible: () => false,
    getMusicPersonTaggedShowHydrationContext: card => ({ personId: card.dataset.personId, personName: card.dataset.personName, showId: card.dataset.personShowId, albumId: card.dataset.personShowAlbumId }),
    getMusicPersonTaggedShowHydrationKey: context => context.albumId,
    getMusicPersonMatchedPhotoUrl: photo => photo.thumbnail_url || 'https://fixture.invalid/photo.jpg',
    getMusicPersonMatchedPhotoLightboxUrl: photo => photo.large_url || 'https://fixture.invalid/large.jpg',
    getMusicPeopleText: value => String(value ?? ''),
    formatMusicPeopleCount: (count, label) => count + ' ' + label,
    getMusicPersonTaggedShowAlbumId: row => row.albumId || row.album_id,
    getMusicPersonTaggedLightboxPhotos: photos => photos,
    MUSIC_PERSON_TAGGED_SHOW_PREVIEW_LIMIT: 24,
    activeMusicPersonDetailId: '1', activeMusicPeopleId: '1',
    getMusicPersonControlId: (kind, key) => 'person-' + kind + '-1|' + key,
    getMusicVenueRouteUrl: venue => '/music/venues/' + venue.venue_id,
    getMusicPersonTaggedShowDateLabel: () => 'Sep 26, 2025',
    createMusicPersonTaggedThumb: (photo, options) => Object.assign(node('button'), { className: 'person-show-tagged-thumb', photo, options }),
    createMusicPersonTaggedPhotoState: () => node('p'), createMusicPersonEmptyState: () => node('p'),
    triggerMusicPersonShowCardHydration() {}, reportArchiveContentExpansion() {},
    navigateToRoute() {}
  });
  ['createMusicPersonConnectionLink', 'getMusicPersonStablePhotoKey', 'isMusicPersonCompletePhotoCollection',
    'getMusicPersonLegacyGalleryState', 'getMusicPersonLegacyInventory', 'renderMusicPersonLegacyPreview',
    'showMoreMusicPersonLegacyPhotos', 'getMusicPersonLegacyPhotoSummary', 'syncMusicPersonLegacyShowGroup',
    'setMusicPersonLegacyShowExpanded', 'toggleMusicPersonShowCard', 'createMusicPersonShowCard',
    'createMusicPersonLegacyShowGroup', 'updateMusicPersonLegacyShowMetadata'].forEach(name => load(ctx, name));
  const show = (album, keys) => ({ showId: 'S1', albumId: album, title: 'One Show', venue: 'Venue',
    venueId: 'mv_venue', location: 'City', detailRoute: '/music/shows/S1',
    expectedPhotoCount: keys.length, photosComplete: true, expanded: true,
    taggedPhotosLabel: keys.length + ' Tagged Photos', thumbnails: keys.map(key => ({ image_key: key })) });
  return { ctx, root, node, show };
}
test('Legacy shows start collapsed with one title trigger/action row while album galleries keep separate identities', () => {
  const f = legacyFixture(), rows = [f.show('A', ['a', 'shared']), f.show('B', ['b', 'shared'])];
  const group = f.ctx.createMusicPersonLegacyShowGroup(rows, 'Person'); f.root.append(group);
  const button = group.querySelector('[data-person-show-gallery-toggle]'), panel = group.querySelector('[data-person-show-gallery-panel]');
  assert.equal(button.querySelector('.person-legacy-show-name').textContent, 'One Show'); assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(panel.hidden, true); assert.equal(group.querySelectorAll('.person-show-summary').length, 0);
  assert.equal(group.querySelectorAll('.person-show-view').length, 0);
  assert.equal(group.querySelectorAll('.person-show-detail-link').length, 1);
  assert.equal(group.querySelectorAll('.person-show-venue-link').length, 1);
  assert.equal(group.querySelector('.person-legacy-show-count').textContent, '3 Verified Photograph');
  const cards = group.querySelectorAll('.person-show-card');
  assert.deepEqual(cards.map(card => card.dataset.personShowAlbumId), ['A', 'B']);
  assert(cards.every(card => !card.classList.contains('is-expanded')));
  assert.equal(cards[0].querySelector('.person-show-expanded').children[0].children[0].options.show.albumId, 'A');
  assert.equal(cards[1].querySelector('.person-show-expanded').children[0].children[0].options.show.albumId, 'B');
  button.events.click({});
  assert.equal(panel.hidden, false); assert.equal(button.getAttribute('aria-expanded'), 'true');
  assert(cards.every(card => card.classList.contains('is-expanded')));
  button.events.click({});
  assert.equal(panel.hidden, true); assert(cards.every(card => !card.classList.contains('is-expanded')));
});
test('Show photo summary refuses URL-only identities and incomplete unions without summing collection counts', () => {
  const f = legacyFixture();
  const urlOnly = { ...f.show('A', ['a']), thumbnails: [{ large_url: 'https://fixture.invalid/a.jpg' }] };
  assert.equal(f.ctx.getMusicPersonLegacyPhotoSummary([urlOnly]), 'Collection 1: 1 Verified Photograph');
  const partial = { ...f.show('A', ['a']), photosComplete: false, expectedPhotoCount: 100 };
  const unknown = { ...f.show('B', ['b']), photosComplete: false, expectedPhotoCount: null };
  const text = f.ctx.getMusicPersonLegacyPhotoSummary([partial, unknown]);
  assert.equal(text, 'Collection 1: 100 Verified Photograph · Collection 2: photograph total unavailable');
  const repeated = { ...f.show('A', ['a', 'a']), expectedPhotoCount: 2 };
  assert.equal(f.ctx.getMusicPersonLegacyPhotoSummary([repeated]), 'Collection 1: 2 Verified Photograph');
});
test('same-entry Legacy enrichment preserves expansion, fresh entry collapses, and one saved album restores the whole Show', () => {
  const f = legacyFixture(), rows = [f.show('A', ['a']), f.show('B', ['b'])];
  const hero = f.node('section'); hero.dataset.personNote = '';
  const copy = f.node('div'); copy.className = 'person-detail-copy';
  const name = f.node('h3'); const pills = f.node('div'); pills.className = 'person-detail-pill-list'; copy.append(name, pills);
  const archive = f.node('dl'); archive.className = 'person-detail-archive-data'; hero.append(copy, archive);
  const resonance = f.node('section'); resonance.dataset.personResonance = '';
  const legacy = f.node('section'); legacy.dataset.personLegacy = '';
  const group = f.ctx.createMusicPersonLegacyShowGroup(rows, 'Person'); legacy.append(group); f.root.append(hero, resonance, legacy);
  f.root.dataset.personIdentity = '1'; f.root.dataset.personEntry = 'visit-a';
  Object.assign(f.ctx, { personDetail: f.root, v3RouteContext: { entry: 'visit-a' }, musicPersonTaggedShowHydrationToken: 1,
    disconnectMusicPersonTaggedShowHydrationObserver() {}, startMusicPersonIdentityMotion() {},
    createMusicPersonPillList: () => Object.assign(f.node('div'), { className: 'person-detail-pill-list' }),
    createMusicPersonArchiveBlock: () => f.node('dl'),
    renderMusicPersonConnections: () => Object.assign(f.node('section'), { dataset: { personResonance: '' } }),
    hydrateMusicPersonTaggedShowPhotos() {},
    musicShowsSetsRequest: null, musicShowsSetsDataState: 'live', musicPeopleIndexDataState: 'live',
    musicBandsIndex: { dataset: { bandsDataState: 'live' } }, musicPersonDetailArchiveRequests: new Map(),
    normalizeMusicPersonId: String, v3Text: value => value || '', getComputedStyle: () => ({ visibility: 'visible' }) });
  load(f.ctx, 'renderMusicPersonDetail'); load(f.ctx, 'restoreMusicResumeState');
  const data = { state: 'ready', personId: '1', name: 'Person', aliases: [], archiveRows: [], taggedShows: rows };
  f.ctx.setMusicPersonLegacyShowExpanded(group, true);
  f.ctx.renderMusicPersonDetail(data);
  assert(group.classList.contains('is-expanded'));
  f.ctx.v3RouteContext = { entry: 'visit-b' };
  f.ctx.renderMusicPersonDetail(data);
  assert(!group.classList.contains('is-expanded'));
  const restored = f.ctx.restoreMusicResumeState({ name: 'person-detail', personId: '1' }, { expanded: ['S1|B'] });
  assert.equal(restored, true); assert(group.classList.contains('is-expanded'));
  assert(group.querySelectorAll('.person-show-card').every(card => card.classList.contains('is-expanded')));
  assert.equal(f.root.scrollTop, 125);
});
test('retained Person links activate their current canonical href after enrichment', () => {
  const f = resonanceFixture();
  const link = f.ctx.createMusicPersonConnectionLink('Show Detail', '/music/shows/old', 'S1');
  link.href = '/music/shows/current';
  link.listeners.click({ button: 0, preventDefault() {} });
  assert.equal(f.navigation[0], '/music/shows/current');
});

test('normalized native Show rows collapse even when source data or first-photo previews request expansion', () => {
  const f = legacyFixture();
  Object.assign(f.ctx, {
    getMusicPersonTaggedShowMatchedShow: () => null, getMusicPeopleCountValue: (...values) => values.find(Number.isFinite) || 0,
    getMusicPersonMatchedPhotoUrl: () => 'https://fixture.invalid/photo.jpg',
    compareMusicPersonMatchedPhotosByOriginalDate: () => 0,
    getMusicPersonTaggedPhotoIdentity: photo => photo.image_key,
    getMusicPersonShowDateParts: () => ({}), getMusicPersonTaggedShowVenue: () => '',
    getMusicPersonTaggedShowRoute: () => '', getMusicPersonTaggedShowSetCode: () => '',
    createMusicPeopleSlug: String
  });
  load(f.ctx, 'getMusicPersonTaggedShowPhotos'); load(f.ctx, 'normalizeMusicPersonTaggedShowRow');
  const row = f.ctx.normalizeMusicPersonTaggedShowRow({ show_id: 'S1', album_id: 'A', title: 'Show',
    expanded: true, tagged_photo_count: 1, matched_photos: [{ image_key: 'one' }] }, 0, [], true);
  assert.equal(row.expanded, false); assert.equal(row.photosComplete, true);
});

function photoKeys(count, prefix = 'p') { return Array.from({ length: count }, (_, i) => prefix + (i + 1)); }
function visibleLegacyThumbs(group) { return group.querySelectorAll('.person-show-tagged-thumb'); }
function prepareMore(f, rows) {
  const group = f.ctx.createMusicPersonLegacyShowGroup(rows, 'Person'); f.root.append(group);
  f.ctx.setMusicPersonLegacyShowExpanded(group, true);
  group.querySelector('[data-person-show-more]').focus(); return group;
}
test('complete19 Show has one full-summary toggle and four keyed previews; More reveals15 lazily without requests', async () => {
  const f = legacyFixture(), group = prepareMore(f, [f.show('A', photoKeys(19))]);
  f.ctx.requestMusicPersonTaggedShowMatchedPhotos = () => { throw Error('Complete DTO must not fetch'); };
  const button = group.querySelector('[data-person-show-gallery-toggle]'), more = group.querySelector('[data-person-show-more]');
  assert(button.querySelector('.person-legacy-show-name')); assert(button.querySelector('.person-legacy-show-meta'));
  assert(button.querySelector('.person-legacy-show-count'));
  assert.equal(button.getAttribute('aria-labelledby').split(' ').length, 3);
  const original = visibleLegacyThumbs(group); assert.equal(original.length, 4);
  assert.equal(more.textContent, 'Show More (15 Remaining)');
  assert.equal(await f.ctx.showMoreMusicPersonLegacyPhotos(group), true);
  const all = visibleLegacyThumbs(group); assert.equal(all.length, 19);
  original.forEach((node, i) => assert.equal(all[i], node));
  assert(all.slice(4).every(node => node.options.lazy === true));
  assert.equal(all[4].options.lightboxPhotos.length, 19);
  assert.equal(f.ctx.document.activeElement, all[4]); assert.equal(more.hidden, true);
});
test('Show-wide four budget deduplicates overlap and keeps owner-album lightboxes isolated', async () => {
  const f = legacyFixture(), group = prepareMore(f, [f.show('A', ['a1', 'shared', 'a3']), f.show('B', ['b1', 'shared', 'b3', 'b4'])]);
  const other = f.ctx.createMusicPersonLegacyShowGroup([{ ...f.show('C', photoKeys(9, 'c')), showId: 'S2' }], 'Person'); f.root.append(other);
  assert.equal(visibleLegacyThumbs(group).length, 4); assert.equal(visibleLegacyThumbs(other).length, 4);
  assert.equal(group.querySelector('[data-person-show-more]').textContent, 'Show More (2 Remaining)');
  await f.ctx.showMoreMusicPersonLegacyPhotos(group);
  const all = visibleLegacyThumbs(group); assert.equal(all.length, 6);
  assert.equal(all.filter(node => node.photo.image_key === 'shared').length, 1);
  const b = all.find(node => node.photo.image_key === 'b3');
  assert.equal(b.options.show.albumId, 'B'); assert.equal(b.options.lightboxPhotos.length, 4);
  assert.equal(visibleLegacyThumbs(other).length, 4);
});
test('normalized synthetic/malformed identities cannot certify totals or discard an unverifiable preview', () => {
  const f = legacyFixture();
  assert.equal(f.ctx.getMusicPersonStablePhotoKey({ imageKey: 'album-photo-1', analyticsImageKey: '' }), '');
  assert.equal(f.ctx.getMusicPersonStablePhotoKey({ image_key: {} }), '');
  assert.equal(f.ctx.getMusicPersonStablePhotoKey({ imageKey: false }), '');
  assert.equal(f.ctx.isMusicPersonCompletePhotoCollection([], { expectedPhotoCount: null,
    thumbnails: [{ imageKey: 'album-photo-1', analyticsImageKey: '', large_url: 'https://fixture.invalid/a.jpg' }] }), false);
  const row = { ...f.show('A', ['one']), thumbnails: [{ imageKey: 'album-photo-1', analyticsImageKey: '' }], photosComplete: true };
  const group = prepareMore(f, [row]);
  assert.equal(group.querySelector('[data-person-show-more]').textContent, 'Show More');
});
test('incomplete More uses complete personal caption pages, dedupes busy activation, and never includes other people', async () => {
  const f = legacyFixture(), partial = { ...f.show('A', photoKeys(4)), photosComplete: false, expectedPhotoCount: 19 };
  const group = prepareMore(f, [partial]), calls = [];
  const people = photoKeys(19).map(image_key => ({ image_key, caption: 'Person', thumbnail_url: 'https://fixture.invalid/' + image_key }));
  const others = photoKeys(21, 'other').map(image_key => ({ image_key, caption: 'Someone Else', thumbnail_url: 'https://fixture.invalid/' + image_key }));
  const pages = [{ photos: [...people.slice(0,10), ...others.slice(0,15)], hasMore: true, nextStart: 26 },
    { photos: [...people.slice(10), ...others.slice(15)], hasMore: false }];
  Object.assign(f.ctx, { MUSIC_SMUGMUG_ALBUM_PHOTOS_MAX_PAGES: 4, MUSIC_SMUGMUG_ALBUM_PHOTOS_PAGE_LIMIT: 25,
    musicPersonTaggedShowHydrationRequests: new Map(),
    enqueueMusicPersonTaggedShowHydration: task => Promise.resolve().then(task),
    getUniqueMusicAlbumPhotos: rows => [...new Map(rows.map(row => [row.image_key, row])).values()],
    compareMusicPersonMatchedPhotosByOriginalDate: () => 0,
    requestMusicSmugmugAlbumPhotosPage: async (album, limit, start) => { calls.push([album, limit, start]); return pages[start === 1 ? 0 : 1]; } });
  ['getMusicPersonCaptionNameParts', 'doesMusicPersonCaptionMatch', 'getMusicPersonTaggedPhotoIdentity'].forEach(name => load(f.ctx, name));
  const a = source.indexOf('async function requestMusicPersonTaggedShowMatchedPhotos('), b = source.indexOf('\nfunction setMusicPersonShowCardTaggedPhotoState', a);
  vm.runInContext(source.slice(a,b), f.ctx);
  let outcome; const fetchAll = f.ctx.requestMusicPersonTaggedShowMatchedPhotos;
  f.ctx.requestMusicPersonTaggedShowMatchedPhotos = (...args) => fetchAll(...args).then(result => { outcome = result; return result; }, error => { outcome = { message: error.message }; throw error; });
  const request = f.ctx.showMoreMusicPersonLegacyPhotos(group);
  assert.equal(f.ctx.showMoreMusicPersonLegacyPhotos(group), request);
  assert.equal(group.querySelector('[data-person-show-more]').getAttribute('aria-disabled'), 'true');
  assert.equal(await request, true, JSON.stringify({ calls, complete: outcome?.isComplete, count: outcome?.matchedPhotos?.length, error: outcome?.message }));
  assert.deepEqual(calls, [['A',25,1], ['A',25,26]]);
  assert.equal(visibleLegacyThumbs(group).length, 19);
  assert(f.ctx.getMusicPersonLegacyInventory(group).items.every(item => item.photo.caption === 'Person'));
  assert(visibleLegacyThumbs(group).every(node => !node._personLegacyPhotoKey.includes('other')));
});
test('More rejects missing known previews and preserves original four nodes with truthful Retry', async () => {
  const f = legacyFixture(), group = prepareMore(f, [{ ...f.show('A', photoKeys(4)), expectedPhotoCount: 19, photosComplete: false }]);
  const original = visibleLegacyThumbs(group);
  f.ctx.requestMusicPersonTaggedShowMatchedPhotos = async () => ({ isComplete: true, matchedPhotos: photoKeys(19, 'different').map(image_key => ({ image_key })) });
  assert.equal(await f.ctx.showMoreMusicPersonLegacyPhotos(group), false);
  assert.deepEqual(visibleLegacyThumbs(group), original);
  assert.equal(group.querySelector('[data-person-show-more]').textContent, 'Retry Show More');
  assert.equal(group._personGalleryState.request, null);
  f.ctx.requestMusicPersonTaggedShowMatchedPhotos = async () => ({ isComplete: true, matchedPhotos: photoKeys(19).map(image_key => ({ image_key })) });
  assert.equal(await f.ctx.showMoreMusicPersonLegacyPhotos(group), true);
  assert.equal(visibleLegacyThumbs(group).length, 19);
});
test('late More completion cannot steal focus after collapse and clears stale busy state for same-entry Back', async () => {
  const f = legacyFixture(), group = prepareMore(f, [{ ...f.show('A', photoKeys(4)), expectedPhotoCount: 19, photosComplete: false }]);
  let resolve;
  f.ctx.requestMusicPersonTaggedShowMatchedPhotos = () => new Promise(done => { resolve = done; });
  const first = f.ctx.showMoreMusicPersonLegacyPhotos(group);
  const owner = f.ctx.v3RouteContext;
  f.ctx.v3RouteContext = { entry: 'other' };
  resolve({ isComplete: true, matchedPhotos: photoKeys(19).map(image_key => ({ image_key })) });
  assert.equal(await first, false); assert.equal(group._personGalleryState.request, null);
  assert.equal(visibleLegacyThumbs(group).length, 4);
  f.ctx.v3RouteContext = owner;
  const second = f.ctx.showMoreMusicPersonLegacyPhotos(group);
  f.ctx.setMusicPersonLegacyShowExpanded(group, false);
  const header = group.querySelector('[data-person-show-gallery-toggle]'); header.focus();
  resolve({ isComplete: true, matchedPhotos: photoKeys(19).map(image_key => ({ image_key })) });
  assert.equal(await second, true);
  assert.equal(f.ctx.document.activeElement, header);
  assert.equal(group.querySelector('[data-person-show-gallery-panel]').hidden, true);
});
test('More state round-trips through Person snapshots while fresh entry resets to four', async () => {
  const f = legacyFixture(), group = prepareMore(f, [f.show('A', photoKeys(19))]);
  await f.ctx.showMoreMusicPersonLegacyPhotos(group);
  Object.assign(f.ctx, { personDetail: f.root, musicShowsSetsRequest: null, musicShowsSetsDataState: 'live',
    musicPeopleIndexDataState: 'live', musicBandsIndex: { dataset: { bandsDataState: 'live' } },
    musicPersonDetailArchiveRequests: new Map(), normalizeMusicPersonId: String, v3Text: value => value || '',
    getComputedStyle: () => ({ visibility: 'visible' }) });
  load(f.ctx, 'captureMusicResumeState'); load(f.ctx, 'restoreMusicResumeState');
  const ui = f.ctx.captureMusicResumeState({ name: 'person-detail' });
  assert.equal(ui.more[0], 'S1');
  f.ctx.v3RouteContext = { entry: 'fresh' }; f.ctx.renderMusicPersonLegacyPreview(group);
  assert.equal(visibleLegacyThumbs(group).length, 4);
  f.ctx.v3RouteContext = { entry: 'fixture' };
  assert.equal(f.ctx.restoreMusicResumeState({ name: 'person-detail', personId: '1' }, ui), true);
  assert.equal(visibleLegacyThumbs(group).length, 19);
});
test('added thumbnail lazy loading is assigned before its src rather than after construction', () => {
  const f = legacyFixture(); let loadingAtSrc;
  const create = f.ctx.document.createElement;
  f.ctx.document.createElement = tag => {
    const item = create(tag);
    if (tag === 'img') Object.defineProperty(item, 'src', { set() { loadingAtSrc = item.loading; } });
    return item;
  };
  Object.assign(f.ctx, { getMusicPersonTaggedPhotoIdentity: photo => photo.image_key,
    applyMusicGalleryImageLoading: image => { image.loading = 'eager'; }, createMusicPeopleSlug: String });
  load(f.ctx, 'createMusicPersonTaggedThumb');
  const photo = { image_key: 'one' };
  f.ctx.createMusicPersonTaggedThumb(photo, { lightboxPhotos: [photo], personId: '1', show: { showId: 'S1', albumId: 'A' }, lazy: true });
  assert.equal(loadingAtSrc, 'lazy');
  f.ctx.createMusicPersonTaggedThumb(photo, { lightboxPhotos: [photo], personId: '1', show: { showId: 'S1', albumId: 'A' } });
  assert.equal(loadingAtSrc, 'eager');
});

test('same-entry Back before old completion resets visual busy state and an old completion cannot clear newer work', async () => {
  const f = legacyFixture(), group = prepareMore(f, [{ ...f.show('A', photoKeys(4)), expectedPhotoCount: 19, photosComplete: false }]);
  const resolves = [];
  f.ctx.requestMusicPersonTaggedShowMatchedPhotos = () => new Promise(resolve => resolves.push(resolve));
  const first = f.ctx.showMoreMusicPersonLegacyPhotos(group);
  f.ctx.v3RouteContext = { entry: 'away' };
  f.ctx.v3RouteContext = { entry: 'fixture' };
  f.ctx.renderMusicPersonLegacyPreview(group);
  const more = group.querySelector('[data-person-show-more]');
  assert.equal(group._personGalleryState.request, null); assert.equal(more.getAttribute('aria-busy'), 'false');
  more.focus(); const second = f.ctx.showMoreMusicPersonLegacyPhotos(group);
  assert.notEqual(first, second);
  resolves[0]({ isComplete: true, matchedPhotos: photoKeys(19).map(image_key => ({ image_key })) });
  assert.equal(await first, false);
  assert.equal(group._personGalleryState.request, second);
  assert.equal(visibleLegacyThumbs(group).length, 4);
  resolves[1]({ isComplete: true, matchedPhotos: photoKeys(19).map(image_key => ({ image_key })) });
  assert.equal(await second, true); assert.equal(visibleLegacyThumbs(group).length, 19);
});
