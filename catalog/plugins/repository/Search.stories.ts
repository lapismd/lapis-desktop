import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import SearchDemo from "../../support/repository/SearchDemo.svelte";
import { historyContext } from "../../support/repository/context.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";
const meta: Meta = {
  title: "Desktop/Repository history search",
  component: SearchDemo,
  args: { scenario: "ready" },
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
};
export default meta;
async function open(element: HTMLElement) {
  await waitFor(
    () =>
      expect(element.querySelector('[data-notes-ready="true"]')).not.toBeNull(),
    { timeout: 30000 },
  );
  const workspace = getWorkspaceHostBinding(
    historyContext(element).app.workspace,
  ).controller.workspace;
  workspace.openLeaf("repository-history-search", {}, { active: true });
  const region = await within(element).findByRole("region", {
    name: "Search vault history",
  });
  const view = within(region);
  await waitFor(() =>
    expect(view.getByRole("button", { name: "Search" })).toBeVisible(),
  );
  await waitFor(() =>
    expect(
      getComputedStyle(view.getByRole("textbox", { name: "Search history" }))
        .pointerEvents,
    ).not.toBe("none"),
  );
  return view;
}
async function submit(element: HTMLElement, text = "local-first") {
  const view = await open(element);
  await userEvent.type(
    view.getByRole("textbox", { name: "Search history" }),
    text,
  );
  await userEvent.click(view.getByRole("button", { name: "Search" }));
  return view;
}
export const TextAndFileRestore: StoryObj = {
  play: async ({ canvasElement }) => {
    const view = await submit(canvasElement);
    const row = await view.findByRole("option", { name: /Welcome.md/ });
    await userEvent.click(row);
    await expect(
      view.getByRole("button", { name: "Open version" }),
    ).toBeVisible();
    await expect(
      view.getByText(/file versions indexed by path only/),
    ).toBeVisible();
    await userEvent.click(view.getByRole("button", { name: "Restore file" }));
    const dialog = within(
      await within(canvasElement.ownerDocument.body).findByRole("alertdialog"),
    );
    await waitFor(() =>
      expect(
        dialog.getByRole("button", { name: "Restore file" }),
      ).toBeVisible(),
    );
    await userEvent.click(dialog.getByRole("button", { name: "Restore file" }));
    await waitFor(() =>
      expect(
        canvasElement.querySelector("[data-restored-file]"),
      ).toHaveAttribute("data-restored-file", "Welcome.md"),
    );
    await waitFor(() =>
      expect(
        within(canvasElement.ownerDocument.body).queryByRole("alertdialog"),
      ).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(
        getComputedStyle(view.getByRole("button", { name: "Open version" }))
          .pointerEvents,
      ).not.toBe("none"),
    );
    await userEvent.click(view.getByRole("button", { name: "Open version" }));
    await expect(
      await within(canvasElement).findByRole("region", {
        name: "Blame for Welcome.md",
      }),
    ).toBeVisible();
  },
};
export const MetadataAndFilters: StoryObj = {
  play: async ({ canvasElement }) => {
    const view = await open(canvasElement);
    await userEvent.type(
      view.getByRole("textbox", { name: "Search history" }),
      "checkpoint",
    );
    await userEvent.type(
      view.getByRole("textbox", { name: "History author filter" }),
      "Ada",
    );
    await userEvent.click(view.getByRole("button", { name: "Search" }));
    await userEvent.click(
      await view.findByRole("option", {
        name: /Restore the old meeting notes/,
      }),
    );
    await expect(
      view.getByRole("button", { name: "Open checkpoint" }),
    ).toBeVisible();
    await expect(
      view.getByRole("button", { name: "Restore checkpoint" }),
    ).toBeVisible();
    const query = JSON.parse(
      canvasElement.querySelector<HTMLElement>("[data-search-query]")!.dataset
        .searchQuery!,
    );
    await expect(query.author).toBe("Ada");
    await userEvent.click(
      view.getByRole("button", { name: "Open checkpoint" }),
    );
    await expect(
      await within(canvasElement).findByRole("region", {
        name: "Repository history",
      }),
    ).toBeVisible();
  },
};
export const OlderHistory: StoryObj = {
  args: { scenario: "older" },
  play: async ({ canvasElement }) => {
    const view = await submit(canvasElement);
    const more = await view.findByRole("button", {
      name: "Search older history",
    });
    await waitFor(() => expect(more).toBeEnabled());
    await userEvent.click(more);
    await expect(
      await view.findByRole("option", { name: /Welcome.md/ }),
    ).toBeVisible();
    await expect(
      view.queryByRole("button", { name: "Search older history" }),
    ).not.toBeInTheDocument();
  },
};
export const NoMatches: StoryObj = {
  args: { scenario: "empty" },
  play: async ({ canvasElement }) => {
    const view = await submit(canvasElement, "missing");
    await expect(
      await view.findByText("No matching saved versions"),
    ).toBeVisible();
  },
};
export const Loading: StoryObj = {
  args: { scenario: "loading" },
  play: async ({ canvasElement }) => {
    const view = await submit(canvasElement);
    await expect(
      await view.findByRole("status", { name: "Searching saved history" }),
    ).toBeVisible();
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: "Finish fixture search",
      }),
    );
    await expect(
      await view.findByRole("option", { name: /Welcome.md/ }),
    ).toBeVisible();
  },
};
export const FailureAndRecovery: StoryObj = {
  args: { scenario: "failed" },
  play: async ({ canvasElement }) => {
    const view = await submit(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByText("Saved history index is unavailable"),
    ).toBeVisible();
    await userEvent.click(view.getByRole("button", { name: "Search" }));
    await expect(
      await view.findByRole("option", { name: /Welcome.md/ }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        body.queryByText("Saved history index is unavailable"),
      ).not.toBeInTheDocument(),
    );
  },
};
