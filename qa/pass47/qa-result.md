# PASS 47 focused QA

**PASS:18/18 focused cases.**

Command: `npx playwright test tests/e2e/pass47-hall-search-return.spec.js --workers=2`. Final corrected run passed all18 tests in approximately1.3 minutes at360 ×800,412 ×915 and1920 ×1080, normal motion.

Verified with deterministic People/API fixtures:

- Local name and alias search is case-insensitive. No-result and cleared-input states work. Searching adds no collection requests or identity lookups. Search input remains within viewport bounds, with no document horizontal overflow.
- SEARCH, A–Z, CATEGORY and TEAM retain their nondefault query/filter, expanded state and results after browser Back, Forward and Back again. Focus returns to the selected person link. Each scenario uses one identity lookup total despite repeated entry.
- Direct person entry without a Hall snapshot returns to default SEARCH, empty query and unexpanded Hall when navigating through the existing parent-route mapping. This does not claim an in-page Back control exists.
- All cases assert zero application page errors.

Two issues were resolved before the final run. The initial test invoked `performShellBack()`, which is guarded by an unavailable legacy Shell button on this surface; the parent corrected the test to exercise actual browser history. The corrected test then exposed a genuine application issue: restored normal-motion Hall state became expanded but never made the selectors ready. The Builder added the existing selector-availability scheduling to the activation-settle branch. All four return modes passed afterward at every size. No QA source or test edits were made.

No full suite, extra screenshots, reduced-motion rerun, physical-device check, scroll-position assertion or live API performance sample was added. Literal markup and very long search input are not specifically asserted by this focused spec. Prior PASS46 ownership coverage was not repeated because this change stayed in local Hall/search restoration and no new shared-Shell risk was found.
