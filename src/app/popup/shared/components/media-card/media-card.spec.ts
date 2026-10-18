import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideFakeActiveTab, provideFakeStorage } from '../../../../../testing/fake-storage-area';
import {
  DownloadModel,
  DownloadStatus,
  HttpService,
  Label,
  ManifestService,
  MediaDurationService,
  WsService,
} from '@shared';
import { StreamInfo } from '../../../../shared/helpers/manifest.helpers';
import { of } from 'rxjs';
import { DownloadType } from '../../../../options/shared/models/forms.model';
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
      providers: [
        provideFakeStorage(),
        provideFakeActiveTab(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaCard);
    fixture.componentRef.setInput('source', {
      url: 'https://example.com/video.mp4',
      prefix: 'example',
      folder: 'example',
    });
    fixture.componentRef.setInput('isAppConnected', false);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  const show = async (url: string, label: Label) => {
    fixture.componentRef.setInput('source', { url, label, prefix: 'example', folder: 'example' });
    await fixture.whenStable();
  };

  const stream = (info: Partial<StreamInfo>) =>
    vi
      .spyOn(TestBed.inject(ManifestService), 'info')
      .mockResolvedValue({ qualities: [], live: false, drm: false, ...info });

  describe('qualities', () => {
    it('reads a stream manifest', async () => {
      const info = stream({ qualities: [1080, 720, 480] });
      await show('https://cdn.example.com/x_,1080,720,low,.urlset/manifest.mpd', Label.DASH);
      expect(component.qualities()).toEqual([1080, 720, 480]);
      expect(info).toHaveBeenCalledWith(
        'https://cdn.example.com/x_,1080,720,low,.urlset/manifest.mpd',
        'dash',
        expect.any(AbortSignal),
      );
    });

    it('falls back to the URL when the manifest lists none', async () => {
      stream({});
      await show('https://cdn.example.com/720/index.m3u8', Label.HLS);
      expect(component.qualities()).toEqual([720]);
    });

    it('guesses from the URL for files without fetching', async () => {
      const info = vi.spyOn(TestBed.inject(ManifestService), 'info');
      vi.spyOn(TestBed.inject(MediaDurationService), 'duration').mockResolvedValue(null);
      await show('https://cdn.example.com/video_1080.mp4', Label.VIDEO);
      expect(component.qualities()).toEqual([1080]);
      expect(info).not.toHaveBeenCalled();
    });
  });

  describe('stream info', () => {
    it('shows the length of a stream', async () => {
      stream({ duration: 3723.4 });
      await show('https://cdn.example.com/master.m3u8', Label.HLS);
      expect(component.duration()).toBe('1:02:03');
      expect(component.isLive()).toBe(false);
    });

    it('marks a live stream', async () => {
      stream({ live: true });
      await show('https://cdn.example.com/live.m3u8', Label.HLS);
      expect(component.isLive()).toBe(true);
      expect(component.duration()).toBeNull();
    });

    it('disables both downloads of a DRM stream', async () => {
      // Connected, so only the DRM state can disable them.
      vi.spyOn(TestBed.inject(HttpService), 'lookup').mockReturnValue(of({ video: [], audio: [] }));
      fixture.componentRef.setInput('isAppConnected', true);
      stream({ drm: true });
      await show('https://cdn.example.com/manifest.mpd', Label.DASH);

      expect(component.isDrm()).toBe(true);
      const buttons: HTMLElement[] = [
        ...fixture.nativeElement.querySelectorAll('rt-download-btn button'),
      ];
      expect(buttons.length).toBe(2);
      // `disabledInteractive` keeps them focusable, so they report it through ARIA.
      expect(buttons.every((button) => button.getAttribute('aria-disabled') === 'true')).toBe(true);
    });

    it('reads the length of a file from its header', async () => {
      const duration = vi
        .spyOn(TestBed.inject(MediaDurationService), 'duration')
        .mockResolvedValue(245);
      await show('https://cdn.example.com/song.mp3', Label.AUDIO);
      expect(component.duration()).toBe('4:05');
      expect(duration).toHaveBeenCalledWith(
        'https://cdn.example.com/song.mp3',
        expect.any(AbortSignal),
      );
    });
  });

  describe('progress', () => {
    const row = (id: number, status: DownloadStatus, progress: number) =>
      ({ id, status, progress }) as DownloadModel;

    const start = (rows: DownloadModel[]) => {
      component.downloadSource(DownloadType.VIDEO, false);
      TestBed.inject(HttpTestingController)
        .expectOne((req) => req.url.endsWith('/api/downloads'))
        .flush({ downloads: rows });
    };

    const update = (rows: DownloadModel[]) => TestBed.inject(WsService)['_upsert'](rows);

    it('follows the running download', () => {
      start([row(1, DownloadStatus.QUEUED, 0)]);
      expect(component.progress()[DownloadType.VIDEO]).toBe(0);

      update([row(1, DownloadStatus.RUNNING, 37)]);
      expect(component.progress()[DownloadType.VIDEO]).toBe(37);
      expect(component.ariaLabels()[DownloadType.VIDEO]).toContain('37%');
    });

    it('averages a playlist, counting finished entries as whole', () => {
      start([row(1, DownloadStatus.DONE, 100), row(2, DownloadStatus.RUNNING, 50)]);
      expect(component.progress()[DownloadType.VIDEO]).toBe(75);
    });

    it('is null once nothing runs', () => {
      start([row(1, DownloadStatus.RUNNING, 90)]);
      update([row(1, DownloadStatus.DONE, 100)]);
      expect(component.progress()[DownloadType.VIDEO]).toBeNull();
      expect(component.progress()[DownloadType.AUDIO]).toBeNull();
    });
  });
});
