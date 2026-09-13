# PASS 44 QA result

**Signoff: PASS — HUMAN VISUAL REVIEW REQUIRED.**

## Scope

Match photo downloads in modules/music.js and filename handling in modules/wrestling.js. Tested the final frozen source including the correction that derives the download session path from the selected tile's intended photo route. No application, test or harness files were changed by QA.

## Checks passed

**Browser verified:** Same-origin Blob downloads passed click, touch tap and keyboard Enter. Each explicit activation issued one fetch, saved 545,611 bytes, opened no tab and preserved the current photo route. Native Next then download and Previous then download selected the correct photo and filename. The temporary Blob anchor was removed immediately. See [actions.json](actions.json) and click.png, tap.png, keyboard.png.

**Browser verified:** A controlled cross-origin response permitting CORS produced a real Blob download with no tab or route change. Gallery → photo → browser Back → Forward → Close passed. See [cors-success-history.json](cors-success-history.json).

**Real remote browser verified:** Scout freshly obtained the actual Vacationland Cup '26, August 8, 2026, match 1 photo record: image key 3FHj6CT, caption Rich Palladino. QA activated its unmodified large_url without intercepting that image request. SmugMug denied the fetch with a browser CORS error because Access-Control-Allow-Origin was absent. The first activation opened no tab and showed recovery guidance. A second explicit activation opened exactly one tab at the exact large URL while preserving the original viewer route. This proves the allowed fallback, not direct Blob download support from this host. The viewer fixture supplied the surrounding route and displayed image; the tested download URL and request were real. See [real-match-host.json](real-match-host.json), including expected browser CORS diagnostics.

**Browser verified:** HTTP failure, non-image response and blocked-fetch fixtures did not download invalid content or open an automatic popup. Each armed the second-activation native fallback. Repeated click and Enter while pending issued only one request. Changing photos or closing the viewer canceled the pending session, cleared aria-busy and prevented delayed completion from producing a Blob or stale download.

**Browser verified:** Created object URLs were revoked on photo change. A separate real-time check observed the scheduled 30-second revocation. A hanging fetch recovered after 20,051 ms. Closing and opening the shared Music viewer left no download session, no match action marker and a hidden action row. See [timeout-cleanup-exclusion.json](timeout-cleanup-exclusion.json).

**Browser verified:** 360 × 800, 412 × 915 and 1920 × 1080, each with normal and reduced motion, passed both pending and longer fallback status states (12 measured layouts). The image/IN FRAME/action group remained centered, arrows stayed clear of the caption, no horizontal overflow appeared and the action row stayed above the Engine. Long captions remained contained. The mobile fallback screenshot was visually inspected. See [layout.json](layout.json) and [mobile fallback](status-360-no-preference-fallback.jpg). The screenshot uses an existing QA image as controlled media, not a claimed live photo.

**Automated test verified:** `npm run v3:qa -- route /wrestling/shows/080826/match-1/photo/001` passed 6/6 tests, exit 0, 9.8 seconds.

## Issues and corrections

The parent identified a pending photo-route synchronization risk before final validation. The Builder corrected the session path source; explicit Next/Previous download checks passed afterward. QA also corrected two verifier assumptions: the Close selector is `data-lightbox-back`, and history recovery must use an actual gallery-to-photo entry rather than assume direct-entry Close adds a photo history entry. Neither was an application defect.

## Not verified

Physical Samsung S25 rendering and human visual approval remain pending. The actual current SmugMug host does not permit direct Blob fetch from the local preview origin; successful remote direct download was therefore verified with a CORS-allowed fixture, while the actual host passed the required safe fallback. Remote save completion after opening the native image tab remains browser/user controlled.
