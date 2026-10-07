import { TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, inject, input, OnInit, output, signal, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOption, MatSelectModule, MatSelectTrigger } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DownloadSource, HttpService, Label, StorageService } from '@shared';
import { Observable, tap } from 'rxjs';
import { AudioFormats, AudioQuality, CardFormModel, CardFormValue, Codecs, DownloadType, FoldersModel, VideoFormats, VideoQuality } from '../../../../options/shared/models/forms.model';
import { DownloadState } from '../media-card/media-card.model';

@Component({
  imports: [
    MatFormField,
    MatLabel,
    MatSelectTrigger,
    MatOption,
    TitleCasePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatIcon
],
  selector: 'rt-card-form',
  styleUrl: './card-form.css',
  templateUrl: './card-form.html',
  encapsulation: ViewEncapsulation.None,
})
export class CardForm implements OnInit {
  private readonly _httpService = inject(HttpService);
  private readonly _storage = inject(StorageService);
  private readonly _destroyRef = inject(DestroyRef);

  errors = input.required<Record<DownloadType, string>>();
  source = input.required<DownloadSource>();
  isRequesting = input.required<boolean>();
  isAppConnected = input.required<boolean>();
  states = input.required<Record<DownloadType, DownloadState | null>>();
  isVideoDisabled = input.required<boolean>();
  isAudioDisabled = input.required<boolean>();
  icons = input.required<Record<DownloadType, string>>();
  indicators = input.required<Record<DownloadType, string>>();
  ariaLabels = input.required<Record<DownloadType, string>>();
  downloadStarted = output<CardFormValue>();

  form = new FormGroup<CardFormModel>({
    type: new FormControl(DownloadType.VIDEO, { nonNullable: true }),
    quality: new FormControl(VideoQuality.BEST, { nonNullable: true }),
    format: new FormControl(VideoFormats.AUTO, { nonNullable: true }),
    codec: new FormControl(Codecs.AUTO, { nonNullable: true }),
    folder: new FormControl(''),
    prefix: new FormControl(''),
  });

  folders = signal<FoldersModel['folders']>([]);

  readonly downloadType = DownloadType;
  readonly downloadTypes = Object.values(DownloadType);
  readonly videoQualities = Object.values(VideoQuality);
  readonly audioQualities = Object.values(AudioQuality);
  readonly videoFormats = Object.values(VideoFormats);
  readonly audioFormats = Object.values(AudioFormats);
  readonly codecs = Object.values(Codecs);
  readonly types = DownloadType;
  readonly labels = Label;

  ngOnInit() {
    this.form.patchValue(this._storage.state()[this.isVideoDisabled() ? 'audioPreset' : 'videoPreset']);
    this.form.controls.folder.setValue(this._storage.state().settings.useSubfolder ? this.source().folder : null);
    this.form.controls.prefix.setValue(this._storage.state().settings.useNamePrefix ? this.source().prefix : null);

    this._getFolders().subscribe();
  }

  download() {
    if (this.isRequesting()) return;
    this.downloadStarted.emit(this.form.getRawValue());
  }

  private _getFolders(): Observable<FoldersModel> {
    return this._httpService.getFolders().pipe(
      tap(({ folders }) => {
        this.folders.set(folders);
      }),
    )
  }
}
