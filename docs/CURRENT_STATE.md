# V3 Current State

## 1. Document Status

- Project: Website-V3 / VMPix-V3
- Purpose: Current project-state snapshot
- Status: Active / frequently updated
- Last reviewed: 2026-09-10
- Basis: Chris's PASS 5 direction, PASS 6 Wrestling source inspection, and PASS 7 documentation synchronization (2026-09-10). No browser, remote-service, or physical-device validation was performed in PASS 6 or PASS 7.

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

## 5. Wrestling Current State

PASS 6 confirms a current Shell-integrated implementation with frontend API bindings, beyond the earlier mock-only inventory. These statuses describe source implementation, not runtime acceptance or human visual signoff.

| Surface | Source-verified status |
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

**Factual unfinished area:** Match dossier/gallery failure-state behavior remains incomplete. An unresolved match falls back to a generic `Side Pending` record.

**Recommended next Wrestling implementation pass:** verify missing-show, missing-match, and timeout behavior in-browser, then implement one clear recoverable unavailable state if needed. This recommendation does not start or authorize implementation.

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

Current target matrix supplied by Chris:

- 360×800.
- 412×915 — primary Samsung S25 Ultra-sized target.
- 1920×1080.
- iPhone Safari; Facebook, Messenger, and Instagram webviews.

PASS 6 inspected test assertions for Wrestling route navigation, detail drilldowns, photo navigation/back, overflow, touch targets, console errors, and empty/delayed/missing-data cases. These are coverage in test source, not passing results; no tests were run in PASS 6 or PASS 7.

Known drift/gaps: the existing "S25 Ultra" test uses 384×854 rather than 412×915; no verified 1920×1080 Wrestling coverage was found; explicit reduced-motion assertions were not found; some selectors, routes, and assertions target replaced UI. The standard 360×800, 412×915, and 1920×1080 targets remain required, with no current pass claimed. Webview emulation is not physical webview verification. Remote API success and missing-show/missing-match/timeout recovery still need browser verification. Older Music coverage remains unverified here.

Physical-device QA: tracked separately from viewport emulation; Home final mobile validation remains pending in its source. Other device coverage requires confirmation.

Subjective animation signoff: Chris's review is required for cinematic feel, animation quality, and device-specific visual judgment; recordings support it. Existing creative approvals remain protected. Use the [UI Animation Checklist](CODEX_UI_ANIMATION_CHECKLIST.md); record tested build, target, result, and evidence when verification occurs.

## 9. Current Known Unresolved Decisions

- Calendar / Trajectory / Comms creative ownership.
- Engine Bar cold-entry / return-Home contract.
- Home terminology alignment.
- Wrestling identifier mapping, including person_id versus wrestling_person_id, requiring verification.

None is resolved here. They do not block unrelated development; raise them when the next task depends on a decision.

## 10. Near-Term Development Sequence

1. Finish the AI/Codex workflow upgrade.
2. Resume the current Wrestling Experience Build surface; identify its exact next story beat and acceptance criteria before editing.
3. Complete and sign off Wrestling surfaces.
4. Build Music using proven V3 architecture and reusable workflow.
5. Expand remaining Portfolio worlds/modules.
6. Finish indexes/details/galleries/utilities as required.
7. Complete integrated QA and launch preparation.

Future stages are direction, not blanket implementation or deployment approval.

## 11. Current AI Development Workflow

Root AGENTS.md, governing-document inheritance, and the [concise pass template](CODEX_PASS_TEMPLATE.md) are in place. Surgical file scope and self-verification within approved scope are the current workflow. Reusable skills, subagents, and expanded QA automation are future workflow work, not claimed installed or complete. Tools support implementation and preserve human approval boundaries.

## 12. Update Policy

Update this record when a route is promoted, a page signed off, a protected experience added, a module completed, a major QA milestone achieved, the phase changed, or significant implementation status changed. Do not update for every tiny CSS adjustment.

Refresh the review date and identify the source or verification evidence; keep approval, implementation, runtime evidence, pending QA, and future work separate. Reconcile older status/history documents in later targeted passes, not through assumed completion.
