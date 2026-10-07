import { Component, input, output, ViewEncapsulation } from '@angular/core';
import { DownloadType } from '../../../../options/shared/models/forms.model';
import { DownloadState } from '../media-card/media-card.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  imports: [MatButtonModule, MatIcon, MatTooltipModule],
  selector: 'rt-download-btn',
  styleUrl: './download-btn.css',
  templateUrl: './download-btn.html',
  encapsulation: ViewEncapsulation.None,
})
export class DownloadBtn {
  readonly types = DownloadType;

  readonly type = input.required<DownloadType>();
  readonly isDisabled = input.required<boolean>();
  readonly ariaLabels = input.required<Record<DownloadType, string>>();
  readonly tooltips = input.required<Record<DownloadType, string>>();
  readonly icons = input.required<Record<DownloadType, string>>();
  readonly indicators = input.required<Record<DownloadType, string>>();
  readonly states = input.required<Record<DownloadType, DownloadState | null>>();
  readonly errors = input.required<Record<DownloadType, string>>();

  readonly download = output<void>();
}
