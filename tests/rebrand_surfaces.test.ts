import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('..', import.meta.url));
const publicRoot = join(root, 'public');
const publicSurfaceExtensions = new Set(['.html', '.md', '.txt', '.xml', '.webmanifest']);

function listPublicSurfaces(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listPublicSurfaces(path);
    return publicSurfaceExtensions.has(extname(entry.name)) ? [relative(root, path)] : [];
  });
}

const publicSurfaces = listPublicSurfaces(publicRoot);
const sourceSurfaces = [
  'index.html',
  'guide.html',
  'admin.html',
  'editor.html',
  'wallet-handoff.html',
  'src/main.ts',
  'src/wallet_handoff.ts',
  'src/guide/head.ts',
  'src/guide/chrome.ts',
  'src/guide/pages/home.ts',
  'electron/main.cjs',
  'electron/shell_strings.cjs',
  'scripts/seo_audit.mjs',
  'scripts/guide_e2e.mjs',
  'scripts/links_verify.mjs',
  'scripts/links_playwright.mjs',
  ...publicSurfaces,
];

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

function withoutCompatibilityIdentifiers(path: string, source: string): string {
  let scrubbed = source;
  if (path === 'index.html') {
    scrubbed = scrubbed.replaceAll(
      /https:\/\/updates\.worldofclaudecraft\.com\/desktop\/world-of-claudecraft-[^"\s]+/g,
      '',
    );
    scrubbed = scrubbed.replace('/World-of-ClaudeCraft-Whitepaper-v1.0.pdf', '');
  }
  if (path === 'src/wallet_handoff.ts') {
    scrubbed = scrubbed.replace('worldofclaudecraft://wallet-handoff', '');
  }
  return scrubbed;
}

describe('Endless Glory emitted surfaces', () => {
  it.each(sourceSurfaces)(
    '%s contains no retired user-facing brand, domain, logo, or /play URL',
    (path) => {
      const source = withoutCompatibilityIdentifiers(path, read(path));
      expect(source, path).not.toMatch(/World of ClaudeCraft|World of Claudecraft/);
      expect(source, path).not.toContain('worldofclaudecraft.com');
      expect(source, path).not.toMatch(/woc_logo_square|worldofclaudecraft-logo/);
      expect(source, path).not.toMatch(/(?:href=|url(?:Template)?:)[^\n]*\/play\b/);
    },
  );

  it('uses only the two verified legacy compatibility endpoints', () => {
    const index = read('index.html');
    const handoff = read('src/wallet_handoff.ts');
    expect(index).toContain('https://updates.worldofclaudecraft.com/desktop/');
    expect(index).not.toContain('updates.endlessglory.vercel.app');
    expect(handoff).toContain('worldofclaudecraft://wallet-handoff');
    expect(handoff).not.toContain('endlessglory://wallet-handoff');
  });

  it('brands the desktop package while preserving the registered protocol scheme', () => {
    const packageJson = JSON.parse(read('package.json')) as {
      build: { productName: string; protocols: Array<{ name: string; schemes: string[] }> };
    };
    expect(packageJson.build.productName).toBe('Endless Glory');
    expect(packageJson.build.protocols).toEqual([
      { name: 'Endless Glory Login', schemes: ['worldofclaudecraft'] },
    ]);
  });
});
