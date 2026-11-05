"use strict";

(() => {
  const ROOT_ID = "arena-exporter-root";
  const MODE = {
    DIRECT: "direct",
    BATTLE: "battle"
  };

  const MODE_OVERRIDE = {
    AUTO: "auto",
    DIRECT: MODE.DIRECT,
    BATTLE: MODE.BATTLE
  };

  const CONFIDENCE = {
    MANUAL: "manual",
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low"
  };

  // Chat mode is written in the mode selector of the Arena UI. The label is the
  // most reliable signal we have, so it wins over every structural heuristic.
  const MODE_LABEL_PATTERNS = {
    battle: /(?:side\s*[-\u2010-\u2015]?\s*by\s*[-\u2010-\u2015]?\s*side|sidebyside|battle|head[\s-]*to[\s-]*head|compare|comparison|versus|\bvs\b|сравн|баттл|бок\s*о\s*бок)/i,
    direct: /(?:direct|single[\s-]*(?:chat|model)|one[\s-]*on[\s-]*one|directo|одиночн|прямой\s*чат)/i
  };

  const MODE_LABEL_SCOPE_SELECTOR = [
    '[role="combobox"]',
    '[aria-haspopup="listbox"]',
    '[aria-haspopup="menu"]',
    "select"
  ].join(", ");

  // Names that Arena puts on anonymous / variant answers. They look "distinct"
  // but they do not prove that two different models are compared.
  const GENERIC_MODEL_NAME_PATTERN = /^(?:model|response|answer|option|variant|assistant|модель|ответ|вариант)\s*[-#:]?\s*[a-z0-9]{1,2}$/i;

  const DETECTION_CACHE_TTL_MS = 400;

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
    saveAs: false,
    modeOverride: MODE_OVERRIDE.AUTO
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
      "title.ui": "Export Chat",
      "label.variant": "option {index} of {total}",
      "badge.directUnsure": "Mode: Direct (?)",
      "badge.battleUnsure": "Mode: Side-by-Side (?)",
      "badge.hint": "reason: {reason}, confidence: {confidence}",
      "field.mode": "Chat mode",
      "mode.auto": "Auto-detect",
      "mode.direct": "Direct chat",
      "mode.battle": "Side-by-Side",
      "button.diagnostics": "Diagnostics",
      "button.diagnosticsHide": "Hide diagnostics",
      "button.diagnosticsCopy": "Copy report",
      "status.diagnosticsCopied": "Diagnostics copied to clipboard.",
      "status.modeUncertain": "Mode detection is uncertain: the page gave no clear marker. If the export looks wrong, set Chat mode manually.",
      "status.modeFallback": "mode fallback applied ({mode})",
      "error.diagnosticsCopy": "Could not copy the diagnostics report."
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
      "title.ui": "Экспорт чата",
      "label.variant": "вариант {index} из {total}",
      "badge.directUnsure": "Режим: Direct (?)",
      "badge.battleUnsure": "Режим: Side-by-Side (?)",
      "badge.hint": "причина: {reason}, уверенность: {confidence}",
      "field.mode": "Режим чата",
      "mode.auto": "Определять автоматически",
      "mode.direct": "Direct чат",
      "mode.battle": "Side-by-Side",
      "button.diagnostics": "Диагностика",
      "button.diagnosticsHide": "Скрыть диагностику",
      "button.diagnosticsCopy": "Копировать отчёт",
      "status.diagnosticsCopied": "Отчёт диагностики скопирован.",
      "status.modeUncertain": "Режим определён неуверенно: на странице нет явного маркера. Если экспорт выглядит неправильно, выберите режим чата вручную.",
      "status.modeFallback": "применён запасной разбор ({mode})",
      "error.diagnosticsCopy": "Не удалось скопировать отчёт диагностики."
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
    "title.ui": "Chat exportieren",
    "label.variant": "Variante {index} von {total}",
    "badge.directUnsure": "Modus: Direct (?)",
    "badge.battleUnsure": "Modus: Side-by-Side (?)",
    "badge.hint": "Grund: {reason}, Sicherheit: {confidence}",
    "field.mode": "Chat-Modus",
    "mode.auto": "Automatisch erkennen",
    "mode.direct": "Direct-Chat",
    "mode.battle": "Side-by-Side",
    "button.diagnostics": "Diagnose",
    "button.diagnosticsHide": "Diagnose ausblenden",
    "button.diagnosticsCopy": "Bericht kopieren",
    "status.diagnosticsCopied": "Diagnosebericht kopiert.",
    "status.modeUncertain": "Der Modus ist unsicher erkannt. Falls der Export falsch aussieht, Chat-Modus manuell wahlen.",
    "status.modeFallback": "Ersatz-Parsing aktiv ({mode})",
    "error.diagnosticsCopy": "Diagnosebericht konnte nicht kopiert werden."
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
    "title.ui": "Exportar chat",
    "label.variant": "opcion {index} de {total}",
    "badge.directUnsure": "Modo: Direct (?)",
    "badge.battleUnsure": "Modo: Side-by-Side (?)",
    "badge.hint": "motivo: {reason}, confianza: {confidence}",
    "field.mode": "Modo del chat",
    "mode.auto": "Detectar automaticamente",
    "mode.direct": "Chat directo",
    "mode.battle": "Side-by-Side",
    "button.diagnostics": "Diagnostico",
    "button.diagnosticsHide": "Ocultar diagnostico",
    "button.diagnosticsCopy": "Copiar informe",
    "status.diagnosticsCopied": "Informe copiado.",
    "status.modeUncertain": "El modo se detecto con poca confianza. Si la exportacion no es correcta, elige el modo manualmente.",
    "status.modeFallback": "analisis alternativo aplicado ({mode})",
    "error.diagnosticsCopy": "No se pudo copiar el informe."
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
    "title.ui": "Exportar chat",
    "label.variant": "opcao {index} de {total}",
    "badge.directUnsure": "Modo: Direct (?)",
    "badge.battleUnsure": "Modo: Side-by-Side (?)",
    "badge.hint": "motivo: {reason}, confianca: {confidence}",
    "field.mode": "Modo do chat",
    "mode.auto": "Detectar automaticamente",
    "mode.direct": "Chat direto",
    "mode.battle": "Side-by-Side",
    "button.diagnostics": "Diagnostico",
    "button.diagnosticsHide": "Ocultar diagnostico",
    "button.diagnosticsCopy": "Copiar relatorio",
    "status.diagnosticsCopied": "Relatorio copiado.",
    "status.modeUncertain": "O modo foi detectado com pouca confianca. Se a exportacao estiver errada, escolha o modo manualmente.",
    "status.modeFallback": "analise alternativa aplicada ({mode})",
    "error.diagnosticsCopy": "Nao foi possivel copiar o relatorio."
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
    modeConfidence: null,
    modeReason: null,
    detection: null,
    parseNote: "",
    analysisCache: null,
    modeWarning: null,
    diagnostics: null,
    diagnosticsToggle: null,
    diagnosticsCopyButton: null,
    diagnosticsOpen: false,
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

  function getDetachedModelName(node) {
    const raw = normalizeBreaks(node?.textContent || "").replace(/\s+/g, " ").trim();
    return raw ? cleanModelName(raw) : "";
  }

  function isRenderedNode(node) {
    if (!(node instanceof HTMLElement)) {
      return false;
    }

    if (node.closest(`#${ROOT_ID}`)) {
      return false;
    }

    if (
      node.closest(
        '[hidden], [aria-hidden="true"], template, [role="listbox"], [role="option"], [role="menu"], [role="menuitem"], [data-radix-popper-content-wrapper]'
      )
    ) {
      return false;
    }

    const style = window.getComputedStyle(node);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
  }

  function ownTextOf(node) {
    return Array.from(node.childNodes || [])
      .filter((child) => child.nodeType === Node.TEXT_NODE)
      .map((child) => child.textContent || "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Reads every visible mode selector around the chat and turns its label into a
  // vote for "direct" or "battle". Labels that mention both modes at once (an
  // expanded dropdown, a merged value, a marketing banner) are ignored instead
  // of being silently treated as "side-by-side".
  function readModeLabelEvidence(chatArea) {
    const evidence = {
      votes: [],
      sources: []
    };

    const scopeCandidates = [chatArea, chatArea.parentElement, document.querySelector("main"), document.body];
    const scopes = scopeCandidates.filter((scope, index) => {
      return scope && scopeCandidates.indexOf(scope) === index;
    });

    const seen = new Set();
    const consider = (value, source) => {
      const text = normalizeBreaks(String(value || "")).replace(/\s+/g, " ").trim();
      if (!text || text.length > 64) {
        return;
      }

      const mentionsBattle = MODE_LABEL_PATTERNS.battle.test(text);
      const mentionsDirect = MODE_LABEL_PATTERNS.direct.test(text);
      if (mentionsBattle === mentionsDirect) {
        // Nothing matched, or both modes are mentioned -> useless as evidence.
        return;
      }

      evidence.votes.push(mentionsBattle ? MODE.BATTLE : MODE.DIRECT);
      evidence.sources.push(`${source}: "${text}"`);
    };

    scopes.forEach((scope) => {
      scope.querySelectorAll(MODE_LABEL_SCOPE_SELECTOR).forEach((node) => {
        if (seen.has(node) || !isRenderedNode(node)) {
          return;
        }

        seen.add(node);
        consider(node.getAttribute("aria-valuetext"), "aria-valuetext");
        consider(node.getAttribute("aria-label"), "aria-label");

        const targets = [node, ...Array.from(node.querySelectorAll("p, span, div, strong, b"))];
        targets.forEach((target) => {
          if (!isRenderedNode(target)) {
            return;
          }

          consider(ownTextOf(target), target === node ? "mode-selector" : "mode-selector-label");
        });
      });
    });

    return evidence;
  }

  function readSlideModelName(slide) {
    const chip = slide.querySelector(SELECTORS.battleModelName) || slide.querySelector(SELECTORS.directModelNameButton);
    const fromChip = getDetachedModelName(chip);
    if (fromChip) {
      return { name: fromChip, source: "chip" };
    }

    const fromHiddenTitle = parseHiddenMessageTitle(slide);
    if (fromHiddenTitle) {
      return { name: fromHiddenTitle, source: "hidden-title" };
    }

    return { name: "", source: "none" };
  }

  function measureSlideLayout(slides) {
    if (slides.length < 2 || typeof slides[0].getBoundingClientRect !== "function") {
      return "unknown";
    }

    const rects = slides.map((slide) => slide.getBoundingClientRect());
    const usable = rects.filter((rect) => rect.width > 0 && rect.height > 0);
    if (usable.length < 2) {
      return "unknown";
    }

    const [first, second] = rects;
    const overlapX = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left));
    const overlapY = Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
    const overlapRatioX = overlapX / Math.max(1, Math.min(first.width, second.width));
    const overlapRatioY = overlapY / Math.max(1, Math.min(first.height, second.height));

    if (overlapRatioX > 0.6 && overlapRatioY > 0.6) {
      // Both answers are painted in the same slot -> slides of one carousel,
      // i.e. "pick one of two answers" inside a single chat column.
      return "stacked-slot";
    }

    if (overlapRatioY > 0.6 && overlapRatioX <= 0.1) {
      return "side-by-side-columns";
    }

    return "unknown";
  }

  function analyzeChatStructure(chatArea) {
    const root = getTimelineRoot(chatArea);
    const items = getTimelineItems(chatArea);
    const analysis = {
      timelineFound: Boolean(root),
      itemCount: items.length,
      userCount: 0,
      plainAssistantCount: 0,
      carousels: [],
      slideLayout: "unknown"
    };

    items.forEach((item) => {
      if (item.querySelector(`${SELECTORS.directUserBubble} ${SELECTORS.prose}`)) {
        analysis.userCount += 1;
        return;
      }

      const carousel = item.querySelector(SELECTORS.carousel);
      if (!carousel) {
        analysis.plainAssistantCount += 1;
        return;
      }

      const slides = Array.from(carousel.querySelectorAll(SELECTORS.slide));
      const slideInfo = slides.map((slide) => {
        const model = readSlideModelName(slide);
        return {
          modelName: model.name,
          modelSource: model.source,
          proseCount: slide.querySelectorAll(SELECTORS.prose).length
        };
      });

      const layout = measureSlideLayout(slides);
      if (layout !== "unknown") {
        analysis.slideLayout = layout;
      }

      const namedSlides = slideInfo.filter((slide) => slide.modelName);
      const uniqueNames = new Set(namedSlides.map((slide) => slide.modelName.toLowerCase()));
      const concreteNames = new Set(
        namedSlides
          .map((slide) => slide.modelName)
          .filter((name) => !GENERIC_MODEL_NAME_PATTERN.test(name))
          .map((name) => name.toLowerCase())
      );

      analysis.carousels.push({
        slideCount: slides.length,
        namedSlideCount: namedSlides.length,
        uniqueNameCount: uniqueNames.size,
        concreteNameCount: concreteNames.size,
        hasVariantLabels: concreteNames.size === 0 && namedSlides.length === slides.length,
        slides: slideInfo
      });
    });

    return analysis;
  }

  // Mode detection reads the DOM (structure + geometry + labels). It is called
  // from a MutationObserver, so the expensive part is cached for a short window.
  function getCachedEvidence(chatArea) {
    const now = Date.now();
    const cache = state.analysisCache;
    if (cache && cache.chatArea === chatArea && now - cache.at < DETECTION_CACHE_TTL_MS) {
      return cache.evidence;
    }

    const evidence = {
      analysis: analyzeChatStructure(chatArea),
      labelEvidence: readModeLabelEvidence(chatArea)
    };
    state.analysisCache = { chatArea, at: now, evidence };
    return evidence;
  }

  function invalidateAnalysisCache() {
    state.analysisCache = null;
  }

  function buildDetection(mode, confidence, reason, signals, analysis) {
    return {
      mode,
      confidence,
      reason,
      signals,
      analysis: analysis || null
    };
  }

  // Mode detection = evidence, not a single selector.
  //
  // Before this patch any carousel with slides in the chat made the extension
  // report "Side-by-Side". Since Arena renders "here are two answers, pick the
  // better one" inside a Direct chat with the very same carousel/slide markup,
  // that check produced a false "Side-by-Side" and a broken parse. Now the mode
  // selector label decides first, and the carousel is only compared as evidence
  // (same answer slot vs. two different model columns).
  function detectChatMode(chatArea) {
    if (!chatArea) {
      return buildDetection(MODE.DIRECT, CONFIDENCE.LOW, "no-chat-area", ["chat area was not found"], null);
    }

    const override = state.preferences?.modeOverride || MODE_OVERRIDE.AUTO;
    const { analysis, labelEvidence } = getCachedEvidence(chatArea);
    const signals = [...labelEvidence.sources];

    if (override === MODE_OVERRIDE.DIRECT || override === MODE_OVERRIDE.BATTLE) {
      return buildDetection(
        override,
        CONFIDENCE.MANUAL,
        "manual-override",
        [`manual override: ${override}`, ...signals],
        analysis
      );
    }

    const battleVotes = labelEvidence.votes.filter((vote) => vote === MODE.BATTLE).length;
    const directVotes = labelEvidence.votes.filter((vote) => vote === MODE.DIRECT).length;

    if (battleVotes && !directVotes) {
      return buildDetection(MODE.BATTLE, CONFIDENCE.HIGH, "mode-selector-label", signals, analysis);
    }

    if (directVotes && !battleVotes) {
      return buildDetection(MODE.DIRECT, CONFIDENCE.HIGH, "mode-selector-label", signals, analysis);
    }

    if (!analysis.carousels.length) {
      return buildDetection(MODE.DIRECT, CONFIDENCE.HIGH, "no-carousel", signals, analysis);
    }

    const multiSlide = analysis.carousels.filter((carousel) => carousel.slideCount > 1);
    if (!multiSlide.length) {
      return buildDetection(MODE.DIRECT, CONFIDENCE.HIGH, "single-slide-carousel", signals, analysis);
    }

    signals.push(`carousels: ${analysis.carousels.length} (multi-slide: ${multiSlide.length})`);

    const concreteColumns = multiSlide.filter((carousel) => carousel.concreteNameCount > 1);
    const sharedAnswers = multiSlide.filter(
      (carousel) => carousel.namedSlideCount === carousel.slideCount && carousel.uniqueNameCount === 1
    );
    const variantOnly = multiSlide.filter((carousel) => carousel.hasVariantLabels);

    if (analysis.slideLayout === "side-by-side-columns") {
      signals.push("layout: two non-overlapping columns");
      return buildDetection(MODE.BATTLE, CONFIDENCE.HIGH, "side-by-side-layout", signals, analysis);
    }

    if (analysis.slideLayout === "stacked-slot") {
      signals.push("layout: both slides painted in the same slot");
      return buildDetection(MODE.DIRECT, CONFIDENCE.MEDIUM, "answers-in-one-slot", signals, analysis);
    }

    if (concreteColumns.length && !sharedAnswers.length && !variantOnly.length) {
      signals.push(`distinct model names on slides: ${concreteColumns.length} carousel(s)`);
      return buildDetection(MODE.BATTLE, CONFIDENCE.MEDIUM, "distinct-slide-models", signals, analysis);
    }

    if (variantOnly.length && !concreteColumns.length) {
      signals.push("slide labels look like answer variants (Response 1/2, Model A/B)");
      return buildDetection(MODE.DIRECT, CONFIDENCE.MEDIUM, "variant-slide-labels", signals, analysis);
    }

    if (sharedAnswers.length && !concreteColumns.length) {
      signals.push("both slides report the same model");
      return buildDetection(MODE.DIRECT, CONFIDENCE.MEDIUM, "shared-slide-models", signals, analysis);
    }

    // Unknown carousel: keep the export usable (Direct parses every slide as an
    // answer variant, nothing is lost) and flag it in the UI as uncertain.
    signals.push("carousel without reliable mode markers");
    return buildDetection(MODE.DIRECT, CONFIDENCE.LOW, "ambiguous-carousel", signals, analysis);
  }

  // Backwards-compatible shim: the rest of the code only needs the mode itself.
  function detectMode(chatArea) {
    if (!chatArea) {
      return null;
    }

    return detectChatMode(chatArea).mode;
  }

  // A confident verdict about a header label must not be overridden by a
  // low-confidence structural guess that appears while the chat is streaming.
  function resolveMode(chatArea) {
    const detection = detectChatMode(chatArea);
    state.detection = detection;

    const stickyModes = [CONFIDENCE.MANUAL, CONFIDENCE.HIGH];
    if (
      state.mode &&
      state.modeConfidence &&
      stickyModes.includes(state.modeConfidence) &&
      detection.confidence === CONFIDENCE.LOW &&
      detection.reason !== "manual-override"
    ) {
      return {
        ...detection,
        mode: state.mode,
        confidence: state.modeConfidence,
        reason: `${state.modeReason} (kept, new guess "${detection.reason}" is weak)`
      };
    }

    return detection;
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

  // Collects every answer rendered in a timeline item. In a Direct chat Arena may
  // put two candidate answers ("pick the better one") into the same carousel that
  // Side-by-Side uses for two models. Each slide is a separate answer, never a
  // lost message.
  function collectAssistantAnswerNodes(item) {
    const carousel = item.querySelector(SELECTORS.carousel);

    if (carousel) {
      const slides = Array.from(carousel.querySelectorAll(SELECTORS.slide));
      const fromSlides = slides
        .map((slide) => ({
          node: slide.querySelector(`.bg-surface-primary ${SELECTORS.prose}`) || slide.querySelector(SELECTORS.prose),
          container: slide
        }))
        .filter((entry) => Boolean(entry.node));

      if (fromSlides.length) {
        return fromSlides;
      }

      const carouselProse = carousel.querySelector(SELECTORS.prose);
      return carouselProse ? [{ node: carouselProse, container: carousel }] : [];
    }

    const preferred = item.querySelector(`.bg-surface-primary ${SELECTORS.prose}`);
    const node = preferred || item.querySelector(SELECTORS.prose);
    return node ? [{ node, container: item }] : [];
  }

  function parseArenaAssistantItem(item) {
    const answers = collectAssistantAnswerNodes(item);
    if (!answers.length) {
      return null;
    }

    const fallbackName = parseDirectModelName(item);
    const total = answers.length;
    const messages = answers
      .map((answer, index) => {
        const slideName = getDetachedModelName(answer.container.querySelector(SELECTORS.battleModelName));
        const message = buildMessage("assistant", null, slideName || fallbackName, answer.node);
        if (!message) {
          return null;
        }

        message.variant = total > 1 ? { index: index + 1, total } : null;
        return message;
      })
      .filter(Boolean);

    if (!messages.length) {
      return null;
    }

    return {
      kind: "assistant",
      messages
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
      if (!assistantItem) {
        return;
      }

      assistantItem.messages.forEach((message) => {
        messages.push(message);
        if (!modelName && assistantItem.messages.length === 1) {
          modelName = message.modelName;
        }
      });
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

  // A transcript is only useful if it contains model answers. A battle parse of
  // a Direct chat happily returns "user messages only", which looks like a
  // successful export while all the answers are silently missing.
  function hasAssistantAnswers(chat) {
    if (!chat) {
      return false;
    }

    if (chat.mode === MODE.DIRECT) {
      return Array.isArray(chat.messages) && chat.messages.some((message) => message.role === "assistant");
    }

    return Array.isArray(chat.rounds) && chat.rounds.some((round) => round.left || round.right);
  }

  function parseCurrentChat() {
    const chatArea = getChatArea();
    if (!chatArea) {
      throw new Error(t("error.chatContainer"));
    }

    const detection = resolveMode(chatArea);
    const mode = detection.mode;
    if (!mode) {
      throw new Error(t("error.mode"));
    }

    state.parseNote = "";
    const hostKind = getHostKind();
    const primaryParser = mode === MODE.BATTLE ? parseArenaBattle : parseArenaDirect;
    const rescueParser = mode === MODE.BATTLE ? parseArenaDirect : parseArenaBattle;

    const arenaChat = primaryParser(chatArea);
    if (hasExportableContent(arenaChat) && hasAssistantAnswers(arenaChat)) {
      return arenaChat;
    }

    // Detection may still be wrong on an Arena build we have not seen yet. Instead
    // of failing (or exporting prompts without answers), rescue the export with
    // the other parsing strategy and tell the user what happened.
    const rescueChat = rescueParser(chatArea);
    if (hasExportableContent(rescueChat) && hasAssistantAnswers(rescueChat)) {
      state.parseNote = t("status.modeFallback", { mode: rescueChat.mode });
      return rescueChat;
    }

    if (hostKind === HOST_KIND.LMSYS || hostKind === HOST_KIND.OTHER) {
      const genericDirect = parseGenericDirect(chatArea);
      if (hasExportableContent(genericDirect)) {
        return genericDirect;
      }
    }

    if (hasExportableContent(arenaChat)) {
      return arenaChat;
    }

    if (hasExportableContent(rescueChat)) {
      state.parseNote = t("status.modeFallback", { mode: rescueChat.mode });
      return rescueChat;
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

  function variantSuffix(message) {
    if (!message?.variant || message.variant.total < 2) {
      return "";
    }

    return ` (${t("label.variant", { index: message.variant.index, total: message.variant.total })})`;
  }

  function assistantLabelForMessage(message, chatMode, naming) {
    if (naming === NAMING.PER_MESSAGE) {
      return `${message.modelName || "AI"}${variantSuffix(message)}`;
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

    return `${t("label.ai")}${variantSuffix(message)}`;
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
      variant: message.variant || null,
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
        entry.label = `#${index + 1}${variantSuffix(entry)}`;
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

  function getSelectedModeOverride() {
    const value = state.root?.querySelector('[name="arena-exporter-mode"]')?.value;
    return value === MODE_OVERRIDE.DIRECT || value === MODE_OVERRIDE.BATTLE ? value : MODE_OVERRIDE.AUTO;
  }

  function getCurrentPreferencesFromUi() {
    return {
      format: getSelectedFormat(),
      naming: getSelectedNaming(),
      includeSeparators: Boolean(state.root?.querySelector('[name="arena-exporter-include-separators"]')?.checked),
      separatorStyle: getSelectedSeparatorStyle(),
      customSeparator: state.root?.querySelector('[name="arena-exporter-custom-separator"]')?.value || "",
      saveAs: Boolean(state.root?.querySelector('[name="arena-exporter-save-as"]')?.checked),
      modeOverride: getSelectedModeOverride()
    };
  }

  function persistPreferencesFromUi() {
    state.preferences = {
      ...state.preferences,
      ...getCurrentPreferencesFromUi()
    };
    savePreferences();
    invalidateAnalysisCache();
    updateFormatSpecificUi();
  }

  function handleModeOverrideChange() {
    persistPreferencesFromUi();
    invalidateAnalysisCache();
    const chatArea = getChatArea();
    if (chatArea) {
      const detection = resolveMode(chatArea);
      updateMode(detection.mode, detection.confidence, detection.reason);
    }
    setStatus("");
    refreshDiagnostics();
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
    const modeSelect = state.root?.querySelector('[name="arena-exporter-mode"]');
    const otherLanguageSelect = state.root?.querySelector(".arena-exporter-lang-select");
    const languageButtons = state.root ? Array.from(state.root.querySelectorAll(".arena-exporter-lang-button")) : [];
    [formatSelect, namingSelect, separatorSelect, customSeparatorInput, includeSeparatorsInput, saveAsInput, modeSelect, otherLanguageSelect]
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

    if (state.diagnosticsToggle) {
      state.diagnosticsToggle.textContent = t(state.diagnosticsOpen ? "button.diagnosticsHide" : "button.diagnostics");
    }

    if (state.otherLanguageSelect) {
      const isOtherLanguage = OTHER_LANGUAGES.some((item) => item.id === state.language);
      state.otherLanguageSelect.value = isOtherLanguage ? state.language : "";
      state.otherLanguageSelect.setAttribute("aria-label", t("language.other"));
      if (state.otherLanguageSelect.options[0]) {
        state.otherLanguageSelect.options[0].textContent = t("language.other");
      }
    }

    if (state.badge) {
      state.badge.textContent = badgeTextForMode(state.mode, state.modeConfidence);
      state.badge.title = t("badge.hint", {
        reason: state.modeReason || "-",
        confidence: state.modeConfidence || "-"
      });
    }

    updateModeWarning();
    refreshDiagnostics();

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

      const savedMessage = t("status.saved", { filename });
      setStatus(state.parseNote ? `${savedMessage} - ${state.parseNote}` : savedMessage);
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

  function badgeTextForMode(mode, confidence) {
    if (mode === MODE.BATTLE) {
      return confidence === CONFIDENCE.LOW ? t("badge.battleUnsure") : t("badge.battle");
    }

    if (mode === MODE.DIRECT) {
      return confidence === CONFIDENCE.LOW ? t("badge.directUnsure") : t("badge.direct");
    }

    return t("badge.detecting");
  }

  function updateMode(mode, confidence, reason) {
    state.mode = mode || null;
    state.modeConfidence = confidence || null;
    state.modeReason = reason || null;
    if (state.badge) {
      state.badge.textContent = badgeTextForMode(state.mode, confidence);
      state.badge.dataset.confidence = confidence || CONFIDENCE.LOW;
    }
    updateActions(state.mode);
  }

  function updateModeWarning() {
    if (!state.modeWarning) {
      return;
    }

    const detection = state.detection;
    const needsWarning =
      detection &&
      state.preferences.modeOverride === MODE_OVERRIDE.AUTO &&
      detection.confidence === CONFIDENCE.LOW;

    state.modeWarning.hidden = !needsWarning;
    state.modeWarning.textContent = needsWarning ? t("status.modeUncertain") : "";
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

  function buildDiagnosticsReport() {
    const chatArea = getChatArea();
    const detection = state.detection || (chatArea ? detectChatMode(chatArea) : null);
    const analysis = detection?.analysis || null;
    let version = "unknown";

    try {
      version = chrome.runtime?.getManifest?.()?.version || "unknown";
    } catch (error) {
      version = "unknown";
    }

    const lines = [
      "Arena Chat Exporter - diagnostics",
      `time: ${new Date().toISOString()}`,
      `url: ${location.href}`,
      `host: ${location.hostname} (${getHostKind()})`,
      `version: ${version}`,
      "",
      `detected mode: ${detection?.mode || "unknown"}`,
      `confidence: ${detection?.confidence || "-"}`,
      `reason: ${detection?.reason || "-"}`,
      `mode override: ${state.preferences?.modeOverride || MODE_OVERRIDE.AUTO}`,
      "",
      `chat area (${SELECTORS.chatArea}): ${chatArea ? "found" : "NOT FOUND"}`,
      `timeline root: ${analysis?.timelineFound ? "found" : "not found"}`,
      `timeline items: ${analysis?.itemCount ?? 0}`,
      `  user messages: ${analysis?.userCount ?? 0}`,
      `  plain answers: ${analysis?.plainAssistantCount ?? 0}`,
      `carousels: ${analysis?.carousels?.length ?? 0}`,
      `slide layout: ${analysis?.slideLayout || "unknown"}`
    ];

    (analysis?.carousels || []).forEach((carousel, index) => {
      lines.push(
        `  carousel #${index + 1}: slides=${carousel.slideCount}, named=${carousel.namedSlideCount}, uniqueNames=${carousel.uniqueNameCount}, concreteNames=${carousel.concreteNameCount}`
      );
      carousel.slides.forEach((slide, slideIndex) => {
        lines.push(
          `    slide ${slideIndex + 1}: model="${slide.modelName || "-"}" (${slide.modelSource}), prose=${slide.proseCount}`
        );
      });
    });

    lines.push("", "signals:");
    const signals = detection?.signals || [];
    if (signals.length) {
      signals.forEach((signal) => lines.push(`  - ${signal}`));
    } else {
      lines.push("  (none)");
    }

    return lines.join("\n");
  }

  function refreshDiagnostics() {
    if (!state.diagnostics || !state.diagnosticsOpen) {
      return;
    }

    state.diagnostics.textContent = buildDiagnosticsReport();
  }

  function toggleDiagnostics(forceOpen) {
    if (!state.diagnostics) {
      return;
    }

    const nextOpen = typeof forceOpen === "boolean" ? forceOpen : !state.diagnosticsOpen;
    state.diagnosticsOpen = nextOpen;
    state.diagnostics.hidden = !nextOpen;
    if (state.diagnosticsToggle) {
      state.diagnosticsToggle.setAttribute("aria-expanded", String(nextOpen));
      state.diagnosticsToggle.textContent = t(nextOpen ? "button.diagnosticsHide" : "button.diagnostics");
    }
    refreshDiagnostics();
  }

  async function copyDiagnosticsReport() {
    const report = buildDiagnosticsReport();

    try {
      await navigator.clipboard.writeText(report);
      setStatus(t("status.diagnosticsCopied"));
      return;
    } catch (error) {
      // The async clipboard API is blocked on some arena.ai pages.
    }

    const area = document.createElement("textarea");
    area.value = report;
    area.setAttribute("readonly", "readonly");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();

    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }

    area.remove();
    setStatus(copied ? t("status.diagnosticsCopied") : t("error.diagnosticsCopy"), copied ? "info" : "error");
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

    const modeFieldset = document.createElement("fieldset");
    modeFieldset.className = "arena-exporter-fieldset";
    const modeLabel = document.createElement("label");
    modeLabel.className = "arena-exporter-label";
    modeLabel.dataset.i18n = "field.mode";
    modeLabel.textContent = t("field.mode");
    modeLabel.setAttribute("for", "arena-exporter-mode");
    const modeSelect = document.createElement("select");
    modeSelect.id = "arena-exporter-mode";
    modeSelect.name = "arena-exporter-mode";
    modeSelect.className = "arena-exporter-select";
    modeSelect.innerHTML = [
      `<option value="auto" data-i18n-option="mode.auto"${state.preferences.modeOverride === MODE_OVERRIDE.AUTO ? " selected" : ""}>${t("mode.auto")}</option>`,
      `<option value="direct" data-i18n-option="mode.direct"${state.preferences.modeOverride === MODE_OVERRIDE.DIRECT ? " selected" : ""}>${t("mode.direct")}</option>`,
      `<option value="battle" data-i18n-option="mode.battle"${state.preferences.modeOverride === MODE_OVERRIDE.BATTLE ? " selected" : ""}>${t("mode.battle")}</option>`
    ].join("");
    modeSelect.addEventListener("change", handleModeOverrideChange);
    modeFieldset.append(modeLabel, modeSelect);

    grid.append(formatFieldset, modeFieldset, namingFieldset, separatorFieldset, customSeparatorFieldset, saveAsFieldset);

    const actionGrid = document.createElement("div");
    actionGrid.className = "arena-exporter-actions";

    const hint = document.createElement("p");
    hint.className = "arena-exporter-hint";
    hint.dataset.i18n = "hint";
    hint.textContent = t("hint");

    const status = document.createElement("div");
    status.className = "arena-exporter-status";
    status.dataset.tone = "info";

    const modeWarning = document.createElement("p");
    modeWarning.className = "arena-exporter-mode-warning";
    modeWarning.hidden = true;

    const diagnosticsBar = document.createElement("div");
    diagnosticsBar.className = "arena-exporter-diagnostics-bar";

    const diagnosticsToggle = document.createElement("button");
    diagnosticsToggle.type = "button";
    diagnosticsToggle.className = "arena-exporter-link-button";
    diagnosticsToggle.dataset.i18n = "button.diagnostics";
    diagnosticsToggle.textContent = t("button.diagnostics");
    diagnosticsToggle.setAttribute("aria-expanded", "false");
    diagnosticsToggle.addEventListener("click", () => toggleDiagnostics());

    const diagnosticsCopy = document.createElement("button");
    diagnosticsCopy.type = "button";
    diagnosticsCopy.className = "arena-exporter-link-button";
    diagnosticsCopy.dataset.i18n = "button.diagnosticsCopy";
    diagnosticsCopy.textContent = t("button.diagnosticsCopy");
    diagnosticsCopy.addEventListener("click", () => copyDiagnosticsReport());

    diagnosticsBar.append(diagnosticsToggle, diagnosticsCopy);

    const diagnostics = document.createElement("pre");
    diagnostics.className = "arena-exporter-diagnostics";
    diagnostics.hidden = true;

    panel.append(grid, actionGrid, modeWarning, hint, status, diagnosticsBar, diagnostics);
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
    state.modeWarning = modeWarning;
    state.diagnostics = diagnostics;
    state.diagnosticsToggle = diagnosticsToggle;
    state.diagnosticsCopyButton = diagnosticsCopy;
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

    const detection = resolveMode(chatArea);
    const mode = detection.mode;
    if (!mode) {
      return false;
    }

    if (!mountUi(anchor)) {
      return false;
    }

    if (state.mode !== mode || state.modeConfidence !== detection.confidence) {
      updateMode(mode, detection.confidence, detection.reason);
    }

    updateModeWarning();
    refreshDiagnostics();

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

  // Exposed for the diagnostics panel and for the jsdom test suite in tests/.
  window.__arenaExporterInternals = {
    MODE,
    MODE_OVERRIDE,
    CONFIDENCE,
    SELECTORS,
    I18N,
    state,
    t,
    detectChatMode,
    detectMode,
    resolveMode,
    analyzeChatStructure,
    readModeLabelEvidence,
    getCachedEvidence,
    parseCurrentChat,
    render,
    buildDiagnosticsReport,
    buildTranscript,
    renderTxt,
    renderMarkdown,
    renderHtml,
    getTimelineItems,
    invalidateAnalysisCache
  };

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
