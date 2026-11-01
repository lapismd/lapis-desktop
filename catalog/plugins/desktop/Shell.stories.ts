import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within } from "storybook/test";
import Shell from "../../../src/components/views/Shell.svelte";
import ShellDemo from "../../support/desktop/ShellDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";

const meta: Meta = {
  title: "Desktop/Shell lifecycle",
  component: Shell,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
  render: (_args, { parameters }) => ({
    Component: ShellDemo,
    props: { scenario: parameters.scenario },
  }),
};
export default meta;
type Story = StoryObj;

async function launcherAlert(canvasElement: HTMLElement, text: string) {
  const canvas = within(canvasElement);
  const alert = await canvas.findByRole("alert");
  expect(alert.closest("[data-desktop-vault-launcher]")).not.toBeNull();
  expect(canvasElement.querySelector(".desktop-failure")).toBeNull();
  await expect(alert).toHaveTextContent(text);
  await expect(
    canvas.getByRole("button", { name: /^Open Vault/ }),
  ).toBeEnabled();
}

export const RestoringProfile: Story = {
  parameters: { scenario: "restoring" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("progressbar", { name: "Startup progress" }),
    ).toBeVisible();
    for (const label of canvas.getAllByText("Restore your notes"))
      await expect(label).toBeVisible();
  },
};
export const MissingSavedVault: Story = {
  play: async ({ canvasElement }) => {
    await launcherAlert(canvasElement, "The saved vault folder has moved");
  },
};
export const BlockedClose: Story = {
  parameters: { scenario: "leave-failed" },
  play: async ({ canvasElement }) => {
    await launcherAlert(canvasElement, "Your session remains available");
  },
};
