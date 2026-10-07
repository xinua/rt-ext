// Background entry: a service worker in Chrome, an event page in Firefox.
// Listeners must be registered synchronously at the top level, or the browser
// will not wake the background for those events.

import { registerContextMenu } from './context-menu';
import { registerInstall } from './install';
import { registerMediaTracker } from './media-tracker';
import { registerMessages } from './messages';

registerContextMenu();
registerInstall();
registerMediaTracker();
registerMessages();

if (__DEV__) {
  void import('../dev/background-reload').then(({ connectBackgroundReload }) =>
    connectBackgroundReload(),
  );
}
