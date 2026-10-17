import test from "node:test";
import assert from "node:assert/strict";
import { applyStoredSessionResumePolicy } from "../../src/lib/ai/chat/chat-session.ts";
const runtime = {
  capabilities: () => ({ resume: false }),
  resume: () => {
    throw new Error("Must not resume historical identities");
  },
};
const stored = (items, interrupted = false) => ({
  id: "conversation",
  runtime: "controller",
  runtimeSessionId: "old-controller-thread",
  createdAt: "2026-08-16T00:00:00.000Z",
  updatedAt: "2026-08-16T00:00:00.000Z",
  items,
  interrupted,
});

test("stored interrupted submissions stay interrupted even without a pending question", () => {
  const original = stored(
    [
      {
        id: "partial",
        type: "message",
        role: "assistant",
        text: "Partial answer",
      },
    ],
    true,
  );
  const restored = applyStoredSessionResumePolicy({
    stored: original,
    runtime,
    resumed: false,
  });
  assert.equal(restored.interrupted, true);
  assert.equal(restored.items[0].text, "Partial answer");
  assert.equal(original.runtimeSessionId, "old-controller-thread");
});

test("unfinished native work is settled as unknown without fabricating completed tools", () => {
  const original = stored([
    {
      id: "tool",
      type: "tool",
      toolId: "native-tool",
      name: "read",
      state: "running",
      output: "Partial output",
    },
    {
      id: "thinking",
      type: "thinking",
      state: "streaming",
      kind: "summary",
      text: "Preparing",
    },
  ]);
  const restored = applyStoredSessionResumePolicy({
    stored: original,
    runtime,
    resumed: false,
  });
  assert.equal(restored.interrupted, true);
  assert.equal(restored.items[0].state, "error");
  assert.match(restored.items[0].output, /outcome unknown/i);
  assert.ok(restored.items[0].output.includes("Partial output"));
  assert.equal(restored.items[1].state, "done");
  assert.equal(original.items[0].state, "running");
});
