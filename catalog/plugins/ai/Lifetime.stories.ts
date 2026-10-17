// SPDX-License-Identifier: Apache-2.0
import { aiReviewAction, aiReviewValue } from "../../support/ai/review.ts";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor } from "storybook/test";
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
    const state = () =>
      JSON.parse(aiReviewValue(canvasElement, "Initializing chat lifetime"));
    await waitFor(() =>
      expect(state()).toEqual({ subscriptions: 1, closed: false }),
    );
    await aiReviewAction(canvasElement, "Unmount initializing chat");
    await waitFor(() =>
      expect(state()).toEqual({ subscriptions: 0, closed: true }),
    );
  },
};
