# V3 Current State

## 1. Document Status

- Project: Website-V3 / VMPix-V3
- Purpose: Current project-state snapshot
- Status: Active / frequently updated
- Last reviewed: 2026-09-10 — PASS 26 workflow refresh
- Basis: PASS 5 direction and PASS 6–7 implementation snapshots; PASS 26 verifies current workflow files and records completed PASS 10–25/follow-up reports from this task history. No application re-audit, browser/E2E rerun, or physical-device validation was performed in PASS 26.

Read [AGENTS.md](../AGENTS.md) first. This file records **state, not permanent law**; engineering, workflow, and creative authority remain in the governing documents.

Evidence labels: **Approved/documented decision** records direction or protection; **Documented implementation — runtime verification pending** records reported or previously documented work, not a passing runtime check; **Pending QA/signoff** means evidence or human acceptance remains outstanding. Future work is not implemented or newly authorized by this record. **Source-verified implementation** means code presence confirmed in PASS 6. Runtime/browser verification, physical-device QA, and human creative signoff are separate evidence stages; none implies the next.

## 2. Current Build Phase

**Experience Build.** Per Chris's current direction, major backend/data groundwork is substantially completed; the priority is finishing the frontend experience. Music and Wrestling have progressed beyond original mock-only planning. This is owner-reported project state, not a fresh backend audit.

**Finish and sign off surfaces before moving forward.** See [Experience Build rules](V3_EXPERIENCE_BUILD_RULES.md) for the existing completion process.

## 3. Current Build Priority

1. Wrestling experience completion/polish.
2. Music experience build using patterns proven during Wrestling.
3. Remaining /portfolio worlds/modules using reusable V3 patterns.
4. Utility/final pages afterward.

This sequence comes from Chris's PASS 5 direction and supersedes older development-focus snapshots for scheduling only. It does not change World Bible canon or resolve creative ownership. No completion dates are set.

## 4. Locked / Protected Major Experiences

| Experience | Design status | Implementation status | QA/device-validation status |
| --- | --- | --- | --- |
| Home Story v1.0 | APPROVED/protected; World Bible also records LOCKED. | Documented complete; runtime verification pending. | Final mobile validation remains pending in the source; no newer device acceptance established here. |
| Interactive Portfolio v1.0 | LOCKED/protected. | Completed observatory, selection, scan, projection, and status experience documented; runtime verification pending. Archive Seal transport remains future/outside the lock. | Current device/browser evidence and final subjective signoff coverage require confirmation; protection remains in force. |
| Approved Shell/Engine Bar behavior | Protected Shell ownership and established persistence. | Shell-owned Engine/Console behavior documented; runtime verification pending. | Regression/device evidence pending confirmation; cold-entry/return-Home contract remains unresolved. |

Canonical protection details: [Project Rules](PROJECT_RULES.md), [Home Story / Experience Build](V3_EXPERIENCE_BUILD_RULES.md), and [World Bible](design/world-bible.md). LOCKED is not proof that all device checks passed; do not reopen approved design merely because QA evidence needs recording.

## 5. Wrestling Implementation Snapshot and Later Milestones

The table and source details below retain the PASS 6–7 snapshot, not a fresh completeness audit. Later pass reports supersede its match-failure recommendation: PASS 12 completed explicit match loading/unavailable/error handling; PASS 17 fixed missing-venue substitution. PASS 19–24/follow-up delivered scoped multi-agent Hall refinements with browser QA and review, while physical/creative acceptance remains separate. See §§8 and 11 for workflow evidence. No broad application audit is claimed here.

**Historical protection records:** PASS 9 migrated the user-supplied prior approvals for Daïion identity/atmosphere, Wrestling Engine energy, Daïion-to-Hall continuity, Hall of Crusades structure/title morph/atmosphere, Hall of Champions structure, Fields of Conflict production structure, and venue dossier organization into [Protected Decisions](V3_PROTECTED_DECISIONS.md). Definitions and approval boundaries live there. These historical creative/structural approvals do not establish current runtime or physical-device acceptance. The retained source snapshot below must be read alongside the later milestones above.

| Surface | PASS 6 source-verified snapshot |
| --- | --- |
| Daïion / Wrestling landing | Implemented/current. |
| Hall of Crusades / Shows | Implemented/current. |
| Hall of Champions / People | Implemented/current. |
| Fields of Conflict / Venues | Partial/in progress: some coordinate configuration remains temporary. |
| Person dossier | Implemented/current. |
| Venue dossier | Implemented/current with partial-data fallback. |
| Show / Campaign detail | Implemented/current. |
| Match dossier/gallery | Partial/in progress: failure-state behavior remains incomplete. |
| Match photo lightbox | Implemented/current; runtime acceptance still pending. |

The [Route Manifest](V3_ROUTE_MANIFEST.md) owns the exact nine canonical routes, compatibility inputs, retired paths, and API endpoint inventory. [Module Status](V3_MODULE_STATUS.md) records per-surface live/fallback behavior. The earlier [mock inventory](V3_MOCK_DATA_INVENTORY.md) and [Data Contracts](V3_DATA_CONTRACTS.md) remain historical/proposal references, not proof of current API behavior.

Shell integration is source-verified: shared routing/state, browser `popstate` synchronization, Engine/back mappings for drilldowns, and direct mounts that can establish entered-state without Home ignition. **Engine Bar cold-entry / return-Home lifecycle still requires explicit contract verification.**

Some Wrestling module and inline venue code directly mutates Shell classes/datasets. **Architecture review item — not authorization to refactor.** Protected Shell ownership and Engine Bar behavior remain governing rules.

**Historical PASS 6 finding, superseded by the PASS 12 report:** unresolved matches rendered generic `Side Pending` content. This is retained as the reason for subsequent failure-state work, not a current next-task instruction.

**Next Wrestling step:** use current task-specific evidence and pending physical/visual review to select the next surface; do not restart the superseded PASS 6 failure-state recommendation from this snapshot.

## 6. Music Current State

**Next major world after Wrestling**, using proven V3 architecture and reusable workflow.

- Existing documented work: /music landing; /music/bands with radar/list/search; /music/shows; /music/people and person details; band detail and set detail paths.
- Older static/prototype work: landing stats/activity, fixture-backed archives, and set/gallery/lightbox placeholders. The older /music/venues record describes a reserved slot returning to the landing; current behavior needs verification.
- Data/backend readiness: groundwork has progressed per Chris; exact frontend/API integration and deployed contract compatibility remain unverified here.
- Unfinished experience work: Music completion/polish and per-surface acceptance still follow Wrestling; existing routes are not evidence of finished experiences.

Status: **Documented implementation — runtime verification pending**. Sources: [Route Manifest](V3_ROUTE_MANIFEST.md), [Module Status](V3_MODULE_STATUS.md), and [Mock inventory](V3_MOCK_DATA_INVENTORY.md). Their older status statements are not promoted to fresh runtime facts.

## 7. Backend / Data State

PostgreSQL/VMPix-Data remains the backend source of truth. Chris reports substantially completed major Music/Wrestling data groundwork beyond initial mock-only planning.

Relationship architecture is documented through stable IDs, venue joins, shows/matches/people, winners, tags, and derived counts. Earlier frontend adapters and backend-shaped snapshots are recorded; diagnostics requirements and editing safeguards are documented in the [Admin Editing Roadmap](V3_ADMIN_EDITING_ROADMAP.md).

Wrestling frontend bindings to `https://vmpix-data.onrender.com` are source-verified: shows/people/venues statistics and database endpoints. **Source binding verified; remote service success was not runtime-tested in PASS 6.** See the [endpoint inventory](V3_ROUTE_MANIFEST.md) and [surface fallback summary](V3_MODULE_STATUS.md). Deployed diagnostics, payload compatibility, and non-Wrestling integration remain **verification pending**. Do not infer that every surface is live or treat historical mock envelopes as live responses.

## 8. QA State

The [QA Skill](../.agents/skills/v3-qa/SKILL.md) selects proportional checks; the [existing harness](../scripts/v3-qa.js), exposed by [package.json](../package.json), executes them using Playwright. These mechanisms are operational, not future work.

| Mode | Current role |
| --- | --- |
| `npm run v3:qa -- smoke` | Existing route smoke coverage; default when no mode is supplied. |
| `npm run v3:qa -- route /wrestling/shows` | One route at 360×800, 412×915, and 1920×1080, each with normal and reduced motion: six health checks. |
| `npm run v3:qa -- wrestling` | Current Wrestling smoke cases plus generic gateway/Hall/show health. |
| `npm run v3:qa -- all` | Complete existing E2E suite plus generic routes; includes legacy assertions and is not the default for surgical changes. |

Generic health covers rendering, application runtime errors, horizontal overflow, accessible control bounds, and scrolling. It does not establish data correctness, full accessibility, interaction/animation quality, or physical-device acceptance. Supplement it with relevant browser gestures, visible-pixel/frame inspection, failure checks, and device evidence. Existing failure screenshots/traces support diagnosis; reports may be replaced by later runs.

**Recorded results, not reruns in PASS 26:** PASS 17 reached **37/37 green smoke checks** after the missing-venue defect was fixed, without weakening its assertion. PASS 19–24 and the rail-breakpoint follow-up repeatedly used successful scoped route-health runs and independent browser checks. The follow-up recorded **12/12** Hall/show checks and **565 transition frames** at 412px and 591px. These results describe those tested builds and routes, not a current all-suite or deployment guarantee.

**Remaining test drift:** Wrestling mode explicitly excludes the legacy people-responsive, venues-responsive, and relationship-hooks specs; they remain available unchanged in `all`/`test:e2e`. Retired selectors/routes and old viewport/placeholder assumptions still require incremental modernization when relevant work touches them. Home/Calendar assertions also need triage. The PASS 6 absence of verified 1920px/reduced-motion coverage is historical; the generic layer now supplies both, without modernizing every specialized test.

Physical Samsung S25 Ultra, iPhone Safari, and embedded-webview verification remain separate from viewport emulation. Chris's supplied recordings/screenshots prompted follow-up fixes; they do not automatically approve the resulting builds. Final cinematic/device acceptance for recent Hall refinements remains pending. Use the [animation checklist](CODEX_UI_ANIMATION_CHECKLIST.md) and keep source, browser, automated-test, physical-device, and human-visual evidence distinct.

## 9. Current Known Unresolved Decisions

- Calendar / Trajectory / Comms creative ownership.
- Engine Bar cold-entry / return-Home contract.
- Home terminology alignment.
- Wrestling identifier mapping, including person_id versus wrestling_person_id, requiring verification.

None is resolved here. They do not block unrelated development; raise them when the next task depends on a decision.

## 10. Near-Term Development Sequence

1. Use the operational AI/Codex workflow for normal Experience Build; keep optional upgrades separately scoped.
2. Resume the current Wrestling Experience Build surface; identify its exact next story beat and acceptance criteria before editing.
3. Complete and sign off Wrestling surfaces.
4. Build Music using proven V3 architecture and reusable workflow.
5. Expand remaining Portfolio worlds/modules.
6. Finish indexes/details/galleries/utilities as required.
7. Complete integrated QA and launch preparation.

Future stages are direction, not blanket implementation or deployment approval.

## 11. Current AI Development Workflow

### Operational now

The engineering workflow upgrade is **substantially complete for normal Experience Build use**; optional enhancements are not all complete.

- [AGENTS.md](../AGENTS.md) supplies inherited operating rules; the [short pass template](CODEX_PASS_TEMPLATE.md) supplies task-specific scope and acceptance criteria.
- [$v3-qa](../.agents/skills/v3-qa/SKILL.md) provides reusable QA selection/reporting. `npm run v3:qa` provides execution; modes and evidence limits are summarized in §8.
- [V3 Module Blueprint](V3_MODULE_BLUEPRINT.md), created in PASS 25, defines reusable gateways, indexes, details, media, Shell/Engine, data/recovery, responsive, and signoff contracts for Music and future Portfolio worlds. It preserves each world's independent creative identity.

| Project role | Responsibility |
| --- | --- |
| [v3_scout](../.codex/agents/v3-scout.toml) | Investigate the actual path and evidence; recommend minimum scope; no implementation. |
| [v3_builder](../.codex/agents/v3-builder.toml) | Designated, sole application-writing subagent; implement authorized changes and in-scope corrections. |
| [v3_qa](../.codex/agents/v3-qa.toml) | Independently verify with the Skill/harness/browser tools; ordinary QA artifacts allowed, no application/test/documentation repairs. |
| [v3_reviewer](../.codex/agents/v3-reviewer.toml) | Review the final diff and QA evidence; no writes. Technical review does not replace Chris's approval. |

The parent coordinates Scout → Builder → QA → Reviewer when appropriate, chooses proportional checks, and relays findings directly. For an in-scope defect, return it to Builder, then QA retests before review/handoff. Chris need not relay routine findings. Not every pass needs all four roles; no competing implementations or silent scope expansion.

### Runtime and implementation evidence

PASS 18 created the four project role definitions. PASS 18B successfully ran all four named read-only delegation exercises; PASS 19–24 and the rail follow-up used the roles for real Wrestling diagnosis, implementation, independent QA, and final review. Recent examples include measured carousel opacity continuity, prepared-dossier geometry/visibility handoff, fade completion before cleanup, and rail breakpoint verification. Review verdicts retained **human visual review required** where applicable.

Runtime qualification: delegated task names and role-instruction use were verified. Automatic TOML configuration application, effective model/reasoning, role-specific sandbox enforcement, and interactive `/agent` switching were not established by PASS 18B. Successful role-guided delegation is not proof of those unavailable metadata or enforcement details.

Repository files verify the workflow's definitions and commands in PASS 26. Execution outcomes above come from completed pass reports in this task history; no browser/E2E or physical-device runs occurred in this documentation pass.

### Remaining upgrade items

- Reusable visual baseline/reference workflow remains pending; individual screenshots/frame comparisons are not that complete system.
- Render workflow integration remains pending as an upgrade; this is not a claim that the existing deployment is absent or broken.
- Stale-test modernization remains incremental and scoped.
- Optional hooks, worktree, and security workflow enhancements remain future work.
- A creative/lore agent layer is intentionally deferred; creative canon and Chris's authority remain unchanged.

These are recorded follow-ups, not permission to design or implement them in this pass.

## 12. Update Policy

Update this record when a route is promoted, a page signed off, a protected experience added, a module completed, a major QA milestone achieved, the phase changed, or significant implementation status changed. Do not update for every tiny CSS adjustment.

Refresh the review date and identify the source or verification evidence; keep approval, implementation, runtime evidence, pending QA, and future work separate. Reconcile older status/history documents in later targeted passes, not through assumed completion.
