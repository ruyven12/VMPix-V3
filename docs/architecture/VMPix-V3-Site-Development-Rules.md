# VMPix-V3 Site Development Rules

This document defines the initial frontend foundation rules for VMPix-V3. It is documentation only: it does not start the admin shell, create screens, port V2 components, or wire live backend data.

## 1. Project Ownership

VMPix-V3 is the frontend source of truth for the VMPix site experience.

The V3 frontend is responsible for:

- One shared frontend repo.
- One home screen.
- One universal site shell.
- Shared UI systems and design language.
- Public V3 routes, including routes such as `/music` and `/wrestling`.
- The future admin shell, which will live inside the frontend and be password protected later.

The frontend must remain unified. Public areas and future admin areas should share the same V3 design language, viewport logic, routing approach, token system, and shell behavior.

## 2. Repo Roles

VMPix-V3 and VMPix-Data have separate responsibilities.

- `VMPix-V3` is the frontend source of truth.
- `VMPix-Data` is the backend/API source of truth.
- Older VMPix repos and V2 systems are donor/reference material only.

Old repo code is not authoritative for V3 architecture, layout, routing, styling, state, or interaction patterns. Existing V2 systems may inform later implementation work, but they must be adapted to V3 standards before reuse.

## 3. Universal Shell Philosophy

V3 should be built around one universal shell instead of disconnected mini-apps.

The universal shell owns:

- Layout.
- Routing.
- Viewport behavior.
- Navigation.
- Page and module transitions.
- Overlays.
- Global state.

Modules own:

- Content.
- Internal drilldowns.
- Data rendering.
- Loading states.
- Empty states.
- Error states.

No module should become its own disconnected app. The shell must provide continuity across the site so users do not hit visual dead ends, broken navigation paths, or unpredictable browser/back behavior.

## 4. Public Frontend Rules

Public V3 routes must remain part of the shared frontend experience.

- Preserve public routes such as `/music` and `/wrestling`.
- Keep public modules inside the universal shell.
- Use shared shell navigation, shared tokens, and shared layout primitives.
- Avoid route-specific styling systems that fragment the product.
- Avoid standalone pages that bypass shell behavior.
- Keep browser navigation predictable.
- Keep drilldowns reversible with normal browser/back expectations.

Public pages may have distinct content and mood, but they should still feel like part of one VMPix-V3 system.

## 5. Admin Shell Rules

The admin shell will be added later. Do not build it until the frontend shell and layout foundation are stable.

When added, the admin shell should:

- Live inside the VMPix-V3 frontend.
- Be password protected later.
- Use the same V3 design language as public areas.
- Feel more operational, tactical, and information dense than public routes.
- Behave like a command center, archive operations HUD, diagnostics cockpit, and backend orchestration layer.

Admin must not become a separate visual product or disconnected app. It should share shell architecture, token rules, webview safety expectations, responsive behavior, and performance budgets with the rest of V3.

## 6. Donor/V2 Import Rules

Nothing from V2 or the older VMPix repo should be copied directly into V3 unchanged.

Every donor system must be adapted to:

- V3 mobile-first rules.
- Universal shell architecture.
- Shared UI tokens.
- Responsive scaling.
- Webview safety.
- Reduced layout bugs.
- Performance-first animation rules.

Before importing any donor component, review it for layout assumptions, fixed viewport behavior, fragile absolute positioning, route isolation, nested scroll behavior, animation cost, accessibility issues, and mobile/webview risks.

Donor code can be useful reference material, but V3 standards decide what ships.

## 7. Mobile-First Rules

VMPix-V3 starts from mobile and scales up.

- Samsung S25 Ultra is the primary test device.
- Design mobile layouts first, then scale to tablet and desktop.
- Prefer stable, flexible layout primitives over fixed-position visual tricks.
- Avoid nested scroll traps.
- Use safe touch targets.
- Keep tap zones reachable and readable.
- Prevent text, buttons, cards, overlays, and media from overlapping at narrow widths.
- Stability and usability come before flashy effects.

Mobile should not be treated as a reduced desktop layout. It is the baseline experience.

## 8. Webview Hardening

V3 must support embedded browser environments such as Facebook, Messenger, Instagram, and X/Twitter webviews.

Webview hardening rules:

- Avoid assumptions about full browser chrome.
- Account for safe areas and dynamic viewport height.
- Avoid fragile `100vh` behavior where mobile webviews can resize unexpectedly.
- Keep fixed and sticky elements tested on mobile.
- Avoid nested scrolling patterns that can trap users.
- Keep navigation and back behavior predictable.
- Ensure overlays can be dismissed safely.
- Keep critical UI usable when advanced effects, media, or scripts fail.

Webview reliability is part of the core frontend quality bar, not a later polish pass.

## 9. Static-First Build Approach

V3 should use a static-first build approach.

Default technology choices:

- HTML.
- CSS.
- Vanilla JavaScript.

A framework should only be introduced later if the frontend complexity clearly requires it. The first implementation path should keep the shell lightweight, inspectable, and portable.

Static-first does not mean static forever. It means shell, layout, routing, and interaction stability should be proven before adding heavier runtime dependencies or live data complexity.

## 10. Routing Philosophy

Routing should reinforce the universal shell.

- The shell owns route changes and global navigation behavior.
- Public routes should remain stable and predictable.
- Browser/back behavior must work naturally.
- Deep links should resolve to coherent shell states.
- Internal drilldowns should not strand the user.
- Modules should not create isolated routing systems that conflict with shell routing.

Routing should make the site feel continuous, not like a set of unrelated pages.

## 11. Shared UI/Token Rules

V3 should use shared UI tokens and layout primitives from the start.

Shared tokens should cover:

- Color.
- Typography.
- Spacing.
- Radius.
- Borders.
- Shadows.
- Z-index layers.
- Motion timing.
- Touch target sizing.
- Breakpoints.

The V3 design language should feel futuristic, premium, cinematic, HUD-inspired, tactical where needed, and unified across public and admin areas.

Admin styling can be more operational and dense, but it should still be recognizably V3. Public and admin areas should not fork into unrelated design systems.

## 12. Performance/Animation Budget

Performance is part of the design system.

- Prefer lightweight animation.
- Avoid excessive particles.
- Avoid heavy blur stacks.
- Avoid giant shadows.
- Avoid expensive filters on mobile.
- Treat advanced visual effects as progressive enhancements.
- Keep shell navigation usable if effects fail.
- Prefer transform and opacity animations when motion is needed.
- Respect reduced motion preferences.
- Test animation cost on mobile-sized viewports.

The shell must remain fast, stable, and usable before any cinematic effect is considered successful.

## 13. QA Before Handoff

Before handoff, verify:

- Public routes still resolve as expected.
- Browser/back behavior remains predictable.
- Mobile layouts work first.
- Samsung S25 Ultra-sized viewport is tested.
- No nested scroll traps were introduced.
- Touch targets are safe.
- Webview-sensitive viewport behavior is considered.
- Text does not overlap or overflow key UI.
- Shell transitions do not block navigation.
- Loading, empty, and error states are accounted for where relevant.
- Advanced effects degrade safely.
- No live backend dependency is required for the shell to render.

For documentation-only changes, confirm that no UI implementation, live backend wiring, or route behavior changes were introduced.

## 14. Future Live Data Integration

VMPix-Data APIs will be integrated later after shell/layout stability.

Future live data integration should:

- Treat `VMPix-Data` as the backend/API source of truth.
- Keep API concerns out of shell layout decisions.
- Add loading, empty, and error states at module boundaries.
- Preserve static-first fallback behavior where practical.
- Avoid blocking shell rendering on live data.
- Keep public routes stable during integration.

Live backend wiring should wait until the V3 shell, layout system, routing philosophy, and shared UI tokens are stable enough to support it cleanly.
