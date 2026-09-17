import test from "node:test";
import assert from "node:assert/strict";
import {
  pointsAt,
  referrerKindsOf,
  rewriteReferences,
  type ReferrerKind,
} from "./references";

/**
 * The permalink rename rewrites exactly the fields this table names, and the
 * hide/delete guards look at the same ones. A missed field is a silent orphan:
 * the repository drops unresolved references without an error.
 */

const venueCases: Array<[ReferrerKind, Record<string, unknown>, string]> = [
  ["event", { title: "Repair Café", venue: "oud", organiser: "stichting" }, "venue"],
  ["project", { title: "Tuin", venue: "oud", organisers: ["a"] }, "venue"],
  ["blog", { title: "Post", relatedVenues: ["x", "oud"], relatedOrganisers: [] }, "relatedVenues"],
  ["organiser", { name: "Club", location: "oud" }, "location"],
  ["feed", { label: "Agenda", defaultVenue: "oud", defaultOrganiser: "a" }, "defaultVenue"],
];

for (const [kind, fm, field] of venueCases) {
  test(`venue rename rewrites ${kind}.${field}`, () => {
    const out = rewriteReferences(fm, kind, "venue", "oud", "nieuw");
    assert.ok(out, "expected a rewrite");
    const value = out[field];
    if (Array.isArray(value)) assert.ok(value.includes("nieuw") && !value.includes("oud"));
    else assert.equal(value, "nieuw");
    // Nothing else changes.
    for (const k of Object.keys(fm)) if (k !== field) assert.deepEqual(out[k], fm[k]);
  });
}

const organiserCases: Array<[ReferrerKind, Record<string, unknown>, string]> = [
  ["event", { title: "Borrel", venue: "plein", organiser: "oud" }, "organiser"],
  ["project", { title: "Tuin", venue: "plein", organisers: ["oud"] }, "organisers"],
  ["blog", { title: "Post", relatedVenues: [], relatedOrganisers: ["oud"] }, "relatedOrganisers"],
  ["feed", { label: "Agenda", defaultVenue: "plein", defaultOrganiser: "oud" }, "defaultOrganiser"],
];

for (const [kind, fm, field] of organiserCases) {
  test(`organiser rename rewrites ${kind}.${field}`, () => {
    const out = rewriteReferences(fm, kind, "organiser", "oud", "nieuw");
    assert.ok(out, "expected a rewrite");
    const value = out[field];
    if (Array.isArray(value)) assert.deepEqual(value, ["nieuw"]);
    else assert.equal(value, "nieuw");
    for (const k of Object.keys(fm)) if (k !== field) assert.deepEqual(out[k], fm[k]);
  });
}

test("array references keep their order and other entries", () => {
  const out = rewriteReferences(
    { organisers: ["eerste", "oud", "laatste"] },
    "project",
    "organiser",
    "oud",
    "nieuw",
  );
  assert.deepEqual(out?.organisers, ["eerste", "nieuw", "laatste"]);
});

test("slug text in a title or excerpt is not a reference", () => {
  const fm = { title: "oud", excerpt: "Bij oud", venue: "elders", organiser: "oud-club" };
  assert.equal(rewriteReferences(fm, "event", "venue", "oud", "nieuw"), null);
  assert.equal(rewriteReferences(fm, "event", "organiser", "oud", "nieuw"), null);
});

test("an organiser's location is not an organiser reference", () => {
  assert.equal(
    rewriteReferences({ name: "oud", location: "oud" }, "organiser", "organiser", "oud", "nieuw"),
    null,
  );
});

test("an already-rewritten document yields null, so a retry is a no-op", () => {
  const once = rewriteReferences({ venue: "oud" }, "event", "venue", "oud", "nieuw")!;
  assert.equal(rewriteReferences(once, "event", "venue", "oud", "nieuw"), null);
});

test("pointsAt and referrerKindsOf agree with the table", () => {
  assert.equal(pointsAt({ relatedVenues: ["a", "b"] }, "blog", "venue", "b"), true);
  assert.equal(pointsAt({ relatedVenues: undefined }, "blog", "venue", "b"), false);
  assert.deepEqual(referrerKindsOf("venue"), ["event", "project", "blog", "organiser", "feed"]);
  assert.deepEqual(referrerKindsOf("organiser"), ["event", "project", "blog", "feed"]);
});
