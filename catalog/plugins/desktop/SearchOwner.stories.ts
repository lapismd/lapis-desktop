import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import NotesWorkspace from "../../../src/components/views/NotesWorkspace.svelte";
import SearchOwnerDemo from "../../support/desktop/SearchOwnerDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { notesReady } from "../../support/notes/readiness.ts";

const meta: Meta = {
  title: "Desktop/Native Search",
  component: NotesWorkspace,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
};
export default meta;
type Story = StoryObj;

export const Ready: Story = {
  render: () => ({ Component: SearchOwnerDemo }),
  play: async ({ canvasElement }) => {
    await notesReady(canvasElement);
    await waitFor(() =>
      expect(
        canvasElement.querySelector('[data-ui-component="search-panel"]'),
      ).toBeVisible(),
    );
  },
};
export const NativeRecovery: Story = {
  render: Ready.render,
  play: async (context) => {
    await Ready.play?.(context);
    const canvas = within(context.canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Rebuild Search" }),
    );
    await expect(await canvas.findByText("Search index rebuilt")).toBeVisible();
    await expect(
      canvas.queryByText("Native Search owns generated state"),
    ).toBeNull();
  },
};
export const Rebuilding: Story = {
  render: () => ({ Component: SearchOwnerDemo, props: { mode: "loading" } }),
  play: async (context) => {
    await Ready.play?.(context);
    const canvas = within(context.canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Rebuild Search" }),
    );
    await expect(
      canvas.getByRole("button", { name: "Rebuilding Search…" }),
    ).toBeDisabled();
  },
};
export const RebuildCompletes: Story = {
  render: Rebuilding.render,
  play: async (context) => {
    await Rebuilding.play?.(context);
    const canvas = within(context.canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Complete native Search" }),
    );
    await expect(await canvas.findByText("Search index rebuilt")).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Rebuild Search" }),
    ).toBeEnabled();
  },
};
export const FailedRecovery: Story = {
  render: () => ({ Component: SearchOwnerDemo, props: { mode: "failed" } }),
  play: async (context) => {
    await Ready.play?.(context);
    const canvas = within(context.canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Rebuild Search" }),
    );
    await expect(
      await within(
        canvas.getByRole("status", { name: "Safe Mode" }),
      ).findByText("Native Search service unavailable"),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Rebuild Search" }),
    ).toBeEnabled();
  },
};
export const UnsupportedContribution: Story = {
  render: () => ({
    Component: SearchOwnerDemo,
    props: { mode: "unsupported" },
  }),
  play: async (context) => {
    await Ready.play?.(context);
    const canvas = within(context.canvasElement);
    await expect(
      await canvas.findByText(
        /search: Native Search cannot execute this custom provider/u,
      ),
    ).toBeVisible();
  },
};
