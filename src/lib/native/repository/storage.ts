import type {
  StorageLocation,
  StorageService,
  StorageStatus,
} from "../../repository/storage.ts";
import type { NativeCall } from "../vault-client.ts";
import { nativeError } from "../native-error.ts";
export function nativeStorage(
  sessionId: string,
  call: NativeCall,
): StorageService {
  async function request(action: unknown): Promise<StorageStatus> {
    let value: StorageStatus;
    try {
      value = await call("desktop_backup_storage", {
        request: { sessionId, action },
      });
    } catch (error) {
      throw nativeError(error);
    }
    const location = (value: unknown) =>
      value === "external" || value === "colocated";
    if (
      !value ||
      !Number.isSafeInteger(value.revision) ||
      value.revision < 0 ||
      !location(value.location) ||
      (value.repositoryPath !== undefined &&
        typeof value.repositoryPath !== "string") ||
      (value.canReveal !== undefined && typeof value.canReveal !== "boolean") ||
      (value.pending !== null &&
        (!value.pending ||
          typeof value.pending.request_id !== "string" ||
          !location(value.pending.location) ||
          typeof value.pending.phase !== "string"))
    )
      throw new Error("Invalid history storage state");
    return value;
  }
  return {
    status: () => request({ kind: "status" }),
    reveal: (revision) => request({ kind: "reveal", revision }),
    change: (revision: number, location: StorageLocation, requestId: string) =>
      request({ kind: "change", revision, location, request_id: requestId }),
    recover: () => request({ kind: "recover" }),
    rollback: (requestId) =>
      request({ kind: "rollback", request_id: requestId }),
    async reload() {
      try {
        await call("lifecycle_reload");
      } catch (error) {
        throw nativeError(error);
      }
    },
  };
}
