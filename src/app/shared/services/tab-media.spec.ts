import { TestBed } from '@angular/core/testing';
import type { MediaItem } from '../../../shared/media';
import { ACTIVE_TAB, SESSION_STORAGE_AREA } from '../tokens';
import { TabMediaService } from './tab-media';

type Listener = (changes: Record<string, chrome.storage.StorageChange>) => void;

const item = (url: string): MediaItem => ({ url, kind: 'hls', detectedAt: 0 });

describe('TabMediaService', () => {
  let listeners: Set<Listener>;

  function setup(tab: Partial<chrome.tabs.Tab> | undefined, stored: Record<string, unknown> = {}) {
    listeners = new Set();
    const area = {
      get: async (key: string) => (key in stored ? { [key]: stored[key] } : {}),
      onChanged: {
        addListener: (listener: Listener) => listeners.add(listener),
        removeListener: (listener: Listener) => listeners.delete(listener),
      },
    } as unknown as chrome.storage.StorageArea;

    TestBed.configureTestingModule({
      providers: [
        { provide: SESSION_STORAGE_AREA, useValue: area },
        { provide: ACTIVE_TAB, useValue: Promise.resolve(tab) },
      ],
    });
    return TestBed.inject(TabMediaService);
  }

  const emit = (changes: Record<string, chrome.storage.StorageChange>) =>
    listeners.forEach((listener) => listener(changes));

  it('reads the active tab media', async () => {
    const service = setup(
      { id: 7, url: 'https://yummyanime.tv/1.html' },
      {
        'media:7': [item('https://ceramet.net/index.m3u8')],
        'media:8': [item('https://other.net/a.mp4')],
      },
    );
    await service.ready;

    expect(service.sources()).toEqual([
      {
        url: 'https://ceramet.net/index.m3u8',
        label: 'HLS stream',
        prefix: 'ceramet',
        folder: 'yummyanime',
      },
    ]);
  });

  it('follows changes to its own tab only', async () => {
    const service = setup({ id: 7, url: 'https://yummyanime.tv/1.html' });
    await service.ready;

    const urls = () => service.sources().map((source) => source.url);

    emit({ 'media:8': { newValue: [item('https://other.net/a.mp4')] } });
    expect(urls()).toEqual([]);

    emit({ 'media:7': { newValue: [item('https://ceramet.net/index.m3u8')] } });
    expect(urls()).toEqual(['https://ceramet.net/index.m3u8']);

    emit({ 'media:7': {} });
    expect(urls()).toEqual([]);
  });

  it('offers the page itself on sites yt-dlp supports', async () => {
    const service = setup(
      { id: 7, url: 'https://vimeo.com/123' },
      { 'media:7': [item('https://cdn.vimeo.net/index.m3u8')] },
    );
    await service.ready;

    expect(service.sources().map(({ url, label }) => ({ url, label }))).toEqual([
      { url: 'https://vimeo.com/123', label: 'Page' },
      { url: 'https://cdn.vimeo.net/index.m3u8', label: 'HLS stream' },
    ]);
  });

  it('offers a YouTube video page as a source', async () => {
    const service = setup({ id: 1, url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
    await service.ready;

    expect(service.sources()).toEqual([
      {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        label: 'Video',
        prefix: 'youtube',
        folder: 'youtube',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      },
    ]);
  });

  it('offers a video opened from a playlist on its own and as the playlist', async () => {
    const service = setup({ id: 1, url: 'https://www.youtube.com/watch?v=abc&list=PL1&index=2' });
    await service.ready;

    expect(service.sources().map(({ url, label }) => ({ url, label }))).toEqual([
      { url: 'https://www.youtube.com/watch?v=abc', label: 'Video' },
      { url: 'https://www.youtube.com/playlist?list=PL1', label: 'Playlist' },
    ]);
  });

  it('passes the referer of captured media on', async () => {
    const service = setup(
      { id: 7, url: 'https://yummyanime.tv/1.html' },
      {
        'media:7': [
          { ...item('https://ceramet.net/index.m3u8'), referer: 'https://player.net/e/1' },
        ],
      },
    );
    await service.ready;

    expect(service.sources()[0].referer).toBe('https://player.net/e/1');
  });

  it('lists a page captured as media only once', async () => {
    const service = setup(
      { id: 7, url: 'https://vimeo.com/a.mp4' },
      { 'media:7': [item('https://vimeo.com/a.mp4')] },
    );
    await service.ready;

    expect(service.sources().map((source) => source.url)).toEqual(['https://vimeo.com/a.mp4']);
  });

  it('does not offer browser pages', async () => {
    const service = setup({ id: 7, url: 'chrome://newtab/' });
    await service.ready;

    expect(service.sources()).toEqual([]);
  });

  it('is empty without an active tab', async () => {
    const service = setup(undefined);
    await service.ready;

    expect(service.sources()).toEqual([]);
  });

  it('detaches its listener when the injector is destroyed', () => {
    setup(undefined);
    expect(listeners.size).toBe(1);

    TestBed.resetTestingModule();

    expect(listeners.size).toBe(0);
  });
});
