import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import type { HistoryReader } from "@lapis-notes/history/repository/controllers/history-reader";
import type { LocalGraphCommit } from "@lapismd/jj-history";
import { OperationController } from "@lapis-notes/history/repository/controllers/operation-controller";
import RepositoryOperationsReview from "./RepositoryOperationsReview.svelte";
import { operation } from "../fixture.ts";
import type { RepositoryWorkspace } from "@lapis-notes/history/repository/controllers/workspaces";

/** Catalog-only view: no production registration or shipping UI imports this. */
export class OperationReviewView extends View {
  #component?: ReturnType<typeof mount>;
  #controller?: OperationController;
  constructor(
    leaf: WorkspaceLeaf,
    readonly reader: HistoryReader,
    readonly commits: LocalGraphCommit[],
    readonly selected: boolean,
    readonly workspaces: readonly RepositoryWorkspace[] = [],
  ) {
    super(leaf);
  }
  getViewType() {
    return "repository-oplog-review";
  }
  getDisplayText() {
    return "Op Log review";
  }
  getIcon() {
    return "git-pull-request-arrow";
  }
  protected async onOpen() {}
  protected async onClose() {}
  onload() {
    const feedback = {
      report: (error: unknown) => {
        this.app.notifications.notify({
          title: "Repository review",
          message: String(error),
          severity: "error",
          persist: false,
        });
      },
      recovered() {},
    };
    const controller = (this.#controller = new OperationController(
      this.reader,
      feedback,
    ));
    this.#component = mount(RepositoryOperationsReview, {
      target: this.containerEl,
      props: {
        controller,
        initialOperation: operation,
        initialSelected: this.selected,
        reviewCommits: this.commits,
        workspaces: this.workspaces,
        copyText: (text: string) => navigator.clipboard.writeText(text),
      },
    });
  }
  onunload() {
    if (this.#component) void unmount(this.#component);
    if (this.#controller)
      void this.#controller.close().catch((error) => console.error(error));
  }
}
