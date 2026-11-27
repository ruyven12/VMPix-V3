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
