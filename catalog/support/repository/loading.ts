import type { HistoryReader } from "../../../src/lib/repository/history-reader.ts";

/** Hold a real view boundary until its owning handle closes. */
export function attachLoadingFixture(reader: HistoryReader, scenario: string) {
  const kind = {
    "files-preparing": "diff_paths",
    "diff-preparing": "diff",
    "operation-details-preparing": "operation_diff",
    "conflicts-preparing": "conflicts",
  }[scenario];
  if (!kind) return;
  const releases = new Map<string, () => void>();
  const read = reader.read,
    close = reader.close;
  reader.read = async (handle, query) => {
    if (query.kind === kind)
      await new Promise<void>((resolve) => releases.set(handle, resolve));
    return read(handle, query);
  };
  reader.close = async (handle) => {
    releases.get(handle)?.();
    releases.delete(handle);
    await close(handle);
  };
}
