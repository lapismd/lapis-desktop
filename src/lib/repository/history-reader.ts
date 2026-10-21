import type { HistoryClient } from "@lapismd/jj-history";

/** Transport-independent reader supplied by the host, never by persisted state. */
export type HistoryReader = Pick<
  HistoryClient,
  "heads" | "open" | "status" | "read" | "close"
> &
  Partial<Pick<HistoryClient, "blame">>;
export type RepositoryLeaveMode = "close" | "reload";
export interface RepositoryServices {
  aiHistory?: import("./ai-history.ts").AiHistoryService;
  adoption?: import("./adoption.ts").AdoptionService;
  sources?: () => Promise<{ original: boolean }>;
  original?: HistoryReader;
  storage?: import("./storage.ts").StorageService;
  search?: import("./search.ts").HistorySearchService;
  sync?: import("./sync.ts").SyncService;
  remote?: import("./remote.ts").RemoteService;
  forges?: import("./forge-accounts.ts").ForgeService;
  restore?: import("./restore.ts").RestoreService;
  backup?: import("./backup.ts").BackupService;
  reader: HistoryReader;
  workingCopy?: () => Promise<
    import("./working-copy-status.ts").WorkingCopyStatus
  >;
  close(mode: RepositoryLeaveMode): Promise<void>;
}
