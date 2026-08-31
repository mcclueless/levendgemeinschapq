import test from "node:test";
import assert from "node:assert/strict";
import { shareDescription, shareTitle } from "./share-preview";
import type { RecurrenceLike } from "./recurrence-label";

/**
 * Ordering is the point of these tests, not formatting: a link preview truncates
 * the description's tail, so the date must precede the excerpt or it is the fact
 * a reader loses (share-event-previews D1; seo-discoverability spec "Event share
 * previews carry when, where and what").
 */

/**
 * Sat 5 Sep 2026, 14:00 in Europe/Amsterdam — pinned in UTC on purpose.
 * `formatTime` always renders in Europe/Amsterdam, so building this from
 * local-time components would assert a different clock time on every machine:
 * 14:00 here, 16:00 on a UTC CI runner (September is CEST, UTC+2).
 */
const WHEN = new Date(Date.UTC(2026, 8, 5, 12, 0));
const weekly = (interval = 1): RecurrenceLike => ({ freq: "weekly", interval });

test("description leads with the date, not the excerpt", () => {
  const d = shareDescription({ when: WHEN, excerpt: "Koffie en taart." });
  assert.ok(
    d.indexOf("2026") === -1 || d.indexOf("sep") < d.indexOf("Koffie"),
    "the date must appear before the excerpt",
  );
  assert.ok(d.startsWith("Za "), `expected a capitalised weekday, got: ${d}`);
});

test("weekday is capitalised even though nl-NL lowercases it", () => {
  const d = shareDescription({ when: WHEN });
  assert.doesNotMatch(d, /^za /);
  assert.match(d, /^Za /);
});

test("recurring event states how often it repeats, before the excerpt", () => {
  const d = shareDescription({
    when: WHEN,
    recurrence: weekly(2),
    excerpt: "Koffie en taart.",
  });
  assert.match(d, /Elke 2 weken/);
  assert.ok(
    d.indexOf("Elke 2 weken") < d.indexOf("Koffie"),
    "recurrence must precede the excerpt",
  );
});

test("non-recurring event carries no recurrence statement", () => {
  const d = shareDescription({ when: WHEN, excerpt: "Koffie en taart." });
  assert.doesNotMatch(d, /Elke/);
  assert.match(d, /Koffie en taart\.$/);
});

test("missing excerpt leaves no dangling dash", () => {
  const d = shareDescription({ when: WHEN, recurrence: weekly(1) });
  assert.doesNotMatch(d, /—\s*$/);
  assert.doesNotMatch(d, /·\s*$/);
  assert.match(d, /Elke week$/);
});

test("blank excerpt is treated as absent", () => {
  const d = shareDescription({ when: WHEN, excerpt: "   " });
  assert.doesNotMatch(d, /—/);
});

test("no recurrence and no excerpt yields the date line alone", () => {
  const d = shareDescription({ when: WHEN });
  assert.doesNotMatch(d, /—/);
  assert.match(d, /^Za .*14:00$/);
});

test("title carries the venue", () => {
  assert.equal(
    shareTitle("Buurtborrel", "Het Groene Huis"),
    "Buurtborrel · Het Groene Huis",
  );
});

test("title without a venue has no trailing separator", () => {
  assert.equal(shareTitle("Buurtborrel"), "Buurtborrel");
  assert.equal(shareTitle("Buurtborrel", null), "Buurtborrel");
  assert.equal(shareTitle("Buurtborrel", "  "), "Buurtborrel");
});
