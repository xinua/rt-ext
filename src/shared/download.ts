// The body of POST /api/downloads, built from the stored presets and settings.
// Shared by the popup and the background worker so both send the same thing.
import { DownloadType, type SettingsModel } from '../app/options/shared/models/forms.model';
import type { DownloadPayload, DownloadSource, StorageModel } from '../app/shared/models';

export function downloadPayload(
  storage: StorageModel,
  source: DownloadSource,
  type: DownloadType,
): DownloadPayload {
  const { settings } = storage;
  return {
    url: source.url,
    ...(type === DownloadType.VIDEO ? storage.videoPreset : storage.audioPreset),
    folder: downloadFolder(settings, source),
    prefix: settings.useNamePrefix ? source.prefix : null,
    // The server splits these like a shell does, so the quotes keep the URL one argument.
    ytdlpArgs: source.referer ? `--referer "${source.referer}"` : null,
    ...requestFlags(storage, source),
  };
}

/**
 * Where the app saves a download: the incognito folder for an incognito tab
 * when one is set, otherwise the site subfolder when that is on. The popup's
 * form starts from this too, and whatever the user picks there wins.
 */
export function downloadFolder(settings: SettingsModel, source: DownloadSource): string | null {
  const incognitoFolder = settings.incognitoFolder && settings.incognitoFolderName?.trim();
  if (source.incognito && incognitoFolder) return incognitoFolder;
  return settings.useSubfolder ? source.folder : null;
}

/** What every request from the extension carries, whatever its options. */
export function requestFlags(
  storage: StorageModel,
  source: DownloadSource,
): Pick<DownloadPayload, 'source' | 'hidden'> {
  return { source: 'extension', hidden: !!storage.settings.hideIncognito && !!source.incognito };
}
