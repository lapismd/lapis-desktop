import { View } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import { createChatApp } from "../app-fixture.ts";
import { registerCatalogCleanup } from "../../lifecycle.ts";
import NativeConversationBrowser from "../../../../src/components/ai/sessions/NativeConversationBrowser.svelte";
import { CanonicalConversationCatalog } from "../../../../src/lib/ai/conversations/canonical-catalog.ts";
import { NativeConversationReader } from "../../../../src/lib/ai/conversations/native-reader.ts";
import { nativeReaderPort, type NativeReaderScenario } from "./port.ts";
import { owner } from "./facts.ts";
import { agentReviewProfiles } from "../transcript/agent-profiles.ts";

export function createNativeReaderFixture(scenario: NativeReaderScenario) {
  const base = createChatApp(() => {}),
    native = nativeReaderPort(scenario);
  const catalog = new CanonicalConversationCatalog(native.port, native.opened);
  const reader = new NativeConversationReader(
    catalog,
    (error) =>
      base.app.notifications.notify({
        id: "ai-native-reader",
        source: "ai",
        severity: "error",
        title: "Native conversation history",
        message: error instanceof Error ? error.message : String(error),
        persist: false,
      }),
    () => agentReviewProfiles,
  );
  const pending = new Set<Promise<unknown>>();
  const track = (work: Promise<unknown>) => {
    pending.add(work);
    void work.then(
      () => pending.delete(work),
      () => pending.delete(work),
    );
  };
  let closing = false,
    shutdown: Promise<void> | undefined;
  const type = "ai-native-conversation-review";
  class NativeReaderView extends View {
    panel?: ReturnType<typeof mount>;
    getViewType() {
      return type;
    }
    getDisplayText() {
      return "AI";
    }
    getIcon() {
      return "messages-square";
    }
    protected async onOpen() {}
    protected async onClose() {}
    onload() {
      this.panel = mount(NativeConversationBrowser, {
        target: this.containerEl,
        props: { app: base.app, reader },
      });
    }
    onunload() {
      if (this.panel) {
        track(unmount(this.panel));
        this.panel = undefined;
      }
    }
  }
  const ready = (async () => {
    await base.ready;
    if (closing) return;
    base.app.workspace.registerView(type, (leaf) => new NativeReaderView(leaf));
    await base.app.workspace.changeLayout({
      main: {
        id: "main",
        type: "split",
        direction: "horizontal",
        sizes: [100],
        children: [
          {
            id: "ai-tabs",
            type: "tabs",
            currentTab: 0,
            children: [
              {
                id: "ai-native-review",
                type: "leaf",
                state: { type, state: {}, title: "AI", icon: "sparkles" },
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
      active: "ai-native-review",
    });
    const refreshing = reader.refresh();
    if (scenario === "loading") {
      track(refreshing);
      return;
    }
    try {
      await refreshing;
      if (closing || scenario === "empty") return;
      await reader.select(owner.threadId);
      if (
        scenario === "captured" ||
        scenario === "read-failure" ||
        scenario === "managed"
      ) {
        const cursor = reader.state.conversation?.recordSources[0]?.cursor;
        if (cursor) await reader.selectSource(cursor);
      }
    } catch {
      /* The production reader has already published the single App notice. */
    }
  })();
  const close = () =>
    (shutdown ??= (async () => {
      closing = true;
      native.finish();
      await ready;
      await base.close();
      while (pending.size) await Promise.allSettled([...pending]);
      await reader.close();
      await catalog.close();
    })());
  const unregister = registerCatalogCleanup(close);
  return {
    app: base.app,
    reader,
    ready,
    close: async () => {
      unregister();
      await close();
    },
  };
}
