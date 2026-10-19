import type { NativeCall } from "../vault-client.ts";
import { nativeError } from "../native-error.ts";
import type {
  RestorePreview,
  RestoreService,
  VaultRestorePreview,
} from "../../repository/restore.ts";
export function nativeRestore(
  sessionId: string,
  call: NativeCall,
): RestoreService {
  async function run<T>(action: unknown): Promise<T> {
    try {
      return await call<T>("desktop_backup_restore", {
        request: { sessionId, action },
      });
    } catch (error) {
      throw nativeError(error);
    }
  }
  return {
    async keepCurrent() {
      try {
        return await call("desktop_backup_capture", { request: { sessionId } });
      } catch (error) {
        throw nativeError(error);
      }
    },
    async previewVault(checkpoint) {
      const result = await run<VaultRestorePreview>({
        kind: "preview_vault",
        checkpoint,
      });
      if (
        !result ||
        result.checkpoint !== checkpoint ||
        typeof result.expected !== "string" ||
        ![result.added, result.modified, result.deleted].every(
          (value) => Number.isSafeInteger(value) && value >= 0,
        )
      )
        throw new Error("Invalid vault restore preview");
      return result;
    },
    applyVault: (request) => run({ kind: "apply_vault", request }),
    async preview(checkpoint, path) {
      const result = await run<RestorePreview>({
        kind: "preview",
        checkpoint,
        path,
      });
      if (
        !result ||
        result.checkpoint !== checkpoint ||
        result.path !== path ||
        typeof result.expected !== "string" ||
        !Number.isSafeInteger(result.bytes) ||
        result.bytes < 0 ||
        typeof result.deleted !== "boolean"
      )
        throw new Error("Invalid restore preview");
      return result;
    },
    apply: (request) => run({ kind: "apply", request }),
  };
}
