// Professions onboarding quest (issue #1701 follow-up): before this, nothing in
// the starting flow ever pointed a new player at gathering/crafting/town focus
// (see the professions.ts GATHERING_PROFESSIONS comment: no level/quest/tool gate
// exists at the mechanic level, so there was no natural "unlock" moment). This
// covers both the content shape (q_prof_intro wiring) and that its collect
// objective is actually satisfied by mining, not just any item gain.

import { describe, expect, it } from 'vitest';
import { NPCS, QUEST_ORDER, QUESTS } from '../src/sim/data';
import { NODE_HARVEST_TABLE } from '../src/sim/professions/gathering';
import { onInventoryChangedForQuests } from '../src/sim/quests/quest_credit';
import type { PlayerMeta } from '../src/sim/sim';
import type { SimContext } from '../src/sim/sim_context';
import type { QuestProgress, SimEvent } from '../src/sim/types';

type FakeCtx = SimContext & { events: SimEvent[] };

function makeCtx(itemCount: () => number): FakeCtx {
  const events: SimEvent[] = [];
  return {
    events,
    emit: (ev: SimEvent) => {
      events.push(ev);
    },
    countItem: (_itemId: string, _pid?: number) => itemCount(),
  } as unknown as FakeCtx;
}

function makeMeta(entityId = 1): PlayerMeta {
  return {
    entityId,
    questLog: new Map<string, QuestProgress>(),
    counters: { questProgress: 0 },
  } as unknown as PlayerMeta;
}

describe('q_prof_intro content wiring', () => {
  it('is a real, level-1-available quest given and turned in by foreman_odell', () => {
    const quest = QUESTS.q_prof_intro;
    expect(quest).toBeDefined();
    expect(quest.giverNpcId).toBe('foreman_odell');
    expect(quest.turnInNpcId).toBe('foreman_odell');
    expect(quest.minLevel).toBeUndefined();
    expect(quest.requiresQuest).toBeUndefined();
    expect(quest.retired).toBeUndefined();
  });

  it('is offered by foreman_odell and ordered into the zone quest chain', () => {
    expect(NPCS.foreman_odell.questIds).toContain('q_prof_intro');
    expect(QUEST_ORDER).toContain('q_prof_intro');
  });

  it('its collect objective targets the item mining nodes actually yield', () => {
    const quest = QUESTS.q_prof_intro;
    expect(quest.objectives).toHaveLength(1);
    const objective = quest.objectives[0];
    expect(objective.type).toBe('collect');
    expect(objective.itemId).toBe(NODE_HARVEST_TABLE.ore.itemId);
    expect(objective.count).toBeGreaterThan(0);
  });

  it('grants xp and copper on completion, with no class-gated reward', () => {
    const quest = QUESTS.q_prof_intro;
    expect(quest.xpReward).toBeGreaterThan(0);
    expect(quest.copperReward).toBeGreaterThan(0);
    expect(Object.keys(quest.itemRewards)).toHaveLength(0);
  });
});

describe('q_prof_intro: mining actually satisfies the collect objective', () => {
  it('promotes to ready once 5 ore chunks are held, same credit path every other collect quest uses', () => {
    let held = 0;
    const ctx = makeCtx(() => held);
    const meta = makeMeta();
    const quest = QUESTS.q_prof_intro;
    const need = quest.objectives[0].count;
    const qp: QuestProgress = { questId: 'q_prof_intro', counts: [0], state: 'active' };
    meta.questLog.set('q_prof_intro', qp);

    for (let i = 1; i <= need; i++) {
      held = i;
      onInventoryChangedForQuests(ctx, meta);
      expect(qp.counts[0]).toBe(i);
    }
    expect(qp.state).toBe('ready');
    expect(
      ctx.events.some(
        (e) => e.type === 'questReady' && (e as { questId?: string }).questId === 'q_prof_intro',
      ),
    ).toBe(true);
  });
});
