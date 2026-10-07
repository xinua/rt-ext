import { AsyncPipe } from '@angular/common';
import { Component, computed, inject, Signal, signal, ViewEncapsulation } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DownloadSource, HttpService, Label, StorageService, TabMediaService } from '@shared';
import {
  defaultIfEmpty,
  distinctUntilChanged,
  filter,
  from,
  map,
  Observable,
  switchMap,
} from 'rxjs';
import { ext } from '../../shared/ext';
import { DETECTION_PERMISSIONS } from '../../shared/media';
import { LineComponent } from '../shared/components/line/line';
import { MediaCard, PopupHeader } from './shared';

@Component({
  selector: 'rt-popup',
  templateUrl: './popup.html',
  styleUrl: './popup.css',
  encapsulation: ViewEncapsulation.None,
  imports: [MatButtonModule, LineComponent, PopupHeader, MediaCard, MatTooltipModule, AsyncPipe],
})
export class Popup {
  private readonly _storage = inject(StorageService);
  private readonly _httpService = inject(HttpService);

  readonly labels = Label;
  readonly isDetectionEnabled = signal(true);
  readonly sources = inject(TabMediaService).sources;
  readonly pageSources: Signal<DownloadSource[]>;

  readonly isYoutube$: Observable<boolean>;
  readonly isConnected$: Observable<boolean>;
  appUrl = computed(() => this._storage.state().settings.appUrl);

  constructor() {
    this.isYoutube$ = from(ext.tabs.query({ active: true, currentWindow: true })).pipe(
      map((tabs) => !!tabs[0]?.url?.includes('youtube')),
    );

    this.isConnected$ = toObservable(this.appUrl).pipe(
      filter((url) => !!url),
      distinctUntilChanged(),
      switchMap((url) => this._httpService.connect(url)),
      map((response) => response?.ok),
      defaultIfEmpty(false),
    );

    this.pageSources = computed(() =>
      this.sources()
        .reverse()
        .sort((a) => (a.label === this.labels.PAGE || a.label === this.labels.VIDEO_PAGE ? -1 : 1)),
    );

    ext.permissions
      .contains(DETECTION_PERMISSIONS)
      .then((granted) => this.isDetectionEnabled.set(granted));
  }

  async enableDetection() {
    // The browser may close the popup while showing the prompt; the next open re-checks.
    this.isDetectionEnabled.set(await ext.permissions.request(DETECTION_PERMISSIONS));
  }

  handleDownload() {
    this._openApp();
  }

  private _openApp() {
    if (this._storage.state().settings.openApp) {
      window.open(this._storage.state().settings.appUrl, '_blank');
    }
  }
}
