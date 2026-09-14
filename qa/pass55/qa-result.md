# PASS55 focused verification

Inspected modules/wrestling.js and its fit constraints in css/modules.css. Application changes are confined to the Person fitter in modules/wrestling.js; no CSS or API/lifecycle changes.

## Root cause and change
The old fitter reset every marked field, then independently forced width/style/layout reads and seven binary-search rounds per overflowing field on every invocation. No getBoundingClientRect call exists in this helper. Metadata updates, history updates and activation repeat the same fitting path.

The new fitter keeps all original thresholds, minimum size, seven iterations and final wrap fallback. It groups resets and each binary-search round into write/read phases, measuring available width once per changed field. A WeakMap skips unchanged elements using text, width, inline styles, computed typography, viewport/device ratio and font-loading state/revision. Font loading invalidates the cache without adding a new reveal delay. Initial synchronous fitting remains in its PASS54 location.

## Evidence
fit-matrix.json: eighteen before/after pairs (Aaron, Ace, synthetic long name/aliases/team/category/event title;360x800,412x915,1920x1080;normal/reduced motion). Captured canonical real API payloads are reused for consistent comparisons. The long record is explicitly synthetic. Exact first snapshots, finished computed font sizes/wrapping/element bounds and post-repeat output match. No fitted field has horizontal scroll overflow. Font readiness is stabilized for visual comparison; this is not a production speed benchmark.

Normal-motion412 measured aggregate natural fitting time per entry:
- Aaron67.7ms ->51.5ms; scrollWidth reads69 ->56.
- Ace79.9ms ->46.4ms; scrollWidth reads61 ->57.
- Synthetic long120.6ms ->50.7ms; scrollWidth reads109 ->81.
Three scheduled fit calls per412 case remain; unchanged work is skipped rather than removing readiness passes. Across six412 cases, scheduled calls18 ->18 and scrollWidth reads478 ->388. Cache validation adds cheap read-only width/computed-style checks; not every read category decreases. Desktop timings are mixed, so no universal first-pass speedup is claimed.

Five unchanged repeat calls at412 perform zero scrollWidth search reads after optimization (previously115 for Aaron/Ace and195 for the long fixture), about0.3-0.6ms total instead of66-208ms in these instrumented cases.

invalidation-layout.json: twelve exact comparisons against the original algorithm after resizing, changing text, changing font style and a font-completion event. All pass. A browser Performance-metrics probe with a forced initial font invalidation followed by five fits reduced LayoutCount102 ->12, layout duration139.3ms ->20.5ms and elapsed fitter time160ms ->23.3ms.

lifecycle.json: all six viewport/motion cases pass failed request/retry, warm Hall seed, person switching with stale completion, Back/Forward, same retained Hall/pedestal/query/focus and cached request counts. One failure+one successful retry =two Aaron identity requests; cached Forward adds none; one delayed Ace request cannot overwrite Aaron.

request-order.json: activation-to-fetch before/after Aaron0.8/0.6ms, Ace0.5/0.5ms. Fetch still precedes text fitting by49-53ms. paired-live-api.json records three live API navigation comparisons per person/build; broad timing variability does not establish an end-to-end startup gain. Earlier PASS53 CPU-sample58-67ms is different instrumentation, not a directly comparable benchmark.

The visual matrix preceded the final font-revision invalidation addition; the invalidation, lifecycle and request-order checks cover that final code. No changes were made to original tests. node --check and git diff --check pass. Physical S25 visual review remains pending.

## Remaining work, not implemented
1. Oversized event poster: strongest bounded bandwidth/artwork improvement; preserve full-resolution source elsewhere.
2. Hidden Hall rerender on Person entry: avoid redundant work while preserving PASS50 restoration.
3. Remaining startup asset/SVG/projection/viewport work: still precedes initial paint; narrow profile before any further change.
