import { Channel } from "@tauri-apps/api/core";
import type { App } from "@lapis-notes/api";
import type { NativeCall } from "../vault-client.ts";
import { nativeError } from "../native-error.ts";
import type {
  BackupService,
  BackupStatus,
} from "@lapis-notes/history/repository/controllers/backup";

function status(value: unknown): BackupStatus {
  if (!value || typeof value !== "object")
    throw new Error("Invalid vault backup status");
  const state = value as BackupStatus;
  if (
    !["saving", "ready", "failed", "closed"].includes(state.phase) ||
    (state.error !== null && typeof state.error !== "string")
  )
    throw new Error("Invalid vault backup status");
  if (
    state.checkpoint &&
    (typeof state.checkpoint.commit !== "string" ||
      typeof state.checkpoint.operation !== "string" ||
      typeof state.checkpoint.description !== "string" ||
      !Number.isSafeInteger(state.checkpoint.timestamp_millis))
  )
    throw new Error("Invalid vault backup checkpoint");
  return state;
}
export function nativeBackup(
  sessionId: string,
  call: NativeCall,
  app?: App,
): BackupService {
  let events: Channel<BackupStatus> | undefined;
  async function invoke<T>(command: string, extra = {}) {
    try {
      return await call<T>(command, { request: { sessionId }, ...extra });
    } catch (error) {
      throw nativeError(error);
    }
  }
  async function selection(command: unknown) {
    try {
      return await call<{ configuration: unknown; status: BackupStatus }>(
        "desktop_repository_backup",
        { request: { sessionId, command } },
      );
    } catch (error) {
      throw nativeError(error);
    }
  }
  return {
    ...(app
      ? {
          async setEnabled(enabled: boolean) {
            const mutation = app.fileEditingSessions.guard(
              app.configuration.basePath,
              async () => {
                const before = await selection({ kind: "status" });
                try {
                  await selection({
                    kind: "set_enabled",
                    enabled,
                    expected: before.configuration,
                  });
                } catch (error) {
                  await selection({ kind: "status" });
                  throw error;
                }
              },
            );
            const reconciliation = app.fileEditingSessions.afterMutations(() =>
              app.configuration.reloadFromDisk({ materializeDefaults: false }),
            );
            const [selected, refreshed] = await Promise.allSettled([
              mutation,
              reconciliation,
            ]);
            if (selected.status === "rejected") throw selected.reason;
            if (refreshed.status === "rejected") throw refreshed.reason;
          },
        }
      : {}),
    async start(changed) {
      if (events) events.onmessage = () => {};
      events = new Channel<BackupStatus>();
      events.onmessage = (value) => changed(status(value));
      return status(await invoke("desktop_backup_start", { onChange: events }));
    },
    async capture() {
      return status((await selection({ kind: "capture" })).status);
    },
    async stop() {
      if (events) events.onmessage = () => {};
      events = undefined;
    },
  };
}
