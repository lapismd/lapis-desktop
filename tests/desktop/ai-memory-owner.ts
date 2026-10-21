import {
  App,
  MemoryAppDatabase,
  NativeDesktopVaultAdapter,
} from "@lapis-notes/api";
import { VaultMemoryRecordStore } from "../../src/lib/ai/memory/vault-memory-record-store.ts";
import { MemoryFolderManager } from "../../src/lib/ai/memory/folder-manager.ts";
import { AiSettingsStore } from "../../src/lib/ai/settings/settings-store.ts";
import { NativeMemoryService } from "../../src/lib/ai/memory/native-memory-service.ts";
import { ConversationRepository } from "../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../src/lib/ai/conversations/memory-transcript-store.ts";

/** Construct synchronously in the proof component's initialization context. */
export function createMemoryProofOwner(root: string) {
  const adapter = new NativeDesktopVaultAdapter(
    root,
    undefined,
    "tauri-desktop",
  );
  const database = new MemoryAppDatabase("native-memory-proof");
  const app = new App({
    version: "acceptance",
    configPath: ".lapis/memory-proof-config.json",
    adapter,
    appDatabase: database,
    markdownRenderer: async () => {},
  });
  const settingsPath = ".lapis/memory/proof-settings.json";
  const settings = new AiSettingsStore(async (data) => {
    await store.io.update(settingsPath, () => JSON.stringify(data));
  });
  const store = new VaultMemoryRecordStore(app.vault, {
    app,
    folder: () => settings.get().memoryFolder,
    timezone: () => "UTC",
  });
  const memory = new NativeMemoryService(
    new ConversationRepository(new MemoryTranscriptStore()),
    database,
    { recordStore: store },
  );
  const ready = (async () => {
    await database.open();
    await app.vault.load();
    await app.configuration.load();
    if (await adapter.exists(settingsPath))
      settings.hydrate(JSON.parse(await adapter.read(settingsPath)));
    await store.ledger.initialize(new Date(), settings.get().memoryFolder);
    const folders = new MemoryFolderManager(app, store, settings);
    await folders.recover();
    settings.useTransaction(folders.transaction);
  })();
  let closing: Promise<void> | undefined;
  return {
    app,
    store,
    settings,
    memory,
    ready,
    close: () =>
      (closing ??= (async () => {
        await ready;
        await settings.settle();
        await app.fileEditingSessions.settleOperations();
        await app.fileEditingSessions.dispose();
        await app.metadataCache.dispose();
        await app.workspace.disposeWorkspaceHost();
        await database.close();
      })()),
  };
}
export type MemoryProofOwner = ReturnType<typeof createMemoryProofOwner>;
