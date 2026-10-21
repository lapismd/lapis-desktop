import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import ComputeStatusDemo from "../../support/ai/ComputeStatusDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
const meta = {
  title: "Desktop/AI compute status",
  component: ComputeStatusDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
} satisfies Meta<typeof ComputeStatusDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const StartInSettingsAndStopInFooter: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Open compute settings" }),
    );
    const body = within(canvasElement.ownerDocument.body);
    const dialog = within(await body.findByRole("dialog"));
    const start = await dialog.findByRole("button", { name: /^Start model / });
    expect(start.textContent?.trim()).toBe("");
    await userEvent.click(start);
    const stop = await dialog.findByRole("button", { name: /^Stop model / });
    expect(stop.textContent?.trim()).toBe("");
    await expect(stop).toHaveAttribute("data-variant", "destructive");
    expect(dialog.queryByRole("button", { name: /^Start model / })).toBeNull();
    await userEvent.click(
      dialog.getByRole("button", { name: "Close settings" }),
    );
    const footer = within(
      await canvas.findByRole("group", { name: "Running local model" }),
    );
    await expect(footer.getByText("Qwen3 0.6B · Q4_K_M")).toBeVisible();
    const footerStop = footer.getByRole("button", { name: /^Stop model / });
    await expect(footerStop).toHaveAttribute("data-variant", "destructive");
    await userEvent.click(footerStop);
    await waitFor(() =>
      expect(
        canvas.queryByRole("group", { name: "Running local model" }),
      ).toBeNull(),
    );
  },
};
export const RunningModel: Story = { args: { running: true } };
