import { expect, it, vi } from "vitest";
import { AiChatController } from "../../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { AcpAgentRuntime } from "../../../../src/lib/ai/runtimes/acp/runtime.ts";
import { acpFixture } from "../../../fixtures/ai/acp-transport.mjs";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { projectAiTranscript } from "../../../../src/lib/ai/chat/transcript-projection.ts";
import { projectTranscriptToChatItems } from "../../../../src/lib/ai/conversations/transcript-to-chat.ts";
import { transcriptCommentContext } from "../../../../src/lib/ai/chat/transcript-context.ts";
import { restoreTranscriptComments } from "../../../../src/lib/ai/chat/restored-comments.ts";
import { commentReceipt } from "../../../../src/lib/ai/conversations/comment-receipt.ts";
import type { TranscriptEntry } from "../../../../src/lib/ai/conversations/types.ts";

const capture = (blockId = "source/body", revision = "captured") =>
  transcriptCommentContext({
    id: "comment-batch",
    text: "",
    comments: [
      {
        threadId: "thread",
        commentId: "comment",
        author: { id: "owner", name: "You" },
        text: "Please clarify this part",
        anchor: { blockId, revision, from: 0, to: 8, quote: "Original" },
      },
    ],
  });

it("records the original authored parent on a completed ACP answer before local checkpoint and cold restore", async () => {
  const f = acpFixture(),
    repository = new ConversationRepository(new MemoryTranscriptStore());
  const c = new AiChatController(new AcpAgentRuntime(f.backend), null, [], {
    repository,
    createConversation: () => ({ scopeDir: "Notes" }),
    request: { agent: "agent" },
  });
  f.onPrompt = async (
    id: string,
    requestId: string,
    request: { text: string },
  ) => {
    f.emit(id, "activity", requestId, {
      update: {
        sessionUpdate: "agent_message_chunk",
        content: {
          type: "text",
          text: request.text
            ? "Original captured answer"
            : "Exact response to your feedback",
        },
      },
    });
    f.emit(id, "record", requestId, {
      record: { status: "completed", stopReason: "end_turn" },
    });
  };
  try {
    await c.submit("Produce the original answer");
    await vi.waitFor(async () =>
      expect(
        (await repository.read(c.location!)).metadata.pendingTurn,
      ).toBeUndefined(),
    );
    const source = projectAiTranscript(c.items).find(
      (i) => i.role === "assistant",
    )!.blocks[0]!;
    await c.submit("", { contextBlocks: capture(source.id, source.revision) });
    await vi.waitFor(async () =>
      expect(
        (await repository.read(c.location!)).metadata.pendingTurn,
      ).toBeUndefined(),
    );
    const saved = await repository.read(c.location!);
    const user = saved.transcript.find(
      (e) =>
        e.type === "message" && e.role === "user" && e.contextBlocks?.length,
    )!;
    const reply = saved.transcript.find(
      (e) =>
        e.type === "message" &&
        e.role === "assistant" &&
        e.text === "Exact response to your feedback",
    )!;
    expect(reply.parentId).toBe(user.id);
    const restored = projectTranscriptToChatItems(saved.transcript);
    expect(restored.find((e) => e.id === reply.id)).toMatchObject({
      parentId: user.id,
    });
    expect(
      projectAiTranscript(restored).find((e) => e.id === reply.id)
        ?.replyContext,
    ).toEqual({ threadId: "thread", commentIds: ["comment"] });
  } finally {
    await c.close();
  }
});

function records(
  acknowledged = true,
  binding = "accepted-binding",
): TranscriptEntry[] {
  const createdAt = "2026-10-19T00:00:00.000Z";
  return [
    {
      schemaVersion: 3,
      id: "source",
      type: "message",
      role: "assistant",
      text: "Original source",
      createdAt,
    },
    {
      schemaVersion: 3,
      id: "feedback",
      type: "message",
      role: "user",
      text: "",
      contextBlocks: capture(),
      agentBindingId: "accepted-binding",
      createdAt,
    },
    {
      schemaVersion: 3,
      id: "reply",
      parentId: "feedback",
      type: "message",
      role: "assistant",
      text: "A captured reply",
      agentBindingId: binding,
      createdAt,
    },
    ...(acknowledged ? [commentReceipt("feedback")] : []),
  ];
}

it("restores a replied comment from its exact parent and binding without inventing new work", () => {
  const saved = records(),
    before = JSON.stringify(saved);
  const items = projectTranscriptToChatItems(saved);
  const threads = restoreTranscriptComments([], items);
  expect(threads[0]?.comments[0]).toMatchObject({
    status: "replied",
    replyItemId: "reply",
    replyDestinations: [{ id: "reply", label: expect.any(String) }],
  });
  expect(restoreTranscriptComments(threads, items)).toBe(threads);
  expect(JSON.stringify(saved)).toBe(before);
});

it.each(["unacknowledged", "different-binding", "missing-parent"])(
  "does not infer a reply from proximity for %s history",
  (fault) => {
    const saved = records(
      fault !== "unacknowledged",
      fault === "different-binding" ? "other-binding" : "accepted-binding",
    );
    if (fault === "missing-parent")
      delete saved.find((e) => e.id === "reply")!.parentId;
    const items = projectTranscriptToChatItems(saved);
    expect(
      restoreTranscriptComments([], items)
        .flatMap((t) => t.comments)
        .some((c) => c.status === "replied"),
    ).toBe(false);
    expect(
      projectAiTranscript(items).find((i) => i.id === "reply")?.replyContext,
    ).toBeUndefined();
  },
);

it("keeps a late native request fragment separate from the current turn's attributed answer", async () => {
  const f = acpFixture(),
    repository = new ConversationRepository(new MemoryTranscriptStore());
  const c = new AiChatController(new AcpAgentRuntime(f.backend), null, [], {
    repository,
    createConversation: () => ({ scopeDir: "Notes" }),
    request: { agent: "agent" },
  });
  f.onPrompt = async (id: string, requestId: string) => {
    for (const [run, text] of [
      ["retired-request", "Late retired output"],
      [requestId, "Current request answer"],
    ])
      f.emit(id, "activity", run, {
        update: {
          sessionUpdate: "agent_message_chunk",
          content: { type: "text", text },
        },
      });
    f.emit(id, "record", requestId, {
      record: { status: "completed", stopReason: "end_turn" },
    });
  };
  try {
    await c.submit("New authored request");
    await vi.waitFor(async () =>
      expect(
        (await repository.read(c.location!)).metadata.pendingTurn,
      ).toBeUndefined(),
    );
    const saved = (await repository.read(c.location!)).transcript;
    const user = saved.find((e) => e.type === "message" && e.role === "user")!;
    expect(
      saved.filter((e) => e.type === "message" && e.role === "assistant"),
    ).toEqual([
      expect.objectContaining({
        text: "Late retired output",
        source: expect.objectContaining({ runId: "retired-request" }),
      }),
      expect.objectContaining({
        text: "Current request answer",
        parentId: user.id,
      }),
    ]);
    expect(
      saved.find(
        (e) => e.type === "message" && e.text === "Late retired output",
      )?.parentId,
    ).toBeUndefined();
  } finally {
    await c.close();
  }
});

it("offers each accepted participant's final answer while withholding partial group outcomes", () => {
  const saved = records();
  const user = saved.find((e) => e.id === "feedback")!;
  if (user.type !== "message") throw new Error("Fixture user missing");
  saved.push({
    schemaVersion: 3,
    id: "writer-reply",
    parentId: user.id,
    type: "message",
    role: "assistant",
    text: "Writer answer",
    agentBindingId: "writer-binding",
    createdAt: user.createdAt,
  });
  saved.push({
    schemaVersion: 3,
    id: "reviewer-final",
    parentId: user.id,
    type: "message",
    role: "assistant",
    text: "Reviewer final answer",
    agentBindingId: "accepted-binding",
    createdAt: user.createdAt,
  });
  const items = projectTranscriptToChatItems(saved);
  const projectedUser = items.find((e) => e.id === user.id)!;
  if (projectedUser.type !== "message")
    throw new Error("Fixture projection missing");
  projectedUser.deliveries = [
    {
      id: "reviewer-delivery",
      recipient: {
        id: "reviewer",
        token: "jj-store-agent:7265766965776572;",
        label: "Reviewer",
      },
      agentBindingId: "accepted-binding",
      state: "completed",
    },
    {
      id: "writer-delivery",
      recipient: {
        id: "writer",
        token: "jj-store-agent:777269746572;",
        label: "Writer",
      },
      agentBindingId: "writer-binding",
      state: "unknown",
    },
  ];
  expect(restoreTranscriptComments([], items)[0]?.comments[0]?.status).toBe(
    "sent",
  );
  projectedUser.deliveries[1]!.state = "completed";
  const restored = restoreTranscriptComments([], items);
  expect(restored[0]?.comments[0]).toMatchObject({
    status: "replied",
    replyDestinations: [{ id: "reviewer-final" }, { id: "writer-reply" }],
  });
  expect(
    projectAiTranscript(items).find((i) => i.id === "reply")?.replyContext,
  ).toBeUndefined();
  expect(
    projectAiTranscript(items).find((i) => i.id === "writer-reply")
      ?.replyContext,
  ).toEqual({ threadId: "thread", commentIds: ["comment"] });
});

it("does not acknowledge a cancelled native turn or link its partial answer", async () => {
  const f = acpFixture(),
    repository = new ConversationRepository(new MemoryTranscriptStore());
  const c = new AiChatController(new AcpAgentRuntime(f.backend), null, [], {
    repository,
    createConversation: () => ({ scopeDir: "Notes" }),
    request: { agent: "agent" },
  });
  f.onPrompt = async (id: string, requestId: string) => {
    f.emit(id, "activity", requestId, {
      update: {
        sessionUpdate: "agent_message_chunk",
        content: { type: "text", text: "Partial cancelled answer" },
      },
    });
    f.emit(id, "record", requestId, {
      record: { status: "cancelled", stopReason: "cancelled" },
    });
  };
  try {
    await c.submit("", { contextBlocks: capture() });
    await c.close();
    const saved = await repository.read(c.location!);
    expect(
      saved.transcript.some((e) => e.id.startsWith("comment-context-sent:")),
    ).toBe(false);
    expect(saved.metadata.pendingTurn).toBeDefined();
    expect(
      saved.transcript.find(
        (e) => e.type === "message" && e.role === "assistant",
      )?.parentId,
    ).toBeUndefined();
    expect(
      restoreTranscriptComments(
        [],
        projectTranscriptToChatItems(saved.transcript),
      ),
    ).toEqual([]);
  } finally {
    await c.close();
  }
});
