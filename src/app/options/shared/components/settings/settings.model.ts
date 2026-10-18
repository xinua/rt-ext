import { Nullable } from '../../../../shared/models';
import { SettingsFormModel } from '../../models/forms.model';

export interface SettingsOption {
  value: keyof SettingsFormModel;
  label: string;
  shortLabel: string;
  tooltip?: string;
  enabled: boolean;
  icon: string;
}

export interface AppSettingsModel {
  id?: number;
  enabled: boolean;
  webhookUrl: Nullable<string>;
  downloadsDir: Nullable<string>;
  cookiesPath: Nullable<string>;
  ytdlpArgs: Nullable<string>;
  ytdlpConcurrency: number;
  /** IANA zone poll hours are read in. `null` means the server's own clock. */
  timeZone: Nullable<string>;
  telegramEnabled?: boolean;
  telegramBotToken?: Nullable<string>;
  /** Null means api.telegram.org; anything else is a local Bot API server. */
  telegramApiUrl?: Nullable<string>;
  /** Keep a file the bot sent in the downloads folder instead of deleting it. */
  telegramKeepFiles?: boolean;
  telegramNoDescription?: boolean;
  notifyDownloadFailed?: boolean;
  updatedAt?: Date;
  createdAt?: Date;
}
