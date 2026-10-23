import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor } from "storybook/test";
import { RepositoryPanel } from "@lapismd/repository-ui/jj";
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
    await waitFor(() => {
      const bounds = pane.getBoundingClientRect();
      const revisions = canvas
        .getByRole("region", { name: "Revisions" })
        .getBoundingClientRect();
      const comparison = canvas
        .getByRole("region", { name: "Revision changes" })
        .getBoundingClientRect();
      expect(bounds.width).toBeLessThan(640);
      const columns = canvas.getByRole("region", {
        name: "Repository history columns",
      });
      expect(columns).toHaveAttribute("data-display-mode", "compact");
      expect(columns.getBoundingClientRect().width).toBeGreaterThan(
        bounds.width - 1,
      );
      expect(revisions.width).toBeGreaterThan(bounds.width - 30);
      expect(revisions.width).toBeLessThanOrEqual(bounds.width + 1);
      expect(comparison.width).toBeLessThanOrEqual(bounds.width + 1);
      expect(comparison.top).toBeCloseTo(revisions.top, 0);
      expect(columns.scrollWidth).toBeGreaterThan(columns.clientWidth);
      expect(
        canvas.getByRole("button", { name: "Refresh" }).getBoundingClientRect()
          .right,
      ).toBeLessThanOrEqual(bounds.right + 1);
      expect(
        canvas
          .getByRole("button", { name: /^Welcome\.md(?: |$)/ })
          .getBoundingClientRect().width,
      ).toBeGreaterThan(80);
    });
  },
};
