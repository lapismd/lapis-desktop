// SPDX-License-Identifier: Apache-2.0
// Retained Shell.ImmediateInitializingComposer play from lapis-plugins ee20d366.
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { WorkspaceShell } from "@lapis-notes/workspace";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiShellDemo from "../../../support/ai/shell/AiShellDemo.svelte";
import { releaseAiInitialization } from "../../../support/ai/shell/assertions.ts";
import { shellParameters } from "../../../support/ai/shell/examples.ts";
import { cleanupCatalog } from "../../../support/lifecycle.ts";
const meta = {
  title: "Desktop/AI/Shell/ImmediateInitializingComposer",
  component: WorkspaceShell,
  tags: ["visual-pending", "autodocs"],
  beforeEach: () => cleanupCatalog,
  argTypes: { app: { control: false } },
  parameters: shellParameters("initializing", "desktop"),
} satisfies Meta<typeof WorkspaceShell>;
export default meta;
type Story = StoryObj<typeof AiShellDemo>;
export const ImmediateInitializingComposer: Story = {
  render: () => ({
    Component: AiShellDemo,
    props: { scenario: "initializing", displayMode: "desktop" },
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
    const composer = within(panel).getByRole("combobox", { name: "Message" });
    expect(panel).toHaveAttribute("data-initializing", "true");
    await expect(
      within(panel).getByRole("status", { name: "" }),
    ).toHaveTextContent("Preparing AI…");
    await expect(composer).toHaveAttribute("aria-disabled", "true");
    await expect(composer).toHaveAttribute("contenteditable", "false");
    await expect(
      within(panel).getByRole("button", { name: "Effort and model" }),
    ).toBeDisabled();

    releaseAiInitialization(canvasElement);
    await waitFor(() => {
      expect(panel).toHaveAttribute("data-initializing", "false");
      expect(composer).toHaveAttribute("aria-disabled", "false");
      expect(composer).toHaveAttribute("contenteditable", "true");
    });
  },
};
