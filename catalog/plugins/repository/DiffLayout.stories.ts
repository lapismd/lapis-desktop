import { chooseChangedRevision } from "../../support/repository/picker-interactions.ts";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import RepositoryDemo from "../../support/repository/RepositoryDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { openHistoryFile } from "../../support/repository/interactions.ts";
const meta: Meta = {
  title: "Desktop/Repository diff layout",
  component: RepositoryDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
};
export default meta;

async function fillsColumn(log: ReturnType<typeof within>) {
  const column = log.getByRole("region", { name: "Revision changes" });
  const diff = await log.findByRole("region", {
    name: "Changes to Welcome.md",
  });
  await waitFor(() => {
    expect(diff.getBoundingClientRect().height).toBeGreaterThan(180);
    expect(
      Math.abs(
        diff.getBoundingClientRect().bottom -
          column.getBoundingClientRect().bottom,
      ),
    ).toBeLessThan(3);
    for (const name of ["Previous revision", "Later revision"]) {
      const pane = log.getByRole("region", { name });
      expect(
        Math.abs(
          pane.getBoundingClientRect().height -
            diff.getBoundingClientRect().height,
        ),
      ).toBeLessThan(3);
    }
  });
}
export const HistorySplitFillsHeight: StoryObj = {
  args: { scenario: "ready" },
  play: async ({ canvasElement }) => {
    const log = await openHistoryFile(canvasElement);
    await userEvent.click(log.getByRole("radio", { name: "Split" }));
    await fillsColumn(log);
    await userEvent.click(log.getByRole("button", { name: "Wrap text" }));
    await fillsColumn(log);
  },
};
export const OperationSplitFillsRemainingHeight: StoryObj = {
  args: { scenario: "operation-ready" },
  play: async ({ canvasElement }) => {
    const outer = within(canvasElement);
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector('[data-notes-ready="true"]'),
        ).not.toBeNull(),
      { timeout: 30_000 },
    );
    await userEvent.click(
      await outer.findByRole("button", { name: "Repository Op Log" }),
    );
    const log = within(
      await outer.findByRole("region", { name: "Repository operation log" }),
    );
    await userEvent.click(
      await log.findByRole("button", { name: /describe commit.*;/ }),
    );
    await chooseChangedRevision(log);
    await userEvent.click(
      await log.findByRole("button", { name: "Welcome.md" }),
    );
    await userEvent.click(log.getByRole("radio", { name: "Split" }));
    await fillsColumn(log);
    const diff = log.getByRole("region", { name: "Changes to Welcome.md" });
    const before = diff.getBoundingClientRect().height;
    const card = within(
      log.getByRole("region", { name: "Selected operation" }),
    );
    await userEvent.click(
      card.getByRole("button", { name: "describe commit" }),
    );
    await waitFor(() =>
      expect(diff.getBoundingClientRect().height).toBeGreaterThan(before),
    );
    await fillsColumn(log);
    await userEvent.click(log.getByRole("radio", { name: "Unified" }));
    await waitFor(() =>
      expect(diff.getBoundingClientRect().height).toBeLessThan(160),
    );
  },
};
