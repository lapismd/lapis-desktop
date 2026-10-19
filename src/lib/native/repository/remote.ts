import type { RemoteService, RemoteSnapshot } from "../../repository/remote.ts";
import type { NativeCall } from "../vault-client.ts";
import { nativeError } from "../native-error.ts";
export function nativeRemote(
  sessionId: string,
  call: NativeCall,
): RemoteService {
  async function request<T>(action: unknown): Promise<T> {
    try {
      return await call<T>("desktop_backup_remote", {
        request: { sessionId, action },
      });
    } catch (error) {
      throw nativeError(error);
    }
  }
  async function snapshot(action: unknown): Promise<RemoteSnapshot> {
    const value = await request<RemoteSnapshot>(action);
    if (
      !value ||
      !Number.isSafeInteger(value.revision) ||
      value.revision < 0 ||
      (value.configuration &&
        (typeof value.configuration.account !== "string" ||
          typeof value.configuration.project !== "string" ||
          typeof value.configuration.target?.url !== "string" ||
          typeof value.configuration.target.branch !== "string" ||
          typeof value.configuration.canPush !== "boolean")) ||
      (value.checkpoint &&
        (typeof value.checkpoint.commit !== "string" ||
          typeof value.checkpoint.operation !== "string"))
    )
      throw new Error("Invalid remote backup state");
    return value;
  }
  return {
    status: () => snapshot({ kind: "status" }),
    configure: (revision, account, project, branch) =>
      snapshot({
        kind: "configure",
        revision,
        account,
        project,
        branch: branch || null,
      }),
    disconnect: (revision) => snapshot({ kind: "disconnect", revision }),
    fetch: (revision) => snapshot({ kind: "fetch", revision }),
    preview: (checkpoint) => request({ kind: "preview", checkpoint }),
    restore: (restore) => request({ kind: "restore", request: restore }),
    async keepCurrent() {
      try {
        return await call("desktop_backup_capture", { request: { sessionId } });
      } catch (error) {
        throw nativeError(error);
      }
    },
  };
}
