import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import TerminalPanel from "./TerminalPanel.svelte";
import { TerminalTab } from "../../lib/terminal/terminal-tab.ts";
import type { TerminalPlugin } from "./terminal-plugin.ts";
import { reportTerminalError } from "../../lib/terminal/terminal-binding.ts";

export class TerminalView extends View {
  #tab?: TerminalTab;
  #id?: string;
  #component?: ReturnType<typeof mount>;
  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: TerminalPlugin,
  ) {
    super(leaf);
  }
  getViewType(): string {
    return "terminal";
  }
  getDisplayText(): string {
    return "Terminal";
  }
  getIcon(): string {
    return "square-terminal";
  }
  getState(): Record<string, unknown> {
    return { sessionId: this.#tab ? this.#tab.id : this.#id };
  }
  async setState(state: Record<string, unknown>): Promise<void> {
    this.#id =
      typeof state.sessionId === "string" ? state.sessionId : undefined;
    await super.setState(state);
  }
  protected async onOpen(): Promise<void> {}
  protected async onClose(): Promise<void> {}
  onload(): void {
    this.#tab = new TerminalTab(
      this.plugin.sessions,
      this.#id,
      () =>
        this.app.workspace.requestSaveLayout({
          source: "api",
          operation: "terminal-session",
        }),
      (error) => reportTerminalError(this.app, error),
    );
    this.#component = mount(TerminalPanel, {
      target: this.containerEl,
      props: { tab: this.#tab },
    });
    void this.#tab.restore();
  }
  async start(): Promise<void> {
    await this.#tab?.restore();
    await this.#tab?.start();
  }
  onunload(): void {
    if (this.#component) void unmount(this.#component);
    this.#component = undefined;
    void this.#tab
      ?.close()
      .catch((error) => reportTerminalError(this.app, error));
  }
}
