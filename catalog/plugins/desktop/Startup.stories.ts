import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import NotesWorkspace from "../../../src/components/views/NotesWorkspace.svelte";
import { normalRecovery } from "../../../src/lib/notes/startup-recovery.ts";
import NotesDemo from "../../support/NotesDemo.svelte";
import StartupDemo from "../../support/desktop/StartupDemo.svelte";
import { reviewLayout } from "../../support/desktop/layout.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";

const meta: Meta = {
  title: "Desktop/Startup and recovery",
  component: NotesWorkspace,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
};
export default meta;
type Story = StoryObj;
export const LoadingNotes: Story = {
  render: () => ({ Component: StartupDemo }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("progressbar", { name: "Startup progress" }),
    ).toBeVisible();
    await expect(canvas.getByText("Loading Markdown")).toBeVisible();
    await expect(
      canvas.getByText("Restore the workspace layout"),
    ).toBeVisible();
  },
};
export const RestoringVault: Story = {
  render: () => ({ Component: StartupDemo, props: { restoring: true } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("progressbar", { name: "Startup progress" }),
    ).toBeVisible();
    await expect(canvas.getByText("Restore your notes")).toBeVisible();
    const task = canvasElement.querySelector(
      '[data-ui-part="task"][data-status="active"]',
    );
    await expect(task).toHaveTextContent("Open notes storage");
    for (const match of canvas.getAllByText("Open notes storage"))
      await expect(match).toBeVisible();
  },
};
export const FailedLayout: Story = {
  render: () => ({
    Component: NotesDemo,
    props: { files: { ".lapis/workspace.json": "broken layout" } },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("alert")).toBeVisible();
    for (const name of [
      "Retry",
      "Copy error details",
      "Start with optional plugins disabled",
      "Start without restoring layout",
      "Reset saved layout",
      "Back to vaults",
    ])
      await expect(canvas.getByRole("button", { name })).toBeVisible();
    await expect(
      canvasElement.querySelector('[data-notes-ready="true"]'),
    ).toBeNull();
  },
};
export const OptionalPluginsDisabled: Story = {
  render: () => ({
    Component: NotesDemo,
    props: {
      files: { ".lapis/workspace.json": JSON.stringify(reviewLayout()) },
      safeMode: {
        ...normalRecovery(),
        active: true,
        disableOptionalCorePlugins: true,
      },
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByLabelText("Safe Mode")).toHaveTextContent(
      "non-required core plugins disabled",
    );
    await expect(canvas.getByText("Safe Mode is active")).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "Open Terminal" }),
    ).toBeNull();
  },
};
export const SavedLayoutSkipped: Story = {
  render: () => ({
    Component: NotesDemo,
    props: {
      files: { ".lapis/workspace.json": "broken layout" },
      safeMode: { ...normalRecovery(), active: true, skipLayoutRestore: true },
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByLabelText("Safe Mode")).toHaveTextContent(
      "saved layout restore skipped",
    );
    await waitFor(() =>
      expect(
        canvasElement.querySelector('[data-notes-ready="true"]'),
      ).not.toBeNull(),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Rebuild Search" }),
    );
    await expect(await canvas.findByText("Search index rebuilt")).toBeVisible();
  },
};
export const FailedRecoveryAction: Story = {
  render: OptionalPluginsDisabled.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByLabelText("Safe Mode")).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Restart normally" }),
    );
    await expect(
      await canvas.findByText("Lapis could not restart. Please try again."),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Restart normally" }),
    ).toBeEnabled();
  },
};
