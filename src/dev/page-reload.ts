import { onDevReload } from './dev-socket';

/** Dev-only: reloads this extension page (popup or options) after every build. */
export function connectPageReload(): void {
  onDevReload((scope) => {
    // A full extension reload tears down this page's extension context, so
    // give the new one a moment before asking for the document again.
    const wait = scope === 'extension' ? 1000 : 0;
    setTimeout(() => location.reload(), wait);
  });
}
