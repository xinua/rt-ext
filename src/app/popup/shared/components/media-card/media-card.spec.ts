import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideFakeStorage } from '../../../../../testing/fake-storage-area';
import { MediaCard } from './media-card';

describe('MediaCard', () => {
  let component: MediaCard;
  let fixture: ComponentFixture<MediaCard>;

  beforeEach(async () => {
    // Missing from the test DOM; the card's Truncate directive observes its width.
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(): void {
          // noop
        }
        unobserve(): void {
          // noop
        }
        disconnect(): void {
          // noop
        }
      },
    );

    await TestBed.configureTestingModule({
      imports: [MediaCard],
      providers: [provideFakeStorage(), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaCard);
    fixture.componentRef.setInput('source', { url: 'https://example.com/video.mp4', prefix: 'example', folder: 'example' });
    fixture.componentRef.setInput('isAppConnected', false);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
