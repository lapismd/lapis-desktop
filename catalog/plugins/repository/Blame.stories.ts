import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import RepositoryDemo from "../../support/repository/RepositoryDemo.svelte";
import { historyContext } from "../../support/repository/context.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";
const meta: Meta = {
  title: "Desktop/Repository file blame",
  component: RepositoryDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
};
export default meta;
async function openFile(element: HTMLElement) {
  const canvas = within(element);
  await waitFor(() =>
    expect(element.querySelector('[data-notes-ready="true"]')).not.toBeNull(),
  );
  await userEvent.click(
    await canvas.findByRole("tab", { name: "File history" }),
  );
  await userEvent.click(
    await canvas.findByRole("button", { name: "Welcome.md" }),
  );
  const sidebar = within(
    await canvas.findByRole("region", { name: "Active file history" }),
  );
  await waitFor(() =>
    expect(sidebar.getByRole("button", { name: "Blame file" })).toBeEnabled(),
  );
  return { canvas, sidebar };
}
async function openBlame(element: HTMLElement) {
  const { canvas, sidebar } = await openFile(element);
  await userEvent.click(sidebar.getByRole("button", { name: "Blame file" }));
  return within(await canvas.findByRole("region", { name: /^File blame$/ }));
}
export const BlameFromFileHistory: StoryObj = {
  args: { scenario: "blame-progress" },
  play: async ({ canvasElement }) => {
    const view = await openBlame(canvasElement),
      canvas = within(canvasElement);
    await expect(await view.findByText("History is retained")).toBeVisible();
    await expect(
      view.getByRole("button", { name: /Copy JJ Change ID p{32}$/ }),
    ).toBeVisible();
    await expect(
      await view.findByRole("button", { name: "Start the vault — Grace" }),
    ).toBeVisible();
    expect(
      historyContext(canvasElement).fixture.calls.some(
        ([, q]) => (q as { kind?: string })?.kind === "blame",
      ),
    ).toBe(true);
    await userEvent.click(
      view.getByRole("button", { name: "Start the vault — Grace" }),
    );
    const log = within(
      await canvas.findByRole("region", { name: "Repository history" }),
    );
    await waitFor(() =>
      expect(
        log.getByRole("button", { name: /Start the vault/ }),
      ).toHaveAttribute("aria-pressed", "true"),
    );
  },
};
export const FailureAndRecovery: StoryObj = {
  args: { scenario: "blame-failure" },
  play: async ({ canvasElement }) => {
    const view = await openBlame(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByText("The file blame could not be read"),
    ).toBeVisible();
    expect(view.queryByText("The file blame could not be read")).toBeNull();
    historyContext(canvasElement).fixture.recover();
    await userEvent.click(view.getByRole("button", { name: "Refresh blame" }));
    await expect(await view.findByText("History is retained")).toBeVisible();
    await waitFor(() =>
      expect(body.queryByText("The file blame could not be read")).toBeNull(),
    );
  },
};
export const Preparing: StoryObj = {
  args: { scenario: "blame-preparing" },
  play: async ({ canvasElement }) => {
    const view = await openBlame(canvasElement);
    await expect(
      await view.findByRole("status", { name: "Loading file blame…" }),
    ).toBeVisible();
    expect(
      canvasElement.querySelectorAll('[data-skeleton="blame"] .source-line')
        .length,
    ).toBe(24);
    expect(
      historyContext(canvasElement).app.notifications.activeProgress.some(
        (p) => p.title === "Loading file blame",
      ),
    ).toBe(true);
  },
};
export const SidebarHeaderAlignment: StoryObj = {
  play: async ({ canvasElement }) => {
    const { canvas, sidebar } = await openFile(canvasElement);
    expect(
      sidebar.queryByRole("combobox", { name: "File history operation" }),
    ).toBeNull();
    expect(sidebar.queryByRole("button", { name: /About Ada/ })).toBeNull();
    const sidebarHeader = sidebar
      .getByRole("button", { name: "Blame file" })
      .closest("header")!;
    const mainHeader = canvas
      .getByRole("button", { name: "Rename Welcome.md" })
      .closest("header")!;
    expect(
      Math.abs(
        sidebarHeader.getBoundingClientRect().bottom -
          mainHeader.getBoundingClientRect().bottom,
      ),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(
        sidebarHeader.getBoundingClientRect().height -
          mainHeader.getBoundingClientRect().height,
      ),
    ).toBeLessThanOrEqual(1);
  },
};
