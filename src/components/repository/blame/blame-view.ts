import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import type { RepositoryPlugin } from "../repository-plugin.ts";
import type { BlameController } from "../../../lib/repository/blame-controller.ts";
import type { BlameSelection } from "../../../lib/repository/blame-model.ts";
import RepositoryBlamePanel from "./RepositoryBlamePanel.svelte";

export class BlameView extends View {
  #selection?: BlameSelection;
  #controller?: BlameController;
  #component?: ReturnType<typeof mount>;
  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: RepositoryPlugin,
  ) {
    super(leaf);
  }
  getViewType() {
    return "repository-file-blame";
  }
  getDisplayText() {
    return this.#selection ? `Blame · ${this.#selection.path}` : "File blame";
  }
  getIcon() {
    return "git-commit-vertical";
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
    this.#component = mount(RepositoryBlamePanel, {
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
