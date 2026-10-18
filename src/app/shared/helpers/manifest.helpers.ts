export interface Resolution {
  width: number;
  height: number;
}

/** What a stream's manifest tells about it. */
export interface StreamInfo {
  /** Qualities ("p") it offers, best first. */
  qualities: number[];
  /** Length in seconds; absent for live streams and when the manifest doesn't say. */
  duration?: number;
  live: boolean;
  /** Locked by a DRM system, which no downloader can decrypt. */
  drm: boolean;
}

export const NO_STREAM_INFO: StreamInfo = { qualities: [], live: false, drm: false };

/** Standard frame sizes, best first; `p` is the label a size is shown as. */
const TIERS = [
  { p: 2160, width: 3840, height: 2160 },
  { p: 1440, width: 2560, height: 1440 },
  { p: 1080, width: 1920, height: 1080 },
  { p: 720, width: 1280, height: 720 },
  { p: 480, width: 854, height: 480 },
  { p: 360, width: 640, height: 360 },
  { p: 240, width: 426, height: 240 },
  { p: 144, width: 256, height: 144 },
];

/** Encoders crop a few pixels (1916x1076); still the same tier. */
const TOLERANCE = 0.9;

/** Qualities a URL hints at by name (`…/1080/index.m3u8`); a guess for when the manifest can't be read. */
const URL_QUALITIES = [2160, 1440, 1080, 720, 480];

/**
 * The "p" label of a frame size. Either side reaching a tier counts, so
 * letterboxed 1920x800 is still 1080p, and vertical 1080x1920 is too.
 */
export function qualityOf({ width, height }: Resolution): number {
  const long = Math.max(width, height);
  const short = Math.min(width, height);
  const tier = TIERS.find(
    (tier) => long >= tier.width * TOLERANCE || short >= tier.height * TOLERANCE,
  );
  return tier?.p ?? short;
}

/** Distinct qualities, best first. */
export function qualitiesOf(resolutions: Resolution[]): number[] {
  return [...new Set(resolutions.map(qualityOf))].sort((a, b) => b - a);
}

export function urlQualities(url: string): number[] {
  return URL_QUALITIES.filter((quality) => url.includes(quality.toString()));
}

/** `KEY=value,KEY="quoted, with commas"` from an HLS tag (RFC 8216 §4.2). */
function hlsAttributes(list: string): Map<string, string> {
  const attributes = new Map<string, string>();
  for (const [, key, value] of list.matchAll(/([A-Z0-9-]+)=("[^"]*"|[^,]*)/g)) {
    attributes.set(key, value.replace(/^"|"$/g, ''));
  }
  return attributes;
}

function resolutionOf(
  width: string | null | undefined,
  height: string | null | undefined,
): Resolution | null {
  const w = Number(width);
  const h = Number(height);
  return w > 0 && h > 0 ? { width: w, height: h } : null;
}

/**
 * Variant sizes of an HLS master playlist. A media playlist (the segments of a
 * single variant) carries none, and neither do variants without RESOLUTION.
 */
export function parseHls(text: string): Resolution[] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.startsWith('#EXT-X-STREAM-INF:'))
    .map((line) => {
      const [width, height] =
        hlsAttributes(line.slice(line.indexOf(':') + 1))
          .get('RESOLUTION')
          ?.split('x') ?? [];
      return resolutionOf(width, height);
    })
    .filter((resolution) => resolution !== null);
}

/** Audio and subtitle sets declare a non-video type; sets without one are judged by their sizes. */
function isVideo(element: Element, parent?: Element): boolean {
  const type = element.getAttribute('contentType') ?? parent?.getAttribute('contentType');
  const mime = element.getAttribute('mimeType') ?? parent?.getAttribute('mimeType');
  return (!type || type === 'video') && (!mime || mime.startsWith('video/'));
}

/**
 * Video sizes of a DASH MPD (ISO/IEC 23009-1). A Representation inherits
 * width/height from its AdaptationSet; a set without any falls back to its
 * maxWidth/maxHeight.
 */
export function parseDash(text: string): Resolution[] {
  const doc = parseXml(text);
  return doc ? dashResolutions(doc) : [];
}

/** Qualities, length, live and DRM state of a DASH MPD. */
export function parseDashInfo(text: string): StreamInfo {
  const doc = parseXml(text);
  if (!doc) return NO_STREAM_INFO;

  const mpd = doc.documentElement;
  const live = mpd.getAttribute('type') === 'dynamic';
  const duration = live ? undefined : isoDuration(mpd.getAttribute('mediaPresentationDuration'));
  return {
    qualities: qualitiesOf(dashResolutions(doc)),
    ...(duration ? { duration } : {}),
    live,
    drm: isDashDrm(doc),
  };
}

function parseXml(text: string): Document | null {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  return doc.getElementsByTagName('parsererror').length ? null : doc;
}

function dashResolutions(doc: Document): Resolution[] {
  return [...doc.getElementsByTagNameNS('*', 'AdaptationSet')]
    .filter((set) => isVideo(set))
    .flatMap((set) => {
      const sizes = [...set.getElementsByTagNameNS('*', 'Representation')]
        .filter((rep) => isVideo(rep, set))
        .map((rep) =>
          resolutionOf(
            rep.getAttribute('width') ?? set.getAttribute('width'),
            rep.getAttribute('height') ?? set.getAttribute('height'),
          ),
        )
        .filter((resolution) => resolution !== null);
      if (sizes.length) return sizes;

      const max = resolutionOf(set.getAttribute('maxWidth'), set.getAttribute('maxHeight'));
      return max ? [max] : [];
    });
}

/**
 * Whether every video set (every set, for audio-only) is protected. yt-dlp
 * drops protected formats, so a stream with any clear video still downloads.
 */
function isDashDrm(doc: Document): boolean {
  const sets = [...doc.getElementsByTagNameNS('*', 'AdaptationSet')];
  const videoSets = sets.filter((set) => isVideo(set));
  const judged = videoSets.length ? videoSets : sets;
  return (
    judged.length > 0 &&
    judged.every((set) => set.getElementsByTagNameNS('*', 'ContentProtection').length > 0)
  );
}

/** Seconds of an MPD duration (`PT1H2M3.5S`, `P1DT2H`); years and months never appear there. */
function isoDuration(value: string | null): number | undefined {
  const match = value?.match(/^P(?:([\d.]+)D)?(?:T(?:([\d.]+)H)?(?:([\d.]+)M)?(?:([\d.]+)S)?)?$/);
  if (!match) return undefined;
  const [, days, hours, minutes, seconds] = match.map((part) => Number(part ?? 0));
  const total = days * 86400 + hours * 3600 + minutes * 60 + seconds;
  return total > 0 ? total : undefined;
}

/**
 * Keys of FairPlay, PlayReady and Widevine, the same check yt-dlp makes. Plain
 * AES-128 encryption is not DRM: its key is a URL anyone may fetch.
 */
const HLS_DRM =
  /#EXT-X-(?:SESSION-)?KEY:.*(?:URI="skd:\/\/|KEYFORMAT="(?:com\.apple\.streamingkeydelivery|com\.microsoft\.playready|urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed)")/i;

export function isHlsDrm(text: string): boolean {
  return HLS_DRM.test(text);
}

/** URL of the first variant a master playlist lists; null for a media playlist. */
export function hlsVariantUrl(text: string, base: string): string | null {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const index = lines.findIndex((line) => line.startsWith('#EXT-X-STREAM-INF:'));
  const uri =
    index < 0 ? undefined : lines.slice(index + 1).find((line) => line && !line.startsWith('#'));
  if (!uri) return null;
  try {
    return new URL(uri, base).href;
  } catch {
    return null;
  }
}

/** Length of an HLS media playlist; one without #EXT-X-ENDLIST is still growing, so live. */
export function hlsTimeline(text: string): Pick<StreamInfo, 'duration' | 'live'> {
  const lines = text.split(/\r?\n/);
  const segments = lines.filter((line) => line.startsWith('#EXTINF:'));
  if (!segments.length) return { live: false };
  if (!lines.some((line) => line.startsWith('#EXT-X-ENDLIST'))) return { live: true };

  const duration = segments.reduce(
    (sum, line) => sum + (parseFloat(line.slice('#EXTINF:'.length)) || 0),
    0,
  );
  return duration > 0 ? { duration, live: false } : { live: false };
}

/** `1:02:03`, or `4:05` under an hour. */
export function formatDuration(length: number): string {
  const total = Math.round(length);
  const pad = (value: number) => value.toString().padStart(2, '0');
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = pad(total % 60);
  return hours ? `${hours}:${pad(minutes)}:${seconds}` : `${minutes}:${seconds}`;
}
