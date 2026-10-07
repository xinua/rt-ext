import { Service } from '@angular/core';

/** Measures rendered text width with a detached canvas, so nothing is added to the layout. */
@Service()
export class TextWidthService {
  private _context: CanvasRenderingContext2D | null | undefined;

  /**
   * Returns a function measuring text in pixels with the font currently applied to `element`,
   * or `null` when the environment cannot measure text (no canvas support, unresolved styles).
   */
  measurer(element: HTMLElement): ((text: string) => number) | null {
    const context = this._resolveContext();
    if (!context) return null;

    const style = getComputedStyle(element);
    if (!style.fontSize || !style.fontFamily) return null;

    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    if (style.letterSpacing.endsWith('px')) context.letterSpacing = style.letterSpacing;

    return (text) => context.measureText(text).width;
  }

  private _resolveContext(): CanvasRenderingContext2D | null {
    if (this._context === undefined) {
      this._context = document.createElement('canvas').getContext('2d');
    }

    return this._context;
  }
}
