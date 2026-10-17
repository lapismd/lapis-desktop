import { aiReviewAction } from "../../support/ai/review.ts";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import CommandRefreshDemo from "../../support/ai/CommandRefreshDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";

const meta = {
  title: "Desktop/AI/User commands",
  component: CommandRefreshDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
} satisfies Meta<typeof CommandRefreshDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
// One-second polling plus rendering must complete within three seconds.
const observed = { timeout: 3000 };
async function ready(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const panel = within(await canvas.findByTestId("ai-catalog"));
  await userEvent.click(
    await panel.findByRole("treeitem", { name: /^\/review$/u }),
  );
  await expect(panel.getByText("Original review command")).toBeVisible();
  return canvas;
}
export const ExternalChanges: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await aiReviewAction(canvasElement, "Add external command");
    await userEvent.click(
      await canvas.findByRole("treeitem", { name: /^\/capture$/u }, observed),
    );
    await expect(
      await canvas.findByText("New external capture command", {}, observed),
    ).toBeVisible();
    await aiReviewAction(canvasElement, "Edit external command");
    await expect(
      await canvas.findByText(
        "Externally updated review command",
        {},
        observed,
      ),
    ).toBeVisible();
    await aiReviewAction(canvasElement, "Delete external command");
    await waitFor(
      () =>
        expect(canvas.queryByText("New external capture command")).toBeNull(),
      observed,
    );
  },
};
export const UnreadableRecovery: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await aiReviewAction(canvasElement, "Make commands unreadable");
    await expect(
      await canvas.findByText("Review commands are unreadable", {}, observed),
    ).toBeVisible();
    await expect(canvas.getByText("Original review command")).toBeVisible();
    await aiReviewAction(canvasElement, "Make commands readable");
    await expect(
      await canvas.findByText(
        "Recovered external review command",
        {},
        observed,
      ),
    ).toBeVisible();
  },
};
