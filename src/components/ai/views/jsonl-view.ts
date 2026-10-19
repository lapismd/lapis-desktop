// SPDX-License-Identifier: Apache-2.0
// Retained Lapis file view; see src/lib/ai/NOTICE.md.
import { TextFileView, TFile, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import { writable } from "svelte/store";
import type { AiApplication } from "../../../lib/ai/plugin/application.ts";
import { AI_JSONL_VIEW } from "../../../lib/ai/plugin/view-types.ts";
import AiJsonlPanel from "../jsonl/AiJsonlPanel.svelte";
export class AiJsonlView extends TextFileView {
  #loading = writable(false);
  #pending = 0;
  #component?: ReturnType<typeof mount>;
  #unregister?: () => void;
  #subscriptions: Array<() => void> = [];
  constructor(
    leaf: WorkspaceLeaf,
    private readonly host: AiApplication,
  ) {
    super(leaf);
  }
  getViewType() {
    return AI_JSONL_VIEW;
  }
  getViewData() {
    return this.data;
  }
  setViewData(data: string, _clear = false): void {
    this.data = data;
  }
  clear(): void {
    this.setViewData("", true);
  }
  onload(): void {
    if (!this.host.active) return;
    const view = this;
    this.contentEl.replaceChildren();
    this.contentEl.classList.add("ai-jsonl-file-content");
    this.containerEl.classList.add("text-view", "ai-jsonl-file-view");
    this.actions = [];
    this.#unregister = this.host.operations.ownView(this.closePanel);
    this.#component = mount(AiJsonlPanel, {
      target: this.contentEl,
      props: {
        app: this.app,
        loading: this.#loading,
        get data() {
          return view.data;
        },
        get filePath() {
          return view.file?.path ?? "";
        },
      },
    });
    const vault = this.app.vault;
    const modify = vault.on("modify", (file) =>
      this.refreshFile(file, file.path),
    );
    const rename = vault.on("rename", (file, oldPath) => {
      this.refreshFile(file, oldPath);
    });
    this.#subscriptions.push(
      () => vault.offref(modify),
      () => vault.offref(rename),
    );
  }
  private refreshFile(file: unknown, previousPath: string): void {
    if (
      !(file instanceof TFile) ||
      !this.host.active ||
      !this.#component ||
      this.file?.path !== previousPath
    )
      return;
    const refresh = this.app.fileEditingSessions.afterMutations(async () => {
      // Rename/write events can arrive before their captured editor guard releases.
      if (
        !this.host.active ||
        !this.#component ||
        this.file?.path !== previousPath
      )
        return;
      if (previousPath !== file.path) await this.onRename(file);
      await this.onLoadFile(file);
    });
    void this.host.operations
      .track(refresh)
      .catch((error) => this.host.report(error));
  }
  onLoadFile(file: TFile): Promise<void> {
    if (!this.host.active) return Promise.reject(new Error("AI is disabled"));
    this.#pending++;
    this.#loading.set(true);
    const loading = super.onLoadFile(file).finally(() => {
      this.#pending--;
      this.#loading.set(this.#pending > 0);
    });
    return this.host.operations.track(loading);
  }
  closePanel = (): Promise<void> => {
    this.editor.cancelDocumentLoad();
    this.#unregister?.();
    this.#unregister = undefined;
    for (const unsubscribe of this.#subscriptions.splice(0)) unsubscribe();
    const component = this.#component;
    this.#component = undefined;
    return component
      ? this.host.operations.track(unmount(component))
      : Promise.resolve();
  };
  onunload(): Promise<void> {
    return this.closePanel();
  }
  canAcceptExtension(extension: string): boolean {
    return extension.trim().replace(/^\./u, "").toLowerCase() === "jsonl";
  }
  getDisplayText() {
    return this.file?.name ?? "JSONL preview";
  }
  getIcon() {
    return "messages-square";
  }
  // Workspace save/leave must never turn a read-only preview into a writer.
  async save(_clear?: boolean): Promise<void> {}
  protected async onOpen(): Promise<void> {}
  protected async onClose(): Promise<void> {}
}
