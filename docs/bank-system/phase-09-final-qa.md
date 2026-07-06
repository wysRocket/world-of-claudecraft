# Phase 9: Final Whole-Feature QA

The packet closer: verify the entire bank system against the integration matrix in
`qa-checklist.md`, run the full gate, and offer packet teardown.

### QA Starter Prompt
```
This is Phase 9 of the Bank System feature: Final Whole-Feature QA (packet closer).

Model: Opus 4.8, xhigh effort. Harness: Claude Code.
ULTRACODE: recommended; add `ultracode` so the matrix rows can be verified by parallel
agents with adversarial confirmation of every finding.

Goal: verify the ENTIRE feature against docs/bank-system/qa-checklist.md, every row
proven by a command or a decisive test, then close the packet.

STEP 0 - PRE-FLIGHT: `git status` clean on feature/bank-system; Phases 1 to 8 and all
QA phases complete per progress.md. Memory scan: bank-system-design-research;
full-npm-test-contention entry (use npm run gate, never npm test piped through tail).

STEP 1 - LOAD CONTEXT (via an Explore agent): docs/bank-system/qa-checklist.md (the
matrix, every row), state.md (final recorded surface: members, keys, commands, tables),
progress.md (all deferred items from every phase), and the FULL feature diff summary
(git diff --stat against the packet-start commit). Return: the matrix rows, the
deferred-items list, and the touched-surface list.

STEP 2 - VERIFY THE MATRIX (parallel agents, one cluster per matrix area; every row
needs a command, a test run, or a driven behavior, never a read-only assertion):
- Three-host parity + determinism cluster: the pin suites, tests/parity byte-identical
  or deliberately regenerated with review, run()-equals-run(), offline-vs-online
  action-script parity.
- Conservation + anti-dupe cluster: the bank.test.ts sweeps (re-plant a conservation
  bug to prove the harness still has teeth, then revert), lease exclusivity, ledger
  rows per op, scripts/bank_audit.mjs on dev data.
- Persistence cluster: round-trip, back-compat, tamper, double-boot DDL.
- i18n cluster: S3 guard, completeness at PR tier, M16 fills, matcher coverage for
  every bank emit, guide freshness.
- UI cluster: architecture sweeps, window pins, focus/inert walkthrough, mobile
  screenshots at phone and tablet widths.
- Server cluster: build:server, entitlement suites, endpoint sweeps if any, no
  balance/chain reads (grep).
- Full gate: npm run gate (exit-code-safe; report the real exit code).

STEP 3 - REVIEW DISPATCH (the whole-feature pass, all surfaces were touched):
architecture-reviewer, cross-platform-sync, migration-safety, privacy-security-review,
test-coverage-auditor (pin quality and assertion decisiveness across the packet's
suites), qa-checklist (the end-of-contribution gate). COVERAGE prompts; standard
truncation resume; every BLOCKING and SHOULD-FIX fixed before the verdict.

STEP 4 - FIX + RE-RUN: apply findings, re-run the affected clusters and npm run gate,
commit fixes with explicit paths (Conventional Commits with scope).

STEP 5 - UPDATE DOCS + MEMORY: progress.md (Phase 9 complete; every deferred item
either resolved or explicitly carried into a follow-up list surfaced to the user),
state.md final state, memory (durable lessons from the packet).

STEP 6 - PACKET TEARDOWN (this IS the final phase):
All phases complete and green means: surface the deferred follow-ups FIRST, then ask
the user explicitly: "All phases are complete and green. OK to delete docs/bank-system/
(the planning scaffolding) before the PR?" On explicit confirmation only:
git rm -r docs/bank-system/ and commit "docs: remove bank-system planning scaffolding".
If declined, leave it and say so. Never delete anything else; never git add -A (a
concurrent session may share this checkout).

STEP 7 - FINAL RESPONSE FORMAT: verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts of
BLOCKING/SHOULD-FIX/NICE-TO-HAVE found and fixed across the whole pass, the deferred
follow-up list, whether the packet was removed, and the closing line: packet complete;
the branch is ready for a PR against release/v0.22.0 (or the release branch current at
the time).

STOPPING RULES:
- Stop and surface if npm run gate cannot go green without scope changes.
- Stop before regenerating any parity golden: that requires an explicit, reviewed
  UPDATE_PARITY=1 commit with justification.
- Never delete the packet without the user's explicit confirmation in this session.
```
