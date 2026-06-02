# V3 Mock Data Inventory

Pass: Mock Data Cleanup - Pass 1: Inventory Current Mock Data  
Scope: public V3 frontend shell, Portfolio Hub, Music, Wrestling, Calendar, About, Contact, and shared shell/navigation systems.  
Status: documentation only. No mock data was removed, no routes were changed, and no live API wiring was introduced.

## Inventory Rules

- Preserve current static-first visual behavior until a replacement pass is approved.
- Treat `js/state.js` as the current primary fixture source for module data.
- Treat `index.html` as the current primary source for static placeholder markup and card copy.
- Treat `modules/music.js` and `modules/wrestling.js` as render/adapter logic that sometimes creates additional temporary relationship snapshots.
- Keep backend shape comparison aligned with `docs/V3_DATA_CONTRACTS.md`.

## Primary Fixture Locations

| Area | File | Current mock/static data | Notes |
| --- | --- | --- | --- |
| Shared shell/navigation | `js/state.js` | `shellDrawerGroups`, `shellRouteRegistry`, breadcrumb/back route maps | Shell metadata is intentional static navigation data, not content data. Future placeholder status lives here. |
| Portfolio Hub | `index.html` | Hub cards, future module cards, world activity list, spotlight seed copy | Static markup. Future card naming is not fully aligned with the route registry. |
| Portfolio Hub spotlight | `js/state.js` | `spotlightContent` | Used by shell carousel focus. Small static copy/tag object. |
| Future module placeholder | `index.html`, `js/state.js` | `module-placeholder` markup, `modulePlaceholderContent = {}` | Placeholder surface exists, but content registry is empty. Current future hub cards are not active click targets. |
| Music landing | `index.html` | Landing stats, entry cards, latest activity cards | Static markup counts and copy. Not sourced from `musicBandIndexRows` or show/person fixtures. |
| Music activity rows | `js/state.js` | `musicActivityContent` | Placeholder row strings for bands, shows, people, venues. |
| Music bands | `js/state.js` | `musicBandIndexRows` | 12 fake bands using camelCase fields. Drives bands radar/list/search/detail routes. |
| Music people | `js/state.js` | `musicPeopleRows`, `musicPeoplePageSize` | 10 fake people plus pagination size. Drives people index. |
| Music person detail | `js/state.js` | `musicPersonDetailPlaceholder`, `musicPersonDetailStateCopy` | Single Adam Begin detail fixture plus loading/error copy. Unknown people fall back to state copy. |
| Music shows | `js/state.js`, `modules/music.js` | `musicShowsArchiveRows`, `musicShowsYearOptions`, `musicShowsStateCopy`, `musicShowsMonthOrder` | 6 fake show rows plus filter/state helpers. |
| Music show relationship snapshots | `modules/music.js` | `getMusicShowBandRelationships`, `getMusicShowMediaRelationships`, `getMusicShowTags`, `getMusicShowRelationshipSnapshot` | Generated temporary relationship objects mix backend-style snake_case with frontend camelCase source rows. |
| Music set/gallery placeholders | `index.html`, `js/state.js`, `modules/music.js` | Static set rows in HTML, `mockSetCodes`, gallery placeholder image/count constants | Static HTML dataset values are treated as source rows by module code. |
| Wrestling landing | `index.html` | Landing stats, entry cards, latest activity cards | Static markup counts and copy. Not derived from wrestling fixture arrays. |
| Wrestling people | `js/state.js` | `wrestlingPeopleRows` | 6 fake people/official records with relationship ID arrays. |
| Wrestling person history | `js/state.js` | `wrestlingPersonEventHistoryRows` | 4 fake event/match relationship rows used by person detail surfaces. |
| Wrestling venues | `js/state.js` | `wrestlingVenueRows` | 6 fake venue records with show/match/contributor links. |
| Wrestling venue history | `js/state.js` | `wrestlingVenueEventHistoryRows` | 3 fake event rows used by venue detail surfaces. |
| Wrestling show relationships | `js/state.js` | `wrestlingShowRelationshipRows` | 7 fake show relationship rows used by show detail/gallery routing. |
| Wrestling match relationships | `js/state.js` | `wrestlingMatchRelationshipRows` | 10 fake match relationship rows used by gallery/lightbox relationship hooks. |
| Wrestling relationship datasets | `modules/wrestling.js` | `setWrestlingRelationshipDataset` with `placeholder-v1` | Converts fixture relationships into DOM dataset hooks. This is a useful adapter boundary for later cleanup. |
| Calendar | `index.html` | Upcoming event cards | Static markup with real-looking event names/status labels. No JS data source yet. |
| About | `index.html` | About page copy | Static content, not mock records. Should be reviewed as editorial content rather than fixture data. |
| Contact | `index.html` | Contact form shell and method cards | Static form shell with no submit integration and static contact method labels. |
| Assets | `assets/media/placeholders/archive-gallery-placeholder.svg` | Placeholder gallery image | Shared fallback/placeholder media for music gallery/lightbox surfaces. |

## Static Markup Hotspots

- `index.html:55` through the Portfolio Hub cards contains static module cards and future-world cards.
- `index.html:99` through the Portfolio Hub context contains static world activity and spotlight seed markup.
- `index.html:134` contains the shared module placeholder surface.
- `index.html:164` through the Music landing activity section contains hardcoded Music stats and latest activity cards.
- `index.html:602` contains fallback Music activity rows that are replaced by JS for module views.
- `index.html:1099` through `index.html:1106` contains eight static gallery photo placeholder buttons.
- `index.html:1274` through the Ring Archive activity section contains hardcoded Wrestling stats and latest activity cards.
- `index.html:1407` through `index.html:1482` contains static Wrestling show filter/sort/pagination placeholder chrome.
- `index.html:1531` and `index.html:1607` contain static Wrestling match/photo placeholder lists.
- `index.html:1708` contains static Calendar event cards.
- `index.html:1720` through Contact contains static About/Contact content and form shell.

## Duplicated Or Overlapping Mock Structures

- Music landing stats duplicate concepts from `musicBandIndexRows`, `musicShowsArchiveRows`, `musicPeopleRows`, and venue placeholders, but the counts are independent hardcoded display numbers.
- Ring Archive landing stats duplicate concepts from `wrestlingPeopleRows`, `wrestlingVenueRows`, `wrestlingShowRelationshipRows`, and `wrestlingMatchRelationshipRows`, but the counts are independent hardcoded display numbers.
- Music show venue data appears as display strings in `musicShowsArchiveRows`, generated `venue_id` values in `getMusicShowRelationshipSnapshot`, and static Music venue markup in `index.html`.
- Music gallery placeholder media appears in repeated static gallery buttons, `galleryImageFallbackSrc`, lightbox labels, and generated media relationship snapshots.
- Wrestling event/show relationship data overlaps across `wrestlingPersonEventHistoryRows`, `wrestlingVenueEventHistoryRows`, `wrestlingShowRelationshipRows`, and `wrestlingMatchRelationshipRows`.
- `taggedPeople` appears in several Wrestling arrays with the same conceptual meaning but slightly different role/count values depending on the surface.
- Future module naming is duplicated between hub cards and `shellRouteRegistry`, with inconsistent labels/IDs.

## Outdated Or Inconsistent Names

- Portfolio Hub has `data-module-card="skies-above"` and visible label `Skies Above`; the current route registry uses `astrophotography` and `sunset` as future placeholders.
- Music route registry includes `/music/venues`, but the route currently returns to the Music landing shell instead of a dedicated venues archive.
- `modulePlaceholderContent` exists but is empty, while the HTML placeholder surface has default copy.
- Music people rows use `band` as a display string; planned contracts prefer `band_ids`.
- Music band rows use `albums` as the count field even though the UI treats it like archive/set volume in several places.
- Music show rows use `bandCount` as a display string such as `8 bands`; planned contracts prefer numeric `band_ids` and `photo_count`.
- Music person detail uses `associatedBands` as display names and `taggedShows` as embedded objects; planned contracts prefer stable `band_ids`, `show_ids`, and `tagged_show_ids`.
- Wrestling people rows use generic `personId`; planned contracts distinguish `wrestling_person_id`.
- Wrestling show relationship rows use `showId`; planned contracts distinguish `wrestling_show_id`.
- Wrestling match rows do not include backend-style `participants`, `winners`, `result`, or `match_order`.
- Several event dates are display strings such as `May 8th, 2026`; planned contracts prefer ISO `event_date`.

## Backend Shape Mismatches To Track

- Current frontend fixtures mostly use camelCase IDs (`bandId`, `personId`, `showId`, `venueId`, `matchId`), while planned backend JSON uses snake_case stable IDs (`band_id`, `person_id`, `show_id`, `venue_id`, `match_id`).
- Music show snapshots generated in `modules/music.js` already emit some snake_case keys (`show_id`, `venue_id`, `band_ids`, `media_ids`, `archive_meta`), but they are derived from camelCase frontend rows and display strings.
- Music fixture rows often store display-ready labels instead of canonical IDs, especially for venues, locations, counts, roles, and dates.
- Wrestling fixtures are closer to relationship data but still do not match the planned match/show contracts exactly.
- Counts (`photos`, `sets`, `matches`, `eventCount`, `photoCount`, landing stats) are hand-maintained frontend values, not validated backend rollups.
- Placeholder media uses labels and generated IDs, not backend media objects with URLs, media IDs, dimensions, captions, and source metadata.

## Out Of Public Scope But Found

- `admin/index.html` contains `mockDashboard` and static admin prototype copy. It was found during search, but the current pass scope is the public V3 frontend modules and shell.
- `tests/e2e/*` contains placeholder assertions and route smoke coverage. These are test fixtures/expectations, not user-facing module data.
- `qa-temp/**` contains generated browser profiles, screenshots, and logs. These are ignored for inventory purposes.

## Recommended Cleanup Order For Later Passes

1. Move public content fixtures out of `js/state.js` into module-scoped mock files or JSON-like data sections.
2. Align future module IDs between Portfolio Hub cards and `shellRouteRegistry`.
3. Normalize Music show/people/band fixtures around stable IDs before live API adapters are introduced.
4. Reduce duplicated Wrestling relationship rows by choosing one canonical mock relationship source per entity type.
5. Convert landing stats to derived values or explicitly mark them as editorial counters.
6. Keep static About/Contact editorial copy separate from data fixtures.
