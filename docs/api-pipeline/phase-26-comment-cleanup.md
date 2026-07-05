# Phase 26: Closeout cleanup, de-phase and de-stale the pipeline comments

This is a CLOSEOUT phase (post-25). The migration itself is done: every REST surface runs
through the in-house pipeline, the `API_DISPATCH` default is `'new'`, and the pre-merge gate is
green. What remains is hygiene. The migration was built in 25 numbered "phases" tracked in this
`docs/api-pipeline/` packet, and that development-process framing leaked into the SHIPPED CODE:
nearly every `server/http/*.ts` file opens with `(Phase N of docs/api-pipeline/)`, and dozens of
inline comments narrate the migration timeline ("Phase 8 owns the write", "the registry is EMPTY
today", "the loader runtime is a later phase"). To a reader opening the finished code, the phase
numbers are noise and several of the comments now describe a state that no longer holds. This
phase removes the phase-number framing and corrects the stale comments so the pipeline reads like
normal, finished code, WITHOUT losing any load-bearing rationale.

The `docs/api-pipeline/` PLANNING PACKET keeps its phase structure and is OUT OF SCOPE. This
phase touches CODE and CODE COMMENTS only. It is a large but purely mechanical change (about 122
files, about 640 comment lines), zero behavior change, so it stays well under the 40% context
bound if you fan it out by directory. Closeout phases run their reviewers in-phase and land
the durable record in `progress.md` and `state.md`; there is no separate `phase-26-qa.md`.

Paste the block below into a fresh Claude Code session. It is self-contained.

### Starter Prompt

````text
This is Phase 26 of the API Pipeline re-architecture: a CLOSEOUT cleanup that removes
development-process "phase" language and stale in-progress comments from the shipped pipeline
code so it reads like normal finished code.
Model: Opus 4.8, xhigh effort. Harness: Claude Code.
ULTRACODE: this is a wide mechanical sweep across about 122 files. Fan out by directory with
parallel agents (server/http core, server/http/middleware, server/*.ts domain files, tests/server
in batches, the two src/ui files) rather than editing serially. Each agent owns a file set, applies
the Master Key, and re-runs tsc + the guard tests on its own files.
Goal: drop the "(Phase N of docs/api-pipeline/)" framing and the "Phase N does X" cross-references
from code comments, rewrite the comments that describe a now-obsolete in-progress state, and sweep
the deferred oauth copy em-dashes, all with ZERO behavior change. Preserve every load-bearing
rationale; only the phase-number framing and the false "not yet / empty today" claims change.

STEP 0 - PRE-FLIGHT
- Run `git status`. The worktree is SHARED with concurrent sessions; if it is dirty with files you
  did not create, STOP and ask before staging anything. Commit only with EXPLICIT paths, never
  `git add -A`.
- Scan Claude Code memory for entries in this domain: "No em dashes or emojis", "Biome on touched
  files" (format ONLY changed files, never a whole-repo --write), "Shared-worktree commit care",
  and "Apply ALL review findings".

STEP 1 - REBUILD THE INVENTORY (do not trust a stale line list; re-grep)
Run from repo root:
```
grep -rn -E "Phase [0-9]|phase-[0-9]|docs/api-pipeline" server/http/ server/*.ts \
  tests/server/ tests/api_error_code_parity.test.ts tests/schema_wiring.test.ts \
  src/ui/api_error_i18n.ts src/ui/i18n.catalog/api_error.ts
```
That is the BUCKET A worklist (reword). Exclude every BUCKET B file (KEEP list below). Line
numbers below are hints; re-anchor on the verbatim comment text, other sessions may have shifted
lines.

STEP 2 - APPLY THE MASTER KEY (drives every mechanical reword)
Replace the phase number with the mechanism/surface it refers to; keep the rationale that follows.

| Phase | Reword it to |
|---|---|
| Phase 1 | the route-dispatch split in main.ts (`routeHttpRequest`) |
| Phase 2 | the frozen types / test fakes (FakeDb, FakeRateLimitStore, fakeCtx) |
| Phase 3 | the characterization corpus / golden fixtures / surface inventory |
| Phase 4 | the table router (`server/http/router.ts`) |
| Phase 5 | the middleware onion (`compose`) + request-context builder |
| Phase 6 | the typed schema validator (`server/http/schema.ts`) |
| Phase 7 | the error model / stable error-code catalog (RFC 9457) |
| Phase 8 | the JSON body + error middleware (withBody / withErrors, the error boundary) |
| Phase 9 | the route registry + dispatcher |
| Phase 10 | the public-read surface (leaderboard.ts) |
| Phase 11 | the auth credential surface (auth_routes.ts) |
| Phase 12 | the owner-gated character surface + BOLA `requireOwned` |
| Phase 13 | the account-portal surface (account.ts) |
| Phase 14 | the wallet / card / referral surface |
| Phase 15 | the reports + telemetry surface |
| Phase 16 | the Discord family surface |
| Phase 17 | the admin surface |
| Phase 18 | the OAuth + /internal surface |
| Phase 18b | the release-merge late-arrival families (github, desktop-login, daily-rewards) |
| Phase 19 | the two-tier rate limiter (draft-11 429 headers) |
| Phase 20 | the partitioned World Market backfill |
| Phase 21 | the top-level security-headers + Content-Type/Origin gates |
| Phase 22 | the REST error i18n / client code-matcher |
| Phase 23 | the structured logging + /metrics + access-log |
| Phase 24 | the validated config / server timeouts |
| Phase 25, the shipped flip | "the production default is 'new'" (already shipped) |
| Phase 25, the future PR | "the ladder deletion" / "when the legacy ladder is removed" |

Two canonical rewrites the maintainer named:
- `// In-house table router for the API pipeline (Phase 4 of docs/api-pipeline/).`
  -> `// In-house table router for the API request pipeline.`
- `Phase 8 owns the write` -> `the error middleware owns the write`

Two forward-looking phrasings that KEEP their rationale, only de-numbered:
- `until Phase 25` -> `until the legacy ladder is removed`
- `at the Phase 25 flag flip` / `at the Phase 25 ladder deletion` -> `at the ladder deletion`

STEP 3 - THE WORK, in three parts (A: de-phase, B: de-stale, C: copy sweep)

PART A - DE-PHASE (BUCKET A, about 122 files, about 640 lines)
A1. Header parentheticals: nearly every `server/http/*.ts`, `server/http/middleware/*.ts`, and
   migrated `server/*.ts` domain file opens with `... for the API pipeline (Phase N of
   docs/api-pipeline/).` DELETE the `(Phase N of docs/api-pipeline/)` parenthetical; keep the
   descriptive lead. Use "API request pipeline" where the bare word "pipeline" carried the phase
   ref. `Route layer, ported onto RouteDefs (Phase N of docs/api-pipeline/).` ->
   `Route layer, ported onto RouteDefs.` `-- Route table (Phase 18 of docs/api-pipeline/) --` ->
   `-- Route table --`.
A2. Inline body comments across `server/http/**`: apply the Master Key (examples: "Retry-After is
   sourced ... (Phase 19 supplies it)" -> "(the rate limiter supplies it)"; "the RFC 9457 reserved
   members (notably code, the Phase 22 ...)" -> "the code the REST i18n matcher keys on"; the
   `registry.ts` and `index.ts` MIGRATION-TIMELINE narration ("Phase 10 added ... Phase 11 added
   ...") gets REWRITTEN as a surface description, not a timeline, see Part B).
A3. `server/*.ts` domain-file inline comments: same Master Key. Heaviest files: main.ts,
   wallet.ts, discord.ts, leaderboard.ts, account.ts, auth_routes.ts, admin.ts, reports.ts,
   characters.ts, daily_rewards.ts, ratelimit_db.ts.
A4. `tests/server/**` (about 59 files besides known_deviations.ts): overwhelmingly file-header +
   inline comments of the shape "Unit coverage for the Phase N <domain> route layer" -> drop "the
   Phase N". "(RFC 9457 is Phase 22)" -> "(RFC 9457 is the client code-matcher)" or drop the aside.
   "Phase 3 golden fixture" -> "the characterization golden".
A5. `tests/server/http/known_deviations.ts` (about 130 refs), SPECIAL, see the SPLIT below.
A6. `tests/api_error_code_parity.test.ts` + `tests/schema_wiring.test.ts`: drop the header phase
   refs and the `docs/api-pipeline/phase-22-rest-i18n.md` doc pointers.
A7. `src/ui/api_error_i18n.ts` + `src/ui/i18n.catalog/api_error.ts`: COMMENTS ONLY (confirmed no
   error-code identifier, catalog value, or i18n key contains "Phase"). Reword the `//` comments.
   Do NOT touch any string value or key.

A5 SPLIT - known_deviations.ts (a ledger of intentional old-vs-new deviations):
- (a) STALE-NOW prose (about 111 lines): phases that shipped; reword to the mechanism via the
  Master Key ("Phase 8 withBody" -> "the body middleware", "Phase 4 table router returns 405" ->
  "the table router returns 405", etc.).
- (b) FORWARD prose (about 19 lines mentioning Phase 25): these describe a divergence whose SERVED
  behavior only changes when the legacy fallback arm is deleted. De-number but KEEP the rationale:
  "until Phase 25" -> "until the legacy ladder is removed"; "at the Phase 25 ladder deletion" ->
  "at the ladder deletion"; "becomes the real behavior at the Phase 25 flip" -> "becomes the real
  behavior when the legacy arm is removed".
- LANDMINE, do NOT touch: the `introducedInPhase: number | null` FIELD (about line 78), every
  `introducedInPhase: <N>` value, and the `DEVIATION_PHASE_MIN = 4` / `DEVIATION_PHASE_MAX = 25`
  constants. These are runtime DATA pinned by `known_deviations.test.ts:63-68` (every
  introducedInPhase is null or an integer in [4, 25]). Renaming the field or changing the values
  is a schema refactor, OUT OF SCOPE here. Leave the field and constants as-is; only de-number the
  surrounding prose. If the maintainer later wants the ledger's provenance field renamed out of
  "phase" vocabulary, that is a separate, test-touching task.

PART B - DE-STALE (comments that now describe an obsolete in-progress state; behavior-neutral but
they actively MISLEAD a reader into thinking the pipeline is inert). Fix these to present reality:
- `server/http/dispatch.ts` (4 sites, header + inline): the "registry is EMPTY today ... every
  request delegates ... byte-for-byte identical to today" (about :7-9), the ":58 JSDoc "empty
  today; the migration phases populate it"", the ":78 "Un-migrated path (this phase: EVERY path)"",
  and the ":141-142 "Turning its returned value into the surface envelope lands with the first
  migrated route (Phase 10); today no route is migrated"" are ALL false now. Reword to: the
  registry owns the migrated domains and runs the onion for a matched RouteDef; only unmatched
  paths (and HEAD) delegate to the retained legacy ladder. At :141-142 DROP the "return value to
  envelope lands with the first migrated route" clause, that design never shipped: `runHandler`
  (about :150-154) discards the return and migrated handlers write via `json(ctx.res, ...)` (see
  leaderboard.ts), which is the permanent mechanism, not a temporary one.
- `server/http/types.ts:62`: "Frozen now; the loader runtime is a later phase." -> the loader
  shipped; point at the live loader ("loaded and authorized by the require_owned middleware before
  the handler").
- `server/http/types.ts:171`: reqId "AsyncLocalStorage-backed in a later phase" -> the ALS carrier
  is live (`context.ts` reqIdStorage + runWithReqId/newReqId).
- `server/http/types.ts:78-79`: the publicRead doc reads as not-yet-set though it is set live.
- `server/http/registry.ts:144` "(empty until the migration phases run)" and `:153` "a no-op while
  apiRoutes is empty": apiRoutes now spreads 15 domain route arrays and the BOLA-shadow guard runs
  over real owned :id routes. Reword to reality. The `:62` apiRoutes doc block is a present-tense
  phase-by-phase changelog; rewrite it as a surface description of the aggregated domains.
- `server/http/index.ts:7`: the barrel comment describes an in-progress import consolidation that
  the migration completed; reword to describe the exported spine surface.
- `server/http/server_timeouts.ts:4` "Today NOTHING sets these: the server runs on Node's built-in
  defaults." -> false; `applyServerTimeouts` is wired at boot (main.ts). Reword to: "These EQUAL
  Node's built-in defaults, so applying them changes NO runtime behavior; codifying them as named,
  test-pinned constants catches a future Node default change or an accidental edit."

PART C - OAUTH COPY SWEEP (a deferred copy-rule violation, do it here since oauth.ts is already
being touched for Part A):
- `server/oauth.ts:490` ships a PLAYER-FACING em dash: `'Device approved -- you can return to your
  device.'` (the actual char is an em dash). Replace the em dash with a comma or period-phrasing:
  `'Device approved. You can return to your device.'` The Stop hook and pre-push floor block em
  dashes in the diff, so leaving one in a line you touch will fail the gate.
- Sweep the OTHER em dashes in the comments and consent/device HTML strings in oauth.ts (there are
  several) to commas/colons/parentheses/"to". Keep changes to punctuation only; do not reword copy.

BUCKET B - KEEP, do NOT touch (a "phase" match that is a different feature or a legit term):
- `src/sim/content/delves/drowned_litany.ts`, `src/sim/delves/drowned_litany_boss.ts`,
  `src/sim/delves/drowned_litany_rite.ts`, `src/render/delve_interiors.ts`, `tests/delves.test.ts`
  -- the Drowned Litany delve build-milestone labels ("Phase 1 (MVP skeleton)", "finale (Phase 6)")
  are a DIFFERENT feature. Out of scope.
- `scripts/reedbound_anim_check.mjs` -- animation-capture procedure steps ("Phase 1: stand at
  spell range"), not the API pipeline.
- `src/ui/i18n.locales/{zh_CN,zh_TW,ja_JP,ko_KR,ru_RU}.ts` -- each carries ONE `(..., Phase 22)`
  comment, but CLAUDE.md FORBIDS editing overlay files. It IS a this-feature ref, but leave it;
  changing it means going through the i18n regen pipeline. Flag to the maintainer if they want it
  gone, do not hand-edit the overlay.
- Any legit technical "phase": HTTP "header phase" / "request phase", the node http header-phase
  event in `server/http/server_timeouts.ts` (the timeout DOC, not the "nothing sets these" claim),
  and any "tick phase" anywhere.

SOFT string-value landmines (safe to reword and DESIRABLE for the goal, but they are string
values, not comments, so edit deliberately): about 20 `describe()`/`it()` LABEL strings carry
"Phase N" (e.g. `dispatch_default.test.ts`, `completeness.test.ts`, `ownership_coverage.test.ts`,
`parity.test.ts`, `rate_limit_copy.test.ts`, `characterization*.test.ts`, `api_error_code_parity
.test.ts:124`, `schema_wiring.test.ts:156`) plus one `throw new Error(\`Phase 18b authed route
missing ...\`)` at `ownership_coverage.test.ts:756`. No test greps a describe/it label or that
throw message, so rewording is safe; do it as part of the sweep (drop the "Phase N", keep the rest).

STEP 4 - VALIDATION
Because this changes ONLY comments and label/copy strings, the whole suite must stay green with no
fixture edits. Run from repo root:
```
npx tsc --noEmit
npx vitest run tests/server/http/known_deviations.test.ts tests/server/http/completeness.test.ts \
  tests/server/http/parity.test.ts tests/server/http/ownership_coverage.test.ts
npx vitest run tests/server tests/api_error_code_parity.test.ts tests/schema_wiring.test.ts
```
If any of the two src/ui files changed (they will, comments only), also run:
```
npx vitest run tests/localization_fixes.test.ts tests/i18n_completeness.test.ts
```
Then the full pre-merge gate (mirror CI): `npm run gate`. Format ONLY the touched files:
`npx @biomejs/biome check --write <changed-file.ts>` (NEVER a whole-repo --write).

STEP 5 - REVIEW (spawn only the reviewers whose surface this diff touches; check
`git diff --name-only` first)
- This is comments + strings only, so the highest-value review is a fresh subagent COVERAGE pass:
  did any reworded comment LOSE a load-bearing rationale, mis-describe the mechanism (wrong Master
  Key mapping), or accidentally touch a landmine (the introducedInPhase field/constants, an
  overlay file, a string value a test greps)? Have it diff every changed comment against the
  Master Key.
- cross-platform-sync ONLY if the src/ui matcher/catalog changed in a way beyond comments (it
  should not).
- qa-checklist at completion.
- Do NOT spawn architecture-reviewer (no src/sim change), migration-safety (no DDL), or
  privacy-security-review (no logic change) unless the diff grew beyond comments.
Apply ALL findings (blocking, should-fix, and nits), per the maintainer's standing rule.

STEP 6 - COMMIT CADENCE (Conventional Commits with a scope, EXPLICIT paths; split so each stays
reviewable)
- refactor(http): drop dev-phase framing from the pipeline spine comments
  (server/http/*.ts, server/http/middleware/*.ts)
- refactor(server): drop dev-phase framing from the migrated domain-file comments
  (server/*.ts)
- test(server): drop dev-phase framing from the api-pipeline test comments and labels
  (tests/server/**, tests/api_error_code_parity.test.ts, tests/schema_wiring.test.ts)
- refactor(http): correct the stale "empty registry / later phase" pipeline comments
  (server/http/dispatch.ts, types.ts, registry.ts, index.ts, server_timeouts.ts)
- fix(oauth): replace the em dashes in the device/consent copy with plain punctuation
  (server/oauth.ts)
- docs(i18n): drop dev-phase framing from the apiError catalog + matcher comments
  (src/ui/api_error_i18n.ts, src/ui/i18n.catalog/api_error.ts)

STEP 7 - ACCEPTANCE CRITERIA (verifiable)
- [ ] `grep -rn -E "Phase [0-9]|docs/api-pipeline" server/http/ server/*.ts` returns only the
      known_deviations.ts structured-data field/constants and any legit "header phase" DOC lines,
      no header parentheticals, no "Phase N does X" cross-references.
- [ ] `tests/server/http/known_deviations.ts` keeps `introducedInPhase` + `DEVIATION_PHASE_MIN/MAX`
      unchanged (the guard test stays green) but its prose is de-numbered; the forward "at the
      ladder deletion" rationale survives.
- [ ] The dispatch.ts / types.ts / registry.ts / index.ts / server_timeouts.ts stale comments now
      describe the shipped, wired pipeline (no "empty today", no "later phase", no "nothing sets
      these").
- [ ] server/oauth.ts has no em dash anywhere (comments or copy); the device page reads cleanly.
- [ ] BUCKET B untouched (delve files, reedbound script, the 5 i18n overlays).
- [ ] Full `npm run gate` green; no test FIXTURE edits (only comments/labels changed); Biome clean
      on changed files.

STEP 8 - DOC UPDATES
- Update docs/api-pipeline/progress.md: record Phase 26 done (the de-phase sweep, the stale-comment
  corrections, the oauth copy fix), and note the known_deviations.ts structured field was left as a
  deliberate landmine.
- Update docs/api-pipeline/state.md: note the shipped code no longer carries dev-phase framing.

STOPPING RULES
- STOP if a reword would change RUNTIME behavior (this phase is comments + label/copy strings
  only). If a "comment" turns out to be load-bearing (a directive a tool parses), leave it.
- STOP if you find yourself renaming `introducedInPhase` or changing `DEVIATION_PHASE_MIN/MAX`, or
  editing an `src/ui/i18n.locales/*.ts` overlay: those are out of scope, flag to the maintainer.
- STOP if the full gate reds on a FIXTURE diff (a golden/parity fixture changed): a comment sweep
  must not move a fixture; you touched a string a test pins.
- STOP if the diff grows beyond comments, label strings, and the oauth punctuation into real logic.
````
