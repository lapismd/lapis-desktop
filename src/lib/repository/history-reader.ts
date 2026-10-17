import type { HistoryClient } from "@lapismd/jj-history";

/** Transport-independent reader supplied by the host, never by persisted state. */
export type HistoryReader = Pick<
  HistoryClient,
  "heads" | "open" | "status" | "read" | "close"
>;
export type RepositoryLeaveMode = "close" | "reload";
export interface RepositoryServices {
  reader: HistoryReader;
  close(mode: RepositoryLeaveMode): Promise<void>;
}
