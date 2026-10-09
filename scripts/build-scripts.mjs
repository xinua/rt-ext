// Bundles the extension's non-Angular parts: the background script, the
// content script and the app bridge. Each entry and everything it imports lands in one file,
// because browsers load content scripts as classic scripts — they cannot
// `import` anything at runtime. Angular's own `scripts` option only takes
// plain .js and does not bundle, so it can't do this.
//
// Also writes the target's manifest.json next to them, merged from manifest/.
//
//   node scripts/build-scripts.mjs --target=firefox            one-off build (minified)
//   node scripts/build-scripts.mjs --target=firefox --watch    rebuild on change (with sourcemaps)

import { mkdirSync, watch as watchDir, writeFileSync } from 'node:fs';
import * as esbuild from 'esbuild';
import { buildManifest, targetArg, TARGETS } from './targets.mjs';

const watch = process.argv.includes('--watch');
const target = targetArg();

// Angular copies this folder into dist/<target>/ (see assets in angular.json).
const OUT_DIR = 'tmp/ext-scripts';

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: [
    { in: 'src/background/main.ts', out: 'background' },
    { in: 'src/content/main.ts', out: 'content-script' },
    { in: 'src/content/styles.css', out: 'content-script' },
    { in: 'src/content/app-bridge.ts', out: 'app-bridge' },
  ],
  outdir: OUT_DIR,
  bundle: true,
  format: 'iife',
  target: TARGETS[target].esbuild,
  minify: !watch,
  define: {
    // Compiles the src/dev/ live-reload client out of production builds.
    __DEV__: String(watch),
    __BROWSER__: JSON.stringify(target),
  },
  sourcemap: watch ? 'inline' : false,
  logLevel: 'info',
};

function writeManifest() {
  try {
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(`${OUT_DIR}/manifest.json`, JSON.stringify(buildManifest(target), null, 2));
    console.log(`[manifest] ${target}`);
  } catch (error) {
    // While watching, a half-saved JSON file must not take the watcher down.
    if (!watch) throw error;
    console.error('[manifest]', error.message);
  }
}

writeManifest();

if (watch) {
  watchDir('manifest', writeManifest);
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
