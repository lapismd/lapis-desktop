import type {
  NativeDesktopBridge,
  NativeDesktopPlatformOs,
} from "@lapis-notes/api";
import type { VaultClient } from "./vault-client.ts";
import { vaultPath } from "./vault-path.ts";

const fileOperations = new Map([
  ["desktop_fs_stat", "stat"],
  ["desktop_fs_exists", "exists"],
  ["desktop_fs_list", "list"],
  ["desktop_fs_read_text", "read-text"],
  ["desktop_fs_read_binary", "read-binary"],
  ["desktop_fs_read_range", "read-range"],
  ["desktop_fs_write_text", "write-text"],
  ["desktop_fs_write_text_if_unchanged", "write-text-if-unchanged"],
  ["desktop_fs_write_binary", "write-binary"],
  ["desktop_fs_append_text", "append-text"],
  ["desktop_fs_mkdir", "mkdir"],
  ["desktop_fs_rename", "rename"],
  ["desktop_fs_copy", "copy"],
  ["desktop_fs_remove", "remove"],
  ["desktop_fs_rmdir", "rmdir"],
]);

export function createNativeBridge(
  client: VaultClient,
  os: NativeDesktopPlatformOs,
): NativeDesktopBridge {
  return {
    runtime: "tauri-desktop",
    platform: { runtime: "tauri-desktop", os, arch: "aarch64" },
    capabilities: {
      "conditional-text-write": {
        id: "conditional-text-write",
        status: "available",
        provider: "tauri-vault",
      },
      "file-watch": {
        id: "file-watch",
        status: "available",
        provider: "tauri-vault",
      },
      resource: {
        id: "resource",
        status: "available",
        provider: "tauri-vault",
      },
    },
    async invoke<T>(
      command: string,
      payload: Record<string, unknown> = {},
    ): Promise<T> {
      const operation = fileOperations.get(command);
      if (!operation)
        throw new Error(`Native operation is unavailable: ${command}`);
      const selected = client.admitted(payload.rootPath);
      const request: Record<string, unknown> = {
        operation,
        path: vaultPath(payload.normalizedPath),
      };
      if (
        [
          "write-text",
          "write-text-if-unchanged",
          "write-binary",
          "append-text",
        ].includes(operation)
      ) {
        request.data = payload.data;
        const options = payload.options as { mtime?: number } | undefined;
        request.options =
          options?.mtime === undefined ? {} : { mtime: options.mtime };
      }
      if (operation === "write-text-if-unchanged") {
        if (payload.expected !== null && typeof payload.expected !== "string")
          throw new Error("Invalid expected text snapshot");
        request.expected = payload.expected;
      }
      if (operation === "rename" || operation === "copy")
        request.newPath = vaultPath(payload.normalizedNewPath);
      if (operation === "mkdir" || operation === "rmdir")
        request.recursive = payload.recursive ?? false;
      if (operation === "read-range") {
        request.offset = payload.offset;
        request.length = payload.length;
      }
      return client.file<T>(selected, request);
    },
    watch: (root, path, options, listener) =>
      client.watch(root, path, options, listener),
    toFileUrl: (path) => client.absoluteResource(path),
    getResourceUrl: async (root, path) => client.resource(root, path),
  };
}
