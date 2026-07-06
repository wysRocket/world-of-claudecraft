# Phase 4 QA: Verify Character Lease and Bank Ledger

Audit the server safety layer: lease exclusivity under every path, ledger integrity,
DDL idempotence, and the audit script's teeth.

### QA Starter Prompt
```
This is Phase 4 QA of the Bank System feature: Verify Character Lease and Bank Ledger.

Model: Opus 4.8, xhigh effort. Harness: Claude Code.
ULTRACODE: optional, for adversarial verification of findings.

Goal: audit Phase 4 (lease, bank_ledger, audit script) for correctness under crash and
takeover paths, decisive tests, and boot safety.

STEP 0 - PRE-FLIGHT: `git status` clean on feature/bank-system; Phase 4 committed.
Memory scan: bank-system-design-research; env-empty-numeric-default-shift (audit any
new env knobs for the set-but-empty trap); first-CI-run environment mismatches.

STEP 1 - LOAD CONTEXT (via an Explore agent): docs/bank-system/state.md (the recorded
lease decision), progress.md, phase-04-lease-ledger.md, the Phase 4 diff, CLAUDE.md +
server/CLAUDE.md. Return deliverables, files, criteria.

STEP 2 - QA AUDIT (parallel agents, COVERAGE not filtering):

Correctness agent:
- Lease exclusivity: second join refused while held; takeover hands over; leave and
  shutdown release; an EXPIRED lease is reclaimable (crash recovery); different
  characters, realms, and accounts unaffected; the join error is player-facing and
  localized per the server matcher rules.
- Ledger: exactly one row per successful op; failed/refused ops write nothing; the
  writer is genuinely non-blocking (nothing in the game loop awaits it); a writer
  rejection cannot poison its queue.
- DDL: boot ensureSchema twice in a test; both passes clean; indexes exist for the
  audit script's query predicates.
- Audit script: run it on fixtures; it catches the planted anomaly and stays quiet on
  clean data.

Test coverage agent:
- Lease tests cover crash-expiry, not just the happy path; pins use literals (table
  and column names pinned as strings, not read back from the code under test).
- SQL is parameterized everywhere (grep for template-literal interpolation into query
  strings).

Dead code and cleanup agent:
- No unused columns or dead config; db access stays in db-layer modules; no new
  module-load db imports that would break partial mocks downstream.

Review dispatch: migration-safety (mandatory), privacy-security-review (mandatory),
qa-checklist. Standard truncation resume message.

STEP 3 - FIX all BLOCKING and SHOULD-FIX; re-run tsc, build:server, the lease/ledger
suites, save_character_and_market, ci:changed; commit with explicit paths.

STEP 4 - UPDATE DOCS + MEMORY: progress.md, state.md drift, memory (lease rationale).

STEP 5 - PACKET TEARDOWN: skip (not the final phase).

STEP 6 - FINAL RESPONSE FORMAT: verdict, counts found/fixed, deferrals, handoff: run
docs/bank-system/phase-05-bank-window.md next.

STOPPING RULES: stop and surface if lease correctness cannot be proven without a real
two-process integration test (propose it as a follow-up rather than faking it).
```
