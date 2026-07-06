# Phase 5: Bank Window (Desktop)

The desktop bank window: pure view core plus painter, opened by the banker, docked
beside bags, with withdraw and buy-slots working end to end.

### Starter Prompt
```
This is Phase 5 of the Bank System feature: Bank Window (Desktop).

Model: Opus 4.8, xhigh effort. Harness: Claude Code.
ULTRACODE: not batch-heavy; parallel Agent fan-out suffices.

Goal: land src/ui/bank_view.ts + src/ui/bank_window.ts on the pure-core + painter
recipe, wired to the bank SimEvent and the IWorldBank facet, docked beside bags, with
withdraw clicks, the capacity header, and the buy-slots confirm prompt.

STEP 0 - PRE-FLIGHT: `git status` clean on feature/bank-system; Phases 1 to 4 plus QA
complete. Memory scan: bank-system-design-research (UI gotchas: play.html shared entry,
BagMode three-place change is Phase 6, M16 wordy fills); frontend vanilla stack entry.

STEP 1 - LOAD CONTEXT (via an Explore agent):
- docs/bank-system/state.md (decision 15), progress.md, this file
- src/ui/CLAUDE.md (the authoring recipe, a11y, tokens, M16) + src/styles/CLAUDE.md
- src/ui/bags_view.ts + src/ui/bags_window.ts + tests/bags_view.test.ts +
  tests/bags_window.test.ts (the direct template: grid, quality borders, scrollTop,
  source-scan pins)
- src/ui/mailbox_view.ts + src/ui/mailbox_window.ts (event-opened window template)
- src/ui/painter_host.ts (PainterHostPresentation), src/ui/hud.ts ONLY the regions the
  agent locates for: the 'mailbox' SimEvent case, openVendor/closeVendor (the
  body-class docking cluster), the auto-close distance loop, closeAll/Esc routing, and
  the BagsWindow deps wiring
- index.html (window div declarations, #prompt-stack) and the play.html guard trap
- tests/architecture.test.ts UI_PURE_CORES region; tests/hud_perf_budget.test.ts
  classification lists
- src/ui/i18n.catalog/hud_chrome.ts (key style)
Return: the window recipe end to end, the vendor-open docking mechanics, the exact
registration points, and the bags-window test pin patterns.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE (two agents in parallel):

Agent A (view core + tests) deliverables:
- src/ui/bank_view.ts: pure DOM-free core (registered in UI_PURE_CORES; the *_view
  suffix is load-bearing for the completeness sweep): grid model from bankInfo slots
  (icon id, count badge, quality), capacity header model ("37/48" through t() with
  formatNumber), click actions (click withdraws the stack, shift-click requests a
  partial amount), a buy-slots row model exposing the next expansion price for the
  client formatMoney, empty and away-from-banker states.
- Unit tests against BOTH a Sim-shaped and a ClientWorld-shaped stub (same input, same
  output), mirroring tests/bags_view.test.ts.

Agent B (painter + Hud + CSS + i18n) deliverables:
- src/ui/bank_window.ts: thin painter composing PainterHostPresentation
  (itemIcon/moneyHtml/itemTooltip/attachTooltip), cold event-driven (innerHTML rebuild
  on bank events and language switch, scrollTop preserved), quality borders via the
  shared QUALITY_COLOR map and the --color-quality-default token, ZERO literal hex.
- Hud composition (thin hooks only): SimEvent case 'bank' opens the window; body class
  bank-open force-opens bags alongside (the vendor-open pattern) with side-by-side
  desktop CSS in src/styles/components.css; auto-close past 8 yd in the existing
  distance loop; Esc routes through closeAll/closeManagedWindow; window div in
  index.html AND every static-element wire guarded with ?. (play.html shares main.ts).
- Buy-slots confirm prompt mounted in #prompt-stack: role dialog, aria-modal, its own
  Tab cycle over FOCUSABLE_SELECTOR, Escape close, focus return, and the parent window
  inert cleared on EVERY teardown path.
- hudChrome.bank.* keys (title, capacity + capacityAria, buySlots + confirm copy, empty
  state, tooWide hints, withdraw hints); wordy values get zh/zh_TW/ja/ko/ru fills in
  this same change (M16).
- Window tests mirroring tests/bags_window.test.ts source-scan pins: zero literal hex,
  the quality token present, scrollTop preserved, no em or en dashes.

INVARIANTS THIS PHASE MUST KEEP:
- UI consumes IWorld only (bankInfo + the three methods); never a concrete world.
- The bags/vendor cluster is deliberately NON-modal: no focus trap on bank or bags;
  only the prompt traps.
- Cold window: nothing bank-related runs in the per-frame Hud.update path.
- Graphics fairness: no tier knob may hide or delay any bank information.
- Every player-visible string is a t() key; no emoji stand-ins; esc() every
  interpolation.

Out of scope: deposit mode and the BagMode chain (Phase 6); search/sort (Phase 6);
mobile CSS beyond not breaking it (Phase 7).

STEP 3 - VALIDATION + MULTI-AGENT REVIEW:
- Run: npx tsc --noEmit; npx vitest run tests/bank_view.test.ts
  tests/bank_window.test.ts tests/architecture.test.ts tests/hud_perf_budget.test.ts;
  npm run i18n:gen then npx vitest run tests/localization_fixes.test.ts
  tests/i18n_completeness.test.ts; npm run ci:changed. Manual smoke: npm run dev plus
  npm run server, walk to a banker, open, withdraw, buy a block.
- Spawn ONLY: qa-checklist (UI-only diff; if the diff strayed into sim/server/net, add
  the matching reviewer per the dispatch matrix). COVERAGE prompt; truncation resume.

STEP 4 - COMMIT CADENCE (explicit paths):
- feat(ui): bank window view core and painter
- feat(ui): banker docking, buy-slots prompt, and hud wiring
- test(ui): bank window pins and view-core coverage

STEP 5 - ACCEPTANCE CRITERIA:
- [ ] bank_view.ts registered in UI_PURE_CORES; architecture sweep green
- [ ] Window opens from the banker event, docks bags, auto-closes past 8 yd
- [ ] Withdraw and buy-slots work end to end in the smoke test (offline AND online)
- [ ] Zero literal hex; source-scan pins green; prompt focus contract verified
- [ ] All hudChrome.bank.* keys present; M16 fills for wordy values; S3 green
- [ ] play.html loads without errors (shared main.ts guard)

STEP 6 - DOC UPDATES + MEMORY: progress.md, state.md (key names, any in-phase
decisions), memory notes.

STEP 7 - FINAL RESPONSE FORMAT: status, files, validation, review verdicts, deferrals,
handoff: run docs/bank-system/phase-05-qa.md next.

STOPPING RULES:
- Stop if the window cannot open without trapping focus or going modal.
- Stop if anything bank-related would need the per-frame painter path (redesign as
  event-driven instead).
```
