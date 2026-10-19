import type { HistoryController } from "./history-controller.ts";

/** Exact native commit reads can open retained search results beyond graph paging. */
export async function openHistoryRevision(
  controller: HistoryController,
  id: string,
) {
  const commit = controller.state.commits.find((item) => item.id === id);
  if (commit) await controller.selectRevision(commit);
  else await controller.openRevision(id);
}
