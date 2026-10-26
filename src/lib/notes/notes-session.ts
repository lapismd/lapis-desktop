import {
  createVaultSession,
  NativeDesktopVaultAdapter,
  type VaultSession,
} from "@lapis-notes/api";
import {
  createNativeDatabaseProvider,
  type MetadataOwner,
} from "../native/database/native-database-provider.ts";
import type { VaultDescriptor } from "../native/vault-client.ts";

export async function openNotesSession(
  selected: VaultDescriptor,
  metadataOwner: MetadataOwner = "renderer",
): Promise<VaultSession> {
  const now = Date.now();
  const adapter = new NativeDesktopVaultAdapter(
    selected.path,
    { vaultId: selected.profileId, name: selected.name },
    "tauri-desktop",
  );
  const provider = createNativeDatabaseProvider(
    selected,
    undefined,
    undefined,
    metadataOwner,
  );
  const session = await createVaultSession(adapter, {
    runtime: "tauri-desktop",
    profile: {
      id: selected.profileId,
      name: selected.name,
      kind: "desktop-folder",
      handle: { rootPath: selected.path },
      createdAt: now,
      updatedAt: now,
    },
    appDatabaseProvider: provider,
  });
  if (provider.backgroundIndexing)
    session.backgroundIndexing = provider.backgroundIndexing;
  return session;
}
