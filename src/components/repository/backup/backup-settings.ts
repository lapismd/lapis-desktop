import type { WorkspaceCustomSetting } from "@lapis-notes/api";
import type { ComponentProps } from "svelte";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { ForgeController } from "../../../lib/repository/forge-controller.ts";
import type { RepositoryServices } from "../../../lib/repository/history-reader.ts";
import { RemoteController } from "../../../lib/repository/remote-controller.ts";
import { BackgroundWork } from "../../../lib/desktop/background-work.ts";
import type { RepositoryPlugin } from "../repository-plugin.ts";
import BackupSettingsField from "./BackupSettingsField.svelte";
import type BackupSettings from "./BackupSettings.svelte";
import { createRemoteRestore } from "./remote-restore.ts";
import { adoptionSettings } from "./adoption-settings.ts";
import { storageSettings } from "./storage-settings.ts";

export const BACKUP_SETTINGS = "repository-history.remoteBackup";
export type BackupSettingsFieldDefinition = WorkspaceCustomSetting & {
  openPanel(): BackupSettingsPanel;
};
export type BackupSettingsPanel = {
  props: ComponentProps<typeof BackupSettings>;
  close(): Promise<void>;
  report(error: unknown): void;
};

export function openBackupSettings(plugin: RepositoryPlugin) {
  getWorkspaceHostBinding(plugin.app.workspace).controller.settings.open({
    sectionId: "repository-history",
    fieldId: BACKUP_SETTINGS,
  });
}

/** Each visible settings panel owns transient accounts; durable work stays plugin-owned. */
export function createBackupSettings(
  plugin: RepositoryPlugin,
  services: RepositoryServices,
) {
  if (!services.forges) return;
  const sessions = new Set<{ close(): Promise<void> }>();
  const storage = storageSettings(plugin, services.storage);
  const adoption = adoptionSettings(plugin, services.adoption);
  const activity = new BackgroundWork(plugin.app.notifications, plugin.id);
  const forges = services.forges;
  function openPanel() {
    const controller = new ForgeController(
      forges,
      plugin.feedback("Forge accounts", "repository-history:forge-accounts"),
    );
    const progress = activity.follow("Connecting forge accounts", {
      subscribe: (listener) => controller.subscribeActivity(listener),
    });
    const remote = services.remote
      ? new RemoteController(
          services.remote,
          plugin.feedback("Remote backup", "repository-history:remote"),
        )
      : undefined;
    const restore = services.remote
      ? createRemoteRestore(plugin, services.remote)
      : undefined;
    const remoteProgress =
      remote &&
      activity.follow("Remote vault backup", {
        subscribe: (listener) => remote.subscribeActivity(listener),
      });
    let closing: Promise<void> | undefined;
    const panel = {
      props: {
        controller,
        remote,
        restore,
        storage: storage?.controller,
        adoption: adoption?.controller,
        sync: plugin.backup?.sync?.controller,
        setSyncEnabled: (enabled: boolean) =>
          plugin
            .backup!.sync!.setEnabled(enabled)
            .catch((error) => plugin.report(error)),
      },
      close() {
        return (closing ??= (async () => {
          remote?.close();
          restore?.close();
          await controller.close();
          // Fence replies now; account networking must not hold vault closure.
          // Progress remains owned until the actual native operations drain.
          void Promise.allSettled([
            controller.drained(),
            remote?.drained(),
          ]).then(() => {
            progress();
            remoteProgress?.();
            sessions.delete(panel);
          });
        })());
      },
      report: (error: unknown) => plugin.report(error),
    };
    sessions.add(panel);
    return panel;
  }
  plugin.addCommand({
    id: "open-backup-settings",
    name: "Open Repository Backup Settings",
    callback: () => openBackupSettings(plugin),
  });
  const field: BackupSettingsFieldDefinition = {
    id: BACKUP_SETTINGS,
    type: "custom",
    title: "Backup and synchronisation",
    presentation: "full-width",
    component: BackupSettingsField,
    openPanel,
  };
  return {
    field,
    openPanel,
    async close() {
      await Promise.allSettled([...sessions].map((panel) => panel.close()));
      await Promise.all([storage?.close(), adoption?.close()]);
    },
  };
}
