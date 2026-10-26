import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import NotesWorkspace from "../../../src/components/views/NotesWorkspace.svelte";
import MetadataOwnerDemo from "../../support/desktop/MetadataOwnerDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";

const meta: Meta = {
  title: "Desktop/Native metadata",
  component: NotesWorkspace,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
};
export default meta;
type Story = StoryObj;
export const Ready: Story = {
  render: () => ({ Component: MetadataOwnerDemo }),
  play: async ({ canvasElement }) => {
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector('[data-notes-ready="true"]'),
        ).not.toBeNull(),
      { timeout: 30_000 },
    );
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Welcome.md" }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Welcome.md" }));
    await waitFor(() =>
      expect(
        canvasElement.querySelector('[contenteditable="true"]'),
      ).not.toBeNull(),
    );
  },
};
export const Loading: Story = {
  render: () => ({ Component: MetadataOwnerDemo, props: { mode: "loading" } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Load note metadata")).toBeVisible();
    await expect(
      canvas.getByRole("progressbar", { name: "Startup progress" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Complete native indexing" }),
    ).toBeVisible();
  },
};
export const RefreshCompletes: Story = {
  render: Loading.render,
  play: async (context) => {
    await Loading.play?.(context);
    await userEvent.click(
      within(context.canvasElement).getByRole("button", {
        name: "Complete native indexing",
      }),
    );
    await Ready.play?.(context);
  },
};
export const Failed: Story = {
  render: () => ({ Component: MetadataOwnerDemo, props: { mode: "failed" } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Native metadata service unavailable",
    );
    await expect(canvas.getByRole("button", { name: "Retry" })).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Back to vaults" }),
    ).toBeVisible();
    await expect(
      canvasElement.querySelector('[data-notes-ready="true"]'),
    ).toBeNull();
  },
};
