import { InjectionToken } from '@angular/core';
import { ext } from '../../../shared/ext';

/** The extension storage area the app reads and writes. Injected so tests can pass a fake. */
export const STORAGE_AREA = new InjectionToken<chrome.storage.StorageArea>('STORAGE_AREA', {
  providedIn: 'root',
  factory: () => ext.storage.local,
});

/** Per-tab media captured by the background worker. Read-only from the app. */
export const SESSION_STORAGE_AREA = new InjectionToken<chrome.storage.StorageArea>(
  'SESSION_STORAGE_AREA',
  {
    providedIn: 'root',
    factory: () => ext.storage.session,
  },
);
