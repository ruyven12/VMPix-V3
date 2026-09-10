---
name: v3-qa
description: Verify VMPix-V3 frontend changes with proportional QA after implementation or before signoff, including responsive layout, overflow, routes, animation, interactions, data states, galleries/lightboxes, and browser/runtime regression checks. Use for V3 verification requests; this procedure does not authorize implementation or unrelated testing.
---

# V3 QA

**Scope stays small. Verification may be thorough.** Select checks from the affected behavior; do not automatically run every test or inspect unrelated worlds for a tiny change.

## Establish scope and authority

Work from the VMPix-V3 repository root (three directories above this skill). Read [AGENTS.md](../../../AGENTS.md), then relevant governing references: [Project Rules](../../../docs/PROJECT_RULES.md), [Experience Build Rules](../../../docs/V3_EXPERIENCE_BUILD_RULES.md), [Current State](../../../docs/CURRENT_STATE.md), and [Protected Decisions](../../../docs/V3_PROTECTED_DECISIONS.md). Reuse already-read context unless it changed. This skill supplies a procedure, not new authority.

Identify the task's allowed files, changed files, affected routes/surfaces, acceptance criteria, and whether the change touches layout, routing, data, animation, interaction, gallery/lightbox, or shared Shell behavior. Separate pre-existing changes from the current pass. Determine which protected experiences are reasonably affected, including indirect shared dependencies. Use scoped reads/diffs; do not scan the workspace or automatically QA unrelated worlds.

Choose a small verification set and explain material omissions. Shared routing changes may need broader route coverage; a local content change does not. Do not silently settle Engine cold-entry/return-Home, creative ownership, terminology, or identifier questions recorded as unresolved.

## Existing infrastructure first

Inspect [package.json](../../../package.json), [Playwright configuration](../../../playwright.config.js), and only relevant existing tests under `tests/e2e/` before choosing a run. Current entry points are `npm run test:e2e -- <spec-path>` and `npm run test:smoke`; select a relevant spec or test filter instead of defaulting to the full suite. Inspect what a spec actually asserts before treating it as coverage.

The current configuration uses `http://127.0.0.1:4173`, Chrome by default (`PLAYWRIGHT_CHANNEL` override), and `tests/e2e/serve-static.js`, reusing an existing server outside CI. Confirm configuration at use time. Reuse existing services; do not restart them unnecessarily. HTML reports, failure screenshots, and retained traces can write files: ensure output locations fit the active task's scope before running. Prefer available browser inspection when it supplies the needed evidence without unauthorized artifacts.

No package installation, backend changes, new scripts, or temporary infrastructure is authorized by this skill. Missing dependencies/browser/tool access are verification limitations to report. Current State records Wrestling tests with outdated selectors/routes and an older S25 viewport; inspect relevance rather than silently rewriting tests or treating their presence as a passing result. Never alter protected behavior to satisfy a stale assertion.

## Executable harness (PASS 16)

Prefer the repository harness when it fits the task; retain specialized browser inspection for behavior it does not assert.

- `npm run v3:qa` or `npm run v3:qa -- smoke`: existing route smoke coverage.
- `npm run v3:qa -- route /wrestling/shows/080826`: one local route, at 360×800, 412×915 and 1920×1080, each with normal and reduced motion.
- `npm run v3:qa -- wrestling`: current Wrestling route-smoke cases plus generic gateway/Hall/show health.
- `npm run v3:qa -- all`: complete existing suite plus generic gateway/Hall/show health. Never default to all for a surgical pass.
- `npm run v3:qa -- --help`: syntax. Quote routes containing query strings. External URLs, protocol-relative paths and traversal are rejected (exit 2).

The runner uses the existing Playwright server/configuration and two workers, preserves test exit codes and prints elapsed time. Generic checks use live resources, not mocked data; a healthy loading/error presentation does not establish API or archive-data correctness. They check rendering, application errors, horizontal overflow, in-viewport accessible controls and functioning scroll containers. They do not replace full control accessibility, nested clipping, carousel, photo, timeout, performance, physical-device or creative review. Hidden/inert controls are not accessibility-audited by this layer; the known Engine Return exposure/overhang still needs dedicated QA.

Generic failures retain screenshots/traces in the existing test-results folder and HTML report; passing generic tests do not save screenshots. Existing specialized specs may still save their own screenshots. Reports are replaced by subsequent runs, so review/copy important failure evidence before running again. No dependencies or Playwright defaults were changed.

Legacy Wrestling specs still contain retired Ring Archive/card selectors, old venue URLs and rigid placeholder relationship assumptions. Wrestling mode explicitly excludes the three specialized specs (wrestling-people-responsive, wrestling-venues-responsive and wrestling-relationship-hooks): their index/detail mounts, card selectors and placeholder IDs describe retired surfaces. It reuses Wrestling cases from routes-smoke instead. All/test:e2e retain the legacy specs unchanged. The runner prints these coverage gaps; classify failures before interpreting them as application regressions. Existing Home/Calendar tests also require separate drift review. A harness run returning nonzero is never a passing signoff.

## Select and perform relevant checks

| Concern | Verification |
| --- | --- |
| Basic integrity | Relevant syntax checks; browser console/runtime errors; missing resources/dependencies; DOM mounting; obvious route failures. Distinguish baseline issues from current regressions. |
| Responsive UI | Standard viewports **360×800**, **412×915** (primary Samsung S25 Ultra-sized target), **1920×1080**. UI/signoff passes normally include all three; narrower changes may justify a subset. Check horizontal overflow, clipped text/controls, overlap, fixed/sticky placement, scrolling/nested traps, touch targets, safe-area-sensitive layout, and Engine Bar obstruction. Browser emulation is not physical S25 Ultra verification. |
| Routing/navigation | As applicable: direct entry, SPA navigation, Back, Forward, deep drilldowns, return path, canonicalization, Shell/Engine state, and recoverability without visual dead ends. Use the [Route Manifest](../../../docs/V3_ROUTE_MANIFEST.md) for the relevant contract and verify actual behavior; do not assume every route needs testing. |
| Animation | Consult the [UI Animation Checklist](../../../docs/CODEX_UI_ANIMATION_CHECKLIST.md). Check flicker, jitter, timing drift, unexpected layout shift, repeated entry, transition handoff, reduced motion, usable navigation during/after motion, and reasonable mobile performance. Record browser observations and any device-recording evidence separately from Chris's cinematic approval. |
| Data/API | Applicable loading, success, empty, missing/partial, unavailable/error, and delayed/timeout states where the existing harness supports them. Shell/navigation must remain usable when data fails. Identify actual remote requests versus mocked/intercepted/cached data. A fixture test or source binding does not prove remote service success. |
| Gallery/lightbox/interactions | Relevant open/close, photo next/previous, selection, touch/keyboard controls, return/back, scroll recovery, and missing-media behavior. Select checks from the change; do not infer visual signoff from an implemented lightbox. |
| Protected regression | From the protection index, check only protected surfaces reasonably affected through shared code. Preserve historical approval boundaries while testing current behavior; do not retest every protected page after unrelated work. |

Record route, viewport/device, browser, tested build/change context, command or observation, and result sufficiently to reproduce important findings. Do not claim a test passed unless it actually ran and passed. If required cases cannot be exercised, report the gap rather than inventing success.

## Self-correction boundary

For a defect directly caused by the current approved implementation, inside allowed files, and requiring no redesign or expanded architecture: **inspect → correct → retest**. Existing authorization counts; do not immediately hand back a safely correctable defect. An inspection-only task still forbids edits.

If the fix needs materially broader file scope, architecture changes, protected creative changes, public route-contract changes, or dependencies, stop the dependent correction and report the issue and smallest next step. Continue independent authorized verification where useful. Do not refactor unrelated systems, modify backend systems, or expand task scope. Retest corrected and reasonably affected behavior; stop broadening once relevant checks pass without unresolved concerns.

## Evidence and result

Keep evidence categories explicit:

- **Source Verified:** supported by code inspection only.
- **Browser Verified:** actually observed in browser/Playwright execution.
- **Automated Test Verified:** a relevant assertion/test actually passed.
- **Device Verified:** observed on a real identified target device.
- **Human Visual Signoff:** Chris explicitly approved subjective appearance/motion.

One category never substitutes for another. Historical approval is not current device QA; desktop emulation is not iPhone Safari or physical webview testing.

Return this concise structure, scaling detail to findings:

## V3 QA Result

**Scope:** routes/surfaces and changed files relevant to QA.

**Checks Passed:** actual checks with evidence category and relevant target.

**Issues Found:** observed defects only; separate stale-test/tooling issues from product failures.

**Self-Corrections:** changes and retest results, or none.

**Not Verified:** skipped/blocked browser, API, device, or human checks and material reasons.

**Signoff:** choose one:

- `PASS`: required technical checks for the stated scope passed; no required acceptance remains outstanding. This is not implied creative approval.
- `PASS — HUMAN VISUAL REVIEW REQUIRED`: required technical checks passed; subjective visual acceptance remains pending.
- `BLOCKED`: required verification could not be completed (including required physical-device checks); identify the blocker without claiming a pass.
- `FAIL`: an observed required behavior/test fails and remains unresolved; distinguish an obsolete assertion from a confirmed product defect.

Do not hide a missing required technical/device check behind the human-review label. Out-of-scope device checks may remain listed as not verified without implying full device readiness.
