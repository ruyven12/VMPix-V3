# PASS36 QA evidence

Browser: Chrome; 360x800, 412x915, 1920x1080; normal and reduced motion.

- Six fixture adoption cases: one coordinator; retained header, metadata, Highlights and grid references; retained first-six Image references; identical immediate rectangles; existing Engine and BACK button retained; route changes while info opacity is zero/revealing; no pending adoption or local overlay left.
- Fixture fewer3/delayed/failed/hanging images preserve metadata and BACK recovery. Delayed images populate adopted route. Escape before promotion cancels with no late URL.
- Live keyboard selection: six decodes before first actual-route sample; one hydration request; no duplicate decode sources. Preload to first route sample 690ms, header to reveal5ms, initial info complete about209ms after route sample. Remainder begins after reveal.
- Delayed/hanging grace measured701.5/703.5ms after header. Failures resolved before header reveal immediately. No assumption that remote images always arrive before grace.
- Native Tab reaches gallery, six tiles and BACK without hidden/inert focus; Space returns to Campaign. Browser Back/Forward recover. Direct entry, photo001/Back and unavailable-record emitter recovery exercised. Photo retains RETURN without actual marker.
- Existing route health harness6/6 passed.
- Painted live frames036/037/040 inspected: stable header, no duplicate/blank frame; canonical Shell background framing changes at route handoff, flagged to parent for intended-seam assessment.

Artifacts: adoption-matrix.json; fixtures.json; live-transition.json; live-frame-*.jpg; direct-exclusions.json.

Limitations: physical Samsung S25 and subjective motion signoff not verified. No app/test/script edits made. Data-hydration cancellation after selection and full hang timeout were not separately repeated beyond current image fixtures and prior shared-loader coverage.

## Corrections and final verdict
Initial Shell atmosphere/title discontinuity was corrected in revision2. Independent all-three-width frames retain haze, title/subtitle position and right-emitter presentation; Back clears marker and restores Campaign. Revision2 route harness6/6 passed. Photo-return subtitle loss was corrected in revision3; independent three repeated photo/Back cycles restore the title, and new direct-session exclusion passes.

Final: PASS — HUMAN VISUAL REVIEW REQUIRED for browser scope. Physical Samsung S25 is not verified. No unresolved observed product defect. See revision2-presentation.json and revision3-title-recovery.json. Original before frames remain preserved.
