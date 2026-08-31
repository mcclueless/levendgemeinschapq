import test from "node:test";
import assert from "node:assert/strict";
import {
  recurrenceLabel,
  recurrenceDetail,
  type RecurrenceLike,
} from "./recurrence-label";

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
