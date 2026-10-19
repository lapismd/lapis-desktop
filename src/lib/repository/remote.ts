import type { BackupCheckpoint } from "./backup.ts";
import type {
  RestoreService,
  VaultRestorePreview,
  VaultRestoreRequest,
} from "./restore.ts";
export type RemoteConfiguration = {
  account: string;
  project: string;
  target: { url: string; branch: string };
  canPush: boolean;
};
export type PendingPublication = {
  request_id: string;
  before: string | null;
  after: string;
  outcome: "prepared" | "unknown" | "complete" | "stale" | "stopped";
};
export type RemoteSnapshot = {
  revision: number;
  configuration: RemoteConfiguration | null;
  checkpoint: BackupCheckpoint | null;
  publication?: PendingPublication | null;
};
export interface RemoteService {
  publication?: {
    observe(revision: number, requestId: string): Promise<RemoteSnapshot>;
    stop(revision: number, requestId: string): Promise<RemoteSnapshot>;
  };
  status(): Promise<RemoteSnapshot>;
  configure(
    revision: number,
    account: string,
    project: string,
    branch?: string,
  ): Promise<RemoteSnapshot>;
  disconnect(revision: number): Promise<RemoteSnapshot>;
  fetch(revision: number): Promise<RemoteSnapshot>;
  preview(checkpoint: string): Promise<VaultRestorePreview>;
  restore(request: VaultRestoreRequest): Promise<unknown>;
  keepCurrent(): Promise<unknown>;
}
export function remoteRestore(service: RemoteService): RestoreService {
  return {
    preview: async () => {
      throw new Error("Choose a remote vault checkpoint");
    },
    apply: async () => {
      throw new Error("Choose a remote vault checkpoint");
    },
    previewVault: (checkpoint) => service.preview(checkpoint),
    applyVault: (request) => service.restore(request),
    keepCurrent: () => service.keepCurrent(),
  };
}
export type RemoteViewState = {
  busy: boolean;
  phase: string;
  data?: RemoteSnapshot;
};
