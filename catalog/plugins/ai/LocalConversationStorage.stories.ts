import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within } from "storybook/test";
import SettingsDemo from "../../support/ai/SettingsDemo.svelte";
const meta = {
  title: "Desktop/AI/Local conversation storage",
  component: SettingsDemo,
  args: { scenario: "normal" },
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SettingsDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const LocalAcpOnly: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.findByRole("heading", { name: "AI", level: 1 }),
    ).resolves.toBeVisible();
    expect(
      canvas.queryByRole("heading", { name: "Native conversation history" }),
    ).toBeNull();
    expect(
      canvas.queryByRole("button", { name: "Conversation storage" }),
    ).toBeNull();
    for (const name of [
      "Conversation",
      "Runtime and model",
      "Memory",
      "Handoff summaries",
      "Application tools",
    ])
      expect(canvas.getByRole("heading", { name })).toBeVisible();
  },
};

export const GuardedReplacement: Story = {
  play: async () => {
    const { checkTranscriptProtection } = await import(
      "../../support/ai/transcript-protection-checks.ts"
    );
    await checkTranscriptProtection();
  },
};

export const RetiredNativeTabs: Story = {
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole("heading", { name: "AI", level: 1 });
    const { aiReviewAction } = await import("../../support/ai/review.ts");
    await aiReviewAction(canvasElement, "Verify retired conversation tabs");
  },
};
