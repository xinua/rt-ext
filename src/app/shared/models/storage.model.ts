import { DownloadModel, SettingsModel } from '../../options/shared/models/forms.model';

export interface StorageModel {
  settings: SettingsModel;
  videoPreset: DownloadModel;
  audioPreset: DownloadModel;
}
