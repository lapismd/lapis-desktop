import { expect, userEvent, within, waitFor } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import TranscriptReviewDemo from "../../support/ai/transcript/TranscriptReviewDemo.svelte";
const meta = {
  title: "Desktop/AI/Local ACP conversations",
  component: TranscriptReviewDemo,
  args: { scenario: "addressed", embeddedShell: true },
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TranscriptReviewDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const AgentsAndLocalHistory: Story = {};
export const ApprovalsAndCancellation: Story = {
  args: { scenario: "addressed-approval" },
};

export const PermissionsInFooter: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const button = await canvas.findByRole("button", { name: /^Permissions:/ });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);
    await waitFor(() =>
      expect(
        body.getByRole("option", { name: /^Use agent default/ }),
      ).toBeVisible(),
    );
    const edit = await body.findByRole("option", { name: /Workspace edits/ });
    await userEvent.click(edit);
    expect(
      await canvas.findByRole("button", {
        name: "Permissions: Workspace edits",
      }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", {
        name: /^(?:Classic|Switch to Classic view)$/,
      }),
    );
    expect(
      await canvas.findByRole("button", {
        name: "Permissions: Workspace edits",
      }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", {
        name: /^(?:Document|Switch to Document view)$/,
      }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Permissions: Workspace edits" }),
    );
  },
};
