// SPDX-License-Identifier: Apache-2.0
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import InitializingChatDemo from "../../support/ai/workspace/InitializingChatDemo.svelte";
const meta = {
  title: "Desktop/AI/Lifetime",
  component: InitializingChatDemo,
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof InitializingChatDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const UnmountDuringInitialization: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const state = () =>
      JSON.parse(
        canvas.getByLabelText("Initializing chat lifetime").textContent ?? "{}",
      );
    await waitFor(() =>
      expect(state()).toEqual({ subscriptions: 1, closed: false }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Unmount initializing chat" }),
    );
    await waitFor(() =>
      expect(state()).toEqual({ subscriptions: 0, closed: true }),
    );
  },
};
