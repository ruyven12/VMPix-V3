# PASS 59 — Person lookup failure recovery

## Scope
Application changes: modules/wrestling.js and css/modules.css only. Added focused tests/e2e/pass59-person-recovery.spec.js. No backend, routing, Hall geometry, timeout-value, or deployment changes.

## Implementation
- Retry Record appears in the reserved portrait fallback area on authoritative identity failure. Copy explicitly distinguishes the Person lookup from independent Event History.
- Retry runs the existing identity loader only, without replacing the dossier, resetting timeline selection, or changing route/history. Pending activation ignores additional retry attempts. Keyboard focus moves to the record heading when the retry control hides.
- Each active identity request retains its AbortController and existing deduplication promise. Deactivation/person change cancels it and removes only that exact map entry. Existing route/generation/consumer guards remain in place. Aborted results cannot populate identity cache. Independent history retains its existing stale-consumer guards.
- The unchanged 20,000ms timer is installed immediately after synchronous fetch dispatch, in the same call stack. Previously it covered fetch/headers only. It now covers fetch plus response.json(), and aborts transport/body consumption on expiry. Record matching/cache adoption follow synchronous parsing under the existing ownership system.

## Focused automated QA
Command: npx playwright test tests/e2e/pass59-person-recovery.spec.js --workers=2 --reporter=line
Result: 9 passed (51.9s), Chrome, local frontend with controlled API fixtures.

412x915 normal and reduced motion:
- Cold success; request dispatched before dossier shell exists.
- Initial 503, retry 503, then keyboard/tap recovery: exactly 3 identity requests, 1 history request. Duplicate retry while pending ignored.
- Successful timeline DOM, text and selected event retained throughout identity recovery; one dossier mount, no reload.
- Hall Back preserves query and permits Forward reuse without duplicate identity requests.
- Back during pending identity aborts it and starts no stale history; Forward issues fresh lookup.
- Switch from pending Ace lookup to cached Aaron aborts Ace without changing Aaron or starting Ace history.
- No page runtime errors.

Actual wall-clock timeout checks, without changing application timeout values:
- Headers never arrive: aborted at 20,011ms; server observed connection close; timeline succeeded; inline retry recovered.
- Headers arrive, JSON body stalls: aborted at 20,012ms; server observed connection close; timeline succeeded; inline retry recovered.

412x915 and 360x800 recovery control: 44px height, contained inside reserved portrait face, no text clipping or horizontal overflow. Screenshot reviewed at 412x915. Existing action colors/focus styling reused.

## Backend correlation (read-only Render logs)
PASS 58 request: /api/wrestling/people/db?search=aaron+rourke&limit=25&page=1
Render request ID b42c39af-ee07-4b7f, timestamp 2026-09-16T13:42:10.675Z, status 499, responseTimeMS 21233.
Separate Aaron history request returned 200 (129ms). A later Aaron identity request returned 200 (1285ms).
The request reached Render's service ingress and ended with client abandonment, consistent with the failed audit session closing. This is not proof of application/database failure or successful server-side completion. No application logs were returned for 13:41:30–13:42:30 UTC; processing start/completion and the underlying delay remain unknown.

## Limits and next pass
Not deployed. No physical S25 review performed. This pass makes lookup failure recoverable; it does not resolve unexplained backend latency. History retains its existing independent request lifecycle and timeout behavior. Recommend PASS 60 scoped backend request tracing/latency diagnosis for the confirmed request path before changing timeout duration or adding caching/prewarming.
