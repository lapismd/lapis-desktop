import { chooseChangedRevision } from "../../support/repository/picker-interactions.ts";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import RepositoryDemo from "../../support/repository/RepositoryDemo.svelte";
import { RepositoryOperations } from "@lapismd/repository-ui/jj";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { historyContext } from "../../support/repository/context.ts";
import { operation, otherOperation } from "../../support/repository/fixture.ts";
const meta: Meta = {
  title: "Desktop/Repository Op Log",
  component: RepositoryOperations,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
  render: (_args, { parameters }) => ({
    Component: RepositoryDemo,
    props: { scenario: parameters.scenario ?? "operation-ready" },
  }),
};
export default meta;
type Story = StoryObj;
async function open(element: HTMLElement) {
  const canvas = within(element);
  await waitFor(
    () =>
      expect(element.querySelector('[data-notes-ready="true"]')).not.toBeNull(),
    { timeout: 30000 },
  );
  await userEvent.click(
    await canvas.findByRole("button", { name: "Repository Op Log" }),
  );
  return within(
    await canvas.findByRole("region", { name: "Repository operation log" }),
  );
}
export const OperationGraphAndChanges: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /describe commit.*;/ }),
    );
    await userEvent.click(
      await canvas.findByRole("button", {
        name: "Inspect operation details",
      }),
    );
    await expect(
      canvas.getByRole("region", { name: "Selected operation" }),
    ).toBeVisible();
    await chooseChangedRevision(canvas);
    await expect(
      await canvas.findByRole("button", { name: "Welcome.md" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("list", { name: "Operation graph" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("combobox", { name: "Pinned operation" }),
    ).toHaveValue(operation);
  },
};
export const RootOperation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /initialize repo.*;/ }),
    );
    await userEvent.click(
      await canvas.findByRole("button", {
        name: "Inspect operation details",
      }),
    );
    await expect(
      canvas.getByRole("region", { name: "Selected operation" }),
    ).toHaveTextContent("initialize repo");
    expect(canvas.queryByText("This is the root operation.")).toBeNull();
    expect(
      canvas.queryByText("No file comparison for the root operation."),
    ).toBeNull();
    expect(
      canvas.queryByRole("combobox", { name: "Compare operation with parent" }),
    ).toBeNull();
  },
};
export const MergeParentChoice: Story = {
  parameters: { scenario: "operation-merge" },
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /describe commit.*;/ }),
    );
    await expect(
      await canvas.findByText("Choose a parent to compare this operation."),
    ).toBeVisible();
    const parent = canvas.getByRole("combobox", {
      name: "Compare operation with parent",
    });
    await expect(parent).toHaveValue("");
    expect(parent.tagName).toBe("BUTTON");
    await userEvent.click(parent);
    const body = within(canvasElement.ownerDocument.body);
    const search = await body.findByRole("combobox", {
      name: "Select operation parent",
    });
    await expect(search).toHaveFocus();
    expect(search.closest('[data-ui-component="command-view"]')).not.toBeNull();
    await userEvent.type(search, "Grace");
    const unloaded = await body.findByRole("row", {
      name: /unloaded parent/,
    });
    await expect(
      within(unloaded).getByRole("button", { name: /About Grace/ }),
    ).toBeVisible();
    expect(
      unloaded.querySelector('[title*="Workspace review"]'),
    ).not.toBeNull();
    await userEvent.clear(search);
    await userEvent.type(search, "no matching operation");
    await expect(await body.findByText("No matching operations")).toBeVisible();
    await userEvent.clear(search);
    await userEvent.type(search, "initialize repo");
    const option = await body.findByRole("row", { name: /initialize repo/ });
    await expect(
      within(option).getByRole("button", { name: /About Ada/ }),
    ).toBeVisible();
    expect(option.querySelector('[title*="Ada@laptop"]')).not.toBeNull();
    expect(option.querySelector("time")).not.toBeNull();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect(parent).toHaveAttribute("data-parent", otherOperation);
    await userEvent.click(
      canvas.getByRole("button", { name: "Inspect operation details" }),
    );
    await expect(
      await canvas.findByRole("button", { name: "Choose changed revisions" }),
    ).toBeVisible();
  },
};
export const RefreshRetainsPinAndSeparateHistory: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /initialize repo.*;/ }),
    );
    await userEvent.click(
      await canvas.findByRole("button", {
        name: "Inspect operation details",
      }),
    );
    const { fixture } = historyContext(canvasElement);
    fixture.advance();
    await userEvent.click(canvas.getByRole("button", { name: "Refresh" }));
    await expect(
      canvas.getByRole("combobox", { name: "Pinned operation" }),
    ).toHaveValue(operation);
    await userEvent.click(
      canvas.getByRole("button", { name: "More operation actions" }),
    );
    await userEvent.click(
      await within(canvasElement.ownerDocument.body).findByRole("menuitem", {
        name: "Open in JJ Log",
      }),
    );
    const history = await within(canvasElement).findByRole("region", {
      name: "Repository history",
    });
    await expect(
      within(history).getByRole("combobox", { name: "Operation" }),
    ).toHaveValue(otherOperation);
    const opened = fixture.calls
      .filter(([kind]) => kind === "open")
      .map(([, id]) => id);
    expect(opened).toEqual([operation, otherOperation]);
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Repository Op Log" }),
    );
    await expect(
      canvas.getByRole("combobox", { name: "Pinned operation" }),
    ).toHaveValue(operation);
  },
};
export const DetailFailureAndRecovery: Story = {
  parameters: { scenario: "operation-detail-failure" },
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /describe commit.*;/ }),
    );
    await userEvent.click(
      await canvas.findByRole("button", {
        name: "Inspect operation details",
      }),
    );
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByText("The operation comparison failed"),
    ).toBeVisible();
    expect(canvas.queryByText("The operation comparison failed")).toBeNull();
    await expect(
      canvas.getByRole("combobox", { name: "Pinned operation" }),
    ).toHaveValue(operation);
    historyContext(canvasElement).fixture.recover();
    await userEvent.click(
      canvas.getByRole("button", { name: "Retry operation" }),
    );
    await expect(
      await canvas.findByRole("button", { name: "Choose changed revisions" }),
    ).toBeVisible();
    await waitFor(() =>
      expect(body.queryByText("The operation comparison failed")).toBeNull(),
    );
  },
};
export const GraphFailureAndRecovery: Story = {
  parameters: { scenario: "operation-graph-failure" },
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByText("The operation history could not be read"),
    ).toBeVisible();
    expect(canvas.queryByText("No operations in this history.")).toBeNull();
    historyContext(canvasElement).fixture.recover();
    await userEvent.click(canvas.getByRole("button", { name: "Refresh" }));
    await expect(
      await canvas.findByRole("button", { name: /describe commit.*;/ }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        body.queryByText("The operation history could not be read"),
      ).toBeNull(),
    );
  },
};
export const MultipleHeads: Story = {
  parameters: { scenario: "operation-multiple-heads" },
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await expect(
      await canvas.findByText("Choose an operation to inspect its ancestry."),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("combobox", { name: "Pinned operation" }),
    );
    await userEvent.click(
      await within(canvasElement.ownerDocument.body).findByRole("row", {
        name: `Select operation ${operation}`,
      }),
    );
    await expect(
      await canvas.findByRole("button", { name: /describe commit.*;/ }),
    ).toBeVisible();
  },
};
export const Empty: Story = {
  parameters: { scenario: "operation-empty" },
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await expect(
      await canvas.findByText("No operations in this history."),
    ).toBeVisible();
  },
};
export const Snapshot: Story = {
  parameters: { scenario: "operation-snapshot" },
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await expect(
      (await canvas.findAllByText("Snapshot", { exact: true }))[0],
    ).toBeVisible();
  },
};

export const ParentMetadataFailureAndRecovery: Story = {
  parameters: { scenario: "operation-picker-failure" },
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /describe commit.*;/ }),
    );
    const parent = canvas.getByRole("combobox", {
      name: "Compare operation with parent",
    });
    await userEvent.click(parent);
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByText("The parent operation could not be read"),
    ).toBeVisible();
    expect(
      canvas.queryByText("The parent operation could not be read"),
    ).toBeNull();
    await expect(parent).toHaveValue("");
    await userEvent.click(body.getByRole("row", { name: /initialize repo/ }));
    await expect(parent).toHaveAttribute("data-parent", otherOperation);
    await userEvent.click(parent);
    await waitFor(() =>
      expect(body.getByRole("row", { name: /Unknown parent/ })).toBeVisible(),
    );
    await waitFor(() =>
      expect(
        body.getByRole("button", { name: "Retry parent details" }),
      ).toBeEnabled(),
    );
    const count = historyContext(canvasElement).fixture.calls.length;
    expect(historyContext(canvasElement).fixture.calls.length).toBe(count);
    historyContext(canvasElement).fixture.recover();
    await userEvent.click(
      body.getByRole("button", { name: "Retry parent details" }),
    );
    await expect(
      await body.findByRole("row", { name: /unloaded parent/ }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        body.queryByText("The parent operation could not be read"),
      ).toBeNull(),
    );
    await expect(parent).toHaveAttribute("data-parent", otherOperation);
    await userEvent.click(
      body.getByRole("button", { name: "Close operation selector" }),
    );
  },
};
