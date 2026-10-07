import { Component, computed, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { StorageService } from '@shared';
import { ext } from '../../../../../shared/ext';

@Component({
  imports: [MatIcon, MatButtonModule],
  selector: 'rt-popup-header',
  styleUrl: './popup-header.css',
  templateUrl: './popup-header.html',
})
export class PopupHeader {
  private readonly _storage = inject(StorageService);

  readonly appUrl = computed(() => this._storage.state().settings.appUrl);

  openApp() {
    if (this.appUrl()) ext.tabs.create({ url: this.appUrl() });
  }

  openOptions() {
    ext.runtime.openOptionsPage();
  }
}
