import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideFakeStorage } from '../../../../../testing/fake-storage-area';
import { DownloadType } from '../../models/forms.model';
import { DownloadConfig } from './download-config';

describe('DownloadConfig', () => {
  let component: DownloadConfig;
  let fixture: ComponentFixture<DownloadConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadConfig],
      providers: [provideFakeStorage(), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadConfig);
    fixture.componentRef.setInput('type', DownloadType.VIDEO);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
