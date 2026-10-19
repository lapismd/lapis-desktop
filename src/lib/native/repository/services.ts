import { nativeIndexedSearch } from "./indexed-search.ts";
import type { HistoryClient } from "@lapismd/jj-history";
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
import { nativeSearch } from "./search.ts";
import { nativeSync } from "./sync.ts";
import { nativeRemote } from "./remote.ts";
import { nativeAdoption } from "./adoption.ts";
import { nativeStorage } from "./storage.ts";

/** Owns native admission through all in-flight reads, including lost opens. */
export function createNativeRepository(
  vault: VaultDescriptor,
  call: NativeCall = invoke,
  client?: HistoryClient,
): RepositoryServices {
  const transport = async (command: string, args: { request: string }) => {
    try {
      return await call<string>(command, args);
    } catch (error) {
      throw nativeError(error);
    }
  };
  const reader = client ?? tauriHistory(vault.sessionId, transport);
  let original: HistoryClient | undefined;
  let originalActivation: Promise<void> | undefined;
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
  function track<T>(action: () => Promise<T>): Promise<T> {
    if (closed)
      return Promise.reject(new Error("Repository history is closed"));
    const job = (async () => {
      attempted = true;
      return action();
    })();
    pending.add(job);
    void job.finally(() => pending.delete(job)).catch(() => {});
    return job;
  }
  function run<T>(action: () => Promise<T>): Promise<T> {
    return track(async () => {
      if (initialBackup) await initialBackup;
      if (closed) throw new Error("Repository history is closed");
      activation ??= native("desktop_repository_admit", {
        request: { sessionId: vault.sessionId, managed: true },
      }).catch((error) => {
        activation = undefined;
        throw error;
      });
      await activation;
      if (closed) throw new Error("Repository history is closed");
      return action();
    });
  }
  async function sources(openOriginal: boolean) {
    try {
      const result = await call<{ original: boolean; token: string | null }>(
        "desktop_repository_sources",
        { request: { sessionId: vault.sessionId, openOriginal } },
      );
      if (
        typeof result?.original !== "boolean" ||
        (result.token !== null && typeof result.token !== "string") ||
        (openOriginal && (!result.original || !result.token))
      )
        throw new Error("Invalid repository source state");
      return result;
    } catch (error) {
      throw nativeError(error);
    }
  }
  const originalRun = <T>(action: () => Promise<T>) =>
    track(async () => {
      // Original history remains readable when backup startup fails or is paused.
      originalActivation ??= sources(true)
        .then(({ token }) => {
          original = tauriHistory(token!, transport);
        })
        .catch((error) => {
          originalActivation = undefined;
          throw error;
        });
      await originalActivation;
      if (closed) throw new Error("Repository history is closed");
      return action();
    });
  function scoped(
    current: () => HistoryClient,
    execute: typeof run,
  ): RepositoryServices["reader"] {
    return {
      heads: () => execute(() => current().heads()),
      open: (operation) =>
        execute(() => preparation.open(operation, current())),
      status: (handle) => execute(() => current().status(handle)),
      read: (handle, query) => execute(() => current().read(handle, query)),
      blame: (handle, query) => execute(() => current().blame(handle, query)),
      close: (handle) => execute(() => preparation.close(handle, current())),
    };
  }
  const search = nativeSearch(vault.sessionId, call);
  const indexed = nativeIndexedSearch(vault.sessionId, call);
  return {
    adoption: nativeAdoption(vault.sessionId, call),
    storage: nativeStorage(vault.sessionId, call),
    search: {
      page: (request) => run(() => search.page(request)),
      indexed: {
        step: () => track(() => indexed.step()),
        query: (request) => track(() => indexed.query(request)),
        context: (request) => track(() => indexed.context(request)),
      },
    },
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
    sources: () =>
      track(async () => ({ original: (await sources(false)).original })),
    original: scoped(() => original!, originalRun),
    reader: scoped(() => reader, run),
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
