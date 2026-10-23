import { findMessageEditor } from "../../support/ai/message-editor.ts";
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
    const input = await findMessageEditor(canvas);
    await userEvent.type(input, "Apply the change");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    const allow = await canvas.findByRole("button", {
      name: "Allow once",
    });
    const drawer = allow.closest(
      '[role="group"][aria-label="Permission request"]',
    );
    expect(drawer).not.toBeNull();
    expect(
      canvas.queryByTestId("ai-approval-card")?.closest("article"),
    ).toBeNull();
    await expect(canvas.getByText("Agent is working…")).toBeVisible();
  },
};

export const PermissionAccepted: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { requireApproval: true },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await findMessageEditor(canvas);
    await userEvent.type(input, "Apply the change");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    const allow = await canvas.findByRole("button", {
      name: "Allow once",
    });
    await userEvent.click(allow);
    await userEvent.click(
      await canvas.findByRole("button", { name: /^Permission granted:/ }),
    );
    await waitFor(() => {
      expect(canvas.getByTestId("ai-approval-card")).toHaveAttribute(
        "data-state",
        "approved",
      );
      expect(canvas.queryByText("Agent is working…")).toBeNull();
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
    const input = await findMessageEditor(canvas);
    await userEvent.type(input, "Update the sample file");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    const option = await canvas.findByRole("radio", {
      name: /Make the smallest change/,
    });
    expect(option.closest('[data-testid="ai-question-card"]')).not.toBeNull();
    await expect(canvas.getByText("Agent is working…")).toBeVisible();
  },
};
