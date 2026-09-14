# PASS49 focused QA

**PASS — HUMAN VISUAL REVIEW REQUIRED.** Requested Hall layout and interaction checks passed at360×800,412×915 and1920×1080, normal motion. Physical S25 verification remains pending.

**Scope:** css/modules.css only. Existing Chrome/Playwright, live Hall records and presentation-only long TEAM text probes. No app/test edits or broad suite by QA.

## Results

- Mobile screen expands to x4px,y4.016px:352×582.469px at360;404×673.953px at412. Previously x14.406/y10.016,331.188×576.469 and x16.484/y10.016,379.031×667.953. Bottom anchor remains fixed. Desktop stays x76.805/y63.016,1766.391×672px.
- Crystal, pedestal and Engine rectangles remain identical to clean HEAD baseline. No document horizontal overflow in12 mode/viewport cases. Mobile top/side workspace expansion stays above the pedestal.
- TEAM keeps the shared portrait cards. Long status wraps cleanly; long membership text has readable11px minimum type and contained wrapping. Mobile screenshot inspected. Synthetic long names were substituted into status/card text only: they do not claim the real B3 filter contains those long-team records.
- Live SEARCH Aaron returns3 records; A-Z returns26; TEAM B3 returns3. Native modes SEARCH/A-Z/CATEGORY/TEAM work at all widths. Next lower arrow selects Bear Country; keyboard Enter on Previous restores B3 at all widths. Existing person route attributes remain attached to records. No Person route was opened.
- Arrows sit8px from the lower control region's left/right edges. Zero pointer ownership outside level4 across53/54/54 native-transition samples. Existing stationary clipping keeps adjacent decorative tiers inactive.
- Shared results scrolling: explicit touch events from scrollTop0 move185px on both mobile sizes. Keyboard End reaches actual bottom1900/1995/1953px. Live B3's3 cards do not require scrolling, so scroll reachability used the same portrait-results container in A-Z rather than inventing additional TEAM data.

## Evidence and limitations

Clean baseline is [head-baseline.json](head-baseline.json), source7bdbf92d8a41a722fbad52f695206f121d30651e intercepted only in the browser; initial baseline.json was captured during Builder activity and is not acceptance evidence. [comparison.json](comparison.json) records exact before/after geometry. [final-layout.json](final-layout.json) contains12 live mode cases and native selection results; [scroll-pointer.json](scroll-pointer.json) contains pointer frames and keyboard-bottom checks; [touch-scroll.json](touch-scroll.json) resolves the initial inconclusive synthesized gesture with actual touch events. Screenshots: [360](team-long-360.jpg), [412](team-long-412.jpg), [1920](team-long-1920.jpg).

Safe-area env arithmetic is source-reviewed; nonzero asymmetric hardware safe-area insets were not simulated. No physical device, other browser, reduced-motion rerun, Person navigation test, broad suite or new API fixture. CSS-only scope establishes unchanged routing/filter implementation; this report does not claim a separately repeated pre/post backend-data audit. QA locator failures were corrected in inline verification only and are not product defects.
