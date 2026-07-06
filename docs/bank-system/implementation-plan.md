# Bank System: Implementation Plan

Nine phases (eight implement + QA pairs, then a whole-feature final QA). Every phase is
its own fresh Claude Code session on Opus 4.8 at xhigh effort; each phase file is a
self-contained starter prompt (`phase-NN-*.md`), each followed by its QA session
(`phase-NN-qa.md`). Read `state.md` first in every session (via an Explore agent, not
directly). Branch: `feature/bank-system` off `release/v0.22.0`; all work lands on this
one branch.

## Phase summary

| Phase | File | Scope (one line) |
|---|---|---|
| 1 | `phase-01-sim-bank-core.md` | Sim bank module + character state + deposit/withdraw/expansion rules + persistence shape + conservation and determinism tests |
| 1 QA | `phase-01-qa.md` | Verify Phase 1 |
| 2 | `phase-02-banker-npcs.md` | Banker NPC content in all three hubs, interaction arm, `bank` SimEvent, anchor-list proximity, guide + entity i18n |
| 2 QA | `phase-02-qa.md` | Verify Phase 2 |
| 3 | `phase-03-iworld-wire.md` | IWorldBank facet, the three wire commands, dispatch validation, ClientWorld mirror, delta key, all pin bumps, wire round-trip tests |
| 3 QA | `phase-03-qa.md` | Verify Phase 3 |
| 4 | `phase-04-lease-ledger.md` | Per-character load lease, append-only `bank_ledger` DDL + writer, offline conservation audit script |
| 4 QA | `phase-04-qa.md` | Verify Phase 4 |
| 5 | `phase-05-bank-window.md` | Desktop bank window: `bank_view` pure core + painter, withdraw clicks, capacity header, buy-slots prompt, banker docking |
| 5 QA | `phase-05-qa.md` | Verify Phase 5 |
| 6 | `phase-06-deposit-search.md` | Bags deposit mode (BagMode chain), deposit-all-materials, shift-click partials, bank search/category/sort |
| 6 QA | `phase-06-qa.md` | Verify Phase 6 |
| 7 | `phase-07-mobile-a11y.md` | Mobile layout (50/50 split, safe areas, tap targets), focus/a11y contract, i18n polish + M16 fills |
| 7 QA | `phase-07-qa.md` | Verify Phase 7 |
| 8 | `phase-08-bonus-slots.md` | Server entitlement calculator (email/Discord/wallet/qualified referrals with cap), stamp-at-load, portal/UI surface |
| 8 QA | `phase-08-qa.md` | Verify Phase 8 |
| 9 | `phase-09-final-qa.md` | Whole-feature integration QA against `qa-checklist.md`; offers packet teardown |

Dependency notes: 2 depends on 1; 3 depends on 1 and 2; 5 and 6 depend on 3; 7 depends
on 5 and 6; 4 and 8 are server-side and can run any time after 1 (4 after 3 is the
scheduled order); 9 runs last.

## Team workflow (canonical; every phase follows this)

Every phase runs on Opus 4.8 at xhigh effort (1m context variant where the file load
demands it; add `ultracode` to the running prompt for batch-heavy phases so the session
can orchestrate a Workflow with adversarial verification).

1. Step 0, pre-flight: `git status` must be clean and the branch `feature/bank-system`
   (a concurrent session may share this checkout; if dirty, ask the user). Scan Claude
   Code memory (`MEMORY.md` index; the bank topic file and any matching gotcha entries).
2. Step 1, load context: spawn an Explore agent to read and summarize `state.md`,
   `progress.md`, this phase's file, and the phase-relevant source files plus root and
   sub `CLAUDE.md` files. The main loop does NOT read large docs or monoliths directly.
3. Step 2, choose orchestration and execute: lightest tool that fits. Default is
   parallel Agent fan-out by vertical slice (request fan-out explicitly; Opus 4.8 will
   not self-initiate it; cap ~5 manual agents; each agent gets ONLY the Explore summary
   plus its own files). Escalate to an `ultracode` Workflow for 10+ uniform batch tasks.
   `isolation: "worktree"` only when agents mutate overlapping files in parallel. Never
   `mode: "plan"` on teammates.
4. Step 3, validation + review dispatch: run the `state.md` validation matrix rows the
   diff touches. Then spawn ONLY the review agents whose surface the diff touches
   (`git diff --name-only` against the phase-start commit):
   `privacy-security-review` (server/, src/admin/, src/net/, deploy/secret files, SQL,
   auth), `migration-safety` (server/*_db.ts DDL or characters.state shape),
   `cross-platform-sync` (IWorld, sim behavior/SimEvent, online.ts, game.ts wire,
   sim_i18n/server_i18n matchers), `architecture-reviewer` (any src/sim/ change),
   `qa-checklist` (when the phase's deliverable set completes). Prompt each for
   COVERAGE, not filtering ("report every issue including low-severity and uncertain
   ones; ranking happens later"). Resume a truncating reviewer with: "Stop reading more
   files. Output the full report now. No more tool calls. Format: BLOCKING / SHOULD-FIX
   / NICE-TO-HAVE / VERDICT." Do not commit until no BLOCKING issues remain.
5. Step 4, docs + memory: update `progress.md` and `state.md` (new members, keys,
   decisions, deferrals); record surprising rules to memory; commit with EXPLICIT paths
   (Conventional Commits with scope; no em dashes or emojis; never `git add -A`).

Code hygiene in every phase: module-first behind existing seams (never grow sim.ts,
hud.ts, main.ts, renderer.ts); new code gets tests; determinism tests for sim changes;
delete dead code and unused imports; no generated-file hand-edits; fix bugs test-first.

Agent scaling: split when a phase spans 4+ independent concerns or 10+ deliverables;
merge when one side is trivial; agents own vertical slices (behavior + its tests), never
file-type splits; a dedicated test agent only when test work is genuinely parallel.

## Mobile, performance, deploy

- Every client phase must work with touch controls, respect safe areas, keep tap targets
  at 40x40 minimum, and be verified with a mobile screenshot script against a phone
  viewport (`npm run dev` running).
- The bank window is a cold event-driven window (innerHTML rebuild on events). Nothing
  bank-related runs per-frame; if that ever changes, the PainterHost writer + perf
  budget rules apply.
- Bank contents ride a proximity-gated info read; do not stream them to every session.
- No deploys are part of this packet; deploy is a deliberate separate step per
  `DEPLOY.md` after the PR merges.

## Packet teardown

The final QA phase (Phase 9), once everything is green, offers to delete
`docs/bank-system/` (explicit confirmation required; surface deferred follow-ups first;
`git rm -r docs/bank-system/` only, never anything else).
