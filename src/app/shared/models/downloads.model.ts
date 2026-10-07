export interface DownloadSource {
  url: string;
  /** What the URL stands for, e.g. "Video" or "Playlist", shown on the card. */
  label?: Label;
  prefix: string;
  folder: string;
  thumbnail?: string;
  /** Sent to yt-dlp; CDNs often refuse media requested without the page that embeds it. */
  referer?: string;
}

export enum Label {
  HLS = 'HLS stream',
  DASH = 'DASH stream',
  VIDEO = 'Video file',
  AUDIO = 'Audio file',
  PAGE = 'Page',
  /** A YouTube video page, as opposed to a captured video file. */
  VIDEO_PAGE = 'Video',
  PLAYLIST = 'Playlist',
}
