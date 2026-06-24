# V3 Experience Build Rules

These rules are project law for the V3 UI, animation, routing, and story experience phase. Codex must read this file before starting any UI animation task, then follow it unless the user explicitly supersedes a rule in the current task.

## V3 Reveal Build vs Ultimate Build

The V3 Reveal Build is the first public-feeling version of the experience. It must prioritize cohesive routing, polished transitions, strong mobile behavior, stable data usability, and a clear sense that every world belongs to one larger archive system.

The Ultimate Build is a later expansion pass. It may add heavier cinematic systems, richer layered motion, more complex world logic, After Effects/Lottie/video assists, deeper environmental animation, and advanced continuity effects. Do not import Ultimate Build complexity into the Reveal Build unless it directly improves the current page without increasing fragility.

Reveal Build rule: native HTML, CSS, and JavaScript should carry the experience first. Ultimate Build rule: heavier media and rendering techniques are allowed when they are clearly worth the cost.

## After Effects, Lottie, and Video Policy

Native HTML/CSS/JS motion is the default for the Reveal Build. Use it first for route reveals, shell continuity, hover/touch feedback, loaders, panel transitions, and archive-world identity.

After Effects, Lottie, rendered video, sprite sheets, and similar pre-rendered assets are allowed later, or earlier only when they are clearly beneficial for an effect that would otherwise be brittle, expensive, or visually inferior.

Do not make routing, navigation, data reveal, or page availability dependent on pre-rendered video. Video may enhance an entrance, background, or transition, but the app must still route, deep-link, render data, and recover from failure without it.

## Archive Build Version and Lore Note

`ARCHIVE BUILD 3.0.01` is part of the V3 identity. Treat it as interface lore, not throwaway footer text. It may evolve after reveal, but any change to build labeling should be intentional and consistent across the shell.

## 1. One Page Must Be Finished Before Moving To The Next

Do not spread partial animation work across many routes. Finish the current page or route surface to a signoff-ready state before moving to another. A page is not finished until desktop, mobile, reduced motion, route behavior, loading behavior, and handoff reporting have all been checked.

If a task touches a shared shell element, define the exact affected pages and verify every affected page before calling the work complete.

## 2. Animation Signoff Must Be Strict

Animation signoff requires more than "it moves." Motion must have clear timing, easing, purpose, route safety, mobile behavior, and reduced-motion behavior. Codex must verify the effect in-browser before reporting signoff.

An animation that looks good once but flickers, races data, blocks navigation, creates overflow, or fails on repeat entry is not signed off.

## 3. Animation Fluidity Is Non-Negotiable

Motion must feel smooth, continuous, and intentional. Avoid stutters, sudden jumps, unmasked loading flashes, conflicting transitions, layout shifts, and abrupt visibility changes.

Prefer transform and opacity for frequent animation. Avoid animating expensive layout properties unless the cost is known and acceptable. If data or media timing is uncertain, mask it inside the experience instead of exposing a broken intermediate state.

## 4. Reference Index Files Are Donor Blueprints, Not Suggestions

When the user provides a reference index file, prototype, mockup, screenshot, or donor page, inspect it before editing. Treat requested donor pieces as blueprint material. Import only the parts requested for the current page or effect.

Do not broadly clone donor pages, invent adjacent features, or reinterpret the reference into unrelated UI. Preserve local V3 architecture and only graft the requested motion, structure, or styling pattern.

## 5. Detail Is Intentional, Not Excessive

High-detail experience work is expected. Detail becomes excessive only when it distracts from the route, hides data, creates fragility, slows mobile performance, or makes maintenance harder.

Use detail to create world identity, orientation, continuity, and tactile response. Remove detail that does not serve those goals.

## 6. Animation Leads Routing

Route changes should feel led by the interface, not by a sudden document swap. Define the route handoff point: when the outgoing route yields, when the shell transitions, and when the incoming route becomes interactive.

Do not let animation desynchronize browser history, deep links, back behavior, or active navigation state. A beautiful transition that breaks routing is a failed transition.

## 7. Loading Must Be Hidden Inside the Experience

Loading states should feel like part of the archive world. Avoid raw flashes, empty shells, abrupt spinners, and placeholder content that looks like a broken page.

Preload where reasonable. When preloading is not possible, use skeletons, staged reveals, or shell-level masking that preserves orientation. Data correctness still wins: never hide a real failure forever.

## 8. Shell Continuity Comes First

The V3 shell is the continuity layer between worlds. Preserve global navigation, current-view state, archive build identity, bottom rail behavior, and shell visibility rules.

Page animation may transform within the shell, but it must not make the shell feel like it has been replaced by a separate site unless the user explicitly asks for that kind of hard cut.

## 9. Mobile Is The Primary Animation Target

Design and verify animation mobile-first. Mobile and webview behavior are not secondary polish. Touch target size, viewport height, scrolling, overflow, keyboard focus, reduced CPU/GPU headroom, and browser UI bars must be considered before desktop refinements are accepted.

If desktop and mobile need different motion scales, choose a restrained mobile version and enhance desktop only where safe.

## 10. Reduced Motion Must Still Feel Designed

Reduced motion is not a license to make the interface abrupt or lifeless. Users with reduced motion should still get hierarchy, continuity, and polish through opacity, static staging, shorter transitions, or non-motion state changes.

Do not remove essential orientation cues. Replace motion with designed stillness.

## 11. No Animation May Break Data Usability

V3 is an archive. Data must remain readable, searchable, filterable, navigable, and correct. Animation must not obscure counts, cause stale static data to win over live data, block gallery interaction, hide error states, or trap scrolling.

If an animation and data usability conflict, data usability wins.

## 12. Every Edit Requires A Handoff Report

Every UI animation edit must end with a handoff report. Include files changed, page or area edited, references used, protected pages checked, route behavior checked, mobile checks, reduced-motion checks, tests run, known risks, and whether the page is ready for signoff.

If a requested verification could not be run, state that directly and explain why.

## 13. Prototypes Are Canon

Approved prototypes are canonical design sources. Do not simplify them into generic UI unless the user requests simplification. Preserve the parts that made the prototype approved: timing, staging, density, world identity, and interaction feel.

If implementation constraints require deviation, document the deviation and keep the spirit of the prototype intact.

## 14. Approved Effects Become Protected Assets

Once an effect, page, or route is approved, treat it as protected. Do not refactor, restyle, retime, or replace it while working elsewhere unless the current task explicitly includes that protected surface.

When touching shared shell code, check approved effects that depend on it.

## Protected Asset – Home Story Sequence

Status: APPROVED
Version: Home Story v1.0
Phase: Complete / Ready for Final Mobile Validation

Protected Story Structure:

Void
↓
Transmission
↓
Archive Discovery
↓
Archive Awakening
↓
Worlds Online
↓
Core Online
↓
ENGAGE

Protected Timing Sections:

- Void sequence
- Transmission sequence
- ARCHIVE NODE FOUND
- DECODING ARCHIVE...
- VOODOO MEDIA
- V3 identity
- Archive Worlds Awakening
- Core Ignition
- ENGAGE sequence

Protected Visual Assets:

- Archive worlds layout
- Core ignition behavior
- ENGAGE final composition
- Core sizing
- Status text placement
- Red kinetic border
- Hidden /portfolio activation
- Home-only Engine Bar hidden state

Allowed Future Changes:

- Bug fixes
- Final mobile QA corrections
- Accessibility fixes
- Explicitly approved Home Enhancement passes

Disallowed Without Explicit Approval:

- Story restructuring
- New Home story chapters
- Core redesign
- World redesign
- Timing redesign
- ENGAGE redesign
- Kinetic energy redesign

Development Rule:

Home Story is now a protected asset. Future edits must be scoped as either:

- Home QA Fix
- Home Enhancement Pass

and must not alter approved assets unless explicitly requested.

## 15. Experience Before Cleverness

Choose the solution that makes the experience feel better and remain stable. Avoid clever abstractions, animation frameworks, or routing tricks that increase risk without a clear experiential payoff.

Prefer local, understandable implementation that fits the existing V3 codebase.

## 16. Worlds Must Feel Alive

Music, Wrestling, Connect, Portfolio, and future worlds should feel distinct but connected. Each world may have its own rhythm, texture, and reveal language, but all must still belong to V3.

Alive does not mean noisy. Use subtle motion, responsive states, lighting, depth, timing, and content-aware reveals to make the archive feel active.

## 17. Protect Approved Pages

Before editing, identify whether the page or effect is already approved. If approved, protect it. If a change might affect it indirectly, verify it. Do not let work on a new page degrade a signed-off page.

When in doubt, assume approved surfaces are fragile and verify before reporting completion.
