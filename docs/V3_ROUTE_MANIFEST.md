# V3 Route Manifest

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
| `/wrestling` | Wrestling Nexus | active | History API route handled by the shell router. | Opens the current Ring Archive shell view. |
| `/calendar` | Calendar | active | History API route handled by the shell router. | Opens the current Calendar shell view. |
| `/about` | About | active | History API route handled by the shell router. | Opens the current About shell view. |
| `/contact` | Contact | active | History API route handled by the shell router. | Opens the current Contact shell view. |
| `/admin` | Admin Shell | future | Main shell navigation currently sends admin traffic to `./admin/index.html`; `/admin` is not currently an SPA route. | Future protected admin route should live inside the V3 route contract. |

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

No live backend API is wired into VMPix-V3 yet. VMPix-Data remains the backend/API source of truth. These API route bases are planning targets for future integration and should not be implemented in frontend-only work.

| API base route | Status | Intended ownership | Notes |
| --- | --- | --- | --- |
| `/api` | future | VMPix-Data | General backend API base. |
| `/api/music` | future | VMPix-Data | Music data base route. |
| `/api/music/people` | future | VMPix-Data | Music people collection route. |
| `/api/music/people/:personId` | future | VMPix-Data | Music person detail route. |
| `/api/wrestling` | future | VMPix-Data | Wrestling data base route. |
| `/api/calendar` | future | VMPix-Data | Calendar/event data base route. |
| `/api/admin` | future | VMPix-Data | Protected admin/operations API base. |

## Known Route Behavior

- The router uses the History API for active SPA routes.
- The router normalizes trailing slashes and treats `/index.html` as `/`.
- Active route parsing currently lives in `js/router.js`; route path constants currently live in `js/state.js`.
- Unknown direct routes fall through to home-shell rendering; the URL may remain the unknown path unless canonicalization is added.
- Browser `popstate` is handled by the shell and resyncs the active route state.
- `/wrestling`, `/calendar`, `/about`, and `/contact` currently exist as shell-routed public views.
- Admin navigation currently targets `./admin/index.html`, not the `/admin` SPA route.
- Future route work must keep the shell as the owner of routing, layout, navigation, transitions, and viewport behavior.
