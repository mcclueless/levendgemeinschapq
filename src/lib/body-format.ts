/**
 * Markdown text transforms behind the body editor's toolbar (body-editor-toolbar
 * D2, D3). Each takes the text and the selection and returns the new text and
 * selection, so the rules are testable without a browser and the editor only
 * applies the result.
 */

export interface TextEdit {
  text: string;
  /** Selection start after the edit. */
  start: number;
  /** Selection end after the edit. */
  end: number;
}

/** The replacement a transform makes: the range it replaces, and with what. */
export interface Replacement {
  from: number;
  to: number;
  insert: string;
  /** Selection after the edit, relative to `from`. */
  selectStart: number;
  selectEnd: number;
}

/** Apply a {@link Replacement} to a string, for tests and the fallback path. */
export function applyReplacement(text: string, r: Replacement): TextEdit {
  return {
    text: text.slice(0, r.from) + r.insert + text.slice(r.to),
    start: r.from + r.selectStart,
    end: r.from + r.selectEnd,
  };
}

/**
 * Wrap the selection in an inline marker: `**` for bold, `*` for italic. With no
 * selection, insert a placeholder and select it so typing replaces it.
 * Whitespace at either edge of the selection stays outside the markers, because
 * `**woord **` does not render as bold.
 */
export function wrapInline(
  text: string,
  start: number,
  end: number,
  marker: string,
  placeholder: string,
): Replacement {
  let from = start;
  let to = end;
  while (from < to && /\s/.test(text[from])) from++;
  while (to > from && /\s/.test(text[to - 1])) to--;
  const inner = from === to ? placeholder : text.slice(from, to);
  return {
    from,
    to,
    insert: `${marker}${inner}${marker}`,
    selectStart: marker.length,
    selectEnd: marker.length + inner.length,
  };
}

/** `[selection](https://)` with the URL selected; `[linktekst](https://)` with the text selected. */
export function insertLink(text: string, start: number, end: number): Replacement {
  const label = text.slice(start, end);
  const url = "https://";
  if (label.trim()) {
    const insert = `[${label}](${url})`;
    return {
      from: start,
      to: end,
      insert,
      selectStart: label.length + 3,
      selectEnd: label.length + 3 + url.length,
    };
  }
  const placeholder = "linktekst";
  return {
    from: start,
    to: end,
    insert: `[${placeholder}](${url})`,
    selectStart: 1,
    selectEnd: 1 + placeholder.length,
  };
}

export type LinePrefix = "heading" | "bullet" | "numbered";

const PREFIX_PATTERN: Record<LinePrefix, RegExp> = {
  heading: /^#{1,6} /,
  bullet: /^[-*+] /,
  numbered: /^\d+\. /,
};

/**
 * Prefix every non-empty line the selection touches: `## `, `- `, or `1. `,
 * `2. `… for a numbered list. When every such line already carries that kind of
 * prefix, remove it instead, so the button toggles. The whole affected block is
 * selected afterwards.
 */
export function prefixLines(
  text: string,
  start: number,
  end: number,
  kind: LinePrefix,
): Replacement {
  const from = text.lastIndexOf("\n", start - 1) + 1;
  // A selection ending just after a newline does not include the next line.
  const endAt = end > start && text[end - 1] === "\n" ? end - 1 : end;
  const nl = text.indexOf("\n", endAt);
  const to = nl === -1 ? text.length : nl;

  const lines = text.slice(from, to).split("\n");
  const pattern = PREFIX_PATTERN[kind];
  const filled = lines.filter((l) => l.trim() !== "");
  const remove = filled.length > 0 && filled.every((l) => pattern.test(l));

  let n = 0;
  const out = lines.map((line) => {
    if (line.trim() === "") return line;
    if (remove) return line.replace(pattern, "");
    // Replace another kind of prefix rather than stacking them ("## - item").
    const bare = line.replace(/^(#{1,6} |[-*+] |\d+\. )/, "");
    n += 1;
    const prefix = kind === "heading" ? "## " : kind === "bullet" ? "- " : `${n}. `;
    return prefix + bare;
  });
  const insert = out.join("\n");
  return { from, to, insert, selectStart: 0, selectEnd: insert.length };
}

/**
 * Insert a block (an image) as its own paragraph in place of the selection:
 * exactly one blank line before it, unless it opens the text, and one after it,
 * unless it closes the text. The cursor lands after the block.
 */
export function insertBlock(
  text: string,
  start: number,
  end: number,
  block: string,
): Replacement {
  let from = start;
  let to = end;
  // Absorb the whitespace around the cursor, so the spacing is rebuilt cleanly.
  while (from > 0 && /[ \t\n]/.test(text[from - 1])) from--;
  while (to < text.length && /[ \t\n]/.test(text[to])) to++;
  const before = from === 0 ? "" : "\n\n";
  const after = to === text.length ? "\n" : "\n\n";
  const insert = `${before}${block}${after}`;
  const cursor = before.length + block.length;
  return { from, to, insert, selectStart: cursor, selectEnd: cursor };
}

const URL_ESCAPES: Record<string, string> = {
  " ": "%20",
  "(": "%28",
  ")": "%29",
  "<": "%3C",
  ">": "%3E",
};

/**
 * Markdown for an image with its description as alternative text. Characters
 * that would end the description or the address early are escaped.
 */
export function imageMarkdown(description: string, url: string): string {
  const alt = description
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[\\[\]]/g, (c) => `\\${c}`);
  // encodeURIComponent leaves "(" and ")" alone, and a ")" ends the address.
  const href = url.replace(/[ ()<>]/g, (c) => URL_ESCAPES[c]);
  return `![${alt}](${href})`;
}
