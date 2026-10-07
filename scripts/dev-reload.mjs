// Dev-only live reload for the unpacked extension. Watches the build output
// and tells the running extension what to do about each change:
//
//   page       Angular rebuilt the popup/options bundle. The open extension
//              page reloads itself; the extension stays loaded.
//   extension  The manifest, background or content script changed. Only
//              runtime.reload() picks those up, and the tabs running
//              the content script need re-injecting afterwards.
//
// The clients live in src/dev/ and are compiled out of production builds.
//
//   node scripts/dev-reload.mjs --target=firefox    (chrome when omitted)

import { existsSync, watch } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { WebSocketServer } from 'ws';
import { outDir, targetArg } from './targets.mjs';

/** Keep in sync with DEV_RELOAD_URL in src/dev/dev-socket.ts. */
const PORT = 8788;
const OUT_DIR = outDir(targetArg());
const DEBOUNCE_MS = 150;
const KEEPALIVE_MS = 20_000;

// Paths (relative to OUT_DIR) that the browser only re-reads on a full
// extension reload. Everything else in OUT_DIR is Angular output.
const NEEDS_EXTENSION_RELOAD = new Set([
  'manifest.json',
  'background.js',
  'content-script.js',
  'content-script.css',
]);

const server = new WebSocketServer({ host: '127.0.0.1', port: PORT });
server.on('listening', () => console.log(`[dev-reload] ws://127.0.0.1:${PORT}`));

function broadcast(scope) {
  const message = JSON.stringify({ scope });
  for (const client of server.clients) {
    if (client.readyState === client.OPEN) client.send(message);
  }
}

// Chrome tears the service worker down after 30s idle, but WebSocket traffic
// resets that timer — so the background client survives between edits.
setInterval(() => broadcast('ping'), KEEPALIVE_MS).unref();

while (!existsSync(OUT_DIR)) {
  console.log(`[dev-reload] waiting for ${OUT_DIR}/ to appear...`);
  await delay(1000);
}

let changed = new Set();
let timer;

function flush() {
  const files = [...changed];
  changed = new Set();

  const scope = files.some((file) => NEEDS_EXTENSION_RELOAD.has(file)) ? 'extension' : 'page';
  console.log(`[dev-reload] ${scope}: ${files.join(', ')}`);
  broadcast(scope);
}

watch(OUT_DIR, { recursive: true }, (_event, filename) => {
  // A rebuild touches a dozen files; coalesce them into one reload.
  if (!filename || filename.endsWith('.map')) return;

  changed.add(filename.split('\\').join('/'));
  clearTimeout(timer);
  timer = setTimeout(flush, DEBOUNCE_MS);
});
