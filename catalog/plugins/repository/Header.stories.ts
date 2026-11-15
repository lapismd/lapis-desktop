import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import RepositoryDemo from "../../support/repository/RepositoryDemo.svelte";
import { openHistory } from "../../support/repository/interactions.ts";
import { operation, otherOperation } from "../../support/repository/fixture.ts";
import {
  historyContext,
  repositoryView,
} from "../../support/repository/context.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";

const meta: Meta = {
  title: "Desktop/Repository header",
  component: RepositoryDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
};
export default meta;
type Story = StoryObj;

async function openOperations(element: HTMLElement) {
  const shell = within(element);
  await waitFor(
    () =>
      expect(element.querySelector('[data-notes-ready="true"]')).not.toBeNull(),
    { timeout: 30_000 },
  );
  await userEvent.click(
    await shell.findByRole("button", { name: "Repository Op Log" }),
  );
  return within(
    await shell.findByRole("region", { name: "Repository operation log" }),
  );
}
function headerGeometry(
  element: HTMLElement,
  title: string,
  panelLabel: string,
) {
  const panel = within(element).getByRole("region", { name: panelLabel });
  const header = within(panel).getByRole("group", { name: `${title} header` });
  expect(within(header).queryByRole("combobox")).toBeNull();
  expect(within(header).getByRole("button", { name: "Refresh" })).toBeVisible();
  expect(
    header.getBoundingClientRect().top - panel.getBoundingClientRect().top,
  ).toBeLessThanOrEqual(16);
  expect(header.scrollWidth).toBeLessThanOrEqual(header.clientWidth + 1);
}
export const HistoryStartsWithColumnHeader: Story = {
  args: { scenario: "ready" },
  play: async ({ canvasElement }) => {
    const canvas = await openHistory(canvasElement);
    expect(
      canvas.queryByRole("heading", { name: "Repository history" }),
    ).toBeNull();
    headerGeometry(canvasElement, "JJ Log", "Repository history");
  },
};
export const OperationLogStartsWithColumnHeader: Story = {
  args: { scenario: "operation-ready" },
  play: async ({ canvasElement }) => {
    const canvas = await openOperations(canvasElement);
    expect(canvas.queryByRole("heading", { name: "Op Log" })).toBeNull();
    headerGeometry(canvasElement, "Op Log", "Repository operation log");
  },
};
export const OperationHeadKeyboardSelection: Story = {
  args: { scenario: "multiple" },
  play: async ({ canvasElement }) => {
    const canvas = await openHistory(canvasElement);
    const head = await canvas.findByRole("button", {
      name: `Inspect operation ${otherOperation}`,
    });
    head.focus();
    await expect(head).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(
      await canvas.findByRole("list", { name: "Revision graph" }),
    ).toBeVisible();
    expect(repositoryView(canvasElement).getState().operation).toBe(
      otherOperation,
    );
    expect(
      historyContext(canvasElement)
        .fixture.calls.filter(([kind]) => kind === "open")
        .map(([, id]) => id),
    ).toEqual([otherOperation]);
  },
};
export const OperationLogHeadKeyboardSelection: Story = {
  args: { scenario: "operation-multiple-heads" },
  play: async ({ canvasElement }) => {
    const log = await openOperations(canvasElement);
    const head = await log.findByRole("button", {
      name: `Inspect operation ${operation}`,
    });
    head.focus();
    await userEvent.keyboard("{Enter}");
    await expect(
      await log.findByRole("button", { name: /initialize repo.*;/ }),
    ).toBeVisible();
    expect(
      repositoryView(canvasElement, "repository-oplog").getState().operation,
    ).toBe(operation);
    expect(
      historyContext(canvasElement)
        .fixture.calls.filter(([kind]) => kind === "open")
        .map(([, id]) => id),
    ).toEqual([operation]);
  },
};
export const EmptyHeaderRetainsRefresh: Story = {
  args: { scenario: "empty" },
  play: async ({ canvasElement }) => {
    const canvas = await openHistory(canvasElement);
    expect(canvas.queryByRole("combobox", { name: "Operation" })).toBeNull();
    expect(canvas.queryByRole("group", { name: "Operation heads" })).toBeNull();
    await expect(canvas.getByRole("button", { name: "Refresh" })).toBeEnabled();
    expect(
      historyContext(canvasElement).fixture.calls.filter(
        ([kind]) => kind === "open",
      ),
    ).toHaveLength(0);
  },
};
