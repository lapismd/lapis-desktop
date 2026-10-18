import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import RepositoryDemo from "../../support/repository/RepositoryDemo.svelte";
import { openHistory } from "../../support/repository/interactions.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";

const meta: Meta = {
  title: "Desktop/Repository header",
  component: RepositoryDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
};
export default meta;
type Story = StoryObj;

export const HistoryStartsWithColumnHeader: Story = {
  args: { scenario: "ready" },
  play: async ({ canvasElement }) => {
    const canvas = await openHistory(canvasElement);
    expect(
      canvas.queryByRole("heading", { name: "Repository history" }),
    ).toBeNull();
    const header = canvas.getByRole("group", { name: "JJ Log header" });
    expect(
      within(header).getByRole("combobox", { name: "Operation" }),
    ).toBeVisible();
    expect(
      within(header).getByRole("button", { name: "Refresh" }),
    ).toBeVisible();
    const panel = within(canvasElement).getByRole("region", {
      name: "Repository history",
    });
    expect(
      header.getBoundingClientRect().top - panel.getBoundingClientRect().top,
    ).toBeLessThanOrEqual(16);
    expect(header.scrollWidth).toBeLessThanOrEqual(header.clientWidth + 1);
  },
};

export const OperationLogStartsWithColumnHeader: Story = {
  args: { scenario: "operation-ready" },
  play: async ({ canvasElement }) => {
    const shell = within(canvasElement);
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector('[data-notes-ready="true"]'),
        ).not.toBeNull(),
      { timeout: 30_000 },
    );
    await userEvent.click(
      await shell.findByRole("button", { name: "Repository Op Log" }),
    );
    const panel = await shell.findByRole("region", {
      name: "Repository operation log",
    });
    const canvas = within(panel);
    expect(canvas.queryByRole("heading", { name: "Op Log" })).toBeNull();
    const header = canvas.getByRole("group", { name: "Op Log header" });
    expect(
      within(header).getByRole("combobox", { name: "Pinned operation" }),
    ).toBeVisible();
    expect(
      within(header).getByRole("button", { name: "Refresh" }),
    ).toBeVisible();
    expect(
      header.getBoundingClientRect().top - panel.getBoundingClientRect().top,
    ).toBeLessThanOrEqual(16);
    expect(header.scrollWidth).toBeLessThanOrEqual(header.clientWidth + 1);
  },
};
