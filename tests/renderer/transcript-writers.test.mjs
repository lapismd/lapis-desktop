import test from "node:test";
import assert from "node:assert/strict";
import {
  bindTranscriptWriters,
  guardTranscriptReplacement,
} from "../../src/lib/repository/transcript-writers.ts";
test("replacement joins AI admission, while ordinary shutdown uses its original guard", async () => {
  const calls = [];
  const app = {
    fileEditingSessions: {
      guard: async (path, apply) => {
        calls.push(["ordinary", path]);
        return apply();
      },
    },
  };
  const release = bindTranscriptWriters(app, async (path, apply) => {
    calls.push(["transcripts", path]);
    return app.fileEditingSessions.guard(path, apply);
  });
  assert.equal(
    await guardTranscriptReplacement(app, "transcript.jsonl", async () => 42),
    42,
  );
  assert.deepEqual(calls, [
    ["transcripts", "transcript.jsonl"],
    ["ordinary", "transcript.jsonl"],
  ]);
  calls.length = 0;
  await app.fileEditingSessions.guard(undefined, async () => {});
  assert.deepEqual(calls, [["ordinary", undefined]]);
  release();
  calls.length = 0;
  await guardTranscriptReplacement(app, undefined, async () => {});
  assert.deepEqual(calls, [["ordinary", undefined]]);
});
test("stale cleanup cannot unbind a replacement owner", () => {
  const app = {};
  const guard = async (_path, apply) => apply();
  const release = bindTranscriptWriters(app, guard);
  assert.throws(() => bindTranscriptWriters(app, guard), /already bound/);
  release();
  const second = bindTranscriptWriters(app, guard);
  release();
  assert.throws(() => bindTranscriptWriters(app, guard), /already bound/);
  second();
});
