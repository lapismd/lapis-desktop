import { expect, it } from "vitest";
import { projectChatItemsToTranscript } from "../../../src/lib/ai/conversations/chat-to-transcript.ts";
import { projectTranscriptToChatItems } from "../../../src/lib/ai/conversations/transcript-to-chat.ts";
import { MemoryTranscriptStore } from "../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { ConversationRepository } from "../../../src/lib/ai/conversations/conversation-repository.ts";
import type { AiChatItem } from "../../../src/lib/ai/chat/chat-items.ts";

it.each(["approval", "question"] as const)(
  "retains an owner %s response after its runtime request was already journalled",
  async (type) => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const created = await repository.create({ scopeDir: "Notes" });
    const location = { scopeDir: "Notes", conversationId: created.metadata.id };
    const source = { sessionId: "session", runId: "turn", sequence: 10 };
    const item: AiChatItem =
      type === "approval"
        ? {
            id: "approval",
            type,
            source,
            status: "pending",
            request: {
              id: "request",
              title: "Edit Note.md",
              kind: "write",
              options: [
                { id: "allow-once", label: "Allow once", kind: "allow-once" },
              ],
            },
          }
        : {
            id: "question",
            type,
            source,
            status: "pending",
            request: { id: "request", title: "Choose", questions: [] },
          };
    await repository.appendTranscript(
      location,
      projectChatItemsToTranscript([item]),
    );
    const answered: AiChatItem =
      item.type === "approval"
        ? { ...item, status: "approved", responseOptionId: "allow-once" }
        : { ...item, status: "answered" };
    await repository.appendTranscript(
      location,
      projectChatItemsToTranscript([answered]),
    );
    const saved = (await repository.read(location)).transcript;
    expect(saved.map((entry) => entry.type)).toEqual([
      `${type}.request`,
      `${type}.response`,
    ]);
    expect(saved[0]?.source).toEqual(source);
    expect(saved[1]?.source).toBeUndefined();
    expect(projectTranscriptToChatItems(saved)[0]).toMatchObject({
      status: type === "approval" ? "approved" : "answered",
      ...(type === "approval" ? { responseOptionId: "allow-once" } : {}),
    });
  },
);
