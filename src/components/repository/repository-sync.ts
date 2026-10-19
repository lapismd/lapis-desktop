import type { RepositoryPlugin } from "./repository-plugin.ts";
import type { RepositoryServices } from "../../lib/repository/history-reader.ts";
import { SyncController } from "../../lib/repository/sync-controller.ts";
import { syncRecovery } from "../../lib/repository/sync-recovery.ts";
import { updateRepositoryData } from "../../lib/repository/plugin-data.ts";
import { BackgroundWork } from "../../lib/desktop/background-work.ts";
/** Open-vault lifetime; independent of settings and status visibility. */
export class RepositorySync {
  readonly controller: SyncController;
  #stops: (() => void)[] = [];
  #timer?: ReturnType<typeof setTimeout>;
  #closed = false;
  #enabled = true;
  #ready = false;
  #attempt = 0;
  #checkpoint?: string;
  #failed = false;
  #busy = false;
  #retryAfter = 0;
  constructor(
    readonly plugin: RepositoryPlugin,
    services: RepositoryServices,
  ) {
    this.controller = new SyncController(
      services.remote!,
      services.sync!,
      (action) => plugin.app.fileEditingSessions.guard(undefined, action),
      plugin.feedback("Vault synchronization", "repository-history:sync"),
      syncRecovery(plugin),
    );
    plugin.addCommand({
      id: "synchronize-backup",
      name: "Synchronize vault backup",
      callback: () => this.controller.run(),
    });
  }
  async start() {
    this.#enabled = (await this.plugin.loadData())?.automaticSync !== false;
    if (this.#closed) return;
    this.#stops.push(
      this.plugin.backup!.controller.subscribe((status) => {
        this.#ready = status.phase === "ready";
        if (status.phase === "closed") this.controller.setEnabled(false);
        else if (this.#ready) {
          this.controller.setEnabled(this.#enabled);
          if (status.checkpoint?.commit !== this.#checkpoint) {
            this.#checkpoint = status.checkpoint?.commit;
            this.#schedule(5000);
          }
        }
      }),
    );
    const progress = new BackgroundWork(
      this.plugin.app.notifications,
      this.plugin.id,
    ).follow("Synchronizing vault backup", {
      subscribe: (listener) =>
        this.controller.subscribe((state) =>
          listener({ busy: state.busy, phase: state.phase }),
        ),
    });
    this.#stops.push(
      this.controller.subscribe((snapshot) => {
        this.#failed = snapshot.phase === "attention";
        this.#busy = snapshot.busy;
      }),
    );
    this.#stops.push(() => {
      void this.controller.drained().finally(progress);
    });
    this.#schedule(1000);
  }
  #schedule(delay: number) {
    if (this.#closed) return;
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = setTimeout(
      () => {
        this.#timer = undefined;
        if (this.#ready && this.#enabled && !this.#busy) {
          void this.controller.run().finally(() => {
            this.#attempt = this.#failed ? Math.min(this.#attempt + 1, 4) : 0;
            const delay = 60_000 * 2 ** this.#attempt;
            this.#retryAfter = this.#failed ? Date.now() + delay : 0;
            this.#schedule(delay);
          });
        } else this.#schedule(this.#busy ? 5000 : 60_000);
      },
      Math.max(delay, this.#retryAfter - Date.now()),
    );
  }
  async setEnabled(enabled: boolean) {
    await updateRepositoryData(this.plugin, { automaticSync: enabled });
    this.#enabled = enabled;
    this.controller.setEnabled(enabled && this.#ready);
    this.#attempt = 0;
    this.#retryAfter = 0;
    this.#schedule(1000);
  }
  close() {
    this.#closed = true;
    if (this.#timer) clearTimeout(this.#timer);
    this.controller.close();
    for (const stop of this.#stops) stop();
    this.#stops = [];
  }
}
