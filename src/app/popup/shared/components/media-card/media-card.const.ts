import { DownloadStatus, Label } from '@shared';
import { DownloadType } from '../../../../options/shared/models/forms.model';
import { DownloadState } from './media-card.model';

export const LabelColor: Record<Label, string> = {
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
  [DownloadType.VIDEO]: 'play_circle',
  [DownloadType.AUDIO]: 'audiotrack',
};
export const INDICATOR_COLORS: Record<DownloadState, string> = {
  requesting: '',
  downloading: 'bg-orange-500',
  downloaded: 'bg-green-500',
  failed: 'bg-(--rt-body-color)',
};
export const TOOLTIPS: Record<DownloadState, string> = {
  requesting: '',
  downloading: 'Downloading',
  downloaded: 'Downloaded',
  failed: 'Error',
};
export const TYPE_NAMES: Record<DownloadType, string> = {
  [DownloadType.VIDEO]: 'video',
  [DownloadType.AUDIO]: 'audio',
};
export const STATE_NAMES: Record<DownloadState, string> = {
  requesting: 'sending',
  downloading: 'downloading',
  downloaded: 'downloaded',
  failed: 'failed',
};
