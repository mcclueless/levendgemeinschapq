import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import matter from "gray-matter";
import { createLocalStore, type ContentStore } from "./storage";
import {
  listTrash,
  markRestored,
  markTrashed,
  purgeExpired,
  restoreDocument,
  trashDocument,
} from "./write";

/**
 * The trash (content-trash D1/D2/D5/D6/D7): a move between prefixes, restore
 * as hidden, refusal on a taken slug, lenient listing, and lazy expiry.
 */

const publishedEvent = matter.stringify("\nKom repareren.\n", {
  title: "Repair Café",
  start: "2026-06-10T19:00",
  venue: "buurthuis",
  uid: "ical-123@example.com",
  status: "published",
});

test("markTrashed stamps the moment and keeps everything else", () => {
  const at = new Date("2026-10-01T10:00:00.000Z");
  const { data, content } = matter(markTrashed(publishedEvent, at));
  assert.equal(new Date(data.trashedAt).getTime(), at.getTime());
  assert.equal(data.uid, "ical-123@example.com");
  assert.equal(data.status, "published");
  assert.equal(content.trim(), "Kom repareren.");
});

test("markRestored drops the stamp and lands as hidden", () => {
  const trashed = markTrashed(publishedEvent, new Date());
  const { data, content } = matter(markRestored(trashed));
  assert.equal(data.trashedAt, undefined);
  assert.equal(data.status, "draft");
  assert.equal(data.uid, "ical-123@example.com");
  assert.equal(data.venue, "buurthuis");
  assert.equal(content.trim(), "Kom repareren.");
});

let root: string;
let store: ContentStore;

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "trash-"));
  store = createLocalStore(root);
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

test("trash moves the document out of the live prefix", async () => {
  await store.write("events/repair-cafe.mdx", publishedEvent);
  assert.equal(await trashDocument("event", "repair-cafe", new Date(), store), true);
  assert.equal(await store.read("events/repair-cafe.mdx"), null);
  const raw = await store.read("trash/events/repair-cafe.mdx");
  assert.ok(raw);
  assert.ok(matter(raw).data.trashedAt);
  // Nothing live to trash: a no-op that says so.
  assert.equal(await trashDocument("event", "repair-cafe", new Date(), store), false);
});

test("restore moves it back, hidden, and empties the trash key", async () => {
  await store.write("events/repair-cafe.mdx", publishedEvent);
  await trashDocument("event", "repair-cafe", new Date(), store);
  assert.deepEqual(await restoreDocument("event", "repair-cafe", store), { ok: true });
  assert.equal(await store.read("trash/events/repair-cafe.mdx"), null);
  const { data } = matter((await store.read("events/repair-cafe.mdx")) ?? "");
  assert.equal(data.status, "draft");
  assert.equal(data.trashedAt, undefined);
  assert.equal(data.uid, "ical-123@example.com");
});

test("restore onto a taken slug refuses, names the live item, changes nothing", async () => {
  await store.write("events/repair-cafe.mdx", publishedEvent);
  await trashDocument("event", "repair-cafe", new Date(), store);
  const newcomer = matter.stringify("\n", { title: "Repair Café 2027", status: "published" });
  await store.write("events/repair-cafe.mdx", newcomer);
  const result = await restoreDocument("event", "repair-cafe", store);
  assert.deepEqual(result, { ok: false, reason: "taken", title: "Repair Café 2027" });
  assert.equal(await store.read("events/repair-cafe.mdx"), newcomer);
  assert.ok(await store.read("trash/events/repair-cafe.mdx"));
});

test("restore of a missing trashed document reports missing", async () => {
  assert.deepEqual(await restoreDocument("venue", "nope", store), {
    ok: false,
    reason: "missing",
  });
});

test("listTrash spans types, is lenient, and sorts newest first", async () => {
  const older = new Date("2026-09-01T00:00:00Z");
  const newer = new Date("2026-09-20T00:00:00Z");
  await store.write("events/a.mdx", publishedEvent);
  await store.write("venues/b.mdx", matter.stringify("\n", { name: "Buurthuis", status: "published" }));
  await trashDocument("event", "a", older, store);
  await trashDocument("venue", "b", newer, store);
  // Fails the event schema (no start, no title) and is still listed by slug.
  await store.write(
    "trash/events/broken.mdx",
    matter.stringify("\n", { trashedAt: "2026-09-10T00:00:00.000Z" }),
  );
  const items = await listTrash(store);
  assert.deepEqual(
    items.map((i) => [i.type, i.slug, i.title]),
    [
      ["venue", "b", "Buurthuis"],
      ["event", "broken", "broken"],
      ["event", "a", "Repair Café"],
    ],
  );
  assert.equal(items[2].expiresAt?.toISOString(), "2026-10-01T00:00:00.000Z");
});

test("purgeExpired removes items older than 30 days and unstamped ones", async () => {
  const now = new Date("2026-10-01T12:00:00Z");
  const day = 24 * 60 * 60 * 1000;
  await store.write("events/old.mdx", publishedEvent);
  await store.write("events/recent.mdx", publishedEvent);
  await trashDocument("event", "old", new Date(now.getTime() - 31 * day), store);
  await trashDocument("event", "recent", new Date(now.getTime() - 29 * day), store);
  await store.write("trash/blog/unstamped.mdx", matter.stringify("\n", { title: "?" }));
  assert.equal(await purgeExpired(now, store), 2);
  const left = await listTrash(store);
  assert.deepEqual(left.map((i) => i.slug), ["recent"]);
});
