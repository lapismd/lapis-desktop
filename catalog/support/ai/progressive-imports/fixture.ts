import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import { createChatApp } from "../app-fixture.ts";
import ProgressiveImportPanel from "./ProgressiveImportPanel.svelte";
import type { Scenario } from "./browser.svelte.ts";

export function progressiveImportFixture(
  scenario: Scenario,
  automatic: boolean,
) {
  const base = createChatApp(() => {});
  const panels = new Set<ReturnType<typeof mount>>();
  const pending = new Set<Promise<void>>();
  class ReviewView extends View {
    panel?: ReturnType<typeof mount>;
    constructor(leaf: WorkspaceLeaf) {
      super(leaf);
    }
    getViewType() {
      return "progressive-import-review";
    }
    getDisplayText() {
      return "Import AI sessions";
    }
    getIcon() {
      return "download";
    }
    protected async onOpen() {}
    protected async onClose() {}
    override onload() {
      this.panel = mount(ProgressiveImportPanel, {
        target: this.containerEl,
        props: { app: base.app, scenario, automatic },
      });
      panels.add(this.panel);
    }
    override onunload() {
      if (this.panel && panels.delete(this.panel)) {
        const job = unmount(this.panel);
        pending.add(job);
        void job.finally(() => pending.delete(job));
      }
    }
  }
  const ready = base.ready.then(async () => {
    base.app.workspace.registerView(
      "progressive-import-review",
      (leaf) => new ReviewView(leaf),
    );
    await base.app.workspace.changeLayout({
      main: {
        id: "main",
        type: "split",
        direction: "horizontal",
        sizes: [100],
        children: [
          {
            id: "import-tabs",
            type: "tabs",
            currentTab: 0,
            children: [
              {
                id: "import-review",
                type: "leaf",
                state: {
                  type: "progressive-import-review",
                  state: {},
                  title: "Import AI sessions",
                  icon: "download",
                },
              },
            ],
          },
        ],
      },
      left: {
        id: "left",
        type: "split",
        direction: "vertical",
        children: [],
        sizes: [],
        width: "0px",
      },
      right: {
        id: "right",
        type: "split",
        direction: "vertical",
        children: [],
        sizes: [],
        width: "0px",
      },
      active: "import-review",
    });
  });
  let closing: Promise<void> | undefined;
  return {
    app: base.app,
    ready,
    close: () =>
      (closing ??= (async () => {
        await ready;
        for (const panel of panels) {
          panels.delete(panel);
          await unmount(panel);
        }
        await Promise.allSettled(pending);
        base.app.workspace.unregisterView("progressive-import-review");
        await base.close();
      })()),
  };
}
