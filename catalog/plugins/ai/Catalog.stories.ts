// SPDX-License-Identifier: Apache-2.0
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import PanelDemo from "../../support/ai/PanelDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { catalogAssertions } from "../../support/ai/catalog-assertions.ts";
import {
  readyPanel,
  inspectPanel,
} from "../../support/ai/panel-interactions.ts";
const meta = {
  title: "Desktop/AI/Catalog",
  component: PanelDemo,
  args: { kind: "catalog" },
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
} satisfies Meta<typeof PanelDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const RetainedInventory: Story = {
  play: ({ canvasElement }) => catalogAssertions(canvasElement),
};
export const ToggleFailureAndRetry: Story = {
  play: async ({ canvasElement }) => {
    const panel = await readyPanel(canvasElement, "ai-catalog");
    const canvas = within(canvasElement);
    const checkbox = panel.getByRole("checkbox", {
      name: "Enable notes_search for the next chat",
    });
    await userEvent.click(
      canvas.getByRole("button", { name: "Fail next panel action" }),
    );
    await userEvent.click(checkbox);
    expect(await panel.findByRole("alert")).toHaveTextContent(
      "Fixture panel action failed",
    );
    expect(checkbox).toBeChecked();
    expect((await inspectPanel(canvasElement)).notifications).toContain(
      "Fixture panel action failed",
    );
    await userEvent.click(checkbox);
    await waitFor(() => expect(checkbox).not.toBeChecked());
    expect(panel.queryByRole("alert")).toBeNull();
    expect(
      (await inspectPanel(canvasElement)).settings.disabledAppToolNames,
    ).toContain("notes_search");
  },
};
export const LoadFailureAndRetry: Story = {
  play: async ({ canvasElement }) => {
    const panel = await readyPanel(canvasElement, "ai-catalog");
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Fail next catalog load" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Register temporary tool" }),
    );
    expect(await panel.findByRole("alert")).toHaveTextContent(
      "Fixture catalog unavailable",
    );
    expect(
      panel.getByRole("treeitem", { name: "notes_search read" }),
    ).toBeVisible();
    expect((await inspectPanel(canvasElement)).notifications).toContain(
      "Fixture catalog unavailable",
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Register temporary tool" }),
    );
    expect(
      await panel.findByRole("treeitem", { name: "temporary_2 read" }),
    ).toBeVisible();
    expect(panel.queryByRole("alert")).toBeNull();
  },
};
export const StaleRefreshAndCleanup: Story = {
  play: async ({ canvasElement }) => {
    const panel = await readyPanel(canvasElement, "ai-catalog");
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Hold next panel refresh" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Register temporary tool" }),
    );
    await waitFor(async () =>
      expect((await inspectPanel(canvasElement)).pending).toBe(true),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Register temporary tool" }),
    );
    expect(
      await panel.findByRole("treeitem", { name: "temporary_2 read" }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Release held panel refresh" }),
    );
    await waitFor(async () =>
      expect((await inspectPanel(canvasElement)).pending).toBe(false),
    );
    expect(
      panel.getByRole("treeitem", { name: "temporary_2 read" }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Hold next panel refresh" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Register temporary tool" }),
    );
    await waitFor(async () =>
      expect((await inspectPanel(canvasElement)).pending).toBe(true),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Unmount panel" }),
    );
    const before = await inspectPanel(canvasElement);
    expect(before.settingsListeners).toBe(0);
    await userEvent.click(
      canvas.getByRole("button", { name: "Register temporary tool" }),
    );
    expect((await inspectPanel(canvasElement)).catalogCalls).toBe(
      before.catalogCalls,
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Release held panel refresh" }),
    );
    await waitFor(async () =>
      expect((await inspectPanel(canvasElement)).pending).toBe(false),
    );
    expect(canvas.queryByTestId("ai-catalog")).toBeNull();
  },
};
