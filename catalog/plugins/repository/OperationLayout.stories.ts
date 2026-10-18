import { chooseChangedRevision } from "../../support/repository/picker-interactions.ts";
import type { LocalCodeQuery } from "@lapismd/jj-history";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import RepositoryDemo from "../../support/repository/RepositoryDemo.svelte";
import RepositoryOperations from "../../../src/components/repository/RepositoryOperations.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
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

export const UnloadedParentFailureAndRecovery: StoryObj = {
  parameters: { scenario: "operation-parent-failure" },
  play: async ({ canvasElement }) => {
    const outer = within(canvasElement);
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector('[data-notes-ready="true"]'),
        ).not.toBeNull(),
      { timeout: 30000 },
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
    const parent = await log.findByRole("button", {
      name: /^Inspect parent operation adadadad…adad/,
    });
    await userEvent.click(parent);
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByText("The parent operation could not be read"),
    ).toBeVisible();
    expect(
      log.queryByText("The parent operation could not be read"),
    ).toBeNull();
    await expect(
      log.getByRole("region", { name: "Selected operation" }),
    ).toHaveTextContent("describe commit");
    const { historyContext } = await import(
      "../../support/repository/context.ts"
    );
    historyContext(canvasElement).fixture.recover();
    await userEvent.click(parent);
    await expect(
      await log.findByRole("button", { name: "unloaded parent" }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        body.queryByText("The parent operation could not be read"),
      ).toBeNull(),
    );
    await userEvent.click(
      log.getByRole("button", { name: "Close Diff column" }),
    );
    await chooseChangedRevision(log);
    await userEvent.click(
      await log.findByRole("button", { name: "Welcome.md" }),
    );
    await expect(
      await log.findByRole("region", { name: "Selected operation" }),
    ).toHaveTextContent("unloaded parent");
    await expect(
      await log.findByRole("region", { name: "Changes to Welcome.md" }),
    ).toHaveTextContent("History is retained");
  },
};
export default meta;

export const StackedOperationAndDiff: StoryObj = {
  play: async ({ canvasElement }) => {
    const outer = within(canvasElement);
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector('[data-notes-ready="true"]'),
        ).not.toBeNull(),
      { timeout: 30000 },
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
    const operationCard = await log.findByRole("region", {
      name: "Selected operation",
    });
    const card = within(operationCard);
    await expect(
      card.getByRole("region", { name: "Selected operation metadata" }),
    ).toBeVisible();
    const avatar = within(
      card.getByRole("region", { name: "Selected operation metadata" }),
    ).getByRole("button", { name: /About Ada/ });
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveTextContent(/^AD$/);
    await expect(
      card.getByRole("button", {
        name: new RegExp(`Copy full operation ID: ${operation}`),
      }),
    ).toBeVisible();
    const empty = await log.findByRole("region", {
      name: "Selected file diff",
    });
    await expect(
      within(empty).getByText("No file selected", { exact: true }),
    ).toBeVisible();
    expect(operationCard.parentElement).toBe(empty.parentElement);
    expect(log.queryByRole("region", { name: "Operation details" })).toBeNull();
    const style = getComputedStyle(operationCard.parentElement!);
    expect(style.gap).toBe("12px");
    expect(getComputedStyle(operationCard).borderTopWidth).toBe("1px");
    const toggle = card.getByRole("button", {
      name: "Collapse operation details",
    });
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      card.queryByRole("region", { name: "Selected operation metadata" }),
    ).toBeNull();
    await userEvent.click(toggle);
    await userEvent.click(
      card.getByRole("button", { name: "Close Diff column" }),
    );
    await chooseChangedRevision(log);
    await userEvent.click(
      await log.findByRole("button", { name: "Welcome.md" }),
    );
    const diff = await log.findByRole("region", {
      name: "Changes to Welcome.md",
    });
    await expect(diff).toHaveTextContent("History is retained");
    expect(diff.getBoundingClientRect().height).toBeLessThan(160);
    const reopened = await log.findByRole("region", {
      name: "Selected operation",
    });
    expect(reopened.parentElement).toBe(
      diff.closest('[aria-label="Selected file diff"]')!.parentElement,
    );
    await expect(
      within(reopened).getByRole("region", {
        name: "Selected operation metadata",
      }),
    ).toBeVisible();
    await userEvent.click(log.getByRole("radio", { name: "Split" }));
    await expect(
      log.getByRole("region", { name: "Previous revision" }),
    ).toBeVisible();
    await userEvent.click(
      within(reopened).getByRole("button", {
        name: new RegExp(
          `^Inspect parent operation ${otherOperation.slice(0, 8)}…${otherOperation.slice(-4)}`,
        ),
      }),
    );
    await expect(
      await log.findByRole("region", { name: "Selected operation" }),
    ).toHaveTextContent("Root operation");
  },
};

export const ParentLookupBound: StoryObj = {
  parameters: { scenario: "operation-parent-bound" },
  play: async ({ canvasElement }) => {
    const outer = within(canvasElement);
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector('[data-notes-ready="true"]'),
        ).not.toBeNull(),
      { timeout: 30000 },
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
    await userEvent.click(
      await log.findByRole("button", {
        name: /^Inspect parent operation adadadad…adad/,
      }),
    );
    const message = "The parent operation is outside the bounded history page";
    await expect(
      await within(canvasElement.ownerDocument.body).findByText(message),
    ).toBeVisible();
    expect(log.queryByText(message)).toBeNull();
    await expect(
      log.getByRole("region", { name: "Selected operation" }),
    ).toHaveTextContent("describe commit");
    const { historyContext } = await import(
      "../../support/repository/context.ts"
    );
    const graphPages = historyContext(canvasElement).fixture.calls.filter(
      ([, query]) =>
        (query as LocalCodeQuery | undefined)?.kind === "graph" &&
        (query as Extract<LocalCodeQuery, { kind: "graph" }>).query[1].after,
    );
    expect(graphPages).toHaveLength(4);
  },
};
