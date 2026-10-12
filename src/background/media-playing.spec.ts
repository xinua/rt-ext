import type { MediaItem } from '../shared/media';
import { findPlaying } from './media-playing';

const item = (url: string, overrides: Partial<MediaItem> = {}): MediaItem => ({
  url,
  kind: url.endsWith('.mpd') ? 'dash' : 'hls',
  detectedAt: 0,
  ...overrides,
});

const SOLOD = 'https://silence.cloud.solodcdn.com/useruploads/fd740647/57972628e85cbb34:2026101309';
const DREAMERS =
  'https://play.dreamerscast.com/dash/4d1ca66b/964cb3d5_,1080,720,low,opus,.mp4.urlset';

describe('findPlaying', () => {
  it('matches HLS segments in the manifest directory', () => {
    const items = [
      item('https://other.net/a/index.m3u8'),
      item(`${SOLOD}/720.mp4:hls:manifest.m3u8`),
    ];

    expect(findPlaying(items, `${SOLOD}/720.mp4:hls:seg-1-v1-a1.ts`)).toBe(1);
  });

  it('matches DASH fragments in the manifest directory', () => {
    const items = [item(`${DREAMERS}/manifest.mpd`), item('https://other.net/manifest.mpd')];

    expect(findPlaying(items, `${DREAMERS}/fragment-6-f4-a1-x3.m4s`)).toBe(0);
  });

  it('matches a master playlist whose variant segments sit in a subfolder', () => {
    const items = [
      item('https://cdn.net/x/ep1/master.m3u8'),
      item('https://cdn.net/x/ep2/master.m3u8'),
    ];

    expect(findPlaying(items, 'https://cdn.net/x/ep2/1080/seg-3.ts')).toBe(1);
  });

  it('prefers the deepest matching directory', () => {
    const items = [item('https://cdn.net/x/1080/index.m3u8'), item('https://cdn.net/master.m3u8')];

    expect(findPlaying(items, 'https://cdn.net/x/1080/seg-3.ts')).toBe(0);
  });

  it('breaks ties by the requesting frame, then by the latest captured', () => {
    const items = [
      item('https://cdn.net/a.m3u8?id=1', { frameId: 3 }),
      item('https://cdn.net/a.m3u8?id=2', { frameId: 5 }),
      item('https://cdn.net/a.m3u8?id=3', { frameId: 5 }),
    ];

    expect(findPlaying(items, 'https://cdn.net/seg-1.ts', 3)).toBe(0);
    expect(findPlaying(items, 'https://cdn.net/seg-1.ts', 5)).toBe(2);
  });

  it('ignores query strings, which carry per-request tokens', () => {
    const items = [item('https://cdn.net/v/index.m3u8?token=a')];

    expect(findPlaying(items, 'https://cdn.net/v/seg-1.ts?token=b')).toBe(0);
  });

  it('matches progressive files by their own URL only', () => {
    const items = [
      item('https://cdn.net/v/movie.mp4', { kind: 'video' }),
      item('https://cdn.net/v/other.mp4', { kind: 'video' }),
    ];

    expect(findPlaying(items, 'https://cdn.net/v/movie.mp4')).toBe(0);
    expect(findPlaying(items, 'https://cdn.net/v/seg-1.ts')).toBe(-1);
  });

  it('marks nothing for segments outside every manifest directory', () => {
    const items = [item('https://cdn.net/a/index.m3u8')];

    expect(findPlaying(items, 'https://cdn.net/b/seg-1.ts')).toBe(-1);
    expect(findPlaying(items, 'https://segments.cdn.net/a/seg-1.ts')).toBe(-1);
    expect(findPlaying(items, 'not a url')).toBe(-1);
  });
});
