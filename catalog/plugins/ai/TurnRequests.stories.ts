// SPDX-License-Identifier: Apache-2.0
// Retained from lapis-plugins tree 56b5d6c1; ACP-only runtime choices.
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiChatDemo from "../../support/ai/AiChatDemo.svelte";

const meta = {
  title: "Desktop/AI/Turn requests",
  component: AiChatDemo,
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof AiChatDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const PermissionRequested: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { requireApproval: true },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole("combobox", { name: "Message" });
    await userEvent.type(input, "Apply the change");
    await userEvent.keyboard("{Enter}");
    const allow = await canvas.findByRole("button", { name: /Allow once/ });
    const drawer = allow.closest(
      '[data-ui-component="ai-chat-composer-drawer"]',
    );
    expect(drawer).not.toBeNull();
    expect(
      canvas.queryByTestId("ai-approval-card")?.closest("article"),
    ).toBeNull();
    await expect(canvas.getByTestId("ai-chat-working")).toHaveTextContent(
      "Agent is working…",
    );
  },
};

export const PermissionAccepted: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { requireApproval: true },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole("combobox", { name: "Message" });
    await userEvent.type(input, "Apply the change");
    await userEvent.keyboard("{Enter}");
    const allow = await canvas.findByRole("button", { name: /Allow once/ });
    await userEvent.click(allow);
    await waitFor(() => {
      expect(canvas.getByText(/Approval approved/i)).toBeInTheDocument();
      expect(canvas.queryByTestId("ai-chat-working")).toBeNull();
    });
  },
};

export const QuestionAsked: Story = {
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
    expect(
      option.closest('[data-ui-component="ai-chat-composer-drawer"]'),
    ).not.toBeNull();
    await expect(canvas.getByTestId("ai-chat-working")).toHaveTextContent(
      "Agent is working…",
    );
  },
};
