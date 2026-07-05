# Phase 27: Closeout, honor the flag-flip precondition (bound the log-only mismatch sinks)

This is a CLOSEOUT phase (post-25). The closeout review found that flipping `API_DISPATCH` to
`'new'` (Phase 25) crossed a precondition the packet had set for itself and never cleared on the
record. Phase 21 QA recorded a hard watch-item (progress.md:1190, echoed in state.md around
line 509): the two LOG-ONLY mismatch sinks that run AHEAD of the route-local rate limiters are
"un-throttled console.warn lines ... a latent log-amplification vector once `API_DISPATCH=new`;
the structured logger must sample or bound them. Watch-item: do not set `API_DISPATCH=new` in ANY
environment before those bounds land." Phase 23 shipped the structured logger and both sinks now
emit THROUGH it with the route TEMPLATE (bounded cardinality), which is why the flip is defensible,
but the logger has no sampling or throttle, so the "sampled/bounded" half of the watch-item was
never implemented, and no "watch-item cleared" note exists at the flip.

The blast radius is small: `withMetrics` already emits about one access-log line per request, and
both gates are log-only, so a crafted cross-site-Origin or wrong-Content-Type flood on an auth
route (e.g. POST /api/register) adds at most about a 2x log amplification ahead of the route
limiter, not an unbounded one. This is a should-fix, not a blocker. This phase resolves it one of
two ways (maintainer picks in STEP 2): add the promised bound, or record an explicit conscious
acceptance that supersedes the watch-item. Either way the outcome lands in the DURABLE index so
the loose end stops floating. Closeout phases run their reviewers in-phase and land the durable
record in `progress.md` and `state.md`; there is no separate `phase-27-qa.md`.

Paste the block below into a fresh Claude Code session. It is self-contained.

### Starter Prompt

````text
This is Phase 27 of the API Pipeline re-architecture: a CLOSEOUT phase that honors (or formally
retires) the pre-flip watch-item on the two log-only mismatch sinks that run ahead of the
route-local rate limiters.
Model: Opus 4.8, xhigh effort. Harness: Claude Code.
This is a small, focused change (one small bound module + its test, or a docs-only acceptance
record). Hand-spawn 1 to 2 agents; do not fan out widely.
Goal: make the flag flip to API_DISPATCH=new consistent with the self-imposed precondition, and
record the resolution durably so a future reader is not left with an unexplained crossed gate.

STEP 0 - PRE-FLIGHT
- Run `git status`. Shared worktree: commit only with EXPLICIT paths, never `git add -A`; STOP if
  it is dirty with files you did not create.
- Scan Claude Code memory: "Apply ALL review findings", "Biome on touched files", "No em dashes or
  emojis".

STEP 1 - CONFIRM THE GAP (re-verify against code; do not trust this doc's line numbers)
Have an Explore agent (or read directly) confirm, anchored on symbol names:
- server/http/middleware/origin_check.ts `defaultCrossSiteMismatchSink` and
  server/http/middleware/content_type.ts `defaultContentTypeMismatchSink`: both call `logger.warn`
  once per mismatch, unbounded.
- server/http/logger.ts: a per-line JSON writer with NO sampling / throttle / dedup.
- server/http/dispatch.ts: `withOriginCheck` and `withContentType` are mounted AHEAD of
  `route.middleware` (so they run before the route's `rateLimited` limiter).
- The two gates default to LOG-ONLY (content_type.ts `contentTypeEnforced`, origin_check.ts
  `originCheckEnforced` return false unless API_CONTENT_TYPE_ENFORCE / API_ORIGIN_CHECK_ENFORCE is
  set), so the warn fires but no request is rejected. Confirm neither enforce flag is set at boot.
- The watch-item text: grep docs/api-pipeline/progress.md and state.md for "API_DISPATCH=new" +
  "sink" / "sampled" / "watch-item". Confirm it is recorded ONLY in the Phase 21 QA record, not in
  a durable OPEN-items index.

STEP 2 - CHOOSE THE RESOLUTION (maintainer decision; both are acceptable)
OPTION A (recommended if the bound is cheap): add a per-process, fixed-cardinality throttle so a
flood cannot amplify these two dev-channel warns. Implement it as a small, host-agnostic,
UNIT-TESTED module (a token bucket or a per-(surface,reason) dedup window keyed on the route
TEMPLATE, never the concrete path, to keep cardinality O(1)), and wire it into BOTH default sinks
(and only those two sinks). Keep it a NAMED constant (e.g. MISMATCH_WARN_MAX_PER_WINDOW /
MISMATCH_WARN_WINDOW_MS), no bare literals. Determinism note: the sim is unaffected (server-only),
but if the throttle needs a clock, inject it (reuse the Phase 2 `now()` seam) so the test is
deterministic; never `Date.now()` inside the pure core.
OPTION B (if the bound is judged not worth the code): record an explicit CONSCIOUS ACCEPTANCE that
supersedes the watch-item, with the reasoning (the sinks emit the route TEMPLATE not the path, so
cardinality is already bounded; withMetrics already emits about one access line per request, so the
marginal amplification is about 2x on a crafted flood; both gates are log-only). No behavior change.

Do NOT flip API_CONTENT_TYPE_ENFORCE / API_ORIGIN_CHECK_ENFORCE here; enforcing 415/Origin is a
separate deferral gated on a native-client traffic audit (state.md), out of scope for this phase.

STEP 3 - IMPLEMENT + TEST (Option A) or WRITE THE RECORD (Option B)
Option A: the module + a Vitest that proves a flood of N mismatches on one route template emits at
most K warn lines per window (inject a fake clock, advance it, assert the count), and that two
DIFFERENT route templates are bounded independently (cardinality stays O(templates), not O(paths)).
Both default sinks call it; assert the enforce path (when a future audit flips the flag) is
unaffected (a rejected request still emits its warn subject to the same bound).
Option B: no code; go to STEP 5.

STEP 4 - VALIDATION (Option A)
```
npx tsc --noEmit
npx vitest run tests/server/http   # onion + the two middleware + the new bound test
npm run gate
```
Format only touched files with biome check --write.

STEP 5 - DURABLE RECORD (BOTH options; this is the part that stops the item floating)
- Add a line to docs/api-pipeline/state.md "## OPEN items + known gotchas" (or resolve it there):
  Option A: "The pre-flip mismatch-sink amplification watch-item (Phase 21 QA) is RESOLVED: the two
  log-only sinks are bounded by <module> (K per window per route template)." Option B: "... is
  CONSCIOUSLY ACCEPTED: template-bounded cardinality + the existing per-request access line make
  the marginal amplification about 2x on a crafted flood; not worth a bound."
- Add a one-line clearance note where the flip is documented (near the config.ts DEFAULT_DISPATCH
  doc and/or the Phase 25 record) so a reader sees the watch-item was addressed, not skipped.

STEP 6 - REVIEW
- privacy-security-review: REQUIRED (this touches the request-path logging on the production
  default). Have it confirm the bound does not DROP a security-relevant signal silently (a bounded
  sink should still surface that a flood is happening, e.g. a periodic "N suppressed" line or the
  metric), and that no raw path / header / body is logged.
- test-coverage-auditor if Option A (the flood/window test must have a DECISIVE assertion, not a
  constant-self-comparison).
- qa-checklist at completion. Apply ALL findings.

STEP 7 - COMMIT CADENCE (EXPLICIT paths)
Option A:
- feat(http): bound the two log-only mismatch sinks against flood amplification
  (server/http/mismatch_warn_throttle.ts or similar, origin_check.ts, content_type.ts, its test)
- docs(api-pipeline): record the pre-flip mismatch-sink watch-item as resolved
Option B:
- docs(api-pipeline): consciously accept the pre-flip mismatch-sink watch-item with reasoning

STEP 8 - ACCEPTANCE CRITERIA
- [ ] The Phase 21 pre-flip watch-item is either satisfied by a tested bound (Option A) or
      explicitly accepted with reasoning (Option B), and the outcome lives in a DURABLE index
      (state.md OPEN items), not only in a phase file.
- [ ] A clearance note sits where the flip is documented (config.ts / state.md) so the crossed gate
      is explained.
- [ ] (Option A) a deterministic test proves the per-template bound; no raw path/header/body logged.
- [ ] No enforce flag was flipped; no behavior change beyond the optional bound; full gate green.

STOPPING RULES
- STOP if bounding the sinks would DROP a security signal with no replacement (a flood must stay
  visible somewhere: a suppressed-count line or a metric).
- STOP if you find yourself enforcing 415/Origin (flipping the enforce flags): that is a separate,
  audit-gated deferral.
- STOP if a clock creeps into a pure core un-injected (determinism): inject the `now()` seam.
````
