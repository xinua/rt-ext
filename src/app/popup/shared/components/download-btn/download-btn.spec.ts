import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DownloadBtn } from './download-btn';

describe('DownloadBtn', () => {
  let component: DownloadBtn;
  let fixture: ComponentFixture<DownloadBtn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadBtn],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadBtn);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
