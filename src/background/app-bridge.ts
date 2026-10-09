import type { SettingsModel } from '../app/options/shared/models/forms.model';
import { APP_BRIDGE_ID, appOriginPattern } from '../shared/app-bridge';
import { ext } from '../shared/ext';
import { readStorage } from '../shared/storage';

// Keeps the app bridge registered for the current app URL. The browser only
// injects it once the user grants that origin (the options page asks).
export function registerAppBridge(): void {
  ext.storage.local.onChanged.addListener((changes) => {
    if (!changes['settings']) return;
    const settings = changes['settings'].newValue as SettingsModel | undefined;
    void syncAppBridge(settings?.appUrl ?? '');
  });
  void readStorage().then((storage) => syncAppBridge(storage.settings.appUrl));
}

async function syncAppBridge(appUrl: string): Promise<void> {
  const pattern = appOriginPattern(appUrl);
  const [current] = await ext.scripting.getRegisteredContentScripts({ ids: [APP_BRIDGE_ID] });
  if (current?.matches?.length === 1 && current.matches[0] === pattern) return;

  if (current) await ext.scripting.unregisterContentScripts({ ids: [APP_BRIDGE_ID] });
  if (!pattern) return;
  await ext.scripting.registerContentScripts([
    { id: APP_BRIDGE_ID, matches: [pattern], js: ['app-bridge.js'], runAt: 'document_start' },
  ]);
}
