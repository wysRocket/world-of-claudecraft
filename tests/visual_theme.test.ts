import { afterEach, describe, expect, it, vi } from 'vitest';
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

  it('does not treat inherited catalog keys as replacements', () => {
    expect(themedAssetPath('constructor', 'emberwood', { emberwood: {} })).toBe('constructor');
  });
});

describe('visual theme browser bridge', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('uses the validated parser-time stamp as the shared runtime default', async () => {
    vi.stubGlobal('location', { search: '' });
    vi.stubGlobal('document', {
      documentElement: { dataset: { visualTheme: 'emberwood' } },
    });

    const { ACTIVE_VISUAL_THEME, visualAssetPath } = await import('../src/visual_theme');
    expect(ACTIVE_VISUAL_THEME).toBe('emberwood');
    expect(visualAssetPath('/models/props/house_1.glb')).toBe(
      '/models/emberwood/eastbrook/house_a.glb',
    );
    expect(visualAssetPath('/models/props/unknown.glb')).toBe(
      '/models/props/unknown.glb',
    );
  });
});
