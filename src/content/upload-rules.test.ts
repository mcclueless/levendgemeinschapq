import test from "node:test";
import assert from "node:assert/strict";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL, UPLOAD_EXT, UPLOAD_FORMATS } from "./upload-rules";

/** The guidance beside image fields states what validation enforces (image-guidance D2). */

const EXTENSIONS: Record<(typeof UPLOAD_FORMATS)[number], string[]> = {
  JPG: [".jpg", ".jpeg"],
  PNG: [".png"],
  GIF: [".gif"],
  WebP: [".webp"],
  AVIF: [".avif"],
};

test("every format the guidance names is accepted by the upload check", () => {
  for (const format of UPLOAD_FORMATS) {
    for (const ext of EXTENSIONS[format]) assert.ok(UPLOAD_EXT.test(`foto${ext}`), ext);
  }
});

test("the upload check accepts nothing the guidance does not name", () => {
  const named = Object.values(EXTENSIONS).flat();
  for (const ext of [".svg", ".bmp", ".tiff", ".heic", ".pdf", ".webm", ".jfif"]) {
    assert.ok(!named.includes(ext));
    assert.ok(!UPLOAD_EXT.test(`foto${ext}`), ext);
  }
});

test("the size the guidance states is the size enforced", () => {
  assert.equal(MAX_UPLOAD_LABEL, "10 MB");
  assert.equal(MAX_UPLOAD_BYTES, 10 * 1024 * 1024);
});
