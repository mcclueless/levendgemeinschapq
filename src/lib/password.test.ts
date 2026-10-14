import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, isAcceptablePassword, verifyPassword } from "./password";

/** scrypt hashes for organisation accounts (organisation-accounts D2). */

test("a password verifies against its own hash and nothing else", async () => {
  const stored = await hashPassword("correct horse battery");
  assert.ok(stored.startsWith("scrypt$32768$8$1$"));
  assert.equal(await verifyPassword("correct horse battery", stored), true);
  assert.equal(await verifyPassword("correct horse batter", stored), false);
  assert.equal(await verifyPassword("", stored), false);
});

test("two hashes of one password differ by their salt", async () => {
  const a = await hashPassword("correct horse battery");
  const b = await hashPassword("correct horse battery");
  assert.notEqual(a, b);
  assert.equal(await verifyPassword("correct horse battery", b), true);
});

test("a tampered or malformed stored value never verifies", async () => {
  const stored = await hashPassword("correct horse battery");
  const parts = stored.split("$");
  parts[5] = parts[5].replace(/^./, (c) => (c === "A" ? "B" : "A"));
  assert.equal(await verifyPassword("correct horse battery", parts.join("$")), false);
  assert.equal(await verifyPassword("correct horse battery", "bcrypt$nope"), false);
  assert.equal(await verifyPassword("correct horse battery", ""), false);
  assert.equal(await verifyPassword("correct horse battery", "scrypt$32768$8$1$$"), false);
});

test("the minimum length is twelve characters", () => {
  assert.equal(isAcceptablePassword("elevenchars"), false);
  assert.equal(isAcceptablePassword("twelve chars"), true);
});
