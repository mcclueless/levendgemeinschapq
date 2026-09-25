import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_EVENT_DATES,
  allDates,
  normaliseDates,
  occurrenceEnd,
  occurrenceHref,
  occurrenceLink,
  parseDayParam,
  readStoredDates,
  siteDayKey,
} from "./event-dates";
import { EventFrontmatter } from "./schema";
import { formatTime, siteWallTime } from "@/lib/date";

/**
 * An event's further dates (event-multiple-dates D1). Every assertion is in
 * Amsterdam wall time, so the suite means the same under `TZ=UTC`.
 */

const at = (d: number, h = 20, mo = 10) => siteWallTime(2026, mo, d, h, 0);
const iso = (d: Date) => d.toISOString();

test("sorts, drops duplicates, and drops a date equal to the start", () => {
  const start = at(3);
  const out = normaliseDates([iso(at(17)), iso(at(8, 20, 11)), iso(at(17)), iso(start)], start);
  assert.deepEqual(out, [at(17), at(8, 20, 11)]);
});

test("drops unreadable values instead of failing", () => {
  assert.deepEqual(normaliseDates(["morgen", "", iso(at(17)), 42 as never]), [at(17)]);
});

test("caps the list", () => {
  const many = Array.from({ length: MAX_EVENT_DATES + 10 }, (_, i) => iso(at(1 + (i % 28), 10 + Math.floor(i / 28))));
  assert.equal(normaliseDates(many)!.length, MAX_EVENT_DATES);
});

test("an empty or absent list normalises to nothing", () => {
  assert.equal(normaliseDates(undefined), undefined);
  assert.equal(normaliseDates([]), undefined);
  assert.equal(normaliseDates(["x"]), undefined);
  assert.equal(normaliseDates([iso(at(3))], at(3)), undefined);
});

test("an offset-less stored date is read as UTC, like start", () => {
  // Same rule as parseStoredDateTime: "2026-10-17T18:00" is 20:00 in Amsterdam.
  const [d] = readStoredDates(["2026-10-17T18:00"])!;
  assert.equal(formatTime(d), "20:00");
});

test("the schema reads dates as site time and survives a bad entry", () => {
  const fm = EventFrontmatter.parse({
    title: "Concertserie",
    start: iso(at(3)),
    dates: [iso(at(17)), "geen datum"],
  });
  assert.deepEqual(fm.dates, [at(17)]);
  assert.equal(formatTime(fm.dates![0]), "20:00");
  assert.equal(EventFrontmatter.parse({ title: "x", start: iso(at(3)) }).dates, undefined);
});

test("allDates puts the start among the further dates", () => {
  assert.deepEqual(allDates(at(17), [at(3), at(8, 20, 11)]), [at(3), at(17), at(8, 20, 11)]);
  assert.deepEqual(allDates(at(3), undefined), [at(3)]);
});

test("each occurrence lasts as long as the first", () => {
  const event = { start: at(3, 20), end: at(3, 22) };
  assert.equal(formatTime(occurrenceEnd(event, at(17, 20))!), "22:00");
  assert.equal(occurrenceEnd({ start: at(3) }, at(17)), undefined);
  assert.equal(occurrenceEnd({ start: at(3, 20), end: at(3, 19) }, at(17)), undefined);
});

test("a day key names the Amsterdam day, not the UTC one", () => {
  // 00:30 on 18 Oct in Amsterdam is still 17 Oct in UTC.
  assert.equal(siteDayKey(siteWallTime(2026, 10, 18, 0, 30)), "2026-10-18");
  assert.equal(occurrenceHref("/agenda/x", at(17)), "/agenda/x?datum=2026-10-17");
});

test("a day parameter is a real calendar date or nothing", () => {
  const day = parseDayParam("2026-10-17")!;
  assert.deepEqual(day.from, siteWallTime(2026, 10, 17));
  assert.deepEqual(day.until, siteWallTime(2026, 10, 18));
  for (const bad of ["2026-02-31", "17-10-2026", "2026-10-17T20:00", "", undefined, ["2026-10-17"]]) {
    assert.equal(parseDayParam(bad), null, String(bad));
  }
});

test("a listing row links to its own date only when the event has several", () => {
  const href = "/agenda/x";
  assert.equal(occurrenceLink({ href }, at(17)), href);
  assert.equal(occurrenceLink({ href, dates: [] }, at(17)), href);
  assert.equal(occurrenceLink({ href, dates: [at(17)] }, at(17)), `${href}?datum=2026-10-17`);
  assert.equal(
    occurrenceLink({ href, recurrence: { freq: "weekly" } }, at(17)),
    `${href}?datum=2026-10-17`,
  );
});
