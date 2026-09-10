# Codex UI Animation Checklist

## Authority and verification scope

Classification: **CURRENT / SPECIALIZED**. This checklist implements [PROJECT_RULES.md](PROJECT_RULES.md) and [Experience Build rules](V3_EXPERIENCE_BUILD_RULES.md); it does not create a separate policy hierarchy. Consult [World Bible](design/world-bible.md) for protected creative decisions.

Scope stays small; verification may be thorough. Use existing browser/QA automation and relevant comparisons within the authorized scope, correct findings, and retest. Check all affected protected behavior when shared code changes. New test artifacts require an allowed location. Report passed, failed, and skipped checks separately; technical readiness is not Chris's subjective animation approval. Include device-recording review status where applicable.

Use this checklist before, during, and after every V3 UI animation edit.

Use [$v3-qa](../.agents/skills/v3-qa/SKILL.md) to choose proportional checks and `npm run v3:qa -- route /wrestling/shows` (substitute the affected route) for generic responsive/reduced-motion health. Generic checks do not replace gesture, frame/pixel, or device review; do not default to `all`. Modes and current workflow status live in [Current State](CURRENT_STATE.md).

Where multi-agent work is appropriate, the parent coordinates Scout diagnosis → Builder implementation → independent QA → Reviewer. QA reports in-scope defects to Builder through the parent for correction/retest; QA/Reviewer do not repair application code. Chris does not relay routine findings. Keep Source Verified, Browser Verified, Automated Test Verified, Device Verified, and Human Visual Signoff distinct; AI review never supplies Chris's cinematic approval.

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

- Check mobile first at 360×800 and 412×915; check affected breakpoint boundaries too.
- Check desktop at 1920×1080 after mobile behavior is stable.
- Check reduced motion.
- Check no flicker, no overlap, no layout shift, and no hidden loading flash. For changed transitions, inspect visible start/handoff/cleanup frames and repeat/cancel behavior; computed visibility alone is insufficient.
- Check no horizontal overflow.
- Check scroll behavior on long pages.
- Check route, deep-link, SPA navigation, and browser back behavior.
- Check loading, empty, and unavailable states if the edit touches data surfaces.
- Run syntax checks and tests relevant to the files changed.
- Recheck any approved or protected page affected by shared code.
- Return a full handoff report with files changed, functions or areas changed, references used, verification run, skipped checks, risks, and signoff recommendation.
