// Media captured from tab requests. The background service worker is the only
// writer (chrome.storage.session, one key per tab); the popup only reads.

export type MediaKind = 'hls' | 'dash' | 'video' | 'audio';

export interface MediaItem {
  url: string;
  kind: MediaKind;
  mime?: string;
  /** Full file size in bytes, when the server reported it. */
  size?: number;
  /** The frame that requested the media; many CDNs refuse requests without it. */
  referer?: string;
  detectedAt: number;
}

export type MediaKey = `media:${number}`;

export const mediaKey = (tabId: number): MediaKey => `media:${tabId}`;

/** Detection needs host access to every site; it is optional and requested from the popup. */
export const DETECTION_PERMISSIONS: chrome.permissions.Permissions = { origins: ['<all_urls>'] };
