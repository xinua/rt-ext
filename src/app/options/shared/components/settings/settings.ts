import { Component, computed, inject, OnInit, output, signal, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConnectValidatorDirective, HttpService, RtValidators, StorageService } from '@shared';
import { filter, from, Observable, of, startWith, take, tap } from 'rxjs';
import { equalJson } from '../../../../shared/helpers/common.helpers';
import { FoldersModel, SettingsFormModel } from '../../models/forms.model';
import { FlagsPipe } from './flags.pipe';
import { EXT_OPTIONS } from './settings.const';
import { SettingsOption } from './settings.model';
import { appOriginPattern } from '../../../../../shared/app-bridge';
import { ext } from '../../../../../shared/ext';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
  imports: [
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatIcon,
    MatButtonModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatTooltipModule,
    MatAutocompleteModule,
    FlagsPipe,
    ConnectValidatorDirective,
  ],
  selector: 'rt-settings',
  styleUrl: './settings.css',
  templateUrl: './settings.html',
})
export class Settings implements OnInit {
  private readonly _storage = inject(StorageService);
  private readonly _httpService = inject(HttpService);
  private _formValue: Signal<SettingsFormModel>;
  private _changedValidator?: ValidatorFn;

  notify = output<string>();
  folders = signal<FoldersModel['folders']>([]);

  readonly flags = EXT_OPTIONS;
  form = new FormGroup<SettingsFormModel>({
    appUrl: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, RtValidators.url],
    }),
    openApp: new FormControl<boolean>(false, { nonNullable: true }),
    useSubfolder: new FormControl<boolean>(false, { nonNullable: true }),
    useNamePrefix: new FormControl<boolean>(false, { nonNullable: true }),
    showQuality: new FormControl<boolean>(false, { nonNullable: true }),
    hideIncognito: new FormControl<boolean>(false, { nonNullable: true }),
    incognitoFolder: new FormControl<boolean>(false, { nonNullable: true }),
    incognitoFolderName: new FormControl<string>('', { nonNullable: true }),
  });

  selectedOptions = computed(
    (): (keyof SettingsFormModel)[] => {
      const value = this._formValue();

      return this.flags
        .filter((flag: SettingsOption) => !!value[flag.value])
        .map((flag) => flag.value);
    },
    { equal: equalJson },
  );

  constructor() {
    this.form.patchValue(this._storage.state().settings);
    this._resetValidators();
    this._validateIncognitoFolderName();

    const initialValue = this.form.value as unknown as SettingsFormModel;
    const valueChanges = this.form?.valueChanges as unknown as Observable<SettingsFormModel>;
    this._formValue = toSignal(valueChanges, { initialValue });
  }

  ngOnInit() {
    this._getFolders().subscribe();
  }

  onOptionChange({ value }: MatSelectChange<(keyof SettingsFormModel)[]>) {
    this.form.patchValue(
      Object.fromEntries(this.flags.map((flag) => [flag.value, value.includes(flag.value)])),
    );
    this.form.updateValueAndValidity();
  }

  save(): void {
    this._linkApp()
      .pipe(take(1), filter(Boolean))
      .subscribe(() => {
        this._storage.set('settings', {
          ...this.form.getRawValue(),
          appUrl: this.form.getRawValue().appUrl.replace(/\/$/, ''),
        });
        this.notify.emit('Settings have been saved');
        this._resetValidators();
      });
  }

  private _resetValidators() {
    if (this._changedValidator) this.form.removeValidators(this._changedValidator);
    this._changedValidator = RtValidators.formChanged(this.form.getRawValue());
    this.form.addValidators(this._changedValidator);
    this.form.updateValueAndValidity();
  }

  /** The name is only needed while the folder is on; `startWith` covers a setting saved as on. */
  private _validateIncognitoFolderName(): void {
    const { incognitoFolder, incognitoFolderName } = this.form.controls;
    incognitoFolder.valueChanges.pipe(startWith(incognitoFolder.value)).subscribe((value) => {
      // \S: a name of only spaces would be trimmed to nothing when sent.
      if (value) incognitoFolderName.setValidators([Validators.required, Validators.pattern(/\S/)]);
      else incognitoFolderName.clearValidators();
      incognitoFolderName.updateValueAndValidity();
    });
  }

  private _linkApp(): Observable<boolean> {
    const pattern = appOriginPattern(this.form.value.appUrl!);
    if (!pattern) return of(false);
    return from(ext.permissions.request({ origins: [pattern] }));
  }

  private _getFolders(): Observable<FoldersModel> {
    return this._httpService.getFolders().pipe(
      tap(({ folders }) => {
        this.folders.set(folders);
      }),
    );
  }
}
