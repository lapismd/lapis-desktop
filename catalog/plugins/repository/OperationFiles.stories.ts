import { chooseChangedRevision } from "../../support/repository/picker-interactions.ts";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import RepositoryDemo from "../../support/repository/RepositoryDemo.svelte";
import RepositoryOperations from "../../../src/components/repository/RepositoryOperations.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { historyContext } from "../../support/repository/context.ts";
import { parent, revision } from "../../support/repository/fixture.ts";
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
async function open(element: HTMLElement) {
  const outer = within(element);
  await waitFor(
    () =>
      expect(element.querySelector('[data-notes-ready="true"]')).not.toBeNull(),
    { timeout: 30000 },
  );
  await userEvent.click(
    await outer.findByRole("button", { name: "Repository Op Log" }),
  );
  const canvas = within(
    await outer.findByRole("region", { name: "Repository operation log" }),
  );
  await userEvent.click(
    await canvas.findByRole("button", { name: /describe commit.*;/ }),
  );
  await userEvent.click(
    await canvas.findByRole("button", { name: "Close Diff column" }),
  );
  return canvas;
}
async function group(canvas: ReturnType<typeof within>) {
  await chooseChangedRevision(canvas);
}
export const ExpandedOperationFiles: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    expect(
      canvas.queryByRole("region", { name: "Operation details" }),
    ).toBeNull();
    await group(canvas);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Welcome.md" }),
    );
    await expect(
      await canvas.findByRole("region", { name: "Changes to Welcome.md" }),
    ).toHaveTextContent("History is retained");
    await userEvent.click(canvas.getByRole("radio", { name: "Split" }));
    await expect(
      canvas.getByRole("region", { name: "Previous revision" }),
    ).toBeVisible();
    const { fixture } = historyContext(canvasElement);
    expect(
      fixture.calls.filter(([, q]) => (q as { kind?: string })?.kind === "diff")
        .length,
    ).toBe(1);
  },
};
export const ExplicitRevisionPair: StoryObj = {
  parameters: { scenario: "operation-ambiguous" },
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await group(canvas);
    expect(canvas.queryByRole("region", { name: "Changed files" })).toBeNull();
    const compare = canvas.getByRole("button", { name: "Compare revisions" });
    await expect(compare).toBeDisabled();
    await userEvent.selectOptions(
      canvas.getByRole("combobox", { name: "Before revision" }),
      parent,
    );
    await userEvent.selectOptions(
      canvas.getByRole("combobox", { name: "After revision" }),
      revision,
    );
    await userEvent.click(compare);
    await expect(
      canvas.getByRole("combobox", { name: "Before revision" }),
    ).toHaveValue(parent);
    await expect(
      canvas.getByRole("combobox", { name: "After revision" }),
    ).toHaveValue(revision);
    await expect(
      await canvas.findByRole("button", { name: "Welcome.md" }),
    ).toBeVisible();
  },
};
export const UnavailableComparison: StoryObj = {
  parameters: { scenario: "operation-unavailable" },
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await group(canvas);
    await expect(
      await canvas.findByText(
        "This change has no available content comparison.",
      ),
    ).toBeVisible();
    expect(canvas.queryByRole("region", { name: "Changed files" })).toBeNull();
  },
};
export const RevisionFailureAndRecovery: StoryObj = {
  parameters: { scenario: "operation-files-failure" },
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByText("The operation revisions failed"),
    ).toBeVisible();
    expect(
      canvas.queryByText("No revision content changes in this operation."),
    ).toBeNull();
    historyContext(canvasElement).fixture.recover();
    await userEvent.click(
      canvas.getByRole("button", { name: "Retry revisions" }),
    );
    await group(canvas);
    await expect(
      await canvas.findByRole("button", { name: "Welcome.md" }),
    ).toBeVisible();
    await waitFor(() =>
      expect(body.queryByText("The operation revisions failed")).toBeNull(),
    );
  },
};

export const PathFailureIsUnavailable: StoryObj = {
  parameters: { scenario: "operation-paths-failure" },
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await group(canvas);
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByText("The revision comparison failed"),
    ).toBeVisible();
    expect(canvas.queryByRole("region", { name: "Changed files" })).toBeNull();
    expect(canvas.queryByText("No changed files")).toBeNull();
    historyContext(canvasElement).fixture.recover();
    await userEvent.click(
      canvas.getByRole("button", { name: "Retry comparison" }),
    );
    await expect(
      await canvas.findByRole("button", { name: "Welcome.md" }),
    ).toBeVisible();
    await waitFor(() =>
      expect(body.queryByText("The revision comparison failed")).toBeNull(),
    );
  },
};
