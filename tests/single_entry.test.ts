import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('offline-only game entry', () => {
  it('ships only index.html as the game entry', () => {
    expect(existsSync(new URL('../play.html', import.meta.url))).toBe(false);
    expect(read('vite.config.ts')).not.toMatch(/\bplay:\s*fileURLToPath/);
    expect(read('Dockerfile')).not.toContain('play.html');
    expect(read('scripts/release_version.mjs')).toContain("htmlFiles: ['index.html']");
  });

  it('keeps active verification and contributor guidance on the single entry', () => {
    for (const path of [
      'scripts/homepage_verify.mjs',
      'DESIGN.md',
      '.claude/skills/review-pr/SKILL.md',
    ]) {
      const source = read(path);
      expect(source, path).not.toMatch(/play\.html|\/play\b/);
    }
  });

  it('routes every user-facing Play CTA to the offline root', () => {
    for (const path of [
      'guide.html',
      'src/guide/chrome.ts',
      'src/guide/pages/home.ts',
      'src/guide/head.ts',
      'public/llms.txt',
    ]) {
      const source = read(path);
      expect(source, path).not.toMatch(/(?:href=|url:\s*)[^\n]*\/play\b/);
      expect(source, path).not.toContain('worldofclaudecraft.com/play');
    }
  });
});
