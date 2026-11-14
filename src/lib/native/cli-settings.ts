import { invoke as nativeInvoke } from "@tauri-apps/api/core";
import type {
  CliSettingsHost,
  CliInstallationStatus,
  CliAccessStatus,
} from "@lapis-notes/ui/cli";
import type { DesktopInvoke } from "./desktop-integration.ts";
/** Named native commands retain installation and credential authority. */
export function createDesktopCliSettings(
  invoke: DesktopInvoke = nativeInvoke,
): CliSettingsHost {
  return {
    installation: {
      status: () =>
        invoke<CliInstallationStatus>("desktop_cli_installation", {
          action: "status",
        }),
      install: async (shell) => {
        await invoke("desktop_cli_installation", { action: "install", shell });
      },
      uninstall: async (removePath) => {
        await invoke("desktop_cli_installation", {
          action: "uninstall",
          removePath,
        });
      },
    },
    access: {
      status: () =>
        invoke<CliAccessStatus>("desktop_cli_access", { action: "status" }),
      enable: async (enabled) => {
        await invoke("desktop_cli_access", { action: "enable", enabled });
      },
      create: (input) =>
        invoke("desktop_cli_access", { action: "create", input }),
      revoke: async (id) => {
        await invoke("desktop_cli_access", { action: "revoke", id });
      },
    },
  };
}
