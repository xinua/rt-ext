import { youTubePlaylistUrl, youTubeVideoId, youTubeVideoUrl } from './youtube';

describe('youTubeVideoId', () => {
  it('reads watch, shorts and short links', () => {
    expect(youTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1')).toBe('dQw4w9WgXcQ');
    expect(youTubeVideoId('https://m.youtube.com/shorts/abc123')).toBe('abc123');
    expect(youTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for other pages', () => {
    expect(youTubeVideoId('https://www.youtube.com/')).toBeNull();
    expect(youTubeVideoId('https://www.youtube.com/playlist?list=PL1')).toBeNull();
    expect(youTubeVideoId('https://notyoutube.com/watch?v=1')).toBeNull();
    expect(youTubeVideoId('chrome://newtab')).toBeNull();
  });
});

describe('youTubeVideoUrl', () => {
  it('drops the playlist and everything else', () => {
    expect(youTubeVideoUrl('https://www.youtube.com/watch?v=abc&list=PL1&index=3')).toBe(
      'https://www.youtube.com/watch?v=abc',
    );
    expect(youTubeVideoUrl('https://youtu.be/abc?list=PL1')).toBe(
      'https://www.youtube.com/watch?v=abc',
    );
  });

  it('returns null for non-video pages', () => {
    expect(youTubeVideoUrl('https://www.youtube.com/playlist?list=PL1')).toBeNull();
  });
});

describe('youTubePlaylistUrl', () => {
  it('reads the playlist a video was opened from', () => {
    expect(youTubePlaylistUrl('https://www.youtube.com/watch?v=abc&list=PL1&index=3')).toBe(
      'https://www.youtube.com/playlist?list=PL1',
    );
  });

  it('ignores mixes and videos without a playlist', () => {
    expect(youTubePlaylistUrl('https://www.youtube.com/watch?v=abc&list=RDabc')).toBeNull();
    expect(youTubePlaylistUrl('https://www.youtube.com/watch?v=abc')).toBeNull();
  });
});
