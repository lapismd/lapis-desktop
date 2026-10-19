import { expect, it, vi } from "vitest";
import { AiChatController } from "../../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { queuedRequest } from "../../../../src/lib/ai/chat/panel/queue-routing.ts";
import { FakeAgentRuntime } from "../../support/fake-runtime.ts";
function fixture() {
  const runtime = new FakeAgentRuntime({ id: "acp", requireApproval: true }),
    repository = new ConversationRepository(new MemoryTranscriptStore());
  const c = new AiChatController(runtime, null, [], {
    repository,
    createConversation: () => ({ scopeDir: "Notes" }),
    request: { agent: "codex" },
  });
  const errors = vi.fn();
  c.queuedMessages.configure((q) => queuedRequest(q, { runtime }, []), errors);
  c.publication.configure(errors);
  return { runtime, repository, c, errors };
}
async function approval(c: AiChatController) {
  await vi.waitFor(() =>
    expect(
      c.items.some(
        (e) =>
          e.type === "approval" &&
          e.status === "pending" &&
          e.agentBindingId === c.activeBindingId,
      ),
    ).toBe(true),
  );
  const a = c.items.find(
    (e) =>
      e.type === "approval" &&
      e.status === "pending" &&
      e.agentBindingId === c.activeBindingId,
  )!;
  if (a.type === "approval")
    await c.respondToApproval(a.request.id, "allow-once", a.id);
}
it("acknowledges durable authoring before completion, then drains queued messages FIFO without duplicate users", async () => {
  const { c, runtime, repository, errors } = fixture();
  try {
    expect(
      await c.publication.submit("First message", { agent: "codex" }),
    ).toBe(true);
    expect(c.busy).toBe(true);
    expect(
      await c.queuedMessages.enqueue("Second message", {
        agent: "codex",
        metadata: { runtime: "acp" },
      }),
    ).toBe(true);
    expect(
      await c.queuedMessages.enqueue("Cancel this follow-up", {
        agent: "codex",
        metadata: { runtime: "acp" },
      }),
    ).toBe(true);
    const q = (await repository.read(c.location!)).metadata.queuedMessages!;
    expect(q.map((e) => e.user.text)).toEqual([
      "Second message",
      "Cancel this follow-up",
    ]);
    expect(
      (await repository.read(c.location!)).transcript.filter(
        (e) => e.type === "message" && e.role === "user",
      ),
    ).toHaveLength(1);
    await c.queuedMessages.cancel(q[1]!.id);
    await approval(c);
    await vi.waitFor(() =>
      expect(runtime.sessions.flatMap((s) => s.prompts)).toEqual([
        "First message",
        "Second message",
      ]),
    );
    await approval(c);
    await vi.waitFor(() =>
      expect(
        c.queuedMessages.entries.some((e) => e.state === "completed"),
      ).toBe(true),
    );
    const saved = await repository.read(c.location!);
    expect(saved.metadata.queuedMessages).toEqual([]);
    expect(
      saved.transcript
        .filter((e) => e.type === "message" && e.role === "user")
        .map((e) => e.type === "message" && e.text),
    ).toEqual(["First message", "Second message"]);
    expect(errors).not.toHaveBeenCalled();
  } finally {
    await c.close();
  }
});
it("Stop pauses waiting work; cold restore is read-only and Resume sends only the unstarted message", async () => {
  const { c, runtime, repository } = fixture();
  let cold: AiChatController | undefined;
  try {
    await c.publication.submit("Active message", { agent: "codex" });
    await c.queuedMessages.enqueue("Only after resume", { agent: "codex" });
    await c.cancel();
    await c.close();
    const location = c.location!;
    const before = JSON.stringify(await repository.read(location));
    const next = new FakeAgentRuntime({ id: "acp", requireApproval: true });
    cold = new AiChatController(next, null, [], {
      repository,
      location,
      request: { agent: "codex" },
    });
    cold.queuedMessages.configure(
      (q) => queuedRequest(q, { runtime: next }, []),
      () => {},
    );
    await cold.restore();
    expect(next.sessions).toHaveLength(0);
    expect(JSON.stringify(await repository.read(location))).toBe(before);
    expect(cold.queuedMessages.entries.map((e) => e.state)).toContain("queued");
    await cold.queuedMessages.resume();
    await vi.waitFor(() =>
      expect(next.sessions.flatMap((s) => s.prompts)).toEqual([
        "Only after resume",
      ]),
    );
    expect(new Set(cold.items.map((e) => e.id)).size).toBe(cold.items.length);
    await approval(cold);
    await vi.waitFor(() =>
      expect(
        cold!.queuedMessages.entries.some((e) => e.state === "completed"),
      ).toBe(true),
    );
    expect(runtime.sessions.flatMap((s) => s.prompts)).toEqual([
      "Active message",
    ]);
  } finally {
    await cold?.close();
    await c.close();
  }
});
it("retains queued targets and does not fall back when the current catalog changes", async () => {
  const { c, repository, errors, runtime } = fixture();
  try {
    await c.publication.submit("Active", { agent: "codex" });
    const { recipientFromOption } = await import(
      "../../../../src/lib/ai/conversations/recipients.ts"
    );
    const recipient = recipientFromOption({
      id: "reviewer",
      label: "Reviewer",
      agent: "codex",
    });
    await c.queuedMessages.enqueue("Named follow-up", {
      agent: "codex",
      recipients: [recipient],
    });
    await approval(c);
    await vi.waitFor(() => expect(errors).toHaveBeenCalled());
    expect(runtime.sessions.flatMap((s) => s.prompts)).toEqual(["Active"]);
    expect(
      (await repository.read(c.location!)).metadata.queuedMessages?.[0]?.state,
    ).toBe("queued");
    expect(c.queuedMessages.paused).toBe(true);
  } finally {
    await c.close();
  }
});

it("Pause during an asynchronous queue read withholds the next native prompt", async () => {
  const { c, repository, runtime } = fixture();
  let release!: () => void, entered!: () => void;
  const gate = new Promise<void>((r) => (release = r)),
    reading = new Promise<void>((r) => (entered = r));
  try {
    await c.publication.submit("Active before paused read", { agent: "codex" });
    await c.queuedMessages.enqueue("Must remain queued", { agent: "codex" });
    let intercepted = false;
    const read = repository.read.bind(repository);
    vi.spyOn(repository, "read").mockImplementation(async (l) => {
      const s = await read(l);
      if (
        !intercepted &&
        !s.metadata.pendingTurn &&
        s.metadata.queuedMessages?.[0]?.state === "queued"
      ) {
        intercepted = true;
        entered();
        await gate;
      }
      return s;
    });
    await approval(c);
    await reading;
    c.queuedMessages.pause();
    release();
    await vi.waitFor(() => expect(c.queuedMessages.running).toBe(false));
    expect(runtime.sessions.flatMap((s) => s.prompts)).toEqual([
      "Active before paused read",
    ]);
    expect(
      (await repository.read(c.location!)).metadata.queuedMessages?.[0]?.state,
    ).toBe("queued");
  } finally {
    release?.();
    await c.close();
  }
});

it("resumes the same live controller after Stop has drained its first turn", async () => {
  const { c, runtime, errors } = fixture();
  try {
    await c.publication.submit("First live turn", { agent: "codex" });
    await c.queuedMessages.enqueue("Resume this live follow-up", {
      agent: "codex",
    });
    await c.cancel();
    await c.queuedMessages.resume();
    await vi.waitFor(() =>
      expect(runtime.sessions.flatMap((s) => s.prompts)).toContain(
        "Resume this live follow-up",
      ),
    );
    expect(errors).not.toHaveBeenCalled();
    await approval(c);
    await vi.waitFor(() => expect(c.queuedMessages.running).toBe(false));
  } finally {
    await c.close();
  }
});

it("withholds follow-ups through the outer prompt's final publication even after its terminal event", async () => {
  const runtime = new FakeAgentRuntime({ id: "acp" }),
    repository = new ConversationRepository(new MemoryTranscriptStore());
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r)),
    start = runtime.start.bind(runtime);
  vi.spyOn(runtime, "start").mockImplementation(async (request) => {
    const s = await start(request),
      send = s.send.bind(s);
    s.send = async (...args) => {
      await send(...args);
      if (runtime.sessions.length === 1) await gate;
    };
    return s;
  });
  const c = new AiChatController(runtime, null, [], {
    repository,
    createConversation: () => ({ scopeDir: "Notes" }),
    request: { agent: "codex" },
  });
  c.queuedMessages.configure(
    (q) => queuedRequest(q, { runtime }, []),
    () => {},
  );
  try {
    await c.publication.submit("Terminal before provider settles", {
      agent: "codex",
    });
    await vi.waitFor(() => expect(c.busy).toBe(false));
    expect(c.publication.inFlight).toBe(true);
    await c.queuedMessages.enqueue("After full publication", {
      agent: "codex",
    });
    expect(runtime.sessions.flatMap((s) => s.prompts)).toEqual([
      "Terminal before provider settles",
    ]);
    release();
    await vi.waitFor(() =>
      expect(runtime.sessions.flatMap((s) => s.prompts)).toContain(
        "After full publication",
      ),
    );
  } finally {
    release();
    await c.close();
  }
});

it("never retries a started queued message after Stop and cold recovery", async () => {
  const { c, runtime, repository } = fixture();
  let cold: AiChatController | undefined;
  try {
    await c.publication.submit("Initial turn", { agent: "codex" });
    await c.queuedMessages.enqueue("Started queued turn", { agent: "codex" });
    await c.queuedMessages.enqueue("Untouched queued turn", { agent: "codex" });
    const queued = (await repository.read(c.location!)).metadata
      .queuedMessages!;
    await approval(c);
    await vi.waitFor(() =>
      expect(runtime.sessions.flatMap((s) => s.prompts)).toEqual([
        "Initial turn",
        "Started queued turn",
      ]),
    );
    await c.cancel();
    await c.close();
    const before = JSON.stringify(await repository.read(c.location!));
    const next = new FakeAgentRuntime({ id: "acp", requireApproval: true });
    cold = new AiChatController(next, null, [], {
      repository,
      location: c.location!,
      request: { agent: "codex" },
    });
    cold.queuedMessages.configure(
      (q) => queuedRequest(q, { runtime: next }, []),
      () => {},
    );
    await cold.restore();
    expect(next.sessions).toHaveLength(0);
    expect(JSON.stringify(await repository.read(c.location!))).toBe(before);
    await cold.queuedMessages.resume();
    await vi.waitFor(() =>
      expect(next.sessions.flatMap((s) => s.prompts)).toEqual([
        "Untouched queued turn",
      ]),
    );
    await approval(cold);
    await vi.waitFor(() => expect(cold!.queuedMessages.running).toBe(false));
    const saved = await repository.read(c.location!);
    expect(saved.transcript).toContainEqual(
      expect.objectContaining({
        type: "queue.outcome",
        outcome: "unknown",
        queued: expect.objectContaining({ id: queued[0]!.id }),
      }),
    );
    expect(saved.transcript).toContainEqual(
      expect.objectContaining({
        type: "queue.outcome",
        outcome: "completed",
        queued: expect.objectContaining({ id: queued[1]!.id }),
      }),
    );
    expect(
      saved.transcript
        .filter((e) => e.type === "message" && e.role === "user")
        .map((e) => e.id),
    ).toEqual([expect.any(String), queued[0]!.user.id, queued[1]!.user.id]);
  } finally {
    await cold?.close();
    await c.close();
  }
});

it("keeps a single recovery notice when cold Resume follows a crash before terminal publication", async () => {
  const { c, repository } = fixture();
  let cold: AiChatController | undefined;
  try {
    await c.publication.submit("Interrupted before checkpoint", {
      agent: "codex",
    });
    await c.queuedMessages.enqueue("Waiting through the crash", {
      agent: "codex",
    });
    const snapshot = await repository.read(c.location!);
    expect(snapshot.metadata.pendingTurn).toBeDefined();
    expect(
      snapshot.transcript.some((e) => e.id.startsWith("turn-unknown:")),
    ).toBe(false);
    await c.close();
    const restoredRepository = new ConversationRepository(
      new MemoryTranscriptStore([snapshot]),
    );
    const next = new FakeAgentRuntime({ id: "acp", requireApproval: true });
    cold = new AiChatController(next, null, [], {
      repository: restoredRepository,
      location: snapshot.location,
      request: { agent: "codex" },
    });
    cold.queuedMessages.configure(
      (q) => queuedRequest(q, { runtime: next }, []),
      () => {},
    );
    await cold.restore();
    expect(await restoredRepository.read(snapshot.location)).toEqual(snapshot);
    expect(next.sessions).toHaveLength(0);
    await cold.queuedMessages.resume();
    await vi.waitFor(() =>
      expect(next.sessions.flatMap((s) => s.prompts)).toEqual([
        "Waiting through the crash",
      ]),
    );
    expect(new Set(cold.items.map((e) => e.id)).size).toBe(cold.items.length);
    expect(
      cold.items.filter((e) => e.id.startsWith("turn-unknown:")),
    ).toHaveLength(1);
    await approval(cold);
    await vi.waitFor(() => expect(cold!.queuedMessages.running).toBe(false));
  } finally {
    await cold?.close();
    await c.close();
  }
});
