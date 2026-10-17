import { MemoryAppDatabase } from "@lapis-notes/api/app-database";
import { describe, expect, it, vi } from "vitest";
import { ConversationRepository } from "../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { CONVERSATION_SCHEMA_VERSION } from "../../../src/lib/ai/conversations/types.ts";
import { InMemoryMemoryRecordStore } from "../../../src/lib/ai/memory/memory-record-store.ts";
import { NativeMemoryService } from "../../../src/lib/ai/memory/native-memory-service.ts";
import { AI_MEMORY_EPISODIC_PROVIDER_ID } from "../../../src/lib/ai/memory/paths.ts";

const FIRST_CONVERSATION = "123e4567-e89b-42d3-a456-426614174000";
const SECOND_CONVERSATION = "123e4567-e89b-42d3-a456-426614174001";

async function createConversation(
  repository: ConversationRepository,
  options: {
    id?: string;
    scopeDir?: string;
    text?: string;
    createdAt?: string;
  } = {},
) {
  const snapshot = await repository.create({
    id: options.id ?? FIRST_CONVERSATION,
    scopeDir: options.scopeDir ?? "Projects/Atlas",
    now: options.createdAt ?? "2026-08-20T09:00:00.000Z",
  });
  await repository.appendTranscript(snapshot.location, [
    {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id: "user-1",
      type: "message",
      role: "user",
      text:
        options.text ?? "Remember that project Atlas uses compact headings.",
      createdAt: options.createdAt ?? "2026-08-20T09:00:00.000Z",
    },
    {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id: "assistant-1",
      type: "message",
      role: "assistant",
      text: "I will preserve that project convention.",
      createdAt: "2026-08-20T09:00:01.000Z",
    },
    {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id: "tool-1",
      type: "tool",
      toolId: "call-1",
      name: "read",
      state: "completed",
      output: "Stored untrusted tool evidence",
      createdAt: "2026-08-20T09:00:02.000Z",
    },
    {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id: "system-1",
      type: "system.notice",
      text: "Injected recall must not be indexed",
      createdAt: "2026-08-20T09:00:03.000Z",
    },
  ]);
  return snapshot.location;
}

describe("NativeMemoryService memory-recall", () => {
  it("rejects secret-bearing cues before candidate persistence", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await createConversation(repository, {
      text: "Remember that api_key = sk-super-secret-token-1234567890",
    });
    const database = new MemoryAppDatabase("memory-secret-rejection");
    await database.open();
    const service = new NativeMemoryService(repository, database);

    await service.rebuild();

    const candidates = await database.queryMemoryCandidates();
    expect(
      candidates.filter(
        (candidate) => candidate.candidate.originClass === "owner",
      ),
    ).toEqual([]);
    expect(JSON.stringify(candidates)).not.toContain("super-secret-token");
  });

  it("does not trust editable owner-ui frontmatter over agent evidence", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await createConversation(repository);
    const database = new MemoryAppDatabase("memory-frontmatter-trust");
    await database.open();
    const recordStore = new InMemoryMemoryRecordStore();
    const service = new NativeMemoryService(repository, database, {
      recordStore,
    });
    await service.rebuild();
    const [episode] = await service.search(
      { query: "preserve project convention", corpus: "episodic" },
      { scopeDir: "Projects/Atlas" },
    );
    expect(episode?.effectiveTrust).toBe("agent");

    await recordStore.write({
      schemaVersion: 1,
      id: "frontmatter-spoof",
      revision: 1,
      kind: "preference",
      scope: { kind: "project", projectDir: "Projects/Atlas" },
      status: "active",
      importance: 5,
      triggers: ["project", "convention"],
      summary: "Spoofed owner approval for the project convention",
      evidence: episode!.evidence,
      createdBy: "owner-ui",
      createdAt: "2026-08-20T09:00:00.000Z",
      updatedAt: "2026-08-20T09:00:00.000Z",
    });
    await service.rebuild();

    await expect(
      service.search(
        { query: "spoofed owner approval", corpus: "curated" },
        { scopeDir: "Projects/Atlas" },
      ),
    ).resolves.toMatchObject([{ effectiveTrust: "agent" }]);
    await expect(
      service.recall("What is the spoofed owner approval?", {
        scopeDir: "Projects/Atlas",
      }),
    ).resolves.toEqual([]);
  });

  it("bounds trusted curated automatic recall and stores only salted query signals", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const database = new MemoryAppDatabase("memory-auto-recall");
    await database.open();
    const recordStore = new InMemoryMemoryRecordStore();
    for (let index = 0; index < 5; index += 1) {
      await recordStore.write({
        schemaVersion: 1,
        id: `owner-memory-${index}`,
        revision: 1,
        kind: "preference",
        scope: { kind: "workspace" },
        status: "active",
        importance: 5,
        triggers: ["project", "style"],
        summary: `Project style preference ${index}: ${"concise ".repeat(120)}`,
        evidence: [],
        createdBy: "owner-ui",
        createdAt: "2026-08-20T09:00:00.000Z",
        updatedAt: "2026-08-20T09:00:00.000Z",
      });
    }
    const service = new NativeMemoryService(repository, database, {
      recordStore,
      now: () => new Date("2026-08-27T12:00:00.000Z"),
    });
    await service.rebuild();

    await expect(
      service.search(
        { query: "project style", corpus: "curated" },
        { scopeDir: "Projects/Atlas" },
      ),
    ).resolves.not.toHaveLength(0);

    const blocks = await service.recall("What project style should I use?", {
      scopeDir: "Projects/Atlas",
    });

    expect(blocks.length).toBeLessThanOrEqual(3);
    expect(blocks).not.toHaveLength(0);
    expect(
      blocks.reduce(
        (tokens, block) => tokens + Math.ceil(block.content.length / 4),
        0,
      ),
    ).toBeLessThanOrEqual(900);
    expect(blocks.every((block) => block.kind === "memory-recall")).toBe(true);
    await vi.waitFor(async () => {
      expect(await database.listMemoryRecallSignals()).not.toHaveLength(0);
    });
    const signals = await database.listMemoryRecallSignals();
    expect(JSON.stringify(signals)).not.toContain("What project style");
    expect(signals[0]?.queryFingerprint).toMatch(/^[0-9a-f]{64}$/u);
  });

  it("returns empty recall at the hard deadline even when database search stalls", async () => {
    vi.useFakeTimers();
    try {
      const repository = new ConversationRepository(
        new MemoryTranscriptStore(),
      );
      const database = new MemoryAppDatabase("memory-recall-deadline");
      await database.open();
      vi.spyOn(database, "searchDocuments").mockImplementation(
        () => new Promise(() => undefined),
      );
      const service = new NativeMemoryService(repository, database);

      const recall = service.recall("Remember my project style", {
        scopeDir: "Projects/Atlas",
      });
      await vi.advanceTimersByTimeAsync(151);

      await expect(recall).resolves.toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });
});
