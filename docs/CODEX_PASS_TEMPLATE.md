# Codex Pass Template

Use this template when starting a VMPix-V3 Codex pass. Fill in the bracketed fields before handing the task to Codex.

## Project Name

Website-V3 / VMPix-V3

## Current Task

[Describe the exact task for this pass.]

## Repo Path

```text
C:\Users\deysx\Documents\GitHub\VMPix-V3
```

## Files Allowed

- [List exact files or directories Codex may edit.]
- Keep the allowed scope as small as possible.
- Documentation-only tasks should stay inside `docs/` unless explicitly stated.

## Files Not Allowed

- [List exact files or directories Codex must not edit.]
- V2 repositories and live-site systems are not allowed.
- Do not edit unrelated app files.
- Do not edit dependency files unless explicitly approved.

## Goal

[Describe the intended end state.]

The result should be complete, ready to use, and consistent with V3 project rules.

## Design Rules

- Preserve the existing V3 design language.
- No accidental redesigns.
- Use the restrained cinematic HUD style already established by V3.
- Keep visual changes scoped to the task.
- Favor clarity, usability, and consistency over spectacle.
- Avoid broad restyling unless explicitly requested.

## Architecture Rules

- Surgical edits only.
- Shell-first: the shell owns routing, layout, transitions, navigation, viewport behavior, overlays, and global shell state.
- Modules remain independent and own content, local drilldowns, data rendering, loading states, empty states, and error states.
- Static-first: default to HTML, CSS, and vanilla JavaScript.
- Backend-first: VMPix-Data is the future backend/API source of truth.
- No frameworks unless explicitly approved.
- No new dependencies unless explicitly approved.
- No V2 edits.
- Do not move, rename, or rewrite unrelated files.

## Responsive Requirements

- Mobile-first always.
- Samsung S25 Ultra and mobile webview safety matter.
- Test mobile and desktop when UI behavior changes.
- Avoid horizontal overflow.
- Avoid text, controls, media, cards, overlays, and navigation overlap.
- Keep touch targets usable.
- Account for safe areas and dynamic mobile viewport behavior.
- Avoid nested scroll traps.

## Route Requirements

- Do not change routes unless explicitly requested.
- Keep public routes stable.
- Check direct routes when route behavior changes.
- Browser/back behavior must remain predictable.
- Deep links should resolve to coherent shell states.
- Modules must not create competing routers.
- Preserve the Render SPA fallback requirement:

```text
Source: /*
Destination: /index.html
Action: Rewrite
```

## Performance/Safety Rules

- Performance matters.
- Prefer lightweight animation.
- Use transform and opacity for motion where possible.
- Respect reduced-motion preferences.
- Avoid heavy blur stacks, excessive particles, giant shadows, and expensive filters on mobile.
- Critical UI must remain usable if advanced effects, media, API data, or scripts fail.
- Frontend modules must tolerate missing, partial, delayed, or failed API data.
- Do not block shell rendering on live data.

## Do Not List

Do not:

- Edit app code for documentation-only tasks.
- Change routes unless explicitly requested.
- Touch V2.
- Add dependencies.
- Introduce frameworks.
- Rework layout architecture without approval.
- Replace the shell pattern.
- Wire live backend data unless explicitly requested.
- Change deployment targets.
- Make destructive edits.
- Perform broad formatting churn.
- Leave placeholder-only or partial files unless the task is explicitly a template or planning document.

## Sanity Checks

Before returning, Codex should check:

- Files edited are only within the allowed list.
- No files from the not-allowed list were touched.
- No dependencies were added.
- No routes were changed unless requested.
- No V2 files were touched.
- Existing design language was preserved.
- Mobile-first constraints were considered.
- Horizontal overflow risk was checked for UI changes.
- Mobile and desktop were tested when UI behavior changed.
- Direct routes were checked when route behavior changed.
- Loading, empty, and error states were considered when data behavior changed.
- The final files are complete and ready to use.

## Return Format

Return:

- Files edited.
- Summary of changes.
- Test results or sanity-check results.
- Any known limitations or follow-up work.

For UI or route work, include mobile/desktop test results and direct-route checks. For documentation-only work, state that no app code, routes, V2 files, or dependencies were changed.
