import { Plugin, type App } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { HistoryController } from "../../lib/repository/history-controller.ts";
import {
  ownedRepository,
  repositoryLeaveMode,
} from "../../lib/repository/services.ts";
import type { RepositoryServices } from "../../lib/repository/history-reader.ts";
import { RepositoryView } from "./repository-view.ts";

export class RepositoryPlugin extends Plugin {
  #services?: RepositoryServices;
  #controllers = new Set<HistoryController>();
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
  createController(): HistoryController {
    if (!this.#services || this.#closing)
      throw new Error("Repository history is closed");
    const id = `repository-history:${crypto.randomUUID()}`;
    const controller = new HistoryController(this.#services.reader, {
      report: (error) =>
        this.app.notifications.notify({
          id,
          title: "Repository history",
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
    });
    this.#controllers.add(controller);
    return controller;
  }
  async release(controller: HistoryController): Promise<void> {
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
    this.addRibbonIcon("history", "Repository History", () => {
      void this.open().catch((error) => this.report(error));
    });
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
  async open(): Promise<void> {
    const workspace = getWorkspaceHostBinding(this.app.workspace).controller
      .workspace;
    const existing = workspace.getLeavesOfType("repository-history")[0];
    if (existing) {
      workspace.revealLeaf(existing);
      return;
    }
    if (!workspace.openLeaf("repository-history", {}, { active: true }))
      throw new Error("Repository history could not be opened");
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
