import test from "node:test";
import assert from "node:assert/strict";
import {
  listedOccurrences,
  occurrencePassedAt,
  showsNextOnly,
  type SeriesEvent,
} from "./event-series";
import { addDays, siteWallTime, startOfToday } from "@/lib/date";

/**
 * A recurring event standing in for its next occurrence
 * (event-recurring-next-only D1–D3). Dates are Amsterdam wall times, so the
 * expectations hold under `TZ=UTC` too.
 */

const weekly = { freq: "weekly" as const, interval: 1 };
// Fridays at 16:30, as the Arabic lessons that prompted the change.
const START = siteWallTime(2026, 10, 16, 16, 30);

const event = (over: Partial<SeriesEvent> = {}): SeriesEvent => ({
  start: START,
  recurrence: weekly,
  nextOccurrenceOnly: true,
  ...over,
});

/** The window a listing asks for, from the start of `now`'s day. */
const window = (now: Date, days = 90) => {
  const from = startOfToday(now);
  return [from, addDays(from, days), now] as const;
};

// ── The derived predicate (D1) ──────────────────────────────────────────────

test("the flag counts only together with a recurrence", () => {
  assert.equal(showsNextOnly(event()), true);
  // A flag on its own is dead, not dangerous: the schema carries no
  // cross-field rule on purpose, so an unpaired flag must simply do nothing.
  assert.equal(showsNextOnly({ start: START, nextOccurrenceOnly: true }), false);
  assert.equal(showsNextOnly({ start: START, recurrence: weekly }), false);
  assert.equal(showsNextOnly({ start: START }), false);
});

test("a date series is unaffected by the flag", () => {
  const dates = [siteWallTime(2026, 11, 8, 16, 30)];
  assert.equal(showsNextOnly({ start: START, dates, nextOccurrenceOnly: true }), false);
});

// ── When an occurrence is over (D3) ─────────────────────────────────────────

test("an occurrence with an end passes at that end", () => {
  const e = event({ end: siteWallTime(2026, 10, 16, 18, 0) });
  assert.deepEqual(occurrencePassedAt(e, START), siteWallTime(2026, 10, 16, 18, 0));
  // A later occurrence carries its own end, not the first one's.
  const later = siteWallTime(2026, 10, 23, 16, 30);
  assert.deepEqual(occurrencePassedAt(e, later), siteWallTime(2026, 10, 23, 18, 0));
});

test("an occurrence without an end passes at its own start", () => {
  assert.deepEqual(occurrencePassedAt(event(), START), START);
});

test("an agenda marker passes at the end of its day", () => {
  // Its start is midnight, so passing at its start would hide the day it marks.
  const day = siteWallTime(2027, 3, 20);
  const marker = event({ start: day, noPage: true });
  assert.deepEqual(occurrencePassedAt(marker, day), siteWallTime(2027, 3, 21));
});

// ── What a listing gets (D2) ────────────────────────────────────────────────

test("a collapsed series contributes exactly one occurrence", () => {
  const now = siteWallTime(2026, 10, 12, 9, 0); // the Monday before
  assert.deepEqual(listedOccurrences(event(), ...window(now)), [START]);
});

test("the entry rolls over once its hour has passed", () => {
  const e = event();
  const friday = (hour: number, minute = 0) =>
    listedOccurrences(e, ...window(siteWallTime(2026, 10, 16, hour, minute)));
  assert.deepEqual(friday(16, 0), [START], "before it starts");
  assert.deepEqual(friday(17, 0), [siteWallTime(2026, 10, 23, 16, 30)], "after it starts");
});

test("an occurrence still under way keeps the entry", () => {
  const e = event({ end: siteWallTime(2026, 10, 16, 18, 0) });
  const at = (hour: number) =>
    listedOccurrences(e, ...window(siteWallTime(2026, 10, 16, hour)));
  assert.deepEqual(at(17), [START], "during");
  assert.deepEqual(at(19), [siteWallTime(2026, 10, 23, 16, 30)], "after the end");
});

test("a monthly series collapses the same way", () => {
  const e = event({ recurrence: { freq: "monthly", interval: 1 } });
  const now = siteWallTime(2026, 10, 20, 9, 0); // after October's
  assert.deepEqual(listedOccurrences(e, ...window(now)), [
    siteWallTime(2026, 11, 16, 16, 30),
  ]);
});

test("a series whose end date has passed leaves the listing", () => {
  const e = event({
    recurrence: { ...weekly, until: siteWallTime(2026, 10, 16, 23, 59) },
  });
  const now = siteWallTime(2026, 10, 16, 17, 0); // its last occurrence is over
  assert.deepEqual(listedOccurrences(e, ...window(now)), []);
});

test("nothing in the window means no entry", () => {
  // Every third month, asked for a 30-day window that holds no occurrence.
  const e = event({ recurrence: { freq: "monthly", interval: 3 } });
  const now = siteWallTime(2026, 10, 20, 9, 0);
  assert.deepEqual(listedOccurrences(e, ...window(now, 30)), []);
});

// ── Everything else is untouched ────────────────────────────────────────────

test("a recurring event without the flag still lists every occurrence", () => {
  const e = event({ nextOccurrenceOnly: undefined });
  const now = siteWallTime(2026, 10, 12, 9, 0);
  const all = listedOccurrences(e, ...window(now, 30));
  assert.deepEqual(all, [
    START,
    siteWallTime(2026, 10, 23, 16, 30),
    siteWallTime(2026, 10, 30, 16, 30),
    siteWallTime(2026, 11, 6, 16, 30),
  ]);
});

test("a date series lists every date, flag or no flag", () => {
  const dates = [siteWallTime(2026, 10, 23, 16, 30), siteWallTime(2026, 11, 8, 16, 30)];
  const now = siteWallTime(2026, 10, 12, 9, 0);
  for (const flag of [true, undefined]) {
    const e: SeriesEvent = { start: START, dates, nextOccurrenceOnly: flag };
    assert.deepEqual(
      listedOccurrences(e, ...window(now)),
      [START, ...dates],
      String(flag),
    );
  }
});

test("a single-date event is unchanged", () => {
  const now = siteWallTime(2026, 10, 12, 9, 0);
  assert.deepEqual(listedOccurrences({ start: START }, ...window(now)), [START]);
});
