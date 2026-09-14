# PASS 45 — Wrestling People experience audit

Audit date: 2026-09-14. Build: `960c0d1`. Inspection only. Scout, v3-qa and independent Reviewer; no Builder. Browser evidence uses local Chrome preview with one small live API sample, then saved-response and controlled fixtures. Browser emulation is not physical S25 verification or human visual signoff.

## 1. Files inspected and authority

Application: `modules/wrestling.js`, relevant `css/modules.css`, `js/router.js`, `js/state.js`, `js/shell.js`, `css/shell.css`, shared markup in `index.html`. Coverage: `tests/e2e/wrestling-people-responsive.spec.js`, `wrestling-relationship-hooks.spec.js`, `routes-smoke.spec.js`, `v3-route-health.spec.js`, `scripts/v3-qa.js`, `playwright.config.js`, `package.json`. Governing references: `AGENTS.md`, Project Rules, Experience Build Rules, Current State, Protected Decisions, Module Blueprint, Route Manifest, Module Status and `.agents/skills/v3-qa/SKILL.md`.

Evidence labels: **Browser** means reproduced in this audit; **Source** means inspected, not necessarily observed; **Risk** means needs a targeted affected case. Evidence files are in this directory. No application, CSS, test, documentation or API modifications are authorized or made.

## 2. Hall of Champions status

The canonical `/wrestling/people` route mounts the `wrestling-people-prototype` Hall; `/wrestling/people/:personSlug` mounts the promoted Person Dossier. Prototype naming does not make these dormant components. The old Ring Archive/card-grid renderers and their tests describe a retired surface.

Current Hall includes the pedestal, upper SEARCH/A–Z/CATEGORY/TEAM mode selector, lower value selector, crystal, INTERACT prompt and expandable hologram. A–Z, Category and Team filter the loaded collection locally and offer person selection. **SEARCH is incomplete:** the canonical workspace says AWAITING QUERY / SEARCH WORKSPACE STANDBY, contains zero inputs and has no query handler. A long-query fitting test therefore cannot meaningfully run.

Protected Decisions W8 protects the historically approved promoted Hall structure, including crystal-line anchoring and broad desktop expansion. This does not establish current functional/accessibility/device approval. The Person Dossier is explicitly not automatically protected merely because it exists.

## 3. Pedestal measurements

CSS pixels, settled TEAM mode, normal motion; reduced-motion geometry matched. `x,y; width×height`. SVG bounding rectangles describe decorative shapes, not proof that a rectangular control fits every sloping edge.

| Measured region | 360×800 | 412×915 | 1920×1080 |
|---|---|---|---|
| Complete pedestal SVG | 39.6,493.5; 280.8×228.1 | 45.3,571.5; 321.4×261.1 | 688,554.8; 544×442 |
| Upper decorative outer face | 128.2,621.6; 103.5×55.3 | 146.7,718.1; 118.5×63.3 | 859.7,803.0; 200.6×107.1 |
| Upper decorative inner face | 147.5,630.4; 64.9×40.4 | 168.8,728.2; 74.3×46.2 | 897.1,820.0; 125.8×78.2 |
| Upper control box | 126.6,633.5; 106.7×31.5 | 144.9,731.8; 122.1×36.0 | 856.6,826.2; 206.7×61.0 |
| Upper inner label area | 143.6,634.5; 72.7×29.5 | 161.9,732.8; 88.1×34.0 | 881.2,827.2; 157.6×59.0 |
| Lower decorative step | 87.0,671.6; 186.0×21.1 | 99.5,775.4; 212.9×24.1 | 779.8,899.9; 360.4×40.8 |
| Lower control box | 80.3,675.6; 199.4×20.4 | 91.9,781.2; 228.2×23.3 | 788,911.4; 344×33.3 |
| Lower inner label area | 109.5,676.6; 141.0×18.4 | 125.2,782.2; 161.5×21.3 | 838.3,912.4; 243.5×31.3 |
| Expanded hologram | 14.4,10.0; 331.2×576.5 | 16.5,10.0; 379.0×668.0 | 76.8,63.0; 1766.4×672 |

Control boxes are horizontally centered, but alignment to the viewport is not the same as containment inside the pedestal. Upper boxes are wider than even the outer face bounding rectangle; inner label regions exceed the decorative inner face. The mobile lower box is wider than its step and extends beneath that step; desktop also extends beneath it. Source positions selectors using fractions of the entire SVG bounding box, not the physical trapezoids (`wrestling.js:11342`).

All four upper labels fit their rectangular areas, at **7.36px mobile / 11.52px desktop**. A–Z lower lettering is14.08px mobile /18.88px desktop. The real category Announcers Commentary fits but shrinks to6.88px mobile /9.92px desktop. These are readability concerns even without page overflow.

Controlled long-team string: “The Butcher and the Blade with All Elite Championship Wrestling.” Its text paints247.2px into141.0/161.5px on mobile, and356.4px into243.5px desktop. It is clipped in all six viewport/motion cases. This is a realistic stress fixture, not a claim that the exact string exists in production. Character-count sizing bottoms out without establishing fit. No document-level horizontal overflow was needed for this defect. See `hall-matrix.json` and `hall-*-long-team.jpg`.

## 4. Crystal and hologram

**Browser:** tap, click, Enter and Space activate the native named crystal button. Settled hologram bottom aligns to crystal top within0.01px. Reduced motion settles without the normal entry delay. Normal live sample mounted Hall at784ms and enabled the crystal at2,974ms. Source entry enablement is about2,380ms after its own sequence begins, with210ms mode/reveal timers.

Expansion is one-way in this implementation: activation disables the crystal; Escape does not collapse/reset it. There is no deliberate focus transfer into results. Returning from a person resets Hall to SEARCH/mode0 with expansion unset. Distinguish this observed behavior from an unapproved requirement to add collapse.

## 5. API/loading timings

One representative live cold-context run, milliseconds relative to audit navigation start; timings are observations, not a service SLA. Discovery requests asked for `limit=500`, pages1–3, but the backend reported limit100: page1 contained100 records and the captured full collection296. Person lookup uses limit25; history uses limit100/page1.

| Operation | Request start | Response | Request→response | Readiness observation |
|---|---:|---:|---:|---|
| People discovery page1 | 584 | 4,558 | 3,974 | first usable records4,579 |
| Discovery page2 | 4,569 | 12,051 | 7,482 | last discovery response; separate final paint not instrumented here |
| Discovery page3 | 4,569 | 11,552 | 6,983 | aggregated remainder waits for both pages |
| Aaron Orion identity | 5,238 | 5,755 | 517 | route already canonical at5,258 |
| Aaron Orion history | 5,757 | 6,055 | 298 | starts immediately after identity settles |

Page1 response→usable records was21ms including delivery, normalization and rendering; this is not an isolated parsing benchmark. SEARCH has no operation to time. A–Z/category/team operate locally, not via search API. Identity: `/api/wrestling/people/db?search=…&limit=25&page=1`. History: `/api/wrestling/shows/db?participant=…&sort=date&dir=desc&limit=100&page=1`. Event photo hydration: `/api/wrestling/shows/db?include_photos=1&limit=5&search=…`.

See `live.json` for timestamps, response evidence and zero page errors. Forward in that same session issued no additional API calls. Controlled delays/errors/empty results were then replayed without repeatedly sampling production.

## 6. Cache and request behavior

**Source:** Hall uses a seven-day localStorage cache, memory completion state and in-flight guard. Cached records may render while refreshing. Cold discovery renders page1 before a parallel Promise.all remainder. A failed later discovery page can leave a partial collection labeled live rather than partial. Person identity separately queries despite Hall already having records. Dossier identity/history/photo metadata Maps use a sliding10-minute TTL and20-key cap; these are memory caches, not sessionStorage. Same-person pending guards suppress concurrent duplication. Successful lower-level tagged-photo promises persist longer than that TTL; failures are deleted.

**Browser defects:**
- Delayed identity → leave to Hall: URL remains `/wrestling/people`, but late completion changes title and Engine to Champion Dossier – Aaron Orion and starts a history request off-route. Active-route ownership is not checked by that completion path.
- Identity503 → return to Hall → reopen same Aaron after service recovery: ARCHIVE RECORD UNAVAILABLE remains and no second identity request occurs. Error state is sticky, not recoverable by ordinary reentry.
- Back returns a reset Hall, not the selected mode/expansion. Forward reuses dossier requests in the observed session.

Evidence: `state-fixtures.json`, `delayed-leave.jpg`, `sticky-error.jpg`. Hall failure and true empty have distinct visible presentations; identity empty displays Record Not Found. History starts even when identity fails or is empty, so the dossier can display a failed identity beside loaded timeline content. History error/empty reuse is also source-verified; do not assume it was separately reproduced from the identity fixture.

## 7. Person Detail

Current API-backed dossier includes identity name, portrait fallback, archive status, photo/match/event counts, category, aliases, teams/stables and timeline. Missing fields retain explicit unavailable/N/A/portrait-reserved presentation. A working layout is not proof that every backend field is populated correctly for every person.

History uses participant Shows results, displays event/date/venue/location, opponent/type/result, bounded previous/next and Open Event. **Source risk:** only the first100 backend rows are fetched; no subsequent API history pagination exists. A person with more data may be truncated; an affected live person was not established. Event-level photo hydration filters existing caption/identity identifiers. Metadata mounts tiles together; images load independently, first8 eager and remainder lazy. This does not implement Shows’ decoded-photo progressive reveal. Dossier zero matching photos becomes empty without consulting the helper’s confirmed-empty/positive-source distinction; keep this as a risk unless a fixture proves it.

## 8. Transition and story

Selecting a person navigates immediately, setting `fromWrestlingPeopleHall`. Person rendering clones Hall presentation and removes the original Hall DOM; it does not adopt a selected identity or preserve the established Hall subtree. Structural remount is source-verified; it alone does not prove a painted blank/flash. No dedicated route focus handoff exists.

Future story opportunity: let the selected portrait/hologram become the dossier identity while maintaining the Hall projection and Engine context. Address functional/recovery/geometry defects first; design this as its own narrow pass.

## 9. Shell/Engine

Ordinary Hall context is Hall of Champions; Person is Champion Dossier with identity. Shared parent mapping correctly points Person to `/wrestling/people`. A future left-emitter Back can reuse that mapping; do not add one in this audit.

Hall navigation emits `fromWrestlingPeopleHall`, while Shell history recognition still checks `fromWrestlingPeopleIndex` (`shell.js:2523`). Parent fallback works, but selected Hall context is not restored. Wrestling directly changes Shell route/module datasets and classes (`wrestling.js:12594,15296`); Protected Decisions identifies this as architectural review debt, not an approved exception. Project Rules permits Engine content/context updates: text writes themselves are not a blanket ownership violation. The reproduced off-route Engine write is the concrete bug.

## 10. Responsive and performance assessment

All three requested dimensions and both motion settings were measured. Hall document overflow was absent and crystal/hologram anchoring stable. Selector controls clear the Engine. Full pedestal SVG ends6.7px above the Engine at360 and1.8px above at412; desktop decorative SVG bounds overlap its top by1.3px, without an observed control obstruction. Local selector clipping still fails. Upper arrow targets are about14.4px wide on mobile; lower TEAM arrows27.4×18.4 at360 and31.4×21.3 at412. Desktop upper arrows remain only19.7px wide. These are substantially below the project’s touch-safe target intent. Crystal itself is45.8×44.1 at360 and50.1×48.1 at412.

Ranked performance work:
- **High, measured:** multi-second cold discovery and about12seconds until the last response in the sample; incomplete default SEARCH further prevents useful search interaction. Prioritize usable data/recovery over speculative effect removal.
- **Medium, source risk:** all remaining discovery pages aggregate before final incorporation; filters replace result nodes; dossier label fitting performs up to7 layout reads; Hall is rebuilt on return. Profile before optimizing.
- **Low/unproven:** long-lived photo-promise retention and glow/hologram compositing cost. Hall CSS suppresses the generic ambient particle/fire layers; do not blame the Shows ember count for this route. No physical GPU/power or S25 frame-cost claim is established.

## 11. Accessibility

**Confirmed defect:** expanded Hall remains `aria-hidden="true"` while visible person links inside retain keyboard focusability (`wrestling.js:11194,12229,12419`). This makes the visible interactive archive unavailable to the accessibility tree. Fixing this is a priority independent of visual polish.

Crystal is a native named button with control/expanded relationships and focus-visible styling. It becomes disabled on expansion without moving focus. Person rows precede the later filter controls in DOM order, and no route handoff/restoration is implemented. Tiny selector targets and clipped labels are additional observed usability issues. Do not label the entire dossier inaccessible: its Event Archive uses modal semantics, inert dossier framework, focus entry, Tab/Escape handling and focus restoration, with reduced-motion close support.

## 12. Existing QA and test drift

- `wrestling-people-responsive` and `wrestling-relationship-hooks` rely on retired Ring Archive/card/detail selectors and placeholder IDs/relationships. Old viewport coverage includes320,384,768,1440 and webview sizes; no reduced motion. Their generic helper intentions remain useful, but they do not validate today’s pedestal or dossier.
- Current `routes-smoke` recognizes canonical Hall and dossier mounts. It covers360×800 and1366×768, and empty API fixtures for Ace and missing-person paths. Empty-response checks are not HTTP/network-failure recovery checks. No People-specific slow fixture is present.
- Generic explicit-route health supports360×800,412×915,1920×1080 in normal/reduced motion. Its short bounded settling and overflow/control checks do not establish final data readiness, actual SEARCH function, nested clipping, trapezoid containment, focus or race safety. Hidden/inert controls and scroll-ancestor exemptions leave meaningful gaps.
- Default `v3:qa wrestling` deliberately excludes legacy specs and uses gateway/Shows for its generic route matrix; it does not automatically supply complete People coverage. No test files were changed.

Missing durable coverage: functioning search, physical selector containment, long labels without excessive shrink, active accessibility state, return-state/focus restoration, delayed route exits, retry after errors, partial discovery, full history pagination and media partial/error readiness. This audit’s fixtures are evidence, not permanent regression tests.

## 13. Documentation comparison

Current State is a broad historical PASS6/7 inventory last reviewed for PASS26, not a fresh People acceptance record. “Implemented/current” correctly locates the surfaces but obscures incomplete SEARCH and recovery defects if read as complete functionality. It already acknowledges direct Shell mutation and legacy test drift. Module Status’s broad API/cache description omits distinct canonical caches, partial discovery and sticky errors. Protected Decisions correctly preserves Hall structure while withholding automatic dossier approval; do not reinterpret prototype names as permission to replace it. Module Blueprint calls for usable search/filtering, deliberate return, stale cancellation, distinct partial/error states and accessible mobile controls; those are target contracts with the gaps documented above. No documentation was updated.

## 14. Recommended next passes

A. **Bugs:** first correct expanded accessibility state, stale completion/Engine ownership and same-person retry. Then complete SEARCH and restore Hall selection/focus deliberately. Add focused regression cases with each authorized fix.

B. **Geometry:** fit controls to measured pedestal faces; improve touch areas and long-label readability without replacing the protected composition. Include marker/line alignment and local clipping checks.

C. **Data/performance:** expose partial discovery, improve early usable collection behavior, verify >100-history strategy and unify cache expiry/recovery. Measure before changing effects.

D. **Transition/story:** selected identity to dossier continuity, cancellation and stable focus. Keep independent from data fixes.

E. **Dossier:** clarify identity/history partial states and introduce readiness-driven media behavior appropriate to People, including conclusive empty/error handling. Reuse principles from Shows without blindly transplanting loaders.

F. **QA/signoff:** modernize stale People specs, run the full targeted three-size/two-motion matrix, then physical S25 interaction/visual review and explicit human approval.

## 15. Final verification

Product defects are findings, not fixes. The application is not being given a technical or visual PASS. Both staged and unstaged tracked diffs are empty; HEAD remains `960c0d1`. Only audit evidence has been added under `qa/pass45/`. Independent Reviewer verdict: **APPROVE — audit report quality**, explicitly not application approval. Independent QA report: `qa-result.md`.



## Completed browser detail evidence

The six direct Person cases (three sizes × normal/reduced motion) loaded Aaron identity and history with correct Champion Dossier context, no document horizontal overflow and no scroll container needed for the representative content. Live record values were Photos0, Matches1, Events1, Category Performers, aliases/teams N/A and portrait reserved. Current visible archive status is the raw word `computed`; the label `WIN/PATRICIPANT` contains a typo. These are current unfinished presentation details, not polished copy signoff.

Long-name/category/aliases/team fixtures were tested at all three sizes. Metadata wraps without horizontal page overflow. At360, however, the long aliases intrude into the win row and aliases/team content clips at the lower status boundary, with no scrollable recovery container. The412 and desktop captures fit better. This is a controlled stress-case defect, not a claim about the representative live Aaron record. It shrinks to about10.86px mobile and12.60px desktop. The upper title wraps at18.56px/19.78px/32.8px respectively. These are controlled content fixtures, not asserted canonical person metadata. Screenshots `detail-long-*.jpg` and measurements `detail-long-focus.json` preserve the evidence.

The ordinary **360px timeline header clips**: title paint x16.16–201.84 and count205.36–343.84 exceed the header x22.88–337.13 by6.72px per side. The text runs have a3.52px gap, so this is clipping, not glyph collision. At412 the combined text x36.13–375.86 fits header22.88–389.13; desktop fits comfortably. Timeline Open Event remains usable but is only78.4×17.5px on mobile,98.0×23.4px desktop. Timeline side arrows are10.9px wide mobile/19.2px desktop. Add these to the touch-target work; no navigation blockage was observed.

Three-event fixture navigation produced indices0→1→2→1, with correct disabled endpoints and no wrap. Open Event keeps the person route, opens a separate modal, focuses Close and confines Tab. After the existing close animation finishes, focus returns to Open Event at all three sizes; earlier normal-motion captures taken during closing are not a focus-restoration defect. Reduced motion closes immediately. See `timeline-photo-navigation.json`, `detail-matrix.json` and `detail-long-focus.json`.

| Photo fixture | Observed result |
|---|---|
| Delayed metadata success | PHOTO ARCHIVE INITIALIZING →2photos; one hydration request |
| Service failure | PHOTO ARCHIVE UNAVAILABLE; no false success |
| Empty hydration result | NO ARCHIVED PHOTOS FOUND |
| Positive event/match count5, hydration returns no shows | Still NO ARCHIVED PHOTOS FOUND; inconclusive archival evidence, **not proof that person-tagged photos exist** |
|13-photo set |12tiles mount while0images decoded; page2 has1tile; viewer opens index12, Previous moves to11; person route preserved |
| Close/reopen cached event |0additional hydration requests |

This confirms functional pagination/viewer and metadata-level loading/error behavior. It does not establish decode-driven readiness or physical no-flash playback. The partial-positive case supports reviewing conclusive-empty semantics; it must not be misreported as losing five known photos of this person. Evidence: `photo-fixtures.json`, `timeline-photo-navigation.json` and `photos-*.jpg`.

Warm-reload fixture exposes296cached records with state live while network completion is still false, then refreshes discovery. This is stale-while-refresh behavior, not duplicate same-session selection traffic. Source guards and the observed cached event reopen/Forward behavior prevent the tested duplicate requests. Controlled switch sequence: Aaron lookup delayed800ms, Bobby delayed50ms, wait150ms, Aaron, wait1000ms. One identity lookup per person was issued; the in-flight Aaron lookup was reused and final Aaron route/name/Engine were correct. `person-switch.json` does not preserve intermediate frame assertions, so transient stale painting is not ruled out.

Frame sampling around Hall→Person (`warm-transition-category.json`) saw the old Hall connected at21.6ms, then canonical person route/new dossier with old Hall disconnected at38.4ms; focus became BODY. No sampled state had neither mount. This proves replacement and absent focus handoff, **not compositor-level zero-flash**, because DOM samples cannot certify every painted frame. Back returns a different Hall node with BODY focus.

A second long selector fixture, “International Championship Wrestling Performers,” paints189.05px inside161.53px at412 and6.88px type; it also clips. The original team fixture and this category fixture establish that local overflow is not restricted to one label kind.

## QA limits and disposition

Observed product defects remain unresolved by design in this inspection-only pass. Technical product disposition: **FAIL for the reproduced behaviors**, not a failed audit execution. No code self-corrections were made. Current generic and legacy specs were source-audited; this report does not claim an unexecuted existing test suite passed. Focused browser matrices and fixtures provide this pass’s runtime evidence.

Not established: physical S25 Ultra behavior, screen-reader device testing, pixel-by-pixel compositor no-flash proof, isolated parse/normalization benchmark, every real person’s field accuracy, affected live histories over100rows, exhaustive image-host failure/hang behavior or GPU/energy attribution. Hardware/visual review remains a future signoff step. No permanent verifier scripts, application changes or documentation updates were made.


Physical-face follow-up: QA calculated horizontal overhang at each selector vertical midpoint using SVG polygon cross-sections. Upper overhang per side is8.15/9.34/15.80px at360/412/1920; lower is16.33/16.98/9.78px. This directly establishes physical-face mismatch beyond a bounding-box comparison; see `physical-face-comparison.json`. Individual decorative tick/pseudo-element pixels were not exhaustively mapped, so full marker-alignment signoff remains open.



Additional scope limits from independent QA: no separate timeline/media swipe test, every A–Z endpoint/value, live positive-photo hydration or dedicated hanging-media timeout was exercised. Generic test harness was not rerun; the targeted six-case browser audit supplied current runtime evidence. Normal expansion samples contained66–67frames over about1.1seconds, with maximum observed frame gaps33.4ms/16.8ms/16.8ms across the three sizes; these are bounded desktop-browser observations, not sustained physical-device performance.
