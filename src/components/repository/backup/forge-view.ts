import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { mount, unmount } from "svelte";
import { ForgeController } from "../../../lib/repository/forge-controller.ts";
import type { ForgeService } from "../../../lib/repository/forge-accounts.ts";
import { BackgroundWork } from "../../../lib/desktop/background-work.ts";
import type { RepositoryPlugin } from "../repository-plugin.ts";
import ForgeAccounts from "./ForgeAccounts.svelte";

class BackupSettingsView extends View {
  #controller?: ForgeController;
  #component?: ReturnType<typeof mount>;
  #progress?: () => void;
  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: RepositoryPlugin,
    private readonly service: ForgeService,
    private readonly controllers: Set<ForgeController>,
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
      this.service,
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
    this.#component = mount(ForgeAccounts, {
      target: this.containerEl,
      props: { controller },
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
  service: ForgeService | undefined,
) {
  if (!service) return;
  const controllers = new Set<ForgeController>();
  plugin.registerView(
    "repository-backup-settings",
    (leaf) => new BackupSettingsView(leaf, plugin, service, controllers),
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
    await Promise.allSettled(
      [...controllers].map((controller) => controller.close()),
    );
    controllers.clear();
  };
}
