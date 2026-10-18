import { BackupController } from "../../lib/repository/backup.ts";
import type { BackupService } from "../../lib/repository/backup.ts";
import { BackgroundWork } from "../../lib/desktop/background-work.ts";
import type { RepositoryPlugin } from "./repository-plugin.ts";

export const AUTOMATIC_BACKUP_SETTING = "repository-history.automaticBackup";
export const automaticBackup = (value: Record<string, unknown>) =>
  typeof value.automaticBackup === "boolean" ? value.automaticBackup : true;

/** Capture lifetime is independent of whether its status control is visible. */
export class RepositoryBackup {
  readonly controller: BackupController;
  #progress?: () => void;
  constructor(
    readonly plugin: RepositoryPlugin,
    service: BackupService,
  ) {
    this.controller = new BackupController(
      service,
      plugin.feedback("Vault backup"),
    );
  }
  async start() {
    this.#progress = new BackgroundWork(
      this.plugin.app.notifications,
      this.plugin.id,
    ).follow("Saving vault history", {
      subscribe: (listener) =>
        this.controller.subscribe((state) =>
          listener({
            busy: state.phase === "saving",
            phase: state.phase,
          }),
        ),
    });
    const enabled = automaticBackup((await this.plugin.loadData()) ?? {});
    // Admit the worker now; its first scan must not hold plugin/shell startup.
    if (enabled)
      void this.controller.start().catch((error) => this.plugin.report(error));
    else await this.controller.pause();
  }
  async setEnabled(enabled: boolean) {
    if (enabled) await this.controller.start();
    else await this.controller.pause();
  }
  async close() {
    await this.controller.close();
    this.#progress?.();
    this.#progress = undefined;
  }
}
