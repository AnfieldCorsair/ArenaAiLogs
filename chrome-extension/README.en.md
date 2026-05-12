# Arena Chat Exporter

A Manifest V3 extension for Chrome, Chromium, and Brave. It injects an export menu directly into `arena.ai` and `chat.lmsys.org`, parses Direct and Side-by-Side chats, and saves clean chat logs.

## Features

- Direct and Side-by-Side chat export.
- Formats: `TXT`, `Markdown`, `HTML`, `PDF`.
- HTML export keeps a readable battle layout: user prompt on top, left and right answers in columns.
- PDF export preserves Unicode text visually without `????`; use HTML or TXT when reliable text copying matters.
- Assistant label modes: `1 / 2`, `Left model / Right model`, `AI`, real model names in the file header, or real model names per message.
- Configurable spacing between messages: normal spacing creates 3 blank lines, large spacing creates 8.
- Media tags (`img`, `svg`, `canvas`, `video`) are replaced with placeholders like `[Media 1]`.
- EN/RU/DE/ES/PT interface toggle.
- Preferences are persisted with `chrome.storage`.

## Installation

1. Open `chrome://extensions/`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select the `chrome-extension` folder.
5. Reload the chat page.

## Usage

1. Open a chat on `arena.ai` or `chat.lmsys.org`.
2. Wait for the `Export Chat` block below the composer.
3. Choose language, format, assistant labels, and separator style.
4. Enable `Ask where to save` only if you want Chrome's save dialog.
5. Click the export action you need.

## Save Folder Behavior

Chrome does not expose the selected system save path to extensions. Because of that, the extension cannot directly remember an arbitrary folder chosen in the save dialog.

The supported behavior is:

- with `Ask where to save` enabled, Chrome opens the save dialog and usually remembers the last selected folder itself;
- with it disabled, files are saved silently to the browser's default downloads folder.

The save dialog is disabled by default so repeated exports do not require choosing a folder every time.

## Architecture

- `content.js` parses the DOM, formats TXT/Markdown/HTML/PDF, and creates Data URIs.
- `background.js` does not use DOM APIs, `Blob`, or `URL.createObjectURL`; it only calls `chrome.downloads.download`.
- The on-page UI is injected by the content script and maintained with `MutationObserver`.
- Local libraries live in `lib/`; no CDN is required.

## Tests

Run static release checks from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File chrome-extension/tests/static-checks.ps1
```

## Limitations

- PDF is best treated as a visual archive. Use HTML for copy-friendly text and the best Side-by-Side layout.
- `chat.lmsys.org` support uses a best-effort fallback because its DOM can vary from Arena snapshots.
