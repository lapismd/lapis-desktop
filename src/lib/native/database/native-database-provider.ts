import {
  REMOTE_APP_DATABASE_METHODS,
  type AppDatabase,
  type AppDatabaseOpenContext,
  type AppDatabaseProvider,
} from "@lapis-notes/api/app-database";
import type { NativeCall, VaultDescriptor } from "../vault-client.ts";
import type { NativeBackgroundIndexing } from "@lapis-notes/api";
import {
  NativeDatabaseTransport,
  type DatabaseChannelFactory,
} from "./database-transport.ts";

export type MetadataOwner = "renderer" | "core";
export interface NativeDatabaseProvider extends AppDatabaseProvider {
  readonly backgroundIndexing?: NativeBackgroundIndexing;
}

export function createNativeDatabaseProvider(
  selected: VaultDescriptor,
  call?: NativeCall,
  channel?: DatabaseChannelFactory,
  metadataOwner: MetadataOwner = "renderer",
): NativeDatabaseProvider {
  if (metadataOwner !== "renderer" && metadataOwner !== "core")
    throw new Error("Invalid metadata owner selection");
  let transport: NativeDatabaseTransport | undefined;
  let opening = false;
  return {
    id: "turso-native-desktop",
    backgroundIndexing:
      metadataOwner === "core"
        ? {
            async call(command) {
              if (!transport)
                throw new Error("The native database admission is not open");
              return transport.indexing(command);
            },
          }
        : undefined,
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
      if (metadataOwner === "core" && (transport || opening))
        throw new Error(
          "The native indexing database admission is already open",
        );
      opening = true;
      let opened: NativeDatabaseTransport;
      try {
        opened = await NativeDatabaseTransport.open(selected, call, channel);
        transport = opened;
      } finally {
        opening = false;
      }
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
          opened.requireOpen();
        },
        close: () => opened.close(),
        subscribeToChanges: (
          listener: Parameters<AppDatabase["subscribeToChanges"]>[0],
        ) => opened.subscribe(listener),
      };
      for (const method of REMOTE_APP_DATABASE_METHODS)
        database[method] = (...args: unknown[]) => opened.call(method, args);
      return database as unknown as AppDatabase;
    },
  };
}
