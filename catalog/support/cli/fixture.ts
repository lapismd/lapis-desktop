import type { DesktopInvoke } from "../../../src/lib/native/desktop-integration.ts";
import { createDesktopCliSettings } from "../../../src/lib/native/cli-settings.ts";
export function cliFixture(
  state: "not-installed" | "installed" | "broken" = "not-installed",
) {
  let installed = state;
  let enabled = false;
  let grants: { id: string; label: string }[] = [];
  const invoke: DesktopInvoke = async <T>(
    command: string,
    payload?: Record<string, unknown>,
  ) => {
    if (command === "desktop_cli_installation") {
      if (payload?.action === "install") installed = "installed";
      if (payload?.action === "uninstall") installed = "not-installed";
      return {
        state: installed,
        destination: "/home/example/.local/bin/lapis",
        version: "0.1.0",
      } as T;
    }
    if (command !== "desktop_cli_access")
      throw Error("Unexpected native command");
    if (payload?.action === "enable") enabled = payload.enabled === true;
    if (payload?.action === "create") {
      const input = payload.input as {
        vaultIds: string[];
        label: string;
        permissions: string[];
      };
      if (
        !enabled ||
        input.vaultIds.join() !== "vault-one" ||
        input.permissions.length
      )
        throw Error("Credential scope was not preserved");
      grants = [{ id: "grant-one", label: input.label }];
      return {
        command:
          "lapis --target http://127.0.0.1:41234 --token-file '/home/example/lapis.token' vault list",
      } as T;
    }
    if (payload?.action === "revoke") grants = [];
    return {
      enabled,
      target: enabled ? "http://127.0.0.1:41234" : null,
      vaults: [{ id: "vault-one", name: "Notes" }],
      permissions: [],
      grants,
    } as T;
  };
  return createDesktopCliSettings(invoke);
}
