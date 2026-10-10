import { ext } from '../shared/ext';
import { DownloadType } from '../app/options/shared/models/forms.model';
import { siteName } from '../app/shared/helpers/url.helpers';
import { downloadPayload } from '../shared/download';
import type { DownloadKind } from '../shared/messages';
import { hasAppUrl, readStorage } from '../shared/storage';
import { youTubeVideoUrl } from '../shared/youtube';

const TYPES: Record<DownloadKind, DownloadType> = {
  video: DownloadType.VIDEO,
  audio: DownloadType.AUDIO,
};

export async function download(pageUrl: string, kind: DownloadKind): Promise<void> {
  const storage = await readStorage();
  if (!hasAppUrl(storage)) {
    console.warn('[Retriever] No app URL set in the options; request skipped.');
    return;
  }
  const { appUrl, openApp } = storage.settings;

  // The menus always mean the one video, even when it was opened from a playlist.
  const url = youTubeVideoUrl(pageUrl) ?? pageUrl;
  const site = siteName(url);
  const body = downloadPayload(storage, { url, prefix: site, folder: site }, TYPES[kind]);
  console.log(`[Retriever] Send ${kind}:`, url);

  const res = await fetch(`${appUrl}/api/downloads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.warn('[Retriever] Request failed:', res.status, await res.text());
    return;
  }
  if (openApp) await ext.tabs.create({ url: appUrl });
}
