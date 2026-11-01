import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";
import { legacyEvidencePaths } from "../../scripts/legacy-evidence.mjs";

test("pre-consolidation receipt schema requires immutable original bytes", () => {
  const text = "original receipt";
  const entry = {
    path: "spec/src/history/E-OLD-001.md",
    revision: "a".repeat(40),
    sha256: createHash("sha256").update(text).digest("hex"),
  };
  assert.deepEqual(
    [
      ...legacyEvidencePaths(
        [entry],
        () => text,
        () => text,
      ),
    ],
    [entry.path],
  );
  assert.throws(
    () =>
      legacyEvidencePaths(
        [entry],
        () => "edited",
        () => text,
      ),
    /bytes changed/,
  );
  assert.throws(
    () =>
      legacyEvidencePaths(
        [entry],
        () => text,
        () => "different original",
      ),
    /bytes changed/,
  );
  assert.throws(
    () =>
      legacyEvidencePaths(
        [{ ...entry, revision: "main" }],
        () => text,
        () => text,
      ),
    /Invalid/,
  );
});
