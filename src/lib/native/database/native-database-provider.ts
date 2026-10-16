import type {
  AppDatabaseOpenContext,
  AppDatabaseProvider,
} from "@lapis-notes/api/app-database";
import type { NativeCall, VaultDescriptor } from "../vault-client.ts";
import { NativeTursoConnection } from "./native-connection.ts";

export function createNativeDatabaseProvider(
  selected: VaultDescriptor,
  call?: NativeCall,
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
      const connection = await NativeTursoConnection.open(selected, call);
      try {
        const { TursoAppDatabase } = await import(
          "@lapis-notes/api/app-database"
        );
        const database = new TursoAppDatabase(context.vaultId, {
          kind: "turso-native",
          providerId: this.id,
          transport: "native",
          role: "direct",
          connectionFactory: async () => connection,
        });
        await database.open();
        return database;
      } catch (error) {
        try {
          await connection.close();
        } catch (cleanup) {
          throw new AggregateError(
            [error, cleanup],
            "Native database startup and cleanup failed",
          );
        }
        throw error;
      }
    },
  };
}
