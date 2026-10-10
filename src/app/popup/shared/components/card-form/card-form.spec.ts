import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideFakeStorage } from '../../../../../testing/fake-storage-area';
import { DownloadType } from '../../../../options/shared/models/forms.model';
import { DownloadState } from '../media-card/media-card.model';
import { CardForm } from './card-form';

const both = <T>(value: T): Record<DownloadType, T> => ({
  [DownloadType.VIDEO]: value,
  [DownloadType.AUDIO]: value,
});

describe('CardForm', () => {
  let component: CardForm;
  let fixture: ComponentFixture<CardForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardForm],
      providers: [provideFakeStorage(), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(CardForm);
    fixture.componentRef.setInput('errors', both(''));
    fixture.componentRef.setInput('source', {
      url: 'https://example.com/video.mp4',
      prefix: 'example',
      folder: 'example',
    });
    fixture.componentRef.setInput('isRequesting', false);
    fixture.componentRef.setInput('isAppConnected', true);
    fixture.componentRef.setInput('states', both(null));
    fixture.componentRef.setInput('isVideoDisabled', false);
    fixture.componentRef.setInput('isAudioDisabled', false);
    fixture.componentRef.setInput('icons', both('play_circle'));
    fixture.componentRef.setInput('indicators', both(''));
    fixture.componentRef.setInput('ariaLabels', both(''));
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  const label = () =>
    (
      fixture.nativeElement.querySelector('.submit-button .label') as HTMLElement
    ).textContent?.trim();

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('offers to send while idle', () => {
    expect(label()).toBe('Send');
  });

  it('shows the state of the selected type', async () => {
    fixture.componentRef.setInput('states', {
      [DownloadType.VIDEO]: 'processing' satisfies DownloadState,
      [DownloadType.AUDIO]: null,
    });
    await fixture.whenStable();
    expect(label()).toBe('Processing');
  });

  it('emits the form value on submit', () => {
    const emitted = vi.fn();
    component.downloadStarted.subscribe(emitted);
    component.download();
    expect(emitted).toHaveBeenCalledWith(component.form.getRawValue());
  });
});
