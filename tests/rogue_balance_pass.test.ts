import { describe, expect, it } from 'vitest';
import { MOBS } from '../src/sim/data';
import { createMob } from '../src/sim/entity';
import { Sim } from '../src/sim/sim';
import type { Entity } from '../src/sim/types';

// Rogue balance pass (maintainer sheet): Shadeslip keeps Duskveil, Redhanded
// is the scoped Craven Thrust crit mastery, False Face eases the Duskveil
// slow, Scrapper's Edge lost its damage penalty.

function stealthed(p: Entity): boolean {
  return p.auras.some((aura) => aura.kind === 'stealth');
}

describe('rogue balance pass', () => {
  it('Shadeslip does not break Duskveil', () => {
    const sim = new Sim({ seed: 7, playerClass: 'rogue', autoEquip: true });
    sim.setPlayerLevel(20);
    expect(sim.applyTalents({ spec: null, rows: { 20: 'rog_r20_shadowstep' } })).toBe(true);
    const p = sim.player;
    const mob = createMob(20_000, MOBS.forest_wolf, 10, {
      x: p.pos.x + 10,
      y: p.pos.y,
      z: p.pos.z,
    });
    mob.hostile = true;
    mob.aiState = 'idle';
    (sim as unknown as { addEntity(entity: Entity): void }).addEntity(mob);
    sim.targetEntity(mob.id);
    p.resource = p.maxResource;
    sim.castAbility('stealth');
    sim.tick();
    expect(stealthed(p)).toBe(true);
    p.gcdRemaining = 0;
    sim.castAbility('shadowstep');
    sim.tick();
    expect(stealthed(p)).toBe(true);
  });

  it('Redhanded resolves as +30% Craven Thrust crit and False Face eases the Duskveil slow', () => {
    const sim = new Sim({ seed: 7, playerClass: 'rogue', autoEquip: true });
    sim.setPlayerLevel(20);
    sim.setSpec('assassination');
    const anySim = sim as unknown as {
      players: Map<number, unknown>;
      playerMods(meta: unknown): {
        abilities: Record<string, { critPct: number } | undefined>;
      };
      playerId: number;
    };
    const mods = anySim.playerMods(anySim.players.get(anySim.playerId));
    expect(mods.abilities.backstab?.critPct).toBeCloseTo(0.3);

    sim.setSpec('subtlety');
    // Duskveil aura value 0.5 * (1 + 0.5 mastery buffPct at level 20) = 0.75.
    expect(sim.resolvedAbility('stealth')?.effects[0]).toMatchObject({
      kind: 'stealth',
      value: 0.75,
    });
  });
});
