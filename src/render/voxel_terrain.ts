import * as THREE from 'three';
import { WORLD_MAX_X, WORLD_MAX_Z, WORLD_MIN_X, WORLD_MIN_Z } from '../sim/data';
import { voxelDensity } from '../sim/voxel';
import { meshVoxelChunk } from '../sim/voxel_mesh';
import { terrainHeight } from '../sim/world';
import { groundDetailTexture, stoneTexture } from './textures';

// Full-world terrain built entirely from the voxel density field/mesher
// (sim/voxel.ts, sim/voxel_mesh.ts), replacing the production chunked
// heightfield mesh (terrain.ts) so the voxel engine's output can be checked
// against the real world in-game, not just via unit tests.
//
// Three things keep this tractable at whole-map scale while closing the
// gaps a reviewer saw on the steepest terraced ridge walls:
//  - Per-column height culling: most of a naive world-spanning y-chunk grid
//    is either deep underground (uniformly solid) or high in the sky
//    (uniformly air) and would waste a full corner-density sample grid for
//    nothing. Before meshing a chunk we sample terrainHeight over its (x,z)
//    footprint on a 3x3 grid (cheap) and skip any y-chunk whose range falls
//    well outside that local height band, with a generous margin so a
//    steep local rise inside one footprint can't silently drop a needed
//    y-chunk (that dropped chunk is exactly what read as a "LOD gap").
//  - A fine per-chunk voxel resolution (1 world unit/voxel) so a terraced
//    near-vertical riser has enough samples to mesh as a continuous wall
//    instead of a thin gap Surface Nets can't resolve.
//  - A generous world-edge margin so the mesh doesn't stop short of the
//    map boundary and show a gap to the skybox.
const CHUNK_SIZE = 16; // world units per chunk cube
const CHUNK_RESOLUTION = 16; // voxels per axis per chunk (1 world unit/voxel)
const HEIGHT_MARGIN = 48; // yd of slack around the sampled local height band
const WORLD_MARGIN = 80; // yd padding so the mesh doesn't stop short of the map edge

export interface VoxelTerrainView {
  group: THREE.Group;
  chunkCount: number;
  triangleCount: number;
}

// Cheap local height band for one (x,z) chunk footprint: a 3x3 grid of
// terrainHeight samples (9 calls), not a full density grid. More samples
// than a single corners+center pass so a steep local rise inside the
// footprint (a terraced ridge wall) can't slip between sample points and
// silently exclude the y-chunk that actually needs meshing.
function localHeightBand(seed: number, cx: number, cz: number): { min: number; max: number } {
  const x0 = cx * CHUNK_SIZE;
  const z0 = cz * CHUNK_SIZE;
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i <= 2; i++) {
    for (let j = 0; j <= 2; j++) {
      const h = terrainHeight(x0 + (i / 2) * CHUNK_SIZE, z0 + (j / 2) * CHUNK_SIZE, seed);
      if (h < min) min = h;
      if (h > max) max = h;
    }
  }
  return { min, max };
}

export function buildVoxelTerrain(seed: number): VoxelTerrainView {
  const group = new THREE.Group();
  group.name = 'voxel-terrain-verification';
  const density = (x: number, y: number, z: number) => voxelDensity(x, y, z, seed);

  // Real procedural textures (this repo's existing canvas-generated set, no
  // new assets), triplanar-projected so they never stretch on a steep face
  // and never seam at a chunk boundary (the projection is pure world space,
  // not per-chunk UVs). Slope blends a grass tint on flat ground to a rock
  // tint on cliffs, matching the terrain's own shape.
  const grassTex = groundDetailTexture();
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
  const rockTex = stoneTexture();
  rockTex.wrapS = rockTex.wrapT = THREE.RepeatWrapping;

  const material = new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0 });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.grassMap = { value: grassTex };
    shader.uniforms.rockMap = { value: rockTex };
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      '#include <common>\nvarying vec3 vWorldPos;\nvarying vec3 vWorldNormal;',
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;\nvWorldNormal = normalize(mat3(modelMatrix) * normal);',
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
      uniform sampler2D grassMap;
      uniform sampler2D rockMap;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      vec3 triplanar(sampler2D tex, vec3 pos, vec3 blend, float scale) {
        vec3 xCol = texture2D(tex, pos.yz * scale).rgb;
        vec3 yCol = texture2D(tex, pos.xz * scale).rgb;
        vec3 zCol = texture2D(tex, pos.xy * scale).rgb;
        return xCol * blend.x + yCol * blend.y + zCol * blend.z;
      }`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `{
        vec3 n = normalize(vWorldNormal);
        vec3 blend = abs(n);
        blend /= (blend.x + blend.y + blend.z);
        float slopeT = clamp(1.0 - (n.y - 0.5) / 0.5, 0.0, 1.0);
        vec3 grassCol = vec3(0.30, 0.55, 0.23) * triplanar(grassMap, vWorldPos, blend, 0.06);
        vec3 rockCol = vec3(0.40, 0.38, 0.35) * triplanar(rockMap, vWorldPos, blend, 0.05) * 1.6;
        diffuseColor.rgb *= mix(grassCol, rockCol, slopeT);
      }`,
    );
  };

  const cx0 = Math.floor((WORLD_MIN_X - WORLD_MARGIN) / CHUNK_SIZE);
  const cx1 = Math.ceil((WORLD_MAX_X + WORLD_MARGIN) / CHUNK_SIZE);
  const cz0 = Math.floor((WORLD_MIN_Z - WORLD_MARGIN) / CHUNK_SIZE);
  const cz1 = Math.ceil((WORLD_MAX_Z + WORLD_MARGIN) / CHUNK_SIZE);

  let chunkCount = 0;
  let triangleCount = 0;

  for (let cx = cx0; cx < cx1; cx++) {
    for (let cz = cz0; cz < cz1; cz++) {
      const band = localHeightBand(seed, cx, cz);
      const cy0 = Math.floor((band.min - HEIGHT_MARGIN) / CHUNK_SIZE);
      const cy1 = Math.ceil((band.max + HEIGHT_MARGIN) / CHUNK_SIZE);
      // The game's zone-ridge/rim walls are DESIGNED steeper than the climb
      // limit (near-vertical, terraced). A heightfield mesh can never have a
      // hole on an arbitrarily steep single-valued surface (it is one
      // triangle strip per grid cell, always connected); a 3D isosurface
      // mesh like this one can, if the surface's local slope outruns the
      // voxel resolution (a terrace riser thinner than one voxel cell can
      // fall between corner samples). Steep columns get a finer resolution
      // to close that specific gap; flat/rolling ground keeps the cheaper one.
      const steepness = (band.max - band.min) / CHUNK_SIZE;
      const resolution = steepness > 1.5 ? CHUNK_RESOLUTION * 2 : CHUNK_RESOLUTION;

      for (let cy = cy0; cy < cy1; cy++) {
        const mesh = meshVoxelChunk(density, {
          x0: cx * CHUNK_SIZE,
          y0: cy * CHUNK_SIZE,
          z0: cz * CHUNK_SIZE,
          size: CHUNK_SIZE,
          resolution,
        });
        if (mesh.positions.length === 0) continue;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(mesh.positions, 3));
        geo.setAttribute('normal', new THREE.BufferAttribute(mesh.normals, 3));
        geo.setIndex(new THREE.BufferAttribute(mesh.indices, 1));

        const chunkMesh = new THREE.Mesh(geo, material);
        chunkMesh.name = `voxel-terrain-${cx}-${cy}-${cz}`;
        chunkMesh.matrixAutoUpdate = false;
        chunkMesh.updateMatrix();
        group.add(chunkMesh);
        chunkCount++;
        triangleCount += mesh.indices.length / 3;
      }
    }
  }

  console.log(`[voxel_terrain] build: ${chunkCount} chunks, ${triangleCount} triangles`);
  return { group, chunkCount, triangleCount };
}
