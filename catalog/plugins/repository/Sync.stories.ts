import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import SyncDemo from "../../support/repository/SyncDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { historyContext } from "../../support/repository/context.ts";
const meta: Meta = {
  title: "Desktop/Repository automatic sync",
  component: SyncDemo,
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
  const host = getWorkspaceHostBinding(
    historyContext(element).app.workspace,
  ).controller;
  host.settings.open({ sectionId: "repository-history" });
  const button = await within(element).findByRole("button", {
    name: "Forge accounts and remote backup",
  });
  await waitFor(() =>
    expect(getComputedStyle(button).pointerEvents).not.toBe("none"),
  );
  await userEvent.click(button);
  return { canvas: within(element), body: within(element.ownerDocument.body) };
}
export const CleanMergeAndPush: StoryObj = {
  play: async ({ canvasElement }) => {
    const { canvas } = await open(canvasElement);
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector("[data-sync-pushes]"),
        ).toHaveAttribute("data-sync-pushes", "1"),
      { timeout: 15000 },
    );
    await expect(canvas.getByText(/Last synchronized/)).toBeVisible();
    await userEvent.click(
      canvas.getByRole("switch", {
        name: "Synchronize the connected backup automatically",
      }),
    );
    await expect(
      canvas.getByRole("button", { name: "Sync now" }),
    ).toBeDisabled();
  },
};
export const ConflictResolution: StoryObj = {
  args: { scenario: "conflicts" },
  play: async ({ canvasElement }) => {
    const { canvas, body } = await open(canvasElement);
    const review = await canvas.findByRole(
      "button",
      { name: "Review 1 conflicts" },
      { timeout: 15000 },
    );
    await expect(
      await body.findByText(
        "Backup has conflicts. Open Backup settings to review them.",
      ),
    ).toBeVisible();
    await userEvent.click(review);
    const dialog = await body.findByLabelText(
      "Resolve backup synchronization conflicts",
      { selector: "section" },
    );
    const accept = await within(dialog).findByRole("button", {
      name: "Accept All Incoming Changes from Left",
    });
    await waitFor(() => expect(accept).toBeVisible());
    await userEvent.click(accept);
    await waitFor(() =>
      expect(
        within(dialog).getByRole("button", { name: "Save resolution" }),
      ).toBeEnabled(),
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Save resolution" }),
    );
    await waitFor(() =>
      expect(
        canvasElement.querySelector("[data-sync-resolved]"),
      ).toHaveAttribute("data-sync-resolved", "true"),
    );
    await waitFor(() =>
      expect(
        body.queryByText(
          "Backup has conflicts. Open Backup settings to review them.",
        ),
      ).not.toBeInTheDocument(),
    );
    await expect(
      canvasElement.querySelector("[data-sync-resolution]"),
    ).toHaveAttribute(
      "data-sync-resolution",
      expect.stringContaining("Local note"),
    );
    await waitFor(() =>
      expect(
        body.queryByLabelText("Resolve backup synchronization conflicts", {
          selector: "section",
        }),
      ).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(canvasElement.querySelector("[data-sync-pushes]")).toHaveAttribute(
        "data-sync-pushes",
        "1",
      ),
    );
  },
};
export const OfflineAndRecovery: StoryObj = {
  args: { scenario: "offline" },
  play: async ({ canvasElement }) => {
    const { canvas, body } = await open(canvasElement);
    await expect(
      await body.findByText(
        "Backup is offline; local history is safe",
        {},
        { timeout: 15000 },
      ),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Sync now" }));
    await waitFor(() =>
      expect(canvasElement.querySelector("[data-sync-pushes]")).toHaveAttribute(
        "data-sync-pushes",
        "1",
      ),
    );
    await waitFor(() =>
      expect(
        body.queryByText("Backup is offline; local history is safe"),
      ).not.toBeInTheDocument(),
    );
  },
};
export const BackgroundTransfer: StoryObj = {
  args: { scenario: "pending" },
  play: async ({ canvasElement }) => {
    const { canvas } = await open(canvasElement);
    await expect(
      await canvas.findByText(
        "Fetching and merging remote history…",
        {},
        { timeout: 15000 },
      ),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Sync now" }),
    ).toBeDisabled();
    await userEvent.click(
      canvas.getByRole("button", { name: "Finish remote sync" }),
    );
    await waitFor(() =>
      expect(canvasElement.querySelector("[data-sync-pushes]")).toHaveAttribute(
        "data-sync-pushes",
        "1",
      ),
    );
  },
};
export const UnknownApplyRecovery: StoryObj = {
  args: { scenario: "unknown" },
  play: async ({ canvasElement }) => {
    const { canvas, body } = await open(canvasElement);
    await expect(
      await body.findByText("Sync response was lost", {}, { timeout: 15000 }),
    ).toBeVisible();
    const original = canvasElement.querySelector<HTMLElement>(
      "[data-sync-original]",
    )!.dataset.syncOriginal;
    await userEvent.click(canvas.getByRole("button", { name: "Sync now" }));
    await waitFor(() =>
      expect(canvasElement.querySelector("[data-sync-pushes]")).toHaveAttribute(
        "data-sync-pushes",
        "1",
      ),
    );
    await expect(
      canvasElement.querySelector("[data-sync-original]"),
    ).toHaveAttribute("data-sync-original", original!);
    await expect(
      canvas.queryByRole("button", { name: "Keep current files" }),
    ).not.toBeInTheDocument();
  },
};
