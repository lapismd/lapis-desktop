import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import type { HistoryController } from "../../lib/repository/history-controller.ts";
import type { RepositoryPlugin } from "./repository-plugin.ts";
import RepositoryPanel from "./RepositoryPanel.svelte";
import { openHistoryRevision } from "../../lib/repository/open-history-revision.ts";
import { RestoreController } from "../../lib/repository/restore.ts";
import { createRestoreController } from "./restore-controller.ts";
import { BackgroundWork } from "../../lib/desktop/background-work.ts";
import { followBackup } from "../../lib/repository/backup-follow.ts";

export class RepositoryView extends View {
  #controller?: HistoryController;
  #component?: ReturnType<typeof mount>;
  #operation?: string;
  #revision?: string;
  #unsubscribe?: () => void;
  #initialLoad?: Promise<void>;
  #stateRequest = 0;
  #restore?: RestoreController;
  #restoreActivity?: () => void;
  #live?: () => void;
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
    return "git-branch";
  }
  getState(): Record<string, unknown> {
    return this.#controller
      ? {
          operation: this.#controller.pinned
            ? this.#controller.state.operation
            : undefined,
          revision: this.#controller.state.revision?.id,
        }
      : { operation: this.#operation, revision: this.#revision };
  }
  async setState(state: Record<string, unknown>): Promise<void> {
    const request = ++this.#stateRequest;
    const operation = (this.#operation =
      typeof state.operation === "string" ? state.operation : undefined);
    const revision = (this.#revision =
      typeof state.revision === "string" ? state.revision : undefined);
    const controller = this.#controller;
    if (controller) {
      await this.#initialLoad;
      if (request !== this.#stateRequest) return;
      if (operation && operation !== controller.state.operation)
        await controller.selectOperation(operation);
      if (request !== this.#stateRequest) return;
      if (revision) await openHistoryRevision(controller, revision);
    }
    await super.setState(state);
  }
  protected async onOpen(): Promise<void> {}
  protected async onClose(): Promise<void> {}
  onload(): void {
    this.#controller = this.plugin.createController();
    if (this.plugin.restoreService) {
      this.#restore = createRestoreController(this.plugin);
      this.#restoreActivity = new BackgroundWork(
        this.app.notifications,
        this.plugin.id,
      ).follow("Restoring file history", {
        subscribe: (listener) =>
          this.#restore!.subscribe((state) =>
            listener({
              busy: state.busy,
              phase: state.open ? "restoring" : "ready",
            }),
          ),
      });
    }
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
    this.#initialLoad = this.#controller.refresh(this.#operation);
    void this.#initialLoad.then(() => {
      if (this.#controller)
        this.#live = followBackup(
          this.plugin.backup?.controller,
          this.#controller,
        );
    });
    this.#component = mount(RepositoryPanel, {
      target: this.containerEl,
      props: {
        controller: this.#controller,
        restore: this.#restore,
        initialOperation: this.#operation,
        initialRevision: this.#revision,
        initialLoad: this.#initialLoad,
        copyText: (value: string) => this.plugin.copyIdentifier(value),
      },
    });
  }
  onunload(): void {
    this.#live?.();
    this.#restore?.close();
    this.#restoreActivity?.();
    this.#stateRequest++;
    this.#unsubscribe?.();
    if (this.#component) void unmount(this.#component);
    this.#component = undefined;
    if (this.#controller)
      void this.plugin
        .release(this.#controller)
        .catch((error) => this.plugin.report(error));
    this.#controller = undefined;
    this.#initialLoad = undefined;
  }
}
