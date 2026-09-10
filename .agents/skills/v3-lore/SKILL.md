---
name: v3-lore
description: Develop and review VMPix-V3 lore, world history, chapter plans, narrative copy and story beats while preserving canon, protected identities and provisional status. Use for V3 creative/story requests, not ordinary code or visual fixes without a narrative question.
---

# V3 Lore

## Authority and scope

Work from the VMPix-V3 repository root, three directories above this skill. Read relevant sections in this order; reuse current context already read:

1. [World Bible](../../../docs/design/world-bible.md): canonical creative authority.
2. [Lore Master](../../../docs/design/V3_LORE_MASTER.md): consolidated working context, source provenance and open questions.
3. [Protected Decisions](../../../docs/V3_PROTECTED_DECISIONS.md) and [Current State](../../../docs/CURRENT_STATE.md): supporting protection and development context.
4. [Experience Build Rules](../../../docs/V3_EXPERIENCE_BUILD_RULES.md) and [AGENTS.md](../../../AGENTS.md): process, scope and human approval.

The creative order is World Bible → Lore Master → Protected Decisions / Current State as supporting context. Never contradict protected decisions or resolve source conflicts by inference. Cite the competing sources and preserve UNRESOLVED status. Current implementation and QA are not creative approval.

The user's explicit task controls scope. This skill supports brainstorming, chapter planning, world-history development, terminology/canon review, story beats, narrative copy, transition meaning and environmental storytelling. It does not automatically authorize application code or canon/documentation edits. Draft in the response unless the task explicitly allows an output file. No deployment or backend work is part of this workflow.

## Preserve status

Label each significant fact, development or copy proposal; inherit the source's status, not a status inferred from repetition.

| Label | Use |
| --- | --- |
| CANON | Existing World Bible fact, including any uncertainty stated there. |
| APPROVED / PROTECTED | Explicitly approved creative decision within its recorded scope. |
| WORKING LORE | Provisional supplied history/context; remains provisional. |
| PROPOSAL | New suggested development, structure or copy; not an established event. |
| INSPIRATION / EASTER EGG | Influence/reference only; no shared continuity. |
| DEFERRED | Intentionally postponed; positive discussion does not remove deferral. |
| UNRESOLVED | Conflict, missing evidence or unfinished question; do not silently answer it. |

Do not collapse categories. Human approval is required before anything new becomes canon. Neither agent review, implementation, nor inclusion in Lore Master is promotion. Record exact approval scope before a later authorized World Bible update; agents cannot approve themselves. Existing explicit approval counts and must not be requested again.

## Creative method

- Identify established facts with source/section references, then open creative space and protected boundaries. Distinguish valid supplied history from independently retrieved evidence; report missing source material honestly.
- Preserve deliberate ambiguity, exact terminology and approved wording. Do not rewrite approved lore merely for style.
- Never invent missing causal links, biographies, mechanics, timelines or cross-world relationships as facts or to fill gaps. In requested brainstorming, offer genuinely new ideas only as clearly separated PROPOSAL items with assumptions and approval needs; do not override deliberate ambiguity, deferred scope or protection.
- Inspiration is not canon. Avoid generic sci-fi/fantasy filler and unsupported equivalences to outside worlds.
- Story precedes animation; identity precedes visuals; atmosphere supports story. For experience structure explain: what the user sees → what the system is doing → what the user should feel → what story beat is communicated. No choreography or code is authorized merely by describing its narrative purpose.
- Use one coherent story beat or the task's explicitly approved broader scope. Separate sourced lore from new narrative ordering/copy. Planning a chapter does not authorize writing its full prose.
- Check contradictions, accidental retcons, status inflation, invented terminology, duplicate/deferred concepts and silently resolved questions before handoff.

Known source-sensitive examples: Daïion's prosperity and Draegin connection are WORKING LORE, not newly canonized history; Patient Zero/Syraxi details are incomplete. Preserve literal-world/reconstruction ambiguity and the unresolved planet/Hall relationship. Fury³/Final Fantasy VII/Dragon Ball influences do not establish shared continuity. Consult Lore Master for current details rather than copying lore into this skill.

## Proportional collaboration

Normal flow: Chris / ChatGPT → v3_lore → v3_story → v3_canon_reviewer → Chris approval → later authorized canon/documentation update → Builder implementation.

Not every creative task needs all roles. Use [v3_lore](../../../.codex/agents/v3-lore.toml) for facts/open space and proposals, [v3_story](../../../.codex/agents/v3-story.toml) for narrative structure, and [v3_canon_reviewer](../../../.codex/agents/v3-canon-reviewer.toml) for independent consistency review. The parent passes exact task scope and source references and handles approval. Subagents return response-only work; they do not edit canon or code.

If a runtime cannot select a custom role, disclose that limitation before reporting validation. Reading role instructions into a normal subagent can test behavior but does not prove TOML activation, model settings or sandbox enforcement.

## Handoff

State established material and sources, proposals with labels, conflicts/questions, deliberately deferred material and any human approval needed. Do not imply an approval requirement for simply receiving an authorized draft; approval applies to canon promotion or protected changes. A review verdict is not Chris's creative signoff.
