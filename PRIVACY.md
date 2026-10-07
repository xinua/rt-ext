# Retriever — Privacy Policy

_Effective date: October 1, 2026_

Retriever is a browser extension that sends video and audio links to the Retriever app, which downloads them. This policy explains what the extension handles, where it goes, and what it never does.

## Summary

- The extension has no servers of its own. It talks only to the Retriever app at the address **you** enter in its options.
- It collects no analytics, telemetry, or advertising identifiers, and it does not sell or share data with anyone.
- Media detection on websites is **off by default**. It only works after you grant the "all sites" permission from the popup, and you can revoke it at any time.

## What the extension handles

### Settings you enter

The Retriever app address, your download presets (quality, format, codec), and options such as "open app after download" and file naming preferences.

**Stored:** in your browser's extension storage (`chrome.storage.local`), on your device only.

### Media found on the pages you visit

If you enable media detection, the extension watches the network requests of your open tabs for audio and video files and streaming manifests (for example `.mp4`, `.mp3`, `.m3u8`, `.mpd`). For each match it keeps:

- the media URL,
- its type and size, taken from the response headers,
- the address of the page that requested it (the `Referer` header), because many sites refuse downloads without it.

It does **not** read page content, form data, cookies, passwords, or request and response bodies.

**Stored:** in session storage (`chrome.storage.session`), separately for each tab, and at most 50 items per tab. A tab's list is cleared when the tab goes to a new page or is closed. All of it is cleared when the browser closes.

### The current tab's address

When you open the popup, the extension reads the address of the active tab to offer that page for download. This happens only when you open the popup.

### YouTube pages

On youtube.com and youtube-nocookie.com, the extension adds "Download video" and "Download audio" items to the player's right-click menu. It reads the video's address only when you pick one of those items.

## What is sent, and where

Data leaves your browser only to the Retriever app address you configured:

| When | What is sent |
| --- | --- |
| You save or check the app address | A connection check (`/api/health`), with no personal data |
| You open the popup while connected | The URLs shown in the popup, so the app can tell you whether they were already downloaded |
| You choose to download | The media or page URL, its referring page, your download preset, and your folder or file-name options |
| While the popup is open | A live connection that receives download progress from the app |

The developer of this extension does not receive any of this data. What the Retriever app does with a request depends on who runs that app. If you use an instance run by someone else, their privacy practices apply to it.

## What the extension does not do

- It does not collect personally identifiable information, health, financial, or authentication data, personal communications, or location.
- It does not track your browsing history. Request inspection is limited to recognising media files, and the results stay in per-tab session storage that is cleared as described above.
- It does not sell, transfer, or share data with third parties, or use it for advertising, creditworthiness, or lending.
- It does not load or run remote code.

## Permissions and why they are needed

| Permission | Why |
| --- | --- |
| `storage` | Saves your settings, and keeps the media found in each tab |
| `activeTab` | Reads the current tab's address when you open the popup |
| `contextMenus` | Adds "Download video/audio" to the right-click menu on YouTube video links |
| `webRequest` | Recognises media files among a tab's network requests (only with the optional permission below) |
| `webNavigation` | Clears a tab's media list when the tab goes to a new page |
| Optional: access to all sites | Needed for media detection on any website. Requested only when you turn detection on in the popup |
| Content script on YouTube | Adds the download items to the YouTube player menu |

## Your choices

- **Turn off media detection:** remove the extension's site access at `chrome://extensions` → Retriever → Details → Site access.
- **Delete stored data:** removing the extension deletes all of its stored settings and media lists.
- **Stop sending data:** clear the app address in the extension's options.

## Children

Retriever is not directed at children under 13 and does not knowingly collect their data.

## Changes

If this policy changes, the new version will be published at this address with a new effective date. Material changes will also be noted in the extension's release notes.

## Contact

Questions about this policy: **[contact email or link]**
