# PASS48B V3 QA Result

**Signoff: PASS — HUMAN VISUAL REVIEW REQUIRED.** Focused Hall typography and geometry checks passed after two Builder corrections. This is browser verification, not physical S25 or Chris's creative signoff.

## Scope and method

/wrestling/people at 360×800, 412×915 and 1920×1080, normal motion. Existing Chrome/Playwright and preview server; inline verification only. Three supplied strings were presentation-only DOM probes, not API fixtures. No application, tests or permanent verifier scripts were edited by QA. No Person routes or broad suite were run, as instructed.

## Checks passed

- **Source + Browser:** original d6b6cd2 Audiowide stack, upper weight400/uppercase, lower weight700/mixed case, zero letter spacing, colors and text shadows restored. CDP platform-font inspection confirms actual custom Audiowide-Regular glyph rendering, not fallback. Upper11px and category/team11.5px are deliberate fit sizes; canonical A–Z retains14.08/14.08/18.88px original clamp.
- Original8% angled panel, gradient, border and shadow restored. Lower hit container is transparent/borderless; only the readout paints the panel. No duplicate pseudo panels. No horizontal scaling.
- All12 upper label probes and nine lower probes fit their clipped polygons. Individual nonspace glyph Range corners remain within the actual SVG body/base faces. Sampled painted panel outline also stays inside the physical face union.
- No corrected arrow/text Range overlap. Actual arrow ink metrics place chevrons3.64/4.02/8.11px below the upper panel, inside the painted body/base. Leading whitespace in mobile Range boxes extends above the ink; screenshots confirm no visible upper-panel collision.
- Lower44px-wide buttons retain full effective hit coverage:2068/2068,2376/2376 and4048/4048 sampled points per button. This run verifies effective bounds; prior PASS48 native click/keyboard behavior is reused because handlers are unchanged.
- Screen rectangles unchanged from PASS48 at all three sizes; crystal anchor remains unchanged. No document horizontal overflow. Corrected mobile and desktop screenshots inspected for mounted appearance and Engine obstruction.

| Viewport | Lower panel | Lines: short / medium / longest | Effective lower target | Engine clearance |
|---|---:|---:|---:|---:|
|360×800|183.38×39.27px|2 / 3 / 3|44×47px|7.625px|
|412×915|209.88×44.94px|1 / 2 / 3|44×54px|2.781px|
|1920×1080|355.30×76.06px|1 / 2 / 2|44×92px|0.453px|

The three strings are Announcers Commentary; International Championship Wrestling Performers; and The Butcher and the Blade with All Elite Championship Wrestling. Longest mobile content uses three lines, prioritizing the requested original font over the earlier two-line preference. Desktop clearance is tight but positive, with no observed Engine title/emitter obstruction.

## Issues found and resolved

Initial desktop panel overlapped the Engine region1.266px; initial mobile arrow/text Range bounds intersected. Builder restored bottom518 and separated arrow ink while preserving hit rectangles. Corrected checks pass. QA made no source corrections.

## Evidence

- [Corrected measurements](corrected-measurements.json): nine label cases, upper four-label probes, glyph bounds, hit ownership and geometry.
- [Actual ink and painted outline](ink-and-panel.json): arrow ink metrics and physical polygon sampling. Its A–Z field was an incomplete probe; use the canonical artifact below instead.
- [Canonical A–Z probe](az-canonical-probe.json): correct az mode and original font clamp. Earlier az-corrected-probe used the noncanonical letter identifier and is not acceptance evidence.
- [Initial font/style evidence](measurements.json): actual CDP Audiowide proof and original-style computed values; also preserves initial defects.
- [360 screenshot](corrected-360.jpg), [412 screenshot](corrected-412.jpg), [1920 screenshot](corrected-1920.jpg).

## Not verified

Physical S25, other browsers, Chris's visual acceptance, API correctness and unrelated navigation are outside this focused run. Reduced-motion geometry evidence is reused from PASS48; no animation behavior changed. No generic harness run: it does not assert glyph/polygon containment and the parent explicitly requested focused geometry only.
