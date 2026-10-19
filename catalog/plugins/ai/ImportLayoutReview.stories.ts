import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import ImportReviewDemo from "../../support/ai/imports/ImportReviewDemo.svelte";
const meta = {
  title: "Desktop/AI/Import layout review",
  component: ImportReviewDemo,
  args: { sessionLayout: true },
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ImportReviewDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SessionPreview: Story = {};
export const ImportAndDeduplicate: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.findByText("A focused weekly review"),
    ).resolves.toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Import snapshot" }),
    );
    await expect(
      canvas.findByText("Snapshot saved locally."),
    ).resolves.toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Check saved snapshot" }),
    );
    await expect(
      canvas.findByText("This snapshot is already saved."),
    ).resolves.toBeVisible();
  },
};
export const LoadingSources: Story = { args: { scenario: "loading" } };
export const NoSources: Story = { args: { scenario: "empty" } };
export const UnavailableHost: Story = { args: { scenario: "unavailable" } };
