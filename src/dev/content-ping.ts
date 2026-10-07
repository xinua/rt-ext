// Dev-only: answers the background worker's ping, so it can tell which tabs
// run the content script without the `tabs` permission (see background-reload).

import { ext } from '../shared/ext';

export const DEV_PING = 'retriever:dev-ping';

export function answerDevPing(): void {
  ext.runtime.onMessage.addListener((msg: { type?: string }, _sender, sendResponse) => {
    if (msg?.type === DEV_PING) sendResponse(true);
  });
}
