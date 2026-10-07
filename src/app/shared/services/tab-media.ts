import { computed, DestroyRef, inject, Service, signal } from '@angular/core';
import { mediaKey, type MediaItem, type MediaKey, type MediaKind } from '../../../shared/media';
import { youTubePlaylistUrl, youTubeVideoId, youTubeVideoUrl } from '../../../shared/youtube';
import { isYtdlpSupported } from '../../../shared/ytdlp-sites';
import { siteName } from '../helpers/url.helpers';
import { DownloadSource, Label } from '../models';
import { ACTIVE_TAB, SESSION_STORAGE_AREA } from '../tokens';

const KIND_LABELS: Record<MediaKind, Label> = {
  hls: Label.HLS,
  dash: Label.DASH,
  video: Label.VIDEO,
  audio: Label.AUDIO,
};

/**
 * Media available on the active tab. Read-only: the background worker captures
 * requests and writes them to session storage; this mirrors that tab's key.
 */
@Service()
export class TabMediaService {
  private readonly _area = inject(SESSION_STORAGE_AREA);
  private readonly _activeTab = inject(ACTIVE_TAB);

  private readonly _tab = signal<chrome.tabs.Tab | undefined>(undefined);
  private readonly _items = signal<MediaItem[]>([]);
  private _key?: MediaKey;

  readonly sources = computed<DownloadSource[]>(() => {
    const pageUrl = this._tab()?.url ?? '';
    const folder = siteName(pageUrl);
    const page = pageSources(pageUrl, folder);
    const captured = this._items()
      .filter((item) => !page.some((source) => source.url === item.url))
      .map((item) => ({
        url: item.url,
        label: KIND_LABELS[item.kind],
        prefix: siteName(item.url),
        folder,
        ...(item.referer && { referer: item.referer }),
      }));

    return [...page, ...captured];
  });

  /** Resolves once the active tab's media has been read. */
  readonly ready: Promise<void>;

  constructor() {
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>) => {
      const change = this._key && changes[this._key];
      if (change) this._items.set((change.newValue as MediaItem[] | undefined) ?? []);
    };

    this._area.onChanged.addListener(onChanged);
    inject(DestroyRef).onDestroy(() => this._area.onChanged.removeListener(onChanged));

    this.ready = this._load();
  }

  private async _load(): Promise<void> {
    try {
      const tab = await this._activeTab;
      this._tab.set(tab);
      if (tab?.id === undefined) return;

      const key = mediaKey(tab.id);
      this._key = key;

      const stored = await this._area.get<Partial<Record<MediaKey, MediaItem[]>>>(key);
      this._items.set(stored[key] ?? []);
    } catch (error) {
      console.error('[TabMedia] failed to read the active tab media', error);
    }
  }
}

/**
 * yt-dlp can take the page itself on sites it knows (YouTube always: its
 * streams are not captured). A YouTube video opened from a playlist is offered on its own and,
 * separately, as the whole playlist. Other pages are offered only on sites
 * yt-dlp has an extractor for.
 */
function pageSources(pageUrl: string, folder: string): DownloadSource[] {
  if (!/^https?:/.test(pageUrl)) return [];

  const videoId = youTubeVideoId(pageUrl);
  if (!videoId) {
    return isYtdlpSupported(pageUrl)
      ? [{ url: pageUrl, label: Label.PAGE, prefix: folder, folder }]
      : [];
  }

  const video: DownloadSource = {
    url: youTubeVideoUrl(pageUrl) ?? pageUrl,
    label: Label.VIDEO_PAGE,
    prefix: folder,
    folder,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
  const playlist = youTubePlaylistUrl(pageUrl);

  return playlist
    ? [video, { url: playlist, label: Label.PLAYLIST, prefix: folder, folder }]
    : [video];
}
