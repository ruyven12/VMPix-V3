# PASS48 focused geometry QA

**PASS for measured geometry; physical-device/human visual signoff remains separate.**

Normal and reduced final geometry passed at all three sizes. No application or test edits by QA; no API fixtures, Person routes or broad suites.

| Width | Lower core / painted face at SVG y410 | Label / painted face at y449 | Label side inset | Effective lower arrow | Engine clearance |
| --- | --- | --- | --- | --- | --- |
|360|122.84 /131.33px|177.23 /179.81px|1.29px|44 ×47px|7.63px|
|412|140.58 /150.28px|202.84 /205.76px|1.46px|44 ×54px|2.78px|
|1920|238.00 /254.43px|343.39 /348.36px|2.48px|44 ×92px|0.44px|

Core, readout and button perimeter samples lie inside the actual painted SVG base polygons, using isPointInFill with inverse screen transforms. Cross-section widths use the sloped first-step edges, not the full SVG bounding box. Extra label depth stays over the existing lower steps. Mobile and desktop screenshots were inspected: readable, proportionate to the painted base, with no Engine text/emitter obstruction. Desktop clearance is tight but positive.

All three prescribed strings fit at12px. Mobile uses1/2/2 lines; desktop1/1/2. Every measured DOM text line stays within the readout; no horizontal scrolling, hidden excess text or document overflow was observed. Labels were presentation-only probes through the existing readout function, not API fixtures.

Actual360 touch near the bottom of the extended button changed Announcers Commentary → Crew; Previous restored it, and Enter advanced again. Full one-pixel hit sampling returned2068/2068 points owned by the44 ×47.36px button. Other-size effective centerline spans are recorded above.

Upper selectors and expanded-screen rectangles exactly match the accepted intermediate measurements. Upper labels remain12px; mobile upper arrows remain approximately35 ×24 and40 ×25px, not44px tall. The existing trapezoid frame remains; its usable workspace inset avoids clipping content. Screen dimensions remain331.19 ×576.47,379.03 ×667.95 and1766.39 ×672px, with crystal anchor difference below0.008px.

Evidence: [lower measurements](lower-final-measurements.json), [face-width table](lower-face-table.json), [actual hit/navigation check](lower-hit-navigation.json), [mobile](lower-360-no-preference.jpg), [desktop](lower-1920-no-preference.jpg). Baseline and intermediate evidence remain in this folder. No physical S25 or full cinematic review was performed.
