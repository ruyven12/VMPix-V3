# VMPix-V3 Project Rules

This file is the persistent source of truth for VMPix-V3 project behavior. Future Codex sessions and contributors should read it before making changes.

## 1. V3 Is The Definitive Rebuild

VMPix-V3 is the definitive rebuild of the VMPix frontend experience. It is not a patch layer over V2, not a partial skin, and not a temporary experiment.

V3 decisions should be made for the long-term V3 architecture, even when V2 remains live during development.

## 2. V2 And Live Systems Are Donor/Reference Only

V2, older VMPix repos, and the current live site are donor/reference systems only.

They may be studied for content, behavior, route expectations, visual ideas, and reusable implementation concepts. They are not authoritative for V3 architecture, layout, routing, styling, shell behavior, data flow, or responsive behavior.

Do not edit V2 or live-site systems first. V3 work happens in VMPix-V3 unless an explicit cutover or deployment task says otherwise.

## 3. Mobile-First Always

V3 is mobile-first by default. Design, layout, interaction, and QA decisions start from mobile and scale up to tablet and desktop.

Mobile is not a reduced desktop layout. It is the baseline experience.

Rules:

- Build for narrow screens first.
- Keep touch targets safe and reachable.
- Prevent text, controls, media, cards, overlays, and navigation from overlapping.
- Avoid nested scroll traps.
- Prefer flexible layout primitives over fixed-position tricks.
- Validate mobile behavior before desktop polish.

## 4. Samsung S25 Ultra / Webview Safety

Samsung S25 Ultra is the primary mobile test target.

V3 must also survive embedded browser environments, including Facebook, Messenger, Instagram, X/Twitter, and similar mobile webviews.

Rules:

- Do not rely on fragile `100vh` behavior.
- Account for dynamic viewport height.
- Handle safe areas.
- Keep fixed and sticky UI tested on mobile.
- Make overlays dismissible and recoverable.
- Keep browser/back behavior predictable.
- Ensure critical UI remains usable if advanced effects, media, or scripts fail.

## 5. Shell Ownership

The universal shell owns global experience behavior.

The shell owns:

- Routing.
- Layout.
- Transitions.
- Navigation.
- Viewport behavior.
- Overlays.
- Global shell state.

Modules must not take ownership of shell responsibilities.

## 6. Engine Bar Lifecycle Belongs To The Shell

The Home Screen (`/`) is the only route that does not display the persistent Engine Bar by default.

The Home Screen is responsible for:

- Archive activation.
- Lightning convergence.
- Title reconstruction.
- START interaction.
- Ignition sequence.

The Engine Bar is created during ignition and becomes part of the V3 Shell. After the user enters the portfolio experience, the Engine Bar remains persistent across all routes and modules, including:

- `/portfolio`
- `/music/*`
- `/wrestling/*`
- `/calendar`
- `/about`
- `/contact`
- Future modules.

The Engine Bar is owned by the shell, not by modules. Modules may update Engine Bar content, labels, state, or context, but they may never create, destroy, replace, or manage the Engine Bar lifecycle.

Route changes should update Engine Bar state without rebuilding the component.

Architectural intent: the Engine Bar represents the archive engine powering the V3 experience. It is brought online once and remains active for the duration of the user session.

## 7. Modules Remain Independent

Modules own their own content and local behavior, but they must remain inside the V3 shell contract.

Modules own:

- Content.
- Internal drilldowns.
- Data rendering.
- Loading states.
- Empty states.
- Error states.

Modules must not become disconnected mini-apps, create isolated routing systems, fork global layout behavior, or bypass shared navigation expectations.

## 8. Static-First Frontend Philosophy

V3 frontend work is static-first unless explicitly approved otherwise.

Default frontend tools:

- HTML.
- CSS.
- Vanilla JavaScript.
- Local/mock data where needed for shell and module validation.

Static-first does not mean static forever. It means shell, layout, routing, viewport safety, and interaction behavior must be stable before heavier runtime complexity is introduced.

## 9. Backend-First Data Philosophy

Data authority belongs in the backend/API layer, not hidden inside frontend code.

VMPix-Data is the backend/API source of truth for source data, contracts, relationships, imports, stats, locks, and future operational services.

Frontend modules may use mock or local data during development, but those mocks must remain replaceable. Do not let frontend fixtures become a permanent source of truth.

## 10. No Frameworks Unless Explicitly Approved

Do not add frameworks, build systems, libraries, runtime dependencies, package dependencies, UI kits, routers, state managers, or animation packages unless the user explicitly approves that decision.

Vanilla HTML/CSS/JS remains the default path.

## 11. No Live-Site Edits First

Do not make the current live V2 site or live deployment the first edit target for V3 work.

V3 should be built and validated independently before any public cutover, deployment swap, or live-system change.

## 12. Surgical Edits Only

Make the smallest coherent change that satisfies the task.

Rules:

- Do not rewrite unrelated files.
- Do not reformat broad areas casually.
- Do not rename or move files without need.
- Do not alter routing, layout, or design systems unless the task requires it.
- Preserve existing behavior outside the requested scope.

## 13. Restrained Cinematic HUD Style

The V3 visual identity should feel premium, cinematic, tactical, and HUD-inspired, but restrained.

Rules:

- Favor clarity over spectacle.
- Use motion and glow as accents, not as the product.
- Avoid heavy blur stacks, excessive particles, giant shadows, and noisy decoration.
- Keep public and future admin areas recognizably part of one V3 system.
- Do not accidentally redesign the product while making narrow fixes.

## 14. Performance Matters

Performance is part of the V3 design system.

Rules:

- Prefer lightweight animation.
- Use transform and opacity for motion when possible.
- Respect reduced-motion preferences.
- Treat advanced visuals as progressive enhancement.
- Keep navigation responsive on mobile.
- Avoid blocking shell rendering on live data.
- Keep CSS and JavaScript understandable and portable.

## 15. Animation Iteration Workflow

For V3 animation and interaction polish, use one-change-at-a-time development.

Rules:

- Add or adjust only one visual or interaction element per pass.
- Keep each pass surgical and reversible.
- Do not bundle multiple animation ideas into one edit.
- Do not redesign nearby systems unless explicitly requested.
- Prefer CSS-first changes using transform and opacity.
- Preserve reduced-motion behavior.
- Preserve mobile and webview performance.
- Do not change routing, data wiring, module logic, or shell lifecycle unless the prompt explicitly asks.

Testing workflow:

1. Make one scoped change.
2. Run focused syntax checks or tests when available.
3. User records the result on the target device when motion is involved.
4. Review the recording.
5. Decide: keep, revise, or revert.
6. Move to the next single element only after the current pass is accepted.

Video recordings are the preferred review method for animation timing, flicker, pacing, mobile smoothness, and transition feel.

## 16. Safe-Area Handling

Safe-area behavior is required, not optional polish.

Rules:

- Account for notches, rounded corners, browser UI, and webview chrome.
- Use safe-area insets where fixed or edge-aligned UI appears.
- Keep critical controls away from unsafe edges.
- Test viewport changes caused by mobile browser chrome.

## 17. No Route Chaos

Routing must reinforce the universal shell.

Rules:

- The shell owns route changes and global navigation behavior.
- Public routes must remain stable and predictable.
- Browser/back behavior must work naturally.
- Deep links should resolve to coherent shell states.
- Internal drilldowns must not strand the user.
- Modules must not create competing routers or hidden route state.

## 18. No Accidental Redesigns

Do not make visual, structural, or interaction redesigns unless the task explicitly asks for them.

A bug fix is not permission to redesign a module. A content edit is not permission to change layout. A routing fix is not permission to restyle the shell.

## 19. Complete Ready-To-Use Files When Editing

When editing a file, return the file in a complete, ready-to-use state.

Rules:

- Do not leave placeholders unless explicitly requested.
- Do not leave partial snippets that require manual reconstruction.
- Do not omit required imports, selectors, handlers, markup, or styles.
- Keep files internally consistent after each edit.
- Verify syntax where practical before handoff.

## 20. Explicit Non-Goals Unless Approved

Unless explicitly requested, do not:

- Edit app code for documentation-only tasks.
- Change routes.
- Touch V2.
- Add dependencies.
- Introduce frameworks.
- Rework layout architecture.
- Replace the shell pattern.
- Wire live backend data.
- Change deployment targets.
