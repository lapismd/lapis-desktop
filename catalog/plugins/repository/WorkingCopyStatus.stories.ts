import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import WorkingCopyDemo from "../../support/repository/WorkingCopyDemo.svelte";
import { historyContext } from "../../support/repository/context.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
const meta: Meta = {
  title: "Desktop/Repository working copy status",
  component: WorkingCopyDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
};
export default meta;
async function ready(element: HTMLElement) {
  await waitFor(
    () =>
      expect(element.querySelector('[data-notes-ready="true"]')).not.toBeNull(),
    { timeout: 30_000 },
  );
  return within(element);
}
export const DetailsAndRefresh: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    const stats = await canvas.findByRole("button", {
      name: /^Working copy details/,
    });
    await waitFor(() => expect(stats).toHaveTextContent("2 files"));
    await expect(stats).toHaveTextContent("+1");
    await expect(stats).toHaveTextContent("-22");
    await userEvent.click(
      canvas.getByRole("button", { name: "Refresh working copy status" }),
    );
    await waitFor(() =>
      expect(
        canvas.getByRole("button", { name: "Refresh working copy status" }),
      ).not.toBeDisabled(),
    );
    await userEvent.click(stats);
    const card = within(
      await within(canvasElement.ownerDocument.body).findByRole("region", {
        name: /^Working copy details/,
      }),
    );
    await waitFor(() => expect(card.getByText("default")).toBeVisible());
    await expect(card.getByText(/Includes unsnapshotted files/)).toBeVisible();
    await userEvent.click(card.getByRole("button", { name: "Open in JJ Log" }));
    await expect(
      await canvas.findByRole("region", { name: "Repository history" }),
    ).toBeVisible();
  },
};
export const Loading: StoryObj = {
  args: { scenario: "loading" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Refresh working copy status" }),
    ).toBeDisabled();
    await userEvent.click(
      canvas.getByRole("button", { name: /^Working copy details/ }),
    );
    await waitFor(async () =>
      expect(
        await within(canvasElement.ownerDocument.body).findByRole("status", {
          name: "Reading working copy",
        }),
      ).toBeVisible(),
    );
    await waitFor(
      () =>
        expect(
          canvas.getByRole("button", { name: "Refresh working copy status" }),
        ).not.toBeDisabled(),
      { timeout: 5000 },
    );
  },
};
export const Clean: StoryObj = {
  args: { scenario: "clean" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole("button", { name: /^Working copy details/ }),
      ).toHaveTextContent("0 files"),
    );
  },
};
export const Binary: StoryObj = {
  args: { scenario: "binary" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole("button", { name: /^Working copy details/ }),
      ).toHaveTextContent("line counts unavailable"),
    );
  },
};
export const FailureAndRecovery: StoryObj = {
  args: { scenario: "failed" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await expect(
      await page.findByText("The working copy changed during status reading"),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: /^Working copy details/ }),
    ).toHaveTextContent("unavailable");
    await userEvent.click(
      canvas.getByRole("button", { name: "Refresh working copy status" }),
    );
    await waitFor(() =>
      expect(
        canvas.getByRole("button", { name: /^Working copy details/ }),
      ).toHaveTextContent("2 files"),
    );
  },
};
export const SettingsAndDisable: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await canvas.findByRole("button", { name: /^Working copy details/ });
    const { app } = historyContext(canvasElement);
    const settings = getWorkspaceHostBinding(app.workspace).controller.settings;
    settings.open({ sectionId: "repository-history" });
    const page = within(canvasElement.ownerDocument.body);
    const toggle = await page.findByRole("switch", {
      name: "Show working copy status",
    });
    await expect(toggle).toBeChecked();
    await userEvent.click(toggle);
    await waitFor(() =>
      expect(
        canvas.queryByRole("button", { name: /^Working copy details/ }),
      ).toBeNull(),
    );
    await userEvent.click(toggle);
    settings.close();
    await waitFor(() =>
      expect(
        canvas.getByRole("button", { name: /^Working copy details/ }),
      ).toHaveTextContent("2 files"),
    );
    await app.plugins.disablePlugin("repository-history");
    await waitFor(() =>
      expect(
        canvas.queryByRole("button", { name: /^Working copy details/ }),
      ).toBeNull(),
    );
  },
};

export const WorkspaceFooter: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    const stats = await canvas.findByRole("button", {
      name: /^Working copy details/,
    });
    const shell = canvasElement.querySelector<HTMLElement>(
      "[data-app-shell-root]",
    )!;
    const footer = canvas.getByLabelText("Workspace status");
    const bounds = footer.getBoundingClientRect();
    expect(bounds.width).toBeCloseTo(shell.getBoundingClientRect().width, 0);
    expect(bounds.bottom).toBeCloseTo(shell.getBoundingClientRect().bottom, 0);
    const sidebar = shell.querySelector<HTMLElement>(
      '[data-app-shell-sidebar="left"]',
    )!;
    expect(getComputedStyle(sidebar).borderBottomWidth).toBe("0px");
    expect(sidebar.getBoundingClientRect().bottom).toBeCloseTo(bounds.top, 0);
    expect(getComputedStyle(footer).borderTopWidth).toBe("1px");
    expect(stats.closest('[data-ui-part="left"]')).not.toBeNull();
    const control = stats.getBoundingClientRect();
    expect(control.top).toBeGreaterThanOrEqual(bounds.top + 2);
    expect(control.bottom).toBeLessThanOrEqual(bounds.bottom - 1);
    const app = historyContext(canvasElement).app;
    let task = app.notifications.createProgress({
      id: "footer-acceptance",
      title: "Indexing notes",
      location: "status",
    });
    try {
      const center = footer.querySelector<HTMLElement>(
        '[data-ui-part="center"]',
      )!;
      await waitFor(() => expect(center).toHaveTextContent("Indexing notes"));
      const initial = center.getBoundingClientRect();
      task.complete();
      task = app.notifications.createProgress({
        id: "footer-acceptance-long",
        title:
          "Synchronizing a very long vault name and indexing its complete revision history",
        location: "status",
      });
      await waitFor(() => expect(center).toHaveTextContent("Synchronizing"));
      expect(center.getBoundingClientRect().width).toBe(initial.width);
      expect(footer.getBoundingClientRect().height).toBe(bounds.height);
      await userEvent.click(within(center).getByRole("button"));
      await expect(
        await within(canvasElement.ownerDocument.body).findByRole("dialog", {
          name: "Notifications",
        }),
      ).toBeVisible();
    } finally {
      task.complete();
    }
  },
};

export const RoundedWindowSafeArea: StoryObj = {
  args: { roundedWindow: true },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await canvas.findByRole("button", { name: /^Working copy details/ });
    const footer = canvas.getByLabelText("Workspace status");
    const bounds = footer.getBoundingClientRect();
    expect(bounds.height).toBe(28);
    for (const side of ["left", "right"]) {
      const region = footer.querySelector<HTMLElement>(
        `[data-ui-part="${side}"]`,
      )!;
      for (const button of within(region).getAllByRole("button")) {
        const control = button.getBoundingClientRect();
        expect(control.left).toBeGreaterThanOrEqual(bounds.left + 8);
        expect(control.right).toBeLessThanOrEqual(bounds.right - 8);
        expect(control.bottom).toBeLessThanOrEqual(bounds.bottom - 4);
      }
    }
    await userEvent.click(
      canvas.getByRole("button", { name: /^Working copy details/ }),
    );
    const card = await within(canvasElement.ownerDocument.body).findByRole(
      "region",
      { name: "Working copy details" },
    );
    const popover = card.closest<HTMLElement>(
      '[data-ui-part="popover-content"]',
    )!;
    await waitFor(() => {
      const popup = popover.getBoundingClientRect();
      expect(popup.left).toBeGreaterThanOrEqual(8);
      expect(popup.right).toBeLessThanOrEqual(window.innerWidth - 8);
      expect(
        canvas
          .getByRole("button", { name: /^Working copy details/ })
          .getBoundingClientRect().top - popup.bottom,
      ).toBeCloseTo(6, 0);
    });
  },
};
