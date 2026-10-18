import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import RepositoryDemo from "../../support/repository/RepositoryDemo.svelte";
import { openHistory } from "../../support/repository/interactions.ts";
import { chooseChangedRevision } from "../../support/repository/picker-interactions.ts";
import { historyContext } from "../../support/repository/context.ts";
import { operation } from "../../support/repository/fixture.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";

const meta: Meta = {
  title: "Desktop/Repository live plugin",
  component: RepositoryDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
};
export default meta;

export const WorkspaceContext: StoryObj = {
  play: async ({ canvasElement }) => {
    const history = await openHistory(canvasElement);
    await userEvent.click(
      await history.findByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    );
    await userEvent.click(
      history.getByRole("combobox", { name: "Repository workspace" }),
    );
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await body.findByRole("option", { name: /^default$/ }),
    );
    await expect(
      history.getByRole("combobox", { name: "Operation" }),
    ).toHaveValue(operation);
    await expect(
      history.getByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    ).toHaveAttribute("aria-expanded", "false");
    const queries = historyContext(canvasElement)
      .fixture.calls.map(([, query]) => query)
      .filter(
        (q) => q && typeof q === "object" && "kind" in q && q.kind === "graph",
      );
    const latest = queries.at(-1) as { query: unknown[] } | undefined;
    expect(latest?.query[0]).toMatchObject({
      graph: "log",
      workspace: "default",
    });
  },
};

export const NativeConflictInspection: StoryObj = {
  args: { scenario: "conflicted" },
  play: async ({ canvasElement }) => {
    const history = await openHistory(canvasElement);
    await userEvent.click(
      await history.findByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    );
    await userEvent.click(
      await history.findByRole("button", { name: "Resolve conflicts" }),
    );
    const body = within(canvasElement.ownerDocument.body);
    const surface = within(
      await body.findByLabelText("Resolve native conflicts", {
        selector: "section",
      }),
    );
    await expect(
      await surface.findByRole("button", {
        name: "Accept All Incoming Changes from Left",
      }),
    ).toBeVisible();
    await userEvent.click(
      surface.getByRole("button", {
        name: "Accept All Incoming Changes from Left",
      }),
    );
    await userEvent.click(
      surface.getByRole("button", { name: "Stage merged file" }),
    );
    await userEvent.click(surface.getByRole("button", { name: "Preview 1/1" }));
    await expect(
      await surface.findByRole("region", {
        name: "Conflict resolution preview",
      }),
    ).toHaveTextContent("Your version");
    await expect(
      surface.getByRole("button", { name: "Apply resolution" }),
    ).toBeDisabled();
    await userEvent.click(
      surface.getByRole("button", { name: "Close conflict editor" }),
    );
    await expect(
      history.getByRole("button", { name: "Resolve conflicts" }),
    ).toHaveFocus();
    await expect(
      history.getByRole("combobox", { name: "Operation" }),
    ).toHaveValue(operation);
  },
};

export const OperationCardsAndCommand: StoryObj = {
  args: { scenario: "operation-rich" },
  play: async ({ canvasElement }) => {
    const outer = within(canvasElement);
    await userEvent.click(
      await outer.findByRole("button", { name: "Repository Op Log" }),
    );
    const log = within(
      await outer.findByRole("region", { name: "Repository operation log" }),
    );
    await userEvent.click(
      await log.findByRole("button", { name: /^describe commit 5ae/ }),
    );
    await chooseChangedRevision(log);
    await userEvent.click(
      await log.findByRole("button", { name: "Welcome.md" }),
    );
    await expect(
      await log.findByRole("region", { name: "Changes to Welcome.md" }),
    ).toBeVisible();
    await expect(
      log.getByRole("region", { name: "Recorded operation command" }),
    ).toHaveTextContent("jj describe -r @");
    expect(
      log.getAllByRole("button", { name: /Copy full commit ID: 5ae721/ }),
    ).toHaveLength(2);
    await expect(log.getByRole("button", { name: "Revert" })).toBeDisabled();
  },
};

export const MarkdownAndTags: StoryObj = {
  args: { scenario: "rich-history" },
  play: async ({ canvasElement }) => {
    const history = await openHistory(canvasElement);
    await userEvent.click(
      await history.findByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    );
    const more = await history.findByRole("button", {
      name: "View more of commit message",
    });
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(more);
    await expect(
      history.getByRole("heading", { name: "Why this change matters" }),
    ).toBeVisible();
    await expect(
      history.getByRole("region", { name: "Commit message body" }),
    ).toHaveTextContent("final paragraph");
    await userEvent.click(
      history.getByRole("button", { name: "View less of commit message" }),
    );
    await expect(more).toHaveAttribute("aria-expanded", "false");
    const selected = history
      .getByRole("button", { name: /Keep repository history beside the notes/ })
      .closest("li")!;
    const tags = within(selected).getByRole("list", { name: "Revision tags" });
    const visibleLabels = () =>
      within(tags)
        .getAllByRole("listitem")
        .map((item) => item.textContent?.trim());
    expect(visibleLabels()).toContain("main");
    if (!visibleLabels().includes("main@origin")) {
      await userEvent.click(
        within(tags).getByRole("button", { name: /more revision tags/ }),
      );
      const body = within(canvasElement.ownerDocument.body);
      await expect(
        await body.findByRole("list", { name: "All revision tags" }),
      ).toHaveTextContent("main@origin");
      await userEvent.click(
        body.getByRole("button", { name: "Close revision tags" }),
      );
    }
    await userEvent.click(
      await history.findByRole("button", { name: "Welcome.md" }),
    );
    await expect(
      await history.findByRole("region", { name: "Changes to Welcome.md" }),
    ).toBeVisible();
  },
};
