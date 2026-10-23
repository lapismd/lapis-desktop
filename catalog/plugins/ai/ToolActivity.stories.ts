import { findMessageEditor } from "../../support/ai/message-editor.ts";
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
    const input = await findMessageEditor(canvas);
    await userEvent.type(input, "Update the sample file");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    const option = await canvas.findByRole("radio", {
      name: /Make the smallest change/,
    });
    await userEvent.click(option);
    const submit = canvas.getByRole("button", { name: "Submit answer" });
    await expect(submit).toBeEnabled();
    await userEvent.click(submit);
    const response = await canvas.findByRole("button", {
      name: /^Response submitted:/,
    });
    await expect(response).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => {
      expect(canvas.queryByTestId("ai-question-card")).toBeNull();
      expect(canvas.queryByText("Agent is working…")).toBeNull();
    });
    await userEvent.click(response);
    await expect(canvas.getByTestId("ai-question-card")).toHaveAttribute(
      "data-state",
      "answered",
    );
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
      name: "Show details for shell.execute",
    });
    expect(canvas.queryByRole("region", { name: "Tool details" })).toBeNull();
    await expect(trigger).toHaveAccessibleDescription("Running");
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
      name: "Show details for shell.execute",
    });
    expect(canvas.queryByRole("region", { name: "Tool details" })).toBeNull();
    await userEvent.click(trigger);
    const inspector = await canvas.findByRole("region", {
      name: "Tool details",
    });
    await expect(within(inspector).getByText("121 tests passed")).toBeVisible();
    await userEvent.click(
      within(inspector).getByRole("button", { name: "Show source" }),
    );
    await expect(inspector).toHaveTextContent(
      "pnpm --filter @lapis-notes/ai test",
    );
  },
};
