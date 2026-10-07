import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RainbowLine } from './rainbow-line';

describe('RainbowLine', () => {
  let component: RainbowLine;
  let fixture: ComponentFixture<RainbowLine>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RainbowLine],
    }).compileComponents();

    fixture = TestBed.createComponent(RainbowLine);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
