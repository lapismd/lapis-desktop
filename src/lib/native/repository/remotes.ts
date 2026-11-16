import type {
  RepositoryRemotesCommand,
  RepositoryRemotesService,
  RepositoryRemotesSnapshot,
  RepositoryNativeSyncCommand,
  RepositoryNativeSyncSnapshot,
} from "@lapis-notes/history/repository";
import type { NativeCall } from "../vault-client.ts";
import { nativeError } from "../native-error.ts";

/** Transport only. The admitted native owner selects custody and endpoints. */
export function nativeRemotes(
  sessionId: string,
  call: NativeCall,
): RepositoryRemotesService & { close(): void } {
  let closed = false;
  const requireOpen = () => {
    if (closed) throw new Error("Repository remotes are closed");
  };
  async function invoke<T>(command: string, args: Record<string, unknown>) {
    requireOpen();
    try {
      const response = await call<T>(command, args);
      requireOpen();
      return response;
    } catch (error) {
      throw nativeError(error);
    }
  }
  const read = (command: RepositoryRemotesCommand | null = null) =>
    invoke<RepositoryRemotesSnapshot>("desktop_repository_remotes", {
      request: { sessionId, command },
    });
  const synchronize = (command: RepositoryNativeSyncCommand | null = null) =>
    invoke<RepositoryNativeSyncSnapshot>("desktop_repository_synchronization", {
      request: { sessionId, command },
    });
  return {
    read: () => read(),
    execute: read,
    synchronization: {
      read: () => synchronize(),
      execute: synchronize,
    },
    async openSignIn() {
      const snapshot = await read();
      const authorization = snapshot.settings.authorization;
      if (
        !snapshot.capabilities.githubDeviceSignIn ||
        !snapshot.settings.deviceSignInAvailable ||
        authorization?.state !== "pending" ||
        !authorization.code.trim()
      )
        throw new Error("GitHub authorization is unavailable. Sign in again.");
      let url: URL;
      try {
        url = new URL(authorization.url);
      } catch {
        throw new Error("GitHub verification page is unavailable");
      }
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.pathname !== "/login/device"
      )
        throw new Error("GitHub verification page is unavailable");
      await invoke("desktop_clipboard_write", { text: authorization.code });
      await invoke("desktop_external_open", { url: url.href });
    },
    close() {
      closed = true;
    },
  };
}
