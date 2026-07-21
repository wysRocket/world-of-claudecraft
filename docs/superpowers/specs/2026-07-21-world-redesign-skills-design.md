# World-Redesign Skills: Design Spec

**Date:** 2026-07-21

**Status:** Approved direction, ready for implementation planning

## 1. Purpose

Add three reusable skills that give a future session the tooling to redesign the game's
internal world: structures, zone/dungeon mechanics, and creature/NPC visuals. Today
nothing documents this process; the only precedent (the Drowned Litany dungeon
redesign) lives as a one-off PRD, and the actual asset pipelines (build123d CAD,
the DCC-optimize pipeline, the image-to-3D harness) have no skill pointing at them.

## 2. This is follow-on tooling, not a new visual direction

Two documents already exist in this same directory and take priority over anything
below when they conflict:

- [`2026-07-19-endlessglory-asset-redesign-design.md`](2026-07-19-endlessglory-asset-redesign-design.md)
  is the approved **Emberwood Chronicle** visual direction: palette (soot, moss, oak,
  ember, brass, parchment, smoke blue, oxblood), shape language (tapered arches, split
  rings, carved notches), and per-asset-family contracts (characters, creatures,
  settlements, terrain, props, VFX, HUD). This is the canonical answer to "what should
  it look like."
- [`../plans/2026-07-19-endlessglory-emberwood-eastbrook.md`](../plans/2026-07-19-endlessglory-emberwood-eastbrook.md)
  is the 12-task implementation plan for **Slice A (the Eastbrook identity proof)**,
  the first of four staged slices in the design doc (A: Eastbrook proof, B: character/
  combat breadth, C: world breadth, D: instanced content + long-tail UI). Its own
  closing section says explicitly: "Only after this plan passes, write separate
  implementation plans for" Slices B, C, and D.

Observed state as of this writing: Slice A looks close but not formally signed off.
Its own completion definition calls for desktop, mobile, low-tier, reduced-motion,
grayscale, and colorblind evidence under `docs/screenshots/emberwood-eastbrook/`; only
two captures exist there today (`emberwood-desktop.png`, `emberwood-preview.png`), and
several assets the plan's Task 6/7 generated (the 9 Emberwood NPC GLBs, most of the
Eastbrook building set) are present on disk and in the generated media/theme manifests
but not yet wired into `src/render/characters/manifest.ts`'s live `VISUALS`/`MOB_KEYS`/
`NPC_KEYS` tables. Five small fixes landed in this same session (Marshal Redbrook's
visual, Forest Wolf's color, the Eastbrook house texture, the Emberwood oak tint, and
removing a stray in-game UI widget) are exactly Slice-A-completion-definition work,
not part of these new skills.

**What this means for scope:** these three skills are the toolkit a future session
reaches for once Slice A is approved and someone starts drafting the Slice B/C/D plans
the Eastbrook plan calls for, or for any other ad hoc world-redesign work in the
meantime (a single zone, a single dungeon, a single creature). They do not replace the
Emberwood Chronicle doc's design authority, and a skill invocation that touches
world-facing art should read that doc's relevant asset-family contract first.

## 3. Why three skills, not one

Structures, mechanics, and creatures are genuinely different technical domains with
different tools and different existing skills to delegate to:

| Skill | Domain | Primary tool(s) |
|---|---|---|
| `woc-world-structures` | Buildings, props, terrain dressing, weapons (static, non-animated) | `$cad`/`$dxf`/`$cad-viewer` (build123d -> STEP -> GLB), `scripts/assets/build_assets.mjs` |
| `woc-world-mechanics` | Zone/dungeon room layout, hazards, boss mechanics | Direct sim editing, the staged Eastbrook/Drowned-Litany plan template |
| `woc-world-creatures` | NPC/mob visual sourcing and rigging | Free-reuse-first from `public/models/`, Blender reskin, `scripts/image_to_3d.mjs` if a provider key is available |

A future session invoking just one facet (e.g. "give this mob a new look") should not
have to load CAD or sim-mechanic content it does not need.

## 4. `woc-world-structures`

**Purpose:** static, non-animated world content: buildings, props, terrain dressing,
weapons.

**Design authority:** `2026-07-19-endlessglory-asset-redesign-design.md` section 6.3
(Settlements and architecture), 6.5 (Props, resources, tools, weapons), and 5.3/5.4
(material and color language) if the work is Emberwood-themed; read them before
picking a shape or color.

**Two real pipelines, do not reinvent either:**

1. `$cad` skill (build123d Python -> STEP -> raw GLB export) for new geometry from
   scratch. This is what generated the Eastbrook house/inn/sword/shield/anvil source
   models already in the repo (`.agents/skills/cad/scripts/generators/`).
2. `scripts/assets/build_assets.mjs <spec>.json` to optimize a raw DCC/CAD export
   (resample/prune/dedup/texture-compress via gltf-transform) from `tmp/asset_src/`
   into the shipped `public/models/...` tree. A new pack is a new spec JSON under
   `scripts/assets/specs/`, never a hardcoded path in the script itself.

**Wiring:** `src/render/props.ts`'s `PROP_ASSET_DEFS` for the asset entry,
`src/sim/content/zone*.ts`'s `buildings:`/`stalls:` arrays for placement (position,
rotation, footprint).

**The flat-fill lesson** (confirmed firsthand fixing a live bug this session): a
single-material CAD prop has exactly one color slot, so a `color:` tint alone always
reads as a flat wash. Pair it with the `texture:` field on `PropAssetDef` (added this
session) pointing at one of the existing procedural textures in
`src/render/textures.ts` (`plasterTexture`/`wallTexture`/`plankTexture`/
`thatchTexture`; `color` still multiplies over it as a hue). Default to this pairing
for any new static structure, not a color pick alone.

**Theme awareness:** check `src/visual_theme_catalog.generated.ts` for an existing
base-to-Emberwood mapping before assuming a new asset needs manual theme wiring; most
props already have one, and the mapping is regenerated by
`scripts/build_visual_theme_manifest.mjs`, never hand-edited.

## 5. `woc-world-mechanics`

**Purpose:** zone/dungeon/delve room layout and mechanic redesign.

**The staged template**, drawn from both the Eastbrook implementation plan's 12-task
structure and the Drowned Litany dungeon redesign (`docs/prd/drowned-litany-redesign.md`,
the one other real precedent in this repo): a status board tracking stage-by-stage
progress, each stage ending at a committable green state. For a zone/dungeon redesign
specifically: Stage 0 (quick prep/recolor) -> Stage 1 (sim-only: room layout, hazard
tiers, a written coordinate spec) -> Stage 2 (render: materials/dressing) -> Stage 3
(mechanic: a new boss ability or sim behavior) -> Stage 4 (verify). That resumability is
the actual point: either precedent can be picked up cold from its own doc.

**Coordinate-spec convention** to reuse: room centered at x=0, entry at low z, exit/
dais at high z, hazards typed `shallow`/`deep`, islands as visual-only non-collider
dressing.

**Points to:** `src/sim/CLAUDE.md` (the `SimContext` seam), `src/sim/content/CLAUDE.md`
(the camp/spawn array-order determinism rule: append, never insert mid-array),
`docs/design/deeds.md` (every new piece of conquerable content authors Book of Deeds
records in the same change).

**Acceptance checklist:** `tsc`, `tests/architecture.test.ts`, `tests/parity` if any
rng draw site changed, `tests/localization_fixes.test.ts` if player strings changed,
`npm run wiki:content`, and an actual in-game screenshot or live pass, not just unit
tests: the Drowned Litany redesign's own account describes a real coordinate-origin
bug (bells spawning thousands of yards off) that only surfaced that way.

## 6. `woc-world-creatures`

**Purpose:** sourcing or generating NPC and mob visuals. The one facet with no
existing skill or doc at all; grounded in the Golem's actual three-iteration history
(read directly from git, not guessed):

1. **Free reuse first.** Check `public/models/creatures/` and
   `public/models/emberwood/*/` for an already-present, unused GLB that fits before
   generating anything.
2. **Reskin an existing rigged asset** in Blender: retexture/rebuild materials on an
   existing pack member. This is what the Golem's *final*, shipped version actually
   does (OpenMMO's `orc.glb`, retextured to obsidian and amber), reusing a working rig
   and 20 animation clips for free. It beat both alternatives tried before it in the
   same session (a procedural mesh, then a concept-art billboard).
3. **True image-to-3D generation** via the real, already-built
   `scripts/image_to_3d.mjs` (Meshy, Tripo, and Rodin providers; needs an API key
   passed with `--key`; handles polling, download, and re-centering/normalizing the
   result). This is a Node script, not an MCP tool, and no provider key is connected by
   default in this environment; confirm one is actually usable before assuming it, and
   confirm cost with the user before spending credits.
4. **A procedural node-rig** (`scripts/gen_<creature>.mjs`, no skinning, hand-authored
   materials) was the Golem's *first* attempt and was superseded twice in the same
   session. Worth naming as a documented dead end, not a recommended path:
   `src/render/characters/CLAUDE.md` states the current contract is GLB-only.

**Wiring:** a `VisualDef` in `manifest.ts`'s `VISUALS`, a `MOB_KEYS`/`NPC_KEYS` line,
plus a new `ClipMap` factory if the rig's clip names do not match the existing
`kaykit()`/`mixamoClips()` factories. Don't forget `npm run wiki:stills` for the
bestiary if it's a new mob or class visual.

**Design authority:** `2026-07-19-endlessglory-asset-redesign-design.md` section 6.1
(Playable characters and NPCs) and 6.2 (Creatures and enemies) for silhouette/material-
zone/role-readability requirements.

## 7. File layout

Each skill gets both a Claude-facing entry (what I actually read and invoke) and a
Codex-parity companion, matching every existing `woc-*` skill's dual registration:

- `.claude/skills/woc-world-structures/SKILL.md`
- `.claude/skills/woc-world-mechanics/SKILL.md`
- `.claude/skills/woc-world-creatures/SKILL.md`
- `.agents/skills/woc-world-structures/agents/openai.yaml`
- `.agents/skills/woc-world-mechanics/agents/openai.yaml`
- `.agents/skills/woc-world-creatures/agents/openai.yaml`

House style, matching `woc-feature-plan`'s precedent: short and pointer-heavy,
referencing canonical instructions (the two docs above, the relevant `CLAUDE.md`
files) instead of restating them.

## 8. Out of scope

- Does not re-litigate or restate the Emberwood Chronicle visual direction; that doc
  is the design authority and stays where it is.
- Does not replace `qa-checklist` or the other end-of-contribution gates; a
  world-redesign change still goes through the normal QA gate before being called done.
  Content changes touching sim behavior (mechanics skill) also get the
  `architecture-reviewer` pass per root `CLAUDE.md`.
- Does not attempt to finish Slice A's outstanding wiring (the unwired NPC/building
  assets) as part of building these skills; that is exactly the kind of task the
  finished skills would be used *for*, once they exist.
- Does not add Meshy/Tripo/Rodin as a hard dependency; the creatures skill treats
  image-to-3D as an optional, cost-gated path behind free reuse and the reskin option.

## 9. Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-07-21 | Three separate skills (structures / mechanics / creatures) rather than one unified skill or a thin orchestrator | Each is a genuinely different technical domain with different tools; a session needing only one facet should not load the others. |
| 2026-07-21 | Both `.claude/skills/` and `.agents/skills/` registration | Matches the existing dual-registration convention every other `woc-*` skill already follows; `.agents/skills/` alone would not be discoverable by Claude's own `Skill` tool. |
| 2026-07-21 | General-purpose, not Emberwood-specific | Emberwood is the first real application, not the only one; the skills should outlive this particular visual direction. |
| 2026-07-21 | Creatures skill treats external AI generation as optional, not primary | No provider key is connected by default in this environment, and the Golem's own history shows free reuse and the Blender-reskin path both beat it in practice. |

## 10. Approval Record

The user reviewed the scope, the approach (three skills over a unified skill or thin
orchestrator), the Codex-parity file layout, and all four design sections (overview,
structures, mechanics, creatures) in conversation and approved proceeding to
implementation.
