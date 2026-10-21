// SPDX-License-Identifier: Apache-2.0
import { MemoryFolderManager } from "../memory/folder-manager.ts";
import { memoryLock } from "../memory/note-io.ts";
import type { AiApplication } from "./application.ts";
import { NativeMemoryService } from "../memory/native-memory-service.ts";
import { VaultMemoryRecordStore } from "../memory/vault-memory-record-store.ts";
import { RuntimeMemoryConsolidationProvider } from "../memory/runtime-consolidation-provider.ts";
import { RuntimeHandoffSummaryProvider } from "../conversations/runtime-handoff-summary.ts";
import { HandoffSummaryCoordinator } from "../conversations/handoff-summary.ts";
export class AiMemory {
  readonly memory: NativeMemoryService;
  readonly store: VaultMemoryRecordStore;
  private releaseSettings?: () => void;
  readonly handoffSummaries: HandoffSummaryCoordinator;
  constructor(private readonly host: AiApplication) {
    const consolidation = new RuntimeMemoryConsolidationProvider({
      configuration: () => {
        const settings = host.getSettings();
        if (settings.memoryConsolidationRuntime !== "acp")
          throw new Error("Saved memory runtime is unavailable.");
        return {
          runtimeId: "acp",
          agent: settings.memoryConsolidationAgent,
          model: settings.memoryConsolidationModel,
        };
      },
      resolveRuntime: (request) => host.selectRuntime(request),
    });
    const configuration = () => {
      const settings = host.getSettings();
      if (settings.handoffSummaryRuntime !== "acp")
        throw new Error("Saved handoff-summary runtime is unavailable.");
      return {
        runtime: "acp" as const,
        agent: settings.handoffSummaryAgent,
        model: settings.handoffSummaryModel,
      };
    };
    const summaries = new RuntimeHandoffSummaryProvider({
      configuration,
      resolveRuntime: (request) => host.selectRuntime(request),
    });
    this.handoffSummaries = new HandoffSummaryCoordinator(
      host.conversations,
      summaries,
      configuration,
      () => host.getSettings().handoffSummariesEnabled,
    );
    this.store = new VaultMemoryRecordStore(host.app.vault, {
      app: host.app,
      folder: () => host.getSettings().memoryFolder,
      timezone: () => host.getSettings().memoryTimezone,
    });
    this.memory = new NativeMemoryService(
      host.conversations,
      host.app.appDatabase,
      {
        recordStore: this.store,
        captureEnabled: () => host.getSettings().memoryAutomaticCapture,
        promoteAfterTurn: true,
        consolidationProvider: () =>
          host.getSettings().memoryConsolidationEnabled
            ? consolidation
            : undefined,
      },
    );
  }
  async start(): Promise<void> {
    const { host } = this;
    if (!host.settings.hasStoredSetting("memoryTimezone"))
      await host.settings.persistDefaults();
    await memoryLock(host.app.vault, async () => {
      const fresh =
        (await this.store.io.read(".lapis/memory/state.json")) === null;
      await this.store.ledger.initialize(
        new Date(),
        host.getSettings().memoryFolder,
      );
      if (fresh) {
        const checkpoints: Record<string, string[]> = {};
        for (const entry of await host.conversations.listAll())
          if (!entry.unavailableReason)
            checkpoints[entry.location.conversationId] = (
              await host.conversations.read(entry.location)
            ).transcript.map((item) => item.id);
        await this.store.ledger.update((state) => {
          state.checkpoints = checkpoints;
        });
        for (const source of await host.app.appDatabase.listMemorySourceStates()) {
          await host.app.appDatabase.deleteMemoryCandidatesByConversation(
            source.sourceKey,
          );
          await host.app.appDatabase.deleteMemorySourceState(source.sourceKey);
        }
        for (const {
          candidate,
          origins,
        } of await host.app.appDatabase.queryMemoryCandidates({
          limit: 10_000,
        })) {
          for (const origin of origins)
            await host.app.appDatabase.deleteMemoryCandidatesByConversation(
              origin.conversationId,
            );
          void candidate;
        }
        for (const document of await host.app.appDatabase.listSearchDocuments())
          if (
            document.sourceProviderId === "ai-memory-curated" ||
            document.sourceProviderId === "ai-memory-episodic"
          )
            await host.app.appDatabase.deleteSearchDocument(document.path);
      }
    });
    const folders = new MemoryFolderManager(
      host.app,
      this.store,
      host.settings,
    );
    await folders.recover();
    await this.store.resumePending();
    this.releaseSettings = host.settings.useTransaction(folders.transaction);
  }
  stop(): void {
    this.releaseSettings?.();
  }
}
