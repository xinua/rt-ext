// Messages passed between the content script, the popup and the background
// service worker. Shared so both ends agree on the shape.

export type DownloadKind = 'video' | 'audio';

export interface DownloadMessage {
  type: 'retriever:download';
  kind: DownloadKind;
  url: string;
}

export type Message = DownloadMessage;
