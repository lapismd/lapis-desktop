import { expect, it, vi } from "vitest";
import { ComposerRecipients } from "../../../src/lib/ai/chat/panel/recipients.svelte.ts";
import { mentionTriggers } from "../../../src/lib/ai/chat/panel/mention-triggers.ts";
import { createChatPanelActions } from "../../../src/lib/ai/chat/panel/actions.ts";
import type { ComposerState } from "../../../src/lib/ai/chat/panel/composer.svelte.ts";
import type { AttachmentsState } from "../../../src/lib/ai/chat/panel/attachments.svelte.ts";
import type { AiChatPanelProps } from "../../../src/lib/ai/chat/panel/props.ts";
import { AiChatController } from "../../../src/lib/ai/chat/chat-controller.svelte.ts";
import { FakeAgentRuntime } from "../support/fake-runtime.ts";

const reviewer = { id: "reviewer", label: "Reviewer", agent: "codex" as const };
it("namespaces file and agent suggestions independently and selection dispatches no work", async () => {
  const choose = vi.fn();
  const controller = new AiChatController(new FakeAgentRuntime());
  const composer = {
    recipientOptions: [reviewer],
    selectRecipient: choose,
  } as unknown as ComposerState;
  try {
    const trigger = mentionTriggers(
      {
        runtime: controller.runtime,
        fileSearch: async () => [
          {
            id: "agent:reviewer",
            label: "agent:reviewer",
            value: '@"agent:reviewer"',
          },
        ],
      },
      composer,
      controller,
    )[0]!;
    const items = await trigger.searchSource(
      "review",
      new AbortController().signal,
    );
    expect(items.map((item) => item.id)).toEqual([
      "agent:reviewer",
      "file:agent:reviewer",
    ]);
    expect(trigger.onSelect(items[0]!)).toBe("");
    expect(choose).toHaveBeenCalledExactlyOnceWith("reviewer");
    expect(trigger.onSelect(items[1]!)).toMatchObject({
      value: '@"agent:reviewer"',
    });
    expect(controller.session).toBeNull();
    expect(controller.items).toHaveLength(0);
  } finally {
    await controller.close();
  }
});

it("a removed catalog entry blocks Send and reports a toast while retaining text, recipient and attachments", async () => {
  const runtime = new FakeAgentRuntime();
  const controller = new AiChatController(runtime);
  const notify = vi.fn();
  let options = [reviewer];
  const recipients = new ComposerRecipients(() => options);
  recipients.select("reviewer");
  const composer = {
    draft: "Keep this draft",
    catalogState: null,
    recipients,
  } as unknown as ComposerState;
  const attachments = {
    attachments: [{ path: "Notes/a.md", name: "a" }],
    drawerCollapsed: false,
  } as unknown as AttachmentsState;
  const props = {
    runtime,
    app: { notifications: { notify } },
  } as unknown as AiChatPanelProps;
  const actions = createChatPanelActions(
    () => props,
    controller,
    composer,
    attachments,
  );
  options = [];
  try {
    await actions.submit("Keep this draft");
    expect(notify).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        id: "ai-action-error",
        severity: "error",
        message: expect.stringContaining(
          "addressed agent is no longer available",
        ),
      }),
    );
    expect(composer.draft).toBe("Keep this draft");
    expect(recipients.selectedId).toBe("reviewer");
    expect(attachments.attachments).toHaveLength(1);
    expect(runtime.sessions).toHaveLength(0);
    expect(controller.items).toHaveLength(0);
  } finally {
    await controller.close();
  }
});

it("an unconfirmed Send retains its recipient and attachment draft", async () => {
  const runtime = new FakeAgentRuntime();
  const controller = new AiChatController(runtime);
  vi.spyOn(controller, "submit").mockResolvedValue(false);
  const recipients = new ComposerRecipients(() => [reviewer]);
  recipients.select("reviewer");
  const composer = {
    draft: "Keep this draft",
    catalogState: null,
    recipients,
    catalogModels: [],
    selectedAgent: "codex",
    selectedModel: "",
    selectedThinking: "medium",
    selectedRuntime: "fake",
  } as unknown as ComposerState;
  const attachments = {
    attachments: [{ path: "Notes/a.md", name: "a" }],
    drawerCollapsed: true,
  } as unknown as AttachmentsState;
  const actions = createChatPanelActions(
    () => ({ runtime }),
    controller,
    composer,
    attachments,
  );
  try {
    await actions.submit("Keep this draft");
    expect(composer.draft).toBe("Keep this draft");
    expect(recipients.selectedId).toBe("reviewer");
    expect(attachments.attachments).toEqual([
      { path: "Notes/a.md", name: "a" },
    ]);
    expect(attachments.drawerCollapsed).toBe(true);
  } finally {
    await controller.close();
  }
});
