import type {
  NativeTasks,
  NativeTaskValue,
} from "@lapis-notes/api/native-tasks";
import { invoke } from "@tauri-apps/api/core";
import { nativeError } from "../native-error.ts";
import type { NativeCall, VaultDescriptor } from "../vault-client.ts";

export type TasksOwner = "renderer" | "core";

/** Native Tasks share the selected projection and editing authority. */
export function validateTasksSelection(
  tasks: TasksOwner,
  metadata: "renderer" | "core",
  editing: "renderer" | "core",
): void {
  if (tasks !== "renderer" && tasks !== "core")
    throw new Error("Invalid Tasks owner selection");
  if (tasks === "core" && (metadata !== "core" || editing !== "core"))
    throw new Error(
      "Native Tasks require core metadata and editing owners; select LAPIS_DESKTOP_METADATA_OWNER=core and LAPIS_DESKTOP_EDITING_OWNER=core",
    );
}

/** The App owns observation; this port neither retries nor owns Task work. */
export function createNativeTasks(
  selected: VaultDescriptor,
  call: NativeCall = invoke,
): NativeTasks {
  return {
    async call(command) {
      try {
        return await call<NativeTaskValue>("vault_tasks", {
          sessionId: selected.sessionId,
          command,
        });
      } catch (error) {
        throw nativeError(error);
      }
    },
  };
}
