import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import NotesWorkspace from "../../../src/components/views/NotesWorkspace.svelte";
import NativeTasksDemo from "../../support/desktop/NativeTasksDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";

const meta: Meta = {
  title: "Desktop/Native Tasks admission",
  component: NotesWorkspace,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
  parameters: { a11y: { test: "error" }, layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

async function ready(canvasElement: HTMLElement) {
  await waitFor(() =>
    expect(
      canvasElement.querySelector('[data-notes-ready="true"]'),
    ).not.toBeNull(),
  );
  expect(
    canvasElement.querySelector("[data-native-task-calls]"),
  ).toHaveAttribute("data-native-task-calls", "disable");
  expect(
    within(canvasElement).getByRole("button", { name: "Welcome.md" }),
  ).toBeVisible();
}

export const AbsentDeclaration: Story = {
  render: () => ({ Component: NativeTasksDemo }),
  play: async ({ canvasElement }) => ready(canvasElement),
};

export const Loading: Story = {
  render: () => ({ Component: NativeTasksDemo, props: { mode: "loading" } }),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        canvasElement.querySelector("[data-native-task-calls]"),
      ).toHaveAttribute("data-native-task-calls", "disable"),
    );
    expect(
      within(canvasElement).getByRole("progressbar", {
        name: "Startup progress",
      }),
    ).toBeVisible();
    expect(canvasElement.querySelector('[data-notes-ready="true"]')).toBeNull();
  },
};

export const DeclarationCompletes: Story = {
  render: Loading.render,
  play: async (context) => {
    await Loading.play?.(context);
    await userEvent.click(
      within(context.canvasElement).getByRole("button", {
        name: "Complete native Tasks declaration",
      }),
    );
    await ready(context.canvasElement);
  },
};

export const FailedDeclaration: Story = {
  render: () => ({ Component: NativeTasksDemo, props: { mode: "failed" } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Native Tasks declaration unavailable",
    );
    expect(canvas.getByRole("button", { name: "Retry" })).toBeVisible();
    expect(
      canvas.getByRole("button", { name: "Back to vaults" }),
    ).toBeVisible();
    expect(canvasElement.querySelector('[data-notes-ready="true"]')).toBeNull();
  },
};
