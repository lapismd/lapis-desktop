import { Plugin, type App } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { HistoryController } from "../../lib/repository/history-controller.ts";
import {
  ownedRepository,
  repositoryLeaveMode,
} from "../../lib/repository/services.ts";
import type { RepositoryServices } from "../../lib/repository/history-reader.ts";
import { OperationController } from "../../lib/repository/operation-controller.ts";
import { OperationView } from "./operation-view.ts";
import { RepositoryView } from "./repository-view.ts";

export class RepositoryPlugin extends Plugin {
  #services?: RepositoryServices;
  #controllers = new Set<HistoryController | OperationController>();
  #closing?: Promise<void>;
  constructor(app: App) {
    super(app, {
      id: "repository-history",
      name: "Repository History",
      version: "0.1.0",
      minAppVersion: "0.0.1",
      author: "Lapis Notes",
      description: "Read pinned JJ history and compare revisions in the vault.",
    });
  }
  feedback(title = "Repository history") {
    if (!this.#services || this.#closing)
      throw new Error("Repository history is closed");
    const id = `repository-history:${crypto.randomUUID()}`;
    return {
      report: (error: unknown) =>
        this.app.notifications.notify({
          id,
          title,
          message: error instanceof Error ? error.message : String(error),
          source: "repository-history",
          severity: "error",
          persist: false,
        }),
      recovered: () => {
        getWorkspaceHostBinding(
          this.app.workspace,
        ).controller.notifications.dismiss(id);
        void this.app.notifications
          .clear(id)
          .catch((error) =>
            console.error("Repository notification cleanup failed", error),
          );
      },
    };
  }
  createController(): HistoryController {
    const feedback = this.feedback();
    const controller = new HistoryController(this.#services!.reader, feedback);
    this.#controllers.add(controller);
    return controller;
  }
  createOperationController(): OperationController {
    const feedback = this.feedback("Repository operation log");
    const controller = new OperationController(
      this.#services!.reader,
      feedback,
    );
    this.#controllers.add(controller);
    return controller;
  }
  async release(
    controller: HistoryController | OperationController,
  ): Promise<void> {
    await controller.close();
    this.#controllers.delete(controller);
  }
  async onload(): Promise<void> {
    this.#closing = undefined;
    this.#services = ownedRepository(this.app);
    this.registerView(
      "repository-history",
      (leaf) => new RepositoryView(leaf, this),
      {
        kind: "command",
        command: {
          id: "open-history",
          name: "Open Repository History",
          callback: () => {
            void this.open().catch((error) => this.report(error));
          },
        },
      },
    );
    this.registerView(
      "repository-oplog",
      (leaf) => new OperationView(leaf, this),
      {
        kind: "command",
        command: {
          id: "open-oplog",
          name: "Open Repository Op Log",
          callback: () => {
            void this.openOperations().catch((error) => this.report(error));
          },
        },
      },
    );
    this.addRibbonIcon("list-tree", "Repository Op Log", () => {
      void this.openOperations().catch((error) => this.report(error));
    });
    this.addRibbonIcon("history", "Repository History", () => {
      void this.open().catch((error) => this.report(error));
    });
  }
  async copyIdentifier(value: string): Promise<void> {
    const id = `repository-copy:${value}`;
    try {
      await navigator.clipboard.writeText(value);
      getWorkspaceHostBinding(
        this.app.workspace,
      ).controller.notifications.dismiss(id);
      await this.app.notifications.clear(id);
    } catch (error) {
      this.app.notifications.notify({
        id,
        title: "Copy identifier",
        source: "repository-history",
        severity: "error",
        persist: false,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
  report(error: unknown): void {
    this.app.notifications.notify({
      title: "Repository history",
      source: "repository-history",
      severity: "error",
      persist: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
  async open(operation?: string): Promise<void> {
    const workspace = getWorkspaceHostBinding(this.app.workspace).controller
      .workspace;
    const existing = workspace.getLeavesOfType("repository-history")[0];
    if (existing) {
      if (operation)
        await existing.setViewState({
          type: "repository-history",
          state: { operation },
        });
      workspace.revealLeaf(existing);
      return;
    }
    if (
      !workspace.openLeaf(
        "repository-history",
        operation ? { operation } : {},
        { active: true },
      )
    )
      throw new Error("Repository history could not be opened");
  }
  async openOperations(): Promise<void> {
    const workspace = getWorkspaceHostBinding(this.app.workspace).controller
      .workspace;
    const existing = workspace.getLeavesOfType("repository-oplog")[0];
    if (existing) {
      workspace.revealLeaf(existing);
      return;
    }
    if (!workspace.openLeaf("repository-oplog", {}, { active: true }))
      throw new Error("Repository operation log could not be opened");
  }
  async onunload(): Promise<void> {
    return (this.#closing ??= (async () => {
      await Promise.allSettled(
        [...this.#controllers].map((controller) => controller.close()),
      );
      // Full native release proves closure even after an unknown per-handle outcome.
      await this.#services?.close(repositoryLeaveMode(this.app));
      this.#controllers.clear();
      this.#services = undefined;
    })().catch((error) => {
      this.#closing = undefined;
      throw error;
    }));
  }
}
