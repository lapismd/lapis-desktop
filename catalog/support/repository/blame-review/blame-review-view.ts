import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import type { RepositoryPlugin } from "../../../../src/components/repository/repository-plugin.ts";
import type { BlameController } from "../../../../src/lib/repository/blame-controller.ts";
import type { BlameSelection } from "../../../../src/lib/repository/blame-model.ts";
import ReviewBlamePanel from "./ReviewBlamePanel.svelte";

/** Preview registration only; shipping BlameView remains unchanged. */
export class BlameReviewView extends View {
  #selection?: BlameSelection;
  #controller?: BlameController;
  #component?: ReturnType<typeof mount>;
  constructor(
    leaf: WorkspaceLeaf,
    readonly plugin: RepositoryPlugin,
  ) {
    super(leaf);
  }
  getViewType() {
    return "repository-file-blame-review";
  }
  getDisplayText() {
    return this.#selection
      ? `Blame · ${this.#selection.path}`
      : "File blame review";
  }
  getIcon() {
    return "git-merge-conflict";
  }
  getState(): Record<string, unknown> {
    return { ...this.#selection };
  }
  async setState(state: Record<string, unknown>) {
    this.#selection =
      typeof state.operation === "string" &&
      typeof state.commit === "string" &&
      typeof state.path === "string"
        ? { operation: state.operation, commit: state.commit, path: state.path }
        : undefined;
    if (this.#controller && this.#selection)
      await this.#controller.open(this.#selection);
    await super.setState(state);
  }
  protected async onOpen() {}
  protected async onClose() {}
  onload() {
    const controller = (this.#controller = this.plugin.createBlameController());
    this.#component = mount(ReviewBlamePanel, {
      target: this.containerEl,
      props: {
        controller,
        copyText: (value: string) => this.plugin.copyIdentifier(value),
        onOpen: (commit: string) => {
          const operation = controller.state.selection?.operation;
          if (operation)
            void this.plugin
              .open(operation, commit)
              .catch((error) => this.plugin.report(error));
        },
      },
    });
    if (this.#selection) void controller.open(this.#selection);
  }
  onunload() {
    if (this.#component) void unmount(this.#component);
    this.#component = undefined;
    if (this.#controller)
      void this.plugin
        .release(this.#controller)
        .catch((error) => this.plugin.report(error));
    this.#controller = undefined;
  }
}
