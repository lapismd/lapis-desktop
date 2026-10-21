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

describe("NativeMemoryService memory-curation", () => {
  it("promotes an explicit owner cue into grounded curated memory", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await createConversation(repository, {
      text: "Remember that this project uses compact headings.",
    });
    const database = new MemoryAppDatabase("memory-promotion");
    await database.open();
    const recordStore = new InMemoryMemoryRecordStore();
    const service = new NativeMemoryService(repository, database, {
      recordStore,
      now: () => new Date("2026-08-27T12:00:00.000Z"),
    });
    for (const entry of await repository.listAll())
      await service.ingestConversation(entry.location);
    await service.rebuild();

    await expect(
      service.previewConsolidation({
        kind: "project",
        projectDir: "Projects/Atlas",
      }),
    ).resolves.toMatchObject({ proposals: 1 });
    await expect(
      service.consolidate({
        kind: "project",
        projectDir: "Projects/Atlas",
      }),
    ).resolves.toMatchObject({ written: 1 });

    const stored = await recordStore.list({
      kind: "project",
      projectDir: "Projects/Atlas",
    });
    expect(stored).toMatchObject([
      {
        record: {
          revision: 1,
          status: "active",
          createdBy: "deterministic-promotion",
          summary: "this project uses compact headings",
          evidence: [
            {
              conversationId: FIRST_CONVERSATION,
              entryId: "user-1",
              entryHash: expect.stringMatching(/^[0-9a-f]{64}$/u),
            },
          ],
        },
      },
    ]);
    await expect(
      service.search(
        { query: "compact headings", corpus: "curated" },
        { scopeDir: "Projects/Atlas" },
      ),
    ).resolves.toMatchObject([
      {
        corpus: "curated",
        effectiveTrust: "owner",
        status: "active",
      },
    ]);
  });

  it("applies a schema-validated provider proposal as a grounded revision", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await createConversation(repository, {
      text: "Remember that this project uses compact headings.",
    });
    const database = new MemoryAppDatabase("memory-provider-promotion");
    await database.open();
    const recordStore = new InMemoryMemoryRecordStore();
    const service = new NativeMemoryService(repository, database, {
      recordStore,
      consolidationProvider: {
        propose: vi.fn(async (input) => ({
          memories: [
            {
              candidateIds: [input.candidates[0]!.id],
              kind: "preference" as const,
              scope: input.scope,
              importance: 5 as const,
              triggers: ["atlas", "headings"],
              summary: "Atlas writing uses compact headings",
              supersessionKey: "preference:atlas-writing",
            },
          ],
        })),
      },
      now: () => new Date("2026-08-27T12:00:00.000Z"),
    });
    for (const entry of await repository.listAll())
      await service.ingestConversation(entry.location);
    await service.rebuild();

    await expect(
      service.consolidate({
        kind: "project",
        projectDir: "Projects/Atlas",
      }),
    ).resolves.toMatchObject({ written: 1, needsReview: 1 });
    await expect(
      recordStore.list({
        kind: "project",
        projectDir: "Projects/Atlas",
      }),
    ).resolves.toMatchObject([
      {
        record: {
          createdBy: "consolidator",
          summary: "Atlas writing uses compact headings",
          evidence: [
            {
              conversationId: FIRST_CONVERSATION,
              entryId: "user-1",
            },
          ],
        },
      },
    ]);
  });

  it("rejects malformed provider grounding without durable mutation", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await createConversation(repository, {
      text: "Remember that this project uses compact headings.",
    });
    const database = new MemoryAppDatabase("memory-provider-rejection");
    await database.open();
    const recordStore = new InMemoryMemoryRecordStore();
    const service = new NativeMemoryService(repository, database, {
      recordStore,
      consolidationProvider: {
        propose: vi.fn(async (input) => ({
          memories: [
            {
              candidateIds: ["unknown-candidate"],
              kind: "preference" as const,
              scope: input.scope,
              importance: 5 as const,
              triggers: ["headings"],
              summary: "Atlas uses compact headings",
            },
          ],
        })),
      },
    });
    for (const entry of await repository.listAll())
      await service.ingestConversation(entry.location);
    await service.rebuild();

    await expect(
      service.consolidate({
        kind: "project",
        projectDir: "Projects/Atlas",
      }),
    ).resolves.toMatchObject({ written: 0, needsReview: 1 });
    await expect(recordStore.list()).resolves.toEqual([]);
    expect(
      (await database.queryMemoryCandidates()).filter(
        (candidate) => candidate.candidate.originClass === "owner",
      ),
    ).toMatchObject([{ candidate: { state: "staged" } }]);
  });

  it("forgets derived lineage durably without deleting the transcript", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = await createConversation(repository, {
      text: "Remember that this project uses compact headings.",
    });
    const transcriptBefore = JSON.stringify(await repository.read(location));
    const database = new MemoryAppDatabase("memory-forget");
    await database.open();
    const recordStore = new InMemoryMemoryRecordStore();
    const service = new NativeMemoryService(repository, database, {
      recordStore,
      now: () => new Date("2026-08-27T12:00:00.000Z"),
    });
    for (const entry of await repository.listAll())
      await service.ingestConversation(entry.location);
    await service.rebuild();
    await service.consolidate({
      kind: "project",
      projectDir: "Projects/Atlas",
    });

    const preview = await service.previewForgetConversation(location);
    expect(preview.episodeRefs).not.toHaveLength(0);
    expect(preview.memoryIds).not.toHaveLength(0);
    await expect(service.forgetConversation(location)).resolves.toMatchObject({
      retracted: 1,
      needsReview: 0,
      exclusionPath: expect.stringContaining("/exclusions/"),
    });

    expect(JSON.stringify(await repository.read(location))).toBe(
      transcriptBefore,
    );
    await expect(
      service.search(
        { query: "compact headings", corpus: "all" },
        { scopeDir: "Projects/Atlas" },
      ),
    ).resolves.toEqual([]);
    await expect(
      service.search(
        {
          query: "compact headings",
          corpus: "curated",
          includeSuperseded: true,
        },
        { scopeDir: "Projects/Atlas" },
      ),
    ).resolves.toMatchObject([{ status: "retracted" }]);
    for (const entry of await repository.listAll())
      await service.ingestConversation(entry.location);
    await service.rebuild();
    await expect(
      service.search(
        { query: "compact headings", corpus: "episodic" },
        { scopeDir: "Projects/Atlas" },
      ),
    ).resolves.toEqual([]);
  });

  it("requires two conversations on two days for non-explicit owner evidence", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await createConversation(repository, {
      text: "The project uses compact headings.",
      createdAt: "2026-08-20T09:00:00.000Z",
    });
    const database = new MemoryAppDatabase("memory-recurrence");
    await database.open();
    const service = new NativeMemoryService(repository, database);
    for (const entry of await repository.listAll())
      await service.ingestConversation(entry.location);
    await service.rebuild();
    await expect(
      service.previewConsolidation({
        kind: "project",
        projectDir: "Projects/Atlas",
      }),
    ).resolves.toMatchObject({ proposals: 0 });

    await createConversation(repository, {
      id: SECOND_CONVERSATION,
      text: "The project uses compact headings.",
      createdAt: "2026-08-21T09:00:00.000Z",
    });
    for (const entry of await repository.listAll())
      await service.ingestConversation(entry.location);
    await service.rebuild();
    await expect(
      service.previewConsolidation({
        kind: "project",
        projectDir: "Projects/Atlas",
      }),
    ).resolves.toMatchObject({ proposals: 1 });
  });
});
