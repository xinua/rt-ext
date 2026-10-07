import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RtValidators, StorageService } from '@shared';
import { AudioFormats, AudioQuality, Codecs, DownloadFormModel, DownloadType, VideoFormats, VideoQuality } from '../../models/forms.model';
import { filter, take, tap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  imports: [
    MatInputModule, 
    MatFormFieldModule, 
    ReactiveFormsModule, 
    MatButtonModule, 
    MatIcon, 
    MatSelectModule, 
    TitleCasePipe,
  ],
  selector: 'rt-download-config',
  styleUrl: './download-config.css',
  templateUrl: './download-config.html',
})
export class DownloadConfig implements OnInit {
  private readonly _storage = inject(StorageService);
  
  notify = output<string>();

  type = input.required<DownloadType>();
  form = computed(() => this.type() === DownloadType.VIDEO ? this._videoForm : this._audioForm);

  private _form$ = toObservable(this.form);
  private _changedValidator?: ValidatorFn;
  
  private _videoForm = new FormGroup<DownloadFormModel>({
    type: new FormControl<DownloadType>(DownloadType.VIDEO, { nonNullable: true }),
    quality: new FormControl<VideoQuality>(VideoQuality.BEST, { nonNullable: true }),
    format: new FormControl<VideoFormats>(VideoFormats.AUTO, { nonNullable: true }),
    codec: new FormControl<Codecs>(Codecs.AUTO, { nonNullable: true }),
  });

  private _audioForm = new FormGroup<DownloadFormModel>({
    type: new FormControl<DownloadType>(DownloadType.AUDIO, { nonNullable: true }),
    quality: new FormControl<AudioQuality>(AudioQuality.BEST, { nonNullable: true }),
    format: new FormControl<AudioFormats>(AudioFormats.MP3, { nonNullable: true }),
  });

  readonly downloadType = DownloadType;
  readonly videoQualities = Object.values(VideoQuality);
  readonly audioQualities = Object.values(AudioQuality);
  readonly videoFormats = Object.values(VideoFormats);
  readonly audioFormats = Object.values(AudioFormats);
  readonly codecs = Object.values(Codecs);

  constructor() {
    this._videoForm.setValue(this._storage.get('videoPreset'));
    this._audioForm.setValue(this._storage.get('audioPreset'));
  }

  ngOnInit(): void {
    this._form$.pipe(
      filter(Boolean),
      take(1),
      tap((form) => {
        form.controls.type.disable();
        this._resetValidators();
      })
    ).subscribe();
  }

  save() {
    this._resetValidators();
    const storageKey = this.type() === DownloadType.VIDEO ? 'videoPreset' : 'audioPreset';
    const message = (this.type() === DownloadType.VIDEO ? 'Video' : 'Audio') + ' preset has been updated';

    this._storage.set(storageKey, this.form().getRawValue()).then(() => {
      this.notify.emit(message);
    });
  }

  private _resetValidators() {
    const form = this.form();
    if (this._changedValidator) form.removeValidators(this._changedValidator);
    this._changedValidator = RtValidators.formChanged(form.value);
    form.addValidators(this._changedValidator);
    form.updateValueAndValidity();
  }
}
