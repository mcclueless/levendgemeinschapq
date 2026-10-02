import test from "node:test";
import assert from "node:assert/strict";
import {
  MEDIA_PAGE_SIZE,
  applyMediaQuery,
  mediaLabel,
  mediaMatches,
  mediaQueryString,
  parseMediaQuery,
} from "./media-query";
import type { MediaItem } from "./media";

/** The view of the backend gallery (gallery-find-and-describe D1). */

test("no parameters give the default view: newest first", () => {
  assert.deepEqual(parseMediaQuery({}), { q: "", gebruik: undefined, sort: "datum", dir: "desc", pagina: 1 });
});

test("every parameter is read", () => {
  assert.deepEqual(
    parseMediaQuery({ q: " tuin ", gebruik: "ongebruikt", sort: "naam", dir: "desc", pagina: "2" }),
    { q: "tuin", gebruik: "ongebruikt", sort: "naam", dir: "desc", pagina: 2 },
  );
});

test("a sort starts in its own direction", () => {
  assert.equal(parseMediaQuery({ sort: "naam" }).dir, "asc");
  assert.equal(parseMediaQuery({ sort: "grootte" }).dir, "desc");
});

test("invalid values fall back to the default", () => {
  assert.deepEqual(
    parseMediaQuery({ gebruik: "soms", sort: "kleur", dir: "op", pagina: "0" }),
    { q: "", gebruik: undefined, sort: "datum", dir: "desc", pagina: 1 },
  );
  assert.equal(parseMediaQuery({ pagina: "2.5" }).pagina, 1);
});

test("a view writes back to a short address and reads the same", () => {
  const view = parseMediaQuery({ q: "café", gebruik: "gebruikt", sort: "naam", pagina: "3" });
  const address = mediaQueryString(view, { pagina: view.pagina });
  assert.equal(address, "?q=caf%C3%A9&gebruik=gebruikt&sort=naam&pagina=3");
  assert.deepEqual(parseMediaQuery(Object.fromEntries(new URLSearchParams(address))), view);
  assert.equal(mediaQueryString(parseMediaQuery({})), "");
  assert.equal(mediaQueryString(view, { gebruik: undefined }), "?q=caf%C3%A9&sort=naam");
});

const item = (name: string, extra: Partial<MediaItem> = {}): MediaItem => ({
  url: `/uploads/${name}`,
  key: `uploads/${name}`,
  size: 1000,
  lastModified: "2026-01-01T00:00:00.000Z",
  ...extra,
});

const images: MediaItem[] = [
  item("zaal-1a.jpg", { size: 300, lastModified: "2026-03-01T00:00:00.000Z", title: "Repair Café, zaal" }),
  item("borrel-2b.jpg", { size: 900, lastModified: "2026-05-01T00:00:00.000Z" }),
  item("img-3c.png", { size: 500, lastModified: "2026-04-01T00:00:00.000Z", alt: "De moestuin in mei" }),
  item("anker-4d.jpg", { size: 100, lastModified: "2026-02-01T00:00:00.000Z" }),
];
const inUse = new Set(["/uploads/zaal-1a.jpg", "/uploads/img-3c.png"]);
const names = (params: Record<string, string> = {}) =>
  applyMediaQuery(images, inUse, parseMediaQuery(params)).rows.map((r) => r.key.slice(8));

test("an image is called by its title, else its file name", () => {
  assert.equal(mediaLabel(images[0]), "Repair Café, zaal");
  assert.equal(mediaLabel(images[1]), "borrel-2b.jpg");
});

test("search covers file name, title and alternative text, ignoring case and accents", () => {
  assert.deepEqual(names({ q: "cafe" }), ["zaal-1a.jpg"]);
  assert.deepEqual(names({ q: "BORREL" }), ["borrel-2b.jpg"]);
  assert.deepEqual(names({ q: "moestuin" }), ["img-3c.png"]);
  assert.deepEqual(names({ q: "zaal-1a" }), ["zaal-1a.jpg"]);
  assert.deepEqual(names({ q: "bestaat niet" }), []);
  assert.equal(mediaMatches(images[1], "  "), true);
});

test("the use filter", () => {
  assert.deepEqual(names({ gebruik: "gebruikt" }), ["img-3c.png", "zaal-1a.jpg"]);
  assert.deepEqual(names({ gebruik: "ongebruikt" }), ["borrel-2b.jpg", "anker-4d.jpg"]);
});

test("each sort in both directions", () => {
  assert.deepEqual(names(), ["borrel-2b.jpg", "img-3c.png", "zaal-1a.jpg", "anker-4d.jpg"]);
  assert.deepEqual(names({ dir: "asc" }), ["anker-4d.jpg", "zaal-1a.jpg", "img-3c.png", "borrel-2b.jpg"]);
  // By what the image is called: its title where it has one.
  assert.deepEqual(names({ sort: "naam" }), ["anker-4d.jpg", "borrel-2b.jpg", "img-3c.png", "zaal-1a.jpg"]);
  assert.deepEqual(names({ sort: "naam", dir: "desc" }), ["zaal-1a.jpg", "img-3c.png", "borrel-2b.jpg", "anker-4d.jpg"]);
  assert.deepEqual(names({ sort: "grootte" }), ["borrel-2b.jpg", "img-3c.png", "zaal-1a.jpg", "anker-4d.jpg"]);
  assert.deepEqual(names({ sort: "grootte", dir: "asc" }), ["anker-4d.jpg", "zaal-1a.jpg", "img-3c.png", "borrel-2b.jpg"]);
});

const many = Array.from({ length: 100 }, (_, i) =>
  item(`foto-${String(i).padStart(3, "0")}.jpg`, { lastModified: new Date(Date.UTC(2026, 0, 1 + i)).toISOString() }),
);

test("a page holds 48 images, with the total and the page count", () => {
  const result = applyMediaQuery(many, new Set(), parseMediaQuery({}));
  assert.equal(MEDIA_PAGE_SIZE, 48);
  assert.deepEqual([result.rows.length, result.total, result.pageCount], [48, 100, 3]);
  assert.equal(result.rows[0].key, "uploads/foto-099.jpg");
  assert.equal(applyMediaQuery(many, new Set(), parseMediaQuery({ pagina: "3" })).rows.length, 4);
});

test("a page past the end shows the last page", () => {
  const result = applyMediaQuery(many, new Set(), parseMediaQuery({ pagina: "9" }));
  assert.deepEqual([result.page, result.rows.length], [3, 4]);
});

test("an empty gallery has one empty page", () => {
  const result = applyMediaQuery([], new Set(), parseMediaQuery({ pagina: "2" }));
  assert.deepEqual([result.rows.length, result.total, result.page, result.pageCount], [0, 0, 1, 1]);
});
