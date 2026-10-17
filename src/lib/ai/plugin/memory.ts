// SPDX-License-Identifier: Apache-2.0
import type { AiApplication } from "./application.ts";
import { NativeMemoryService } from "../memory/native-memory-service.ts";
import { VaultMemoryRecordStore } from "../memory/vault-memory-record-store.ts";
import { RuntimeMemoryConsolidationProvider } from "../memory/runtime-consolidation-provider.ts";
import { RuntimeHandoffSummaryProvider } from "../conversations/runtime-handoff-summary.ts";
import { HandoffSummaryCoordinator } from "../conversations/handoff-summary.ts";
export class AiMemory {
  readonly memory: NativeMemoryService;
  readonly handoffSummaries: HandoffSummaryCoordinator;
  constructor(host: AiApplication) {
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
    this.memory = new NativeMemoryService(
      host.conversations,
      host.app.appDatabase,
      {
        recordStore: new VaultMemoryRecordStore(host.app.vault),
        consolidationProvider: () =>
          host.getSettings().memoryConsolidationEnabled
            ? consolidation
            : undefined,
      },
    );
  }
}
