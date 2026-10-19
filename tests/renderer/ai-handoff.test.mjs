import test from "node:test";
import assert from "node:assert/strict";
import { register } from "tsx/esm/api";
register();
const { buildConversationContextHandoff } = await import(
  "../../src/lib/ai/conversations/context-handoff.ts"
);
const { transcriptEntryHash, transcriptRangeHash } = await import(
  "../../src/lib/ai/conversations/hashes.ts"
);
const base = { schemaVersion: 3, createdAt: "2026-08-16T00:00:00.000Z" };
const message = (id, text, role = "user") => ({
  ...base,
  id,
  type: "message",
  role,
  text,
});

test("handoff retains verbatim messages and labeled tool evidence without private reasoning", async () => {
  const transcript = [
    { ...message("u", "Fix\nthis"), agentBindingId: "old" },
    { ...base, id: "r", type: "thinking.summary", text: "private plan" },
    {
      ...base,
      id: "t",
      type: "tool",
      toolId: "tool",
      name: "shell",
      state: "completed",
      input: "pnpm test",
      output: "all passed",
      redacted: true,
    },
    { ...message("a", "Done", "assistant"), agentBindingId: "old" },
  ];
  const handoff = await buildConversationContextHandoff(transcript, {
    conversationId: "conversation",
    targetBindingId: "new-binding",
    bindings: [
      {
        ...base,
        id: "old",
        type: "binding.created",
        runtime: "acp",
        agent: "codex",
        nativeSessionId: "old-controller-thread",
      },
    ],
  });
  assert.ok(handoff.block.content.includes("[User]\nFix\nthis"));
  assert.ok(
    handoff.block.content.includes("Input:\npnpm test\nOutput:\nall passed"),
  );
  assert.ok(handoff.block.content.includes("trust=untrusted"));
  assert.ok(handoff.block.content.includes("[Assistant (codex)]\nDone"));
  assert.ok(!handoff.block.content.includes("private plan"));
  assert.ok(!handoff.block.content.includes("old-controller-thread"));
  assert.equal(
    handoff.throughEntryHash,
    await transcriptEntryHash(transcript[3]),
  );
  assert.equal(handoff.block.metadata.targetBindingId, "new-binding");
});

test("verified delta handoff is deterministic and reports omitted older entries", async () => {
  const transcript = [
    message("u1", "older"),
    message("a1", "newer", "assistant"),
    message("u2", "latest"),
  ];
  const options = {
    conversationId: "conversation",
    targetBindingId: "binding",
    after: {
      entryId: "u1",
      entryHash: await transcriptEntryHash(transcript[0]),
    },
    maxTokens: 7,
  };
  const first = await buildConversationContextHandoff(transcript, options);
  assert.deepEqual(
    first,
    await buildConversationContextHandoff(transcript, options),
  );
  assert.equal(first.mode, "delta");
  assert.ok(first.omittedEntryCount > 0);
  assert.ok(first.block.content.includes("latest"));
  assert.ok(!first.block.content.includes("[User]\nolder"));
});

test("a missing or modified context cursor fails before handoff", async () => {
  const transcript = [message("u", "Evidence")];
  await assert.rejects(
    buildConversationContextHandoff(transcript, {
      after: { entryId: "u", entryHash: "0".repeat(64) },
    }),
    /hash does not match/,
  );
  await assert.rejects(
    buildConversationContextHandoff(transcript, {
      after: { entryId: "missing", entryHash: "0".repeat(64) },
    }),
    /cursor is missing/,
  );
  assert.equal(
    await buildConversationContextHandoff(transcript, {
      after: {
        entryId: "u",
        entryHash: await transcriptEntryHash(transcript[0]),
      },
    }),
    undefined,
  );
});

test("stored summaries need matching source hashes and retain a verbatim recent tail", async () => {
  const transcript = [
    message("u", "old evidence"),
    message("a", "recent answer", "assistant"),
  ];
  const summary = {
    ...base,
    type: "handoff.summary.created",
    id: "summary",
    conversationId: "conversation",
    fromEntryId: "u",
    throughEntryId: "u",
    sourceHash: await transcriptRangeHash(transcript.slice(0, 1)),
    summary: "Earlier, the user supplied old evidence.",
    processor: { runtime: "acp", agent: "codex", model: "pinned" },
    estimatedTokens: 10,
  };
  const handoff = await buildConversationContextHandoff(transcript, {
    conversationId: "conversation",
    targetBindingId: "binding",
    summaries: [summary],
  });
  assert.equal(handoff.mode, "summary-tail");
  assert.ok(handoff.block.content.includes(summary.summary));
  assert.ok(handoff.block.content.includes("recent answer"));
  assert.ok(!handoff.block.content.includes("[User]\nold evidence"));
  const modified = await buildConversationContextHandoff(
    [message("u", "changed"), transcript[1]],
    { conversationId: "conversation", summaries: [summary] },
  );
  assert.equal(modified.mode, "full");
  assert.ok(!modified.block.content.includes(summary.summary));
});

test("empty and private-only transcripts produce no handoff", async () => {
  assert.equal(await buildConversationContextHandoff([]), undefined);
  assert.equal(
    await buildConversationContextHandoff([
      {
        ...base,
        id: "reasoning",
        type: "thinking.summary",
        text: "private plan",
      },
    ]),
    undefined,
  );
  assert.equal(
    await buildConversationContextHandoff([message("u", "Hello")], {
      maxTokens: 0,
    }),
    undefined,
  );
});

test("tiny handoff budgets cannot accidentally copy an entire oversized message", async () => {
  const handoff = await buildConversationContextHandoff(
    [message("u", "sensitive ".repeat(1000))],
    { maxTokens: 1 },
  );
  const evidence = handoff.block.content
    .split("<lapis-handoff-evidence>")[1]
    .split("</lapis-handoff-evidence>")[0]
    .trim();
  assert.ok(
    [...evidence].length <= 4,
    `evidence exceeded four code points: ${[...evidence].length}`,
  );
});

test("handoff rejects non-finite or fractional budgets", async () => {
  for (const maxTokens of [NaN, Infinity, 1.5])
    await assert.rejects(
      buildConversationContextHandoff([message("u", "Evidence")], {
        maxTokens,
      }),
      /budget/,
    );
});

test("a stored summary cannot cross conversations or conceal oversized content with a false token estimate", async () => {
  const transcript = [
    message("u", "Old evidence"),
    message("a", "Recent answer", "assistant"),
  ];
  const summary = {
    ...base,
    type: "handoff.summary.created",
    id: "summary",
    conversationId: "other-conversation",
    fromEntryId: "u",
    throughEntryId: "u",
    sourceHash: await transcriptRangeHash(transcript.slice(0, 1)),
    summary: "Unrelated summary",
    processor: { runtime: "acp", agent: "codex", model: "pinned" },
    estimatedTokens: 1,
  };
  for (const candidate of [
    summary,
    { ...summary, conversationId: "conversation", summary: "x".repeat(12001) },
  ]) {
    const handoff = await buildConversationContextHandoff(transcript, {
      conversationId: "conversation",
      summaries: [candidate],
    });
    assert.equal(handoff.mode, "full");
    assert.ok(!handoff.block.content.includes(candidate.summary));
  }
});
