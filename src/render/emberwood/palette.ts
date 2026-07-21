import type { BiomeId } from '../../sim/types';
import type { VisualThemeId } from '../../visual_theme_core';

export interface BiomeTerrainPalette {
  readonly grass: number;
  readonly grassDark: number;
  readonly grassYellow: number;
  readonly dirt: number;
  readonly sand: number;
}

export type TerrainPalette = Record<BiomeId, BiomeTerrainPalette>;

export type FoliageTintTable = Record<BiomeId, number>;

export interface FoliagePalette {
  readonly pine: FoliageTintTable;
  readonly oak: FoliageTintTable;
  readonly rock: FoliageTintTable;
  readonly trunk: FoliageTintTable;
  readonly grass: FoliageTintTable;
  readonly dress: FoliageTintTable;
}

// --- Classic (current shipped values) ---

const CLASSIC_TERRAIN: TerrainPalette = {
  vale: {
    grass: 0x548545,
    grassDark: 0x3e6635,
    grassYellow: 0x768c44,
    dirt: 0x8a6f47,
    sand: 0xc2b283,
  },
  marsh: {
    grass: 0x3f4d28,
    grassDark: 0x2c3a1e,
    grassYellow: 0x505c34,
    dirt: 0x4f4028,
    sand: 0x655741,
  },
  peaks: {
    grass: 0x7a8878,
    grassDark: 0x5c6862,
    grassYellow: 0x9aa192,
    dirt: 0x8a7d6a,
    sand: 0xbdb49c,
  },
  beach: {
    grass: 0x9ab86a,
    grassDark: 0x7d9a5a,
    grassYellow: 0xb8c278,
    dirt: 0xc2a575,
    sand: 0xf0e4bc,
  },
  desert: {
    grass: 0xcbaa5e,
    grassDark: 0xa88d48,
    grassYellow: 0xe0c070,
    dirt: 0xc08f4a,
    sand: 0xecc890,
  },
  volcano: {
    grass: 0x3c2c28,
    grassDark: 0x281c18,
    grassYellow: 0x503830,
    dirt: 0x2c2018,
    sand: 0x4c342c,
  },
  cave: {
    grass: 0x585e66,
    grassDark: 0x3e444c,
    grassYellow: 0x6a7078,
    dirt: 0x484e56,
    sand: 0x767c86,
  },
};

const CLASSIC_FOLIAGE: FoliagePalette = {
  pine: {
    vale: 0x9bb48d,
    marsh: 0x87966b,
    peaks: 0x6f8a7a,
    beach: 0xa8b878,
    desert: 0xa8a468,
    volcano: 0x6a5f52,
    cave: 0x77837a,
  },
  oak: {
    vale: 0xa7b886,
    marsh: 0x8d9865,
    peaks: 0x92a37f,
    beach: 0xb2bd7e,
    desert: 0xb0a468,
    volcano: 0x74624f,
    cave: 0x84907f,
  },
  rock: {
    vale: 0x8d8d85,
    marsh: 0x565c4e,
    peaks: 0x878e99,
    beach: 0xb0a894,
    desert: 0xb08d6a,
    volcano: 0x4a4038,
    cave: 0x6a6a66,
  },
  trunk: {
    vale: 0xffffff,
    marsh: 0xd2d8bc,
    peaks: 0xd9dde4,
    beach: 0xf2e4c8,
    desert: 0xe6d2ac,
    volcano: 0xb8a394,
    cave: 0xc4c8c2,
  },
  grass: {
    vale: 0xdde4c0,
    marsh: 0xbfc492,
    peaks: 0xc2cec8,
    beach: 0xe8e2b0,
    desert: 0xdcc890,
    volcano: 0x8a7a68,
    cave: 0xa2a89c,
  },
  dress: {
    vale: 0xaebf8e,
    marsh: 0x8d9865,
    peaks: 0x93a78f,
    beach: 0xc2c188,
    desert: 0xc0aa74,
    volcano: 0x7a6a58,
    cave: 0x8a948a,
  },
};

// --- Emberwood (Vale overrides, other biomes fall through to classic) ---

const EMBERWOOD_TERRAIN: TerrainPalette = {
  ...CLASSIC_TERRAIN,
  vale: {
    grass: 0x5a7a4a,
    grassDark: 0x3d5a33,
    grassYellow: 0x7a8a4a,
    dirt: 0x8a6845,
    sand: 0xb8a080,
  },
};

const EMBERWOOD_FOLIAGE: FoliagePalette = {
  ...CLASSIC_FOLIAGE,
  pine: { ...CLASSIC_FOLIAGE.pine, vale: 0x7f9a78 },
  // Warm amber/autumn oak canopy: the "Emberwood" name should read in the trees, not
  // just a slightly different green (the prior 0x7f936f was barely distinguishable
  // from the classic 0xa7b886 sage-green).
  oak: { ...CLASSIC_FOLIAGE.oak, vale: 0xb8783c },
  rock: { ...CLASSIC_FOLIAGE.rock, vale: 0x8a8a88 },
  trunk: { ...CLASSIC_FOLIAGE.trunk, vale: 0xd4c0a8 },
  grass: { ...CLASSIC_FOLIAGE.grass, vale: 0xc8d4a8 },
  dress: { ...CLASSIC_FOLIAGE.dress, vale: 0x9aa87a },
};

// --- Selectors ---

export function terrainPaletteForTheme(theme: VisualThemeId): TerrainPalette {
  return theme === 'emberwood' ? EMBERWOOD_TERRAIN : CLASSIC_TERRAIN;
}

export function foliagePaletteForTheme(theme: VisualThemeId): FoliagePalette {
  return theme === 'emberwood' ? EMBERWOOD_FOLIAGE : CLASSIC_FOLIAGE;
}
