import { detectMedia, MIN_FILE_SIZE, type MediaResponse } from './media-detect';

function response(overrides: Partial<MediaResponse> & { headers?: Record<string, string> }) {
  const { headers = {}, ...rest } = overrides;
  return {
    url: 'https://cdn.example.com/video.mp4',
    type: 'media',
    statusCode: 200,
    responseHeaders: Object.entries(headers).map(([name, value]) => ({ name, value })),
    ...rest,
  } satisfies MediaResponse;
}

describe('detectMedia', () => {
  it('detects manifests by extension, even from XHR', () => {
    const hls = detectMedia(
      response({ url: 'https://cdn.example.com/x/index.m3u8', type: 'xmlhttprequest' }),
    );
    const dash = detectMedia(
      response({ url: 'https://cdn.example.com/manifest.mpd', type: 'xmlhttprequest' }),
    );

    expect(hls?.kind).toBe('hls');
    expect(dash?.kind).toBe('dash');
  });

  it('detects manifests by content type when the URL has no extension', () => {
    const media = detectMedia(
      response({
        url: 'https://cdn.example.com/playlist?id=1',
        type: 'xmlhttprequest',
        headers: { 'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8' },
      }),
    );

    expect(media).toEqual({
      url: 'https://cdn.example.com/playlist?id=1',
      kind: 'hls',
      mime: 'application/vnd.apple.mpegurl',
    });
  });

  it('detects progressive files loaded by a media element', () => {
    expect(detectMedia(response({ url: 'https://cdn.example.com/a.mp3' }))?.kind).toBe('audio');
    expect(detectMedia(response({ url: 'https://cdn.example.com/a.webm' }))?.kind).toBe('video');
  });

  it('ignores progressive files fetched by XHR, which are stream segments', () => {
    expect(detectMedia(response({ type: 'xmlhttprequest' }))).toBeNull();
  });

  it('ignores segments', () => {
    expect(detectMedia(response({ url: 'https://cdn.example.com/seg-1.ts' }))).toBeNull();
    expect(
      detectMedia(
        response({
          url: 'https://cdn.example.com/seg-1.m4s',
          headers: { 'Content-Type': 'video/mp4' },
        }),
      ),
    ).toBeNull();
  });

  it('filters out small files', () => {
    const small = response({ headers: { 'Content-Length': String(MIN_FILE_SIZE - 1) } });
    const big = response({ headers: { 'Content-Length': String(MIN_FILE_SIZE) } });

    expect(detectMedia(small)).toBeNull();
    expect(detectMedia(big)?.size).toBe(MIN_FILE_SIZE);
  });

  it('uses the full size from Content-Range for partial responses', () => {
    const media = detectMedia(
      response({
        statusCode: 206,
        headers: { 'Content-Length': '2', 'Content-Range': 'bytes 0-1/5000000' },
      }),
    );

    expect(media?.size).toBe(5000000);
  });

  it('keeps files of unknown size', () => {
    expect(detectMedia(response({}))?.size).toBeUndefined();
  });

  it('ignores failed responses, redirects and non-media', () => {
    expect(detectMedia(response({ statusCode: 404 }))).toBeNull();
    expect(detectMedia(response({ statusCode: 302 }))).toBeNull();
    expect(detectMedia(response({ url: 'https://cdn.example.com/app.js' }))).toBeNull();
  });

  it('ignores YouTube streams, which are handled by the page URL', () => {
    expect(
      detectMedia(response({ url: 'https://rr1---sn-abc.googlevideo.com/videoplayback.mp4' })),
    ).toBeNull();
  });
});
