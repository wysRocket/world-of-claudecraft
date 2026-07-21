---
name: woc-world-mechanics
description: "Redesign an existing World of ClaudeCraft zone, dungeon, or delve's room layout, hazards, or boss mechanics. Use when a change reshapes gameplay space or adds a new encounter mechanic, not just its visuals."
---

# World Mechanics

Redesign zone, dungeon, or delve room layout and mechanics: shapes, hazards,
difficulty curves, and boss behavior. This is the gameplay-layer half of world
redesign; for the static geometry/props use `woc-world-structures`, for NPC/mob
visuals use `woc-world-creatures`.

## Design authority and precedent

If the work is Emberwood-themed, `docs/superpowers/specs/2026-07-19-endlessglory-asset-redesign-design.md`
still governs how things should look once this skill has decided how they should
play. For the actual staged METHODOLOGY, read `docs/prd/drowned-litany-redesign.md`
in full: it is the one real precedent in this repo for a room/boss redesign, written
as a live status board plus a "Design summary (agreed with the user)" section plus
a coordinate spec plus per-stage implementation notes. Use its shape as a template,
not just its content.

## The staged template

A redesign of this kind spans sessions, so structure it as a resumable document with
a status table at the top (Stage / Scope / Status columns), updated as each stage
lands, so a fresh session can pick up cold from the "Resume note" left at an
interruption point:

- **Stage 0:** quick prep (a recolor, a simple visual flag) if the redesign needs one.
- **Stage 1 (sim only, no render):** room layout, hazard tiers, a written coordinate
  spec. Convention: room centered at x=0, entry at the low-z end, exit/dais at the
  high-z end. Hazards are typed shallow/deep (or the zone's own hazard-tier
  vocabulary); islands/platforms are visual-only, non-collider dressing anchors.
  **Those coordinates are room-local: every spawn or placement site must add the
  run's origin (`run.origin.x`/`run.origin.z`) before using them.** Skipping that on
  ONE site is the exact bug the precedent shipped (see the acceptance checklist).
- **Stage 2 (render):** materials, dressing, anything visual the sim doesn't own.
- **Stage 3 (mechanic):** a new boss ability or sim behavior, sized to the existing
  `SimContext` seam (see below).
- **Stage 4 (verify):** the acceptance checklist below, plus an actual in-game look.

Each stage ends at a green, committable state. That resumability is the actual point:
if a session is interrupted mid-redesign, the next one reads the status board and the
stage's "Resume note," not the whole conversation history.

## Where the behavior lives

Read `src/sim/CLAUDE.md` before touching sim code. Key facts:

- **Room layout and encounter content for a delve live in `src/sim/content/delves/`**
  (`drowned_litany.ts` is the worked example, `collapsed_reliquary.ts` the second);
  zone-level layout lives in `src/sim/content/zone*.ts`. Read the closest existing
  neighbor in full before adding a new one.
- A new self-contained mechanic (a boss ability, a room hazard tick) is a sibling
  module behind the `SimContext` seam (`src/sim/sim_context.ts`), never a new method
  cluster on the `sim.ts` coordinator. Add the callbacks it needs to `sim_context.ts`
  (append-only: never rename or repurpose an existing one) and bind them in
  `Sim.buildSimContext()`.
- Determinism: all randomness through `this.rng`/`ctx.rng`, never `Math.random`. Tick
  phase order is rng-draw-order load-bearing; don't reorder `tick()` casually.
- **Camp/spawn ordering:** append new `{ mobId, center, radius, count }` entries at
  the END of the merged `CAMPS` array in `src/sim/data.ts`. Camps spawn in array
  order, each drawing world-gen RNG, so inserting one earlier moves every later
  camp's spawn position. Never insert mid-array. Full rule:
  `src/sim/content/CLAUDE.md`.
- Every new piece of conquerable content (a dungeon, delve, raid, world boss, zone,
  or rare) authors its Book of Deeds records in the SAME change, following
  `docs/design/deeds.md`'s authoring contract. Deeds are cosmetic-only (titles,
  Renown), never power.

## Acceptance checklist

- **Author a test for the new behavior.** Root `CLAUDE.md` is explicit that a `sim/`
  change always gets one. The suites below are regression backstops; none of them
  covers a boss ability or hazard you just invented.
- `npx tsc --noEmit`.
- `npx vitest run tests/architecture.test.ts` (sim purity and determinism backstop).
- `npx vitest run tests/parity` if any rng draw site changed
  (`UPDATE_PARITY=1 npx vitest run tests/parity` to regenerate the golden trace
  deliberately, in its own reviewed commit, never as a side effect).
- `npx vitest run tests/localization_fixes.test.ts` if any player-visible string
  changed (the S3 guard: a new sim-emitted string needs a matching EXACT/RULES entry
  in `src/ui/sim_i18n.ts` in the same change).
- `npx vitest run tests/deeds_content.test.ts` if you authored deeds records.
- `npm run wiki:content` if any zone/dungeon/mob/NPC name or narrative changed, then
  `npx vitest run tests/guide.test.ts` (the wiki freshness gate).
- `npm run ci:changed` (Biome over changed files; the pre-push floor runs it anyway).
- `npm run gate` before calling the change done. Root `CLAUDE.md` requires it over an
  ad-hoc command chain like this list, and it is exit-code-safe where a piped `npm
  test` is not.
- **An actual in-game pass, not just unit tests.** The Drowned Litany redesign's own
  account: a real bug (bells spawning thousands of yards from the fight, because a
  spawn site used the room-local coordinate directly instead of adding
  `run.origin.x`, unlike every other spawn site in the delve) was found by driving the
  live encounter, not by the unit test suite. Screenshot or drive the actual redesigned
  space before calling it done.
