import type { RepositoryPlugin } from "@lapis-notes/history/repository/components/repository-plugin";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import AdoptionDemo from "../../support/repository/AdoptionDemo.svelte";
import { historyContext } from "../../support/repository/context.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { openHistory } from "../../support/repository/interactions.ts";
const meta: Meta = {
  title: "Desktop/Repository original history",
  component: AdoptionDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
};
export default meta;
async function settings(element: HTMLElement) {
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
    await within(element).findByRole("region", {
      name: "Original repository history",
    }),
  );
  const fixture = element.querySelector<HTMLElement>(
    "[data-repository-fixture]",
  )!;
  return { region, fixture, body: within(element.ownerDocument.body) };
}
export const ImportRecordedHistory: StoryObj = {
  play: async ({ canvasElement }) => {
    const { region, fixture } = await settings(canvasElement);
    await userEvent.click(
      await region.findByRole("button", { name: "Import recorded history" }),
    );
    await waitFor(() =>
      expect(fixture).toHaveAttribute("data-adoption-done", "true"),
    );
    expect(fixture.dataset.adoptionRequest).toMatch(/^[a-f0-9-]+$/);
  },
};
export const ResumeOriginalRequest: StoryObj = {
  args: { scenario: "pending" },
  play: async ({ canvasElement }) => {
    const { region, fixture } = await settings(canvasElement);
    await userEvent.click(
      await region.findByRole("button", { name: "Resume original import" }),
    );
    await waitFor(() =>
      expect(fixture).toHaveAttribute(
        "data-adoption-request",
        "original-import",
      ),
    );
  },
};
export const StopOriginalRequest: StoryObj = {
  args: { scenario: "pending" },
  play: async ({ canvasElement }) => {
    const { region, fixture } = await settings(canvasElement);
    await userEvent.click(
      await region.findByRole("button", { name: "Stop tracking import" }),
    );
    await waitFor(() =>
      expect(fixture).toHaveAttribute(
        "data-stopped-request",
        "original-import",
      ),
    );
  },
};
export const LostReplyAndRecovery: StoryObj = {
  args: { scenario: "failed" },
  play: async ({ canvasElement }) => {
    const { region, fixture, body } = await settings(canvasElement);
    await userEvent.click(
      await region.findByRole("button", { name: "Import recorded history" }),
    );
    await expect(
      await body.findByText("Original history import reply was lost"),
    ).toBeVisible();
    expect(
      region.queryByText("Original history import reply was lost"),
    ).not.toBeInTheDocument();
    const original = fixture.dataset.adoptionAttempt;
    await userEvent.click(
      await region.findByRole("button", { name: "Resume original import" }),
    );
    await waitFor(() =>
      expect(fixture).toHaveAttribute("data-adoption-request", original!),
    );
    await waitFor(() =>
      expect(
        body.queryByText("Original history import reply was lost"),
      ).not.toBeInTheDocument(),
    );
  },
};
export const Loading: StoryObj = {
  args: { scenario: "loading" },
  play: async ({ canvasElement }) => {
    const { region } = await settings(canvasElement);
    await expect(
      region.getByRole("status", { name: "Loading original history" }),
    ).toBeVisible();
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: "Finish discovering original history",
      }),
    );
    await expect(
      await region.findByRole("button", { name: "Import recorded history" }),
    ).toBeVisible();
  },
};
export const NoOriginalRepository: StoryObj = {
  args: { scenario: "none" },
  play: async ({ canvasElement }) => {
    const { region } = await settings(canvasElement);
    await expect(
      await region.findByText(
        "No separate original JJ repository was found in this vault.",
      ),
    ).toBeVisible();
  },
};
function plugin(element: HTMLElement) {
  const value =
    historyContext(element).app.plugins.plugins.get("repository-history");
  if (!value) throw new Error("Repository plugin is not loaded");
  return value as RepositoryPlugin;
}
export const SeparateLogSources: StoryObj = {
  play: async ({ canvasElement }) => {
    await openHistory(canvasElement);
    await plugin(canvasElement).open(undefined, undefined, "original");
    const workspace = getWorkspaceHostBinding(
      historyContext(canvasElement).app.workspace,
    ).controller.workspace;
    expect(
      workspace
        .getLeavesOfType("repository-history")
        .map((leaf) => leaf.viewState?.state?.source)
        .sort(),
    ).toEqual(["backup", "original"]);
    await plugin(canvasElement).open(undefined, undefined, "backup");
    expect(workspace.getLeavesOfType("repository-history")).toHaveLength(2);
    expect(
      within(canvasElement).queryByRole("button", { name: /^History source:/ }),
    ).toBeNull();
  },
};
export const SeparateOperationSources: StoryObj = {
  play: async ({ canvasElement }) => {
    await openHistory(canvasElement);
    await plugin(canvasElement).openOperations("backup");
    await plugin(canvasElement).openOperations("original");
    const leaves = getWorkspaceHostBinding(
      historyContext(canvasElement).app.workspace,
    ).controller.workspace.getLeavesOfType("repository-oplog");
    expect(leaves.map((leaf) => leaf.viewState?.state?.source).sort()).toEqual([
      "backup",
      "original",
    ]);
    expect(
      within(canvasElement).queryByRole("button", { name: /^History source:/ }),
    ).toBeNull();
  },
};
export const SourceDiscoveryFailure: StoryObj = {
  args: { scenario: "source-failure" },
  play: async ({ canvasElement }) => {
    await openHistory(canvasElement);
    const picker = plugin(canvasElement).sourcePicker("backup", () => {});
    expect(picker).toBeDefined();
    try {
      await picker!.load();
      throw new Error("Source discovery unexpectedly succeeded");
    } catch (error) {
      picker!.report(error);
    }
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByText("Original repository could not be inspected"),
    ).toBeVisible();
    expect(
      within(canvasElement).getByRole("region", { name: "Repository history" }),
    ).not.toHaveTextContent("Original repository could not be inspected");
  },
};

export const UnavailableOriginalRetainsRecovery: StoryObj = {
  args: { scenario: "unavailable" },
  play: async ({ canvasElement }) => {
    const { region, fixture, body } = await settings(canvasElement);
    await expect(
      await body.findByText(
        "Original repository history could not be inspected. Pending import recovery remains available.",
      ),
    ).toBeVisible();
    await userEvent.click(
      await region.findByRole("button", { name: "Stop tracking import" }),
    );
    await waitFor(() =>
      expect(fixture).toHaveAttribute(
        "data-stopped-request",
        "original-import",
      ),
    );
    await expect(
      await region.findByText(
        "Original history is unavailable. Refresh after the original repository is accessible again.",
      ),
    ).toBeVisible();
  },
};
