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
  it("defers shared-controller recall and reads fresh history without changing authored text", async () => {
    const runtime = new FakeAgentRuntime();
    const capabilities = runtime.capabilities();
    runtime.capabilities = () => ({ ...capabilities, preparesContext: true });
    const start = runtime.start.bind(runtime);
    let dispatch!: () => Promise<void>;
    runtime.start = async (request) => {
      const session = await start(request);
      const send = session.send.bind(session);
      session.send = async (text, options) => {
        dispatch = async () => {
          expect(
            await options?.authorizeContext?.(new AbortController().signal),
          ).toBe(true);
          const contextBlocks = await options?.prepareContext?.(
            new AbortController().signal,
          );
          await send(text, { contextBlocks });
        };
      };
      return session;
    };
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const memoryRecall = { recall: vi.fn(async () => []) };
    const controller = new AiChatController(runtime, null, [], {
      repository,
      createConversation: () => ({ scopeDir: "Notes" }),
      memoryRecall,
    });
    try {
      await controller.submit("Original message");
      expect(controller.busy).toBe(true);
      expect(memoryRecall.recall).not.toHaveBeenCalled();
      await repository.appendTranscript(controller.location!, [
        {
          schemaVersion: CONVERSATION_SCHEMA_VERSION,
          id: "intervening",
          type: "message",
          role: "assistant",
          text: "History added while queued",
          createdAt: new Date().toISOString(),
        },
      ]);
      await dispatch();
      await vi.waitFor(() => expect(controller.busy).toBe(false));
      expect(memoryRecall.recall).toHaveBeenCalledTimes(1);
      expect(runtime.sessions[0]?.prompts).toEqual(["Original message"]);
      expect(runtime.sessions[0]?.contextBlocks[0]).toMatchObject([
        {
          kind: "conversation-handoff",
          content: expect.stringContaining("History added while queued"),
        },
      ]);
      await controller.submit("Next message");
      await dispatch();
      await vi.waitFor(() => expect(controller.busy).toBe(false));
      expect(runtime.sessions[0]?.contextBlocks[1]).toEqual([]);
      const snapshot = await repository.read(controller.location!);
      expect(
        snapshot.transcript
          .filter((entry) => entry.type === "message" && entry.role === "user")
          .map((entry) => (entry.type === "message" ? entry.text : "")),
      ).toEqual(["Original message", "Next message"]);
    } finally {
      await controller.close();
    }
  });

  it("passes typed memory recall without polluting the authored transcript", async () => {
    const runtime = new FakeAgentRuntime();
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const memoryRecall = {
      recall: vi.fn(async () => [
        {
          kind: "memory-recall" as const,
          id: "memory:writing-headings:2",
          content: "Use compact headings.\nProvenance: conversation/message",
          metadata: {
            memoryId: "writing-headings",
            revision: 2,
            scope: "project" as const,
          },
        },
      ]),
    };
    const controller = new AiChatController(runtime, null, [], {
      repository,
      createConversation: () => ({ scopeDir: "Projects/Atlas" }),
      memoryRecall,
    });

    await controller.submit("Draft the release note");
    await vi.waitFor(() => expect(controller.busy).toBe(false));

    expect(runtime.sessions[0]?.prompts).toEqual(["Draft the release note"]);
    expect(runtime.sessions[0]?.contextBlocks[0]).toMatchObject([
      {
        kind: "memory-recall",
        id: "memory:writing-headings:2",
      },
    ]);
    const snapshot = await repository.read(controller.location!);
    expect(snapshot.transcript).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "message",
          role: "user",
          text: "Draft the release note",
        }),
      ]),
    );
    expect(JSON.stringify(snapshot.transcript)).not.toContain(
      "Use compact headings",
    );
    expect(JSON.stringify(snapshot.transcript)).not.toContain("memory-recall");
    await controller.close();
  });

  it("sends model and thinking on the agent request and stamps createdAt", async () => {
    const runtime = new FakeAgentRuntime();
    const controller = new AiChatController(runtime);
    await controller.submit("Summarize this note", {
      model: { provider: "codex", model: "gpt-5.6-sol" },
      thinking: "high",
    });
    await vi.waitFor(() => {
      expect(controller.busy).toBe(false);
    });
    expect(runtime.lastRequest).toMatchObject({
      model: { provider: "codex", model: "gpt-5.6-sol" },
      thinking: "high",
    });
    expect(controller.items[0]).toMatchObject({
      type: "message",
      role: "user",
      createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
    await controller.close();
  });

  it("clears busy immediately when runtime cancel hangs", async () => {
    let releaseLate!: (event: AgentEvent) => void;
    const lateEvent = new Promise<AgentEvent>((resolve) => {
      releaseLate = resolve;
    });
    let sawCancel = false;
    const capabilities = new FakeAgentRuntime().capabilities();
    const runtime: AgentRuntime = {
      id: "hanging-cancel",
      capabilities: () => capabilities,
      async supports() {
        return true;
      },
      async start() {
        return {
          id: "hang-1",
          async *events() {
            yield { type: "text" as const, text: "working" };
            yield await lateEvent;
            yield { type: "completed" as const };
          },
          async send() {},
          async respondToApproval() {},
          async cancel() {
            sawCancel = true;
            await new Promise(() => {});
          },
          async close() {},
        };
      },
    };
    const controller = new AiChatController(runtime);
    await controller.submit("keep going");
    await vi.waitFor(() => expect(controller.busy).toBe(true));
    await vi.waitFor(() =>
      expect(JSON.stringify(controller.items)).toContain("working"),
    );
    const cancelling = controller.cancel();
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(sawCancel).toBe(true);
    releaseLate({ type: "text", text: "should stay hidden" });
    await expect(
      Promise.race([
        cancelling,
        new Promise((resolve) => setTimeout(resolve, 50)),
      ]),
    ).resolves.toBeUndefined();
    expect(JSON.stringify(controller.items)).not.toContain(
      "should stay hidden",
    );
    expect(controller.busy).toBe(false);
    expect(controller.items.some((item) => item.type === "status")).toBe(false);
    await controller.close();
  });

  it("settles leftover spinners immediately and posts a cancelled notice after cancel confirms", async () => {
    let releaseCancel!: () => void;
    const cancelGate = new Promise<void>((resolve) => {
      releaseCancel = resolve;
    });
    const capabilities = new FakeAgentRuntime().capabilities();
    const runtime: AgentRuntime = {
      id: "confirm-cancel",
      capabilities: () => capabilities,
      async supports() {
        return true;
      },
      async start() {
        return {
          id: "confirm-1",
          async *events() {
            yield { type: "thinking" as const, text: "Planning" };
            yield {
              type: "tool.start" as const,
              id: "t1",
              name: "notes_search",
              input: { query: "vault" },
            };
            await new Promise(() => {});
          },
          async send() {},
          async respondToApproval() {},
          async cancel() {
            await cancelGate;
          },
          async close() {},
        };
      },
    };
    const controller = new AiChatController(runtime);
    await controller.submit("search the vault");
    await vi.waitFor(() => {
      expect(controller.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "thinking", state: "done" }),
          expect.objectContaining({ type: "tool", state: "running" }),
        ]),
      );
    });
    const cancelling = controller.cancel();
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(controller.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "thinking", state: "done" }),
        expect.objectContaining({
          type: "tool",
          state: "error",
          output: expect.stringContaining("unknown"),
        }),
      ]),
    );
    expect(
      controller.items.some(
        (item) =>
          item.type === "status" && item.text === "Agent turn cancelled",
      ),
    ).toBe(false);
    releaseCancel();
    await cancelling;
    await vi.waitFor(() =>
      expect(controller.items.at(-1)).toMatchObject({
        type: "status",
        text: "Agent turn cancelled",
      }),
    );
    await controller.close();
  });

  it("shows the user message before conversation create and session start finish", async () => {
    let releaseCreate!: () => void;
    const createGate = new Promise<void>((resolve) => {
      releaseCreate = resolve;
    });
    let releaseStart!: () => void;
    const startGate = new Promise<void>((resolve) => {
      releaseStart = resolve;
    });
    const innerRuntime = new FakeAgentRuntime();
    const runtime: AgentRuntime = {
      id: "gated-start",
      capabilities: () => innerRuntime.capabilities(),
      supports: (request) => innerRuntime.supports(request),
      async start(request) {
        await startGate;
        return innerRuntime.start(request);
      },
    };
    class GatedCreateRepository extends ConversationRepository {
      override async create(input: CreateConversationInput) {
        await createGate;
        return super.create(input);
      }
    }
    const repository = new GatedCreateRepository(new MemoryTranscriptStore());
    const controller = new AiChatController(runtime, null, [], {
      repository,
      createConversation: () => ({ scopeDir: "Notes" }),
    });
    const submitting = controller.submit("hello from a new chat");
    await vi.waitFor(() => {
      expect(controller.items[0]).toMatchObject({
        type: "message",
        role: "user",
        text: "hello from a new chat",
      });
      expect(controller.busy).toBe(true);
    });
    releaseCreate();
    releaseStart();
    await submitting;
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await controller.close();
  });

  it("does not send after cancel during session start", async () => {
    let sendCount = 0;
    let releaseStart!: () => void;
    const startGate = new Promise<void>((resolve) => {
      releaseStart = resolve;
    });
    const innerRuntime = new FakeAgentRuntime();
    const runtime: AgentRuntime = {
      id: "cancel-during-start",
      capabilities: () => innerRuntime.capabilities(),
      supports: (request) => innerRuntime.supports(request),
      async start(request) {
        await startGate;
        const session = await innerRuntime.start(request);
        return {
          id: session.id,
          events: () => session.events(),
          async send(text) {
            sendCount += 1;
            await session.send(text);
          },
          respondToApproval: (requestId, optionId) =>
            session.respondToApproval(requestId, optionId),
          cancel: () => session.cancel?.() ?? Promise.resolve(),
          close: () => session.close(),
        };
      },
    };
    const controller = new AiChatController(runtime);
    const submitting = controller.submit("stop before send");
    await vi.waitFor(() => {
      expect(controller.busy).toBe(true);
      expect(controller.items[0]).toMatchObject({
        role: "user",
        text: "stop before send",
      });
    });
    await controller.cancel();
    expect(controller.busy).toBe(false);
    releaseStart();
    await submitting;
    expect(sendCount).toBe(0);
    expect(controller.busy).toBe(false);
    await controller.close();
  });

  it("restores stored timestamps", async () => {
    const store = createMemorySessionStore();
    await store.save({
      id: "ai:default",
      runtime: "fake",
      runtimeSessionId: "fake-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      usage: { used: 8_000, limit: 128_000 },
      items: [
        {
          id: "user-1",
          type: "message",
          role: "user",
          text: "hi",
          createdAt: "2026-01-01T12:00:00.000Z",
        },
      ],
    });
    const controller = new AiChatController(
      new FakeAgentRuntime({ resumeSupported: false }),
      null,
      [],
      { store },
    );
    await controller.restore();
    expect(controller.items[0]).toMatchObject({
      createdAt: "2026-01-01T12:00:00.000Z",
    });
    expect(controller.usage).toEqual({ used: 8_000, limit: 128_000 });
    await controller.close();
  });
});
