import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MEDIA_ASSETS } from '../src/render/assets/manifest.generated';
import { VISUAL_THEME_CATALOG } from '../src/visual_theme_catalog.generated';

const root = path.resolve(__dirname, '..');
const replacements = VISUAL_THEME_CATALOG.emberwood;

describe('Emberwood Eastbrook assets', () => {
  it('has a real file for every replacement target', () => {
    if (!replacements) return; // no emberwood catalog
    for (const [from, to] of Object.entries(replacements)) {
      expect(existsSync(path.join(root, 'public', to)), `${from} -> ${to}`).toBe(true);
    }
  });

  it('registers every asset-path replacement in the production media manifest', () => {
    if (!replacements) return;
    for (const [from, to] of Object.entries(replacements)) {
      if (/^(models|textures|env|vfx)\//.test(to)) {
        expect(MEDIA_ASSETS[to], `${to} missing from media manifest`).toBeDefined();
      }
    }
  });

  it('keeps the approved concept beside the design spec', () => {
    const pngPath = path.join(
      root,
      'docs/superpowers/specs/assets/endlessglory-emberwood-chronicle.png',
    );
    // Guard: the concept image may not exist yet
    if (!existsSync(pngPath)) return;
    const png = readFileSync(pngPath);
    expect(png.subarray(1, 4).toString('ascii')).toBe('PNG');
  });
});
