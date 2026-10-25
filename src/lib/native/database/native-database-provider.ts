import {
  REMOTE_APP_DATABASE_METHODS,
  type AppDatabase,
  type AppDatabaseOpenContext,
  type AppDatabaseProvider,
} from "@lapis-notes/api/app-database";
import type { NativeCall, VaultDescriptor } from "../vault-client.ts";
import {
  NativeDatabaseTransport,
  type DatabaseChannelFactory,
} from "./database-transport.ts";

export function createNativeDatabaseProvider(
  selected: VaultDescriptor,
  call?: NativeCall,
  channel?: DatabaseChannelFactory,
): AppDatabaseProvider {
  return {
    id: "turso-native-desktop",
    canOpen(context: AppDatabaseOpenContext): boolean {
      return (
        context.runtime === "tauri-desktop" &&
        context.role === "direct" &&
        context.vaultId === selected.profileId
      );
    },
    async open(context) {
      if (!(await this.canOpen(context)))
        throw new Error(
          "The native database provider requires its admitted Tauri vault and direct role",
        );
      const transport = await NativeDatabaseTransport.open(
        selected,
        call,
        channel,
      );
      const database: Record<string, unknown> = {
        kind: "turso-native",
        vaultId: context.vaultId,
        descriptor: {
          providerId: this.id,
          engine: "turso",
          transport: "native",
          role: "direct",
          storageMode: "local",
          capabilities: {
            nativeFullTextSearch: true,
            vectorSearch: true,
            approximateNearestNeighbors: false,
            localEmbeddings: true,
            crossTabCoordination: false,
            sync: false,
          },
        },
        async open() {
          transport.requireOpen();
        },
        close: () => transport.close(),
        subscribeToChanges: (
          listener: Parameters<AppDatabase["subscribeToChanges"]>[0],
        ) => transport.subscribe(listener),
      };
      for (const method of REMOTE_APP_DATABASE_METHODS)
        database[method] = (...args: unknown[]) => transport.call(method, args);
      return database as unknown as AppDatabase;
    },
  };
}
