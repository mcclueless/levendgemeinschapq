import test from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  addMonths,
  formatTime,
  parseSiteDateTime,
  siteWallTime,
  startOfToday,
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

test("a form-entered wall time is read as site time", () => {
  const d = parseSiteDateTime("2026-09-25T19:30") as Date;
  assert.equal(d.toISOString(), "2026-09-25T17:30:00.000Z");
  assert.equal(formatTime(d), "19:30");
  assert.equal((parseSiteDateTime("2026-09-25T19:30:15") as Date).toISOString(), "2026-09-25T17:30:15.000Z");
});

test("values with an offset, Z, or already a Date are unchanged", () => {
  assert.equal((parseSiteDateTime("2026-09-25T19:30:00.000Z") as Date).toISOString(), "2026-09-25T19:30:00.000Z");
  assert.equal((parseSiteDateTime("2026-06-20T17:00:00+02:00") as Date).toISOString(), "2026-06-20T15:00:00.000Z");
  const date = new Date("2026-01-01T10:00:00Z");
  assert.equal(parseSiteDateTime(date), date);
  assert.equal(parseSiteDateTime(undefined), undefined);
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
