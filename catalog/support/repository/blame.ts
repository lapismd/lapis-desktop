import type { LocalGraphCommit, BlamePage } from "@lapismd/jj-history";
import type { HistoryReader } from "../../../src/lib/repository/history-reader.ts";
export const blameText =
  "# Notes\nHistory is retained\n\nAnother author changed this line.\n";
export function attachBlameFixture(
  reader: HistoryReader,
  selection: {
    repository: string;
    commit: LocalGraphCommit;
    parent: LocalGraphCommit;
  },
  scenario: string,
  calls: Array<[string, unknown]>,
) {
  let failed = scenario === "blame-failure";
  const releases = new Map<string, () => void>();
  const close = reader.close,
    read = reader.read;
  reader.close = async (handle) => {
    releases.get(handle)?.();
    releases.delete(handle);
    await close(handle);
  };
  reader.read = async (handle, query) => {
    if (query.kind !== "file_at") return read(handle, query);
    calls.push([handle, query]);
    return {
      kind: "file_at",
      data: {
        bytes: blameText.length,
        text: blameText,
        binary: false,
        too_large: false,
      },
    };
  };
  reader.blame = async (handle, query): Promise<BlamePage> => {
    calls.push([handle, { kind: "blame", query }]);
    if (failed) throw new Error("The file blame could not be read");
    if (scenario === "blame-preparing")
      await new Promise<void>((resolve) => releases.set(handle, resolve));
    const state = await reader.status(handle);
    if (state.state !== "ready") throw new Error("Fixture is not ready");
    const first = selection.commit,
      parent = selection.parent;
    const summary = (commit: LocalGraphCommit) => ({
      id: commit.id,
      change_id: commit.change_id,
      description: commit.description,
      author: commit.author,
      committer: commit.committer,
    });
    const partial = scenario === "blame-progress" && !query.continuation;
    return {
      version: 1,
      repository: selection.repository,
      operation: state.data.operation,
      commit: query.commit,
      path: query.path,
      file_id: "44".repeat(20),
      line_count: 4,
      ranges: partial
        ? []
        : [
            { start: 1, end: 3, commit_id: first.id },
            { start: 3, end: 5, commit_id: parent.id },
          ],
      commits: {
        [first.id]: summary(first),
        [parent.id]: summary({
          ...parent,
          author: {
            ...parent.author,
            name: "Grace",
            email: "grace@example.test",
          },
        }),
      },
      complete: !partial,
      continuation: partial ? "next-blame" : null,
      history_commits: 2,
      stats: {
        metadata_nodes: 0,
        object_bytes: 0,
        object_reads: 0,
        work: 0,
        predicate_file_bytes: 0,
        predicate_lines: 0,
      },
    };
  };
  return {
    recover() {
      failed = false;
    },
  };
}
