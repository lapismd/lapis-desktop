// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from "vitest";
import { FakeAgentRuntime } from "../../support/fake-runtime.ts";
import { AiChatController } from "../../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { createMemorySessionStore } from "../../../../src/lib/ai/sessions/session-store.ts";
function deferred() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}
function storedSession() {
  return createMemorySessionStore([
    {
      id: "restore",
      runtime: "acp",
      runtimeSessionId: "prior",
      agent: "codex",
      createdAt: "2026-10-17T00:00:00Z",
      updatedAt: "2026-10-17T00:00:00Z",
      items: [],
    },
  ]);
}
describe("chat controller disposal", () => {
  it("does not resume a session after a pending saved-session read is disposed", async () => {
    const gate = deferred();
    const store = storedSession();
    const saved = await store.get("restore");
    vi.spyOn(store, "get").mockImplementation(async () => {
      await gate.promise;
      return saved;
    });
    const runtime = new FakeAgentRuntime({ id: "acp" });
    const session = await runtime.start({ prompt: "" });
    const resume = vi.spyOn(runtime, "resume").mockResolvedValue(session);
    const controller = new AiChatController(runtime, null, [], {
      store,
      sessionId: "restore",
    });
    const restoring = controller.restore();
    try {
      await controller.close();
      gate.release();
      await restoring;
      expect(resume).not.toHaveBeenCalled();
      expect(controller.session).toBeNull();
    } finally {
      gate.release();
      await restoring;
      await session.close();
    }
  });
  it("releases a late resume acknowledgement instead of attaching it after close", async () => {
    const gate = deferred();
    const runtime = new FakeAgentRuntime({ id: "acp" });
    const session = await runtime.start({ prompt: "" });
    const resume = vi.spyOn(runtime, "resume").mockImplementation(async () => {
      await gate.promise;
      return session;
    });
    const controller = new AiChatController(runtime, null, [], {
      store: storedSession(),
      sessionId: "restore",
    });
    const restoring = controller.restore();
    try {
      await vi.waitFor(() => expect(resume).toHaveBeenCalledTimes(1));
      await controller.close();
      gate.release();
      await restoring;
      expect(controller.session).toBeNull();
      expect(runtime.sessions[0].closed).toBe(true);
    } finally {
      gate.release();
      await restoring;
      await session.close();
    }
  });
  it("drains an already-started transcript checkpoint before closure completes", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const snapshot = await repository.create({ scopeDir: "Notes" });
    const gate = deferred();
    const append = repository.appendTranscript.bind(repository);
    let first = true;
    const writes = vi
      .spyOn(repository, "appendTranscript")
      .mockImplementation(async (...args) => {
        if (first) {
          first = false;
          await gate.promise;
        }
        return append(...args);
      });
    const runtime = new FakeAgentRuntime({ id: "acp" });
    const session = await runtime.start({ prompt: "" });
    const controller = new AiChatController(runtime, null, [], {
      repository,
      location: snapshot.location,
    });
    controller.session = session;
    const consuming = controller._consume(session);
    await session.send("Retain this checkpoint");
    await vi.waitFor(() => expect(writes).toHaveBeenCalled());
    let settled = false;
    const closing = controller.close().then(() => {
      settled = true;
    });
    try {
      await vi.waitFor(() => expect(runtime.sessions[0].closed).toBe(true));
      expect(settled).toBe(false);
    } finally {
      gate.release();
      await consuming;
      await closing;
    }
    expect(
      (await repository.read(snapshot.location)).transcript.some(
        (entry) =>
          entry.type === "message" &&
          entry.text.includes("Retain this checkpoint"),
      ),
    ).toBe(true);
  });
});
