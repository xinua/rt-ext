import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  imports: [MatIcon],
  selector: 'rt-options-header',
  template: `
    <nav class="bg-(--mat-sys-surface)/60 p-4 rounded-lg">
      <div class="flex items-center gap-2">
        <mat-icon svgIcon="retriever" />
        <h1 class="text-2xl font-zinco leading-none mt-1">Retriever options</h1>
      </div>
    </nav>
  `,
})
export class OptionsHeader {}
