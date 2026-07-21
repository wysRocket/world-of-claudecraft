import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

describe('single game entry CSS wiring', () => {
  it('loads the index-only orientation and Discord integration stylesheet once', () => {
    expect(indexHtml.match(/href="\/src\/styles\/index\.extra\.css"/g)).toHaveLength(1);
    expect(indexHtml).not.toContain('/src/styles/play.extra.css');
  });
});
