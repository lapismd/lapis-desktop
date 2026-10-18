import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import RepositoryDemo from "../../support/repository/RepositoryDemo.svelte";
import { openHistory } from "../../support/repository/interactions.ts";
import { otherOperation } from "../../support/repository/fixture.ts";
import { historyContext } from "../../support/repository/context.ts";
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

export const OperationSnapshotCommandPicker: Story = {
  args: { scenario: "multiple" },
  play: async ({ canvasElement }) => {
    const canvas = await openHistory(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "Operation" });
    expect(trigger.tagName).toBe("BUTTON");
    await userEvent.click(trigger);
    const body = within(canvasElement.ownerDocument.body);
    const search = await body.findByRole("combobox", {
      name: "Select operation snapshot",
    });
    await expect(search).toHaveFocus();
    expect(search.closest('[data-ui-component="command-view"]')).not.toBeNull();
    const callsBeforeSearch =
      historyContext(canvasElement).fixture.calls.length;
    await userEvent.type(search, "no matching operation");
    await expect(await body.findByText("No matching operations")).toBeVisible();
    await userEvent.clear(search);
    await userEvent.type(search, otherOperation);
    expect(historyContext(canvasElement).fixture.calls.length).toBe(
      callsBeforeSearch,
    );
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect(trigger).toHaveValue(otherOperation);
    expect(
      historyContext(canvasElement)
        .fixture.calls.filter(([kind]) => kind === "open")
        .map(([, id]) => id),
    ).toEqual([otherOperation]);
    await userEvent.click(trigger);
    await expect(
      await body.findByRole("row", {
        name: `Select operation ${otherOperation}`,
      }),
    ).toHaveAttribute("data-current", "true");
    await userEvent.click(
      body.getByRole("button", { name: "Close operation picker" }),
    );
    await expect(trigger).toHaveFocus();
  },
};

export const OperationLogSnapshotCommandPicker: Story = {
  args: { scenario: "operation-multiple-heads" },
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
    const trigger = log.getByRole("combobox", { name: "Pinned operation" });
    expect(trigger.tagName).toBe("BUTTON");
    await userEvent.click(trigger);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await body.findByRole("row", {
        name: `Select operation ${otherOperation}`,
      }),
    );
    await expect(trigger).toHaveValue(otherOperation);
    await expect(
      await log.findByRole("button", { name: /initialize repo.*;/ }),
    ).toBeVisible();
    expect(
      historyContext(canvasElement)
        .fixture.calls.filter(([kind]) => kind === "open")
        .map(([, id]) => id),
    ).toEqual([otherOperation]);
  },
};

export const EmptySnapshotPickerDisabled: Story = {
  args: { scenario: "empty" },
  play: async ({ canvasElement }) => {
    const canvas = await openHistory(canvasElement);
    await expect(
      canvas.getByRole("combobox", { name: "Operation" }),
    ).toBeDisabled();
    expect(
      within(canvasElement.ownerDocument.body).queryByRole("dialog", {
        name: "Select operation snapshot",
      }),
    ).toBeNull();
  },
};
