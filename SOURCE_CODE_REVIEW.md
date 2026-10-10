# Retriever — Source Code Review Notes

Instructions for reproducing the Firefox package from this source archive.

## Build environment

| Tool    | Version                                              |
| ------- | ---------------------------------------------------- |
| OS      | Linux                                                |
| Node.js | 24.x (built with 24.21.0)                            |
| pnpm    | 12.5.1 (pinned in `package.json` → `packageManager`) |

If pnpm is not installed, Corepack (bundled with Node.js) provides the pinned version:

```bash
corepack enable
```

## Build steps

From the root of this archive:

```bash
pnpm install --frozen-lockfile
pnpm build:firefox
```

The build is deterministic: running it twice produces byte-identical output.

## Output

| Path                                   | What it is                                    |
| -------------------------------------- | --------------------------------------------- |
| `dist/firefox/`                        | The unpacked extension — compare against this |
| `dist/retriever-<version>-firefox.zip` | The same files, packaged for upload           |

## How the build works

`pnpm build:firefox` runs `scripts/build.mjs`, which does three things in order:

1. **`scripts/build-scripts.mjs`** bundles the background script, the YouTube content script and the app bridge with esbuild (`src/background/`, `src/content/`), and writes `manifest.json` by merging `manifest/base.json` with `manifest/firefox.json`.
2. **`ng build --configuration production,firefox`** builds the popup and options pages (Angular, `src/app/`) and copies the output of step 1 and `public/` into `dist/firefox/`.
3. **`web-ext build`** zips `dist/firefox/`.

Production bundles are minified. Development-only code (`src/dev/`, the live-reload client) is removed at build time through the `__DEV__` flag.

## Source layout

```
manifest/        base manifest + per-browser overrides
scripts/         build scripts
src/app/         Angular popup and options pages
src/background/  background script: API calls, context menu, media detection, app bridge
src/content/     YouTube player menu and the app bridge content script
src/shared/      code used by both sides (storage, messages, supported-site list)
src/dev/         live-reload client, compiled out of production builds
public/          static assets: icons, logo and fonts, copied as is
```

## Third-party code

All runtime dependencies are installed from npm and pinned by `pnpm-lock.yaml`:

- `@angular/*` — framework for the popup and options pages
- `@angular/material`, `@angular/cdk` — UI components
- `rxjs` — used by Angular
- `socket.io-client` — live status updates from the user's Retriever app
- `angular-notifier` — toast notifications on the options page

Fonts are bundled in `public/assets/fonts/`. Nothing is loaded from a CDN or any other remote host at runtime.

## Linter warnings

`web-ext lint` reports a few `UNSAFE_VAR_ASSIGNMENT` (innerHTML) and `DANGEROUS_EVAL` (Function constructor) warnings in `main-*.js`. They come from the bundled third-party libraries listed above. The extension's own code in `src/` uses neither `innerHTML`, `eval` nor `new Function`.

## Trying the extension without the Retriever app

The extension needs a running Retriever app. `backend_mock.js` stands in for it: it answers the same API, keeps everything in memory and downloads nothing.

```bash
node backend_mock.js        # after pnpm install; listens on http://localhost:31080
```

1. Load `dist/firefox/` (`about:debugging` → **Load Temporary Add-on…**). The options page opens.
2. Enter `http://localhost:31080` and allow access to `localhost` when Firefox asks.
3. Open a YouTube video and right-click the player → **Send video**, or open the popup and click a send button.
4. The status goes from queued to completed in a few seconds. Links containing `fail` end as failed, to show the error state.
5. `http://localhost:31080` lists everything sent, and shows whether the app bridge content script has detected the extension.

## Network access

The extension talks only to the Retriever app address the user enters on the options page. It has no servers of its own and sends no analytics or telemetry. See [PRIVACY.md](PRIVACY.md).
