// Watches every tab's requests for downloadable media. webRequest only reports
// requests to hosts the extension has access to, so nothing is captured until
// the user grants the optional <all_urls> permission from the popup; the
// listeners start receiving events as soon as it is granted.

import { ext } from '../shared/ext';
import { detectMedia, isSegment } from './media-detect';
import { addMedia, forgetMedia, markPlaying, resetMedia } from './media-store';

const FILTER: chrome.webRequest.RequestFilter = {
  urls: ['<all_urls>'],
  types: ['media', 'xmlhttprequest', 'other'],
};

/** Referer per in-flight request, handed from onSendHeaders to onHeadersReceived. */
const referers = new Map<string, string>();

export function registerMediaTracker(): void {
  ext.webRequest.onSendHeaders.addListener(
    (details) => {
      if (details.tabId < 0) return;
      const referer = details.requestHeaders?.find((h) => h.name.toLowerCase() === 'referer');
      if (referer?.value) referers.set(details.requestId, referer.value);
    },
    FILTER,
    // Chrome hides Referer from webRequest without `extraHeaders`; Firefox
    // always shows it and rejects the option as unknown.
    __BROWSER__ === 'chrome' ? ['requestHeaders', 'extraHeaders'] : ['requestHeaders'],
  );

  ext.webRequest.onHeadersReceived.addListener(
    (details) => {
      const referer = referers.get(details.requestId);
      referers.delete(details.requestId);
      if (details.tabId < 0) return;

      const { tabId, frameId } = details;
      const media = detectMedia(details);
      if (media) {
        const added = addMedia(tabId, { ...media, referer, frameId, detectedAt: Date.now() });
        // A media element loading a file is playing it; a manifest is often only preloaded.
        if (media.kind === 'video' || media.kind === 'audio') {
          void added.then(() => markPlaying(tabId, media.url, frameId));
        }
      } else if (isSegment(details)) {
        void markPlaying(tabId, details.url, frameId);
      }
    },
    FILTER,
    ['responseHeaders'],
  );

  ext.webRequest.onErrorOccurred.addListener(
    (details) => referers.delete(details.requestId),
    FILTER,
  );

  // A new document in the tab: the old page's media is no longer there.
  ext.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId === 0) void resetMedia(details.tabId);
  });

  ext.tabs.onRemoved.addListener((tabId) => void forgetMedia(tabId));
}
