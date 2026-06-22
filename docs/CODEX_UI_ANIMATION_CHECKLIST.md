# Codex UI Animation Checklist

Use this checklist before, during, and after every V3 UI animation edit.

## Before Editing

- Read `docs/V3_EXPERIENCE_BUILD_RULES.md` first.
- Identify the exact page, route, shell area, or component being edited.
- Confirm whether the page, effect, or shared shell behavior is already approved or protected.
- Inspect any provided reference index file, prototype, screenshot, or donor page.
- Identify which donor parts are requested and import only those parts.
- Confirm the expected route behavior: direct link, SPA navigation, browser back, and deep-link state.
- Define the route handoff point if routing or view changes are part of the animation.
- Identify loading risks and decide whether to preload, skeletonize, or mask loading inside the experience.
- Identify mobile viewport targets before designing desktop refinements.

## During Editing

- Preserve shell continuity: rail, current-view state, global navigation, archive build identity, and shell visibility.
- Keep animation native HTML/CSS/JS unless the task explicitly justifies heavier media.
- Do not make navigation or route availability dependent on pre-rendered video, Lottie, or external media.
- Avoid broad redesigns outside the requested page or effect.
- Keep data readable and usable during and after animation.
- Avoid flicker, overlap, layout shift, scroll traps, and horizontal overflow.
- Keep touch targets usable on mobile.
- Implement reduced-motion behavior that still feels designed.
- Protect approved pages and effects from incidental changes.

## After Editing

- Check mobile first.
- Check desktop after mobile behavior is stable.
- Check reduced motion.
- Check no flicker, no overlap, no layout shift, and no hidden loading flash.
- Check no horizontal overflow.
- Check scroll behavior on long pages.
- Check route, deep-link, SPA navigation, and browser back behavior.
- Check loading, empty, and unavailable states if the edit touches data surfaces.
- Run syntax checks and tests relevant to the files changed.
- Recheck any approved or protected page affected by shared code.
- Return a full handoff report with files changed, functions or areas changed, references used, verification run, skipped checks, risks, and signoff recommendation.
