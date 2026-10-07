export interface Resolution {
  width: number;
  height: number;
}

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
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) return [];

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
