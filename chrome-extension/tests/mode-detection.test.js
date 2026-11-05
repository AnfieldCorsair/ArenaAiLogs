"use strict";

// Regression tests for chat-mode detection and parsing.
//
// The bug this suite locks down: Arena renders "here are two answers, pick the
// better one" inside a Direct chat with the same carousel/slide markup that
// Side-by-Side uses. The old detector answered "Side-by-Side" for any carousel,
// which broke the parse. These tests build synthetic DOM snapshots of both
// layouts and assert the detected mode, the parsed structure and the rendered
// transcripts.
//
// Run: cd chrome-extension/tests && npm install && npm test

const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");

const CONTENT_SCRIPT = path.join(__dirname, "..", "content.js");
const contentSource = fs.readFileSync(CONTENT_SCRIPT, "utf8");

function loadExtension(bodyHtml, options = {}) {
  const dom = new JSDOM(
    `<!doctype html><html><head><title>arena</title></head><body>${bodyHtml}</body></html>`,
    {
      url: options.url || "https://arena.ai/chat/test-chat",
      runScripts: "outside-only",
      pretendToBeVisual: true
    }
  );

  const { window } = dom;
  window.chrome = {
    runtime: {
      lastError: null,
      sendMessage: (_message, callback) => {
        if (callback) {
          callback({ ok: true, phase: "ready" });
        }
      },
      getManifest: () => ({ version: "1.2.0" })
    },
    storage: {
      local: {
        get: (_key, callback) => callback({}),
        set: () => {}
      }
    }
  };

  // The real libraries are not needed: only the text extraction path is used.
  window.TurndownService = class {
    turndown(node) {
      return (node.textContent || "").trim();
    }

    plainText(node) {
      return (node.textContent || "").trim();
    }
  };
  window.html2pdf = () => ({
    from() {
      return this;
    },
    set() {
      return this;
    },
    outputPdf() {
      return Promise.resolve(new window.Blob([]));
    }
  });
  window.TextEncoder = TextEncoder;
  Object.defineProperty(window.navigator, "clipboard", {
    configurable: true,
    value: { writeText: async () => {} }
  });

  window.eval(contentSource);

  const internals = window.__arenaExporterInternals;
  assert.ok(internals, "content.js must expose __arenaExporterInternals for tests");

  return { window, internals, document: window.document };
}

function detect(harness) {
  harness.internals.invalidateAnalysisCache();
  const chatArea = harness.document.querySelector("#chat-area");
  return harness.internals.detectChatMode(chatArea);
}

function parse(harness) {
  harness.internals.invalidateAnalysisCache();
  return harness.internals.parseCurrentChat();
}

// ---------------------------------------------------------------- fixtures ---

const USER_ITEM = `
  <li>
    <div class="bg-surface-raised"><div class="prose"><p>Explain closures</p></div></div>
  </li>`;

function assistantItem(modelName, text) {
  return `
  <li>
    <div class="bg-surface-primary">
      <button class="font-mono"><span class="truncate">${modelName}</span></button>
      <div class="prose"><p>${text}</p></div>
    </div>
  </li>`;
}

function slide(modelName, text) {
  return `
    <div aria-roledescription="slide">
      <span class="font-mono text-xs font-medium"><span class="truncate">${modelName}</span></span>
      <div class="bg-surface-primary"><div class="prose"><p>${text}</p></div></div>
    </div>`;
}

function carouselItem(slidesHtml) {
  return `
  <li>
    <div aria-roledescription="carousel">${slidesHtml}</div>
  </li>`;
}

function modeSelector(label, extra = "") {
  return `<header><button role="combobox"><p>${label}</p></button>${extra}</header>`;
}

function page({ header = "", timelineItems = "", withComposer = true }) {
  return `
    ${header}
    <main>
      <div id="chat-area">
        <ol class="flex flex-col">${timelineItems}</ol>
        ${
          withComposer
            ? `<form><textarea name="message"></textarea><div class="flex justify-between gap-4"><span>x</span></div></form>`
            : ""
        }
      </div>
    </main>`;
}

const directSinglePage = page({
  header: modeSelector("Direct chat"),
  timelineItems: USER_ITEM + assistantItem("gpt-5", "A closure captures its scope.")
});

// The reported bug: two candidate answers from ONE model inside a Direct chat.
const directTwoAnswersPage = page({
  header: modeSelector("Direct chat"),
  timelineItems:
    USER_ITEM +
    carouselItem(
      slide("gpt-5", "First candidate answer") + slide("gpt-5", "Second candidate answer")
    )
});

const sideBySidePage = page({
  header: modeSelector("Side by side"),
  timelineItems: USER_ITEM + carouselItem(slide("Model A", "Left answer") + slide("Model B", "Right answer"))
});

const sideBySideNamedPage = page({
  header: modeSelector("Side by side"),
  timelineItems:
    USER_ITEM + carouselItem(slide("claude-sonnet-4.5", "Left answer") + slide("gpt-5", "Right answer"))
});

const noHeaderSharedPage = page({
  timelineItems: USER_ITEM + carouselItem(slide("gpt-5", "One") + slide("gpt-5", "Two"))
});

const noHeaderDistinctPage = page({
  timelineItems:
    USER_ITEM + carouselItem(slide("claude-sonnet-4.5", "Left") + slide("gpt-5", "Right"))
});

// A closed dropdown that still keeps its option list in the DOM next to the
// current value must not flip the mode to Side-by-Side.
const hiddenOptionsPage = page({
  header: `<header>
      <button role="combobox">
        <p>Direct chat</p>
        <div role="listbox" hidden><p>Side by side</p><p>Battle</p></div>
      </button>
    </header>`,
  timelineItems:
    USER_ITEM + carouselItem(slide("gpt-5", "First candidate answer") + slide("gpt-5", "Second candidate answer"))
});

// ------------------------------------------------------------------ tests ---

test("direct chat without carousel is detected as direct", () => {
  const harness = loadExtension(directSinglePage);
  const detection = detect(harness);

  assert.equal(detection.mode, "direct");
  assert.equal(detection.confidence, "high");
  assert.equal(detection.reason, "mode-selector-label");
});

test("two answers in a direct chat are NOT reported as side-by-side", () => {
  const harness = loadExtension(directTwoAnswersPage);
  const detection = detect(harness);

  assert.equal(detection.mode, "direct", "mode selector says Direct chat, carousel is only answer variants");
  assert.equal(detection.confidence, "high");
});

test("two answers in a direct chat keep every answer in the export", () => {
  const harness = loadExtension(directTwoAnswersPage);
  const chat = parse(harness);

  assert.equal(chat.mode, "direct");
  assert.equal(chat.messages.length, 3, "user message + two candidate answers");
  assert.equal(chat.messages[1].role, "assistant");
  assert.equal(chat.messages[1].variant.total, 2);
  assert.equal(chat.messages[2].variant.index, 2);
  assert.match(chat.messages[1].text, /First candidate answer/);
  assert.match(chat.messages[2].text, /Second candidate answer/);

  const transcript = harness.internals.buildTranscript(chat, "direct-full", "generic");
  assert.equal(transcript.entries.length, 3);
  assert.equal(transcript.entries[1].label, "AI (option 1 of 2)");
  assert.equal(transcript.entries[2].label, "AI (option 2 of 2)");

  const txt = harness.internals.renderTxt(transcript, { includeSeparators: true, separatorStyle: "line" });
  assert.match(txt, /First candidate answer/);
  assert.match(txt, /Second candidate answer/);
  assert.doesNotMatch(txt, /Left model|Right model/);
});

test("side-by-side chat stays side-by-side and keeps left/right", () => {
  const harness = loadExtension(sideBySidePage);
  const detection = detect(harness);
  assert.equal(detection.mode, "battle");
  assert.equal(detection.confidence, "high");

  const chat = parse(harness);
  assert.equal(chat.mode, "battle");
  assert.equal(chat.rounds.length, 1);
  assert.equal(chat.rounds[0].left.modelName, "Model A");
  assert.equal(chat.rounds[0].right.modelName, "Model B");
  assert.equal(chat.rounds[0].left.side, "left");
  assert.equal(chat.rounds[0].right.side, "right");
});

test("side-by-side with real model names is still detected", () => {
  const harness = loadExtension(sideBySideNamedPage);
  assert.equal(detect(harness).mode, "battle");
});

test("carousel without a mode label but with identical models is direct", () => {
  const harness = loadExtension(noHeaderSharedPage);
  const detection = detect(harness);

  assert.equal(detection.mode, "direct");
  assert.equal(detection.reason, "shared-slide-models");
});

test("carousel without a mode label but with distinct models is side-by-side", () => {
  const harness = loadExtension(noHeaderDistinctPage);
  const detection = detect(harness);

  assert.equal(detection.mode, "battle");
  assert.equal(detection.reason, "distinct-slide-models");
});

test("hidden dropdown options do not break mode detection", () => {
  const harness = loadExtension(hiddenOptionsPage);
  const detection = detect(harness);

  assert.equal(detection.mode, "direct");
});

test("manual mode override wins over every heuristic", () => {
  const harness = loadExtension(sideBySidePage);
  harness.internals.state.preferences.modeOverride = "direct";

  const detection = detect(harness);
  assert.equal(detection.mode, "direct");
  assert.equal(detection.confidence, "manual");
  assert.equal(detection.reason, "manual-override");

  // The rescue parser still produces a usable export instead of failing.
  const chat = parse(harness);
  assert.ok(chat.messages.length > 0);
});

test("battle chat forced to direct keeps the answers reachable", () => {
  const harness = loadExtension(sideBySidePage);
  harness.internals.state.preferences.modeOverride = "direct";

  const chat = parse(harness);
  assert.equal(chat.mode, "direct");
  assert.equal(chat.messages.length, 3, "both slides are exported as answer variants");
});

test("direct chat forced to battle falls back to the direct parser", () => {
  const harness = loadExtension(directSinglePage);
  harness.internals.state.preferences.modeOverride = "battle";

  const chat = parse(harness);
  assert.ok(chat.messages.length > 0, "export must not fail when the override is wrong");
  assert.match(harness.internals.state.parseNote, /fallback/);
});

test("diagnostics report answers the question 'why this mode?'", () => {
  const harness = loadExtension(directTwoAnswersPage);
  detect(harness);
  harness.internals.render();

  const report = harness.internals.buildDiagnosticsReport();
  assert.match(report, /detected mode: direct/);
  assert.match(report, /reason: mode-selector-label/);
  assert.match(report, /carousels: 1/);
  assert.match(report, /signals:/);
});

test("panel exposes the mode override and diagnostics controls", () => {
  const harness = loadExtension(directTwoAnswersPage);
  harness.internals.render();

  const root = harness.document.querySelector("#arena-exporter-root");
  assert.ok(root, "export panel is mounted");

  const modeSelect = root.querySelector('[name="arena-exporter-mode"]');
  assert.ok(modeSelect, "Chat mode selector exists");
  assert.deepEqual(
    Array.from(modeSelect.options).map((option) => option.value),
    ["auto", "direct", "battle"]
  );
  assert.equal(modeSelect.value, "auto");

  const toggle = root.querySelector(".arena-exporter-link-button");
  assert.ok(toggle, "diagnostics toggle exists");

  const badge = root.querySelector(".arena-exporter-badge");
  assert.match(badge.textContent, /Direct/);
});

test("switching the mode override re-detects the chat immediately", () => {
  const harness = loadExtension(sideBySidePage);
  harness.internals.render();

  const root = harness.document.querySelector("#arena-exporter-root");
  const modeSelect = root.querySelector('[name="arena-exporter-mode"]');
  assert.match(root.querySelector(".arena-exporter-badge").textContent, /Side-by-Side/);

  modeSelect.value = "direct";
  modeSelect.dispatchEvent(new harness.window.Event("change"));

  assert.equal(harness.internals.state.preferences.modeOverride, "direct");
  assert.equal(harness.internals.state.mode, "direct");
  assert.match(root.querySelector(".arena-exporter-badge").textContent, /Direct/);
});

test("html export of two answers does not draw a side-by-side grid", () => {
  const harness = loadExtension(directTwoAnswersPage);
  const chat = parse(harness);
  const transcript = harness.internals.buildTranscript(chat, "direct-full", "generic");
  const html = harness.internals.renderHtml(transcript);

  assert.match(html, /First candidate answer/);
  assert.match(html, /Second candidate answer/);
  assert.match(html, /option 1 of 2/);
  assert.doesNotMatch(html, /class="battle-grid"/);
  assert.doesNotMatch(html, /class="message assistant-message (left|right)-message"/);
});

test("every i18n key used by the code exists in all languages", () => {
  const harness = loadExtension(directSinglePage);
  const { I18N } = harness.internals;
  const usedKeys = new Set();
  const keyPattern = /\bt\("([a-zA-Z0-9._]+)"/g;
  let match = keyPattern.exec(contentSource);

  while (match) {
    usedKeys.add(match[1]);
    match = keyPattern.exec(contentSource);
  }

  assert.ok(usedKeys.size > 30, "key scan must find the i18n usages");

  Object.keys(I18N).forEach((language) => {
    const missing = [...usedKeys].filter((key) => !(key in I18N[language]));
    assert.deepEqual(missing, [], `language "${language}" is missing keys`);
  });
});

test("pages without a chat area or timeline do not crash the panel", () => {
  const harness = loadExtension("<main><h1>Arena</h1></main>");
  const detection = harness.internals.detectChatMode(null);
  assert.equal(detection.confidence, "low");
  assert.equal(harness.internals.render(), false);

  const emptyPage = loadExtension(
    `<div id="chat-area"><ol></ol><form><textarea name="message"></textarea><div class="flex justify-between gap-4"><span>x</span></div></form></div>`
  );
  assert.equal(emptyPage.internals.render(), true, "panel still mounts on an empty chat");
  assert.equal(emptyPage.internals.detectChatMode(emptyPage.document.querySelector("#chat-area")).mode, "direct");
  assert.throws(() => emptyPage.internals.parseCurrentChat(), /No exportable chat messages|не найдены/i);
});
