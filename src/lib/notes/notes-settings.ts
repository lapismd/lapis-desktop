import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { registerCliSettings, type CliSettingsHost } from "@lapis-notes/ui/cli";
import type { App } from "@lapis-notes/api";
import { registerPluginManagementSettings } from "@lapis-notes/workspace";
/** Both registrations belong to the same Notes session and retire together. */
export function registerDesktopSettings(
  app: App,
  cli: () => CliSettingsHost | undefined,
): () => void {
  const plugins = registerPluginManagementSettings(app);
  const host = cli();
  const commandLine = host
    ? registerCliSettings(
        getWorkspaceHostBinding(app.workspace).controller.settings,
        host,
      )
    : () => {};
  return () => {
    commandLine();
    plugins();
  };
}
