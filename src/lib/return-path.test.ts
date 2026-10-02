import test from "node:test";
import assert from "node:assert/strict";
import { returnPath, withParam } from "./return-path";

/** Returning to a management list view (admin-content-table D6). */

const fallback = "/beheer/evenementen";

test("a list address keeps its view", () => {
  const view = "/beheer/evenementen?status=draft&q=repair&pagina=2";
  assert.equal(returnPath(view, fallback), view);
});

test("another backend list is accepted", () => {
  assert.equal(returnPath("/beheer/locaties", fallback), "/beheer/locaties");
});

const hostile: Array<[string, unknown]> = [
  ["an absolute URL", "https://evil.example/beheer/evenementen"],
  ["a protocol-relative URL", "//evil.example/beheer/evenementen"],
  ["a path outside the backend", "/agenda"],
  ["the backend root's sibling", "/beheerder/x"],
  ["a path that climbs out", "/beheer/../agenda"],
  ["an encoded climb", "/beheer/%2e%2e/agenda"],
  ["a backslash host", "/beheer\\evil.example"],
  ["a leading-backslash host", "\\\\evil.example/beheer/x"],
  ["a javascript URL", "javascript:alert(1)"],
  ["an empty value", ""],
  ["a missing value", undefined],
  ["a file, not text", { name: "x" }],
];

for (const [name, value] of hostile) {
  test(`${name} gives the fallback`, () => {
    assert.equal(returnPath(value, fallback), fallback);
  });
}

test("a parameter is added to a view that already has some", () => {
  assert.equal(
    withParam("/beheer/locaties?status=published&pagina=2", "blocked", "de brink"),
    "/beheer/locaties?status=published&pagina=2&blocked=de+brink",
  );
});

test("a parameter is added to a bare path", () => {
  assert.equal(withParam("/beheer/locaties", "undeletable", "x"), "/beheer/locaties?undeletable=x");
});
