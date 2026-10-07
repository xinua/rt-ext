import {
  afterRenderEffect,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { TextWidthService } from '../services';

const DEFAULT_TAIL = 8;
const DEFAULT_ELLIPSIS = '…';

/** Collapses whitespace the same way the browser renders it. */
const collapse = (text: string) => text.replace(/\s+/g, ' ');

const isText = (node: Node): node is Text => node.nodeType === Node.TEXT_NODE;

const toTail = (value: unknown) => {
  const tail = numberAttribute(value, DEFAULT_TAIL);
  return Number.isFinite(tail) ? Math.max(Math.trunc(tail), 0) : DEFAULT_TAIL;
};

/**
 * Cuts characters out of the middle of `text` so the result is at most `maxLength` characters long,
 * keeping the first characters and the last `tail` ones: `/home/user/…/clip.mp4`.
 * A `maxLength` of `0` or less leaves the text untouched.
 */
export function truncateMiddle(
  text: string,
  maxLength: number,
  tail = DEFAULT_TAIL,
  ellipsis = DEFAULT_ELLIPSIS,
): string {
  if (maxLength <= 0 || text.length <= maxLength) return text;

  const keep = Math.min(Math.max(tail, 0), Math.max(maxLength - ellipsis.length, 0));
  const head = Math.max(maxLength - ellipsis.length - keep, 0);

  return text.slice(0, head) + ellipsis + (keep ? text.slice(text.length - keep) : '');
}

/**
 * Truncates the middle of the host's text, keeping the last characters visible — useful for paths
 * and file names, where the end carries the meaning that a plain CSS `text-overflow` would hide.
 *
 * ```html
 * <span class="block w-full" rtTruncate="10">{{ source().prefix }}</span>
 * <span rtTruncate [truncateMaxLength]="40">{{ source().url }}</span>
 * ```
 *
 * Without `truncateMaxLength` the text is fitted to the host width, so the host needs a width that
 * does not depend on its own content (a block or an element with an explicit width). The full text
 * stays available as the host's `title`.
 */
@Directive({
  selector: '[rtTruncate]',
  host: {
    '[style.whiteSpace]': '"nowrap"',
    '[style.overflow]': '"hidden"',
    '[attr.title]': 'isTruncated() ? text() : null',
  },
})
export class Truncate {
  private readonly _element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly _widths = inject(TextWidthService);

  /** Untruncated text of every host text node, so our own writes never overwrite the source. */
  private readonly _sources = new Map<Text, string>();

  /** Values written by this directive, used to tell them apart from Angular's interpolation. */
  private readonly _written = new Map<Text, string>();

  private readonly _text = signal('');
  private readonly _width = signal(0);

  /** Bumped when something other than the text itself changes the measured width. */
  private readonly _metrics = signal(0);

  /** Characters always kept at the end of the text. */
  readonly rtTruncate = input(DEFAULT_TAIL, { transform: toTail });

  /** Hard character cap. When omitted, the text is fitted to the host width instead. */
  readonly truncateMaxLength = input(0, {
    transform: (value: unknown) => numberAttribute(value, 0),
  });

  readonly truncateEllipsis = input(DEFAULT_ELLIPSIS);

  /** Full text of the host, as written by the template. */
  readonly text = this._text.asReadonly();

  /** Text currently rendered inside the host. */
  readonly displayed = computed(() => this._shorten(this._text()));

  readonly isTruncated = computed(() => this.displayed() !== this._text());

  constructor() {
    const element = this._element;

    const mutations = new MutationObserver((records) => this._capture(records));
    mutations.observe(element, { characterData: true, childList: true, subtree: true });

    const resizes = new ResizeObserver(([entry]) => this._width.set(entry?.contentRect.width ?? 0));
    resizes.observe(element);

    inject(DestroyRef).onDestroy(() => {
      mutations.disconnect();
      resizes.disconnect();
    });

    void document.fonts?.ready.then(() => this._metrics.update((value) => value + 1));

    afterRenderEffect(() => {
      // Read the source as well: Angular may have rewritten the host with the full text even when
      // the truncated result did not change.
      this._text();
      this._render(this.displayed());
    });
  }

  private _shorten(source: string): string {
    if (!source) return source;

    const tail = this.rtTruncate();
    const ellipsis = this.truncateEllipsis();
    const capped = truncateMiddle(source, this.truncateMaxLength(), tail, ellipsis);

    this._metrics();
    const width = this._width();
    if (!width) return capped;

    const measure = this._widths.measurer(this._element);
    if (!measure || measure(capped) <= width) return capped;

    return this._fit(capped, tail, ellipsis, width, measure);
  }

  /** Largest middle-truncated variant of `text` still fitting into `width`. */
  private _fit(
    text: string,
    tail: number,
    ellipsis: string,
    width: number,
    measure: (text: string) => number,
  ): string {
    const shortest = ellipsis.length + Math.min(tail, text.length);
    if (measure(truncateMiddle(text, shortest, tail, ellipsis)) > width) {
      return truncateMiddle(text, shortest, tail, ellipsis);
    }

    let low = shortest;
    let high = text.length - 1;

    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (measure(truncateMiddle(text, middle, tail, ellipsis)) <= width) low = middle;
      else high = middle - 1;
    }

    return truncateMiddle(text, low, tail, ellipsis);
  }

  private _capture(records: MutationRecord[]): void {
    let changed = false;

    for (const record of records) {
      if (record.type === 'characterData') {
        const node = record.target as Text;
        if (node.parentNode !== this._element) continue;
        if (this._written.get(node) === node.nodeValue) continue;

        this._sources.set(node, node.nodeValue ?? '');
        this._written.delete(node);
        changed = true;
        continue;
      }

      for (const node of record.addedNodes) {
        if (!isText(node) || node.parentNode !== this._element) continue;
        this._sources.set(node, node.nodeValue ?? '');
        changed = true;
      }

      for (const node of record.removedNodes) {
        if (!isText(node) || !this._sources.delete(node)) continue;
        this._written.delete(node);
        changed = true;
      }
    }

    if (changed) this._publish();
  }

  private _publish(): void {
    const text = this._textNodes()
      .map((node) => this._sources.get(node) ?? node.nodeValue ?? '')
      .join('');

    this._text.set(collapse(text).trim());
  }

  private _render(text: string): void {
    // Nothing captured yet (or nothing left to show): never blank the text the template just wrote.
    if (!text) return;

    const [first, ...rest] = this._textNodes();
    if (!first) return;

    this._write(first, text);
    for (const node of rest) this._write(node, '');
  }

  private _write(node: Text, value: string): void {
    if (node.nodeValue === value) return;

    this._written.set(node, value);
    node.nodeValue = value;
  }

  private _textNodes(): Text[] {
    return Array.from(this._element.childNodes).filter(isText);
  }
}
