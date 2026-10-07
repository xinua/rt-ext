import { AudioFormats, AudioQuality, Codecs, DownloadModel, DownloadType, SettingsModel, VideoFormats, VideoQuality } from '../../options/shared/models/forms.model';
import { StorageModel } from '../models';

export const DEFAULT_SETTINGS: Readonly<SettingsModel> = {
  appUrl: '',
  openApp: false,
  useSubfolder: false,
  useNamePrefix: false,
  showQuality: true,
};

export const DEFAULT_VIDEO_PRESET: Readonly<DownloadModel> = {
  type: DownloadType.VIDEO,
  quality: VideoQuality.BEST,
  format: VideoFormats.AUTO,
  codec: Codecs.AUTO,
};

export const DEFAULT_AUDIO_PRESET: Readonly<DownloadModel> = {
  type: DownloadType.AUDIO,
  quality: AudioQuality.BEST,
  format: AudioFormats.MP3,
};

export const DEFAULT_STORAGE: Readonly<StorageModel> = {
  settings: DEFAULT_SETTINGS,
  videoPreset: DEFAULT_VIDEO_PRESET,
  audioPreset: DEFAULT_AUDIO_PRESET,
};

/** The only keys the app persists; anything else in the storage area is ignored. */
export const STORAGE_KEYS = Object.keys(DEFAULT_STORAGE) as (keyof StorageModel)[];
