import type { Handle, LocalGraphCommit } from "@lapismd/jj-history";
import type { HistoryReader } from "./history-reader.ts";
import type { OperationState } from "./operation-state.ts";
import { parentCandidates } from "./parent-candidates.ts";
import { check } from "./history-selection.ts";

export function operationRevisionCards(
  reader: HistoryReader,
  handle: Handle,
  state: OperationState,
  current: () => boolean,
) {
  const ids = [
    ...new Set(state.files.groups.flatMap((g) => [...g.after, ...g.before])),
  ].slice(0, 64);
  return parentCandidates(reader, handle, ids, state.commits, current);
}

export async function workspaceCommits(
  reader: HistoryReader,
  handle: Handle,
  operation: string,
): Promise<LocalGraphCommit[]> {
  const response = await reader.read(handle, {
    kind: "graph",
    query: [
      {
        graph: "log",
        revset: "working_copies()",
        user_email: "",
        at_time_millis: Date.now(),
      },
      { limit: 64, after: null },
    ],
  });
  check(
    response.kind === "graph" &&
      response.data.operation === operation &&
      response.data.data.graph === "log",
  );
  return response.data.data.nodes.map((n) => n.commit);
}
