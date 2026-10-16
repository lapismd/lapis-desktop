import {
  createVaultSession,
  NativeDesktopVaultAdapter,
  type VaultSession,
} from "@lapis-notes/api";
import { createNativeDatabaseProvider } from "../native/database/native-database-provider.ts";
import type { VaultDescriptor } from "../native/vault-client.ts";

export function openNotesSession(
  selected: VaultDescriptor,
): Promise<VaultSession> {
  const now = Date.now();
  const adapter = new NativeDesktopVaultAdapter(
    selected.path,
    { vaultId: selected.profileId, name: selected.name },
    "tauri-desktop",
  );
  return createVaultSession(adapter, {
    runtime: "tauri-desktop",
    profile: {
      id: selected.profileId,
      name: selected.name,
      kind: "desktop-folder",
      handle: { rootPath: selected.path },
      createdAt: now,
      updatedAt: now,
    },
    appDatabaseProvider: createNativeDatabaseProvider(selected),
  });
}
