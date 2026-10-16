import { test } from "node:test";
import assert from "node:assert/strict";
import { evidenceFileErrors } from "../../scripts/progress.mjs";

test("immutable evidence resolves a removed file at its original snapshot", () => {
  assert.deepEqual(
    evidenceFileErrors(
      [{ id: "old", path: "old.md", files: ["removed.css"] }],
      new Set(["old.md"]),
      new Set(["old.md"]),
      () => new Set(["removed.css"]),
    ),
    [],
  );
});
test("fresh evidence can cover a deletion from the actual base", () => {
  assert.deepEqual(
    evidenceFileErrors(
      [{ id: "new", path: "new.md", files: ["removed.css"] }],
      new Set(["new.md"]),
      new Set(["removed.css"]),
      () => {
        throw new Error("Fresh evidence has no history");
      },
    ),
    [],
  );
});
test("missing and invented fresh references fail closed", () => {
  const errors = evidenceFileErrors(
    [
      { id: "new", path: "new.md", files: ["typo.css"] },
      { id: "old", path: "old.md", files: ["never-existed.css"] },
    ],
    new Set(["new.md", "old.md"]),
    new Set(["old.md"]),
    () => new Set(["removed.css"]),
  );
  assert.equal(errors.length, 2);
  assert.match(errors.join("\n"), /typo.css/u);
  assert.match(errors.join("\n"), /never-existed.css/u);
});
