# Phase 28: Closeout, complete or formally defer the four attack-signal RED metrics

This is a CLOSEOUT phase (post-25). The closeout review found the observability capability shipped
narrower than the locked spec, with no recorded decision to defer the difference. The originating
spec (`source-spec.md` section 4.9, the table titled "Request layer (RED), this PR") lists SIX
request-layer metrics to ship in this effort:

1. `http_requests_total` -- SHIPPED (server/http/metrics.ts)
2. `http_request_duration_seconds` -- SHIPPED
3. `rate_limit_hits_total` (429s by policy; "auth.* spikes signal an attack") -- NOT SHIPPED
4. `auth_failures_total` (brute force) -- NOT SHIPPED
5. `bola_denied_total` (resource enumeration) -- NOT SHIPPED, exists only as a `logger.warn` in
   require_owned.ts, not a counter
6. `pg_limiter_writes_total` ("nonzero means floods reach pg, tier-1 failing") -- NOT SHIPPED as the
   named series; approximated only by an `http_requests_total{route='ratelimit.pg.hit'}` row for the
   tier-2 pg store, and it misses tier-1 in-memory 429s

The four attack-signal metrics (3 to 6) were silently narrowed out at the phase-plan level
(phase-23-logging-metrics.md acceptance list was reduced to the two core RED metrics), so the
brute-force / BOLA-enumeration / flood-reaching-pg dashboards the effort set out to enable are not
there, and the deferral is recorded nowhere durable. There is also a doc-vs-reality artifact:
`qa-checklist.md:153` asserts "`pg_limiter_writes_total` stays 0 under a tier-1 flood" -- a metric
name that never shipped -- and the source-spec still claims all six are "this PR".

These are observability niceties, not correctness or safety blockers (the flip already happened and
the pipeline is fine without them), so this is a should-fix / MEDIUM. This phase resolves it one of
two ways (maintainer picks in STEP 2): SHIP the four counters, or FORMALLY DEFER them to a named
observability follow-up and true up the stale references. Closeout phases run their reviewers
in-phase and land the durable record in `progress.md` and `state.md`; there is no separate
`phase-28-qa.md`.

Paste the block below into a fresh Claude Code session. It is self-contained.

### Starter Prompt

````text
This is Phase 28 of the API Pipeline re-architecture: a CLOSEOUT phase that either ships the four
missing "Request layer (RED), this PR" attack-signal metrics or formally defers them and trues up
the stale references.
Model: Opus 4.8, xhigh effort. Harness: Claude Code.
If SHIPPING: hand-spawn a small fan-out (one agent per emission site). If DEFERRING: docs-only,
one agent. Do not over-spawn.
Goal: close the gap between the source-spec's six-metric "this PR" RED catalog and the two shipped
metrics, and remove the stale pg_limiter_writes_total references, so the observability story is
either complete or honestly and durably deferred.

STEP 0 - PRE-FLIGHT
- Run `git status`. Shared worktree: EXPLICIT paths only, never `git add -A`; STOP if dirty with
  files you did not create.
- Scan Claude Code memory: "Apply ALL review findings", "Biome on touched files", "No em dashes",
  and (relevant if shipping) the prom-client pin note in the api-pipeline Phase 23 memory (prom-client
  is PINNED EXACT 15.1.3; do not bump it).

STEP 1 - CONFIRM THE GAP (re-verify against code)
- server/http/metrics.ts `createHttpMetrics`: confirm it creates ONLY http_requests_total and
  http_request_duration_seconds (plus collectDefaultMetrics). Grep server/ for
  `rate_limit_hits_total`, `auth_failures_total`, `bola_denied_total`, `pg_limiter_writes_total`
  (expect no dedicated counters).
- server/http/middleware/require_owned.ts: confirm the BOLA denial is a `logger.warn` only, no
  counter. server/http/middleware/rate_limit.ts and server/ratelimit_db.ts: confirm 429s and pg
  writes have no dedicated named series (only the ratelimit.pg.hit http_requests_total row).
- Read source-spec.md section 4.9 ("Request layer (RED), this PR") for the exact metric names,
  label sets, and the attack-signal rationale each is meant to serve.
- Confirm the stale references: qa-checklist.md:153 (pg_limiter_writes_total) and any source-spec
  "this PR" wording that a deferral would need to correct.

STEP 2 - CHOOSE: SHIP or DEFER (maintainer decision)
OPTION A - SHIP the four counters (recommended if the security dashboards are wanted this release):
Add each as a prom-client Counter on the SAME per-instance Registry pattern metrics.ts already uses
(labels bounded, low cardinality, ip NEVER a label):
- rate_limit_hits_total{policy, key_kind} -- incremented in the rate_limit middleware whenever a
  policy returns a 429 (both tiers). Reuse the RateLimitOutcome contract so the count is exact.
- auth_failures_total{kind} -- incremented on the authThrottled / login-failure path (kind =
  bad-credentials / throttled / etc.), server-side, never leaking the account.
- bola_denied_total{route} -- incremented alongside the existing require_owned.ts logger.warn
  (route = the :param TEMPLATE, matching the access-log convention), so BOLA-enumeration is a
  real series, not just a log line.
- pg_limiter_writes_total -- a real counter covering BOTH tiers: increment when a limiter write
  reaches pg (tier-2). Reconcile with / replace the existing http_requests_total{route=
  'ratelimit.pg.hit'} proxy so there is ONE source of truth (do not double-count). Confirm it
  reflects "tier-1 failing" the way the spec intends.
All four wired through the SAME teeMetricSink / httpMetrics injection the two shipped metrics use
(all four dispatch entries share one registry). No new dependency (prom-client already vendored,
PINNED 15.1.3, do not bump). Add HELP text and pin each metric NAME as a named constant like the
existing HTTP_REQUESTS_TOTAL / HTTP_DURATION_BUCKETS_SECONDS.

OPTION B - FORMALLY DEFER (if these are not wanted this release):
- Add a DURABLE line to state.md "## OPEN items + known gotchas" (or the deletion-exit-criteria
  "Deferred items" list): "The four attack-signal RED metrics (rate_limit_hits_total,
  auth_failures_total, bola_denied_total, pg_limiter_writes_total) from source-spec 4.9 are DEFERRED
  to a named observability follow-up; only the two request-level RED metrics shipped."
- True up the source-spec "this PR" claim (annotate 4.9 that four of the six moved to a follow-up),
  and FIX qa-checklist.md:153 (it references pg_limiter_writes_total, which never shipped) so the
  packet's own QA checklist stops naming a non-existent metric.

STEP 3 - IMPLEMENT (Option A) or WRITE THE RECORD (Option B)
Option A: implement the four counters + their emission sites + tests. Each counter needs a test
that drives its emission site and asserts the count increments with the right labels (a FakeDb /
fakeCtx handler drive for bola_denied and auth_failures; the rate-limit outcome for
rate_limit_hits; the pg-store path for pg_limiter_writes). Update the /metrics exporter test to
assert all six series are exposed. Also fix the stale qa-checklist.md:153 reference to match reality.
Option B: the durable record + the two stale-reference fixes; go to STEP 5.

STEP 4 - VALIDATION (Option A)
```
npx tsc --noEmit
npx vitest run tests/server   # metrics, rate_limit, require_owned, ratelimit_db, auth tests
npm run build:server          # confirm prom-client still bundles, no version drift
npm run gate
```
Format only touched files with biome check --write. Run the perf gate if a hot-path counter was
added on the request path:
```
PERF_GATE_WALLCLOCK=1 npx vitest run tests/server/perf_gate.test.ts
```

STEP 5 - DURABLE RECORD (BOTH options)
- Option A: state.md notes the RED catalog is now COMPLETE (six metrics shipped); qa-checklist.md:153
  now matches a real metric.
- Option B: state.md carries the deferral line; source-spec 4.9 and qa-checklist.md:153 are trued up.

STEP 6 - REVIEW
- privacy-security-review: REQUIRED (metrics on the auth / BOLA paths). Confirm NO label leaks an
  account id, ip, token, or concrete resource id (labels are policy / kind / route-template only),
  and that /metrics stays behind its METRICS_TOKEN gate.
- test-coverage-auditor (Option A): each counter's test must DECISIVELY assert the increment and
  labels, not a constant-self-comparison.
- qa-checklist at completion. Apply ALL findings.

STEP 7 - COMMIT CADENCE (EXPLICIT paths)
Option A:
- feat(http): add the four attack-signal RED metrics (rate-limit / auth-failure / bola-denied / pg-limiter)
- test(server): pin the four new RED counters and the six-series /metrics exposure
- docs(api-pipeline): record the RED metric catalog complete; fix the stale pg_limiter_writes_total ref
Option B:
- docs(api-pipeline): defer the four attack-signal RED metrics; true up the source-spec and qa-checklist

STEP 8 - ACCEPTANCE CRITERIA
- [ ] Either the four counters ship with tests and the /metrics exporter exposes all six series
      (Option A), or the deferral is recorded in a DURABLE index with the source-spec 4.9 "this PR"
      claim corrected (Option B).
- [ ] qa-checklist.md:153 no longer references a metric that does not exist.
- [ ] (Option A) no label leaks ip/account/token/resource-id; /metrics stays METRICS_TOKEN-gated;
      prom-client stays 15.1.3.
- [ ] Full gate green.

STOPPING RULES
- STOP if a proposed metric label would be high-cardinality or leak an identifier (ip, account,
  token, concrete resource id): labels are policy / kind / route-template only.
- STOP if shipping a counter would double-count against the existing ratelimit.pg.hit proxy without
  reconciling to ONE source of truth.
- STOP if prom-client would be bumped off 15.1.3 (the pinned, release-malware-audited version).
- STOP if a request-path counter regresses the perf gate.
````
