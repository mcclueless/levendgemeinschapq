import test from "node:test";
import assert from "node:assert/strict";
import matter from "gray-matter";
import { mergeDocument } from "./write";
import { EventFrontmatter } from "./schema";

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

/**
 * An event's further dates (event-multiple-dates D7) are presented only by the
 * admin edit form. Every other write patches frontmatter without mentioning
 * them — approval (`setStatus`), import adoption (`feedId`), a permalink change
 * (reference fields) — and the list must come through each one intact, and
 * still read back as the same instants.
 */
const seriesRaw = matter.stringify("\nDrie avonden\n", {
  title: "Concertserie",
  start: "2026-10-03T18:00:00.000Z",
  end: "2026-10-03T20:00:00.000Z",
  dates: ["2026-10-17T18:00:00.000Z", "2026-11-08T19:00:00.000Z"],
  venue: "buurthuis",
  status: "pending",
});

const storedDates = (raw: string) =>
  EventFrontmatter.parse(matter(raw).data).dates?.map((d) => d.toISOString());

const SERIES = ["2026-10-17T18:00:00.000Z", "2026-11-08T19:00:00.000Z"];

for (const [path, patch] of [
  ["approval in the queue", { status: "published", reviewNote: undefined }],
  ["a calendar sync adopting the event", { feedId: "feed-1" }],
  ["a permalink change rewriting a reference", { venue: "nieuw-buurthuis" }],
  ["an edit from a form that does not show the dates", { title: "Concertserie 2026" }],
] as const) {
  test(`keeps the date list through ${path}`, () => {
    assert.deepEqual(storedDates(mergeDocument(seriesRaw, { ...patch }, "Drie avonden")), SERIES);
  });
}

test("the edit form that presents the list replaces or clears it", () => {
  const one = mergeDocument(seriesRaw, { dates: ["2026-11-08T19:00:00.000Z"] }, "");
  assert.deepEqual(storedDates(one), ["2026-11-08T19:00:00.000Z"]);
  const none = mergeDocument(seriesRaw, { dates: undefined }, "");
  assert.ok(!("dates" in matter(none).data));
});
