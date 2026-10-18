import { Channel } from "@tauri-apps/api/core";
import type { NativeCall } from "../vault-client.ts";
import { nativeError } from "../native-error.ts";
import type { BackupService, BackupStatus } from "../../repository/backup.ts";

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
): BackupService {
  let events: Channel<BackupStatus> | undefined;
  async function invoke<T>(command: string, extra = {}) {
    try {
      return await call<T>(command, { request: { sessionId }, ...extra });
    } catch (error) {
      throw nativeError(error);
    }
  }
  return {
    async start(changed) {
      if (events) events.onmessage = () => {};
      events = new Channel<BackupStatus>();
      events.onmessage = (value) => changed(status(value));
      return status(await invoke("desktop_backup_start", { onChange: events }));
    },
    async capture() {
      return status(await invoke("desktop_backup_capture"));
    },
    async stop() {
      await invoke("desktop_backup_stop");
      if (events) events.onmessage = () => {};
      events = undefined;
    },
  };
}
