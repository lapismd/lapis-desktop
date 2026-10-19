import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import RestoreDemo from "../../support/repository/RestoreDemo.svelte";
import {
  openHistory,
  openHistoryFile,
} from "../../support/repository/interactions.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { historyContext } from "../../support/repository/context.ts";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
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
export const WholeVaultSafetyCheckpoint: StoryObj = {
  play: async ({ canvasElement }) => {
    const panel = await openHistory(canvasElement);
    await userEvent.click(
      await panel.findByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    );
    await userEvent.click(
      await panel.findByRole("button", { name: "Restore vault…" }),
    );
    const body = within(canvasElement.ownerDocument.body);
    const dialog = within(await body.findByRole("alertdialog"));
    await waitFor(() =>
      expect(
        dialog.getByText(/2 files added, 3 changed and 1 removed/),
      ).toBeVisible(),
    );
    await userEvent.click(
      dialog.getByRole("button", { name: "Restore vault" }),
    );
    await waitFor(() =>
      expect(body.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    await expect(
      canvasElement.querySelector("[data-restored-checkpoint]"),
    ).not.toBeNull();
  },
};
async function recover(element: HTMLElement) {
  const { body, dialog } = await open(element);
  await userEvent.click(dialog.getByRole("button", { name: "Restore file" }));
  await expect(
    await body.findByText("Restore response was lost"),
  ).toBeVisible();
  await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));
  await waitFor(() =>
    expect(body.queryByRole("alertdialog")).not.toBeInTheDocument(),
  );
  const workspace = getWorkspaceHostBinding(
    historyContext(element).app.workspace,
  ).controller.workspace;
  await expect(
    workspace.closeLeaf(workspace.getLeavesOfType("repository-history")[0]),
  ).toBe(true);
  await waitFor(() =>
    expect(
      within(element).queryByRole("region", {
        name: "Repository history",
      }),
    ).not.toBeInTheDocument(),
  );
  const historyButton = within(element).getByRole("button", {
    name: "Repository History",
  });
  await waitFor(() =>
    expect(getComputedStyle(historyButton).pointerEvents).not.toBe("none"),
  );
  await userEvent.click(historyButton);
  const recovery = within(await body.findByRole("alertdialog"));
  await waitFor(() =>
    expect(recovery.getByText(/earlier restore was interrupted/)).toBeVisible(),
  );
  return { body, recovery };
}
export const InterruptedRestore: StoryObj = {
  args: { scenario: "failed" },
  play: async ({ canvasElement }) => {
    const { body, recovery } = await recover(canvasElement);
    await userEvent.click(
      recovery.getByRole("button", { name: "Restore file" }),
    );
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
export const KeepCurrentFiles: StoryObj = {
  args: { scenario: "failed" },
  play: async ({ canvasElement }) => {
    const { body, recovery } = await recover(canvasElement);
    await userEvent.click(
      recovery.getByRole("button", { name: "Keep current files" }),
    );
    await waitFor(() =>
      expect(body.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    await expect(
      canvasElement.querySelector("[data-kept-current]"),
    ).toHaveAttribute("data-kept-current", "true");
    await waitFor(() =>
      expect(
        body.queryByText("Restore response was lost"),
      ).not.toBeInTheDocument(),
    );
  },
};
