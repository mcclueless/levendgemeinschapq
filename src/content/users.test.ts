import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createLocalStore, type ContentStore } from "./storage";
import {
  createUser,
  getUser,
  getUserByEmail,
  listUsers,
  moveUsersToOrganisation,
  setDisabled,
  setPassword,
} from "./users";

/** Organisation accounts in the content store (organisation-accounts D1). */

let root: string;
let store: ContentStore;
beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "users-"));
  store = createLocalStore(root);
});
afterEach(() => fs.rm(root, { recursive: true, force: true }));

const noord = { email: "Info@Noord.nl", name: "Stichting Noord", organisation: "stichting-noord", passwordHash: "scrypt$x" };

test("an account round-trips with a random id and a lower-cased email", async () => {
  const created = await createUser(noord, store, new Date("2026-10-14T10:00:00Z"));
  assert.ok(created.ok);
  const id = created.ok ? created.id : "";
  assert.match(id, /^[0-9a-f]{32}$/);
  const user = await getUser(id, store);
  assert.ok(user);
  assert.equal(user?.email, "info@noord.nl");
  assert.equal(user?.organisation, "stichting-noord");
  assert.equal(user?.disabled, false);
  assert.equal(user?.passwordChangedAt.toISOString(), "2026-10-14T10:00:00.000Z");
  assert.equal((await listUsers(store)).length, 1);
});

test("the email is unique ignoring letter case, and must be an address", async () => {
  assert.ok((await createUser(noord, store)).ok);
  const again = await createUser({ ...noord, email: "INFO@noord.NL" }, store);
  assert.deepEqual(again, { ok: false, reason: "email-taken" });
  const bad = await createUser({ ...noord, email: "noord" }, store);
  assert.deepEqual(bad, { ok: false, reason: "email-invalid" });
  assert.equal((await listUsers(store)).length, 1);
});

test("lookups by email ignore case; unknown ids and emails are null", async () => {
  await createUser(noord, store);
  assert.equal((await getUserByEmail(" INFO@noord.nl ", store))?.name, "Stichting Noord");
  assert.equal(await getUserByEmail("niemand@noord.nl", store), null);
  assert.equal(await getUser("not-an-id", store), null);
  assert.equal(await getUser("0".repeat(32), store), null);
});

test("a password change moves the moment earlier sessions are refused from", async () => {
  const created = await createUser(noord, store, new Date("2026-10-14T10:00:00Z"));
  const id = created.ok ? created.id : "";
  await setPassword(id, "scrypt$y", store, new Date("2026-10-15T10:00:00Z"));
  const user = await getUser(id, store);
  assert.equal(user?.passwordHash, "scrypt$y");
  assert.equal(user?.passwordChangedAt.toISOString(), "2026-10-15T10:00:00.000Z");
  await setDisabled(id, true, store);
  assert.equal((await getUser(id, store))?.disabled, true);
});

test("a renamed organisation takes its accounts along, others untouched", async () => {
  await createUser(noord, store);
  await createUser({ ...noord, email: "b@noord.nl", name: "B" }, store);
  await createUser({ ...noord, email: "c@zuid.nl", organisation: "zuid" }, store);
  const moved = await moveUsersToOrganisation("stichting-noord", "noord", store);
  assert.equal(moved.length, 2);
  const users = await listUsers(store);
  assert.deepEqual(
    users.map((u) => u.organisation).sort(),
    ["noord", "noord", "zuid"],
  );
});
