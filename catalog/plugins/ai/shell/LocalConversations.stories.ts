// SPDX-License-Identifier: Apache-2.0
// Retained Shell.LocalConversations play from lapis-plugins ee20d366.
import type { WorkspaceLeaf } from "@lapis-notes/api";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { WorkspaceShell } from "@lapis-notes/workspace";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiShellDemo from "../../../support/ai/shell/AiShellDemo.svelte";
import {
  demoApp,
  mainAiLeaves,
  assertStackedComposer,
} from "../../../support/ai/shell/assertions.ts";
import { LOCAL_CONVERSATION_ID } from "../../../support/ai/shell/types.ts";
import { shellParameters } from "../../../support/ai/shell/examples.ts";
import {
  AI_VIEW as AiViewType,
  AI_HISTORY_VIEW as AiHistoryViewType,
} from "../../../../src/lib/ai/plugin/view-types.ts";
import { cleanupCatalog } from "../../../support/lifecycle.ts";
const meta = {
  title: "Desktop/AI/Shell/LocalConversations",
  component: WorkspaceShell,
  tags: ["visual-pending", "autodocs"],
  beforeEach: () => cleanupCatalog,
  argTypes: { app: { control: false } },
  parameters: shellParameters("local-conversations", "desktop"),
} satisfies Meta<typeof WorkspaceShell>;
export default meta;
type Story = StoryObj<typeof AiShellDemo>;
export const LocalConversations: Story = {
  render: () => ({
    Component: AiShellDemo,
    props: { scenario: "local-conversations", displayMode: "desktop" },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("ai-shell-demo")).toHaveAttribute(
        "data-status",
        "ready",
      ),
    );
    const panel = await canvas.findByTestId("ai-chat-panel");
    const app = demoApp(canvasElement);
    const sidebarChatLeaf = app.workspace.getLeavesOfType(AiViewType)[0];
    expect(sidebarChatLeaf).toBeDefined();
    await waitFor(() =>
      expect(panel).toHaveAttribute("data-initializing", "false"),
    );
    await assertStackedComposer(panel);
    await userEvent.click(
      within(panel).getByRole("button", {
        name: "Conversation actions",
      }),
    );
    const conversationTrigger = within(panel).getByRole("button", {
      name: "Conversation actions",
    });
    const body = within(canvasElement.ownerDocument.body);
    const archiveChat = await body.findByRole("menuitem", {
      name: /^Archive Chat$/,
    });
    const deleteChat = body.getByRole("menuitem", { name: /^Delete Chat$/ });
    const newChatItem = body.getByRole("menuitem", { name: /^New Chat$/ });
    await waitFor(() => {
      expect(archiveChat).toBeVisible();
      expect(deleteChat).toBeVisible();
      expect(newChatItem).toBeVisible();
    });
    const conversationMenu =
      archiveChat.closest<HTMLElement>("[data-ai-part='conversation-menu']") ??
      archiveChat.closest<HTMLElement>("[role='menu']");
    expect(conversationMenu).not.toBeNull();
    const menuStyle = getComputedStyle(conversationMenu!);
    expect(menuStyle.overflowX).not.toBe("hidden");
    expect(menuStyle.overflowY).not.toBe("hidden");
    expect(conversationMenu!.getBoundingClientRect().width).toBeGreaterThan(
      conversationTrigger.getBoundingClientRect().width + 40,
    );
    expect(conversationMenu!.scrollWidth).toBeLessThanOrEqual(
      conversationMenu!.clientWidth + 1,
    );
    for (const item of [archiveChat, deleteChat, newChatItem]) {
      expect(getComputedStyle(item).textOverflow).not.toBe("ellipsis");
      expect(item.scrollWidth).toBeLessThanOrEqual(item.clientWidth + 1);
      const range = item.ownerDocument.createRange();
      range.selectNodeContents(item);
      expect(range.getBoundingClientRect().right).toBeLessThanOrEqual(
        conversationMenu!.getBoundingClientRect().right + 1,
      );
    }
    const conversationItemFont = getComputedStyle(archiveChat).fontSize;
    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      expect(
        body.queryByRole("menuitem", { name: /^Archive Chat$/ }),
      ).toBeNull();
      expect(
        within(panel).getByRole("button", { name: "Conversation actions" }),
      ).toHaveAttribute("aria-expanded", "false");
      expect(getComputedStyle(conversationTrigger).pointerEvents).not.toBe(
        "none",
      );
    });
    await userEvent.click(
      within(panel).getByRole("button", { name: "Effort and model" }),
    );
    const preferenceModelMenu = body.getByTestId("ai-chat-model");
    await waitFor(() => expect(preferenceModelMenu).toBeVisible());
    await userEvent.hover(preferenceModelMenu);
    const modelItem = await body.findByRole("menuitemradio", {
      name: "gpt-5.6-sol",
    });
    expect(getComputedStyle(modelItem).fontSize).toBe(conversationItemFont);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      expect(
        body.queryByRole("menuitemradio", { name: "gpt-5.6-sol" }),
      ).toBeNull();
      expect(getComputedStyle(conversationTrigger).pointerEvents).not.toBe(
        "none",
      );
    });
    await userEvent.click(
      within(panel).getByRole("button", {
        name: "Show conversation history",
      }),
    );
    await waitFor(() =>
      expect(app.workspace.getLeavesOfType(AiHistoryViewType)).toHaveLength(1),
    );
    const history = await canvas.findByTestId("ai-conversation-history");
    const historyLeaf = app.workspace.getLeavesOfType(AiHistoryViewType)[0];
    expect(historyLeaf).toBeDefined();
    expect(app.workspace.getLeavesOfType(AiViewType)).toContain(
      sidebarChatLeaf,
    );
    expect(sidebarChatLeaf?.view.getViewType()).toBe(AiViewType);
    await waitFor(() => {
      expect(
        within(history).getByTestId("ai-history-creation-scope"),
      ).toHaveTextContent("Notes");
      expect(
        within(history).getByText("Summarize project notes"),
      ).toBeVisible();
    });
    expect(within(history).queryByText("Archived planning chat")).toBeNull();

    const historyOptions = within(history).getByRole("button", {
      name: "Show conversation options",
    });
    await waitFor(() => {
      expect(getComputedStyle(historyOptions).pointerEvents).not.toBe("none");
    });
    await userEvent.click(historyOptions);
    await userEvent.click(
      within(history).getByRole("switch", {
        name: "Show archived conversations",
      }),
    );
    await expect(
      within(history).getByText("Archived planning chat"),
    ).toBeVisible();
    const activeItem = within(history)
      .getByRole("button", { name: /^Summarize project notes\b/ })
      .closest<HTMLElement>('[role="treeitem"]');
    if (!activeItem)
      throw new Error("Active conversation row was not rendered");
    await userEvent.click(
      within(activeItem).getByRole("button", {
        name: "Conversation actions for Summarize project notes",
      }),
    );
    await userEvent.click(
      await body.findByRole("menuitem", { name: /^Archive$/ }),
    );
    const archivedActiveItem = within(history)
      .getByRole("button", { name: /^Summarize project notes\b/ })
      .closest<HTMLElement>('[role="treeitem"]');
    if (!archivedActiveItem) {
      throw new Error("Archived active conversation row was not rendered");
    }
    const restoreActions = within(archivedActiveItem).getByRole("button", {
      name: "Conversation actions for Summarize project notes",
    });
    await waitFor(() => {
      expect(getComputedStyle(restoreActions).pointerEvents).not.toBe("none");
    });
    await userEvent.click(restoreActions);
    await userEvent.click(
      await body.findByRole("menuitem", { name: /^Restore$/ }),
    );
    const archivedItem = within(history)
      .getByRole("button", { name: /^Archived planning chat\b/ })
      .closest<HTMLElement>('[role="treeitem"]');
    if (!archivedItem) {
      throw new Error("Archived conversation row was not rendered");
    }
    const deleteActions = within(archivedItem).getByRole("button", {
      name: "Conversation actions for Archived planning chat",
    });
    await waitFor(() => {
      expect(getComputedStyle(deleteActions).pointerEvents).not.toBe("none");
    });
    await userEvent.click(deleteActions);
    await userEvent.click(
      await body.findByRole("menuitem", { name: /^Delete$/ }),
    );
    await waitFor(
      () =>
        expect(
          within(history).queryByText("Archived planning chat"),
        ).toBeNull(),
      { timeout: 8_000 },
    );

    const newChat = within(history).getByRole("button", {
      name: "New chat in Notes",
    });
    await waitFor(() => {
      expect(getComputedStyle(newChat).pointerEvents).not.toBe("none");
    });
    await userEvent.click(newChat);
    await waitFor(() => expect(mainAiLeaves(app)).toHaveLength(1));
    const emptyConversationLeaf = mainAiLeaves(app)[0]!;
    const emptyChat = emptyConversationLeaf.containerEl.querySelector(
      '[data-testid="ai-chat-panel"]',
    ) as HTMLElement | null;
    expect(emptyChat).not.toBeNull();
    await expect(
      within(emptyChat!).getByRole("textbox", { name: "Message" }),
    ).toBeVisible();

    await userEvent.click(
      within(emptyChat!).getByRole("button", {
        name: "Show conversation history",
      }),
    );
    const rootHistory = await canvas.findByTestId("ai-conversation-history");
    expect(app.workspace.getLeavesOfType(AiHistoryViewType)).toEqual([
      historyLeaf,
    ]);
    expect(
      within(rootHistory)
        .getAllByText("Notes")
        .some((element) => element.getClientRects().length > 0),
    ).toBe(true);
    const conversationButton = within(rootHistory).getByRole("button", {
      name: /^Summarize project notes\b/,
    });
    await waitFor(() => {
      expect(getComputedStyle(conversationButton).pointerEvents).not.toBe(
        "none",
      );
    });
    await userEvent.click(conversationButton);
    let restoredLeaf: WorkspaceLeaf | undefined;
    await waitFor(() => {
      restoredLeaf = mainAiLeaves(app).find((leaf) => {
        const state = leaf.getViewState().state;
        return state?.conversationId === LOCAL_CONVERSATION_ID;
      });
      expect(restoredLeaf).toBeDefined();
      expect(mainAiLeaves(app)).toHaveLength(2);
    });
    const restored = restoredLeaf!.containerEl.querySelector(
      '[data-testid="ai-chat-panel"]',
    ) as HTMLElement | null;
    expect(restored).not.toBeNull();
    await expect(
      within(restored!).getByText(
        "The project has one welcome note and one TODO.",
      ),
    ).toBeVisible();
    await expect(
      within(restored!).getByRole("button", {
        name: "Context window: 10% full",
      }),
    ).toBeVisible();
    await waitFor(() => {
      expect(getComputedStyle(conversationButton).pointerEvents).not.toBe(
        "none",
      );
    });
    await userEvent.click(conversationButton);
    await waitFor(() => {
      expect(mainAiLeaves(app)).toHaveLength(2);
      expect(
        mainAiLeaves(app).find(
          (leaf) =>
            leaf.getViewState().state?.conversationId === LOCAL_CONVERSATION_ID,
        ),
      ).toBe(restoredLeaf);
    });
    expect(app.workspace.getLeavesOfType(AiHistoryViewType)).toEqual([
      historyLeaf,
    ]);
    await expect(
      demoApp(canvasElement).vault.adapter.read(
        "Notes/.lapis/agents/sessions/123e4567-e89b-42d3-a456-426614174000/transcript.jsonl",
      ),
    ).resolves.toContain("Summarize the project");
    if (!app.workspace.rightSplit.collapsed) {
      await userEvent.click(
        canvas.getByRole("button", { name: "Close right sidebar" }),
      );
    }
    expect(app.workspace.rightSplit.collapsed).toBe(true);
  },
};
