import { expect, it, vi } from "vitest";
import { AiChatController } from "../../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { recipientFromOption } from "../../../../src/lib/ai/conversations/recipients.ts";
import { FakeAgentRuntime } from "../../support/fake-runtime.ts";
const recipients = ["reviewer", "writer"].map((id) =>
  recipientFromOption({ id, label: id, agent: "codex" }),
);
function fixture() {
  const runtime = new FakeAgentRuntime({ id: "acp" });
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  const controller = new AiChatController(runtime, null, [], {
    repository,
    createConversation: () => ({ scopeDir: "Notes" }),
    request: { agent: "codex" },
  });
  const request = {
    recipients,
    deliveryTargets: recipients.map((recipient) => ({
      recipient,
      request: { agent: "codex" },
    })),
  };
  return { runtime, repository, controller, request };
}
it("delivers one authored message to two independent recipients with separate saved outcomes", async () => {
  const { runtime, repository, controller, request } = fixture();
  try {
    expect(await controller.submit("Review this note", request)).toBe(true);
    const saved = await repository.read(controller.location!);
    const users = saved.transcript.filter(
      (e) => e.type === "message" && e.role === "user",
    );
    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({ text: "Review this note", recipients });
    expect(runtime.sessions.map((s) => s.prompts)).toEqual([
      ["Review this note"],
      ["Review this note"],
    ]);
    expect(
      saved.transcript.filter(
        (e) => e.type === "agent.delivery" && e.delivery.state === "completed",
      ),
    ).toHaveLength(2);
    expect(saved.metadata.pendingDispatch).toBeUndefined();
  } finally {
    await controller.close();
  }
});
it("cancellation retains uncertainty for the started recipient and never prompts the remaining recipient", async () => {
  const { runtime, repository, controller, request } = fixture();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const start = runtime.start.bind(runtime);
  vi.spyOn(runtime, "start").mockImplementation(async (r) => {
    const s = await start(r);
    s.send = async () => {
      await gate;
    };
    return s;
  });
  const sending = controller.submit("Do not replay", request);
  void sending.catch(() => {});
  try {
    await vi.waitFor(async () =>
      expect(
        (await repository.read(controller.location!)).metadata.pendingDispatch
          ?.deliveries[0]?.state,
      ).toBe("started"),
    );
    await vi.waitFor(() => {
      const activeMessage = controller.items.find(
        (e) => e.type === "message" && e.role === "user",
      );
      expect(
        activeMessage?.type === "message" &&
          activeMessage.deliveries?.map((d) => d.state),
      ).toEqual(["started", "pending"]);
    });
    await controller.cancel();
    release();
    await sending;
    expect(runtime.sessions).toHaveLength(1);
    const location = controller.location!;
    await controller.close();
    const before = JSON.stringify(await repository.read(location));
    const coldRuntime = new FakeAgentRuntime({ id: "acp" });
    const restored = new AiChatController(coldRuntime, null, [], {
      repository,
      location,
    });
    try {
      await restored.restore();
      expect(coldRuntime.sessions).toHaveLength(0);
      expect(JSON.stringify(await repository.read(location))).toBe(before);
      const message = restored.items.find(
        (e) => e.type === "message" && e.role === "user",
      );
      expect(
        message?.type === "message" && message.deliveries?.map((d) => d.state),
      ).toEqual(["unknown", "cancelled"]);
    } finally {
      await restored.close();
    }
  } finally {
    if (controller._activeDispatch) await controller.cancel();
    release();
    await sending.catch(() => {});
    await controller.close();
  }
});

it("withholds every provider prompt when the started journal checkpoint fails", async () => {
  const runtime = new FakeAgentRuntime({ id: "acp" });
  const store = new MemoryTranscriptStore();
  const repository = new ConversationRepository(store);
  const write = store.writeMetadata.bind(store);
  let refused = false;
  vi.spyOn(store, "writeMetadata").mockImplementation(
    async (location, metadata) => {
      if (
        !refused &&
        metadata.pendingDispatch?.deliveries.some((d) => d.state === "started")
      ) {
        refused = true;
        throw new Error("Delivery journal unavailable");
      }
      await write(location, metadata);
    },
  );
  const controller = new AiChatController(runtime, null, [], {
    repository,
    createConversation: () => ({ scopeDir: "Notes" }),
    request: { agent: "codex" },
  });
  try {
    expect(
      await controller.submit("Never send before saving", {
        recipients,
        deliveryTargets: recipients.map((recipient) => ({
          recipient,
          request: { agent: "codex" },
        })),
      }),
    ).toBe(false);
    expect(runtime.sessions.flatMap((s) => s.prompts)).toEqual([]);
    expect(runtime.sessions).toHaveLength(1);
  } finally {
    await controller.close();
  }
});
