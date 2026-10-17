// SPDX-License-Identifier: Apache-2.0
// Retained from lapis-plugins tree 56b5d6c1; ACP-only runtime choices.
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiChatDemo from "../../support/ai/AiChatDemo.svelte";

const meta = {
  title: "Desktop/AI/Conversation",
  component: AiChatDemo,
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof AiChatDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SendAndComplete: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { requireApproval: false },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = await canvas.findByTestId("ai-chat-panel");
    const dock = panel.querySelector(
      '[data-ui-part="composer-dock"]',
    ) as HTMLElement | null;
    const shell = panel.querySelector(
      '[data-ui-part="scroll-shell"]',
    ) as HTMLElement | null;
    expect(dock).not.toBeNull();
    expect(shell).not.toBeNull();
    expect(getComputedStyle(dock!).position).toBe("relative");
    expect(shell!.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      dock!.getBoundingClientRect().top + 2,
    );
    const input = await canvas.findByRole("combobox", { name: "Message" });
    await userEvent.type(input, "Summarize this note");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(
        canvas.getByRole("article", { name: "Message from assistant" }),
      ).toHaveTextContent("Summarize this note");
    });
  },
};

export const AutomaticMemoryRecall: Story = {
  tags: ["skip-visual", "test"],
  render: () => ({
    Component: AiChatDemo,
    props: { enableMemoryRecall: true },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole("combobox", { name: "Message" });
    await userEvent.type(input, "Draft the Atlas summary");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(canvas.getByTestId("ai-chat-demo")).toHaveAttribute(
        "data-memory-recall-calls",
        "1",
      );
      expect(
        canvas.getByRole("article", { name: "Message from user" }),
      ).toHaveTextContent("Draft the Atlas summary");
      expect(
        canvas.getByRole("article", { name: "Message from assistant" }),
      ).toHaveTextContent("Draft the Atlas summary");
    });
    expect(
      canvas.queryByText("Use compact headings in Atlas notes."),
    ).toBeNull();
  },
};

export const OpenCodeHarnessChoices: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: {
      showRuntimeSelection: true,
      models: [{ provider: "opencode", model: "anthropic/claude-sonnet-4-5" }],
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await userEvent.click(
      canvas.getByRole("button", { name: "Effort and model" }),
    );
    await userEvent.click(body.getByTestId("ai-chat-agent"));
    await waitFor(() =>
      expect(
        body.getByRole("menuitemradio", { name: "OpenCode ACP" }),
      ).toBeVisible(),
    );
    await userEvent.click(body.getByText("OpenCode ACP"));
    await expect(canvas.getByTestId("ai-chat-demo")).toHaveAttribute(
      "data-selected-runtime",
      "acp",
    );
    await expect(canvas.getByTestId("ai-chat-demo")).toHaveAttribute(
      "data-selected-agent",
      "opencode",
    );
  },
};
