import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import { agentMentionToken } from "@lapismd/jj-conversations";
import TranscriptReviewDemo from "../../support/ai/transcript/TranscriptReviewDemo.svelte";
const meta = {
  title: "Desktop/AI/Agent header",
  component: TranscriptReviewDemo,
  args: { scenario: "addressed", embeddedShell: true },
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TranscriptReviewDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ParticipantAvatars: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editor = await canvas.findByRole("textbox", { name: "Message" });
    const group = await canvas.findByRole("group", { name: "Chat agents" });
    await userEvent.type(
      editor,
      `${agentMentionToken("reviewer")} ${agentMentionToken("writer")} Review together. `
        .replaceAll("[", "[[")
        .replaceAll("{", "{{"),
    );
    await expect(
      await within(group).findByRole("button", { name: /^About Reviewer/ }),
    ).toBeVisible();
    await expect(
      await within(group).findByRole("button", { name: /^About Writer/ }),
    ).toBeVisible();
  },
};
