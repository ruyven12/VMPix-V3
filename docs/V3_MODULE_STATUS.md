# V3 Module Status

This document tracks current V3 module readiness. It is documentation only and does not create modules, edit app code, change routes, wire APIs, or add dependencies.

## Status Labels

- `active`: Present in the current V3 frontend experience.
- `placeholder`: Present as a partial shell view, prototype, or planned surface, but incomplete.
- `future`: Planned but not currently implemented as a ready V3 module.
- `none`: No live API integration currently exists in VMPix-V3.

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
| Wrestling Nexus | placeholder | Shell/module view exists from the portfolio card and direct route. | none | Needs mobile-first buildout and route QA. | Routed at `/wrestling`. | Complete the V3 wrestling module surface when approved. |
| Calendar | placeholder | Shell view exists from navigation and direct route. | none | Needs mobile-first buildout and safe-area QA. | Routed at `/calendar`. | Define calendar data boundaries and prepare loading/empty/error states. |
| About | placeholder | Shell view exists from navigation and direct route. | none | Needs mobile readability and webview QA. | Routed at `/about`. | Finalize V3 content treatment. |
| Contact | placeholder | Shell view exists from navigation and direct route. | none | Needs form/control QA if interactive fields are added. | Routed at `/contact`. | Define contact behavior without backend assumptions. |
| Admin Shell | future | Static/prototype area exists under `admin/index.html`; protected V3 admin shell is not active. | none | Needs future operational mobile/tablet/desktop planning. | `/admin` is documented as a future protected route; current shell navigation uses `./admin/index.html`. | Build only after shell, routing, viewport, and public module rules are stable and explicit approval is given. |

## Cross-Module Rules

- The shell owns route changes, layout, transitions, navigation, viewport behavior, overlays, and global shell state.
- Modules stay independent and own only content, local drilldowns, data rendering, loading states, empty states, and error states.
- VMPix-Data is the future backend/API source of truth.
- Keep frontend work static-first until live data integration is explicitly approved.
- Do not add frameworks or dependencies without explicit approval.
- Do not touch V2 or live-site systems as part of V3 module work.
