// SPDX-License-Identifier: Apache-2.0
// Retained Shell.Mobile play from lapis-plugins ee20d366.
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { WorkspaceShell } from "@lapis-notes/workspace";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiShellDemo from "../../../support/ai/shell/AiShellDemo.svelte";
import { demoApp } from "../../../support/ai/shell/assertions.ts";
import { shellParameters } from "../../../support/ai/shell/examples.ts";
import { cleanupCatalog } from "../../../support/lifecycle.ts";
const meta = {
  title: "Desktop/AI/Shell/Mobile",
  component: WorkspaceShell,
  tags: ["visual-pending", "autodocs"],
  beforeEach: () => cleanupCatalog,
  argTypes: { app: { control: false } },
  parameters: shellParameters("default", "mobile"),
} satisfies Meta<typeof WorkspaceShell>;
export default meta;
type Story = StoryObj<typeof AiShellDemo>;
export const Mobile: Story = {
  render: () => ({
    Component: AiShellDemo,
    props: { scenario: "default", displayMode: "mobile" },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("ai-shell-demo")).toHaveAttribute(
        "data-status",
        "ready",
      ),
    );
    const app = demoApp(canvasElement);
    expect(app.plugins.isPluginEnabled("ai")).toBe(true);
    expect(app.plugins.isPluginEnabled("lapis-file-explorer")).toBe(true);
    expect(app.plugins.isPluginEnabled("search")).toBe(true);
    expect(app.workspace.rightSplit.collapsed).toBe(true);
    await expect(canvas.getByTestId("ai-chat-panel")).toBeVisible();
    const dock = within(
      canvas.getByRole("navigation", { name: "Mobile workspace dock" }),
    );
    const openTabs = dock.getByRole("button", {
      name: /^Open [1-9]\d* tabs$/u,
    });
    await expect(openTabs).toBeVisible();
    await userEvent.click(openTabs);
    const tabs = canvas.getByRole("region", { name: "Open workspace tabs" });
    await expect(tabs).toBeVisible();
    await userEvent.click(within(tabs).getByRole("button", { name: "Done" }));
    await expect(
      within(
        canvas.getByRole("navigation", { name: "Mobile workspace dock" }),
      ).getByRole("button", { name: /^Open [1-9]\d* tabs$/u }),
    ).toBeVisible();
  },
};
