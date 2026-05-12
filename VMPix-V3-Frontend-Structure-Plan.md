# VMPix-V3 Frontend Structure Plan

This document defines the initial frontend structure plan for VMPix-V3. It is planning documentation only. It does not build UI, create the admin shell, create route files, move files, wire backend APIs, or add frameworks/dependencies.

## 1. Purpose of the Frontend Repo

VMPix-V3 is the frontend/UI source of truth for the next VMPix site experience.

The repo is intended to support:

- One frontend repo.
- One home screen.
- One universal shell.
- Shared UI systems.
- Static-first architecture.
- Mobile-first layout.
- Vanilla-first HTML/CSS/JS unless a framework becomes necessary later.
- Public-facing route goals such as `/music` and `/wrestling`.
- A future protected admin shell inside the same frontend ecosystem.

VMPix-V3 will eventually replace V2, but V2 remains live for now.

## 2. Relationship Between VMPix-V3 and VMPix-Data

`VMPix-V3` is responsible for frontend structure, UI, shell behavior, routing behavior, shared tokens, visual systems, and client-side interaction patterns.

`VMPix-Data` is responsible for backend/API behavior, data contracts, source data, import pipelines, relationships, locks, stats, and future operational data services.

The frontend should be designed so VMPix-Data APIs can be integrated later without reshaping shell layout or routing. API wiring should enter through planned module boundaries after shell/layout stability is proven.

## 3. Relationship Between VMPix-V3 and Old VMPix/V2 Donor Systems

The older VMPix repo and V2 systems are donor/reference only.

V2 may be studied for content, behavior, route expectations, visual ideas, and reusable implementation concepts. It is not authoritative for V3 architecture, folder organization, route structure, styling, shell behavior, or responsive layout.

No V2 or old VMPix system should be copied directly into V3 unchanged. Any reused system must be adapted to V3 standards before shipping.

## 4. Public Route Philosophy

Routes are public-facing. Folders are internal architecture.

Do not let folder structure force route structure.

Final public-facing route goals include:

- `/music`
- `/wrestling`

Internal files do not need to mirror those URLs. For example:

- Public route: `/music`
- Possible internal module: `assets/js/modules/music.js`
- Possible future module folder: `assets/js/modules/music/`

Public routes should remain stable user-facing contracts. Internal organization should be optimized for maintainability, shell integration, and module boundaries.

## 5. Admin Route Philosophy

The admin shell will eventually live inside the VMPix-V3 frontend repo and will be protected/authenticated later.

Planned admin route examples include:

- `/admin/dashboard`
- `/admin/imports`
- `/admin/music`
- `/admin/wrestling`
- `/admin/relationships`
- `/admin/stats`
- `/admin/logs`
- `/admin/settings`

These routes are planning targets only. Do not implement them yet.

Admin routes should not replace or conflict with public routes such as `/music` and `/wrestling`. The admin shell should feel like a protected operational zone inside V3, not a separate frontend or disconnected app.

## 6. Internal Folder Strategy

The folder strategy should separate public URL intent from internal source organization.

Proposed future structure:

```text
VMPix-V3/
|-- index.html
|-- admin/
|-- assets/
|   |-- css/
|   |   |-- tokens.css
|   |   |-- base.css
|   |   |-- shell.css
|   |   |-- animations.css
|   |   `-- modules/
|   |-- js/
|   |   |-- app.js
|   |   |-- router.js
|   |   |-- shell.js
|   |   |-- api/
|   |   |-- modules/
|   |   `-- shared/
|   |-- data/
|   |   `-- mock/
|   |-- images/
|   `-- fonts/
|-- docs/
`-- README.md
```

This is a plan only. Do not create the full folder tree until implementation work needs it.

Suggested responsibilities:

- `index.html` anchors the static-first entry point.
- `assets/css/tokens.css` defines shared V3 design tokens.
- `assets/css/base.css` defines browser normalization and base document behavior.
- `assets/css/shell.css` defines universal shell layout rules.
- `assets/css/animations.css` defines shared motion rules and reduced-motion behavior.
- `assets/css/modules/` holds module-specific CSS when needed.
- `assets/js/app.js` initializes the frontend.
- `assets/js/router.js` manages route resolution.
- `assets/js/shell.js` manages shell state and layout behavior.
- `assets/js/api/` holds future API adapters.
- `assets/js/modules/` holds public and admin module logic.
- `assets/js/shared/` holds shared helpers and UI utilities.
- `assets/data/mock/` holds early mock/local JSON.
- `docs/` holds planning, rules, handoff, and architecture documentation.

## 7. Static-First Build Strategy

VMPix-V3 should begin static-first.

Initial implementation should prefer:

- HTML.
- CSS.
- Vanilla JavaScript.
- Local/mock JSON data.

Do not add frameworks or dependencies until project complexity proves they are necessary.

Static-first development should establish shell behavior, routing behavior, viewport stability, shared tokens, mobile layout, and webview safety before adding live data, authentication, or heavier runtime tooling.

## 8. Mock Data Strategy

Early shell prototypes should support local/mock data before live API wiring.

Mock data should be used to validate:

- Module rendering.
- Loading states.
- Empty states.
- Error states.
- Dashboard composition.
- Responsive scaling.
- Operational admin flows.
- Public module layout behavior.

Mock/local JSON should be easy to replace later with VMPix-Data API adapters. Mock data should not become a permanent hidden source of truth.

Live VMPix-Data APIs should be integrated later after shell/layout stability.

## 9. Shared UI/Token Strategy

V3 should use shared UI tokens from the beginning.

Token areas should include:

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

Public areas and admin areas should use one shared V3 design system. Admin can feel more operational and tactical, but it should not fork into a separate visual language.

Shared tokens should support a futuristic, premium, cinematic, HUD-inspired V3 identity while keeping mobile usability and performance first.

## 10. Universal Shell Ownership

The universal shell owns:

- Layout.
- Routing.
- Viewport.
- Navigation.
- Transitions.
- Overlays.
- Global shell state.

The shell is responsible for continuity across public and future admin areas. It should prevent disconnected mini-app behavior, visual dead ends, unpredictable browser/back behavior, and route-specific layout systems that fragment V3.

## 11. Module Ownership

Modules own:

- Content.
- Internal drilldowns.
- Data rendering.
- Loading states.
- Empty states.
- Error states.

Modules should not own global routing, shell layout, viewport rules, global navigation, or disconnected app state.

Public modules such as future music and wrestling modules should live inside the universal shell. Admin modules should also live inside the same shell philosophy, even when protected later.

## 12. Donor Import Staging Strategy

V2/old VMPix systems may be reused later, but only after adaptation.

All donor systems must be adapted to:

- V3 shell standards.
- Mobile-first layout.
- Responsive scaling.
- Shared tokens.
- Webview safety.
- Performance-first animation rules.

Suggested staging process:

- Identify donor behavior or content worth preserving.
- Document what the donor system does.
- Strip assumptions tied to V2 layout, routing, or styling.
- Rebuild the behavior against V3 shell boundaries.
- Replace hard-coded dimensions with responsive rules.
- Validate on mobile before desktop.
- Confirm the result does not create a disconnected module.

Donor code is reference material. V3 standards decide what ships.

## 13. Mobile-First File Organization

File organization should make mobile-first work easy to maintain.

Recommended rules:

- Put shared viewport rules in shell-level CSS, not scattered module overrides.
- Keep touch target sizing in shared tokens.
- Keep motion rules centralized so reduced-motion and mobile performance are consistent.
- Keep module files focused on module content and state.
- Avoid desktop-only module structures that require later mobile rewrites.
- Keep mock data near frontend assets until live APIs replace it.

Samsung S25 Ultra is the primary test device. Layout should start mobile-first, then scale up.

## 14. Render Deployment Strategy

V2 remains live at `vmpix.onrender.com` for now.

V3 should be developed on its own separate Render Static Site or preview service first. The current live site should remain untouched during V3 development.

Deployment rules:

- Do not point `vmpix.onrender.com` to V3 during early development.
- Use a separate Render Static Site/preview for V3 validation.
- Keep V2 live while V3 shell, routes, layout, mobile behavior, and future data integration are developed.
- Use the V3 preview service for QA before any public cutover.

## 15. Future Launch/Cutover Strategy

When V3 is complete and validated, the public Render service/domain can be moved, swapped, or renamed to point to V3.

Cutover should happen only after:

- Public routes such as `/music` and `/wrestling` are stable.
- Mobile-first QA is complete.
- Webview behavior is validated.
- Shell routing and browser/back behavior are predictable.
- VMPix-Data integration is stable where required.
- Fallback states are handled.
- V2 donor behavior has been adapted, not copied unchanged.
- The V3 deployment has been tested independently from the live V2 service.

The launch strategy should preserve continuity for users while replacing the V2 frontend with the V3 frontend when ready.

## 16. What Should NOT Be Built Yet

Do not build the following during structure planning:

- UI screens.
- The admin shell.
- Route files.
- Layouts.
- Components.
- Live backend/API wiring.
- Authentication.
- Role systems.
- Framework setup.
- New dependencies.
- Full folder trees that are not yet needed.
- Direct V2 component ports.
- Changes to the live V2 Render service.

This planning stage exists to make the future implementation safer, smaller, and more coherent.
