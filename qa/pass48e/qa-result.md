# PASS48E focused QA

**PASS — HUMAN VISUAL REVIEW REQUIRED.** Exact layer mapping passed the requested12 mode/viewport cases after corrections. Physical S25 verification remains pending.

**Files in implementation scope:** modules/wrestling.js and css/modules.css. QA made no source or test edits.

**Level2:** red angled center contains only the selector label. Native arrows and sampled pointer regions stay in the gray side areas, outside the center panel. TEAM and A-Z remain single-line at all sizes; SEARCH/CATEGORY wrap on mobile without actual ink clipping. Audiowide type and original styling retained.

**Level4:** A-Z values and full long CATEGORY/TEAM values, arrow ink and pointer regions stay within the main value face. Long names use two mobile lines and one desktop line in the final width. Stationary root clipping constrains paint/glow and hit regions to level4. No text/arrow overlap or horizontal overflow observed.

**Levels3/5:** decorative and clean. Final raster checks found zero interactive control hits on either decorative face in all12 cases. Original native Search→A-Z transition exposed level5 hits in4/72frames; Builder corrected the moving hit owner. Retest: zero leak frames across71 samples at360,71 at412 and37 at1920 over approximately1.2seconds each. Desktop sampling was computationally heavier; these counts are containment evidence, not a frame-rate performance claim.

| Viewport | Value-panel Engine clearance | Final native transition leak frames |
|---|---:|---:|
|360×800|12.016px|0 /71|
|412×915|7.813px|0 /71|
|1920×1080|8.953px|0 /37|

**Protected geometry:** expanded screen and crystal rectangles match PASS48D exactly at all three sizes. The Engine was not moved. Initial mode TEAM wrapping and native pointer leakage were corrected and retested. Settled glyph ink checks distinguish font leading whitespace from painted glyphs.

**Evidence:** [final12cases and360transition](corrected.json), [412/1920transitions](corrected-transitions-other.json), [initial native leak](native-transition-pointers.json), [360](corrected-team-360.jpg), [412](corrected-team-412.jpg), [1920](corrected-team-1920.jpg). Final360 screenshot visually inspected: gray-side arrows separate from center label, full two-line value on level4, decorative steps visible and clean.

**Method/limits:** existing Chrome/Playwright and preview, inline checks only. Long labels were presentation-only DOM probes on the live Hall, not API fixtures. No broad suite, Person routes, unrelated data behavior, other browsers, reduced-motion rerun or physical-device check. No user creative signoff is implied.
