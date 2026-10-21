import { expect, it, vi } from "vitest";
import { AiChatController } from "../../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { AcpAgentRuntime } from "../../../../src/lib/ai/runtimes/acp/runtime.ts";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { projectAiTranscript } from "../../../../src/lib/ai/chat/transcript-projection.ts";
import { recipientFromOption } from "../../../../src/lib/ai/conversations/recipients.ts";
import { acpFixture } from "../../../fixtures/ai/acp-transport.mjs";

function setup() {
  const transport = acpFixture();
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  const controller = new AiChatController(
    new AcpAgentRuntime(transport.backend),
    null,
    [],
    {
      repository,
      createConversation: () => ({
        scopeDir: "Notes",
        launchNotePath: "Notes/alpha.md",
      }),
      request: { agent: "agent" },
      readVaultText: async (path) =>
        path === "Notes/.lapis/AGENTS.md"
          ? "Keep headings descriptive."
          : undefined,
    },
  );
  const preview = () =>
    projectAiTranscript(
      controller.items,
      controller.bindings,
      [],
      controller.sentContexts?.value,
    )
      .filter((item) => item.role === "user")
      .at(-1)?.sentContext;
  const prompts = () =>
    transport.calls.filter(
      (call: unknown[]) =>
        call[0] === "submit" &&
        (call[3] as { type?: string })?.type === "prompt",
    );
  const idle = async () => {
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await controller._terminalCheckpoint;
  };
  return { transport, repository, controller, preview, prompts, idle };
}

it("shows exact startup context as prepared, then sent, without persisting raw snapshots", async () => {
  const f = setup();
  let finish!: () => void;
  const held = new Promise<void>((resolve) => (finish = resolve));
  f.transport.onPrompt = async (id: string, request: string) => {
    await held;
    f.transport.emit(id, "record", request, {
      record: { status: "completed", stopReason: "end_turn" },
    });
  };
  try {
    const sending = f.controller.submit("Review these notes", {
      agentProfile: {
        name: "Reviewer",
        instructions: "Check the headings first.",
      },
    });
    await vi.waitFor(() => expect(f.prompts()).toHaveLength(1));
    const wire = f.prompts()[0]![3].context;
    expect(wire).toContain("Keep headings descriptive.");
    expect(wire).toContain("Check the headings first.");
    expect(f.preview()).toMatchObject({ content: wire, delivery: "prepared" });
    finish();
    expect(await sending).toBe(true);
    await f.idle();
    expect(f.preview()).toMatchObject({ content: wire, delivery: "sent" });
    const stored = JSON.stringify(
      await f.repository.read(f.controller.location!),
    );
    expect(stored).not.toContain("Keep headings descriptive.");
    expect(stored).not.toContain("Check the headings first.");
    expect(
      f.controller.items.find(
        (item) => item.type === "message" && item.role === "user",
      ),
    ).toMatchObject({ text: "Review these notes" });
  } finally {
    finish();
    await f.controller.close();
    expect(f.controller.sentContexts.value).toEqual({});
  }
});

it("shows a new exact handoff when the logical agent changes and retains the previous capture", async () => {
  const f = setup();
  const recipient = (id: string) =>
    recipientFromOption({ id, label: id, agent: "codex" });
  try {
    await f.controller.submit("Earlier request for the reviewer", {
      recipients: [recipient("Reviewer")],
    });
    await f.idle();
    const first = f.preview();
    await f.controller.submit("Continue with the writer", {
      recipients: [recipient("Writer")],
    });
    await f.idle();
    const wire = f.prompts()[1]![3].context;
    expect(wire).toContain("Earlier request for the reviewer");
    expect(wire).toContain("lapis-handoff-evidence");
    expect(f.preview()).toMatchObject({ content: wire, delivery: "sent" });
    expect(
      projectAiTranscript(
        f.controller.items,
        f.controller.bindings,
        [],
        f.controller.sentContexts.value,
      ).find((item) => item.role === "user")?.sentContext,
    ).toEqual(first);
  } finally {
    await f.controller.close();
  }
});

it("retains unknown context delivery when the native prompt acknowledgement is lost", async () => {
  const f = setup();
  f.transport.unknown = true;
  try {
    await f.controller.submit("A prompt with an unknown outcome");
    expect(f.preview()).toMatchObject({
      content: f.prompts()[0]![3].context,
      delivery: "unknown",
    });
    expect(f.prompts()).toHaveLength(1);
  } finally {
    await f.controller.close();
  }
});

it("retains separate captured context for each recipient of one message", async () => {
  const f = setup();
  const recipients = ["Reviewer", "Writer"].map((id) =>
    recipientFromOption({ id, label: id, agent: "codex" }),
  );
  try {
    await f.controller.submit("Review and revise", {
      recipients,
      deliveryTargets: recipients.map((recipient) => ({
        recipient,
        request: {
          agent: "agent",
          agentProfile: {
            name: recipient.label,
            instructions: `Act as ${recipient.label}.`,
          },
        },
      })),
    });
    await f.idle();
    const raw = JSON.parse(f.preview()!.rawContent!);
    expect(raw).toHaveLength(2);
    expect(raw.map((capture: { content: string }) => capture.content)).toEqual(
      f
        .prompts()
        .map((call: unknown[]) => (call[3] as { context: string }).context),
    );
    expect(raw.map((capture: { label: string }) => capture.label)).toEqual([
      "Reviewer",
      "Writer",
    ]);
    expect(f.preview()!.delivery).toBe("sent");
  } finally {
    await f.controller.close();
  }
});
