# Phase 8 QA: Verify Bonus Slots and Referral Integration

Audit the entitlement layer: qualification integrity, the cap, stamp semantics, and the
absence of any chain-state read.

### QA Starter Prompt
```
This is Phase 8 QA of the Bank System feature: Verify Bonus Slots and Referral
Integration.

Model: Opus 4.8, xhigh effort. Harness: Claude Code.
ULTRACODE: optional, for adversarial verification of findings.

Goal: audit Phase 8 (entitlement calculator, stamp-at-load, player-facing surface) for
abuse resistance, correctness, and policy compliance.

STEP 0 - PRE-FLIGHT: `git status` clean on feature/bank-system; Phase 8 committed.
Memory scan: bank-system-design-research ($WOC policy); malware-scan
credential-compare false-positive entry (if the scanner fires on token-named vars).

STEP 1 - LOAD CONTEXT (via an Explore agent): docs/bank-system/state.md, progress.md,
phase-08-bonus-slots.md, the Phase 8 diff, server/CLAUDE.md (+ server/http/CLAUDE.md
if an endpoint was added). Return deliverables, files, criteria, recorded decisions.

STEP 2 - QA AUDIT (parallel agents, COVERAGE not filtering):

Correctness agent (think like an abuser):
- Can the cap be exceeded by any sequence (link, unlink, relink; multiple characters;
  realm hopping)? The calculator is account-scoped and the cap is enforced in the
  query or the math, not the UI.
- Qualification: a level 9 referee grants nothing; level 10 grants; a referee who
  later deletes the character (decide and record what SHOULD happen; assert what does).
- Shrink path: recompute below used slots blocks deposits and destroys nothing.
- Grep the diff for balance/holder-tier/chain reads: any hit is BLOCKING.
- If an endpoint was added: RouteDef behind the registry, ownership loader mounted,
  completeness sweep green.

Test coverage agent:
- Fixtures cover every source independently and combined; the cap at exactly 5; pins
  are literals (the +2 values pinned as numbers, not read from the module).
- SQL parameterization verified for the qualification query.

Dead code and cleanup agent:
- No duplicated entitlement math between server and client; the client only displays
  the server-computed breakdown.

Review dispatch: privacy-security-review (mandatory), cross-platform-sync (state
entering the sim; wire if bankInfo grew), migration-safety only if DDL, qa-checklist.
Standard truncation resume message.

STEP 3 - FIX all BLOCKING and SHOULD-FIX; re-run tsc, build:server, the entitlement
suites, the pin suites if wire grew, S3, ci:changed; commit with explicit paths.

STEP 4 - UPDATE DOCS + MEMORY: progress.md, state.md drift, memory notes.

STEP 5 - PACKET TEARDOWN: skip (not the final phase).

STEP 6 - FINAL RESPONSE FORMAT: verdict, counts found/fixed, deferrals, handoff: run
docs/bank-system/phase-09-final-qa.md next (the packet closer).

STOPPING RULES: stop and surface if any abuse path can mint bonus slots beyond the cap;
that is a design gap, not a patch.
```
