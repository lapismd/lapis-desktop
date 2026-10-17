import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within } from "storybook/test";
import ShellStartup from "../../../src/components/views/ShellStartup.svelte";

const meta = {
  title: "Desktop/Initial shell loading",
  component: ShellStartup,
  parameters: { layout: "fullscreen" },
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof ShellStartup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const LoadingShell: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("progressbar", { name: "Startup progress" }),
    ).toBeVisible();
    for (const label of canvas.getAllByText("Load the desktop shell"))
      await expect(label).toBeVisible();
    await expect(
      canvasElement.querySelector(
        '[data-ui-component="desktop-workspace-startup"][data-ui-part="logo"]',
      ),
    ).toBeVisible();
  },
};
export const FailedShell: Story = {
  args: { error: "The native desktop handshake is unavailable." },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "The native desktop handshake is unavailable.",
    );
    await expect(canvas.getByText("Could not start Lapis Notes")).toBeVisible();
    await expect(
      canvasElement.querySelector('[data-ui-part="failure-summary"]'),
    ).toHaveTextContent("Load the desktop shell");
    await expect(
      canvasElement.querySelector('[data-ui-component="workspace-startup"]'),
    ).toHaveAttribute("data-state", "failed");
  },
};
