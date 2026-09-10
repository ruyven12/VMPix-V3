# V3 Route Manifest

## Authority and freshness

Classification: **CURRENT / SPECIALIZED** route reference under [PROJECT_RULES.md](PROJECT_RULES.md). Future public/admin/API targets are **FUTURE / PLANNING**, not implementation permission.

Wrestling routes and API bindings were source-verified in PASS 6 and synchronized in PASS 7 (2026-09-10). "active" does not mean module completeness or runtime success. Runtime/browser verification, physical-device QA, and human creative signoff are separate; one does not imply the next. Non-Wrestling and deployment statements remain retained records needing current verification; Render configuration was not reverified. The future /admin/locks example in the Admin Shell Blueprint is not listed here; reconcile the planned route inventory in a later approved pass, without adding routes now.

This document tracks the intended V3 route map and the current route behavior in the VMPix-V3 frontend repo. It is documentation only and does not create routes, change routing, wire APIs, or alter deployment behavior.

## Status Labels

- `active`: The route or entry point is currently handled by V3 code.
- `placeholder`: The route/module is represented in the V3 experience, but URL behavior or implementation is incomplete.
- `future`: The route is a planned target only.

## Routing Ownership

The V3 shell owns routing, layout, transitions, navigation, viewport behavior, overlays, and global shell state.

Modules own content, local drilldowns, data rendering, loading states, empty states, and error states. Modules must not create competing routers or disconnected app flows.

## Render SPA Fallback Requirement

Render must keep the static SPA fallback enabled so deep links can return the V3 shell instead of a 404.

```text
Source: /*
Destination: /index.html
Action: Rewrite
```

Current `render.yaml` already declares this rewrite behavior.

## Frontend Public Routes

| Route | Target | Status | Current behavior | Notes |
| --- | --- | --- | --- | --- |
| `/` | Homepage | active | Normalized as the home route. `/index.html` is also normalized to `/`. | Shell entry point. |
| `/portfolio` | Portfolio Hub | active | History API route handled by the shell router. | Hub route after portal entry. |
| `/music` | Music Nexus | active | History API route handled by the shell router. | Opens the static Music Nexus landing entry point. |
| `/music/bands` | Music Bands Archive | active | History API route handled by the shell router. | Existing bands route remains separate from the `/music` landing; future radar work belongs here. |
| `/music/shows` | Music Shows Archive | active | History API route handled by the shell router. | Opens Music Nexus with the Shows section selected. |
| `/music/people` | Music People | active | History API route handled by the shell router. | Opens Music Nexus with the People section selected. |
| `/music/people/adam-begin` | Music Person Detail | active | Dynamic person detail route pattern handled by `/music/people/:personId`. | Specific data availability depends on current frontend data. |
| `/music/venues` | Music Venues Archive | placeholder | History API route handled by the shell router and currently returns to the static Music Nexus landing. | URL slot is reserved for the future venues archive; no archive screen is built in Music Nexus Landing v1. |
| `/wrestling` | Daïion | active | Shared Shell route, source-verified in PASS 6. | See the canonical Wrestling map below; runtime acceptance pending. |
| `/calendar` | Calendar | active | History API route handled by the shell router. | Opens the current Calendar shell view. |
| `/about` | About | active | History API route handled by the shell router. | Opens the current About shell view. |
| `/contact` | Contact | active | History API route handled by the shell router. | Opens the current Contact shell view. |
| `/admin` | Admin Shell | future | Main shell navigation currently sends admin traffic to `./admin/index.html`; `/admin` is not currently an SPA route. | Future protected admin route should live inside the V3 route contract. |

## Canonical Wrestling Routes — PASS 6 Source-Verified

| Route | Current surface | Route status |
| --- | --- | --- |
| `/wrestling` | Daïion landing | active |
| `/wrestling/shows` | Hall of Crusades | active |
| `/wrestling/shows/:dateKey` | Show / Campaign detail | active |
| `/wrestling/shows/:dateKey/:matchRef` | Match dossier/gallery | active; failure-state experience partial |
| `/wrestling/shows/:dateKey/:matchRef/photo/:photoId` | Match photo lightbox | active; runtime acceptance pending |
| `/wrestling/people` | Hall of Champions | active |
| `/wrestling/people/:personSlug` | Person dossier | active |
| `/wrestling/venues` | Fields of Conflict | active; coordinate configuration partial |
| `/wrestling/venues/:venueSlug` | Venue dossier | active; partial-data fallback |

### Compatibility and retired inputs

- `/wrestling2` canonicalizes to `/wrestling`.
- `/shows2` and `/wrestling/shows2` canonicalize to `/wrestling/shows`.
- `/wrestling/shows/:dateKey/match/:matchRef` and its `/photo/:photoId` form remain compatibility inputs and canonicalize to the corresponding routes above. Numeric legacy match references become `match-N`.
- `/wrestling/people/proto` is retired and resolves to not-found.
- Venue detail identifiers ending in `2` are retired and resolve to not-found.
- Obsolete internal mount branches are not additional public routes. Compatibility normalization does not resolve the broader Wrestling identifier-mapping question.

### Shell integration

Shared Shell routing/state, browser `popstate` synchronization, and Engine/back mappings for Wrestling drilldowns are present in source. Direct Wrestling mounts can establish entered-state without Home ignition. **Engine Bar cold-entry / return-Home lifecycle still requires explicit contract verification.**

Some Wrestling module and inline venue code directly mutates Shell classes/datasets. **Architecture review item — not authorization to refactor.** Shell ownership remains protected.

See [Current State](CURRENT_STATE.md) for pending browser/device QA and unresolved decisions; route presence is not creative signoff.

## Additional Current Internal Music Routes

These routes are present in current router code even though they were not part of the requested public route list.

| Route | Target | Status | Current behavior | Notes |
| --- | --- | --- | --- | --- |
| `/music/bands?view=radar` | Music Bands Radar | active | Parsed as `music-bands`; view is canonicalized to `radar`, `list`, or `search`. | Bands-specific route state; not mounted on the `/music` landing page. |
| `/music/bands?view=list` | Music Bands List | active | Parsed as `music-bands`. | Query value is normalized. |
| `/music/bands?view=search` | Music Bands Search | active | Parsed as `music-bands`. | Query value is normalized. |
| `/music/bands/:bandId` | Band Detail | active | Dynamic band detail route. | Uses current frontend music data or an unknown-band fallback. |
| `/music/bands/:bandId/sets/:setCode` | Set Detail | active | Dynamic set detail route. | Set code is normalized by the router. |

## Admin Routes

The admin shell exists as a static/prototype area under `admin/index.html`. The following route targets are documented for the future protected admin shell and should not be treated as active SPA routes until explicitly wired.

| Route | Target | Status | Notes |
| --- | --- | --- | --- |
| `/admin` | Admin Shell entry | future | Planned protected admin entry inside the V3 shell contract. |
| `/admin/dashboard` | Admin Dashboard | future | Planned operational overview. |
| `/admin/imports` | Admin Imports | future | Planned import management surface. |
| `/admin/music` | Admin Music | future | Planned music operations surface. |
| `/admin/wrestling` | Admin Wrestling | future | Planned wrestling operations surface. |
| `/admin/relationships` | Admin Relationships | future | Planned relationship and entity management surface. |
| `/admin/stats` | Admin Stats | future | Planned stats/diagnostics surface. |
| `/admin/logs` | Admin Logs | future | Planned operational logging surface. |
| `/admin/settings` | Admin Settings | future | Planned protected settings surface. |

## Backend API Base Routes

VMPix-Data remains the backend/API source of truth. Wrestling frontend bindings use `https://vmpix-data.onrender.com`.

**Source binding verified; remote service success was not runtime-tested in PASS 6.**

| Endpoint | Source-bound Wrestling use |
| --- | --- |
| `/api/wrestling/shows/stats` | Daïion show statistics. |
| `/api/wrestling/people/stats` | Daïion people statistics. |
| `/api/wrestling/venues/stats` | Daïion venue statistics. |
| `/api/wrestling/shows/db` | Shows, show/match/photo drilldowns, person history, and venue show history. |
| `/api/wrestling/people/db` | Hall of Champions and person dossier. |
| `/api/wrestling/venues/db` | Venue records/detail alongside local configuration. |

Statistics can show unavailable values; lists/detail surfaces include empty/error, cached, or partial-data behavior. Venue configuration remains partly local, and unresolved matches use a generic `Side Pending` fallback. See [Module Status](V3_MODULE_STATUS.md) for the surface summary. These bindings do not establish remote availability or payload compatibility.

The following broader base-route inventory retains historical planning labels outside Wrestling; those areas were not re-audited. No new integration is authorized.

| API base route | Status | Intended ownership | Notes |
| --- | --- | --- | --- |
| `/api` | future | VMPix-Data | General backend API base. |
| `/api/music` | future | VMPix-Data | Music data base route. |
| `/api/music/people` | future | VMPix-Data | Music people collection route. |
| `/api/music/people/:personId` | future | VMPix-Data | Music person detail route. |
| `/api/wrestling` | source-bound children | VMPix-Data | Namespace for the six verified bindings above; no standalone base-endpoint success claimed. |
| `/api/calendar` | future | VMPix-Data | Calendar/event data base route. |
| `/api/admin` | future | VMPix-Data | Protected admin/operations API base. |

## Known Route Behavior

- The router uses the History API for active SPA routes.
- The router normalizes trailing slashes and treats `/index.html` as `/`.
- Active route parsing currently lives in `js/router.js`; route path constants currently live in `js/state.js`.
- Unknown Wrestling paths resolve to route-level not-found. The older blanket home-shell fallback description does not describe current Wrestling handling; other unknown-route behavior was not reverified.
- Browser `popstate` is handled by the shell and resyncs the active route state.
- `/wrestling`, `/calendar`, `/about`, and `/contact` currently exist as shell-routed public views.
- Admin navigation currently targets `./admin/index.html`, not the `/admin` SPA route.
- Future route work must keep the shell as the owner of routing, layout, navigation, transitions, and viewport behavior.
