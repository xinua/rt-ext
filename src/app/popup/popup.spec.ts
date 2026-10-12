import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DownloadSource, HttpService, Label, StorageService, TabMediaService } from '@shared';
import { of } from 'rxjs';
import type { MockInstance } from 'vitest';
import { DEFAULT_SETTINGS } from '../shared/constants';
import { provideFakeStorage } from '../../testing/fake-storage-area';
import { MediaCard } from './shared';
import { Popup } from './popup';

// `ext` is read from the `chrome` global at import time, so mock it before the imports run.
const ext = vi.hoisted(() => {
  const mock = {
    tabs: { query: vi.fn() },
    permissions: { contains: vi.fn(), request: vi.fn() },
  };
  (globalThis as { chrome?: unknown }).chrome = mock;
  return mock;
});

const APP = 'http://localhost:3000';

const source = (url: string, label: Label): DownloadSource => ({
  url,
  label,
  prefix: 'example',
  folder: 'example',
});

interface Setup {
  tabUrl?: string;
  detection?: boolean;
  sources?: DownloadSource[];
  appUrl?: string;
  openApp?: boolean;
}

describe('Popup', () => {
  let component: Popup;
  let fixture: ComponentFixture<Popup>;
  let connect: MockInstance<HttpService['connect']>;

  async function setup({
    tabUrl = 'https://example.com/watch',
    detection = true,
    sources = [],
    appUrl = APP,
    openApp = false,
  }: Setup = {}) {
    ext.tabs.query.mockResolvedValue([{ url: tabUrl }]);
    ext.permissions.contains.mockResolvedValue(detection);

    // Missing from the test DOM; the cards' Truncate directive observes its width.
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
      imports: [Popup],
      providers: [
        provideFakeStorage({ settings: { ...DEFAULT_SETTINGS, appUrl, openApp } }),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TabMediaService, useValue: { sources: signal(sources) } },
      ],
    }).compileComponents();

    const httpService = TestBed.inject(HttpService);
    connect = vi.spyOn(httpService, 'connect').mockReturnValue(of({ ok: true }));
    // Connected cards look up what the app already has; nothing, here.
    vi.spyOn(httpService, 'lookup').mockReturnValue(of({ video: [], audio: [] }));
    await TestBed.inject(StorageService).ready;

    fixture = TestBed.createComponent(Popup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const allowButton = () =>
    [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Allow access'),
    );
  const cards = () =>
    fixture.debugElement
      .queryAll(By.directive(MediaCard))
      .map((card) => card.componentInstance as MediaCard);

  describe('detection access', () => {
    it('asks for access to all sites when it is missing', async () => {
      await setup({ detection: false });
      expect(allowButton()).toBeDefined();
      expect(text()).not.toContain('Nothing to send.');
    });

    it('does not ask on YouTube, which needs no access', async () => {
      await setup({ detection: false, tabUrl: 'https://www.youtube.com/watch?v=abc' });
      expect(allowButton()).toBeUndefined();
      expect(text()).toContain('Nothing to send.');
    });

    it('does not ask when access is already granted', async () => {
      await setup();
      expect(ext.permissions.contains).toHaveBeenCalledWith({ origins: ['<all_urls>'] });
      expect(allowButton()).toBeUndefined();
    });

    it('lists the media once access is allowed', async () => {
      await setup({ detection: false });
      ext.permissions.request.mockResolvedValue(true);

      allowButton()?.click();
      await vi.waitFor(() => expect(component.isDetectionEnabled()).toBe(true));
      await fixture.whenStable();

      expect(ext.permissions.request).toHaveBeenCalledWith({ origins: ['<all_urls>'] });
      expect(allowButton()).toBeUndefined();
      expect(text()).toContain('Nothing to send.');
    });

    it('keeps asking when access is refused', async () => {
      await setup({ detection: false });
      ext.permissions.request.mockResolvedValue(false);

      await component.enableDetection();
      await fixture.whenStable();

      expect(allowButton()).toBeDefined();
    });
  });

  describe('sources', () => {
    it('says when there is nothing to send', async () => {
      await setup();
      expect(cards()).toEqual([]);
      expect(text()).toContain('Nothing to send.');
    });

    it('puts the page first, then the captured media, newest first', async () => {
      const page = source('https://example.com/watch', Label.PAGE);
      const first = source('https://cdn.example.com/first.m3u8', Label.HLS);
      const second = source('https://cdn.example.com/second.mp4', Label.VIDEO);
      await setup({ sources: [page, first, second] });

      expect(cards().map((card) => card.source().url)).toEqual([page.url, second.url, first.url]);
    });

    it("leaves the tab's own list in the order it was found", async () => {
      const first = source('https://cdn.example.com/first.m3u8', Label.HLS);
      const second = source('https://cdn.example.com/second.mp4', Label.VIDEO);
      await setup({ sources: [first, second] });

      expect(component.sources()).toEqual([first, second]);
    });

    it('numbers the captured media in the order they were found', async () => {
      const first = source('https://cdn.example.com/first.m3u8', Label.HLS);
      const second = source('https://cdn.example.com/second.mp4', Label.VIDEO);
      await setup({ sources: [first, second] });

      expect(cards().map((card) => [card.source().url, card.index()])).toEqual([
        [second.url, 1],
        [first.url, 0],
      ]);
    });
  });

  describe('app connection', () => {
    it('checks the stored app URL and tells the cards', async () => {
      await setup({ sources: [source('https://cdn.example.com/a.mp4', Label.VIDEO)] });
      expect(connect).toHaveBeenCalledWith(APP);
      expect(cards()[0].isAppConnected()).toBe(true);
    });

    it('treats the app as disconnected when it is not ok', async () => {
      await setup({ sources: [source('https://cdn.example.com/a.mp4', Label.VIDEO)] });
      connect.mockReturnValue(of({ ok: false }));
      await TestBed.inject(StorageService).patch({
        settings: { ...DEFAULT_SETTINGS, appUrl: 'http://other:3000' },
      });
      await fixture.whenStable();

      expect(connect).toHaveBeenLastCalledWith('http://other:3000');
      expect(cards()[0].isAppConnected()).toBe(false);
    });

    it('does not check without an app URL', async () => {
      await setup({ appUrl: '', sources: [source('https://cdn.example.com/a.mp4', Label.VIDEO)] });
      expect(connect).not.toHaveBeenCalled();
      expect(cards()[0].isAppConnected()).toBe(false);
    });
  });

  describe('after a download starts', () => {
    const start = () => cards()[0].downloadStarted.emit();

    it('opens the app when the setting is on', async () => {
      await setup({
        openApp: true,
        sources: [source('https://cdn.example.com/a.mp4', Label.VIDEO)],
      });
      const open = vi.spyOn(window, 'open').mockReturnValue(null);

      start();
      expect(open).toHaveBeenCalledWith(APP, '_blank');
    });

    it('stays in the popup otherwise', async () => {
      await setup({ sources: [source('https://cdn.example.com/a.mp4', Label.VIDEO)] });
      const open = vi.spyOn(window, 'open').mockReturnValue(null);

      start();
      expect(open).not.toHaveBeenCalled();
    });
  });
});
