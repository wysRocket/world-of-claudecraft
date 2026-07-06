# Phase 5 QA: Verify Bank Window (Desktop)

Audit the window work: pure-core purity, painter contracts, docking behavior, focus
safety, and i18n coverage.

### QA Starter Prompt
```
This is Phase 5 QA of the Bank System feature: Verify Bank Window (Desktop).

Model: Opus 4.8, xhigh effort. Harness: Claude Code.
ULTRACODE: optional, for adversarial verification of findings.

Goal: audit Phase 5 (bank_view, bank_window, hud wiring, prompt, CSS, i18n) for
contract violations, missing tests, and dead code.

STEP 0 - PRE-FLIGHT: `git status` clean on feature/bank-system; Phase 5 committed.
Memory scan: bank-system-design-research; play.html shared-entry trap.

STEP 1 - LOAD CONTEXT (via an Explore agent): docs/bank-system/state.md, progress.md,
phase-05-bank-window.md, the Phase 5 diff, src/ui/CLAUDE.md + src/styles/CLAUDE.md.
Return deliverables, files, criteria.

STEP 2 - QA AUDIT (parallel agents, COVERAGE not filtering):

Correctness agent:
- bank_view.ts is in UI_PURE_CORES and imports no three/render/game/net/painter_host/
  *_painter/*_window modules (run the architecture sweep, do not read-verify only).
- The window opens from the bank SimEvent, docks bags via the body class, auto-closes
  past 8 yd, and closes on Esc through the closeAll dispatcher.
- The buy-slots prompt: focus enters, Tab cycles inside, Escape closes, focus returns,
  and the parent inert is cleared on EVERY teardown path (including window force-close
  under an open prompt).
- play.html loads clean (the shared main.ts null-element trap).
- Offline Sim and online ClientWorld both drive the window identically (IWorld only).

Test coverage agent:
- View-core tests run the SAME assertions against Sim-shaped and ClientWorld-shaped
  stubs; the source-scan pins exist (zero hex, quality token, scrollTop, no dashes).
- Capacity header, empty state, and away-from-banker state each asserted.

Dead code and cleanup agent:
- No orphan CSS selectors; no unused deps in the painter's deps object; catalog keys
  all referenced; no leftover console noise.

Review dispatch: qa-checklist (UI-only phase). Add cross-platform-sync ONLY if the
diff touched IWorld/net/sim files. Standard truncation resume message.

STEP 3 - FIX all BLOCKING and SHOULD-FIX; re-run tsc, the bank window suites,
architecture, hud_perf_budget, S3 (after i18n:gen), i18n_completeness, ci:changed;
commit with explicit paths.

STEP 4 - UPDATE DOCS + MEMORY: progress.md, state.md drift, memory notes.

STEP 5 - PACKET TEARDOWN: skip (not the final phase).

STEP 6 - FINAL RESPONSE FORMAT: verdict, counts found/fixed, deferrals, handoff: run
docs/bank-system/phase-06-deposit-search.md next.

STOPPING RULES: stop and surface if the focus/inert contract cannot be satisfied on
every teardown path without restructuring the prompt system.
```
