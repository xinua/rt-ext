// Adds "Download video" / "Download audio" items to the YouTube player's
// own right-click menu (.ytp-contextmenu).

import { ext } from '../shared/ext';
import type { DownloadKind, DownloadMessage } from '../shared/messages';
import { ITEMS, createItem } from './menu-items';

// Player the context menu was last opened on. The menu itself is attached
// to <body>, so it can't be used to find its player.
let lastPlayer: Element | null = null;

// Off until the options page has an app URL to send downloads to.
let enabled = false;

export function setEnabled(value: boolean): void {
  enabled = value;
  if (enabled) injectAll();
  else document.querySelectorAll('[data-retriever-item]').forEach((item) => item.remove());
}

export function setLastPlayer(player: Element): void {
  lastPlayer = player;
}

function getVideoUrl(): string {
  const titleLink = lastPlayer?.querySelector<HTMLAnchorElement>('a.ytp-title-link[href]');
  return titleLink?.href || location.href;
}

function onItemClick(kind: DownloadKind, item: HTMLElement): void {
  const message: DownloadMessage = { type: 'retriever:download', kind, url: getVideoUrl() };
  void ext.runtime.sendMessage(message);
  closeMenu(item.closest('.ytp-contextmenu'));
}

function closeMenu(menu: Element | null): void {
  if (!menu) return;
  menu.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }),
  );
}

function inject(panelMenu: HTMLElement): void {
  if (panelMenu.querySelector('[data-retriever-item]')) return;
  panelMenu.prepend(...ITEMS.map((item) => createItem(item, onItemClick)));

  const popup = panelMenu.closest<HTMLElement>('.ytp-popup');
  if (popup) {
    fitHeight(popup, panelMenu);
    new MutationObserver(() => fitHeight(popup, panelMenu)).observe(popup, {
      attributes: true,
      attributeFilter: ['style'],
    });
  }
}

// YouTube creates the menu lazily on the first right-click and measures it
// before our items are in, so that first time they'd be clipped (scrollbar).
// Grow the measured boxes by whatever overflows. No-op once it fits, so it
// is safe to run on every style change YouTube makes.
function fitHeight(popup: HTMLElement, panelMenu: HTMLElement): void {
  const panel = panelMenu.closest<HTMLElement>('.ytp-panel');
  if (!panel || popup.style.display === 'none') return;
  const extra = panel.scrollHeight - panel.clientHeight;
  if (extra <= 0) return;
  for (const el of [popup, panel, panelMenu]) {
    const h = parseFloat(el.style.height);
    if (h) el.style.height = `${h + extra}px`;
  }
}

export function injectAll(): void {
  if (!enabled) return;
  document.querySelectorAll<HTMLElement>('.ytp-contextmenu .ytp-panel-menu').forEach(inject);
}
