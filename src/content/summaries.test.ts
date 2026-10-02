import test from "node:test";
import assert from "node:assert/strict";
import { parseDoc } from "./parse";
import { toSummary } from "./summaries";
import type { ContentType } from "./schema";

/** Content summaries: what lists and reference checks read (admin-content-table D2). */

function summary(type: ContentType, slug: string, frontmatter: string, modified?: Date) {
  const raw = `---\n${frontmatter}\n---\n\nTekst die niet in de samenvatting hoort.\n`;
  return toSummary(type, parseDoc(type, { key: `x/${slug}.mdx`, slug, raw }), modified);
}

test("an event carries its dates and every venue and organiser it names", () => {
  const modified = new Date("2026-10-01T10:00:00Z");
  const s = summary(
    "event",
    "repair-cafe",
    [
      "title: Repair Café",
      "start: '2026-06-14T13:00'",
      "end: '2026-06-14T15:00'",
      "venue: de-brink",
      "organiser: repair-noord",
      "moreOrganisers:",
      "  - stichting-anker",
      "  - repair-noord",
      "recurrence:",
      "  freq: weekly",
      "status: draft",
    ].join("\n"),
    modified,
  );
  assert.equal(s.title, "Repair Café");
  assert.equal(s.status, "draft");
  assert.equal(s.href, "/agenda/repair-cafe");
  assert.equal(s.modified, modified);
  assert.deepEqual(s.venues, ["de-brink"]);
  assert.deepEqual(s.organisers, ["repair-noord", "stichting-anker"]);
  assert.ok(s.start instanceof Date && s.end instanceof Date);
  assert.equal(s.recurrence?.freq, "weekly");
  assert.equal(s.noPage, false);
  assert.equal("body" in s, false);
});

test("a marker is flagged, and an event may name no venue or organiser", () => {
  const s = summary("event", "lente", "title: Begin van de lente\nstart: '2027-03-20T00:00'\nnoPage: true");
  assert.equal(s.noPage, true);
  assert.deepEqual(s.venues, []);
  assert.deepEqual(s.organisers, []);
  assert.equal(s.status, "published");
});

test("an event's further dates are carried without its start", () => {
  const s = summary(
    "event",
    "reeks",
    "title: Reeks\nstart: '2026-06-14T13:00'\ndates:\n  - '2026-07-12T13:00'\n  - '2026-06-14T13:00'",
  );
  assert.equal(s.dates?.length, 1);
});

test("a blog post carries its date, author and related records", () => {
  const s = summary(
    "blog",
    "welkom",
    "title: Welkom\ndate: '2026-05-28'\nauthor: Redactie\nrelatedVenues:\n  - de-brink\nrelatedOrganisers:\n  - repair-noord",
  );
  assert.equal(s.author, "Redactie");
  assert.ok(s.date instanceof Date);
  assert.deepEqual(s.venues, ["de-brink"]);
  assert.deepEqual(s.organisers, ["repair-noord"]);
  assert.equal(s.href, "/blog/welkom");
});

test("a project carries its location and organisers", () => {
  const s = summary(
    "project",
    "tuin",
    "title: Tuin\ndate: '2026-05-01'\nvenue: de-brink\norganisers:\n  - a\n  - b",
  );
  assert.deepEqual(s.venues, ["de-brink"]);
  assert.deepEqual(s.organisers, ["a", "b"]);
  assert.equal(s.href, "/projecten/tuin");
});

test("a venue is named by its name, has an address, and points at nothing", () => {
  const s = summary("venue", "de-brink", "name: De Brink\naddress: Brink 1, Maastricht");
  assert.equal(s.title, "De Brink");
  assert.equal(s.address, "Brink 1, Maastricht");
  assert.deepEqual(s.venues, []);
  assert.equal(s.href, "/locaties/de-brink");
});

test("an organiser's location is the venue it points at", () => {
  const s = summary("organiser", "repair-noord", "name: Repair Noord\nlocation: werkplaats-noord");
  assert.equal(s.title, "Repair Noord");
  assert.deepEqual(s.venues, ["werkplaats-noord"]);
  assert.equal(s.href, "/organisatoren/repair-noord");
});

test("a document the store gives no time for has no modified time", () => {
  assert.equal(summary("venue", "x", "name: X").modified, undefined);
});
