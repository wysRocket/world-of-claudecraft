// Standalone post-build applier for the i18n lazy-locale modulepreload templating.
//
// Runs as its own step in `npm run build` AFTER `vite build` has fully exited, so
// dist/.vite/manifest.json is guaranteed flushed to disk. This deliberately avoids
// doing the templating inside a Vite `closeBundle` hook: under rolldown-vite the
// manifest writer and a 'post'-ordered closeBundle hook race, and on Vercel's build
// container the manifest was not yet visible to a fresh readFileSync when the hook
// ran (ENOENT on dist/.vite/manifest.json -> build failed). A separate process after
// the build removes the ordering dependency entirely. See i18n_modulepreload.mjs for
// the resolve/template helpers (unit-tested by tests/i18n_modulepreload.test.ts).
import path from 'node:path';
import { templateModulepreload } from './i18n_modulepreload.mjs';

const root = process.cwd();
const outDir = path.resolve(root, 'dist');
const base = '/';

const { map } = await templateModulepreload({ root, outDir, base });
// eslint-disable-next-line no-console
console.log(
  `[i18n] modulepreload: templated ${Object.keys(map).length} locale chunk URLs into index.html`,
);
