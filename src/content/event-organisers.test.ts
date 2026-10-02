import test from "node:test";
import assert from "node:assert/strict";
import { EventFrontmatter } from "./schema";
import matter from "gray-matter";
import {
  eventOrganiserSlugs,
  isOrganisedBy,
  organiserFields,
  organisersLabel,
  resolveOrganisers,
} from "./event-organisers";
import { mergeDocument } from "./write";

/** Several equal organisers per event (event-multiple-organisers). */

const base = { title: "Repair Café", start: "2026-06-10T19:00" };

test("an event stored with one organiser still parses", () => {
  const data = EventFrontmatter.parse({ ...base, organiser: "stichting" });
  assert.equal(data.organiser, "stichting");
  assert.equal(data.moreOrganisers, undefined);
});

test("an event with further organisers parses", () => {
  const data = EventFrontmatter.parse({ ...base, organiser: "a", moreOrganisers: ["b", "c"] });
  assert.deepEqual([data.organiser, data.moreOrganisers], ["a", ["b", "c"]]);
});

test("an unknown frontmatter key is stripped, not rejected (rollback safety, D1)", () => {
  const result = EventFrontmatter.safeParse({ ...base, organiser: "a", laterField: ["x"] });
  assert.ok(result.success);
  assert.equal("laterField" in result.data, false);
});

const org = (slug: string, name: string) => ({ slug, name });
const bySlug = new Map(
  [org("anker", "Stichting 't Anker"), org("koor", "Celebrations Koor"), org("tuin", "Buurttuin")].map(
    (o) => [o.slug, o],
  ),
);
const names = (list: { name: string }[]) => list.map((o) => o.name);

test("no organisers resolve to an empty list", () => {
  assert.deepEqual(resolveOrganisers({}, bySlug), []);
});

test("a single organiser resolves to a list of one", () => {
  assert.deepEqual(names(resolveOrganisers({ organiser: "koor" }, bySlug)), ["Celebrations Koor"]);
});

test("several organisers resolve sorted by name", () => {
  const list = resolveOrganisers({ organiser: "anker", moreOrganisers: ["tuin", "koor"] }, bySlug);
  assert.deepEqual(names(list), ["Buurttuin", "Celebrations Koor", "Stichting 't Anker"]);
});

test("a duplicate organiser appears once", () => {
  const list = resolveOrganisers({ organiser: "koor", moreOrganisers: ["koor", "tuin"] }, bySlug);
  assert.deepEqual(names(list), ["Buurttuin", "Celebrations Koor"]);
});

test("an organiser that no longer exists is left out", () => {
  const list = resolveOrganisers({ organiser: "weg", moreOrganisers: ["tuin"] }, bySlug);
  assert.deepEqual(names(list), ["Buurttuin"]);
});

test("the slugs of an event keep stored order without duplicates", () => {
  assert.deepEqual(eventOrganiserSlugs({ organiser: "b", moreOrganisers: ["a", "b"] }), ["b", "a"]);
});

test("no chosen organisers clear both fields", () => {
  assert.deepEqual(organiserFields([]), { organiser: undefined, moreOrganisers: undefined });
});

test("one chosen organiser fills only organiser", () => {
  assert.deepEqual(organiserFields(["koor"]), { organiser: "koor", moreOrganisers: undefined });
});

test("several chosen organisers keep submitted order, first in organiser", () => {
  assert.deepEqual(organiserFields(["anker", "koor", "tuin"]), {
    organiser: "anker",
    moreOrganisers: ["koor", "tuin"],
  });
});

test("duplicate and empty choices are dropped", () => {
  assert.deepEqual(organiserFields(["koor", "", "koor", "tuin"]), {
    organiser: "koor",
    moreOrganisers: ["tuin"],
  });
});

test("saving fewer organisers clears the stored further organisers", () => {
  const raw = matter.stringify("\nTekst\n", { ...base, organiser: "a", moreOrganisers: ["b", "c"] });
  const one = matter(mergeDocument(raw, organiserFields(["a"]), "Tekst")).data;
  assert.equal(one.organiser, "a");
  assert.equal("moreOrganisers" in one, false);
  const none = matter(mergeDocument(raw, organiserFields([]), "Tekst")).data;
  assert.equal("organiser" in none, false);
  assert.equal("moreOrganisers" in none, false);
});

const nameOf = new Map([["koor", "Celebrations Koor"], ["tuin", "Buurttuin"]]);

test("the queue names every organiser and flags one that no longer exists", () => {
  assert.equal(
    organisersLabel({ organiser: "koor", moreOrganisers: ["weg"] }, nameOf),
    "Celebrations Koor, weg (onbekend)",
  );
});

test("the queue says there is no organiser when the event names none", () => {
  assert.equal(organisersLabel({}, nameOf), "Geen organisator");
});

test("an event with two organisers is listed for each of them", () => {
  const event = { organisers: [org("koor", "Celebrations Koor"), org("tuin", "Buurttuin")] };
  assert.equal(isOrganisedBy(event, "koor"), true);
  assert.equal(isOrganisedBy(event, "tuin"), true);
  assert.equal(isOrganisedBy(event, "anker"), false);
  assert.equal(isOrganisedBy({ organisers: [] }, "koor"), false);
});
