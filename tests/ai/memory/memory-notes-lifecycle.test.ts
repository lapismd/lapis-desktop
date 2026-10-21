import { expect, it } from "vitest";
import { MemoryAppDatabase } from "@lapis-notes/api/app-database";
import { noteVault } from "./note-fixture.ts";
import { VaultMemoryRecordStore } from "../../../src/lib/ai/memory/vault-memory-record-store.ts";
import {
  memoryDate,
  memoryFolder,
} from "../../../src/lib/ai/memory/note-paths.ts";
import { NativeMemoryService } from "../../../src/lib/ai/memory/native-memory-service.ts";
import { ConversationRepository } from "../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../src/lib/ai/conversations/memory-transcript-store.ts";
import type { DurableMemoryRecord } from "../../../src/lib/ai/memory/types.ts";

const record = (id = "memory-sentences"): DurableMemoryRecord => ({
  schemaVersion: 1,
  id,
  revision: 1,
  kind: "preference",
  scope: { kind: "workspace" },
  status: "active",
  importance: 4,
  triggers: ["sentences"],
  summary: "Use short sentences.",
  evidence: [],
  createdBy: "owner-ui",
  createdAt: "2026-10-21T12:00:00Z",
  updatedAt: "2026-10-21T12:00:00Z",
});

it("uses a configurable visible vault folder and a saved timezone", async () => {
  const vault = noteVault();
  const store = new VaultMemoryRecordStore(vault, {
    folder: () => "Journal/Memory",
    timezone: () => "Europe/London",
  });
  await store.write({ ...record(), updatedAt: "2026-10-21T23:30:00Z" });
  expect(vault.getFileByPath("Journal/Memory/2026-10-22.md")).not.toBeNull();
  expect(memoryDate("2026-03-29T00:30:00Z", "Europe/London")).toBe(
    "2026-03-29",
  );
  expect(() => memoryFolder("../Memory")).toThrow();
  expect(() => memoryFolder(".lapis/memory")).toThrow();
});

it("serializes concurrent appends and makes repeated publication idempotent", async () => {
  const vault = noteVault();
  const a = new VaultMemoryRecordStore(vault);
  const b = new VaultMemoryRecordStore(vault);
  await Promise.all([
    a.write(record("memory-one")),
    b.write(record("memory-two")),
  ]);
  await a.write(record("memory-one"));
  const note = await vault.read(vault.getFileByPath("Memory/MEMORY.md")!);
  expect(note.match(/<!-- memory:memory-one -->/gu)).toHaveLength(1);
  expect(note.match(/<!-- memory:memory-two -->/gu)).toHaveLength(1);
});

it("does not resurrect a deleted generated entry on rebuild or later promotion", async () => {
  const vault = noteVault();
  const store = new VaultMemoryRecordStore(vault);
  await store.write(record());
  const file = vault.getFileByPath("Memory/MEMORY.md")!;
  await vault.modify(file, "# Memory\n");
  const restarted = new VaultMemoryRecordStore(vault);
  await expect(restarted.list()).resolves.toEqual([]);
  await expect(restarted.write(record())).rejects.toThrow("removed");
});

it("resumes the exact prepared publication after interrupted note IO", async () => {
  const vault = noteVault();
  const store = new VaultMemoryRecordStore(vault);
  const create = vault.create.bind(vault);
  let fail = true;
  vault.create = async (...args) => {
    if (args[0] === "Memory/MEMORY.md" && fail) {
      fail = false;
      throw new Error("Disk unavailable");
    }
    return create(...args);
  };
  await expect(store.write(record())).rejects.toThrow("Disk unavailable");
  const restarted = new VaultMemoryRecordStore(vault);
  await restarted.resumePending();
  expect((await restarted.find(record().id))[0]?.record.summary).toBe(
    "Use short sentences.",
  );
  expect(
    (await vault.read(vault.getFileByPath("Memory/2026-10-21.md")!)).match(
      /<!-- memory:/gu,
    ),
  ).toHaveLength(1);
});

it("captures a completed turn, recalls its note, and preserves forgetting across restart", async () => {
  const vault = noteVault();
  const store = new VaultMemoryRecordStore(vault);
  await store.ledger.initialize(new Date("2026-10-20T00:00:00Z"));
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  const conversation = await repository.create({
    scopeDir: "Atlas",
    now: "2026-10-21T12:00:00Z",
  });
  await repository.appendTranscript(conversation.location, [
    {
      schemaVersion: 1,
      id: "user-1",
      type: "message",
      role: "user",
      text: "Remember that this project uses short sentences.",
      createdAt: "2026-10-21T12:00:00Z",
    },
    {
      schemaVersion: 1,
      id: "assistant-1",
      type: "message",
      role: "assistant",
      text: "Understood.",
      createdAt: "2026-10-21T12:00:01Z",
    },
  ]);
  const database = new MemoryAppDatabase("memory-note-turn");
  await database.open();
  const service = new NativeMemoryService(repository, database, {
    recordStore: store,
    promoteAfterTurn: true,
    now: () => new Date("2026-10-21T12:00:02Z"),
  });
  await service.ingestConversation(conversation.location);
  const notes = await service.recall("short sentences", { scopeDir: "Atlas" });
  expect(notes).toHaveLength(1);
  expect(notes[0]!.content).toContain("Memory/Projects/Atlas/MEMORY.md");
  expect(
    await service.recall("short sentences", { scopeDir: "Other" }),
  ).toEqual([]);
  expect((await service.get(notes[0]!.id, { scopeDir: "Other" })).status).toBe(
    "missing",
  );
  await service.forgetConversation(conversation.location);
  await service.rebuild();
  await service.recoverCapture();
  expect(
    await service.recall("short sentences", { scopeDir: "Atlas" }),
  ).toEqual([]);
  expect(
    await vault.read(
      vault.getFileByPath("Memory/Projects/Atlas/2026-10-21.md")!,
    ),
  ).not.toContain("short sentences");
  expect(
    (await repository.read(conversation.location)).transcript,
  ).toHaveLength(2);
  await database.close();
});

it("rebuilds indexes without extracting new memories from historical transcripts", async () => {
  const vault = noteVault();
  const store = new VaultMemoryRecordStore(vault);
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  const conversation = await repository.create({
    scopeDir: "",
    now: "2026-01-01T00:00:00Z",
  });
  await repository.appendTranscript(conversation.location, [
    {
      schemaVersion: 1,
      id: "old",
      type: "message",
      role: "user",
      text: "Remember that I prefer old notes.",
      createdAt: "2026-01-01T00:00:00Z",
    },
  ]);
  const database = new MemoryAppDatabase("memory-note-rebuild");
  await database.open();
  const service = new NativeMemoryService(repository, database, {
    recordStore: store,
    promoteAfterTurn: true,
  });
  await service.rebuild();
  expect(await database.queryMemoryCandidates()).toEqual([]);
  expect(await store.list()).toEqual([]);
  await database.close();
});
