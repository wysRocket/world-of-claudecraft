import { describe, expect, it } from 'vitest';
import { VISUALS } from '../src/render/characters/manifest';
import {
  attackAbilityId,
  isSpinAttackAbility,
  weaponAttackStyle,
} from '../src/render/characters/weapon_attack_style_core';
import { WARRIOR_SHOUT_COLORS, warriorCastVisualPlan } from '../src/render/warrior_cast_fx_core';
import { ABILITIES } from '../src/sim/data';

describe('winning Warrior attack animation routing', () => {
  it('selects a swing from the actual live hands, including Titan Grip', () => {
    expect(weaponAttackStyle('worn_sword', null)).toBeNull();
    expect(weaponAttackStyle('wyrmfang_greatblade', null)).toBe('twohand');
    expect(weaponAttackStyle('worn_sword', 'rusty_dagger')).toBe('dualwield');
    expect(weaponAttackStyle('wyrmfang_greatblade', 'deathless_greatblade')).toBe('dualwield');
    expect(weaponAttackStyle('missing_item', 'rusty_dagger')).toBeNull();
  });

  it('drives the kawaii Warrior from the shared kawaii-roster animation donors', () => {
    const def = VISUALS.player_warrior;
    // Fast-path kawaii body: gear is modeled in, so no attach / gear-driven swap.
    expect(def.url).toBe('models/kawaii/warrior.glb');
    expect(def.attach).toBeUndefined();
    expect(def.weaponSlots).toBeUndefined();
    // Reuses the shared walk/attack clip donors grafted by bone name; the single
    // generic 'attack' swing plays for every ability (no per-ability map).
    expect(def.animUrls).toEqual([
      'models/kawaii/warrior_walk.glb',
      'models/kawaii/warrior_attack.glb',
    ]);
    expect(def.clips.attack).toEqual(['attack']);
    expect(def.clips.attackByAbility).toBeUndefined();
  });

  it('normalizes damage-event display names and preserves the whirlwind spin cue', () => {
    expect(attackAbilityId(ABILITIES.mortal_strike.name)).toBe('mortal_strike');
    expect(attackAbilityId(ABILITIES.whirlwind.name)).toBe('whirlwind');
    expect(attackAbilityId('mortal_strike')).toBe('mortal_strike');
    expect(attackAbilityId('missing ability')).toBeUndefined();
    expect(isSpinAttackAbility('whirlwind')).toBe(true);
    expect(isSpinAttackAbility('mortal_strike')).toBe(false);
  });
});

describe('winning Warrior cast VFX routing', () => {
  it('keeps the authored per-shout colors and one-pump roar plan', () => {
    expect(WARRIOR_SHOUT_COLORS).toEqual({
      battle_shout: 0xff2a1a,
      demoralizing_shout: 0x9a5df0,
      emboldening_roar: 0xff5470,
      defiant_bellow: 0xff8c2a,
      rallying_cry: 0xffe9a0,
      intimidating_shout: 0x7f8ad0,
    });
    expect(warriorCastVisualPlan('shout', 'rallying_cry')).toEqual({
      kind: 'shout',
      color: 0xffe9a0,
      ringRadius: 8,
      emote: 'cheer',
      repeats: 1,
    });
  });

  it('routes weapon aura and defensive flourish to authored clips only', () => {
    expect(warriorCastVisualPlan('weaponAura', 'sanguine_aura')).toEqual({
      kind: 'gesture',
      abilityId: 'sanguine_aura',
    });
    expect(warriorCastVisualPlan('flourish', 'raised_guard')).toEqual({
      kind: 'gesture',
      abilityId: 'raised_guard',
    });
    expect(warriorCastVisualPlan('projectile', 'heroic_throw')).toBeNull();
  });
});
