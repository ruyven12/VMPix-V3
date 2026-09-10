# VMPix-V3

Frontend source of truth for the VMPix V3 public experience, universal Shell, shared UI, and future protected admin shell. V3 is the definitive rebuild. **Experience Build is the current phase.**

## Documentation authority and reading order

Start with root [AGENTS.md](AGENTS.md), the active AI/Codex operating entry point, then follow this governing documentation order:

1. [PROJECT_RULES.md](docs/PROJECT_RULES.md) — **CURRENT / AUTHORITATIVE** permanent engineering/project law and instruction classifications.
2. [V3_EXPERIENCE_BUILD_RULES.md](docs/V3_EXPERIENCE_BUILD_RULES.md) — **CURRENT / AUTHORITATIVE** phase process, scoped iteration, verification, and human signoff.
3. [World Bible](docs/design/world-bible.md) — creative/narrative authority and **PROTECTED DECISION** records for worlds, lore, Home, and Interactive Portfolio.
   Consult [Protected Decisions](docs/V3_PROTECTED_DECISIONS.md) for the sourced index of locked experiences, protected systems, approval boundaries, and unresolved decisions before relevant changes.

4. Read the task-relevant specialized references below.
5. Consult historical/future plans for rationale, never to override current governing rules.

Current explicit decisions win over old planning assumptions. Engineering law, creative canon, and phase process govern their respective domains; preserve and flag unresolved conflicts for Chris. Future plans do not authorize implementation. Design protection, implementation readiness, QA signoff, route handling, and in-world status are distinct.

## Current-state and specialized references

- [Current State](docs/CURRENT_STATE.md) — read after AGENTS.md for current priorities, protected experiences, implementation evidence, and pending QA.
- [Module Blueprint](docs/V3_MODULE_BLUEPRINT.md) — reusable module journey and contracts; read when planning or building a module after the governing rules.
- [Route Manifest](docs/V3_ROUTE_MANIFEST.md) — route inventory, planned targets, and SPA fallback.
- [Module Status](docs/V3_MODULE_STATUS.md) — recorded readiness and QA needs.
- [Data Contracts](docs/V3_DATA_CONTRACTS.md) — frontend tolerance principles and proposed backend payloads.
- [UI Animation Checklist](docs/CODEX_UI_ANIMATION_CHECKLIST.md) — focused inspection, regression checks, and handoff evidence.
- [Codex Pass Template](docs/CODEX_PASS_TEMPLATE.md) — concise task scope and acceptance details; permanent rules are inherited from AGENTS.md and governing documentation.
- [$v3-qa Skill](.agents/skills/v3-qa/SKILL.md) — proportional QA selection, browser/evidence procedure, and result format.
- Project roles: [Scout](.codex/agents/v3-scout.toml), [Builder](.codex/agents/v3-builder.toml), [QA](.codex/agents/v3-qa.toml), [Reviewer](.codex/agents/v3-reviewer.toml). The parent coordinates; Builder is the application-writing subagent.
- [QA harness](scripts/v3-qa.js): `npm run v3:qa -- route /wrestling/shows`; modes are `smoke`, `route /path`, `wrestling`, and `all`. Use proportional coverage; generic route health includes standard responsive/reduced-motion checks.
- [Visual Baselines](docs/V3_VISUAL_BASELINES.md) — browser/mobile/desktop candidates, motion references, physical-device evidence and human approval; consult for relevant visual changes and regression review.
- [Design Reference Art](docs/design/reference-art/README.md) — reference-only asset policy and Draft/Locked catalog.

The workflow is operational for normal Experience Build; Current State distinguishes repository-verified tooling from dated execution reports, older module snapshots, pending upgrades, and physical/human signoff. Module Blueprint supplies reuse contracts without changing world identity. Governing creative canon and unresolved decisions remain unchanged.

## Historical and future-planning references

- [Site Development Rules](docs/architecture/VMPix-V3-Site-Development-Rules.md) — initial foundation rationale.
- [Frontend Structure Plan](docs/architecture/VMPix-V3-Frontend-Structure-Plan.md) — proposed organization and launch staging.
- [Admin Shell Blueprint](docs/architecture/VMPix-V3-Admin-Shell-Blueprint.md) — future Alpha 1 operational UX.
- [Admin Editing Roadmap](docs/V3_ADMIN_EDITING_ROADMAP.md) — future data/editing phases and required safeguards.
- [Mock Data Inventory](docs/V3_MOCK_DATA_INVENTORY.md) — cleanup-pass history and fixture references requiring freshness checks.

No historical planning instruction overrides current project law. Useful rationale is preserved; superseded execution guidance is explicitly marked.
