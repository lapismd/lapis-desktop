import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { runPopoutProcess } from "./popout-process.mjs";

test("related native windows mount the shared popup surface and retire independently", async () => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "popout-proof-"),
  );
  const result = await runPopoutProcess(root, "1");
  assert.equal(result.mode, "allow");
  assert.deepEqual(result.checks, [
    "related-documents",
    "shared-surfaces",
    "native-focus",
    "native-resize",
    "native-controls",
    "nested-denied",
    "file-denied",
    "independent-close",
    "observer-cleanup",
  ]);
  const events = readFileSync(join(root, "integration-actions.jsonl"), "utf8")
    .trim()
    .split("\n")
    .map(JSON.parse);
  assert.equal(
    events.filter(
      ({ kind, value }) =>
        kind === "popup-request" && value === "about:blank;enabled=true",
    ).length,
    2,
  );
  assert.equal(
    events.some(({ kind }) => kind === "external"),
    false,
  );
});

test("native popup proof stays denied without explicit fixture opt-in", async () => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "popout-denied-"),
  );
  const result = await runPopoutProcess(root, "deny");
  assert.equal(result.mode, "deny");
  assert.deepEqual(result.checks, ["creation-denied"]);
});
