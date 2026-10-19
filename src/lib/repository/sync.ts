import type { BackupCheckpoint } from "./backup.ts";
import type { VaultRestorePreview, VaultRestoreRequest } from "./restore.ts";
export type SyncProposal = {
  local: BackupCheckpoint;
  incoming: BackupCheckpoint;
  candidate: BackupCheckpoint | null;
  conflicts: string[];
};
export type SyncConflict = {
  path: string;
  terms: {
    id: number;
    role: string;
    kind: string;
    text: string | null;
    executable?: boolean | null;
  }[];
};
export type SyncResolution =
  | { kind: "term"; id: number }
  | { kind: "text"; text: string; executable: boolean }
  | { kind: "delete" };
export interface SyncService {
  prepare(revision: number): Promise<SyncProposal | null>;
  preview(candidate: string, revision: number): Promise<VaultRestorePreview>;
  apply(request: VaultRestoreRequest, revision: number): Promise<unknown>;
  conflict(
    candidate: string,
    path: string,
    revision: number,
  ): Promise<SyncConflict>;
  resolve(
    candidate: string,
    path: string,
    resolution: SyncResolution,
    revision: number,
  ): Promise<BackupCheckpoint>;
  publish(
    revision: number,
    requestId: string,
  ): Promise<"complete" | "unknown" | "stale" | "stopped">;
}
export type PendingSync = {
  version: 1;
  revision: number;
  request: VaultRestoreRequest;
};
export function pendingSync(value: unknown): PendingSync | undefined {
  if (!value || typeof value !== "object") return;
  const saved = value as PendingSync;
  if (
    saved.version === 1 &&
    Number.isSafeInteger(saved.revision) &&
    saved.revision >= 0 &&
    typeof saved.request?.checkpoint === "string" &&
    typeof saved.request?.expected === "string" &&
    /^[a-zA-Z0-9-]{1,128}$/.test(saved.request?.request_id)
  )
    return saved;
}
export type SyncState = {
  busy: boolean;
  phase:
    | "ready"
    | "fetching"
    | "applying"
    | "publishing"
    | "conflicts"
    | "attention"
    | "paused";
  proposal?: SyncProposal;
  enabled: boolean;
  conflict?: SyncConflict;
  lastSuccess?: number;
  recovery: boolean;
};
