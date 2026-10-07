/**
 * The browser being built for, replaced by esbuild (scripts/build-scripts.mjs).
 * Only the background and content bundles get it, so it is declared for them
 * alone (tsconfig.scripts.json); Angular code builds once for every browser.
 */
declare const __BROWSER__: 'chrome' | 'firefox';
