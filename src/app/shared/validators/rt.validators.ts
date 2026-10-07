import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { equalJson } from '../helpers/common.helpers';

export class RtValidators {
  static formChanged<T extends object>(sourceValue: T): ValidatorFn {
    const compareWith: T = window.structuredClone(sourceValue);
    return ((form: AbstractControl | FormGroup): ValidationErrors | null =>
      equalJson(form.value, compareWith) ? { unchanged: true } : null);
  }

  static url(control: AbstractControl): ValidationErrors | null {
    const url = control.value;
    if (!url) return null;
    if (!url.startsWith('http://') && !url.startsWith('https://'))
      return { invalidUrl: true, message: 'URL must start with http:// or https://' };
    return null;
  }
}