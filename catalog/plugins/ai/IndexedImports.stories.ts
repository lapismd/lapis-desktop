import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import ImportReviewDemo from "../../support/ai/imports/ImportReviewDemo.svelte";
const meta = {
  title: "Desktop/AI/Indexed imports",
  component: ImportReviewDemo,
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ImportReviewDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
async function select(element: HTMLElement, harness: "Cursor" | "OpenCode") {
  const canvas = within(element);
  await userEvent.click(
    await canvas.findByRole("button", { name: new RegExp(`^${harness}`) }),
  );
  const nav = within(
    await canvas.findByRole("navigation", {
      name: `${harness} project folders`,
    }),
  );
  await userEvent.click(nav.getByRole("button", { name: "Notes" }));
  await userEvent.click(
    await nav.findByRole("button", { name: /^Weekly review/ }),
  );
  await expect(
    canvas.findByText("A focused weekly review"),
  ).resolves.toBeVisible();
  await expect(
    canvas.getByRole("button", { name: "Import snapshot" }),
  ).toBeEnabled();
  await userEvent.click(
    canvas.getByRole("button", { name: "Import snapshot" }),
  );
  await expect(
    canvas.findByText("Snapshot saved locally."),
  ).resolves.toBeVisible();
}
export const Cursor: Story = {
  play: async ({ canvasElement }) => select(canvasElement, "Cursor"),
};
export const OpenCode: Story = {
  play: async ({ canvasElement }) => select(canvasElement, "OpenCode"),
};
export const ProgressivePreview: Story = {
  args: { scenario: "streaming", sessionLayout: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Pause transcript loading" }),
    );
    await expect(
      canvas.getByRole("button", { name: "Import snapshot" }),
    ).toBeDisabled();
    await userEvent.click(
      canvas.getByRole("button", { name: "Resume transcript loading" }),
    );
    await waitFor(
      () =>
        expect(
          canvas.getByRole("button", { name: "Import snapshot" }),
        ).toBeEnabled(),
      { timeout: 12000 },
    );
    await expect(
      canvas.findByText("A focused weekly review"),
    ).resolves.toBeVisible();
  },
};
