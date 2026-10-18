import { FileView, type ItemView } from "@lapis-notes/api";
import type { RepositoryPlugin } from "../repository-plugin.ts";

/** The enabled plugin owns editor contributions and their read-only controllers. */
export function registerBlameEditorActions(plugin: RepositoryPlugin) {
  const app = plugin.app;
  const actions = new Map<FileView, ItemView["actions"][number]>();
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
        const path = view.file.path;
        const controller = plugin.createFileHistoryController();
        try {
          await controller.follow(path);
          const { operation, workspaceCommit: commit } = controller.state;
          if (!disposed && view.file?.path === path && operation && commit)
            await plugin.openBlame(operation, commit, path);
        } catch (error) {
          if (!disposed) plugin.report(error);
        } finally {
          await plugin.release(controller);
        }
      });
      actions.set(view, view.actions.at(-1)!);
    });
  };
  const fileOpen = app.workspace.on("file-open", sync);
  const leafChange = app.workspace.on("active-leaf-change", sync);
  const layoutChange = app.workspace.on("layout-change", sync);
  plugin.register(() => {
    disposed = true;
    app.workspace.offref(fileOpen);
    app.workspace.offref(leafChange);
    app.workspace.offref(layoutChange);
    for (const [view, action] of actions)
      view.actions = view.actions.filter((value) => value !== action);
    actions.clear();
  });
  app.workspace.onLayoutReady(sync);
  sync();
}
