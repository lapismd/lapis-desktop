import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import RepositoryDemo from "../../support/repository/RepositoryDemo.svelte";
import RepositoryOperations from "../../../src/components/repository/RepositoryOperations.svelte";
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
      await canvas.findByRole("button", { name: /describe commit/ }),
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: "Inspect operation details" }),
    );
    await expect(
      await canvas.findByRole("region", { name: "Operation changes" }),
    ).toHaveTextContent("1 added · 1 removed");
    await expect(canvas.getByText("main", { exact: true })).toBeVisible();
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
      await canvas.findByRole("button", { name: /initialize repo/ }),
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: "Inspect operation details" }),
    );
    await expect(
      await canvas.findByText("This is the root operation."),
    ).toBeVisible();
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
      await canvas.findByRole("button", { name: /describe commit/ }),
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: "Inspect operation details" }),
    );
    await expect(
      await canvas.findByText("Choose a parent to compare this operation."),
    ).toBeVisible();
    const parent = canvas.getByRole("combobox", {
      name: "Compare operation with parent",
    });
    await expect(parent).toHaveValue("");
    await userEvent.selectOptions(parent, otherOperation);
    await expect(
      await canvas.findByRole("region", { name: "Operation changes" }),
    ).toBeVisible();
  },
};
export const RefreshRetainsPinAndSeparateHistory: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /initialize repo/ }),
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: "Inspect operation details" }),
    );
    const { fixture } = historyContext(canvasElement);
    fixture.advance();
    await userEvent.click(canvas.getByRole("button", { name: "Refresh" }));
    await expect(
      canvas.getByRole("combobox", { name: "Pinned operation" }),
    ).toHaveValue(operation);
    await userEvent.click(
      canvas.getByRole("button", { name: "Inspect in History" }),
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
      await canvas.findByRole("button", { name: /describe commit/ }),
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: "Inspect operation details" }),
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
      await canvas.findByRole("region", { name: "Operation changes" }),
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
      await canvas.findByRole("button", { name: /describe commit/ }),
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
    await userEvent.selectOptions(
      canvas.getByRole("combobox", { name: "Pinned operation" }),
      operation,
    );
    await expect(
      await canvas.findByRole("button", { name: /describe commit/ }),
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
      await canvas.findByText("Snapshot", { exact: true }),
    ).toBeVisible();
  },
};
