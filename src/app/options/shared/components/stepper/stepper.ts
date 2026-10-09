import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { DownloadType } from '../../models/forms.model';
import { DownloadConfig } from '../download-config/download-config';
import { Settings } from '../settings/settings';
import { NotifierModule, NotifierService } from 'angular-notifier';

@Component({
  imports: [
    MatStepperModule,
    ReactiveFormsModule,
    DownloadConfig,
    Settings,
    MatIcon,
    NotifierModule,
  ],
  encapsulation: ViewEncapsulation.None,
  selector: 'rt-stepper',
  styleUrl: './stepper.css',
  templateUrl: './stepper.html',
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: false },
    },
  ],
})
export class Stepper {
  private readonly _notifier = inject(NotifierService);
  readonly downloadType = DownloadType;

  showNotification(message: string) {
    this._notifier.notify('success', message);
  }
}
