import { AsyncPipe } from '@angular/common';
import { AfterViewInit, Component, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormField, MatLabel, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { ConnectValidatorDirective } from '@shared';
import { delay, filter, finalize, interval, map, Observable, take, tap } from 'rxjs';
import { RtValidators } from '../../../../shared/validators';

@Component({
  imports: [
    MatFormField, 
    MatLabel, 
    MatInput, 
    MatPrefix, 
    MatSuffix, 
    MatIcon, 
    ReactiveFormsModule, 
    ConnectValidatorDirective, 
    AsyncPipe,
  ],
  selector: 'rt-url',
  styleUrl: './rt-url.css',
  templateUrl: './rt-url.html',
  host: {
    'class': 'transition-opacity duration-1000',
    '[class.opacity-0]': 'hideHost()',
  }
})
export class RtUrl implements AfterViewInit {
  connected = output<string>();

  message = signal('');
  isVisibleInput = signal(false);
  isConnected$: Observable<boolean>;
  url = new FormControl('', {
    validators: [Validators.required, RtValidators.url],
    updateOn: 'change',
  });
  hideHost = signal(false);

  constructor() {
    this.isConnected$ = this._isConnected$();
  }

  ngAfterViewInit(): void {
    this._writeMessage();

    this.isConnected$.pipe(
      delay(1000),
      tap(() => this.hideHost.set(true)),
      delay(1000),
      tap(() => this.connected.emit(this.url.value!)),
    )
    .subscribe();
  }
  
  private _writeMessage(): void {
    const message = 'Please enter the Retriever URL';
    interval(50).pipe(
      map(index => message.charAt(index)),
      tap((letter) => this.message.update((str) => str + letter)),
      take(message.length),
      finalize(() => this.isVisibleInput.set(true))
    ).subscribe();
  }

  private _isConnected$(): Observable<boolean> {
    return this.url.statusChanges.pipe(
      filter(() => this.url.valid && !!this.url.value),
      map(Boolean),
      take(1)
    );
  }
}
