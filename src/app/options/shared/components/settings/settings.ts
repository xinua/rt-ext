import { Component, computed, inject, output, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConnectValidatorDirective, RtValidators, StorageService } from '@shared';
import { Observable } from 'rxjs';
import { equalJson } from '../../../../shared/helpers/common.helpers';
import { SettingsFormModel } from '../../models/forms.model';
import { FlagsPipe } from './flags.pipe';
import { EXT_OPTIONS } from './settings.const';
import { SettingsOption } from './settings.model';

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
    FlagsPipe,
    ConnectValidatorDirective
],
  selector: 'rt-settings',
  styleUrl: './settings.css',
  templateUrl: './settings.html',
})
export class Settings {
  private readonly _storage = inject(StorageService);
  private _formValue: Signal<SettingsFormModel>;
  private _changedValidator?: ValidatorFn;

  notify = output<string>();

  readonly flags = EXT_OPTIONS;
  form = new FormGroup<SettingsFormModel>({
    appUrl: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, RtValidators.url] }),
    openApp: new FormControl<boolean>(false, { nonNullable: true }),
    useSubfolder: new FormControl<boolean>(false, { nonNullable: true }),
    useNamePrefix: new FormControl<boolean>(false, { nonNullable: true }),
    showQuality: new FormControl<boolean>(false, { nonNullable: true }),
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

    const initialValue = this.form.value as unknown as SettingsFormModel;
    const valueChanges = this.form?.valueChanges as unknown as Observable<SettingsFormModel>;
    this._formValue = toSignal(valueChanges, { initialValue });
  }

  onOptionChange({ value }: MatSelectChange<(keyof SettingsFormModel)[]>) {
    this.form.patchValue(
      Object.fromEntries(this.flags.map((flag) => [flag.value, value.includes(flag.value)])),
    );
    this.form.updateValueAndValidity();
  }

  save(): void {
    this._storage.set('settings', { ...this.form.getRawValue(), appUrl: this.form.getRawValue().appUrl.replace(/\/$/, "") });
    this.notify.emit('Settings have been saved');
    this._resetValidators();
  }

  private _resetValidators() {
    if (this._changedValidator) this.form.removeValidators(this._changedValidator);
    this._changedValidator = RtValidators.formChanged(this.form.getRawValue());
    this.form.addValidators(this._changedValidator);
    this.form.updateValueAndValidity();
  }
}
