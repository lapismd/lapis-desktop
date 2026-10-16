import { convertFileSrc, invoke } from "@tauri-apps/api/core";
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

export function vaultPath(path: unknown): string {
  if (path === "/") return "";
  if (typeof path !== "string" || path.length > 4096 || /[\\\0:]/u.test(path)) {
    throw new Error("Invalid relative vault path");
  }
  if (
    path &&
    path.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    throw new Error("Invalid relative vault path");
  }
  return path;
}

export class VaultClient {
  #call: NativeCall;
  #fileUrl: (path: string, protocol: string) => string;
  #admissions = new Map<string, VaultDescriptor>();

  constructor(call: NativeCall = invoke, fileUrl = convertFileSrc) {
    this.#call = async <T>(...args: Parameters<NativeCall>) => {
      try {
        return await call<T>(...args);
      } catch (error) {
        throw nativeError(error);
      }
    };
    this.#fileUrl = fileUrl;
  }

  recents(): Promise<RecentVault[]> {
    return this.#call("vault_recents");
  }

  async select(createName?: string): Promise<VaultDescriptor | null> {
    const selected = await this.#call<VaultDescriptor | null>("vault_select", {
      createName: createName ?? null,
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

  async close(selected: VaultDescriptor): Promise<void> {
    await this.#call("vault_close", { sessionId: selected.sessionId });
    this.#admissions.delete(selected.sessionId);
  }

  admitted(rootPath: unknown): VaultDescriptor {
    const selected = [...this.#admissions.values()].find(
      (entry) => entry.path === rootPath,
    );
    if (!selected) throw new Error("Vault admission is closed or unknown");
    return selected;
  }

  file<T>(
    selected: VaultDescriptor,
    request: Record<string, unknown>,
  ): Promise<T> {
    if (!this.#admissions.has(selected.sessionId)) {
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
