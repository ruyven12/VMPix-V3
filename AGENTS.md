# VMPix-V3 Agent Operating Guide

VMPix-V3 is the definitive frontend rebuild. Experience Build is the current phase. Use this file as the AI/Codex operating entry point; keep detailed engineering rules and creative canon in their owning documents.

## Authority and reading order

1. **AGENTS.md** — operating scope, workflow, approval, and reporting.
2. [PROJECT_RULES.md](docs/PROJECT_RULES.md) — permanent engineering and architectural law.
3. [V3_EXPERIENCE_BUILD_RULES.md](docs/V3_EXPERIENCE_BUILD_RULES.md) — current workflow, protection, verification, and signoff.
4. [World Bible](docs/design/world-bible.md) — creative, narrative, lore, world identity, and protected creative authority.
5. Relevant specialized references: [Route Manifest](docs/V3_ROUTE_MANIFEST.md), [Module Status](docs/V3_MODULE_STATUS.md), [Data Contracts](docs/V3_DATA_CONTRACTS.md), and [UI Animation Checklist](docs/CODEX_UI_ANIMATION_CHECKLIST.md). Use [README](README.md) to locate other directly relevant references.
6. Historical/future plans — reference only; never override current governing documents or authorize implementation.

Prefer higher authority and explicit newer approved decisions over old planning assumptions. Authority applies within each document's domain: engineering changes cannot silently rewrite creative canon, and creative direction cannot waive engineering safeguards. Existing README references to a future AGENTS.md describe PASS 2 history; this file is now the entry point.

## Core rules

- V2/live systems are donor/reference only unless explicitly approved. Keep frontend/experience responsibilities separate from VMPix-Data/PostgreSQL backend authority.
- Mobile-first always: Samsung S25 Ultra is the primary mobile test target. Preserve secondary mobile/webview and safe-area reliability. Mobile defines the experience; desktop enhances it.
- Shell owns routing, layout, navigation, transitions, viewport behavior, overlays, and global shell state. Modules own content, local state, drilldowns, and data rendering.
- Engine Bar is Shell-owned and protected. Preserve its established persistence; modules must not manage its lifecycle.
- Static-first, vanilla HTML/CSS/JavaScript by default. No frameworks or dependencies without explicit approval.
- Data-driven features need loading, empty, error, partial, unavailable, and failure-safe behavior where applicable. Preserve stable IDs, relationship integrity, and graceful API failure handling.
- Surgical edits only. Inspect and edit only files necessary and authorized for the pass. No opportunistic cleanup, unrelated refactors, or nearby redesigns.
- Protect approved pages, effects, and components. Approved prototypes remain canonical unless explicitly superseded.
- Define story before animation. One story beat and one meaningful creative change per creative pass unless explicitly approved otherwise. Review Story → Timing → Motion → Effects → Technical implementation.
- Preserve performance, reduced motion, scrolling, overflow safety, stable routes, and predictable back behavior. Prevent flicker, jitter, timing drift, layout shifts, and unnecessary frame drops. Keep photo/archive content central.
- Deliver complete, ready-to-use work; disclose genuine blockers and incomplete verification.

## Execution and verification

**Scope stays small. Verification may be thorough.**

Before editing, understand the requested behavior/story/result and acceptance criteria, identify approved files and affected protected surfaces, and read relevant governing documentation and source only. Avoid workspace-wide exploration; if broader inspection is genuinely required, establish that it fits approved scope before proceeding.

Within approved scope, investigate → implement → inspect → test → correct → retest → review the diff. Solve implementation details autonomously, extend existing systems where practical, and make the smallest coherent change.

Use existing browser, Playwright, screenshot comparison, or verification tooling where useful. Reuse existing services. Temporary infrastructure must be necessary, proportionate, and within approved file/task scope. Verification needs do not authorize new dependencies or scope expansion. Do not stop merely because required verification exceeds an old 5–10 minute preference.

Verify affected behavior, including protected surfaces affected through shared code. As applicable, check mobile/responsive layouts, direct routes and back navigation, reduced motion, overflow/scrolling, data failure states, and console/runtime failures. Correct problems and retest when safely possible. Review changed-file scope before handoff. Report tooling/ACL failures and skipped checks honestly; never present them as passed.

## Human approval

Existing explicit task approval counts; do not request the same approval again. Obtain human approval before changes to architecture, public route contracts, protected experience designs, established story beats, creative canon, approved effect replacement, dependencies/frameworks, destructive data operations, deployment architecture, or material scope expansion.

Technical verification does not replace Chris's subjective animation/cinematic signoff. Device recordings remain valuable for final visual judgment.

## Conflicts and unresolved decisions

Preserve and flag unresolved creative or architectural conflicts; do not invent resolutions or infer runtime readiness from old documentation. Keep design protection, implementation, QA/signoff, route status, and future planning distinct.

Known unresolved items: Calendar/Trajectory/Comms creative ownership; Engine Bar cold-entry/return-Home behavior; Home terminology alignment; Wrestling identifier mapping requiring verification. These do not block unrelated work. Continue independent work and raise a focused question only when the task depends on a resolution.

## Handoff

Report concisely: files inspected, files changed, what changed, verification performed, and remaining limitations or human-review items. Separate technical readiness from human creative signoff.

Future task prompts should mainly supply: task, allowed files, goal/story beat, acceptance criteria, and explicit exceptions. Do not require permanent rules to be pasted again.
