import { init } from "@wdio/tauri-plugin";
import { createNativeDatabaseProvider } from "../../src/lib/native/database/native-database-provider.ts";
import type { AppDatabase } from "@lapis-notes/api/app-database";
import type { VaultDescriptor } from "../../src/lib/native/vault-client.ts";
import {
  NativeDesktopVaultAdapter,
  getNativeDesktopBridge,
  setNativeDesktopBridge,
} from "@lapis-notes/api";

await init();
await import("../../src/main.ts");
await import("./watch-entry.ts");

const databases = new Map<string, AppDatabase>();

const driver = {
  async open(selected: VaultDescriptor) {
    let database = databases.get(selected.sessionId);
    if (!database) {
      database = await createNativeDatabaseProvider(selected).open({
        vaultId: selected.profileId,
        runtime: "tauri-desktop",
        role: "direct",
      });
      databases.set(selected.sessionId, database);
    }
    return database.descriptor;
  },
  async set(sessionId: string, key: string, value: unknown) {
    const database = databases.get(sessionId);
    if (!database) throw new Error("No acceptance database is open");
    await database.setMeta(key, value);
  },
  async get(sessionId: string, key: string) {
    const database = databases.get(sessionId);
    if (!database) throw new Error("No acceptance database is open");
    return database.getMeta(key);
  },
  async close(sessionId: string) {
    const database = databases.get(sessionId);
    if (!database) throw new Error("No acceptance database is open");
    await database.close();
    databases.delete(sessionId);
  },
};

Object.assign(globalThis, { __lapisNativeDatabaseAcceptance: driver });

Object.assign(globalThis, {
  __lapisConditionalWriteAcceptance: {
    useLocalTrash() {
      const bridge = getNativeDesktopBridge();
      if (!bridge) throw new Error("No native bridge is installed");
      setNativeDesktopBridge({
        ...bridge,
        capabilities: {
          ...bridge.capabilities,
          "system-trash": { id: "system-trash", status: "unavailable" },
        },
      });
    },
    availableCreate(root: string) {
      return new NativeDesktopVaultAdapter(
        root,
        undefined,
        "tauri-desktop",
      ).getCapabilities().exclusiveCreate;
    },
    async create(root: string, path: string, data: string | number[]) {
      try {
        await new NativeDesktopVaultAdapter(
          root,
          undefined,
          "tauri-desktop",
        ).writeExclusive(
          path,
          typeof data === "string" ? data : Uint8Array.from(data).buffer,
        );
        return { ok: true };
      } catch (failure) {
        const error = failure as Error & { code?: string };
        return { ok: false, code: error.code, message: error.message };
      }
    },
    available(root: string) {
      return new NativeDesktopVaultAdapter(
        root,
        undefined,
        "tauri-desktop",
      ).getCapabilities().conditionalTextWrite;
    },
    async write(
      root: string,
      path: string,
      expected: string | null,
      data: string,
    ) {
      try {
        await new NativeDesktopVaultAdapter(
          root,
          undefined,
          "tauri-desktop",
        ).writeTextIfUnchanged(path, data, expected);
        return { ok: true };
      } catch (failure) {
        const error = failure as Error & { code?: string };
        return { ok: false, code: error.code, message: error.message };
      }
    },
  },
});
