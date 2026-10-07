// The body of POST /api/downloads, built from the stored presets and settings.
// Shared by the popup and the background worker so both send the same thing.
import { DownloadType } from '../app/options/shared/models/forms.model';
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
    folder: settings.useSubfolder ? source.folder : null,
    prefix: settings.useNamePrefix ? source.prefix : null,
    // The server splits these like a shell does, so the quotes keep the URL one argument.
    ytdlpArgs: source.referer ? `--referer "${source.referer}"` : null,
  };
}
