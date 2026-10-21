// SPDX-License-Identifier: Apache-2.0
import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import AiChatPanel from "../../../../src/components/ai/chat/AiChatPanel.svelte";
import { FakeAgentRuntime } from "../../../../tests/ai/support/fake-runtime.ts";
import type { ConversationSnapshot } from "../../../../src/lib/ai/conversations/types.ts";
import ImportSessionReview from "../../../../src/components/ai/imports/AiImportPanel.svelte";
import AiImportPanel from "../../../../src/components/ai/imports/AiImportPanel.svelte";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { VaultTranscriptStore } from "../../../../src/lib/ai/conversations/vault-transcript-store.ts";
import { sampleCapture } from "./sample-capture.ts";
import { createImportSources, type ImportScenario } from "./sources.ts";
import { createChatApp } from "../app-fixture.ts";
import { registerCatalogCleanup } from "../../lifecycle.ts";

const type = "ai-import-review";
export function createImportFixture(
  scenario: ImportScenario,
  sessionLayout = false,
) {
  const base = createChatApp(() => {}),
    store = new VaultTranscriptStore(base.app.vault),
    repository = new ConversationRepository(store);
  const pending = new Set<Promise<unknown>>(),
    panels = new Set<ReturnType<typeof mount>>();
  let recorded: ConversationSnapshot | undefined;
  const runtime = new FakeAgentRuntime();
  let saveFail = scenario === "save-failure";
  if (saveFail) {
    const write = store.appendTranscriptEntries.bind(store);
    store.appendTranscriptEntries = async (...args) => {
      await write(...args);
      if (saveFail) {
        saveFail = false;
        throw new Error(
          "The local write acknowledgement was interrupted. Retry the same snapshot.",
        );
      }
    };
  }
  const sources = createImportSources(scenario);
  function track(task: Promise<unknown>) {
    pending.add(task);
    void task.finally(() => pending.delete(task)).catch(console.error);
  }
  class ImportView extends View {
    panel?: ReturnType<typeof mount>;
    constructor(leaf: WorkspaceLeaf) {
      super(leaf);
    }
    getViewType() {
      return type;
    }
    getDisplayText() {
      return "Import AI sessions";
    }
    getIcon() {
      return "download";
    }
    protected async onOpen() {}
    protected async onClose() {}
    onload() {
      this.panel = recorded
        ? mount(AiChatPanel, {
            target: this.containerEl,
            props: {
              app: base.app,
              runtime,
              repository,
              initialLocation: recorded.location,
              recordedImport: recorded,
              selectRuntime: async () => {
                throw new Error("Imported snapshot must not select runtime");
              },
              loadModels: async () => {
                throw new Error("Imported snapshot must not discover models");
              },
              onControllerDispose: track,
              onOperation: track,
            },
          })
        : mount(sessionLayout ? ImportSessionReview : AiImportPanel, {
            target: this.containerEl,
            props: {
              app: base.app,
              repository,
              scopeDir: "Notes",
              ...(sessionLayout && ["ready", "streaming"].includes(scenario)
                ? { initialSelector: "opaque-codex-1" }
                : {}),
              sources: scenario === "unavailable" ? undefined : sources,
              onDispose: track,
            },
          });
      panels.add(this.panel);
    }
    onunload() {
      if (this.panel) {
        panels.delete(this.panel);
        track(unmount(this.panel));
        this.panel = undefined;
      }
    }
  }
  const ready = (async () => {
    await base.ready;
    if (scenario === "saved")
      recorded = (await repository.imports.save(sampleCapture, "Notes"))
        .snapshot;
    base.app.workspace.registerView(type, (leaf) => new ImportView(leaf));
    await base.app.workspace.changeLayout({
      main: {
        id: "main",
        type: "split",
        direction: "horizontal",
        sizes: [100],
        children: [
          {
            id: "ai-import-tabs",
            type: "tabs",
            currentTab: 0,
            children: [
              {
                id: "ai-import-preview",
                type: "leaf",
                state: {
                  type,
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
      active: "ai-import-preview",
    });
  })();
  let closing: Promise<void> | undefined;
  const close = () =>
    (closing ??= (async () => {
      await ready;
      for (const panel of panels) {
        panels.delete(panel);
        await unmount(panel);
      }
      while (pending.size) await Promise.allSettled([...pending]);
      base.app.workspace.unregisterView(type);
      await base.close();
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
