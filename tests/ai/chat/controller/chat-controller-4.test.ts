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
  it("preallocates the binding for app tools and persists it at the turn boundary", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const requests: AgentRequest[] = [];
    const capabilities = {
      ...new FakeAgentRuntime().capabilities(),
      resume: false,
    };
    const runtime: AgentRuntime = {
      id: "acp",
      capabilities: () => capabilities,
      async supports() {
        return true;
      },
      async start(request) {
        requests.push(request);
        return {
          id: `native-${requests.length}`,
          async *events() {
            yield { type: "completed" as const };
          },
          async send() {},
          async respondToApproval() {},
          async close() {},
        };
      },
    };
    const prepared: string[] = [];
    const closed: string[] = [];
    let listener: ((event: AppToolBridgeEvent) => void) | undefined;
    const appToolBridge: AppToolBridgeCoordinator = {
      async prepare(input) {
        prepared.push(input.agentBindingId);
        return {
          conversationId: input.conversationId,
          agentBindingId: input.agentBindingId,
          scopeDir: input.scopeDir,
          tools: [
            {
              registrationId: "registration-1",
              ownerPluginId: "markdown",
              name: "notes_read",
              description: "Read a note",
              inputSchema: { type: "object" },
              effect: "read",
            },
          ],
          bridgeId: `bridge-${prepared.length}`,
          status: "available",
        };
      },
      async closeBinding(bindingId) {
        closed.push(bindingId);
      },
      respondToApproval: vi.fn(() => true),
      subscribe(next) {
        listener = next;
        return () => {
          listener = undefined;
        };
      },
      async close() {},
    };
    const controller = new AiChatController(runtime, null, [], {
      repository,
      createConversation: () => ({
        id: "123e4567-e89b-42d3-a456-426614174000",
        scopeDir: "Projects/Atlas",
        launchNotePath: "Projects/Atlas/launch.md",
      }),
      request: {
        agent: "codex",
        model: { provider: "codex", model: "first" },
      },
      appToolBridge,
    });

    await controller.submit("first", {
      agent: "codex",
      model: { provider: "codex", model: "first" },
    });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await vi.waitFor(async () => {
      expect(
        (await repository.read(controller.location!)).metadata
          .activeAgentBindingId,
      ).toBe(requests[0]?.appToolSession?.agentBindingId);
    });
    const first = await repository.read(controller.location!);
    expect(requests[0]?.appToolSession).toMatchObject({
      agentBindingId: first.metadata.activeAgentBindingId,
      bridgeId: "bridge-1",
    });

    await controller.submit("second", {
      agent: "codex",
      model: { provider: "codex", model: "second" },
    });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await vi.waitFor(async () => {
      expect(
        (await repository.read(controller.location!)).metadata
          .activeAgentBindingId,
      ).toBe(prepared[1]);
    });
    const second = await repository.read(controller.location!);
    expect(prepared).toHaveLength(2);
    expect(prepared[1]).toBe(second.metadata.activeAgentBindingId);
    expect(prepared[1]).not.toBe(prepared[0]);
    expect(closed).toContain(prepared[0]!);
    expect(requests[1]?.appToolSession?.tools.map((tool) => tool.name)).toEqual(
      ["notes_read"],
    );
    expect(requests[1]?.metadata?.availableAppTools).toEqual(["notes_read"]);
    expect(listener).toBeTypeOf("function");
    await controller.close();
  });

  it("cancels a restored pending interaction when native resume is unavailable", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = {
      scopeDir: "Projects/Atlas",
      conversationId: "123e4567-e89b-42d3-a456-426614174000",
    };
    await repository.create({ ...location, id: location.conversationId });
    await repository.appendAgentRecords(location, [
      {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: "binding-1",
        type: "binding.created",
        createdAt: "2026-08-16T00:00:00.000Z",
        runtime: "fake",
        agent: "codex",
        nativeSessionId: "native-1",
      },
    ]);
    await repository.appendTranscript(location, [
      {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: "question-1:request",
        type: "question.request",
        createdAt: "2026-08-16T00:00:01.000Z",
        agentBindingId: "binding-1",
        requestId: "question-1",
        title: "Choose an approach",
        questions: [
          {
            id: "approach",
            header: "Approach",
            prompt: "Which approach?",
            allowOther: false,
            secret: false,
          },
        ],
      },
    ]);

    const controller = new AiChatController(
      new FakeAgentRuntime({ resumeSupported: false }),
      null,
      [],
      { repository, location },
    );
    await controller.restore();
    expect(controller.items).toContainEqual(
      expect.objectContaining({ type: "question", status: "cancelled" }),
    );
    const snapshot = await repository.read(location);
    expect(snapshot.transcript).toContainEqual(
      expect.objectContaining({
        type: "cancelled",
        requestId: "question-1",
        interactionType: "question",
      }),
    );
    await controller.close();
  });

  it("archives, reopens, relocates, and deletes one scoped conversation", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = {
      scopeDir: "Projects/Atlas",
      conversationId: "123e4567-e89b-42d3-a456-426614174000",
    };
    await repository.create({ ...location, id: location.conversationId });
    const states: Array<typeof location | null> = [];
    const controller = new AiChatController(new FakeAgentRuntime(), null, [], {
      repository,
      onLocationChange: (next) => states.push(next ? { ...next } : null),
    });

    await controller.openConversation(location);
    expect(controller.conversationStatus).toBe("active");
    expect(controller.location).toEqual(location);
    await controller.archiveCurrent();
    expect((await repository.read(location)).metadata.status).toBe("archived");
    expect(controller.conversationStatus).toBe("archived");
    expect(controller.location).toEqual(location);
    await controller.archiveCurrent(false);
    expect(controller.conversationStatus).toBe("active");
    expect(controller.location).toEqual(location);

    controller.relocateScope("Projects", "Archive/Projects");
    expect(controller.location?.scopeDir).toBe("Archive/Projects/Atlas");
    expect(states.at(-1)?.scopeDir).toBe("Archive/Projects/Atlas");

    // The memory store does not receive a vault rename event, so move the
    // locator back before exercising source deletion.
    controller.relocateScope("Archive/Projects", "Projects");
    await controller.deleteCurrent();
    await expect(repository.read(location)).rejects.toThrow(
      "Conversation not found",
    );
    expect(controller.location).toBeNull();
    expect(controller.conversationStatus).toBeNull();
    expect(states.at(-1)).toBeNull();
  });

  it("releases an unreadable conversation and keeps a later send visible", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const missing = {
      scopeDir: "",
      conversationId: "123e4567-e89b-42d3-a456-426614174000",
    };
    const controller = new AiChatController(new FakeAgentRuntime(), null, [], {
      repository,
      location: missing,
      createConversation: () => ({
        scopeDir: "Notes",
        id: "223e4567-e89b-42d3-a456-426614174000",
      }),
    });
    await controller.restore();
    expect(controller.error).toMatch(/Conversation not found/u);
    expect(controller.location).toBeNull();
    expect(controller.items).toEqual([]);

    const sending = controller.submit("hello after missing metadata");
    await vi.waitFor(() => {
      expect(controller.items[0]).toMatchObject({
        type: "message",
        role: "user",
        text: "hello after missing metadata",
      });
    });
    await sending;
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(controller.items[0]).toMatchObject({
      type: "message",
      role: "user",
      text: "hello after missing metadata",
    });
    expect(controller.items.some((item) => item.type === "error")).toBe(false);
    expect(controller.location).toEqual({
      scopeDir: "Notes",
      conversationId: "223e4567-e89b-42d3-a456-426614174000",
    });
    const snapshot = await repository.read(controller.location!);
    expect(snapshot.transcript).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "message",
          role: "user",
          text: "hello after missing metadata",
        }),
      ]),
    );
    await controller.close();
  });

  it("starts a scoped new conversation with a new id", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const first = {
      scopeDir: "Projects/Atlas",
      conversationId: "123e4567-e89b-42d3-a456-426614174000",
    };
    const nextId = "223e4567-e89b-42d3-a456-426614174000";
    await repository.create({ ...first, id: first.conversationId });
    const controller = new AiChatController(new FakeAgentRuntime(), null, [], {
      repository,
      createConversation: () => ({
        id: nextId,
        scopeDir: "Projects/Atlas",
      }),
    });
    await controller.openConversation(first);
    await controller.newConversation({
      id: nextId,
      scopeDir: "Projects/Atlas",
    });
    expect(controller.location).toEqual({
      scopeDir: "Projects/Atlas",
      conversationId: nextId,
    });
    expect(controller.conversationStatus).toBe("active");
  });

  it("switches agents through a prepared runtime and passes bounded local handoff", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const codex = new FakeAgentRuntime({ id: "acp-codex", trace: "rich" });
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
      memoryRecall: {
        recall: async () => [
          {
            kind: "memory-recall",
            id: "memory:handoff-order:1",
            content: "Use the app-owned transcript.",
            metadata: {
              notePath: "Memory/MEMORY.md",
              anchor: "handoff-order",
              revision: 1,
              scope: "workspace",
            },
          },
        ],
      },
    });

    await controller.submit("Inspect the project", { agent: "codex" });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await controller.submit("Continue in Cursor", { agent: "cursor" });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await vi.waitFor(async () => {
      expect(
        (await repository.read(controller.location!)).agents.filter(
          (record) => record.type === "binding.created",
        ),
      ).toHaveLength(2);
    });

    expect(cursor.lastRequest?.metadata?.contextHandoff).toBeUndefined();
    expect(cursor.sessions[0]?.contextBlocks[0]?.[0]).toMatchObject({
      kind: "conversation-handoff",
      content: expect.stringContaining("Inspect the project"),
      metadata: { projectionMode: "full" },
    });
    expect(
      cursor.sessions[0]?.contextBlocks[0]?.map((block) => block.kind),
    ).toEqual(["conversation-handoff", "memory-recall"]);
    const snapshot = await repository.read(controller.location!);
    expect(
      snapshot.agents.filter((record) => record.type === "binding.created"),
    ).toHaveLength(2);
    expect(snapshot.metadata.activeAgentBindingId).toBe(
      snapshot.agents.find(
        (record) =>
          record.type === "binding.created" && record.agent === "cursor",
      )?.id,
    );
    await controller.close();
  });

  it("keeps the previous binding active when target preparation fails", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const codex = new FakeAgentRuntime({ id: "acp-codex" });
    const failing: AgentRuntime = {
      id: "acp-cursor",
      capabilities: () => codex.capabilities(),
      async supports() {
        return true;
      },
      async start() {
        throw new Error("Cursor failed to start");
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
    expect(controller.error).toBe("Cursor failed to start");
    const after = await repository.read(controller.location!);
    expect(after.metadata.activeAgentBindingId).toBe(
      before.metadata.activeAgentBindingId,
    );
    expect(
      after.agents.filter((record) => record.type === "binding.created"),
    ).toHaveLength(1);
    await controller.close();
  });
});
