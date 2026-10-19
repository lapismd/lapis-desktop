import type { SyncService } from "../../repository/sync.ts";
import type { NativeCall } from "../vault-client.ts";
import { nativeError } from "../native-error.ts";
export function nativeSync(sessionId: string, call: NativeCall): SyncService {
  async function request<T>(action: unknown): Promise<T> {
    try {
      return await call<T>("desktop_backup_sync", {
        request: { sessionId, action },
      });
    } catch (error) {
      throw nativeError(error);
    }
  }
  return {
    prepare: (revision) => request({ kind: "prepare", revision }),
    preview: (candidate, revision) =>
      request({ kind: "preview", candidate, revision }),
    apply: (restore, revision) =>
      request({ kind: "apply", request: restore, revision }),
    conflict: (candidate, path, revision) =>
      request({ kind: "conflict", candidate, path, revision }),
    resolve: (candidate, path, resolution, revision) =>
      request({ kind: "resolve", candidate, path, resolution, revision }),
    publish: (revision, requestId) =>
      request({ kind: "publish", revision, request_id: requestId }),
  };
}
