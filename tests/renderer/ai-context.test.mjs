import test from "node:test";
import assert from "node:assert/strict";
import {
  prepareAgentTurn,
  projectAgentTurn,
} from "../../src/lib/ai/core/context.ts";

const memory = {
  kind: "memory-recall",
  id: 'memory"<&',
  content: "Private recalled facts",
  metadata: { memoryId: "one", revision: 2, scope: "workspace" },
};
const handoff = {
  kind: "conversation-handoff",
  id: "handoff",
  content: "Earlier conversation",
  metadata: {
    conversationId: "old",
    targetBindingId: "new",
    throughEntryId: "entry",
    throughEntryHash: "hash",
    projectionMode: "full",
    omittedEntryCount: 0,
  },
};

test("AI context stays distinct from the exact authored message", () => {
  const blocks = [memory, handoff];
  const result = projectAgentTurn("  My authored café\n", blocks);
  assert.equal(result.text, "  My authored café\n");
  assert.ok(!result.context.includes(result.text));
  assert.ok(
    result.context.indexOf("Earlier conversation") <
      result.context.indexOf("Private recalled facts"),
  );
  assert.ok(result.context.includes("memory&quot;&lt;&amp;"));
  assert.deepEqual(blocks, [memory, handoff]);
});

test("a turn without injected context keeps only authored text", () => {
  assert.deepEqual(projectAgentTurn("Hello"), { text: "Hello" });
  assert.deepEqual(projectAgentTurn("Hello", []), { text: "Hello" });
});

test("deferred context is prepared once after admission and checked again before dispatch", async () => {
  const calls = [];
  const result = await prepareAgentTurn(
    "Authored",
    {
      authorizeContext: async () => {
        calls.push("authorize");
        return true;
      },
      prepareContext: async () => {
        calls.push("prepare");
        return [memory];
      },
      contextBlocks: [handoff],
    },
    new AbortController().signal,
  );
  assert.deepEqual(calls, ["authorize", "prepare", "authorize"]);
  assert.equal(result.text, "Authored");
  assert.ok(result.context.includes(memory.content));
  assert.ok(!result.context.includes(handoff.content));
});

test("revoked context admission does not dispatch stale prepared data", async () => {
  let calls = 0;
  await assert.rejects(
    prepareAgentTurn(
      "Authored",
      {
        authorizeContext: async () => ++calls === 1,
        prepareContext: async () => [memory],
      },
      new AbortController().signal,
    ),
    /context admission changed/,
  );
  assert.equal(calls, 2);
});

test("cancellation during context preparation cannot produce a dispatchable turn", async () => {
  const abort = new AbortController();
  await assert.rejects(
    prepareAgentTurn(
      "Authored",
      {
        prepareContext: async () => {
          abort.abort();
          return [memory];
        },
      },
      abort.signal,
    ),
    { name: "AbortError" },
  );
});

test("initially denied context does not read memory or prepare it", async () => {
  let prepared = false;
  await assert.rejects(
    prepareAgentTurn(
      "Authored",
      {
        authorizeContext: async () => false,
        prepareContext: async () => {
          prepared = true;
          return [];
        },
      },
      new AbortController().signal,
    ),
    /context admission changed/,
  );
  assert.equal(prepared, false);
});
