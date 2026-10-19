import { mount, unmount } from "svelte";
import type { RepositoryServices } from "../../lib/repository/history-reader.ts";
import { WorkingCopyController } from "../../lib/repository/working-copy-controller.ts";
import { BackgroundWork } from "../../lib/desktop/background-work.ts";
import type { RepositoryPlugin } from "./repository-plugin.ts";
import RepositoryWorkingCopyStatus from "./RepositoryWorkingCopyStatus.svelte";
import RepositoryBackupStatus from "./RepositoryBackupStatus.svelte";
import { RESTORE_NOTICE } from "./restore-controller.ts";
import { createBackupSettings } from "./backup/backup-settings.ts";
import RepositorySettingsPage from "./backup/RepositorySettingsPage.svelte";
import { updateRepositoryData } from "../../lib/repository/plugin-data.ts";
import {
  AUTOMATIC_BACKUP_SETTING,
  automaticBackup,
} from "./repository-backup.ts";

export const WORKING_COPY_SETTING = "repository-history.showWorkingCopyStatus";
export function showWorkingCopyStatus(stored: unknown): boolean {
  if (!stored || typeof stored !== "object") return true;
  const value = (stored as Record<string, unknown>).showWorkingCopyStatus;
  return typeof value === "boolean" ? value : true;
}
/** Settings, contribution and refresh lifetime belong to the enabled plugin. */
export class RepositoryStatus {
  #data: Record<string, unknown> = {};
  #controller?: WorkingCopyController;
  #remove?: () => void;
  #events?: () => void;
  #closed = false;
  #transition = Promise.resolve();
  #settings?: ReturnType<typeof createBackupSettings>;
  constructor(
    private readonly plugin: RepositoryPlugin,
    private readonly services: RepositoryServices,
  ) {}
  async start(): Promise<void> {
    this.#data = (await this.plugin.loadData()) ?? {};
    if (this.#data.pendingRestore || this.#data.pendingRemoteRestore)
      this.plugin.app.notifications.notify({
        id: RESTORE_NOTICE,
        title: "Restore needs review",
        message: this.#data.pendingRemoteRestore
          ? "Open backup settings to check the interrupted remote restore."
          : "Open Repository History to check the interrupted restore.",
        source: this.plugin.id,
        severity: "warning",
        persist: false,
      });
    this.#settings = createBackupSettings(this.plugin, this.services);
    this.plugin.registerSettingsSection({
      section: {
        id: "repository-history",
        title: "Repository History",
        icon: "git-branch",
        description: "Automatic local history and backup status.",
        order: 46,
        navigationGroupId: "core-plugins",
        sourcePluginId: this.plugin.id,
        page: this.#settings ? RepositorySettingsPage : undefined,
        fields: [
          ...(this.services.backup
            ? [
                {
                  id: AUTOMATIC_BACKUP_SETTING,
                  type: "boolean" as const,
                  title: "Automatic local history",
                  description:
                    "Keep recoverable versions of saved files while this vault is open.",
                  default: true,
                },
              ]
            : []),
          {
            id: WORKING_COPY_SETTING,
            type: "boolean",
            title: "Show working copy status",
            description:
              "Show repository status in the status bar. Hiding it does not stop automatic backups.",
            default: true,
          },
          ...(this.#settings ? [this.#settings.field] : []),
        ],
      },
      source: {
        get: (id) =>
          id === AUTOMATIC_BACKUP_SETTING
            ? automaticBackup(this.#data)
            : showWorkingCopyStatus(this.#data),
        set: async (id, value) => {
          if (
            ![WORKING_COPY_SETTING, AUTOMATIC_BACKUP_SETTING].includes(id) ||
            typeof value !== "boolean"
          )
            throw new Error("Unknown repository setting");
          const key =
            id === AUTOMATIC_BACKUP_SETTING
              ? "automaticBackup"
              : "showWorkingCopyStatus";
          this.#data = await updateRepositoryData(this.plugin, {
            [key]: value,
          });
          if (id === AUTOMATIC_BACKUP_SETTING)
            await this.plugin.backup?.setEnabled(value);
          await this.#apply();
        },
        subscribe: (listener) => {
          const ref = this.plugin.app.configuration.on(
            "plugin-data-updated",
            (event) => {
              if (event.pluginId !== this.plugin.id) return;
              this.#data =
                event.value && typeof event.value === "object"
                  ? (event.value as Record<string, unknown>)
                  : {};
              void this.#apply().catch((error) => this.plugin.report(error));
              listener();
            },
          );
          return () => this.plugin.app.configuration.offref(ref);
        },
      },
    });
    await this.#apply();
  }
  #apply(): Promise<void> {
    return (this.#transition = this.#transition.then(async () => {
      if (!this.#closed)
        await this.plugin.backup?.setEnabled(automaticBackup(this.#data));
      if (this.#closed || !showWorkingCopyStatus(this.#data)) {
        await this.#hide();
        return;
      }
      if (this.plugin.backup) {
        if (this.#remove) return;
        const controller = this.plugin.backup.controller;
        this.#remove = this.plugin.app.statusBar.registerItem({
          id: "repository-history:working-copy",
          sourcePlugin: this.plugin.id,
          alignment: "left",
          priority: 15,
          mount: (host) => {
            const component = mount(RepositoryBackupStatus, {
              target: host,
              props: {
                controller,
                openRevision: (operation, revision) =>
                  this.plugin
                    .open(operation, revision)
                    .catch((error) => this.plugin.report(error)),
                copyText: (value) => this.plugin.copyIdentifier(value),
              },
            });
            return () => {
              void unmount(component);
            };
          },
        });
        return;
      }
      if (this.#controller || !this.services.workingCopy) return;
      const controller = new WorkingCopyController(
        this.services.workingCopy,
        this.plugin.feedback("Working copy status"),
      );
      this.#controller = controller;
      const activity = new BackgroundWork(
        this.plugin.app.notifications,
        this.plugin.id,
      ).follow("Reading working copy status", {
        subscribe: (listener) =>
          controller.subscribe((state) =>
            listener({ busy: state.busy, phase: state.status }),
          ),
      });
      this.#remove = this.plugin.app.statusBar.registerItem({
        id: "repository-history:working-copy",
        sourcePlugin: this.plugin.id,
        alignment: "left",
        priority: 15,
        mount: (host) => {
          const component = mount(RepositoryWorkingCopyStatus, {
            target: host,
            props: {
              controller,
              openRevision: (operation, revision) =>
                this.plugin
                  .open(operation, revision)
                  .catch((error) => this.plugin.report(error)),
              copyText: (value) => this.plugin.copyIdentifier(value),
            },
          });
          return () => {
            void unmount(component);
          };
        },
      });
      let timer: ReturnType<typeof setTimeout> | undefined;
      const changed = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          void controller.refresh();
        }, 1000);
      };
      const vault = this.plugin.app.vault;
      const modify = vault.on("modify", changed),
        create = vault.on("create", changed),
        remove = vault.on("delete", changed),
        rename = vault.on("rename", changed);
      const interval = setInterval(changed, 60_000);
      this.#events = () => {
        clearTimeout(timer);
        clearInterval(interval);
        vault.offref(modify);
        vault.offref(create);
        vault.offref(remove);
        vault.offref(rename);
        // Keep progress until the actual read has drained.
        void controller.close().finally(activity);
      };
      void controller.refresh();
    }));
  }
  async #hide() {
    const controller = this.#controller;
    this.#controller = undefined;
    this.#remove?.();
    this.#remove = undefined;
    this.#events?.();
    this.#events = undefined;
    await controller?.close();
  }
  async close(): Promise<void> {
    this.#closed = true;
    await this.#transition;
    await this.#hide();
    await this.#settings?.close();
  }
}
