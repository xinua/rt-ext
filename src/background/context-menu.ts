// Native browser context menu items, shown when right-clicking a video link
// (thumbnail, title, etc.) on YouTube.

import { ext } from '../shared/ext';
import type { DownloadKind } from '../shared/messages';
import { hasAppUrl, readStorage, watchAppUrl } from '../shared/storage';
import { download } from './api';

const YT_PAGES = ['*://*.youtube.com/*'];
const YT_VIDEO_LINKS = ['*://*.youtube.com/watch*', '*://*.youtube.com/shorts/*', '*://youtu.be/*'];

const MENU: Record<DownloadKind, string> = {
  video: 'retriever-download-video',
  audio: 'retriever-download-audio',
};

export function registerContextMenu(): void {
  ext.runtime.onInstalled.addListener(async () => {
    await ext.contextMenus.removeAll();
    // Hidden until the options page has an app URL to send downloads to.
    const visible = hasAppUrl(await readStorage());
    ext.contextMenus.create({
      id: MENU.video,
      title: 'Send video',
      contexts: ['link'],
      documentUrlPatterns: YT_PAGES,
      targetUrlPatterns: YT_VIDEO_LINKS,
      visible,
    });
    ext.contextMenus.create({
      id: MENU.audio,
      title: 'Send audio',
      contexts: ['link'],
      documentUrlPatterns: YT_PAGES,
      targetUrlPatterns: YT_VIDEO_LINKS,
      visible,
    });
  });

  watchAppUrl(setVisible);

  ext.contextMenus.onClicked.addListener((info) => {
    if (!info.linkUrl) return;

    switch (info.menuItemId) {
      case MENU.video:
        void download(info.linkUrl, 'video');
        break;
      case MENU.audio:
        void download(info.linkUrl, 'audio');
        break;
    }
  });
}

function setVisible(visible: boolean): void {
  for (const id of Object.values(MENU)) {
    // Fails harmlessly while onInstalled hasn't created the items yet.
    ext.contextMenus.update(id, { visible }).catch(() => undefined);
  }
}
