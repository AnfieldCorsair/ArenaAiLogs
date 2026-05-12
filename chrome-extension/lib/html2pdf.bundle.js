(function (global) {
  "use strict";

  var PAGE_WIDTH_PX = 1240;
  var PAGE_HEIGHT_PX = 1754;
  var PAGE_WIDTH_PT = 595.28;
  var PAGE_HEIGHT_PT = 841.89;
  var PAGE_MARGIN_X = 96;
  var PAGE_MARGIN_TOP = 128;
  var PAGE_MARGIN_BOTTOM = 112;
  var CONTENT_WIDTH = PAGE_WIDTH_PX - PAGE_MARGIN_X * 2;

  function roundRect(context, x, y, width, height, radius) {
    var r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }

  function stripInlineMarkdown(value) {
    return String(value || "")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/_([^_]+)_/g, "$1");
  }

  function sourceToString(source) {
    if (source == null) {
      return "";
    }

    if (typeof source === "string") {
      return source;
    }

    if (source && typeof source.textContent === "string") {
      return source.textContent;
    }

    return String(source);
  }

  function flushParagraph(tokens, paragraphLines) {
    var text = paragraphLines.join(" ").trim();
    if (text) {
      tokens.push({
        type: "paragraph",
        text: stripInlineMarkdown(text)
      });
    }

    paragraphLines.length = 0;
  }

  function tokenizeMarkdown(source) {
    var lines = source.replace(/\r\n/g, "\n").split("\n");
    var tokens = [];
    var paragraphLines = [];
    var codeLines = [];
    var inCodeBlock = false;

    lines.forEach(function (rawLine) {
      var line = rawLine.replace(/\t/g, "    ");
      var trimmed = line.trim();

      if (trimmed.startsWith("```")) {
        flushParagraph(tokens, paragraphLines);
        if (inCodeBlock) {
          tokens.push({
            type: "code",
            text: codeLines.join("\n")
          });
          codeLines = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        return;
      }

      if (!trimmed) {
        flushParagraph(tokens, paragraphLines);
        tokens.push({ type: "blank" });
        return;
      }

      if (/^---+$/.test(trimmed) || /^-{8,}$/.test(trimmed)) {
        flushParagraph(tokens, paragraphLines);
        tokens.push({ type: "rule" });
        return;
      }

      if (/^###\s+/.test(trimmed)) {
        flushParagraph(tokens, paragraphLines);
        tokens.push({
          type: "heading3",
          text: stripInlineMarkdown(trimmed.replace(/^###\s+/, ""))
        });
        return;
      }

      if (/^##\s+/.test(trimmed)) {
        flushParagraph(tokens, paragraphLines);
        tokens.push({
          type: "heading2",
          text: stripInlineMarkdown(trimmed.replace(/^##\s+/, ""))
        });
        return;
      }

      if (/^#\s+/.test(trimmed)) {
        flushParagraph(tokens, paragraphLines);
        tokens.push({
          type: "heading1",
          text: stripInlineMarkdown(trimmed.replace(/^#\s+/, ""))
        });
        return;
      }

      if (/^>\s?/.test(trimmed)) {
        flushParagraph(tokens, paragraphLines);
        tokens.push({
          type: "quote",
          text: stripInlineMarkdown(trimmed.replace(/^>\s?/, ""))
        });
        return;
      }

      if (/^[-*]\s+/.test(trimmed)) {
        flushParagraph(tokens, paragraphLines);
        tokens.push({
          type: "list",
          text: stripInlineMarkdown(trimmed.replace(/^[-*]\s+/, "")),
          marker: "bullet"
        });
        return;
      }

      if (/^\d+\.\s+/.test(trimmed)) {
        flushParagraph(tokens, paragraphLines);
        tokens.push({
          type: "list",
          text: stripInlineMarkdown(trimmed.replace(/^\d+\.\s+/, "")),
          marker: "ordered"
        });
        return;
      }

      paragraphLines.push(trimmed);
    });

    flushParagraph(tokens, paragraphLines);

    if (codeLines.length) {
      tokens.push({
        type: "code",
        text: codeLines.join("\n")
      });
    }

    return tokens;
  }

  function wrapText(context, text, width) {
    var words = String(text || "").split(/\s+/).filter(Boolean);
    if (!words.length) {
      return [""];
    }

    var lines = [];
    var current = words.shift();

    words.forEach(function (word) {
      var probe = current + " " + word;
      if (context.measureText(probe).width <= width) {
        current = probe;
      } else {
        lines.push(current);
        current = word;
      }
    });

    lines.push(current);
    return lines;
  }

  function makePage(title, pageNumber) {
    var canvas = document.createElement("canvas");
    canvas.width = PAGE_WIDTH_PX;
    canvas.height = PAGE_HEIGHT_PX;

    var context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#1c2430";
    context.font = "600 28px 'Segoe UI', system-ui, sans-serif";
    context.fillText(title, PAGE_MARGIN_X, 62);

    context.strokeStyle = "#d7dce4";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(PAGE_MARGIN_X, 84);
    context.lineTo(PAGE_WIDTH_PX - PAGE_MARGIN_X, 84);
    context.stroke();

    return {
      canvas: canvas,
      context: context,
      y: PAGE_MARGIN_TOP,
      pageNumber: pageNumber
    };
  }

  function addFooter(page, totalPages) {
    page.context.strokeStyle = "#d7dce4";
    page.context.lineWidth = 2;
    page.context.beginPath();
    page.context.moveTo(PAGE_MARGIN_X, PAGE_HEIGHT_PX - 82);
    page.context.lineTo(PAGE_WIDTH_PX - PAGE_MARGIN_X, PAGE_HEIGHT_PX - 82);
    page.context.stroke();

    page.context.fillStyle = "#5f6b7d";
    page.context.font = "400 22px 'Segoe UI', system-ui, sans-serif";
    page.context.fillText(
      "Page " + page.pageNumber + " of " + totalPages,
      PAGE_MARGIN_X,
      PAGE_HEIGHT_PX - 44
    );
  }

  function estimateBlockHeight(token, context) {
    var availableWidth = CONTENT_WIDTH;

    if (token.type === "heading1") {
      context.font = "700 52px 'Segoe UI', system-ui, sans-serif";
      return wrapText(context, token.text, availableWidth).length * 62 + 18;
    }

    if (token.type === "heading2") {
      context.font = "700 40px 'Segoe UI', system-ui, sans-serif";
      return wrapText(context, token.text, availableWidth).length * 48 + 14;
    }

    if (token.type === "heading3") {
      context.font = "700 32px 'Segoe UI', system-ui, sans-serif";
      return wrapText(context, token.text, availableWidth).length * 40 + 10;
    }

    if (token.type === "quote") {
      context.font = "400 24px 'Segoe UI', system-ui, sans-serif";
      return wrapText(context, token.text, availableWidth - 32).length * 34 + 18;
    }

    if (token.type === "list") {
      context.font = "400 24px 'Segoe UI', system-ui, sans-serif";
      return wrapText(context, token.text, availableWidth - 42).length * 34 + 10;
    }

    if (token.type === "code") {
      var lines = token.text.split("\n");
      return lines.length * 32 + 34;
    }

    if (token.type === "rule") {
      return 22;
    }

    if (token.type === "blank") {
      return 18;
    }

    context.font = "400 24px 'Segoe UI', system-ui, sans-serif";
    return wrapText(context, token.text, availableWidth).length * 36 + 8;
  }

  function drawToken(page, token) {
    var context = page.context;
    var x = PAGE_MARGIN_X;
    var y = page.y;

    if (token.type === "heading1") {
      context.fillStyle = "#121826";
      context.font = "700 52px 'Segoe UI', system-ui, sans-serif";
      wrapText(context, token.text, CONTENT_WIDTH).forEach(function (line) {
        context.fillText(line, x, y);
        y += 62;
      });
      page.y = y + 12;
      return;
    }

    if (token.type === "heading2") {
      context.fillStyle = "#182030";
      context.font = "700 40px 'Segoe UI', system-ui, sans-serif";
      wrapText(context, token.text, CONTENT_WIDTH).forEach(function (line) {
        context.fillText(line, x, y);
        y += 48;
      });
      page.y = y + 10;
      return;
    }

    if (token.type === "heading3") {
      context.fillStyle = "#24324b";
      context.font = "700 32px 'Segoe UI', system-ui, sans-serif";
      wrapText(context, token.text, CONTENT_WIDTH).forEach(function (line) {
        context.fillText(line, x, y);
        y += 40;
      });
      page.y = y + 8;
      return;
    }

    if (token.type === "quote") {
      var quoteLines = wrapText(context, token.text, CONTENT_WIDTH - 32);
      context.fillStyle = "#f3f6fb";
      roundRect(context, x, y - 24, CONTENT_WIDTH, quoteLines.length * 34 + 18, 18);
      context.fill();
      context.fillStyle = "#3867b7";
      context.fillRect(x + 16, y - 12, 6, quoteLines.length * 34 - 8);
      context.fillStyle = "#1f2940";
      context.font = "400 24px 'Segoe UI', system-ui, sans-serif";
      quoteLines.forEach(function (line) {
        context.fillText(line, x + 38, y);
        y += 34;
      });
      page.y = y + 8;
      return;
    }

    if (token.type === "list") {
      var marker = token.marker === "ordered" ? "1." : "-";
      var listLines = wrapText(context, token.text, CONTENT_WIDTH - 42);
      context.fillStyle = "#202938";
      context.font = "400 24px 'Segoe UI', system-ui, sans-serif";
      context.fillText(marker, x, y);
      listLines.forEach(function (line, index) {
        context.fillText(line, x + 28, y + index * 34);
      });
      page.y = y + listLines.length * 34 + 4;
      return;
    }

    if (token.type === "code") {
      var codeLines = token.text.split("\n");
      var codeHeight = codeLines.length * 32 + 34;
      context.fillStyle = "#0f1724";
      roundRect(context, x, y - 24, CONTENT_WIDTH, codeHeight, 20);
      context.fill();
      context.fillStyle = "#d8e0f0";
      context.font = "400 22px Consolas, 'Courier New', monospace";
      codeLines.forEach(function (line) {
        context.fillText(line, x + 20, y);
        y += 32;
      });
      page.y = y + 10;
      return;
    }

    if (token.type === "rule") {
      context.strokeStyle = "#d6dce5";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(PAGE_WIDTH_PX - PAGE_MARGIN_X, y);
      context.stroke();
      page.y = y + 22;
      return;
    }

    if (token.type === "blank") {
      page.y = y + 18;
      return;
    }

    context.fillStyle = "#1f2734";
    context.font = "400 24px 'Segoe UI', system-ui, sans-serif";
    wrapText(context, token.text, CONTENT_WIDTH).forEach(function (line) {
      context.fillText(line, x, y);
      y += 36;
    });
    page.y = y + 2;
  }

  function renderMarkdownToPages(markdown, title) {
    var tokens = tokenizeMarkdown(markdown);
    var pages = [];
    var page = makePage(title, 1);
    pages.push(page);

    tokens.forEach(function (token) {
      var blockHeight = estimateBlockHeight(token, page.context);
      if (page.y + blockHeight > PAGE_HEIGHT_PX - PAGE_MARGIN_BOTTOM) {
        page = makePage(title, pages.length + 1);
        pages.push(page);
      }

      drawToken(page, token);
    });

    pages.forEach(function (entry, index) {
      entry.pageNumber = index + 1;
      addFooter(entry, pages.length);
    });

    return pages.map(function (entry) {
      return entry.canvas.toDataURL("image/jpeg", 0.92);
    });
  }

  function base64ToBytes(base64) {
    var binary = atob(base64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  function concatUint8Arrays(chunks) {
    var totalLength = chunks.reduce(function (sum, chunk) {
      return sum + chunk.length;
    }, 0);
    var output = new Uint8Array(totalLength);
    var offset = 0;

    chunks.forEach(function (chunk) {
      output.set(chunk, offset);
      offset += chunk.length;
    });

    return output;
  }

  function buildPdfFromImages(imageDataUrls) {
    var encoder = new TextEncoder();
    var objectCount = 2 + imageDataUrls.length * 3;
    var objectOffsets = new Array(objectCount + 1);
    var chunks = [];
    var currentLength = 0;

    function addChunk(chunk) {
      chunks.push(chunk);
      currentLength += chunk.length;
    }

    function addText(value) {
      addChunk(encoder.encode(value));
    }

    function beginObject(objectId) {
      objectOffsets[objectId] = currentLength;
      addText(objectId + " 0 obj\n");
    }

    function endObject() {
      addText("endobj\n");
    }

    addText("%PDF-1.4\n%\u00ff\u00ff\u00ff\u00ff\n");

    beginObject(1);
    addText("<< /Type /Catalog /Pages 2 0 R >>\n");
    endObject();

    beginObject(2);
    var kids = [];
    for (var index = 0; index < imageDataUrls.length; index += 1) {
      kids.push(3 + index * 3 + " 0 R");
    }
    addText("<< /Type /Pages /Count " + imageDataUrls.length + " /Kids [" + kids.join(" ") + "] >>\n");
    endObject();

    imageDataUrls.forEach(function (dataUrl, index) {
      var pageObjectId = 3 + index * 3;
      var contentObjectId = pageObjectId + 1;
      var imageObjectId = pageObjectId + 2;
      var imageName = "Im" + (index + 1);
      var imageBytes = base64ToBytes(dataUrl.split(",")[1]);
      var contentStream = "q\n" +
        PAGE_WIDTH_PT.toFixed(2) + " 0 0 " +
        PAGE_HEIGHT_PT.toFixed(2) + " 0 0 cm\n" +
        "/" + imageName + " Do\nQ\n";

      beginObject(pageObjectId);
      addText(
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " +
          PAGE_WIDTH_PT.toFixed(2) +
          " " +
          PAGE_HEIGHT_PT.toFixed(2) +
          "] /Resources << /XObject << /" +
          imageName +
          " " +
          imageObjectId +
          " 0 R >> >> /Contents " +
          contentObjectId +
          " 0 R >>\n"
      );
      endObject();

      beginObject(contentObjectId);
      addText("<< /Length " + contentStream.length + " >>\nstream\n");
      addText(contentStream);
      addText("endstream\n");
      endObject();

      beginObject(imageObjectId);
      addText(
        "<< /Type /XObject /Subtype /Image /Width " +
          PAGE_WIDTH_PX +
          " /Height " +
          PAGE_HEIGHT_PX +
          " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " +
          imageBytes.length +
          " >>\nstream\n"
      );
      addChunk(imageBytes);
      addText("\nendstream\n");
      endObject();
    });

    var xrefOffset = currentLength;
    addText("xref\n0 " + (objectCount + 1) + "\n");
    addText("0000000000 65535 f \n");

    for (var objectId = 1; objectId <= objectCount; objectId += 1) {
      addText(String(objectOffsets[objectId]).padStart(10, "0") + " 00000 n \n");
    }

    addText("trailer << /Size " + (objectCount + 1) + " /Root 1 0 R >>\n");
    addText("startxref\n" + xrefOffset + "\n%%EOF");

    return concatUint8Arrays(chunks);
  }

  function Html2PdfRenderer() {
    this.source = "";
    this.options = {};
  }

  Html2PdfRenderer.prototype.from = function (source) {
    this.source = source;
    return this;
  };

  Html2PdfRenderer.prototype.set = function (options) {
    this.options = Object.assign({}, this.options, options);
    return this;
  };

  Html2PdfRenderer.prototype.outputPdf = function () {
    var title = this.options.title || this.options.filename || "Chat Export";
    var markdown = sourceToString(this.source);
    var pageImages = renderMarkdownToPages(markdown, title);
    var pdfBytes = buildPdfFromImages(pageImages);

    return Promise.resolve(
      new Blob([pdfBytes], {
        type: "application/pdf"
      })
    );
  };

  Html2PdfRenderer.prototype.save = function () {
    return this.outputPdf();
  };

  function html2pdf() {
    return new Html2PdfRenderer();
  }

  global.html2pdf = html2pdf;
})(globalThis);
