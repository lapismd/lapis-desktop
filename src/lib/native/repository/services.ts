import type { HistoryClient, Handle, Query } from "@lapismd/jj-history";
import { tauriHistory } from "@lapismd/jj-history/tauri";
import { invoke } from "@tauri-apps/api/core";
import type { NativeCall, VaultDescriptor } from "../vault-client.ts";
import { nativeError } from "../native-error.ts";
import type { RepositoryServices } from "../../repository/history-reader.ts";
import { parseWorkingCopyStatus } from "../../repository/working-copy-status.ts";
import { PreparationQueue } from "./preparation-queue.ts";
import { nativeBackup } from "./backup.ts";
import { nativeRestore } from "./restore.ts";
import { nativeForges } from "./forges.ts";
import { nativeSync } from "./sync.ts";
import { nativeRemote } from "./remote.ts";

/** Owns native admission through all in-flight reads, including lost opens. */
export function createNativeRepository(
  vault: VaultDescriptor,
  call: NativeCall = invoke,
  client?: HistoryClient,
): RepositoryServices {
  const reader =
    client ??
    tauriHistory(vault.sessionId, async (command, args) => {
      try {
        return await call<string>(command, args);
      } catch (error) {
        throw nativeError(error);
      }
    });
  const preparation = new PreparationQueue(reader);
  const backupTransport = nativeBackup(vault.sessionId, call);
  let initialBackup: Promise<unknown> | undefined;
  const backup: typeof backupTransport = {
    ...backupTransport,
    start(changed) {
      return (initialBackup = backupTransport.start(changed)) as ReturnType<
        typeof backupTransport.start
      >;
    },
  };
  let activation: Promise<void> | undefined;
  let attempted = false;
  let closed = false;
  let closing: Promise<void> | undefined;
  const pending = new Set<Promise<unknown>>();
  async function native(
    command: string,
    args: Record<string, unknown>,
  ): Promise<void> {
    try {
      await call(command, args);
    } catch (error) {
      throw nativeError(error);
    }
  }
  function run<T>(action: () => Promise<T>): Promise<T> {
    if (closed)
      return Promise.reject(new Error("Repository history is closed"));
    const job = (async () => {
      attempted = true;
      // Restored views wait for native source binding, while the rest of the
      // app remains usable and reports the initial capture through status.
      if (initialBackup) await initialBackup;
      if (closed) throw new Error("Repository history is closed");
      activation ??= native("desktop_repository_admit", {
        request: { sessionId: vault.sessionId },
      }).catch((error) => {
        activation = undefined;
        throw error;
      });
      await activation;
      if (closed) throw new Error("Repository history is closed");
      return action();
    })();
    pending.add(job);
    void job.finally(() => pending.delete(job)).catch(() => {});
    return job;
  }
  return {
    sync: nativeSync(vault.sessionId, call),
    remote: nativeRemote(vault.sessionId, call),
    forges: nativeForges(call),
    restore: nativeRestore(vault.sessionId, call),
    backup,
    workingCopy: () =>
      run(async () =>
        parseWorkingCopyStatus(
          await call<string>("desktop_repository_working_copy", {
            request: { sessionId: vault.sessionId },
          }).catch((error) => {
            throw nativeError(error);
          }),
        ),
      ),
    reader: {
      heads: () => run(() => reader.heads()),
      open: (operation: string) => run(() => preparation.open(operation)),
      status: (handle: Handle) => run(() => reader.status(handle)),
      read: (handle: Handle, query: Query) =>
        run(() => reader.read(handle, query)),
      blame: (handle, query) => run(() => reader.blame(handle, query)),
      close: (handle: Handle) => run(() => preparation.close(handle)),
    },
    close(mode) {
      closed = true;
      preparation.stop();
      return (closing ??= (async () => {
        while (pending.size) await Promise.allSettled([...pending]);
        if (attempted)
          await native("desktop_repository_release", {
            request: { reload: mode === "reload" },
          });
      })().catch((error) => {
        closing = undefined;
        throw error;
      }));
    },
  };
}
