// SPDX-License-Identifier: Apache-2.0
// Retained from lapis-plugins tree 56b5d6c1; ACP-only runtime choices.
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiChatDemo from "../../support/ai/AiChatDemo.svelte";
import { createAiChatToolSeedItems } from "../../support/ai/seeds-1.ts";

const meta = {
  title: "Desktop/AI/Errors and mentions",
  component: AiChatDemo,
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof AiChatDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const AppToolHostUpgradeRequired: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: {
      modelCatalogError:
        "Application tools require an agent host with protocol v3 support.",
    },
  }),
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("alert"),
    ).toHaveTextContent("protocol v3");
  },
};

export const FailedToolCall: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { seedItems: createAiChatToolSeedItems("error") },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole("button", {
      name: "Show details for shell.execute",
    });
    await expect(trigger).toHaveAccessibleDescription("Error");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(
      canvasElement.querySelector('[data-ui-part="code-block-line"]'),
    ).toHaveTextContent("pnpm --filter @lapis-notes/ai test");
    await expect(canvas.getByText("Process exited with code 1")).toBeVisible();
    const output = canvas.getAllByText(/FAIL ai-chat-panel\.test\.ts/);
    await expect(output[output.length - 1]).toBeVisible();
  },
};

export const FileMentions: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { requireApproval: false },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole("textbox", { name: /^Message$/ });
    await userEvent.type(input, "@alp");
    const option = await canvas.findByText("alpha");
    const menu = option.closest("[role='listbox']");
    expect(menu).toBeTruthy();
    await waitFor(() => {
      const inputBox = input.getBoundingClientRect();
      const menuBox = (menu as HTMLElement).getBoundingClientRect();
      const gap =
        menuBox.top >= inputBox.bottom - 2
          ? menuBox.top - inputBox.bottom
          : inputBox.top - menuBox.bottom;
      expect(gap).toBeGreaterThanOrEqual(-4);
      expect(gap).toBeLessThan(32);
    });
    await userEvent.click(option);
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await waitFor(() => {
      const userMessage = canvas.getByRole("article", {
        name: "Message from You",
      });
      expect(userMessage.querySelector('[role="textbox"]')).not.toBeNull();
      expect(userMessage).toHaveTextContent("Notes/alpha.md");
    });
  },
};
