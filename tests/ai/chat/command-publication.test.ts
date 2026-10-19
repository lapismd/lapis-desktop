// SPDX-License-Identifier: Apache-2.0
import { expect, it } from "vitest";
import { AiChatController } from "../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { SlashCommandCatalog } from "../../../src/lib/ai/commands/catalog.ts";
import { SlashCommandRouter } from "../../../src/lib/ai/commands/router.ts";
import { ConversationRepository } from "../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { createChatPanelActions } from "../../../src/lib/ai/chat/panel/actions.ts";
import type { ComposerState } from "../../../src/lib/ai/chat/panel/composer.svelte.ts";
import type { AttachmentsState } from "../../../src/lib/ai/chat/panel/attachments.svelte.ts";
import { FakeAgentRuntime } from "../support/fake-runtime.ts";

function controller(saved: boolean) {
  return new AiChatController(new FakeAgentRuntime(), null, [], {
    slashRouter: new SlashCommandRouter(new SlashCommandCatalog()),
    ...(saved
      ? {
          repository: new ConversationRepository(new MemoryTranscriptStore()),
          createConversation: () => ({
            id: "123e4567-e89b-42d3-a456-426614174000",
            scopeDir: "Notes",
            title: "Command acknowledgement",
          }),
        }
      : {}),
  });
}
it.each([false, true])(
  "acknowledges a completed local command with saved=%s",
  async (saved) => {
    const chat = controller(saved);
    try {
      const accepted = saved
        ? await chat.publication.submit("/model", {})
        : await chat.submit("/model");
      expect(accepted).toBe(true);
      await chat.publication.whenSettled();
      expect(chat.items).toContainEqual(
        expect.objectContaining({
          type: "status",
          text: "Change the model from the composer Model menu.",
        }),
      );
      expect(chat.session).toBeNull();
    } finally {
      await chat.close();
    }
  },
);
it("does not acknowledge an unknown command", async () => {
  const chat = controller(false);
  try {
    expect(await chat.submit("/not-an-installed-command")).toBe(false);
    expect(chat.error).toContain("Unknown command");
    expect(chat.session).toBeNull();
  } finally {
    await chat.close();
  }
});
it("does not acknowledge command work after cancellation", async () => {
  const chat = controller(false);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  try {
    const pending = chat._withCommandProgress(async () => {
      await gate;
    });
    await chat.cancel();
    release();
    expect(await pending).toBe(false);
  } finally {
    release();
    await chat.close();
  }
});

it("preserves unconsumed attachments after a local command completes", async () => {
  const chat = controller(false);
  const attachment = { name: "Draft", path: "Notes/Draft.md" };
  const attachments = {
    attachments: [attachment],
    drawerCollapsed: false,
  } as unknown as AttachmentsState;
  const composer = {
    catalogState: null,
    selectedAgent: "codex",
    catalogModels: [],
    selectedModel: "",
    selectedThinking: "off",
    selectedRuntime: "acp",
    recipients: { snapshot: () => undefined },
  } as unknown as ComposerState;
  const actions = createChatPanelActions(
    () => ({ runtime: chat.runtime }),
    chat,
    composer,
    attachments,
  );
  try {
    expect(await actions.submitTranscript("/model", [])).toBe(true);
    expect(attachments.attachments).toEqual([attachment]);
  } finally {
    await chat.close();
  }
});
