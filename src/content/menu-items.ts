// Builds our items with the same markup as YouTube's own player menu items,
// so their styles apply.

import type { DownloadKind } from '../shared/messages';

export const MARK = 'retrieverItem';

const SVG_NS = 'http://www.w3.org/2000/svg';

interface MenuItem {
  kind: DownloadKind;
  label: string;
  /** SVG path data, 24x24 viewBox. */
  icon: string;
}

export const ITEMS: MenuItem[] = [
  {
    kind: 'video',
    label: 'Download video',
    // Material Symbols "download"
    icon: 'M12 16l-5-5 1.4-1.45 2.6 2.6V4h2v8.15l2.6-2.6L17 11l-5 5Zm-6 4q-.825 0-1.412-.587Q4 18.825 4 18v-3h2v3h12v-3h2v3q0 .825-.587 1.413Q18.825 20 18 20H6Z',
  },
  {
    kind: 'audio',
    label: 'Download audio',
    // Material Symbols "music_note"
    icon: 'M10 21q-1.65 0-2.825-1.175Q6 18.65 6 17q0-1.65 1.175-2.825Q8.35 13 10 13q.575 0 1.063.137.487.138.937.413V3h6v4h-4v10q0 1.65-1.175 2.825Q11.65 21 10 21Z',
  },
];

function createIcon(d: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'white');
  svg.append(path);
  return svg;
}

export function createItem(
  { kind, label, icon }: MenuItem,
  onClick: (kind: DownloadKind, item: HTMLElement) => void,
): HTMLElement {
  const item = document.createElement('div');
  item.className = 'ytp-menuitem retriever-menuitem';
  item.setAttribute('role', 'menuitem');
  item.tabIndex = 0;
  item.dataset[MARK] = kind;

  const iconBox = document.createElement('div');
  iconBox.className = 'ytp-menuitem-icon';
  iconBox.append(createIcon(icon));

  const labelBox = document.createElement('div');
  labelBox.className = 'ytp-menuitem-label';
  labelBox.textContent = label;

  const content = document.createElement('div');
  content.className = 'ytp-menuitem-content';

  item.append(iconBox, labelBox, content);
  item.addEventListener('click', () => onClick(kind, item));
  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(kind, item);
    }
  });
  return item;
}
