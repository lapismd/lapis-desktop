import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import RepositoryDemo from "../../support/repository/RepositoryDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import {
  openHistory,
  openHistoryFile,
} from "../../support/repository/interactions.ts";

const meta: Meta = {
  title: "Desktop/Repository loading",
  component: RepositoryDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
};
export default meta;

async function operation(element: HTMLElement) {
  const canvas = within(element);
  await waitFor(() =>
    expect(element.querySelector('[data-notes-ready="true"]')).not.toBeNull(),
  );
  await userEvent.click(
    await canvas.findByRole("button", { name: "Repository Op Log" }),
  );
  return within(
    await canvas.findByRole("region", { name: "Repository operation log" }),
  );
}
export const OpLog: StoryObj = {
  args: { scenario: "preparing" },
  play: async ({ canvasElement }) => {
    const view = await operation(canvasElement);
    await expect(
      await view.findByRole("status", { name: "Preparing operation log…" }),
    ).toBeVisible();
  },
};
export const OperationDetails: StoryObj = {
  args: { scenario: "operation-details-preparing" },
  play: async ({ canvasElement }) => {
    const view = await operation(canvasElement);
    await userEvent.click(
      await view.findByRole("button", { name: /describe commit.*;/ }),
    );
    await expect(
      await view.findByRole("status", { name: "Loading operation details…" }),
    ).toBeVisible();
  },
};
export const ChangedFiles: StoryObj = {
  args: { scenario: "files-preparing" },
  play: async ({ canvasElement }) => {
    const view = await openHistory(canvasElement);
    await userEvent.click(
      await view.findByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    );
    await expect(
      await view.findByRole("status", { name: "Loading changed files…" }),
    ).toBeVisible();
  },
};
export const FileDiff: StoryObj = {
  args: { scenario: "diff-preparing" },
  play: async ({ canvasElement }) => {
    const view = await openHistoryFile(canvasElement);
    await expect(
      await view.findByRole("status", { name: "Loading file changes…" }),
    ).toBeVisible();
  },
};
export const Conflicts: StoryObj = {
  args: { scenario: "conflicts-preparing" },
  play: async ({ canvasElement }) => {
    const view = await openHistory(canvasElement);
    await userEvent.click(
      await view.findByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    );
    await userEvent.click(
      await view.findByRole("button", { name: "Resolve conflicts" }),
    );
    await expect(
      await within(canvasElement.ownerDocument.body).findByRole("status", {
        name: "Loading native conflict details…",
      }),
    ).toBeVisible();
  },
};
