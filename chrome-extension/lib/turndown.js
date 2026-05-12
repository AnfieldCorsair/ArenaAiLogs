(function (global) {
  "use strict";

  function trimTrailingWhitespace(value) {
    return value.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  function joinChildren(node, format, state) {
    return Array.from(node.childNodes)
      .map(function (child) {
        return convertNode(child, format, state);
      })
      .join("");
  }

  function prefixLines(text, prefix) {
    return text
      .split("\n")
      .map(function (line) {
        return line ? prefix + line : prefix.trimEnd();
      })
      .join("\n");
  }

  function readCodeBlock(node) {
    var codeNode = node.querySelector("pre code") || node.querySelector("code");
    var languageNode = node.querySelector("span.text-sm.font-medium");
    var language = languageNode ? (languageNode.textContent || "").trim().toLowerCase() : "";
    var codeText = codeNode ? codeNode.textContent || "" : node.textContent || "";

    return {
      language: language,
      code: codeText.replace(/\r\n/g, "\n").replace(/\n+$/, "")
    };
  }

  function renderCodeBlock(node, format) {
    var block = readCodeBlock(node);
    if (!block.code.trim()) {
      return "";
    }

    if (format === "text") {
      return "```" + (block.language || "") + "\n" + block.code + "\n```\n\n";
    }

    return "```" + (block.language || "") + "\n" + block.code + "\n```\n\n";
  }

  function renderList(node, format, state, ordered) {
    return Array.from(node.children)
      .filter(function (child) {
        return child.tagName && child.tagName.toLowerCase() === "li";
      })
      .map(function (child, index) {
        var marker = ordered ? index + 1 + ". " : "- ";
        var childState = Object.assign({}, state, {
          listDepth: (state.listDepth || 0) + 1
        });
        var content = trimTrailingWhitespace(joinChildren(child, format, childState));
        var lines = content.split("\n");

        return lines
          .map(function (line, lineIndex) {
            var indent = new Array(childState.listDepth).join("  ");
            if (lineIndex === 0) {
              return indent + marker + line;
            }

            return indent + "  " + line;
          })
          .join("\n");
      })
      .join("\n") + "\n\n";
  }

  function cleanInlineText(value) {
    return value.replace(/[ \t]+/g, " ");
  }

  function stripInlineMarkdown(value) {
    return value
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
  }

  function convertNode(node, format, state) {
    if (!node) {
      return "";
    }

    if (node.nodeType === Node.TEXT_NODE) {
      var text = node.nodeValue || "";
      if (state.preserveWhitespace) {
        return text;
      }

      return cleanInlineText(text);
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    if (node.matches("button, svg, h2.hidden, [aria-hidden='true']")) {
      return "";
    }

    if (node.hasAttribute("data-code-block")) {
      return renderCodeBlock(node, format);
    }

    var tagName = node.tagName.toLowerCase();

    if (tagName === "br") {
      return "\n";
    }

    if (tagName === "hr") {
      return format === "text" ? "\n----------------------------------------\n\n" : "\n---\n\n";
    }

    if (tagName === "pre") {
      return renderCodeBlock(node, format);
    }

    if (tagName === "code") {
      var inlineCode = (node.textContent || "").replace(/\r\n/g, "\n").trim();
      if (!inlineCode) {
        return "";
      }

      return format === "text" ? inlineCode : "`" + inlineCode + "`";
    }

    if (tagName === "strong" || tagName === "b") {
      var strongText = trimTrailingWhitespace(joinChildren(node, format, state));
      if (!strongText) {
        return "";
      }

      return format === "text" ? strongText : "**" + strongText + "**";
    }

    if (tagName === "em" || tagName === "i") {
      var emphasisText = trimTrailingWhitespace(joinChildren(node, format, state));
      if (!emphasisText) {
        return "";
      }

      return format === "text" ? emphasisText : "_" + emphasisText + "_";
    }

    if (tagName === "a") {
      var label = trimTrailingWhitespace(joinChildren(node, format, state)) || (node.textContent || "").trim();
      var href = node.getAttribute("href") || "";
      if (!href) {
        return label;
      }

      return format === "text" ? label + " (" + href + ")" : "[" + label + "](" + href + ")";
    }

    if (tagName === "blockquote") {
      var quote = trimTrailingWhitespace(joinChildren(node, format, state));
      if (!quote) {
        return "";
      }

      return prefixLines(quote, "> ") + "\n\n";
    }

    if (tagName === "ul") {
      return renderList(node, format, state, false);
    }

    if (tagName === "ol") {
      return renderList(node, format, state, true);
    }

    if (tagName === "li") {
      return trimTrailingWhitespace(joinChildren(node, format, state));
    }

    if (/^h[1-6]$/.test(tagName)) {
      var level = Number(tagName.charAt(1));
      var headingText = trimTrailingWhitespace(joinChildren(node, format, state));
      if (!headingText) {
        return "";
      }

      if (format === "text") {
        return headingText + "\n\n";
      }

      return new Array(level + 1).join("#") + " " + headingText + "\n\n";
    }

    if (tagName === "p") {
      var paragraph = trimTrailingWhitespace(joinChildren(node, format, state));
      return paragraph ? paragraph + "\n\n" : "";
    }

    if (tagName === "img") {
      var alt = node.getAttribute("alt") || "image";
      var src = node.getAttribute("src") || "";
      if (!src) {
        return "";
      }

      return format === "text" ? alt + " (" + src + ")" : "![" + alt + "](" + src + ")";
    }

    if (tagName === "table") {
      var rows = Array.from(node.querySelectorAll("tr")).map(function (row) {
        return Array.from(row.children)
          .map(function (cell) {
            return trimTrailingWhitespace(joinChildren(cell, format, state));
          })
          .join(" | ");
      });

      return rows.join("\n") + "\n\n";
    }

    if (tagName === "div" || tagName === "section" || tagName === "article") {
      var blockContent = trimTrailingWhitespace(joinChildren(node, format, state));
      return blockContent ? blockContent + "\n\n" : "";
    }

    return joinChildren(node, format, state);
  }

  function convertInput(input, format) {
    if (input == null) {
      return "";
    }

    if (typeof input === "string") {
      if (format === "text") {
        return trimTrailingWhitespace(stripInlineMarkdown(input));
      }

      return trimTrailingWhitespace(input);
    }

    if (!(input instanceof Node)) {
      return trimTrailingWhitespace(String(input));
    }

    return trimTrailingWhitespace(
      convertNode(input, format, {
        listDepth: 0,
        preserveWhitespace: false
      })
    );
  }

  function TurndownService() {}

  TurndownService.prototype.turndown = function (input) {
    return convertInput(input, "markdown");
  };

  TurndownService.prototype.plainText = function (input) {
    return convertInput(input, "text");
  };

  global.TurndownService = TurndownService;
})(globalThis);
