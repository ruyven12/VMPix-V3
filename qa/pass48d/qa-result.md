# PASS48D V3 QA Result

**PASS — HUMAN VISUAL REVIEW REQUIRED.** The authorized widened/deepened first tier passes the focused technical checks. Physical S25 and Chris's visual signoff remain pending.

## Scope

/wrestling/people; long CATEGORY and TEAM labels at360×800,412×915,1920×1080, normal motion. Existing Chrome/Playwright preview, inline browser verification, presentation-only label probes. No API fixtures, Person routes, broad suite or source/test edits by QA.

## Checks passed

- Full names retain11.5px,700 Audiowide and original angled appearance. The earlier actual CDP font proof is reused; this run also explicitly awaited Audiowide loading.
- CATEGORY: International Championship Wrestling Performers. TEAM: The Butcher and the Blade with All Elite Championship Wrestling. Both fit in two lines on mobile; desktop CATEGORY is one line and TEAM two. No truncation, horizontal scaling or ellipsis.
- Individual actual glyph ink corners, angled panel outline samples and arrow ink are inside the **first path only**, not a union with deeper tiers. No own-panel clipping or arrow/text overlap in all six cases.
- Three tiers share the same center within0.00003px. Two lower bands remain visible and equal in height at each size; outer640×520SVG footprint remains unchanged.
- Middle selector, crystal and expanded-screen rectangles exactly match the PASS48C baseline at all three sizes. No document horizontal overflow.
- Effective lower hit regions retain complete ownership at all sampled pixel centers:1716/1716,1936/1936 and3300/3300 per button. Handler behavior is unchanged; previous native interaction checks are reused.

| Viewport | First tier height | Label panel | CATEGORY / TEAM lines | Lower target rectangle | Each deeper band | Panel→Engine gap |
|---|---:|---:|---:|---:|---:|---:|
|360×800|41.241px|250.95×28.08px|2 / 2|44×38.59px|4.387px|16.406px|
|412×915|47.198px|287.20×32.13px|2 / 2|44×44.17px|5.021px|12.828px|
|1920×1080|79.900px|486.19×54.39px|1 / 2|44×74.80px|8.5px|17.453px|

The360 target is less than44px tall; its measured effective area is reported honestly. No new Engine overlap from the controls. The pre-existing outer pedestal footprint is unchanged.

Mobile TEAM screenshot inspected: full two-line text readable, arrows separate, lower bands visible. This provides technical/assistant visual evidence, not user approval of proportions.

## Evidence

[Measurements](measurements.json) contain all six cases, glyph ink, polygon checks, tier paths/rectangles, hits and protected geometry. Screenshots: [360](team-360.jpg), [412](team-412.jpg), [1920](team-1920.jpg). They show synthetic presentation labels on the live Hall shell; they are not assertions about archive records.

## Limitations

No physical-device check, other browser, API correctness, navigation regression suite or new reduced-motion run. This is the requested focused static geometry check. No observed issue remains within that scope; human visual acceptance is still required.
