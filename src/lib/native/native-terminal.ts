import type { App } from "@lapis-notes/api";
import { invoke } from "@tauri-apps/api/core";
import { createTauriTerminalClient } from "@lapismd/terminal/tauri";
import { TerminalSessions } from "../terminal/terminal-sessions.ts";
import { reportTerminalError } from "../terminal/terminal-binding.ts";
import type { VaultDescriptor } from "./vault-client.ts";

export function createNativeTerminal(
  app: App,
  vault: VaultDescriptor,
): TerminalSessions {
  return new TerminalSessions({
    client: createTauriTerminalClient({
      onError: (error) => reportTerminalError(app, error),
    }),
    activate: async () => {
      if (
        app.safeMode.disableOptionalCorePlugins ||
        !app.workspaceTrust.trusted
      )
        throw new Error("Terminal is disabled in this workspace");
      await invoke("desktop_terminal_admit", { sessionId: vault.sessionId });
    },
    release: async (mode) => {
      await invoke("desktop_terminal_release", { reload: mode === "reload" });
    },
  });
}
