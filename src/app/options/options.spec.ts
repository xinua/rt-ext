import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By, Title } from '@angular/platform-browser';
import { StorageService, WINDOW_TOKEN } from '@shared';
import { DEFAULT_SETTINGS } from '../shared/constants';
import { provideFakeStorage } from '../../testing/fake-storage-area';
import { RtUrl, Stepper } from './shared';
import { Options } from './options';

describe('Options', () => {
  let fixture: ComponentFixture<Options>;
  let storage: StorageService;
  let frames: Map<number, FrameRequestCallback>;
  let fakeWindow: Pick<Window, 'requestAnimationFrame' | 'cancelAnimationFrame'>;

  async function setup(appUrl = '') {
    frames = new Map();
    let lastFrame = 0;
    fakeWindow = {
      requestAnimationFrame: vi.fn((callback: FrameRequestCallback) => {
        frames.set(++lastFrame, callback);
        return lastFrame;
      }),
      cancelAnimationFrame: vi.fn((id: number) => frames.delete(id)),
    };

    // The page provides the real window itself; Angular also uses that one, so fake only the page's.
    TestBed.overrideComponent(Options, {
      set: { providers: [{ provide: WINDOW_TOKEN, useValue: fakeWindow }] },
    });
    await TestBed.configureTestingModule({
      imports: [Options],
      providers: [
        provideFakeStorage({ settings: { ...DEFAULT_SETTINGS, appUrl, openApp: true } }),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    storage = TestBed.inject(StorageService);
    await storage.ready;

    fixture = TestBed.createComponent(Options);
    await fixture.whenStable();
  }

  const has = (type: typeof RtUrl | typeof Stepper) =>
    !!fixture.debugElement.query(By.directive(type));

  it('names the tab', async () => {
    await setup();
    expect(TestBed.inject(Title).getTitle()).toBe('Retriever options');
  });

  describe('before the app is connected', () => {
    beforeEach(() => setup());

    it('asks for the app URL', () => {
      expect(has(RtUrl)).toBe(true);
      expect(has(Stepper)).toBe(false);
    });

    it('stores the connected URL without a trailing slash, keeping the other settings', async () => {
      fixture.debugElement
        .query(By.directive(RtUrl))
        .componentInstance.connected.emit('http://localhost:3000/');
      await fixture.whenStable();

      expect(storage.state().settings).toEqual({
        ...DEFAULT_SETTINGS,
        appUrl: 'http://localhost:3000',
        openApp: true,
      });
      expect(has(RtUrl)).toBe(false);
      expect(has(Stepper)).toBe(true);
    });
  });

  it('shows the settings once the app is connected', async () => {
    await setup('http://localhost:3000');
    expect(has(RtUrl)).toBe(false);
    expect(has(Stepper)).toBe(true);
  });

  describe('grid glow', () => {
    beforeEach(() => setup());

    const style = () => (fixture.nativeElement as HTMLElement).style;
    const move = (clientX: number, clientY: number) =>
      (fixture.nativeElement as HTMLElement).dispatchEvent(
        new PointerEvent('pointermove', { clientX, clientY }),
      );
    const runFrames = () => {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback(0));
    };

    it('follows the pointer square by square', () => {
      move(100, 41);
      runFrames();

      expect(style().getPropertyValue('--rt-cursor-x')).toBe('96px');
      expect(style().getPropertyValue('--rt-cursor-y')).toBe('36px');
      expect(style().getPropertyValue('--rt-glow-opacity')).toBe('1');
    });

    it('paints a burst of moves once, at the last position', () => {
      move(10, 10);
      move(50, 50);
      move(200, 300);
      expect(fakeWindow.requestAnimationFrame).toHaveBeenCalledOnce();

      runFrames();
      expect(style().getPropertyValue('--rt-cursor-x')).toBe('204px');
      expect(style().getPropertyValue('--rt-cursor-y')).toBe('300px');
    });

    it('fades out and drops the pending paint when the pointer leaves', () => {
      move(100, 100);
      (fixture.nativeElement as HTMLElement).dispatchEvent(new PointerEvent('pointerleave'));

      expect(fakeWindow.cancelAnimationFrame).toHaveBeenCalledOnce();
      expect(frames.size).toBe(0);
      expect(style().getPropertyValue('--rt-glow-opacity')).toBe('0');
    });

    it('drops the pending paint when destroyed', () => {
      move(100, 100);
      fixture.destroy();
      expect(frames.size).toBe(0);
    });
  });
});
