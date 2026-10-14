import test from "node:test";
import assert from "node:assert/strict";
import type { Session } from "@/lib/auth";
import { canManage, canView, organisersFor, savedByLabel } from "./access";

/** The backend's one scope rule (organisation-accounts D5). */

const admin: Session = { role: "admin" };
const noord: Session = { role: "organisation", sub: "a".repeat(32), org: "stichting-noord", pv: 0 };

const owned = { slug: "repair-cafe", organiser: "stichting-noord", moreOrganisers: ["wijkraad"] };
const coOrganised = { slug: "buurtborrel", organiser: "wijkraad", moreOrganisers: ["stichting-noord"] };
const foreign = { slug: "lezing", organiser: "wijkraad" };
const orphan = { slug: "feest" };

test("the administrator may manage anything", () => {
  for (const item of [owned, coOrganised, foreign, orphan]) {
    assert.equal(canManage(admin, "event", item), true);
  }
  assert.equal(canManage(admin, "organiser", { slug: "wijkraad" }), true);
  assert.equal(canManage(admin, "venue", { slug: "buurthuis" }), true);
  assert.equal(canManage(admin, "project", { slug: "moestuin" }), true);
});

test("an organisation manages the events it is the primary organiser of", () => {
  assert.equal(canManage(noord, "event", owned), true);
  assert.equal(canManage(noord, "event", coOrganised), false);
  assert.equal(canManage(noord, "event", foreign), false);
  assert.equal(canManage(noord, "event", orphan), false);
});

test("an organisation sees a co-organised event but not a foreign one", () => {
  assert.equal(canView(noord, "event", owned), true);
  assert.equal(canView(noord, "event", coOrganised), true);
  assert.equal(canView(noord, "event", foreign), false);
  assert.equal(canView(noord, "event", orphan), false);
});

test("an organisation manages its own page and nothing else", () => {
  assert.equal(canManage(noord, "organiser", { slug: "stichting-noord" }), true);
  assert.equal(canManage(noord, "organiser", { slug: "wijkraad" }), false);
  assert.equal(canView(noord, "organiser", { slug: "wijkraad" }), false);
  for (const type of ["venue", "blog", "project"] as const) {
    assert.equal(canManage(noord, type, { slug: "x", organiser: "stichting-noord" }), false);
    assert.equal(canView(noord, type, { slug: "x", organiser: "stichting-noord" }), false);
  }
});

test("no session may do nothing", () => {
  assert.equal(canManage(null, "event", owned), false);
  assert.equal(canView(null, "event", owned), false);
});

test("an organisation's form always stores its organisation first", () => {
  assert.deepEqual(organisersFor(noord, []), ["stichting-noord"]);
  assert.deepEqual(organisersFor(noord, ["wijkraad"]), ["stichting-noord", "wijkraad"]);
  assert.deepEqual(organisersFor(noord, ["wijkraad", "stichting-noord"]), ["stichting-noord", "wijkraad"]);
  assert.deepEqual(organisersFor(admin, ["wijkraad", "stichting-noord"]), ["wijkraad", "stichting-noord"]);
  assert.deepEqual(organisersFor(admin, []), []);
});

test("a save is recorded as the administrator or the account's email", () => {
  assert.equal(savedByLabel(admin), "beheerder");
  assert.equal(savedByLabel(noord, "info@noord.nl"), "info@noord.nl");
});
