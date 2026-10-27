import {
  createVaultSession,
  NativeDesktopVaultAdapter,
  type VaultSession,
} from "@lapis-notes/api";
import {
  createNativeDatabaseProvider,
  type MetadataOwner,
} from "../native/database/native-database-provider.ts";
import type { NativeCall, VaultDescriptor } from "../native/vault-client.ts";
import {
  createNativeEditingIntents,
  type EditingOwner,
} from "../native/editing/intents.ts";
import {
  createNativeTasks,
  validateTasksSelection,
  type TasksOwner,
} from "../native/tasks/tasks.ts";

export async function openNotesSession(
  selected: VaultDescriptor,
  metadataOwner: MetadataOwner = "renderer",
  editingOwner: EditingOwner = "renderer",
  tasksOwner: TasksOwner = "renderer",
  call?: NativeCall,
): Promise<VaultSession> {
  validateTasksSelection(tasksOwner, metadataOwner, editingOwner);
  if (editingOwner !== "renderer" && editingOwner !== "core")
    throw new Error("Invalid editing owner selection");
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
  if (editingOwner === "core")
    session.nativeEditingIntents = createNativeEditingIntents(selected);
  if (tasksOwner === "core")
    session.nativeTasks = createNativeTasks(selected, call);
  return session;
}
