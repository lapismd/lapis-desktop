import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import StorageDemo from "../../support/repository/StorageDemo.svelte";
import { historyContext } from "../../support/repository/context.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";
const meta: Meta = {
  title: "Desktop/Repository history storage",
  component: StorageDemo,
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
  const region = within(
    await within(element).findByRole("region", { name: "History storage" }),
  );
  const fixture = element.querySelector<HTMLElement>(
    "[data-repository-fixture]",
  )!;
  return { region, fixture, body: within(element.ownerDocument.body), host };
}
export const ApplicationData: StoryObj = {
  play: async ({ canvasElement }) => {
    const { region, fixture } = await open(canvasElement);
    await expect(
      await region.findByRole("radio", { name: "Application data" }),
    ).toHaveAttribute("aria-checked", "true");
    await expect(
      region.findByText(/Application Support\/Lapis\/vault-history/),
    ).resolves.toBeVisible();
    await userEvent.click(
      region.getByRole("button", { name: "Show in file manager" }),
    );
    await waitFor(() =>
      expect(fixture.dataset.revealedRepository).toContain(
        "/vault-history/project-notes/repo",
      ),
    );
    expect(fixture.dataset.storageReloads).toBeUndefined();
  },
};
export const VaultRoot: StoryObj = {
  args: { scenario: "colocated" },
  play: async ({ canvasElement }) => {
    const { region } = await open(canvasElement);
    await expect(
      await region.findByRole("radio", { name: "Vault root (.jj)" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(region.queryByText("Repository location")).toBeNull();
  },
};
export const MoveAndReload: StoryObj = {
  play: async ({ canvasElement }) => {
    const { region, fixture } = await open(canvasElement);
    await userEvent.click(
      await region.findByRole("radio", { name: "Vault root (.jj)" }),
    );
    await userEvent.click(
      await region.findByRole("button", { name: "Move history and reload" }),
    );
    await waitFor(() =>
      expect(fixture).toHaveAttribute("data-storage-location", "colocated"),
    );
    await expect(fixture).toHaveAttribute("data-storage-reloads", "1");
  },
};
export const ResumeOriginalMove: StoryObj = {
  args: { scenario: "pending" },
  play: async ({ canvasElement }) => {
    const { region, fixture } = await open(canvasElement);
    await userEvent.click(
      await region.findByRole("button", { name: "Resume move and reload" }),
    );
    await waitFor(() =>
      expect(fixture).toHaveAttribute(
        "data-recovered-request",
        "original-move",
      ),
    );
    await expect(fixture).toHaveAttribute("data-storage-reloads", "1");
  },
};
export const KeepPreviousLocation: StoryObj = {
  args: { scenario: "pending" },
  play: async ({ canvasElement }) => {
    const { region, fixture } = await open(canvasElement);
    await userEvent.click(
      await region.findByRole("button", { name: "Keep previous location" }),
    );
    await waitFor(() =>
      expect(fixture).toHaveAttribute(
        "data-rolled-back-request",
        "original-move",
      ),
    );
    await expect(fixture).toHaveAttribute("data-storage-reloads", "1");
  },
};
export const FailureAndRecovery: StoryObj = {
  args: { scenario: "failed" },
  play: async ({ canvasElement }) => {
    const { region, fixture, body } = await open(canvasElement);
    await userEvent.click(
      await region.findByRole("radio", { name: "Vault root (.jj)" }),
    );
    await userEvent.click(
      await region.findByRole("button", { name: "Move history and reload" }),
    );
    await expect(
      await body.findByText("History storage move was interrupted"),
    ).toBeVisible();
    await expect(
      region.queryByText("History storage move was interrupted"),
    ).not.toBeInTheDocument();
    const request = fixture.dataset.storageRequest;
    await userEvent.click(
      await region.findByRole("button", { name: "Resume move and reload" }),
    );
    await waitFor(() =>
      expect(fixture).toHaveAttribute("data-recovered-request", request!),
    );
    await waitFor(() =>
      expect(
        body.queryByText("History storage move was interrupted"),
      ).not.toBeInTheDocument(),
    );
  },
};
export const Loading: StoryObj = {
  args: { scenario: "loading" },
  play: async ({ canvasElement }) => {
    const { region } = await open(canvasElement);
    await expect(
      region.getByRole("status", { name: "Loading history storage" }),
    ).toBeVisible();
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: "Finish loading history storage",
      }),
    );
    await expect(
      await region.findByRole("radio", { name: "Application data" }),
    ).toBeVisible();
  },
};

export const CloseSettingsDuringMove: StoryObj = {
  args: { scenario: "moving" },
  play: async ({ canvasElement }) => {
    const { region, fixture, host } = await open(canvasElement);
    await userEvent.click(
      await region.findByRole("radio", { name: "Vault root (.jj)" }),
    );
    await userEvent.click(
      await region.findByRole("button", { name: "Move history and reload" }),
    );
    await waitFor(() => expect(fixture.dataset.storageRequest).toBeDefined());
    host.settings.close();
    // The App writer guard can defer view teardown until the admitted move
    // drains. A requested close must still preserve its reload and completion.
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: "Finish moving history storage",
      }),
    );
    await waitFor(() =>
      expect(fixture).toHaveAttribute("data-storage-reloads", "1"),
    );
    await waitFor(() =>
      expect(
        within(canvasElement).queryByRole("region", {
          name: "History storage",
        }),
      ).not.toBeInTheDocument(),
    );
  },
};
