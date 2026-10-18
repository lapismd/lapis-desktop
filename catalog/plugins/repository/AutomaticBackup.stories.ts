import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import BackupDemo from "../../support/repository/BackupDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
const meta: Meta = {
  title: "Desktop/Automatic vault backup",
  component: BackupDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
};
export default meta;
async function ready(element: HTMLElement) {
  await waitFor(
    () =>
      expect(element.querySelector('[data-notes-ready="true"]')).not.toBeNull(),
    { timeout: 30_000 },
  );
  return within(element);
}
export const SavedLocally: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", {
        name: "Vault history: Saved locally",
      }),
    );
    const body = within(canvasElement.ownerDocument.body);
    const card = within(
      await body.findByRole("region", { name: "Vault history details" }),
    );
    await expect(card.getByText("Automatic vault backup")).toBeVisible();
    await expect(
      card.getByText(/external file changes are captured automatically/),
    ).toBeVisible();
    await userEvent.click(card.getByRole("button", { name: "Open in JJ Log" }));
    await expect(
      await canvas.findByRole("region", { name: "Repository history" }),
    ).toBeVisible();
  },
};
export const Saving: StoryObj = {
  args: { scenario: "saving" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Save vault checkpoint now" }),
    ).toBeDisabled();
    await userEvent.click(
      canvas.getByRole("button", { name: "Vault history: Saving locally" }),
    );
    await waitFor(async () =>
      expect(
        await within(canvasElement.ownerDocument.body).findByRole("status", {
          name: "Preparing local history",
        }),
      ).toBeVisible(),
    );
  },
};
export const ResponsiveInitialCapture: StoryObj = {
  args: { scenario: "starting" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Vault history: Saving locally" }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Finish initial backup" }),
    );
    await expect(
      await canvas.findByRole("button", {
        name: "Vault history: Saved locally",
      }),
    ).toBeVisible();
  },
};
export const FailureAndRecovery: StoryObj = {
  args: { scenario: "failed" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByText("Backup storage is unavailable"),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Save vault checkpoint now" }),
    );
    await expect(
      await canvas.findByRole("button", {
        name: "Vault history: Saved locally",
      }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        body.queryByText("Backup storage is unavailable"),
      ).not.toBeInTheDocument(),
    );
  },
};
