# PASS37 QA Result

Scope: Campaign-to-dossier adopted loading and later gallery settlements; modules/wrestling.js.

## Baseline
MutationObserver proved synchronous removal/reinsertion of existing hero and metadata during coordinator refresh. A controlled loading-state renderer refresh canceled a valid session and replaced it with loading state. Desktop Chrome baseline rAF did not reproduce the physical painted blink; do not equate the structural reproduction with physical-device proof. The development-collection-race run overlapped Builder changes and is not baseline evidence.

## Final checks
- Twelve adopted fixture entries across360x800,412x915 and1920x1080, normal/reduced motion: ready and grace-promoted media, staggered successful, failed and hanging remainder. One coordinator each; no protected node/image removals after first visibility; no hidden or zero-opacity ancestors; no overflow. Success10requests/10decodes; failure10requests/6decodes; hang8requests/6decodes during observation. No duplicates.
- Ten additional actual hydration requests delayed1800ms: all valid selections remained valid; one hydration request per entry, zero duplicate decode sources;30–47 successful decodes per observed entry.
-333 corrected rAF samples and110 painted frames through6→7→8→9→10 ready photos. Header, information and Engine opacity stayed1; each retained exactly one rectangle. First, middle and final painted frames inspected; no disappearance or second reveal.
- Executable loading/live/empty/error collection refreshes preserve the known-valid session. Mobile arrow pagination and desktop Next/initially-disabled-then-enabled Prev work. Photo Back and genuinely invalid record handling exercised.
- Existing route harness:6/6 passed.

Evidence: final-matrix.json; delayed-valid-10.json; final-later-frames.json; final-later-*.jpg; desktop-navigation.json; evidence-summary.json. Mobile navigation passed before a later desktop QA locator mismatch; the desktop check was rerun using correct canonical accessible names and passed.

No app, test, harness or verifier-script edits by QA. No unresolved observed product defect.

Signoff: PASS — HUMAN VISUAL REVIEW REQUIRED for browser scope. Physical Samsung S25 and human motion approval remain pending; emulator observations cannot establish physical blink resolution. Hanging remainder observation covered usable stable state, not the full timeout duration. Prior PASS36 cache/history checks retained; no broad unrelated retest.

The12mixed-media entries and333frame sample use intercepted QA image fixtures. The10delayed-hydration entries use real API responses with delayed request dispatch. Deliberately corrupted or disconnected pending-transfer recovery was not separately exercised this pass; tests cover valid connected transfers and post-adoption collection refresh races.

## Requested focused completion
Fresh deterministic warm-cache and actual browser Back/Forward passed. Back/Forward restored the valid8-ready dossier with6displayed images and zero new image requests. Campaign reselection reused the first6; remainder URLs6.png and7.png were each requested once, with zero hydration/API requests and no unavailable state. This is progressive remainder loading, not a duplicate hydration burst. Evidence cache-history.json.
Cold direct match lookup with actual API requests delayed1800ms showed Loading Encounter Archive before data, then valid hero with no unavailable state. Exactly one collection request and one exact-match hydration request were observed; see slow-direct-lookup.json. An initial live warm-cache attempt did not reach six remote-ready images within30s; deterministic fixtures isolate cache/history behavior from that service-readiness limitation.
Final browser-scope verdict remains PASS — HUMAN VISUAL REVIEW REQUIRED; physical S25 remains unverified.
