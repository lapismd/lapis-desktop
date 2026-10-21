import { expect, it, vi } from "vitest";
import { AiChatController } from "../../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { FakeAgentRuntime } from "../../support/fake-runtime.ts";
import type {
  AiHistoryBinding,
  AiTurnRecord,
} from "../../../../src/lib/repository/ai-history.ts";
import { historyTranscript } from "../../../../src/lib/ai/chat/history-transcript.ts";
import { projectAiTranscript } from "../../../../src/lib/ai/chat/transcript-projection.ts";

function fixture(enabled = true) {
  const runtime = new FakeAgentRuntime();
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  const controller = new AiChatController(runtime, null, [], {
    repository,
    createConversation: () => ({ scopeDir: "Notes" }),
  });
  const records = new Map<string, AiTurnRecord>();
  const before = {
    operation: "1".repeat(128),
    commit: "a".repeat(40),
    change_id: "c".repeat(32),
    description: "Before",
    timestamp_millis: Date.now(),
  };
  const binding: AiHistoryBinding = {
    enabled: () => enabled,
    reader: {} as AiHistoryBinding["reader"],
    guard: (action) => action(),
    reveal: async () => {},
    service: {
      begin: vi.fn(async (context) => {
        expect(runtime.sessions).toHaveLength(0);
        const row: AiTurnRecord = {
          version: 1,
          context,
          before,
          after: null,
          phase: "running",
          started_at: Date.now(),
          ended_at: null,
          outcome: null,
        };
        records.set(context.turn, row);
        return row;
      }),
      bind: vi.fn(async (context) => {
        const record = { ...records.get(context.turn)!, context };
        records.set(context.turn, record);
        return record;
      }),
      end: vi.fn(async (_conversation, turn, outcome) => {
        const record: AiTurnRecord = {
          ...records.get(turn)!,
          after: { ...before, commit: "b".repeat(40) },
          outcome,
          phase: outcome === "unknown" ? "incomplete" : "complete",
          ended_at: Date.now(),
        };
        records.set(turn, record);
        return record;
      }),
      read: async (_conversation, turn) => records.get(turn)!,
      list: async () => ({ records: [...records.values()], next: null }),
      previewUndo: async () => ({
        paths: ["Notes/alpha.md"],
        expected: "e".repeat(64),
      }),
      undo: async () => {},
      pendingUndo: async () => [],
    },
  };
  controller.fileHistory.configure(undefined, repository, () => binding);
  return { runtime, repository, controller, binding, records };
}

for (const harness of ["local", "codex", "cursor", "opencode"])
  it(`captures before ${harness} starts and persists exact turn links without replacing ACP`, async () => {
    const f = fixture();
    try {
      expect(
        await f.controller.submit("Update this note", {
          agent: harness,
          model: { provider: harness, model: "selected-model" },
        }),
      ).toBe(true);
      await vi.waitFor(() =>
        expect(f.controller.fileHistory.records.at(-1)?.phase).toBe("complete"),
      );
      const record = f.controller.fileHistory.records.at(-1)!;
      expect(record.context).toMatchObject({
        harness,
        requested_model: "selected-model",
        binding: f.controller.activeBindingId,
        session: f.controller.session?.id,
      });
      const snapshot = await f.repository.read(f.controller.location!);
      expect(
        snapshot.agents.some(
          (entry) =>
            entry.type === "history.turn.recorded" &&
            entry.history.after?.commit === "b".repeat(40),
        ),
      ).toBe(true);
      expect(
        snapshot.transcript.some(
          (entry) => entry.type === "message" && entry.role === "assistant",
        ),
      ).toBe(true);
      const projected = historyTranscript(
        projectAiTranscript(f.controller.items),
        [record],
      );
      expect(projected.at(-1)?.id).toBe(`history/${record.context.turn}`);
      await f.controller.fileHistory.load(f.controller.location);
      expect(f.controller.fileHistory.records).toHaveLength(1);
    } finally {
      await f.controller.close();
    }
  });

it("disabled history leaves ordinary ACP unchanged and performs no history writes", async () => {
  const f = fixture(false);
  try {
    await f.controller.submit("A normal ACP turn");
    expect(f.binding.service.begin).not.toHaveBeenCalled();
    expect(f.runtime.sessions).toHaveLength(1);
  } finally {
    await f.controller.close();
  }
});

it("retains the prompt before dispatch and allows explicit history bypass", async () => {
  const f = fixture();
  vi.mocked(f.binding.service.begin).mockRejectedValue(
    new Error("Disk unavailable"),
  );
  try {
    const sending = f.controller.submit("Keep this exact prompt");
    await vi.waitFor(() =>
      expect(f.controller.fileHistory.pending).toBeDefined(),
    );
    expect(f.runtime.sessions).toHaveLength(0);
    expect(f.controller.items[0]).toMatchObject({
      text: "Keep this exact prompt",
    });
    f.controller.fileHistory.pending!.choose("continue");
    expect(await sending).toBe(true);
    expect(f.binding.service.bind).not.toHaveBeenCalled();
    expect(f.runtime.sessions).toHaveLength(1);
  } finally {
    await f.controller.close();
  }
});

it("closing while checkpoint choice is pending does not hang or start a provider", async () => {
  const f = fixture();
  vi.mocked(f.binding.service.begin).mockRejectedValue(
    new Error("Disk unavailable"),
  );
  const sending = f.controller.submit("Retain this draft");
  await vi.waitFor(() =>
    expect(f.controller.fileHistory.pending).toBeDefined(),
  );
  await f.controller.close();
  await sending;
  expect(f.runtime.sessions).toHaveLength(0);
});

it("resolves a lost begin acknowledgement through the original durable boundary", async () => {
  const f = fixture();
  const begin = vi.mocked(f.binding.service.begin).getMockImplementation()!;
  vi.mocked(f.binding.service.begin).mockImplementationOnce(async (context) => {
    await begin(context);
    throw new Error("Begin acknowledgement lost");
  });
  try {
    expect(await f.controller.submit("Retain this exact boundary")).toBe(true);
    await f.controller._terminalCheckpoint;
    expect(f.controller.fileHistory.pending).toBeUndefined();
    expect(f.records.size).toBe(1);
    await vi.waitFor(() =>
      expect(f.controller.fileHistory.records[0]?.phase).toBe("complete"),
    );
  } finally {
    await f.controller.close();
  }
});

it("retries the same turn after a lost begin acknowledgement and unavailable receipt", async () => {
  const f = fixture();
  const begin = vi.mocked(f.binding.service.begin).getMockImplementation()!;
  vi.mocked(f.binding.service.begin).mockImplementationOnce(async (context) => {
    await begin(context);
    throw new Error("Begin acknowledgement lost");
  });
  const read = f.binding.service.read;
  f.binding.service.read = vi
    .fn(read)
    .mockRejectedValueOnce(new Error("Receipt temporarily unavailable"));
  try {
    const sending = f.controller.submit("Keep this boundary during retry");
    await vi.waitFor(() =>
      expect(f.controller.fileHistory.pending).toBeDefined(),
    );
    expect(f.runtime.sessions).toHaveLength(0);
    const original = [...f.records.keys()][0];
    f.controller.fileHistory.pending!.choose("retry");
    expect(await sending).toBe(true);
    await vi.waitFor(() =>
      expect(f.controller.fileHistory.records[0]?.phase).toBe("complete"),
    );
    expect([...f.records.keys()]).toEqual([original]);
    expect(vi.mocked(f.binding.service.begin).mock.calls[1][0].turn).toBe(
      original,
    );
  } finally {
    await f.controller.close();
  }
});

it("does not fabricate a terminal checkpoint when capture fails", async () => {
  const f = fixture();
  vi.mocked(f.binding.service.end).mockRejectedValue(
    new Error("Capture failed"),
  );
  try {
    await f.controller.submit("Edit the note");
    await f.controller._terminalCheckpoint;
    expect(f.controller.fileHistory.records[0]?.after).toBeNull();
    expect(f.controller.fileHistory.records[0]?.phase).not.toBe("complete");
  } finally {
    await f.controller.close();
  }
});

it("captures skill activation and native command writes through the same owner", async () => {
  for (const kind of ["skill", "command"]) {
    const f = fixture();
    try {
      if (kind === "skill") {
        await f.controller._submitWithActivation(
          {
            skillId: "revise",
            skillName: "Revise",
            version: "1",
            source: "user",
            instructions: "Revise the current note.",
          },
          { agent: "local" },
        );
      } else {
        await f.controller._ensureConversation();
        await f.controller._withCommandProgress(
          async (turnId) => {
            await f.controller._prepareSession({ agent: "codex" }, turnId);
            await f.controller.session!.send("/revise");
          },
          { request: { agent: "codex" }, message: "command-1" },
        );
      }
      expect(f.controller.fileHistory.records.at(-1)?.phase).toBe("complete");
      expect(f.binding.service.bind).toHaveBeenCalledOnce();
      expect(f.binding.service.end).toHaveBeenCalledOnce();
    } finally {
      await f.controller.close();
    }
  }
});
