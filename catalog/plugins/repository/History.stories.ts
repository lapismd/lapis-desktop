import type { Meta, StoryObj } from "@storybook/svelte-vite";
import {
  openHistory as open,
  openHistoryFile as file,
} from "../../support/repository/interactions.ts";
import { expect, userEvent, waitFor, within } from "storybook/test";
import RepositoryDemo from "../../support/repository/RepositoryDemo.svelte";
import RepositoryPanel from "../../../src/components/repository/RepositoryPanel.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { historyContext } from "../../support/repository/context.ts";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import {
  operation,
  otherOperation,
  parent,
  revision,
} from "../../support/repository/fixture.ts";
const meta: Meta = {
  title: "Desktop/Repository history",
  component: RepositoryPanel,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
  render: (_args, { parameters }) => ({
    Component: RepositoryDemo,
    props: { scenario: parameters.scenario ?? "ready" },
  }),
};
export default meta;
type Story = StoryObj;
export const PinnedHistoryAndDiff: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await file(canvasElement);
    const shell = within(canvasElement);
    for (const side of ["left", "right"]) {
      await userEvent.click(
        shell.getByRole("button", { name: `Close ${side} sidebar` }),
      );
    }
    await expect(
      await canvas.findByRole("region", { name: "Changes to Welcome.md" }),
    ).toHaveTextContent("History is retained");
    await userEvent.click(canvas.getByRole("radio", { name: "Split" }));
    await expect(
      canvas.getByRole("region", { name: "Previous revision" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("region", { name: "Later revision" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("combobox", { name: "Operation" }),
    ).toHaveValue(operation);
    await waitFor(() => {
      const columns = canvas.getByRole("region", {
        name: "Repository history columns",
      });
      if (window.innerWidth >= 1000) {
        expect(columns).toHaveAttribute("data-display-mode", "wide");
        const log = canvas.getByRole("region", { name: "Revisions" });
        const diff = canvas.getByRole("region", { name: "Revision changes" });
        expect(log.getBoundingClientRect().right).toBeLessThanOrEqual(
          diff.getBoundingClientRect().left,
        );
      }
      const main = canvasElement.querySelector<HTMLElement>(
        '.repository-shell [data-ui-part="main"]',
      )!;
      const style = getComputedStyle(main);
      expect(parseFloat(style.borderTopWidth)).toBeGreaterThan(0);
      expect(parseFloat(style.borderTopLeftRadius)).toBeGreaterThan(0);
    });
  },
};
export const UnifiedDiff: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await file(canvasElement);
    await userEvent.click(canvas.getByRole("radio", { name: "Unified" }));
    await userEvent.click(canvas.getByRole("radio", { name: "Unified" }));
    await expect(
      await canvas.findByRole("region", { name: "Changes to Welcome.md" }),
    ).toHaveTextContent("History is retained");
    await expect(
      canvas.getByRole("radio", { name: "Unified" }),
    ).toHaveAttribute("aria-checked", "true");
  },
};
export const RetainsHistoricalSelection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await file(canvasElement);
    await expect(
      await canvas.findByRole("region", { name: "Changes to Welcome.md" }),
    ).toHaveTextContent("History is retained");
    const context = historyContext(canvasElement);
    context.fixture.advance();
    await userEvent.click(canvas.getByRole("button", { name: "Refresh" }));
    await waitFor(() =>
      expect(canvas.getByRole("combobox", { name: "Operation" })).toHaveValue(
        operation,
      ),
    );
    await expect(
      canvas.getByRole("button", {
        name: new RegExp(`Copy Git commit SHA ${revision}`),
      }),
    ).toBeVisible();
    expect(
      context.fixture.calls.filter(([method]) => method === "open"),
    ).toHaveLength(1);
    await userEvent.click(canvas.getByRole("combobox", { name: "Operation" }));
    await userEvent.click(
      await within(canvasElement.ownerDocument.body).findByRole("row", {
        name: `Select operation ${otherOperation}`,
      }),
    );
    await waitFor(() => expect(context.fixture.closed).toHaveLength(1));
    await waitFor(() => {
      expect(canvas.getByRole("combobox", { name: "Operation" })).toHaveValue(
        otherOperation,
      );
      expect(
        within(canvasElement).getByRole("region", {
          name: "Repository history",
        }),
      ).toHaveAttribute("aria-busy", "false");
      expect(
        canvas.queryByRole("region", { name: "Changes to Welcome.md" }),
      ).toBeNull();
      expect(
        canvas.getByRole("list", { name: "Revision graph" }),
      ).toBeVisible();
    });
  },
};
export const MultipleHeads: Story = {
  parameters: { scenario: "multiple" },
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await expect(
      await canvas.findByText("Choose an operation to inspect its history."),
    ).toBeVisible();
    expect(
      historyContext(canvasElement).fixture.calls.some(
        ([method]) => method === "open",
      ),
    ).toBe(false);
    await userEvent.click(canvas.getByRole("combobox", { name: "Operation" }));
    await userEvent.click(
      await within(canvasElement.ownerDocument.body).findByRole("row", {
        name: `Select operation ${operation}`,
      }),
    );
    await expect(
      await canvas.findByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    ).toBeVisible();
  },
};
export const RootRevision: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /Start the vault/ }),
    );
    await expect(
      canvas.getByRole("button", { name: /Start the vault/ }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      canvas.queryByText("This revision has no parent comparison."),
    ).toBeNull();
    await expect(
      canvas.queryByRole("combobox", { name: "Compare with parent" }),
    ).toBeNull();
  },
};
export const UnchangedRevision: Story = {
  parameters: { scenario: "unchanged" },
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    );
    await expect(
      await canvas.findByText("No changed files in this comparison."),
    ).toBeVisible();
  },
};
export const NoRevisions: Story = {
  parameters: { scenario: "no-revisions" },
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await expect(
      await canvas.findByText("No revisions in this operation."),
    ).toBeVisible();
    await expect(
      canvas.getByRole("combobox", { name: "Operation" }),
    ).toHaveValue(operation);
  },
};
export const Empty: Story = {
  parameters: { scenario: "empty" },
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await expect(
      await canvas.findByText("No repository operations available."),
    ).toBeVisible();
  },
};
export const Preparing: Story = {
  parameters: { scenario: "preparing" },
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await expect(
      await canvas.findByText("Preparing repository history…"),
    ).toBeVisible();
  },
};
export const UnavailableBinary: Story = {
  parameters: { scenario: "binary" },
  play: async ({ canvasElement }) => {
    const canvas = await file(canvasElement);
    await expect(
      await canvas.findByText("Preview unavailable: binary."),
    ).toBeVisible();
    await expect(canvas.queryByText("No textual changes")).toBeNull();
  },
};
export const FailureAndRecovery: Story = {
  parameters: { scenario: "failure" },
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByText("The repository could not be read"),
    ).toBeVisible();
    await expect(
      within(canvasElement).getByRole("region", { name: "Repository history" }),
    ).not.toHaveTextContent("The repository could not be read");
    await userEvent.click(canvas.getByRole("button", { name: "Refresh" }));
    await expect(
      await canvas.findByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    ).toBeVisible();
    await waitFor(() =>
      expect(body.queryByText("The repository could not be read")).toBeNull(),
    );
  },
};
export const ReadFailureRetainsPin: Story = {
  parameters: { scenario: "read-failure" },
  play: async ({ canvasElement }) => {
    const canvas = await file(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByText("The file comparison failed"),
    ).toBeVisible();
    await expect(
      canvas.getByRole("combobox", { name: "Operation" }),
    ).toHaveValue(operation);
    await expect(canvas.queryByText("No textual changes")).toBeNull();
    historyContext(canvasElement).fixture.recover();
    await userEvent.click(
      canvas.getByRole("button", { name: "Retry preview" }),
    );
    await expect(
      await canvas.findByRole("region", { name: "Changes to Welcome.md" }),
    ).toHaveTextContent("History is retained");
    await waitFor(() =>
      expect(body.queryByText("The file comparison failed")).toBeNull(),
    );
  },
};
export const RevisionFailureAndRecovery: Story = {
  parameters: { scenario: "graph-failure" },
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByText("The revision history could not be read"),
    ).toBeVisible();
    await expect(
      canvas.queryByText("No revisions in this operation."),
    ).toBeNull();
    historyContext(canvasElement).fixture.recover();
    await userEvent.click(canvas.getByRole("button", { name: "Refresh" }));
    await expect(
      await canvas.findByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("combobox", { name: "Operation" }),
    ).toHaveValue(operation);
    await waitFor(() =>
      expect(
        body.queryByText("The revision history could not be read"),
      ).toBeNull(),
    );
  },
};
export const ComparisonFailureAndRecovery: Story = {
  parameters: { scenario: "paths-failure" },
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await canvas.findByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    );
    await expect(
      await body.findByText("The revision comparison failed"),
    ).toBeVisible();
    await expect(
      canvas.queryByText("No changed files in this comparison."),
    ).toBeNull();
    expect(canvas.queryByRole("region", { name: "Changed files" })).toBeNull();
    historyContext(canvasElement).fixture.recover();
    await userEvent.click(
      canvas.getByRole("button", { name: "Retry comparison" }),
    );
    await expect(
      await canvas.findByRole("button", { name: "Welcome.md" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("combobox", { name: "Compare with parent" }),
    ).toHaveValue(parent);
    await waitFor(() =>
      expect(body.queryByText("The revision comparison failed")).toBeNull(),
    );
  },
};
export const SafeMode: Story = {
  parameters: { scenario: "safe-mode" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector('[data-notes-ready="true"]'),
        ).not.toBeNull(),
      { timeout: 30_000 },
    );
    await expect(
      canvas.queryByRole("button", { name: "Repository History" }),
    ).toBeNull();
  },
};

export const RestoresHistoricalOperation: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector('[data-notes-ready="true"]'),
        ).not.toBeNull(),
      { timeout: 30_000 },
    );
    const { app, fixture } = historyContext(canvasElement);
    const workspace = getWorkspaceHostBinding(app.workspace).controller
      .workspace;
    expect(
      workspace.openLeaf(
        "repository-history",
        { operation: otherOperation },
        { active: true },
      ),
    ).not.toBeNull();
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByRole("combobox", { name: "Operation" })).toHaveValue(
        otherOperation,
      ),
    );
    expect(
      fixture.calls
        .filter(([method]) => method === "open")
        .map(([, pin]) => pin),
    ).toEqual([otherOperation]);
  },
};
