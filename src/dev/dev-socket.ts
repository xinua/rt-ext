// Dev-only client for scripts/dev-reload.mjs. Both call sites are behind
// `__DEV__`, so none of this survives a production build.

/** Keep in sync with PORT in scripts/dev-reload.mjs. */
const DEV_RELOAD_URL = 'ws://127.0.0.1:8788';
const FIRST_RETRY_MS = 500;
const MAX_RETRY_MS = 10_000;

type Scope = 'page' | 'extension' | 'ping';

/** Reload scopes the dev server announces. `ping` is keepalive and never surfaces. */
export type ReloadScope = Exclude<Scope, 'ping'>;

/**
 * Calls `handler` for every reload the dev server announces, reconnecting with
 * backoff so a restarted (or not-yet-started) dev server recovers on its own.
 */
export function onDevReload(handler: (scope: ReloadScope) => void): void {
  let retryMs = FIRST_RETRY_MS;

  const connect = () => {
    const socket = new WebSocket(DEV_RELOAD_URL);

    socket.addEventListener('open', () => (retryMs = FIRST_RETRY_MS));

    socket.addEventListener('message', ({ data }) => {
      const { scope } = JSON.parse(data as string) as { scope: Scope };
      if (scope !== 'ping') handler(scope);
    });

    // A dropped connection and a refused one both end here.
    socket.addEventListener('close', () => {
      setTimeout(connect, retryMs);
      retryMs = Math.min(retryMs * 2, MAX_RETRY_MS);
    });

    socket.addEventListener('error', () => socket.close());
  };

  connect();
}
