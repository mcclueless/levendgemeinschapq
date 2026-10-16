import test from "node:test";
import assert from "node:assert/strict";
import {
  ADMIN_CHOICES,
  PUBLIC_CHOICES,
  choiceFor,
  recurrenceFromForm,
} from "./recurrence-form";

/** The Herhaling select's choices and what they store (recurrence-biweekly D2, D3). */

const start = new Date(2026, 10, 6, 19, 0);

function form(recurrence?: string, until = "2027-03-31"): FormData {
  const f = new FormData();
  if (recurrence !== undefined) f.set("recurrence", recurrence);
  if (until) f.set("recurrenceUntil", until);
  return f;
}

function rule(result: ReturnType<typeof recurrenceFromForm>) {
  assert.ok(result.ok);
  const r = result.ok ? result.recurrence : undefined;
  return r ? { freq: r.freq, interval: r.interval } : undefined;
}

test("every two weeks is stored as weekly with interval 2", () => {
  assert.deepEqual(rule(recurrenceFromForm(form("biweekly"), start, ADMIN_CHOICES)), {
    freq: "weekly",
    interval: 2,
  });
});

test("an explicit choice replaces the stored interval", () => {
  const stored = { freq: "weekly" as const, interval: 2 };
  assert.deepEqual(rule(recurrenceFromForm(form("weekly"), start, ADMIN_CHOICES, stored)), {
    freq: "weekly",
    interval: 1,
  });
  assert.deepEqual(rule(recurrenceFromForm(form("monthly"), start, ADMIN_CHOICES, stored)), {
    freq: "monthly",
    interval: 1,
  });
});

test("the stored choice keeps a rhythm no choice expresses, with the posted end date", () => {
  const stored = { freq: "weekly" as const, interval: 3 };
  const result = recurrenceFromForm(form("stored", "2027-01-15"), start, ADMIN_CHOICES, stored);
  assert.deepEqual(rule(result), { freq: "weekly", interval: 3 });
  assert.ok(result.ok && result.recurrence?.until);
  assert.equal(result.ok ? result.recurrence?.until?.getFullYear() : 0, 2027);
  // A stored recurrence without an interval means every one.
  assert.deepEqual(
    rule(recurrenceFromForm(form("stored"), start, ADMIN_CHOICES, { freq: "monthly" })),
    { freq: "monthly", interval: 1 },
  );
});

test("the stored choice means nothing without a stored recurrence", () => {
  assert.equal(rule(recurrenceFromForm(form("stored"), start, ADMIN_CHOICES)), undefined);
  assert.equal(rule(recurrenceFromForm(form("stored"), start, PUBLIC_CHOICES)), undefined);
});

test("the public form drops choices it does not offer, and still takes weekly", () => {
  assert.equal(rule(recurrenceFromForm(form("biweekly"), start, PUBLIC_CHOICES)), undefined);
  assert.equal(rule(recurrenceFromForm(form("monthly"), start, PUBLIC_CHOICES)), undefined);
  assert.deepEqual(rule(recurrenceFromForm(form("weekly"), start, PUBLIC_CHOICES)), {
    freq: "weekly",
    interval: 1,
  });
});

test("none, an unknown value and no field all mean no recurrence", () => {
  assert.equal(rule(recurrenceFromForm(form("none"), start, ADMIN_CHOICES)), undefined);
  assert.equal(rule(recurrenceFromForm(form("daily"), start, ADMIN_CHOICES)), undefined);
  assert.equal(rule(recurrenceFromForm(form(), start, ADMIN_CHOICES)), undefined);
});

test("a repeating choice still requires an end date, and one before the start is refused", () => {
  const missing = recurrenceFromForm(form("biweekly", ""), start, ADMIN_CHOICES);
  assert.deepEqual(missing, { ok: false, reason: "recurrence-missing" });
  const early = recurrenceFromForm(form("biweekly", "2026-01-01"), start, ADMIN_CHOICES);
  assert.deepEqual(early, { ok: false, reason: "recurrence-range" });
});

test("choiceFor maps the offered rhythms and nothing else", () => {
  assert.equal(choiceFor({ freq: "weekly", interval: 1 }), "weekly");
  assert.equal(choiceFor({ freq: "weekly" }), "weekly");
  assert.equal(choiceFor({ freq: "weekly", interval: 2 }), "biweekly");
  assert.equal(choiceFor({ freq: "monthly", interval: 1 }), "monthly");
  assert.equal(choiceFor({ freq: "weekly", interval: 3 }), undefined);
  assert.equal(choiceFor({ freq: "monthly", interval: 2 }), undefined);
  assert.equal(choiceFor(undefined), undefined);
});
