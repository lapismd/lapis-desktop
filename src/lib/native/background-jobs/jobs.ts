import type {
  NativeBackgroundJobs,
  BackgroundJobSnapshot,
} from "@lapis-notes/api/background-jobs";
import { invoke } from "@tauri-apps/api/core";
import { nativeError } from "../native-error.ts";
import type { NativeCall, VaultDescriptor } from "../vault-client.ts";

export function createNativeBackgroundJobs(
  selected: VaultDescriptor,
  call: NativeCall = invoke,
): NativeBackgroundJobs {
  return {
    async call(command) {
      try {
        return await call<BackgroundJobSnapshot>("vault_background_jobs", {
          sessionId: selected.sessionId,
          command,
        });
      } catch (error) {
        throw nativeError(error);
      }
    },
  };
}
