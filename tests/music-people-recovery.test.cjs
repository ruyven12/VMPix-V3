'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.resolve(__dirname, '../modules/music.js'), 'utf8');
function load(ctx, name) {
  const start = source.search(new RegExp('^function ' + name + '\\(', 'm'));
  assert(start >= 0, name);
  const rest = source.slice(start), next = rest.slice(1).search(/\nfunction /);
  vm.runInContext(next < 0 ? rest : rest.slice(0, next + 1), ctx);
}
const tick = () => new Promise(resolve => setImmediate(resolve));
function fixture(program = () => [payload()]) {
  let time = 0, sequence = 0;
  const timers = new Map(), calls = [], states = [];
  const ctx = vm.createContext({ Date: class extends Date { static now() { return time; } },
    AbortController, Promise, Map, Set, Number, Error,
    MUSIC_PEOPLE_INDEX_TIMEOUT_MS: 45000, MUSIC_PEOPLE_PREPARATION_MAX_MS: 600000,
    MUSIC_PEOPLE_PREPARATION_MAX_POLLS: 300, MUSIC_PEOPLE_PREPARATION_MAX_GENERATIONS: 8,
    MUSIC_PEOPLE_INDEX_API_LIMIT: 100, MUSIC_PEOPLE_INDEX_MAX_PAGES: 20,
    musicPeopleIndexRequest: null, musicPeopleIndexLoaded: false, musicPeopleIndexDataState: 'idle',
    musicPeopleIndexLastGoodRows: null, musicPeopleIndexRequestGeneration: 0,
    musicPeopleIndexRetryAllowed: undefined, musicPeopleIndexRecoveryState: null,
    musicPeopleIndex: { setAttribute() {} }, fetch() {},
    window: { setTimeout(fn, delay) { const id = ++sequence; timers.set(id, { at: time + delay, fn }); return id; },
      clearTimeout(id) { timers.delete(id); } },
    getMusicRequestTimeoutMs: value => value,
    setMusicPeopleIndexCollection(rows, state) { ctx.rows = rows; ctx.musicPeopleIndexDataState = state; states.push(state); },
    restoreMusicPeopleFallback() { ctx.setMusicPeopleIndexCollection(ctx.musicPeopleIndexLastGoodRows || [], 'error'); },
    renderMusicPeopleIndex() {}, normalizeLiveMusicPeople: pages => pages.flatMap(page => page.data),
    normalizeMusicPeopleIndexRow: row => row, isPublicMusicPeopleIndexRow: row => row.category !== 'Friends',
    hasVisibleMusicPeoplePhotoCount: row => (row.verified_photo_count ?? row.stats?.photo_count ?? 0) > 0,
    async fetchMusicPeopleIndexPayloads(signal, retry, onReadiness) {
      calls.push(retry);
      try {
        const pages = await program(ctx, calls.length, signal);
        onReadiness?.(ctx.getMusicPeopleRelationshipReadiness(pages[0]));
        return pages;
      } catch (error) {
        if (error.musicPeopleReadinessDetails) onReadiness?.(error.musicPeopleReadinessDetails);
        throw error;
      }
    },
  });
  for (const name of ['createMusicRequestTimeoutError', 'getMusicPeopleRetryPermission', 'createMusicPeopleReadinessError',
    'getMusicPeopleRelationshipReadiness', 'validateMusicPeopleIndexPage', 'createMusicPeopleRecovery',
    'requestMusicPeopleIndexData', 'retryMusicPeopleIndexState', 'createMusicPeopleErrorState']) load(ctx, name);
  async function finish(promise) {
    let settled = false, value, error;
    promise.then(result => { value = result; settled = true; }, reason => { error = reason; settled = true; });
    for (let i = 0; i < 1000 && !settled; i++) {
      await tick();
      if (settled) break;
      const first = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      assert(first, 'recovery must settle or schedule bounded work');
      time = Math.max(time, first[1].at); timers.delete(first[0]); first[1].fn();
    }
    assert(settled, 'no uncontrolled recovery loop');
    if (error) throw error;
    return value;
  }
  return { ctx, calls, states, timers, finish, now: () => time, advance: value => { time += value; } };
}
function readiness(overrides = {}) {
  return { status: 'ready', authoritative: true, generation: 1, scope: 'linked_music_show_albums',
    reason: null, started_at: '2026-01-01T00:00:00.000Z', completed_at: '2026-01-01T00:01:00.000Z',
    expires_at: '2026-01-01T06:01:00.000Z', retry_allowed: false, active: false,
    albums_processed: 2, pages_processed: 3, ...overrides };
}
function payload(count = 3, extra = {}) {
  return { ok: true, page: 1, limit: 100, total: 1, totalPages: 1, count: 1,
    hasNextPage: false, hasPrevPage: false, relationship_readiness: readiness(),
    data: [{ person_id: 1, name: 'Fixture Person', category: 'Musician', stats: { photo_count: count },
      relationship_status: 'ready', photo_count_status: 'verified', photo_count_source: 'relationship_cache',
      verified_photo_count: count }], ...extra };
}
function preparing(ctx, n, generation = 1) {
  throw ctx.createMusicPeopleReadinessError('preparing', readiness({ status: 'preparing', authoritative: false,
    active: true, completed_at: null, generation, albums_processed: n, pages_processed: n }));
}

test('verified persisted data publishes immediately, including explicit zero, without polling', async () => {
  for (const count of [3, 0]) {
    const f = fixture(() => [payload(count, { relationship_readiness: readiness({ stale: true, refreshing: true }) })]);
    assert.equal(await f.finish(f.ctx.requestMusicPeopleIndexData()), true);
    assert.deepEqual(f.calls, [false]); assert.equal(f.now(), 0);
    assert.equal(f.ctx.musicPeopleIndexDataState, count ? 'live' : 'empty');
    assert.equal(f.ctx.rows[0].verified_photo_count, count); assert.equal(f.timers.size, 0);
  }
});
test('genuine preparation progress can exceed 45 seconds and then atomically publish', async () => {
  const f = fixture((ctx, attempt) => attempt < 40 ? preparing(ctx, attempt) : [payload()]);
  assert.equal(await f.finish(f.ctx.requestMusicPeopleIndexData()), true);
  assert(f.now() > 45000); assert.equal(f.calls.length, 40);
  assert.equal(f.ctx.musicPeopleIndexDataState, 'live'); assert(!f.states.includes('empty'));
});
test('heartbeats without completed work stall and retain last-known-good data', async () => {
  const f = fixture((ctx, attempt) => {
    const r = readiness({ status: 'preparing', authoritative: false, active: true,
      completed_at: null, albums_processed: 1, pages_processed: 1, last_progress_at: String(attempt) });
    throw ctx.createMusicPeopleReadinessError('preparing', r);
  });
  const good = [{ person_id: 42, name: 'Previously verified', verified_photo_count: 2 }];
  f.ctx.musicPeopleIndexLastGoodRows = good;
  assert.equal(await f.finish(f.ctx.requestMusicPeopleIndexData()), false);
  assert.equal(f.ctx.musicPeopleIndexRecoveryState, 'stalled'); assert.equal(f.now(), 45000);
  assert.equal(f.ctx.rows, good); assert(!f.states.includes('empty')); assert.equal(f.timers.size, 0);
});
test('a stalled Check Status is read-only even when a stale Retry grant exists', async () => {
  const f = fixture(); f.ctx.musicPeopleIndexRecoveryState = 'stalled'; f.ctx.musicPeopleIndexRetryAllowed = true;
  f.ctx.retryMusicPeopleIndexState();
  assert.equal(await f.finish(f.ctx.musicPeopleIndexRequest), true);
  assert.deepEqual(f.calls, [false]);
});
test('intentional Retry is one-shot; later preparation polls never restart work', async () => {
  const f = fixture((ctx, attempt) => attempt < 4 ? preparing(ctx, attempt) : [payload()]);
  f.ctx.musicPeopleIndexRetryAllowed = true;
  const first = f.ctx.requestMusicPeopleIndexData({ retryRelationships: true });
  assert.equal(f.ctx.requestMusicPeopleIndexData({ retryRelationships: true }), first);
  assert.equal(await f.finish(first), true);
  assert.deepEqual(f.calls, [true, false, false, false]);
});
test('failed preparation retains backend-controlled Retry rather than polling or creating empty data', async () => {
  const f = fixture(ctx => { throw ctx.createMusicPeopleReadinessError('error', readiness({
    status: 'error', authoritative: false, active: false, retry_allowed: true, completed_at: null })); });
  assert.equal(await f.finish(f.ctx.requestMusicPeopleIndexData()), false);
  assert.equal(f.ctx.musicPeopleIndexRetryAllowed, true); assert.equal(f.ctx.musicPeopleIndexRecoveryState, null);
  assert.equal(f.ctx.musicPeopleIndexDataState, 'error'); assert.deepEqual(f.calls, [false]);
});
test('changed generations cannot extend recovery indefinitely', async () => {
  const f = fixture((ctx, attempt) => preparing(ctx, attempt, attempt));
  assert.equal(await f.finish(f.ctx.requestMusicPeopleIndexData()), false);
  assert.equal(f.ctx.musicPeopleIndexRecoveryState, 'bounded'); assert.equal(f.calls.length, 9);
});
test('backend restarts with reused generation IDs still count as new attempts', async () => {
  const f = fixture((ctx, attempt) => {
    throw ctx.createMusicPeopleReadinessError('preparing', readiness({ status: 'preparing', authoritative: false,
      active: true, completed_at: null, generation: 0, started_at: new Date(attempt * 1000).toISOString(),
      albums_processed: attempt, pages_processed: attempt }));
  });
  assert.equal(await f.finish(f.ctx.requestMusicPeopleIndexData()), false);
  assert.equal(f.ctx.musicPeopleIndexRecoveryState, 'bounded'); assert.equal(f.calls.length, 9);
});
test('restored artifacts with reused generations are distinguished by verification time', () => {
  const f = fixture(), r = f.ctx.createMusicPeopleRecovery({ now: f.now, maxGenerations: 2 });
  for (let i = 1; i <= 3; i++) r.observe(readiness({ generation: 0, started_at: null,
    completed_at: new Date(i * 1000).toISOString() }));
  assert.throws(() => r.check(true), error => error.musicPeopleRecovery === 'bounded');
});
test('progress remains bounded by ten minutes even when every poll advances', async () => {
  const f = fixture((ctx, attempt) => preparing(ctx, attempt));
  assert.equal(await f.finish(f.ctx.requestMusicPeopleIndexData()), false);
  assert.equal(f.ctx.musicPeopleIndexRecoveryState, 'bounded'); assert.equal(f.now(), 600000);
  assert(f.calls.length <= 300); assert.equal(f.timers.size, 0);
});
test('counter decreases, malformed counters and changing timestamps are not progress', () => {
  const f = fixture(), r = f.ctx.createMusicPeopleRecovery({ now: f.now, stallMs: 100, maxMs: 1000 });
  r.observe(readiness({ albums_processed: 4, pages_processed: 6 })); f.advance(90);
  r.observe(readiness({ albums_processed: 3, pages_processed: 7 }));
  r.observe(readiness({ albums_processed: NaN, pages_processed: -1, last_progress_at: 'new heartbeat' }));
  f.advance(10); assert.throws(() => r.check(true), e => e.musicPeopleRecovery === 'stalled');
});
test('a completed authoritative response is accepted after a quiet interval, within hard bounds', () => {
  const f = fixture(), r = f.ctx.createMusicPeopleRecovery({ now: f.now, stallMs: 100, maxMs: 1000 });
  r.observe(readiness()); f.advance(101);
  assert.doesNotThrow(() => r.check(true, true));
  f.advance(900); assert.throws(() => r.check(true, true), e => e.musicPeopleRecovery === 'bounded');
});
test('pagination never mixes persisted generations or treats unavailable counts as zero', () => {
  const f = fixture(), first = payload();
  assert.throws(() => f.ctx.validateMusicPeopleIndexPage(payload(3, {
    relationship_readiness: readiness({ generation: 2 }) }), 1, first), e => e.musicPeopleReadiness === 'preparing');
  const bad = payload(); bad.data[0].verified_photo_count = null;
  assert.throws(() => f.ctx.validateMusicPeopleIndexPage(bad, 1), e => e.musicPeopleReadiness === 'malformed');
});
test('older backends retain successful publication and bounded legacy recovery', async () => {
  const legacy = payload(); delete legacy.relationship_readiness;
  legacy.data = [{ person_id: 1, name: 'Legacy Fixture', category: 'Musician', stats: { photo_count: 2 } }];
  const f = fixture(() => [legacy]);
  assert.equal(await f.finish(f.ctx.requestMusicPeopleIndexData()), true);
  const unavailable = fixture(() => { throw Error('legacy temporarily unavailable'); });
  assert.equal(await unavailable.finish(unavailable.ctx.requestMusicPeopleIndexData()), false);
  assert.equal(unavailable.calls.length, 3); assert.equal(unavailable.ctx.musicPeopleIndexDataState, 'error');
});
test('legacy multi-page work retains its overall45s deadline; explicit readiness switches before page fan-out', async () => {
  for (const modern of [false, true]) {
    const f = fixture();
    load(f.ctx, 'getMusicPeoplePayloadTotalPages'); load(f.ctx, 'fetchMusicPeopleIndexPayloads');
    f.ctx.fetchMusicPeopleIndexPage = (page, signal) => new Promise((resolve, reject) => {
      const cancel = () => { f.ctx.window.clearTimeout(timer); reject(Error('aborted')); };
      const timer = f.ctx.window.setTimeout(() => {
        signal.removeEventListener('abort', cancel);
        const data = Array.from({ length: page === 1 ? 100 : 1 }, (_, index) => {
          const row = { ...payload().data[0], person_id: (page - 1) * 100 + index + 1 };
          if (!modern) for (const key of ['relationship_status', 'photo_count_status', 'photo_count_source', 'verified_photo_count']) delete row[key];
          return row;
        });
        const result = payload(3, { page, total: 101, totalPages: 2, count: data.length, hasNextPage: page === 1, hasPrevPage: page > 1, data });
        if (!modern) delete result.relationship_readiness;
        resolve(result);
      }, 30000);
      signal.addEventListener('abort', cancel, { once: true });
    });
    assert.equal(await f.finish(f.ctx.requestMusicPeopleIndexData()), modern);
    assert.equal(f.now(), modern ? 60000 : 45000);
    assert.equal(f.timers.size, 0);
  }
});
test('request ownership blocks stale publication after a newer request generation', async () => {
  let release;
  const f = fixture(() => new Promise(resolve => { release = resolve; }));
  const work = f.ctx.requestMusicPeopleIndexData(); await tick();
  f.ctx.musicPeopleIndexRequestGeneration++;
  release([payload()]);
  assert.equal(await f.finish(work), false);
  assert.equal(f.ctx.musicPeopleIndexLoaded, false); assert.equal(f.ctx.musicPeopleIndexLastGoodRows, null);
  assert.equal(f.timers.size, 0);
});
test('stalled status UI has an accessible enabled Check Status action, not privileged Retry', () => {
  const f = fixture(), button = { dataset: {}, setAttribute(key, value) { this[key] = value; } };
  let options;
  f.ctx.createMusicV3StateCard = (state, scope, value) => {
    options = value; return { dataset: {}, querySelectorAll: () => [button] };
  };
  f.ctx.musicPeopleIndexRecoveryState = 'stalled'; f.ctx.musicPeopleIndexRetryAllowed = false;
  const card = f.ctx.createMusicPeopleErrorState();
  assert.equal(options.retry.label, 'Check Status'); assert.equal(button.disabled, false);
  assert.equal(button['aria-disabled'], 'false'); assert.equal(card.dataset.musicPeopleRecovery, 'stalled');
});
