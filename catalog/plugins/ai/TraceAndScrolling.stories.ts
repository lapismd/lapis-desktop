import { findMessageEditor } from "../../support/ai/message-editor.ts";
// SPDX-License-Identifier: Apache-2.0
// Retained from lapis-plugins tree 56b5d6c1; ACP-only runtime choices.
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import AiChatDemo from "../../support/ai/AiChatDemo.svelte";
import {
  createAiChatFailureSeedItems,
  createAiChatScrollSeedItems,
} from "../../support/ai/seeds-3.ts";

const meta = {
  title: "Desktop/AI/Trace and scrolling",
  component: AiChatDemo,
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof AiChatDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const AgentTrace: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { requireApproval: false, trace: "rich", enableMarkdown: true },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const writeText = fn(async () => undefined);
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: writeText,
    });
    await expect(await findMessageEditor(canvas)).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Effort and model" }),
    );
    const modelMenu = body.getByTestId("ai-chat-model");
    await waitFor(() => expect(modelMenu).toBeVisible());
    await userEvent.hover(modelMenu);
    await expect(
      await body.findByRole("menuitemradio", { name: "gpt-5.6-sol" }),
    ).toHaveAttribute("data-state", "checked");
    await userEvent.hover(body.getByTestId("ai-chat-thinking"));
    await expect(
      await body.findByRole("menuitemradio", { name: "Medium" }),
    ).toHaveAttribute("data-state", "checked");
    await userEvent.keyboard("{Escape}{Escape}");
    const attachButton = canvas.getByRole("button", { name: "Attach file" });
    await waitFor(() =>
      expect(getComputedStyle(attachButton).pointerEvents).not.toBe("none"),
    );
    await userEvent.click(attachButton);
    const attachSearch = await body.findByPlaceholderText("Search vault files");
    const attachPopover = attachSearch.closest(
      '[data-ui-component="popover"][data-ai-part="attach-popover"]',
    ) as HTMLElement | null;
    expect(attachPopover).not.toBeNull();
    expect(
      attachPopover!.querySelector(
        '[data-ui-component="command-view"][data-ui-part="root"]',
      ),
    ).not.toBeNull();
    const attachChrome = getComputedStyle(attachPopover!);
    expect(attachChrome.borderTopWidth).not.toBe("0px");
    expect(attachChrome.borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(attachChrome.boxShadow).not.toBe("none");
    await userEvent.click(await body.findByText("alpha"));
    await expect(
      canvas.getByRole("button", { name: "Remove alpha" }),
    ).toBeVisible();
    const drawer = canvasElement.querySelector(
      '[data-ui-component="ai-chat-composer-drawer"]',
    ) as HTMLElement | null;
    const attachment = canvas
      .getByRole("button", { name: "Remove alpha" })
      .closest('[data-ui-part="attachment-chip"]') as HTMLElement | null;
    expect(drawer).not.toBeNull();
    expect(attachment).not.toBeNull();
    const drawerPaint = getComputedStyle(drawer!).backgroundColor;
    const attachmentStyles = getComputedStyle(attachment!);
    expect(attachmentStyles.backgroundColor).not.toBe(drawerPaint);
    expect(attachmentStyles.borderTopLeftRadius).not.toBe("999px");
    expect(attachment!.getBoundingClientRect().height).toBeLessThanOrEqual(32);
    expect(
      canvas
        .getByRole("button", { name: "Remove alpha" })
        .getBoundingClientRect().height,
    ).toBeLessThanOrEqual(attachment!.getBoundingClientRect().height);
    await userEvent.click(canvas.getByRole("button", { name: "Attach file" }));
    const openSearch = await body.findByPlaceholderText("Search vault files");
    const openPopover = openSearch.closest(
      '[data-ui-component="popover"][data-ai-part="attach-popover"]',
    ) as HTMLElement | null;
    expect(openPopover).not.toBeNull();
    const popoverBox = openPopover!.getBoundingClientRect();
    const drawerBox = canvas
      .getByRole("button", { name: "Attach file" })
      .getBoundingClientRect();
    expect(popoverBox.bottom).toBeLessThanOrEqual(drawerBox.top + 2);
    const sampleX = Math.floor((popoverBox.left + popoverBox.right) / 2);
    const sampleY = Math.floor((popoverBox.top + popoverBox.bottom) / 2);
    expect(
      canvasElement.ownerDocument
        .elementFromPoint(sampleX, sampleY)
        ?.closest('[data-ai-part="attach-popover"]'),
    ).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    const input = await findMessageEditor(canvas);
    await userEvent.type(input, "Summarize this note");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await waitFor(() => {
      expect(
        canvasElement.querySelector('[data-kind="reasoning"]'),
      ).not.toBeNull();
      expect(
        canvas.getByRole("button", { name: /details for vault.read/ }),
      ).toBeVisible();
      expect(
        canvas.getByRole("article", { name: /Message from codex/i }),
      ).toHaveTextContent("Summary");
      expect(
        canvas.getByRole("article", { name: /Message from codex/i }),
      ).toHaveTextContent("TODO");
      expect(
        canvasElement.querySelector(
          'article[data-role="assistant"] time[datetime]',
        ),
      ).not.toBeNull();
      expect(
        canvas.getByRole("button", { name: /^Context window:/ }),
      ).toBeVisible();
      expect(canvas.queryByText("session updated")).toBeNull();
      expect(canvas.queryByText("available commands updated (75)")).toBeNull();
    });
    const readTrigger = canvas.getByRole("button", {
      name: "Show details for vault.read · Notes/alpha.md",
    });
    const readCall = readTrigger.closest('[data-kind="tools"]');
    expect(readCall).not.toBeNull();
    await userEvent.click(readTrigger);
    const inspector = await canvas.findByLabelText("Tool details");
    await expect(inspector).toHaveTextContent("Notes/alpha.md");
    await expect(inspector).toHaveTextContent("heading: Notes");
    await userEvent.click(
      canvas.getByRole("button", { name: "Close tool details" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Copy response" }),
    );
    await expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("## Summary"),
    );
    const panel = canvas.getByTestId("ai-chat-panel");
    const dock = panel.querySelector(
      "[data-transcript-composer]",
    ) as HTMLElement | null;
    const viewport = panel.querySelector(
      '[data-ui-component="transcript"] [data-ui-part="scroll-area-viewport"]',
    ) as HTMLElement | null;
    const assistant = canvas.getByRole("article", {
      name: /Message from codex/i,
    });
    const bubble = assistant.querySelector(
      ".ui-transcript-message-content",
    ) as HTMLElement | null;
    expect(dock).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(bubble).not.toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Jump to end" }));
    await waitFor(() =>
      expect(dock!.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        viewport!.getBoundingClientRect().bottom + 2,
      ),
    );
    expect(getComputedStyle(viewport!).overflowY).toMatch(/auto|scroll/);
    const bubbleStyles = getComputedStyle(
      within(assistant).getByRole("textbox", { name: "Assistant response" }),
    );
    expect(bubbleStyles.fontFamily).toMatch(/DM Sans/i);
    expect(bubbleStyles.fontSize).toBe("14px");
    expect(parseFloat(bubbleStyles.lineHeight)).toBeGreaterThan(
      parseFloat(bubbleStyles.fontSize),
    );
    const heading = within(bubble!).getByText("Summary", { exact: true });
    expect(heading).not.toBeNull();
    expect(
      parseFloat(getComputedStyle(heading!).fontSize),
    ).toBeGreaterThanOrEqual(parseFloat(bubbleStyles.fontSize));
    expect(getComputedStyle(heading!).fontFamily).toBe(bubbleStyles.fontFamily);
  },
};

export const FailedMessageAndRetry: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: {
      requireApproval: false,
      seedItems: createAiChatFailureSeedItems(),
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const failure = await canvas.findByText(
      "The agent connection closed before the response completed.",
    );
    const message = failure.closest('[role="alert"]') as HTMLElement | null;
    expect(message).not.toBeNull();
    await expect(message).toHaveAccessibleName("Turn interrupted");
    const retry = within(message!).getByRole("button", {
      name: "Retry message",
    });
    await expect(retry).toBeEnabled();
  },
};

export const ScrollRecovery: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: {
      requireApproval: false,
      seedItems: createAiChatScrollSeedItems(),
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Latest seeded message");
    const viewport = canvasElement.querySelector(
      '[data-ui-component="transcript"] [data-ui-part="scroll-area-viewport"]',
    ) as HTMLElement | null;
    expect(viewport).not.toBeNull();
    await waitFor(() => {
      expect(viewport!.scrollHeight).toBeGreaterThan(viewport!.clientHeight);
    });
    await waitFor(() => {
      viewport!.dispatchEvent(
        new WheelEvent("wheel", { deltaY: -120, bubbles: true }),
      );
      viewport!.scrollTop = 0;
      viewport!.dispatchEvent(new Event("scroll"));
      expect(viewport!.scrollTop).toBe(0);
      expect(canvas.getByRole("button", { name: "Jump to end" })).toBeVisible();
    });
    const scrollButton = canvas.getByRole("button", { name: "Jump to end" });
    scrollButton!.click();
    await waitFor(() => {
      const latest = canvas.getByText("Latest seeded message");
      const viewBox = viewport!.getBoundingClientRect();
      const latestBox = latest.getBoundingClientRect();
      expect(latestBox.bottom).toBeLessThanOrEqual(viewBox.bottom + 16);
      expect(latestBox.top).toBeGreaterThanOrEqual(viewBox.top - 16);
    });
  },
};
