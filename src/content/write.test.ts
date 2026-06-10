import test from "node:test";
import assert from "node:assert/strict";
import matter from "gray-matter";
import { mergeDocument } from "./write";

/**
 * The edit path (updateDocument) must MERGE the form patch over stored
 * frontmatter — never replace it wholesale — so fields no form exposes survive.
 * mergeDocument is the pure core of that contract.
 */

const eventRaw = matter.stringify("\nOude tekst\n", {
  title: "Repair Café",
  start: "2026-06-10T19:00",
  venue: "buurthuis",
  organiser: "stichting",
  uid: "ical-123@example.com",
  excerpt: "Samen repareren",
  status: "published",
  submittedBy: "jan",
});

test("preserves frontmatter fields absent from the patch", () => {
  const out = mergeDocument(eventRaw, { title: "Repair Café (verplaatst)" }, "Nieuwe tekst");
  const { data, content } = matter(out);
  assert.equal(data.title, "Repair Café (verplaatst)");
  assert.equal(data.uid, "ical-123@example.com"); // form never shows uid
  assert.equal(data.venue, "buurthuis");
  assert.equal(data.organiser, "stichting");
  assert.equal(data.submittedBy, "jan");
  assert.equal(data.status, "published");
  assert.equal(content.trim(), "Nieuwe tekst");
});

test("overrides keys the patch provides and drops keys set to undefined", () => {
  const out = mergeDocument(eventRaw, { venue: "nieuwe-zaal", excerpt: undefined }, "x");
  const { data } = matter(out);
  assert.equal(data.venue, "nieuwe-zaal");
  assert.ok(!("excerpt" in data)); // cleared field removed
  assert.equal(data.uid, "ical-123@example.com"); // unrelated field intact
});

test("preserves venue gallery images", () => {
  const raw = matter.stringify("\n", {
    name: "Zaal",
    images: ["a.jpg", "b.jpg"],
    status: "published",
  });
  const { data } = matter(mergeDocument(raw, { name: "Zaal 2" }, ""));
  assert.deepEqual(data.images, ["a.jpg", "b.jpg"]);
  assert.equal(data.name, "Zaal 2");
});

test("preserves organiser cover image", () => {
  const raw = matter.stringify("\n", {
    name: "Org",
    featuredImage: "/uploads/cover.jpg",
    status: "published",
  });
  const { data } = matter(mergeDocument(raw, { name: "Org 2" }, ""));
  assert.equal(data.featuredImage, "/uploads/cover.jpg");
  assert.equal(data.name, "Org 2");
});

test("preserves blog relations and submission metadata", () => {
  const raw = matter.stringify("\n", {
    title: "Post",
    author: "Auteur",
    date: "2026-06-01",
    relatedVenues: ["zaal"],
    relatedOrganisers: ["org"],
    submittedBy: "indiener",
    status: "published",
  });
  const { data } = matter(mergeDocument(raw, { title: "Post 2" }, "body"));
  assert.deepEqual(data.relatedVenues, ["zaal"]);
  assert.deepEqual(data.relatedOrganisers, ["org"]);
  assert.equal(data.submittedBy, "indiener");
  assert.equal(data.title, "Post 2");
});
