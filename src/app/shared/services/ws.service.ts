import { computed, effect, inject, Service, signal } from '@angular/core';
import { io } from 'socket.io-client';
import { DownloadModel, WsMessage } from '../models';
import { StorageService } from './storage';

/**
 * Live download rows pushed by the Retriever app over its socket.io endpoint.
 * The app only broadcasts changes, so a row is known once it has changed while
 * connected, or after it was handed over with `seed`.
 */
@Service()
export class WsService {
  private readonly _storage = inject(StorageService);
  private readonly _appUrl = computed(() => this._storage.state().settings.appUrl);
  private readonly _downloads = signal<ReadonlyMap<number, DownloadModel>>(new Map());

  readonly downloads = this._downloads.asReadonly();

  constructor() {
    effect((onCleanup) => {
      const origin = this._originOf(this._appUrl());
      if (!origin) return;

      const socket = io(origin, { path: '/ws', transports: ['websocket'] });
      socket.on('message', (message: WsMessage) => this._handle(message));
      onCleanup(() => socket.disconnect());
    });
  }

  /** Adds rows not seen yet; a row already updated over the socket is newer than the caller's copy. */
  seed(rows: DownloadModel[]) {
    this._downloads.update((current) => {
      const next = new Map(current);
      rows.filter((row) => !next.has(row.id)).forEach((row) => next.set(row.id, row));
      return next;
    });
  }

  private _upsert(rows: DownloadModel[]) {
    this._downloads.update((current) => {
      const next = new Map(current);
      rows.forEach((row) => next.set(row.id, row));
      return next;
    });
  }

  private _handle({ type, data }: WsMessage) {
    switch (type) {
      case 'download-updated':
        this._upsert([data as DownloadModel]);
        break;
      case 'downloads-batch':
        this._upsert(data as DownloadModel[]);
        break;
    }
  }

  private _originOf(url: string | null | undefined): string | null {
    if (!url?.trim()) return null;
    try {
      return new URL(url).origin;
    } catch {
      return null;
    }
  }
}
