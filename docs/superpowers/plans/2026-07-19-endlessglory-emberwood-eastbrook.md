# EndlessGlory Emberwood Eastbrook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a complete, gated Emberwood Chronicle visual slice for Eastbrook that looks like a different game while preserving gameplay, accessibility, and performance.

**Architecture:** Add one pure visual-theme resolver in `src/` and a generated replacement catalog sourced from an offline asset-build specification. Render media resolves themed logical paths before the existing content-hash lookup, while UI chrome and painted icons use the same active theme through narrow consumers. The slice stays behind `?visual=emberwood` and `VITE_VISUAL_THEME` until its desktop, mobile, low-tier, asset-budget, and browser acceptance gates pass.

**Tech Stack:** TypeScript 7 strict, Three.js r165, Vite 8, Vitest 4, glTF Transform, meshopt, Sharp, WebP, Puppeteer, CSS cascade layers.

---

## Scope and sequencing

This is the first independently shippable plan derived from the approved asset-redesign specification. It implements Slice A, the Eastbrook identity proof. Character-roster breadth, other biomes, dungeons, and long-tail UI remain outside this plan because the specification requires Eastbrook to pass before broad conversion begins.

Execution has one precondition: the currently deployed EndlessGlory rebrand changes in `/Volumes/ExternalSSD/world-of-claudecraft` must exist in a commit that descends from `4bc0520`. Do not build this slice from `4bc0520` alone, because that commit contains the design specification but not the uncommitted deployed rebrand work.

## File map

### Theme selection and generation

- Create `src/visual_theme_core.ts`: pure theme selection and path replacement.
- Create `src/visual_theme.ts`: browser-safe active theme and DOM attribute bridge.
- Create `scripts/build_visual_theme_manifest.mjs`: validate asset specs and generate the replacement catalog.
- Create `src/visual_theme_catalog.generated.ts`: generated logical-path mapping.
- Create `tests/visual_theme.test.ts`: pure selection, path, and gate tests.
- Modify `package.json`: add theme-manifest generation to build and pretest.
- Modify `src/render/assets/media.ts`: theme before content hashing.
- Modify `src/main.ts`: stamp `data-visual-theme` with a one-line bridge call.

### Eastbrook art sources and runtime assets

- Create `scripts/assets/specs/emberwood_eastbrook.json`: source, output, replacement, and provenance catalog.
- Create optimized files under `public/models/emberwood/`, `public/textures/emberwood/`, `public/env/emberwood/`, `public/vfx/emberwood/`, and `public/ui/emberwood/`.
- Modify `CREDITS.md`: record project-owned Emberwood art and any non-original source material.
- Create `tests/emberwood_assets.test.ts`: existence, generated-map, GLB, WebP, and media-manifest contracts.

### World look and interface

- Create `src/render/emberwood/CLAUDE.md`: local visual and performance invariants.
- Create `src/render/emberwood/lighting.ts`: theme-specific fog, sun, hemisphere, and firelight values.
- Create `src/render/emberwood/palette.ts`: Eastbrook terrain and foliage color policy.
- Create `src/render/emberwood/index.ts`: public barrel.
- Modify `src/render/renderer.ts`: consume the lighting policy without adding new methods.
- Modify `src/render/terrain.ts`: consume the terrain palette.
- Modify `src/render/foliage.ts`: consume the foliage palette.
- Create `src/styles/emberwood.tokens.css`: scoped semantic tokens.
- Create `src/styles/emberwood.hud.css`: scoped HUD frame and icon treatment.
- Modify `src/styles/index.css`: import the two scoped Emberwood styles.
- Modify `src/ui/theme.ts`: add the Emberwood default preset while preserving user overrides.
- Modify `src/ui/icons.ts`: resolve image-backed icons through the active visual theme.
- Modify `tests/theme.test.ts`, `tests/skill_icons.test.ts`, and `tests/item_icons.test.ts`: pin themed behavior and accessibility.

### Verification and evidence

- Modify `scripts/visual_tour.mjs`: capture separate classic and Emberwood evidence directories.
- Create `docs/screenshots/emberwood-eastbrook/`: approved desktop and mobile comparisons.
- Run targeted tests, type checks, the asset budget, the full gate, and a Vercel preview verification.

## Task 1: Prepare a clean execution worktree

**Files:**
- Verify: `/Volumes/ExternalSSD/world-of-claudecraft`
- Create worktree: `/Volumes/ExternalSSD/world-of-claudecraft-emberwood`

- [ ] **Step 1: Verify the deployed rebrand has a committed base**

Run:

```bash
git status --short
git log -3 --oneline
```

Expected: the chosen base commit contains the EndlessGlory branding and descends from `4bc0520`. If branding files are still uncommitted, stop and commit that existing work separately before this plan. Do not stage those files as part of the asset redesign.

- [ ] **Step 2: Create the dedicated feature worktree**

Run from the main worktree after the precondition passes:

```bash
git worktree add -b feature/emberwood-eastbrook /Volumes/ExternalSSD/world-of-claudecraft-emberwood HEAD
```

Expected: a clean worktree on `feature/emberwood-eastbrook`.

- [ ] **Step 3: Verify the baseline**

Run:

```bash
npm install
npm run check:ts
npm run build
```

Expected: dependency install succeeds, TypeScript passes, and Vite produces all existing entries.

## Task 2: Add the failing visual-theme core tests

**Files:**
- Create: `tests/visual_theme.test.ts`
- Test: `tests/visual_theme.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/visual_theme.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx vitest run tests/visual_theme.test.ts
```

Expected: FAIL because `src/visual_theme_core.ts` does not exist.

## Task 3: Implement theme selection and generated catalog support

**Files:**
- Create: `src/visual_theme_core.ts`
- Create: `src/visual_theme.ts`
- Create: `scripts/build_visual_theme_manifest.mjs`
- Create generated: `src/visual_theme_catalog.generated.ts`
- Modify: `package.json`
- Test: `tests/visual_theme.test.ts`

- [ ] **Step 1: Implement the pure resolver**

Create `src/visual_theme_core.ts`:

```ts
export type VisualThemeId = 'classic' | 'emberwood';
export type VisualThemeCatalog = Readonly<
  Partial<Record<VisualThemeId, Readonly<Record<string, string>>>>
>;

const VALID_THEMES = new Set<VisualThemeId>(['classic', 'emberwood']);

function isVisualTheme(value: unknown): value is VisualThemeId {
  return typeof value === 'string' && VALID_THEMES.has(value as VisualThemeId);
}

export function resolveVisualTheme(search: string, buildDefault: unknown): VisualThemeId {
  const query = new URLSearchParams(search).get('visual');
  if (isVisualTheme(query)) return query;
  return isVisualTheme(buildDefault) ? buildDefault : 'classic';
}

export function themedAssetPath(
  url: string,
  theme: VisualThemeId,
  catalog: VisualThemeCatalog,
): string {
  if (theme === 'classic') return url;
  const leadingSlash = url.startsWith('/') ? '/' : '';
  const logical = url.replace(/^\/+/, '');
  const replacement = catalog[theme]?.[logical];
  return replacement ? `${leadingSlash}${replacement}` : url;
}
```

- [ ] **Step 2: Implement the browser bridge**

Create `src/visual_theme.ts`:

```ts
import { VISUAL_THEME_CATALOG } from './visual_theme_catalog.generated';
import {
  resolveVisualTheme,
  themedAssetPath,
  type VisualThemeId,
} from './visual_theme_core';

const search = typeof location === 'undefined' ? '' : location.search;
const buildDefault = import.meta.env.VITE_VISUAL_THEME;

export const ACTIVE_VISUAL_THEME: VisualThemeId = resolveVisualTheme(search, buildDefault);

export function visualAssetPath(url: string): string {
  return themedAssetPath(url, ACTIVE_VISUAL_THEME, VISUAL_THEME_CATALOG);
}

export function applyVisualTheme(root: HTMLElement): void {
  root.dataset.visualTheme = ACTIVE_VISUAL_THEME;
}
```

- [ ] **Step 3: Implement the manifest generator**

Create `scripts/build_visual_theme_manifest.mjs`:

```js
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const specsDir = path.join(root, 'scripts/assets/specs');
const out = path.join(root, 'src/visual_theme_catalog.generated.ts');
const catalog = {};

for (const name of readdirSync(specsDir).filter((file) => file.endsWith('.json')).sort()) {
  const spec = JSON.parse(readFileSync(path.join(specsDir, name), 'utf8'));
  if (!spec.visualTheme) continue;
  if (!Array.isArray(spec.replacements)) {
    throw new Error(`${name}: visualTheme specs require replacements[]`);
  }
  const theme = (catalog[spec.visualTheme] ??= {});
  for (const row of spec.replacements) {
    if (!row.from || !row.to) throw new Error(`${name}: replacement needs from/to`);
    if (theme[row.from]) throw new Error(`${name}: duplicate replacement ${row.from}`);
    const item = spec.items.find((entry) => entry.out === row.to);
    if (!item) throw new Error(`${name}: ${row.to} is not produced by items[]`);
    theme[row.from] = row.to;
  }
}

for (const [theme, entries] of Object.entries(catalog)) {
  for (const target of Object.values(entries)) {
    if (!existsSync(path.join(root, 'public', target))) {
      console.warn(`[visual-theme] ${theme} target not built yet: ${target}`);
    }
  }
}

writeFileSync(
  out,
  `// Generated by scripts/build_visual_theme_manifest.mjs. Do not edit by hand.\n` +
    `export const VISUAL_THEME_CATALOG = ${JSON.stringify(catalog, null, 2)} as const;\n`,
);
console.log(`generated ${path.relative(root, out)}`);
```

- [ ] **Step 4: Add build scripts and generate the empty catalog**

Add to `package.json`:

```json
"assets:theme-manifest": "node scripts/build_visual_theme_manifest.mjs"
```

Prepend `npm run assets:theme-manifest &&` to both `pretest` and `build` before the media-manifest generation. Then run:

```bash
npm run assets:theme-manifest
npx vitest run tests/visual_theme.test.ts
```

Expected: the generator creates `src/visual_theme_catalog.generated.ts`; the test passes.

- [ ] **Step 5: Commit the theme core**

```bash
git add package.json scripts/build_visual_theme_manifest.mjs src/visual_theme_core.ts src/visual_theme.ts src/visual_theme_catalog.generated.ts tests/visual_theme.test.ts
git commit -m "feat(render): add visual theme resolver" -m "Generate path replacements from asset specs and expose a pure, tested theme gate for render and UI consumers."
```

## Task 4: Wire themed media loading and the DOM gate

**Files:**
- Modify: `src/render/assets/media.ts`
- Modify: `src/main.ts`
- Modify: `tests/render_asset_fallback.test.ts`
- Test: `tests/visual_theme.test.ts`
- Test: `tests/render_asset_fallback.test.ts`

- [ ] **Step 1: Add the failing media-resolution test**

In `tests/render_asset_fallback.test.ts`, add an assertion that production resolution receives the themed logical path before looking in `MEDIA_ASSETS`. Keep the test on the exported pure helper, not `window.location`.

Expected assertion:

```ts
expect(resolveMediaLogicalPath('/models/props/house_1.glb', 'classic')).toBe(
  'models/props/house_1.glb',
);
```

The generated catalog is still empty at this task boundary. Task 8 proves the real Emberwood mapping after Task 5 declares it and Tasks 6 and 7 build its target.

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/render_asset_fallback.test.ts
```

Expected: FAIL because `resolveMediaLogicalPath` is not exported.

- [ ] **Step 3: Update media resolution**

Modify `src/render/assets/media.ts` so its complete public behavior is:

```ts
import { ACTIVE_VISUAL_THEME, visualAssetPath } from '../../visual_theme';
import type { VisualThemeId } from '../../visual_theme_core';
import { themedAssetPath } from '../../visual_theme_core';
import { VISUAL_THEME_CATALOG } from '../../visual_theme_catalog.generated';
import { MEDIA_ASSETS } from './manifest.generated';

function logicalPath(url: string): string {
  return url.replace(/^\/+/, '');
}

export function resolveMediaLogicalPath(url: string, theme: VisualThemeId): string {
  return logicalPath(themedAssetPath(url, theme, VISUAL_THEME_CATALOG));
}

export function assetUrl(url: string): string {
  const themed = visualAssetPath(url);
  const logical = logicalPath(themed);
  if (import.meta.env.DEV) return `/${logical}`;
  return MEDIA_ASSETS[logical] ?? `/${logical}`;
}

export { ACTIVE_VISUAL_THEME };
```

- [ ] **Step 4: Stamp the root before the first UI paint**

Import `applyVisualTheme` in `src/main.ts` and call it inside the existing pre-paint bootstrap IIFE before `ThemeStore` writes inline variables:

```ts
applyVisualTheme(document.documentElement);
```

Do not add a helper function to `main.ts`.

- [ ] **Step 5: Run targeted tests and commit**

```bash
npx vitest run tests/visual_theme.test.ts tests/render_asset_fallback.test.ts tests/render_asset_preload.test.ts
npm run check:ts
git add src/main.ts src/render/assets/media.ts tests/render_asset_fallback.test.ts
git commit -m "feat(render): route media through visual themes" -m "Resolve Emberwood replacements before content hashing and stamp the active theme before the first interface paint."
```

Expected: all targeted tests and TypeScript pass.

## Task 5: Author the Eastbrook asset-build specification

**Files:**
- Create: `scripts/assets/specs/emberwood_eastbrook.json`
- Create: `tests/emberwood_assets.test.ts`
- Modify: `CREDITS.md`
- Modify generated: `src/visual_theme_catalog.generated.ts`

- [ ] **Step 1: Create the complete source and replacement catalog**

Create `scripts/assets/specs/emberwood_eastbrook.json` with this top-level shape:

```json
{
  "visualTheme": "emberwood",
  "note": "Project-owned Emberwood Chronicle Eastbrook identity proof. Raw DCC exports live under tmp/asset_src/emberwood and are not shipped.",
  "defaults": { "type": "static", "maxTex": 512 },
  "items": [
    { "src": "tmp/asset_src/emberwood/eastbrook/house_a.glb", "out": "models/emberwood/eastbrook/house_a.glb" },
    { "src": "tmp/asset_src/emberwood/eastbrook/house_b.glb", "out": "models/emberwood/eastbrook/house_b.glb" },
    { "src": "tmp/asset_src/emberwood/eastbrook/house_c.glb", "out": "models/emberwood/eastbrook/house_c.glb" },
    { "src": "tmp/asset_src/emberwood/eastbrook/forge.glb", "out": "models/emberwood/eastbrook/forge.glb" },
    { "src": "tmp/asset_src/emberwood/eastbrook/inn.glb", "out": "models/emberwood/eastbrook/inn.glb" },
    { "src": "tmp/asset_src/emberwood/eastbrook/well.glb", "out": "models/emberwood/eastbrook/well.glb" },
    { "src": "tmp/asset_src/emberwood/eastbrook/market_stall_a.glb", "out": "models/emberwood/eastbrook/market_stall_a.glb" },
    { "src": "tmp/asset_src/emberwood/eastbrook/market_stall_b.glb", "out": "models/emberwood/eastbrook/market_stall_b.glb" },
    { "src": "tmp/asset_src/emberwood/eastbrook/market_cart.glb", "out": "models/emberwood/eastbrook/market_cart.glb" },
    { "src": "tmp/asset_src/emberwood/eastbrook/fence.glb", "out": "models/emberwood/eastbrook/fence.glb" },
    { "src": "tmp/asset_src/emberwood/eastbrook/bonfire.glb", "out": "models/emberwood/eastbrook/bonfire.glb" },
    { "src": "tmp/asset_src/emberwood/eastbrook/crate.glb", "out": "models/emberwood/eastbrook/crate.glb" },
    { "src": "tmp/asset_src/emberwood/eastbrook/barrel.glb", "out": "models/emberwood/eastbrook/barrel.glb" },
    { "src": "tmp/asset_src/emberwood/eastbrook/anvil.glb", "out": "models/emberwood/eastbrook/anvil.glb" },
    { "src": "tmp/asset_src/emberwood/eastbrook/lantern.glb", "out": "models/emberwood/eastbrook/lantern.glb" },
    { "src": "tmp/asset_src/emberwood/foliage/oak_1.glb", "out": "models/emberwood/foliage/oak_1.glb" },
    { "src": "tmp/asset_src/emberwood/foliage/oak_2.glb", "out": "models/emberwood/foliage/oak_2.glb" },
    { "src": "tmp/asset_src/emberwood/foliage/oak_3.glb", "out": "models/emberwood/foliage/oak_3.glb" },
    { "src": "tmp/asset_src/emberwood/foliage/pine_1.glb", "out": "models/emberwood/foliage/pine_1.glb" },
    { "src": "tmp/asset_src/emberwood/foliage/pine_2.glb", "out": "models/emberwood/foliage/pine_2.glb" },
    { "src": "tmp/asset_src/emberwood/foliage/rock_1.glb", "out": "models/emberwood/foliage/rock_1.glb" },
    { "src": "tmp/asset_src/emberwood/foliage/rock_2.glb", "out": "models/emberwood/foliage/rock_2.glb" },
    { "src": "tmp/asset_src/emberwood/foliage/bush.glb", "out": "models/emberwood/foliage/bush.glb" },
    { "src": "tmp/asset_src/emberwood/foliage/fern.glb", "out": "models/emberwood/foliage/fern.glb" },
    { "src": "tmp/asset_src/emberwood/chars/warrior.glb", "out": "models/emberwood/chars/warrior.glb", "type": "character", "maxTex": 1024 },
    { "src": "tmp/asset_src/emberwood/chars/mage.glb", "out": "models/emberwood/chars/mage.glb", "type": "character", "maxTex": 1024 },
    { "src": "tmp/asset_src/emberwood/chars/bandit.glb", "out": "models/emberwood/chars/bandit.glb", "type": "character", "maxTex": 1024 },
    { "src": "tmp/asset_src/emberwood/creatures/wolf.glb", "out": "models/emberwood/creatures/wolf.glb", "type": "character", "maxTex": 512 },
    { "src": "tmp/asset_src/emberwood/weapons/sword.glb", "out": "models/emberwood/weapons/sword.glb", "maxTex": 256 },
    { "src": "tmp/asset_src/emberwood/weapons/shield.glb", "out": "models/emberwood/weapons/shield.glb", "maxTex": 256 },
    { "src": "tmp/asset_src/emberwood/weapons/staff.glb", "out": "models/emberwood/weapons/staff.glb", "maxTex": 256 },
    { "src": "tmp/asset_src/emberwood/terrain/grass_color.jpg", "out": "textures/emberwood/terrain/grass_color.jpg", "type": "copy" },
    { "src": "tmp/asset_src/emberwood/terrain/grass_normal.jpg", "out": "textures/emberwood/terrain/grass_normal.jpg", "type": "copy" },
    { "src": "tmp/asset_src/emberwood/terrain/dirt_color.jpg", "out": "textures/emberwood/terrain/dirt_color.jpg", "type": "copy" },
    { "src": "tmp/asset_src/emberwood/terrain/dirt_normal.jpg", "out": "textures/emberwood/terrain/dirt_normal.jpg", "type": "copy" },
    { "src": "tmp/asset_src/emberwood/terrain/rock_color.jpg", "out": "textures/emberwood/terrain/rock_color.jpg", "type": "copy" },
    { "src": "tmp/asset_src/emberwood/terrain/rock_normal.jpg", "out": "textures/emberwood/terrain/rock_normal.jpg", "type": "copy" },
    { "src": "tmp/asset_src/emberwood/env/vale_day_1k.hdr", "out": "env/emberwood/vale_day_1k.hdr", "type": "copy" },
    { "src": "tmp/asset_src/emberwood/env/vale_day_2k.hdr", "out": "env/emberwood/vale_day_2k.hdr", "type": "copy" },
    { "src": "tmp/asset_src/emberwood/env/vale_backdrop.webp", "out": "env/emberwood/vale_backdrop.webp", "type": "copy" },
    { "src": "tmp/asset_src/emberwood/env/vale_backdrop_4k.webp", "out": "env/emberwood/vale_backdrop_4k.webp", "type": "copy" }
  ],
  "replacements": [
    { "from": "models/props/house_1.glb", "to": "models/emberwood/eastbrook/house_a.glb" },
    { "from": "models/props/house_2.glb", "to": "models/emberwood/eastbrook/house_b.glb" },
    { "from": "models/props/house_3.glb", "to": "models/emberwood/eastbrook/house_c.glb" },
    { "from": "models/props/blacksmith.glb", "to": "models/emberwood/eastbrook/forge.glb" },
    { "from": "models/props/inn.glb", "to": "models/emberwood/eastbrook/inn.glb" },
    { "from": "models/props/well.glb", "to": "models/emberwood/eastbrook/well.glb" },
    { "from": "models/props/market_stand_1.glb", "to": "models/emberwood/eastbrook/market_stall_a.glb" },
    { "from": "models/props/market_stand_2.glb", "to": "models/emberwood/eastbrook/market_stall_b.glb" },
    { "from": "models/props/cart.glb", "to": "models/emberwood/eastbrook/market_cart.glb" },
    { "from": "models/props/fence.glb", "to": "models/emberwood/eastbrook/fence.glb" },
    { "from": "models/props/bonfire.glb", "to": "models/emberwood/eastbrook/bonfire.glb" },
    { "from": "models/props/crate_wooden.glb", "to": "models/emberwood/eastbrook/crate.glb" },
    { "from": "models/props/barrel.glb", "to": "models/emberwood/eastbrook/barrel.glb" },
    { "from": "models/props/anvil.glb", "to": "models/emberwood/eastbrook/anvil.glb" },
    { "from": "models/props/lantern_wall.glb", "to": "models/emberwood/eastbrook/lantern.glb" },
    { "from": "models/foliage/oak_1.glb", "to": "models/emberwood/foliage/oak_1.glb" },
    { "from": "models/foliage/oak_2.glb", "to": "models/emberwood/foliage/oak_2.glb" },
    { "from": "models/foliage/oak_3.glb", "to": "models/emberwood/foliage/oak_3.glb" },
    { "from": "models/foliage/oak_4.glb", "to": "models/emberwood/foliage/oak_1.glb" },
    { "from": "models/foliage/oak_5.glb", "to": "models/emberwood/foliage/oak_2.glb" },
    { "from": "models/foliage/pine_1.glb", "to": "models/emberwood/foliage/pine_1.glb" },
    { "from": "models/foliage/pine_2.glb", "to": "models/emberwood/foliage/pine_2.glb" },
    { "from": "models/foliage/pine_4.glb", "to": "models/emberwood/foliage/pine_1.glb" },
    { "from": "models/foliage/pine_5.glb", "to": "models/emberwood/foliage/pine_2.glb" },
    { "from": "models/foliage/rock_1.glb", "to": "models/emberwood/foliage/rock_1.glb" },
    { "from": "models/foliage/rock_2.glb", "to": "models/emberwood/foliage/rock_2.glb" },
    { "from": "models/foliage/rock_3.glb", "to": "models/emberwood/foliage/rock_1.glb" },
    { "from": "models/foliage/bush.glb", "to": "models/emberwood/foliage/bush.glb" },
    { "from": "models/foliage/bush_flowers.glb", "to": "models/emberwood/foliage/bush.glb" },
    { "from": "models/foliage/fern.glb", "to": "models/emberwood/foliage/fern.glb" },
    { "from": "models/chars/players/knight.glb", "to": "models/emberwood/chars/warrior.glb" },
    { "from": "models/chars/players/mage.glb", "to": "models/emberwood/chars/mage.glb" },
    { "from": "models/chars/players/rogue_hooded.glb", "to": "models/emberwood/chars/bandit.glb" },
    { "from": "models/creatures/wolf_basic.glb", "to": "models/emberwood/creatures/wolf.glb" },
    { "from": "models/weapons/sword_1handed.glb", "to": "models/emberwood/weapons/sword.glb" },
    { "from": "models/weapons/shield_round.glb", "to": "models/emberwood/weapons/shield.glb" },
    { "from": "models/weapons/staff.glb", "to": "models/emberwood/weapons/staff.glb" },
    { "from": "textures/terrain/Grass001_Color.jpg", "to": "textures/emberwood/terrain/grass_color.jpg" },
    { "from": "textures/terrain/Grass001_NormalGL.jpg", "to": "textures/emberwood/terrain/grass_normal.jpg" },
    { "from": "textures/terrain/Ground048_Color.jpg", "to": "textures/emberwood/terrain/dirt_color.jpg" },
    { "from": "textures/terrain/Ground048_NormalGL.jpg", "to": "textures/emberwood/terrain/dirt_normal.jpg" },
    { "from": "textures/terrain/Rock051_Color.jpg", "to": "textures/emberwood/terrain/rock_color.jpg" },
    { "from": "textures/terrain/Rock051_NormalGL.jpg", "to": "textures/emberwood/terrain/rock_normal.jpg" },
    { "from": "env/vale_day_1k.hdr", "to": "env/emberwood/vale_day_1k.hdr" },
    { "from": "env/vale_day_2k.hdr", "to": "env/emberwood/vale_day_2k.hdr" },
    { "from": "env/vale_backdrop.webp", "to": "env/emberwood/vale_backdrop.webp" },
    { "from": "env/vale_backdrop_4k.webp", "to": "env/emberwood/vale_backdrop_4k.webp" }
  ]
}
```

- [ ] **Step 2: Validate the exact one-to-one mappings**

Confirm each `from` path exists in the classic source tree and each `to` path matches an `items[].out` entry. Keep the explicit shared foliage mappings shown above; do not add runtime wildcard logic.

- [ ] **Step 3: Record provenance**

Add a row to `CREDITS.md` naming "EndlessGlory Emberwood Chronicle Eastbrook art" as project-owned original work. List any external brushes, HDR sources, or generators separately with their actual license and source URL.

- [ ] **Step 4: Verify generator warnings before assets exist**

```bash
npm run assets:theme-manifest
```

Expected: the catalog generates and prints one warning per unbuilt themed target. The next tasks remove all warnings.

- [ ] **Step 5: Add the failing existence contract before producing assets**

Create `tests/emberwood_assets.test.ts`:

```ts
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
```

Run:

```bash
npx vitest run tests/emberwood_assets.test.ts
```

Expected: FAIL because the catalog is complete but its themed outputs have not been produced yet.

- [ ] **Step 6: Commit the source catalog and red test**

```bash
git add CREDITS.md scripts/assets/specs/emberwood_eastbrook.json src/visual_theme_catalog.generated.ts tests/emberwood_assets.test.ts
git commit -m "docs(assets): catalog Emberwood Eastbrook replacements" -m "Declare every source, optimized output, logical replacement, and provenance record required by the first visual slice."
```

## Task 6: Produce and validate the Eastbrook world assets

**Files:**
- Create binary outputs under: `public/models/emberwood/eastbrook/`
- Create binary outputs under: `public/models/emberwood/foliage/`
- Create binary outputs under: `public/textures/emberwood/terrain/`
- Create binary outputs under: `public/env/emberwood/`
- Modify generated: `src/render/assets/manifest.generated.ts`
- Test: `tests/emberwood_assets.test.ts`

- [ ] **Step 1: Export original source art to the declared local paths**

Export every raw source declared in the spec to `tmp/asset_src/emberwood/`, including the Eastbrook kit, foliage, terrain, environment, Warrior, Mage, Bandit, Wolf, sword, shield, and staff. Preserve the existing prop footprint, origin, forward direction, and ground contact for every replacement. Preserve current skeletons, clip names, grip conventions, and portrait origins. Keep collision geometry in the simulation unchanged.

- [ ] **Step 2: Run the offline optimizer**

```bash
node scripts/assets/build_assets.mjs scripts/assets/specs/emberwood_eastbrook.json
npx vitest run tests/emberwood_assets.test.ts
```

Expected: every declared output is written under `public/`, and the existence contract passes. Task 7 performs the focused rig, clip, grip, and portrait validation before character and weapon outputs are committed.

- [ ] **Step 3: Generate runtime manifests**

```bash
npm run assets:theme-manifest
node scripts/build_media_manifest.mjs generate
npm run asset:budget
```

Expected: no missing-target warnings, the media manifest contains every `models/emberwood`, `textures/emberwood`, and `env/emberwood` output, and all current budget groups pass.

- [ ] **Step 4: Inspect the world kit in the existing asset viewer**

Use the existing editor or asset viewer to verify ground contact, orientation, material names, texture color space, and camera-distance silhouette. Reject assets with glossy plastic surfaces, uniform bevels, noisy microtexture, or mismatched scale.

- [ ] **Step 5: Commit world assets**

```bash
git add public/models/emberwood/eastbrook public/models/emberwood/foliage public/textures/emberwood/terrain public/env/emberwood src/render/assets/manifest.generated.ts src/visual_theme_catalog.generated.ts
git commit -m "feat(assets): add Emberwood Eastbrook world kit" -m "Ship the optimized settlement, foliage, terrain, and environment assets for the gated Eastbrook identity proof."
```

## Task 7: Produce and validate representative characters and weapons

**Files:**
- Create binary outputs under: `public/models/emberwood/chars/`
- Create binary outputs under: `public/models/emberwood/creatures/`
- Create binary outputs under: `public/models/emberwood/weapons/`
- Modify generated: `src/render/assets/manifest.generated.ts`
- Test: `tests/visual_manifest.test.ts`
- Test: `tests/emberwood_assets.test.ts`

- [ ] **Step 1: Export rig-compatible source assets**

Inspect the Warrior, Mage, Bandit, and Wolf source GLBs exported in Task 6. Humanoids must use the current medium humanoid skeleton, clip vocabulary, hand slots, and portrait-safe origin. Wolf must retain the clip names pinned by `WOLF_BAKED` in `src/render/characters/manifest.ts`. If any contract fails, correct the DCC source, re-export it to the same declared path, and rerun the full asset build.

- [ ] **Step 2: Export weapon replacements**

Inspect the sword, round shield, and staff exported in Task 6 in the live weapon inspector. If grip direction, hand alignment, or origin differs from the classic contract, correct the DCC source, re-export it to the same declared path, and rerun the full asset build.

- [ ] **Step 3: Optimize and validate animations**

```bash
node scripts/assets/build_assets.mjs scripts/assets/specs/emberwood_eastbrook.json
npx vitest run tests/emberwood_assets.test.ts tests/visual_manifest.test.ts tests/rig_merge_assets.test.ts tests/warrior_render_contract.test.ts
```

Expected: all required clips exist, skinning and rig merge remain valid, and warrior hand layouts still pass.

- [ ] **Step 4: Regenerate manifests and portraits**

```bash
npm run assets:theme-manifest
node scripts/build_media_manifest.mjs generate
ONLY=forest_wolf,bandit node scripts/render_finder_portraits.mjs
```

Expected: character paths resolve through the Emberwood catalog and representative portraits render without blank alpha.

- [ ] **Step 5: Commit character assets**

```bash
git add public/models/emberwood/chars public/models/emberwood/creatures public/models/emberwood/weapons public/ui/mobs src/render/assets/manifest.generated.ts src/visual_theme_catalog.generated.ts
git commit -m "feat(assets): add Emberwood Eastbrook characters" -m "Add rig-compatible heroic player, NPC, enemy, creature, and weapon art for the identity proof."
```

## Task 8: Extend the automated Emberwood asset contracts

**Files:**
- Modify: `tests/emberwood_assets.test.ts`
- Modify: `tests/render_asset_preload.test.ts`
- Test: `tests/emberwood_assets.test.ts`

- [ ] **Step 1: Extend the asset-contract test**

Replace the initial existence-only contract from Task 5 with this manifested-file, GLB-parse, and concept-evidence contract:

```ts
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { describe, expect, it } from 'vitest';
import { MEDIA_ASSETS } from '../src/render/assets/manifest.generated';
import { VISUAL_THEME_CATALOG } from '../src/visual_theme_catalog.generated';

const root = path.resolve(__dirname, '..');
const replacements = VISUAL_THEME_CATALOG.emberwood;

describe('Emberwood Eastbrook assets', () => {
  it('has a real, manifested file for every replacement target', () => {
    for (const [from, to] of Object.entries(replacements)) {
      expect(existsSync(path.join(root, 'public', to)), `${from} -> ${to}`).toBe(true);
      if (/^(models|textures|env|vfx)\//.test(to)) expect(MEDIA_ASSETS[to], to).toBeDefined();
    }
  });

  it('ships parseable meshopt-compatible GLBs', async () => {
    await MeshoptDecoder.ready;
    const io = new NodeIO()
      .registerExtensions(ALL_EXTENSIONS)
      .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
    for (const to of new Set(Object.values(replacements))) {
      if (!to.endsWith('.glb')) continue;
      const doc = await io.read(path.join(root, 'public', to));
      expect(doc.getRoot().listScenes().length, to).toBeGreaterThan(0);
    }
  });

  it('keeps the approved concept beside the design spec', () => {
    const png = readFileSync(
      path.join(root, 'docs/superpowers/specs/assets/endlessglory-emberwood-chronicle.png'),
    );
    expect(png.subarray(1, 4).toString('ascii')).toBe('PNG');
  });
});
```

- [ ] **Step 2: Run the test**

```bash
npx vitest run tests/emberwood_assets.test.ts
```

Expected: PASS after Tasks 6 and 7.

- [ ] **Step 3: Extend preload coverage**

Add an Emberwood assertion to `tests/render_asset_preload.test.ts` proving every classic preload URL resolves to either itself or an existing themed target. This prevents an import-time theme mismatch from recreating the historical missing-preload crash.

- [ ] **Step 4: Run asset and preload tests**

```bash
npx vitest run tests/emberwood_assets.test.ts tests/render_asset_preload.test.ts tests/render_glb_replacement_assets.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the contracts**

```bash
git add tests/emberwood_assets.test.ts tests/render_asset_preload.test.ts
git commit -m "test(assets): gate Emberwood replacements" -m "Require every themed target to exist, enter the production media manifest, parse as valid media, and stay covered by boot preloads."
```

## Task 9: Apply Emberwood lighting, terrain, and foliage policy

**Files:**
- Create: `src/render/emberwood/CLAUDE.md`
- Create: `src/render/emberwood/lighting.ts`
- Create: `src/render/emberwood/palette.ts`
- Create: `src/render/emberwood/index.ts`
- Modify: `src/render/renderer.ts`
- Modify: `src/render/terrain.ts`
- Modify: `src/render/foliage.ts`
- Create: `tests/emberwood_render_policy.test.ts`

- [ ] **Step 1: Write failing policy tests**

Create `tests/emberwood_render_policy.test.ts` with pure assertions for:

```ts
expect(lightingForTheme('emberwood').fogColor).toBe(0x607487);
expect(lightingForTheme('emberwood').sunColor).toBe(0xffd6a3);
expect(terrainPaletteForTheme('emberwood').vale.dirt).toBe(0x8a6845);
expect(foliagePaletteForTheme('emberwood').vale.oak).toBe(0x7f936f);
expect(lightingForTheme('classic')).toEqual(CLASSIC_LIGHTING);
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/emberwood_render_policy.test.ts
```

Expected: FAIL because the Emberwood policy modules do not exist.

- [ ] **Step 3: Implement pure policy modules**

Create `lighting.ts` and `palette.ts` as immutable data plus `lightingForTheme`, `terrainPaletteForTheme`, and `foliagePaletteForTheme` selectors. Export them through `src/render/emberwood/index.ts`. Put all local module rules in `src/render/emberwood/CLAUDE.md`: presentation only, no sim mutation, preserve low-tier information, no raw asset fetching, and no new methods in `renderer.ts`.

- [ ] **Step 4: Consume policies at existing construction points**

In `renderer.ts`, replace the fog, hemisphere, and sun literals with the selected lighting object. In `terrain.ts`, source `BIOME_PALETTE` from the selected terrain policy. In `foliage.ts`, source Vale oak, pine, rock, trunk, grass, and dressing tints from the selected foliage policy. Leave placement, LOD, colliders, and animation unchanged.

- [ ] **Step 5: Run tests and commit**

```bash
npx vitest run tests/emberwood_render_policy.test.ts tests/map_terrain.test.ts tests/render_budget.test.ts tests/critters.test.ts
npm run check:ts
git add src/render/emberwood src/render/renderer.ts src/render/terrain.ts src/render/foliage.ts tests/emberwood_render_policy.test.ts
git commit -m "feat(render): apply Emberwood world lighting" -m "Use pure theme policies for Eastbrook light, terrain, and foliage without changing simulation placement or graphics-tier fairness."
```

Expected: targeted tests and TypeScript pass.

## Task 10: Redesign the always-visible HUD and representative icons

**Files:**
- Create: `src/styles/emberwood.tokens.css`
- Create: `src/styles/emberwood.hud.css`
- Modify: `src/styles/index.css`
- Modify: `src/ui/theme.ts`
- Modify: `src/ui/icons.ts`
- Modify: `src/main.ts`
- Create binary: `public/ui/emberwood/skills/warrior/*.webp`
- Create binary: `public/ui/emberwood/skills/mage/*.webp`
- Create binary: `public/ui/emberwood/items/*.webp`
- Modify: `tests/theme.test.ts`
- Modify: `tests/skill_icons.test.ts`
- Modify: `tests/item_icons.test.ts`

- [ ] **Step 1: Add the Emberwood preset test**

Extend `tests/theme.test.ts` to require:

```ts
expect(PRESET_ORDER).toContain('emberwood');
expect(THEME_PRESETS.emberwood).toMatchObject({
  accent: '#c99a4a',
  border: '#6f4b32',
  panel: '#171b18',
  text: '#e7d7b8',
  textMuted: '#b8aa91',
});
expect(parseTheme(null, 'emberwood')).toEqual({ preset: 'emberwood', custom: {} });
expect(parseTheme({ preset: 'classic', custom: { accent: '#123456' } }, 'emberwood')).toEqual({
  preset: 'classic',
  custom: { accent: '#123456' },
});
```

Run `npx vitest run tests/theme.test.ts` and verify it fails.

- [ ] **Step 2: Add the semantic preset and scoped tokens**

Add `emberwood` to `PresetId`, `PRESET_ORDER`, and `THEME_PRESETS` in `src/ui/theme.ts`. Change the persistence API to:

```ts
export function parseTheme(
  raw: unknown,
  fallbackPreset: PresetId = DEFAULT_PRESET,
): ThemeState

export class ThemeStore {
  constructor(defaultPreset: PresetId = DEFAULT_PRESET)
}
```

For absent, corrupt, or invalid persisted data, `parseTheme` must return the validated `fallbackPreset`; valid persisted presets and valid custom overrides still win. The constructor passes `defaultPreset` to `parseTheme`.

At both existing `new ThemeStore()` sites in `src/main.ts`, instantiate with:

```ts
new ThemeStore(ACTIVE_VISUAL_THEME === 'emberwood' ? 'emberwood' : DEFAULT_PRESET)
```

Import `ACTIVE_VISUAL_THEME` and `DEFAULT_PRESET` through their existing modules. This prevents the classic inline variables from overriding Emberwood scoped tokens for a first-time player while preserving every saved user choice.

Create `emberwood.tokens.css` under `@layer tokens` with `:root[data-visual-theme="emberwood"]` definitions for soot, moss, oak, ember, brass, parchment, smoke blue, and oxblood. Keep resource and semantic state colors compatible with existing contrast repair.

- [ ] **Step 3: Add scoped HUD chrome**

Create `emberwood.hud.css` under `@layer components`. Scope every selector beneath `:root[data-visual-theme="emberwood"]`. Restyle existing frames through background, border-image or gradients, corner accents, shadows, and radii only. Do not move HUD regions or change hit targets in this task.

Import both files from `src/styles/index.css` immediately after their classic counterparts so scoped rules win only when the root attribute matches.

- [ ] **Step 4: Resolve painted icons through the visual theme**

In `src/ui/icons.ts`, apply `visualAssetPath` to the return values of `abilityImageUrl`, `itemImageUrl`, and `deedImageUrl`. Keep procedural fallbacks unchanged.

- [ ] **Step 5: Produce representative painted art**

Create approved WebP source art under `tmp/asset_src/emberwood/ui/` using bold silhouettes, calm backgrounds, and the approved Emberwood spell language. Add these exact `items` rows to `emberwood_eastbrook.json`:

```json
{ "src": "tmp/asset_src/emberwood/ui/skills/warrior/attack.webp", "out": "ui/emberwood/skills/warrior/attack.webp", "type": "copy" },
{ "src": "tmp/asset_src/emberwood/ui/skills/warrior/heroic_strike.webp", "out": "ui/emberwood/skills/warrior/heroic_strike.webp", "type": "copy" },
{ "src": "tmp/asset_src/emberwood/ui/skills/warrior/battle_shout.webp", "out": "ui/emberwood/skills/warrior/battle_shout.webp", "type": "copy" },
{ "src": "tmp/asset_src/emberwood/ui/skills/warrior/charge.webp", "out": "ui/emberwood/skills/warrior/charge.webp", "type": "copy" },
{ "src": "tmp/asset_src/emberwood/ui/skills/warrior/thunder_clap.webp", "out": "ui/emberwood/skills/warrior/thunder_clap.webp", "type": "copy" },
{ "src": "tmp/asset_src/emberwood/ui/skills/mage/frostbolt.webp", "out": "ui/emberwood/skills/mage/frostbolt.webp", "type": "copy" },
{ "src": "tmp/asset_src/emberwood/ui/skills/mage/fireball.webp", "out": "ui/emberwood/skills/mage/fireball.webp", "type": "copy" },
{ "src": "tmp/asset_src/emberwood/ui/skills/mage/arcane_intellect.webp", "out": "ui/emberwood/skills/mage/arcane_intellect.webp", "type": "copy" },
{ "src": "tmp/asset_src/emberwood/ui/skills/mage/frost_nova.webp", "out": "ui/emberwood/skills/mage/frost_nova.webp", "type": "copy" },
{ "src": "tmp/asset_src/emberwood/ui/skills/mage/blink.webp", "out": "ui/emberwood/skills/mage/blink.webp", "type": "copy" },
{ "src": "tmp/asset_src/emberwood/ui/skills/mage/polymorph.webp", "out": "ui/emberwood/skills/mage/polymorph.webp", "type": "copy" },
{ "src": "tmp/asset_src/emberwood/ui/items/backpack.webp", "out": "ui/emberwood/items/backpack.webp", "type": "copy" },
{ "src": "tmp/asset_src/emberwood/ui/items/minor_healing_potion.webp", "out": "ui/emberwood/items/minor_healing_potion.webp", "type": "copy" },
{ "src": "tmp/asset_src/emberwood/ui/items/lesser_mana_potion.webp", "out": "ui/emberwood/items/lesser_mana_potion.webp", "type": "copy" },
{ "src": "tmp/asset_src/emberwood/ui/items/eastbrook_chain_vest.webp", "out": "ui/emberwood/items/eastbrook_chain_vest.webp", "type": "copy" }
```

Add these exact `replacements` rows:

```json
{ "from": "ui/skills/warrior/attack.webp", "to": "ui/emberwood/skills/warrior/attack.webp" },
{ "from": "ui/skills/warrior/heroic_strike.webp", "to": "ui/emberwood/skills/warrior/heroic_strike.webp" },
{ "from": "ui/skills/warrior/battle_shout.webp", "to": "ui/emberwood/skills/warrior/battle_shout.webp" },
{ "from": "ui/skills/warrior/charge.webp", "to": "ui/emberwood/skills/warrior/charge.webp" },
{ "from": "ui/skills/warrior/thunder_clap.webp", "to": "ui/emberwood/skills/warrior/thunder_clap.webp" },
{ "from": "ui/skills/mage/frostbolt.webp", "to": "ui/emberwood/skills/mage/frostbolt.webp" },
{ "from": "ui/skills/mage/fireball.webp", "to": "ui/emberwood/skills/mage/fireball.webp" },
{ "from": "ui/skills/mage/arcane_intellect.webp", "to": "ui/emberwood/skills/mage/arcane_intellect.webp" },
{ "from": "ui/skills/mage/frost_nova.webp", "to": "ui/emberwood/skills/mage/frost_nova.webp" },
{ "from": "ui/skills/mage/blink.webp", "to": "ui/emberwood/skills/mage/blink.webp" },
{ "from": "ui/skills/mage/polymorph.webp", "to": "ui/emberwood/skills/mage/polymorph.webp" },
{ "from": "ui/items/backpack.webp", "to": "ui/emberwood/items/backpack.webp" },
{ "from": "ui/items/minor_healing_potion.webp", "to": "ui/emberwood/items/minor_healing_potion.webp" },
{ "from": "ui/items/lesser_mana_potion.webp", "to": "ui/emberwood/items/lesser_mana_potion.webp" },
{ "from": "ui/items/eastbrook_chain_vest.webp", "to": "ui/emberwood/items/eastbrook_chain_vest.webp" }
```

Run the full asset spec once so its validation proves every replacement target is declared and built:

```bash
node scripts/assets/build_assets.mjs scripts/assets/specs/emberwood_eastbrook.json
npm run assets:theme-manifest
```

- [ ] **Step 6: Extend icon guards and commit**

Update `tests/skill_icons.test.ts` and `tests/item_icons.test.ts` so themed images must be valid WebP files and each mapping points to a wired classic ID. Run:

```bash
npm run assets:skills
npm run assets:items
npm run assets:theme-manifest
npx vitest run tests/theme.test.ts tests/skill_icons.test.ts tests/item_icons.test.ts tests/hud_perf_budget.test.ts
npm run check:ts
```

Expected: all tests pass and no foreign image formats remain in the themed UI directories.

Commit:

```bash
git add src/styles/emberwood.tokens.css src/styles/emberwood.hud.css src/styles/index.css src/ui/theme.ts src/ui/icons.ts src/main.ts public/ui/emberwood scripts/assets/specs/emberwood_eastbrook.json src/visual_theme_catalog.generated.ts tests/theme.test.ts tests/skill_icons.test.ts tests/item_icons.test.ts
git commit -m "feat(ui): add Emberwood HUD identity" -m "Apply the soot, leather, brass, and parchment system to existing HUD contracts and replace representative icons without changing interaction layout."
```

## Task 11: Capture deterministic visual evidence

**Files:**
- Modify: `scripts/visual_tour.mjs`
- Create: `docs/screenshots/emberwood-eastbrook/classic-desktop.png`
- Create: `docs/screenshots/emberwood-eastbrook/emberwood-desktop.png`
- Create: `docs/screenshots/emberwood-eastbrook/emberwood-mobile.png`
- Create: `docs/screenshots/emberwood-eastbrook/emberwood-low.png`

- [ ] **Step 1: Make the tour theme-aware**

At the top of `scripts/visual_tour.mjs`, derive:

```js
const VISUAL_THEME = process.env.VISUAL_THEME ?? 'classic';
const OUT = process.env.OUT ?? `docs/screenshots/emberwood-eastbrook/${VISUAL_THEME}`;
const base = process.env.GAME_URL ?? 'http://localhost:5173';
const URL = `${base}${base.includes('?') ? '&' : '?'}visual=${VISUAL_THEME}`;
fs.mkdirSync(OUT, { recursive: true });
```

Replace each `tmp/tNN_name.png` path with `${OUT}/tNN_name.png`. Make the script exit nonzero when `errors.length > 0`.

- [ ] **Step 2: Capture the classic control**

Run the dev server, then:

```bash
VISUAL_THEME=classic OUT=docs/screenshots/emberwood-eastbrook/classic node scripts/visual_tour.mjs
```

Expected: the classic screenshot set is written with no console or page errors.

- [ ] **Step 3: Capture Emberwood desktop and low-tier evidence**

```bash
VISUAL_THEME=emberwood OUT=docs/screenshots/emberwood-eastbrook/desktop node scripts/visual_tour.mjs
GAME_URL='http://localhost:5173/?gfx=low' VISUAL_THEME=emberwood OUT=docs/screenshots/emberwood-eastbrook/low node scripts/visual_tour.mjs
```

Expected: Eastbrook, wolf combat, character, spellbook, quest, vendor, and map captures exist in both runs with no errors.

- [ ] **Step 4: Capture mobile evidence**

Update `scripts/mobile_visual.mjs` to accept the same `VISUAL_THEME` query parameter and output directory, then run:

```bash
VISUAL_THEME=emberwood OUT=docs/screenshots/emberwood-eastbrook/mobile node scripts/mobile_visual.mjs
```

Expected: the mobile HUD and More tray remain usable, uncropped, and visually coherent.

- [ ] **Step 5: Review against the acceptance checklist**

Review screenshots against `docs/superpowers/specs/2026-07-19-endlessglory-asset-redesign-design.md` Section 12. Reject the slice if it mixes classic and Emberwood assets in one player-facing view, loses class or enemy silhouettes, reduces path readability, hides interaction points, or misses the warm-settlement and cool-wilderness relationship.

- [ ] **Step 6: Commit evidence**

```bash
git add scripts/visual_tour.mjs scripts/mobile_visual.mjs docs/screenshots/emberwood-eastbrook
git commit -m "test(visual): capture Emberwood Eastbrook proof" -m "Record classic, desktop, mobile, and low-tier browser evidence for the approved identity and readability gates."
```

## Task 12: Run the release gates and deploy a preview

**Files:**
- Verify all files changed by Tasks 2 through 11.
- Update only if findings require it: `docs/superpowers/specs/2026-07-19-endlessglory-asset-redesign-design.md`

- [ ] **Step 1: Run targeted visual and asset tests**

```bash
npx vitest run tests/visual_theme.test.ts tests/emberwood_assets.test.ts tests/emberwood_render_policy.test.ts tests/render_asset_fallback.test.ts tests/render_asset_preload.test.ts tests/visual_manifest.test.ts tests/theme.test.ts tests/skill_icons.test.ts tests/item_icons.test.ts tests/hud_perf_budget.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run type, build, and budget checks**

```bash
npm run check:types
npm run build
npm run asset:budget
git diff --check
```

Expected: all commands pass; the build emits hashed Emberwood media.

- [ ] **Step 3: Run the full repository gate**

```bash
npm run gate
```

Expected: PASS. Fix only regressions introduced by this slice.

- [ ] **Step 4: Deploy a gated Vercel preview**

Deploy the feature branch to Vercel preview with the classic build default and preserve the deployment output:

```bash
mkdir -p tmp
VITE_VISUAL_THEME=classic npx vercel --yes | tee tmp/emberwood-vercel-deploy.txt
```

Open the exact Preview URL printed by Vercel three times: once unchanged, once with `?visual=classic`, and once with `?visual=emberwood` appended. Expected: the unchanged and explicit-classic routes match; Emberwood loads only when explicitly selected; all three enter Eastbrook without console errors.

- [ ] **Step 5: Perform live browser acceptance**

Verify desktop and mobile at the preview host. Confirm the exact deployed asset URLs return success, the media files are content-hashed, the branded title remains EndlessGlory, and the Emberwood screenshot differs materially from the classic control.

- [ ] **Step 6: Record the production-default decision**

If every acceptance gate passes, change the production Vercel environment to `VITE_VISUAL_THEME=emberwood` in the release deployment task. Do not remove `?visual=classic` until at least one production rollback window has passed.

- [ ] **Step 7: Final commit if gate fixes changed files**

```bash
git status --short
git add -u
git commit -m "fix(visual): close Emberwood release gaps" -m "Resolve the concrete issues found by the full gate and deployed browser acceptance without expanding slice scope."
```

Because Task 1 created a dedicated clean feature worktree, `git add -u` stages only tracked files corrected during release gating. Inspect the status output first and stop if it contains unrelated edits. Skip this commit when the tree is already clean; add any newly created gate evidence by its exact path in the earlier evidence commit instead of staging all untracked files.

## Completion definition

The Eastbrook slice is complete when:

- Classic remains intact and selectable.
- Emberwood replaces the full visible Eastbrook world, representative characters, combat art, always-visible HUD, and representative icons as one coherent path.
- All mapped assets exist, are optimized, are manifested, and pass current media budgets.
- Desktop, mobile, low-tier, reduced-motion, grayscale, and colorblind review preserve gameplay information.
- The full gate passes.
- A real Vercel preview proves both theme routes and contains no console errors.
- The approved browser screenshots are committed under `docs/screenshots/emberwood-eastbrook/`.

## Follow-on plans after Eastbrook approval

Only after this plan passes, write separate implementation plans for:

1. Full playable class, NPC, creature, weapon, portrait, and combat-VFX breadth.
2. Remaining outdoor biomes, settlements, resources, tools, and quest objects.
3. Dungeons, delves, bosses, specialized VFX, and long-tail UI art.

Each follow-on plan must use the measured Eastbrook budgets, accepted asset-production throughput, and observed browser bottlenecks rather than estimates made before Slice A.
