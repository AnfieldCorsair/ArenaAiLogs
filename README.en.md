# Arena Chat Exporter

A Manifest V3 extension for Chrome, Chromium, and Brave. It injects an export menu directly into `arena.ai` and `chat.lmsys.org`, parses Direct and Side-by-Side chats, and saves clean chat logs.

## Features

- Direct and Side-by-Side chat export.
- Direct chats where Arena offers two answers to pick from: both answers are exported and labelled `option 1 of 2` / `option 2 of 2` instead of being mistaken for a battle.
- Formats: `TXT`, `Markdown`, `HTML`, `PDF`.
- HTML export keeps a readable battle layout: user prompt on top, left and right answers in columns.
- PDF export preserves Unicode text visually without `????`; use HTML or TXT when reliable text copying matters.
- Assistant label modes: `1 / 2`, `Left model / Right model`, `AI`, real model names in the file header, or real model names per message.
- Configurable spacing between messages: normal spacing creates 3 blank lines, large spacing creates 8.
- Media tags (`img`, `svg`, `canvas`, `video`) are replaced with placeholders like `[Media 1]`.
- Chat mode is detected from evidence (mode selector label, per-slide model names, answer-slot geometry), not from "there is a carousel on the page".
- Manual `Chat mode` override (`Auto-detect` / `Direct chat` / `Side-by-Side`) when the page changes again.
- Built-in diagnostics: one click shows why a mode was detected, how many carousels/slides were found and which selectors matched, plus `Copy report`.
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
3. Choose language, format, assistant labels, separator style and, if needed, the chat mode.
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

Run the DOM parsing regression tests (Node 18+, they use jsdom and synthetic Arena snapshots):

```bash
cd chrome-extension/tests
npm install
npm test
```

The suite covers the "two answers in a Direct chat" layout, both Side-by-Side layouts, a missing mode label, a closed dropdown that keeps its options in the DOM, the manual override and the rescue parsing path.

## Chat Mode Detection

The mode badge in the panel shows how the mode was chosen:

- `Mode: Direct` / `Mode: Side-by-Side` — a confident detection;
- `Mode: Direct (?)` — the page gave no clear marker, so the answer-variant interpretation was used. The export still works, but the mode can be fixed manually;
- dashed badge — auto-detection is uncertain or a manual override is active.

Click `Diagnostics` to see the reason (`mode-selector-label`, `shared-slide-models`, `distinct-slide-models`, `answers-in-one-slot`, `ambiguous-carousel`, `manual-override`) together with slide/model counts.

## Limitations

- PDF is best treated as a visual archive. Use HTML for copy-friendly text and the best Side-by-Side layout.
- `chat.lmsys.org` support uses a best-effort fallback because its DOM can vary from Arena snapshots.
- If Arena ships a new layout, detection may report `(?)`. Use the `Chat mode` override and send the `Copy report` output in the bug report.


## 🛡️ Security & Privacy Audit

I value transparency. Here is why this extension is safe to use:

1. **100% Local Execution**: All processing (PDF generation, Markdown conversion) happens inside your browser. No data ever leaves your machine.
2. **No External Calls**: The extension does not use `fetch` or `XMLHttpRequest` to send data to external servers. It has zero telemetry.
3. **Bundled Dependencies**: Libraries like `html2pdf.js` and `turndown` are included locally in the `/lib` folder. We do not load scripts from CDNs or third-party clouds.
4. **Manifest V3**: Complies with the latest Chrome security standards, which restrict the execution of remote code.
5. **Open Source**: Every line of code is available for manual audit. You can verify the `static-checks.ps1` in the `/tests` folder to see how the code is validated.

**No Cloud. No Tracking. Just your logs.**