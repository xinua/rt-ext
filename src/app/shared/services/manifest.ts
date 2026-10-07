import { Service } from '@angular/core';
import { parseDash, parseHls, qualitiesOf } from '../helpers/manifest.helpers';

export type ManifestKind = 'hls' | 'dash';

const PARSERS = { hls: parseHls, dash: parseDash };

/**
 * Reads stream manifests for the qualities they offer. The popup holds the
 * detection host permission, so these fetches skip CORS in Chrome and Firefox.
 */
@Service()
export class ManifestService {
  /** Qualities ("p") the manifest lists, best first; empty when it can't be read or lists none. */
  async qualities(url: string, kind: ManifestKind, signal?: AbortSignal): Promise<number[]> {
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) return [];
      return qualitiesOf(PARSERS[kind](await response.text()));
    } catch (error) {
      if (signal?.aborted) throw error;
      return [];
    }
  }
}
