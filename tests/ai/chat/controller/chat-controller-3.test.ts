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
  it("renders local conversation data before a delayed native resume", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = {
      scopeDir: "",
      conversationId: "123e4567-e89b-42d3-a456-426614174000",
    };
    await repository.create({
      id: location.conversationId,
      scopeDir: "",
      now: "2026-08-16T00:00:00.000Z",
    });
    await repository.appendAgentRecords(location, [
      {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: "binding-1",
        type: "binding.created",
        createdAt: "2026-08-16T00:00:00.000Z",
        runtime: "delayed",
        agent: "codex",
        nativeSessionId: "native-1",
      },
    ]);
    const assistantEntry: TranscriptEntry = {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id: "m1",
      type: "message",
      role: "assistant",
      text: "Available locally",
      createdAt: "2026-08-16T00:00:00.000Z",
      agentBindingId: "binding-1",
    };
    await repository.appendTranscript(location, [assistantEntry]);
    await repository.appendAgentRecords(location, [
      {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: "context-1",
        type: "binding.context.updated",
        createdAt: "2026-08-16T00:00:01.000Z",
        agentBindingId: "binding-1",
        throughEntryId: assistantEntry.id,
        throughEntryHash: await transcriptEntryHash(assistantEntry),
        cause: "native-turn",
      },
    ]);
    let finishResume!: (session: AgentSession) => void;
    const resume = new Promise<AgentSession>((resolve) => {
      finishResume = resolve;
    });
    const runtime: AgentRuntime = {
      id: "delayed",
      capabilities: () => new FakeAgentRuntime().capabilities(),
      async supports() {
        return true;
      },
      async start() {
        throw new Error("not used");
      },
      async resume() {
        return resume;
      },
    };
    const controller = new AiChatController(runtime, null, [], {
      repository,
      location,
      request: { agent: "codex" },
    });
    const restoring = controller.restore();
    await vi.waitFor(() => {
      expect(controller.items[0]).toMatchObject({ text: "Available locally" });
    });
    finishResume({
      id: "native-1",
      async *events() {},
      async send() {},
      async respondToApproval() {},
      async close() {},
    });
    await restoring;
    await controller.close();
  });

  it("replaces a legacy binding without a verified cursor on its next turn", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = {
      scopeDir: "",
      conversationId: "123e4567-e89b-42d3-a456-426614174000",
    };
    await repository.create({ ...location, id: location.conversationId });
    await repository.appendAgentRecords(location, [
      {
        schemaVersion: 2,
        id: "legacy-binding",
        type: "binding.created",
        createdAt: "2026-08-16T00:00:00.000Z",
        runtime: "legacy-runtime",
        agent: "codex",
        nativeSessionId: "legacy-native",
      },
    ]);
    await repository.appendTranscript(location, [
      {
        schemaVersion: 2,
        id: "legacy-message",
        type: "message",
        role: "assistant",
        text: "Legacy local evidence",
        createdAt: "2026-08-16T00:00:01.000Z",
        agentBindingId: "legacy-binding",
      },
    ]);
    const resumable = createResumableRuntime("legacy-runtime");
    const controller = new AiChatController(resumable.runtime, null, [], {
      repository,
      location,
      request: { agent: "codex" },
    });

    await controller.restore();
    expect(resumable.resumes()).toBe(0);
    await controller.submit("continue", { agent: "codex" });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await vi.waitFor(async () => {
      expect(
        (await repository.read(location)).agents.filter(
          (record) => record.type === "binding.created",
        ),
      ).toHaveLength(2);
    });

    const snapshot = await repository.read(location);
    expect(resumable.starts()).toBe(1);
    expect(
      snapshot.agents.filter((record) => record.type === "binding.created"),
    ).toHaveLength(2);
    expect(snapshot.transcript).toContainEqual(
      expect.objectContaining({
        type: "agent.switch",
        fromBindingId: "legacy-binding",
        handoffMode: "full",
      }),
    );
    await controller.close();
  });

  it("records final usage in the binding log without transcript pollution", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const id = "123e4567-e89b-42d3-a456-426614174000";
    const capabilities = new FakeAgentRuntime().capabilities();
    const runtime: AgentRuntime = {
      id: "usage-local",
      capabilities: () => capabilities,
      async supports() {
        return true;
      },
      async start() {
        return {
          id: "usage-native",
          async *events() {
            yield { type: "usage" as const, usage: { used: 12, limit: 100 } };
            yield { type: "completed" as const };
          },
          async send() {},
          async respondToApproval() {},
          async close() {},
        };
      },
    };
    const controller = new AiChatController(runtime, null, [], {
      repository,
      createConversation: () => ({ id, scopeDir: "" }),
    });
    await controller.submit("usage");
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await vi.waitFor(async () => {
      expect(
        (await repository.read(controller.location!)).agents.find(
          (record) => record.type === "usage.updated",
        ),
      ).toMatchObject({
        type: "usage.updated",
        usage: { used: 12, limit: 100 },
      });
    });
    const snapshot = await repository.read(controller.location!);
    expect(JSON.stringify(snapshot.transcript)).not.toContain("usage.updated");
    await controller.close();
  });

  it("configures the model in place without changing conversation or binding", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const runtime = new FakeAgentRuntime();
    const controller = new AiChatController(runtime, null, [], {
      repository,
      createConversation: () => ({
        id: "123e4567-e89b-42d3-a456-426614174000",
        scopeDir: "",
      }),
      request: {
        agent: "codex",
        model: { provider: "codex", model: "first" },
      },
    });
    await controller.submit("first", {
      agent: "codex",
      model: { provider: "codex", model: "first" },
    });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await controller.submit("second", {
      agent: "codex",
      model: { provider: "codex", model: "second" },
    });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await vi.waitFor(async () => {
      expect(
        (await repository.read(controller.location!)).agents.filter(
          (record) => record.type === "binding.created",
        ),
      ).toHaveLength(1);
    });

    const snapshot = await repository.read(controller.location!);
    expect(runtime.sessions).toHaveLength(1);
    expect(runtime.sessions[0]?.configurations).toEqual([
      { model: { provider: "codex", model: "second" } },
    ]);
    expect(
      snapshot.agents.filter((record) => record.type === "binding.created"),
    ).toHaveLength(1);
    expect(snapshot.agents).toContainEqual(
      expect.objectContaining({ type: "binding.config.updated" }),
    );
    expect(snapshot.transcript).toContainEqual(
      expect.objectContaining({ type: "agent.config" }),
    );
    expect(snapshot.transcript).not.toContainEqual(
      expect.objectContaining({ type: "agent.switch" }),
    );
    await controller.close();
  });

  it("replaces the binding with a full handoff when configuration is unsupported", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const runtime = new FakeAgentRuntime();
    const controller = new AiChatController(runtime, null, [], {
      repository,
      createConversation: () => ({
        id: "123e4567-e89b-42d3-a456-426614174000",
        scopeDir: "",
      }),
      request: {
        agent: "codex",
        model: { provider: "codex", model: "first" },
      },
    });
    await controller.submit("first evidence", {
      agent: "codex",
      model: { provider: "codex", model: "first" },
    });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    runtime.sessions[0]!.configure = async () => ({
      model: { status: "unsupported", reason: "not mutable" },
    });

    await controller.submit("second", {
      agent: "codex",
      model: { provider: "codex", model: "second" },
    });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await vi.waitFor(async () => {
      expect(
        (await repository.read(controller.location!)).agents.filter(
          (record) => record.type === "binding.created",
        ),
      ).toHaveLength(2);
    });

    expect(runtime.sessions).toHaveLength(2);
    expect(runtime.sessions[1]?.contextBlocks[0]?.[0]).toMatchObject({
      kind: "conversation-handoff",
      metadata: { projectionMode: "full" },
      content: expect.stringContaining("first evidence"),
    });
    const snapshot = await repository.read(controller.location!);
    expect(
      snapshot.agents.filter((record) => record.type === "binding.created"),
    ).toHaveLength(2);
    expect(snapshot.transcript).toContainEqual(
      expect.objectContaining({ type: "agent.switch" }),
    );
    await controller.close();
  });

  it("does not persist an in-place configuration until the prompt is accepted", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const runtime = new FakeAgentRuntime();
    const controller = new AiChatController(runtime, null, [], {
      repository,
      createConversation: () => ({
        id: "123e4567-e89b-42d3-a456-426614174000",
        scopeDir: "",
      }),
      request: {
        agent: "codex",
        model: { provider: "codex", model: "first" },
      },
    });
    await controller.submit("first", {
      agent: "codex",
      model: { provider: "codex", model: "first" },
    });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    const activeBefore = (await repository.read(controller.location!)).metadata
      .activeAgentBindingId;
    runtime.sessions[0]!.send = async () => {
      throw new Error("provider rejected configured turn");
    };

    await controller.submit("second", {
      agent: "codex",
      model: { provider: "codex", model: "second" },
    });

    expect(controller.error).toBe("provider rejected configured turn");
    const snapshot = await repository.read(controller.location!);
    expect(snapshot.metadata.activeAgentBindingId).toBe(activeBefore);
    expect(snapshot.agents).not.toContainEqual(
      expect.objectContaining({ type: "binding.config.updated" }),
    );
    expect(snapshot.transcript).not.toContainEqual(
      expect.objectContaining({ type: "agent.config" }),
    );
    await controller.close();
  });
});
