// SPDX-License-Identifier: Apache-2.0
import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { unmount, type mount } from "svelte";
import type { AiApplication } from "../../../lib/ai/plugin/application.ts";
/** Serializes imperative panel replacement and lets the plugin await teardown. */
export abstract class OwnedAiPanelView extends View {
  #component?: ReturnType<typeof mount>;
  #generation = 0;
  #active = false;
  #tail: Promise<void> = Promise.resolve();
  #unregister?: () => void;
  constructor(
    leaf: WorkspaceLeaf,
    protected readonly host: AiApplication,
  ) {
    super(leaf);
  }
  protected abstract mountPanel(): ReturnType<typeof mount>;
  protected get hasPanel(): boolean {
    return Boolean(this.#component);
  }
  protected async onOpen(): Promise<void> {}
  protected async onClose(): Promise<void> {}
  onload(): void {
    this.#active = true;
    this.#unregister?.();
    this.#unregister = this.host.operations.ownView(this.closePanel);
    void this.refreshPanel().catch((error) => this.host.report(error));
  }
  protected refreshPanel(): Promise<void> {
    const generation = ++this.#generation;
    const next = this.#tail.then(async () => {
      const previous = this.#component;
      this.#component = undefined;
      if (previous) await unmount(previous);
      if (!this.#active || generation !== this.#generation || !this.host.active)
        return;
      this.containerEl.replaceChildren();
      this.#component = this.mountPanel();
    });
    this.#tail = next.catch(() => {});
    return this.host.operations.track(next);
  }
  closePanel = (): Promise<void> => {
    this.#active = false;
    this.#unregister?.();
    this.#unregister = undefined;
    return this.refreshPanel();
  };
  onunload(): void {
    void this.closePanel().catch((error) => this.host.report(error));
  }
}
