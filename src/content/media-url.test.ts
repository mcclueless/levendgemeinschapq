import test from "node:test";
import assert from "node:assert/strict";
import { versionedImageUrl } from "./media-url";

/** Backend views show a replaced image at once (gallery-find-and-describe D10). */

test("the address changes when the file is replaced", () => {
  const url = "https://media.example/uploads/foto-1a2b.jpg";
  const before = versionedImageUrl({ url, lastModified: "2026-10-08T19:30:00.000Z" });
  const after = versionedImageUrl({ url, lastModified: "2026-10-08T19:37:48.000Z" });
  assert.notEqual(before, after);
  assert.ok(before.startsWith(`${url}?v=`));
});

test("without a usable time, the plain address", () => {
  assert.equal(versionedImageUrl({ url: "/uploads/a.png" }), "/uploads/a.png");
  assert.equal(versionedImageUrl({ url: "/uploads/a.png", lastModified: "geen datum" }), "/uploads/a.png");
});

test("an address that already has a query keeps it", () => {
  assert.equal(
    versionedImageUrl({ url: "/uploads/a.png?x=1", lastModified: "1970-01-01T00:00:01.000Z" }),
    "/uploads/a.png?x=1&v=1000",
  );
});
