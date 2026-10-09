import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet],
  selector: 'rt-root',
  template: `<router-outlet />`,
  encapsulation: ViewEncapsulation.None,
})
export class App {}
