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
  it("restores transcript before a slow runtime resume completes", async () => {
    const store = createMemorySessionStore([
      {
        id: "ai:default:resuming:codex",
        runtime: "resuming",
        runtimeSessionId: "remote-1",
        agent: "codex",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        items: [
          {
            id: "m1",
            type: "message",
            role: "assistant",
            text: "Previously saved response",
          },
        ],
      },
    ]);
    let finishResume!: (session: AgentSession) => void;
    const resume = new Promise<AgentSession>((resolve) => {
      finishResume = resolve;
    });
    const capabilities = new FakeAgentRuntime().capabilities();
    const runtime: AgentRuntime = {
      id: "resuming",
      capabilities: () => capabilities,
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
      store,
      request: { agent: "codex" },
    });
    const restoring = controller.restore();
    await vi.waitFor(() => {
      expect(controller.items[0]).toMatchObject({
        text: "Previously saved response",
      });
    });
    finishResume({
      id: "remote-1",
      async *events() {},
      async send() {},
      async respondToApproval() {},
      async close() {},
    });
    await restoring;
    await controller.close();
  });

  it("tracks usage events without rendering provider bookkeeping", async () => {
    const capabilities = new FakeAgentRuntime().capabilities();
    const runtime: AgentRuntime = {
      id: "usage",
      capabilities: () => capabilities,
      async supports() {
        return true;
      },
      async start() {
        return {
          id: "usage-1",
          async *events() {
            yield { type: "status" as const, status: "session updated" };
            yield {
              type: "usage" as const,
              usage: { used: 32_000, limit: 128_000 },
            };
            yield { type: "completed" as const };
          },
          async send() {},
          async respondToApproval() {},
          async close() {},
        };
      },
    };
    const controller = new AiChatController(runtime);
    await controller.submit("check usage");
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(controller.usage).toEqual({ used: 32_000, limit: 128_000 });
    expect(controller.items.some((item) => item.type === "status")).toBe(false);
    await controller.close();
  });

  it("merges mention and drawer attachments on the agent request", async () => {
    const runtime = new FakeAgentRuntime();
    const controller = new AiChatController(runtime);
    await controller.submit("See @Notes/alpha.md", {
      metadata: { attachments: ["Notes/alpha.md", "Notes/beta.md"] },
    });
    await vi.waitFor(() => {
      expect(controller.busy).toBe(false);
    });
    expect(runtime.lastRequest?.metadata?.attachments).toEqual([
      "Notes/alpha.md",
      "Notes/beta.md",
    ]);
    await controller.close();
  });

  it("responds to agent questions without persisting answer values", async () => {
    const store = createMemorySessionStore();
    const controller = new AiChatController(
      new FakeAgentRuntime({ requireQuestion: true }),
      null,
      [],
      { store },
    );
    const sending = controller.submit("Ask me first");
    await vi.waitFor(() => {
      expect(controller.items.at(-1)).toMatchObject({
        type: "question",
        status: "pending",
      });
    });
    const question = controller.items.at(-1);
    if (question?.type !== "question") {
      throw new Error("Expected pending question");
    }
    await controller.respondToQuestion(question.request.id, {
      approach: ["super-secret-answer"],
    });
    await sending;
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(controller.items.at(-1)).toMatchObject({
      type: "question",
      status: "answered",
    });
    expect(JSON.stringify(await store.list())).not.toContain(
      "super-secret-answer",
    );
    await controller.close();
  });

  it("does not resume a legacy Codex chat after switching to Cursor", async () => {
    const store = createMemorySessionStore([
      {
        id: "ai:default",
        runtime: "fake",
        runtimeSessionId: "fake-legacy",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        items: [
          { id: "m1", type: "message", role: "assistant", text: "Codex chat" },
        ],
      },
    ]);
    const controller = new AiChatController(
      new FakeAgentRuntime({ trace: "rich" }),
      null,
      [],
      {
        store,
        request: { agent: "cursor" },
      },
    );
    await controller.restore();
    expect(controller.items).toEqual([]);
    expect(controller.sessionId).toBe("ai:default:fake:cursor");
    await controller.close();
  });

  it("renders stream failures and starts a fresh session on retry", async () => {
    let starts = 0;
    const capabilities = new FakeAgentRuntime().capabilities();
    const runtime: AgentRuntime = {
      id: "failing",
      capabilities: (): AgentCapabilities => capabilities,
      async supports() {
        return true;
      },
      async start(): Promise<AgentSession> {
        starts += 1;
        return {
          id: `failing-${starts}`,
          async *events() {
            await Promise.resolve();
            throw new Error("provider stream failed");
          },
          async send() {},
          async respondToApproval() {},
          async close() {},
        };
      },
    };
    const controller = new AiChatController(runtime);
    await controller.submit("first");
    await vi.waitFor(() => {
      expect(controller.items.at(-1)).toMatchObject({
        type: "error",
        text: "provider stream failed",
      });
      expect(controller.busy).toBe(false);
    });
    await controller.submit("retry");
    await vi.waitFor(() => expect(starts).toBe(2));
    await controller.close();
  });

  it("persists production chats to a folder-scoped conversation and restores offline", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const id = "123e4567-e89b-42d3-a456-426614174000";
    const controller = new AiChatController(
      new FakeAgentRuntime({ trace: "rich" }),
      null,
      [],
      {
        repository,
        createConversation: () => ({
          id,
          scopeDir: "Projects/Atlas",
          launchNotePath: "Projects/Atlas/note.md",
        }),
        request: { agent: "codex", thinking: "medium" },
      },
    );

    await controller.submit("Persist this response");
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(controller.location).toEqual({
      scopeDir: "Projects/Atlas",
      conversationId: id,
    });
    await vi.waitFor(async () => {
      const persisted = await repository.read(controller.location!);
      expect(persisted.agents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "usage.updated" }),
        ]),
      );
    });
    const durable = await repository.read(controller.location!);
    expect(durable.metadata.title).toBe("Persist this response");
    expect(durable.agents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "binding.created",
          runtime: "fake",
          agent: "codex",
        }),
        expect.objectContaining({ type: "usage.updated" }),
      ]),
    );
    expect(durable.transcript).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "message", role: "user" }),
        expect.objectContaining({ type: "message", role: "assistant" }),
        expect.objectContaining({ type: "tool" }),
      ]),
    );

    const offline = new AiChatController(
      new FakeAgentRuntime({ resumeSupported: false }),
      null,
      [],
      { repository, location: controller.location },
    );
    await offline.restore();
    expect(offline.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "message", role: "user" }),
        expect.objectContaining({ type: "message", role: "assistant" }),
      ]),
    );
    await controller.close();
    await offline.close();
  });

  it("streams in memory and clears busy before terminal persistence", async () => {
    let releaseCompletion!: () => void;
    const completionGate = new Promise<void>((resolve) => {
      releaseCompletion = resolve;
    });
    let releaseTerminalWrite!: () => void;
    const terminalWriteGate = new Promise<void>((resolve) => {
      releaseTerminalWrite = resolve;
    });
    let terminalWriteStarted = false;
    let durableWriteAttempts = 0;
    let assistantWriteAttempts = 0;
    class GatedTerminalRepository extends ConversationRepository {
      override async appendAgentRecords(
        location: ConversationLocation,
        records: AgentBindingRecord[],
      ) {
        durableWriteAttempts += 1;
        return super.appendAgentRecords(location, records);
      }

      override async appendTranscript(
        location: ConversationLocation,
        entries: TranscriptEntry[],
      ) {
        durableWriteAttempts += 1;
        if (
          entries.some(
            (entry) => entry.type === "message" && entry.role === "assistant",
          )
        ) {
          assistantWriteAttempts += 1;
          terminalWriteStarted = true;
          await terminalWriteGate;
        }
        return super.appendTranscript(location, entries);
      }
    }
    const capabilities = new FakeAgentRuntime().capabilities();
    const runtime: AgentRuntime = {
      id: "gated-terminal-write",
      capabilities: () => capabilities,
      async supports() {
        return true;
      },
      async start() {
        return {
          id: "gated-terminal-session",
          async *events() {
            yield { type: "text" as const, text: "Streamed response" };
            await completionGate;
            yield { type: "completed" as const };
          },
          async send() {},
          async respondToApproval() {},
          async close() {},
        };
      },
    };
    const repository = new GatedTerminalRepository(new MemoryTranscriptStore());
    const controller = new AiChatController(runtime, null, [], {
      repository,
      createConversation: () => ({
        id: "123e4567-e89b-42d3-a456-426614174000",
        scopeDir: "",
      }),
    });

    await controller.submit("Show streaming");
    await vi.waitFor(() =>
      expect(JSON.stringify(controller.items)).toContain("Streamed response"),
    );
    expect(controller.busy).toBe(true);
    expect(durableWriteAttempts).toBe(0);
    expect(assistantWriteAttempts).toBe(0);

    releaseCompletion();
    await vi.waitFor(() => expect(terminalWriteStarted).toBe(true));
    expect(controller.busy).toBe(false);

    releaseTerminalWrite();
    await vi.waitFor(async () => {
      expect(
        JSON.stringify(await repository.read(controller.location!)),
      ).toContain("Streamed response");
    });
    await controller.close();
  });
});
