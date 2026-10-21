import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import AiChatPanel from "../../../../src/components/ai/chat/AiChatPanel.svelte";
import AiChatSession from "../../../../src/components/ai/sessions/AiChatSession.svelte";
import { AcpAgentRuntime } from "../../../../src/lib/ai/runtimes/acp/runtime.ts";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { createChatApp } from "../app-fixture.ts";
import { ParticipantSettings } from "../transcript/participant-settings.svelte.ts";
import { acpFixture } from "../../../../tests/fixtures/ai/acp-transport.mjs";

/** Real desktop chat/runtime composition, with a disposable ACP transport. */
export function createSentContextFixture(unknown = false) {
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
  const settings = new ParticipantSettings(false);
  settings.value = {
    ...settings.value,
    automaticallyMentionAgents: false,
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
          transcriptFrame: AiChatSession,
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
