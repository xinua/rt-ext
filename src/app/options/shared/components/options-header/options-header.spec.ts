import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OptionsHeader } from './options-header';

describe('OptionsHeader', () => {
  let component: OptionsHeader;
  let fixture: ComponentFixture<OptionsHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OptionsHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(OptionsHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
