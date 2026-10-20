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
