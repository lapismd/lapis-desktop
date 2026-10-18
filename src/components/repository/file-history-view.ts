import { FileView, View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import type { RepositoryPlugin } from "./repository-plugin.ts";
import type { FileHistoryController } from "../../lib/repository/file-history-controller.ts";
import RepositoryFileHistory from "./RepositoryFileHistory.svelte";

export class FileHistoryView extends View {
  #controller?: FileHistoryController;
  #component?: ReturnType<typeof mount>;
  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: RepositoryPlugin,
  ) {
    super(leaf);
  }
  getViewType() {
    return "repository-file-history";
  }
  getDisplayText() {
    return "File history";
  }
  getIcon() {
    return "file-clock";
  }
  protected async onOpen() {}
  protected async onClose() {}
  onload() {
    const controller = (this.#controller =
      this.plugin.createFileHistoryController());
    const workspace = this.app.workspace;
    const follow = (leaf = workspace.activeLeaf) => {
      let root = false;
      workspace.iterateRootLeaves((candidate) => {
        if (candidate === leaf) root = true;
      });
      if (!leaf || root)
        void controller.follow(
          leaf?.view instanceof FileView ? leaf.view.file?.path : undefined,
        );
    };
    this.registerEvent(workspace.on("active-leaf-change", follow));
    this.registerEvent(workspace.on("file-open", () => follow()));
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        const path = controller.state.path;
        if (path === oldPath) void controller.follow(file.path);
        else if (path?.startsWith(`${oldPath}/`))
          void controller.follow(file.path + path.slice(oldPath.length));
      }),
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (file.path === controller.state.path) void controller.follow();
      }),
    );
    this.#component = mount(RepositoryFileHistory, {
      target: this.containerEl,
      props: {
        controller,
        copyText: (value: string) => this.plugin.copyIdentifier(value),
        onBlame: () => {
          const { operation, workspaceCommit: commit, path } = controller.state;
          if (operation && commit && path)
            void this.plugin
              .openBlame(operation, commit, path)
              .catch((error) => this.plugin.report(error));
        },
        onOpen: (revision: string) =>
          void this.plugin
            .open(controller.state.operation, revision)
            .catch((error) => this.plugin.report(error)),
      },
    });
    follow();
  }
  onunload() {
    if (this.#component) void unmount(this.#component);
    this.#component = undefined;
    if (this.#controller)
      void this.plugin
        .release(this.#controller)
        .catch((error) => this.plugin.report(error));
  }
}

export function registerFileHistoryView(plugin: RepositoryPlugin) {
  let active = true;
  plugin.register(() => {
    active = false;
  });
  const ensure = async (reveal = false) => {
    if (!active) return;
    const workspace = plugin.app.workspace;
    let leaf = workspace.getLeavesOfType("repository-file-history")[0];
    if (!leaf) {
      leaf = workspace.ensureSideLeaf("repository-file-history");
      await leaf.setViewState({ type: "repository-file-history", state: {} });
    }
    if (reveal && active) await workspace.revealLeaf(leaf);
  };
  plugin.registerSidebarView(
    "repository-file-history",
    (leaf) => new FileHistoryView(leaf, plugin),
    { side: "right", title: "File history", icon: "file-clock" },
    {
      kind: "command",
      command: {
        id: "open-file-history",
        name: "Open File History",
        callback: () => {
          void ensure(true).catch((error) => plugin.report(error));
        },
      },
    },
  );
  plugin.app.workspace.onLayoutReady(() => {
    void ensure().catch((error) => plugin.report(error));
  });
}
