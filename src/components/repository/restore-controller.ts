import { guardTranscriptReplacement } from "../../lib/repository/transcript-writers.ts";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { RestoreController } from "../../lib/repository/restore.ts";
import { restoreRecovery } from "../../lib/repository/restore-recovery.ts";
import type { RepositoryPlugin } from "./repository-plugin.ts";
import type { RestoreService } from "../../lib/repository/restore.ts";
import { updateRepositoryData } from "../../lib/repository/plugin-data.ts";
export const RESTORE_NOTICE = "repository-history:pending-restore";
export function createRestoreController(
  plugin: RepositoryPlugin,
  options: {
    service?: RestoreService;
    key?: "pendingRestore" | "pendingRemoteRestore";
    title?: string;
  } = {},
) {
  const key = options.key ?? "pendingRestore";
  let original: string | undefined;
  const service = options.service ?? plugin.restoreService;
  if (!service) return;
  const feedback = plugin.feedback(
    options.title ?? "Restore history",
    key === "pendingRestore"
      ? "repository-history:restore"
      : "repository-history:remote-restore",
  );
  const controller = new RestoreController(
    service,
    (path, action) => guardTranscriptReplacement(plugin.app, path, action),
    feedback,
    async (pending) => {
      if (pending) original = pending.request.request_id;
      const own = original;
      const saved = await updateRepositoryData(plugin, (current) => {
        if (pending) return { [key]: pending };
        const retained = restoreRecovery(current[key]);
        return own && retained?.request.request_id === own
          ? { [key]: null }
          : {};
      });
      if (!saved.pendingRestore && !saved.pendingRemoteRestore) {
        getWorkspaceHostBinding(
          plugin.app.workspace,
        ).controller.notifications.dismiss(RESTORE_NOTICE);
        await plugin.app.notifications.clear(RESTORE_NOTICE);
      }
    },
  );
  void plugin
    .loadData()
    .then((data) => {
      const pending = restoreRecovery(data?.[key]);
      if (pending) {
        original ??= pending.request.request_id;
        controller.recover(pending);
      }
    })
    .catch((error) => feedback.report(error));
  return controller;
}
