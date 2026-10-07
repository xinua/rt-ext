// The only writer of captured media. Mutations happen synchronously on an
// in-memory copy, so bursts of requests can't overwrite each other, and each
// tab is flushed to chrome.storage.session after a short debounce. Session
// storage (not memory) is the source of truth: the worker is killed when idle.

import { ext } from '../shared/ext';
import { mediaKey, type MediaItem } from '../shared/media';

const FLUSH_DELAY = 250;
const MAX_ITEMS_PER_TAB = 50;

const area = ext.storage.session;
const cache = new Map<number, MediaItem[]>();
const loading = new Map<number, Promise<MediaItem[]>>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

export async function addMedia(tabId: number, item: MediaItem): Promise<void> {
  const items = await load(tabId);
  // The tab may have navigated or closed while loading.
  if (cache.get(tabId) !== items) return;
  if (items.some((existing) => existing.url === item.url)) return;

  items.push(item);
  if (items.length > MAX_ITEMS_PER_TAB) items.shift();
  scheduleFlush(tabId);
}

/** Starts a tab over, e.g. after it navigated to a new page. */
export async function resetMedia(tabId: number): Promise<void> {
  cancelFlush(tabId);
  const previous = cache.get(tabId);
  cache.set(tabId, []);

  // Skip the write for the common case: a tab known to have no media. An
  // unknown tab (the worker restarted) may still have the old page stored.
  if (!previous || previous.length) {
    await area.remove(mediaKey(tabId));
  }
  await setBadge(tabId, 0);
}

export async function forgetMedia(tabId: number): Promise<void> {
  cancelFlush(tabId);
  cache.delete(tabId);
  await area.remove(mediaKey(tabId));
}

function load(tabId: number): Promise<MediaItem[]> {
  const cached = cache.get(tabId);
  if (cached) return Promise.resolve(cached);

  let pending = loading.get(tabId);
  if (!pending) {
    const key = mediaKey(tabId);
    pending = area
      .get<Record<string, MediaItem[]>>(key)
      .catch(() => ({}) as Record<string, MediaItem[]>)
      .then((stored) => {
        loading.delete(tabId);
        // A reset while loading wins over what was stored.
        if (!cache.has(tabId)) cache.set(tabId, stored[key] ?? []);
        return cache.get(tabId)!;
      });
    loading.set(tabId, pending);
  }

  return pending;
}

function scheduleFlush(tabId: number): void {
  if (timers.has(tabId)) return;

  timers.set(
    tabId,
    setTimeout(() => {
      timers.delete(tabId);
      void flush(tabId);
    }, FLUSH_DELAY),
  );
}

function cancelFlush(tabId: number): void {
  clearTimeout(timers.get(tabId));
  timers.delete(tabId);
}

async function flush(tabId: number): Promise<void> {
  const items = cache.get(tabId);
  if (!items) return;

  try {
    // A copy, so later in-place mutations never leak into what was written.
    await area.set({ [mediaKey(tabId)]: [...items] });
    await setBadge(tabId, items.length);
  } catch (error) {
    console.warn('[Retriever] Failed to save media for tab', tabId, error);
  }
}

async function setBadge(tabId: number, count: number): Promise<void> {
  // Rejects when the tab is already gone; nothing to show then.
  await ext.action.setBadgeText({ tabId, text: count ? String(count) : '' }).catch(() => undefined);
}
