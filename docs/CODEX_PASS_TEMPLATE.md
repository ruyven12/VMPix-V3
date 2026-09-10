# Codex Pass Template

Fill in the task fields below. Permanent rules are inherited from root [AGENTS.md](../AGENTS.md), [PROJECT_RULES.md](PROJECT_RULES.md), and [Experience Build rules](V3_EXPERIENCE_BUILD_RULES.md), in that reading order. Follow their authority hierarchy and relevant specialized references; this template does not replace them.

## Project

Website-V3 / VMPix-V3

## Task

[Exact task for this pass.]

## Story / Intended Result

[What the user should see, what the system should do, and what the experience should communicate. For non-creative work, describe the functional end state.]

## Files Allowed

- Inspect: [Exact files necessary for this pass, in addition to governing instructions.]
- Edit: [Exact files that may be changed.]

Keep scope as small as practical.

## Files Forbidden / Protected

[Specific forbidden files and protected surfaces potentially affected by this pass.]

Permanent restrictions are inherited; do not recopy them. Listing a protected surface does not authorize redesign.

## Acceptance Criteria

[Measurable or observable conditions defining completion.]

Include only relevant criteria: exact behavior/data result, visual target/timing, route/back behavior, required devices/viewports, reduced motion, or specific regression protections.

## References

[Optional screenshots, recordings, approved prototypes, donor files, API routes, or documentation; identify the relevant part and purpose.]

## Explicit Exceptions

[Only restrictions this task explicitly authorizes overriding, with exact scope.]

None.

## Verification

Follow AGENTS.md and relevant specialized documentation. [Specify any task-specific required checks or evidence.]

Use proportional syntax/runtime checks, existing Playwright/browser inspection, screenshots, responsive checks, direct-route/back checks, reduced-motion checks, console checks, and diff review as relevant.

**Scope stays small. Verification may be thorough.**

Implement → inspect → test → correct → retest within approved scope.

## Return

Keep the handoff concise:

- Files inspected.
- Files changed.
- Result.
- Verification.
- Remaining human-review item or limitation, if any.
