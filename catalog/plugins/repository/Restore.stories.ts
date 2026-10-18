import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import RestoreDemo from "../../support/repository/RestoreDemo.svelte";
import { openHistoryFile } from "../../support/repository/interactions.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";
const meta: Meta = {
  title: "Desktop/Repository restore",
  component: RestoreDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
};
export default meta;
async function open(element: HTMLElement) {
  const panel = await openHistoryFile(element);
  await userEvent.click(
    await panel.findByRole("button", { name: "Restore this file version" }),
  );
  const body = within(element.ownerDocument.body);
  const dialog = within(await body.findByRole("alertdialog"));
  await waitFor(() =>
    expect(
      dialog.getByText(/safety checkpoint saves your current files/),
    ).toBeVisible(),
  );
  return { body, dialog };
}
export const SafetyCheckpoint: StoryObj = {
  play: async ({ canvasElement }) => {
    const { body, dialog } = await open(canvasElement);
    await userEvent.click(dialog.getByRole("button", { name: "Restore file" }));
    await waitFor(() =>
      expect(body.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    await expect(
      canvasElement.querySelector("[data-restored-file]"),
    ).toHaveAttribute("data-restored-file", "Welcome.md");
  },
};
export const LostResponseAndRetry: StoryObj = {
  args: { scenario: "failed" },
  play: async ({ canvasElement }) => {
    const { body, dialog } = await open(canvasElement);
    await userEvent.click(dialog.getByRole("button", { name: "Restore file" }));
    await expect(
      await body.findByText("Restore response was lost"),
    ).toBeVisible();
    await userEvent.click(dialog.getByRole("button", { name: "Restore file" }));
    await waitFor(() =>
      expect(body.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(
        body.queryByText("Restore response was lost"),
      ).not.toBeInTheDocument(),
    );
  },
};
