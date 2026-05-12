# Roadmap

These are possible directions for Arena Chat Exporter. This is not a release promise, just a practical list of ideas that fit the current parser architecture.

## Near-Term Improvements


- Add export preview before download.
- Add filename templates.
- Add export for a selected message range.

## Formats

- JSON export with structured `rounds`, `user`, `left`, `right`, and `modelName` fields.
- CSV/TSV export for battle analysis in spreadsheets.
- Better PDF export with full Unicode support and more Markdown styling.

## Usability

- Presets such as `LLM handoff`, `Archive`, and `Model comparison`.
- Copy-to-clipboard export without downloading a file.
- A stricter anonymous dataset mode that removes model names and metadata.

## Parser

- More heuristics for Gradio/Svelte DOM layouts.
- Automated tests against saved Direct and Side-by-Side HTML snapshots.
- Diagnostic mode showing which selectors matched messages and model names.

## Publishing

- Chrome Web Store package preparation.
- Screenshots and a short demo GIF/video for GitHub.
- Issue templates for DOM parsing bugs.
