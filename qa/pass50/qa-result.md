# PASS50 focused QA

**PASS — HUMAN VISUAL REVIEW REQUIRED.** Hall→Person→Back/Forward passed for SEARCH, A-Z, CATEGORY and TEAM at360×800,412×915 and1920×1080, normal motion.

**Implementation scope:** modules/wrestling.js only. QA used existing Chrome/Playwright with controlled People fixtures and empty history responses; no application/test edits. Fixture contains49 valid people, enough to exercise genuine nonzero scroll at every size.

## Verified result

- 12 cases,36 Back returns and24 Forward reentries passed. Original Hall DOM object remains the same; exactly one Hall root exists.
- Mode, query, filter, selected-person focus and exact scroll restore every time. Scroll ranges:360: 1506–1531px; 412: 1597–1622px; desktop: 1541–1564px.
- 784 canonical-Hall animation-frame samples show immediate mode readiness, lower readiness where applicable, correct mode, visible SVG and unique Hall-owned SVG definitions. No sampled default-mode, hidden-Hall or wrong-definition-owner frame.
- Engine text remains Hall of Champions. Screen and pedestal SVG rectangles equal their pre-entry values in every return, preserving PASS49 dimensions.
- Each case made one collection request, one identity request and one empty-history request. Repeated Back/Forward added no requests. No uncaught page errors.
- Actual before/after 360px paint screenshots inspected: solid pedestal, crystal and selector paint remain present after the fix; focus is visibly restored on Beta Archive 20 within the scrolled list.

## Baseline and correction

HEAD-only browser interception reproduced the initial defect: 1 second after nativeBack, Hall results returned but pedestal/crystal and selector paint were absent. Eleven duplicate Hall SVG definition IDs resolved first to the retained Person clone. Builder retained Hall DOM, namespaced clone paint references and restored ready state synchronously. Final repeated-navigation evidence resolves that baseline finding.

## Evidence

[Baseline JSON](baseline.json), [before](baseline-before.jpg), [broken Back](baseline-after.jpg), [final matrix and raw frames](final-matrix.json). Corrected paint pairs: [360before](fixed-before-360.jpg)/[after](fixed-after-360.jpg), [412before](fixed-before-412.jpg)/[after](fixed-after-412.jpg), [desktopbefore](fixed-before-1920.jpg)/[after](fixed-after-1920.jpg).

## Limits

Focused fixture-based return QA only; no broad Person/media/API suite, new reduced-motion matrix or physical S25 test. Frame assertions cover DOM readiness, visibility, ownership and geometry; paint is supported by inspected screenshots, not a recording of every physical display frame. Human visual signoff remains pending. No QA source restoration occurred: baseline resources were intercepted in browser memory only, and all writes were QA artifacts.
