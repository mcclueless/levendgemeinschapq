import test from "node:test";
import assert from "node:assert/strict";
import {
  applyReplacement,
  imageMarkdown,
  insertBlock,
  insertLink,
  prefixLines,
  wrapInline,
  type Replacement,
} from "./body-format";

/** The body editor's toolbar transforms (body-editor-toolbar D2, D3). */

/** Apply a transform to text where `[` and `]` mark the selection. */
function run(marked: string, t: (text: string, s: number, e: number) => Replacement): string {
  const start = marked.indexOf("[");
  const end = marked.indexOf("]") - 1;
  const text = marked.replace("[", "").replace("]", "");
  const r = applyReplacement(text, t(text, start, end));
  return r.text.slice(0, r.start) + "[" + r.text.slice(r.start, r.end) + "]" + r.text.slice(r.end);
}

const bold = (x: string, s: number, e: number) => wrapInline(x, s, e, "**", "tekst");
const italic = (x: string, s: number, e: number) => wrapInline(x, s, e, "*", "tekst");

test("bold and italic wrap the selection and keep it selected", () => {
  assert.equal(run("Een [mooi] dag", bold), "Een **[mooi]** dag");
  assert.equal(run("Een [mooi] dag", italic), "Een *[mooi]* dag");
});

test("whitespace at the selection's edges stays outside the markers", () => {
  assert.equal(run("Een[ mooi ]dag", bold), "Een **[mooi]** dag");
});

test("with no selection, a placeholder is inserted and selected", () => {
  assert.equal(run("Een [] dag", bold), "Een **[tekst]** dag");
  assert.equal(run("[]", italic), "*[tekst]*");
});

test("a link keeps the selection as its text and selects the address", () => {
  const text = "Kijk hier eens";
  const r = applyReplacement(text, insertLink(text, 5, 9));
  assert.equal(r.text, "Kijk [hier](https://) eens");
  assert.equal(r.text.slice(r.start, r.end), "https://");
});

test("a link with no selection selects its placeholder text", () => {
  const r = applyReplacement("", insertLink("", 0, 0));
  assert.equal(r.text, "[linktekst](https://)");
  assert.equal(r.text.slice(r.start, r.end), "linktekst");
});

const heading = (x: string, s: number, e: number) => prefixLines(x, s, e, "heading");
const bullet = (x: string, s: number, e: number) => prefixLines(x, s, e, "bullet");
const numbered = (x: string, s: number, e: number) => prefixLines(x, s, e, "numbered");

test("a heading prefixes the current line only", () => {
  assert.equal(run("Eerste\nTw[]eede\nDerde", heading), "Eerste\n[## Tweede]\nDerde");
});

test("lists prefix every non-empty selected line and leave the rest alone", () => {
  assert.equal(
    run("Intro\n[appels\n\nperen]\nSlot", bullet),
    "Intro\n[- appels\n\n- peren]\nSlot",
  );
  assert.equal(run("[appels\nperen\nkersen]", numbered), "[1. appels\n2. peren\n3. kersen]");
});

test("a selection ending just after a newline does not take the next line", () => {
  const text = "appels\nperen\n";
  const r = applyReplacement(text, prefixLines(text, 0, 7, "bullet"));
  assert.equal(r.text, "- appels\nperen\n");
});

test("pressing a line button again removes its prefix", () => {
  assert.equal(run("[## Kop]", heading), "[Kop]");
  assert.equal(run("[- a\n- b]", bullet), "[a\nb]");
  assert.equal(run("[1. a\n2. b]", numbered), "[a\nb]");
});

test("switching list kinds replaces the prefix instead of stacking it", () => {
  assert.equal(run("[- a\n- b]", numbered), "[1. a\n2. b]");
  assert.equal(run("[## Kop]", bullet), "[- Kop]");
});

test("an image becomes its own paragraph wherever the cursor is", () => {
  const img = "![x](u)";
  const place = (marked: string) => {
    const at = marked.indexOf("|");
    const text = marked.replace("|", "");
    const r = applyReplacement(text, insertBlock(text, at, at, img));
    return r.text.slice(0, r.start) + "|" + r.text.slice(r.start);
  };
  assert.equal(place("Voor|na"), "Voor\n\n![x](u)|\n\nna");
  assert.equal(place("Voor\n\n\n|\n\n\nna"), "Voor\n\n![x](u)|\n\nna");
  assert.equal(place("|Begin"), "![x](u)|\n\nBegin");
  assert.equal(place("Eind|"), "Eind\n\n![x](u)|\n");
  assert.equal(place("|"), "![x](u)|\n");
});

test("an image description and address cannot break the syntax", () => {
  assert.equal(imageMarkdown("Buren  op [het] plein\n", "https://m/a.jpg"), "![Buren op \\[het\\] plein](https://m/a.jpg)");
  assert.equal(imageMarkdown("a\\b", "https://m/foto (1).jpg"), "![a\\\\b](https://m/foto%20%281%29.jpg)");
});
