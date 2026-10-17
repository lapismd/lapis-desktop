// SPDX-License-Identifier: Apache-2.0
// Retained from lapis-plugins tree 56b5d6c1; ACP-only runtime choices.
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import AiChatDemo from "../../support/ai/AiChatDemo.svelte";
import {
  createAppToolReadSeedItems,
  createAppToolPatchPendingSeedItems,
} from "../../support/ai/seeds-1.ts";
import { createAppToolSessionGrantSeedItems } from "../../support/ai/seeds-2.ts";

const meta = {
  title: "Desktop/AI/Application tools",
  component: AiChatDemo,
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof AiChatDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const AppToolReadTranscript: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { seedItems: createAppToolReadSeedItems() },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole("button", {
      name: "Show details for read",
    });
    await userEvent.click(trigger);
    expect(canvas.getAllByText(/Notes\/alpha\.md/).length).toBeGreaterThan(0);
    await expect(canvas.getByText(/one TODO/)).toBeVisible();
  },
};

export const AppToolPatchApproval: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: {
      seedItems: createAppToolPatchPendingSeedItems(),
      preservePending: true,
      seededHeight: "26rem",
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Notes/alpha.md")).toBeVisible();
    await expect(canvas.getByText(/--- before/)).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: /Allow once/ }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: /Allow for this session/ }),
    ).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Deny/ })).toBeVisible();
  },
};

export const AppToolSessionGrant: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { seedItems: createAppToolSessionGrantSeedItems() },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText(/Approval approved/)).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Expand 2 tool calls" }),
    );
    expect(
      canvas.getAllByRole("button", { name: "Show details for edit" }),
    ).toHaveLength(2);
    expect(canvas.queryByRole("button", { name: /Allow once/ })).toBeNull();
  },
};
