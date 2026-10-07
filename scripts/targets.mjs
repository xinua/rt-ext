// Browsers the extension builds for, and how each build differs. Everything
// else (Angular pages, background, content script) is the same source.

import { readFileSync } from 'node:fs';

export const TARGETS = {
  chrome: { esbuild: 'chrome120' },
  firefox: { esbuild: 'firefox140' },
};

/** The `--target=<browser>` argument; chrome when absent. */
export function targetArg(fallback = 'chrome') {
  const target = process.argv.find((arg) => arg.startsWith('--target='))?.split('=')[1] ?? fallback;
  if (!(target in TARGETS)) {
    console.error(`Unknown target "${target}". Use one of: ${Object.keys(TARGETS).join(', ')}.`);
    process.exit(1);
  }
  return target;
}

/** Where a target's unpacked extension is built; load this folder in the browser. */
export const outDir = (target) => `dist/${target}`;

/** manifest/base.json with manifest/<target>.json laid over it (top-level keys replace). */
export function buildManifest(target) {
  const read = (name) => JSON.parse(readFileSync(`manifest/${name}.json`, 'utf8'));
  return { ...read('base'), ...read(target) };
}
