import { Component, computed, inject, input, output, ViewEncapsulation } from '@angular/core';
import { DownloadType } from '../../../../options/shared/models/forms.model';
import { DownloadState } from '../media-card/media-card.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TabMediaService } from '../../../../shared/services/tab-media';

@Component({
  imports: [MatButtonModule, MatIcon, MatTooltipModule],
  selector: 'rt-download-btn',
  styleUrl: './download-btn.css',
  templateUrl: './download-btn.html',
  encapsulation: ViewEncapsulation.None,
})
export class DownloadBtn {
  private readonly _tabMediaService = inject(TabMediaService);
  readonly isIncognito = computed(() =>
    this._tabMediaService.sources().some((source) => source.incognito),
  );
  readonly types = DownloadType;

  readonly type = input.required<DownloadType>();
  readonly isDisabled = input.required<boolean>();
  readonly ariaLabels = input.required<Record<DownloadType, string>>();
  readonly tooltips = input.required<Record<DownloadType, string>>();
  readonly icons = input.required<Record<DownloadType, string>>();
  readonly indicators = input.required<Record<DownloadType, string>>();
  readonly states = input.required<Record<DownloadType, DownloadState | null>>();
  /** Percent done while the download runs; null otherwise. */
  readonly progress = input.required<Record<DownloadType, number | null>>();
  readonly errors = input.required<Record<DownloadType, string>>();

  readonly download = output<void>();
}
