import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import RepositoryDemo from "../../support/repository/RepositoryDemo.svelte";
import { openHistory } from "../../support/repository/interactions.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";

const meta: Meta = {
  title: "Desktop/Repository row selection",
  component: RepositoryDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
};
export default meta;

async function checkRow(graph: HTMLElement) {
  const row = graph.querySelector<HTMLElement>(".repository-graph-row")!;
  const select = row.querySelector<HTMLButtonElement>(
    ".repository-graph-select",
  )!;
  await userEvent.click(row);
  await expect(select).toHaveAttribute("aria-pressed", "true");
  await userEvent.click(row);
  await expect(select).toHaveAttribute("aria-pressed", "false");
  const tags = within(row).getByRole("list");
  await userEvent.click(tags);
  await expect(select).toHaveAttribute("aria-pressed", "true");
  await userEvent.click(row);
  const author = within(row).getByRole("button", { name: /About / });
  await userEvent.click(author);
  await expect(select).toHaveAttribute("aria-pressed", "false");
  await userEvent.keyboard("{Escape}");
  const identifier = within(row).getByRole("button", {
    name: /Copy (Git|full operation)/,
  });
  await userEvent.click(identifier);
  await expect(select).toHaveAttribute("aria-pressed", "false");
  select.focus();
  await userEvent.keyboard("{Enter}");
  await expect(select).toHaveAttribute("aria-pressed", "true");
}

export const JjLogWholeRow: StoryObj = {
  play: async ({ canvasElement }) => {
    const history = await openHistory(canvasElement);
    await checkRow(
      await history.findByRole("list", { name: "Revision graph" }),
    );
  },
};

export const OpLogWholeRow: StoryObj = {
  args: { scenario: "operation-snapshot" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Repository Op Log" }),
    );
    await checkRow(
      await canvas.findByRole("list", { name: "Operation graph" }),
    );
  },
};
