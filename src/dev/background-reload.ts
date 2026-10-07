import { ext } from '../shared/ext';
import { DEV_PING } from './content-ping';
import { onDevReload } from './dev-socket';

// chrome.runtime.reload() restarts this worker, so the tabs whose content
// script needs re-injecting are handed to the next run through storage.
const PENDING_TABS_KEY = 'devReloadPendingTabs';

/** Dev-only: reloads the extension when the manifest, worker or content script changes. */
export function connectBackgroundReload(): void {
  void reloadPendingTabs();

  onDevReload(async (scope) => {
    if (scope !== 'extension') return;

    await ext.storage.local.set({ [PENDING_TABS_KEY]: await contentScriptTabs() });
    ext.runtime.reload();
  });
}

/**
 * Tabs whose content script answers a ping. Without the `tabs` permission
 * `chrome.tabs.query` ignores its `url` filter, so asking the tabs is the only
 * way to tell them apart; tabs without the content script reject.
 */
async function contentScriptTabs(): Promise<number[]> {
  const ids = (await ext.tabs.query({})).map(({ id }) => id).filter((id) => id !== undefined);
  const answers = await Promise.all(
    ids.map((id) =>
      ext.tabs
        .sendMessage<{ type: string }, boolean>(id, { type: DEV_PING })
        .then((ok) => (ok ? id : undefined))
        .catch(() => undefined),
    ),
  );

  return answers.filter((id) => id !== undefined);
}

/** Reloads the tabs the previous run flagged, so their content script comes back. */
async function reloadPendingTabs(): Promise<void> {
  const stored = await ext.storage.local.get(PENDING_TABS_KEY);
  const ids: unknown = stored[PENDING_TABS_KEY];
  if (!Array.isArray(ids) || ids.length === 0) return;

  await ext.storage.local.remove(PENDING_TABS_KEY);
  await Promise.all(ids.map((id: number) => ext.tabs.reload(id).catch(() => undefined)));
}
