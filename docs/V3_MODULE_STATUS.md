# V3 Module Status

## Authority and status dimensions

Classification: **CURRENT / SPECIALIZED** readiness reference under [PROJECT_RULES.md](PROJECT_RULES.md). Wrestling entries reflect PASS 6 source inspection, synchronized in PASS 7 (2026-09-10). Other module entries remain retained snapshots needing current verification. Source presence does not establish runtime/browser success, physical-device QA, or human creative signoff; those are separate evidence stages.

Keep implementation readiness, route handling, creative canon/protection, and QA/signoff separate. "active" here is not World Bible's in-world ACTIVE label or a signed-off experience. World Bible records Home and Interactive Portfolio as protected and focuses current creative work on The Story, The Trajectory, and The Comms. The older Portfolio card-launcher wording remains an unverified snapshot, not an instruction to rebuild protected work. Current scheduling is recorded in [Current State](CURRENT_STATE.md); Wrestling source status is detailed below.

This document tracks current V3 module readiness. It is documentation only and does not create modules, edit app code, change routes, wire APIs, or add dependencies.

## Status Labels

- `active`: Present in the current V3 frontend experience.
- `placeholder`: Present as a partial shell view, prototype, or planned surface, but incomplete.
- `future`: Planned but not currently implemented as a ready V3 module.
- `none`: Retained per-row API snapshot for modules outside this Wrestling verification; not a global claim that V3 has no API integration.
- `partial/in progress`: Implementation exists but a specific experience or data-state gap remains.
- `source-bound`: Frontend API binding verified in source; remote success untested.

## Module Status Table

| Module | Status | UI status | API status | Mobile status | Notes | Next planned work |
| --- | --- | --- | --- | --- | --- | --- |
| Homepage | active | Active shell entry screen. | none | Needs continued Samsung S25 Ultra and webview QA. | Normalized to `/`; starts the V3 shell experience. | Keep homepage stable while route and module expansion continues. |
| Portfolio Hub | active | Active hub screen. | none | Needs continued mobile/webview QA. | Routed at `/portfolio`; module cards launch current module views. | Preserve hub as the shell-owned module launcher and avoid route-specific layout forks. |
| Music Nexus | active | Active static landing entry point. | none | Landing shell has focused mobile, tablet, desktop, and webview QA coverage. | Routed at `/music`; band/radar/list/search views live under `/music/bands`. Static stats and latest activity remain placeholder-only in v1. | Continue separating module behavior from shell routing while preparing for backend data adapters. |
| Music Bands | active | Existing bands route surface. | none | Needs future Bands Archive/Radar QA when that pass begins. | Routed at `/music/bands`; future radar implementation belongs here, not on `/music`. | Build the approved Bands Archive work without changing the landing route contract. |
| Music Shows | active | Active section inside Music Nexus. | none | Needs future archive-specific hardening. | Routed at `/music/shows`. | Harden empty/loading/error states before live API integration. |
| Music People | active | Active section inside Music Nexus. | none | Needs mobile QA for list density, touch targets, and view transitions. | Routed at `/music/people`. | Harden empty/loading/error states before live API integration. |
| Music Person Detail | active | Active dynamic detail view. | none | Needs mobile QA for long content, media, and back behavior. | Routed by `/music/people/:personId`; `/music/people/adam-begin` is the documented example route. | Validate canonical person IDs and backend-ready detail data shape. |
| Music Venues | placeholder | Route slot exists, but the venues archive screen is intentionally not built in Landing v1. | none | Needs future archive-specific mobile/tablet/desktop QA. | `/music/venues` is reserved and currently returns to the static Music Nexus landing shell. | Build the Venues Archive only after the landing v1 handoff. |
| Wrestling | active; completion partial | Current Daïion, archives, dossiers, and lightbox; see surface table. | source-bound; mixed fallback behavior | Current target matrix and physical-device acceptance pending. | Nine canonical routes in the [Route Manifest](V3_ROUTE_MANIFEST.md). | Verify match failure cases in-browser, then one recoverable unavailable state if needed and scoped. |
| Calendar | placeholder | Shell view exists from navigation and direct route. | none | Needs mobile-first buildout and safe-area QA. | Routed at `/calendar`. | Define calendar data boundaries and prepare loading/empty/error states. |
| About | placeholder | Shell view exists from navigation and direct route. | none | Needs mobile readability and webview QA. | Routed at `/about`. | Finalize V3 content treatment. |
| Contact | placeholder | Shell view exists from navigation and direct route. | none | Needs form/control QA if interactive fields are added. | Routed at `/contact`. | Define contact behavior without backend assumptions. |
| Admin Shell | future | Static/prototype area exists under `admin/index.html`; protected V3 admin shell is not active. | none | Needs future operational mobile/tablet/desktop planning. | `/admin` is documented as a future protected route; current shell navigation uses `./admin/index.html`. | Build only after shell, routing, viewport, and public module rules are stable and explicit approval is given. |

## Wrestling Surface Readiness — PASS 6 Source-Verified

All implementation statuses below leave runtime/browser acceptance, physical-device QA, and human creative signoff pending unless separately documented. Existing creative protections remain unchanged.

| Surface | Implementation status | Data / fallback summary |
| --- | --- | --- |
| Daïion | Implemented/current | API statistics; unavailable values can display as N/A. |
| Hall of Crusades | Implemented/current | API-backed shows; empty/error handling rather than mock replacement on request failure. |
| Hall of Champions | Implemented/current | API-backed people; cached records may remain after failure, otherwise error state. |
| Fields of Conflict | Partial/in progress | Local venue/coordinate configuration; some coordinates remain temporary. |
| Person dossier | Implemented/current | People API plus shows API for participant history. |
| Venue dossier | Implemented/current with partial-data fallback | Venue/show API records combined with local venue configuration. |
| Show / Campaign detail | Implemented/current | Shows API-backed detail. |
| Match dossier/gallery | Partial/in progress | Show/match/photo data; unresolved match falls back to generic `Side Pending`. Failure-state behavior remains incomplete. |
| Match photo lightbox | Implemented/current; runtime acceptance pending | Shows API photo data; runtime navigation and acceptance remain to be verified. |

Bindings use `https://vmpix-data.onrender.com`; the six exact endpoints are owned by the [Route Manifest](V3_ROUTE_MANIFEST.md). **Source binding verified; remote service success was not runtime-tested in PASS 6.**

Shared Shell route/state integration, `popstate`, Engine/back mappings, and direct mounts establishing entered-state without Home ignition are source-verified. **Engine Bar cold-entry / return-Home lifecycle still requires explicit contract verification.** Some Wrestling/inline venue code directly mutates Shell classes/datasets: **Architecture review item — not authorization to refactor.**

### QA evidence and next unfinished surface

Existing test source includes route navigation, detail drilldowns, photo navigation/back, overflow, touch targets, console errors, and empty/delayed/missing-data cases. PASS 6 and PASS 7 did not run tests. Known gaps: the "S25 Ultra" test uses 384×854, no verified 1920×1080 Wrestling coverage was found, explicit reduced-motion assertions were not found, and some selectors/routes/assertions target replaced UI. Webview emulation is not physical webview verification. Standard targets remain 360×800, 412×915, and 1920×1080; no current pass is claimed. See [Current State](CURRENT_STATE.md) for QA and unresolved decisions.

**Fact:** Match dossier/gallery failure-state behavior remains incomplete (`Side Pending` fallback). **Recommendation:** verify missing-show, missing-match, and timeout behavior in-browser, then implement one clear recoverable unavailable state if needed in a separately scoped pass. No implementation is started here.

## Cross-Module Rules

- The shell owns route changes, layout, transitions, navigation, viewport behavior, overlays, and global shell state.
- Modules stay independent and own only content, local drilldowns, data rendering, loading states, empty states, and error states.
- VMPix-Data is the backend/API source of truth.
- Keep frontend work static-first by default. Existing Wrestling bindings are recorded above; additional live integration still requires explicit approval.
- Do not add frameworks or dependencies without explicit approval.
- Do not touch V2 or live-site systems as part of V3 module work.
