import type { RepositoryPlugin } from "../repository-plugin.ts";
import type { AdoptionService } from "../../../lib/repository/adoption.ts";
import { adoptionRequest } from "../../../lib/repository/adoption.ts";
import { AdoptionController } from "../../../lib/repository/adoption-controller.ts";
import { updateRepositoryData } from "../../../lib/repository/plugin-data.ts";
import { BackgroundWork } from "../../../lib/desktop/background-work.ts";
export function adoptionSettings(
  plugin: RepositoryPlugin,
  service?: AdoptionService,
) {
  if (!service) return;
  const controller = new AdoptionController(
    service,
    {
      async load() {
        const saved = (await plugin.loadData())?.historyAdoption;
        return saved == null ? undefined : adoptionRequest(saved);
      },
      async save(request) {
        await updateRepositoryData(plugin, {
          historyAdoption: request ?? null,
        });
      },
    },
    plugin.feedback("Import original history", "repository-history:adoption"),
    async (action) => {
      let phase: string | undefined;
      const stop = plugin.backup?.controller.subscribe((state) => {
        phase = state.phase;
      });
      stop?.();
      if (!plugin.backup || phase === "closed")
        throw new Error(
          "Enable automatic local history before importing original history",
        );
      return plugin.app.fileEditingSessions.guard(undefined, async () => {
        await plugin.backup?.sync?.controller.drained();
        return action();
      });
    },
  );
  const progress = new BackgroundWork(
    plugin.app.notifications,
    plugin.id,
  ).follow("Importing original history", {
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
