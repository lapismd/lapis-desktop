import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import type {
  LocalGraphOperationNode,
  LocalGraphEvolutionNode,
} from "@lapismd/jj-history";
import { mount, unmount } from "svelte";
import type { HistoryReader } from "../../../../src/lib/repository/history-reader.ts";
import { HistoryController } from "../../../../src/lib/repository/history-controller.ts";
import RepositoryHistoryReview from "./RepositoryHistoryReview.svelte";
import { operation } from "../fixture.ts";
import type { RepositoryWorkspace } from "../../../../src/lib/repository/workspaces.ts";

export class HistoryReviewView extends View {
  #component?: ReturnType<typeof mount>;
  #controller?: HistoryController;
  constructor(
    leaf: WorkspaceLeaf,
    readonly reader: HistoryReader,
    readonly initialRevision?: string,
    readonly operationNodes: readonly LocalGraphOperationNode[] = [],
    readonly evolutionNodes: readonly LocalGraphEvolutionNode[] = [],
    readonly initialEvolution = false,
    readonly workspaces: readonly RepositoryWorkspace[] = [],
  ) {
    super(leaf);
  }
  getViewType() {
    return "repository-history-review";
  }
  getDisplayText() {
    return "JJ Log review";
  }
  getIcon() {
    return "git-branch";
  }
  protected async onOpen() {}
  protected async onClose() {}
  onload() {
    const controller = (this.#controller = new HistoryController(this.reader, {
      report: (error: unknown) => {
        this.app.notifications.notify({
          title: "Repository review",
          message: String(error),
          severity: "error",
          persist: false,
        });
      },
      recovered() {},
    }));
    this.#component = mount(RepositoryHistoryReview, {
      target: this.containerEl,
      props: {
        controller,
        initialOperation: operation,
        initialRevision: this.initialRevision,
        operationNodes: this.operationNodes,
        evolutionNodes: this.evolutionNodes,
        initialEvolution: this.initialEvolution,
        workspaces: this.workspaces,
        copyText: (value: string) => navigator.clipboard.writeText(value),
      },
    });
  }
  onunload() {
    if (this.#component) void unmount(this.#component);
    if (this.#controller)
      void this.#controller.close().catch((error) => console.error(error));
  }
}
