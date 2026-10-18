import { reviewInlineFooter } from "../../support/ai/transcript/footer-review.ts";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import DesignCoreReferenceDemo from "../../support/ai/transcript/DesignCoreReferenceDemo.svelte";

const meta = {
  title: "Desktop/AI/Design Core reference",
  component: DesignCoreReferenceDemo,
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DesignCoreReferenceDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const DocumentConversation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("group", { name: /^Message\ actions$/ });
    await reviewInlineFooter(canvasElement);
    await expect(
      canvas.findByRole("log", { name: "Conversation messages" }),
    ).resolves.toBeVisible();
    await expect(canvas.getByText(/Recorded Delta session/)).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Document" }),
    ).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Classic" }));
    await expect(
      canvas.getByRole("button", { name: "Classic" }),
    ).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Document" }));
    await userEvent.click(canvas.getByRole("button", { name: "Stop agent" }));
    await expect(canvas.getByText("Agent stopped")).toBeVisible();
  },
};
export const ClassicConversation: Story = { args: { initialView: "classic" } };
export const StandaloneConversation: Story = {
  args: { showShell: false },
  parameters: { layout: "padded" },
};
