import { ext } from '../shared/ext';

// Open the options page on first install, so the user can set the app URL.
export function registerInstall(): void {
  ext.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
      void ext.runtime.openOptionsPage();
    }
  });
}
