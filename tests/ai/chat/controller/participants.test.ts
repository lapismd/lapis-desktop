import { expect, it, vi } from "vitest";
import { AiChatController } from "../../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { recipientFromOption } from "../../../../src/lib/ai/conversations/recipients.ts";
import { reduceAgentBindings } from "../../../../src/lib/ai/conversations/binding-state.ts";
import { validateAgentBindingRecord } from "../../../../src/lib/ai/conversations/binding-validation.ts";
import { projectAiTranscript } from "../../../../src/lib/ai/chat/transcript-projection.ts";
import { bindingLabels } from "../../../../src/lib/ai/chat/panel/binding-labels.ts";
import { FakeAgentRuntime } from "../../support/fake-runtime.ts";

const participant = (id: string, label = id) =>
  recipientFromOption({ id, label, agent: "codex" });
function fixture() {
  const runtime = new FakeAgentRuntime({ id: "acp", resumeSupported: true });
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  const controller = new AiChatController(runtime, null, [], {
    repository,
    createConversation: () => ({ scopeDir: "Notes" }),
    request: { agent: "codex" },
  });
  const send = async (id: string, text: string, label = id) => {
    expect(
      await controller.submit(text, { recipients: [participant(id, label)] }),
    ).toBe(true);
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await controller._terminalCheckpoint;
  };
  return { runtime, repository, controller, send };
}

it("keeps same-runtime logical participants separate and resumes only their own verified context", async () => {
  const { runtime, repository, controller, send } = fixture();
  try {
    await send("reviewer", "review one", "Reviewer");
    const reviewerBinding = controller.activeBindingId;
    await send("writer", "writer one", "Writer");
    const writerBinding = controller.activeBindingId;
    expect(writerBinding).not.toBe(reviewerBinding);
    await send("reviewer", "review again", "Reviewer");
    expect(controller.activeBindingId).toBe(reviewerBinding);
    const saved = await repository.read(controller.location!);
    const bindings = reduceAgentBindings(saved.agents);
    expect(bindings.map((binding) => binding.participant)).toEqual([
      participant("reviewer", "Reviewer"),
      participant("writer", "Writer"),
    ]);
    expect(runtime.sessions).toHaveLength(3);
    expect(runtime.sessions[2]!.id).toBe(runtime.sessions[0]!.id);
    expect(runtime.sessions[2]!.id).not.toBe(runtime.sessions[1]!.id);
    const delta = runtime.sessions[2]!.contextBlocks[0]!.find(
      (b) => b.kind === "conversation-handoff",
    );
    expect(delta).toMatchObject({ metadata: { projectionMode: "delta" } });
    expect(delta!.content).toContain("writer one");
    expect(delta!.content).toContain("Writer");
    expect(delta!.content).not.toContain("review one");
    expect(
      saved.transcript.filter(
        (entry) => entry.type === "message" && entry.role === "user",
      ),
    ).toHaveLength(3);
    expect(bindingLabels(bindings).get(reviewerBinding!)).toBe("Reviewer");
    expect(
      projectAiTranscript(controller.items, bindings)
        .filter((item) => item.role === "assistant")
        .map((item) => item.author?.name),
    ).toEqual(["Reviewer", "Writer", "Reviewer"]);
  } finally {
    await controller.close();
  }
});

it("does not merge equal display names or unaddressed messages with a named participant", async () => {
  const { repository, controller, send } = fixture();
  try {
    await send("reviewer-a", "first", "Reviewer");
    const first = controller.activeBindingId;
    await send("reviewer-b", "second", "Reviewer");
    expect(controller.activeBindingId).not.toBe(first);
    expect(await controller.submit("default Codex message")).toBe(true);
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await controller._terminalCheckpoint;
    const bindings = reduceAgentBindings(
      (await repository.read(controller.location!)).agents,
    );
    expect(bindings).toHaveLength(3);
    expect(bindings.at(-1)!.participant).toBeUndefined();
    expect(bindings.at(-1)!.agent).toBe("codex");
  } finally {
    await controller.close();
  }
});

it("retains original participant attribution on cold History without executing or trusting the saved label", async () => {
  const { repository, controller, send } = fixture();
  await send("reviewer", "review one", "Historical reviewer");
  const location = controller.location!;
  await controller.close();
  const before = JSON.stringify(await repository.read(location));
  const runtime = new FakeAgentRuntime({ id: "acp", resumeSupported: false });
  const restored = new AiChatController(runtime, null, [], {
    repository,
    location,
    request: { agent: "codex" },
  });
  try {
    await restored.restore();
    expect(runtime.sessions).toHaveLength(0);
    expect(JSON.stringify(await repository.read(location))).toBe(before);
    const assistant = projectAiTranscript(
      restored.items,
      restored.bindings,
    ).find((item) => item.role === "assistant");
    expect(assistant!.author).toMatchObject({
      id: "reviewer",
      name: "Historical reviewer",
    });
  } finally {
    await restored.close();
  }
});

it("validates participant tokens independently from runtime identity and preserves legacy bindings", () => {
  const binding = {
    schemaVersion: 3,
    type: "binding.created",
    id: "binding-one",
    runtime: "acp",
    agent: "codex",
    createdAt: "2026-10-19T00:00:00.000Z",
  };
  expect(validateAgentBindingRecord(binding)).toEqual(binding);
  expect(
    validateAgentBindingRecord({
      ...binding,
      participant: participant("reviewer"),
    }),
  ).toMatchObject({ agent: "codex", participant: { id: "reviewer" } });
  expect(() =>
    validateAgentBindingRecord({
      ...binding,
      participant: { ...participant("reviewer"), id: "writer" },
    }),
  ).toThrow(/recipient/);
});

it("keeps working status owned by the new participant while the previous session detaches", async () => {
  const { runtime, controller, send } = fixture();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let entered = false;
  let sending: Promise<boolean | undefined> | undefined;
  try {
    await send("reviewer", "first");
    const start = runtime.start.bind(runtime);
    vi.spyOn(runtime, "start").mockImplementation(async (request) => {
      const session = await start(request);
      const deliver = session.send.bind(session);
      session.send = async (...args) => {
        entered = true;
        await gate;
        await deliver(...args);
      };
      return session;
    });
    sending = controller.submit("second", {
      recipients: [participant("writer")],
    });
    await vi.waitFor(() => expect(entered).toBe(true));
    expect(controller.busy).toBe(true);
  } finally {
    release();
    await sending;
    await controller.close();
  }
});
