import type { Handle, LocalGraphCommit } from "@lapismd/jj-history";
import type { HistoryReader } from "./history-reader.ts";
import { check } from "./history-selection.ts";

/** Parent cards use the existing exact-commit read, never a revset substitution. */
export async function parentCandidates(
  reader: HistoryReader,
  handle: Handle,
  parents: readonly string[],
  known: readonly LocalGraphCommit[],
  current: () => boolean,
): Promise<LocalGraphCommit[] | undefined> {
  const result = [
    ...new Map(
      known
        .filter((commit) => parents.includes(commit.id))
        .map((commit) => [commit.id, commit]),
    ).values(),
  ];
  const missing = [...new Set(parents)].filter(
    (id) => !result.some((commit) => commit.id === id),
  );
  if (missing.length > 64)
    throw new Error("Parent details exceed the preview limit");
  for (const id of missing) {
    const response = await reader.read(handle, {
      kind: "commit",
      query: { commit: id },
    });
    if (!current()) return;
    check(
      response.kind === "commit" &&
        response.data.commit.id === id &&
        response.data.object.key.kind === "commit" &&
        response.data.object.key.id === id &&
        response.data.object.data.kind === "commit",
    );
    result.push(response.data.commit);
  }
  return current() ? result : undefined;
}
