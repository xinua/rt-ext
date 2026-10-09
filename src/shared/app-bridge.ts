// The app bridge: a tiny content script on the Retriever app's own pages that
// tells the app the extension is installed. The unpacked Chrome build has no
// fixed ID, so the app can't message the extension directly; the two talk
// through window.postMessage instead.
//
//   app → { source: 'retriever-app', type: 'ping' }
//   ext → { source: 'retriever-extension', type: 'hello', version }

export const APP_BRIDGE_ID = 'app-bridge';

export const APP_SOURCE = 'retriever-app';
export const EXTENSION_SOURCE = 'retriever-extension';

/**
 * The host permission covering the app URL, e.g. `http://nas/*`. Match patterns
 * can't hold a port, and one without a port matches them all. Null when the URL
 * doesn't parse.
 */
export function appOriginPattern(appUrl: string): string | null {
  try {
    const { protocol, hostname } = new URL(appUrl);
    return `${protocol}//${hostname}/*`;
  } catch {
    return null;
  }
}
