import { InjectionToken } from '@angular/core';
import { ext } from '../../../shared/ext';

/** The tab the popup was opened on. Injected so tests can pass a fake. */
export const ACTIVE_TAB = new InjectionToken<Promise<chrome.tabs.Tab | undefined>>('ACTIVE_TAB', {
  providedIn: 'root',
  factory: () => ext.tabs.query({ active: true, currentWindow: true }).then(([tab]) => tab),
});
