import test from "node:test";
import assert from "node:assert/strict";
import matter from "gray-matter";
import { EventFrontmatter } from "./schema";
import { showsNextOnly } from "./event-series";
import { mergeDocument } from "./write";

/**
 * Storing "only the next occurrence" (event-recurring-next-only D1, D7):
 * what the schema accepts, and what the event form's patch does to a stored
 * document. In the style of `event-mode-form.test.ts`.
 */

const base = { title: "Arabische les", start: "2026-10-16T16:30" };
const weekly = { freq: "weekly", interval: 1, until: "2027-07-02T23:59" };

// ── The schema stays permissive on purpose (D1) ────────────────────────────

test("an event without the field parses, as every stored one does", () => {
  assert.equal(EventFrontmatter.parse(base).nextOccurrenceOnly, undefined);
});

test("an event with the flag and a rule parses", () => {
  const d = EventFrontmatter.parse({ ...base, recurrence: weekly, nextOccurrenceOnly: true });
  assert.equal(d.nextOccurrenceOnly, true);
  assert.equal(showsNextOnly(d), true);
});

test("the flag without a rule parses and is simply ignored", () => {
  // Deliberately NOT a validation error: `parseAll` skips a document that fails
  // validation, which would delete the event from the site and the backend at
  // once. The flag is dead here instead of dangerous.
  const parsed = EventFrontmatter.safeParse({ ...base, nextOccurrenceOnly: true });
  assert.equal(parsed.success, true);
  assert.ok(parsed.success);
  assert.equal(parsed.data.nextOccurrenceOnly, true);
  assert.equal(showsNextOnly(parsed.data), false);
});

test("a non-boolean flag is refused", () => {
  assert.equal(EventFrontmatter.safeParse({ ...base, nextOccurrenceOnly: "ja" }).success, false);
});

// ── What the form's patch does (D7) ────────────────────────────────────────

/**
 * The event form reads the flag only once it has a recurrence, and always puts
 * it in the patch — so `undefined` is what an unchecked box, or a save that
 * turns the repetition off, writes.
 */
function readNextOnly(form: FormData, hasRecurrence: boolean): true | undefined {
  return hasRecurrence && form.get("nextOnly") ? true : undefined;
}

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};

test("the box is read only when the event repeats", () => {
  assert.equal(readNextOnly(form({ nextOnly: "on" }), true), true);
  // Posted without a rule — the no-JavaScript path, where the box is always
  // visible. Dropped silently, not refused.
  assert.equal(readNextOnly(form({ nextOnly: "on" }), false), undefined);
});

test("an unchecked box reads as nothing, not as false", () => {
  assert.equal(readNextOnly(form({}), true), undefined);
});

const stored = matter.stringify("\nElke vrijdag welkom.\n", {
  title: "Arabische les",
  start: "2026-10-16T16:30",
  recurrence: weekly,
  nextOccurrenceOnly: true,
  venue: "buurthuis",
  organiser: "stichting",
  excerpt: "Samen leren",
  uid: "ical-77@example.com",
  status: "published",
});

test("clearing the box removes the key and keeps everything else", () => {
  const patch = {
    title: "Arabische les",
    recurrence: weekly,
    nextOccurrenceOnly: readNextOnly(form({}), true),
    venue: "buurthuis",
  };
  const { data, content } = matter(mergeDocument(stored, patch, "Elke vrijdag welkom."));
  assert.ok(!("nextOccurrenceOnly" in data));
  assert.deepEqual(data.recurrence, weekly);
  assert.equal(data.venue, "buurthuis");
  assert.equal(data.organiser, "stichting");
  assert.equal(data.excerpt, "Samen leren");
  assert.equal(data.uid, "ical-77@example.com");
  assert.equal(content.trim(), "Elke vrijdag welkom.");
});

test("turning the repetition off takes the flag with it", () => {
  const patch = {
    title: "Arabische les",
    recurrence: undefined,
    nextOccurrenceOnly: readNextOnly(form({ nextOnly: "on" }), false),
  };
  const { data } = matter(mergeDocument(stored, patch, "Elke vrijdag welkom."));
  assert.ok(!("recurrence" in data));
  assert.ok(!("nextOccurrenceOnly" in data));
  assert.equal(data.venue, "buurthuis");
});

test("a save that does not mention the flag keeps the stored one", () => {
  // Approval, import adoption and a permalink change never present the
  // recurrence controls, so the merge must leave the flag alone.
  const { data } = matter(mergeDocument(stored, { title: "Arabische les (verplaatst)" }, "x"));
  assert.equal(data.nextOccurrenceOnly, true);
  assert.deepEqual(data.recurrence, weekly);
});

test("what the form writes is what the schema reads back", () => {
  const patch = {
    title: "Arabische les",
    start: "2026-10-16T16:30",
    recurrence: weekly,
    nextOccurrenceOnly: readNextOnly(form({ nextOnly: "on" }), true),
  };
  const { data } = matter(mergeDocument(stored, patch, "x"));
  const parsed = EventFrontmatter.parse(data);
  assert.equal(showsNextOnly(parsed), true);
});
