import { DownloadStatus, Label } from '@shared';
import { DownloadType } from '../../../../options/shared/models/forms.model';
import { DownloadState } from './media-card.model';

export const LabelIconColors: Record<Label, string> = {
  [Label.PAGE]: 'text-white!',
  [Label.VIDEO_PAGE]: 'text-red-500!',
  [Label.PLAYLIST]: 'text-blue-500',
  [Label.HLS]: 'text-yellow-500!',
  [Label.DASH]: 'text-purple-500!',
  [Label.VIDEO]: 'text-orange-400!',
  [Label.AUDIO]: 'text-pink-500!',
};
export const LABEL_ICONS: Record<Label, string> = {
  [Label.PAGE]: 'web',
  [Label.VIDEO_PAGE]: 'movie',
  [Label.PLAYLIST]: 'playlist_play',
  [Label.HLS]: 'stream',
  [Label.DASH]: 'stream',
  [Label.VIDEO]: 'play_arrow',
  [Label.AUDIO]: 'music_note',
};
export const LabelClasses: Record<Label, string> = {
  [Label.PAGE]: 'ring-red-500/70 bg-red-500/15 text-red-500',
  [Label.VIDEO_PAGE]: 'ring-red-500/70 bg-red-500/15 text-red-500',
  [Label.PLAYLIST]: 'ring-blue-500/70 bg-blue-500/15 text-blue-500',
  [Label.HLS]: 'ring-yellow-500/70 bg-yellow-500/15 text-yellow-500',
  [Label.DASH]: 'ring-purple-500/70 bg-purple-500/15 text-purple-500',
  [Label.VIDEO]: 'ring-orange-500/70 bg-orange-500/15 text-orange-500',
  [Label.AUDIO]: 'ring-pink-500/70 bg-pink-500/15 text-pink-500',
};

export const LABELS_WITHOUT_INDEX: ReadonlySet<Label> = new Set([
  Label.PAGE,
  Label.VIDEO_PAGE,
  Label.PLAYLIST,
]);
export const IN_PROGRESS: ReadonlySet<DownloadStatus> = new Set([
  DownloadStatus.QUEUED,
  DownloadStatus.RUNNING,
]);
export const UNSUCCESSFUL: ReadonlySet<DownloadStatus> = new Set([
  DownloadStatus.FAILED,
  DownloadStatus.CANCELED,
]);
export const IDLE_ICONS: Record<DownloadType, string> = {
  [DownloadType.VIDEO]: 'video_circle',
  [DownloadType.AUDIO]: 'waveform',
};
export const INDICATOR_COLORS: Record<DownloadState, string> = {
  requesting: '',
  processing: 'bg-orange-500',
  completed: 'bg-green-500',
  failed: 'bg-(--rt-body-color)',
};
export const TOOLTIPS: Record<DownloadState, string> = {
  requesting: '',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Error',
};
export const TYPE_NAMES: Record<DownloadType, string> = {
  [DownloadType.VIDEO]: 'video',
  [DownloadType.AUDIO]: 'audio',
};
export const STATE_NAMES: Record<DownloadState, string> = {
  requesting: 'sending',
  processing: 'processing',
  completed: 'completed',
  failed: 'failed',
};
