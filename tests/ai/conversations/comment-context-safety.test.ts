import { expect, it, vi } from "vitest";
import { validateTranscriptEntry } from "../../../src/lib/ai/conversations/transcript-validation.ts";
import { projectChatItemsToTranscript } from "../../../src/lib/ai/conversations/chat-to-transcript.ts";
import { projectTranscriptToChatItems } from "../../../src/lib/ai/conversations/transcript-to-chat.ts";
import { transcriptEntryHash } from "../../../src/lib/ai/conversations/hashes.ts";
import {
  commentReceipt,
  isCommentReceipt,
} from "../../../src/lib/ai/conversations/comment-receipt.ts";
import { restoreTranscriptComments } from "../../../src/lib/ai/chat/restored-comments.ts";
import { transcriptCommentContext } from "../../../src/lib/ai/chat/transcript-context.ts";
import { AiChatController } from "../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { ConversationRepository } from "../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { FakeAgentRuntime } from "../support/fake-runtime.ts";
import type { TranscriptEntry } from "../../../src/lib/ai/conversations/types.ts";

const capture = {
  id: "submission",
  text: "",
  comments: [
    {
      threadId: "thread",
      commentId: "comment",
      author: { id: "owner", name: "You" },
      text: "Keep this exact feedback",
      anchor: {
        blockId: "assistant/body",
        revision: "original",
        from: 2,
        to: 4,
        quote: "😀",
        tableContext: { markdown: "| 😀 | Original |", from: 2, to: 4 },
      },
    },
  ],
};
function user() {
  return projectChatItemsToTranscript([
    {
      id: "user-one",
      type: "message",
      role: "user",
      text: "",
      contextBlocks: transcriptCommentContext(capture),
      createdAt: "2026-10-19T00:00:00.000Z",
    },
  ])[0]!;
}
it("retains UTF-16/table captures, hashes them and keeps file/recall/handoff snapshots transient", async () => {
  const contexts = transcriptCommentContext(capture);
  const entry = projectChatItemsToTranscript([
    {
      id: "user",
      type: "message",
      role: "user",
      text: "Authored",
      contextBlocks: [
        ...contexts,
        {
          kind: "file-context",
          id: "file",
          content: "PRIVATE FILE",
          metadata: { path: "Note.md" },
        },
      ],
    },
  ])[0]!;
  expect(JSON.stringify(entry)).not.toContain("PRIVATE FILE");
  expect(entry).toMatchObject({ contextBlocks: contexts });
  const before = await transcriptEntryHash(entry);
  contexts[0]!.content = "changed";
  expect(await transcriptEntryHash(entry)).toBe(before);
  const changed = structuredClone(entry) as Extract<
    TranscriptEntry,
    { type: "message" }
  >;
  changed.contextBlocks![0]!.content += " ";
  expect(await transcriptEntryHash(changed)).not.toBe(before);
  expect(validateTranscriptEntry(entry)).toEqual(entry);
});

it.each(["range", "size", "role", "kind"])(
  "refuses malformed or unbounded %s captures before accepting a saved message",
  (fault) => {
    const entry = user() as Extract<TranscriptEntry, { type: "message" }>;
    const block = entry.contextBlocks![0]!;
    if (fault === "range") {
      const content = JSON.parse(block.content);
      content.comments[0].anchor.to = 5;
      block.content = JSON.stringify(content);
    } else if (fault === "size") block.content = "x".repeat(65_536);
    else if (fault === "role") entry.role = "assistant";
    else Object.assign(block, { kind: "file-context" });
    expect(() => validateTranscriptEntry(entry)).toThrow();
  },
);

it("restores only exact acknowledged historical threads without turning prepared context into pending work", () => {
  const entry = user();
  const prepared = projectTranscriptToChatItems([entry]);
  expect(prepared[0]).toMatchObject({ contextDelivery: "prepared" });
  expect(restoreTranscriptComments([], prepared)).toEqual([]);
  const delivered = projectTranscriptToChatItems([
    entry,
    commentReceipt(entry.id),
  ]);
  const threads = restoreTranscriptComments([], delivered);
  expect(threads[0]).toMatchObject({
    anchor: capture.comments[0]!.anchor,
    comments: [
      {
        id: "comment",
        text: capture.comments[0]!.text,
        status: "sent",
      },
    ],
  });
  expect(restoreTranscriptComments(threads, delivered)).toBe(threads);
  expect(
    projectTranscriptToChatItems([entry, commentReceipt("another-user")])[0],
  ).toMatchObject({ contextDelivery: "prepared" });
});

it("keeps unknown provider outcomes prepared and non-retryable without an acknowledgement notice", async () => {
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  const runtime = new FakeAgentRuntime({ trace: "rich" });
  const start = runtime.start.bind(runtime);
  vi.spyOn(runtime, "start").mockImplementation(async (request) => {
    const session = await start(request);
    vi.spyOn(session, "send").mockRejectedValueOnce(
      Object.assign(new Error("Unknown provider outcome"), {
        outcome: "unknown",
      }),
    );
    return session;
  });
  const controller = new AiChatController(runtime, null, [], {
    repository,
    createConversation: () => ({ scopeDir: "Notes" }),
  });
  await controller.submit("", {
    contextBlocks: transcriptCommentContext(capture),
  });
  await controller.close();
  const saved = await repository.read(controller.location!);
  expect(saved.metadata.pendingTurn).toBeDefined();
  expect(saved.transcript.some(isCommentReceipt)).toBe(false);
  expect(
    saved.transcript.filter((entry) => entry.type === "error"),
  ).toContainEqual(expect.objectContaining({ retryable: false }));
  expect(
    restoreTranscriptComments(
      [],
      projectTranscriptToChatItems(saved.transcript),
    ),
  ).toEqual([]);
});

it("does not offer replay when the provider completed but local acknowledgement failed", async () => {
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  const append = repository.appendTranscript.bind(repository);
  vi.spyOn(repository, "appendTranscript").mockImplementation(
    async (location, entries) => {
      if (entries.some(isCommentReceipt)) throw new Error("Fixture disk full");
      return append(location, entries);
    },
  );
  const controller = new AiChatController(
    new FakeAgentRuntime({ trace: "rich" }),
    null,
    [],
    {
      repository,
      createConversation: () => ({ scopeDir: "Notes" }),
    },
  );
  expect(
    await controller.submit("", {
      contextBlocks: transcriptCommentContext(capture),
    }),
  ).toBeUndefined();
  await controller.close();
  const saved = await repository.read(controller.location!);
  expect(saved.transcript.some(isCommentReceipt)).toBe(false);
  expect(controller.items).toContainEqual(
    expect.objectContaining({ type: "error", retryable: false }),
  );
});

it("moves an exact live queued comment to sent only after its durable acknowledgement", () => {
  const entry = user();
  const delivered = projectTranscriptToChatItems([
    entry,
    commentReceipt(entry.id),
  ]);
  const sent = restoreTranscriptComments([], delivered);
  const queued = sent.map((t) => ({
    ...t,
    comments: t.comments.map((c) => ({ ...c, status: "queued" as const })),
  }));
  expect(
    restoreTranscriptComments(queued, projectTranscriptToChatItems([entry])),
  ).toBe(queued);
  expect(
    restoreTranscriptComments(queued, delivered)[0]?.comments[0]?.status,
  ).toBe("sent");
});

it("an explicit cancelled queue returns only its matching live comments to drafts", async () => {
  const { reclaimQueuedCommentDrafts } = await import(
    "../../../src/lib/ai/chat/restored-comments.ts"
  );
  const entry = user();
  const sent = restoreTranscriptComments(
    [],
    projectTranscriptToChatItems([entry, commentReceipt(entry.id)]),
  );
  const queued = sent.map((t) => ({
    ...t,
    comments: t.comments.map((c) => ({ ...c, status: "queued" as const })),
  }));
  expect(
    reclaimQueuedCommentDrafts(queued, entry.contextBlocks)[0]?.comments[0]
      ?.status,
  ).toBe("draft");
  expect(
    reclaimQueuedCommentDrafts(sent, entry.contextBlocks)[0]?.comments[0]
      ?.status,
  ).toBe("sent");
});
