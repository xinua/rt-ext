import { ext } from '../shared/ext';
import type { Message } from '../shared/messages';
import { download } from './api';

// Messages from the content script (YouTube player context menu) and the popup.
export function registerMessages(): void {
  ext.runtime.onMessage.addListener((msg: Message, sender: chrome.runtime.MessageSender) => {
    if (msg?.type === 'retriever:download') {
      void download(msg.url, msg.kind, !!sender.tab?.incognito);
    }
  });
}
