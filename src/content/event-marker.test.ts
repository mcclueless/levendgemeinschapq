import test from "node:test";
import assert from "node:assert/strict";
import { EventFrontmatter } from "./schema";
import { markerDayInput } from "./event-form";
import { siteInputToIso, siteWallTime } from "@/lib/date";

/** Agenda markers: events without a page (event-no-page). */

const base = { title: "Begin van de lente", start: "2027-03-20T00:00" };

test("an event without the flag is not a marker", () => {
  assert.equal(EventFrontmatter.parse(base).noPage, undefined);
});

test("an event with the flag is a marker", () => {
  assert.equal(EventFrontmatter.parse({ ...base, noPage: true }).noPage, true);
});

test("a typed time is dropped: a marker starts at the start of its day", () => {
  assert.equal(markerDayInput("2027-03-20T14:30"), "2027-03-20T00:00");
});

test("a date-only value becomes the start of that day", () => {
  assert.equal(markerDayInput("2027-03-20"), "2027-03-20T00:00");
});

test("the start of the summer-time switch day is local midnight", () => {
  // Clocks go forward at 02:00 on 28 March 2027; midnight is still +01:00.
  assert.equal(
    siteInputToIso(markerDayInput("2027-03-28")),
    siteWallTime(2027, 3, 28).toISOString(),
  );
  assert.equal(siteInputToIso(markerDayInput("2027-03-28")), "2027-03-27T23:00:00.000Z");
});

test("an unreadable or empty value passes through for the normal check", () => {
  assert.equal(markerDayInput("morgen"), "morgen");
  assert.equal(markerDayInput(undefined), undefined);
});
