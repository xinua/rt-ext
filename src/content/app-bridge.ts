// App bridge entry, injected into the Retriever app's pages (registered by
// src/background/app-bridge.ts). Says hello on load, and again whenever the app
// pings, so the app hears it whichever of the two loads first.

import { APP_SOURCE, EXTENSION_SOURCE } from '../shared/app-bridge';
import { ext } from '../shared/ext';

const version = ext.runtime.getManifest().version;

const hello = () =>
  window.postMessage({ source: EXTENSION_SOURCE, type: 'hello', version }, location.origin);

window.addEventListener('message', (e) => {
  if (e.source === window && e.data?.source === APP_SOURCE && e.data.type === 'ping') hello();
});

hello();
