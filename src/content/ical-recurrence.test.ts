import test from "node:test";
import assert from "node:assert/strict";
import ical from "node-ical";
import { mapRecurrence, freqName } from "./ical-recurrence";

/**
 * node-ical 0.26.x exposes `rrule.options.freq` as a STRING via its
 * RRuleCompatWrapper. The mapping must read that, not the numeric rrule constant
 * an older version used — the numeric-only check matched nothing and imported
 * every recurrence as a one-off. These tests parse real node-ical output so a
 * future shape change is caught.
 */

type RRuleArg = Parameters<typeof mapRecurrence>[0];

function rruleOf(rule: string): RRuleArg {
  const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//t//EN\r\nBEGIN:VEVENT\r\nUID:x\r\nDTSTART:20240103T180000Z\r\n${rule}\r\nEND:VEVENT\r\nEND:VCALENDAR`;
  const parsed = ical.parseICS(ics) as Record<
    string,
    { type?: string; rrule?: RRuleArg }
  >;
  const item = Object.values(parsed).find((r) => r.type === "VEVENT");
  return item?.rrule;
}

test("freqName accepts node-ical's string freq and legacy numeric freq", () => {
  assert.equal(freqName("WEEKLY"), "WEEKLY");
  assert.equal(freqName("weekly"), "WEEKLY");
  assert.equal(freqName(2), "WEEKLY"); // legacy rrule numeric constant
  assert.equal(freqName(1), "MONTHLY");
  assert.equal(freqName(undefined), "");
});

test("maps a real WEEKLY RRULE to a weekly recurrence", () => {
  const rec = mapRecurrence(rruleOf("RRULE:FREQ=WEEKLY;INTERVAL=2"));
  assert.deepEqual(rec, { freq: "weekly", interval: 2, until: undefined });
});

test("maps a real MONTHLY RRULE and preserves UNTIL", () => {
  const rec = mapRecurrence(rruleOf("RRULE:FREQ=MONTHLY;UNTIL=20270101T000000Z"));
  assert.equal(rec?.freq, "monthly");
  assert.equal(rec?.interval, 1);
  assert.ok(rec?.until instanceof Date);
});

test("leaves a DAILY RRULE unmapped (not expandable in v1)", () => {
  assert.equal(mapRecurrence(rruleOf("RRULE:FREQ=DAILY")), undefined);
});

test("no RRULE maps to undefined", () => {
  assert.equal(mapRecurrence(undefined), undefined);
  assert.equal(mapRecurrence({}), undefined);
});
