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
import { BackgroundWork } from "../../lib/desktop/background-work.ts";
import { FileHistoryController } from "../../lib/repository/file-history-controller.ts";
import { registerFileHistoryView } from "./file-history-view.ts";
import { BlameController } from "../../lib/repository/blame-controller.ts";
import { BlameView } from "./blame/blame-view.ts";
import { registerBlameEditorActions } from "./blame/editor-actions.ts";
import { RepositoryStatus } from "./repository-status.ts";
import { RepositoryBackup } from "./repository-backup.ts";
import { registerBackupSettings } from "./backup/forge-view.ts";
type RepositoryController =
  | HistoryController
  | OperationController
  | FileHistoryController
  | BlameController;

export class RepositoryPlugin extends Plugin {
  backup?: RepositoryBackup;
  get restoreService() {
    return this.#services?.restore;
  }
  #services?: RepositoryServices;
  #status?: RepositoryStatus;
  #closeForges?: () => Promise<void>;
  #controllers = new Set<RepositoryController>();
  #activities = new Map<RepositoryController, () => void>();
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
  feedback(title = "Repository history", identity?: string) {
    if (!this.#services || this.#closing)
      throw new Error("Repository history is closed");
    const id = identity ?? `repository-history:${crypto.randomUUID()}`;
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
    this.#activities.set(
      controller,
      new BackgroundWork(this.app.notifications, "repository-history").follow(
        "Loading JJ Log",
        controller,
      ),
    );
    return controller;
  }
  createOperationController(): OperationController {
    const feedback = this.feedback("Repository operation log");
    const controller = new OperationController(
      this.#services!.reader,
      feedback,
    );
    this.#controllers.add(controller);
    this.#activities.set(
      controller,
      new BackgroundWork(this.app.notifications, "repository-history").follow(
        "Loading Op Log",
        controller,
      ),
    );
    return controller;
  }
  async release(controller: RepositoryController): Promise<void> {
    await controller.close();
    this.#activities.get(controller)?.();
    this.#activities.delete(controller);
    this.#controllers.delete(controller);
  }
  createFileHistoryController(): FileHistoryController {
    const controller = new FileHistoryController(
      this.#services!.reader,
      this.feedback("File history"),
    );
    this.#controllers.add(controller);
    this.#activities.set(
      controller,
      new BackgroundWork(this.app.notifications, "repository-history").follow(
        "Loading file history",
        controller,
      ),
    );
    return controller;
  }
  async onload(): Promise<void> {
    this.#closing = undefined;
    this.#services = ownedRepository(this.app);
    this.#closeForges = registerBackupSettings(this, this.#services);
    if (this.#services.backup) {
      this.backup = new RepositoryBackup(this, this.#services.backup);
      await this.backup.start();
    }
    registerFileHistoryView(this);
    registerBlameEditorActions(this);
    this.registerView(
      "repository-file-blame",
      (leaf) => new BlameView(leaf, this),
    );
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
    this.addRibbonIcon("git-pull-request-arrow", "Repository Op Log", () => {
      void this.openOperations().catch((error) => this.report(error));
    });
    this.addRibbonIcon("git-branch", "Repository History", () => {
      void this.open().catch((error) => this.report(error));
    });
    this.#status = new RepositoryStatus(this, this.#services);
    await this.#status.start();
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
  async open(operation?: string, revision?: string): Promise<void> {
    const workspace = getWorkspaceHostBinding(this.app.workspace).controller
      .workspace;
    const existing = workspace.getLeavesOfType("repository-history")[0];
    if (existing) {
      if (operation)
        await existing.setViewState({
          type: "repository-history",
          state: { operation, revision },
        });
      workspace.revealLeaf(existing);
      return;
    }
    if (
      !workspace.openLeaf(
        "repository-history",
        operation ? { operation, revision } : {},
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
  createBlameController(): BlameController {
    const controller = new BlameController(
      this.#services!.reader,
      this.feedback("File blame"),
    );
    this.#controllers.add(controller);
    this.#activities.set(
      controller,
      new BackgroundWork(this.app.notifications, "repository-history").follow(
        "Loading file blame",
        {
          subscribe: (listener) =>
            controller.subscribe((state) =>
              listener({
                busy: state.busy,
                phase: state.status === "failed" ? "unavailable" : state.status,
              }),
            ),
        },
      ),
    );
    return controller;
  }
  async openBlame(
    operation: string,
    commit: string,
    path: string,
  ): Promise<void> {
    const workspace = getWorkspaceHostBinding(this.app.workspace).controller
      .workspace;
    const state = { operation, commit, path };
    const existing = workspace.getLeavesOfType("repository-file-blame")[0];
    if (existing) {
      await existing.setViewState({ type: "repository-file-blame", state });
      workspace.revealLeaf(existing);
    } else if (
      !workspace.openLeaf("repository-file-blame", state, { active: true })
    )
      throw new Error("File blame could not be opened");
  }
  async onunload(): Promise<void> {
    return (this.#closing ??= (async () => {
      await this.#closeForges?.();
      this.#closeForges = undefined;
      await this.#status?.close();
      await this.backup?.close();
      this.backup = undefined;
      this.#status = undefined;
      await Promise.allSettled(
        [...this.#controllers].map((controller) => controller.close()),
      );
      // Full native release proves closure even after an unknown per-handle outcome.
      await this.#services?.close(repositoryLeaveMode(this.app));
      for (const dispose of this.#activities.values()) dispose();
      this.#activities.clear();
      this.#controllers.clear();
      this.#services = undefined;
    })().catch((error) => {
      this.#closing = undefined;
      throw error;
    }));
  }
}
