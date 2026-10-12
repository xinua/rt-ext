import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideFakeActiveTab, provideFakeStorage } from '../../../../../testing/fake-storage-area';
import { DownloadModel, DownloadStatus, Label, ManifestService, WsService } from '@shared';
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

  describe('qualities', () => {
    const show = async (url: string, label: Label) => {
      fixture.componentRef.setInput('source', { url, label, prefix: 'example', folder: 'example' });
      await fixture.whenStable();
      return component.qualities();
    };

    it('reads a stream manifest', async () => {
      const qualities = vi
        .spyOn(TestBed.inject(ManifestService), 'qualities')
        .mockResolvedValue([1080, 720, 480]);
      expect(
        await show('https://cdn.example.com/x_,1080,720,low,.urlset/manifest.mpd', Label.DASH),
      ).toEqual([1080, 720, 480]);
      expect(qualities).toHaveBeenCalledWith(
        'https://cdn.example.com/x_,1080,720,low,.urlset/manifest.mpd',
        'dash',
        expect.any(AbortSignal),
      );
    });

    it('falls back to the URL when the manifest lists none', async () => {
      vi.spyOn(TestBed.inject(ManifestService), 'qualities').mockResolvedValue([]);
      expect(await show('https://cdn.example.com/720/index.m3u8', Label.HLS)).toEqual([720]);
    });

    it('guesses from the URL for files without fetching', async () => {
      const qualities = vi.spyOn(TestBed.inject(ManifestService), 'qualities');
      expect(await show('https://cdn.example.com/video_1080.mp4', Label.VIDEO)).toEqual([1080]);
      expect(qualities).not.toHaveBeenCalled();
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
