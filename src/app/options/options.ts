import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Title } from '@angular/platform-browser';
import { OptionsHeader, RtUrl, Stepper } from '@options/shared';
import { StorageService, WINDOW_TOKEN } from '@shared';

/** Keep in sync with `--rt-cell` in options.css. */
const CELL_SIZE = 12;

@Component({
  selector: 'rt-options',
  templateUrl: './options.html',
  providers: [{ provide: WINDOW_TOKEN, useValue: window }],
  styleUrl: './options.css',
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    RtUrl,
    Stepper,
    OptionsHeader,
  ],
  host: {
    '(pointermove)': 'onPointerMove($event)',
    '(pointerleave)': 'onPointerLeave()',
  },
})
export class Options {
  private _storage = inject(StorageService);
  private _window: Window = inject(WINDOW_TOKEN);
  private _title = inject(Title);
  private _host = inject<ElementRef<HTMLElement>>(ElementRef);

  private _pointer = { x: 0, y: 0 };
  private _frame = 0;

  appUrl = computed(() => this._storage.state().settings.appUrl);

  constructor() {
    this._title.setTitle('Retriever options');
    inject(DestroyRef).onDestroy(() => this._cancelFrame());
  }

  onPointerMove(event: PointerEvent) {
    this._pointer = { x: event.clientX, y: event.clientY };

    // Coalesce bursts of pointer events into one style write per frame.
    if (this._frame) return;
    this._frame = this._window.requestAnimationFrame(() => {
      this._frame = 0;
      this._paintGlow();
    });
  }

  onPointerLeave() {
    this._cancelFrame();
    this._host.nativeElement.style.setProperty('--rt-glow-opacity', '0');
  }

  saveAppUrl(appUrl: string) {
    this._storage.set('settings', {
      ...this._storage.state().settings,
      appUrl: appUrl.replace(/\/$/, ''),
    });
  }

  private _paintGlow() {
    // Snapping to the grid makes the highlight travel square by square.
    const x = Math.round(this._pointer.x / CELL_SIZE) * CELL_SIZE;
    const y = Math.round(this._pointer.y / CELL_SIZE) * CELL_SIZE;

    const style = this._host.nativeElement.style;
    style.setProperty('--rt-cursor-x', `${x}px`);
    style.setProperty('--rt-cursor-y', `${y}px`);
    style.setProperty('--rt-glow-opacity', '1');
  }

  private _cancelFrame() {
    if (!this._frame) return;
    this._window.cancelAnimationFrame(this._frame);
    this._frame = 0;
  }
}
