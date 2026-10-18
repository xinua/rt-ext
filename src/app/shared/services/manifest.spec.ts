import { TestBed } from '@angular/core/testing';
import { ManifestService } from './manifest';

const MASTER = `#EXTM3U
#EXT-X-STREAM-INF:RESOLUTION=1280x720,BANDWIDTH=1096000
720/index.m3u8
#EXT-X-STREAM-INF:RESOLUTION=640x360,BANDWIDTH=414000
360/index.m3u8
`;

const MEDIA = `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXTINF:10.0,
seg-1.ts
#EXTINF:5.0,
seg-2.ts
#EXT-X-ENDLIST
`;

describe('ManifestService', () => {
  let service: ManifestService;
  let fetchMock: ReturnType<typeof vi.fn>;

  const serve = (pages: Record<string, string>) =>
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        url in pages
          ? { ok: true, url, text: () => Promise.resolve(pages[url]) }
          : { ok: false, url, text: () => Promise.resolve('') },
      ),
    );

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    service = TestBed.inject(ManifestService);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('reads the length of an HLS stream from its first variant', async () => {
    serve({
      'https://cdn.example.com/v/master.m3u8': MASTER,
      'https://cdn.example.com/v/720/index.m3u8': MEDIA,
    });
    expect(await service.info('https://cdn.example.com/v/master.m3u8', 'hls')).toEqual({
      qualities: [720, 360],
      duration: 15,
      live: false,
      drm: false,
    });
  });

  it('reads a media playlist directly', async () => {
    serve({ 'https://cdn.example.com/index.m3u8': MEDIA });
    expect(await service.info('https://cdn.example.com/index.m3u8', 'hls')).toEqual({
      qualities: [],
      duration: 15,
      live: false,
      drm: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the qualities when the variant is unreadable', async () => {
    serve({ 'https://cdn.example.com/v/master.m3u8': MASTER });
    expect(await service.info('https://cdn.example.com/v/master.m3u8', 'hls')).toEqual({
      qualities: [720, 360],
      live: false,
      drm: false,
    });
  });

  it('returns nothing for an unreadable manifest', async () => {
    serve({});
    expect(await service.info('https://cdn.example.com/manifest.mpd', 'dash')).toEqual({
      qualities: [],
      live: false,
      drm: false,
    });
  });
});
