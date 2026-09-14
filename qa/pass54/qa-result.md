# PASS 54 focused verification

Application change: modules/wrestling.js only. No CSS, API, route contract, image source, Hall geometry or deployment changes.

## Implementation
Activation now establishes its generation and selected subject, then starts the existing deduplicated raw People request before getWrestlingPersonDossierPrototypeShell, SVG setup, projection measurements and text fitting. A shared helper contains the original endpoint/timeout/parse/cache/finally chain. Its Promise executor issues fetch synchronously rather than queuing a microtask. The normal loader adopts that same registry promise and retains all consumer activation, request-key and identity ownership checks. Successful cache and in-flight reuse remain; failures are removed for retry. Timeline starts through the original guarded completion path.

## Timing evidence
Matched local static frontend, unchanged real production API, fresh 412x915 contexts, three samples per person/build. Medians in milliseconds from navigation:

| Person/build | Request | Shell | Response complete | Identity/core | Timeline |
|---|---:|---:|---:|---:|---:|
| Aaron before | 518 | 526 | 626 | 700 | 835 |
| Aaron after | 407 | 495 | 536 | 551 | 796 |
| Ace before | 508 | 511 | 596 | 625 | 730 |
| Ace after | 406 | 506 | 488 | 539 | 715 |

Request overlap with setup increased from approximately 6-8ms to 89-101ms. PASS53 production starts were approximately700ms Aaron/603ms Ace; these local matched results must not be presented as a directly comparable deployed benchmark. Production-page tests with the local JS substituted at the browser response layer also exercised all sizes/motions and immediate repeats against real API data; timings varied substantially and are retained in live-matrix.json. No production deployment or guaranteed end-to-end speedup is claimed. Earlier broad Playwright request-routing instrumentation delayed API dispatch and was replaced; its results are not the primary timing evidence.

## Correctness
- Six focused lifecycle cases:360x800,412x915,1920x1080; normal/reduced motion.
- HTTP503 then Hall reopen: exactly two Aaron requests total (failed+successful). Warm canonical Aaron name immediately visible while authoritative retry pending.
- Back preserves original Hall DOM, pedestal, query and focused Aaron control. Forward uses successful cache without another lookup.
- Rapid Ace request then return to Aaron: one Ace request; late Ace result cannot overwrite Aaron. No page errors.
- Twelve paired geometry cases,456 frames: each case has exactly one set of module bounds; before/after bounds match; zero hidden dossier frames. Controlled payloads isolate first-frame lifecycle geometry. Live records can cause existing content/font fitting changes; no CSS or geometry redesign undertaken.
- Live cold Aaron/Ace and immediate-repeat cases issue one People request and one history request per full page entry. Tests use no synthetic delay for timing;500ms/503 fixtures are limited to readiness/retry/stale correctness.
- node --check modules/wrestling.js and git diff --check pass.

## Evidence
- paired-live-api.json: matched timing measurements.
- live-matrix.json: production-page script-substitution runs.
- lifecycle.json: focused recovery/navigation request counts.
- geometry.json: paired frame measurements.

Physical S25 visual confirmation remains pending. Shared asset loading, synchronous fitting/SVG/viewport setup and variable network/main-thread timing remain; this pass only overlaps the request with existing setup.
