import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PopupHeader } from './popup-header';

describe('Header', () => {
  let component: PopupHeader;
  let fixture: ComponentFixture<PopupHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(PopupHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
