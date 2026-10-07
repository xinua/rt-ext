// Decides whether a response is downloadable media. Pure, so it can be tested
// without Chrome.

import type { MediaItem, MediaKind } from '../shared/media';

/** Progressive files smaller than this are ads, UI sounds and previews. */
export const MIN_FILE_SIZE = 100 * 1024;

const EXTENSIONS: Record<string, MediaKind> = {
  m3u8: 'hls',
  mpd: 'dash',
  mp4: 'video',
  webm: 'video',
  mp3: 'audio',
  m4a: 'audio',
  aac: 'audio',
  ogg: 'audio',
};

const MIME_TYPES: Record<string, MediaKind> = {
  'application/vnd.apple.mpegurl': 'hls',
  'application/x-mpegurl': 'hls',
  'audio/mpegurl': 'hls',
  'audio/x-mpegurl': 'hls',
  'application/dash+xml': 'dash',
  'video/mp4': 'video',
  'video/webm': 'video',
  'audio/mpeg': 'audio',
  'audio/mp4': 'audio',
  'audio/x-m4a': 'audio',
  'audio/aac': 'audio',
  'audio/ogg': 'audio',
  'audio/webm': 'audio',
};

/** Stream segments: one video is hundreds of these, and the manifest already covers them. */
const SEGMENT_EXTENSIONS = new Set(['ts', 'm4s', 'm4v', 'm4f', 'cmfv', 'cmfa']);

/** Hosts whose media is handled by the page URL instead (YouTube). */
const IGNORED_HOSTS = ['googlevideo.com'];

export interface MediaResponse {
  url: string;
  type: `${chrome.webRequest.ResourceType}`;
  statusCode: number;
  responseHeaders?: chrome.webRequest.HttpHeader[];
}

export function detectMedia(response: MediaResponse): Omit<MediaItem, 'detectedAt'> | null {
  if (response.statusCode < 200 || response.statusCode >= 300) return null;

  let url: URL;
  try {
    url = new URL(response.url);
  } catch {
    return null;
  }
  if (!url.protocol.startsWith('http')) return null;
  if (IGNORED_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
    return null;
  }

  const extension = url.pathname.split('.').pop()?.toLowerCase() ?? '';
  if (SEGMENT_EXTENSIONS.has(extension)) return null;

  const mime = header(response, 'content-type')?.split(';')[0].trim().toLowerCase();
  const kind = (mime && MIME_TYPES[mime]) || EXTENSIONS[extension];
  if (!kind) return null;

  if (kind === 'hls' || kind === 'dash') return { url: response.url, kind, mime };

  // Players built on Media Source Extensions (hls.js, dash.js, shaka) fetch
  // segments with XHR/fetch, while a real file is loaded by <video>/<audio>.
  if (response.type === 'xmlhttprequest') return null;

  const size = fileSize(response);
  if (size !== undefined && size < MIN_FILE_SIZE) return null;

  return { url: response.url, kind, mime, size };
}

function header(response: MediaResponse, name: string): string | undefined {
  return response.responseHeaders?.find((h) => h.name.toLowerCase() === name)?.value;
}

/** A 206 response only carries a chunk; the full size is after the slash in Content-Range. */
function fileSize(response: MediaResponse): number | undefined {
  const total = header(response, 'content-range')?.split('/')[1];
  const value = total && total !== '*' ? total : header(response, 'content-length');
  const size = Number(value);

  return value && Number.isFinite(size) ? size : undefined;
}
