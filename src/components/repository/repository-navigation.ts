import type { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import {
  historySource,
  type HistorySource,
} from "../../lib/repository/history-source.ts";
/** Each source owns its own tab and pins; switching never substitutes a reader. */
export async function openRepositoryView(
  workspace: ReturnType<
    typeof getWorkspaceHostBinding
  >["controller"]["workspace"],
  type: string,
  source: HistorySource,
  selection: Record<string, unknown> = {},
) {
  const existing = workspace
    .getLeavesOfType(type)
    .find((leaf) => historySource(leaf.viewState?.state ?? {}) === source);
  const state = { ...selection, source };
  if (existing) {
    if (Object.keys(selection).length)
      await existing.setViewState({ type, state });
    workspace.revealLeaf(existing);
  } else if (!workspace.openLeaf(type, state, { active: true })) {
    throw new Error("Repository history could not be opened");
  }
}
