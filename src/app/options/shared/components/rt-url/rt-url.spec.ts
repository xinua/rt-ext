import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpService } from '@shared';
import { of } from 'rxjs';
import { RtUrl } from './rt-url';

// `ext` is read from the `chrome` global at import time, so mock it before the imports run.
const ext = vi.hoisted(() => {
  const mock = { permissions: { request: vi.fn() } };
  (globalThis as { chrome?: unknown }).chrome = mock;
  return mock;
});

const PROMPT = 'Please enter the Retriever URL';

describe('RtUrl', () => {
  let component: RtUrl;
  let fixture: ComponentFixture<RtUrl>;
  let connect: ReturnType<typeof vi.fn<HttpService['connect']>>;

  beforeEach(async () => {
    vi.useFakeTimers();
    connect = vi.fn<HttpService['connect']>(() => of({ ok: true }));
    ext.permissions.request.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [RtUrl],
      providers: [{ provide: HttpService, useValue: { connect } }],
    }).compileComponents();

    fixture = TestBed.createComponent(RtUrl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  /** Types a URL and lets the connect check settle. */
  async function enter(url: string) {
    component.url.setValue(url);
    await vi.advanceTimersByTimeAsync(1000);
  }

  it('types the prompt out, then shows the input', async () => {
    expect(component.isVisibleInput()).toBe(false);

    await vi.advanceTimersByTimeAsync(50 * 5);
    expect(component.message()).toBe(PROMPT.slice(0, 5));

    await vi.advanceTimersByTimeAsync(50 * PROMPT.length);
    expect(component.message()).toBe(PROMPT);
    expect(component.isVisibleInput()).toBe(true);
  });

  it('rejects a URL without http(s) before calling the app', async () => {
    await enter('localhost:3000');
    expect(component.url.hasError('invalidUrl')).toBe(true);
    expect(connect).not.toHaveBeenCalled();
  });

  it('offers to link the app once the URL connects', async () => {
    const linkButton = () =>
      [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find((button) =>
        button.textContent?.includes('Let interact with the app'),
      );

    expect(linkButton()).toBeUndefined();

    await enter('http://localhost:3000');
    fixture.detectChanges();

    expect(component.url.valid).toBe(true);
    expect(linkButton()).toBeDefined();
  });

  it('asks for access to the app origin', async () => {
    await enter('http://localhost:3000/some/path');
    component.linkApp();

    expect(ext.permissions.request).toHaveBeenCalledWith({ origins: ['http://localhost/*'] });
  });

  it('does not ask for access without a parseable URL', () => {
    component.linkApp();
    expect(ext.permissions.request).not.toHaveBeenCalled();
  });

  it('fades out and emits the URL once the app is linked', async () => {
    const connected = vi.fn();
    component.connected.subscribe(connected);

    await enter('http://localhost:3000');
    component.linkApp();
    await vi.advanceTimersByTimeAsync(1000);
    expect(component.hideHost()).toBe(true);
    expect(connected).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1000);
    expect(connected).toHaveBeenCalledExactlyOnceWith('http://localhost:3000');
  });

  it('stays put when access is denied', async () => {
    ext.permissions.request.mockResolvedValue(false);
    const connected = vi.fn();
    component.connected.subscribe(connected);

    await enter('http://localhost:3000');
    component.linkApp();
    await vi.advanceTimersByTimeAsync(5000);

    expect(component.hideHost()).toBe(false);
    expect(connected).not.toHaveBeenCalled();
  });
});
