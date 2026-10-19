import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { mount, unmount } from "svelte";
import { HistorySearchController } from "../../../lib/repository/search-controller.ts";
import type {
  HistorySearchHit,
  HistorySearchService,
} from "../../../lib/repository/search.ts";
import { BackgroundWork } from "../../../lib/desktop/background-work.ts";
import { createRestoreController } from "../restore-controller.ts";
import type { RepositoryPlugin } from "../repository-plugin.ts";
import HistorySearchPanel from "./HistorySearchPanel.svelte";
export function registerHistorySearch(
  plugin: RepositoryPlugin,
  service?: HistorySearchService,
) {
  if (!service) return async () => {};
  const views = new Set<HistorySearchView>();
  class HistorySearchView extends View {
    #component?: ReturnType<typeof mount>;
    #controller?: HistorySearchController;
    #restore?: ReturnType<typeof createRestoreController>;
    #progress?: () => void;
    #restoreProgress?: () => void;
    constructor(leaf: WorkspaceLeaf) {
      super(leaf);
    }
    getViewType() {
      return "repository-history-search";
    }
    getDisplayText() {
      return "Search history";
    }
    getIcon() {
      return "history";
    }
    protected async onOpen() {}
    protected async onClose() {}
    onload() {
      views.add(this);
      this.#controller = new HistorySearchController(
        service!,
        plugin.feedback("Search history"),
      );
      this.#restore = createRestoreController(plugin);
      const work = new BackgroundWork(plugin.app.notifications, plugin.id);
      this.#progress = work.follow(
        "Searching saved vault history",
        this.#controller,
      );
      if (this.#restore)
        this.#restoreProgress = work.follow("Restoring saved history", {
          subscribe: (listener) =>
            this.#restore!.subscribe((state) =>
              listener({ busy: state.busy, phase: "restoring" }),
            ),
        });
      this.#component = mount(HistorySearchPanel, {
        target: this.containerEl,
        props: {
          controller: this.#controller,
          restore: this.#restore,
          onOpen: async (hit: HistorySearchHit) => {
            const c = hit.revision.checkpoint;
            try {
              if (hit.path)
                await plugin.openBlame(c.operation, c.commit, hit.path);
              else await plugin.open(c.operation, c.commit);
            } catch (error) {
              plugin.report(error);
            }
          },
        },
      });
    }
    async closeSearch() {
      this.#controller?.close();
      this.#restore?.close();
      await this.#controller?.drained();
      this.#progress?.();
      this.#restoreProgress?.();
      views.delete(this);
    }
    onunload() {
      if (this.#component) void unmount(this.#component);
      this.#component = undefined;
      void this.closeSearch().catch((error) => plugin.report(error));
    }
  }
  const open = () => {
    const workspace = getWorkspaceHostBinding(plugin.app.workspace).controller
      .workspace;
    const existing = workspace.getLeavesOfType("repository-history-search")[0];
    if (existing) workspace.revealLeaf(existing);
    else if (
      !workspace.openLeaf("repository-history-search", {}, { active: true })
    )
      plugin.report(new Error("History search could not be opened"));
  };
  plugin.registerView(
    "repository-history-search",
    (leaf) => new HistorySearchView(leaf),
    {
      kind: "command",
      command: {
        id: "open-history-search",
        name: "Open saved vault history search",
        callback: open,
      },
    },
  );
  plugin.addRibbonIcon("history", "Search saved vault history", open);
  return async () => {
    await Promise.all([...views].map((view) => view.closeSearch()));
  };
}
