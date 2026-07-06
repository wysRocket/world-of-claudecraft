# Phase 7: Mobile, A11y, and Polish

The bank on touch devices: the 50/50 companion split, safe areas, tap targets, the
focus/inert contract end to end, and the i18n polish sweep.

### Starter Prompt
```
This is Phase 7 of the Bank System feature: Mobile, A11y, and Polish.

Model: Opus 4.8, xhigh effort. Harness: Claude Code.
ULTRACODE: not batch-heavy; a small fan-out plus a verification pass suffices.

Goal: make the bank window fully usable and comfortable on mobile-touch, verify the
focus and a11y contracts on every path, and sweep the i18n surface.

STEP 0 - PRE-FLIGHT: `git status` clean on feature/bank-system; Phases 1 to 6 plus QA
complete. Memory scan: bank-system-design-research; mobile-orientation entry (in-game
web mobile is landscape-only); puppeteer viewport fit-scale trap (use raw CDP
setDeviceMetricsOverride for size changes); window-shell coordinate model.

STEP 1 - LOAD CONTEXT (via an Explore agent):
- docs/bank-system/state.md, progress.md, this file
- src/styles/hud.mobile.css: the vendor-open pairing rules (bank docking mirrors them;
  the verified geometry is a LEFT/RIGHT split at 50vw under the pairing class, with the
  standalone 58vh cap overridden inside the pairing) and the #bags full-screen
  safe-area block
- src/ui/hud.ts mobile close backstop for the vendor cluster (closing the companion
  also closes bags and clears inert)
- src/ui/touch_peek.ts (950 ms long-press tooltip peek, release-click suppression)
- src/ui/CLAUDE.md (tap target floors, 16px inputs, focus rules) +
  src/styles/CLAUDE.md (layer order)
- scripts/ mobile screenshot family (mobile_visual.mjs and siblings)
- The Phase 5 and 6 output files (bank_view, bank_window, CSS added so far)
Return: the exact pairing CSS recipe, the mobile backstop pattern, and which screenshot
script fits a banker walk-up.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE (two agents in parallel):

Agent A (CSS + touch) deliverables:
- hud.mobile.css: under body.mobile-touch with the bank-open pairing, bank and bags
  split LEFT/RIGHT at 50vw (mirror the vendor-open pairing exactly, including the
  max-height override); standalone bank full-screen fixed with safe-area insets and a
  pan-y overscroll-contained grid; tap targets at least 40x40 (24x24 absolute floor,
  never weaken); inputs at least 16px.
- Touch behavior: long-press tooltip peek on bank cells whose release click must NOT
  fire the withdraw (TouchPeekGuard); the mobile close backstop (closing the bank on
  mobile also closes bags and clears inert).

Agent B (a11y + i18n + verification) deliverables:
- Focus/a11y verification end to end: no Tab trap on the non-modal cluster; the
  buy-slots and partial-count prompts own their Tab cycles; inert cleared on EVERY
  teardown path including keybind force-close under an open prompt; aria labels and
  roles from t() keys; a keyboard-only walkthrough (open via interact key, navigate,
  withdraw, buy, close) works.
- i18n polish sweep: every hudChrome.bank.* and sim bank string reviewed; M16
  zh/zh_TW/ja/ko/ru fills for any wordy value Phases 5 and 6 missed; money and numbers
  through the formatters everywhere.
- Run a mobile screenshot script against a phone viewport (npm run dev running;
  landscape in-game) plus a tablet width; fix findings; attach the screenshot paths to
  the final report.

INVARIANTS THIS PHASE MUST KEEP:
- Tap target floors and the 16px input rule are hard floors.
- Graphics fairness: nothing bank-related may shed actionable information on any tier.
- Layer order beats specificity in the styles system; new rules go in the right layer.

Out of scope: new features of any kind; sim/server/wire changes.

STEP 3 - VALIDATION + MULTI-AGENT REVIEW:
- Run: npx tsc --noEmit; npx vitest run tests/bank_view.test.ts
  tests/bank_window.test.ts tests/architecture.test.ts; npm run i18n:gen then
  npx vitest run tests/localization_fixes.test.ts tests/i18n_completeness.test.ts;
  npm run ci:changed; the mobile screenshot script at 360px-wide-equivalent and tablet.
- Spawn ONLY: qa-checklist. COVERAGE prompt; truncation resume.

STEP 4 - COMMIT CADENCE (explicit paths):
- feat(ui): mobile bank layout and touch behavior
- fix(ui): bank focus and inert contract on all teardown paths
- chore(i18n): bank M16 fills and formatter sweep

STEP 5 - ACCEPTANCE CRITERIA:
- [ ] 50/50 pairing and standalone full-screen verified by screenshots at phone and
      tablet widths, safe areas respected
- [ ] All tap targets at least 40x40 at 360px-wide-equivalent viewports
- [ ] Long-press peek never fires the withdraw on release
- [ ] Keyboard-only walkthrough completes; inert cleared on every teardown path
- [ ] M16 fills present for every wordy bank string; S3 and completeness gates green

STEP 6 - DOC UPDATES + MEMORY: progress.md, state.md, memory notes.

STEP 7 - FINAL RESPONSE FORMAT: status, files, screenshot paths, validation, review
verdicts, deferrals, handoff: run docs/bank-system/phase-07-qa.md next.

STOPPING RULES:
- Stop if the 50/50 split cannot keep 40x40 targets at a 360px-wide viewport; escalate
  the layout decision (stacked or paged alternative) rather than shrinking targets.
```
