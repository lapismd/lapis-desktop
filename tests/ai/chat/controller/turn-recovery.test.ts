import { expect, it, vi } from "vitest";
import { AiChatController } from "../../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { AsyncEventQueue } from "../../../../src/lib/ai/core/event-queue.ts";
import type { AgentEvent } from "../../../../src/lib/ai/core/events.ts";
import type { AgentRuntime } from "../../../../src/lib/ai/core/runtime.ts";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { FakeAgentRuntime } from "../../support/fake-runtime.ts";
import { createChatPanelActions } from "../../../../src/lib/ai/chat/panel/actions.ts";

function silentProvider() {
  const events = new AsyncEventQueue<AgentEvent>();
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const session = {
    id: "silent-provider",
    events: () => events,
    send: vi.fn((_prompt: string) => pending),
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
    capabilities: () => ({
      ...new FakeAgentRuntime().capabilities(),
      resume: false,
    }),
    supports: async () => true,
    start: vi.fn(async () => session),
  };
  return { runtime, session, events, release };
}

function fixture(store = new MemoryTranscriptStore()) {
  const repository = new ConversationRepository(store);
  const provider = silentProvider();
  const controller = new AiChatController(provider.runtime, null, [], {
    repository,
    createConversation: () => ({ scopeDir: "Notes" }),
  });
  return { store, repository, provider, controller };
}
async function submitted(value: ReturnType<typeof fixture>) {
  const sending = value.controller.submit("Keep this exact prompt");
  await vi.waitFor(() =>
    expect(value.provider.session.send).toHaveBeenCalledOnce(),
  );
  return {
    sending,
    snapshot: await value.repository.read(value.controller.location!),
  };
}

it("retains the exact authored message and intent before the provider can observe a prompt", async () => {
  const store = new MemoryTranscriptStore();
  const repository = new ConversationRepository(store);
  const provider = silentProvider();
  const controller = new AiChatController(provider.runtime, null, [], {
    repository,
    createConversation: () => ({ scopeDir: "Notes" }),
  });
  const sending = controller.submit("Keep this exact prompt");
  try {
    await vi.waitFor(() =>
      expect(provider.session.send).toHaveBeenCalledOnce(),
    );
    const saved = await repository.read(controller.location!);
    expect(saved.transcript).toContainEqual(
      expect.objectContaining({
        type: "message",
        role: "user",
        text: "Keep this exact prompt",
      }),
    );
    expect(saved.metadata).toHaveProperty("pendingTurn.userEntryId");
  } finally {
    await controller.close();
    await sending;
  }
});

it("restores a cold unknown turn read-only, without provider start/resume/send or Retry", async () => {
  const original = fixture();
  const { sending, snapshot } = await submitted(original);
  await original.controller.close();
  await sending;
  const cold = fixture(new MemoryTranscriptStore([snapshot]));
  cold.controller.location = snapshot.location;
  const writes = [
    "writeMetadata",
    "appendTranscriptEntries",
    "appendAgentRecords",
  ].map((key) => vi.spyOn(cold.store, key as "writeMetadata"));
  const resume = vi.fn();
  cold.provider.runtime.resume = resume;
  await cold.controller.restore();
  expect(cold.controller.items).toContainEqual(
    expect.objectContaining({ role: "user", text: "Keep this exact prompt" }),
  );
  const unknown = cold.controller.items.find((item) => item.type === "error");
  expect(unknown).toMatchObject({
    retryable: false,
    text: expect.stringContaining("unknown"),
  });
  const actions = createChatPanelActions(
    () => ({}),
    cold.controller,
    {} as never,
    {} as never,
  );
  expect(actions.promptForError(unknown!.id)).toBeNull();
  expect(cold.provider.runtime.start).not.toHaveBeenCalled();
  expect(resume).not.toHaveBeenCalled();
  expect(cold.provider.session.send).not.toHaveBeenCalled();
  for (const write of writes) expect(write).not.toHaveBeenCalled();
  expect(await cold.repository.read(snapshot.location)).toEqual(snapshot);
  await cold.controller.close();
});

it("continues only with a new authored prompt, retaining the prior unknown record once", async () => {
  const original = fixture();
  const { sending, snapshot } = await submitted(original);
  await original.controller.close();
  await sending;
  const cold = fixture(new MemoryTranscriptStore([snapshot]));
  cold.controller.location = snapshot.location;
  await cold.controller.restore();
  const next = cold.controller.submit("Explicit new message");
  await vi.waitFor(() =>
    expect(cold.provider.session.send).toHaveBeenCalledOnce(),
  );
  expect(cold.provider.session.send.mock.calls[0]?.[0]).toBe(
    "Explicit new message",
  );
  cold.provider.events.push({ type: "completed" });
  cold.provider.release();
  await next;
  await cold.controller.close();
  const saved = await cold.repository.read(snapshot.location);
  expect(saved.metadata.pendingTurn).toBeUndefined();
  expect(
    saved.transcript
      .filter((entry) => entry.type === "message" && entry.role === "user")
      .map((entry) => entry.text),
  ).toEqual(["Keep this exact prompt", "Explicit new message"]);
  expect(
    saved.transcript.filter((entry) => entry.id.startsWith("turn-unknown:")),
  ).toHaveLength(1);
});

it("blocks dispatch when the durable intent write fails", async () => {
  const value = fixture();
  const write = value.store.writeMetadata.bind(value.store);
  vi.spyOn(value.store, "writeMetadata").mockImplementation(
    async (location, metadata) => {
      if (metadata.pendingTurn) throw new Error("Intent disk full");
      await write(location, metadata);
    },
  );
  await value.controller.submit("Must not be dispatched");
  expect(value.provider.session.send).not.toHaveBeenCalled();
  expect(value.controller.error).toContain("Intent disk full");
  await value.controller.close();
});

it.each(["completed", "cancelled"] as const)(
  "clears a %s intent only after its transcript checkpoint, without duplicating authored text",
  async (outcome) => {
    const value = fixture();
    const { sending } = await submitted(value);
    if (outcome === "cancelled") await value.controller.cancel();
    else {
      value.provider.events.push({ type: "completed" });
      value.provider.release();
    }
    await sending;
    await vi.waitFor(async () =>
      expect(
        (await value.repository.read(value.controller.location!)).metadata
          .pendingTurn,
      ).toBeUndefined(),
    );
    await value.controller.close();
    expect(
      (
        await value.repository.read(value.controller.location!)
      ).transcript.filter(
        (entry) => entry.type === "message" && entry.role === "user",
      ),
    ).toHaveLength(1);
  },
);

it.each(["error-event", "stream-end", "send-unknown", "send-abort"] as const)(
  "retains unknown outcomes after %s and disables Retry",
  async (kind) => {
    const value = fixture();
    if (kind === "send-unknown")
      value.provider.session.send.mockRejectedValueOnce(
        new Error("Transport lost"),
      );
    if (kind === "send-abort")
      value.provider.session.send.mockRejectedValueOnce(
        new DOMException("Transport aborted", "AbortError"),
      );
    const { sending } = await submitted(value);
    if (kind === "error-event")
      value.provider.events.push({
        type: "error",
        error: new Error("Transport lost"),
      });
    if (kind === "stream-end") value.provider.events.close();
    value.provider.release();
    await sending;
    await vi.waitFor(() =>
      expect(value.controller._recoveredTurn).toBeDefined(),
    );
    await value.controller.close();
    const snapshot = await value.repository.read(value.controller.location!);
    expect(snapshot.metadata.pendingTurn).toBeDefined();
    expect(
      snapshot.transcript
        .filter((entry) => entry.type === "error")
        .every((entry) => entry.retryable === false),
    ).toBe(true);
  },
);

it("clears a definite rejection even when close ends the event stream first", async () => {
  const value = fixture();
  value.provider.session.send.mockRejectedValueOnce(
    Object.assign(new Error("Rejected"), { outcome: "rejected" }),
  );
  await value.controller.submit("Rejected submission");
  await value.controller.close();
  expect(
    (await value.repository.read(value.controller.location!)).metadata
      .pendingTurn,
  ).toBeUndefined();
});

it.each(["cancel", "close"] as const)(
  "%s during delayed intent IO drains preparation without late dispatch",
  async (action) => {
    const value = fixture();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const write = value.store.writeMetadata.bind(value.store);
    let waiting = false;
    vi.spyOn(value.store, "writeMetadata").mockImplementation(
      async (location, metadata) => {
        if (metadata.pendingTurn) {
          waiting = true;
          await gate;
        }
        await write(location, metadata);
      },
    );
    const sending = value.controller.submit("Cancelled before dispatch");
    await vi.waitFor(() => expect(waiting).toBe(true));
    const stopping = value.controller[action]();
    release();
    await stopping;
    await sending;
    expect(value.provider.session.send).not.toHaveBeenCalled();
    expect(
      (await value.repository.read(value.controller.location!)).metadata
        .pendingTurn,
    ).toBeUndefined();
    await value.controller.close();
  },
);
