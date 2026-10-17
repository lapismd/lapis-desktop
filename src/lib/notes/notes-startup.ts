import type { App } from "@lapis-notes/api";
import { DEFAULT_APP_STATE_DIRECTORY } from "@lapis-notes/api/path";
import type { WorkspaceStartupTask } from "@lapismd/design-core/workspace/startup";
import { pluginLoadOptions } from "./plugin-policy.ts";
import { desktopNotesPlugins } from "./notes-plugins.ts";

export function startupTasks(): WorkspaceStartupTask[] {
  return [
    { id: "vault", label: "Open the vault", status: "pending" },
    { id: "configuration", label: "Load app configuration", status: "pending" },
    { id: "plugins", label: "Load configured core plugins", status: "pending" },
    { id: "layout", label: "Restore the workspace layout", status: "pending" },
    { id: "metadata", label: "Load note metadata", status: "pending" },
  ];
}
export class StartupPhaseError extends Error {
  constructor(
    readonly task: string,
    readonly failure: unknown,
  ) {
    super(`Notes startup failed during ${task}`, { cause: failure });
  }
}
export async function startNotes(
  app: App,
  options: {
    setTask(
      id: string,
      status: WorkspaceStartupTask["status"],
      detail?: string,
    ): void;
    onMetadataTracking(stop: () => void): void;
    onReady(): Promise<void>;
    registerBundledPlugins?(): Promise<void>;
  },
): Promise<void> {
  let activeTask = "vault";
  async function phase(id: string, run: () => Promise<unknown>): Promise<void> {
    activeTask = id;
    options.setTask(id, "active");
    await run();
    options.setTask(id, "complete");
  }
  try {
    app.plugins.registerStaticPlugins(desktopNotesPlugins);
    await phase("vault", async () => {
      await app.vault.load();
      await app.vault.mkpath(DEFAULT_APP_STATE_DIRECTORY);
    });
    await phase("configuration", async () => {
      await app.configuration.load();
      await app.commands.loadHotkeys();
      await options.registerBundledPlugins?.();
    });
    await phase("plugins", () =>
      app.plugins.loadPlugins({
        ...pluginLoadOptions(app.safeMode),
        onProgress: ({ name }) =>
          options.setTask("plugins", "active", `Loading ${name}`),
      }),
    );
    await phase("layout", async () => {
      if (app.safeMode.skipLayoutRestore)
        options.setTask(
          "layout",
          "active",
          "Safe Mode skipped saved layout restore",
        );
      else await app.workspace.loadLayout();
    });
    await phase("metadata", async () => {
      await app.metadataTypeManager.load();
      options.onMetadataTracking(app.metadataTypeManager.trackChanges());
      await app.metadataCache.load();
      await app.vaultChanges.start();
      await options.onReady();
    });
  } catch (error) {
    options.setTask(activeTask, "failed");
    throw new StartupPhaseError(activeTask, error);
  }
}
