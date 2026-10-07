// Test-only stand-ins for the chrome.storage areas, so specs never touch the
// `chrome` global (it does not exist outside the extension).

import { Provider } from '@angular/core';
import { SESSION_STORAGE_AREA, STORAGE_AREA } from '../app/shared/tokens';

type Listener = (changes: Record<string, chrome.storage.StorageChange>) => void;

/** Minimal `chrome.storage.StorageArea` stand-in: keeps a plain object and notifies listeners. */
export function createFakeArea(initial: Record<string, unknown> = {}) {
  let items = { ...initial };
  const listeners = new Set<Listener>();

  const notify = (changes: Record<string, chrome.storage.StorageChange>) =>
    listeners.forEach((listener) => listener(changes));

  return {
    get items() {
      return items;
    },
    emit: notify,
    listenerCount: () => listeners.size,
    area: {
      get: async (keys?: string | string[] | Record<string, unknown> | null) => {
        if (keys == null) return { ...items };
        if (typeof keys === 'string') keys = [keys];
        if (Array.isArray(keys)) {
          return Object.fromEntries(keys.filter((key) => key in items).map((key) => [key, items[key]]));
        }
        return { ...keys, ...items };
      },
      set: async (patch: Record<string, unknown>) => {
        items = { ...items, ...patch };
        notify(
          Object.fromEntries(Object.entries(patch).map(([key, newValue]) => [key, { newValue }])),
        );
      },
      remove: async (keys: string[]) => {
        keys.forEach((key) => delete items[key]);
        notify(Object.fromEntries(keys.map((key) => [key, {}])));
      },
      clear: async () => {
        items = {};
      },
      onChanged: {
        addListener: (listener: Listener) => listeners.add(listener),
        removeListener: (listener: Listener) => listeners.delete(listener),
      },
    } as unknown as chrome.storage.StorageArea,
  };
}

/** Empty local and session areas, for specs that only need the app to boot. */
export function provideFakeStorage(): Provider[] {
  return [
    { provide: STORAGE_AREA, useValue: createFakeArea().area },
    { provide: SESSION_STORAGE_AREA, useValue: createFakeArea().area },
  ];
}
