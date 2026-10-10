export type DownloadState = 'requesting' | 'processing' | 'completed' | 'failed';
/** Ids of the rows the app queued for a request, or where the request itself stands. */
export type Tracked = 'requesting' | 'failed' | number[];
