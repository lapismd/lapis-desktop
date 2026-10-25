import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import type {
  ChangeEvent,
  NativeWatchSubscription,
  WatchErrorEvent,
  WatchOptions,
} from "@lapis-notes/api";
import {
  startFileWatch,
  nativeWatchChannel,
  type WatchChannelFactory,
} from "./file-watch.ts";
import { vaultPath } from "./vault-path.ts";
import { nativeError } from "./native-error.ts";

export interface RecentVault {
  id: string;
  name: string;
  path: string;
}
export interface VaultDescriptor {
  profileId: string;
  sessionId: string;
  name: string;
  path: string;
  resourceToken: string;
}
export interface VaultListing {
  files: string[];
  folders: string[];
}
export type NativeCall = typeof invoke;

export class VaultClient {
  #call: NativeCall;
  #fileUrl: (path: string, protocol: string) => string;
  #channel: WatchChannelFactory;
  #watches = new Map<string, Set<NativeWatchSubscription>>();
  #closing = new Map<string, Promise<void>>();
  #retiring = new Set<string>();
  #admissions = new Map<string, VaultDescriptor>();

  constructor(
    call: NativeCall = invoke,
    fileUrl = convertFileSrc,
    channel = nativeWatchChannel,
  ) {
    this.#call = async <T>(...args: Parameters<NativeCall>) => {
      try {
        return await call<T>(...args);
      } catch (error) {
        throw nativeError(error);
      }
    };
    this.#fileUrl = fileUrl;
    this.#channel = channel;
  }

  recents(): Promise<RecentVault[]> {
    return this.#call("vault_recents");
  }

  async restore(): Promise<VaultDescriptor | null> {
    const selected = await this.#call<VaultDescriptor | null>("vault_restore");
    if (selected) this.#admissions.set(selected.sessionId, selected);
    return selected;
  }

  rememberNotes(selected: VaultDescriptor | null): Promise<void> {
    return this.#call("vault_remember_notes", {
      sessionId: selected?.sessionId ?? null,
    });
  }

  async prepareLeave(mode: "close" | "reload"): Promise<void> {
    if (mode === "close") await this.#call("vault_prepare_leave");
  }

  async closeAll(mode: "close" | "reload" = "close"): Promise<void> {
    for (const selected of this.#admissions.values())
      await this.close(selected, mode);
  }

  async select(createName?: string): Promise<VaultDescriptor | null> {
    const selected = await this.#call<VaultDescriptor | null>("vault_select", {
      createName: createName ?? null,
    });
    if (selected) this.#admissions.set(selected.sessionId, selected);
    return selected;
  }

  async create(): Promise<VaultDescriptor | null> {
    const selected = await this.#call<VaultDescriptor | null>("vault_select", {
      create: true,
    });
    if (selected) this.#admissions.set(selected.sessionId, selected);
    return selected;
  }

  async openRecent(profileId: string): Promise<VaultDescriptor> {
    const selected = await this.#call<VaultDescriptor>("vault_open_recent", {
      profileId,
    });
    this.#admissions.set(selected.sessionId, selected);
    return selected;
  }

  close(
    selected: VaultDescriptor,
    mode: "close" | "reload" = "close",
  ): Promise<void> {
    const current = this.#closing.get(selected.sessionId);
    if (current) return current;
    this.#retiring.add(selected.sessionId);
    const operation = this.#release(selected, mode).finally(() => {
      this.#closing.delete(selected.sessionId);
      this.#retiring.delete(selected.sessionId);
    });
    this.#closing.set(selected.sessionId, operation);
    return operation;
  }

  async #release(
    selected: VaultDescriptor,
    mode: "close" | "reload",
  ): Promise<void> {
    const results = await Promise.allSettled(
      [...(this.#watches.get(selected.sessionId) ?? [])].map(async (watch) =>
        watch.close(),
      ),
    );
    const failed = results.find((result) => result.status === "rejected");
    if (failed?.status === "rejected") throw failed.reason;
    await this.#call("vault_close", {
      sessionId: selected.sessionId,
      ...(mode === "reload" ? { reload: true } : {}),
    });
    this.#admissions.delete(selected.sessionId);
    this.#watches.delete(selected.sessionId);
  }

  watch(
    rootPath: string,
    path: string,
    options: WatchOptions,
    listener: (event: ChangeEvent | WatchErrorEvent) => void,
  ): NativeWatchSubscription {
    const selected = this.admitted(rootPath);
    const watch = startFileWatch(
      this.#call,
      selected,
      path,
      options.recursive ?? false,
      listener,
      this.#channel,
    );
    const owned: NativeWatchSubscription = {
      ready: watch.ready,
      close: async () => {
        await watch.close();
        this.#watches.get(selected.sessionId)?.delete(owned);
      },
    };
    const subscriptions = this.#watches.get(selected.sessionId) ?? new Set();
    subscriptions.add(owned);
    this.#watches.set(selected.sessionId, subscriptions);
    return owned;
  }

  admitted(rootPath: unknown): VaultDescriptor {
    const selected = [...this.#admissions.values()].find(
      (entry) => entry.path === rootPath,
    );
    if (!selected || this.#retiring.has(selected.sessionId))
      throw new Error("Vault admission is closed or unknown");
    return selected;
  }

  file<T>(
    selected: VaultDescriptor,
    request: Record<string, unknown>,
  ): Promise<T> {
    if (
      !this.#admissions.has(selected.sessionId) ||
      this.#retiring.has(selected.sessionId)
    ) {
      return Promise.reject(new Error("Vault admission is closed or unknown"));
    }
    return this.#call<T>("vault_fs", {
      sessionId: selected.sessionId,
      request,
    });
  }

  list(selected: VaultDescriptor): Promise<VaultListing> {
    return this.file(selected, { operation: "list", path: "" });
  }

  resource(rootPath: string, path: string): string {
    const selected = this.admitted(rootPath);
    return this.#fileUrl(
      `${selected.resourceToken}/${vaultPath(path)}`,
      "lapis-vault",
    );
  }

  absoluteResource(absolutePath: string): string {
    const selected = [...this.#admissions.values()]
      .sort((a, b) => b.path.length - a.path.length)
      .find((entry) => absolutePath.startsWith(`${entry.path}/`));
    if (!selected) throw new Error("File is outside an admitted vault");
    return this.resource(
      selected.path,
      absolutePath.slice(selected.path.length + 1),
    );
  }
}
