import test from "node:test";
import assert from "node:assert/strict";
import { absolute, eventJsonLd } from "./structured-data";
import { presentOccurrence } from "@/content/event-presentation";
import { siteWallTime, startOfToday } from "./date";
import type { CalendarEvent } from "@/content/types";

/**
 * An event page's structured data describes the occurrence the page presents,
 * with that occurrence's own end (event-multiple-dates D4, events spec
 * "Structured data matches the occurrence shown").
 */

const oct = (d: number, h = 20) => siteWallTime(2026, 10, d, h, 0);

const event = (over: Partial<CalendarEvent>): CalendarEvent => ({
  slug: "concertserie",
  title: "Concertserie",
  start: oct(3),
  end: oct(3, 22),
  venue: null,
  organisers: [],
  status: "published",
  body: "",
  href: "/agenda/concertserie",
  ...over,
});

test("a later date reports its own end, not the first date's", () => {
  const e = event({ dates: [oct(17)] });
  const shown = presentOccurrence(e, startOfToday(oct(10)));
  const ld = eventJsonLd(e, shown);
  assert.equal(ld.startDate, oct(17).toISOString());
  assert.equal(ld.endDate, oct(17, 22).toISOString());
});

test("a later weekly occurrence reports its own end", () => {
  const e = event({ recurrence: { freq: "weekly", interval: 1 } });
  const ld = eventJsonLd(e, presentOccurrence(e, startOfToday(oct(5))));
  assert.equal(ld.startDate, oct(10).toISOString());
  assert.equal(ld.endDate, oct(10, 22).toISOString());
});

test("an event without an end publishes no end", () => {
  const e = event({ end: undefined });
  assert.ok(!("endDate" in eventJsonLd(e, presentOccurrence(e, startOfToday(oct(1))))));
});

const organiser = (slug: string, name: string) => ({
  slug,
  name,
  status: "published" as const,
  body: "",
  href: `/organisatoren/${slug}`,
});

test("an event without organisers names no organizer", () => {
  const e = event({});
  assert.ok(!("organizer" in eventJsonLd(e, presentOccurrence(e, startOfToday(oct(1))))));
});

test("an event with one organiser names it as a single organizer", () => {
  const e = event({ organisers: [organiser("koor", "Celebrations Koor")] });
  const ld = eventJsonLd(e, presentOccurrence(e, startOfToday(oct(1))));
  assert.deepEqual(ld.organizer, {
    "@type": "Organization",
    name: "Celebrations Koor",
    url: absolute("/organisatoren/koor"),
  });
});

test("an event with several organisers names every one of them", () => {
  const e = event({ organisers: [organiser("tuin", "Buurttuin"), organiser("koor", "Celebrations Koor")] });
  const ld = eventJsonLd(e, presentOccurrence(e, startOfToday(oct(1))));
  assert.ok(Array.isArray(ld.organizer));
  assert.deepEqual(
    (ld.organizer as { name: string }[]).map((o) => o.name),
    ["Buurttuin", "Celebrations Koor"],
  );
});
