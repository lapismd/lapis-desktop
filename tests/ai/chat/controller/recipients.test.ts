import { expect, it, vi } from "vitest";
import { AiChatController } from "../../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { AcpAgentRuntime } from "../../../../src/lib/ai/runtimes/acp/runtime.ts";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { recipientFromOption } from "../../../../src/lib/ai/conversations/recipients.ts";
import { acpFixture } from "../../../fixtures/ai/acp-transport.mjs";

function fixture() {
  const acp = acpFixture();
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  const controller = new AiChatController(
    new AcpAgentRuntime(acp.backend),
    null,
    [],
    {
      repository,
      createConversation: () => ({ scopeDir: "Notes" }),
      request: { agent: "agent" },
    },
  );
  return { acp, repository, controller };
}
const reviewer = () =>
  recipientFromOption({ id: "reviewer", label: "Reviewer", agent: "codex" });

it("saves an immutable recipient tag before prompting while authored text and native target remain separate", async () => {
  const { acp, repository, controller } = fixture();
  const start = vi.spyOn(controller.runtime, "start");
  let inspected = false;
  acp.onPrompt = async (
    id: string,
    requestId: string,
    request: { text: string },
  ) => {
    const saved = await repository.read(controller.location!);
    const user = saved.transcript.find(
      (e) => e.id === saved.metadata.pendingTurn?.userEntryId,
    );
    expect(user).toMatchObject({
      type: "message",
      text: "Review this note",
      recipients: [reviewer()],
    });
    expect(request.text).toBe("Review this note");
    inspected = true;
    acp.emit(id, "record", requestId, { record: { status: "completed" } });
  };
  const recipients = [reviewer()];
  try {
    const sending = controller.submit("Review this note", { recipients });
    recipients[0]!.label = "Changed after explicit Send";
    await sending;
    await vi.waitFor(() => expect(inspected).toBe(true));
    expect(start.mock.calls[0]![0].recipients).toEqual([reviewer()]);
    expect(acp.calls.find((call) => call[0] === "open")[1].targetId).toBe(
      "agent",
    );
    const saved = await repository.read(controller.location!);
    expect(saved.transcript.filter((e) => e.type === "message")).toHaveLength(
      1,
    );
    expect(saved.transcript[0]).toMatchObject({ recipients: [reviewer()] });
  } finally {
    await controller.close();
  }
});

it("refuses multiple recipients before creating a message, intent or provider worker", async () => {
  const { acp, controller } = fixture();
  try {
    await expect(
      controller.submit("Do not partially send", {
        recipients: [
          reviewer(),
          recipientFromOption({
            id: "builder",
            label: "Builder",
            agent: "codex",
          }),
        ],
      }),
    ).rejects.toThrow(/Multiple-recipient/);
    expect(controller.items).toHaveLength(0);
    expect(controller.location).toBeNull();
    expect(acp.calls).toHaveLength(0);
  } finally {
    await controller.close();
  }
});
