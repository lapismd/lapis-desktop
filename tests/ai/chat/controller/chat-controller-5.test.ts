import {
  createResumableRuntime,
  pendingApprovals,
} from "../../support/controller-runtime.ts";
import { describe, expect, it, vi } from "vitest";
import { FakeAgentRuntime } from "../../support/fake-runtime.ts";
import type {
  AgentCapabilities,
  AgentRequest,
  AgentRuntime,
  AgentSession,
} from "../../../../src/lib/ai/core/runtime.ts";
import type { AgentEvent } from "../../../../src/lib/ai/core/events.ts";
import { createMemorySessionStore } from "../../../../src/lib/ai/sessions/session-store.ts";
import {
  ConversationRepository,
  type CreateConversationInput,
} from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { transcriptEntryHash } from "../../../../src/lib/ai/conversations/hashes.ts";
import {
  CONVERSATION_SCHEMA_VERSION,
  type AgentBindingRecord,
  type ConversationLocation,
  type TranscriptEntry,
} from "../../../../src/lib/ai/conversations/types.ts";
import { AiChatController } from "../../../../src/lib/ai/chat/chat-controller.svelte.ts";
import type {
  AppToolBridgeCoordinator,
  AppToolBridgeEvent,
} from "../../../../src/lib/ai/tools/app-tool-bridge.ts";

describe("AiChatController", () => {
  it("keeps the previous binding active when the prepared target rejects the prompt", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const codex = new FakeAgentRuntime({ id: "acp-codex" });
    const failing: AgentRuntime = {
      id: "acp-cursor",
      capabilities: () => codex.capabilities(),
      async supports() {
        return true;
      },
      async start() {
        return {
          id: "cursor-prepared",
          async *events() {},
          async send() {
            throw new Error("Cursor rejected the prompt");
          },
          async respondToApproval() {},
          async close() {},
        };
      },
    };
    const controller = new AiChatController(codex, null, [], {
      repository,
      createConversation: () => ({
        id: "123e4567-e89b-42d3-a456-426614174000",
        scopeDir: "",
      }),
      selectRuntime: async (request) =>
        request.agent === "cursor" ? failing : codex,
      request: { agent: "codex" },
    });
    await controller.submit("first", { agent: "codex" });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    const before = await repository.read(controller.location!);

    await controller.submit("switch", { agent: "cursor" });

    expect(controller.error).toBe("Cursor rejected the prompt");
    const after = await repository.read(controller.location!);
    expect(after.metadata.activeAgentBindingId).toBe(
      before.metadata.activeAgentBindingId,
    );
    expect(
      after.agents.filter((record) => record.type === "binding.created"),
    ).toHaveLength(1);
    expect(after.transcript).not.toContainEqual(
      expect.objectContaining({ type: "agent.switch", toAgent: "cursor" }),
    );
    await controller.close();
  });

  it("resumes the original binding with only the verified switch-back delta", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const codex = new FakeAgentRuntime({ id: "acp-codex" });
    const cursor = new FakeAgentRuntime({ id: "acp-cursor" });
    const controller = new AiChatController(codex, null, [], {
      repository,
      createConversation: () => ({
        id: "123e4567-e89b-42d3-a456-426614174000",
        scopeDir: "",
      }),
      selectRuntime: async (request) =>
        request.agent === "cursor" ? cursor : codex,
      request: { agent: "codex" },
    });

    await controller.submit("codex one", { agent: "codex" });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await controller.submit("cursor one", { agent: "cursor" });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await controller.submit("codex again", { agent: "codex" });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await vi.waitFor(async () => {
      expect(
        (await repository.read(controller.location!)).agents.filter(
          (record) => record.type === "binding.created",
        ),
      ).toHaveLength(2);
    });

    const beforeActivation = await repository.read(controller.location!);
    const codexBinding = beforeActivation.agents.find(
      (record) => record.type === "binding.created" && record.agent === "codex",
    );
    await vi.waitFor(async () => {
      expect(
        (await repository.read(controller.location!)).metadata
          .activeAgentBindingId,
      ).toBe(codexBinding?.id);
    });
    const snapshot = await repository.read(controller.location!);
    expect(snapshot.metadata.activeAgentBindingId).toBe(codexBinding?.id);
    expect(codex.sessions).toHaveLength(2);
    expect(codex.sessions[1]?.id).toBe(codex.sessions[0]?.id);
    expect(codex.sessions[1]?.contextBlocks[0]?.[0]).toMatchObject({
      kind: "conversation-handoff",
      metadata: { projectionMode: "delta" },
      content: expect.stringContaining("cursor one"),
    });
    expect(codex.sessions[1]?.contextBlocks[0]?.[0]?.content).not.toContain(
      "codex one",
    );
    await controller.submit("codex stays", { agent: "codex" });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(codex.sessions[1]?.contextBlocks[1]).toEqual([]);
    expect(
      snapshot.agents.filter((record) => record.type === "binding.created"),
    ).toHaveLength(2);
    expect(
      snapshot.transcript.filter((entry) => entry.type === "agent.switch"),
    ).toHaveLength(2);
    await controller.close();
  });

  it("attributes late events to their producing binding without changing the active UI", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    let releaseLate!: (event: AgentEvent) => void;
    const lateEvent = new Promise<AgentEvent>((resolve) => {
      releaseLate = resolve;
    });
    const capabilities = new FakeAgentRuntime().capabilities();
    const codex: AgentRuntime = {
      id: "acp-codex",
      capabilities: () => capabilities,
      async supports() {
        return true;
      },
      async start() {
        return {
          id: "codex-native-session",
          async *events() {
            yield await lateEvent;
            yield { type: "completed" as const };
          },
          async send() {},
          async respondToApproval() {},
          async cancel() {},
          async close() {},
        };
      },
    };
    const cursor = createResumableRuntime("acp-cursor").runtime;
    const controller = new AiChatController(codex, null, [], {
      repository,
      createConversation: () => ({
        id: "123e4567-e89b-42d3-a456-426614174000",
        scopeDir: "",
      }),
      selectRuntime: async (request) =>
        request.agent === "cursor" ? cursor : codex,
      request: { agent: "codex" },
    });

    await controller.submit("start codex", { agent: "codex" });
    await controller.cancelAndSwitch({ agent: "cursor" });
    releaseLate({ type: "text", text: "late codex output" });
    await vi.waitFor(async () => {
      expect(
        JSON.stringify(
          (await repository.read(controller.location!)).transcript,
        ),
      ).toContain("late codex output");
    });
    expect(JSON.stringify(controller.items)).not.toContain("late codex output");
    const snapshot = await repository.read(controller.location!);
    const codexBindingId = snapshot.agents.find(
      (record) => record.type === "binding.created" && record.agent === "codex",
    )?.id;
    expect(
      snapshot.transcript.find(
        (entry) =>
          entry.type === "message" && entry.text === "late codex output",
      )?.agentBindingId,
    ).toBe(codexBindingId);
    await controller.close();
  });

  it("persists runtime allow-always in conversation metadata and skips the next drawer", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = {
      scopeDir: "",
      conversationId: "123e4567-e89b-42d3-a456-426614174000",
    };
    const runtime = new FakeAgentRuntime({ requireApproval: true });
    const controller = new AiChatController(runtime, null, [], {
      repository,
      createConversation: () => ({
        id: location.conversationId,
        scopeDir: location.scopeDir,
      }),
    });
    const firstTurn = controller.submit("first tool call");
    await vi.waitFor(() => {
      expect(pendingApprovals(controller)).toHaveLength(1);
    });
    const first = pendingApprovals(controller)[0];
    await controller.respondToApproval(first.request.id, "allow-always");
    await firstTurn;
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(
      (await repository.read(controller.location!)).metadata.approvalGrants,
    ).toEqual([{ name: "fake.echo", decision: "allow-always" }]);

    await controller.submit("second tool call");
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(runtime.sessions[0]?.prompts).toEqual([
      "first tool call",
      "second tool call",
    ]);
    expect(pendingApprovals(controller)).toHaveLength(0);

    await controller.close();
    const restoredRuntime = new FakeAgentRuntime({ requireApproval: true });
    const restored = new AiChatController(restoredRuntime, null, [], {
      repository,
      location: controller.location,
    });
    await restored.restore();
    await restored.submit("restored tool call");
    await vi.waitFor(() => expect(restored.busy).toBe(false));
    expect(restoredRuntime.sessions[0]?.prompts).toEqual([
      "restored tool call",
    ]);
    expect(pendingApprovals(restored)).toHaveLength(0);
    await restored.close();
  });

  it("does not persist allow-once, so the next matching request stays pending", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const controller = new AiChatController(
      new FakeAgentRuntime({ requireApproval: true }),
      null,
      [],
      {
        repository,
        createConversation: () => ({
          id: "123e4567-e89b-42d3-a456-426614174000",
          scopeDir: "",
        }),
      },
    );
    const firstTurn = controller.submit("once");
    await vi.waitFor(() => {
      expect(pendingApprovals(controller)).toHaveLength(1);
    });
    await controller.respondToApproval(
      pendingApprovals(controller)[0].request.id,
      "allow-once",
    );
    await firstTurn;
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(
      (await repository.read(controller.location!)).metadata.approvalGrants,
    ).toBeUndefined();
    const secondTurn = controller.submit("again");
    await vi.waitFor(() => {
      expect(pendingApprovals(controller)).toHaveLength(1);
    });
    await controller.respondToApproval(
      pendingApprovals(controller)[0].request.id,
      "allow-once",
    );
    await secondTurn;
    await controller.close();
  });
});
