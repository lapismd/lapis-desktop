import type { LocalFileDiffChange } from "@lapismd/jj-history";
import type { FileListingFile } from "@lapismd/design-core/diff";
export function changeStats(
  change?: LocalFileDiffChange,
): { additions: number; deletions: number } | undefined {
  if (!change || change.content.status !== "text") return undefined;
  const lines = (value: string) =>
    value ? value.split("\n").length - (value.endsWith("\n") ? 1 : 0) : 0;
  return change.content.hunks.reduce(
    (stats, hunk) => {
      if (hunk.kind === "different") {
        stats.additions += lines(hunk.after);
        stats.deletions += lines(hunk.before);
      }
      return stats;
    },
    { additions: 0, deletions: 0 },
  );
}
export function listingFiles(
  paths: LocalFileDiffChange[],
  selected?: LocalFileDiffChange,
): FileListingFile[] {
  return paths.map((change) => ({
    path: change.path,
    ...changeStats(selected?.path === change.path ? selected : change),
  }));
}
