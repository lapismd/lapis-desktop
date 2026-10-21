import { noteVault } from "./note-fixture.ts";
import { expect, it } from "vitest";
import { VaultMemoryRecordStore } from "../../../src/lib/ai/memory/vault-memory-record-store.ts";
import type { DurableMemoryRecord } from "../../../src/lib/ai/memory/types.ts";

export function noteRecord(id = "memory-headings"): DurableMemoryRecord {
  return {
    schemaVersion: 1,
    id,
    revision: 1,
    kind: "preference",
    scope: { kind: "workspace" },
    status: "active",
    importance: 4,
    triggers: ["headings"],
    summary: "Use compact headings.",
    evidence: [],
    createdBy: "owner-ui",
    createdAt: "2026-10-21T12:30:00.000Z",
    updatedAt: "2026-10-21T12:30:00.000Z",
  };
}

it("writes readable daily notes and curated conclusions in the main vault", async () => {
  const vault = noteVault();
  const store = new VaultMemoryRecordStore(vault);
  await store.write(noteRecord());
  const daily = vault.getFileByPath("Memory/2026-10-21.md");
  const curated = vault.getFileByPath("Memory/MEMORY.md");
  expect(daily).not.toBeNull();
  expect(curated).not.toBeNull();
  expect(await vault.read(daily!)).toContain("Use compact headings.");
  expect(await vault.read(curated!)).toContain("2026-10-21.md");
  expect(vault.getFilesByGlob("**/records/*.md")).toHaveLength(0);
});

it("keeps handwritten prose and makes external note edits retrievable", async () => {
  const vault = noteVault();
  await vault.mkpath("Memory");
  const note = await vault.create(
    "Memory/MEMORY.md",
    "# Memory\n\nUse short paragraphs.\n",
  );
  const store = new VaultMemoryRecordStore(vault);
  await store.write(noteRecord());
  expect(await vault.read(note)).toContain("Use short paragraphs.");
  await vault.modify(
    note,
    (await vault.read(note)).replace(
      "compact headings",
      "sentence case headings",
    ),
  );
  expect(
    (await store.list()).some((item) =>
      item.record.summary.includes("sentence case headings"),
    ),
  ).toBe(true);
});

it("isolates project notes underneath the central memory folder", async () => {
  const vault = noteVault();
  const store = new VaultMemoryRecordStore(vault);
  await store.write({
    ...noteRecord(),
    scope: { kind: "project", projectDir: "Atlas" },
  });
  expect(vault.getFileByPath("Memory/Projects/Atlas/MEMORY.md")).not.toBeNull();
  expect(await store.list({ kind: "workspace" })).toHaveLength(0);
});

it("retains generated entry identity after an external CRLF formatting change", async () => {
  const vault = noteVault();
  const store = new VaultMemoryRecordStore(vault);
  await store.write(noteRecord());
  const file = vault.getFileByPath("Memory/MEMORY.md")!;
  await vault.modify(file, (await vault.read(file)).replaceAll("\n", "\r\n"));
  const entries = await store.list();
  expect(entries).toHaveLength(1);
  expect(entries[0]?.record.id).toBe("memory-headings");
  expect(entries[0]?.record.summary).toBe("Use compact headings.");
});
