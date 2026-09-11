# PASS39 QA Result

**PASS — HUMAN VISUAL REVIEW REQUIRED** for the current local browser build. No application change justified: the requested independent appearance already works on unchanged HEAD4d9932627583fe9a54ccbd20d383b1136cb39514.

## Per-photo timing
Successful decode to effective visible image, including ancestor opacity/visibility, across360x800,412x915,1920x1080 normal and reduced motion:

| Source photo | Minimum ms | Maximum ms |
|---|---:|---:|
|1|12.3|54.4|
|2|6.5|13.3|
|3|3.9|12.5|
|4|5.5|17.3|
|5|8.6|16.5|
|6|4.9|16.0|

These are sampled browser observations, not configured waits. First photo participates in the existing information fade. Photos5 and6 appeared before deliberately delayed photo4; available tiles stayed in canonical source order. Every case visibly progressed1→2→3→4→5→6.

## Evidence
-1041 rAF samples; six unique requests and six successful decodes in every case; no duplicates, blank image cells or stable header/metadata removals. See each-photo-matrix.json and summary.json.
-Painted count1–6 JPEGs saved; count2/4/6 inspected. See painted-count-1.jpg through painted-count-6.jpg.
-Five-photo, eight-photo, one failed priority candidate, all failures, true zero and hanging image through its8-second timeout passed. Failures/hang remained unavailable, not empty. See states-navigation.json.
-Fresh eight-photo navigation executed mobile ArrowRight→page2, ArrowLeft→page1, photo001→browserBack, emitter→Campaign, browserBack→match, browserForward→Campaign; every route/page assertion completed.
-Scroll probe: tested360 dossier had no overflow (clientHeight=scrollHeight=800). Setting scrollTop60 clamps0; first image y316.15625 stayed fixed after later arrivals. Nonzero scroll preservation therefore not demonstrated. See scroll.json.
-Existing route health harness:6/6 passed.

QA initially observed the intended reset-control removal using an overly broad child selector; final matrix watches explicit header/metadata nodes and excludes that normal handoff cleanup.

All staggered image tests use controlled QA image fixtures. Current live/deployed behavior was not compared to a supplied deployment URL. No physical S25 or human motion approval. No app, test, harness or verifier-script edits by QA.
