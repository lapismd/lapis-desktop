// SPDX-License-Identifier: Apache-2.0
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor, within } from "storybook/test";
import AiWorkspaceDemo from "../../support/ai/workspace/AiWorkspaceDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { aiWorkspaceFixture } from "../../support/ai/workspace/fixture.ts";
const meta = {
  title: "Desktop/AI/Plugin",
  component: AiWorkspaceDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
} satisfies Meta<typeof AiWorkspaceDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const OwnedViews: Story = {
  args: { kind: "ai-history", layout: "right-sidebar" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("ai-workspace-demo")).toHaveAttribute(
        "data-status",
        "ready",
      ),
    );
    expect(
      await canvas.findByRole("tree", { name: "Conversation history" }),
    ).toBeVisible();
    expect(
      await canvas.findByRole("button", { name: /^Summarize project notes/ }),
    ).toBeVisible();
  },
};
export const ClosedScopeRejectsNewWork: Story = {
  args: { kind: "ai-history", layout: "right-sidebar" },
  play: async ({ canvasElement }) => {
    const fixture = aiWorkspaceFixture(canvasElement);
    await fixture.ready;
    expect(
      await within(canvasElement).findByRole("tree", {
        name: "Conversation history",
      }),
    ).toBeVisible();
    const host = fixture.plugin()!.application;
    const entries = await host.conversations.listAll();
    const settings = host.getSettings();
    await host.close();
    await fixture.app.workspace.flushLayout();
    const layout = JSON.stringify(fixture.app.workspace.getLayout());
    const attempts = await Promise.allSettled([
      host.createAiConversation("Notes"),
      host.openAiConversation(entries[0].location),
      host.revealAiCatalog(),
      host.updateSettings({ thinking: "high" }),
    ]);
    expect(attempts.map((result) => result.status)).toEqual([
      "rejected",
      "rejected",
      "rejected",
      "rejected",
    ]);
    expect(await host.conversations.listAll()).toEqual(entries);
    expect(JSON.stringify(fixture.app.workspace.getLayout())).toBe(layout);
    expect(host.getSettings()).toEqual(settings);
  },
};
