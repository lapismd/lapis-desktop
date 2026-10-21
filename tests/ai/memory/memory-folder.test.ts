import { expect, it, vi } from "vitest";
import type { App } from "@lapis-notes/api";
import { noteVault } from "./note-fixture.ts";
import { AiSettingsStore } from "../../../src/lib/ai/settings/settings-store.ts";
import { MemoryFolderManager } from "../../../src/lib/ai/memory/folder-manager.ts";
import { VaultMemoryRecordStore } from "../../../src/lib/ai/memory/vault-memory-record-store.ts";

async function fixture() {
  const vault = noteVault();
  await vault.mkpath("Memory");
  await vault.create("Memory/MEMORY.md", "# Memory\n\nHandwritten memory.\n");
  const save = vi.fn(async (_data: Record<string, unknown>) => {});
  const settings = new AiSettingsStore(save);
  const app = {
    vault,
    fileManager: {
      renameFile: (file: Parameters<typeof vault.rename>[0], path: string) =>
        vault.rename(file, path),
    },
  } as App;
  const store = new VaultMemoryRecordStore(vault, {
    folder: () => settings.get().memoryFolder,
  });
  await store.ledger.initialize(new Date());
  const manager = new MemoryFolderManager(app, store, settings);
  settings.useTransaction(manager.transaction);
  return { vault, save, settings, store, manager };
}

it("moves the existing folder before publishing its setting", async () => {
  const { vault, settings, store } = await fixture();
  await settings.update({ memoryFolder: "Journal/Memory" });
  expect(vault.getFolderByPath("Memory")).toBeNull();
  expect(vault.getFileByPath("Journal/Memory/MEMORY.md")).not.toBeNull();
  expect(settings.get().memoryFolder).toBe("Journal/Memory");
  expect((await store.ledger.state()).relocation).toBeUndefined();
});

it("preserves both locations when the destination exists", async () => {
  const { vault, settings } = await fixture();
  await vault.mkpath("Journal");
  await expect(settings.update({ memoryFolder: "Journal" })).rejects.toThrow(
    "already exists",
  );
  expect(settings.get().memoryFolder).toBe("Memory");
  expect(vault.getFileByPath("Memory/MEMORY.md")).not.toBeNull();
  expect(vault.getFolderByPath("Journal")).not.toBeNull();
});

it("rolls back movement if saving the setting fails", async () => {
  const { vault, save, settings } = await fixture();
  save.mockRejectedValueOnce(new Error("Settings disk failure"));
  await expect(settings.update({ memoryFolder: "Journal" })).rejects.toThrow(
    "Settings disk failure",
  );
  expect(settings.get().memoryFolder).toBe("Memory");
  expect(vault.getFileByPath("Memory/MEMORY.md")).not.toBeNull();
  expect(vault.getFolderByPath("Journal")).toBeNull();
});

it("recovers an interrupted folder move before allowing new writes", async () => {
  const { vault, store, settings } = await fixture();
  await store.ledger.update((state) => {
    state.relocation = { from: "Memory", to: "Journal" };
  });
  await vault.rename(vault.getFolderByPath("Memory")!, "Journal");
  const freshSettings = new AiSettingsStore(async () => {});
  const app = { vault } as App;
  await new MemoryFolderManager(app, store, freshSettings).recover();
  expect(freshSettings.get().memoryFolder).toBe("Journal");
  expect((await store.ledger.state()).relocation).toBeUndefined();
  expect(settings.get().memoryFolder).toBe("Memory");
});

it("uses the durable destination for another window's subsequent writes", async () => {
  const { vault, settings } = await fixture();
  const otherWindow = new VaultMemoryRecordStore(vault);
  await settings.update({ memoryFolder: "Journal" });
  const now = new Date().toISOString();
  await otherWindow.write({
    schemaVersion: 1,
    id: "memory-other-window",
    revision: 1,
    kind: "fact",
    scope: { kind: "workspace" },
    status: "active",
    importance: 3,
    triggers: [],
    summary: "Keep memory in the selected vault folder.",
    evidence: [],
    createdBy: "owner-ui",
    createdAt: now,
    updatedAt: now,
  });
  expect(vault.getFolderByPath("Memory")).toBeNull();
  expect((await otherWindow.find("memory-other-window"))[0]?.path).toBe(
    "Journal/MEMORY.md",
  );
});
