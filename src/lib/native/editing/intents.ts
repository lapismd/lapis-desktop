import type {
  NativeEditingIntents,
  EditingIntentValue,
  TextSnapshot,
} from "@lapis-notes/api/native-editing-intents";
import { invoke } from "@tauri-apps/api/core";
import { nativeError } from "../native-error.ts";
import type { NativeCall, VaultDescriptor } from "../vault-client.ts";

export type EditingOwner = "renderer" | "core";

/** Native fencing shares the admitted vault client used by existing saves. */
export function createNativeEditingIntents(
  selected: VaultDescriptor,
  call: NativeCall = invoke,
): NativeEditingIntents {
  return {
    async call(command) {
      try {
        return await call<EditingIntentValue>("vault_editing_intents", {
          sessionId: selected.sessionId,
          command,
        });
      } catch (error) {
        throw nativeError(error);
      }
    },
    async read(path) {
      try {
        const value = await call<TextSnapshot | null>(
          "vault_editing_snapshot",
          {
            sessionId: selected.sessionId,
            path,
          },
        );
        if (
          value !== null &&
          (!value ||
            value.path !== path ||
            typeof value.text !== "string" ||
            typeof value.version !== "string")
        )
          throw new Error("Invalid native editing snapshot");
        return value;
      } catch (error) {
        throw nativeError(error);
      }
    },
  };
}
