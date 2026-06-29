# V3 Design Reference Art

## Purpose

This folder stores visual design targets for the V3 experience.

Images placed here represent visual intent. They are not production assets, UI dependencies, or files consumed by the application at runtime. They are references used during future implementation and review.

Developers should match the feeling, structure, hierarchy, atmosphere, and visual behavior shown in these references whenever practical, while still respecting the active V3 architecture, performance constraints, accessibility requirements, and route/module ownership rules.

## Usage

- Store reference images and supporting visual notes in this folder.
- Keep filenames stable after they are referenced below.
- Do not import files from this folder into production code.
- Do not treat these images as final application assets.
- Update the relevant section when a new reference image is added.
- Use `Draft` for exploratory direction and `Locked` for protected visual targets.

## Engine Bar

Purpose: Define the persistent V3 Engine Bar visual target, including its shell-level presence, density, layering, route readability, and powered-system feel.

Status: Draft

Reference filename(s): None added yet.

Notes: References should preserve the existing Engine Bar role as a persistent non-home shell element. They should not imply changes to height, layout ownership, route behavior, or text placement unless a future implementation task explicitly approves that work.

Locked / Draft: Draft

## Tesla Arc

Purpose: Define the intended electrical transmission behavior between Engine Bar emitters, including dominant arcs, branch density, glow level, emitter capture, and theme-responsive color.

Status: Draft

Reference filename(s): None added yet.

Notes: References should describe the intended feel of live high-voltage electricity without becoming production SVG, CSS, or JS assets. Future work should preserve reduced-motion behavior and mobile performance.

Locked / Draft: Draft

## Featured Stars

Purpose: Define the constellation beacon star target, including astronomical core brightness, diffraction spikes, restrained halo, theme color behavior, and click/selection readability.

Status: Draft

Reference filename(s): None added yet.

Notes: References should guide the beacon stars toward photographed astronomical stars rather than UI orbs. The existing click behavior, world color behavior, animation timing, and reduced-motion behavior remain separate implementation constraints.

Locked / Draft: Draft

## Portfolio Atmosphere

Purpose: Define the overall Portfolio atmosphere, including starfield depth, nebula balance, beacon hierarchy, Engine Bar integration, and cinematic restraint.

Status: Draft

Reference filename(s): None added yet.

Notes: References should help maintain a coherent V3 environment without increasing visual noise or overpowering functional UI. They should be used as mood and structure references, not as replacement layouts.

Locked / Draft: Draft

## Home Story

Purpose: Define the Home Story visual and emotional direction, including first-screen tone, transition intent, ignition feel, and relationship to the Portfolio entry sequence.

Status: Draft

Reference filename(s): None added yet.

Notes: References should not imply route changes or timing changes by themselves. Any future implementation must preserve the established Home animation ownership unless explicitly approved.

Locked / Draft: Draft

## World References

Purpose: Store visual targets for individual worlds and modules so each destination can remain distinct while still belonging to the V3 system.

Status: Draft

Reference filename(s): None added yet.

Notes: References may include atmosphere, color, composition, texture, and UI density targets for Music, Wrestling, future worlds, and supporting module states. They should complement `docs/design/world-bible.md` rather than replace it.

Locked / Draft: Draft

## Future Concepts

Purpose: Capture exploratory visual ideas that may inform later V3 work without committing the application to immediate implementation.

Status: Draft

Reference filename(s): None added yet.

Notes: Concepts in this section are intentionally non-binding until promoted into a specific section and marked `Locked`. They should remain clearly separated from approved production direction.

Locked / Draft: Draft
