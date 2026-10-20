import type { Meta, StoryObj } from "@storybook/svelte-vite";
import TranscriptReviewDemo from "../../support/ai/transcript/TranscriptReviewDemo.svelte";
import { userEvent, within } from "storybook/test";
import { agentMentionToken } from "@lapismd/jj-conversations";

const meta = {
  title: "Desktop/AI/Agent setup review",
  component: TranscriptReviewDemo,
  args: { scenario: "addressed", embeddedShell: true },
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TranscriptReviewDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const AgentsAndMentions: Story = {};
export const InlineTagsAndFollowUps: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Inline removable agent and resource tags in the shared editor. Send a simulated message to review automatic follow-up tags, or use @ to change the preference. No live provider is connected.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const editor = await within(canvasElement).findByRole("textbox", {
      name: "Message",
    });
    await userEvent.click(editor);
    const draft = `Ask ${agentMentionToken("reviewer")} to review @Notes/alpha.md with [Alex Morgan](lapis://people/review-alex) and [the backup guide](https://lapis.md/docs/backup). `;
    await userEvent.type(
      editor,
      draft.replaceAll("[", "[[").replaceAll("{", "{{"),
    );
  },
};
