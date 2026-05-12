"use strict";

(() => {
  const ROOT_ID = "arena-exporter-root";
  const MODE = {
    DIRECT: "direct",
    BATTLE: "battle"
  };

  const FORMAT = {
    TXT: "txt",
    MD: "md",
    PDF: "pdf",
    HTML: "html"
  };

  const NAMING = {
    NUMBERED: "numbered",
    SIDE: "side",
    GENERIC: "generic",
    HEADER: "header",
    PER_MESSAGE: "per-message"
  };

  const SEPARATOR = {
    BLANK: "blank",
    LINE: "line",
    WIDE: "wide",
    CUSTOM: "custom"
  };

  const PREFS_KEY = "arenaExporterPreferencesV2";

  const DEFAULT_PREFERENCES = {
    format: FORMAT.TXT,
    naming: NAMING.GENERIC,
    includeSeparators: true,
    separatorStyle: SEPARATOR.LINE,
    customSeparator: "---",
    saveAs: false
  };

  const SIDE = {
    LEFT: "left",
    RIGHT: "right"
  };

  const HOST_KIND = {
    ARENA: "arena",
    LMSYS: "lmsys",
    OTHER: "other"
  };

  const LANGUAGE = {
    EN: "en",
    RU: "ru",
    DE: "de",
    ES: "es",
    PT: "pt"
  };

  const PRIMARY_LANGUAGES = [
    { id: LANGUAGE.EN, label: "EN" },
    { id: LANGUAGE.RU, label: "RU" }
  ];

  const OTHER_LANGUAGES = [
    { id: LANGUAGE.DE, label: "DE" },
    { id: LANGUAGE.ES, label: "ES" },
    { id: LANGUAGE.PT, label: "PT" }
  ];

  const LANGUAGES = [...PRIMARY_LANGUAGES, ...OTHER_LANGUAGES];

  const SELECTORS = {
    chatArea: "#chat-area",
    carousel: '[aria-roledescription="carousel"]',
    slide: '[aria-roledescription="slide"]',
    composerInput: 'textarea[name="message"]',
    composerToolbar: "div.flex.justify-between.gap-4",
    prose: ".prose",
    hiddenMessageTitle: 'h2.hidden, h2[class*="hidden"]',
    directUserBubble: ".bg-surface-raised",
    battleModelName: "span.font-mono.text-xs.font-medium span.truncate",
    directModelNameButton: "button.font-mono span.truncate"
  };

  const ACTIONS = {
    [MODE.DIRECT]: [
      { id: "direct-full", labelKey: "action.directFull" },
      { id: "direct-user-only", labelKey: "action.directUserOnly" },
      { id: "direct-model-only", labelKey: "action.directModelOnly" }
    ],
    [MODE.BATTLE]: [
      { id: "battle-full", labelKey: "action.battleFull" },
      { id: "battle-left-chat", labelKey: "action.battleLeftChat" },
      { id: "battle-right-chat", labelKey: "action.battleRightChat" },
      { id: "battle-user-only", labelKey: "action.battleUserOnly" },
      { id: "battle-left-only", labelKey: "action.battleLeftOnly" },
      { id: "battle-right-only", labelKey: "action.battleRightOnly" }
    ]
  };

  const I18N = {
    en: {
      "action.directFull": "Export: Full chat",
      "action.directUserOnly": "Export: User prompts",
      "action.directModelOnly": "Export: Model answers",
      "action.battleFull": "Export: Full battle thread",
      "action.battleLeftChat": "Export: Left chat only",
      "action.battleRightChat": "Export: Right chat only",
      "action.battleUserOnly": "Export: User prompts",
      "action.battleLeftOnly": "Export: Left model answers",
      "action.battleRightOnly": "Export: Right model answers",
      "badge.detecting": "Mode: Detecting",
      "badge.direct": "Mode: Direct",
      "badge.battle": "Mode: Side-by-Side",
      "button.open": "Open export menu",
      "button.close": "Close export menu",
      "field.format": "Format",
      "field.naming": "Model naming",
      "hint": "Exports TXT, Markdown, or PDF directly from the page. Media attachments are represented as placeholders.",
      "lang.en": "EN",
      "lang.ru": "RU",
      "media": "[Media {index}]",
      "naming.anonymous": "Anonymous AI label",
      "naming.header": "Model name in file header",
      "naming.perMessage": "Model name per message",
      "status.creating": "Creating download...",
      "status.preparing": "Preparing export...",
      "status.saved": "Saved: {filename}",
      "error.chatContainer": "Chat container was not found.",
      "error.mode": "Chat mode could not be detected.",
      "error.noMessages": "No exportable chat messages were found in the current page.",
      "error.emptySelection": "Nothing matched the selected export option.",
      "error.download": "Download request failed.",
      "fallback.noText": "[No text captured]",
      "label.user": "User",
      "label.ai": "AI",
      "label.leftAI": "Left AI",
      "label.rightAI": "Right AI",
      "model.left": "Left Model",
      "model.right": "Right Model",
      "title.direct": "Arena Direct Chat",
      "title.battle": "Arena Side-by-Side Chat",
      "title.ui": "Export Chat"
    },
    ru: {
      "action.directFull": "Экспорт: весь чат",
      "action.directUserOnly": "Экспорт: запросы пользователя",
      "action.directModelOnly": "Экспорт: ответы модели",
      "action.battleFull": "Экспорт: вся ветка",
      "action.battleLeftChat": "Экспорт: левый чат",
      "action.battleRightChat": "Экспорт: правый чат",
      "action.battleUserOnly": "Экспорт: запросы пользователя",
      "action.battleLeftOnly": "Экспорт: ответы левой модели",
      "action.battleRightOnly": "Экспорт: ответы правой модели",
      "badge.detecting": "Режим: определяется",
      "badge.direct": "Режим: Direct",
      "badge.battle": "Режим: Side-by-Side",
      "button.open": "Открыть меню экспорта",
      "button.close": "Закрыть меню экспорта",
      "field.format": "Формат",
      "field.naming": "Подпись модели",
      "hint": "Экспортирует TXT, Markdown или PDF прямо со страницы. Медиафайлы заменяются плейсхолдерами.",
      "lang.en": "EN",
      "lang.ru": "RU",
      "media": "[Медиа {index}]",
      "naming.anonymous": "Обезличенная подпись AI",
      "naming.header": "Имя модели в заголовке файла",
      "naming.perMessage": "Имя модели у каждого сообщения",
      "status.creating": "Создаю скачивание...",
      "status.preparing": "Готовлю экспорт...",
      "status.saved": "Сохранено: {filename}",
      "error.chatContainer": "Контейнер чата не найден.",
      "error.mode": "Не удалось определить режим чата.",
      "error.noMessages": "На текущей странице не найдены сообщения для экспорта.",
      "error.emptySelection": "Выбранная опция экспорта не содержит сообщений.",
      "error.download": "Не удалось запустить скачивание.",
      "fallback.noText": "[Текст не найден]",
      "label.user": "User",
      "label.ai": "AI",
      "label.leftAI": "Left AI",
      "label.rightAI": "Right AI",
      "model.left": "Левая модель",
      "model.right": "Правая модель",
      "title.direct": "Arena Direct Chat",
      "title.battle": "Arena Side-by-Side Chat",
      "title.ui": "Экспорт чата"
    }
  };

  Object.assign(I18N.en, {
    "action.battleLeftOnly": "Export: Left answers",
    "action.battleRightOnly": "Export: Right answers",
    "field.customSeparator": "Custom separator",
    "field.naming": "Assistant labels",
    "field.saveAs": "Ask where to save",
    "field.separator": "Message separator",
    "field.useSeparator": "Add spacing",
    "language.other": "Other",
    "hint": "Exports TXT, Markdown, PDF, or HTML directly from the page. HTML keeps Side-by-Side layout and selectable text.",
    "naming.generic": "Generic: AI",
    "naming.header": "Real names in file header",
    "naming.numbered": "Message numbers: #1, #2",
    "naming.perMessage": "Real name per message",
    "naming.side": "Side labels: Left model / Right model",
    "separator.blank": "Blank line",
    "separator.custom": "Custom",
    "separator.line": "Normal spacing",
    "separator.wide": "Large spacing",
    "label.left": "Left model",
    "label.one": "1",
    "label.right": "Right model",
    "label.two": "2"
  });

  Object.assign(I18N.ru, {
    "action.battleLeftOnly": "Экспорт: левые ответы",
    "action.battleRightOnly": "Экспорт: правые ответы",
    "field.customSeparator": "Свой разделитель",
    "field.naming": "Подписи ответов",
    "field.saveAs": "Спрашивать папку сохранения",
    "field.separator": "Разделитель сообщений",
    "field.useSeparator": "Добавлять отступы",
    "language.other": "Other",
    "hint": "Экспортирует TXT, Markdown, PDF или HTML прямо со страницы. HTML сохраняет Side-by-Side разметку и копируемый текст.",
    "media": "[Медиа {index}]",
    "naming.generic": "Обезличенно: AI",
    "naming.header": "Реальные имена в заголовке",
    "naming.numbered": "Номера сообщений: #1, #2",
    "naming.perMessage": "Реальное имя у каждого ответа",
    "naming.side": "Стороны: Left model / Right model",
    "separator.blank": "Пустая строка",
    "separator.custom": "Свой",
    "separator.line": "Обычный отступ",
    "separator.wide": "Большой отступ",
    "label.left": "Left model",
    "label.one": "1",
    "label.right": "Right model",
    "label.two": "2",
    "model.left": "Левая модель",
    "model.right": "Правая модель",
    "title.ui": "Экспорт чата"
  });

  I18N.de = {
    ...I18N.en,
    "action.directFull": "Export: ganzer Chat",
    "action.directUserOnly": "Export: Nutzeranfragen",
    "action.directModelOnly": "Export: Modellantworten",
    "action.battleFull": "Export: kompletter Vergleich",
    "action.battleLeftChat": "Export: linker Chat",
    "action.battleRightChat": "Export: rechter Chat",
    "action.battleUserOnly": "Export: Nutzeranfragen",
    "action.battleLeftOnly": "Export: linke Antworten",
    "action.battleRightOnly": "Export: rechte Antworten",
    "badge.detecting": "Modus: Erkennung",
    "badge.direct": "Modus: Direct",
    "badge.battle": "Modus: Side-by-Side",
    "button.open": "Exportmenu offnen",
    "button.close": "Exportmenu schliessen",
    "field.customSeparator": "Eigener Abstand",
    "field.format": "Format",
    "field.naming": "Beschriftung",
    "field.saveAs": "Speicherort abfragen",
    "field.separator": "Abstand zwischen Nachrichten",
    "field.useSeparator": "Abstand einfugen",
    "language.other": "Other",
    "hint": "Exportiert TXT, Markdown, PDF oder HTML direkt von der Seite. HTML behalt das Side-by-Side-Layout.",
    "media": "[Medium {index}]",
    "naming.generic": "Neutral: AI",
    "naming.header": "Echte Namen im Dateikopf",
    "naming.numbered": "Nachrichtennummern: #1, #2",
    "naming.perMessage": "Echter Name pro Nachricht",
    "naming.side": "Seiten: Left model / Right model",
    "separator.blank": "Leerzeile",
    "separator.custom": "Eigener",
    "separator.line": "Normaler Abstand",
    "separator.wide": "Grosser Abstand",
    "status.creating": "Download wird erstellt...",
    "status.preparing": "Export wird vorbereitet...",
    "status.saved": "Gespeichert: {filename}",
    "error.chatContainer": "Chat-Container wurde nicht gefunden.",
    "error.mode": "Chat-Modus konnte nicht erkannt werden.",
    "error.noMessages": "Keine exportierbaren Nachrichten gefunden.",
    "error.emptySelection": "Diese Exportoption enthalt keine Nachrichten.",
    "error.download": "Download konnte nicht gestartet werden.",
    "fallback.noText": "[Kein Text gefunden]",
    "title.ui": "Chat exportieren"
  };

  I18N.es = {
    ...I18N.en,
    "action.directFull": "Exportar: chat completo",
    "action.directUserOnly": "Exportar: prompts del usuario",
    "action.directModelOnly": "Exportar: respuestas del modelo",
    "action.battleFull": "Exportar: comparacion completa",
    "action.battleLeftChat": "Exportar: chat izquierdo",
    "action.battleRightChat": "Exportar: chat derecho",
    "action.battleUserOnly": "Exportar: prompts del usuario",
    "action.battleLeftOnly": "Exportar: respuestas izquierdas",
    "action.battleRightOnly": "Exportar: respuestas derechas",
    "badge.detecting": "Modo: detectando",
    "badge.direct": "Modo: Direct",
    "badge.battle": "Modo: Side-by-Side",
    "button.open": "Abrir menu de exportacion",
    "button.close": "Cerrar menu de exportacion",
    "field.customSeparator": "Separador personalizado",
    "field.format": "Formato",
    "field.naming": "Etiquetas",
    "field.saveAs": "Preguntar donde guardar",
    "field.separator": "Espacio entre mensajes",
    "field.useSeparator": "Agregar espacio",
    "language.other": "Other",
    "hint": "Exporta TXT, Markdown, PDF o HTML directamente desde la pagina. HTML conserva el diseno Side-by-Side.",
    "media": "[Medio {index}]",
    "naming.generic": "Generico: AI",
    "naming.header": "Nombres reales en el encabezado",
    "naming.numbered": "Numeros de mensaje: #1, #2",
    "naming.perMessage": "Nombre real por mensaje",
    "naming.side": "Lados: Left model / Right model",
    "separator.blank": "Linea vacia",
    "separator.custom": "Personalizado",
    "separator.line": "Espacio normal",
    "separator.wide": "Espacio grande",
    "status.creating": "Creando descarga...",
    "status.preparing": "Preparando exportacion...",
    "status.saved": "Guardado: {filename}",
    "error.chatContainer": "No se encontro el contenedor del chat.",
    "error.mode": "No se pudo detectar el modo del chat.",
    "error.noMessages": "No se encontraron mensajes exportables.",
    "error.emptySelection": "La opcion elegida no contiene mensajes.",
    "error.download": "No se pudo iniciar la descarga.",
    "fallback.noText": "[Texto no encontrado]",
    "title.ui": "Exportar chat"
  };

  I18N.pt = {
    ...I18N.en,
    "action.directFull": "Exportar: chat completo",
    "action.directUserOnly": "Exportar: prompts do usuario",
    "action.directModelOnly": "Exportar: respostas do modelo",
    "action.battleFull": "Exportar: comparacao completa",
    "action.battleLeftChat": "Exportar: chat esquerdo",
    "action.battleRightChat": "Exportar: chat direito",
    "action.battleUserOnly": "Exportar: prompts do usuario",
    "action.battleLeftOnly": "Exportar: respostas esquerdas",
    "action.battleRightOnly": "Exportar: respostas direitas",
    "badge.detecting": "Modo: detectando",
    "badge.direct": "Modo: Direct",
    "badge.battle": "Modo: Side-by-Side",
    "button.open": "Abrir menu de exportacao",
    "button.close": "Fechar menu de exportacao",
    "field.customSeparator": "Separador personalizado",
    "field.format": "Formato",
    "field.naming": "Rotulos",
    "field.saveAs": "Perguntar onde salvar",
    "field.separator": "Espaco entre mensagens",
    "field.useSeparator": "Adicionar espaco",
    "language.other": "Other",
    "hint": "Exporta TXT, Markdown, PDF ou HTML diretamente da pagina. HTML preserva o layout Side-by-Side.",
    "media": "[Midia {index}]",
    "naming.generic": "Generico: AI",
    "naming.header": "Nomes reais no cabecalho",
    "naming.numbered": "Numeros de mensagem: #1, #2",
    "naming.perMessage": "Nome real por mensagem",
    "naming.side": "Lados: Left model / Right model",
    "separator.blank": "Linha vazia",
    "separator.custom": "Personalizado",
    "separator.line": "Espaco normal",
    "separator.wide": "Espaco grande",
    "status.creating": "Criando download...",
    "status.preparing": "Preparando exportacao...",
    "status.saved": "Salvo: {filename}",
    "error.chatContainer": "Container do chat nao encontrado.",
    "error.mode": "Nao foi possivel detectar o modo do chat.",
    "error.noMessages": "Nenhuma mensagem exportavel encontrada.",
    "error.emptySelection": "A opcao escolhida nao contem mensagens.",
    "error.download": "Nao foi possivel iniciar o download.",
    "fallback.noText": "[Texto nao encontrado]",
    "title.ui": "Exportar chat"
  };

  const state = {
    root: null,
    badge: null,
    actionGrid: null,
    status: null,
    toggleButton: null,
    languageToggle: null,
    otherLanguageSelect: null,
    observer: null,
    mode: null,
    busy: false,
    turndown: null,
    language: detectInitialLanguage(),
    preferences: { ...DEFAULT_PREFERENCES }
  };

  function detectInitialLanguage() {
    const browserLanguage = (navigator.language || "").toLowerCase();
    if (browserLanguage.startsWith("ru")) {
      return LANGUAGE.RU;
    }
    if (browserLanguage.startsWith("de")) {
      return LANGUAGE.DE;
    }
    if (browserLanguage.startsWith("es")) {
      return LANGUAGE.ES;
    }
    if (browserLanguage.startsWith("pt")) {
      return LANGUAGE.PT;
    }

    return LANGUAGE.EN;
  }

  function t(key, replacements) {
    const dictionary = I18N[state.language] || I18N.en;
    let value = dictionary[key] || I18N.en[key] || key;

    Object.entries(replacements || {}).forEach(([name, replacement]) => {
      value = value.replace(new RegExp(`\\{${name}\\}`, "g"), String(replacement));
    });

    return value;
  }

  function getHostKind() {
    if (/arena\.ai$/i.test(location.hostname)) {
      return HOST_KIND.ARENA;
    }

    if (/chat\.lmsys\.org$/i.test(location.hostname)) {
      return HOST_KIND.LMSYS;
    }

    return HOST_KIND.OTHER;
  }

  function getTurndown() {
    if (!state.turndown) {
      state.turndown = new TurndownService();
    }

    return state.turndown;
  }

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = "";

    for (let index = 0; index < bytes.length; index += chunkSize) {
      const chunk = bytes.subarray(index, index + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }

    return btoa(binary);
  }

  function dataUriFromString(mimeType, value) {
    const bytes = new TextEncoder().encode(value);
    return `data:${mimeType};base64,${arrayBufferToBase64(bytes.buffer)}`;
  }

  function dataUriFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(t("error.download")));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(blob);
    });
  }

  function loadPreferences() {
    return new Promise((resolve) => {
      if (!chrome.storage?.local) {
        resolve({ ...DEFAULT_PREFERENCES });
        return;
      }

      chrome.storage.local.get(PREFS_KEY, (result) => {
        const saved = result?.[PREFS_KEY] || {};
        resolve({
          ...DEFAULT_PREFERENCES,
          ...saved
        });
      });
    });
  }

  function savePreferences() {
    if (!chrome.storage?.local) {
      return;
    }

    chrome.storage.local.set({
      [PREFS_KEY]: state.preferences
    });
  }

  function normalizeBreaks(value) {
    return String(value || "")
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function trimPreservingBlankLines(value) {
    return String(value || "")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .trim();
  }

  function cleanModelName(name, fallback) {
    const value = normalizeBreaks(name || "")
      .replace(/^message from\s+/i, "")
      .replace(/^response provided by\s+/i, "")
      .trim();

    return value || fallback || "AI";
  }

  function slugify(value) {
    return normalizeBreaks(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
  }

  function timestampForFilename() {
    return new Date()
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\..+$/, "");
  }

  function getChatArea() {
    return document.querySelector(SELECTORS.chatArea);
  }

  function getHeaderModeText(chatArea) {
    const labels = Array.from(chatArea.querySelectorAll('button[role="combobox"] p'));
    return labels.map((node) => (node.textContent || "").trim()).find(Boolean) || "";
  }

  function detectMode(chatArea) {
    if (!chatArea) {
      return null;
    }

    if (chatArea.querySelector(`${SELECTORS.carousel} ${SELECTORS.slide}`)) {
      return MODE.BATTLE;
    }

    const headerMode = getHeaderModeText(chatArea);
    if (/side by side/i.test(headerMode)) {
      return MODE.BATTLE;
    }

    return MODE.DIRECT;
  }

  function isVisibleFormField(node) {
    if (!(node instanceof HTMLElement)) {
      return false;
    }

    if (node.getAttribute("aria-hidden") === "true") {
      return false;
    }

    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }

    if (node.hasAttribute("disabled")) {
      return false;
    }

    return true;
  }

  function getComposerAnchor(chatArea) {
    const namedInput = chatArea.querySelector(SELECTORS.composerInput);
    const preferredInput = isVisibleFormField(namedInput) ? namedInput : null;
    const fallbackInput =
      preferredInput ||
      Array.from(chatArea.querySelectorAll("textarea, input[type='text'], [contenteditable='true']"))
        .filter(isVisibleFormField)
        .find((node) => node.closest("form"));

    if (!fallbackInput) {
      return null;
    }

    const form = fallbackInput.closest("form");
    if (!form) {
      return null;
    }

    return form.querySelector(SELECTORS.composerToolbar) || form;
  }

  function getTimelineRoot(chatArea) {
    return Array.from(chatArea.querySelectorAll("ol")).find((node) => {
      return Boolean(node.querySelector(SELECTORS.prose) || node.querySelector(SELECTORS.carousel));
    }) || null;
  }

  function getTimelineItems(chatArea) {
    const root = getTimelineRoot(chatArea);
    if (!root) {
      return [];
    }

    const items = Array.from(root.children)
      .filter((node) => {
        return Boolean(
          node.querySelector(SELECTORS.prose) ||
            node.querySelector(SELECTORS.carousel) ||
            node.querySelector(SELECTORS.directUserBubble)
        );
      });

    const style = window.getComputedStyle(root);
    const shouldReverse =
      root.classList.contains("flex-col-reverse") || style.flexDirection === "column-reverse";

    return shouldReverse ? items.reverse() : items;
  }

  function parseHiddenMessageTitle(container) {
    const hiddenTitle = container.querySelector(SELECTORS.hiddenMessageTitle);
    const text = normalizeBreaks(hiddenTitle?.textContent || "");
    return text ? cleanModelName(text) : "";
  }

  function parseDirectModelName(container) {
    const explicit = container.querySelector(SELECTORS.directModelNameButton);
    const fromExplicitHeader = cleanModelName(explicit?.textContent || "");
    if (fromExplicitHeader) {
      return fromExplicitHeader;
    }

    const fromHiddenTitle = parseHiddenMessageTitle(container);
    if (fromHiddenTitle) {
      return fromHiddenTitle;
    }

    return "AI";
  }

  function parseBattleModelName(container, side) {
    const explicit = container.querySelector(SELECTORS.battleModelName);
    const fromHeader = cleanModelName(explicit?.textContent || "");
    if (fromHeader) {
      return fromHeader;
    }

    const fromHiddenTitle = parseHiddenMessageTitle(container);
    if (fromHiddenTitle) {
      return fromHiddenTitle;
    }

    return side === SIDE.LEFT ? t("model.left") : t("model.right");
  }

  function cloneMessageForExport(contentNode) {
    const clone = contentNode.cloneNode(true);
    clone.querySelectorAll("script, style, iframe, object, embed, button, [aria-hidden='true']").forEach((node) => {
      node.remove();
    });

    const mediaNodes = Array.from(clone.querySelectorAll("img, svg, canvas, video"));
    let mediaIndex = 0;

    mediaNodes.forEach((mediaNode) => {
      const nearestMedia = mediaNode.parentElement?.closest("img, svg, canvas, video");
      if (nearestMedia && nearestMedia !== mediaNode) {
        return;
      }

      mediaIndex += 1;
      const placeholder = document.createElement("span");
      placeholder.className = "arena-exporter-media-placeholder";
      placeholder.textContent = ` ${t("media", { index: mediaIndex })} `;
      mediaNode.replaceWith(placeholder);
    });

    return clone;
  }

  function buildMessage(role, side, modelName, contentNode) {
    if (!contentNode) {
      return null;
    }

    const turndown = getTurndown();
    const markdownNode = cloneMessageForExport(contentNode);
    const textNode = cloneMessageForExport(contentNode);
    const htmlNode = cloneMessageForExport(contentNode);
    const markdown = normalizeBreaks(turndown.turndown(markdownNode));
    const text = normalizeBreaks(turndown.plainText(textNode));
    const html = htmlNode.innerHTML || "";

    if (!markdown && !text) {
      return null;
    }

    return {
      role,
      side: side || null,
      modelName: cleanModelName(modelName, side === SIDE.LEFT ? t("model.left") : side === SIDE.RIGHT ? t("model.right") : "AI"),
      html,
      markdown,
      text
    };
  }

  function parseArenaUserItem(item) {
    const bubble = item.querySelector(`${SELECTORS.directUserBubble} ${SELECTORS.prose}`);
    if (!bubble) {
      return null;
    }

    return {
      kind: "user",
      message: buildMessage("user", null, "User", bubble)
    };
  }

  function parseArenaAssistantItem(item) {
    if (item.querySelector(SELECTORS.carousel)) {
      return null;
    }

    const proseNode = item.querySelector(`.bg-surface-primary ${SELECTORS.prose}`);
    if (!proseNode) {
      return null;
    }

    return {
      kind: "assistant",
      message: buildMessage("assistant", null, parseDirectModelName(item), proseNode)
    };
  }

  function parseArenaBattleSlide(slide, side) {
    if (!slide) {
      return null;
    }

    const proseNode = slide.querySelector(SELECTORS.prose);
    if (!proseNode) {
      return null;
    }

    return buildMessage("assistant", side, parseBattleModelName(slide, side), proseNode);
  }

  function parseArenaBattleItem(item) {
    const carousel = item.querySelector(SELECTORS.carousel);
    if (!carousel) {
      return null;
    }

    const slides = Array.from(carousel.querySelectorAll(SELECTORS.slide)).slice(0, 2);
    if (!slides.length) {
      return null;
    }

    const left = parseArenaBattleSlide(slides[0], SIDE.LEFT);
    const right = parseArenaBattleSlide(slides[1], SIDE.RIGHT);
    if (!left && !right) {
      return null;
    }

    return {
      kind: "battle",
      left,
      right
    };
  }

  function parseArenaDirect(chatArea) {
    const items = getTimelineItems(chatArea);
    const messages = [];
    let modelName = "";

    items.forEach((item) => {
      const userItem = parseArenaUserItem(item);
      if (userItem?.message) {
        messages.push(userItem.message);
        return;
      }

      const assistantItem = parseArenaAssistantItem(item);
      if (assistantItem?.message) {
        messages.push(assistantItem.message);
        modelName = modelName || assistantItem.message.modelName;
      }
    });

    return {
      mode: MODE.DIRECT,
      modelName: cleanModelName(modelName, "AI"),
      messages
    };
  }

  function parseArenaBattle(chatArea) {
    const items = getTimelineItems(chatArea);
    const rounds = [];
    let pendingUser = null;
    let leftModel = "";
    let rightModel = "";

    items.forEach((item) => {
      const userItem = parseArenaUserItem(item);
      if (userItem?.message) {
        if (pendingUser) {
          rounds.push({
            user: pendingUser,
            left: null,
            right: null
          });
        }

        pendingUser = userItem.message;
        return;
      }

      const battleItem = parseArenaBattleItem(item);
      if (battleItem) {
        leftModel = leftModel || battleItem.left?.modelName || "";
        rightModel = rightModel || battleItem.right?.modelName || "";
        rounds.push({
          user: pendingUser,
          left: battleItem.left || null,
          right: battleItem.right || null
        });
        pendingUser = null;
      }
    });

    if (pendingUser) {
      rounds.push({
        user: pendingUser,
        left: null,
        right: null
      });
    }

    return {
      mode: MODE.BATTLE,
      leftModel: cleanModelName(leftModel, "Left Model"),
      rightModel: cleanModelName(rightModel, "Right Model"),
      rounds
    };
  }

  function parseGenericDirect(chatArea) {
    const candidates = Array.from(
      chatArea.querySelectorAll(".message, .message-row, .message-wrap, [class*='message']")
    ).filter((node) => node.querySelector("p, pre, code"));

    const messages = [];
    candidates.forEach((node) => {
      const className = node.className || "";
      const isUser = /\buser\b/i.test(className);
      const isAssistant = /\bbot\b|\bassistant\b|\bmodel\b/i.test(className);
      if (!isUser && !isAssistant) {
        return;
      }

      const message = buildMessage(
        isUser ? "user" : "assistant",
        null,
        isUser ? "User" : "AI",
        node
      );

      if (message) {
        messages.push(message);
      }
    });

    return {
      mode: MODE.DIRECT,
      modelName: "AI",
      messages
    };
  }

  function hasExportableContent(chat) {
    if (!chat) {
      return false;
    }

    if (chat.mode === MODE.DIRECT) {
      return Array.isArray(chat.messages) && chat.messages.length > 0;
    }

    return Array.isArray(chat.rounds) && chat.rounds.some((round) => round.user || round.left || round.right);
  }

  function parseCurrentChat() {
    const chatArea = getChatArea();
    if (!chatArea) {
      throw new Error(t("error.chatContainer"));
    }

    const mode = detectMode(chatArea);
    if (!mode) {
      throw new Error(t("error.mode"));
    }

    const hostKind = getHostKind();
    const arenaParser = mode === MODE.BATTLE ? parseArenaBattle : parseArenaDirect;
    const arenaChat = arenaParser(chatArea);
    if (hasExportableContent(arenaChat)) {
      return arenaChat;
    }

    if (hostKind === HOST_KIND.LMSYS || hostKind === HOST_KIND.OTHER) {
      const genericDirect = parseGenericDirect(chatArea);
      if (hasExportableContent(genericDirect)) {
        return genericDirect;
      }
    }

    throw new Error(t("error.noMessages"));
  }

  function buildHeaderLines(chat, naming) {
    if (naming !== NAMING.HEADER) {
      return [];
    }

    if (chat.mode === MODE.DIRECT) {
      return [`Chat with: ${chat.modelName}`];
    }

    return [
      `Left model: ${chat.leftModel}`,
      `Right model: ${chat.rightModel}`
    ];
  }

  function assistantLabelForMessage(message, chatMode, naming) {
    if (naming === NAMING.PER_MESSAGE) {
      return message.modelName || "AI";
    }

    if (chatMode === MODE.BATTLE) {
      if (naming === NAMING.SIDE || naming === NAMING.HEADER) {
        return message.side === SIDE.RIGHT ? t("label.right") : t("label.left");
      }

      if (naming === NAMING.NUMBERED) {
        return message.side === SIDE.RIGHT ? t("label.two") : t("label.one");
      }

      return message.side === SIDE.RIGHT ? t("label.rightAI") : t("label.leftAI");
    }

    return t("label.ai");
  }

  function pushTranscriptEntry(entries, chatMode, naming, message) {
    if (!message) {
      return;
    }

    const label = message.role === "user" ? t("label.user") : assistantLabelForMessage(message, chatMode, naming);
    entries.push({
      label,
      role: message.role,
      side: message.side || null,
      modelName: message.modelName || "",
      html: message.html || "",
      text: normalizeBreaks(message.text || t("fallback.noText")),
      markdown: normalizeBreaks(message.markdown || message.text || t("fallback.noText"))
    });
  }

  function buildDirectTranscript(chat, actionId, naming) {
    const entries = [];
    chat.messages.forEach((message) => {
      if (actionId === "direct-user-only" && message.role !== "user") {
        return;
      }

      if (actionId === "direct-model-only" && message.role !== "assistant") {
        return;
      }

      pushTranscriptEntry(entries, chat.mode, naming, message);
    });

    return {
      mode: chat.mode,
      title: t("title.direct"),
      headerLines: buildHeaderLines(chat, naming),
      actionId,
      entries
    };
  }

  function buildBattleTranscript(chat, actionId, naming) {
    const entries = [];

    chat.rounds.forEach((round) => {
      switch (actionId) {
        case "battle-full":
          pushTranscriptEntry(entries, chat.mode, naming, round.user);
          pushTranscriptEntry(entries, chat.mode, naming, round.left);
          pushTranscriptEntry(entries, chat.mode, naming, round.right);
          break;
        case "battle-left-chat":
          pushTranscriptEntry(entries, chat.mode, naming, round.user);
          pushTranscriptEntry(entries, chat.mode, naming, round.left);
          break;
        case "battle-right-chat":
          pushTranscriptEntry(entries, chat.mode, naming, round.user);
          pushTranscriptEntry(entries, chat.mode, naming, round.right);
          break;
        case "battle-user-only":
          pushTranscriptEntry(entries, chat.mode, naming, round.user);
          break;
        case "battle-left-only":
          pushTranscriptEntry(entries, chat.mode, naming, round.left);
          break;
        case "battle-right-only":
          pushTranscriptEntry(entries, chat.mode, naming, round.right);
          break;
        default:
          break;
      }
    });

    return {
      mode: chat.mode,
      title: t("title.battle"),
      headerLines: buildHeaderLines(chat, naming),
      actionId,
      entries
    };
  }

  function buildTranscript(chat, actionId, naming) {
    const transcript =
      chat.mode === MODE.BATTLE
        ? buildBattleTranscript(chat, actionId, naming)
        : buildDirectTranscript(chat, actionId, naming);

    if (!transcript.entries.length) {
      throw new Error(t("error.emptySelection"));
    }

    if (naming === NAMING.NUMBERED) {
      transcript.entries.forEach((entry, index) => {
        entry.label = `#${index + 1}`;
      });
    }

    return transcript;
  }

  function separatorValue(settings, format) {
    if (!settings.includeSeparators) {
      return "\n\n";
    }

    switch (settings.separatorStyle) {
      case SEPARATOR.BLANK:
        return "\n\n";
      case SEPARATOR.WIDE:
        return "\n".repeat(9);
      case SEPARATOR.CUSTOM:
        return `\n\n${trimPreservingBlankLines(settings.customSeparator || "")}\n\n`;
      case SEPARATOR.LINE:
      default:
        return "\n\n\n\n";
    }
  }

  function renderTxt(transcript, settings) {
    const header = [transcript.title, ...transcript.headerLines].filter(Boolean).join("\n");
    const entries = transcript.entries.map((entry) => {
      return `${entry.label}:\n${entry.text || t("fallback.noText")}`;
    });

    return trimPreservingBlankLines([
      header,
      entries.join(separatorValue(settings, FORMAT.TXT))
    ].filter(Boolean).join("\n\n"));
  }

  function renderMarkdown(transcript, settings) {
    const header = [`# ${transcript.title}`];

    if (transcript.headerLines.length) {
      header.push("");
      transcript.headerLines.forEach((line) => {
        header.push(`> ${line}`);
      });
    }

    const entries = transcript.entries.map((entry) => {
      return [
        `## ${entry.label}`,
        "",
        entry.markdown || entry.text || t("fallback.noText")
      ].join("\n");
    });

    return trimPreservingBlankLines([
      header.join("\n"),
      entries.join(separatorValue(settings, FORMAT.MD))
    ].filter(Boolean).join("\n\n"));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function textToHtml(value) {
    return escapeHtml(value).replace(/\n/g, "<br>");
  }

  function groupEntriesForHtml(entries) {
    const groups = [];
    let current = null;

    entries.forEach((entry) => {
      if (entry.role === "user") {
        current = {
          user: entry,
          assistants: []
        };
        groups.push(current);
        return;
      }

      if (!current) {
        current = {
          user: null,
          assistants: []
        };
        groups.push(current);
      }

      current.assistants.push(entry);
    });

    return groups;
  }

  function renderHtmlEntry(entry, className) {
    const body = entry.html || textToHtml(entry.text || t("fallback.noText"));
    const modelMeta = entry.modelName && entry.modelName !== entry.label
      ? `<span>${escapeHtml(entry.modelName)}</span>`
      : "";

    return [
      `<article class="${className}">`,
      `<header><strong>${escapeHtml(entry.label)}</strong>${modelMeta}</header>`,
      `<div class="message-body">${body}</div>`,
      "</article>"
    ].join("");
  }

  function renderHtml(transcript) {
    const groups = groupEntriesForHtml(transcript.entries);
    const header = transcript.headerLines
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join("");

    const body = groups.map((group) => {
      const user = group.user ? renderHtmlEntry(group.user, "message user-message") : "";
      const left = group.assistants.find((entry) => entry.side === SIDE.LEFT);
      const right = group.assistants.find((entry) => entry.side === SIDE.RIGHT);
      const otherAssistants = group.assistants.filter((entry) => !entry.side);
      const assistantHtml = [];

      if (left || right) {
        assistantHtml.push('<div class="battle-grid">');
        if (left) {
          assistantHtml.push(renderHtmlEntry(left, "message assistant-message left-message"));
        }
        if (right) {
          assistantHtml.push(renderHtmlEntry(right, "message assistant-message right-message"));
        }
        assistantHtml.push("</div>");
      }

      otherAssistants.forEach((entry) => {
        assistantHtml.push(renderHtmlEntry(entry, "message assistant-message"));
      });

      return `<section class="round">${user}${assistantHtml.join("")}</section>`;
    }).join("");

    return [
      "<!doctype html>",
      '<html lang="en">',
      "<head>",
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      `<title>${escapeHtml(transcript.title)}</title>`,
      "<style>",
      "body{margin:0;background:#f6f7f9;color:#16181d;font:15px/1.55 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}",
      "main{max-width:1120px;margin:0 auto;padding:32px 20px 48px}",
      "h1{font-size:28px;line-height:1.2;margin:0 0 12px}",
      ".meta{color:#5b6472;margin:0 0 24px}",
      ".round{margin:0 0 22px}",
      ".message{background:#fff;border:1px solid #d9dee7;border-radius:8px;padding:14px 16px;box-shadow:0 1px 2px rgba(16,24,40,.04)}",
      ".message+ .message,.battle-grid{margin-top:12px}",
      ".message header{display:flex;justify-content:space-between;gap:12px;margin-bottom:8px;color:#334155;font-size:13px}",
      ".message header span{color:#64748b;text-align:right}",
      ".user-message{border-left:4px solid #2563eb}",
      ".assistant-message{border-left:4px solid #64748b}",
      ".left-message{border-left-color:#16a34a}",
      ".right-message{border-left-color:#dc2626}",
      ".battle-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}",
      ".message-body{overflow-wrap:anywhere}",
      ".message-body pre{white-space:pre-wrap;background:#111827;color:#f8fafc;padding:12px;border-radius:6px;overflow:auto}",
      ".message-body code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace}",
      ".arena-exporter-media-placeholder{display:inline-block;color:#64748b;font-style:italic}",
      "@media(max-width:760px){.battle-grid{grid-template-columns:1fr}main{padding:20px 12px}}",
      "</style>",
      "</head>",
      "<body>",
      "<main>",
      `<h1>${escapeHtml(transcript.title)}</h1>`,
      header ? `<div class="meta">${header}</div>` : "",
      body,
      "</main>",
      "</body>",
      "</html>"
    ].join("");
  }

  function buildFilename(chat, actionId, format) {
    const extension = format === FORMAT.MD ? "md" : format;
    const parts = [
      "arena-chat-export",
      location.hostname.replace(/\./g, "-"),
      chat.mode,
      actionId
    ];

    if (chat.mode === MODE.DIRECT) {
      const modelPart = slugify(chat.modelName);
      if (modelPart) {
        parts.push(modelPart);
      }
    }

    parts.push(timestampForFilename());
    return `${parts.filter(Boolean).join("_")}.${extension}`;
  }

  function runtimeMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          reject(new Error(lastError.message));
          return;
        }

        resolve(response);
      });
    });
  }

  async function exportAsDataUri(format, transcript, settings, filename) {
    if (format === FORMAT.TXT) {
      return {
        mimeType: "text/plain;charset=utf-8",
        url: dataUriFromString("text/plain;charset=utf-8", renderTxt(transcript, settings))
      };
    }

    if (format === FORMAT.MD) {
      return {
        mimeType: "text/markdown;charset=utf-8",
        url: dataUriFromString("text/markdown;charset=utf-8", renderMarkdown(transcript, settings))
      };
    }

    if (format === FORMAT.HTML) {
      return {
        mimeType: "text/html;charset=utf-8",
        url: dataUriFromString("text/html;charset=utf-8", renderHtml(transcript))
      };
    }

    const pdfBlob = await html2pdf()
      .from(renderMarkdown(transcript, settings))
      .set({
        title: transcript.title,
        filename
      })
      .outputPdf();

    return {
      mimeType: "application/pdf",
      url: await dataUriFromBlob(pdfBlob)
    };
  }

  function getSelectedFormat() {
    return state.root?.querySelector('[name="arena-exporter-format"]')?.value || FORMAT.TXT;
  }

  function getSelectedNaming() {
    return state.root?.querySelector('[name="arena-exporter-naming"]')?.value || DEFAULT_PREFERENCES.naming;
  }

  function getSelectedSeparatorStyle() {
    return state.root?.querySelector('[name="arena-exporter-separator"]')?.value || SEPARATOR.LINE;
  }

  function getCurrentPreferencesFromUi() {
    return {
      format: getSelectedFormat(),
      naming: getSelectedNaming(),
      includeSeparators: Boolean(state.root?.querySelector('[name="arena-exporter-include-separators"]')?.checked),
      separatorStyle: getSelectedSeparatorStyle(),
      customSeparator: state.root?.querySelector('[name="arena-exporter-custom-separator"]')?.value || "",
      saveAs: Boolean(state.root?.querySelector('[name="arena-exporter-save-as"]')?.checked)
    };
  }

  function persistPreferencesFromUi() {
    state.preferences = {
      ...state.preferences,
      ...getCurrentPreferencesFromUi()
    };
    savePreferences();
    updateFormatSpecificUi();
  }

  function getActionButtons() {
    return state.root ? Array.from(state.root.querySelectorAll(".arena-exporter-action")) : [];
  }

  function setBusy(nextBusy) {
    state.busy = nextBusy;
    getActionButtons().forEach((button) => {
      button.disabled = nextBusy;
    });

    const formatSelect = state.root?.querySelector('[name="arena-exporter-format"]');
    const namingSelect = state.root?.querySelector('[name="arena-exporter-naming"]');
    const separatorSelect = state.root?.querySelector('[name="arena-exporter-separator"]');
    const customSeparatorInput = state.root?.querySelector('[name="arena-exporter-custom-separator"]');
    const includeSeparatorsInput = state.root?.querySelector('[name="arena-exporter-include-separators"]');
    const saveAsInput = state.root?.querySelector('[name="arena-exporter-save-as"]');
    const otherLanguageSelect = state.root?.querySelector(".arena-exporter-lang-select");
    const languageButtons = state.root ? Array.from(state.root.querySelectorAll(".arena-exporter-lang-button")) : [];
    [formatSelect, namingSelect, separatorSelect, customSeparatorInput, includeSeparatorsInput, saveAsInput, otherLanguageSelect]
      .filter(Boolean)
      .forEach((control) => {
        control.disabled = nextBusy;
      });
    languageButtons.forEach((button) => {
      button.disabled = nextBusy;
    });

    if (state.toggleButton) {
      state.toggleButton.disabled = nextBusy;
    }
  }

  function setStatus(message, tone) {
    if (!state.status) {
      return;
    }

    state.status.textContent = message;
    state.status.dataset.tone = tone || "info";
  }

  function updateFormatSpecificUi() {
    if (!state.root) {
      return;
    }

    const format = getSelectedFormat();
    const separatorStyle = getSelectedSeparatorStyle();
    const includeSeparators = Boolean(state.root.querySelector('[name="arena-exporter-include-separators"]')?.checked);
    const hidesTextSpacing = format === FORMAT.HTML;

    state.root.querySelectorAll('[data-setting-group="spacing"]').forEach((node) => {
      node.hidden = hidesTextSpacing;
    });

    const customSeparatorFieldset = state.root.querySelector('[data-setting-group="custom-spacing"]');
    if (customSeparatorFieldset) {
      customSeparatorFieldset.hidden = hidesTextSpacing || !includeSeparators || separatorStyle !== SEPARATOR.CUSTOM;
    }
  }

  function refreshLanguageText() {
    if (!state.root) {
      return;
    }

    state.root.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });

    state.root.querySelectorAll("[data-i18n-option]").forEach((node) => {
      node.textContent = t(node.dataset.i18nOption);
    });

    state.root.querySelectorAll(".arena-exporter-lang-button").forEach((button) => {
      const isActive = button.dataset.lang === state.language;
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (state.otherLanguageSelect) {
      const isOtherLanguage = OTHER_LANGUAGES.some((item) => item.id === state.language);
      state.otherLanguageSelect.value = isOtherLanguage ? state.language : "";
      state.otherLanguageSelect.setAttribute("aria-label", t("language.other"));
      if (state.otherLanguageSelect.options[0]) {
        state.otherLanguageSelect.options[0].textContent = t("language.other");
      }
    }

    if (state.badge) {
      if (state.mode === MODE.BATTLE) {
        state.badge.textContent = t("badge.battle");
      } else if (state.mode === MODE.DIRECT) {
        state.badge.textContent = t("badge.direct");
      } else {
        state.badge.textContent = t("badge.detecting");
      }
    }

    if (state.toggleButton) {
      const isOpen = state.root.dataset.open === "true";
      state.toggleButton.textContent = t(isOpen ? "button.close" : "button.open");
    }
  }

  function setLanguage(language) {
    if (!I18N[language] || state.language === language) {
      return;
    }

    state.language = language;
    refreshLanguageText();
    updateActions(state.mode);
    updateFormatSpecificUi();
    setStatus("");
  }

  async function handleExportAction(actionId) {
    if (state.busy) {
      return;
    }

    setBusy(true);
    setStatus(t("status.preparing"));

    try {
      const chat = parseCurrentChat();
      const settings = getCurrentPreferencesFromUi();
      state.preferences = {
        ...state.preferences,
        ...settings
      };
      savePreferences();
      const naming = settings.naming;
      const format = settings.format;
      const transcript = buildTranscript(chat, actionId, naming);
      const filename = buildFilename(chat, actionId, format);
      const fileData = await exportAsDataUri(format, transcript, settings, filename);

      setStatus(t("status.creating"));
      const response = await runtimeMessage({
        type: "ARENA_EXPORTER_DOWNLOAD",
        filename,
        mimeType: fileData.mimeType,
        url: fileData.url,
        saveAs: settings.saveAs
      });

      if (!response?.ok) {
        throw new Error(t("error.download"));
      }

      setStatus(t("status.saved", { filename }));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error), "error");
    } finally {
      setBusy(false);
    }
  }

  function createActionButton(action) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "arena-exporter-action";
    button.dataset.exportAction = action.id;
    button.textContent = t(action.labelKey);
    button.addEventListener("click", () => {
      handleExportAction(action.id);
    });
    return button;
  }

  function updateActions(mode) {
    if (!state.actionGrid) {
      return;
    }

    state.actionGrid.replaceChildren();
    (ACTIONS[mode] || []).forEach((action) => {
      state.actionGrid.appendChild(createActionButton(action));
    });
  }

  function updateMode(mode) {
    state.mode = mode;
    if (state.badge) {
      state.badge.textContent = mode === MODE.BATTLE ? t("badge.battle") : t("badge.direct");
    }
    updateActions(mode);
  }

  function togglePanel(forceOpen) {
    if (!state.root) {
      return;
    }

    const isOpen = state.root.dataset.open === "true";
    const nextState = typeof forceOpen === "boolean" ? forceOpen : !isOpen;
    state.root.dataset.open = String(nextState);

    if (state.toggleButton) {
      state.toggleButton.textContent = t(nextState ? "button.close" : "button.open");
    }
  }

  function buildUi() {
    if (state.root) {
      return state.root;
    }

    const root = document.createElement("section");
    root.id = ROOT_ID;
    root.dataset.open = "false";

    const shell = document.createElement("div");
    shell.className = "arena-exporter-shell";

    const topbar = document.createElement("div");
    topbar.className = "arena-exporter-topbar";

    const title = document.createElement("div");
    title.className = "arena-exporter-title";
    const titleText = document.createElement("span");
    titleText.dataset.i18n = "title.ui";
    titleText.textContent = t("title.ui");

    const badge = document.createElement("span");
    badge.className = "arena-exporter-badge";
    badge.textContent = t("badge.detecting");
    title.append(titleText, badge);

    const controls = document.createElement("div");
    controls.className = "arena-exporter-top-controls";

    const languageToggle = document.createElement("div");
    languageToggle.className = "arena-exporter-lang-toggle";
    languageToggle.setAttribute("aria-label", "Language");
    PRIMARY_LANGUAGES.forEach((item) => {
      const languageButton = document.createElement("button");
      languageButton.type = "button";
      languageButton.className = "arena-exporter-lang-button";
      languageButton.dataset.lang = item.id;
      languageButton.textContent = item.label;
      languageButton.setAttribute("aria-pressed", String(item.id === state.language));
      languageButton.addEventListener("click", () => setLanguage(item.id));
      languageToggle.appendChild(languageButton);
    });

    const otherLanguageSelect = document.createElement("select");
    otherLanguageSelect.className = "arena-exporter-lang-select";
    otherLanguageSelect.setAttribute("aria-label", t("language.other"));
    otherLanguageSelect.innerHTML = [
      `<option value="">${t("language.other")}</option>`,
      ...OTHER_LANGUAGES.map((item) => {
        return `<option value="${item.id}"${item.id === state.language ? " selected" : ""}>${item.label}</option>`;
      })
    ].join("");
    otherLanguageSelect.addEventListener("change", () => {
      if (otherLanguageSelect.value) {
        setLanguage(otherLanguageSelect.value);
      }
    });
    languageToggle.appendChild(otherLanguageSelect);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "arena-exporter-toggle";
    toggle.textContent = t("button.open");
    toggle.addEventListener("click", () => togglePanel());

    controls.append(languageToggle, toggle);
    topbar.append(title, controls);

    const panel = document.createElement("div");
    panel.className = "arena-exporter-panel";

    const grid = document.createElement("div");
    grid.className = "arena-exporter-grid";

    const formatFieldset = document.createElement("fieldset");
    formatFieldset.className = "arena-exporter-fieldset";
    const formatLabel = document.createElement("label");
    formatLabel.className = "arena-exporter-label";
    formatLabel.dataset.i18n = "field.format";
    formatLabel.textContent = t("field.format");
    formatLabel.setAttribute("for", "arena-exporter-format");
    const formatSelect = document.createElement("select");
    formatSelect.id = "arena-exporter-format";
    formatSelect.name = "arena-exporter-format";
    formatSelect.className = "arena-exporter-select";
    formatSelect.innerHTML = [
      `<option value="txt"${state.preferences.format === FORMAT.TXT ? " selected" : ""}>TXT</option>`,
      `<option value="md"${state.preferences.format === FORMAT.MD ? " selected" : ""}>Markdown</option>`,
      `<option value="html"${state.preferences.format === FORMAT.HTML ? " selected" : ""}>HTML</option>`,
      `<option value="pdf"${state.preferences.format === FORMAT.PDF ? " selected" : ""}>PDF</option>`
    ].join("");
    formatSelect.addEventListener("change", persistPreferencesFromUi);
    formatFieldset.append(formatLabel, formatSelect);

    const namingFieldset = document.createElement("fieldset");
    namingFieldset.className = "arena-exporter-fieldset";
    const namingLabel = document.createElement("label");
    namingLabel.className = "arena-exporter-label";
    namingLabel.dataset.i18n = "field.naming";
    namingLabel.textContent = t("field.naming");
    namingLabel.setAttribute("for", "arena-exporter-naming");
    const namingSelect = document.createElement("select");
    namingSelect.id = "arena-exporter-naming";
    namingSelect.name = "arena-exporter-naming";
    namingSelect.className = "arena-exporter-select";
    namingSelect.innerHTML = [
      `<option value="numbered" data-i18n-option="naming.numbered"${state.preferences.naming === NAMING.NUMBERED ? " selected" : ""}>${t("naming.numbered")}</option>`,
      `<option value="side" data-i18n-option="naming.side"${state.preferences.naming === NAMING.SIDE ? " selected" : ""}>${t("naming.side")}</option>`,
      `<option value="generic" data-i18n-option="naming.generic"${state.preferences.naming === NAMING.GENERIC ? " selected" : ""}>${t("naming.generic")}</option>`,
      `<option value="header" data-i18n-option="naming.header"${state.preferences.naming === NAMING.HEADER ? " selected" : ""}>${t("naming.header")}</option>`,
      `<option value="per-message" data-i18n-option="naming.perMessage"${state.preferences.naming === NAMING.PER_MESSAGE ? " selected" : ""}>${t("naming.perMessage")}</option>`
    ].join("");
    namingSelect.addEventListener("change", persistPreferencesFromUi);
    namingFieldset.append(namingLabel, namingSelect);

    const separatorFieldset = document.createElement("fieldset");
    separatorFieldset.className = "arena-exporter-fieldset";
    separatorFieldset.dataset.settingGroup = "spacing";
    const separatorLabel = document.createElement("label");
    separatorLabel.className = "arena-exporter-label";
    separatorLabel.dataset.i18n = "field.separator";
    separatorLabel.textContent = t("field.separator");
    separatorLabel.setAttribute("for", "arena-exporter-separator");
    const separatorRow = document.createElement("div");
    separatorRow.className = "arena-exporter-inline-row";
    const includeSeparators = document.createElement("input");
    includeSeparators.type = "checkbox";
    includeSeparators.id = "arena-exporter-include-separators";
    includeSeparators.name = "arena-exporter-include-separators";
    includeSeparators.checked = Boolean(state.preferences.includeSeparators);
    includeSeparators.addEventListener("change", persistPreferencesFromUi);
    const includeSeparatorsLabel = document.createElement("label");
    includeSeparatorsLabel.className = "arena-exporter-mini-checkbox";
    includeSeparatorsLabel.setAttribute("for", "arena-exporter-include-separators");
    const includeSeparatorsText = document.createElement("span");
    includeSeparatorsText.dataset.i18n = "field.useSeparator";
    includeSeparatorsText.textContent = t("field.useSeparator");
    includeSeparatorsLabel.append(includeSeparators, includeSeparatorsText);
    const separatorSelect = document.createElement("select");
    separatorSelect.id = "arena-exporter-separator";
    separatorSelect.name = "arena-exporter-separator";
    separatorSelect.className = "arena-exporter-select";
    separatorSelect.innerHTML = [
      `<option value="blank" data-i18n-option="separator.blank"${state.preferences.separatorStyle === SEPARATOR.BLANK ? " selected" : ""}>${t("separator.blank")}</option>`,
      `<option value="line" data-i18n-option="separator.line"${state.preferences.separatorStyle === SEPARATOR.LINE ? " selected" : ""}>${t("separator.line")}</option>`,
      `<option value="wide" data-i18n-option="separator.wide"${state.preferences.separatorStyle === SEPARATOR.WIDE ? " selected" : ""}>${t("separator.wide")}</option>`,
      `<option value="custom" data-i18n-option="separator.custom"${state.preferences.separatorStyle === SEPARATOR.CUSTOM ? " selected" : ""}>${t("separator.custom")}</option>`
    ].join("");
    separatorSelect.addEventListener("change", persistPreferencesFromUi);
    separatorRow.append(includeSeparatorsLabel, separatorSelect);
    separatorFieldset.append(separatorLabel, separatorRow);

    const customSeparatorFieldset = document.createElement("fieldset");
    customSeparatorFieldset.className = "arena-exporter-fieldset";
    customSeparatorFieldset.dataset.settingGroup = "custom-spacing";
    const customSeparatorLabel = document.createElement("label");
    customSeparatorLabel.className = "arena-exporter-label";
    customSeparatorLabel.dataset.i18n = "field.customSeparator";
    customSeparatorLabel.textContent = t("field.customSeparator");
    customSeparatorLabel.setAttribute("for", "arena-exporter-custom-separator");
    const customSeparatorInput = document.createElement("input");
    customSeparatorInput.id = "arena-exporter-custom-separator";
    customSeparatorInput.name = "arena-exporter-custom-separator";
    customSeparatorInput.className = "arena-exporter-input";
    customSeparatorInput.type = "text";
    customSeparatorInput.value = state.preferences.customSeparator;
    customSeparatorInput.addEventListener("input", persistPreferencesFromUi);
    customSeparatorFieldset.append(customSeparatorLabel, customSeparatorInput);

    const saveAsFieldset = document.createElement("fieldset");
    saveAsFieldset.className = "arena-exporter-fieldset arena-exporter-checkbox-fieldset";
    const saveAsInput = document.createElement("input");
    saveAsInput.type = "checkbox";
    saveAsInput.id = "arena-exporter-save-as";
    saveAsInput.name = "arena-exporter-save-as";
    saveAsInput.checked = Boolean(state.preferences.saveAs);
    saveAsInput.addEventListener("change", persistPreferencesFromUi);
    const saveAsLabel = document.createElement("label");
    saveAsLabel.className = "arena-exporter-checkbox-label";
    saveAsLabel.dataset.i18n = "field.saveAs";
    saveAsLabel.textContent = t("field.saveAs");
    saveAsLabel.setAttribute("for", "arena-exporter-save-as");
    saveAsFieldset.append(saveAsInput, saveAsLabel);

    grid.append(formatFieldset, namingFieldset, separatorFieldset, customSeparatorFieldset, saveAsFieldset);

    const actionGrid = document.createElement("div");
    actionGrid.className = "arena-exporter-actions";

    const hint = document.createElement("p");
    hint.className = "arena-exporter-hint";
    hint.dataset.i18n = "hint";
    hint.textContent = t("hint");

    const status = document.createElement("div");
    status.className = "arena-exporter-status";
    status.dataset.tone = "info";

    panel.append(grid, actionGrid, hint, status);
    shell.append(topbar, panel);
    root.appendChild(shell);

    document.addEventListener("click", (event) => {
      if (!state.root) {
        return;
      }

      if (state.root.contains(event.target)) {
        return;
      }

      togglePanel(false);
    });

    state.root = root;
    state.badge = badge;
    state.actionGrid = actionGrid;
    state.status = status;
    state.toggleButton = toggle;
    state.languageToggle = languageToggle;
    state.otherLanguageSelect = otherLanguageSelect;
    updateFormatSpecificUi();
    return root;
  }

  function mountUi(anchor) {
    const root = buildUi();
    const parent = anchor.parentNode;
    if (!parent) {
      return false;
    }

    const nextSibling = anchor.nextSibling;
    const alreadyMountedCorrectly = root.parentNode === parent && root.previousSibling === anchor;
    if (alreadyMountedCorrectly) {
      return true;
    }

    parent.insertBefore(root, nextSibling);
    return true;
  }

  function render() {
    const chatArea = getChatArea();
    if (!chatArea) {
      return false;
    }

    const anchor = getComposerAnchor(chatArea);
    if (!anchor) {
      return false;
    }

    const mode = detectMode(chatArea);
    if (!mode) {
      return false;
    }

    if (!mountUi(anchor)) {
      return false;
    }

    if (state.mode !== mode) {
      updateMode(mode);
    }

    return true;
  }

  function startObserver() {
    if (state.observer) {
      return;
    }

    state.observer = new MutationObserver(() => {
      render();
    });

    state.observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  Promise.all([
    runtimeMessage({ type: "ARENA_EXPORTER_PING" }).catch(() => ({ ok: false })),
    loadPreferences()
  ])
    .then(([, preferences]) => {
      state.preferences = preferences;
    })
    .finally(() => {
      render();
      startObserver();
    });
})();
