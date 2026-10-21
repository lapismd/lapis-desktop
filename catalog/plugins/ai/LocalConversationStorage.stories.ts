import { selectSettingsTab } from "../../support/ai/settings-tabs.ts";
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
      canvas.findByRole("tablist", { name: "AI settings" }),
    ).resolves.toBeVisible();
    expect(
      canvas.queryByRole("heading", { name: "Native conversation history" }),
    ).toBeNull();
    expect(
      canvas.queryByRole("button", { name: "Conversation storage" }),
    ).toBeNull();
    for (const [tab, sections] of [
      ["Conversation", ["Conversation"]],
      ["Models", ["Runtime and model"]],
      ["Memory", ["Memory", "Handoff summaries"]],
      ["Tools", ["Application tools"]],
    ] as const) {
      await selectSettingsTab(canvasElement, "AI settings", tab);
      for (const name of sections)
        expect(canvas.getByRole("region", { name })).toBeVisible();
    }
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
    await within(canvasElement).findByRole("tablist", { name: "AI settings" });
    const { aiReviewAction } = await import("../../support/ai/review.ts");
    await aiReviewAction(canvasElement, "Verify retired conversation tabs");
  },
};
