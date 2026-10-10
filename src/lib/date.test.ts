import test from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  addMonths,
  formatDayMonth,
  formatTime,
  formatTimeRange,
  formatWeekdayShort,
  parseStoredDateTime,
  siteInputToIso,
  siteWallTime,
  startOfToday,
  toSiteInputValue,
} from "./date";

/**
 * Event times mean Amsterdam time, but production runs in UTC. Everything here
 * must give the same instant whatever the process timezone — `pnpm test` runs on
 * a machine in Amsterdam, so run this file with `TZ=UTC` as well.
 */

test("a summer wall time is two hours ahead of UTC", () => {
  assert.equal(siteWallTime(2026, 9, 25, 19, 30).toISOString(), "2026-09-25T17:30:00.000Z");
});

test("a winter wall time is one hour ahead of UTC", () => {
  assert.equal(siteWallTime(2026, 12, 11, 19, 30).toISOString(), "2026-12-11T18:30:00.000Z");
});

test("the same wall time shows the same on both sides of the DST change", () => {
  for (const [m, d] of [[10, 24], [10, 25], [10, 26]]) {
    assert.equal(formatTime(siteWallTime(2026, m, d, 19, 30)), "19:30");
  }
});

test("midnight in the site timezone", () => {
  assert.equal(siteWallTime(2026, 9, 26).toISOString(), "2026-09-25T22:00:00.000Z");
  assert.equal(formatTime(siteWallTime(2026, 9, 26)), "00:00");
});

test("times just around the DST switch resolve to real instants", () => {
  // 25 Oct 2026, 02:30 happens twice; either instant reads 02:30 locally.
  assert.equal(formatTime(siteWallTime(2026, 10, 25, 2, 30)), "02:30");
  assert.equal(formatTime(siteWallTime(2026, 10, 25, 3, 30)), "03:30");
  assert.equal(formatTime(siteWallTime(2026, 3, 29, 3, 30)), "03:30");
});

test("an offset-less stored time is read as UTC, as production always read it", () => {
  // An imported High Mass (19:30 Amsterdam) saved through the old edit form.
  const d = parseStoredDateTime("2026-08-22T17:30") as Date;
  assert.equal(d.toISOString(), "2026-08-22T17:30:00.000Z");
  assert.equal(formatTime(d), "19:30");
  assert.equal((parseStoredDateTime("2026-08-22T17:30:15") as Date).toISOString(), "2026-08-22T17:30:15.000Z");
});

test("values with an offset, Z, or already a Date are unchanged", () => {
  assert.equal((parseStoredDateTime("2026-09-25T19:30:00.000Z") as Date).toISOString(), "2026-09-25T19:30:00.000Z");
  assert.equal((parseStoredDateTime("2026-06-20T17:00:00+02:00") as Date).toISOString(), "2026-06-20T15:00:00.000Z");
  const date = new Date("2026-01-01T10:00:00Z");
  assert.equal(parseStoredDateTime(date), date);
  assert.equal(parseStoredDateTime(undefined), undefined);
});

test("a typed form time is stored as unambiguous UTC", () => {
  assert.equal(siteInputToIso("2026-09-25T19:30"), "2026-09-25T17:30:00.000Z");
  assert.equal(siteInputToIso("2026-12-11T19:30"), "2026-12-11T18:30:00.000Z");
  assert.equal(siteInputToIso(undefined), undefined);
  assert.equal(siteInputToIso("not a date"), "not a date");
});

test("the edit form shows Amsterdam time, and saving it unchanged keeps the instant", () => {
  for (const stored of [
    "2026-08-22T17:30:00.000Z", // as imported
    "2026-08-22T17:30", // imported, then saved through the old form
    new Date("2026-08-22T17:30:00.000Z"), // unquoted YAML timestamp
  ]) {
    const shown = toSiteInputValue(stored);
    assert.equal(shown, "2026-08-22T19:30");
    assert.equal(siteInputToIso(shown), "2026-08-22T17:30:00.000Z");
  }
  assert.equal(toSiteInputValue(undefined), "");
  assert.equal(toSiteInputValue("garbage"), "");
});

test("startOfToday is Amsterdam midnight, also just after it", () => {
  // 00:30 on 17 Sep in Amsterdam is still 16 Sep in UTC.
  assert.equal(startOfToday(new Date("2026-09-16T22:30:00Z")).toISOString(), "2026-09-16T22:00:00.000Z");
  assert.equal(startOfToday(new Date("2026-12-11T23:30:00Z")).toISOString(), "2026-12-11T23:00:00.000Z");
});

test("adding weeks keeps the local time across the October DST change", () => {
  const highMass = new Date("2026-10-24T17:30:00.000Z"); // Sat 19:30 CEST
  const next = addDays(highMass, 7);
  assert.equal(next.toISOString(), "2026-10-31T18:30:00.000Z");
  assert.equal(formatTime(next), "19:30");
});

test("adding months keeps the local time and overflows like setMonth", () => {
  assert.equal(formatTime(addMonths(new Date("2026-09-09T17:30:00Z"), 2)), "19:30");
  const jan31 = siteWallTime(2026, 1, 31, 10);
  assert.equal(addMonths(jan31, 1).toISOString(), siteWallTime(2026, 3, 3, 10).toISOString());
});

// ── Time ranges (event-date-end-times D1) ───────────────────────────────────
// Built in Amsterdam wall time, so these hold under `TZ=UTC` too.

test("a same-evening occurrence shows its start and end", () => {
  assert.equal(
    formatTimeRange(siteWallTime(2026, 10, 3, 19, 30), siteWallTime(2026, 10, 3, 20, 30)),
    "19:30–20:30",
  );
});

test("an occurrence without an end, or with a zero duration, shows its start alone", () => {
  const start = siteWallTime(2026, 10, 3, 19, 30);
  assert.equal(formatTimeRange(start), "19:30");
  assert.equal(formatTimeRange(start, undefined), "19:30");
  assert.equal(formatTimeRange(start, start), "19:30");
});

test("an occurrence of a day or more shows its start alone", () => {
  const start = siteWallTime(2026, 10, 3, 0, 0);
  assert.equal(formatTimeRange(start, siteWallTime(2026, 10, 4, 0, 0)), "00:00");
  assert.equal(formatTimeRange(start, siteWallTime(2026, 10, 5, 17, 0)), "00:00");
});

test("an occurrence running past midnight still shows its range", () => {
  assert.equal(
    formatTimeRange(siteWallTime(2026, 10, 3, 22, 0), siteWallTime(2026, 10, 4, 1, 0)),
    "22:00–01:00",
  );
});

test("a range across the change to winter time reads in wall time", () => {
  // Clocks go back at 03:00 on 25 Oct 2026: 01:30–04:30 wall time is four real hours.
  assert.equal(
    formatTimeRange(siteWallTime(2026, 10, 25, 1, 30), siteWallTime(2026, 10, 25, 4, 30)),
    "01:30–04:30",
  );
});

// ── The two halves of a recurrence's listing label (D4) ────────────────────

test("the weekday formatter names the Amsterdam weekday", () => {
  assert.equal(formatWeekdayShort(siteWallTime(2026, 10, 16, 16, 30)), "vr");
  // Just before midnight Amsterdam is already the next day in UTC+2 terms, so
  // a UTC-based formatter would name the wrong weekday here.
  assert.equal(formatWeekdayShort(siteWallTime(2026, 10, 16, 23, 30)), "vr");
});

test("the day-month formatter drops the weekday and the year", () => {
  assert.equal(formatDayMonth(siteWallTime(2026, 10, 16, 16, 30)), "16 okt");
  assert.equal(formatDayMonth(siteWallTime(2027, 1, 1)), "1 jan");
  // Midnight on the day itself, not the evening before, whatever TZ is set.
  assert.equal(formatDayMonth(siteWallTime(2026, 10, 16)), "16 okt");
});
