import { siteName } from './url.helpers';

describe('siteName', () => {
  it('picks the second-level label', () => {
    expect(siteName('https://www.youtube.com/watch?v=1')).toBe('youtube');
    expect(siteName('https://ceramet.net/x/index.m3u8')).toBe('ceramet');
  });

  it('keeps hosts without a site name as they are', () => {
    expect(siteName('http://localhost:3000/a.mp4')).toBe('localhost');
    expect(siteName('http://192.168.0.1/a.mp4')).toBe('192.168.0.1');
  });

  it('returns an empty string for invalid URLs', () => {
    expect(siteName('')).toBe('');
  });
});
