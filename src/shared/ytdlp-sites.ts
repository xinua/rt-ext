// Sites yt-dlp has a dedicated extractor for. The list holds hostnames taken
// from real URLs, often one example subdomain (`youtube-dl.bandcamp.com`), so
// pages are matched by site domain rather than by exact hostname.

import SITES from './ytdlp-sites.json';

/** Second-level labels under a country TLD that are not the site itself: `bbc.co.uk`. */
const COUNTRY_SECOND_LEVELS = new Set(['co', 'com', 'net', 'org', 'gov', 'edu', 'ac', 'or', 'ne']);

/** `music.youtube.com` → `youtube.com`, `iview.abc.net.au` → `abc.net.au`. */
export function siteDomain(hostname: string): string {
  const labels = hostname.toLowerCase().replace(/\.$/, '').split('.');
  const tld = labels[labels.length - 1];
  const secondLevel = labels[labels.length - 2];
  const count = tld.length === 2 && COUNTRY_SECOND_LEVELS.has(secondLevel) ? 3 : 2;

  return labels.slice(-count).join('.');
}

const DOMAINS = new Set(SITES.map(siteDomain));

/** Whether yt-dlp can most likely download straight from this page's URL. */
export function isYtdlpSupported(url: string): boolean {
  try {
    return DOMAINS.has(siteDomain(new URL(url).hostname));
  } catch {
    return false;
  }
}
