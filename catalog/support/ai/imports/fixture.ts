// SPDX-License-Identifier: Apache-2.0
import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import AiChatPanel from "../../../../src/components/ai/chat/AiChatPanel.svelte";
import { FakeAgentRuntime } from "../../../../tests/ai/support/fake-runtime.ts";
import type { ConversationSnapshot } from "../../../../src/lib/ai/conversations/types.ts";
import AiImportPanel from "../../../../src/components/ai/imports/AiImportPanel.svelte";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { VaultTranscriptStore } from "../../../../src/lib/ai/conversations/vault-transcript-store.ts";
import type { CapturedSession } from "../../../../src/lib/ai/conversations/import-types.ts";
import type { AiImportSources } from "../../../../src/lib/ai/imports/source-port.ts";
import { createChatApp } from "../app-fixture.ts";
import { registerCatalogCleanup } from "../../lifecycle.ts";

export type ImportScenario =
  | "ready"
  | "loading"
  | "empty"
  | "unavailable"
  | "failure"
  | "save-failure"
  | "saved";
export const sampleCapture: CapturedSession = {
  version: 1,
  source: {
    kind: "codex",
    profile: "codex-cli-0.156.1",
    sessionKey: "a".repeat(64),
    snapshotKey: "b".repeat(64),
  },
  createdAt: "2026-10-19T09:00:00.000Z",
  entries: [
    {
      id: "record-1",
      createdAt: "2026-10-19T09:00:00.000Z",
      type: "message",
      role: "user",
      text: "Review the weekly note structure",
    },
    {
      id: "record-2",
      createdAt: "2026-10-19T09:00:02.000Z",
      type: "tool",
      name: "read_file",
      state: "unknown",
      input: '{"path":"<workspace>/Notes/weekly.md"}',
      output: "# Weekly review\n\nCapture decisions and follow-ups.",
    },
    {
      id: "record-3",
      createdAt: "2026-10-19T09:00:08.000Z",
      type: "message",
      role: "assistant",
      text: "## A focused weekly review\n\nKeep decisions close to the notes they affect.\n\n| Section | Purpose |\n| --- | --- |\n| Decisions | Record the outcome and its source |\n| Follow-ups | Link the next action |\n\n```markdown\n# Weekly review\n\n- [ ] Link unresolved decisions\n```\n\nThis is captured history from the selected Codex session.",
    },
  ],
};
const type = "ai-import-review";
export function createImportFixture(scenario: ImportScenario) {
  const base = createChatApp(() => {}),
    store = new VaultTranscriptStore(base.app.vault),
    repository = new ConversationRepository(store);
  const pending = new Set<Promise<unknown>>(),
    panels = new Set<ReturnType<typeof mount>>();
  let recorded: ConversationSnapshot | undefined;
  const runtime = new FakeAgentRuntime();
  let fail = scenario === "failure",
    saveFail = scenario === "save-failure";
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
  const sources: AiImportSources = {
    list: async (signal) => {
      if (scenario === "loading")
        return new Promise((resolve) =>
          signal.addEventListener("abort", () => resolve([]), { once: true }),
        );
      return scenario === "empty"
        ? []
        : [
            {
              selector: "opaque-codex-1",
              title: "Weekly review",
              profile: "Codex CLI",
              updatedAt: "2026-10-19T09:00:08.000Z",
            },
            {
              selector: "opaque-codex-2",
              title: "Research note links",
              profile: "Codex Desktop",
              updatedAt: "2026-10-18T16:20:00.000Z",
            },
          ];
    },
    preview: async (selector) => {
      if (fail) {
        fail = false;
        throw new Error(
          "The selected source changed. Preview it again to read its current snapshot.",
        );
      }
      const capture = structuredClone(sampleCapture);
      if (selector.endsWith("2")) {
        capture.source.sessionKey = "c".repeat(64);
        capture.source.profile = "codex-desktop-0.159.2";
      }
      return capture;
    },
  };
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
              presentation: "transcript",
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
        : mount(AiImportPanel, {
            target: this.containerEl,
            props: {
              app: base.app,
              repository,
              scopeDir: "Notes",
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
