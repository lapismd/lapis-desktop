import type {
  LocalConflictDescriptor,
  LocalCodeSnapshot,
  LocalGraphCommit,
  LocalCodeObjectKey,
  LocalFileDiffChange,
} from "@lapismd/jj-history";

export interface HistoryState {
  phase: "idle" | "loading" | "ready" | "unavailable";
  busy: boolean;
  workspace: string | null;
  conflicts: LocalConflictDescriptor[];
  conflictsReady: boolean;
  heads: string[];
  headsReady: boolean;
  operation?: string;
  snapshot?: LocalCodeSnapshot;
  commits: LocalGraphCommit[];
  commitsReady: boolean;
  next?: LocalCodeObjectKey | null;
  revision?: LocalGraphCommit;
  base?: string;
  parentCommits: LocalGraphCommit[];
  paths: LocalFileDiffChange[];
  pathsReady: boolean;
  nextPath?: string | null;
  path?: string;
  diff?: LocalFileDiffChange;
}
export const initialHistoryState = (): HistoryState => ({
  phase: "idle",
  busy: false,
  workspace: null,
  conflicts: [],
  conflictsReady: false,
  heads: [],
  headsReady: false,
  commits: [],
  commitsReady: false,
  parentCommits: [],
  paths: [],
  pathsReady: false,
  operation: undefined,
  snapshot: undefined,
  next: undefined,
  revision: undefined,
  base: undefined,
  nextPath: undefined,
  path: undefined,
  diff: undefined,
});

export function revisionLabel(commit: LocalGraphCommit): string {
  return commit.description.split("\n")[0] || "No description";
}
export function timestampLabel(millis: number | bigint): string {
  const value = BigInt(millis);
  return value >= -8640000000000000n && value <= 8640000000000000n
    ? new Date(Number(value)).toLocaleString()
    : `${value} milliseconds since epoch`;
}
export function diffText(
  change: LocalFileDiffChange,
): { oldText: string; newText: string } | { unavailable: string } {
  if (change.content.status === "unavailable")
    return { unavailable: change.content.reason.replaceAll("_", " ") };
  const oldText = change.content.hunks.map((hunk) => hunk.before).join("");
  const newText = change.content.hunks.map((hunk) => hunk.after).join("");
  if (new TextEncoder().encode(oldText + newText).length > 1024 * 1024)
    return { unavailable: "The text exceeds the preview limit" };
  return { oldText, newText };
}

/** Clears the selected revision and every dependent comparison value. */
export function resetHistoryComparison(): Partial<HistoryState> {
  return {
    conflicts: [],
    conflictsReady: false,
    revision: undefined,
    parentCommits: [],
    base: undefined,
    paths: [],
    pathsReady: false,
    nextPath: null,
    path: undefined,
    diff: undefined,
  };
}
