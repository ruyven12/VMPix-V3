# Pillar of Melody — The Chorus Experience Blueprint

## Approval, authority and scope

**APPROVED / PROTECTED — PASS M2, 2026-11-24.** Source: Chris's “Pillar of Melody Design Documentation” brief. Approval covers the experience decisions recorded here, not implementation, completed data integration, final QA or cinematic signoff.

The [World Bible](world-bible.md#pillar-of-melody--confirmed-narrative-foundation) owns the narrative foundation. The [Zhento Storyboard](ZHENTO_STORYBOARD.md#pillar-of-melody--approved-experience-design-pass-m2) places this experience within the Listener's journey. Existing working history, unresolved world questions and protected architecture retain their status.

This is documentation only. M2 does not authorize application, backend, database, route or deployment changes. No additional arrival screen, second Shell or replacement transition system is approved.

## Narrative identity

| Element | Approved decision |
| --- | --- |
| Pillar | Pillar of Melody — The People Archive |
| Experience | The Chorus |
| Core theme | Connection |
| Environment | Living Archive combined with Living Network |
| Discovery | Individual first; every individual represents a unique note |
| Relationships | Documented connections form the melody; together, individuals form The Chorus |
| Recognition | Contributions and identities without ranking, popularity, elite status or implied mortality |

**THE CHORUS STILL RESONATES. THE CHORUS IS NEVER SEVERED.** Preserve remembrance and continuation together. Legacy is living history, not a memorial classification.

Living Archive, Living Network, notes and resonance describe the experience. They do not establish literal Pulse technology, a physical Pillar location, anyone's fate, or a new explanation for Zhento's ebb.

## Listener journey

These are conceptual discovery stages, not new routes, mandatory tabs or an additional arrival sequence.

| Stage | What the Listener sees | What the archive does | Feeling / story meaning |
| --- | --- | --- | --- |
| **The Chorus** | Individuals presented with distinct musical identities | Makes the entire eligible archive discoverable alphabetically | Every contribution belongs within a wider living soundtrack |
| **The Note** | One individual's name, signature and documented roles | Preserves identity across Index and Person Detail | Recognize a person before exploring their connections |
| **The Resonance** | Supported connections across Zhento | Reveals documented relationships by category | Individual notes connect to form a melody |
| **Legacy** | Documented performances and verified individual photography | Preserves contributions chronologically | Follow a continuing history without ranking or implying mortality |

## People Index

### Composition

- Use the existing **zhento-melody.png** background.
- Responsive card grid: **two columns on mobile**, expanding on desktop.
- Restrained translucent surfaces support contrast without replacing the environment.
- Center each card's content in this order: **Melody Signature → Name → Instrument/role → Band associations**.
- Hide missing information rather than inventing values or displaying empty metadata slots.
- No additional metadata, action buttons, arrows or rankings.
- Both the name and signature activate the same existing canonical Person Detail destination, with accessible names and keyboard focus.

### Discovery and inclusion

- Preserve the existing public inclusion rules. M2 does not authorize publishing Friends-category or zero/unknown-photo records currently excluded by those rules.
- Make the **entire eligible Chorus** available alphabetically; progressive pagination manages performance rather than permanently truncating discovery.
- Preserve search, alphabetical, category and instrument filtering.
- Preserve active filters, loaded records, browsing position and scroll on return from Person Detail.
- Do not present generated performer ordinals as identities or rankings. Their existing behavior remains an M1 technical backlog item.

## Melody Signatures

Every individual receives a persistent musical identity derived from their **stable database ID and documented musical role**. The same signature and individual color persist across Index and Person Detail; rendering must not randomly regenerate identity.

**Recognizable musical note forms are mandatory.** Role treatments enrich musical notation rather than replace it with an unrelated abstract symbol.

| Documented role | Signature language |
| --- | --- |
| Strings | Tablature-inspired notation |
| Percussion | Rhythmic notation and pulse structures |
| Keys | Staff and melodic notation |
| Vocals | Sonic resonance and waveform elements |
| Multi-instrumentalists | Blended musical forms |
| Unclassified contributors | Universal musical note; do not guess an instrument |

- The notation is abstract identity language, not a falsely attributed song, composition or performance.
- Individual color variations derive from the existing Melody background's **amber, gold, violet and rose** tones.
- These individual accents do not recolor the protected purple Shell or revise the wider Zhento palette.
- Underlying shapes remain static. Slow breathing luminosity may vary in timing between signatures.
- Respect reduced motion and avoid unnecessary offscreen animation.
- Text names and roles remain readable independently of color or motion.

**DEFERRED — Portraits.** Portrait assets, provenance and presentation are outside the approved signature pass. Verified archive photography remains a separate Legacy capability.

## Tune the Chorus

A unique musical **Tuning Sigil** replaces conventional dropdown presentation.

- Collapsed by default; tap or keyboard activation reveals discovery controls.
- Preserve existing search, alphabetical, category and instrument filtering.
- **Horizontal tuning; vertical card discovery.**
- Use selectable symbols and tiles rather than dropdowns, with clear labels, selected states and accessible focus.
- Retain and combine active filters; indicate them through subtle illumination.
- Automatically collapse after a filter selection or search submission.
- Reset restores the entire eligible Chorus without changing public inclusion rules.
- Keep the Sigil accessible during browsing.
- Preserve search/filter state when leaving and returning to the index.

Exact control geometry, focus choreography and motion timing remain implementation details for a separately reviewed pass; M2 does not introduce another navigation system.

## Person Detail

### Identity — The Note

- Name, persistent Melody Signature and individual color.
- Documented instruments and roles.
- Identity remains visible above the selectable sections.
- Preserve canonical Person Detail routes and verified identity; missing values do not become invented biography.

This approves the identity hierarchy, not a new fixed-viewport or tab architecture.

### Resonance — Connection

- The individual's signature is the central network node.
- Reveal documented connections to **bands, people, shows and venues**.
- Support cross-Pillar navigation through existing canonical destinations.
- On mobile, reveal relationship categories individually.
- Never invent or infer unsupported relationships. A shared band alone is not evidence that a person performed at every linked show.
- The design does not claim every relationship type is currently available. Unsupported categories must not produce fabricated nodes; distinguish loading, empty and unavailable data where applicable.

### Legacy — Contribution

- Chronological documented performances, with links to existing Show Details.
- Verified individual photography with progressive gallery loading.
- Preserve the shared lightbox, existing photo context and canonical navigation.
- Preserve truthful loading, empty, partial, unavailable and error behavior.
- Do not present bounded samples or incomplete scans as verified complete totals.
- No career rankings, popularity metrics or implied mortality.

## Transitions, state and protected architecture

- Preserve universal Pillar arrival transitions, existing Engine Bar animation, universal Back and return transitions.
- A selected Melody Signature briefly resonates before Person Detail navigation, coordinated with existing Shell behavior.
- Do not add an arrival screen, replacement transition system, separate Shell or new routing ownership.
- Preserve existing functionality and canonical routes.
- The Shell continues to own routing, navigation, transitions, viewport and Engine Bar lifecycle; the Music module owns local content and state.
- Preserve filters, loaded records, focus and scroll context through supported navigation. Existing M1 restoration defects are not declared resolved here.
- Keep motion optional, low cost and safe under reduced motion. No new exact timing or unrelated effects are approved by this document.
- Preserve stable IDs, verified relationship evidence, public inclusion rules and failure-safe data handling.

## M1 technical backlog — separate from creative approval

**OPEN / UNRESOLVED.** The following are recorded for later bounded investigation and correction; none is resolved by M2 documentation.

1. **Route identity precedence:** verify stable database identity versus slug/name-derived route selection.
2. **Sample-person fallback exposure:** prevent authored sample identities/counts being mistaken for verified live records.
3. **Inferred show appearances:** distinguish person-specific evidence from band-derived association.
4. **Photography count accuracy:** verify complete totals versus loaded matches, previews and fallback values.
5. **Failed direct-detail loading recovery:** failed requests can leave Person Detail at “Loading Person Archive.”
6. **Keyboard focus and outer-scroll restoration:** list state restores, but focus and outer scrolling require correction/verification.
7. **Generated performer ordinals:** remove misleading identity/ranking implications in a later authorized change.
8. **Full live pagination verification:** confirm complete eligible discovery, limits and truthful partial/failure handling.
9. **Physical-device QA:** verify primary Samsung S25 Ultra, secondary mobile/webview and desktop behavior.

Existing working data/gallery functionality is a donor to preserve. These findings do not authorize opportunistic repairs, publishing excluded people, or changing API contracts.

## Remaining technical uncertainties

- Signature generation rules, role normalization, collision handling and persistence when documented roles change must be specified without replacing stable identity.
- Confirm authoritative sources and evidence for each relationship category, membership history, person-specific performance attribution and individual photography before rendering claims.
- Confirm progressive pagination and return-state handling against the live People contract; no new endpoint or database capability is assumed.
- Final Tuning Sigil geometry, accessible interaction details, signature motion timing and mobile performance need scoped implementation review.
- Physical Pillar form, geography, the cause of Zhento's ebb and the fate of its population remain unresolved world questions, not technical gaps to fill with invented content.

## Proposed implementation roadmap

**PROPOSAL / FUTURE PLANNING.** These pass boundaries organize the approved design. Each requires separate implementation authorization and independent review before proceeding.

| Pass | Bounded focus |
| --- | --- |
| **M3** | People Index foundation: eligible alphabetical grid, existing background, progressive discovery and restoration |
| **M4** | Persistent Melody Signatures and reduced-motion/performance behavior |
| **M5** | Tune the Chorus controls and preserved combined filtering |
| **M6** | Person Detail / Identity |
| **M7A** | Resonance: evidence-backed relationships and cross-Pillar navigation |
| **M7B** | Legacy: documented performances and verified individual photography |
| **M8** | Data integrity, performance and regression QA, including unresolved M1 findings |

Do not postpone a blocking data-integrity defect merely because M8 is the final review pass: report the blocker and obtain a bounded correction scope rather than implement misleading output.

## Future verification and handoff boundary

Future implementation QA starts at **412×915**, with **360×800**, **915×412** and **1920×1080** comparisons, normal/reduced motion, keyboard access, safe areas, overflow, loading/error recovery and navigation/restoration.

M2 verifies documentation consistency only. It does not establish runtime readiness, complete live pagination, physical-device approval or final visual signoff. No routine screenshots/videos are required; request visual evidence only within the applicable later pass.

**M3 readiness:** design foundation documented; implementation remains separately authorized. Preserve the M1 backlog and report any blocker before expanding scope.
