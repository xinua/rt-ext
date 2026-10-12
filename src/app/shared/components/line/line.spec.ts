import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineComponent } from './line';

describe('LineComponent', () => {
  let fixture: ComponentFixture<LineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LineComponent);
    await fixture.whenStable();
  });

  const wrapper = () => (fixture.nativeElement as HTMLElement).querySelector('.wrapper');

  it('runs to the right by default', () => {
    expect(wrapper()?.classList).toContain('right');
  });

  it('runs the way it is told', async () => {
    fixture.componentRef.setInput('direction', 'left');
    await fixture.whenStable();

    expect(wrapper()?.classList).toContain('left');
    expect(wrapper()?.classList).not.toContain('right');
  });
});
