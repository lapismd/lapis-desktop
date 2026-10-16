import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within, userEvent, waitFor } from "storybook/test";
import NotesWorkspace from "../../src/components/views/NotesWorkspace.svelte";
import NotesDemo from "../support/NotesDemo.svelte";
import { cleanupCatalog } from "../support/lifecycle";

const meta: Meta = {
  title: "Desktop/Notes workspace",
  component: NotesWorkspace,
  tags: ["visual-pending", "!autodocs"],
  render: () => ({ Component: NotesDemo }),
  beforeEach: () => cleanupCatalog,
};
export default meta;
type Story = StoryObj;

export const EditNote: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector('[data-notes-ready="true"]'),
        ).not.toBeNull(),
      { timeout: 30_000 },
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: "Welcome.md" }),
    );
    await waitFor(() =>
      expect(
        canvasElement.querySelector('[contenteditable="true"]'),
      ).not.toBeNull(),
    );
    const editor = canvasElement.querySelector<HTMLElement>(
      '[contenteditable="true"]',
    )!;
    await expect(editor).toHaveTextContent("A desktop catalog");
    await userEvent.click(editor);
    await userEvent.keyboard("{End}{Enter}Catalog draft");
    await expect(editor).toHaveTextContent("Catalog draft");
  },
};
export const Dark: Story = { ...EditNote, globals: { colorMode: "dark" } };
