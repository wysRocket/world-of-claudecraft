import { describe, expect, it } from 'vitest';
import {
  resolveVisualTheme,
  themedAssetPath,
  type VisualThemeCatalog,
} from '../src/visual_theme_core';

const catalog: VisualThemeCatalog = {
  emberwood: {
    'models/props/house_1.glb': 'models/emberwood/eastbrook/house_a.glb',
    'ui/skills/warrior/attack.webp': 'ui/emberwood/skills/warrior/attack.webp',
  },
};

describe('visual theme core', () => {
  it('uses a valid query override before the build default', () => {
    expect(resolveVisualTheme('?visual=emberwood', 'classic')).toBe('emberwood');
    expect(resolveVisualTheme('?visual=classic', 'emberwood')).toBe('classic');
  });

  it('falls back to a validated build default and then classic', () => {
    expect(resolveVisualTheme('', 'emberwood')).toBe('emberwood');
    expect(resolveVisualTheme('?visual=invalid', 'emberwood')).toBe('emberwood');
    expect(resolveVisualTheme('', 'invalid')).toBe('classic');
  });

  it('preserves leading slashes and leaves unmapped paths unchanged', () => {
    expect(themedAssetPath('/models/props/house_1.glb', 'emberwood', catalog)).toBe(
      '/models/emberwood/eastbrook/house_a.glb',
    );
    expect(themedAssetPath('models/props/house_1.glb', 'emberwood', catalog)).toBe(
      'models/emberwood/eastbrook/house_a.glb',
    );
    expect(themedAssetPath('/models/props/well.glb', 'emberwood', catalog)).toBe(
      '/models/props/well.glb',
    );
  });

  it('never replaces paths in classic mode', () => {
    expect(themedAssetPath('/models/props/house_1.glb', 'classic', catalog)).toBe(
      '/models/props/house_1.glb',
    );
  });
});
