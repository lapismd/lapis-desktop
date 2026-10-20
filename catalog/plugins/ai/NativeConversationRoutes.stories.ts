import type { Meta, StoryObj } from "@storybook/svelte-vite";
import NativeRouteDemo from "../../support/ai/native/NativeRouteDemo.svelte";
import { expect, within } from "storybook/test";

const meta = {
  title: "Desktop/AI/Native conversation routes",
  component: NativeRouteDemo,
  args: { scenario: "restored" },
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NativeRouteDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const RestoredNativeTab: Story = {};
export const NativeHistoryCatalog: Story = {
  args: { scenario: "native-catalog" },
};
export const ForeignReference: Story = { args: { scenario: "foreign" } };
export const NormalAcpAndNativeHistory: Story = {
  args: { scenario: "with-acp" },
};
export const NativeLiveComposer: Story = {
  args: { scenario: "live" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("textbox", { name: "Message" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("combobox", { name: "Tag people or agents" }),
    ).toBeVisible();
  },
};
