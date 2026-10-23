import { NativeMemoryService } from "../../../../src/lib/ai/memory/native-memory-service.ts";
import { VaultMemoryRecordStore } from "../../../../src/lib/ai/memory/vault-memory-record-store.ts";
import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import AiChatPanel from "../../../../src/components/ai/chat/AiChatPanel.svelte";
import { AcpAgentRuntime } from "../../../../src/lib/ai/runtimes/acp/runtime.ts";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { createChatApp } from "../app-fixture.ts";
import { ParticipantSettings } from "../transcript/participant-settings.svelte.ts";
import { acpFixture } from "../../../../tests/fixtures/ai/acp-transport.mjs";

/** Real desktop chat/runtime composition, with a disposable ACP transport. */
export function createSentContextFixture(unknown = false, withMemory = false) {
  const base = createChatApp(() => {});
  const transport = acpFixture();
  transport.backend.client.targets = async () => [
    { id: "codex", label: "Codex" },
  ];
  transport.unknown = unknown;
  transport.onPrompt = async (id: string, requestId: string) => {
    transport.emit(id, "activity", requestId, {
      update: {
        sessionUpdate: "agent_message_chunk",
        content: {
          type: "text",
          text: "The notes have a clear outline. Keep the heading hierarchy consistent.",
        },
      },
    });
    transport.emit(id, "record", requestId, {
      record: { status: "completed", stopReason: "end_turn" },
    });
  };
  const runtime = new AcpAgentRuntime(transport.backend);
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  const memoryStore = new VaultMemoryRecordStore(base.app.vault);
  const memory = new NativeMemoryService(repository, base.app.appDatabase, {
    recordStore: memoryStore,
  });
  const settings = new ParticipantSettings(false);
  settings.value = {
    ...settings.value,
    automaticallyMentionAgents: false,
    memoryAutomaticRecall: withMemory,
    agentParticipants: [
      {
        id: "reviewer",
        label: "Reviewer",
        agent: "codex",
        instructions: "Review the structure and clarity of the notes.",
      },
      {
        id: "writer",
        label: "Writer",
        agent: "codex",
        instructions:
          "Continue from the reviewer and propose concise revisions.",
      },
    ],
  };
  const panels = new Set<ReturnType<typeof mount>>();
  const pending = new Set<Promise<unknown>>();
  function own(operation: Promise<unknown>) {
    pending.add(operation);
    void operation.finally(() => pending.delete(operation)).catch(() => {});
  }
  class SentContextView extends View {
    panel?: ReturnType<typeof mount>;
    constructor(leaf: WorkspaceLeaf) {
      super(leaf);
    }
    getViewType() {
      return "ai-sent-context";
    }
    getDisplayText() {
      return "AI";
    }
    getIcon() {
      return "sparkles";
    }
    protected async onOpen() {}
    protected async onClose() {}
    override onload() {
      this.panel = mount(AiChatPanel, {
        target: this.containerEl,
        props: {
          app: base.app,
          runtime,
          repository,
          memoryRecall: withMemory ? memory : undefined,
          createConversation: () => ({
            scopeDir: "Notes",
            launchNotePath: "Notes/alpha.md",
          }),
          get settings() {
            return settings.value;
          },
          onSettingsChange: settings.save,
          models: [{ provider: "codex", model: "gpt-5.6-sol" }],
          onOperation: own,
          onControllerDispose: own,
        },
      });
      panels.add(this.panel);
    }
    override onunload() {
      if (this.panel && panels.delete(this.panel)) own(unmount(this.panel));
    }
  }
  const ready = (async () => {
    await base.ready;
    if (withMemory) {
      await base.app.vault.mkpath("Memory/Projects/Notes");
      await base.app.vault.create(
        "Memory/Projects/Notes/MEMORY.md",
        "# Memory\n\nUse short sentences and compact headings in these notes.\n",
      );
      await base.app.vault.create(
        "Memory/Projects/Notes/2026-10-21.md",
        "# 2026-10-21\n\n## 10:30 — Review decision\n\nKeep the introduction concise and put the actionable details first.\n",
      );
      await memory.rebuild();
    }
    base.app.workspace.registerView(
      "ai-sent-context",
      (leaf) => new SentContextView(leaf),
    );
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
                id: "ai-chat",
                type: "leaf",
                state: {
                  type: "ai-sent-context",
                  state: {},
                  title: "AI",
                  icon: "sparkles",
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
    });
  })();
  let closing: Promise<void> | undefined;
  return {
    app: base.app,
    ready,
    inspect: (name: string) => {
      if (name !== "prompts")
        throw new Error(`Unknown sent-context observation: ${name}`);
      return JSON.stringify(
        transport.calls
          .filter(
            (call: unknown[]) =>
              call[0] === "submit" &&
              (call[3] as { type?: string })?.type === "prompt",
          )
          .map((call: unknown[]) => call[3]),
      );
    },
    close: () =>
      (closing ??= (async () => {
        await ready;
        for (const panel of panels) {
          panels.delete(panel);
          await unmount(panel);
        }
        await Promise.allSettled([...pending]);
        await base.close();
      })()),
  };
}
