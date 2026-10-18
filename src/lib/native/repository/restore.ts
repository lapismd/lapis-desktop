import type { NativeCall } from "../vault-client.ts";
import { nativeError } from "../native-error.ts";
import type {
  RestorePreview,
  RestoreService,
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
