// Content script entry, injected into YouTube pages (see manifest.json).

import { watchAppUrl } from '../shared/storage';
import { injectAll, setEnabled, setLastPlayer } from './player-menu';

// Capture phase: runs before YouTube's handler opens and measures the menu,
// so the popup gets sized with our items included.
document.addEventListener(
  'contextmenu',
  (e) => {
    const player = e.target instanceof Element && e.target.closest('.html5-video-player');
    if (!player) return;
    setLastPlayer(player);
    injectAll();
  },
  true,
);

// Fallback for menus YouTube creates lazily or re-renders.
new MutationObserver((mutations) => {
  for (const m of mutations) {
    for (const node of m.addedNodes) {
      if (!(node instanceof Element)) continue;
      if (
        node.matches('.ytp-contextmenu, .ytp-panel-menu') ||
        node.querySelector('.ytp-contextmenu')
      ) {
        injectAll();
        return;
      }
    }
  }
}).observe(document.documentElement, { childList: true, subtree: true });

watchAppUrl(setEnabled);

if (__DEV__) {
  void import('../dev/content-ping').then(({ answerDevPing }) => answerDevPing());
}
