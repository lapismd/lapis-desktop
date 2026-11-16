import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import RepositoryPanel from "@lapis-notes/history/repository/components/RepositoryPanel.svelte";
import RepositoryDemo from "../../support/repository/RepositoryDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { openHistoryFile } from "../../support/repository/interactions.ts";

const meta: Meta = {
  title: "Desktop/Repository history",
  component: RepositoryPanel,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
  render: () => ({ Component: RepositoryDemo, props: { maxWidth: 800 } }),
};
export default meta;

export const NarrowPaneInWideShell: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = await openHistoryFile(canvasElement);
    await canvas.findByRole("region", { name: "Changes to Welcome.md" });
    const pane = canvasElement.querySelector<HTMLElement>(".repository-panel")!;
    const columns = canvas.getByRole("region", {
      name: "Repository history columns",
    });
    await waitFor(() => {
      const bounds = pane.getBoundingClientRect();
      const comparison = canvas
        .getByRole("region", { name: "Revision changes" })
        .getBoundingClientRect();
      expect(bounds.width).toBeLessThan(640);
      expect(columns).toHaveAttribute("data-display-mode", "compact");
      expect(comparison.width).toBeGreaterThan(0);
      expect(comparison.left).toBeGreaterThanOrEqual(bounds.left);
      expect(comparison.right).toBeLessThanOrEqual(bounds.right + 1);
      expect(columns.scrollWidth).toBeGreaterThan(columns.clientWidth);
    });
    columns.focus();
    await expect(columns).toHaveFocus();
    await userEvent.keyboard("{Home}");
    await expect(
      canvas.getByRole("list", { name: "Revision graph" }),
    ).toBeVisible();
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Refresh" })).toBeVisible(),
    );
    await waitFor(() => {
      const revisions = canvas
        .getByRole("region", { name: "Revisions" })
        .getBoundingClientRect();
      const refresh = canvas
        .getByRole("button", { name: "Refresh" })
        .getBoundingClientRect();
      expect(refresh.right).toBeLessThanOrEqual(revisions.right + 1);
      expect(refresh.right).toBeLessThanOrEqual(
        pane.getBoundingClientRect().right + 1,
      );
    });
    expect(
      canvas
        .getByRole("button", { name: /^Welcome\.md(?: |$)/ })
        .getBoundingClientRect().width,
    ).toBeGreaterThan(80);
  },
};
