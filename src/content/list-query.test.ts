import test from "node:test";
import assert from "node:assert/strict";
import {
  PAGE_SIZE,
  applyListQuery,
  eventListDate,
  eventIsUpcoming,
  listQueryString,
  parseListQuery,
  type ListQuery,
} from "./list-query";
import type { ContentSummary } from "./summaries";
import type { ContentType } from "./schema";

/** The view of a backend management list (admin-content-table D4). */

// ── Reading the view from the address ───────────────────────────────────────

test("no parameters give the default view", () => {
  assert.deepEqual(parseListQuery("event", {}), {
    status: undefined,
    q: "",
    periode: undefined,
    locatie: undefined,
    organisator: undefined,
    sort: undefined,
    dir: "desc",
    pagina: 1,
  });
});

test("every parameter is read", () => {
  const q = parseListQuery("event", {
    status: "draft",
    q: "  repair ",
    periode: "aankomend",
    locatie: "de-brink",
    organisator: "repair-noord",
    sort: "titel",
    dir: "desc",
    pagina: "3",
  });
  assert.deepEqual(q, {
    status: "draft",
    q: "repair",
    periode: "aankomend",
    locatie: "de-brink",
    organisator: "repair-noord",
    sort: "titel",
    dir: "desc",
    pagina: 3,
  });
});

test("a column sorts in its own direction when none is given", () => {
  assert.equal(parseListQuery("event", { sort: "titel" }).dir, "asc");
  assert.equal(parseListQuery("event", { sort: "gewijzigd" }).dir, "desc");
});

test("invalid values fall back to the default", () => {
  const q = parseListQuery("event", {
    status: "weg",
    periode: "ooit",
    sort: "kleur",
    dir: "zijwaarts",
    pagina: "-2",
  });
  assert.equal(q.status, undefined);
  assert.equal(q.periode, undefined);
  assert.equal(q.sort, undefined);
  assert.equal(q.dir, "desc");
  assert.equal(q.pagina, 1);
  assert.equal(parseListQuery("event", { pagina: "1.5" }).pagina, 1);
  assert.equal(parseListQuery("event", { pagina: "abc" }).pagina, 1);
});

test("a repeated parameter uses its first value", () => {
  assert.equal(parseListQuery("event", { q: ["een", "twee"] }).q, "een");
});

test("filters that do not apply to the type are ignored", () => {
  const venue = parseListQuery("venue", {
    status: "pending",
    periode: "aankomend",
    locatie: "de-brink",
    organisator: "a",
    sort: "datum",
  });
  assert.equal(venue.status, undefined);
  assert.equal(venue.periode, undefined);
  assert.equal(venue.locatie, undefined);
  assert.equal(venue.organisator, undefined);
  assert.equal(venue.sort, undefined);

  const project = parseListQuery("project", {
    status: "pending",
    periode: "aankomend",
    locatie: "de-brink",
    sort: "datum",
  });
  assert.equal(project.status, undefined);
  assert.equal(project.periode, undefined);
  assert.equal(project.locatie, "de-brink");
  assert.equal(project.sort, "datum");

  assert.equal(parseListQuery("blog", { status: "pending" }).status, "pending");
});

test("a view writes back to a short address and reads the same", () => {
  const view = parseListQuery("event", { status: "draft", q: "café", sort: "titel", pagina: "2" });
  const address = listQueryString(view, { pagina: view.pagina });
  assert.equal(address, "?status=draft&q=caf%C3%A9&sort=titel&pagina=2");
  const params = Object.fromEntries(new URLSearchParams(address));
  assert.deepEqual(parseListQuery("event", params), view);
  assert.equal(listQueryString(parseListQuery("event", {})), "");
});

test("changing the view goes back to the first page", () => {
  const view = parseListQuery("event", { q: "x", pagina: "4" });
  assert.equal(listQueryString(view, { status: "draft" }), "?status=draft&q=x");
});

// ── Upcoming events ─────────────────────────────────────────────────────────

const today = new Date("2026-10-02T00:00:00Z");
const day = (iso: string) => new Date(`${iso}T12:00:00Z`);

test("a single past date is not upcoming, a future one is", () => {
  assert.equal(eventIsUpcoming({ start: day("2026-10-01") }, today), false);
  assert.equal(eventIsUpcoming({ start: day("2026-10-02") }, today), true);
  assert.equal(eventIsUpcoming({ start: day("2026-11-01") }, today), true);
});

test("a further date in the future makes a past event upcoming", () => {
  const start = day("2026-06-01");
  assert.equal(eventIsUpcoming({ start, dates: [day("2026-07-01")] }, today), false);
  assert.equal(eventIsUpcoming({ start, dates: [day("2026-07-01"), day("2026-12-01")] }, today), true);
});

test("a recurrence without an end is upcoming; one that ended yesterday is not", () => {
  const start = day("2026-01-05");
  const weekly = { freq: "weekly" as const, interval: 1 };
  assert.equal(eventIsUpcoming({ start, recurrence: weekly }, today), true);
  assert.equal(
    eventIsUpcoming({ start, recurrence: { ...weekly, until: new Date("2026-10-01T00:00:00Z") } }, today),
    false,
  );
  assert.equal(
    eventIsUpcoming({ start, recurrence: { ...weekly, until: new Date("2026-10-02T00:00:00Z") } }, today),
    true,
  );
});

// ── Applying the view ───────────────────────────────────────────────────────

function item(type: ContentType, slug: string, extra: Partial<ContentSummary> = {}): ContentSummary {
  return {
    type,
    slug,
    title: slug,
    status: "published",
    href: `/x/${slug}`,
    venues: [],
    organisers: [],
    ...extra,
  };
}

const events: ContentSummary[] = [
  item("event", "repair", {
    title: "Repair Café",
    start: day("2026-11-10"),
    venues: ["werkplaats"],
    organisers: ["repair-noord"],
    modified: day("2026-09-01"),
  }),
  item("event", "borrel", {
    title: "Buurtborrel",
    start: day("2026-06-01"),
    status: "draft",
    venues: ["brink"],
    organisers: ["anker", "repair-noord"],
    modified: day("2026-09-20"),
  }),
  item("event", "zaaidag", {
    title: "Zaaidag",
    start: day("2026-03-01"),
    status: "pending",
    venues: ["brink"],
    modified: day("2026-08-01"),
  }),
  item("event", "koffie", {
    title: "Ochtendkoffie",
    start: day("2026-01-05"),
    recurrence: { freq: "weekly", interval: 1 },
  }),
];

const view = (params: Record<string, string> = {}, type: ContentType = "event"): ListQuery =>
  parseListQuery(type, params);
const slugs = (params: Record<string, string> = {}) =>
  applyListQuery("event", events, view(params), today).rows.map((r) => r.slug);

test("events default to newest date first; a weekly event by its next occurrence", () => {
  assert.deepEqual(slugs(), ["repair", "koffie", "borrel", "zaaidag"]);
});

test("venues and organisers default to name order, whatever the case", () => {
  const venues = [item("venue", "b", { title: "de Brink" }), item("venue", "a", { title: "Anker" }), item("venue", "c", { title: "Café Zuid" })];
  const rows = applyListQuery("venue", venues, view({}, "venue"), today).rows;
  assert.deepEqual(rows.map((r) => r.title), ["Anker", "Café Zuid", "de Brink"]);
});

test("blog posts and projects default to newest date first", () => {
  const posts = [item("blog", "oud", { date: day("2026-01-01") }), item("blog", "nieuw", { date: day("2026-09-01") })];
  assert.deepEqual(applyListQuery("blog", posts, view({}, "blog"), today).rows.map((r) => r.slug), ["nieuw", "oud"]);
});

test("status narrows the rows but not the counts", () => {
  const result = applyListQuery("event", events, view({ status: "draft" }), today);
  assert.deepEqual(result.rows.map((r) => r.slug), ["borrel"]);
  assert.equal(result.total, 1);
  assert.deepEqual(result.counts, { all: 4, published: 2, pending: 1, draft: 1 });
});

test("search ignores case and accents, and does not change the counts", () => {
  assert.deepEqual(slugs({ q: "cafe" }), ["repair"]);
  assert.deepEqual(slugs({ q: "CAFÉ" }), ["repair"]);
  assert.deepEqual(slugs({ q: "bestaat niet" }), []);
  assert.equal(applyListQuery("event", events, view({ q: "cafe" }), today).counts.all, 4);
});

test("period, location and organiser filters", () => {
  assert.deepEqual(slugs({ periode: "aankomend" }), ["repair", "koffie"]);
  assert.deepEqual(slugs({ periode: "geweest" }), ["borrel", "zaaidag"]);
  assert.deepEqual(slugs({ locatie: "brink" }), ["borrel", "zaaidag"]);
  assert.deepEqual(slugs({ organisator: "repair-noord" }), ["repair", "borrel"]);
  assert.deepEqual(slugs({ locatie: "brink", organisator: "repair-noord" }), ["borrel"]);
});

test("each column sorts in both directions", () => {
  assert.deepEqual(slugs({ sort: "titel" }), ["borrel", "koffie", "repair", "zaaidag"]);
  assert.deepEqual(slugs({ sort: "titel", dir: "desc" }), ["zaaidag", "repair", "koffie", "borrel"]);
  assert.deepEqual(slugs({ sort: "datum", dir: "asc" }), ["zaaidag", "borrel", "koffie", "repair"]);
  assert.deepEqual(slugs({ sort: "datum" }), ["repair", "koffie", "borrel", "zaaidag"]);
  // Published, in the queue, hidden — and by title within a status.
  assert.deepEqual(slugs({ sort: "status" }), ["koffie", "repair", "zaaidag", "borrel"]);
  assert.deepEqual(slugs({ sort: "status", dir: "desc" }), ["borrel", "zaaidag", "koffie", "repair"]);
});

test("an item without a modified time sorts last in either direction", () => {
  assert.deepEqual(slugs({ sort: "gewijzigd" }), ["borrel", "repair", "zaaidag", "koffie"]);
  assert.deepEqual(slugs({ sort: "gewijzigd", dir: "asc" }), ["zaaidag", "repair", "borrel", "koffie"]);
});

const many = Array.from({ length: 60 }, (_, i) =>
  item("event", `e${String(i).padStart(2, "0")}`, { start: new Date(Date.UTC(2026, 0, 1 + i)) }),
);

test("a page holds 25 rows, with the total and the page count", () => {
  const result = applyListQuery("event", many, view(), today);
  assert.equal(PAGE_SIZE, 25);
  assert.equal(result.rows.length, 25);
  assert.equal(result.total, 60);
  assert.equal(result.pageCount, 3);
  assert.equal(result.rows[0].slug, "e59");
  const last = applyListQuery("event", many, view({ pagina: "3" }), today);
  assert.equal(last.rows.length, 10);
  assert.equal(last.page, 3);
});

test("a page past the end shows the last page", () => {
  const result = applyListQuery("event", many, view({ pagina: "9" }), today);
  assert.equal(result.page, 3);
  assert.equal(result.rows.length, 10);
});

test("an empty type has one empty page", () => {
  const result = applyListQuery("event", [], view({ pagina: "2" }), today);
  assert.deepEqual([result.rows.length, result.total, result.page, result.pageCount], [0, 0, 1, 1]);
});

// ── The date an event is listed by (admin-events-sort-by-next-date D1) ──────

const listed = (type: ContentType, list: ContentSummary[], params: Record<string, string> = {}) =>
  applyListQuery(type, list, parseListQuery(type, params), today).rows.map((r) => r.slug);

const weekly: ContentSummary = item("event", "koffie", {
  title: "Koffieochtend",
  start: day("2026-01-08"), // a Thursday; today is Friday 2 October
  recurrence: { freq: "weekly", interval: 1 },
});
const series: ContentSummary = item("event", "cursus", {
  title: "Cursus",
  start: day("2026-09-01"),
  dates: [day("2026-09-15"), day("2026-10-20")],
});
const past: ContentSummary = item("event", "borrel", { title: "Borrel", start: day("2026-09-25") });
const soon: ContentSummary = item("event", "markt", { title: "Markt", start: day("2026-10-10") });
const later: ContentSummary = item("event", "feest", { title: "Feest", start: day("2026-11-05") });

test("a weekly event is listed by its next occurrence", () => {
  const next = eventListDate(weekly, today);
  assert.equal(next && new Date(next).toISOString().slice(0, 10), "2026-10-08");
});

test("an event with a further date still to come is listed by that date", () => {
  assert.equal(eventListDate(series, today)?.toISOString().slice(0, 10), "2026-10-20");
});

test("a past event keeps the date its page shows", () => {
  assert.equal(eventListDate(past, today)?.toISOString().slice(0, 10), "2026-09-25");
  const ended = item("event", "oud", { start: day("2026-03-01"), dates: [day("2026-04-01")] });
  assert.equal(eventListDate(ended, today)?.toISOString().slice(0, 10), "2026-04-01");
});

test("the events list orders by the next date, in both directions", () => {
  const list = [weekly, series, past, soon, later];
  assert.deepEqual(listed("event", list), ["feest", "cursus", "markt", "koffie", "borrel"]);
  assert.deepEqual(listed("event", list, { sort: "datum", dir: "asc" }), ["borrel", "koffie", "markt", "cursus", "feest"]);
});

test("blog posts and projects still sort by their own date", () => {
  const posts = [item("blog", "oud", { date: day("2026-01-01") }), item("blog", "nieuw", { date: day("2026-09-01") })];
  assert.deepEqual(listed("blog", posts, { sort: "datum", dir: "asc" }), ["oud", "nieuw"]);
  const projects = [item("project", "a", { date: day("2026-05-01") }), item("project", "b", { date: day("2026-06-01") })];
  assert.deepEqual(listed("project", projects), ["b", "a"]);
});
