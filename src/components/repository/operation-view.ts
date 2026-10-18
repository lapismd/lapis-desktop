import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import type { OperationController } from "../../lib/repository/operation-controller.ts";
import type { RepositoryPlugin } from "./repository-plugin.ts";
import RepositoryOperations from "./RepositoryOperations.svelte";
import { followBackup } from "../../lib/repository/backup-follow.ts";

export class OperationView extends View {
  #controller?: OperationController;
  #component?: ReturnType<typeof mount>;
  #operation?: string;
  #unsubscribe?: () => void;
  #live?: () => void;
  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: RepositoryPlugin,
  ) {
    super(leaf);
  }
  getViewType(): string {
    return "repository-oplog";
  }
  getDisplayText(): string {
    return "Repository operation log";
  }
  getIcon(): string {
    return "git-pull-request-arrow";
  }
  getState(): Record<string, unknown> {
    return {
      operation: this.#controller
        ? this.#controller.pinned
          ? this.#controller.state.operation
          : undefined
        : this.#operation,
    };
  }
  async setState(state: Record<string, unknown>): Promise<void> {
    this.#operation =
      typeof state.operation === "string" ? state.operation : undefined;
    if (
      this.#controller &&
      this.#operation &&
      this.#operation !== this.#controller.state.operation
    )
      await this.#controller.selectPin(this.#operation);
    await super.setState(state);
  }
  protected async onOpen(): Promise<void> {}
  protected async onClose(): Promise<void> {}
  onload(): void {
    this.#controller = this.plugin.createOperationController();
    this.#live = followBackup(this.plugin.backup?.controller, this.#controller);
    this.#unsubscribe = this.#controller.subscribe((state) => {
      if (
        state.operation !== undefined &&
        state.operation !== this.#operation
      ) {
        this.#operation = state.operation;
        this.app.workspace.requestSaveLayout({
          source: "api",
          operation: "repository-oplog",
        });
      }
    });
    this.#component = mount(RepositoryOperations, {
      target: this.containerEl,
      props: {
        controller: this.#controller,
        initialOperation: this.#operation,
        copyText: (value: string) => this.plugin.copyIdentifier(value),
        onHistory: (operation: string) =>
          void this.plugin
            .open(operation)
            .catch((error) => this.plugin.report(error)),
      },
    });
  }
  onunload(): void {
    this.#live?.();
    this.#unsubscribe?.();
    if (this.#component) void unmount(this.#component);
    this.#component = undefined;
    if (this.#controller)
      void this.plugin
        .release(this.#controller)
        .catch((error) => this.plugin.report(error));
  }
}
