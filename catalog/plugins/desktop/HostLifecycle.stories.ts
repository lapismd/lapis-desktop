import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within } from "storybook/test";
import { WorkspaceShell } from "@lapis-notes/workspace";
import HostLifecycleDemo from "../../support/desktop/HostLifecycleDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";

const meta = {
  title: "Desktop/Shell lifecycle",
  component: WorkspaceShell,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
} satisfies Meta<typeof WorkspaceShell>;
export default meta;
type Story = StoryObj<typeof HostLifecycleDemo>;

export const ReadySessionFailure: Story = {
  render: () => ({ Component: HostLifecycleDemo }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const problems = await canvas.findByRole(
      "region",
      { name: "Problems" },
      { timeout: 15000 },
    );
    await expect(problems).toHaveTextContent("Your session remains available");
    expect(canvasElement.querySelector(".desktop-failure")).toBeNull();
    const toast =
      canvasElement.querySelector(
        '[data-ui-component="workspace-notification-toasts"] [data-ui-part="toast"][role="alert"]',
      ) ??
      canvasElement.ownerDocument.querySelector(
        '[data-ui-component="workspace-notification-toasts"] [data-ui-part="toast"][role="alert"]',
      );
    expect(toast).not.toBeNull();
    await expect(toast!).toHaveTextContent("Your session remains available");
  },
};
