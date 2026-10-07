import { AudioFormats, AudioQuality, DownloadType, VideoFormats, VideoQuality } from "../../options/shared/models/forms.model";
import { Nullable } from "./common.model";
import { DownloadSource } from "./downloads.model";

export interface DownloadPayload {
  url: string;
  type: DownloadType;
  format: VideoFormats | AudioFormats;
  codec?: Codecs;
  folder: Nullable<string>;
  prefix: Nullable<string>;
  ytdlpArgs: Nullable<string>;
}

export interface DownloadResult {
  ok: boolean;
  /** What the pasted URL turned out to be. */
  kind: 'video' | 'playlist' | 'channel';
  playlistId: Nullable<string>;
  playlistTitle: Nullable<string>;
  queued: number;
  /** True when the source held more videos than the server will queue. */
  truncated: boolean;
  limit: number;
  downloads: DownloadModel[];
}

/** Answer of GET /api/downloads/lookup. */
export type DownloadLookup = Record<DownloadType, DownloadModel[]>;

export interface DownloadModel {
  id: number;
  watcherId: Nullable<number>;
  channelId: Nullable<string>;
  channelName: Nullable<string>;
  videoId: Nullable<string>;
  title: Nullable<string>;
  url: string;
  status: DownloadStatus;
  source: DownloadSource;
  platform: Platform;
  type: Nullable<DownloadType>;
  format: Nullable<VideoFormats | AudioFormats | 'jpg'>;
  codec: Nullable<Codecs>;
  quality: Nullable<VideoQuality | AudioQuality>;
  mediaQuality: Nullable<string>;
  mediaCodec: Nullable<string>;
  folder: Nullable<string>;
  prefix: Nullable<string>;
  ytdlpArgs: Nullable<string>;
  clipStart: Nullable<string>;
  clipEnd: Nullable<string>;
  removeSponsor: boolean;
  splitChapters: boolean;
  /** Set when the row came from expanding a playlist or channel URL. */
  playlistId: Nullable<string>;
  playlistTitle: Nullable<string>;
  playlistIndex: Nullable<number>;
  /** Video length in seconds; null for live streams. */
  duration: Nullable<number>;
  progress: number;
  speed: Nullable<string>;
  eta: Nullable<string>;
  totalBytes: Nullable<number>;
  filePath: Nullable<string>;
  fileExists?: boolean;
  avatarPath: Nullable<string>;
  thumbnailPath: Nullable<string>;
  authorUrl: Nullable<string>;
  error: Nullable<string>;
  createdAt: string;
  startedAt: Nullable<string>;
  finishedAt: Nullable<string>;
}

export enum DownloadStatus {
  TOTAL = 'total',
  QUEUED = 'queued',
  RUNNING = 'running',
  DONE = 'done',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export enum Platform {
  YOUTUBE = 'youtube',
  TIKTOK = 'tiktok',
  INSTAGRAM = 'instagram',
  /** A site yt-dlp handles but the app has no special knowledge of. */
  UNKNOWN = 'unknown',
}

export enum Codecs {
  AUTO = 'auto',
  H264 = 'h264',
  H265 = 'h265',
  AV1 = 'av1',
  VP9 = 'vp9',
}
