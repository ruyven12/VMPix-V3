# VMPix-V3 Admin Shell Blueprint

This document defines the initial architecture and UX planning direction for the future VMPix-V3 admin shell. It is planning documentation only. It does not create the admin shell, UI files, layouts, components, routes, backend/API wiring, authentication, or framework dependencies.

## 1. Admin Shell Purpose

The VMPix-V3 admin shell will become the operational layer inside the V3 frontend ecosystem.

Its long-term purpose is to support:

- Operational dashboard workflows.
- Diagnostics HUD views.
- Archive monitoring.
- Backend orchestration.
- Import management.
- Relationship monitoring.
- Future media/archive workflows.
- Future publishing and sync workflows.
- Future entity review and editing.
- Future operational tooling for VMPix systems.

The admin shell should feel futuristic, premium, tactical, cinematic, HUD-inspired, operational, lightweight, mobile-first, and webview-safe.

It is not a separate disconnected app. It is part of the VMPix-V3 frontend and should share the same shell philosophy, design language, responsive rules, tokens, routing expectations, and performance standards as the public frontend.

## 2. Universal Shell Philosophy

VMPix-V3 uses one universal shell.

The universal shell owns:

- Layout.
- Routing.
- Viewport behavior.
- Navigation.
- Transitions.
- Overlays.
- Global shell state.

Admin modules own:

- Content.
- Internal drilldowns.
- Data rendering.
- Loading states.
- Empty states.
- Error states.

No admin module should become its own standalone app. Each module should live inside the shared viewport and navigation model so the admin experience remains continuous, reversible, and predictable.

The shell should prevent visual dead ends. Users should always understand where they are, how to move to another operational area, and how browser/back behavior will respond.

## 3. Frontend/Backend Separation

`VMPix-V3` is the frontend/UI source of truth.

`VMPix-Data` is the backend/API source of truth.

The admin shell will live inside the VMPix-V3 frontend project later. It will be protected and authenticated later, but authentication is not part of the initial blueprint or Alpha 1 shell stabilization work.

Frontend planning should not hard-code backend assumptions. API integration should be designed around module boundaries so future data wiring can be added without destabilizing shell layout, navigation, or route behavior.

## 4. Static-First Strategy

Initial admin shell development should be static-first.

The default Alpha 1 implementation strategy should use:

- Static HTML.
- CSS.
- Vanilla JavaScript.
- Mock or local JSON data.

Do not introduce a framework unless the frontend complexity later proves that one is necessary.

Live VMPix-Data APIs should be connected later after shell/layout stability is proven. Static-first development should validate viewport behavior, navigation, dashboard composition, responsive scaling, and operational UX before live data introduces latency, failure states, and authentication concerns.

## 5. Alpha 1 Goals

Alpha 1 should focus on the admin shell foundation.

Primary Alpha 1 goals:

- Shell structure.
- Viewport layout.
- Navigation flow.
- Responsive scaling.
- Shared UI systems.
- Dashboard composition.
- Operational UX.
- Predictable route and browser/back behavior.
- Webview-safe layout behavior.
- Progressive enhancement boundaries.

Alpha 1 should not focus on:

- Advanced effects.
- Full live data integration.
- Destructive admin actions.
- Authentication systems.
- Role systems.
- Heavy analytics.
- Framework complexity.
- Large-scale V2 component ports.

Alpha 1 succeeds when the admin experience has a stable operational structure that can safely receive data, authentication, and richer workflows later.

## 6. Planned Module Structure

Likely future admin modules include:

- Dashboard.
- Imports.
- Locks.
- Relationships.
- Stats.
- Music.
- Wrestling.
- Logs.
- Settings.

Each module should follow the same shell contract:

- The shell controls the viewport and route.
- The module controls its content and internal drilldowns.
- The module provides loading, empty, and error states.
- The module avoids isolated app behavior.
- The module uses shared tokens and UI primitives.
- The module remains mobile-first and webview-safe.

Modules should be designed as operational surfaces, not marketing pages. Density, scanability, state clarity, and action safety matter more than decorative composition.

## 7. Dashboard Layout Regions

The Alpha 1 admin dashboard should likely explore these regions:

- Top status bar.
- Left desktop navigation.
- Bottom mobile navigation.
- Nexus Core center panel.
- Status cards.
- System alerts.
- Latest imports.
- Active locks.
- Quick commands.
- Shared viewport system.

These regions are planning concepts, not implementation requirements yet. They should be validated against mobile-first constraints before becoming fixed layout decisions.

The dashboard should work as a command-center overview: fast to scan, clear about system state, and easy to move from summary signals into focused module views.

## 8. Mobile-First UX Rules

Samsung S25 Ultra is the primary test device.

Mobile-first admin rules:

- Start with mobile layout, then scale up.
- Avoid nested scroll traps.
- Use large touch targets.
- Support one-handed usability where practical.
- Keep critical commands reachable.
- Keep status information readable without zooming.
- Avoid crowded controls that depend on desktop precision.
- Make overlays dismissible and stable.
- Preserve browser/back predictability.
- Support mobile webviews such as Facebook, Messenger, Instagram, and X/Twitter.
- Prioritize stability over visual overload.

The admin shell may be operational and dense, but it must not become cramped, fragile, or desktop-only.

## 9. Routing Philosophy

Admin routing should sit inside the V3 routing model and preserve public routes.

Recommended future admin route examples:

- `/admin/dashboard`
- `/admin/imports`
- `/admin/locks`
- `/admin/relationships`
- `/admin/stats`
- `/admin/music`
- `/admin/wrestling`
- `/admin/logs`
- `/admin/settings`

Public routes must remain preserved and unchanged, including:

- `/music`
- `/wrestling`

Routing rules:

- Admin routes should not replace or conflict with public routes.
- Browser/back behavior should remain predictable.
- Deep links should resolve to coherent shell states.
- Internal drilldowns should not strand users.
- Modules should not create competing routing systems.
- The shell should own global navigation and route transitions.

Admin should feel like a protected operational zone inside V3, not a second frontend.

## 10. Donor/V2 Import Rules

No donor or V2 systems should be copied directly into V3 unchanged.

All imported systems must be adapted to:

- V3 shell standards.
- V3 responsive rules.
- Mobile-first behavior.
- Shared design tokens.
- Performance-first animation rules.
- Webview-safe behavior.

Before importing donor systems, review them for fixed layout assumptions, route isolation, nested scrolling, desktop-only controls, hard-coded sizing, animation cost, API coupling, and styling that conflicts with V3 tokens.

V2 can provide ideas and implementation references later. V3 standards decide what is used.

## 11. Visual Language Direction

The admin shell should extend the V3 visual identity into a more tactical operational mode.

Visual direction:

- Cinematic HUD.
- Restrained glow usage.
- Tactical operational feel.
- Premium sci-fi.
- Layered transparency.
- Lightweight animation.
- Unified V3 identity.
- Clear system state indicators.
- High scanability.

The admin interface should feel like a command center, archive operations HUD, diagnostics cockpit, and backend orchestration layer. It should stay premium and cinematic without sacrificing clarity, speed, or mobile usability.

Glow, transparency, and HUD styling should support hierarchy and state. They should not obscure information or inflate rendering cost.

## 12. Animation/Performance Budget

Animations enhance function. They do not dominate function.

Performance rules:

- Use lightweight animations first.
- Prefer transform and opacity.
- Avoid expensive blur/filter stacks.
- Avoid excessive particles.
- Avoid giant shadows on mobile.
- Treat advanced visuals as progressive enhancements.
- Respect reduced motion preferences.
- Prioritize mobile performance.
- Keep shell usability intact if effects fail.

Motion should clarify state changes, route transitions, navigation, alerts, and overlays. It should never delay core admin work or make operational state harder to read.

## 13. Future Live API Integration

Live VMPix-Data APIs will be integrated later after shell/layout stability.

Future API integration should:

- Treat `VMPix-Data` as the backend/API source of truth.
- Add API wiring at module boundaries.
- Preserve shell rendering when data is loading or unavailable.
- Provide loading, empty, and error states in every data-driven module.
- Avoid blocking global navigation on live API calls.
- Keep public routes stable during admin integration.
- Avoid destructive actions until authentication, roles, confirmations, and audit behavior are designed.

Mock/local JSON data can support early layout and UX validation, but it should be clearly replaceable by future live API adapters.

## 14. Future Operational Platform Goals

Long-term admin shell goals include:

- Authenticated operational access.
- Role-aware admin surfaces.
- Entity editing and review workflows.
- SmugMug/media workflow management.
- Archive health monitoring.
- Import queue monitoring.
- Relationship diagnostics.
- Publishing and sync workflows.
- Logs, audit trails, and system diagnostics.
- Operational command surfaces with safe confirmations.

These goals should be layered onto the shell after the foundation is stable. The initial priority is to design a durable V3 admin environment that can grow without becoming fragmented, slow, or disconnected from the public frontend ecosystem.
