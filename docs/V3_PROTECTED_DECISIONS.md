# V3 Protected Decisions Index

## Authority and use

Status: **CURRENT / SPECIALIZED — index of existing decisions**. Reviewed 2026-09-10, PASS 8. This index locates protection; it does not create approvals or supersede [Project Rules](PROJECT_RULES.md) (engineering law), [Experience Build Rules](V3_EXPERIENCE_BUILD_RULES.md) (process), or [World Bible](design/world-bible.md) (creative canon). Read the cited section before changing an indexed item. Report conflicts; do not resolve them by inference.

Creative lock, source implementation, runtime/browser verification, physical-device QA, and human creative signoff are separate. See [Current State](CURRENT_STATE.md) for implementation and outstanding QA. No tests, device checks, or new signoffs are established here.

**AI behavior:** protected does not mean frozen against scoped bug fixes, accessibility, compatibility, or performance improvements, or explicitly approved enhancements. These must preserve the approved behavior. AI may not incidentally redesign, restructure, rename, retime, replace, reinterpret, or refactor it away during unrelated work. Existing task authorization counts; this index adds no separate approval gate. Detailed source restrictions still apply.

Each row supplies the item/status, scope/protection, allowed changes/approval boundary, and canonical reference/QA note. There are **14 indexed decisions across five protection categories**, followed by a separate UNRESOLVED category.

## LOCKED EXPERIENCE

| Decision / status | Scope / what is protected | Allowed changes / explicit approval required | Canonical source / QA note |
| --- | --- | --- | --- |
| **1. Home Story v1.0 — APPROVED / LOCKED** | Home story: Void → Transmission → Archive Discovery → Archive Awakening → Worlds Online → Core Online → ENGAGE. | Scoped Home QA Fix or approved Home Enhancement; explicit approval for story chapters, restructuring, or timing/design changes. | [Experience Build Rules](V3_EXPERIENCE_BUILD_RULES.md), “Protected Asset – Home Story Sequence”; [World Bible](design/world-bible.md), “Current Build Status.” Final mobile validation remains pending despite creative lock. |
| **2. Interactive Portfolio v1.0 — LOCKED** | Home-to-Portfolio/Wormhole arrival, observatory/world selection, Console acknowledgement, Core energizing, analysis/projection, then waiting for transport. Selection is separate from travel. | Repairs, accessibility, performance, compatibility, timing refinements, and added world content within the existing lock; structural redesign requires approval. No incidental retiming. | [World Bible](design/world-bible.md), “Locked Experience,” “Interactive Portfolio Story,” and v0.8 reconciliation. Archive Seal transport is approved for future implementation, outside this lock; older panel ENTER transport is superseded. Lock is not device acceptance. |

## PROTECTED SYSTEM

| Decision / status | Scope / what is protected | Allowed changes / explicit approval required | Canonical source / QA note |
| --- | --- | --- | --- |
| **3. Universal Shell — established ownership** | Routing, layout, navigation, transitions, viewport, overlays, and global state belong to Shell. | Scoped fixes/extensions within ownership; approval for architecture changes or replacement of shared systems. | [Project Rules](PROJECT_RULES.md), §5; [AGENTS.md](../AGENTS.md), “Human approval.” Verify affected shared surfaces. |
| **4. Engine Bar — protected Shell lifecycle ownership** | Persistent archive-experience role; Home is the only normal route without the persistent bar by default. Modules may update context/content, never create, destroy, replace, or own lifecycle. | Context updates and scoped repairs preserving ownership/persistence; lifecycle redesign requires approval. | [Project Rules](PROJECT_RULES.md), §6 and “Open documentation questions.” Cold-entry/return-Home contract remains unresolved; direct-mount code presence does not settle it. |
| **5. Independent modules — established boundary** | Modules own local content/state, drilldowns, and data rendering/states; no competing routers, Shell systems, or disconnected mini-apps. | Local fixes/extensions within Shell contract; approval for changed architectural responsibility. | [Project Rules](PROJECT_RULES.md), §7 and “Current principles supplement”; [AGENTS.md](../AGENTS.md), “Human approval.” Current Wrestling Shell mutations are a review item, not an approved exception. |
| **6. Mobile-first and stability — established project decision** | Samsung S25 Ultra is primary; mobile defines experience, desktop enhances. Preserve safe areas, webviews, reduced motion, performance, and stable navigation. | Compatibility/accessibility/performance improvements preserving experience; explicit approval for protected design changes, not a waiver of engineering safeguards. | [Project Rules](PROJECT_RULES.md), §§3–4, 14, 17; [Experience Build Rules](V3_EXPERIENCE_BUILD_RULES.md), §§9–10, 15. Current QA targets/results belong in [Current State](CURRENT_STATE.md); emulation is not physical QA. |

## PROTECTED CREATIVE DECISION

| Decision / status | Scope / what is protected | Allowed changes / explicit approval required | Canonical source / QA note |
| --- | --- | --- | --- |
| **7. World identity, compass and colors — documented creative canon** | Locked Living Worlds retain identity and approved bearings. Portfolio world-color system is protected; mappings remain in the source rather than copied here. | Content expressing existing identity; approval for renaming, remapping, recoloring, or reinterpretation. | [World Bible](design/world-bible.md), “Global World System,” “World Rules,” “Star Behavior,” “World Theme Colors,” and Portfolio protected assets. Planned Meta Worlds are not promoted to locked experiences; their ownership conflict remains open. |
| **8. Wrestling / The Battleground — LOCKED identity** | NE/red world: ancient Hall of Legacy, honorable competition, respect, and “Every battle leaves a legacy.” Preserve its world concept and expansion philosophy. | Natural additions within the world; explicit approval for identity redesign or replacement. | [World Bible](design/world-bible.md), “World: The Battleground.” Hall of Champions is also a preserved idea, not proof its current UI was approved. Daïion/current surface implementation in [Current State](CURRENT_STATE.md) does not establish a new creative lock. |
| **9. Story-first animation — established process decision** | Story → Timing → Motion → Effects → Technical implementation; one story beat / meaningful creative change per pass unless explicitly approved otherwise. Subjective cinematic acceptance remains human. | Scoped iteration following this order; approval for broader creative passes or changed established beats. | [Project Rules](PROJECT_RULES.md), §§15–16 and supplement; [Experience Build Rules](V3_EXPERIENCE_BUILD_RULES.md), authority and §18. Technical verification does not replace Chris's visual/device judgment. |

## PROTECTED IMPLEMENTATION

| Decision / status | Scope / what is protected | Allowed changes / explicit approval required | Canonical source / QA note |
| --- | --- | --- | --- |
| **10. Home and Portfolio protected assets — documented approval** | Home timing sections, Core ignition/sizing, ENGAGE composition, status placement, red kinetic border, hidden Portfolio activation and Home bar state. Portfolio background/constellation/stars, Console/Core, lifeblood, scan, Analysis projection/descriptions, and Archive Status system. | Repairs preserving assets under the owning lock; explicit approval for redesign, replacement, or changes to protected timing/behavior. Portfolio permits scoped timing refinements under item 2. | [Experience Build Rules](V3_EXPERIENCE_BUILD_RULES.md), Home protected asset list; [World Bible](design/world-bible.md), Portfolio “Protected Assets.” Mixed future/current subsections do not authorize rebuilding existing assets or claim every future detail is implemented. |
| **11. Approved prototypes/effects — protection upon documented approval** | Preserve the timing, staging, density, identity, and interaction that made a prototype/effect approved. This rule is not a blanket approval of all existing code. | Scoped fixes/extensions preserving the approved result; explicit task coverage for protected-surface changes and approval for redesign/replacement. | [Experience Build Rules](V3_EXPERIENCE_BUILD_RULES.md), §§13–14, 17. Check affected approved effects after shared changes; missing individual signoff records belong below. |

## ACCEPTED DATA / ROUTE RULE

| Decision / status | Scope / what is protected | Allowed changes / explicit approval required | Canonical source / QA note |
| --- | --- | --- | --- |
| **12. Stable public routes — established contract rule** | Predictable Shell routes, deep links, history/back, and recoverable drilldowns. Exact current Wrestling paths/compatibility inputs remain in the manifest. | Contract-preserving fixes; explicit approval to change public route contracts. Source-observed routes are not visual signoff. | [Project Rules](PROJECT_RULES.md), §18; [AGENTS.md](../AGENTS.md), “Human approval”; [Route Manifest](V3_ROUTE_MANIFEST.md), canonical Wrestling routes. Runtime acceptance remains separate. |
| **13. Backend authority and relationships — established convention** | PostgreSQL/VMPix-Data owns backend truth; frontend owns experience. Preserve stable IDs and relationship-first data integrity. | Compatible adapters/failure-state fixes within scope; approval for material architecture/data-contract changes. Do not choose an unresolved identifier mapping. | [Project Rules](PROJECT_RULES.md), supplement and §9; [AGENTS.md](../AGENTS.md), approval/scope. [Current State](CURRENT_STATE.md) separates source bindings from remote success; no schema duplication here. |
| **14. Non-destructive editing/import safeguards — current constraints on future admin work** | Preserve manual DB edits by default, surface import conflicts, require approval before overwrite; no destructive edits, prefer soft delete, retain authentication/diagnostics/audit safeguards. | Safeguard-preserving work only within approved scope; explicit admin approval for replacing manually edited values. No editing system authorized by this index. | [Admin Editing Roadmap](V3_ADMIN_EDITING_ROADMAP.md), “Authority and phase,” “Non-Negotiable Safety Rules,” and “Import Conflict Rules.” Safeguards are required constraints, not evidence of deployed implementation. |

## Protection Records Still Needing Migration

**Approval unproven in inspected repository documentation; candidates for history reconciliation, not new protected classifications:**

- Daïion terminology and any prior landing/reveal/transition approval: current naming/implementation is recorded, but its approved scope and relationship to the locked Battleground identity need a durable signoff reference.
- Hall of Crusades and Hall of Champions interactions, animation timings, selection and transition behavior: implemented/current does not establish approval of these particular behaviors. A preserved Hall of Champions concept does not approve its implementation.
- Fields of Conflict, person/venue/show dossiers, match gallery/lightbox, and any promoted Wrestling prototypes: migrate only approvals that human/Codex history can substantiate, with exact surface/version, protected behavior, allowed refinements, and evidence. Partial implementation must remain labeled partial.

Basis: [Current State](CURRENT_STATE.md), Wrestling status and QA; [World Bible](design/world-bible.md), Battleground identity/idea bucket. No code inspection or historical conversation retrieval was performed in PASS 8. Absence of a durable approval record does not authorize incidental redesign. Home/Portfolio locks already have durable records; outstanding device acceptance is a separate evidence gap.

## Unresolved Decisions

Status for every row: **UNRESOLVED — not a protected final decision; protected from autonomous resolution.** Allowed work is evidence gathering or unrelated scoped work; explicit human decision is required to settle the question. No QA/signoff here resolves it.

| Item / scope | What must remain open / explicit decision needed | Canonical reference |
| --- | --- | --- |
| Calendar / Trajectory / Comms | Calendar ownership differs between Global World System and Meta Worlds; do not choose an owner or alter canon/routes. | [World Bible](design/world-bible.md), reconciliation notes; [Current State](CURRENT_STATE.md), §9. |
| Engine cold entry / return Home | Establish the lifecycle contract without inferring approval from current entered-state code or overriding protected persistence. | [Project Rules](PROJECT_RULES.md), open questions; [Current State](CURRENT_STATE.md), §§5, 9. |
| Home terminology | Align START/lightning shorthand with protected Home Story/ENGAGE without inventing a new sequence. | [Project Rules](PROJECT_RULES.md), open questions; [Experience Build Rules](V3_EXPERIENCE_BUILD_RULES.md), Home Story. |
| Wrestling identifier mapping | Resolve consistency, including `person_id` versus `wrestling_person_id`; current route normalization does not settle data identity. | [Current State](CURRENT_STATE.md), §9; [Route Manifest](V3_ROUTE_MANIFEST.md), compatibility notes. |

Update this index only from a cited existing decision or explicit new approval. Keep detailed rules, schemas, route inventories, motion timings, and QA results in their owning references.
