import test from "node:test";
import assert from "node:assert/strict";
import {
  recurrenceLabel,
  recurrenceDetail,
  recurrenceRhythm,
  recurrenceSummary,
  nextDateLabel,
  type RecurrenceLike,
} from "./recurrence-label";
import { siteWallTime } from "./date";

/**
 * The interval cases are the regression guard for the defect this module fixes:
 * two separately written labels both ignored `interval`, so an event repeating
 * every second week was described as repeating every week — to visitors on the
 * public page and to editors in the review queue (share-event-previews D4;
 * events spec "A multi-interval recurrence is described by its interval").
 */

const weekly = (interval?: number, until?: Date | string): RecurrenceLike => ({
  freq: "weekly",
  interval,
  until,
});
const monthly = (interval?: number, until?: Date | string): RecurrenceLike => ({
  freq: "monthly",
  interval,
  until,
});

test("no recurrence yields no label", () => {
  assert.equal(recurrenceLabel(undefined), undefined);
});

test("interval of one reads as the bare unit", () => {
  assert.equal(recurrenceLabel(weekly(1)), "Elke week");
  assert.equal(recurrenceLabel(monthly(1)), "Elke maand");
});

test("interval greater than one is stated and pluralised", () => {
  assert.equal(recurrenceLabel(weekly(2)), "Elke 2 weken");
  assert.equal(recurrenceLabel(weekly(3)), "Elke 3 weken");
  assert.equal(recurrenceLabel(monthly(2)), "Elke 2 maanden");
  assert.equal(recurrenceLabel(monthly(6)), "Elke 6 maanden");
});

test("a missing interval is treated as every one", () => {
  // Documents predating the interval field must not render "Elke undefined weken".
  assert.equal(recurrenceLabel(weekly(undefined)), "Elke week");
  assert.equal(recurrenceLabel(monthly(undefined)), "Elke maand");
});

test("a nonsensical interval degrades to every one", () => {
  assert.equal(recurrenceLabel(weekly(0)), "Elke week");
  assert.equal(recurrenceLabel(weekly(-4)), "Elke week");
  assert.equal(recurrenceLabel(weekly(2.7)), "Elke 2 weken");
});

test("detail names a one-off explicitly", () => {
  assert.equal(recurrenceDetail(undefined), "Eenmalig");
});

test("detail calls out an open-ended recurrence", () => {
  assert.equal(recurrenceDetail(weekly(1)), "Elke week — zonder einddatum");
  assert.equal(
    recurrenceDetail(weekly(2)),
    "Elke 2 weken — zonder einddatum",
  );
});

test("detail carries the end date when there is one", () => {
  const label = recurrenceDetail(weekly(2, new Date(2026, 11, 20)));
  assert.match(label, /^Elke 2 weken, t\/m /);
  assert.match(label, /2026/);
});

test("detail accepts an ISO string end date", () => {
  // The review queue carries `until` as a string across its server boundary.
  const fromDate = recurrenceDetail(weekly(1, new Date(2026, 11, 20)));
  const fromString = recurrenceDetail(
    weekly(1, new Date(2026, 11, 20).toISOString()),
  );
  assert.equal(fromString, fromDate);
});

test("an unparseable end date never renders Invalid Date", () => {
  const label = recurrenceDetail(weekly(1, "not-a-date"));
  assert.equal(label, "Elke week — zonder einddatum");
  assert.doesNotMatch(label, /Invalid/);
});

// ── A collapsed series' two lines (event-recurring-next-only D4) ────────────

// A Friday at 16:30, in Amsterdam wall time so the labels hold under TZ=UTC.
const NEXT = siteWallTime(2026, 10, 16, 16, 30);

test("a weekly rhythm names its weekday and time", () => {
  assert.equal(recurrenceSummary(weekly(1), NEXT), "Elke week vr. om 16:30");
});

test("the rhythm keeps the interval, as every description must", () => {
  assert.equal(recurrenceSummary(weekly(2), NEXT), "Elke 2 weken vr. om 16:30");
  assert.equal(recurrenceSummary(monthly(2), NEXT), "Elke 2 maanden om 16:30");
});

test("a monthly rhythm leaves the day of the month to the next-date line", () => {
  assert.equal(recurrenceSummary(monthly(1), NEXT), "Elke maand om 16:30");
});

test("a missing interval still reads as every one of its frequency", () => {
  assert.equal(recurrenceSummary(weekly(), NEXT), "Elke week vr. om 16:30");
});

test("no recurrence yields no rhythm, so the line can be omitted", () => {
  assert.equal(recurrenceSummary(undefined, NEXT), undefined);
  assert.equal(recurrenceRhythm(undefined, NEXT), undefined);
});

test("the table's rhythm is the same wording without the time", () => {
  // The Tijd column states the time in its own right; the two must still agree
  // on the rhythm itself, which is why they share one function.
  for (const r of [weekly(1), weekly(2), monthly(1)]) {
    const rhythm = recurrenceRhythm(r, NEXT);
    assert.equal(recurrenceSummary(r, NEXT), `${rhythm} om 16:30`);
  }
  assert.equal(recurrenceRhythm(weekly(1), NEXT), "Elke week vr.");
  assert.equal(recurrenceRhythm(monthly(1), NEXT), "Elke maand");
});

test("the next-date line names the date without its weekday", () => {
  assert.equal(nextDateLabel(NEXT), "Volgende 16 okt");
});
