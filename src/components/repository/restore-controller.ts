import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { RestoreController } from "../../lib/repository/restore.ts";
import { restoreRecovery } from "../../lib/repository/restore-recovery.ts";
import type { RepositoryPlugin } from "./repository-plugin.ts";
export const RESTORE_NOTICE = "repository-history:pending-restore";
export function createRestoreController(plugin: RepositoryPlugin) {
  const service = plugin.restoreService;
  if (!service) return;
  const feedback = plugin.feedback(
    "Restore history",
    "repository-history:restore",
  );
  const controller = new RestoreController(
    service,
    (path, action) => plugin.app.fileEditingSessions.guard(path, action),
    feedback,
    async (pending) => {
      await plugin.saveData({
        ...((await plugin.loadData()) ?? {}),
        pendingRestore: pending ?? null,
      });
      if (!pending) {
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
      const pending = restoreRecovery(data?.pendingRestore);
      if (pending) controller.recover(pending);
    })
    .catch((error) => feedback.report(error));
  return controller;
}
