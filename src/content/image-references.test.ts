import test from "node:test";
import assert from "node:assert/strict";
import { imageReferencesIn, type ImageUser } from "./image-references";

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
