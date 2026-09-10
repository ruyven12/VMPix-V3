# V3 Module Blueprint

## Authority and use

**CURRENT / SPECIALIZED — reusable module structure, PASS 25.** This blueprint applies existing rules; it does not authorize a new module, route, dependency, backend integration, or creative redesign.

Read [AGENTS.md](../AGENTS.md), [Project Rules](PROJECT_RULES.md), and [Experience Build Rules](V3_EXPERIENCE_BUILD_RULES.md) first. [World Bible](design/world-bible.md) owns creative canon; [Protected Decisions](V3_PROTECTED_DECISIONS.md) locates approved boundaries. Those sources govern within their domains.

**Shell owns the room. Module owns the journey.**

Default journey: **/portfolio → module/world landing → primary indexes → record/detail pages → galleries/media drilldowns → return/back paths → QA/signoff.** Omit layers the content model does not need. Return and QA are responsibilities throughout the journey, not features to add only at the end.

Use this document when defining a module or planning its next surface. Consult [Current State](CURRENT_STATE.md), [Module Status](V3_MODULE_STATUS.md), and [Route Manifest](V3_ROUTE_MANIFEST.md) for context, checking their evidence dates. Older snapshots are not fresh implementation or runtime proof. This pass does not refresh them or settle open decisions.

## 1. Module Identity

Before implementation, record a short module brief:

| Define | Required decision |
| --- | --- |
| Name and Portfolio node | Existing world/module name and its Portfolio identity. |
| Route root | Existing or explicitly approved root; distinguish reserved from implemented routes. |
| Identity | Visual/narrative character, mood, terminology, and creative source. |
| Engine context | Landing, index, detail, and media context language supplied through Shell. |
| Destinations | Major subsections and optional journey layers. |
| Protection | Approved stories, experiences, assets, and references; unresolved choices stay explicit. |

Use the world's own language. “Dossier,” “Hall,” and Wrestling names are examples, not required labels.

## 2. Portfolio Entry Contract

Portfolio/Shell owns node selection, activation, global transition, and route handoff. Selection is not automatically travel; preserve the existing protected Portfolio sequence. A module receives the selected journey through Shell instead of adding another launcher or Engine Bar.

Define the destination, readiness condition, handoff, cancellation, and recovery path before implementing entry. Preserve Shell continuity and a coherent direct-route state without requiring a prior Portfolio visit. Failed loading must leave usable navigation, not a visual dead end. This contract does not authorize the future Archive Seal transport or redesign Portfolio.

## 3. Landing / World Gateway

The landing provides identity, orientation, destination choices, local atmosphere, and a clear module story beat. It owns content and local interaction within Shell's layout and navigation contract.

Keep destinations understandable and recoverable. Do not create competing global navigation, viewport handling, or a replacement Shell. Atmosphere must remain optional to successful navigation and data access.

## 4. Primary Indexes

Choose indexes from the content model: events/shows, people, venues, bands/artists, collections, or categories. An index need not resemble Wrestling's carousel, crystals, or archive panels.

As applicable, provide loading, empty, error, search, filters, sort, progressive loading, touch-safe controls, and stable active selection. Define what survives detail return: selection, filters, page, and scroll position. Reset deliberately when a data/filter change invalidates selection; avoid incidental resets or silent replacement with another record.

## 5. Detail / Dossier Contract

A detail preserves Shell context, stable record identity, its parent relationship, and a clear parent return control. Direct entry and browser Back must work independently: Back follows history; a parent link has a deterministic destination even without prior history.

Distinguish loading, a resolved record, and unavailable/error outcomes. An unresolved ID must not substitute a legitimate record or display invented metadata resembling a completed archive entry. Unknown fields on a real record may be explicit; failed lookup must be explicit too. Keep recovery available on missing, partial, failed, and timed-out requests.

## 6. Gallery / Media Drilldown Contract

Where needed, media belongs to the module journey and retains record/parent context. Define canonical media identity, next/previous behavior, close/return destination, and selection/scroll restoration. Respect Shell overlay ownership while the module supplies media content and local selection.

Use progressive loading for large galleries. Missing or failed media must degrade gracefully without trapping the lightbox or blocking return. Verify direct media entry, dismissal, keyboard/touch use, focus recovery, and browser Back where those interactions apply.

## 7. Routing Pattern

Conceptual shapes, not a compulsory URL schema:

- `/<module>`
- `/<module>/<index>`
- `/<module>/<index>/:recordId`
- `/<module>/<index>/:recordId/<subrecord>`
- `/<module>/<index>/:recordId/.../photo/:photoId`

The ellipsis represents optional nesting, not a literal route. Preserve established public paths over internal file convenience; do not rename existing routes to match these examples.

Document route identity, parent, parameters/query normalization, direct-entry behavior, recovery, and any compatibility inputs in the owning [Route Manifest](V3_ROUTE_MANIFEST.md). Shell parses and promotes routes and synchronizes browser history. A local selection does not create a second router. Test Back/Forward, unknown paths, and refresh/deep-link behavior for affected contracts.

## 8. Shell / Engine Integration

Shell owns global route state, layout, navigation, transitions, viewport behavior, overlays, and the Engine lifecycle. Modules may supply Engine context/title/state through the existing Shell-owned system; they must not create, destroy, replace, or reconstruct the Engine.

Preserve established continuity through indexes, details, and media. Keep shared class/dataset mutations minimal, intentional, and cleaned up on exit or cancellation; existing cross-boundary mutations are not a pattern to copy. Define each local contribution and its Shell integration point before extending shared behavior.

Home's normal Engine presentation differs from archive routes. The cold-entry/return-Home lifecycle remains an explicit open contract in Project Rules; this blueprint neither resolves it nor authorizes lifecycle changes.

## 9. Module Local State

Modules may own filters, selection, pagination, local drilldowns, loading/error state, and content-specific transitions coordinated with Shell. Global routing, viewport behavior, global navigation, and Engine lifecycle remain outside that ownership.

Define mount/update/exit responsibilities using existing mechanisms. Cancel obsolete requests, timers, animation frames, and listeners; prevent duplicate handlers and late results from overwriting a newer selection or destination. State retained for return must correspond to the active route and record.

## 10. Data Adapter Contract

Keep a replaceable adapter boundary between backend payloads and rendering. PostgreSQL/VMPix-Data owns truth; adapters normalize shape, stable IDs, relationships, and optional fields into module-facing data. Rendering should not encode backend truth, fabricate relationships, or choose an unrelated fallback record.

Represent loading, empty, error, partial, and unavailable states explicitly. Fail gracefully, disclose stale/cached or fixture data when relevant, and prevent old responses from winning after navigation. Local fixtures remain replaceable development aids.

Refer to [Data Contracts](V3_DATA_CONTRACTS.md) for tolerance principles and payload references; do not duplicate schemas here or assume proposals describe deployed responses. Verify actual bindings and responses within the authorized task before claiming live integration.

## 11. Responsive Contract

Design from mobile outward. Default browser targets are **360×800**, **412×915**, and **1920×1080**; Samsung S25 Ultra is the primary physical mobile target.

Preserve safe areas, dynamic browser chrome, webview safety, reachable touch targets, keyboard access, readable content, and Engine clearance. Let content determine necessary height. Prevent horizontal overflow, clipped controls, and nested scroll traps. Check affected breakpoint boundaries as well as the standard sizes; a phone screenshot alone does not establish its CSS viewport.

Keep reduced motion usable and intentional. Browser emulation does not establish physical S25, Safari, or embedded-webview success.

## 12. Animation / Story Contract

Define what the user sees, what the system does, and what the user should feel before motion. Follow Story → Timing → Motion → Effects → Technical implementation; one scoped story beat per creative pass unless explicitly approved otherwise.

For a major handoff, define source geometry, destination readiness, visibility ownership, cancellation, and cleanup. The destination must be visually ready before the outgoing cover yields, whether it contains resolved content or a coherent loading/error state. Prevent duplicate reveals, blank frames, abrupt opacity resets, geometry snaps, and leftover temporary layers. Completion must be reliable under repeated entry and reduced motion.

Use existing systems, with vanilla HTML/CSS/JavaScript first. Avoid transition-only spectacle and unnecessary rendering work. Preserve each world's motion personality; Hall/Daïion particles, effects, and timings are not generic requirements.

## 13. QA Contract

Use [$v3-qa](../.agents/skills/v3-qa/SKILL.md) to select proportional checks and `npm run v3:qa` to execute suitable existing coverage. Examples: `npm run v3:qa -- route /music` for one route; `npm run v3:qa -- smoke` for route smoke coverage. The Skill documents actual modes and limits; do not default to `all` or treat generic route health as interaction signoff.

| Change type | Minimum affected-behavior verification |
| --- | --- |
| Layout | Standard sizes, actual visible content/controls, overflow, scrolling, Engine clearance, and changed breakpoints. |
| Routes | Direct entry, destination/parent URLs, Back/Forward, repeat entry, missing paths, and Engine context. |
| Animation | Repeated/rapid/reverse or cancel interactions as applicable; inspect start, handoff, cleanup frames and visible pixels; reduced motion and device recording. |
| Data | Resolved, empty, partial, missing, delayed/failed requests; recovery and stale-response handling; distinguish live from fixtures. |
| Gallery/lightbox | Open/close, next/previous, direct entry, parent return, missing media, large-gallery loading, focus/touch/keyboard. |
| Shared Shell | Identify and verify affected modules and protected shared dependents, including routing, Engine, viewport, and overlays. |

Use Scout → Builder → QA → Reviewer where appropriate. The parent coordinates scoped evidence and correction; Builder implements, QA verifies, Reviewer checks the final diff. Do not require Chris to relay routine findings. Not every task needs every role.

Correct in-scope defects and retest without weakening assertions. Report source, browser, automated-test, physical-device, and human-visual evidence separately, with route/build/target and limitations. A passing harness or visible computed style alone is not proof of cinematic quality or actual painted visibility.

## 14. Protection / Signoff Contract

After explicit approval, record the approved surface, boundaries, source of approval, and remaining QA in [Protected Decisions](V3_PROTECTED_DECISIONS.md), within an authorized documentation pass. Update state records when a meaningful milestone warrants it.

Creative approval, implementation, browser/test results, and device acceptance are distinct. Do not incidentally redesign approved work. Scoped bug, accessibility, compatibility, and performance corrections remain possible under the governing boundaries; broader redesign still requires explicit approval.

## 15. Reuse vs Identity

**Reuse:** architecture, route philosophy, Shell behavior, adapter/failure patterns, QA, accessibility, responsive rules, and useful drilldown mechanics.

**Do not blindly reuse:** names, lore, visual motifs, particles, colors, animation personality, atmospheric effects, or page composition. Shared mechanics should support a distinct world, not make it a reskinned Wrestling module. A reusable principle is not permission for a broad extraction/refactor.

## 16. Module Build Sequence

1. Define world/story/identity from its owning canon.
2. Define route/data boundaries and the smallest next surface.
3. Build landing/gateway.
4. Build primary indexes.
5. Build detail/dossier routes.
6. Build galleries/media drilldowns where needed.
7. Verify Shell/Engine/back behavior.
8. Run responsive/data/error QA.
9. Obtain human visual signoff.
10. Record protected decisions and evidence.
11. Move to the next surface.

Apply verification and signoff to each surface as it becomes ready, not only after the entire module is built. Omit unnecessary layers without weakening applicable contracts.

## 17. Module Readiness Checklist

Pages existing is not completion. For each applicable category record **passed, pending, blocked, or not applicable with reason**, plus evidence:

- Architecture: independent module within Shell; scoped lifecycle and cleanup.
- Routes: stable public contract and invalid-route recovery.
- Data: adapter, IDs, relationships, and verified source/fallback provenance.
- Loading/error states: empty, partial, missing, failure/timeout, and recovery.
- Mobile: readable, touch-safe, safe-area/webview-aware; no overflow/traps.
- Desktop: composition and behavior checked.
- Reduced motion: coherent final state and usable navigation.
- Shell/Engine: context and continuity; no competing ownership.
- Back/deep links: history, parent return, refresh, repeat entry.
- Gallery/media: recovery, navigation, loading, and accessibility where applicable.
- Automated QA: relevant checks actually passed; drift/gaps disclosed.
- Physical-device QA: named device/browser/build and result, or pending.
- Human creative signoff: explicit approval and its scope, or pending.
- Protection record: approval indexed without overstating QA readiness.

## Wrestling as engineering reference

Use Daïion for gateway orientation; Hall of Crusades for index/detail continuity; Hall of Champions for people journeys; Fields of Conflict for venue relationships; and match/gallery/lightbox paths for nested media and recovery. Generalize their boundaries and tested failure/return lessons, not their names, choreography, selectors, page layouts, or every current implementation technique.

Wrestling is the engineering reference, not a claim that every surface is complete or every historical status remains current. Consult dated evidence before reusing a specific behavior.

## Music application and future Portfolio worlds

Music should retain its own canon, vocabulary, mood, and interaction language. Map its existing landing, bands, shows, people, detail, and optional media journeys against this blueprint, verifying current status first. Reuse proven Shell/Engine, routing, adapter, recovery, and QA patterns to advance indexes/details/galleries without rebuilding navigation mechanics from zero. This pass does not design Music or authorize its next implementation.

Future Portfolio worlds use the same shared architecture where appropriate, with their own local identity and content model. Define only the layers they need; do not invent their designs from Wrestling's surface treatment.
