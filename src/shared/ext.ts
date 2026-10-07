// The WebExtension API for whichever browser runs the extension: Firefox's
// native `browser` namespace, or `chrome` everywhere else. Both are promise
// based in MV3, so call it like `chrome` minus the callbacks. Types still come
// from @types/chrome.
//
// Read from globalThis, so importing this outside an extension (unit tests)
// doesn't throw; it is only undefined there.

interface Globals {
  browser?: typeof chrome;
  chrome?: typeof chrome;
}

export const ext = ((globalThis as Globals).browser ??
  (globalThis as Globals).chrome) as typeof chrome;
