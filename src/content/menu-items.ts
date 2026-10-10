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
    label: 'Send video',
    // Material Icons "play_circle_outline"
    icon: 'M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8 S16.41,20,12,20z M9.5,16.5l7-4.5l-7-4.5V16.5z',
  },
  {
    kind: 'audio',
    label: 'Send audio',
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
