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
