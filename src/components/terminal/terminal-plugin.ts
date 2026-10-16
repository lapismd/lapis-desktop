// SPDX-License-Identifier: AGPL-3.0-or-later
// Command and settings integration adapted from lapis-plugin-terminal.
import { Plugin, type App, type WorkspaceLeaf } from "@lapis-notes/api";
import { TerminalView } from "./terminal-view.ts";
import { registerTerminalSettings } from "./register-terminal-settings.ts";
import {
  createTerminalSettingsStore,
  type TerminalPluginSettings,
} from "../../lib/terminal/terminal-settings.ts";
import {
  createOwnedTerminal,
  reportTerminalError,
} from "../../lib/terminal/terminal-binding.ts";
import type { TerminalSessions } from "../../lib/terminal/terminal-sessions.ts";

export class TerminalPlugin extends Plugin {
  sessions!: TerminalSessions;
  #settings = createTerminalSettingsStore();
  #data: Record<string, unknown> = {};
  constructor(app: App) {
    super(app, {
      id: "terminal",
      name: "Terminal",
      version: "0.1.0",
      minAppVersion: "0.0.1",
      author: "Lapis Notes",
      description: "Interactive shell sessions in the workspace bottom panel.",
    });
  }
  getSettings(): TerminalPluginSettings {
    return { ...this.#settings.settings };
  }
  hydrateSettings(value: unknown): void {
    this.#data =
      value && typeof value === "object" && !Array.isArray(value)
        ? { ...value }
        : {};
    this.#settings.hydrate(value);
  }
  async updateSettings(patch: Partial<TerminalPluginSettings>): Promise<void> {
    this.#settings.replace(patch);
    await this.saveData({ ...this.#data, ...this.#settings.settings });
  }
  report(error: unknown): void {
    reportTerminalError(this.app, error);
  }
  async onload(): Promise<void> {
    this.sessions = createOwnedTerminal(this.app);
    let data = await this.loadData();
    // Adopt the former external plugin's data only when no current data exists.
    if (
      data == null &&
      (await this.app.vault.adapter.exists(".lapis/plugins/terminal/data.json"))
    ) {
      data = JSON.parse(
        await this.app.vault.adapter.read(".lapis/plugins/terminal/data.json"),
      );
      await this.saveData(data);
    }
    this.hydrateSettings(data);
    registerTerminalSettings(this);
    this.registerView("terminal", (leaf) => new TerminalView(leaf, this), {
      kind: "command",
      command: {
        id: "open-terminal",
        name: "Open Terminal",
        callback: () => {
          void this.openTerminal().catch((error) => this.report(error));
        },
      },
    });
    this.addCommand({
      id: "new",
      name: "New Terminal",
      callback: () => {
        void this.createTerminal().catch((error) => this.report(error));
      },
    });
    this.addRibbonIcon("square-terminal", "Open Terminal", () => {
      void this.openTerminal().catch((error) => this.report(error));
    });
    this.registerEvent(
      this.app.workspaceTrust.on("changed", ({ trusted }) => {
        if (!trusted)
          void this.sessions
            .dispose("close")
            .catch((error) => this.report(error));
      }),
    );
  }
  async openTerminal(): Promise<WorkspaceLeaf> {
    const existing = this.app.workspace.getLeavesOfType("terminal")[0];
    if (existing) {
      await this.app.workspace.revealLeaf(existing);
      this.app.workspace.setBottomPanelOpen(true);
      return existing;
    }
    return this.createTerminal();
  }
  async createTerminal(): Promise<WorkspaceLeaf> {
    await this.app.fileEditingSessions.settleOperations();
    const leaf = this.app.workspace.getBottomLeaf();
    await leaf.setViewState({ type: "terminal", state: {} });
    await this.app.workspace.revealLeaf(leaf);
    this.app.workspace.setBottomPanelOpen(true);
    if (leaf.view instanceof TerminalView) await leaf.view.start();
    return leaf;
  }
  async onunload(): Promise<void> {
    await this.sessions.dispose();
  }
}
