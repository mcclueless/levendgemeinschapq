import test from "node:test";
import assert from "node:assert/strict";
import { MAX_UPLOAD_BYTES, checkReplacement } from "./media";

/** Replacing an image's file keeps its address (gallery-find-and-describe D10). */

const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00];

const file = (name: string, type: string, bytes: number[] | Uint8Array) =>
  new File([(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)) as BlobPart], name, { type });

test("a file of the same format may replace an image", async () => {
  const result = await checkReplacement("uploads/borrel-8f3a.jpg", file("nieuw.jpg", "image/jpeg", JPEG));
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.type, "image/jpeg");
});

test("the format is compared, not the spelling of the extension", async () => {
  const result = await checkReplacement("uploads/borrel-8f3a.jpg", file("nieuw.JPEG", "image/jpeg", JPEG));
  assert.equal(result.ok, true);
});

test("another format is refused", async () => {
  const result = await checkReplacement("uploads/borrel-8f3a.jpg", file("nieuw.png", "image/png", PNG));
  assert.deepEqual(result, { ok: false, reason: "replace-format" });
});

test("an oversized file is refused", async () => {
  const big = new Uint8Array(MAX_UPLOAD_BYTES + 1);
  big.set(JPEG);
  const result = await checkReplacement("uploads/borrel-8f3a.jpg", file("groot.jpg", "image/jpeg", big));
  assert.deepEqual(result, { ok: false, reason: "upload-size" });
});

test("a mislabelled file is refused", async () => {
  const result = await checkReplacement("uploads/borrel-8f3a.jpg", file("nep.jpg", "image/jpeg", PNG));
  assert.deepEqual(result, { ok: false, reason: "upload-corrupt" });
});

test("a file that is not an image is refused", async () => {
  const result = await checkReplacement("uploads/borrel-8f3a.jpg", file("tekst.txt", "text/plain", [1, 2, 3]));
  assert.deepEqual(result, { ok: false, reason: "upload-type" });
});

test("no file is not a replacement", async () => {
  assert.deepEqual(await checkReplacement("uploads/borrel-8f3a.jpg", null), { ok: false, reason: "replace-missing" });
});
