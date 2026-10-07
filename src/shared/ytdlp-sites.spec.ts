import { isYtdlpSupported, siteDomain } from './ytdlp-sites';

describe('siteDomain', () => {
  it('drops subdomains', () => {
    expect(siteDomain('music.youtube.com')).toBe('youtube.com');
    expect(siteDomain('youtube.com')).toBe('youtube.com');
  });

  it('keeps the site under country second-level domains', () => {
    expect(siteDomain('www.bbc.co.uk')).toBe('bbc.co.uk');
    expect(siteDomain('iview.abc.net.au')).toBe('abc.net.au');
  });
});

describe('isYtdlpSupported', () => {
  it('accepts listed sites on any subdomain', () => {
    expect(isYtdlpSupported('https://m.youtube.com/watch?v=1')).toBe(true);
    expect(isYtdlpSupported('https://vimeo.com/123')).toBe(true);
    expect(isYtdlpSupported('https://some-artist.bandcamp.com/track/x')).toBe(true);
  });

  it('rejects other sites and invalid URLs', () => {
    expect(isYtdlpSupported('https://yummyanime.tv/1.html')).toBe(false);
    expect(isYtdlpSupported('chrome://newtab')).toBe(false);
    expect(isYtdlpSupported('')).toBe(false);
  });
});
