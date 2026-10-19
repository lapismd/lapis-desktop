import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import RemoteDemo from "../../support/repository/RemoteDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { historyContext } from "../../support/repository/context.ts";
const meta: Meta = {
  title: "Desktop/Repository remote backup",
  component: RemoteDemo,
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
  const workspace = getWorkspaceHostBinding(
    historyContext(element).app.workspace,
  ).controller;
  workspace.settings.open({ sectionId: "repository-history" });
  const region = within(
    await within(element).findByRole("region", { name: "Remote vault backup" }),
  );
  return { region, body: within(element.ownerDocument.body), workspace };
}
async function connect(region: ReturnType<typeof within>) {
  await userEvent.type(
    await region.findByLabelText("Remote repository"),
    "lapis-fixture/notes",
  );
  await userEvent.click(
    region.getByRole("button", { name: "Connect repository" }),
  );
}
async function preview(element: HTMLElement) {
  const context = await open(element);
  await userEvent.click(
    await context.region.findByRole("button", { name: "Review restore" }),
  );
  const dialog = within(await context.body.findByRole("alertdialog"));
  await waitFor(() =>
    expect(dialog.getByRole("button", { name: "Restore vault" })).toBeEnabled(),
  );
  await waitFor(() =>
    expect(
      dialog.getByText(/safety checkpoint saves all current files first/),
    ).toBeVisible(),
  );
  return { ...context, dialog };
}
export const ConnectFetchAndRestore: StoryObj = {
  play: async ({ canvasElement }) => {
    const { region, body } = await open(canvasElement);
    await connect(region);
    await expect(
      await region.findByText("lapis-fixture/notes · main"),
    ).toBeVisible();
    await userEvent.click(
      region.getByRole("button", { name: "Fetch remote history" }),
    );
    await userEvent.click(
      await region.findByRole("button", { name: "Review restore" }),
    );
    const dialog = within(await body.findByRole("alertdialog"));
    await waitFor(() =>
      expect(
        dialog.getByRole("button", { name: "Restore vault" }),
      ).toBeEnabled(),
    );
    await waitFor(() =>
      expect(
        dialog.getByText(/safety checkpoint saves all current files first/),
      ).toBeVisible(),
    );
    await userEvent.click(
      dialog.getByRole("button", { name: "Restore vault" }),
    );
    await waitFor(() =>
      expect(body.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    await expect(
      canvasElement.querySelector("[data-restored-remote]"),
    ).toHaveAttribute("data-restored-remote", "b".repeat(40));
  },
};
export const FailureAndRecovery: StoryObj = {
  args: { scenario: "failed" },
  play: async ({ canvasElement }) => {
    const { region, body } = await open(canvasElement);
    await connect(region);
    await expect(await body.findByText("Remote setup failed")).toBeVisible();
    await expect(region.getByLabelText("Remote repository")).toHaveValue(
      "lapis-fixture/notes",
    );
    await expect(
      region.queryByText("Remote setup failed"),
    ).not.toBeInTheDocument();
    await userEvent.click(
      region.getByRole("button", { name: "Connect repository" }),
    );
    await expect(
      await region.findByText("lapis-fixture/notes · main"),
    ).toBeVisible();
    await waitFor(() =>
      expect(body.queryByText("Remote setup failed")).not.toBeInTheDocument(),
    );
  },
};
export const Loading: StoryObj = {
  args: { scenario: "loading" },
  play: async ({ canvasElement }) => {
    const { region } = await open(canvasElement);
    await expect(
      region.getByRole("status", { name: "Loading remote backup" }),
    ).toBeVisible();
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: "Finish remote loading",
      }),
    );
    await expect(
      await region.findByLabelText("Remote repository"),
    ).toBeVisible();
  },
};
export const CachedBackupWithoutAccount: StoryObj = {
  args: { scenario: "signed-out" },
  play: async ({ canvasElement }) => {
    const { body, dialog } = await preview(canvasElement);
    await expect(
      within(canvasElement).getByText("Reconnect to fetch updates"),
    ).toBeVisible();
    await userEvent.click(
      dialog.getByRole("button", { name: "Restore vault" }),
    );
    await waitFor(() =>
      expect(body.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    await expect(
      canvasElement.querySelector("[data-restored-remote]"),
    ).toHaveAttribute("data-restored-remote", "b".repeat(40));
  },
};
export const Disconnect: StoryObj = {
  args: { scenario: "connected" },
  play: async ({ canvasElement }) => {
    const { region } = await open(canvasElement);
    await userEvent.click(
      await region.findByRole("button", { name: "Disconnect" }),
    );
    await expect(
      await region.findByRole("button", { name: "Connect repository" }),
    ).toBeVisible();
    await expect(
      region.queryByRole("button", { name: "Review restore" }),
    ).not.toBeInTheDocument();
  },
};
export const InterruptedRestore: StoryObj = {
  args: { scenario: "interrupted" },
  play: async ({ canvasElement }) => {
    const { body, dialog, workspace } = await preview(canvasElement);
    await userEvent.click(
      dialog.getByRole("button", { name: "Restore vault" }),
    );
    await expect(
      await body.findByText("Remote restore response was lost"),
    ).toBeVisible();
    const original = canvasElement.querySelector<HTMLElement>(
      "[data-original-request]",
    )!.dataset.originalRequest;
    await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(body.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    workspace.settings.close();
    await waitFor(() =>
      expect(
        within(canvasElement).queryByRole("region", {
          name: "Repository backup settings",
        }),
      ).not.toBeInTheDocument(),
    );
    await open(canvasElement);
    const recovery = within(await body.findByRole("alertdialog"));
    await waitFor(() =>
      expect(
        recovery.getByText(/earlier restore was interrupted/),
      ).toBeVisible(),
    );
    await userEvent.click(
      recovery.getByRole("button", { name: "Restore vault" }),
    );
    await waitFor(() =>
      expect(body.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    await expect(
      canvasElement.querySelector("[data-original-request]"),
    ).toHaveAttribute("data-original-request", original!);
    await expect(
      canvasElement.querySelector("[data-restore-calls]"),
    ).toHaveAttribute("data-restore-calls", "2");
  },
};
