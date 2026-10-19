import { expect, it, vi } from "vitest";
import { AiChatController } from "../../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { projectAiTranscript } from "../../../../src/lib/ai/chat/transcript-projection.ts";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { projectTranscriptToChatItems } from "../../../../src/lib/ai/conversations/transcript-to-chat.ts";
import { FakeAgentRuntime } from "../../support/fake-runtime.ts";

it.each(["echo", "rich"] as const)(
  "%s live comment anchors retain exactly the IDs restored from saved history",
  async (trace) => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const controller = new AiChatController(
      new FakeAgentRuntime({ trace }),
      null,
      [],
      {
        repository,
        createConversation: () => ({ scopeDir: "Notes" }),
      },
    );
    try {
      expect(await controller.submit("Original authored text")).toBe(true);
      await vi.waitFor(() => expect(controller.busy).toBe(false));
      await controller.close();
      const saved = await repository.read(controller.location!);
      const restored = projectTranscriptToChatItems(saved.transcript);
      const anchors = (items: typeof controller.items) =>
        projectAiTranscript(
          items.filter(
            (item) =>
              item.type === "message" ||
              (item.type === "tool" && item.state !== "running"),
          ),
        )
          .flatMap((item) => [
            ...item.blocks,
            ...(item.tools ?? []).flatMap((tool) => tool.blocks),
          ])
          .map((block) => ({
            id: block.id,
            revision: block.revision,
            text: block.text,
          }));
      expect(anchors(restored)).toEqual(anchors(controller.items));
      expect(new Set(restored.map((item) => item.id)).size).toBe(
        restored.length,
      );
      const original = saved.transcript.find(
        (entry) => entry.type === "message" && entry.role === "user",
      );
      expect(original).toMatchObject({
        id: controller.items[0]!.id,
        text: "Original authored text",
      });
    } finally {
      await controller.close();
    }
  },
);
