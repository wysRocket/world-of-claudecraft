// Entering a dungeon must never put a mob within aggro range of the arrival point:
// zoning in should never pull a pack. Mob aggro radius is clamped to at most 20 yards
// (mob/locomotion.ts: Math.min(20, template.aggroRadius + leveldiff * 1.5)), so a
// spawn strictly beyond 20 yards from the entry can never aggro on arrival, at any
// level difference (this is what bites heroic, where mobs pin to level 20). This guard
// pins that clearance so a future spawn edit or entry move can't reintroduce the pull.
import { describe, expect, it } from 'vitest';
import { CAMPS, DUNGEONS, MOBS } from '../src/sim/data';
import {
  DOOR_CLEAR_RADIUS,
  DUNGEON_DOORS,
  projectOutsideDungeonDoors,
} from '../src/sim/dungeon_door_clearance';
import { Sim } from '../src/sim/sim';
import type { Entity } from '../src/sim/types';

// The upper clamp on aggro radius in mob/locomotion.ts. A spawn farther than this from
// the entry cannot aggro the player the instant they arrive, regardless of level diff.
const MAX_AGGRO_RADIUS = 20;

describe('dungeon entry clearance: zoning in never aggros a pack', () => {
  for (const dungeon of Object.values(DUNGEONS)) {
    const spawns = dungeon.spawns ?? [];
    if (spawns.length === 0) continue; // e.g. the Nythraxis attunement crypt has no spawns
    it(`${dungeon.id}: no spawn within ${MAX_AGGRO_RADIUS} yd of the entry`, () => {
      for (const s of spawns) {
        const dist = Math.hypot(s.x - dungeon.entry.x, s.z - dungeon.entry.z);
        expect(
          dist,
          `${dungeon.id}: ${s.mobId} at (${s.x},${s.z}) is ${dist.toFixed(1)} yd from entry ` +
            `(${dungeon.entry.x},${dungeon.entry.z}), within aggro range`,
        ).toBeGreaterThanOrEqual(MAX_AGGRO_RADIUS);
      }
    });
  }
});

describe('dungeon door clearance: no camp mob spawns on an overworld door', () => {
  it('projects a point inside a door ring out to the ring edge', () => {
    const door = DUNGEON_DOORS[0];
    const inside = projectOutsideDungeonDoors(door.x + 3, door.z);
    expect(Math.hypot(inside.x - door.x, inside.z - door.z)).toBeCloseTo(DOOR_CLEAR_RADIUS, 5);
    // a point already clear is returned unchanged
    const clear = projectOutsideDungeonDoors(door.x + 500, door.z);
    expect(clear.x).toBe(door.x + 500);
  });

  it('the live world spawns no camp mob within the clear radius of any dungeon door', () => {
    const sim = new Sim({ seed: 7, playerClass: 'warrior', autoEquip: true });
    const mobs = [...(sim as any).entities.values()].filter((e: Entity) => e.kind === 'mob');
    expect(mobs.length).toBeGreaterThan(0);
    for (const mob of mobs) {
      for (const door of DUNGEON_DOORS) {
        const d = Math.hypot(mob.pos.x - door.x, mob.pos.z - door.z);
        expect(
          d,
          `${mob.name} at (${mob.pos.x.toFixed(1)},${mob.pos.z.toFixed(1)}) is ${d.toFixed(1)} yd ` +
            `from a dungeon door (${door.x},${door.z})`,
        ).toBeGreaterThanOrEqual(DOOR_CLEAR_RADIUS - 0.5);
      }
    }
  });

  it('every camp is a known template (guards the CAMPS table)', () => {
    for (const c of CAMPS) expect(MOBS[c.mobId], `camp ${c.mobId}`).toBeDefined();
  });
});
