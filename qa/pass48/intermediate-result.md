# PASS48 intermediate upper/screen check

**Intermediate pass only. Lower pedestal decision and final acceptance remain pending.**

At360/412/1920, measured upper selectors are75.45 ×45.63,86.36 ×52.22 and146.19 ×88.39px. All four selector corners are inside the actual SVG body polygon, verified using the path's inverse screen matrix and isPointInFill. Arrow hit rectangles are34.72 ×24,40.18 ×25.11 and70.09 ×43.20px; conservative one-pixel centerline hit sampling gives34–35 ×24,39–40 ×25 and69–70 ×43px. Shared fractional button boundaries can resolve to the adjacent arrow; outer hit areas remain inside the face. These are improved targets, not a claim of44px mobile height.

Mode labels remain12px. At the narrowest360 layout, SEARCH/A–Z/CATEGORY/TEAM paint46.13/20.58/61.14/33.52px wide and fit the upper readout. Other sizes have more width. The presentation probe directly reset the mode index between sizes, so its first post-resize mode0 label retains prior TEAM text; this is probe state, not evidence of a product-label bug. Actual next-mode controls exercised A–Z/CATEGORY/TEAM after each reset.

All three screen rectangles are byte-identical to baseline, with bottom/crystal anchor difference below0.008px. The active workspace corners are inside the existing trapezoid at all sizes. Normal and reduced final geometry agree. No document horizontal overflow was observed. The360 screenshot was visually inspected; full-screen and lower pedestal design were not altered by QA.

Evidence: baseline.json, intermediate-upper-screen.json, intermediate-360-no-preference.jpg and corresponding other-size/motion geometry screenshots. No API fixtures, Person routes, tests or application edits. One live Hall page was resized; synthetic mode-index reset was only an in-memory presentation probe. Await the lower pedestal choice before complete PASS48 verification.
