import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';
import { ICONS_REGISTRY } from '../constants/registry.const';

export const useIconFactory = (sanitizer: DomSanitizer, registry: MatIconRegistry) => () =>
  Object.entries(ICONS_REGISTRY).forEach((icons) => {
    icons.forEach((icon: string) => {
      const [path, iconName] = icon.split('/');

      registry.addSvgIcon(
        iconName || path,
        sanitizer.bypassSecurityTrustResourceUrl(
          `/assets/icons/${path}${iconName ? `/${iconName}` : ''}.svg`,
        ),
      );
    });
  });
