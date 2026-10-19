import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import RemoteDemo from "../../support/repository/RemoteDemo.svelte";
import { historyContext } from "../../support/repository/context.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";
const meta: Meta = {
  title: "Desktop/Repository push recovery",
  component: RemoteDemo,
  args: { scenario: "pending" },
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
};
export default meta;
async function open(element: HTMLElement) {
  await waitFor(
    () =>
      expect(element.querySelector('[data-notes-ready="true"]')).not.toBeNull(),
    { timeout: 30000 },
  );
  getWorkspaceHostBinding(
    historyContext(element).app.workspace,
  ).controller.settings.open({ sectionId: "repository-history" });
  const button = await within(element).findByRole("button", {
    name: "Forge accounts and remote backup",
  });
  await waitFor(() =>
    expect(getComputedStyle(button).pointerEvents).not.toBe("none"),
  );
  await userEvent.click(button);
  const region = within(
    await within(element).findByRole("region", {
      name: "Original backup push",
    }),
  );
  return { region, body: within(element.ownerDocument.body) };
}
async function confirm(element: HTMLElement) {
  const context = await open(element);
  await userEvent.click(
    context.region.getByRole("button", { name: "Stop tracking this push" }),
  );
  const dialog = within(await context.body.findByRole("alertdialog"));
  await waitFor(() =>
    expect(dialog.getByText(/cannot cancel or undo a push/)).toBeVisible(),
  );
  return { ...context, dialog };
}
export const CheckWithoutReplay: StoryObj = {
  play: async ({ canvasElement }) => {
    const { region } = await open(canvasElement);
    await userEvent.click(
      region.getByRole("button", { name: "Check original push" }),
    );
    await waitFor(() =>
      expect(
        canvasElement.querySelector("[data-observed-push]"),
      ).toHaveAttribute("data-observed-push", "original-push"),
    );
    await waitFor(() =>
      expect(
        within(canvasElement).queryByRole("region", {
          name: "Original backup push",
        }),
      ).not.toBeInTheDocument(),
    );
    await expect(canvasElement.querySelector("[data-stopped-push]")).toBeNull();
  },
};
export const StopWithoutAccount: StoryObj = {
  args: { scenario: "pending-signed-out" },
  play: async ({ canvasElement }) => {
    const { region, dialog, body } = await confirm(canvasElement);
    await expect(
      region.getByRole("button", { name: "Check original push" }),
    ).toBeDisabled();
    await userEvent.click(
      dialog.getByRole("button", { name: "Stop tracking" }),
    );
    await waitFor(() =>
      expect(body.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    await expect(
      canvasElement.querySelector("[data-stopped-push]"),
    ).toHaveAttribute("data-stopped-push", "original-push");
  },
};
export const KeepTracking: StoryObj = {
  play: async ({ canvasElement }) => {
    const { dialog, body } = await confirm(canvasElement);
    await userEvent.click(
      dialog.getByRole("button", { name: "Keep tracking" }),
    );
    await waitFor(() =>
      expect(body.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    await expect(canvasElement.querySelector("[data-stopped-push]")).toBeNull();
    await expect(
      within(canvasElement).getByRole("region", {
        name: "Original backup push",
      }),
    ).toBeVisible();
  },
};
export const ActiveRequestAndRecovery: StoryObj = {
  args: { scenario: "pending-failed" },
  play: async ({ canvasElement }) => {
    const { dialog, body } = await confirm(canvasElement);
    await userEvent.click(
      dialog.getByRole("button", { name: "Stop tracking" }),
    );
    await expect(
      await body.findByText("Original push is still active"),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Stop tracking" }),
    ).toBeEnabled();
    await expect(canvasElement.querySelector("[data-stopped-push]")).toBeNull();
    await userEvent.click(
      dialog.getByRole("button", { name: "Stop tracking" }),
    );
    await waitFor(() =>
      expect(body.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(
        body.queryByText("Original push is still active"),
      ).not.toBeInTheDocument(),
    );
  },
};
