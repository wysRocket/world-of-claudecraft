import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildVisualThemeCatalog,
  collectMissingVisualThemeTargetWarnings,
  isVisualThemeCatalogFresh,
  serializeVisualThemeCatalog,
} from './lib/visual_theme_manifest.mjs';

const root = process.cwd();
const specsDir = path.join(root, 'scripts/assets/specs');
const out = path.join(root, 'src/visual_theme_catalog.generated.ts');
const mode = process.argv.slice(2);

if (mode.length > 1 || (mode.length === 1 && mode[0] !== '--check')) {
  throw new Error('usage: node scripts/build_visual_theme_manifest.mjs [--check]');
}

const files = readdirSync(specsDir)
  .filter((name) => name.endsWith('.json'))
  .map((name) => ({ name, source: readFileSync(path.join(specsDir, name), 'utf8') }));
const catalog = buildVisualThemeCatalog(files);
const generated = serializeVisualThemeCatalog(catalog);

for (const warning of collectMissingVisualThemeTargetWarnings(
  catalog,
  path.join(root, 'public'),
  existsSync,
)) {
  console.warn(warning);
}

if (mode[0] === '--check') {
  const current = existsSync(out) ? readFileSync(out, 'utf8') : '';
  if (!isVisualThemeCatalogFresh(current, generated)) {
    console.error(
      `[visual-theme] ${path.relative(root, out)} is stale; run npm run assets:theme-manifest`,
    );
    process.exitCode = 1;
  } else {
    console.log(`verified ${path.relative(root, out)}`);
  }
} else {
  writeFileSync(out, generated);
  console.log(`generated ${path.relative(root, out)}`);
}
