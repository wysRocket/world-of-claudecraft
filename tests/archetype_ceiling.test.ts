// Empowerment ceiling composition (issue #1129/#1203/#1638 review): an archetype
// is an ADJACENT PAIR (the two majors), not a single craft (see the module
// comment on src/sim/professions/archetype.ts). This pins the reachable-ceiling
// math that makes it matter (archetypeCeilingFor/craftCeiling) plus its
// composition into crafting.ts's tier-progress multiplier, output-quality clamp,
// and combo-recipe gate.

import { describe, expect, it } from 'vitest';
import { adjacentCrafts, CRAFT_RING, oppositeCraft } from '../src/sim/content/professions';
import { archetypeCeilingFor, craftCeiling } from '../src/sim/professions/archetype';
import { meetsComboRequirement, resolveCraftForRecipe } from '../src/sim/professions/crafting';
import type { ProfessionRecipeRecord } from '../src/sim/professions/types';
import { type CraftSkills, emptyCraftSkills, tierCapability } from '../src/sim/professions/wheel';
import { Sim } from '../src/sim/sim';

const ARMOR = CRAFT_RING[0].id; // 'armorcrafting'
const PAIRED_MAJOR = adjacentCrafts(ARMOR)[0].id; // ring-adjacent to ARMOR: the second major
const COOKING = oppositeCraft(ARMOR).id; // opposite of ARMOR (the title major) -> the hobby
const OUTSIDE = CRAFT_RING.find((c) => ![ARMOR, PAIRED_MAJOR, COOKING].includes(c.id))!.id;

function skillsAt(craftId: string, skill: number): CraftSkills {
  const skills = emptyCraftSkills();
  skills[craftId] = skill;
  return skills;
}

describe('archetypeCeilingFor (#1129/#1203 empowerment ceiling, pair model)', () => {
  it('is uncapped-to-rare for every craft before any archetype has been chosen', () => {
    expect(archetypeCeilingFor(null, null, ARMOR)).toBe(2);
    expect(archetypeCeilingFor(null, null, COOKING)).toBe(2);
    expect(archetypeCeilingFor(null, null, OUTSIDE)).toBe(2);
  });

  it('is unlimited for the title-quest major itself', () => {
    expect(archetypeCeilingFor(ARMOR, PAIRED_MAJOR, ARMOR)).toBe(Infinity);
  });

  it('is unlimited for the second (ring-adjacent) major too: both majors, not just one', () => {
    expect(archetypeCeilingFor(ARMOR, PAIRED_MAJOR, PAIRED_MAJOR)).toBe(Infinity);
  });

  it('is capped at rare (tier 2) for the hobby: the opposite craft on CRAFT_RING from the title major', () => {
    expect(archetypeCeilingFor(ARMOR, PAIRED_MAJOR, COOKING)).toBe(2);
  });

  it('is capped at common (tier 0) for every craft outside the pair and the hobby once an archetype is set', () => {
    expect(archetypeCeilingFor(ARMOR, PAIRED_MAJOR, OUTSIDE)).toBe(0);
  });
});

describe('craftCeiling composes tierCapability with the archetype ceiling (min of the two)', () => {
  it('with no archetype set, a high raw skill is still clamped to the rare ceiling', () => {
    const skills = skillsAt(ARMOR, 500); // raw tierCapability would be far above 2
    expect(tierCapability(skills, ARMOR)).toBeGreaterThan(2);
    expect(craftCeiling(skills, null, null, ARMOR)).toBe(2);
  });

  it('the title major is bounded only by raw skill (archetype side is unlimited)', () => {
    const skills = skillsAt(ARMOR, 130); // tierCapability = floor(130/25) = 5
    expect(craftCeiling(skills, ARMOR, PAIRED_MAJOR, ARMOR)).toBe(5);
  });

  it('the paired (second) major is bounded only by raw skill too', () => {
    const skills = skillsAt(PAIRED_MAJOR, 130);
    expect(craftCeiling(skills, ARMOR, PAIRED_MAJOR, PAIRED_MAJOR)).toBe(5);
  });

  it('hobby craft is clamped to rare even with very high raw skill', () => {
    const skills = skillsAt(COOKING, 500);
    expect(craftCeiling(skills, ARMOR, PAIRED_MAJOR, COOKING)).toBe(2);
  });

  it('hobby craft with raw skill below the rare ceiling is bounded by the raw skill instead', () => {
    const skills = skillsAt(COOKING, 10); // tierCapability = 0
    expect(craftCeiling(skills, ARMOR, PAIRED_MAJOR, COOKING)).toBe(0);
  });

  it('a craft outside the pair and the hobby is clamped to common (0) regardless of raw skill', () => {
    const skills = skillsAt(OUTSIDE, 500);
    expect(craftCeiling(skills, ARMOR, PAIRED_MAJOR, OUTSIDE)).toBe(0);
  });
});

describe('meetsComboRequirement composes the archetype ceiling (#1132 combo gate)', () => {
  const combo: ProfessionRecipeRecord['comboRequirement'] = {
    craftA: ARMOR,
    craftB: PAIRED_MAJOR,
    minTier: 1,
  };
  const recipe = { comboRequirement: combo } as unknown as ProfessionRecipeRecord;

  it('defaults activeArchetype/pairedMajor to null (uncapped-to-rare), unchanged for existing raw-skills callers', () => {
    const skills = { ...emptyCraftSkills(), [ARMOR]: 25, [PAIRED_MAJOR]: 25 };
    // Both crafts individually reach tier 1 with no archetype context passed at all.
    expect(meetsComboRequirement(skills, recipe)).toBe(true);
  });

  it('an attuned specialist meets a minTier-1 combo over their OWN adjacent pair once both reach tier 1 (#1638 review)', () => {
    // Every COMBO_RECIPES pair in content/recipes.ts is ring-adjacent, i.e. exactly
    // the shape of a player's two majors: unlimited ceiling on BOTH sides means raw
    // skill alone (not the archetype-derived cap) decides eligibility here.
    const skills = { ...emptyCraftSkills(), [ARMOR]: 25, [PAIRED_MAJOR]: 25 };
    expect(meetsComboRequirement(skills, recipe, ARMOR, PAIRED_MAJOR)).toBe(true);
  });

  it('a craft outside the archetype pair is capped to common and fails a minTier-1 combo', () => {
    const otherCombo = { craftA: ARMOR, craftB: OUTSIDE, minTier: 1 };
    const skills = { ...emptyCraftSkills(), [ARMOR]: 25, [OUTSIDE]: 25 };
    const otherRecipe = { comboRequirement: otherCombo } as unknown as ProfessionRecipeRecord;
    expect(meetsComboRequirement(skills, otherRecipe, ARMOR, PAIRED_MAJOR)).toBe(false);
  });

  it('the hobby craft can still meet a minTier-1 (below the rare ceiling) combo requirement', () => {
    const hobbyCombo = { craftA: ARMOR, craftB: COOKING, minTier: 1 };
    const skills = { ...emptyCraftSkills(), [ARMOR]: 25, [COOKING]: 25 };
    const hobbyRecipe = { comboRequirement: hobbyCombo } as unknown as ProfessionRecipeRecord;
    expect(meetsComboRequirement(skills, hobbyRecipe, ARMOR, PAIRED_MAJOR)).toBe(true);
  });
});

describe('resolveCraftForRecipe reads the archetype-gated ceiling for skill-gain scaling', () => {
  function makeSim(seed = 42) {
    return new Sim({ seed, playerClass: 'warrior', autoEquip: false });
  }

  function metaOf(sim: Sim, pid: number) {
    return (sim as unknown as { players: Map<number, { craftSkills: CraftSkills }> }).players.get(
      pid,
    )!;
  }

  function ctxOf(sim: Sim) {
    return (sim as unknown as { ctx: Parameters<typeof resolveCraftForRecipe>[0] }).ctx;
  }

  // #1638 review, Blocking bullet 2: the ceiling must actually FREEZE progress
  // once raw skill reaches it, not just cap the momentary multiplier. Before the
  // fix, a craft capped at common (tier 0) still leveled at full speed toward
  // higher-tier recipes forever (tiersBelow went negative, which
  // tierProgressMultiplier read as "at or above capability", granting full
  // progress). The fix must treat "recipe tier above the ceiling" as frozen (0),
  // not full.
  it('a craft outside the pair and the hobby never gains skill toward an above-common recipe', () => {
    const sim = makeSim();
    const pid = sim.playerId;
    sim.acceptArchetypeQuest(ARMOR); // ARMOR + its default paired major are the two majors
    const meta = metaOf(sim, pid);
    meta.craftSkills[OUTSIDE] = 100; // raw tierCapability(OUTSIDE) = 4, but the ceiling caps it at 0

    const recipe: ProfessionRecipeRecord = {
      id: 'test_recipe_tier2_outside',
      professionId: OUTSIDE,
      resultItemId: 'bone_fragments',
      resultCount: 1,
      reagents: [],
      skillReq: 50, // recipeTier = 2
      trivialAt: 100,
      itemLevelBudget: 10,
    };
    const result = resolveCraftForRecipe(ctxOf(sim), pid, recipe);

    expect(result.ok).toBe(true);
    expect(meta.craftSkills[OUTSIDE]).toBe(100); // frozen: no progress past the common ceiling
  });

  it('a common-tier (recipeTier 0) craft still produces skill progress at the free floor even when dormant', () => {
    const sim = makeSim();
    const pid = sim.playerId;
    sim.acceptArchetypeQuest(ARMOR);
    const meta = metaOf(sim, pid);
    meta.craftSkills[OUTSIDE] = 100;

    const recipe: ProfessionRecipeRecord = {
      id: 'test_recipe_common_outside',
      professionId: OUTSIDE,
      resultItemId: 'bone_fragments',
      resultCount: 1,
      reagents: [],
      skillReq: 0, // recipeTier = 0 (common, the free floor)
      trivialAt: 25,
      itemLevelBudget: 1,
    };
    const result = resolveCraftForRecipe(ctxOf(sim), pid, recipe);

    expect(result.ok).toBe(true);
    expect(meta.craftSkills[OUTSIDE]).toBe(101); // full progress, unaffected by the ceiling
  });

  it('grants full skill progress in the title major even at very high raw skill', () => {
    const sim = makeSim();
    const pid = sim.playerId;
    sim.acceptArchetypeQuest(ARMOR);
    const meta = metaOf(sim, pid);
    meta.craftSkills[ARMOR] = 100; // tierCapability = 4; archetype ceiling is unlimited here

    const recipe: ProfessionRecipeRecord = {
      id: 'test_recipe_tier4_armor',
      professionId: ARMOR,
      resultItemId: 'bone_fragments',
      resultCount: 1,
      reagents: [],
      skillReq: 100, // recipeTier = 4, exactly at capability -> full progress
      trivialAt: 200,
      itemLevelBudget: 10,
    };
    const result = resolveCraftForRecipe(ctxOf(sim), pid, recipe);

    expect(result.ok).toBe(true);
    expect(meta.craftSkills[ARMOR]).toBe(101);
  });

  it('grants full skill progress in the SECOND (paired) major too, not just the title-quest craft', () => {
    const sim = makeSim();
    const pid = sim.playerId;
    sim.acceptArchetypeQuest(ARMOR);
    const meta = metaOf(sim, pid);
    meta.craftSkills[PAIRED_MAJOR] = 100;

    const recipe: ProfessionRecipeRecord = {
      id: 'test_recipe_tier4_paired',
      professionId: PAIRED_MAJOR,
      resultItemId: 'bone_fragments',
      resultCount: 1,
      reagents: [],
      skillReq: 100,
      trivialAt: 200,
      itemLevelBudget: 10,
    };
    const result = resolveCraftForRecipe(ctxOf(sim), pid, recipe);

    expect(result.ok).toBe(true);
    expect(meta.craftSkills[PAIRED_MAJOR]).toBe(101);
  });

  it('the hobby craft freezes at the rare ceiling: no further progress past tier 2', () => {
    const sim = makeSim();
    const pid = sim.playerId;
    sim.acceptArchetypeQuest(ARMOR);
    const meta = metaOf(sim, pid);
    meta.craftSkills[COOKING] = 50; // tierCapability = 2 (rare), exactly at the hobby ceiling

    const recipe: ProfessionRecipeRecord = {
      id: 'test_recipe_tier3_hobby',
      professionId: COOKING,
      resultItemId: 'bone_fragments',
      resultCount: 1,
      reagents: [],
      skillReq: 75, // recipeTier = 3, above the rare ceiling
      trivialAt: 100,
      itemLevelBudget: 10,
    };
    const result = resolveCraftForRecipe(ctxOf(sim), pid, recipe);

    expect(result.ok).toBe(true);
    expect(meta.craftSkills[COOKING]).toBe(50); // frozen at the rare ceiling
  });
});
