// SPDX-License-Identifier: Apache-2.0
// Retained from lapis-plugins tree 56b5d6c1; ACP-only runtime choices.
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiChatDemo from "../../support/ai/AiChatDemo.svelte";
import { createAiChatToolSeedItems } from "../../support/ai/seeds-1.ts";

const meta = {
  title: "Desktop/AI/Tool activity",
  component: AiChatDemo,
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof AiChatDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const QuestionAnswered: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { requireQuestion: true },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole("combobox", { name: "Message" });
    await userEvent.type(input, "Update the sample file");
    await userEvent.keyboard("{Enter}");
    const option = await canvas.findByRole("button", {
      name: /Make the smallest change/,
    });
    await userEvent.click(option);
    const submit = canvas.getByRole("button", { name: "Submit answer" });
    await expect(submit).toBeEnabled();
    await userEvent.click(submit);
    await waitFor(() => {
      expect(canvas.getByText("Question answered")).toBeInTheDocument();
      expect(canvas.queryByTestId("ai-question-card")).toBeNull();
      expect(canvas.queryByTestId("ai-chat-working")).toBeNull();
    });
  },
};

export const ToolRunning: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: {
      seedItems: createAiChatToolSeedItems("running"),
      preservePending: true,
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole("button", {
      name: "Show details for shell.execute local workspace",
    });
    await expect(
      trigger.querySelector('[data-ui-part="detail-chevron"]'),
    ).toHaveAttribute("data-direction", "right");
    const status = canvasElement.querySelector(
      '[data-ui-part="call-status"][data-status="running"]',
    );
    expect(status).not.toBeNull();
    await expect(status).toHaveTextContent("Running");
  },
};

export const SuccessfulToolCall: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { seedItems: createAiChatToolSeedItems("completed") },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole("button", {
      name: "Show details for shell.execute local workspace",
    });
    const chevron = trigger.querySelector('[data-ui-part="detail-chevron"]');
    await expect(chevron).toHaveAttribute("data-direction", "right");
    await userEvent.click(trigger);
    await expect(chevron).toHaveAttribute("data-direction", "down");
    await expect(
      canvasElement.querySelector('[data-ui-part="code-block-line"]'),
    ).toHaveTextContent("pnpm --filter @lapis-notes/ai test");
    await expect(canvas.getByText("121 tests passed")).toBeVisible();
  },
};
