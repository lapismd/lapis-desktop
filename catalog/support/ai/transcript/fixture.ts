import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import AiChatPanel from "../../../../src/components/ai/chat/AiChatPanel.svelte";
import { createMemorySessionStore } from "../../../../src/lib/ai/sessions/session-store.ts";
import { DEFAULT_AI_SETTINGS } from "../../../../src/lib/ai/settings/ai-settings.ts";
import {
  formatFileMention,
  searchVaultFiles,
} from "../../../../src/lib/ai/chat/chat-mentions.ts";
import { createChatApp } from "../app-fixture.ts";
import { FakeAgentRuntime } from "../../../../tests/ai/support/fake-runtime.ts";
import { transcriptReviewItems } from "./seeds.ts";
import { registerCatalogCleanup } from "../../lifecycle.ts";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { savedCommentSnapshot } from "./saved-comments.ts";
import { ParticipantSettings } from "./participant-settings.svelte.ts";
import { savedRecipientSnapshot } from "./saved-recipients.ts";

export type TranscriptScenario =
  | "conversation"
  | "classic"
  | "empty"
  | "loading"
  | "approval"
  | "question"
  | "long-code"
  | "unknown-turn"
  | "restored-comments"
  | "addressed"
  | "addressed-approval"
  | "participant-settings"
  | "participant-settings-failure"
  | "failure";
const type = "ai-transcript-review";

export function createTranscriptFixture(scenario: TranscriptScenario) {
  const base = createChatApp(() => {});
  const participantSettings = new ParticipantSettings(
    scenario === "participant-settings-failure",
  );
  const runtime = new FakeAgentRuntime({
    requireApproval:
      scenario === "approval" || scenario === "addressed-approval",
    requireQuestion: scenario === "question",
    trace: "rich",
    resumeSupported: scenario !== "restored-comments",
  });
  const seed =
    scenario === "empty" ||
    scenario === "loading" ||
    scenario === "approval" ||
    scenario === "question"
      ? []
      : transcriptReviewItems(scenario === "long-code");
  if (scenario === "failure")
    seed.push({
      id: "failed-turn",
      type: "error",
      text: "The previous turn was interrupted. Its recorded messages remain available.",
      createdAt: "2026-10-18T09:17:00.000Z",
    });
  const store = createMemorySessionStore([
    {
      id: "ai:default",
      runtime: runtime.id,
      runtimeSessionId: "review-session",
      createdAt: "2026-10-18T09:10:00.000Z",
      updatedAt: "2026-10-18T09:17:00.000Z",
      items: seed,
    },
  ]);
  const pending = new Set<Promise<unknown>>();
  const location = {
    scopeDir: "Notes",
    conversationId: "123e4567-e89b-42d3-a456-426614174000",
  };
  const addressedStore = [
    "addressed",
    "addressed-approval",
    "participant-settings",
    "participant-settings-failure",
  ].includes(scenario)
    ? new MemoryTranscriptStore([savedRecipientSnapshot()])
    : undefined;
  const repository = addressedStore
    ? new ConversationRepository(addressedStore)
    : scenario === "unknown-turn"
      ? new ConversationRepository(
          new MemoryTranscriptStore([
            {
              location,
              metadata: {
                schemaVersion: 1,
                id: location.conversationId,
                status: "active",
                createdAt: "2026-10-19T00:00:00.000Z",
                updatedAt: "2026-10-19T00:00:00.000Z",
                title: "An interrupted local turn",
                pendingTurn: {
                  version: 1,
                  id: "interrupted-turn",
                  userEntryId: "original-user",
                  agentBindingId: "unconfirmed-binding",
                  startedAt: "2026-10-19T00:00:00.000Z",
                },
              },
              transcript: [
                {
                  schemaVersion: 1,
                  id: "original-user",
                  type: "message",
                  role: "user",
                  text: "Keep this authored prompt after an interrupted session.",
                  createdAt: "2026-10-19T00:00:00.000Z",
                },
              ],
              agents: [],
              warnings: [],
            },
          ]),
        )
      : scenario === "restored-comments"
        ? new ConversationRepository(
            new MemoryTranscriptStore([savedCommentSnapshot()]),
          )
        : undefined;
  let addressedTranscript = addressedStore
    ? savedRecipientSnapshot().transcript
    : [];
  function own(operation: Promise<unknown>) {
    const observed = operation.finally(async () => {
      if (addressedStore)
        addressedTranscript = (await addressedStore.read(location)).transcript;
    });
    pending.add(observed);
    void observed.finally(() => pending.delete(observed)).catch(console.error);
  }
  const mounts = new Set<ReturnType<typeof mount>>();
  const files = [
    { path: "Notes/alpha.md", name: "alpha" },
    { path: "Projects/auth.md", name: "auth" },
  ];
  class TranscriptReviewView extends View {
    #panel?: ReturnType<typeof mount>;
    constructor(leaf: WorkspaceLeaf) {
      super(leaf);
    }
    getViewType() {
      return type;
    }
    getDisplayText() {
      return "AI";
    }
    getIcon() {
      return "sparkles";
    }
    protected async onOpen() {}
    protected async onClose() {}
    onload() {
      this.#panel = mount(AiChatPanel, {
        target: this.containerEl,
        props: {
          app: base.app,
          presentation: "transcript",
          initialTranscriptView:
            scenario === "classic" ? "classic" : "document",
          runtime,
          agentOptions:
            scenario === "addressed" || scenario === "addressed-approval"
              ? [
                  { id: "reviewer", label: "Reviewer", agent: "codex" },
                  { id: "writer", label: "Writer", agent: "codex" },
                ]
              : undefined,
          sessionStore: repository ? undefined : store,
          repository,
          initialLocation: repository ? location : undefined,
          get settings() {
            return participantSettings.value;
          },
          onSettingsChange: participantSettings.save,
          models: [{ provider: "codex", model: "gpt-5.6-sol" }],
          initializing: scenario === "loading",
          fileSearch: async (query) =>
            searchVaultFiles(files, query).map((file) => ({
              id: file.path,
              label: file.name,
              description: file.path,
              value: formatFileMention(file.path),
            })),
          onOperation: own,
          onControllerDispose: own,
        },
      });
      mounts.add(this.#panel);
    }
    onunload() {
      if (this.#panel && mounts.delete(this.#panel)) own(unmount(this.#panel));
    }
  }
  const ready = (async () => {
    await base.ready;
    base.app.workspace.registerView(
      type,
      (leaf) => new TranscriptReviewView(leaf),
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
                id: "ai-review",
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
      active: "ai-review",
    });
  })();
  let closing: Promise<void> | undefined;
  const close = () =>
    (closing ??= (async () => {
      await ready;
      for (const panel of mounts) {
        mounts.delete(panel);
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
    inspect: (name: string) =>
      name === "transcript" && addressedStore
        ? JSON.stringify(addressedTranscript)
        : JSON.stringify(
            runtime.sessions.map((session) => ({
              id: session.id,
              prompts: session.prompts,
              context: session.contextBlocks,
            })),
          ),
    close: async () => {
      unregister();
      await close();
    },
  };
}
