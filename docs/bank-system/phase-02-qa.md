# Phase 2 QA: Verify Banker NPCs and Interaction

Audit the Phase 2 implementation: placement determinism, proximity gating, event
wiring, entity i18n, and guide freshness.

### QA Starter Prompt
```
This is Phase 2 QA of the Bank System feature: Verify Banker NPCs and Interaction.

Model: Opus 4.8, xhigh effort. Harness: Claude Code.
ULTRACODE: optional, for adversarial verification of findings.

Goal: audit Phase 2 (banker NPCs, bank SimEvent, anchor proximity, i18n, guide) for
correctness, determinism, missing tests, and dead code.

STEP 0 - PRE-FLIGHT: `git status` clean on feature/bank-system; Phase 2 committed.
Memory scan: bank-system-design-research.

STEP 1 - LOAD CONTEXT (via an Explore agent): docs/bank-system/state.md, progress.md,
phase-02-banker-npcs.md, the Phase 2 diff (git diff against the phase-start commit),
CLAUDE.md + src/sim/CLAUDE.md. Return deliverables, files, criteria, known issues.

STEP 2 - QA AUDIT (parallel agents, COVERAGE not filtering):

Correctness agent:
- NPC placement did not shift rng draw order: tests/parity goldens are byte-identical
  (run them; do not take the phase's word).
- The bank SimEvent fires exactly once per interact; dead players refused (Spirit
  Healer precedent); the anchor check passes from ANY of the three bankers and fails
  past INTERACT_RANGE + 2.
- Positions verified against the hub rosters (no overlaps); greetings and titles set;
  no "Vaultwarden" anywhere.

Test coverage agent:
- Proximity denies asserted with the EXACT English literals (not substring-loose).
- A test covers each banker, not just one (the all-three claim needs all three).
- Guide regen is pinned by tests/guide.test.ts green, not by assumption.

Dead code and cleanup agent:
- No leftover placeholder ids or unused flags; import invariant holds; content records
  match the declarative style of the surrounding zone files.

Review dispatch: architecture-reviewer (sim), cross-platform-sync (SimEvent addition),
qa-checklist. Not privacy-security-review or migration-safety (no server/DDL change).
Resume truncating agents with the standard stop-reading message.

STEP 3 - FIX all BLOCKING and SHOULD-FIX; re-run the Phase 2 validation commands
(tsc, bank + architecture + parity + guide suites, S3 with i18n:gen, ci:changed);
commit fixes with explicit paths.

STEP 4 - UPDATE DOCS + MEMORY: progress.md, state.md drift, memory notes.

STEP 5 - PACKET TEARDOWN: skip (not the final phase).

STEP 6 - FINAL RESPONSE FORMAT: verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts
found/fixed, deferrals, handoff: run docs/bank-system/phase-03-iworld-wire.md next.

STOPPING RULES: stop and surface if a BLOCKING fix would change phase scope or require
regenerating parity goldens.
```
