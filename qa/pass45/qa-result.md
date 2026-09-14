# PASS 45 independent browser audit

**Audit complete. Current experience has confirmed defects; this is not an implementation signoff.** No application, CSS, test, harness or governing documentation files were changed. Evidence only was written under qa/pass45.

## Scope and evidence

Inspected the task brief, V3 QA role/skill, AGENTS.md, relevant modules/wrestling.js Hall/dossier/media code and markup, and existing browser infrastructure. The parent and Scout own the wider source, documentation and test-drift audit. Browser: local Chrome at 360 × 800, 412 × 915 and 1920 × 1080, normal and reduced motion. One real Hall → Aaron Orion sample was captured; subsequent matrix/state checks replayed those responses or used explicitly controlled fixtures. Browser emulation is not physical Samsung S25 verification.

## Confirmed findings, ranked

1. **High: off-route identity completion changes the Shell readout.** Delaying Aaron's lookup, leaving for Hall, then resolving it changes the Hall Engine and document title to Champion Dossier – Aaron Orion while the URL remains /wrestling/people. It also starts a history request after leaving. This is a controlled executable race, not an inferred source issue. [State evidence](state-fixtures.json), [screenshot](delayed-leave.jpg).
2. **High: visible Hall results remain hidden from accessibility APIs.** All six expanded cases retain aria-hidden=true on the hologram ancestor of visible, keyboard-focusable role=link people. Crystal is a native button and click/tap/Enter/Space work; the hidden ancestor is a separate defect. [Hall matrix](hall-matrix.json).
3. **Medium: same-person identity failure sticks after return.** A503 lookup, Hall return, endpoint recovery, then reopening Aaron retains ARCHIVE RECORD UNAVAILABLE and makes no second identity request. History can still load underneath this identity failure. [State evidence](state-fixtures.json).
4. **Medium: SEARCH is a standby placeholder.** Current Hall has zero inputs. Its visible SEARCH mode contains AWAITING QUERY / SEARCH WORKSPACE STANDBY. A real long-query interaction cannot be tested because it is not implemented.
5. **Medium: pedestal content does not consistently fit its physical faces.** Selectors overhang the SVG trapezoids, mode arrows are narrow, minimum text fitting is tiny, and sufficiently long category/team values clip. See measured table below.
6. **Medium: Hall return loses selection context.** Hall → person removes the original Hall node. Back creates a different Hall node, resets to SEARCH/mode0 with expansion unset, and leaves focus on BODY. Escape did not collapse the expanded Hall. No visible reset control was found. This is current behavior, not proof that a collapse contract was previously approved.
7. **Medium: Person Detail mobile text limits.** At360 the timeline heading/count are separated by3.52px, so they do not overlap each other, but their combined painted span exceeds the header by6.72px on both sides and clips at the right. Controlled long metadata at360 visibly collides with adjacent status content and clips at the bottom without a scroll container. At412/desktop the same stress case is less constrained. [Long/focus measurements](detail-long-focus.json), [360 stress screenshot](detail-long-360.jpg).
8. **Medium data-state risk: inconclusive photo hydration becomes empty.** With event/match photo_count5 and an empty hydration response, the overlay shows0 / NO ARCHIVED PHOTOS FOUND. The five photos are event-level evidence, not proof of photos tagged to this person; this test establishes loss of uncertainty, not that person-tagged photos necessarily exist.

## Pedestal measurements

Bounds are x,y,width,height in CSS pixels; inner area is the actual readout rectangle. Values below use settled TEAM mode. Normal/reduced measurements agree.

| Viewport | Upper selector | Upper inner | Lower selector | Lower inner |
| --- | --- | --- | --- | --- |
| 360 × 800 |126.64,633.55,106.69,31.47|72.72 ×29.47|80.30,675.64,199.36,20.39|140.98 ×18.39|
| 412 × 915 |144.92,731.81,122.11,36.02|88.14 ×34.02|91.91,781.20,228.16,23.34|161.53 ×21.34|
| 1920 ×1080 |856.63,826.19,206.72,60.98|157.64 ×58.98|788.00,911.39,344.00,33.27|243.50 ×31.27|

The actual full SVG bounds and individual physical path bounds are retained in [geometry summary](geometry-summary.json) and hall-matrix.json. Comparing the mode rectangle to the outer body trapezoid at the control's vertical midpoint gives approximately8.15/9.34/15.80px overhang per side. Comparing lower control to the first base step at its midpoint gives16.33/16.98/9.78px. These are polygon cross-section calculations from measured SVG coordinates, not an assumption that a bounding box proves containment. [Physical face comparison](physical-face-comparison.json). Decorative markings therefore need alignment review; individual pseudo-element painted pixels were not exhaustively mapped.

Upper text is7.36px at mobile and11.52px desktop. Mode arrow targets are14.39px wide on both mobile sizes,19.70px desktop. The crystal target is45.83 ×44.08 at360,50.14 ×48.13 at412 and73.80 ×70.39 desktop. Lower category/team font can fall to6.88px mobile and9.92px desktop. The controlled long team string paints247px into141px at360,356px into244px desktop; it is clipped, not fully fitted. A long category at412 paints189px into162px at6.88px. Native document horizontal-overflow checks remain false despite this local clipping.

## Crystal, transition and performance observations

All six cases activated through click/tap or native Enter/Space. Expanded hologram sizes are331.19 ×576.47,379.03 ×667.95 and1766.39 ×672. Its settled bottom matches the crystal top within0.008px. Expansion frame records are retained in hall-matrix.json: normal samples contained66–67 frames over about1.1 seconds, maximum observed gaps33.4ms at360 and16.8ms at412/desktop. This bounded desktop-browser sample does not establish mobile GPU cost or sustained frame rate.

Hall → person frame observations show immediate source-node removal and a new dossier mount, with BODY focus rather than a transferred focused person identity. [Warm/transition evidence](warm-transition-category.json). There was no sampled frame with neither source nor dossier mounted; DOM presence alone does not prove no painted flash. No dedicated before/after cinematic recording or physical-device trace was made. The existing anchored identity structure suggests a future selected-record-to-dossier continuation, but final story design/signoff belongs to the next build pass.

## Real API timing sample

Times are milliseconds from initial navigation; durations are request start to response. JSON parse/normalization was not independently instrumented. Backend response arrival must not be described as final painted readiness.

| Step | Start | Response / observed milestone | Duration |
| --- | ---: | ---: | ---: |
| Hall DOM mounted |0|784|—|
| Crystal usable |0|2,974|—|
| People discovery page1 |584|4,558|3,974|
| First records observed usable |0|4,579|—|
| Discovery page2 |4,569|12,051|7,482|
| Discovery page3 |4,569|11,552|6,983|
| Aaron identity lookup |5,238|5,755|517|
| Aaron event history |5,757|6,055|298|

The Hall initially exposed100 records from page1; full captured collection is296. Requests ask limit500 but the backend reports limit100 and three pages. Final discovery response arrived12,051ms; exact final collection paint was not separately timed. Aaron route was observed at5,258ms. A later15-second snapshot confirmed identity/history loaded, not a15-second load duration. [Live sample and reusable payloads](live.json).

Same-session Back/Forward after completion added no requests. A separate replayed warm reload exposed296 cached records with state live while networkComplete=false after80ms, then refreshed all pages; this is distinct from a cold network sample and from same-session Forward. Rapid delayed A → B → A issued one lookup per person and ended with Aaron's correct name/Engine; it did not refetch Aaron. Intermediate B became current before switching back, so the test does not claim B never rendered. [Switch evidence](person-switch.json).

## Person Detail and media

Aaron's real record has no portrait, zero photos, one event and one match; the UI shows Portrait Signal Reserved, raw status computed and the literal typo WIN/PATRICIPANT. Teams/aliases are N/A. The event's source contains team labels and a flat participant list; the UI says Opponent Unlisted rather than proving team membership. All six direct dossier cases mounted with no document horizontal overflow. Short representative content needed no scroll; absence of a scroll container does not establish long-content recovery.

Controlled three-event navigation gave indices0→1→2→1, disabled Previous at0 and Next at2, with no wrap. Open Event preserves the person route. Event Archive focuses its Close control, keeps Tab inside, uses Escape and restores Open Event focus and document overflow. Normal-motion focus restoration was checked after650ms; earlier immediate screenshots retaining × were transition sampling, not a final focus defect. [Detail matrix](detail-matrix.json), [settled focus](detail-long-focus.json).

Media fixtures verified initializing→two images, true empty,503 unavailable, and the inconclusive positive-count case. A13-image fixture inserts12 photo tiles while zero images have completed, then pages12+1. Viewer opens index12, ArrowLeft selects11, Escape returns to gallery then dossier. Cached event reopening adds zero API requests. Thus this path has metadata-first tile insertion, not the newer readiness-driven image reveal. [Photo fixtures](photo-fixtures.json), [timeline/media navigation](timeline-photo-navigation.json). Photo loading used controlled image responses; no new live media hydration was sampled. Touch crystal activation was tested, but swipe-based timeline/media navigation was not separately exercised.

## Coverage limits and next checks

This browser audit supplements the parent's source classification of retired People tests and modern generic checks. No generic harness was rerun: the six-case audit already covered the relevant mounting/layout states, and generic health would not detect SEARCH incompleteness, hidden result ancestry or local text clipping. No application modifications, API writes or permanent verifier scripts were made.

Not independently established: physical Samsung S25 behavior, full screen-reader operation, all team/category values, every A–Z endpoint, prolonged particle/GPU performance, over100-event pagination completeness, dedicated hanging-media timeout, live positive-photo person hydration, or human visual approval. The sampled live endpoints succeeded; failure/delay/empty outcomes are explicitly fixtures.

Recommended surgical order: fix route ownership and recoverable errors; expose visible Hall results correctly; resolve SEARCH scope; fit pedestal geometry and minimum control sizes; repair360 dossier text constraints; preserve Hall return state/focus; then plan the Hall-to-dossier continuation and readiness-driven media work. Keep final physical/visual signoff separate from these technical findings.
