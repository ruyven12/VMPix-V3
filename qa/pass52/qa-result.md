# PASS52 QA result

PASS for the scoped progressive readiness changes, with live-service and physical-device limitations below.

- Controlled warm/cold matrix: 12 cases covering 360×800, 412×915 and 1920×1080, normal and reduced motion. Warm identity and decoded portrait appeared in the first sampled dossier frame; cold entry showed retrieval feedback. Each entry made one mandatory identity lookup, one history lookup, one portrait request and one poster request. Warm counts include Hall loading and cached Back/Forward. No sampled hidden dossier frame or page error occurred.
- Final geometry correction: 742 frames across six cold cases. Status, portrait, timeline and poster x/y/width/height each remained exactly constant through loading to loaded. Pending status text stayed within its cells. This independently verifies the final synchronous projection/text-fit correction; earlier mobile growth and desktop poster movement were corrected, not accepted.
- Optional HTTP image failure/hang did not block loaded core or timeline. Delayed Aaron→Ace selection cleared Aaron content immediately and ignored the late Aaron image completion.
- Recovery: controlled authoritative HTTP503 produced error; reopening after recovery made identity request two and loaded Aaron. Cached Forward added no identity or history request. Native keyboard entry and Back restored the same Hall node, query Aaron, focused Aaron link and nonzero scrollTop 4442 exactly.

## Controlled timing ranges

Milliseconds from navigation/click, including controlled 800 ms identity delay, 700 ms history delay and 350 ms HTTP image delay. These are not production speedup measurements.

| Stage | Warm Hall entry | Fresh cold direct entry |
|---|---:|---:|
| Shell | 81.5–96.2 | 389.9–433.1 |
| Identity | 81.5–96.2 | 1213.8–1246.5 |
| Portrait | 81.5–96.2 | 1564.1–1601.3 |
| Core loaded | 895.2–923.3 | 1213.8–1246.5 |
| Timeline loaded | 1612.4–1624.6 | 1915.4–1963.8 |
| Poster loaded | 1961.7–1989.6 | 2282.4–2314.3 |

The main behavior matrix preceded the final geometry-only corrections; the six-case final geometry run tested the final source. Existing PASS50 retained-Hall behavior was additionally checked in the focused recovery case, rather than rerunning its broad matrix.

## Evidence

- [Readiness matrix](readiness-matrix.json): raw frames, stage timings and request counts.
- [Final geometry](final-geometry.json): final six-case raw frame evidence.
- [Failure and switch](remaining-failure-switch.json), [portrait failure](failure-switch.json).
- [Recovery and nonzero scroll](recovery-scroll.json).
- [Live attempt](live-412.json).
- Final viewport captures: [360](final-360.jpg), [412](final-412.jpg), [1920](final-1920.jpg).

## Limits

The unintercepted live 412 Hall search did not yield Aaron within 20 seconds. Fresh cold live entry rendered its shell at 443.4 ms but reached unavailable/error around 20.46 seconds without ready identity or timeline. The raw live timing field named core records busy becoming false on error; it is NOT a successful core-ready time. No new successful live comparison to PASS51 is claimed, and the response failure cause was not established. Fixture event history was minimal and did not revalidate unchanged win calculations. Optional image hang checks establish nonblocking behavior during the observation window, not eventual host recovery. Physical Galaxy S25 and final human visual review remain pending. No application, test or harness files were edited by QA.
