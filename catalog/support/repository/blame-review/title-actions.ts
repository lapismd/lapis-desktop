import type { App } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import type { BlameSelection } from "../../../../src/lib/repository/blame-model.ts";

export async function openBlameReview(app: App, selection: BlameSelection) {
  const workspace = getWorkspaceHostBinding(app.workspace).controller.workspace;
  const existing = workspace.getLeavesOfType("repository-file-blame-review")[0];
  if (existing) {
    await existing.setViewState({
      type: "repository-file-blame-review",
      state: selection,
    });
    workspace.revealLeaf(existing);
  } else
    workspace.openLeaf("repository-file-blame-review", selection, {
      active: true,
    });
}
