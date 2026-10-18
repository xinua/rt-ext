import { DownloadModel, AppModel, SettingsModel } from '../../options/shared/models/forms.model';

export interface StorageModel {
  app: AppModel;
  settings: SettingsModel;
  videoPreset: DownloadModel;
  audioPreset: DownloadModel;
}
