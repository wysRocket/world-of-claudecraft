// Compress a Blender-rigged kawaii character GLB to game weight: webp texture
// (capped at 1024) + meshopt geometry compression, matching the warrior base.
// The rig, skin, and the warrior idle clip carried in from Blender are preserved;
// walk/attack are grafted at runtime via animUrls, so this only shrinks the file.
//
//   node scripts/compress_kawaii_char.mjs <in.glb> <out.glb>

import fs from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, meshopt, prune, textureCompress } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';

const [IN, OUT] = process.argv.slice(2);
if (!IN || !OUT) {
  console.error('usage: node scripts/compress_kawaii_char.mjs <in.glb> <out.glb>');
  process.exit(1);
}
await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

const before = fs.statSync(IN).size;
const doc = await io.read(IN);
await doc.transform(
  prune(),
  dedup(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024] }),
  meshopt({ encoder: MeshoptEncoder, level: 'high' }),
);
await io.write(OUT, doc);
const after = fs.statSync(OUT).size;
console.log(
  `${IN.split('/').pop()}: ${(before / 1e6).toFixed(1)}MB -> ${(after / 1024).toFixed(0)}KB`,
);
