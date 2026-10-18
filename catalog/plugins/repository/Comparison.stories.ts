import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import RepositoryDemo from "../../support/repository/RepositoryDemo.svelte";
import RepositoryPanel from "../../../src/components/repository/RepositoryPanel.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { historyContext } from "../../support/repository/context.ts";
import { operation } from "../../support/repository/fixture.ts";

const meta: Meta = {
  title: "Desktop/Repository comparison",
  component: RepositoryPanel,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
  render: () => ({
    Component: RepositoryDemo,
    props: { scenario: "operation-ready" },
  }),
};
export default meta;

export const JJLogAndOpLogTabs: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector('[data-notes-ready="true"]'),
        ).not.toBeNull(),
      { timeout: 30_000 },
    );
    const { app } = historyContext(canvasElement);
    const workspace = getWorkspaceHostBinding(app.workspace).controller
      .workspace;
    expect(
      workspace.openLeaf("repository-history", { operation }, { active: true }),
    ).not.toBeNull();
    const history = within(
      await canvas.findByRole("region", { name: "Repository history" }),
    );
    for (const side of ["left", "right"]) {
      const close = canvas.queryByRole("button", {
        name: `Close ${side} sidebar`,
      });
      if (close) await userEvent.click(close);
    }
    await userEvent.click(
      await history.findByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    );
    await userEvent.click(
      await history.findByRole("button", { name: "Welcome.md" }),
    );
    await userEvent.click(history.getByRole("radio", { name: "Split" }));
    await expect(
      await history.findByRole("region", { name: "Changes to Welcome.md" }),
    ).toHaveTextContent("History is retained");

    expect(
      workspace.openLeaf("repository-oplog", { operation }, { active: true }),
    ).not.toBeNull();
    const log = within(
      await canvas.findByRole("region", { name: "Repository operation log" }),
    );
    await userEvent.click(
      await log.findByRole("button", { name: /describe commit/ }),
    );
    await userEvent.selectOptions(
      await log.findByRole("combobox", { name: "Changed revision" }),
      "aa".repeat(16),
    );
    await userEvent.click(
      await log.findByRole("button", { name: "Welcome.md" }),
    );
    await expect(
      await log.findByRole("region", { name: "Selected operation" }),
    ).toHaveTextContent("describe commit");
    await expect(
      await log.findByRole("region", { name: "Changes to Welcome.md" }),
    ).toHaveTextContent("History is retained");

    const jjTab = canvas.getByRole("button", {
      name: /^Repository history$/,
    });
    const opTab = canvas.getByRole("button", {
      name: /^Repository operation log$/,
    });
    await expect(jjTab).toBeVisible();
    await expect(opTab).toBeVisible();
    await userEvent.click(jjTab);
    await expect(
      history.getByRole("region", { name: "Changes to Welcome.md" }),
    ).toBeVisible();
    await expect(history.getByRole("radio", { name: "Split" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(
      history.getByRole("combobox", { name: "Operation" }),
    ).toHaveValue(operation);
    await userEvent.click(opTab);
    await expect(
      log.getByRole("region", { name: "Selected operation" }),
    ).toBeVisible();
    await expect(
      log.getByRole("region", { name: "Changes to Welcome.md" }),
    ).toBeVisible();
    await expect(
      log.getByRole("combobox", { name: "Pinned operation" }),
    ).toHaveValue(operation);
    await userEvent.click(jjTab);
  },
};
