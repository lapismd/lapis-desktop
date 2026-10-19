import { expect, it, vi } from "vitest";
import { AiChatController } from "../../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { AsyncEventQueue } from "../../../../src/lib/ai/core/event-queue.ts";
import type { AgentEvent } from "../../../../src/lib/ai/core/events.ts";
import type { AgentRuntime } from "../../../../src/lib/ai/core/runtime.ts";
import { FakeAgentRuntime } from "../../support/fake-runtime.ts";

it.each(["cancel", "close"] as const)(
  "%s flushes already received fragments before retiring the view",
  async (action) => {
    const events = new AsyncEventQueue<AgentEvent>();
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const session = {
      id: "streaming-test",
      events: () => events,
      send: vi.fn(() => pending),
      respondToApproval: async () => {},
      cancel: async () => {
        events.push({ type: "completed", result: { status: "cancelled" } });
        release();
      },
      close: async () => {
        events.close();
        release();
      },
    };
    const runtime: AgentRuntime = {
      id: "acp",
      capabilities: () => new FakeAgentRuntime().capabilities(),
      supports: async () => true,
      start: async () => session,
    };
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const controller = new AiChatController(runtime, null, [], {
      repository,
      createConversation: () => ({ scopeDir: "Notes" }),
    });
    const sending = controller.submit("Keep streamed context");
    await vi.waitFor(() => expect(session.send).toHaveBeenCalledOnce());
    events.push({ type: "text", text: "Received " });
    events.push({ type: "text", text: "before stop" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(
      controller.items.some(
        (item) => item.type === "message" && item.role === "assistant",
      ),
    ).toBe(false);
    await controller[action]();
    expect(controller.items).toContainEqual(
      expect.objectContaining({
        role: "assistant",
        text: "Received before stop",
      }),
    );
    await sending;
    await controller.close();
    const saved = await repository.read(controller.location!);
    expect(saved.transcript).toContainEqual(
      expect.objectContaining({
        role: "assistant",
        text: "Received before stop",
      }),
    );
    expect(saved.metadata.pendingTurn).toBeUndefined();
  },
);
