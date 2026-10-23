import { findMessageEditor } from "../../support/ai/message-editor.ts";
import { expandTranscriptActivity } from "../../support/ai/transcript/interactions.ts";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiChatDemo from "../../support/ai/AiChatDemo.svelte";
const meta = {
  title: "Desktop/AI/Cancellation",
  component: AiChatDemo,
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof AiChatDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const PendingPermission: Story = {
  args: { requireApproval: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await findMessageEditor(canvas);
    await userEvent.type(input, "Update a note");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await canvas.findByTestId("ai-approval-card");
    await userEvent.click(canvas.getByRole("button", { name: /Stop/ }));
    await waitFor(() =>
      expect(canvas.queryByTestId("ai-approval-card")).toBeNull(),
    );
    await expandTranscriptActivity(canvasElement);
    await expect(canvas.getByText("Agent turn cancelled")).toBeVisible();
    await expect(canvas.queryByTestId("ai-approval-card")).toBeNull();
    await expect(canvas.queryByTestId("ai-chat-working")).toBeNull();
    await expect(canvas.getByText("Permission cancelled")).toBeVisible();
  },
};
