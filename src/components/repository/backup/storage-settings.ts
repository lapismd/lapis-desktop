import type { RepositoryPlugin } from "../repository-plugin.ts";
import type { StorageService } from "../../../lib/repository/storage.ts";
import { StorageController } from "../../../lib/repository/storage-controller.ts";
import { BackgroundWork } from "../../../lib/desktop/background-work.ts";

/** A move belongs to the enabled plugin, not the tab that requested it. */
export function storageSettings(
  plugin: RepositoryPlugin,
  service?: StorageService,
) {
  if (!service) return undefined;
  const controller = new StorageController(
    service,
    plugin.feedback("History storage", "repository-history:storage"),
    (action) =>
      plugin.app.fileEditingSessions.guard(undefined, async () => {
        await plugin.backup?.controller.pause();
        await plugin.backup?.sync?.controller.drained();
        return action();
      }),
  );
  const progress = new BackgroundWork(
    plugin.app.notifications,
    plugin.id,
  ).follow("Moving history storage", {
    subscribe: (listener) => controller.subscribeActivity(listener),
  });
  return {
    controller,
    async close() {
      controller.close();
      await controller.drained();
      progress();
    },
  };
}
