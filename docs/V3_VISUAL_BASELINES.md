# V3 Visual Baselines

CURRENT / SPECIALIZED. This workflow complements `$v3-qa` and `npm run v3:qa`; it does not change their checks or the authority of [AGENTS.md](../AGENTS.md), [Experience Build rules](V3_EXPERIENCE_BUILD_RULES.md), or [Protected Decisions](V3_PROTECTED_DECISIONS.md).

## Reference types and status

- **Static visual baseline:** a human-approved screenshot of a known-good state. A browser screenshot can establish layout, but cannot establish animation continuity.
- **Motion / transition reference:** a human-approved recording of timing, continuity, animation character, flicker-free behavior and transition feel. Prefer Samsung S25 Ultra video for mobile motion judgment.

Every item is **candidate**, **approved**, or **superseded**. Capture or a passing test creates no approval. Only Chris's explicit approval makes a reference protected/golden; record the approver, date and exact accepted scope. Technical QA, browser emulation and physical-device evidence remain distinct.

## Storage and naming

| Location | Evidence |
| --- | --- |
| `qa/baselines/screenshots/360x800/` | Narrow mobile browser viewport |
| `qa/baselines/screenshots/412x915/` | Primary Samsung S25 Ultra-sized browser viewport |
| `qa/baselines/screenshots/1920x1080/` | Desktop browser viewport |
| `qa/baselines/motion/` | Accepted/candidate motion references with provenance |
| `qa/device-evidence/s25-ultra/` | Real Samsung S25 Ultra recordings/screenshots |
| `qa/device-evidence/iphone/` | Real iPhone Safari evidence |
| `qa/device-evidence/webviews/` | Real Facebook, Messenger or Instagram webview evidence |

Use route-oriented names, for example `wrestling-shows--412x915.png` and `wrestling-show-080826--1920x1080.png`. Motion may use `wrestling-shows-to-record--s25-ultra--approved.mp4`, but only after approval. For distinct revisions, add a meaningful pass/revision suffix; dates belong in metadata rather than being the primary identifier. Do not duplicate large recordings between folders: link to their original evidence location.

Browser sizes are CSS viewport pixels, not phone hardware dimensions. Browser emulation, including a mobile-sized Chrome screenshot, is never physical-device verification. Record actual device, OS, browser/app version, orientation, browser chrome and effective viewport where available for physical evidence.

## Capture, approval and replacement

Capture only task-relevant routes/states with readable fonts, settled images/data, and the intended selection. Record route, capture point/scroll/selection, source revision and uncommitted application changes, date, browser/version, viewport, DPR, motion preference, data source, and known limitations. Motion records also describe the journey, recording method and accepted timing. Preserve evidence of errors rather than presenting an incomplete state as known-good.

Create new candidates without overwriting approved references. Chris reviews the exact artifact and scope; record that decision beside the evidence. Replacements need explicit approval, a reason and a link to the prior reference; mark the prior item superseded and retain its provenance and approval history. Superseded references explain history, not current acceptance. Do not silently promote old screenshots or auto-update golden files to make checks pass.

## Proportional use

For protected-surface changes, major responsive layout, approved transitions or visual regression review, `$v3-qa` and Reviewer consult relevant approved references and compare the same route, viewport, state and motion setting. Candidates are comparison evidence only. Use the existing harness for runtime/layout checks; investigate meaningful differences without brittle comparisons of live data or random embers. A still image cannot approve motion; missing device or human evidence must be reported honestly. Unrelated tiny changes do not require baseline comparison or a full-site capture.

Reviewer checks protection, capture provenance, approval status, relevant regression evidence and any proposed replacement. Only Chris supplies subjective visual signoff; technical readiness may be reported separately.

## Initial seed — PASS 27

Six viewport PNGs cover `/wrestling/shows` and `/wrestling/shows/080826` at all three standard sizes. All are **candidate**, with Chris approval pending. [Capture metadata](../qa/baselines/screenshots/candidates.json) records exact browser, revision, date, selection and capture conditions. They use live data and running atmosphere, so content/particles can vary between captures. These are browser screenshots, not automated golden assertions, motion approval, or physical-device evidence. No historical artifacts were migrated or approved.
