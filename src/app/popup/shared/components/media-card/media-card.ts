
import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DownloadLookup, DownloadModel, DownloadSource, DownloadStatus, HttpService, Label, StorageService, Truncate, WsService } from '@shared';
import { tap } from 'rxjs';
import { CardFormValue, DownloadType } from '../../../../options/shared/models/forms.model';
import { CardForm } from '../card-form/card-form';
import { DownloadBtn } from '../download-btn/download-btn';
import { IDLE_ICONS, IN_PROGRESS, INDICATOR_COLORS, LabelColor, LABELS_WITHOUT_INDEX, STATE_NAMES, TOOLTIPS, TYPE_NAMES, UNSUCCESSFUL } from './media-card.const';
import { DownloadState, Tracked } from './media-card.model';

/** What the app already has for this source, as tracked ids; types it never downloaded stay untracked. */
function trackedFrom(lookup: DownloadLookup | null): Partial<Record<DownloadType, Tracked>> {
  if (!lookup) return {};
  return Object.fromEntries(
    Object.values(DownloadType)
      .filter((type) => lookup[type].length)
      .map((type) => [type, lookup[type].map(({ id }) => id)]),
  );
}

/** A playlist queues many rows: it is downloading until all finish, and failed if any did. */
function stateOf(tracked: Tracked | undefined, rows: ReadonlyMap<number, DownloadModel>): DownloadState | null {
  if (!tracked) return null;
  if (!Array.isArray(tracked)) return tracked;
  if (!tracked.length) return null;

  const statuses = tracked.map((id) => rows.get(id)?.status ?? DownloadStatus.QUEUED);
  if (statuses.some((status) => IN_PROGRESS.has(status))) return 'downloading';
  if (statuses.some((status) => UNSUCCESSFUL.has(status))) return 'failed';
  return 'downloaded';
}

@Component({
  imports: [MatButtonModule, MatIcon, Truncate, MatTooltipModule, CardForm, DownloadBtn],
  selector: 'rt-media-card',
  templateUrl: './media-card.html',
})
export class MediaCard {
  private readonly _storage = inject(StorageService);
  private readonly _httpService = inject(HttpService);
  private readonly _ws = inject(WsService);

  readonly types = DownloadType;
  readonly labels = Label;

  readonly index = input<number>();
  readonly source = input.required<DownloadSource>();
  readonly isAppConnected = input.required<boolean>();
  readonly downloadStarted = output<void>();

  errors: Record<DownloadType, string> = {
    [DownloadType.VIDEO]: '',
    [DownloadType.AUDIO]: '',
  };

  private readonly _lookup = rxResource({
    params: () => (this.isAppConnected() ? this.source().url : undefined),
    stream: ({ params }) => this._httpService.lookup(params).pipe(tap(({ video, audio }) => this._ws.seed([...video, ...audio]))),
  });

  /** Starts from what the app already has; a download started here replaces that type's entry. */
  private readonly _tracked = linkedSignal<DownloadLookup | null, Partial<Record<DownloadType, Tracked>>>({
    source: () => (this._lookup.hasValue() ? this._lookup.value() : null),
    // Keep whatever was clicked while the lookup was still in flight.
    computation: (lookup, previous) => ({ ...trackedFrom(lookup), ...previous?.value }),
  });
  readonly isCopying = signal(false);
  readonly showForm = signal(false);

  readonly useFolder = computed(() => this._storage.state().settings.useSubfolder);
  readonly usePrefix = computed(() => this._storage.state().settings.useNamePrefix);
  readonly qualities = computed(() => this.source().label !== Label.AUDIO ? [480, 720, 1080, 1440, 2160].filter((quality) => this.source().url.includes(quality.toString())) : []);

  readonly badgeColor = computed(() => {
    const label = this.source().label;
    return label ? LabelColor[label] : '';
  });

  /** 1-based position shown on the card; hidden for sources that aren't a single media item. */
  readonly displayIndex = computed(() => {
    const index = this.index();
    const label = this.source().label;
    if (index === undefined || (label && LABELS_WITHOUT_INDEX.has(label))) return null;
    return index + 1;
  });

  readonly isRequesting = computed(() => Object.values(this._tracked()).includes('requesting'));

  readonly states = computed(() => {
    const tracked = this._tracked();
    const rows = this._ws.downloads();
    return {
      [DownloadType.VIDEO]: stateOf(tracked[DownloadType.VIDEO], rows),
      [DownloadType.AUDIO]: stateOf(tracked[DownloadType.AUDIO], rows),
    };
  });

  /** Idle icon per type, swapped for a spinner while the request is being sent; the indicator dot shows the rest. */
  readonly icons = computed(() => {
    const states = this.states();
    const iconOf = (type: DownloadType) => (states[type] === 'requesting' ? 'sync' : IDLE_ICONS[type]);
    return { [DownloadType.VIDEO]: iconOf(DownloadType.VIDEO), [DownloadType.AUDIO]: iconOf(DownloadType.AUDIO) };
  });

  readonly indicators = computed(() => {
    const states = this.states();
    const colorOf = (type: DownloadType) => {
      const state = states[type];
      return state ? INDICATOR_COLORS[state] : '';
    };
    return { [DownloadType.VIDEO]: colorOf(DownloadType.VIDEO), [DownloadType.AUDIO]: colorOf(DownloadType.AUDIO) };
  });

  /** Empty when there is nothing to report, which also disables the tooltip. */
  readonly tooltips = computed(() => {
    const states = this.states();
    const tooltipOf = (type: DownloadType) => {
      const state = states[type];
      return state ? TOOLTIPS[state] : '';
    };
    return { [DownloadType.VIDEO]: tooltipOf(DownloadType.VIDEO), [DownloadType.AUDIO]: tooltipOf(DownloadType.AUDIO) };
  });

  readonly ariaLabels = computed(() => {
    const states = this.states();
    const labelOf = (type: DownloadType) => {
      const state = states[type];
      return `Download ${TYPE_NAMES[type]}${state ? ` (${STATE_NAMES[state]})` : ''}`;
    };
    return { [DownloadType.VIDEO]: labelOf(DownloadType.VIDEO), [DownloadType.AUDIO]: labelOf(DownloadType.AUDIO) };
  });

  downloadSource(type: DownloadType, isDisabled: boolean) {
    if (isDisabled) return;

    this._track(type, 'requesting');

    this._httpService.download(this.source(), type).subscribe({
      next: ({ downloads }) => {
        this._ws.seed(downloads);
        this._track(type, downloads.map(({ id }) => id));
        this.downloadStarted.emit();
      },
      error: (error: Error) => {
        this._track(type, 'failed');
        this.errors[type] = error.message;
      },
    });
  }

  downloadCustom(body: CardFormValue) {
    this._track(body.type, 'requesting');

    this._httpService.donwloadCustom(this.source(), body).subscribe({
      next: ({ downloads }) => {
        this._ws.seed(downloads);
        this._track(body.type, downloads.map(({ id }) => id));
        this.downloadStarted.emit();
      },
      error: (error: Error) => {
        this._track(body.type, 'failed');
        this.errors[body.type] = error.message;
      },
    });
  }

  openForm() {
    this.showForm.set(!this.showForm());
  }

  private _track(type: DownloadType, tracked: Tracked) {
    this._tracked.update((current) => ({ ...current, [type]: tracked }));
  }

  copyUrl() {
    this.isCopying.set(true);
    void navigator.clipboard.writeText(this.source().url);
    setTimeout(() => {
      this.isCopying.set(false);
    }, 500);
  }
}
