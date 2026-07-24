// Render-contract for the kawaii Adventurers class roster. Every class body is a
// Meshy chibi auto-rigged (the Blender rig pass) to ONE shared 24-bone skeleton,
// which is what lets them all reuse the warrior walk/attack clip donors grafted
// by bone name plus the shared bind-pose breathing idle. This pins that contract
// against the committed GLBs so a bad rig (missing bones, wrong idle, or a
// re-inflated file) fails loudly.

import fs from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { beforeAll, describe, expect, it } from 'vitest';

const CLASSES = [
  'warrior',
  'paladin',
  'hunter',
  'rogue',
  'priest',
  'mage',
  'warlock',
  'shaman',
  'druid',
];
// The kawaii NPC bodies rigged by the same Blender pass onto the shared
// skeleton (npc_herbalist stays on its emberwood model, so it is not here).
const NPCS = ['npc_armorer', 'npc_paladin', 'npc_smith', 'npc_foreman', 'npc_dealer'];
// Bones the shared walk/attack clips (and gear code) target by name.
const REQUIRED_BONES = ['Hips', 'Spine01', 'RightHand', 'LeftHand', 'LeftUpLeg', 'RightUpLeg'];

let io: import('@gltf-transform/core').NodeIO;
const read = (name: string) => io.read(`public/models/kawaii/${name}.glb`);

beforeAll(async () => {
  await MeshoptDecoder.ready;
  io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
});

describe('kawaii Adventurers roster asset contract', () => {
  it.each([...CLASSES, ...NPCS])(
    '%s is a skinned mesh on the shared skeleton with an idle',
    async (key) => {
      const doc = await read(key);
      const root = doc.getRoot();
      // Skinned to the shared rig: a mesh node that references the skin. This is
      // the load-bearing check - a bone-heat auto-weight failure exports a static,
      // unskinned mesh that would render frozen in-world.
      expect(root.listSkins(), `${key} has no skin`).toHaveLength(1);
      expect(
        root.listNodes().some((n) => n.getMesh() && n.getSkin()),
        `${key} mesh is not bound to the skin`,
      ).toBe(true);
      const bones = root
        .listSkins()[0]
        .listJoints()
        .map((j) => j.getName());
      for (const b of REQUIRED_BONES) {
        expect(bones, `${key} missing bone ${b}`).toContain(b);
      }
      // Carries an idle clip animating the hips + lower spine (Blender bakes the
      // breathing action across every bone, so channel COUNT is not pinned here).
      const idle = root.listAnimations().find((a) => a.getName() === 'idle');
      expect(idle, `${key} idle clip missing`).toBeDefined();
      const targets = idle!.listChannels().map((c) => c.getTargetNode()?.getName());
      expect(targets).toContain('Hips');
      expect(targets).toContain('Spine01');
      // Game-weight (webp + meshopt), never a raw multi-MB Meshy export.
      const bytes = fs.statSync(`public/models/kawaii/${key}.glb`).size;
      expect(bytes, `${key} too heavy`).toBeLessThan(2_000_000);
      expect(bytes, `${key} suspiciously small`).toBeGreaterThan(200_000);
    },
  );

  it('the walk/attack donors carry their clips and share the roster bone names', async () => {
    const walk = await read('warrior_walk');
    const attack = await read('warrior_attack');
    expect(
      walk
        .getRoot()
        .listAnimations()
        .map((a) => a.getName()),
    ).toContain('walk');
    expect(
      attack
        .getRoot()
        .listAnimations()
        .map((a) => a.getName()),
    ).toContain('attack');
    // Bone-name match is what makes the graft apply to every class body.
    const donorBones = walk
      .getRoot()
      .listSkins()[0]
      .listJoints()
      .map((j) => j.getName());
    for (const b of REQUIRED_BONES) expect(donorBones).toContain(b);
  });
});
