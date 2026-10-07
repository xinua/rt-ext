// Read access to the settings the options page writes, for the background
// worker and the content script. Same area and defaults as StorageService.
import { DEFAULT_STORAGE } from '../app/shared/constants/defaults.const';
import type { SettingsModel } from '../app/options/shared/models/forms.model';
import type { StorageModel } from '../app/shared/models/storage.model';
import { ext } from './ext';

const area = ext.storage.local;

export async function readStorage(): Promise<StorageModel> {
  // Passing the defaults object makes the area fill in every key that was never written.
  const stored = await area.get<StorageModel>({ ...DEFAULT_STORAGE });
  return { ...DEFAULT_STORAGE, ...stored };
}

export function hasAppUrl(storage: Pick<StorageModel, 'settings'>): boolean {
  return !!storage.settings.appUrl?.trim();
}

/** Calls `listener` with whether the app URL is set, now and on every settings change. */
export function watchAppUrl(listener: (isSet: boolean) => void): void {
  area.onChanged.addListener((changes) => {
    if (!changes['settings']) return;
    const settings =
      (changes['settings'].newValue as SettingsModel | undefined) ?? DEFAULT_STORAGE.settings;
    listener(hasAppUrl({ settings }));
  });
  void readStorage().then((storage) => listener(hasAppUrl(storage)));
}
