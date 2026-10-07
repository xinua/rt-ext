import { Component, input } from '@angular/core';

@Component({
  selector: 'rt-line',
  standalone: true,
  templateUrl: './line.html',
  styleUrl: './line.scss',
})
export class LineComponent {
  direction = input('right');
}
