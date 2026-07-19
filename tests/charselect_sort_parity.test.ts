import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const mainTs = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
const shellCss = readFileSync(new URL('../src/styles/shell.css', import.meta.url), 'utf8');

describe('single game entry character-select controls', () => {
  it('contains the sort controls read by wireStartScreens', () => {
    expect(mainTs).toContain("$('#cs-sort-btn').addEventListener");
    for (const id of ['cs-sort-btn', 'cs-sort-menu', 'cs-sort-current']) {
      expect(indexHtml).toContain(`id="${id}"`);
    }
  });

  it('keeps the sort layout in the shared shell stylesheet', () => {
    for (const rule of ['.cs-controls', '.cs-sort-switch', '.cs-sort-menu']) {
      expect(shellCss).toContain(`${rule} {`);
    }
  });

  it('contains the Enter World button read by wireStartScreens', () => {
    expect(mainTs).toContain("$('#btn-charselect-enter').addEventListener");
    expect(indexHtml).toContain('id="btn-charselect-enter"');
  });
});
