import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { provideFakeStorage } from '../../../testing/fake-storage-area';
import { AudioFormats, AudioQuality, DownloadType } from '../../options/shared/models/forms.model';
import { DEFAULT_SETTINGS, DEFAULT_VIDEO_PRESET } from '../constants';
import { DownloadSource } from '../models';
import { HttpService } from './http.service';
import { StorageService } from './storage';

const APP = 'http://localhost:3000';

const SOURCE: DownloadSource = {
  url: 'https://cdn.example.com/video.mp4',
  prefix: 'example',
  folder: 'example',
};

describe('HttpService', () => {
  let service: HttpService;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideFakeStorage({ settings: { ...DEFAULT_SETTINGS, appUrl: APP } }),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    await TestBed.inject(StorageService).ready;
    service = TestBed.inject(HttpService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('connect', () => {
    it('checks the health of the given URL', async () => {
      const response = firstValueFrom(service.connect('http://192.168.1.5:8080'));
      http.expectOne('http://192.168.1.5:8080/api/health').flush({ ok: true });
      expect(await response).toEqual({ ok: true });
    });

    it('is not ok without a URL, and asks nothing', async () => {
      expect(await firstValueFrom(service.connect(''))).toEqual({ ok: false });
      expect(await firstValueFrom(service.connect('   '))).toEqual({ ok: false });
    });
  });

  describe('download', () => {
    it('posts the source with the stored preset to the app', () => {
      service.download(SOURCE, DownloadType.VIDEO).subscribe();

      const req = http.expectOne(`${APP}/api/downloads`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toMatchObject({
        url: SOURCE.url,
        ...DEFAULT_VIDEO_PRESET,
        source: 'extension',
      });
      req.flush({});
    });

    it('fails without sending when the source has no URL', async () => {
      await expect(
        firstValueFrom(service.download({ ...SOURCE, url: ' ' }, DownloadType.VIDEO)),
      ).rejects.toThrow();
    });
  });

  it('looks up what the app has for a URL', () => {
    service.lookup(SOURCE.url).subscribe();

    const req = http.expectOne((r) => r.url === `${APP}/api/downloads/lookup`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('url')).toBe(SOURCE.url);
    req.flush({ video: [], audio: [] });
  });

  describe('getFolders', () => {
    it('lists the app folders', async () => {
      const folders = firstValueFrom(service.getFolders());
      http.expectOne(`${APP}/api/folders`).flush({ root: '/downloads', folders: ['music'] });
      expect(await folders).toEqual({ root: '/downloads', folders: ['music'] });
    });

    it('falls back to no folders when the app fails', async () => {
      const folders = firstValueFrom(service.getFolders());
      http
        .expectOne(`${APP}/api/folders`)
        .flush('boom', { status: 500, statusText: 'Server Error' });
      expect(await folders).toEqual({ root: '', folders: [] });
    });
  });

  it('posts a custom download with what the form picked', () => {
    const body = {
      type: DownloadType.AUDIO,
      quality: AudioQuality.HQ,
      format: AudioFormats.FLAC,
      folder: 'music',
      prefix: null,
    };
    service.donwloadCustom({ ...SOURCE, incognito: true }, body).subscribe();

    const req = http.expectOne(`${APP}/api/downloads`);
    expect(req.request.body).toEqual({
      url: SOURCE.url,
      ...body,
      source: 'extension',
      // `hideIncognito` is off in the stored settings.
      hidden: false,
    });
    req.flush({});
  });
});
