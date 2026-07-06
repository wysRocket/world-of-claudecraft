# Phase 3 QA: Verify IWorld Facet and Wire Protocol

Audit the seam and wire work: pin integrity, delta-guard correctness, both-worlds
parity, and dispatch validation.

### QA Starter Prompt
```
This is Phase 3 QA of the Bank System feature: Verify IWorld Facet and Wire Protocol.

Model: Opus 4.8, xhigh effort. Harness: Claude Code.
ULTRACODE: optional, for adversarial verification of findings.

Goal: audit Phase 3 (facet, commands, dispatch, snapshot field, ClientWorld mirror,
pins) for correctness, decisive tests, and protocol safety.

STEP 0 - PRE-FLIGHT: `git status` clean on feature/bank-system; Phase 3 committed.
Memory scan: bank-system-design-research (pinned counts); constant-self-comparison pins.

STEP 1 - LOAD CONTEXT (via an Explore agent): docs/bank-system/state.md, progress.md,
phase-03-iworld-wire.md, the Phase 3 diff, CLAUDE.md + src/net/CLAUDE.md +
server/CLAUDE.md. Return deliverables, files, criteria.

STEP 2 - QA AUDIT (parallel agents, COVERAGE not filtering):

Correctness agent:
- Every pinned count matches the SOURCE (re-derive: member count, facet count, send and
  dispatch counts, delta-key count); no pinned list was loosened or reordered.
- The applySnapshot decode is delta-guarded: simulate an omitted field and confirm the
  mirror survives; confirm bankInfo goes null when leaving banker range (server side)
  without wiping other state.
- Dispatch cases validate EVERY field with typeof checks before touching the sim;
  malformed payloads are ignored, not crashed on; payload stays under the 16 KiB cap.
- HEAVY_SELF_CMDS contains all three commands (grep, do not trust the report).

Test coverage agent:
- The offline-vs-online parity test is decisive, not a constant-self-comparison: it
  drives BOTH worlds through the same action script and compares outcomes.
- Round-trip test asserts item counts and copper on both sides after each op.
- First-snapshot presence and no-op omission both asserted for the new delta key.

Dead code and cleanup agent:
- No leftover scaffolding; facet file exports only the facet; unused imports zero;
  wire token spelling matches state.md exactly everywhere (grep all three tokens).

Review dispatch: cross-platform-sync (mandatory), architecture-reviewer (sim),
privacy-security-review (dispatch), qa-checklist. Standard truncation resume message.

STEP 3 - FIX all BLOCKING and SHOULD-FIX; re-run the Phase 3 validation suite
(the four pin suites + bank + env_protocol + bandwidth + tsc + ci:changed); commit
fixes with explicit paths.

STEP 4 - UPDATE DOCS + MEMORY: progress.md, state.md drift, memory notes.

STEP 5 - PACKET TEARDOWN: skip (not the final phase).

STEP 6 - FINAL RESPONSE FORMAT: verdict, counts found/fixed, deferrals, handoff: run
docs/bank-system/phase-04-lease-ledger.md next.

STOPPING RULES: stop and surface if a fix would rename a shipped wire token (append
only, forever) or loosen a pinned list.
```
