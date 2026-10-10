import test from "node:test";
import assert from "node:assert/strict";
import matter from "gray-matter";
import { DATES_FIELD, readEventMode } from "./event-form";
import { mergeDocument } from "./write";
import { EventFrontmatter } from "./schema";

/**
 * The event form's mode choice (event-external-link D4; editorial-backend
 * "Choosing where an event leads"). Values are typed Amsterdam wall time, so
 * the expectations hold under `TZ=UTC` too.
 */

const form = (fields: Record<string, string>, ...dates: string[]) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  for (const d of dates) f.append(DATES_FIELD, d);
  return f;
};
const URL_IN = "https://www.buurttuin.nl/agenda/repair-cafe";

// ── Reading the choice ──────────────────────────────────────────────────────

test("no choice, or an unknown one, means an event with its own page", () => {
  // Every event stored before this change was posted without the field.
  assert.deepEqual(readEventMode(form({ start: "2027-03-20T19:00" })), {
    ok: true,
    mode: "page",
  });
  assert.deepEqual(readEventMode(form({ mode: "iets-anders" })), { ok: true, mode: "page" });
});

test("a marker keeps no address, whatever the hidden input still posts", () => {
  assert.deepEqual(readEventMode(form({ mode: "marker", externalUrl: URL_IN })), {
    ok: true,
    mode: "marker",
  });
});

test("an own page keeps no address either, so switching back clears it", () => {
  assert.deepEqual(readEventMode(form({ mode: "page", externalUrl: URL_IN })), {
    ok: true,
    mode: "page",
  });
});

test("an external event stores its address", () => {
  assert.deepEqual(readEventMode(form({ mode: "external", externalUrl: ` ${URL_IN} ` })), {
    ok: true,
    mode: "external",
    externalUrl: URL_IN,
  });
});

test("a pasted address without a scheme is completed, not refused", () => {
  assert.deepEqual(readEventMode(form({ mode: "external", externalUrl: "buurttuin.nl/agenda" })), {
    ok: true,
    mode: "external",
    externalUrl: "https://buurttuin.nl/agenda",
  });
});

test("a missing address, or one that is not a web address, is refused", () => {
  for (const bad of [undefined, "", "   ", "javascript:alert(1)", "mailto:info@buurttuin.nl"]) {
    const f = form({ mode: "external" });
    if (bad !== undefined) f.set("externalUrl", bad);
    assert.deepEqual(readEventMode(f), { ok: false, reason: "external-url" }, String(bad));
  }
});

test("what it accepts is what the schema stores", () => {
  const read = readEventMode(form({ mode: "external", externalUrl: "buurttuin.nl/agenda" }));
  assert.ok(read.ok);
  assert.equal(
    EventFrontmatter.parse({
      title: "Repair Café",
      start: "2027-03-20T19:00",
      externalUrl: read.externalUrl,
    }).externalUrl,
    "https://buurttuin.nl/agenda",
  );
});

// ── The dates each mode posts (event-no-page D4, unchanged) ─────────────────

test("a marker's start and further dates lose their time", () => {
  const f = form({ mode: "marker", start: "2027-03-20T14:30" }, "2027-04-17T20:00");
  readEventMode(f);
  assert.equal(f.get("start"), "2027-03-20T00:00");
  assert.deepEqual(f.getAll(DATES_FIELD), ["2027-04-17T00:00"]);
});

test("an external event keeps its time, like an event with its own page", () => {
  for (const mode of ["external", "page"]) {
    const f = form({ mode, externalUrl: URL_IN, start: "2027-03-20T19:00" }, "2027-04-17T20:00");
    readEventMode(f);
    assert.equal(f.get("start"), "2027-03-20T19:00", mode);
    assert.deepEqual(f.getAll(DATES_FIELD), ["2027-04-17T20:00"], mode);
  }
});

test("a bare date left by a just-changed choice reads as the start of its day", () => {
  const f = form({ mode: "external", externalUrl: URL_IN, start: "2027-03-20" });
  readEventMode(f);
  assert.equal(f.get("start"), "2027-03-20T00:00");
});

// ── Switching modes keeps everything else ──────────────────────────────────

/**
 * The patch `updateEvent` writes for a given mode. Both fields are always in
 * it, so the mode left behind is removed; everything else the form posts — the
 * fields the mode hides with CSS included — is unchanged.
 */
function patch(mode: "page" | "external" | "marker", externalUrl?: string) {
  return {
    title: "Repair Café",
    venue: "buurthuis",
    excerpt: "Samen repareren",
    noPage: mode === "marker" ? true : undefined,
    externalUrl: mode === "external" ? externalUrl : undefined,
  };
}

const stored = matter.stringify("\nDe hele tekst\n", {
  title: "Repair Café",
  start: "2027-03-20T19:00",
  venue: "buurthuis",
  organiser: "stichting",
  excerpt: "Samen repareren",
  uid: "ical-123@example.com",
  status: "published",
});

test("switching to an external page keeps the text, venue and organisers", () => {
  const out = mergeDocument(stored, patch("external", URL_IN), "De hele tekst");
  const { data, content } = matter(out);
  assert.equal(data.externalUrl, URL_IN);
  assert.ok(!("noPage" in data));
  assert.equal(data.venue, "buurthuis");
  assert.equal(data.organiser, "stichting");
  assert.equal(data.excerpt, "Samen repareren");
  assert.equal(data.uid, "ical-123@example.com");
  assert.equal(content.trim(), "De hele tekst");
});

test("switching back to its own page drops the address and keeps the rest", () => {
  const external = mergeDocument(stored, patch("external", URL_IN), "De hele tekst");
  const { data, content } = matter(mergeDocument(external, patch("page"), "De hele tekst"));
  assert.ok(!("externalUrl" in data));
  assert.ok(!("noPage" in data));
  assert.equal(data.venue, "buurthuis");
  assert.equal(data.organiser, "stichting");
  assert.equal(data.excerpt, "Samen repareren");
  assert.equal(content.trim(), "De hele tekst");
});

test("switching from an external page to a marker never leaves both", () => {
  const external = mergeDocument(stored, patch("external", URL_IN), "De hele tekst");
  const { data } = matter(mergeDocument(external, patch("marker"), "De hele tekst"));
  assert.equal(data.noPage, true);
  assert.ok(!("externalUrl" in data));
  assert.equal(data.venue, "buurthuis");
});
