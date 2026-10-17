import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiChatDemo from "../../support/ai/AiChatDemo.svelte";
const meta = {
  title: "Desktop/AI/Reply errors",
  component: AiChatDemo,
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof AiChatDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const PermissionReplyRejected: Story = {
  args: { requireApproval: true, rejectApproval: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      await canvas.findByRole("combobox", { name: "Message" }),
      "Update a note",
    );
    await userEvent.keyboard("{Enter}");
    await userEvent.click(
      await canvas.findByRole("button", { name: /Allow once/ }),
    );
    await waitFor(() =>
      expect(canvas.getByRole("alert")).toHaveTextContent(
        "Permission reply rejected",
      ),
    );
    await expect(canvas.getByTestId("ai-approval-card")).toBeVisible();
    await expect(canvas.queryByText(/Approval approved/)).toBeNull();
  },
};
export const QuestionReplyRejected: Story = {
  args: { requireQuestion: true, rejectQuestion: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      await canvas.findByRole("combobox", { name: "Message" }),
      "Update a note",
    );
    await userEvent.keyboard("{Enter}");
    await userEvent.click(
      await canvas.findByRole("button", { name: /Make the smallest change/ }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Submit answer" }),
    );
    await waitFor(() =>
      expect(canvas.getByRole("alert")).toHaveTextContent(
        "Question reply rejected",
      ),
    );
    await expect(canvas.getByTestId("ai-question-card")).toBeVisible();
    await expect(canvas.queryByText("Question answered")).toBeNull();
  },
};
