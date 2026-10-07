import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextWidthService } from '../services';
import { Truncate, truncateMiddle } from './truncate';

/** `ResizeObserver` is missing from the test DOM, and lets tests feed a width of their own. */
class ResizeObserverStub {
  static instances: ResizeObserverStub[] = [];

  constructor(private readonly _callback: ResizeObserverCallback) {
    ResizeObserverStub.instances.push(this);
  }

  /** The stub never watches anything: tests push widths through `emit` instead. */
  observe(): void {
    // noop
  }

  unobserve(): void {
    // noop
  }

  disconnect(): void {
    // noop
  }

  emit(width: number): void {
    const entry = { contentRect: { width } } as ResizeObserverEntry;
    this._callback([entry], this as unknown as ResizeObserver);
  }
}

/** Ten pixels per character, so expectations can be written in characters. */
class TextWidthStub {
  measurer(): (text: string) => number {
    return (text) => text.length * 10;
  }
}

@Component({
  imports: [Truncate],
  template: `<span [rtTruncate]="tail()" [truncateMaxLength]="maxLength()">{{ text() }}</span>`,
})
class Host {
  readonly text = signal('/home/denis/videos/awesome-clip.mp4');
  readonly tail = signal(8);
  readonly maxLength = signal(0);
}

describe('truncateMiddle', () => {
  it('keeps the requested amount of characters at the end', () => {
    expect(truncateMiddle('abcdefghij', 8, 3)).toBe('abcd…hij');
  });

  it('leaves text that already fits untouched', () => {
    expect(truncateMiddle('abcdefghij', 10, 3)).toBe('abcdefghij');
    expect(truncateMiddle('abc', 10, 3)).toBe('abc');
  });

  it('leaves text untouched without a limit', () => {
    expect(truncateMiddle('abcdefghij', 0, 3)).toBe('abcdefghij');
  });

  it('drops the head entirely when the tail alone fills the limit', () => {
    expect(truncateMiddle('abcdefghij', 4, 8)).toBe('…hij');
  });

  it('honours a custom ellipsis', () => {
    expect(truncateMiddle('abcdefghij', 8, 3, '...')).toBe('ab...hij');
  });
});

describe('Truncate', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  /** Lets the mutation observer deliver, then re-renders. */
  const settle = async () => {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  };

  const rendered = () => fixture.nativeElement.querySelector('span').textContent;
  const title = () => fixture.nativeElement.querySelector('span').getAttribute('title');

  beforeEach(async () => {
    ResizeObserverStub.instances = [];
    globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [{ provide: TextWidthService, useValue: new TextWidthStub() }],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
    await settle();
  });

  it('leaves the text alone while no limit and no width apply', async () => {
    expect(rendered()).toBe('/home/denis/videos/awesome-clip.mp4');
    expect(title()).toBeNull();
  });

  it('truncates the middle up to the maximum length', async () => {
    host.maxLength.set(20);
    await settle();

    expect(rendered()).toBe('/home/denis…clip.mp4');
    expect(rendered().length).toBe(20);
  });

  it('exposes the full text as the title once truncated', async () => {
    host.maxLength.set(20);
    await settle();

    expect(title()).toBe('/home/denis/videos/awesome-clip.mp4');
  });

  it('keeps the requested amount of trailing characters', async () => {
    host.maxLength.set(20);
    host.tail.set(4);
    await settle();

    expect(rendered()).toBe('/home/denis/vid….mp4');
  });

  it('re-truncates when the text changes', async () => {
    host.maxLength.set(20);
    await settle();

    host.text.set('/home/denis/music/great-song.mp3');
    await settle();

    expect(rendered()).toBe('/home/denis…song.mp3');
    expect(title()).toBe('/home/denis/music/great-song.mp3');
  });

  it('restores the full text when it fits again', async () => {
    host.maxLength.set(20);
    await settle();

    host.text.set('short.mp4');
    await settle();

    expect(rendered()).toBe('short.mp4');
    expect(title()).toBeNull();
  });

  it('fits the text into the measured width', async () => {
    ResizeObserverStub.instances.at(-1)?.emit(200);
    await settle();

    // 20 characters at ten pixels each.
    expect(rendered()).toBe('/home/denis…clip.mp4');
  });

  it('shows the ellipsis and the tail when even that overflows', async () => {
    ResizeObserverStub.instances.at(-1)?.emit(50);
    await settle();

    expect(rendered()).toBe('…clip.mp4');
  });
});
