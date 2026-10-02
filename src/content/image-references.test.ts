import test from "node:test";
import assert from "node:assert/strict";
import { imageReferencesIn, imageUsage, type ImageUser } from "./image-references";

/** An image in use cannot be deleted (media-library; body-editor-toolbar D6). */

const URL = "https://media.example/uploads/borrel-8f3a.jpg";
const user = (over: Partial<ImageUser>): ImageUser => ({
  kind: "blog",
  slug: "s",
  title: "T",
  href: "/blog/s",
  body: "",
  ...over,
});

test("an image used within a post's text counts as in use", () => {
  const refs = imageReferencesIn(URL, [
    user({ slug: "zomer", title: "Zomer", body: `Tekst\n\n![Buren](${URL})\n` }),
  ]);
  assert.deepEqual(refs.map((r) => r.slug), ["zomer"]);
});

test("an image used within an event's text counts as in use", () => {
  const refs = imageReferencesIn(URL, [user({ kind: "event", slug: "borrel", body: `![x](${URL})` })]);
  assert.deepEqual(refs.map((r) => [r.kind, r.slug]), [["event", "borrel"]]);
});

test("an image used within a venue's, organiser's or project's text counts as in use", () => {
  const refs = imageReferencesIn(URL, [
    user({ kind: "venue", slug: "buurthuis", body: `![Zaal](${URL})` }),
    user({ kind: "organiser", slug: "koor", body: `![Koor](${URL})` }),
    user({ kind: "project", slug: "tuin", body: `![Tuin](${URL})` }),
  ]);
  assert.deepEqual(refs.map((r) => [r.kind, r.slug]), [
    ["venue", "buurthuis"],
    ["organiser", "koor"],
    ["project", "tuin"],
  ]);
});

test("a project's cover counts as in use", () => {
  const refs = imageReferencesIn(URL, [user({ kind: "project", slug: "tuin", cover: URL })]);
  assert.deepEqual(refs.map((r) => [r.kind, r.slug]), [["project", "tuin"]]);
});

test("covers and venue galleries still count", () => {
  const refs = imageReferencesIn(URL, [
    user({ kind: "organiser", slug: "a", cover: URL }),
    user({ kind: "venue", slug: "b", gallery: ["other.jpg", URL] }),
  ]);
  assert.deepEqual(refs.map((r) => r.slug), ["a", "b"]);
});

test("an unrelated image is still deletable", () => {
  assert.deepEqual(
    imageReferencesIn(URL, [
      user({ body: "![x](https://media.example/uploads/ander-1b2c.jpg)", cover: "c.jpg", gallery: ["d.jpg"] }),
    ]),
    [],
  );
});

// ── Use for all images at once (gallery-find-and-describe D2) ────────────────

const usageUsers: ImageUser[] = [
  { kind: "event", slug: "borrel", title: "Borrel", href: "/agenda/borrel", cover: "/uploads/a.jpg", body: "" },
  { kind: "venue", slug: "brink", title: "De Brink", href: "/locaties/brink", gallery: ["/uploads/b.jpg"], body: "" },
  { kind: "blog", slug: "welkom", title: "Welkom", href: "/blog/welkom", cover: "/uploads/a.jpg", body: "Kijk: ![tuin](/uploads/c.jpg)" },
];

test("imageUsage names the users of every image in one pass", () => {
  const usage = imageUsage(["/uploads/a.jpg", "/uploads/b.jpg", "/uploads/c.jpg", "/uploads/d.jpg"], usageUsers);
  assert.deepEqual(usage.get("/uploads/a.jpg")?.map((r) => r.slug), ["borrel", "welkom"]);
  assert.deepEqual(usage.get("/uploads/b.jpg")?.map((r) => r.slug), ["brink"]);
  assert.deepEqual(usage.get("/uploads/c.jpg")?.map((r) => r.slug), ["welkom"]);
  assert.deepEqual(usage.get("/uploads/d.jpg"), []);
});
