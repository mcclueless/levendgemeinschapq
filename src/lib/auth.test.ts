import test from "node:test";
import assert from "node:assert/strict";
import { SignJWT } from "jose";
import { createSessionToken, verifySessionToken } from "./auth";

/** Session tokens for both roles (organisation-accounts D3). */

const org = { role: "organisation" as const, sub: "a".repeat(32), org: "stichting-noord", pv: 1760000000 };

test("an admin token round-trips", async () => {
  assert.deepEqual(await verifySessionToken(await createSessionToken()), { role: "admin" });
  assert.deepEqual(await verifySessionToken(await createSessionToken({ role: "admin" })), { role: "admin" });
});

test("an organisation token round-trips with its account, organisation and password moment", async () => {
  assert.deepEqual(await verifySessionToken(await createSessionToken(org)), org);
});

test("a missing, tampered or foreign token is no session", async () => {
  assert.equal(await verifySessionToken(undefined), null);
  assert.equal(await verifySessionToken(""), null);
  const token = await createSessionToken(org);
  assert.equal(await verifySessionToken(token.slice(0, -2) + "xx"), null);
  const foreign = await new SignJWT({ role: "organisation", org: "x" })
    .setProtectedHeader({ alg: "HS256" })
    .sign(new TextEncoder().encode("dev-only-insecure-secret-change-me"));
  // Right secret, wrong shape: no account id, no password moment.
  assert.equal(await verifySessionToken(foreign), null);
  const other = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .sign(new TextEncoder().encode("some-other-secret"));
  assert.equal(await verifySessionToken(other), null);
});
