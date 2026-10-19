import { expect, it, vi } from "vitest";
import { AiChatController } from "../../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { AcpAgentRuntime } from "../../../../src/lib/ai/runtimes/acp/runtime.ts";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { acpFixture } from "../../../fixtures/ai/acp-transport.mjs";
import { deferred, fixture } from "../../native/app-tools-fixture.ts";

it("keeps the local turn pending until tool callback and transcript publication complete", async () => {
  const acp = acpFixture();
  const tools = fixture();
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  const saved = deferred();
  tools.bridge.subscribe(async ({ event }) => {
    if (event.type === "tool.end") await saved.promise;
  });
  const runtime = new AcpAgentRuntime({
    ...acp.backend,
    tools: {
      target: (_descriptor, base) => base,
      arm: (id, turn) => tools.bridge.arm(id, turn),
      end: (id, turn) => tools.bridge.end(id, turn),
    },
  });
  const start = vi.spyOn(runtime, "start");
  const controller = new AiChatController(runtime, null, [], {
    repository,
    createConversation: () => ({ scopeDir: "Notes" }),
    request: { agent: "agent" },
    appToolBridge: tools.bridge,
  });
  let prepared = false;
  acp.onPrompt = async (id: string, requestId: string) => {
    const snapshot = await repository.read(controller.location!);
    expect(snapshot.metadata.pendingTurn).toBeDefined();
    expect(
      snapshot.transcript.some(
        (e) =>
          e.type === "message" &&
          e.role === "user" &&
          e.text === "Read the note",
      ),
    ).toBe(true);
    prepared = true;
    const descriptor = start.mock.calls[0]![0].appToolSession!;
    tools.event({
      type: "call",
      bridgeId: descriptor.bridgeId!,
      invocationId: crypto.randomUUID(),
      turnId: requestId,
      name: "notes_read",
      arguments: {},
    });
    await vi.waitFor(() => expect(tools.execute).toHaveBeenCalledOnce());
    // A terminal provider frame may arrive before our owned publication finishes.
    acp.emit(id, "record", requestId, {
      record: { status: "completed", stopReason: "end_turn" },
    });
  };
  try {
    const sending = controller.submit("Read the note");
    await vi.waitFor(() => expect(prepared).toBe(true));
    await vi.waitFor(() => expect(tools.execute).toHaveBeenCalledOnce());
    expect(
      (await repository.read(controller.location!)).metadata.pendingTurn,
    ).toBeDefined();
    expect(controller.busy).toBe(true);
    expect(tools.replies()).toHaveLength(0);
    saved.resolve();
    await sending;
    await vi.waitFor(async () =>
      expect(
        (await repository.read(controller.location!)).metadata.pendingTurn,
      ).toBeUndefined(),
    );
    const final = await repository.read(controller.location!);
    expect(final.transcript.filter((e) => e.type === "tool")).toHaveLength(1);
    expect(tools.replies()).toHaveLength(1);
  } finally {
    saved.resolve();
    await controller.close();
    await tools.bridge.close();
    tools.host.close();
  }
});

it("a failed tool drain cannot clear the local unknown intent or offer a replay", async () => {
  const acp = acpFixture();
  const tools = fixture();
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  const runtime = new AcpAgentRuntime({
    ...acp.backend,
    tools: {
      target: (_descriptor, base) => base,
      arm: (id, turn) => tools.bridge.arm(id, turn),
      end: async () => {
        throw new Error("Actual tool drain is unknown");
      },
    },
  });
  const controller = new AiChatController(runtime, null, [], {
    repository,
    createConversation: () => ({ scopeDir: "Notes" }),
    request: { agent: "agent" },
    appToolBridge: tools.bridge,
  });
  try {
    await controller.submit("One explicit prompt");
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await vi.waitFor(async () => {
      const snapshot = await repository.read(controller.location!);
      expect(snapshot.transcript).toContainEqual(
        expect.objectContaining({
          type: "error",
          id: `turn-unknown:${snapshot.metadata.pendingTurn!.id}`,
          retryable: false,
          parentId: snapshot.metadata.pendingTurn!.userEntryId,
        }),
      );
    });
    const saved = await repository.read(controller.location!);
    expect(saved.metadata.pendingTurn).toBeDefined();
    expect(saved.transcript).toContainEqual(
      expect.objectContaining({
        type: "error",
        id: `turn-unknown:${saved.metadata.pendingTurn!.id}`,
        retryable: false,
        parentId: saved.metadata.pendingTurn!.userEntryId,
      }),
    );
    expect(
      saved.transcript.filter((e) => e.type === "message" && e.role === "user"),
    ).toHaveLength(1);
    expect(
      controller.items.filter((item) => item.type === "error"),
    ).toContainEqual(expect.objectContaining({ retryable: false }));
    expect(
      acp.calls.filter(
        (call) => call[0] === "submit" && call[3].type === "prompt",
      ),
    ).toHaveLength(1);
    expect(acp.calls.filter((call) => call[0] === "close")).toHaveLength(1);
  } finally {
    await controller.close();
    await tools.bridge.close();
    tools.host.close();
  }
});
