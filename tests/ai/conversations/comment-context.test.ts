import { expect, it, vi } from "vitest";
import { AiChatController } from "../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { transcriptCommentContext } from "../../../src/lib/ai/chat/transcript-context.ts";
import { projectAiTranscript } from "../../../src/lib/ai/chat/transcript-projection.ts";
import { ConversationRepository } from "../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { projectTranscriptToChatItems } from "../../../src/lib/ai/conversations/transcript-to-chat.ts";
import { buildConversationContextHandoff } from "../../../src/lib/ai/conversations/context-handoff.ts";
import { FakeAgentRuntime } from "../support/fake-runtime.ts";

it.each(["", "Review these comments"])(
  "retains exact submitted comments for authored text %j through storage and handoff",
  async (text) => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const runtime = new FakeAgentRuntime({ trace: "rich" });
    const controller = new AiChatController(runtime, null, [], {
      repository,
      createConversation: () => ({ scopeDir: "Notes" }),
    });
    try {
      await controller.submit("Produce the original answer");
      await vi.waitFor(() => expect(controller.busy).toBe(false));
      const source = projectAiTranscript(controller.items).find(
        (item) => item.role === "assistant",
      )!.blocks[0]!;
      const submission = {
        id: "local-comment-submission",
        text,
        comments: [
          {
            threadId: "comment-thread",
            commentId: "comment-one",
            author: { id: "owner", name: "You" },
            text: "Use a weekly review",
            anchor: {
              blockId: source.id,
              revision: source.revision,
              from: 0,
              to: 2,
              quote: source.text.slice(0, 2),
            },
          },
        ],
      };
      const contexts = transcriptCommentContext(submission);
      expect(await controller.submit(text, { contextBlocks: contexts })).toBe(
        true,
      );
      await vi.waitFor(() => expect(controller.busy).toBe(false));
      await controller.close();
      const saved = await repository.read(controller.location!);
      const user = saved.transcript.find(
        (entry) =>
          entry.type === "message" &&
          entry.role === "user" &&
          entry.text === text,
      )!;
      expect(user).toMatchObject({ contextBlocks: contexts });
      const restored = projectTranscriptToChatItems(saved.transcript);
      expect(restored.find((item) => item.id === user.id)).toMatchObject({
        contextBlocks: contexts,
        contextDelivery: "sent",
      });
      const handoff = await buildConversationContextHandoff(saved.transcript);
      expect(handoff!.block.content).toContain("Use a weekly review");
      expect(handoff!.block.content).toContain(source.id);
      expect(runtime.sessions.flatMap((session) => session.prompts)).toEqual([
        "Produce the original answer",
        text,
      ]);
    } finally {
      await controller.close();
    }
  },
);
