import { Service } from '@angular/core';
import {
  hlsTimeline,
  hlsVariantUrl,
  isHlsDrm,
  NO_STREAM_INFO,
  parseDashInfo,
  parseHls,
  qualitiesOf,
  StreamInfo,
} from '../helpers/manifest.helpers';

export type ManifestKind = 'hls' | 'dash';

/**
 * Reads stream manifests for what they tell about the stream. The popup holds
 * the detection host permission, so these fetches skip CORS in Chrome and Firefox.
 */
@Service()
export class ManifestService {
  /** Qualities, length, live and DRM state; empty when the manifest can't be read. */
  async info(url: string, kind: ManifestKind, signal?: AbortSignal): Promise<StreamInfo> {
    const manifest = await this._fetch(url, signal);
    if (!manifest) return NO_STREAM_INFO;
    return kind === 'hls'
      ? this._hlsInfo(manifest.text, manifest.url, signal)
      : parseDashInfo(manifest.text);
  }

  /**
   * A master playlist lists variants but no segments, so its length and live
   * state come from its first variant; all variants share them. Keys may sit
   * in either playlist.
   */
  private async _hlsInfo(text: string, url: string, signal?: AbortSignal): Promise<StreamInfo> {
    const variantUrl = hlsVariantUrl(text, url);
    const media = variantUrl ? (await this._fetch(variantUrl, signal))?.text : text;
    return {
      qualities: qualitiesOf(parseHls(text)),
      ...hlsTimeline(media ?? ''),
      drm: isHlsDrm(text) || (media !== undefined && isHlsDrm(media)),
    };
  }

  /** The text and final URL, which relative variant URIs resolve against; null when unreadable. */
  private async _fetch(
    url: string,
    signal?: AbortSignal,
  ): Promise<{ text: string; url: string } | null> {
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) return null;
      return { text: await response.text(), url: response.url || url };
    } catch (error) {
      if (signal?.aborted) throw error;
      return null;
    }
  }
}
