import type { App } from "@lapis-notes/api";
import type { NativeChatHost } from "@lapis-notes/app-profile/native-chat";
import { invoke } from "@tauri-apps/api/core";
import { nativeError } from "../native-error.ts";
import { createNativeQueue } from "./native-queue.ts";
import type { NativeCall, VaultDescriptor } from "../vault-client.ts";

/** Transport only. Core accepts, owns and persists every turn. */
export function createNativeChatHost(
  app: App,
  vault: VaultDescriptor,
  call: NativeCall = invoke,
): NativeChatHost {
  async function native<T>(command: string, request: unknown): Promise<T> {
    try {
      return await call<T>(command, { request });
    } catch (error) {
      throw nativeError(error);
    }
  }
  return {
    queue: createNativeQueue(vault.sessionId, native),
    allowed: () =>
      app.workspaceTrust.trusted && !app.safeMode.disableOptionalCorePlugins,
    activate: () => native("desktop_ai_admit", { sessionId: vault.sessionId }),
    call: (command) =>
      native("desktop_ai_turn", { sessionId: vault.sessionId, command }),
    readText: (path) => app.vault.adapter.read(path),
    leave: (reason) =>
      native("desktop_ai_release", { reload: reason === "detach" }),
    report: (error) => {
      app.notifications.notify({
        title: "AI",
        source: "ai",
        severity: "error",
        message: error.message,
      });
    },
  };
}
