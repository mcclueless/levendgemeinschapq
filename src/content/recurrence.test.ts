import test from "node:test";
import assert from "node:assert/strict";
import {
  firstOccurrenceFrom,
  nextOccurrence,
  occurrencesInRange,
} from "./recurrence";
import { formatDate, siteWallTime, startOfToday } from "@/lib/date";
import type { Recurrence } from "./schema";

/**
 * The forward scan must skip straight to the first occurrence at or after `from`
 * arithmetically, so an open-ended recurrence whose start is long in the past
 * still surfaces its next occurrence (import-current-and-future-events D2/D5;
 * events spec "Existing open-ended recurrence keeps working").
 */

const DAY = 24 * 60 * 60 * 1000;
const weekly = (interval = 1, until?: Date): Recurrence => ({
  freq: "weekly",
  interval,
  until,
});
const monthly = (interval = 1, until?: Date): Recurrence => ({
  freq: "monthly",
  interval,
  until,
});

test("one-off in the future returns its own start", () => {
  const start = new Date(2026, 6, 24);
  assert.deepEqual(
    firstOccurrenceFrom(start, undefined, new Date(2026, 6, 1)),
    start,
  );
});

test("one-off in the past returns null", () => {
  assert.equal(
    firstOccurrenceFrom(new Date(2020, 0, 1), undefined, new Date(2026, 6, 1)),
    null,
  );
});

test("weekly recurrence with a years-old start still yields the next occurrence", () => {
  const start = new Date(2020, 0, 1); // far before `from`
  const from = new Date(2026, 6, 24);
  const next = firstOccurrenceFrom(start, weekly(1), from);
  assert.notEqual(next, null);
  assert.ok(next!.getTime() >= from.getTime());
  assert.ok(next!.getTime() - from.getTime() < 7 * DAY); // within one interval
  // Aligned to the weekly grid, on the site's calendar: occurrences keep their
  // Amsterdam weekday whatever the process timezone.
  assert.equal(formatDate(next!).split(" ")[0], formatDate(start).split(" ")[0]);
});

test("monthly recurrence anchored on the 31st rolls to the next real occurrence", () => {
  // Jan 31 + 1 month overflows February (28 days in 2026) to March 3.
  const next = firstOccurrenceFrom(
    new Date(2026, 0, 31),
    monthly(1),
    new Date(2026, 1, 1),
  );
  assert.notEqual(next, null);
  assert.equal(next!.getFullYear(), 2026);
  assert.equal(next!.getMonth(), 2); // March
  assert.equal(next!.getDate(), 3);
});

test("recurrence whose end has passed returns null", () => {
  assert.equal(
    firstOccurrenceFrom(
      new Date(2026, 0, 1),
      weekly(1, new Date(2026, 5, 1)), // until before `from`
      new Date(2026, 6, 24),
    ),
    null,
  );
});

test("open-ended recurrence with a past start is kept", () => {
  assert.notEqual(
    firstOccurrenceFrom(new Date(2024, 2, 6), weekly(2), new Date(2026, 6, 24)),
    null,
  );
});

test("occurrencesInRange surfaces a long-running weekly recurrence within the horizon", () => {
  const from = new Date(2026, 6, 24);
  const occ = occurrencesInRange(
    new Date(2020, 0, 1), // > 60 weeks before `from` — the old window would miss it
    weekly(1),
    from,
    new Date(2027, 6, 24),
  );
  assert.ok(occ.length > 0);
  assert.ok(occ[0].getTime() >= from.getTime());
  assert.ok(occ[0].getTime() - from.getTime() < 7 * DAY);
});

/**
 * The event page's displayed occurrence is
 * `nextOccurrence(start, recurrence, startOfToday())` — a value that is only
 * correct on the day it is produced. It was previously frozen at build time by
 * ISR, so a page advertised an occurrence that had already passed
 * (fix-stale-recurring-event-dates). The caching cause is fixed by rendering per
 * request; this pins the other half — that the expression itself actually moves
 * when the day does.
 *
 * `startOfToday` takes an injectable clock, so the boundary can be crossed here
 * rather than waited for.
 */

test("the displayed occurrence rolls forward when the day crosses it", () => {
  const start = new Date(2026, 5, 10); // Wed 10 Jun 2026, weekly
  const r = weekly();

  // The evening before an occurrence, it is still the one to show.
  const before = nextOccurrence(start, r, startOfToday(new Date(2026, 8, 8, 23, 59)));
  assert.deepEqual(before, new Date(2026, 8, 9));

  // The morning after, the same expression must move to the following week
  // rather than keep naming a date that has passed.
  const after = nextOccurrence(start, r, startOfToday(new Date(2026, 8, 10, 0, 1)));
  assert.deepEqual(after, new Date(2026, 8, 16));
});

test("on the day of an occurrence it is still shown, not skipped", () => {
  const start = new Date(2026, 5, 10);
  // Midway through the occurrence's own day: a visitor should still see today's
  // event, not next week's.
  const onTheDay = nextOccurrence(start, weekly(), startOfToday(new Date(2026, 8, 9, 12, 0)));
  assert.deepEqual(onTheDay, new Date(2026, 8, 9));
});

// ── Further dates (event-multiple-dates D3) ─────────────────────────────────
// Built in Amsterdam wall time so the expectations hold under `TZ=UTC` too.

const oct = (d: number, h = 20) => siteWallTime(2026, 10, d, h, 0);
const series = { start: oct(3), dates: [oct(17), siteWallTime(2026, 11, 8, 20, 0)] };

test("an event without further dates behaves exactly as before", () => {
  const from = oct(1);
  const horizon = oct(31);
  assert.deepEqual(occurrencesInRange(oct(3), undefined, from, horizon, undefined), [oct(3)]);
  assert.deepEqual(occurrencesInRange(oct(3), undefined, from, horizon, []), [oct(3)]);
  assert.deepEqual(firstOccurrenceFrom(oct(3), undefined, from, []), oct(3));
  assert.equal(firstOccurrenceFrom(oct(3), undefined, oct(4), undefined), null);
});

test("listed dates inside the range are each an occurrence, and those outside are not", () => {
  assert.deepEqual(
    occurrencesInRange(series.start, undefined, oct(1), oct(31), series.dates),
    [oct(3), oct(17)], // 8 November is past the horizon
  );
  assert.deepEqual(
    occurrencesInRange(series.start, undefined, oct(10), siteWallTime(2026, 12, 1), series.dates),
    [oct(17), siteWallTime(2026, 11, 8, 20, 0)], // 3 October has passed
  );
});

test("listed dates are returned in order even when stored out of order", () => {
  // The start need not be the earliest date: an editor may add one before it.
  assert.deepEqual(
    occurrencesInRange(oct(17), undefined, oct(1), oct(31), [oct(24), oct(3)]),
    [oct(3), oct(17), oct(24)],
  );
});

test("a listed date equal to the start is one occurrence, not two", () => {
  assert.deepEqual(
    occurrencesInRange(oct(3), undefined, oct(1), oct(31), [new Date(oct(3).getTime())]),
    [oct(3)],
  );
});

test("the first occurrence is the next listed date once the start has passed", () => {
  assert.deepEqual(firstOccurrenceFrom(series.start, undefined, oct(4), series.dates), oct(17));
  // On the day itself the date is still the one to show.
  assert.deepEqual(
    firstOccurrenceFrom(series.start, undefined, startOfToday(oct(17, 23)), series.dates),
    oct(17),
  );
});

test("when every listed date has passed there is no next occurrence", () => {
  assert.equal(firstOccurrenceFrom(series.start, undefined, siteWallTime(2026, 12, 1), series.dates), null);
  assert.deepEqual(
    occurrencesInRange(series.start, undefined, siteWallTime(2026, 12, 1), siteWallTime(2027, 12, 1), series.dates),
    [],
  );
});

test("a recurrence wins over listed dates if both are somehow stored", () => {
  const withRule = occurrencesInRange(oct(3), weekly(1, oct(17)), oct(1), oct(31), [oct(5)]);
  assert.deepEqual(withRule, [oct(3), oct(10), oct(17)]);
  assert.deepEqual(firstOccurrenceFrom(oct(3), weekly(1, oct(17)), oct(4), [oct(5)]), oct(10));
});

test("listed dates sort among other events' occurrences by their own date", () => {
  // What getUpcomingEvents does: flatten every event's occurrences, then sort.
  const other = occurrencesInRange(oct(10), undefined, oct(1), oct(31));
  const mine = occurrencesInRange(series.start, undefined, oct(1), oct(31), series.dates);
  const merged = [...mine, ...other].sort((a, b) => a.getTime() - b.getTime());
  assert.deepEqual(merged, [oct(3), oct(10), oct(17)]);
});
