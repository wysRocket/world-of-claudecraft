# Phase 1 QA: Verify Sim Bank Core

Audit the Phase 1 implementation for correctness, decisive tests, dead code,
determinism, and i18n completeness before any other phase builds on it.

### QA Starter Prompt
```
This is Phase 1 QA of the Bank System feature: Verify Sim Bank Core.

Model: Opus 4.8, xhigh effort. Harness: Claude Code.
ULTRACODE: optionally add `ultracode` to run an adversarial-verify Workflow (each
finding independently confirmed by a skeptic agent before it counts).

Goal: audit Phase 1 (src/sim/bank.ts, character state, rules, tests, i18n) for
correctness, missing tests, dead code, determinism, and i18n completeness.

STEP 0 - PRE-FLIGHT:
- Verify `git status` is clean on feature/bank-system (Phase 1 committed). If dirty, ask.
- Memory scan: bank-system-design-research; constant-self-comparison test pins entry.

STEP 1 - LOAD CONTEXT (via an Explore agent, not directly):
- docs/bank-system/state.md, progress.md, phase-01-sim-bank-core.md (what was promised)
- The Phase 1 diff (git diff against the phase-start commit; list every file)
- CLAUDE.md (root) + src/sim/CLAUDE.md + tests/CLAUDE.md
Return: deliverables list, files changed, acceptance criteria, known issues.

STEP 2 - QA AUDIT (parallel agents; prompt each for COVERAGE not filtering):

Correctness agent:
- Every Phase 1 deliverable actually implemented; every acceptance criterion met.
- Every locked rule from state.md decision 10 enforced with the exact behavior (quest
  deny, instance no-merge, fitsAll both directions, refusals move nothing and charge
  nothing, non-refundable purchases, overflow guard, no copper storage).
- Offline Sim behavior is self-consistent tick to tick; edge cases: empty bank, full
  bank, full bags, count larger than stack, slot index out of range, zero and negative
  counts, instanced slot at every boundary.

Test coverage agent (test the tests):
- The conservation sweep is non-vacuous and DECISIVE: plant a deliberate conservation
  bug (temporary local mutation) and confirm the sweep fails; revert.
- No constant-self-comparison pins (assert literals, not the exported constant against
  itself); the price table and BANK_BASE_SLOTS pinned as literals.
- Refusal assertions cover BOTH directions (deposit and withdraw) per rule.
- Determinism test actually exercises bank ops in its action script.
- Persistence: round-trip, legacy-missing-field, tampered-save each present and green.

Dead code and cleanup agent:
- No unused imports/types/helpers; no commented-out code; no TODOs left unresolved.
- src/sim/ import invariant holds; bank.ts draws no rng; naming matches repo idiom.
- sim.ts got only thin delegates, no logic.

Multi-agent review dispatch (Phase 1 touched src/sim/ and the persisted shape):
- architecture-reviewer: yes (sim). migration-safety: yes (characters.state shape).
- cross-platform-sync: no (no IWorld/wire yet). privacy-security-review: no (no server).
- qa-checklist: yes (phase-completion gate).
Resume any truncating agent with: "Stop reading more files. Output the full report now.
No more tool calls. Format: BLOCKING / SHOULD-FIX / NICE-TO-HAVE / VERDICT."

STEP 3 - FIX: apply all BLOCKING and SHOULD-FIX items. Re-run: npx tsc --noEmit;
npx vitest run tests/bank.test.ts tests/architecture.test.ts tests/parity
tests/persistence_round_trip.test.ts tests/character_state_backcompat.test.ts;
npm run i18n:gen then npx vitest run tests/localization_fixes.test.ts;
npm run ci:changed. Commit fixes with explicit paths.

STEP 4 - UPDATE DOCS + MEMORY: progress.md (Phase 1 QA complete + notes), state.md
(drift found), memory (surprising rules).

STEP 5 - PACKET TEARDOWN: skip (not the final phase).

STEP 6 - FINAL RESPONSE FORMAT:
QA verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts of BLOCKING/SHOULD-FIX/
NICE-TO-HAVE found and fixed, deferred items, handoff: run
docs/bank-system/phase-02-banker-npcs.md in a fresh session.

STOPPING RULES:
- Stop and surface if any BLOCKING item cannot be fixed without changing phase scope.
- Stop if the planted-bug check reveals the conservation sweep cannot fail.
```
