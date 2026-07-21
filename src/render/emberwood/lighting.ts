import type { VisualThemeId } from '../../visual_theme_core';

export interface LightingPolicy {
  readonly fogColor: number;
  readonly fogNear: number;
  readonly fogFar: number;
  readonly sunColor: number;
  readonly sunIntensity: number;
  readonly hemiColor: number;
  readonly hemiGround: number;
  readonly hemiIntensity: number;
}

const CLASSIC_LIGHTING: LightingPolicy = {
  fogColor: 0xa6c6e0,
  fogNear: 95,
  fogFar: 340,
  sunColor: 0xffedd0,
  sunIntensity: 2.8,
  hemiColor: 0xdcefff,
  hemiGround: 0x465f39,
  hemiIntensity: 0.45,
};

const EMBERWOOD_LIGHTING: LightingPolicy = {
  fogColor: 0x607487,
  fogNear: 95,
  fogFar: 340,
  sunColor: 0xffd6a3,
  sunIntensity: 2.8,
  hemiColor: 0xdcefff,
  hemiGround: 0x465f39,
  hemiIntensity: 0.45,
};

export function lightingForTheme(theme: VisualThemeId): LightingPolicy {
  return theme === 'emberwood' ? EMBERWOOD_LIGHTING : CLASSIC_LIGHTING;
}
