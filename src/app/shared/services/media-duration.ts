import { DOCUMENT, inject, Service } from '@angular/core';

/**
 * Length of a media file, read by a detached <video> with `preload="metadata"`:
 * the browser fetches only the file's header through Range requests.
 */
@Service()
export class MediaDurationService {
  private readonly _document = inject(DOCUMENT);

  /** Seconds; null when the file won't load or has no finite length. */
  duration(url: string, signal?: AbortSignal): Promise<number | null> {
    if (signal?.aborted) return Promise.reject(signal.reason);

    const video = this._document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;

    return new Promise((resolve, reject) => {
      const settle = (finish: () => void) => {
        signal?.removeEventListener('abort', onAbort);
        // Stops the download; the element is never attached, so this frees it.
        video.removeAttribute('src');
        video.load();
        finish();
      };
      const onAbort = () => settle(() => reject(signal?.reason));

      video.addEventListener(
        'loadedmetadata',
        () => {
          const { duration } = video;
          settle(() => resolve(Number.isFinite(duration) && duration > 0 ? duration : null));
        },
        { once: true },
      );
      video.addEventListener('error', () => settle(() => resolve(null)), { once: true });
      signal?.addEventListener('abort', onAbort, { once: true });
      video.src = url;
    });
  }
}
