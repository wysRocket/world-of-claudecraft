# EndlessGlory Internal Asset Redesign

**Date:** 2026-07-19

**Status:** Approved direction, ready for implementation planning

**Direction:** Emberwood Chronicle

## 1. Purpose

EndlessGlory needs an original visual identity that is recognizable from a gameplay screenshot without relying on its logo. The current experience is functionally rich, but its mix of imported stylized packs, procedural scenery, and classic fantasy HUD conventions makes the game look familiar rather than owned.

This design replaces that mixed visual language with one coherent system across characters, creatures, buildings, props, terrain, foliage, VFX, icons, and HUD chrome. The redesign must preserve the current simulation, camera, interaction density, accessibility, graphics tiers, and web performance envelope.

## 2. Approved Visual Thesis

**Emberwood Chronicle:** a firelit, handcrafted heroic fantasy where every material carries age, every class reads at a glance, and magic feels precious.

The world should feel welcoming near hearths and settlements, uncertain at their edges, and dangerous beyond them. Warmth is the signature. Darkness is used to frame light, not to obscure play.

### First three-second reaction

The player should think: "This world has history, and I want to step into it."

### Memorable visual hook

Settlements form warm islands of hand-built timber, brass, cloth, and fire inside cooler wilderness. That warm-versus-cool structure repeats from world lighting down to UI highlights and spell effects.

### Visual references

- Current gameplay baseline: [`../../design/design-language/desktop-approved-layout-reference.png`](../../design/design-language/desktop-approved-layout-reference.png)
- Approved Emberwood concept: [`assets/endlessglory-emberwood-chronicle.png`](assets/endlessglory-emberwood-chronicle.png)

The concept image is a direction target, not a literal asset sheet or final HUD layout. Implementation review should preserve its silhouette, material, warmth, and visual hierarchy while obeying the live game's interaction and performance contracts.

## 3. Goals

- Make an unbranded EndlessGlory gameplay screenshot visually identifiable.
- Replace toy-like character proportions with mature stylized heroic silhouettes.
- Give every class, creature family, biome, settlement, dungeon, and item family a clear visual grammar.
- Make imported and procedural content feel authored by one studio.
- Preserve readability at the current three-quarter MMO camera distance.
- Preserve information parity across graphics tiers and mobile layouts.
- Keep the existing content-hashed media pipeline and its asset budget gates.
- Support staged replacement without forcing a risky all-at-once asset swap.

## 4. Non-goals

- Photorealism or physically perfect materials.
- A simulation, combat, progression, camera, or content redesign.
- A darker screen at the expense of visibility.
- A wholesale rewrite of the renderer or HUD architecture.
- Shipping raw source art, unoptimized exports, or non-attributed third-party assets.
- Copying the silhouettes, motifs, UI frames, or palette of a recognizable commercial game.

## 5. Art Direction System

### 5.1 Proportions and silhouette

- Humanoid characters use approximately five-head heroic proportions.
- Hands, boots, weapons, shields, hats, and major class props remain slightly oversized for gameplay readability.
- Heads remain expressive enough for portraits but no longer dominate the body.
- Each class owns a primary massing shape:
  - Warrior: broad inverted triangle, heavy shoulder and shield weight.
  - Paladin: upright cathedral shape, bright plate planes, centered symmetry.
  - Rogue: low asymmetry, split coat tails, narrow blades, forward lean.
  - Hunter: diagonal bow and quiver rhythm, layered travel gear.
  - Mage: tall hat or mantle silhouette, open sleeves, controlled glowing focus.
  - Warlock: broken verticals, hooked shapes, ember-cracked details.
  - Priest: soft arch shapes, layered cloth, warm ivory focal areas.
  - Shaman: grounded trapezoid, totem shapes, stone and woven materials.
  - Druid: organic branching shapes that persist across humanoid and animal forms.
- Silhouette recognition must survive flat-color rendering at normal gameplay distance.

### 5.2 Shape language

The shared EndlessGlory shape vocabulary is:

- Tapered arches rather than perfect semicircles.
- Split rings and incomplete circles for magical and interface motifs.
- Carved notches and uneven hand-cut edges.
- Slight structural asymmetry with stable visual balance.
- Broad planes interrupted by a small number of deliberate detail clusters.

Perfectly smooth fantasy ornaments, uniform bevels, bubble-like forms, and decorative noise are out of direction.

### 5.3 Material language

Primary materials:

- Dark oak with visible grain direction and edge wear.
- Hammered brass with warm, restrained highlights.
- Worn leather with broad value changes rather than noisy pores.
- Mossy fieldstone and soot-darkened masonry.
- Slate roofing with cool value variation.
- Woven wool, linen, and painted canvas.
- Blackened iron used for threat, industry, and dungeon structure.

Materials use painterly value grouping. Small details are concentrated around hands, faces, interaction points, and class-defining equipment. Empty surface areas remain calm so characters and effects read clearly.

### 5.4 Color system

Core palette:

- Soot: `#171B18`, deep surfaces and framing.
- Moss: `#2F4533`, wilderness structure and calm green mass.
- Oak: `#6F4B32`, timber, leather, and grounded warmth.
- Ember: `#D1713A`, active warmth, danger, and interaction emphasis.
- Brass: `#C99A4A`, premium trim and achievement emphasis.
- Parchment: `#E7D7B8`, readable light surfaces and warm text zones.
- Smoke blue: `#607487`, distance, shadow, water, and cool counterbalance.
- Oxblood: `#743B36`, hostile cloth, elite accents, and controlled severity.

The palette is a relationship, not a texture tint. World assets must preserve material identity under biome lighting. Rarity, hostility, quest state, and team state may use semantic colors, but never color alone.

### 5.5 Lighting and atmosphere

- Settlements use warm windows, braziers, lamps, forge light, and hearths as compositional anchors.
- Wilderness moves cooler with smoke-blue ambient light, desaturated greens, and restrained fog.
- Dungeons use local pools of readable light, never uniform underexposure.
- Spell lighting is brief and localized. Permanent emissive surfaces are rare.
- Bloom supports magic and fire but must not flatten icons, nameplates, or silhouettes.
- Weather changes mood and surface response without hiding actionable information.

## 6. Asset Family Contracts

### 6.1 Playable characters and NPCs

The character system remains modular and animation-compatible. New art should prefer shared rigs and class attachment points so current locomotion, combat clips, equipment handling, portraits, and LOD behavior remain viable.

Every class set requires:

- A unique silhouette visible without color.
- Three material zones: dominant, support, and focal.
- A recognizable back view for player-controlled movement.
- A portrait-safe face and upper-body composition.
- Equipment attachment clearance for existing weapon families.
- A low-detail or proxy representation that preserves the same silhouette.

NPCs use the same anatomy and material system. Their role is communicated by tools, posture, apron or mantle shapes, and localized detail rather than exaggerated head size.

Primary integration surface: `src/render/characters/manifest.ts` and the character modules exposed through `src/render/characters/index.ts`.

### 6.2 Creatures and enemies

Creature families must feel biologically related within a region and visually distinct across combat roles.

- Melee threats carry forward mass and readable attack limbs.
- Casters carry clear focus shapes and a calm pre-cast silhouette.
- Elites add one major structural feature, not a layer of small ornaments.
- Bosses own a strong arena-scale outline and effect-safe negative spaces.
- Friendly, hostile, elite, and boss states remain redundant across silhouette, frame treatment, labels, and semantic effects.

Primary asset surfaces: `public/models/creatures`, `public/models/chars/enemies`, and the visual dispatch tables in `src/render/characters/`.

### 6.3 Settlements and architecture

Eastbrook becomes the reference kit for the entire direction.

- Structural base: fieldstone foundations and irregular dark-oak framing.
- Roofs: cool slate with occasional painted wood or canvas market accents.
- Civic identity: brass split-ring emblems and carved timber signs.
- Safe-space identity: visible warm windows and fire sources.
- Interaction identity: clearer doors, stalls, anvils, wells, quest objects, and gathering points.

Buildings should be modular enough for the existing world and editor placement systems. Repetition is disguised through roof shape, chimney placement, lean, awnings, signs, and material variants rather than unique geometry for every building.

Primary asset surfaces: `public/models/biome`, `public/models/props`, and the procedural placement modules under `src/render/`.

### 6.4 Terrain, foliage, water, and sky

Terrain follows broad painterly masses with a limited material set per biome. Microtexture must not become screen noise.

- Paths are warmer and more legible than adjacent ground.
- Traversable space is separated through value and edge rhythm, not glowing outlines.
- Foliage groups into readable clusters with deliberate gaps around roads and combat spaces.
- Trees use distinctive trunk and canopy silhouettes but share the same material logic.
- Water reflects the smoke-blue counterpalette and receives restrained warm reflections near settlements.
- Skies and HDR environments support the warm-versus-cool composition without overpowering the world.

Primary implementation surfaces: `src/render/terrain.ts`, `src/render/foliage.ts`, `src/render/textures.ts`, `src/render/water.ts`, `src/render/weather.ts`, `public/textures`, and `public/env`.

### 6.5 Props, resources, tools, and weapons

Props are designed as families, not isolated objects.

- Common props use oak, iron, rope, canvas, and ceramic.
- Valuable resources introduce small brass, gem, or polished-edge focal areas.
- Tools look used, balanced, and class-neutral.
- Weapons use strong family silhouettes and one focal material feature.
- Magical weapons reserve emissive detail for a single readable source such as a rune seam, core, edge, or gem.
- Quest objects use the split-ring motif and intentional light to stand apart without looking like UI markers dropped into the world.

Primary asset surfaces: `public/models/props`, `resources`, `tools`, `weapons`, `quest`, and the procedural VFX attachments in `src/render/weapon_vfx.ts`.

### 6.6 VFX

VFX uses shape and timing before particle quantity.

- Fire: broken upward strokes, ember flecks, warm core, smoke-dark edge.
- Frost: faceted arcs, pale center, smoke-blue body, minimal cyan.
- Nature: leaf, thorn, root, and ring fragments rather than generic green fog.
- Holy: warm ivory and brass, split rings, vertical lift.
- Shadow: oxblood and soot with controlled cool highlights, not default purple.
- Lightning: sharp branching strokes with brief high-value impact frames.

Every combat effect requires a readable start, impact, and decay. Low graphics tiers may reduce particle density, secondary lights, trails, and bloom, but not timing or actionable area information.

Primary surfaces: `public/vfx`, `src/render/weapon_vfx.ts`, spell effect modules under `src/render/`, and graphics-tier policy.

### 6.7 HUD, icons, and portraits

The HUD should feel made from the same world without pretending to be a literal physical object.

- Base surfaces use soot-black translucent fields.
- Frames use slim dark leather, blackened iron, and restrained brass corners.
- Parchment appears only where a lighter reading surface is useful.
- Corners and separators use tapered arches, split rings, and carved notches.
- Major windows may carry one asymmetrical crafted detail. Repeating widgets remain quiet.
- Ability and item icons use bold painted silhouettes with controlled backgrounds.
- Portraits use the real redesigned character models and consistent warm-neutral lighting.
- Typography remains highly readable and does not become ornamental at body sizes.

The redesign preserves the current layout contracts and input affordances unless a separate UI specification approves structural changes.

Primary surfaces: `src/styles/tokens.css`, the remaining files under `src/styles/`, `src/ui/`, and `public/ui`.

## 7. Safe Choices and Creative Risks

### Safe choices

- Keep the three-quarter camera and familiar MMO information placement.
- Preserve exaggerated weapons and clear class silhouettes at gameplay distance.
- Keep green health and clear semantic quest or threat cues, with redundant non-color signals.
- Retain warm settlement lighting as an intuitive safety cue.

### Creative risks

1. **Warmth as the signature.** Most dark-fantasy games lead with gloom. EndlessGlory leads with crafted warmth surrounded by danger. The gain is a more emotionally ownable world. The cost is disciplined lighting so warmth does not become uniformly cozy.
2. **Visible handwork.** Controlled asymmetry and carved imperfection appear across architecture, props, weapons, and UI. The gain is authorship. The cost is more art-direction review because random distortion will look broken rather than handcrafted.
3. **Restrained magic.** Emissive materials are scarce and meaningful. The gain is impact when magic appears. The cost is stronger dependency on animation, timing, and value contrast to sell non-magical abilities.

## 8. Staged Replacement Strategy

The game must not spend a long release window in a visibly half-converted state. Replacement is organized by complete player-facing slices.

### Slice A: Eastbrook identity proof

Build one complete Eastbrook gameplay loop that contains:

- The settlement architecture and prop kit.
- Representative foliage, terrain, water, sky, and lighting.
- A small but representative set of playable classes.
- Key NPC roles and early hostile creature families.
- Representative melee, magic, loot, quest, and ambient VFX.
- The always-visible HUD shell, core portraits, and a representative icon set.

The slice is successful only if a blind screenshot comparison reads as a different game while preserving navigability and information hierarchy.

### Slice B: Character and combat breadth

Extend the approved anatomy, rigs, class silhouettes, weapons, armor language, portraits, and VFX to the complete playable roster and common combat families.

### Slice C: World breadth

Convert remaining outdoor biomes, settlements, foliage families, resources, tools, quest objects, and ambient effects as complete regional sets.

### Slice D: Instanced content and long-tail UI

Convert dungeons, delves, bosses, rare props, specialized VFX, ability icons, item icons, store imagery, deeds, and secondary windows.

Each slice ships behind an explicit visual-theme gate until its world, characters, VFX, and interface are coherent together. The old and new style must never be mixed within the same player-facing release path except in developer comparison modes.

## 9. Asset Pipeline and Repository Rules

- Shipped 3D models remain optimized GLB assets compatible with the current loader and meshopt decoder.
- New models follow the category-specific guidance under `public/models/*/CLAUDE.md`.
- Render media continues through `scripts/build_media_manifest.mjs`; generated manifests are never hand-edited.
- UI art follows the existing WebP source-of-truth rules and category-specific conversion scripts.
- New art includes attribution or provenance updates in `CREDITS.md` where applicable.
- Raw DCC scenes, source packs, and unused texture sets do not ship under `public/`.
- Each replacement asset has a stable logical identifier and an explicit mapping from the current asset or content role.
- Shared rigs, materials, atlases, and geometry are preferred when they reduce runtime cost without flattening the art direction.
- Before-and-after screenshots are required for every player-facing slice on desktop and mobile.

## 10. Performance and Graphics-Tier Contract

The redesign works inside the budgets already enforced by `scripts/asset_budget.mjs` and the runtime diagnostics in `src/game/perf.ts`.

- A replacement must not increase its media budget group without an explicit measured exception.
- Character geometry and textures prioritize silhouette and face readability over hidden detail.
- Foliage uses instancing, controlled source variants, and current LOD policies.
- Texture resolution follows actual projected screen size rather than asset prestige.
- Materials reuse atlases and shared maps where it does not create visible repetition.
- Low and mobile tiers may simplify shaders, secondary geometry, particles, shadows, and environment maps.
- All tiers preserve characters, enemies, telegraphs, quest state, interaction points, and combat timing.
- Startup asset preloading remains tier-aware and must not pull high-tier variants into low-tier sessions.

## 11. Accessibility and Readability Gates

- Character and enemy silhouettes pass grayscale and flat-color checks.
- Interactive objects remain distinguishable without bloom.
- Hostile, friendly, elite, rarity, and quest states never rely on hue alone.
- UI text and essential indicators retain the existing contrast targets.
- Dark scenes are tested on low-brightness and mobile displays.
- Reduced-motion settings preserve state communication with quieter animation.
- Colorblind themes remain compatible with the redesigned semantic tokens.
- Combat telegraphs and status effects retain information parity across graphics tiers.

## 12. Visual Acceptance Tests

The direction is accepted for production only when all of the following are true:

1. An unbranded screenshot is clearly distinguishable from the current game and from the source asset packs.
2. Players can identify representative classes and enemy roles at normal gameplay zoom without reading labels.
3. Eastbrook reads as a warm safe settlement surrounded by cooler wilderness.
4. World, character, prop, VFX, icon, portrait, and HUD assets appear to belong to one system.
5. Traversable paths, interaction points, threats, and objectives remain at least as readable as the current build.
6. The slice passes desktop, mobile, low-tier, standard-tier, reduced-motion, grayscale, and colorblind review.
7. The build, asset budget, generated-manifest freshness, and relevant visual contract tests pass.
8. The deployed comparison route is verified in a real browser with before-and-after captures.

## 13. Design Review Checklist

Every asset review asks:

- Does the silhouette communicate role before texture?
- Does the asset use the Emberwood material family?
- Is detail concentrated near interaction or identity points?
- Does it contribute to warm safety, cool danger, or the transition between them?
- Does it use the shared shape language intentionally?
- Does it remain readable at gameplay distance and low graphics tier?
- Does it avoid accidental resemblance to recognizable commercial IP?
- Does it fit the current asset and runtime budget?

## 14. Risks and Mitigations

### Risk: the redesign becomes an endless asset replacement project

Mitigation: approve and ship complete player-facing slices. Eastbrook is the proof gate. No broad conversion begins until that slice passes visual and performance acceptance.

### Risk: new models break animation and equipment assumptions

Mitigation: preserve current rig, clip, attachment, portrait, and LOD contracts during the first slice. Prove a representative melee and caster path before scaling the roster.

### Risk: the game looks attractive in concept art but noisy in motion

Mitigation: judge assets at gameplay distance, in representative crowds, and under real VFX. Close-up beauty renders are supporting evidence only.

### Risk: dark materials reduce clarity

Mitigation: separate forms through value grouping, rim light, warm focal areas, silhouette, and controlled fog. Do not solve clarity with global brightness or excessive emissive effects.

### Risk: mixed-style releases weaken the new identity

Mitigation: gate conversion by coherent slice and prevent old and new theme assets from appearing together in normal player routes.

## 15. Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-07-19 | Replace chibi proportions with five-head stylized heroic proportions | Creates a visibly different and more mature silhouette while preserving MMO readability. |
| 2026-07-19 | Select Emberwood Chronicle over luminous mythic and gothic alternatives | Offers the strongest balance of ownership, warmth, danger, readability, and long-term biome flexibility. |
| 2026-07-19 | Use warmth as the signature visual risk | Gives EndlessGlory a memorable emotional identity instead of defaulting to uniform grim darkness. |
| 2026-07-19 | Begin with a complete Eastbrook identity proof | Validates the whole asset system and runtime cost before scaling production. |

## 16. Approval Record

The user delegated the final visual-direction choice to Codex and instructed it to proceed. Codex selected Emberwood Chronicle as the recommended direction and used it as the basis of this specification.
