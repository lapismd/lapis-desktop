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

describe("NativeMemoryService memory-ingestion", () => {
  it("indexes exact eligible entries without mutating transcript authority", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = await createConversation(repository);
    const before = JSON.stringify(await repository.read(location));
    const database = new MemoryAppDatabase("memory-episodes");
    await database.open();
    const service = new NativeMemoryService(repository, database, {
      now: () => new Date("2026-08-27T12:00:00.000Z"),
    });

    await service.ingestConversation(location);

    const documents = (await database.listSearchDocuments()).filter(
      (document) =>
        document.sourceProviderId === AI_MEMORY_EPISODIC_PROVIDER_ID,
    );
    expect(documents).toHaveLength(3);
    expect(documents.map((document) => document.content)).toEqual(
      expect.arrayContaining([
        "Remember that project Atlas uses compact headings.",
        "I will preserve that project convention.",
        "Stored untrusted tool evidence",
      ]),
    );
    expect(
      documents.some((document) =>
        document.content.includes("Injected recall"),
      ),
    ).toBe(false);
    await expect(
      database.getMemorySourceState(FIRST_CONVERSATION),
    ).resolves.toMatchObject({
      sourceHash: expect.stringMatching(/^[0-9a-f]{64}$/u),
      lastEntryId: "tool-1",
      lastEntryHash: expect.stringMatching(/^[0-9a-f]{64}$/u),
      status: "ready",
    });
    expect(JSON.stringify(await repository.read(location))).toBe(before);
  });

  it("restores stable refs after deleting disposable database state", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = await createConversation(repository);
    const database = new MemoryAppDatabase("memory-rebuild");
    await database.open();
    const service = new NativeMemoryService(repository, database);
    await service.rebuild();
    const before = await service.search(
      { query: "compact headings" },
      { scopeDir: "Projects/Atlas" },
    );

    for (const document of await database.listSearchDocuments()) {
      if (document.sourceProviderId === AI_MEMORY_EPISODIC_PROVIDER_ID) {
        await database.deleteSearchDocument(document.path);
      }
    }
    await database.clearMemoryDerivedState();
    await service.rebuild();
    const after = await service.search(
      { query: "compact headings" },
      { scopeDir: "Projects/Atlas" },
    );

    expect(after.map((result) => result.ref)).toEqual(
      before.map((result) => result.ref),
    );
    await expect(
      service.get(after[0]!.ref, { scopeDir: "Projects/Atlas" }),
    ).resolves.toMatchObject({
      status: "available",
      currentLocation: location,
      evidenceMessages: [
        {
          id: "user-1",
          originClass: "owner",
          verification: "matching",
        },
      ],
    });
  });

  it("applies current versus workspace scope without accepting a path argument", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await createConversation(repository, {
      text: "The shared phrase belongs to Atlas.",
    });
    await createConversation(repository, {
      id: SECOND_CONVERSATION,
      scopeDir: "Projects/Borealis",
      text: "The shared phrase belongs to Borealis.",
    });
    const database = new MemoryAppDatabase("memory-scope");
    await database.open();
    const service = new NativeMemoryService(repository, database);
    await service.rebuild();

    const current = await service.search(
      { query: "shared phrase", scope: "current" },
      { scopeDir: "Projects/Atlas" },
    );
    const workspace = await service.search(
      { query: "shared phrase", scope: "workspace" },
      { scopeDir: "Projects/Atlas" },
    );

    expect(current).toHaveLength(1);
    expect(current[0]?.snippet).toContain("Atlas");
    expect(workspace.map((result) => result.snippet)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Atlas"),
        expect.stringContaining("Borealis"),
      ]),
    );
  });

  it("applies an exact encoded scope boundary before result limiting", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await createConversation(repository, {
      text: "The boundary phrase belongs to Atlas.",
    });
    await createConversation(repository, {
      id: SECOND_CONVERSATION,
      scopeDir: "Projects/Atlas2",
      text: "The boundary phrase belongs to Atlas2.",
    });
    const database = new MemoryAppDatabase("memory-scope-boundary");
    await database.open();
    const service = new NativeMemoryService(repository, database);
    await service.rebuild();

    const current = await service.search(
      { query: "boundary phrase", scope: "current", corpus: "episodic" },
      { scopeDir: "Projects/Atlas" },
    );

    expect(current).toHaveLength(1);
    expect(current[0]?.snippet).toContain("Atlas.");
    expect(current[0]?.snippet).not.toContain("Atlas2");
  });

  it("rebuilds every synthetic path after a conversation folder move", async () => {
    const firstStore = new MemoryTranscriptStore();
    const firstRepository = new ConversationRepository(firstStore);
    const oldLocation = await createConversation(firstRepository);
    const database = new MemoryAppDatabase("memory-folder-move");
    await database.open();
    const firstService = new NativeMemoryService(firstRepository, database);
    await firstService.ingestConversation(oldLocation);
    const original = await firstRepository.read(oldLocation);

    const movedLocation = {
      ...oldLocation,
      scopeDir: "Projects/Renamed-Atlas",
    };
    const movedRepository = new ConversationRepository(
      new MemoryTranscriptStore([{ ...original, location: movedLocation }]),
    );
    const movedService = new NativeMemoryService(movedRepository, database);
    await movedService.ingestConversation(movedLocation);

    const episodic = (await database.listSearchDocuments()).filter(
      (document) =>
        document.sourceProviderId === AI_MEMORY_EPISODIC_PROVIDER_ID,
    );
    expect(episodic).toHaveLength(3);
    expect(
      episodic.every((document) => document.path.includes("Renamed-Atlas")),
    ).toBe(true);
    const results = await movedService.search(
      { query: "compact headings", corpus: "episodic" },
      { scopeDir: movedLocation.scopeDir },
    );
    expect(results[0]?.ref).toBe(`episode:${FIRST_CONVERSATION}:user-1`);
  });

  it("fails closed when an already indexed pre-checkpoint entry changes", async () => {
    const firstRepository = new ConversationRepository(
      new MemoryTranscriptStore(),
    );
    const location = await createConversation(firstRepository);
    const database = new MemoryAppDatabase("memory-history-mismatch");
    await database.open();
    const firstService = new NativeMemoryService(firstRepository, database);
    await firstService.ingestConversation(location);
    const original = await firstRepository.read(location);
    const changedRepository = new ConversationRepository(
      new MemoryTranscriptStore([
        {
          ...original,
          transcript: original.transcript.map((entry) =>
            entry.id === "user-1" && entry.type === "message"
              ? { ...entry, text: "Modified historical evidence" }
              : entry,
          ),
        },
      ]),
    );
    const changedService = new NativeMemoryService(changedRepository, database);

    await changedService.ingestConversation(location);

    await expect(
      database.getMemorySourceState(FIRST_CONVERSATION),
    ).resolves.toMatchObject({
      status: "inconsistent",
      errorCode: "entry-hash-mismatch",
    });
    const documents = await database.listSearchDocuments();
    expect(
      documents.find((document) => document.path.endsWith("/user-1"))?.content,
    ).toContain("Remember that project Atlas");
  });

  it("fails closed when imported conversation IDs are ambiguous", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await createConversation(repository, { scopeDir: "Projects/Atlas" });
    await createConversation(repository, { scopeDir: "Projects/Copy" });
    const database = new MemoryAppDatabase("memory-ambiguous");
    await database.open();
    const service = new NativeMemoryService(repository, database);

    const result = await service.rebuild();

    expect(result).toMatchObject({ conversations: 0, inconsistent: 2 });
    await expect(
      database.getMemorySourceState(FIRST_CONVERSATION),
    ).resolves.toMatchObject({
      status: "inconsistent",
      errorCode: "duplicate-conversation-id",
    });
    await expect(
      service.get(`episode:${FIRST_CONVERSATION}:user-1`, {
        scopeDir: "Projects/Atlas",
      }),
    ).resolves.toMatchObject({ status: "ambiguous" });
  });

  it("yields between bounded 200-entry ingestion batches", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const snapshot = await repository.create({
      id: FIRST_CONVERSATION,
      scopeDir: "Projects/Large",
      now: "2026-08-20T09:00:00.000Z",
    });
    await repository.appendTranscript(
      snapshot.location,
      Array.from({ length: 401 }, (_, index) => ({
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: `message-${index}`,
        type: "message" as const,
        role: "user" as const,
        text: `Memory message ${index}`,
        createdAt: new Date(Date.UTC(2026, 7, 20, 9, 0, index)).toISOString(),
      })),
    );
    const database = new MemoryAppDatabase("memory-batching");
    await database.open();
    const yieldToApp = vi.fn(async () => undefined);
    const service = new NativeMemoryService(repository, database, {
      yieldToApp,
    });

    await service.ingestConversation(snapshot.location);

    expect(yieldToApp).toHaveBeenCalledTimes(2);
    expect(
      (await database.listSearchDocuments()).filter(
        (document) =>
          document.sourceProviderId === AI_MEMORY_EPISODIC_PROVIDER_ID,
      ),
    ).toHaveLength(401);
  });
});
