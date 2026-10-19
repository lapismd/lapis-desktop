import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { mount, unmount } from "svelte";
import { ForgeController } from "../../../lib/repository/forge-controller.ts";
import type { RepositoryServices } from "../../../lib/repository/history-reader.ts";
import { RemoteController } from "../../../lib/repository/remote-controller.ts";
import type { RestoreController } from "../../../lib/repository/restore.ts";
import { BackgroundWork } from "../../../lib/desktop/background-work.ts";
import type { RepositoryPlugin } from "../repository-plugin.ts";
import BackupSettings from "./BackupSettings.svelte";
import { createRemoteRestore } from "./remote-restore.ts";
import type { StorageController } from "../../../lib/repository/storage-controller.ts";
import { adoptionSettings } from "./adoption-settings.ts";
import type { AdoptionController } from "../../../lib/repository/adoption-controller.ts";
import { storageSettings } from "./storage-settings.ts";
type Controller = ForgeController | RemoteController | RestoreController;

class BackupSettingsView extends View {
  #controller?: ForgeController;
  #component?: ReturnType<typeof mount>;
  #progress?: () => void;
  #remote?: RemoteController;
  #restore?: RestoreController;
  #remoteProgress?: () => void;
  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: RepositoryPlugin,
    private readonly services: RepositoryServices,
    private readonly controllers: Set<Controller>,
    private readonly storage?: StorageController,
    private readonly adoption?: AdoptionController,
  ) {
    super(leaf);
  }
  getViewType() {
    return "repository-backup-settings";
  }
  getDisplayText() {
    return "Backup settings";
  }
  getIcon() {
    return "cloud-upload";
  }
  protected async onOpen() {}
  protected async onClose() {}
  onload() {
    const controller = (this.#controller = new ForgeController(
      this.services.forges!,
      this.plugin.feedback(
        "Forge accounts",
        "repository-history:forge-accounts",
      ),
    ));
    this.controllers.add(controller);
    this.#progress = new BackgroundWork(
      this.app.notifications,
      this.plugin.id,
    ).follow("Connecting forge accounts", {
      subscribe: (listener) => controller.subscribeActivity(listener),
    });
    if (this.services.remote) {
      this.#remote = new RemoteController(
        this.services.remote,
        this.plugin.feedback("Remote backup", "repository-history:remote"),
      );
      this.#restore = createRemoteRestore(this.plugin, this.services.remote);
      this.controllers.add(this.#remote);
      if (this.#restore) this.controllers.add(this.#restore);
      const remote = this.#remote;
      this.#remoteProgress = new BackgroundWork(
        this.app.notifications,
        this.plugin.id,
      ).follow("Remote vault backup", {
        subscribe: (listener) => remote.subscribeActivity(listener),
      });
    }
    this.#component = mount(BackupSettings, {
      target: this.containerEl,
      props: {
        controller,
        remote: this.#remote,
        restore: this.#restore,
        storage: this.storage,
        adoption: this.adoption,
        sync: this.plugin.backup?.sync?.controller,
        setSyncEnabled: (enabled) =>
          this.plugin
            .backup!.sync!.setEnabled(enabled)
            .catch((error) => this.plugin.report(error)),
      },
    });
  }
  onunload() {
    if (this.#component) void unmount(this.#component);
    this.#component = undefined;
    if (this.#controller) {
      const controller = this.#controller;
      const progress = this.#progress;
      void controller.close().catch((error) => this.plugin.report(error));
      void controller.drained().finally(() => progress?.());
    }
    if (this.#controller) this.controllers.delete(this.#controller);
    this.#controller = undefined;
    if (this.#remote) {
      const remote = this.#remote,
        progress = this.#remoteProgress;
      remote.close();
      void remote.drained().finally(() => progress?.());
      this.controllers.delete(remote);
      this.#remote = undefined;
    }
    if (this.#restore) {
      this.#restore.close();
      this.controllers.delete(this.#restore);
    }
    this.#restore = undefined;
  }
}
export function openBackupSettings(plugin: RepositoryPlugin) {
  const host = getWorkspaceHostBinding(plugin.app.workspace).controller;
  host.settings.close();
  const workspace = host.workspace;
  const existing = workspace.getLeavesOfType("repository-backup-settings")[0];
  if (existing) workspace.revealLeaf(existing);
  else if (
    !workspace.openLeaf("repository-backup-settings", {}, { active: true })
  )
    throw new Error("Backup settings could not be opened");
}
export function registerBackupSettings(
  plugin: RepositoryPlugin,
  services: RepositoryServices,
) {
  if (!services.forges) return;
  const controllers = new Set<Controller>();
  const storage = storageSettings(plugin, services.storage);
  const adoption = adoptionSettings(plugin, services.adoption);
  plugin.registerView(
    "repository-backup-settings",
    (leaf) =>
      new BackupSettingsView(
        leaf,
        plugin,
        services,
        controllers,
        storage?.controller,
        adoption?.controller,
      ),
    {
      kind: "command",
      command: {
        id: "open-backup-settings",
        name: "Open Repository Backup Settings",
        callback: () => openBackupSettings(plugin),
      },
    },
  );
  return async () => {
    await Promise.all([storage?.close(), adoption?.close()]);
    await Promise.allSettled(
      [...controllers].map((controller) => controller.close()),
    );
    controllers.clear();
  };
}
