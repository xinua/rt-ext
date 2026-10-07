// YouTube URL handling shared by the popup, the background worker and the
// menus. A watch URL can carry `list=`, and yt-dlp then takes the whole
// playlist; these turn such a URL into exactly the video or the playlist.

const HOSTS = /^(www\.|m\.|music\.)?youtube\.com$/;

function parse(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/** The video ID when the URL is a YouTube video page, otherwise null. */
export function youTubeVideoId(url: string): string | null {
  const parsed = parse(url);
  if (!parsed) return null;

  if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1) || null;
  if (!HOSTS.test(parsed.hostname)) return null;
  if (parsed.pathname === '/watch') return parsed.searchParams.get('v');

  return parsed.pathname.match(/^\/shorts\/([^/]+)/)?.[1] ?? null;
}

/** Just the video, without the playlist it was opened from. */
export function youTubeVideoUrl(url: string): string | null {
  const id = youTubeVideoId(url);
  return id && `https://www.youtube.com/watch?v=${id}`;
}

/**
 * The playlist a video was opened from. Mixes (`RD…`) are left out: YouTube
 * generates them per viewer and they have no real end.
 */
export function youTubePlaylistUrl(url: string): string | null {
  const parsed = parse(url);
  if (!parsed || !youTubeVideoId(url)) return null;

  const list = parsed.searchParams.get('list');
  if (!list || list.startsWith('RD')) return null;

  return `https://www.youtube.com/playlist?list=${encodeURIComponent(list)}`;
}
