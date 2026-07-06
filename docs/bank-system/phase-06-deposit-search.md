# Phase 6: Deposit UX and Bank Search

Click-to-deposit from bags, the deposit-all-materials button, and bank
search/category/sort.

### Starter Prompt
```
This is Phase 6 of the Bank System feature: Deposit UX and Bank Search.

Model: Opus 4.8, xhigh effort. Harness: Claude Code.
ULTRACODE: not batch-heavy; parallel Agent fan-out suffices.

Goal: wire deposits into the bags click chain, add deposit-all-materials, and give the
bank window the search/category/sort organization layer.

STEP 0 - PRE-FLIGHT: `git status` clean on feature/bank-system; Phases 1 to 5 plus QA
complete. Memory scan: bank-system-design-research (the BagMode three-place-change
gotcha is THE trap of this phase).

STEP 1 - LOAD CONTEXT (via an Explore agent):
- docs/bank-system/state.md (decision 15), progress.md, this file
- src/ui/bags_view.ts (bagItemAction mode priority chain, bagTooltipHintKey, BagMode)
- src/ui/bags_window.ts (BagsWindowDeps mode flags read per click; split-stack
  shift-click sell precedent; refreshGrid focus/caret preservation)
- src/ui/bag_filter.ts + tests/bag_filter.test.ts (categories, sorts, localStorage
  tolerant parse)
- src/ui/bank_view.ts + src/ui/bank_window.ts (Phase 5 output)
- src/ui/hud.ts ONLY the BagsWindow deps wiring region and the bank open/close hooks
- tests/bags_view.test.ts (mode chain test patterns)
- src/ui/CLAUDE.md
Return: the exact three places the new mode must land, the existing mode priorities,
and the filter core contract.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE (two agents in parallel):

Agent A (deposit mode) deliverables:
- A new bank-deposit BagMode inserted into the bags_view chain in the SAME commit as
  bagTooltipHintKey and the BagsWindowDeps flag (the three-place change; missing one
  makes clicks fall through to 'use' and consume items). Priority relative to
  trade/mailAttach/marketSell mirrors those precedents; the flag is read fresh from
  HUD state per click (bank window open).
- Click deposits the whole stack via IWorld bankDeposit; shift-click prompts for a
  partial count (the split-stack sell prompt precedent, mounted in #prompt-stack).
- FIRST, before inserting the mode: pin the EXISTING chain priorities in a test so the
  insertion cannot silently reorder them (regression pin).
- Tests: full mode-priority matrix including every existing mode, tooltip hint key per
  mode, deposit click and shift-click paths, quest-item click shows the deny toast.

Agent B (search + deposit-all) deliverables:
- Bank search/category/sort mirroring the bag_filter model: categories
  all/weapon/armor/consumable/material/quest, sorts recent/quality/name,
  case-insensitive substring on the LOCALIZED item name, persisted to localStorage
  under a bank-specific key with tolerant parse. Decide (and record in state.md):
  generalize src/ui/bag_filter.ts or add a sibling bank_filter.ts; pick the smaller,
  cleaner diff. Search input keeps focus and caret across grid-only refreshes; empty
  placeholder cells suppressed while filtering (bags precedents).
- Deposit-all-materials button in the bank window: deposits every inventory stack whose
  category resolves to material, capacity-aware (stops cleanly when the bank fills,
  one summary toast), respecting every locked deposit rule (quest-kind never; instanced
  slots deposit whole per the rules).
- Tests: filter core, tolerant parse on garbage localStorage, deposit-all edge cases
  (bank fills mid-run, zero materials, instanced material slots), focus/caret survival.

INVARIANTS THIS PHASE MUST KEEP:
- UI consumes IWorld only; refusals surface the sim's deny lines, never client-side
  invented outcomes.
- The mode chain change lands as one commit across all three places plus its tests.
- Every new string is a t() key (hudChrome.bank.* or itemUi.*); M16 fills for wordy
  values in the same change.

Out of scope: mobile CSS (Phase 7); loadout presets (out of v1); any sim/server change
(if one is needed, stop and surface instead).

STEP 3 - VALIDATION + MULTI-AGENT REVIEW:
- Run: npx tsc --noEmit; npx vitest run tests/bags_view.test.ts tests/bag_filter.test.ts
  tests/bank_view.test.ts tests/bank_window.test.ts tests/architecture.test.ts; npm run
  i18n:gen then npx vitest run tests/localization_fixes.test.ts; npm run ci:changed.
  Manual smoke: deposit by click, shift-click partial, deposit-all, search narrowing.
- Spawn ONLY: qa-checklist (UI-only). COVERAGE prompt; truncation resume.

STEP 4 - COMMIT CADENCE (explicit paths):
- test(ui): pin existing bag mode priorities
- feat(ui): bank deposit mode in the bags click chain
- feat(ui): bank search, category, sort, and deposit-all-materials

STEP 5 - ACCEPTANCE CRITERIA:
- [ ] Existing-mode regression pin landed BEFORE the insertion and still passes
- [ ] All three places changed together; the full priority matrix test is green
- [ ] Deposit, shift-click partial, and deposit-all work in the smoke test
- [ ] Search keeps focus and caret; filter persists and survives garbage localStorage
- [ ] state.md records the filter-core decision (generalized vs sibling)

STEP 6 - DOC UPDATES + MEMORY: progress.md, state.md, memory notes.

STEP 7 - FINAL RESPONSE FORMAT: status, files, validation, review verdicts, deferrals,
handoff: run docs/bank-system/phase-06-qa.md next.

STOPPING RULES:
- Stop if the mode chain cannot be extended without changing an existing mode's
  behavior (the regression pin failing is the signal).
- Stop if deposit-all would need a new sim command (batching stays client-side over the
  existing command; if that is too chatty, surface the tradeoff instead of inventing
  protocol).
```
