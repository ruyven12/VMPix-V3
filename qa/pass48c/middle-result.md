# PASS48C middle-only QA

**Middle correction: technical checks passed. Overall PASS48C remains incomplete; lower first-tier placement requires the user's presentation tradeoff.**

Chrome at360×800,412×915,1920×1080, normal motion. Existing preview and inline Playwright, no API fixtures or source/test edits. All four labels were presentation probes; native arrow click, Enter and Space independently advanced actual mode0→1→2→3.

The angled middle panel and label glyphs fit inside the actual inner black SVG face (262,312→378,312→394,404→246,404). Original11px Audiowide retained. Initial412 CATEGORY ink crossed the panel clip; Builder's8% text padding corrected it. Final12 label cases have zero actual ink clipping or arrow overlap. Native hit areas remain usable but are smaller than44px on mobile; angled clipping reduces their rectangular corner area. Initial effective raster areas were843/889px² at360,1114/1160px² at412 and3349/3422px² desktop, with button rectangles approximately25.32×36.59,29.13×42.17 and50×72.80px. Text padding does not change those controls.

| Width | SEARCH | CATEGORY | A-Z / TEAM |
|---|---|---|---|
|360|SEAR / CH|CATE / GORY|single line|
|412|SEARC / H|CATEG / ORY|single line|
|1920|single line|single line|single line|

These mid-word mobile wraps are explicit visual compromises, not a claim that full words remain on one line. Screen and crystal rectangles are unchanged. No document overflow observed. Lower geometry was intentionally not retested or passed: first-tier height21.06/24.10/40.8px cannot fit the prior full three-line mobile stress labels unchanged.

Evidence: [initial bounds and native controls](middle-measurements.json), [initial ink defect](middle-ink.json), [corrected ink12cases](corrected-middle-ink.json), [360](corrected-middle-360.jpg), [412](corrected-middle-412.jpg), [desktop](corrected-middle-1920.jpg).

No broad suite, Person or API testing; no physical-device verification or human visual signoff. Reduced-motion not rerun for this static middle-only correction.
