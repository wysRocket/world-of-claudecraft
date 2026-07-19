import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { VISUAL_THEME_CATALOG } from '../src/visual_theme_catalog.generated';

const root = path.resolve(__dirname, '..');

describe('Emberwood Eastbrook assets', () => {
  it('has a real file for every replacement target', () => {
    for (const [from, to] of Object.entries(VISUAL_THEME_CATALOG.emberwood)) {
      expect(existsSync(path.join(root, 'public', to)), `${from} -> ${to}`).toBe(true);
    }
  });
});
