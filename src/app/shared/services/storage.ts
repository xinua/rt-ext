import { DestroyRef, inject, Service, signal } from '@angular/core';
import { DEFAULT_STORAGE, STORAGE_KEYS } from '../constants';
import { StorageModel } from '../models';
import { STORAGE_AREA } from '../tokens';

@Service()
export class StorageService {
  private readonly _area = inject(STORAGE_AREA);
  private readonly _state = signal<StorageModel>({ ...DEFAULT_STORAGE });

  /** Operations run one after another, so an early write is never clobbered by the initial read. */
  private _queue: Promise<unknown> = Promise.resolve();

  readonly state = this._state.asReadonly();

  /** Resolves once the first read from the storage area has been applied. */
  readonly ready: Promise<void>;

  constructor() {
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>) =>
      this._applyChanges(changes);
    this._area.onChanged.addListener(onChanged);
    inject(DestroyRef).onDestroy(() => this._area.onChanged.removeListener(onChanged));

    this.ready = this._enqueue(() => this._hydrate());
  }

  get<K extends keyof StorageModel>(key: K): StorageModel[K] {
    return this._state()[key];
  }

  set<K extends keyof StorageModel>(key: K, value: StorageModel[K]): Promise<void> {
    return this.patch({ [key]: value });
  }

  patch(patch: Partial<StorageModel>): Promise<void> {
    return this._enqueue(async () => {
      // Update first so the UI reacts immediately; `onChanged` later confirms the same values.
      this._state.update((state) => ({ ...state, ...patch }));
      await this._area.set(patch);
    });
  }

  /** Drops the stored value(s) and falls back to `DEFAULT_STORAGE`. */
  remove(...keys: (keyof StorageModel)[]): Promise<void> {
    return this._enqueue(async () => {
      const defaults = Object.fromEntries(
        keys.map((key) => [key, DEFAULT_STORAGE[key]]),
      ) as Partial<StorageModel>;

      this._state.update((state) => ({ ...state, ...defaults }));
      await this._area.remove(keys);
    });
  }

  clear(): Promise<void> {
    return this._enqueue(async () => {
      this._state.set({ ...DEFAULT_STORAGE });
      await this._area.clear();
    });
  }

  private async _hydrate(): Promise<void> {
    try {
      // Passing the defaults object makes the area fill in every key that was never written.
      const stored = await this._area.get<StorageModel>({ ...DEFAULT_STORAGE });
      this._state.set({ ...DEFAULT_STORAGE, ...stored });
    } catch (error) {
      console.error('[Storage] failed to read the storage area', error);
    }
  }

  private _enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this._queue.then(operation, operation);
    // A rejected write must not stall the queue, but the caller still sees the rejection.
    this._queue = result.catch(() => undefined);

    return result;
  }

  private _applyChanges(changes: Record<string, chrome.storage.StorageChange>): void {
    this._state.update((state) => {
      let next = state;

      for (const key of STORAGE_KEYS) {
        const change = changes[key];
        if (!change) continue;

        const value = (change.newValue ?? DEFAULT_STORAGE[key]) as StorageModel[typeof key];
        // Our own writes echo back through `onChanged`; skip them so the signal stays stable.
        if (value === next[key]) continue;

        next = { ...next, [key]: value };
      }

      return next;
    });
  }
}
