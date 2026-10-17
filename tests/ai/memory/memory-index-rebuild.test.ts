import { MemoryAppDatabase } from "@lapis-notes/api/app-database";
import { describe, expect, it } from "vitest";
import { ConversationRepository } from "../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { NativeMemoryService } from "../../../src/lib/ai/memory/native-memory-service.ts";

describe("derived memory path rebuild", () => {
  it("replaces old tilde paths without changing transcript authority or opaque refs", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const { location } = await repository.create({
      id: "123e4567-e89b-42d3-a456-426614174000",
      scopeDir: "Notes~Draft",
      now: "2026-08-20T09:00:00.000Z",
    });
    await repository.appendTranscript(location, [
      {
        schemaVersion: 3,
        id: "entry~2Fone",
        type: "message",
        role: "user",
        text: "Remember that this project uses compact headings.",
        createdAt: "2026-08-20T09:00:01.000Z",
      },
    ]);
    const before = await repository.read(location);
    const database = new MemoryAppDatabase("tilde-rebuild");
    await database.open();
    try {
      const memory = new NativeMemoryService(repository, database);
      await memory.rebuild();
      const current = (await database.listSearchDocuments())[0]!;
      const oldPath = current.path.replaceAll("~7E", "~");
      expect(oldPath).not.toBe(current.path);
      await database.deleteSearchDocument(current.path);
      await database.upsertSearchDocument({ ...current, path: oldPath });
      await memory.rebuild();
      expect(
        (await database.listSearchDocuments()).map((doc) => doc.path),
      ).toEqual([current.path]);
      const results = await memory.search(
        { query: "compact headings" },
        { scopeDir: location.scopeDir },
      );
      expect(results[0]?.ref).toBe(
        `episode:${location.conversationId}:entry~2Fone`,
      );
      await expect(
        memory.get(results[0]!.ref, { scopeDir: location.scopeDir }),
      ).resolves.toMatchObject({
        status: "available",
        evidenceMessages: [{ verification: "matching" }],
      });
      expect(await repository.read(location)).toEqual(before);
    } finally {
      await database.close();
    }
  });
});
