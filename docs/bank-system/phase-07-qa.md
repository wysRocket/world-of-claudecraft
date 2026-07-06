# Phase 7 QA: Verify Mobile, A11y, and Polish

Audit the mobile layout, touch behavior, focus contract, and i18n sweep with real
screenshots, not assertions.

### QA Starter Prompt
```
This is Phase 7 QA of the Bank System feature: Verify Mobile, A11y, and Polish.

Model: Opus 4.8, xhigh effort. Harness: Claude Code.
ULTRACODE: optional, for adversarial verification of findings.

Goal: audit Phase 7 (mobile CSS, touch behavior, focus/a11y, i18n polish) against the
contracts, with screenshot evidence.

STEP 0 - PRE-FLIGHT: `git status` clean on feature/bank-system; Phase 7 committed.
Memory scan: bank-system-design-research; puppeteer viewport trap.

STEP 1 - LOAD CONTEXT (via an Explore agent): docs/bank-system/state.md, progress.md,
phase-07-mobile-a11y.md, the Phase 7 diff, src/ui/CLAUDE.md + src/styles/CLAUDE.md.
Return deliverables, files, criteria, and the screenshot paths Phase 7 produced.

STEP 2 - QA AUDIT (parallel agents, COVERAGE not filtering):

Correctness agent:
- Re-run the mobile screenshot script yourself at a phone width and a tablet width
  (raw CDP setDeviceMetricsOverride; landscape in-game): verify the 50/50 pairing, the
  standalone full-screen with safe areas, and measure tap targets in the DOM (at least
  40x40).
- Long-press peek suppression: the release click after a 950 ms peek must not withdraw.
- Keyboard-only walkthrough; inert cleared on every teardown path including keybind
  force-close under an open prompt (drive it, do not read-verify).

Test coverage agent:
- M16 fills exist for every wordy hudChrome.bank.* value (run the completeness gate at
  PR tier and inspect the bank keys specifically).
- Formatter usage: no raw number or money interpolation in bank strings.

Dead code and cleanup agent:
- No orphan mobile CSS; rules land in the correct layer; no !important beyond the
  established idioms.

Review dispatch: qa-checklist. Standard truncation resume message.

STEP 3 - FIX all BLOCKING and SHOULD-FIX; re-run tsc, the bank UI suites, S3 and
completeness gates (after i18n:gen), ci:changed, and the screenshot script; commit
with explicit paths.

STEP 4 - UPDATE DOCS + MEMORY: progress.md, state.md drift, memory notes.

STEP 5 - PACKET TEARDOWN: skip (not the final phase).

STEP 6 - FINAL RESPONSE FORMAT: verdict, counts found/fixed, screenshot evidence paths,
deferrals, handoff: run docs/bank-system/phase-08-bonus-slots.md next.

STOPPING RULES: stop and surface if tap targets cannot meet the floor at phone widths;
that reopens the Phase 7 layout decision, not a local tweak.
```
