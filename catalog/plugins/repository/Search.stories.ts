import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
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
async function open(element: HTMLElement, text = "local-first") {
  await waitFor(
    () =>
      expect(element.querySelector('[data-notes-ready="true"]')).not.toBeNull(),
    { timeout: 30000 },
  );
  const app = historyContext(element).app;
  await app.commands.executeCommand("search:open-search", text, "history");
  await waitFor(
    () =>
      expect(
        element.querySelector('[data-testid="search-panel"]'),
      ).not.toBeNull(),
    { timeout: 15000 },
  );
  return within(
    element.querySelector<HTMLElement>('[data-testid="search-panel"]')!,
  );
}
async function fileVersion(element: HTMLElement, text = "local-first") {
  const view = await open(element, text);
  const file = await view.findByRole("treeitem", {
    name: /Welcome.md,.*saved versions/,
  });
  await userEvent.click(file);
  const version = await view.findByRole("treeitem", {
    name: /History Restore the old meeting notes/,
  });
  await userEvent.click(
    within(version).getByRole("button", { name: /^History / }),
  );
  await expect(
    await within(version).findByRole("treeitem", {
      name: /original launch plan/,
    }),
  ).toBeVisible();
  return view;
}
export const ExactFileVersion: StoryObj = {
  play: async ({ canvasElement }) => {
    const view = await fileVersion(canvasElement);
    await expect(
      view.getByText("2 file versions are searchable by path only."),
    ).toBeVisible();
    await userEvent.click(
      view.getByRole("button", {
        name: /Open saved version Restore the old meeting notes/,
      }),
    );
    await expect(
      await within(canvasElement).findByRole("region", {
        name: "Blame for Welcome.md",
      }),
    ).toBeVisible();
  },
};
export const MetadataAndFilters: StoryObj = {
  play: async ({ canvasElement }) => {
    const view = await open(
      canvasElement,
      "checkpoint author:Ada after:2026-10-01",
    );
    await userEvent.click(
      await view.findByRole("treeitem", {
        name: /^Checkpoints \d+.*saved versions$/,
      }),
    );
    await userEvent.click(
      within(
        await view.findByRole("treeitem", {
          name: /History Restore the old meeting notes/,
        }),
      ).getByRole("button", { name: /^History / }),
    );
    const query = canvasElement.querySelector<HTMLElement>(
      "[data-search-query]",
    )!.dataset.searchQuery!;
    await expect(query).toContain('"author"');
    await expect(query).toContain('"after"');
    await userEvent.click(
      view.getByRole("button", {
        name: /Open saved version Restore the old meeting notes/,
      }),
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
    const view = await open(canvasElement);
    const more = await view.findByRole("button", {
      name: "Search older history",
    });
    await waitFor(() => expect(more).toBeEnabled());
    await userEvent.click(more);
    await expect(
      await view.findByRole("treeitem", { name: /Welcome.md/ }),
    ).toBeVisible();
    await expect(
      view.queryByRole("button", { name: "Search older history" }),
    ).not.toBeInTheDocument();
  },
};
export const NoMatches: StoryObj = {
  args: { scenario: "empty" },
  play: async ({ canvasElement }) => {
    const view = await open(canvasElement, "missing");
    await expect(await view.findByText("No matches found.")).toBeVisible();
  },
};
export const Loading: StoryObj = {
  args: { scenario: "loading" },
  play: async ({ canvasElement }) => {
    const view = await open(canvasElement);
    await expect(
      await view.findByRole("status", { name: "Searching saved history" }),
    ).toBeVisible();
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: "Finish fixture search",
      }),
    );
    await expect(
      await view.findByRole("treeitem", { name: /Welcome.md/ }),
    ).toBeVisible();
  },
};
export const FailureAndRecovery: StoryObj = {
  args: { scenario: "failed" },
  play: async ({ canvasElement }) => {
    const view = await open(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByText(
        /History search failed: Saved history index is unavailable/,
      ),
    ).toBeVisible();
    await expect(
      view.getByText(/Search is temporarily unavailable/),
    ).toBeVisible();
    await userEvent.click(
      view.getByRole("button", { name: "Refresh search index" }),
    );
    await expect(
      await view.findByRole("treeitem", { name: /Welcome.md/ }),
    ).toBeVisible();
  },
};

export const CurrentFiles: StoryObj = {
  play: async ({ canvasElement }) => {
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector('[data-notes-ready="true"]'),
        ).not.toBeNull(),
      { timeout: 30000 },
    );
    const app = historyContext(canvasElement).app;
    await app.commands.executeCommand("search:open-search", "desktop", "files");
    const panel = await waitFor(() => {
      const value = canvasElement.querySelector<HTMLElement>(
        '[data-testid="search-panel"]',
      );
      expect(value).not.toBeNull();
      return value!;
    });
    const row = await within(panel).findByRole("treeitem", {
      name: /Welcome.md,.*matches/,
    });
    await expect(row).toBeVisible();
    const viewport = panel.querySelector<HTMLElement>(
      '.search-panel__scroll-area > [data-ui-part="scroll-area-viewport"]',
    )!;
    expect(viewport.getBoundingClientRect().height).toBeGreaterThan(40);
    expect(row.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      viewport.getBoundingClientRect().top,
    );
    expect(row.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      viewport.getBoundingClientRect().bottom,
    );
  },
};
