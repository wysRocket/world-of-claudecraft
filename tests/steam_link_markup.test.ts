import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

describe('character-select Steam card', () => {
  it('ships every id bound by the Steam-link wiring', () => {
    expect(indexHtml).toContain('id="cs-steam-group"');
    for (const id of ['btn-steam-link', 'steam-status', 'btn-steam-unlink', 'steam-help']) {
      expect(indexHtml).toContain(`id="${id}"`);
    }
  });
});
