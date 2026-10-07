import { Directive, inject } from '@angular/core';
import { AbstractControl, AsyncValidator, NG_ASYNC_VALIDATORS, ValidationErrors } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, map, Observable, of, startWith, switchMap, take, tap } from 'rxjs';
import { HttpService } from '../services';

@Directive({
  selector: '[rtConnectValidator]',
  providers: [{ provide: NG_ASYNC_VALIDATORS, useExisting: ConnectValidatorDirective, multi: true }],
})
export class ConnectValidatorDirective implements AsyncValidator {
  private readonly _httpService = inject(HttpService);

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    if (control.errors) return of(control.errors);

    return control.valueChanges.pipe(
      startWith(control.value),
      debounceTime(1000),
      distinctUntilChanged(),
      map((value) => value.replace(/\/$/, "")),
      switchMap((value) => this._httpService.connect(value)),
      map((response) => (response.ok ? null : { invalidUrl: true, message: 'Invalid URL' })),
      tap((error) => error ? control.markAsTouched() : null),
      take(1),
      catchError(() => {
        control.markAsTouched();
        return of({ invalidUrl: true, message: 'Cannot connect to the Retriever app' });
      }),
    );
  }
}