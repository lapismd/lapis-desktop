import { FileView, type App, type ItemView } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import type { RepositoryPlugin } from "../../../../src/components/repository/repository-plugin.ts";
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

/** Proposed plugin contribution through the public FileView action bar only. */
export function installBlameReviewActions(plugin: RepositoryPlugin) {
  const app = plugin.app,
    actions = new Map<FileView, ItemView["actions"][number]>();
  let disposed = false;
  const sync = () => {
    if (disposed) return;
    app.workspace.iterateRootLeaves((leaf) => {
      const view = leaf.view;
      if (!(view instanceof FileView)) return;
      const installed = actions.get(view);
      if (installed && view.actions.includes(installed)) return;
      view.addAction("git-merge-conflict", "Blame file", async () => {
        if (disposed || !view.file) return;
        const path = view.file.path,
          controller = plugin.createFileHistoryController();
        try {
          await controller.follow(path);
          const { operation, workspaceCommit: commit } = controller.state;
          if (!disposed && operation && commit)
            await openBlameReview(app, { operation, commit, path });
        } finally {
          await plugin.release(controller);
        }
      });
      actions.set(view, view.actions.at(-1)!);
    });
  };
  const fileOpen = app.workspace.on("file-open", sync);
  const leafChange = app.workspace.on("active-leaf-change", sync);
  // File views populate their own actions after file-open, before layout-change.
  const layoutChange = app.workspace.on("layout-change", sync);
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    app.workspace.offref(fileOpen);
    app.workspace.offref(leafChange);
    app.workspace.offref(layoutChange);
    for (const [view, action] of actions)
      view.actions = view.actions.filter((value) => value !== action);
    actions.clear();
  };
  plugin.register(dispose);
  sync();
  return { dispose, sync };
}
