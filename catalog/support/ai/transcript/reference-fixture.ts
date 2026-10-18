import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import { createChatApp } from "../app-fixture.ts";
import DesignCoreReference from "./DesignCoreReference.svelte";
import { registerCatalogCleanup } from "../../lifecycle.ts";

export function createReferenceFixture(initialView: "document" | "classic") {
  const base = createChatApp(() => {});
  const pending = new Set<Promise<unknown>>();
  const own = (operation: Promise<unknown>) => {
    pending.add(operation);
    void operation
      .finally(() => pending.delete(operation))
      .catch(console.error);
  };
  const type = "design-core-transcript-reference";
  class ReferenceView extends View {
    #panel?: ReturnType<typeof mount>;
    constructor(leaf: WorkspaceLeaf) {
      super(leaf);
    }
    getViewType() {
      return type;
    }
    getDisplayText() {
      return "Design Core reference";
    }
    getIcon() {
      return "messages-square";
    }
    protected async onOpen() {}
    protected async onClose() {}
    onload() {
      this.#panel = mount(DesignCoreReference, {
        target: this.containerEl,
        props: { initialView, fill: true },
      });
    }
    onunload() {
      if (this.#panel) {
        own(unmount(this.#panel));
        this.#panel = undefined;
      }
    }
  }
  const ready = (async () => {
    await base.ready;
    base.app.workspace.registerView(type, (leaf) => new ReferenceView(leaf));
    await base.app.workspace.changeLayout({
      main: {
        id: "main",
        type: "split",
        direction: "horizontal",
        sizes: [100],
        children: [
          {
            id: "reference-tabs",
            type: "tabs",
            currentTab: 0,
            children: [
              {
                id: "reference",
                type: "leaf",
                state: {
                  type,
                  state: {},
                  title: "Design Core reference",
                  icon: "messages-square",
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
        sizes: [],
        width: "0px",
        children: [],
      },
      right: {
        id: "right",
        type: "split",
        direction: "vertical",
        sizes: [],
        width: "0px",
        children: [],
      },
      bottom: {
        id: "bottom",
        type: "tabs",
        currentTab: 0,
        children: [],
        height: "0px",
      },
      floating: [],
      active: "reference",
    });
  })();
  let closing: Promise<void> | undefined;
  const close = () =>
    (closing ??= (async () => {
      await ready.catch(() => {});
      await base.close();
      await Promise.allSettled([...pending]);
    })());
  const unregister = registerCatalogCleanup(close);
  return {
    app: base.app,
    ready,
    close: async () => {
      unregister();
      await close();
    },
  };
}
