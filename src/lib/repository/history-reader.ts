import type { HistoryClient } from "@lapismd/jj-history";

/** Transport-independent reader supplied by the host, never by persisted state. */
export type HistoryReader = Pick<
  HistoryClient,
  "heads" | "open" | "status" | "read" | "close"
> &
  Partial<Pick<HistoryClient, "blame">>;
export type RepositoryLeaveMode = "close" | "reload";
export interface RepositoryServices {
  restore?: import("./restore.ts").RestoreService;
  backup?: import("./backup.ts").BackupService;
  reader: HistoryReader;
  workingCopy?: () => Promise<
    import("./working-copy-status.ts").WorkingCopyStatus
  >;
  close(mode: RepositoryLeaveMode): Promise<void>;
}
