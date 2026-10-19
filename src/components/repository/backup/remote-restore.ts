import type { RepositoryPlugin } from "../repository-plugin.ts";
import type { RemoteService } from "../../../lib/repository/remote.ts";
import { remoteRestore } from "../../../lib/repository/remote.ts";
import { BackgroundWork } from "../../../lib/desktop/background-work.ts";
import { createRestoreController } from "../restore-controller.ts";
export function createRemoteRestore(
  plugin: RepositoryPlugin,
  remote: RemoteService,
) {
  const service = remoteRestore(remote);
  const activity = new BackgroundWork(plugin.app.notifications, plugin.id);
  return createRestoreController(plugin, {
    key: "pendingRemoteRestore",
    title: "Restore remote backup",
    service: {
      ...service,
      previewVault: (checkpoint) =>
        activity.run("Preparing remote restore", () =>
          remote.preview(checkpoint),
        ),
      applyVault: (request) =>
        activity.run("Restoring remote backup", () => remote.restore(request)),
      keepCurrent: () =>
        activity.run("Keeping current vault files", () => remote.keepCurrent()),
    },
  });
}
