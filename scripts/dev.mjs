// Runs the three watchers the extension needs and makes sure they go down
// together. Backgrounding them with `&` from an npm script leaks them: Ctrl+C
// kills only the foreground build, and the stray esbuild watchers keep writing
// into tmp/ext-scripts behind your back.
//
//   node scripts/dev.mjs --target=firefox    (chrome when omitted)

import { spawn } from 'node:child_process';
import { targetArg } from './targets.mjs';

const NG = 'node_modules/@angular/cli/bin/ng.js';

const target = targetArg();

const children = [
  ['scripts/build-scripts.mjs', `--target=${target}`, '--watch'],
  ['scripts/dev-reload.mjs', `--target=${target}`],
  [NG, 'build', '--watch', '--configuration', `development,${target}`],
].map((args) => spawn(process.execPath, args, { stdio: 'inherit' }));

let stopping = false;

function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('exit', stop);

// If one watcher dies on its own, take the rest with it rather than leaving a
// half-running dev setup that looks fine but never rebuilds.
for (const child of children) child.on('exit', stop);
