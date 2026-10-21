import { noteVault } from "./note-fixture.ts";
import { describe, expect, it } from "vitest";
import { MemoryRecordConflictError } from "../../../src/lib/ai/memory/memory-record-store.ts";
import { VaultMemoryRecordStore } from "../../../src/lib/ai/memory/vault-memory-record-store.ts";
import { sha256ConversationText as sha256Text } from "../../../src/lib/ai/conversations/hashes.ts";
import type { DurableMemoryRecord } from "../../../src/lib/ai/memory/types.ts";

const evidence = {
  conversationId: "123e4567-e89b-42d3-a456-426614174000",
  entryId: "message-1",
  entryHash: "a".repeat(64),
  observedAt: "2026-08-20T09:00:00.000Z",
  scopeDirAtObservation: "Projects/Atlas",
};

function record(patch: Partial<DurableMemoryRecord> = {}): DurableMemoryRecord {
  return {
    schemaVersion: 1,
    id: "memory-atlas-headings",
    revision: 1,
    kind: "preference",
    scope: { kind: "project", projectDir: "Projects/Atlas" },
    status: "active",
    supersessionKey: "writing.headings",
    importance: 4,
    triggers: ["writing", "headings"],
    summary: "Use compact headings in Atlas notes.",
    evidence: [evidence],
    createdBy: "deterministic-promotion",
    createdAt: "2026-08-20T09:00:00.000Z",
    updatedAt: "2026-08-20T09:00:00.000Z",
    ...patch,
  };
}

describe("VaultMemoryRecordStore", () => {
  it("writes readable daily history and a current curated conclusion", async () => {
    const vault = noteVault();
    const store = new VaultMemoryRecordStore(vault);
    const first = await store.write(record());
    const secondRecord = record({
      revision: 2,
      summary: "Use compact sentence-case headings in Atlas notes.",
      previousRevisionHash: first.hash,
      updatedAt: "2026-08-27T09:00:00.000Z",
    });

    const second = await store.write(secondRecord, {
      expectedCurrentHash: first.hash,
    });

    const currentPath = "Memory/Projects/Projects/Atlas/MEMORY.md";
    const current = vault.getFileByPath(currentPath);
    const revision = vault.getFileByPath(
      "Memory/Projects/Projects/Atlas/2026-08-20.md",
    );
    expect(current && (await vault.read(current))).toContain(
      "Use compact sentence-case headings",
    );
    expect(revision && (await vault.read(revision))).toContain(
      "Use compact headings in Atlas notes.",
    );
    await expect(
      store.listHistory(secondRecord.id, secondRecord.scope),
    ).resolves.toMatchObject([{ revision: 1 }]);
    await expect(store.find(secondRecord.id)).resolves.toMatchObject([
      { record: { revision: 2 }, hash: second.hash },
    ]);
  });

  it("never overwrites an owner edit made after the expected preimage", async () => {
    const vault = noteVault();
    const store = new VaultMemoryRecordStore(vault);
    const first = await store.write(record());
    const file = vault.getFileByPath(first.path)!;
    await vault.modify(
      file,
      (await vault.read(file)).replace(
        "Use compact headings in Atlas notes.",
        "Owner edit.",
      ),
    );

    await expect(
      store.write(
        record({
          revision: 2,
          summary: "Consolidator replacement",
          previousRevisionHash: first.hash,
          updatedAt: "2026-08-27T09:00:00.000Z",
        }),
        { expectedCurrentHash: first.hash },
      ),
    ).rejects.toBeInstanceOf(MemoryRecordConflictError);
    expect(await vault.read(file)).toContain("Owner edit.");
    expect(await store.listHistory(record().id, record().scope)).toEqual([]);
  });

  it("preserves handwritten paragraphs while updating a generated entry", async () => {
    const vault = noteVault();
    const store = new VaultMemoryRecordStore(vault);
    const first = await store.write(record());
    const file = vault.getFileByPath(first.path)!;
    await vault.modify(
      file,
      `${await vault.read(file)}\nOwner formatting and notes.\n`,
    );
    await store.write(
      record({
        revision: 2,
        summary: "Use sentence-case headings.",
        previousRevisionHash: first.hash,
      }),
      { expectedCurrentHash: first.hash },
    );
    expect(await vault.read(file)).toContain("Owner formatting and notes.");
    expect(await vault.read(file)).toContain("Use sentence-case headings.");
  });

  it("rejects cross-vault and hidden project paths from editable frontmatter", async () => {
    const vault = noteVault();
    const store = new VaultMemoryRecordStore(vault);

    await expect(
      store.write(
        record({ scope: { kind: "project", projectDir: "../other" } }),
      ),
    ).rejects.toThrow("scope is invalid");
    await expect(
      store.write(
        record({
          id: "memory-hidden",
          scope: { kind: "project", projectDir: "Projects/.lapis/private" },
        }),
      ),
    ).rejects.toThrow("scope is invalid");
  });

  it("requires grounded evidence for every automatic record", async () => {
    const vault = noteVault();
    const store = new VaultMemoryRecordStore(vault);

    await expect(
      store.write(record({ evidence: [], createdBy: "consolidator" })),
    ).rejects.toThrow("requires evidence");
    await expect(
      store.write(record({ evidence: [], createdBy: "owner-ui" })),
    ).resolves.toMatchObject({ record: { createdBy: "owner-ui" } });
  });
});
