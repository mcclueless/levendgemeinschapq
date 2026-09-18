import test from "node:test";
import assert from "node:assert/strict";
import { listingHref, parseListingState } from "./listing-view";

/**
 * The listing's view and count come straight from the URL, so anything a visitor
 * can type must fall back to the defaults rather than break the page.
 */

test("no parameters means cards and the initial count", () => {
  assert.deepEqual(parseListingState({}, 6), { view: "kaarten", count: 6 });
});

test("valid parameters are read", () => {
  assert.deepEqual(parseListingState({ weergave: "tabel", aantal: "18" }, 6), {
    view: "tabel",
    count: 18,
  });
});

test("an unknown view falls back to cards", () => {
  for (const weergave of ["TABEL", "lijst", "", "tabel "]) {
    assert.equal(parseListingState({ weergave }, 6).view, "kaarten");
  }
});

test("an invalid count falls back to the initial count", () => {
  for (const aantal of ["0", "-6", "1.5", "abc", "", "6e2", " 12"]) {
    assert.equal(parseListingState({ aantal }, 12).count, 12, `aantal=${aantal}`);
  }
});

test("a huge count is clamped", () => {
  assert.equal(parseListingState({ aantal: "999999" }, 6).count, 500);
});

test("repeated parameters use the first value", () => {
  assert.deepEqual(parseListingState({ weergave: ["tabel", "kaarten"], aantal: ["12", "99"] }, 6), {
    view: "tabel",
    count: 12,
  });
});

test("hrefs leave out defaults and land on the listing", () => {
  assert.equal(listingHref("/", { view: "kaarten", count: 6 }, 6), "/#evenementen");
  assert.equal(listingHref("/agenda", { view: "tabel", count: 12 }, 12), "/agenda?weergave=tabel#evenementen");
  assert.equal(listingHref("/", { view: "kaarten", count: 12 }, 6), "/?aantal=12#evenementen");
  assert.equal(listingHref("/", { view: "tabel", count: 12 }, 6), "/?weergave=tabel&aantal=12#evenementen");
});

test("an href round-trips through parsing", () => {
  const state = { view: "tabel" as const, count: 24 };
  const href = listingHref("/agenda", state, 12);
  const params = Object.fromEntries(new URL(href, "https://x").searchParams);
  assert.deepEqual(parseListingState(params, 12), state);
});
