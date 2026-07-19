// Professions 2.0 Phase 7: the Guild letter. Covers the pure leading-pair
// classifier (src/sim/professions/trend.ts), the one-shot Guild-letter
// delivery through the real Sim (mail.test.ts driving pattern), and the
// GUILD_TREND_LETTERS content completeness pins. Guild letters are counted by
// filtering mailArrived events for guild_trend_ letter ids, so the welcome
// letter never pollutes a count.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { GUILD_TREND_LETTERS } from '../src/sim/content/letters';
import { ARCHETYPE_PAIR_TARGETS, craftsForPairTarget } from '../src/sim/professions/archetype';
import { classifyCraftTrend, GUILD_LETTER_SKILL_THRESHOLD } from '../src/sim/professions/trend';
import { TIER_SKILL_STEP } from '../src/sim/professions/wheel';
import { Sim } from '../src/sim/sim';
import type { SimEvent } from '../src/sim/types';

// The ten canonical adjacent-pair ids over the locked CRAFT_RING order,
// pinned literally: a ring reorder or pair-id format change must fail here.
const RING_PAIR_IDS = [
  'engineering+alchemy',
  'alchemy+cooking',
  'cooking+leatherworking',
  'leatherworking+tailoring',
  'tailoring+inscription',
  'inscription+enchanting',
  'enchanting+jewelcrafting',
  'jewelcrafting+weaponcrafting',
  'weaponcrafting+armorcrafting',
  'armorcrafting+engineering',
] as const;

describe('classifyCraftTrend: the pure leading-pair classifier', () => {
  it('pins the letter threshold to 25, the tier step', () => {
    expect(GUILD_LETTER_SKILL_THRESHOLD).toBe(25);
    expect(GUILD_LETTER_SKILL_THRESHOLD).toBe(TIER_SKILL_STEP);
  });

  it('pins the ten adjacent pair ids in locked ring order', () => {
    expect([...ARCHETYPE_PAIR_TARGETS]).toEqual([...RING_PAIR_IDS]);
  });

  it('selects the clear highest-sum pair with its member crafts and score', () => {
    const trend = classifyCraftTrend({ engineering: 20, alchemy: 30 });
    expect(trend).toEqual({
      pairId: 'engineering+alchemy',
      crafts: ['engineering', 'alchemy'],
      score: 50,
      crossed: true,
    });
    expect(trend?.crafts).toEqual(craftsForPairTarget('engineering+alchemy'));
    const low = classifyCraftTrend({ tailoring: 10, inscription: 12 });
    expect(low).toEqual({
      pairId: 'tailoring+inscription',
      crafts: ['tailoring', 'inscription'],
      score: 22,
      crossed: false,
    });
  });

  it('breaks a sum tie by the higher minimum member skill', () => {
    // engineering+alchemy and tailoring+inscription both sum to 30; the
    // tailoring pair's weakest member (15) beats the alchemy pair's (5).
    const trend = classifyCraftTrend({
      engineering: 25,
      alchemy: 5,
      tailoring: 15,
      inscription: 15,
    });
    expect(trend).toEqual({
      pairId: 'tailoring+inscription',
      crafts: ['tailoring', 'inscription'],
      score: 30,
      crossed: true,
    });
  });

  it('a single-craft specialist selects the pair that craft leads (first-member tie-break)', () => {
    // jewelcrafting+weaponcrafting and weaponcrafting+armorcrafting tie on
    // score (30) and on min member (0); the FIRST ring member's skill
    // (weaponcrafting 30 vs jewelcrafting 0) decides.
    const trend = classifyCraftTrend({ weaponcrafting: 30 });
    expect(trend).toEqual({
      pairId: 'weaponcrafting+armorcrafting',
      crafts: ['weaponcrafting', 'armorcrafting'],
      score: 30,
      crossed: true,
    });
  });

  it('falls back to ring order when score, min member, and first member all tie', () => {
    // Every craft at 10: all ten pairs tie on score 20, min 10, first member
    // 10, so the lowest ring index (engineering+alchemy) wins.
    const uniform: Record<string, number> = {};
    for (const pairId of RING_PAIR_IDS) uniform[pairId.split('+')[0]] = 10;
    expect(classifyCraftTrend(uniform)).toEqual({
      pairId: 'engineering+alchemy',
      crafts: ['engineering', 'alchemy'],
      score: 20,
      crossed: false,
    });
  });

  it('crosses exactly at the threshold: sum 24 is short, sum 25 crosses', () => {
    const short = classifyCraftTrend({ engineering: 12, alchemy: 12 });
    expect(short?.pairId).toBe('engineering+alchemy');
    expect(short?.score).toBe(24);
    expect(short?.crossed).toBe(false);
    const crossed = classifyCraftTrend({ engineering: 12, alchemy: 13 });
    expect(crossed?.pairId).toBe('engineering+alchemy');
    expect(crossed?.score).toBe(25);
    expect(crossed?.crossed).toBe(true);
  });

  it('returns null when no pair has a positive score', () => {
    expect(classifyCraftTrend({})).toBeNull();
    const zero: Record<string, number> = {};
    for (const pairId of RING_PAIR_IDS) zero[pairId.split('+')[0]] = 0;
    expect(classifyCraftTrend(zero)).toBeNull();
    // Non-positive entries count as 0, so a lone negative is still null.
    expect(classifyCraftTrend({ engineering: -5 })).toBeNull();
  });

  it('is deterministic and never mutates its input', () => {
    const input = { engineering: 20, alchemy: 30, cooking: 7 };
    const snapshot = JSON.parse(JSON.stringify(input));
    expect(classifyCraftTrend(input)).toEqual(classifyCraftTrend(input));
    expect(input).toEqual(snapshot);
    // A frozen input throws on any write in strict mode, so a clean call on it
    // doubles as the no-write proof.
    const frozen = Object.freeze({ ...input });
    expect(classifyCraftTrend(frozen)).toEqual(classifyCraftTrend(input));
  });
});

// --- Guild-letter delivery through the real Sim ---

const makeWorld = () => new Sim({ seed: 42, playerClass: 'warrior', noPlayer: true });

function tickFor(sim: Sim, seconds: number): SimEvent[] {
  const out: SimEvent[] = [];
  for (let i = 0; i < Math.ceil(seconds * 20); i++) out.push(...sim.tick());
  return out;
}

const guildLetters = (events: SimEvent[], pid: number) =>
  events.filter(
    (e) =>
      e.type === 'mailArrived' && e.pid === pid && (e.letterId ?? '').startsWith('guild_trend_'),
  );

// The raven's flight for this pair's letter, mirroring the PostOffice booking
// rule (sendLetter): an authored letter with no delaySeconds of its own flies
// for the standard 90 second NPC delivery delay (MAIL_NPC_DELIVERY_SECONDS,
// module-private in src/sim/mail/post_office.ts).
const letterDelay = (pairId: string): number => GUILD_TREND_LETTERS[pairId]?.delaySeconds ?? 90;

// These drive full mail-delivery windows through sim.tick(); give them real
// headroom under worker-pool CPU contention (the mail.test.ts precedent).
const GUILD_DELIVERY_TEST_TIMEOUT_MS = 20_000;

describe('the Guild letter through the real Sim', () => {
  it(
    'a fresh character crossing the threshold gets exactly one pair-correct letter',
    () => {
      const sim = makeWorld();
      const pid = sim.addPlayer('warrior', 'Tinker');
      sim.gainCraftSkill(pid, 'engineering', 15);
      sim.gainCraftSkill(pid, 'alchemy', 15);
      const events = tickFor(sim, letterDelay('engineering+alchemy') + 5);
      const letters = guildLetters(events, pid);
      expect(letters).toHaveLength(1);
      expect(letters[0]).toMatchObject({ letterId: 'guild_trend_engineering_alchemy' });
    },
    GUILD_DELIVERY_TEST_TIMEOUT_MS,
  );

  it(
    'continued gains and long additional ticking never produce a second Guild letter',
    () => {
      const sim = makeWorld();
      const pid = sim.addPlayer('warrior', 'Tinker');
      sim.gainCraftSkill(pid, 'engineering', 15);
      sim.gainCraftSkill(pid, 'alchemy', 15);
      const all: SimEvent[] = [];
      all.push(...tickFor(sim, letterDelay('engineering+alchemy') + 5));
      expect(guildLetters(all, pid)).toHaveLength(1);
      // Cross a DIFFERENT pair far past the threshold and keep playing.
      sim.gainCraftSkill(pid, 'jewelcrafting', 100);
      sim.gainCraftSkill(pid, 'weaponcrafting', 100);
      all.push(...tickFor(sim, letterDelay('jewelcrafting+weaponcrafting') + 30));
      expect(guildLetters(all, pid)).toHaveLength(1);
    },
    GUILD_DELIVERY_TEST_TIMEOUT_MS,
  );

  it(
    'an attuned character crossing the threshold gets no Guild letter',
    () => {
      const seedWorld = makeWorld();
      const seedPid = seedWorld.addPlayer('warrior', 'Seed');
      const state = seedWorld.serializeCharacter(seedPid);
      if (!state) throw new Error('expected a serialized character state');
      state.archetype = {
        activeArchetype: 'engineering',
        pairedMajor: 'alchemy',
        attunedPairs: ['engineering+alchemy'],
      };
      state.craftSkills = { ...state.craftSkills, engineering: 40, alchemy: 40 };

      const sim = makeWorld();
      const pid = sim.addPlayer('warrior', 'Attuned', { state });
      const meta = sim.meta(pid);
      if (!meta) throw new Error('no meta');
      expect(meta.archetype.activeArchetype).toBe('engineering');
      sim.gainCraftSkill(pid, 'engineering', 50);
      const events = tickFor(sim, letterDelay('engineering+alchemy') + 10);
      expect(guildLetters(events, pid)).toHaveLength(0);
    },
    GUILD_DELIVERY_TEST_TIMEOUT_MS,
  );

  it(
    'an amends character (no active pair, non-empty history) gets no Guild letter',
    () => {
      const seedWorld = makeWorld();
      const seedPid = seedWorld.addPlayer('warrior', 'Seed');
      const state = seedWorld.serializeCharacter(seedPid);
      if (!state) throw new Error('expected a serialized character state');
      state.archetype = { activeArchetype: null, attunedPairs: ['engineering+alchemy'] };

      const sim = makeWorld();
      const pid = sim.addPlayer('warrior', 'Amends', { state });
      const meta = sim.meta(pid);
      if (!meta) throw new Error('no meta');
      // normalizeArchetypeState drops pair history when activeArchetype is
      // null, so a round trip alone cannot carry the amends premise; restore
      // it on the live meta so the eligibility predicate (activeArchetype null
      // AND attunedPairs empty, BOTH required) is what this test proves.
      if (!meta.archetype.attunedPairs.includes('engineering+alchemy')) {
        meta.archetype.attunedPairs.push('engineering+alchemy');
      }
      expect(meta.archetype.activeArchetype).toBeNull();
      expect(meta.archetype.attunedPairs.length).toBeGreaterThan(0);
      sim.gainCraftSkill(pid, 'engineering', 15);
      sim.gainCraftSkill(pid, 'alchemy', 15);
      const events = tickFor(sim, letterDelay('engineering+alchemy') + 10);
      expect(guildLetters(events, pid)).toHaveLength(0);
    },
    GUILD_DELIVERY_TEST_TIMEOUT_MS,
  );

  it(
    'a legacy save with high skills and no flag gets the letter once, then never again',
    () => {
      const seedWorld = makeWorld();
      const seedPid = seedWorld.addPlayer('warrior', 'Seed');
      const state = seedWorld.serializeCharacter(seedPid);
      if (!state) throw new Error('expected a serialized character state');
      // A pre-Phase-7 save carries no guildLetterSent field at all.
      delete state.guildLetterSent;
      state.craftSkills = { ...state.craftSkills, engineering: 30, alchemy: 10 };

      const sim = makeWorld();
      const pid = sim.addPlayer('warrior', 'Legacy', { state });
      const events = tickFor(sim, letterDelay('engineering+alchemy') + 10);
      const letters = guildLetters(events, pid);
      expect(letters).toHaveLength(1);
      expect(letters[0]).toMatchObject({ letterId: 'guild_trend_engineering_alchemy' });

      const saved = sim.serializeCharacter(pid);
      if (!saved) throw new Error('expected a serialized character state');
      expect(saved.guildLetterSent).toBe(true);
      const sim2 = makeWorld();
      const pid2 = sim2.addPlayer('warrior', 'Legacy', { state: saved });
      const again = tickFor(sim2, letterDelay('engineering+alchemy') + 30);
      expect(guildLetters(again, pid2)).toHaveLength(0);
    },
    GUILD_DELIVERY_TEST_TIMEOUT_MS,
  );

  it(
    'the one-shot flag survives a save taken before the raven lands',
    () => {
      // The welcome-letter precedent (mail.test.ts): the sent flag is
      // serialized as soon as the letter is booked, not when it lands, so a
      // save taken mid-flight never re-triggers the letter in a fresh world.
      const sim = makeWorld();
      const pid = sim.addPlayer('warrior', 'Hasty');
      sim.gainCraftSkill(pid, 'engineering', 15);
      sim.gainCraftSkill(pid, 'alchemy', 15);
      // Two seconds: enough for the send evaluation, well short of the NPC
      // delivery delay, so the letter is still on the wing at save time.
      tickFor(sim, 2);
      const state = sim.serializeCharacter(pid);
      if (!state) throw new Error('expected a serialized character state');
      expect(state.guildLetterSent).toBe(true);
      const sim2 = makeWorld();
      const pid2 = sim2.addPlayer('warrior', 'Hasty', { state });
      const events = tickFor(sim2, letterDelay('engineering+alchemy') + 30);
      expect(guildLetters(events, pid2)).toHaveLength(0);
    },
    GUILD_DELIVERY_TEST_TIMEOUT_MS,
  );
});

// --- GUILD_TREND_LETTERS content completeness pins ---

describe('GUILD_TREND_LETTERS content pins', () => {
  it('covers all ten pair ids with unique, scheme-following letter ids', () => {
    expect(Object.keys(GUILD_TREND_LETTERS).sort()).toEqual([...ARCHETYPE_PAIR_TARGETS].sort());
    const ids = ARCHETYPE_PAIR_TARGETS.map((pairId) => GUILD_TREND_LETTERS[pairId]?.letterId);
    expect(new Set(ids).size).toBe(ARCHETYPE_PAIR_TARGETS.length);
    for (const pairId of ARCHETYPE_PAIR_TARGETS) {
      expect(GUILD_TREND_LETTERS[pairId]?.letterId).toBe(`guild_trend_${pairId.replace('+', '_')}`);
    }
  });

  it('every letter body names Haldren', () => {
    for (const pairId of ARCHETYPE_PAIR_TARGETS) {
      const body = GUILD_TREND_LETTERS[pairId]?.body ?? '';
      expect(body.includes('Haldren'), `${pairId}: body should name Haldren`).toBe(true);
    }
  });

  it('every letter id is registered in the LETTER_IDS table of world_entity_i18n.ts', () => {
    // LETTER_IDS is a module-private const, so pin it by source scan (the
    // localization_coverage precedent for reading this file by path).
    const src = fs.readFileSync(path.resolve(process.cwd(), 'src/ui/world_entity_i18n.ts'), 'utf8');
    const start = src.indexOf('const LETTER_IDS = [');
    expect(start, 'the LETTER_IDS declaration should exist').toBeGreaterThan(-1);
    const end = src.indexOf(']', start);
    expect(end).toBeGreaterThan(start);
    const block = src.slice(start, end);
    for (const pairId of ARCHETYPE_PAIR_TARGETS) {
      const letterId = `guild_trend_${pairId.replace('+', '_')}`;
      expect(
        block.includes(`'${letterId}'`),
        `${letterId} missing from LETTER_IDS in src/ui/world_entity_i18n.ts`,
      ).toBe(true);
    }
  });
});
