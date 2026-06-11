// Dungeon interior builders (Hollow Crypt / Sunken Bastion share 'crypt',
// Gravewyrm Sanctum is 'sanctum'). Extracted verbatim from renderer.ts so the
// dungeon re-dress can evolve independently of the entity renderer.
// Wall/pillar geometry must stay in sync with CRYPT_COLLIDERS/SANCTUM_COLLIDERS
// in sim/colliders.ts.
import * as THREE from 'three';
import { radialGlowTexture, stoneMaps, SurfaceMaps } from './textures';
import { surfaceMat } from './gfx';

const FLAME_EMISSIVE_HIGH = 2.2;
// dungeon torch point lights: pumped + hung lower so warm pools break up the
// floor (8.2u up at decay 2 left the ground a flat navy mass)
const DUNGEON_LIGHT_Y = 6.4;
const DUNGEON_LIGHT_INTENSITY = 46;
const DUNGEON_LIGHT_DISTANCE = 34;

// Tile a geometry's 0..1 UVs so shared textures keep a sane world-space
// density on big interior boxes/cylinders.
export function scaleUv(geo: THREE.BufferGeometry, su: number, sv: number): THREE.BufferGeometry {
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  return geo;
}

export class DungeonInteriors {
  private glowDecalGeo: THREE.BufferGeometry | null = null;
  private glowDecalTex: THREE.Texture | null = null;
  private glowDecalMats = new Map<number, THREE.MeshBasicMaterial>();
  private stoneMapsCache: SurfaceMaps | null = null;

  constructor(
    private scene: THREE.Scene,
    private lowGfx: boolean,
    private flames: THREE.Mesh[],
    private fireLights: THREE.PointLight[],
  ) {}

  buildInterior(interior: string, ox: number, oz: number): void {
    // one builder per DungeonDef.interior key
    if (interior === 'sanctum') this.buildSanctum(ox, oz);
    else this.buildCrypt(ox, oz);
  }

  // Additive light-pool decal under a dungeon torch: the point-light budget
  // only keeps the nearest few lights live, so the floor pools are baked in.
  private addTorchGlow(g: THREE.Group, x: number, z: number, colorHex: number): void {
    if (this.lowGfx) return;
    if (!this.glowDecalGeo) this.glowDecalGeo = new THREE.CircleGeometry(6.6, 20).rotateX(-Math.PI / 2);
    if (!this.glowDecalTex) this.glowDecalTex = radialGlowTexture();
    let mat = this.glowDecalMats.get(colorHex);
    if (!mat) {
      mat = new THREE.MeshBasicMaterial({
        map: this.glowDecalTex, color: colorHex, transparent: true, opacity: 0.46,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      this.glowDecalMats.set(colorHex, mat);
    }
    const glow = new THREE.Mesh(this.glowDecalGeo, mat);
    glow.position.set(x, 0.07, z);
    glow.renderOrder = 1; // after the floor it floats over
    g.add(glow);
  }

  // Dungeon torch: animated flame cone + budgeted point light + floor pool.
  private addDungeonTorch(g: THREE.Group, x: number, z: number, flameColor: number, flameEmissive: number, lightColor: number): void {
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 6), new THREE.MeshLambertMaterial({
      color: flameColor, emissive: flameEmissive, emissiveIntensity: this.lowGfx ? 1.6 : FLAME_EMISSIVE_HIGH,
      transparent: true, opacity: 0.92,
    }));
    flame.position.set(x, 8.4, z);
    g.add(flame);
    this.flames.push(flame);
    const light = new THREE.PointLight(lightColor, 10, this.lowGfx ? 22 : DUNGEON_LIGHT_DISTANCE, 2);
    // with daylight no longer leaking underground the torches carry the
    // scene — pump them and hang them low enough to pool on the floor
    if (!this.lowGfx) light.userData.baseIntensity = DUNGEON_LIGHT_INTENSITY;
    light.position.set(x, this.lowGfx ? 8.2 : DUNGEON_LIGHT_Y, z);
    g.add(light);
    this.fireLights.push(light);
    this.addTorchGlow(g, x, z, lightColor);
  }

  // Interior masonry: normal-mapped stone blocks under the torch pools on the
  // lit tiers (tint over the mid-gray stone maps lands on the legacy hues);
  // low keeps the flat Lambert look.
  private interiorStone(tintLight: number, tintDark: number, legacyLight: number, legacyDark: number): {
    stone: THREE.Material; stoneDark: THREE.Material; bone: THREE.Material;
  } {
    if (this.lowGfx) {
      return {
        stone: new THREE.MeshLambertMaterial({ color: legacyLight }),
        stoneDark: new THREE.MeshLambertMaterial({ color: legacyDark }),
        bone: new THREE.MeshLambertMaterial({ color: 0xd8d4c0, flatShading: true }),
      };
    }
    if (!this.stoneMapsCache) this.stoneMapsCache = stoneMaps();
    const maps = this.stoneMapsCache;
    return {
      stone: surfaceMat({ map: maps.map, normalMap: maps.normalMap, color: tintLight, roughness: 0.95 }),
      stoneDark: surfaceMat({ map: maps.map, normalMap: maps.normalMap, color: tintDark, roughness: 0.95 }),
      bone: surfaceMat({ color: 0xd8d4c0, flatShading: true, roughness: 0.9 }),
    };
  }

  // hewn dungeon pillar: plinth + entasis (bulged) shaft + capital — replaces
  // the plain cylinder so interiors stop reading as box rooms with tubes
  private dungeonPillar(g: THREE.Group, stone: THREE.Material, x: number, z: number): void {
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.7, 2.1), stone);
    plinth.position.set(x, 0.35, z);
    plinth.castShadow = true;
    g.add(plinth);
    const shaftGeo = scaleUv(new THREE.CylinderGeometry(0.74, 0.98, 7.3, 8, 4), 1.5, 2);
    const pos = shaftGeo.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const t = (pos.getY(i) + 3.65) / 7.3;
      const k = 1 + Math.sin(t * Math.PI) * 0.14;
      pos.setX(i, pos.getX(i) * k);
      pos.setZ(i, pos.getZ(i) * k);
    }
    shaftGeo.computeVertexNormals();
    const shaft = new THREE.Mesh(shaftGeo, stone);
    shaft.position.set(x, 4.05, z);
    shaft.castShadow = true;
    g.add(shaft);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.55, 1.95), stone);
    cap.position.set(x, 7.95, z);
    cap.castShadow = true;
    g.add(cap);
  }

  // pilaster relief + cornice course along the long side walls (inner face at
  // |x| = wallX) so they stop reading as flat extruded slabs
  private dressDungeonWalls(g: THREE.Group, stoneDark: THREE.Material, zFrom: number, zTo: number, wallX = 22): void {
    for (let z = zFrom; z <= zTo; z += 12.5) {
      for (const sx of [-1, 1]) {
        const pil = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8.2, 1.6), stoneDark);
        pil.position.set(sx * (wallX + 0.1), 4.1, z);
        g.add(pil);
        const cap = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 2.0), stoneDark);
        cap.position.set(sx * (wallX + 0.1), 8.45, z);
        g.add(cap);
      }
    }
    for (const sx of [-1, 1]) {
      const cornice = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, zTo - zFrom + 16), stoneDark);
      cornice.position.set(sx * (wallX + 0.15), 8.75, (zFrom + zTo) / 2);
      g.add(cornice);
    }
  }

  // corner rubble: a low cluster of displaced rocks (deterministic by seed)
  private rubblePile(g: THREE.Group, mat: THREE.Material, x: number, z: number, r: number, seed: number): void {
    for (let i = 0; i < 3; i++) {
      const geo = new THREE.IcosahedronGeometry(r * (0.55 + ((seed * 37 + i * 61) % 17) / 34), 1);
      const pos = geo.getAttribute('position');
      for (let v = 0; v < pos.count; v++) {
        const h = Math.sin(pos.getX(v) * 41.3 + pos.getY(v) * 53.7 + pos.getZ(v) * 29.1 + seed) * 0.5 + 0.5;
        const k = 0.8 + h * 0.45;
        pos.setXYZ(v, pos.getX(v) * k, pos.getY(v) * k * 0.62, pos.getZ(v) * k);
      }
      geo.computeVertexNormals();
      const rock = new THREE.Mesh(geo, mat);
      rock.position.set(x + Math.sin(seed * 3.1 + i * 2.4) * r * 0.9, 0.18, z + Math.cos(seed * 5.7 + i * 1.9) * r * 0.9);
      rock.rotation.y = seed + i * 1.7;
      g.add(rock);
    }
  }

  private buildCrypt(ox: number, oz: number): void {
    const g = new THREE.Group();
    const { stone, stoneDark, bone } = this.interiorStone(0xc6c6d4, 0x8c8c9c, 0x6a6a72, 0x4a4a52);

    const floor = new THREE.Mesh(scaleUv(new THREE.BoxGeometry(46, 0.5, 132), 10, 28), stoneDark);
    floor.position.set(0, -0.25, 47);
    floor.receiveShadow = true;
    g.add(floor);
    // walls
    for (const sx of [-23, 23]) {
      const wall = new THREE.Mesh(scaleUv(new THREE.BoxGeometry(2, 9, 132), 28, 2), stone);
      wall.position.set(sx, 4.5, 47);
      g.add(wall);
    }
    const backWall = new THREE.Mesh(scaleUv(new THREE.BoxGeometry(48, 9, 2), 10, 2), stone);
    backWall.position.set(0, 4.5, 112);
    g.add(backWall);
    const frontWall = new THREE.Mesh(scaleUv(new THREE.BoxGeometry(48, 9, 2), 10, 2), stone);
    frontWall.position.set(0, 4.5, -19);
    g.add(frontWall);
    this.dressDungeonWalls(g, stoneDark, -12, 106);
    // pillars + torches
    for (let z = 10; z <= 100; z += 15) {
      for (const sx of [-14, 14]) {
        this.dungeonPillar(g, stone, sx, z);
        this.addDungeonTorch(g, sx, z, 0x7fd4ff, 0x2288cc, 0x66bbff);
      }
    }
    // collapsed masonry in the corners
    this.rubblePile(g, stoneDark, -19, -13, 1.1, 3);
    this.rubblePile(g, stoneDark, 19, 6, 0.9, 7);
    this.rubblePile(g, stoneDark, -18, 70, 1.0, 11);
    this.rubblePile(g, stoneDark, 19, 108, 1.2, 15);
    // sarcophagi along the walls
    for (let z = 16; z <= 92; z += 19) {
      for (const sx of [-19, 19]) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 4.2), stoneDark);
        s.position.set(sx, 0.7, z);
        s.castShadow = true;
        g.add(s);
      }
    }
    // bone piles
    for (let i = 0; i < 10; i++) {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), bone);
      const bp = b.geometry.getAttribute('position');
      for (let v = 0; v < bp.count; v++) {
        const k = 0.8 + (Math.sin(bp.getX(v) * 47.1 + bp.getZ(v) * 31.7 + i) * 0.5 + 0.5) * 0.5;
        bp.setXYZ(v, bp.getX(v) * k, bp.getY(v) * k, bp.getZ(v) * k);
      }
      b.geometry.computeVertexNormals();
      b.position.set(Math.sin(i * 2.4) * 14, 0.3, 12 + i * 9.5);
      b.scale.set(1.2, 0.5, 1);
      g.add(b);
    }
    // boss dais
    const dais = new THREE.Mesh(scaleUv(new THREE.CylinderGeometry(9, 10, 1, 12), 4, 1), stone);
    dais.position.set(0, 0.5, 96);
    dais.receiveShadow = true;
    g.add(dais);

    g.position.set(ox, 0, oz);
    this.scene.add(g);
  }

  // Gravewyrm Sanctum: a stretched three-chamber crypt (z 0..158) — the
  // Boneworks, the Ritual Vault and the Wyrm's Hollow — separated by narrowed
  // waists, lit by green ritual fire. Wall/pillar geometry must stay in sync
  // with SANCTUM_COLLIDERS in sim/colliders.ts.
  private buildSanctum(ox: number, oz: number): void {
    const g = new THREE.Group();
    const { stone, stoneDark, bone } = this.interiorStone(0xb0a8c0, 0x767088, 0x5e5a66, 0x3f3b48);

    const floor = new THREE.Mesh(scaleUv(new THREE.BoxGeometry(46, 0.5, 178), 10, 38), stoneDark);
    floor.position.set(0, -0.25, 69.5);
    floor.receiveShadow = true;
    g.add(floor);
    // walls
    for (const sx of [-23, 23]) {
      const wall = new THREE.Mesh(scaleUv(new THREE.BoxGeometry(2, 9, 178), 38, 2), stone);
      wall.position.set(sx, 4.5, 69.5);
      g.add(wall);
    }
    const backWall = new THREE.Mesh(scaleUv(new THREE.BoxGeometry(48, 9, 2), 10, 2), stone);
    backWall.position.set(0, 4.5, 158);
    g.add(backWall);
    const frontWall = new THREE.Mesh(scaleUv(new THREE.BoxGeometry(48, 9, 2), 10, 2), stone);
    frontWall.position.set(0, 4.5, -19);
    g.add(frontWall);
    // chamber waists: wall stubs leaving a ~10yd centre passage
    for (const sx of [-14, 14]) {
      const stub1 = new THREE.Mesh(scaleUv(new THREE.BoxGeometry(18, 9, 10), 4, 2), stone);
      stub1.position.set(sx, 4.5, 67); // Boneworks -> Korgath's Hall
      g.add(stub1);
      const stub2 = new THREE.Mesh(scaleUv(new THREE.BoxGeometry(18, 9, 6), 4, 2), stone);
      stub2.position.set(sx, 4.5, 115); // Ritual Vault -> Wyrm's Hollow
      g.add(stub2);
    }
    this.dressDungeonWalls(g, stoneDark, -12, 152);
    // stone arch bands over the chamber-waist passages
    for (const waistZ of [67, 115]) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(12, 1.2, 1.8), stone);
      band.position.set(0, 8.3, waistZ);
      g.add(band);
      const keystone = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.5, 2.0), stone);
      keystone.position.set(0, 7.1, waistZ);
      g.add(keystone);
      for (const sx of [-1, 1]) {
        const haunch = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.1, 1.8), stone);
        haunch.position.set(sx * 3.4, 6.6, waistZ);
        haunch.rotation.z = sx * 0.38;
        g.add(haunch);
      }
    }
    // pillars + green ritual torches (waist bands skipped)
    for (const z of [10, 25, 40, 55, 85, 100, 125, 140]) {
      for (const sx of [-14, 14]) {
        this.dungeonPillar(g, stone, sx, z);
        this.addDungeonTorch(g, sx, z, 0xa6ffb8, 0x22cc55, 0x55e08a);
      }
    }
    // collapsed masonry along the chamber edges
    this.rubblePile(g, stoneDark, -19, 4, 1.0, 5);
    this.rubblePile(g, stoneDark, 19, 48, 1.1, 9);
    this.rubblePile(g, stoneDark, -19, 95, 1.0, 13);
    this.rubblePile(g, stoneDark, 18, 150, 1.2, 17);
    // bone piles strewn between the chambers (none inside the waist walls)
    for (let i = 0; i < 14; i++) {
      const z = 12 + i * 10;
      if ((z > 60 && z < 74) || (z > 110 && z < 120)) continue;
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), bone);
      const bp = b.geometry.getAttribute('position');
      for (let v = 0; v < bp.count; v++) {
        const k = 0.8 + (Math.sin(bp.getX(v) * 47.1 + bp.getZ(v) * 31.7 + i) * 0.5 + 0.5) * 0.5;
        bp.setXYZ(v, bp.getX(v) * k, bp.getY(v) * k, bp.getZ(v) * k);
      }
      b.geometry.computeVertexNormals();
      b.position.set(Math.sin(i * 2.1) * 14, 0.3, z);
      b.scale.set(1.3, 0.5, 1.1);
      g.add(b);
    }
    // Korzul's great dais
    const dais = new THREE.Mesh(scaleUv(new THREE.CylinderGeometry(11, 12, 1.2, 14), 4, 1), stone);
    dais.position.set(0, 0.6, 146);
    dais.receiveShadow = true;
    g.add(dais);

    g.position.set(ox, 0, oz);
    this.scene.add(g);
  }
}
