import {
  historySource,
  type HistorySource,
} from "../../../lib/repository/history-source.ts";
import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import type { RepositoryPlugin } from "../repository-plugin.ts";
import type { BlameController } from "@lapismd/repository-ui/history";
import type { BlameSelection } from "../../../lib/repository/blame-model.ts";
import { RepositoryBlamePanel } from "@lapismd/repository-ui/jj";
import {
  readBlameWrap,
  saveBlameWrap,
} from "../../../lib/repository/blame-preferences.ts";

export class BlameView extends View {
  #source: HistorySource = "backup";
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
    return "git-merge-conflict";
  }
  getState(): Record<string, unknown> {
    return { ...this.#selection, source: this.#source };
  }
  async setState(state: Record<string, unknown>) {
    const source = historySource(state);
    if (this.#controller && source !== this.#source)
      throw new Error("Open a separate tab to change history source");
    this.#source = source;
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
    const controller = (this.#controller = this.plugin.createBlameController(
      this.#source,
    ));
    this.#component = mount(RepositoryBlamePanel, {
      target: this.containerEl,
      props: {
        controller,
        wrap: readBlameWrap(),
        onWrapChange: saveBlameWrap,
        copyText: (value: string) => this.plugin.copyIdentifier(value),
        onOpen: (commit: string) => {
          const operation = controller.state.selection?.operation;
          if (operation)
            void this.plugin
              .open(operation, commit, this.#source)
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
