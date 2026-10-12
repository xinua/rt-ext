// Decides which captured source a played segment belongs to. Pure, so it can
// be tested without Chrome.
//
// Players resolve segment URLs relative to the manifest, so a segment usually
// lives in the manifest's directory or below it (a master playlist's variants
// often sit in subfolders). The deepest matching directory wins; a DASH
// BaseURL or a segment CDN on another host matches nothing, and then no source
// is marked rather than a wrong one.

import type { MediaItem } from '../shared/media';

/**
 * Index of the item a segment request belongs to, or -1. A progressive file
 * matches its own URL. Ties between manifests in one directory go to the one
 * from the requesting frame, then to the latest captured.
 */
export function findPlaying(
  items: readonly MediaItem[],
  segmentUrl: string,
  frameId?: number,
): number {
  const segment = pathOf(segmentUrl);
  if (!segment) return -1;

  let best = -1;
  let bestScore: readonly number[] = [];

  items.forEach((item, index) => {
    const depth = matchDepth(item, segmentUrl, segment);
    if (depth < 0) return;

    const score = [depth, Number(item.frameId === frameId), index];
    if (best < 0 || isGreater(score, bestScore)) {
      best = index;
      bestScore = score;
    }
  });

  return best;
}

/** How specific the match is (longer is closer), or -1 for none. */
function matchDepth(item: MediaItem, segmentUrl: string, segment: string): number {
  if (item.url === segmentUrl) return Number.MAX_SAFE_INTEGER;
  if (item.kind !== 'hls' && item.kind !== 'dash') return -1;

  const path = pathOf(item.url);
  if (!path) return -1;

  const directory = path.slice(0, path.lastIndexOf('/') + 1);
  return segment.startsWith(directory) ? directory.length : -1;
}

/** Origin and path, without the query: signed tokens differ between a manifest and its segments. */
function pathOf(url: string): string | null {
  try {
    const { origin, pathname } = new URL(url);
    return origin + pathname;
  } catch {
    return null;
  }
}

function isGreater(a: readonly number[], b: readonly number[]): boolean {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}
