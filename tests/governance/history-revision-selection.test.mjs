import assert from "node:assert/strict";
import test from "node:test";
import { oldestRevisionContaining } from "../desktop/history-revision-selection.mjs";

test("selects the oldest file-bearing revision past newer startup checkpoints", async () => {
  const paths = new Map([
    ["working-copy", ["transcript.jsonl"]],
    ["later-transcript", ["transcript.jsonl"]],
    ["startup-skills", ["SKILL.md"]],
    ["initial-transcript", ["transcript.jsonl"]],
  ]);
  assert.equal(
    await oldestRevisionContaining(
      [...paths.keys()],
      "transcript.jsonl",
      async (revision) => paths.get(revision),
    ),
    "initial-transcript",
  );
});

test("reports every inspected revision when the file is absent", async () => {
  await assert.rejects(
    oldestRevisionContaining(
      ["newer", "older"],
      "transcript.jsonl",
      async (revision) => [`${revision}.md`],
    ),
    /No inspected revision changed transcript\.jsonl; older: older\.md; newer: newer\.md/u,
  );
});
