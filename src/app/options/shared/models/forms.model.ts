import { FormControl } from "@angular/forms";

export interface SettingsModel {
  appUrl: string;
  openApp: boolean;
  useSubfolder: boolean;
  useNamePrefix: boolean;
  showQuality: boolean;
}

export interface DownloadModel {
  type: DownloadType;
  quality: VideoQuality | AudioQuality;
  format: VideoFormats | AudioFormats;
  codec?: Codecs;
}

export interface SettingsFormModel {
  appUrl: FormControl<string>;
  openApp: FormControl<boolean>;
  useSubfolder: FormControl<boolean>;
  useNamePrefix: FormControl<boolean>;
  showQuality: FormControl<boolean>;
}

export interface DownloadFormModel {
  type: FormControl<DownloadType>;
  quality: FormControl<VideoQuality | AudioQuality>;
  format: FormControl<VideoFormats | AudioFormats>;
  codec?: FormControl<Codecs>;
}

export interface CardFormModel {
  type: FormControl<DownloadType>;
  quality: FormControl<VideoQuality | AudioQuality>;
  format: FormControl<VideoFormats | AudioFormats>;
  codec?: FormControl<Codecs>;
  folder: FormControl<string | null>;
  prefix: FormControl<string | null>;
}

export interface CardFormValue {
  type: DownloadType;
  quality: VideoQuality | AudioQuality;
  format: VideoFormats | AudioFormats;
  codec?: Codecs;
  folder: string | null;
  prefix: string | null;
}

export enum DownloadType {
  VIDEO = 'video',
  AUDIO = 'audio',
}

export enum VideoFormats {
  AUTO = 'auto',
  MP4 = 'mp4',
  MKV = 'mkv',
}

export enum AudioFormats {
  AUTO = 'auto',
  MP3 = 'mp3',
  M4A = 'm4a',
  OPUS = 'opus',
  WAV = 'wav',
  FLAC = 'flac',
}

export enum Codecs {
  AUTO = 'auto',
  H264 = 'h264',
  H265 = 'h265',
  AV1 = 'av1',
  VP9 = 'vp9',
}

export enum VideoQuality {
  BEST = 'best',
  UHD = '2160p',
  QHD = '1440p',
  FHD = '1080p',
  HD = '720p',
  SD = '480p',
  NHD = '360p',
  QVGA = '240p',
  WORST = 'worst',
}

export enum AudioQuality {
  BEST = 'best',
  HQ = '320kbps',
  MQ = '192kbps',
  LQ = '128kbps',
}

export interface FoldersModel {
  root: string;
  folders: string[];
}