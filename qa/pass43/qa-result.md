# PASS 43 QA result

**Verdict: PASS — human visual review required on the physical Samsung S25.**

The final frozen implementation passed independent browser verification at 360 × 800, 412 × 915 and 1920 × 1080 with normal and reduced motion. QA changed no application, test or harness files.

## Layout and correction

The initial mobile landscape test exposed navigation arrows overlapping the IN FRAME caption after the action row moved the image upward. The Builder anchored the arrows to the actual image center. All six corrected viewport/motion cases passed with both portrait and landscape images, including ten long caption names. Across 12 states, maximum group centering error was 0.008 px, maximum arrow centering error was 0.461 px, and minimum Engine clearance was 8.688 px. No horizontal overflow or arrow/caption overlap remained. The long caption stays contained in its existing scrollable strip. Corrected mobile evidence was visually inspected.

Evidence: [corrected measurements](corrected-layout.json), [mobile long caption](corrected-360-no-preference-1.jpg), [desktop long caption](corrected-1920-no-preference-1.jpg). The original actions-* screenshots and layout-matrix.json preserve the pre-correction evidence.

## Actions and source selection

- Native same-origin downloads passed mouse click, touch tap and keyboard Enter. Each saved a real 545,611-byte PNG as `vmpix-photo-1.png`, with the original photo route unchanged. Files are download-click.png, download-tap.png and download-keyboard.png. A mocked download response was canceled by Chrome; the final checks used an actual file served by the local preview.
- Cross-origin click, tap and Enter each opened exactly one tab at the selected large-image URL. Each new tab had no opener, and the original viewer remained on photo 002. The save-image guidance was visible.
- Explicit large sources were selected and changed with Previous/Next. A normalized viewer URL correctly outranked a raw thumbnail. Unsafe JavaScript/data sources produced no download URL; the disabled action had no href, aria-disabled=true and tabIndex=-1.
- BUY PRINT remained a native disabled button with COMING SOON and an accessible explanation. Programmatic click caused no purchase action.
- After the displayed image had loaded, the idle observation recorded zero extra requests. Normal viewer image loading is distinct from an intentional download. The implementation uses native anchors rather than a proxy, fetch or blob download path.

Evidence: [native action results](download-events.json), [source safety and navigation](safety-history-exclusion.json).

## Navigation and isolation

A deterministic cold direct photo route opened correctly. Close returned to the match gallery, reopening and Next selected photo 002, browser Back returned to the match, and Forward restored photo 002. The gallery retained `2 / 2 LOADED`. Moving to the shared Music viewer removed the match marker, hid the action row, cleared its download href and removed the image-center arrow override. No new action styling leaked into that viewer.

The existing route-health harness passed **6/6** tests for `/wrestling/shows/080826/match-1/photo/001` (normal/reduced motion at all three sizes; exit 0). Layout and action tests use controlled photo/API fixtures; native file saving was verified against a real served image. This does not establish remote image-host availability or physical Samsung S25 rendering.
