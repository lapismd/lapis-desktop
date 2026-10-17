// SPDX-License-Identifier: Apache-2.0
// Retained Shell.Recovery play from lapis-plugins ee20d366.
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { WorkspaceShell } from "@lapis-notes/workspace";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiShellDemo from "../../../support/ai/shell/AiShellDemo.svelte";
import { shellParameters } from "../../../support/ai/shell/examples.ts";
import { cleanupCatalog } from "../../../support/lifecycle.ts";
const meta = {
  title: "Desktop/AI/Shell/Recovery",
  component: WorkspaceShell,
  tags: ["visual-pending", "autodocs"],
  beforeEach: () => cleanupCatalog,
  argTypes: { app: { control: false } },
  parameters: shellParameters("recovery", "desktop"),
} satisfies Meta<typeof WorkspaceShell>;
export default meta;
type Story = StoryObj<typeof AiShellDemo>;
export const Recovery: Story = {
  render: () => ({
    Component: AiShellDemo,
    props: { scenario: "recovery", displayMode: "desktop" },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("ai-shell-demo")).toHaveAttribute(
        "data-status",
        "ready",
      ),
    );
    const panel = await canvas.findByTestId("ai-chat-panel");
    expect(panel.getBoundingClientRect().height).toBeGreaterThan(500);
    await expect(
      await within(panel).findByText(
        "The durable response remains available offline.",
        {},
        { timeout: 8_000 },
      ),
    ).toBeVisible();
    await expect(
      await within(panel).findByText(
        "Agent host restarted before the turn completed.",
      ),
    ).toBeVisible();
    await expect(
      within(panel).getByRole("button", { name: "Retry message" }),
    ).toBeEnabled();
    await expect(
      await within(panel).findByText(
        /Could not resume the previous agent session/u,
      ),
    ).toBeVisible();
  },
};
