// SPDX-License-Identifier: Apache-2.0
import type { AiApplication } from "./application.ts";
import { ConversationIndexCoordinator } from "../conversations/conversation-index-coordinator.ts";
import { MemoryIngestionCoordinator } from "../memory/memory-ingestion-coordinator.ts";
import { MemoryMaintenanceScheduler } from "../memory/memory-scheduler.ts";
import { conversationMemoryScope } from "../memory/paths.ts";
export class AiMaintenance {
  readonly index: ConversationIndexCoordinator;
  readonly ingestion: MemoryIngestionCoordinator;
  readonly scheduler: MemoryMaintenanceScheduler;
  readonly #cleanup: (() => void)[] = [];
  constructor(private readonly host: AiApplication) {
    const report = (...values: unknown[]) =>
      host.app.logger.warn("AI maintenance failed", ...values);
    this.index = new ConversationIndexCoordinator(
      host.conversationIndex,
      report,
      150,
      (run) => host.background.run("Indexing AI conversations", run),
    );
    this.ingestion = new MemoryIngestionCoordinator(
      host.conversations,
      host.memory,
      report,
      150,
      (run) => host.background.run("Updating AI memory", run),
    );
    this.scheduler = new MemoryMaintenanceScheduler(
      host.app.appDatabase,
      host.memory,
      {
        onError: report,
        activity: (run) => host.background.run("Maintaining AI memory", run),
      },
    );
  }
  start(): void {
    const { app } = this.host;
    const changed = (file: { path: string }, oldPath?: string) => {
      if (!this.host.active) return;
      this.index.handleVaultChange(file.path, oldPath);
      this.ingestion.handleVaultChange(file.path, oldPath);
      if (
        [file.path, oldPath].some((path) =>
          path?.split("/").includes(".agents"),
        )
      ) {
        this.host.skills.invalidate();
        void this.host.operations
          .track(this.host.refreshFileCommands())
          .catch((error) => this.host.report(error));
      }
    };
    for (const name of ["create", "modify", "delete"] as const) {
      const ref = app.vault.on(name, changed);
      this.#cleanup.push(() => app.vault.offref(ref));
    }
    const renamed = app.vault.on("rename", (file, oldPath) => {
      changed(file, oldPath);
      this.host.conversationMoved(oldPath, file.path);
    });
    this.#cleanup.push(() => app.vault.offref(renamed));
    const leaf = app.workspace.on("active-leaf-change", (value) =>
      this.host.rememberFileScope(value),
    );
    this.#cleanup.push(() => app.workspace.offref(leaf));
    const skills = app.agentSkills.on("changed", () =>
      this.host.skills.invalidate(),
    );
    this.#cleanup.push(() => app.agentSkills.offref(skills));
    this.#cleanup.push(
      this.host.conversations.subscribe((change) => {
        if (change.type === "upsert")
          this.scheduler.noteActivity(
            conversationMemoryScope(change.location.scopeDir),
          );
      }),
    );
    const unsubscribeUser = this.host.userAgents?.subscribe?.(() => {
      void this.host.operations
        .track(this.host.refreshFileCommands())
        .catch((error) => this.host.report(error));
    });
    if (unsubscribeUser) this.#cleanup.push(unsubscribeUser);
    this.ingestion.startCatchUp();
    this.scheduler.start();
  }
  stop(): void {
    for (const cleanup of this.#cleanup.splice(0).reverse()) cleanup();
    this.index.dispose();
    this.ingestion.dispose();
    this.scheduler.dispose();
  }
  async settle(): Promise<void> {
    await Promise.all([
      this.index.settle(),
      this.ingestion.settle(),
      this.scheduler.settle(),
    ]);
  }
}
