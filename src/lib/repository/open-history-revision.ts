import type { HistoryController } from "./history-controller.ts";

/** The sidebar and main log retain the same explicit operation pin. */
export async function openHistoryRevision(
  controller: HistoryController,
  id: string,
) {
  const operation = controller.state.operation;
  for (let page = 0; page < 4; page++) {
    const commit = controller.state.commits.find((item) => item.id === id);
    if (commit) {
      await controller.selectRevision(commit);
      return;
    }
    if (!controller.state.next) break;
    await controller.moreCommits();
    if (controller.state.operation !== operation) return;
  }
  controller.feedback.report(
    new Error("This revision is outside the bounded JJ Log history."),
  );
}
