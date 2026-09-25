import test from "node:test";
import assert from "node:assert/strict";
import { presentOccurrence } from "./event-presentation";
import { siteWallTime, startOfToday } from "@/lib/date";

/** The date an event page presents (event-multiple-dates D5, D6). */

const oct = (d: number, h = 20) => siteWallTime(2026, 10, d, h, 0);
const nov8 = siteWallTime(2026, 11, 8, 20, 0);
const series = { start: oct(3), end: oct(3, 22), dates: [oct(17), nov8] };
const today = (d: Date) => startOfToday(d);

test("presents the next date and lists the others, marking past ones", () => {
  const p = presentOccurrence(series, today(oct(10, 9)));
  assert.deepEqual(p.start, oct(17));
  assert.equal(p.requested, false);
  assert.deepEqual(p.end, oct(17, 22));
  assert.equal(p.past, false);
  assert.deepEqual(
    p.others.map((o) => [o.start, o.past]),
    [
      [oct(3), true],
      [nov8, false],
    ],
  );
});

test("on the day of a date it is still the one presented", () => {
  assert.deepEqual(presentOccurrence(series, today(oct(17, 23))).start, oct(17));
});

test("when every date has passed, presents the last one as past", () => {
  const p = presentOccurrence(series, today(siteWallTime(2026, 12, 5)));
  assert.deepEqual(p.start, nov8);
  assert.equal(p.past, true);
  assert.equal(p.others.length, 2);
});

test("a requested date the event has is presented, even a past one", () => {
  const t = today(oct(10));
  assert.deepEqual(presentOccurrence(series, t, "2026-11-08").start, nov8);
  assert.equal(presentOccurrence(series, t, "2026-11-08").requested, true);
  assert.equal(presentOccurrence(series, t, "2026-10-18").requested, false);
  const past = presentOccurrence(series, t, "2026-10-03");
  assert.deepEqual(past.start, oct(3));
  assert.equal(past.past, true);
});

test("an unknown or malformed requested date falls back to the default", () => {
  const t = today(oct(10));
  for (const bad of ["2026-10-18", "2026-13-01", "morgen", undefined, ["2026-11-08"]]) {
    assert.deepEqual(presentOccurrence(series, t, bad).start, oct(17), String(bad));
  }
});

test("a single-date event presents its start and lists nothing else", () => {
  const p = presentOccurrence({ start: oct(3) }, today(oct(1)));
  assert.deepEqual(p.start, oct(3));
  assert.equal(p.end, undefined);
  assert.deepEqual(p.others, []);
  // Past single event: presented as it always was, now marked past.
  const later = presentOccurrence({ start: oct(3) }, today(oct(20)));
  assert.deepEqual(later.start, oct(3));
  assert.equal(later.past, true);
});

test("a recurring event presents its next occurrence and can link to one", () => {
  const weekly = { start: oct(3), end: oct(3, 22), recurrence: { freq: "weekly" as const, interval: 1 } };
  const p = presentOccurrence(weekly, today(oct(5)));
  assert.deepEqual(p.start, oct(10));
  assert.deepEqual(p.end, oct(10, 22)); // its own end, not the first one's
  assert.deepEqual(p.others, []);
  assert.deepEqual(presentOccurrence(weekly, today(oct(5)), "2026-10-24").start, oct(24));
  assert.deepEqual(presentOccurrence(weekly, today(oct(5)), "2026-10-25").start, oct(10));
});
