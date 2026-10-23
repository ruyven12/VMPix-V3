# Pillar of Synchronicity V1 Experience Blueprint

## Purpose and authority

Status: **APPROVED EXPERIENCE DESIGN — V1**, recorded in PASS S0 on 2026-10-23.
Source: Chris's supplied **V3 MUSIC — PASS S0: Preserve Synchronicity Design Blueprint**. This document preserves those approved decisions as the reference for future Shows implementation passes. S0 changes documentation only.

The [World Bible — The Soundtrack](world-bible.md#world-the-soundtrack) remains the creative authority. Read this alongside the [Zhento / Music Storyboard](ZHENTO_STORYBOARD.md#pillar-of-synchronicity--core-concept-established), preserving the status distinctions in [Lore Master](V3_LORE_MASTER.md#status-key).

- **Existing protected story:** Synchronicity represents Shows and Convergence; bands, people, venues and audiences align in a shared experience. Zhento's Pulse survives in an Ebb Phase. Existing confirmed Pillar names and relationships remain unchanged.
- **Approved V1 experience design:** The supplied story foundation, Convergence Nexus environment, photographic memories and visitor journey below define this Shows experience. The recognition and preservation of naturally occurring convergence is the supplied narrative premise for this design; it does not supply a wider chronology. The Nexus floor, arches and cityscape are approved visual staging, not newly established historical architecture or the final Heart of the Sound.
- **Future implementation:** These decisions guide separately scoped implementation passes. They do not claim completed runtime behavior, technical verification or visual signoff, or authorize website changes in S0.

The World Bible and storyboard still mark Synchronicity's detailed origin, purpose, current state, physical form and Listener encounter as unfinished story work. This newer experience blueprint records the approved V1 encounter without silently rewriting those historical-lore boundaries. The cause of the ebb, population's fate and ultimate discovery remain unresolved. The World Bible is unchanged.

## Story Foundation

- Pillar of Synchronicity represents Shows and Convergence.
- Bands, people, venues and audiences align during live performances.
- These moments leave preserved echoes.
- Convergence occurred naturally; Zhento's civilization eventually recognized its significance and developed ways to preserve those moments.
- The current Nexus contains scattered, incomplete echoes during Zhento's Ebb Phase.
- Story progression: **Discovery → Reconstruction → Revival → Remembrance**.
- Revival briefly brings a preserved performance memory to life through photography.

## Environment

- Listener stands inside the Convergence Nexus, at the edge of the central floor.
- Massive circular metallic floor with engraved sonic pathways.
- Monumental segmented arches with openings to Zhento's futuristic cityscape.
- Ancient-futuristic architectural appearance with signs of age.
- Quiet but living atmosphere.
- Architectural echoes and suspended photographic memories.
- Restrained blue/purple accents without excessive artificial glow.

Approved desktop background:

[assets/media/background/zhento-syncronity.png](../../assets/media/background/zhento-syncronity.png)

Preserve that exact spelling.

Desktop background fills the Shows viewport. Mobile keeps the image centered horizontally and vertically.

Actual photographs and UI remain separate from the background asset.

## Floating Memories

- Mobile: maximum 3 photographs, one central and two surrounding.
- Desktop: maximum 5, one central and four surrounding.
- Smaller, asymmetrically positioned photographic frames.
- Thin cinematic borders and softly faded edges.
- Recent documented shows featured first.
- Concert photography preferred; show posters are fallbacks.
- Skip shows without usable imagery.
- Show fewer memories when necessary; never duplicate them.
- Gentle independent floating movement.
- Independent photograph rotation every approximately 8–12 seconds, with staggered crossfades.
- Pause movement and rotation on selection or when browsing the timeline.
- Reduced-motion support.

## Visitor Journey

1. Nexus environment appears first.
2. Floating photographic memories reveal.
3. EXPLORE ECHOES control appears.
4. Selecting a memory causes others to recede.
5. Selected memory converges toward the center.
6. Brief photographic revival.
7. Completed show poster and information appear.
8. Visitor chooses ENTER ARCHIVE or RETURN TO ECHOES.

No automatic navigation or return timeout.

## Reconstructed Show

Display:

- Centered show poster.
- Show name.
- Date.
- Venue and location.
- Performing bands.
- ENTER ARCHIVE.
- RETURN TO ECHOES.

## Archive Drawer

- EXPLORE ECHOES opens a rising angular HUD drawer.
- Initial mobile height approximately 65% of available viewport.
- Expandable for longer browsing.
- Engine Bar remains unobstructed.
- Timeline scrolls within its bounded content area.
- Preserve drawer state and browsing position.

## Chronological Timeline

- Shows ordered newest first.
- Expandable year sections with months.
- Latest year expanded initially.
- Older years collapsed.
- Entries feature thumbnails, names, dates and venues.
- LOAD MORE ECHOES progressively loads additional records.
- Inline loading without interrupting browsing.

## Search and Filters

- Search the entire archive.
- Match show names, bands, venues and dates.
- Search results display chronologically without year accordions.
- Dedicated FILTERS console.
- Multi-select Year, Venue and Band.
- Instant filtering.
- Console stays open while selecting.
- OR within categories, AND between categories.
- CLEAR ALL available.
- Filters affect the timeline only, not featured floating memories.

## State and Recovery

- Back from a Show Detail restores the reconstructed memory.
- Preserve timeline state, filters, selected show and scroll position.
- No unnecessary reconstruction replay.
- Empty results: NO ECHOES FOUND.
- API errors: SIGNAL INTERRUPTED with RETRY.
- No eligible imagery: Quiet Nexus with EXPLORE ECHOES still accessible.
- Preserve already-loaded content when possible.

## Architecture and Performance

- Universal Shell owns routing, viewport and Engine Bar.
- Music module owns local Shows interactions.
- PostgreSQL-backed archive relationships remain authoritative.
- Mobile-first, Samsung S25 Ultra primary.
- Lightweight animations and progressive loading.
- No layout shifts, flicker or scrolling traps.
- One story beat per implementation pass.

## Implementation boundary

**DEFERRED — Technical implementation.** Future passes must verify the existing archive data and relationships and decide the concrete rendering, loading, state and motion mechanisms within the approved design above. No endpoint, unsupported metadata, additional history or technical mechanism is established by this document. The specified memory limits, approximate rotation interval, drawer proportion, control wording and interaction rules remain the V1 design reference.

Follow [Project Rules](../PROJECT_RULES.md) and [Experience Build Rules](../V3_EXPERIENCE_BUILD_RULES.md). Implement one story beat per authorized pass; documentation approval does not replace implementation verification or human visual review.
