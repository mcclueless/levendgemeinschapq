import test from "node:test";
import assert from "node:assert/strict";
import { detailsDocument, mediaName, readDetailsDocument } from "./media-details";

/** An image's title and alternative text (gallery-find-and-describe D7). */

test("details survive being stored and read back", () => {
  const doc = detailsDocument({ title: " Repair Café, zaal ", alt: "Vrijwilligers repareren een fiets" });
  assert.ok(doc);
  assert.deepEqual(readDetailsDocument(doc), {
    title: "Repair Café, zaal",
    alt: "Vrijwilligers repareren een fiets",
  });
});

test("only what was given is stored", () => {
  const doc = detailsDocument({ title: "", alt: "Een tuin" });
  assert.ok(doc);
  assert.deepEqual(readDetailsDocument(doc), { alt: "Een tuin" });
});

test("empty details store nothing, so the document is removed", () => {
  assert.equal(detailsDocument({}), null);
  assert.equal(detailsDocument({ title: "", alt: "   " }), null);
});

test("an invalid document is skipped", () => {
  assert.equal(readDetailsDocument("---\ntitle:\n  - geen\n  - tekst\n---\n"), null);
  assert.equal(readDetailsDocument("---\nalt: 12\n---\n"), null);
});

test("a document without details reads as none", () => {
  assert.deepEqual(readDetailsDocument("---\n---\n"), {});
});

test("an image's file name follows from its key or its address", () => {
  assert.equal(mediaName("uploads/borrel-8f3a1c.jpg"), "borrel-8f3a1c.jpg");
  assert.equal(mediaName("https://media.example/uploads/borrel-8f3a1c.jpg"), "borrel-8f3a1c.jpg");
  assert.equal(mediaName("/uploads/borrel-8f3a1c.jpg?v=2"), "borrel-8f3a1c.jpg");
});
