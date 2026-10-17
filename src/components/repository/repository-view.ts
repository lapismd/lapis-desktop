import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import type { HistoryController } from "../../lib/repository/history-controller.ts";
import type { RepositoryPlugin } from "./repository-plugin.ts";
import RepositoryPanel from "./RepositoryPanel.svelte";

export class RepositoryView extends View {
  #controller?: HistoryController;
  #component?: ReturnType<typeof mount>;
  #operation?: string;
  #unsubscribe?: () => void;
  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: RepositoryPlugin,
  ) {
    super(leaf);
  }
  getViewType(): string {
    return "repository-history";
  }
  getDisplayText(): string {
    return "Repository history";
  }
  getIcon(): string {
    return "history";
  }
  getState(): Record<string, unknown> {
    return { operation: this.#controller?.state.operation ?? this.#operation };
  }
  async setState(state: Record<string, unknown>): Promise<void> {
    this.#operation =
      typeof state.operation === "string" ? state.operation : undefined;
    await super.setState(state);
  }
  protected async onOpen(): Promise<void> {}
  protected async onClose(): Promise<void> {}
  onload(): void {
    this.#controller = this.plugin.createController();
    this.#unsubscribe = this.#controller.subscribe((state) => {
      if (
        state.operation !== undefined &&
        state.operation !== this.#operation
      ) {
        this.#operation = state.operation;
        this.app.workspace.requestSaveLayout({
          source: "api",
          operation: "repository-history",
        });
      }
    });
    this.#component = mount(RepositoryPanel, {
      target: this.containerEl,
      props: {
        controller: this.#controller,
        initialOperation: this.#operation,
      },
    });
  }
  onunload(): void {
    this.#unsubscribe?.();
    if (this.#component) void unmount(this.#component);
    this.#component = undefined;
    if (this.#controller)
      void this.plugin
        .release(this.#controller)
        .catch((error) => this.plugin.report(error));
  }
}
