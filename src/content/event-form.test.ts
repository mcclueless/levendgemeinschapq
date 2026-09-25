import test from "node:test";
import assert from "node:assert/strict";
import { DATES_FIELD, datesFromForm } from "./event-form";
import { MAX_EVENT_DATES } from "./event-dates";
import { formatTime, siteWallTime } from "@/lib/date";

/**
 * The admin form's date list (event-multiple-dates D7; editorial-backend
 * "Managing an event's dates"). Values are typed Amsterdam wall time, so the
 * expectations hold under `TZ=UTC` too.
 */

const form = (...dates: string[]) => {
  const f = new FormData();
  for (const d of dates) f.append(DATES_FIELD, d);
  return f;
};
const START = siteWallTime(2026, 10, 3, 20, 0).toISOString();

test("stores typed wall times as ISO, sorted, without duplicates or the start", () => {
  const r = datesFromForm(
    form("2026-11-08T20:00", "2026-10-17T20:00", "", "2026-10-17T20:00", "2026-10-03T20:00"),
    START,
    false,
  );
  assert.ok(r.ok);
  assert.deepEqual(r.dates, [
    siteWallTime(2026, 10, 17, 20, 0).toISOString(),
    siteWallTime(2026, 11, 8, 20, 0).toISOString(),
  ]);
  assert.equal(formatTime(new Date(r.dates![0])), "20:00");
});

test("no dates, or only empty rows, means no list", () => {
  assert.deepEqual(datesFromForm(form(), START, false), { ok: true, dates: undefined });
  assert.deepEqual(datesFromForm(form("", " "), START, true), { ok: true, dates: undefined });
  // A list holding only the start collapses to nothing.
  assert.deepEqual(datesFromForm(form("2026-10-03T20:00"), START, false), {
    ok: true,
    dates: undefined,
  });
});

test("an unreadable date is refused, not dropped", () => {
  for (const bad of ["morgen", "2026-10-17", "2026-10-17T25:00", "2026-02-31T20:00", "2026-10-17T20:00Z"]) {
    assert.deepEqual(datesFromForm(form("2026-10-17T20:00", bad), START, false), {
      ok: false,
      reason: "dates-invalid",
    }, bad);
  }
});

test("more dates than permitted are refused", () => {
  const many = Array.from(
    { length: MAX_EVENT_DATES + 1 },
    (_, i) => `2027-01-${String(i + 1).padStart(2, "0")}T20:00`,
  );
  assert.deepEqual(datesFromForm(form(...many), START, false), {
    ok: false,
    reason: "dates-too-many",
  });
  // Exactly the limit is fine, and duplicates do not count against it.
  const r = datesFromForm(form(...many.slice(0, MAX_EVENT_DATES), many[0]), START, false);
  assert.ok(r.ok && r.dates!.length === MAX_EVENT_DATES);
});

test("dates alongside a recurrence are refused", () => {
  assert.deepEqual(datesFromForm(form("2026-10-17T20:00"), START, true), {
    ok: false,
    reason: "recurrence-and-dates",
  });
});
