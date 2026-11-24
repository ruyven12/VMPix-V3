// Run with: node --test tests/admin-venue-census.test.cjs
// Exercise actual Admin validators with the existing Node/VM harness; no network or auth startup.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../modules/admin.js"), "utf8");
function declaration(name) {
  const marker = new RegExp("^  (?:async )?function " + name + "\\(", "m");
  const match = marker.exec(source);
  assert(match, "Missing " + name);
  const rest = source.slice(match.index + 1);
  const end = /\n  (?:async )?function /.exec(rest);
  assert(end, "Missing bounded function end for " + name);
  return source.slice(match.index, match.index + 1 + end.index);
}
const NOW = "2026-11-23T20:00:00.000Z";
const ids = ["mv_alpha", "mv_beta", "mv_gamma", "mv_delta", "mv_epsilon"];
const parameters = () => ({ limit: 5, budgetSeconds: 120, maxAgeHours: 24, forceRefresh: false, venueIds: [...ids] });
function preview() {
  const venues = ids.map((id, i) => ({ venue_id: id, category: i === 0 ? "skipped" : "eligible",
    selected: i !== 0, reasons: i === 0 ? ["verified_within_freshness_window"] : [], linkedShows: 1,
    albums: 1, lastVerifiedAt: i === 0 ? NOW : null, verifiedAt: i === 0 ? NOW : null,
    providerAsOf: i === 0 ? NOW : null, freshnessDue: i !== 0 }));
  venues.push({ venue_id: null, category: "unavailable", selected: false, reasons: ["invalid_venue_identity"] });
  return { ok: true, mode: "dry-run", readOnly: true, databaseMutated: false, maxAgeHours: 24, asOf: NOW,
    totals: { discovered: 5, sourceRows: 6, duplicateVenueRows: 0, eligible: 4, skipped: 1, unavailable: 1, selected: 4, lastCompletedAt: NOW }, venues };
}
function operation(selected = ids) {
  return { ok: true, mode: "execute", operationId: "venue-test", status: "completed", startedAt: NOW, finishedAt: NOW,
    requiresReconciliation: false, summary: { successes: selected.length, incomplete: 0, failed: 0, notProcessed: 0, lastCompletedAt: selected.length ? NOW : null },
    parameters: parameters(), selectedVenueIds: [...selected], providerRequests: 2, replayed: true, inflight: null,
    results: ids.map(id => ({ venue_id: id, status: selected.includes(id) ? "success" : "not_processed",
      total: selected.includes(id) ? 0 : null, verifiedAt: selected.includes(id) ? NOW : null, reasons: [] })) };
}
const functions = ["parseAdminTimestamp", "censusId", "censusOperationId", "censusSame", "censusStamp", "censusParameters",
  "readCensusPending", "saveCensusPending", "projectCensusPreview", "projectCensusOperation", "projectCensusDiscovery",
  "censusMatches", "censusTerminal", "censusClean", "censusReadOperation", "censusReadStatus", "censusDiagnosticReason", "censusDiagnosticGroups", "renderCensusDiagnosticGroups"];
function harness(raw = null) {
  let stored = raw, writes = 0;
  const context = vm.createContext({
    Date, Set, Map, JSON, diagnosticObject: value => !!value && typeof value === "object" && !Array.isArray(value),
    diagnosticCount: value => Number.isSafeInteger(value) && value >= 0,
    sessionStorage: { getItem: () => stored, setItem: (key, value) => { writes++; stored = value; } }
  });
  const a = source.indexOf("  const censusReasons = "), b = source.indexOf("\n  let censusStorageHealthy", a);
  assert(a > 0 && b > a);
  vm.runInContext(source.slice(a, b) + "\n" + functions.map(declaration).join("\n") +
    "\nconst CENSUS_PENDING_KEY='test'; const CENSUS_ROUTE='/api/admin/music/venue-photo-census/batches';" +
    "\nconst censusPending=new Map(); let censusStorageHealthy=true,censusPreview=null,censusDiscovery=null,censusNames=new Map(),censusCheckedAt=null,censusPlan=null,censusDetail=null;" +
    "\nglobalThis.api={" + functions.join(",") + ",censusPending,healthy:()=>censusStorageHealthy,setPlan:value=>censusPlan=value,plan:()=>censusPlan};", context);
  return { api: context.api, context, stored: () => stored, writes: () => writes };
}
test("UI pending parameters are strict while valid bounded historic scopes remain readable", () => {
  const { api } = harness();
  assert(api.censusParameters(parameters(), true));
  assert.equal(api.censusParameters({ ...parameters(), venueIds: [] }, true), null);
  assert(api.censusParameters({ ...parameters(), venueIds: [] }));
  assert(api.censusParameters({ ...parameters(), venueIds: [...ids, "mv_more"] }));
  for (const change of [{ limit: 11 }, { budgetSeconds: 301 }, { maxAgeHours: 0 }, { forceRefresh: "true" },
    { venueIds: ["bad/id"] }, { venueIds: ["mv_same", "mv_same"] }])
    assert.equal(api.censusParameters({ ...parameters(), ...change }), null);
});
test("preview keeps invalid rows separate and uses verified zero/unknown data without legacy estimates", () => {
  const { api } = harness(), raw = preview();
  raw.stats = { photo_count: 99999 }; raw.venues[1].photo_count = 88888;
  const projected = api.projectCensusPreview(raw);
  assert(projected); assert.equal(projected.totals.discovered, 5);
  assert.equal(projected.venues.filter(row => row.venue_id === null).length, 1);
  assert.equal(projected.venues[1].lastVerifiedAt, null);
  assert(!JSON.stringify(projected).includes("99999")); assert(!JSON.stringify(projected).includes("88888"));
});
test("preview rejects unknown reasons, invalid dates, duplicate identities and contradictory totals", () => {
  const { api } = harness();
  const changes = [
    raw => { raw.venues[1].reasons = ["SYNTHETIC_PRIVATE_SECRET"]; },
    raw => { raw.venues[1].lastVerifiedAt = "2026-02-30T12:00:00.000Z"; },
    raw => { raw.venues[1].venue_id = raw.venues[0].venue_id; },
    raw => { raw.totals.discovered = 99; },
    raw => { raw.venues[0].selected = true; }
  ];
  for (const change of changes) { const raw = preview(); change(raw); assert.equal(api.projectCensusPreview(raw), null); }
});
test("GET status replayed:true is accepted and verified total zero remains accurate", () => {
  const { api } = harness(), projected = api.projectCensusOperation(operation());
  assert(projected); assert(api.censusClean(projected));
  assert.equal(projected.results[0].total, 0);
});
for (const selected of [ids.slice(0, 2), []]) test("terminal subset of " + selected.length + " resolves without claiming full-scope success", () => {
  const { api } = harness(), projected = api.projectCensusOperation(operation(selected));
  assert(projected); assert(api.censusTerminal(projected));
  assert(api.censusMatches(projected, { operationId: "venue-test", parameters: parameters() }));
  assert.equal(api.censusClean(projected), false);
});
test("historic automatic scope and larger requested scope are readable but cannot impersonate an owned request", () => {
  const { api } = harness(), raw = operation(ids.slice(0, 2));
  raw.parameters.venueIds = [];
  const automatic = api.projectCensusOperation(raw);
  assert(automatic); assert.equal(api.censusMatches(automatic, { operationId: "venue-test", parameters: parameters() }), false);
  raw.parameters.venueIds = [...ids, "mv_more"];
  assert(api.projectCensusOperation(raw));
});
test("owned reconciliation rejects changed immutable parameters, unselected writes and inflight work", () => {
  const { api } = harness(), pending = { operationId: "venue-test", parameters: parameters() };
  const changed = operation(); changed.parameters.forceRefresh = true;
  assert.equal(api.censusMatches(api.projectCensusOperation(changed), pending), false);
  const outside = operation(ids.slice(0, 2)); outside.results[2] = { venue_id: ids[2], status: "success", total: 5, verifiedAt: NOW, reasons: [] };
  assert.equal(api.censusMatches(api.projectCensusOperation(outside), pending), false);
  const active = operation(); active.status = "running"; active.inflight = { venue_id: ids[0] };
  assert.equal(api.censusTerminal(api.projectCensusOperation(active)), false);
});
test("operation projection omits arbitrary response blobs and rejects unknown reason text", () => {
  const { api } = harness(), raw = operation();
  raw.credentials = "SYNTHETIC_PRIVATE_SECRET"; raw.results[0].providerPayload = "SYNTHETIC_PRIVATE_SECRET";
  assert(!JSON.stringify(api.projectCensusOperation(raw)).includes("SYNTHETIC_PRIVATE_SECRET"));
  raw.results[0].reasons = ["SYNTHETIC_PRIVATE_SECRET"];
  assert.equal(api.projectCensusOperation(raw), null);
});
test("recent discovery is bounded metadata and never interprets its truncated result rows", () => {
  const { api } = harness(), raw = operation();
  raw.results = [{ providerPayload: "SYNTHETIC_PRIVATE_SECRET" }];
  const data = { ok: true, readOnly: true, databaseMutated: false, active: [], recent: [raw],
    limits: { active: 10, recent: 20 }, hasMore: { active: false, recent: true } };
  const projected = api.projectCensusDiscovery(data);
  assert(projected); assert.equal(projected.hasMore.recent, true);
  assert(!JSON.stringify(projected).includes("SYNTHETIC_PRIVATE_SECRET"));
});
test("corrupt pending recovery is atomic and Check Status cannot silently replace later unknown entries", async () => {
  const good = { operationId: "venue-valid", parameters: parameters(), attemptedAt: NOW };
  const raw = JSON.stringify([good, { operationId: "bad/operation", parameters: parameters(), attemptedAt: NOW }]);
  const h = harness(raw);
  h.api.readCensusPending();
  assert.equal(h.api.censusPending.size, 0); assert.equal(h.api.healthy(), false);
  h.context.censusRequest = async (run, route) => route.includes("operations/recent") ?
    { ok: true, readOnly: true, databaseMutated: false, active: [], recent: [], limits: { active: 10, recent: 20 }, hasMore: { active: false, recent: false } } : preview();
  h.context.censusLoadNames = async () => new Map();
  await h.api.censusReadStatus({});
  assert.equal(h.api.censusPending.size, 0); assert.equal(h.api.healthy(), false);
  assert.equal(h.stored(), raw); assert.equal(h.writes(), 0);
});
test("valid recovery stores only immutable operation metadata, never extra fields", () => {
  const raw = JSON.stringify([{ operationId: "venue-valid", parameters: parameters(), attemptedAt: NOW, bearer: "SYNTHETIC_PRIVATE_SECRET" }]);
  const h = harness(raw); h.api.readCensusPending(); assert.equal(h.api.censusPending.size, 1);
  h.api.saveCensusPending(); assert(!h.stored().includes("SYNTHETIC_PRIVATE_SECRET"));
});

test("inferred interrupted non-success rows may omit verifiedAt without blocking safe recovery", () => {
  const { api } = harness(), raw = operation([]);
  raw.status = "interrupted";
  raw.results.forEach(row => { delete row.verifiedAt; row.reasons = ["operation_interrupted"]; });
  const projected = api.projectCensusOperation(raw);
  assert(projected); assert(projected.results.every(row => row.verifiedAt === null));
  assert(api.censusMatches(projected, { operationId: "venue-test", parameters: parameters() }));
  assert(api.censusTerminal(projected)); assert.equal(api.censusClean(projected), false);
});

test("uncertain batch confirmed by GET removes completed IDs from the existing next-batch plan", async () => {
  const h = harness();
  h.api.censusPending.set("venue-test", { operationId: "venue-test", parameters: parameters(), attemptedAt: NOW });
  h.api.setPlan({ mode: "all", remaining: [...ids, "mv_next"] });
  h.context.censusRequest = async () => operation();
  await h.api.censusReadOperation({}, "venue-test");
  assert.equal(h.api.censusPending.size, 0);
  assert.equal(JSON.stringify(h.api.plan().remaining), JSON.stringify(["mv_next"]));
});
test("resolved partial or stopped batch cancels its old plan instead of proposing a blind next batch", async () => {
  const h = harness();
  h.api.censusPending.set("venue-test", { operationId: "venue-test", parameters: parameters(), attemptedAt: NOW });
  h.api.setPlan({ mode: "all", remaining: [...ids, "mv_next"] });
  h.context.censusRequest = async () => { const raw = operation(ids.slice(0, 2)); raw.status = "stopped"; return raw; };
  await h.api.censusReadOperation({}, "venue-test");
  assert.equal(h.api.censusPending.size, 0); assert.equal(h.api.plan(), null);
});

test("diagnostic explanations classify identities, shows and albums without exposing raw codes", () => {
  const { api } = harness();
  for (const [code, group] of [["invalid_venue_identity", "identity"], ["ambiguous_venue_identity", "identity"],
    ["show_missing_stable_venue_id", "shows"], ["show_missing_verified_set_mappings", "shows"],
    ["venue_relationships_changed_during_scan", "shows"], ["unverified_album_mapping", "albums"],
    ["lineup_album_unresolved", "albums"], ["album_path_collision", "albums"],
    ["album_shared_outside_venue", "albums"], ["provider_album_attribution_mismatch", "albums"]]) {
    const result = api.censusDiagnosticReason(code);
    assert.equal(result.group, group); assert(result.text.length > 10);
    assert(!result.text.includes(code)); assert(!result.text.includes("_"));
  }
  assert.equal(api.censusDiagnosticReason("verified_within_freshness_window"), null);
  assert.equal(api.censusDiagnosticReason("not_requested"), null);
  assert.equal(api.censusDiagnosticReason("constructor").group, "other");
});
test("diagnostic group counts deduplicate reasons per record and preserve intentional cross-group overlap", () => {
  const { api } = harness();
  const row = (venue_id, reasons) => ({ venue_id, reasons, category: "unavailable", lastVerifiedAt: null, verifiedAt: null, freshnessDue: true });
  const rows = [
    row("mv_show", ["show_missing_stable_venue_id", "show_missing_verified_set_mappings", "show_missing_stable_venue_id"]),
    row("mv_album", ["unverified_album_mapping", "lineup_album_unresolved"]),
    row("mv_both", ["show_missing_stable_venue_id", "album_path_collision"]),
    row("mv_other", ["prior_operation_requires_reconciliation"]),
    row(null, ["invalid_venue_identity"]), row(null, ["invalid_venue_identity"])
  ];
  const unchanged = JSON.stringify(rows);
  const groups = api.censusDiagnosticGroups(rows), group = key => groups.find(item => item.key === key);
  assert.equal(group("identity").records.length, 2);
  assert.equal(group("shows").records.length, 2);
  assert.equal(group("albums").records.length, 2);
  assert.equal(group("other").records.length, 1);
  assert.equal(group("shows").records.find(item => item.venue_id === "mv_show").reasons.length, 2);
  assert.equal(group("shows").records.find(item => item.venue_id === "mv_show").codes.length, 2);
  assert(group("shows").records.some(item => item.venue_id === "mv_both"));
  assert(group("albums").records.some(item => item.venue_id === "mv_both"));
  assert.equal(new Set([...group("shows").records, ...group("albums").records].map(item => item.venue_id)).size, 3);
  assert.equal(JSON.stringify(rows), unchanged);
});
test("invalid identities stay distinct source positions without inventing venue names or IDs", () => {
  const { api } = harness();
  const rows = [{ venue_id: "mv_valid", category: "eligible", reasons: [], lastVerifiedAt: null },
    { venue_id: null, category: "unavailable", reasons: ["invalid_venue_identity"] },
    { venue_id: null, category: "unavailable", reasons: ["invalid_venue_identity"] }];
  const records = api.censusDiagnosticGroups(rows).find(group => group.key === "identity").records;
  assert.equal(records.length, 2); assert(records.every(row => row.venue_id === null));
  assert.equal(JSON.stringify(records.map(row => row.sourcePosition)), JSON.stringify([2, 3]));
  assert(records.every(row => !Object.hasOwn(row, "venue") && !Object.hasOwn(row, "name")));
});
test("current verification and unselected status are not diagnostic issues; stale verification remains visible", () => {
  const { api } = harness();
  const groups = api.censusDiagnosticGroups([
    { venue_id: "mv_current", category: "skipped", reasons: ["verified_within_freshness_window"], lastVerifiedAt: NOW, verifiedAt: NOW, freshnessDue: false },
    { venue_id: "mv_unselected", category: "skipped", reasons: ["not_requested"], lastVerifiedAt: null, verifiedAt: null, freshnessDue: true },
    { venue_id: "mv_stale", category: "eligible", reasons: [], lastVerifiedAt: NOW, verifiedAt: null, freshnessDue: true }
  ]);
  assert.equal(groups.find(group => group.key === "recheck").records.length, 1);
  assert.equal(groups.find(group => group.key === "recheck").records[0].venue_id, "mv_stale");
  assert(groups.filter(group => group.key !== "recheck").every(group => group.records.length === 0));
});
test("additional actual issues and unavailable records without supplied reasons remain visible", () => {
  const { api } = harness();
  const rows = [
    { venue_id: "mv_future", category: "unavailable", reasons: ["future_reason"], lastVerifiedAt: null },
    { venue_id: "mv_unavailable", category: "unavailable", reasons: [], lastVerifiedAt: null }
  ];
  const group = api.censusDiagnosticGroups(rows).find(group => group.key === "other");
  assert.equal(group.records.length, 2);
  assert.equal(group.records[0].codes[0], "future_reason");
  assert(group.records.every(row => row.reasons.length > 0 && row.reasons.every(text => !text.includes("_"))));
});
test("repeated canonical entries cannot inflate one diagnostic group", () => {
  const { api } = harness();
  const group = api.censusDiagnosticGroups([
    { venue_id: "mv_same", category: "unavailable", reasons: ["unverified_album_mapping"], lastVerifiedAt: null },
    { venue_id: "mv_same", category: "unavailable", reasons: ["lineup_album_unresolved"], lastVerifiedAt: null }
  ]).find(group => group.key === "albums");
  assert.equal(group.records.length, 1); assert.equal(group.records[0].reasons.length, 2);
});

test("large diagnostic groups keep full counts while rendering a disclosed bounded record list", () => {
  const h = harness();
  const node = tag => ({ tag, dataset: {}, children: [], textContent: "", appendChild(child) { this.children.push(child); return child; } });
  h.context.document = { createElement: node };
  h.context.censusKnownName = () => "Recorded venue";
  h.context.formatAdminDateTime = () => "Not available";
  h.context.censusText = (parent, tag, text) => { const child = node(tag); child.textContent = text; return parent.appendChild(child); };
  const rows = Array.from({ length: 205 }, (_, i) => ({ venue_id: "mv_large_" + i, category: "unavailable",
    reasons: ["show_missing_stable_venue_id"], lastVerifiedAt: null }));
  const groups = h.api.censusDiagnosticGroups(rows);
  assert.equal(groups.find(group => group.key === "shows").records.length, 205);
  const parent = node("div");
  h.api.renderCensusDiagnosticGroups(parent, rows, new Set());
  const rendered = parent.children.find(child => child.dataset.censusDiagnosticGroup === "shows");
  assert(rendered);
  assert.equal(rendered.children.filter(child => child.tag === "article").length, 200);
  assert(rendered.children.some(child => child.tag === "p" && child.textContent.includes("Showing 200 of 205")));
  assert(rendered.children[0].children.some(child => child.textContent === "205 affected records"));
});
