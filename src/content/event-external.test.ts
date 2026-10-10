import test from "node:test";
import assert from "node:assert/strict";
import { EventFrontmatter } from "./schema";
import { eventMode, externalHost, externalLink, hasOwnPage } from "./event-mode";
import { occurrenceLink } from "./event-dates";
import { siteWallTime } from "@/lib/date";

/** Events that lead to an external page (event-external-link). */

const base = { title: "Repair Café", start: "2027-03-20T19:00" };
const url = "https://www.buurttuin.nl/agenda/repair-cafe";

// ── The stored field (D1) ───────────────────────────────────────────────────

test("an event without the field still parses, as every stored one does", () => {
  assert.equal(EventFrontmatter.parse(base).externalUrl, undefined);
});

test("an http or https address is stored as given", () => {
  assert.equal(EventFrontmatter.parse({ ...base, externalUrl: url }).externalUrl, url);
  assert.equal(
    EventFrontmatter.parse({ ...base, externalUrl: "http://buurttuin.nl" }).externalUrl,
    "http://buurttuin.nl",
  );
});

test("anything that is not a web address is refused", () => {
  // The value goes straight into an `href`, so the scheme is what matters —
  // `z.string().url()` alone accepts `javascript:`.
  for (const bad of [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "/agenda/repair-cafe",
    "buurttuin.nl/agenda",
    "mailto:info@buurttuin.nl",
    "",
  ]) {
    assert.equal(
      EventFrontmatter.safeParse({ ...base, externalUrl: bad }).success,
      false,
      bad,
    );
  }
});

// ── The derived mode (D1, D2) ───────────────────────────────────────────────

test("the mode follows from the two fields", () => {
  assert.equal(eventMode({}), "page");
  assert.equal(eventMode({ externalUrl: url }), "external");
  assert.equal(eventMode({ noPage: true }), "marker");
});

test("a file carrying both counts as a marker, the more restrictive mode", () => {
  // Nothing writes both; a hand-edited file must not produce an outbound link.
  assert.equal(eventMode({ noPage: true, externalUrl: url }), "marker");
  assert.equal(externalLink({ noPage: true, externalUrl: url }), undefined);
});

test("only an ordinary event has a page here", () => {
  assert.equal(hasOwnPage({}), true);
  assert.equal(hasOwnPage({ externalUrl: url }), false);
  assert.equal(hasOwnPage({ noPage: true }), false);
});

// ── The screen-reader name of the site (D3) ─────────────────────────────────

test("the host names the site without its www", () => {
  assert.equal(externalHost(url), "buurttuin.nl");
  assert.equal(externalHost("https://buurttuin.nl/agenda"), "buurttuin.nl");
  assert.equal(externalHost("http://WWW.Buurttuin.NL"), "buurttuin.nl");
  // Only a leading "www." goes; a subdomain that merely contains it stays.
  assert.equal(externalHost("https://wwwtuin.nl"), "wwwtuin.nl");
  assert.equal(externalHost("https://agenda.www.buurttuin.nl"), "agenda.www.buurttuin.nl");
});

test("an unreadable address yields no name rather than throwing", () => {
  assert.equal(externalHost("niet-een-url"), undefined);
});

// ── The link each listing builds (D3) ──────────────────────────────────────

const START = siteWallTime(2027, 3, 20, 19, 0);

test("an external event links out, whatever its dates", () => {
  assert.equal(occurrenceLink({ href: "/agenda/repair-cafe", externalUrl: url }, START), url);
  assert.equal(
    occurrenceLink(
      { href: "/agenda/repair-cafe", externalUrl: url, dates: [siteWallTime(2027, 4, 17, 19, 0)] },
      START,
    ),
    url,
  );
});

test("an ordinary event and a marker link as before", () => {
  assert.equal(occurrenceLink({ href: "/agenda/repair-cafe" }, START), "/agenda/repair-cafe");
  assert.equal(
    occurrenceLink({ href: "/agenda/repair-cafe", dates: [siteWallTime(2027, 4, 17, 19, 0)] }, START),
    "/agenda/repair-cafe?datum=2027-03-20",
  );
  assert.equal(
    occurrenceLink({ href: "/agenda/lente", noPage: true }, START),
    "/agenda/lente",
  );
});
