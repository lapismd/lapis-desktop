import { init } from "@wdio/tauri-plugin";
import { createNativeDatabaseProvider } from "../../src/native-database-provider.ts";
import type { AppDatabase } from "@lapis-notes/api/app-database";
import type { VaultDescriptor } from "../../src/vault-client.ts";

await init();
await import("../../src/main.ts");

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
