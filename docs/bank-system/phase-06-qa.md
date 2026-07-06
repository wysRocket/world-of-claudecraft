# Phase 6 QA: Verify Deposit UX and Bank Search

Audit the deposit chain insertion (the highest-risk UI change in the packet), the
filter core, and deposit-all edge cases.

### QA Starter Prompt
```
This is Phase 6 QA of the Bank System feature: Verify Deposit UX and Bank Search.

Model: Opus 4.8, xhigh effort. Harness: Claude Code.
ULTRACODE: optional, for adversarial verification of findings.

Goal: audit Phase 6 (BagMode insertion, shift-click partials, deposit-all, filter) for
chain regressions, rule violations, and missing tests.

STEP 0 - PRE-FLIGHT: `git status` clean on feature/bank-system; Phase 6 committed.
Memory scan: bank-system-design-research (BagMode three-place change).

STEP 1 - LOAD CONTEXT (via an Explore agent): docs/bank-system/state.md, progress.md,
phase-06-deposit-search.md, the Phase 6 diff, src/ui/CLAUDE.md. Return deliverables,
files, criteria.

STEP 2 - QA AUDIT (parallel agents, COVERAGE not filtering):

Correctness agent:
- The three-place change is complete: BagMode, bagItemAction, bagTooltipHintKey, plus
  the deps flag; grep for the new mode across all four sites.
- EVERY pre-existing mode still behaves identically (the regression pin passes and is
  itself decisive: it pins the priority ORDER, not just membership).
- With the bank window closed, clicks behave exactly as before (no mode leakage).
- Deposit-all respects the locked rules: quest-kind untouched, instanced slots moved
  whole, stops cleanly at capacity with one summary toast, never destroys or splits
  wrongly.
- Search matches on the LOCALIZED name; switching language re-filters correctly.

Test coverage agent:
- The mode matrix covers every combination that can be simultaneously true (trade open
  plus bank open, vendor plus bank, etc.) and asserts which one wins.
- Filter tolerant-parse test feeds actual garbage (truncated JSON, wrong types).
- Deposit-all tests include the bank-fills-mid-run partial completion path.

Dead code and cleanup agent:
- No duplicated filter logic between bags and bank (the state.md decision was recorded
  and followed); unused keys and dead branches removed.

Review dispatch: qa-checklist (UI-only). Standard truncation resume message.

STEP 3 - FIX all BLOCKING and SHOULD-FIX; re-run tsc, bags_view, bag_filter, bank
window suites, architecture, S3, ci:changed; commit with explicit paths.

STEP 4 - UPDATE DOCS + MEMORY: progress.md, state.md drift, memory notes.

STEP 5 - PACKET TEARDOWN: skip (not the final phase).

STEP 6 - FINAL RESPONSE FORMAT: verdict, counts found/fixed, deferrals, handoff: run
docs/bank-system/phase-07-mobile-a11y.md next.

STOPPING RULES: stop and surface if any pre-existing bag mode changed behavior; that
is a packet-level regression, not a local fix.
```
