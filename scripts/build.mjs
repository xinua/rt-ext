// Production build: the unpacked extension in dist/<target>/ and a store-ready
// zip next to it in dist/. Builds every browser unless one is named.
//
//   node scripts/build.mjs                    chrome and firefox
//   node scripts/build.mjs --target=firefox   just one

import { execFileSync } from 'node:child_process';
import { outDir, targetArg, TARGETS } from './targets.mjs';

const NG = 'node_modules/@angular/cli/bin/ng.js';
const WEB_EXT = 'node_modules/web-ext/bin/web-ext.js';

const named = process.argv.some((arg) => arg.startsWith('--target='));
const targets = named ? [targetArg()] : Object.keys(TARGETS);

const run = (...args) => execFileSync(process.execPath, args, { stdio: 'inherit' });

// One target at a time: they share tmp/ext-scripts.
for (const target of targets) {
  console.log(`\n=== ${target} ===`);
  run('scripts/build-scripts.mjs', `--target=${target}`);
  run(NG, 'build', '--configuration', `production,${target}`);
  run(
    WEB_EXT,
    'build',
    '--source-dir',
    outDir(target),
    '--artifacts-dir',
    'dist',
    '--filename',
    `retriever-{version}-${target}.zip`,
    '--overwrite-dest',
  );
}
