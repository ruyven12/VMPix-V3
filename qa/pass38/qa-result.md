# PASS38 QA Result

**PASS — HUMAN VISUAL REVIEW REQUIRED** for browser scope. No unresolved observed product defect. Tested frozen modules/wrestling.js diff:29 additions,26 removals; no application edits by QA.

- Six viewport/motion cases (360x800,412x915,1920x1080 normal/reduced): first successful decode after header settle produced one tile within3.6–30.4ms, before remaining five. These are sampled browser measurements, not configured delays. All displayed images complete with naturalWidth; no empty flash. See first-photo-matrix.json and first-*.png.
- First image arriving during grace-triggered info fade appeared15.1ms after decode, with metadata opacity0.591 and state revealing. No header/metadata removals through8-photo progression.105 painted frames retained in during-fade-*.jpg; raw samples in during-fade.json.
- Counts1,2,3,5,6,8; some failures; one success among five failures; all failed; explicit zero; missing metadata; positive count without URLs passed. Empty only for confirmed zero. See states.json and navigation-boundaries.json.
- Proper hydrated backend response explicitzero stayed loading before resolution, then empty. Missing fields and positive count/noURLs became unavailable. Failed hydration neverempty. Hanging hydration ran beyond15seconds and ended unavailable with no empty flash. Delayed hydration aftergrace still assigned firstsix highpriority. See hydration.json.
- Desktop Next/Prev, mobile arrows and CDP touch swipe, lightbox and fresh browser Back/Forward passed. See navigation-boundaries.json and swipe.json. A desktop mouse-drag probe could not advance mobile gallery; actual touch-event probe passed.
- Existing route harness6/6 passed. Single-photo and confirmed-empty JPEGs visually inspected: first-412-no-preference.jpg and state-zero.jpg.

Fixtures use intercepted QA images and controlled hydration payloads. The first hydration attempt used an unsupported bare-array envelope and was corrected to the canonical shows envelope before final assertions; it is not product-failure evidence.

No physical Samsung S25 verification or human motion approval. Browser timing/frame evidence does not replace either.
