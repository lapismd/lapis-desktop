import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within, userEvent, waitFor } from "storybook/test";
import NotesWorkspace from "../../src/components/views/NotesWorkspace.svelte";
import NotesDemo from "../support/NotesDemo.svelte";
import PluginFileIconsDemo from "../support/desktop/PluginFileIconsDemo.svelte";
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

export const ReadingNote: Story = {
  play: async (context) => {
    await EditNote.play?.(context);
    const canvas = within(context.canvasElement);
    await userEvent.click(
      canvas.getByRole("button", {
        name: /Current view: editing.*Click to read/s,
      }),
    );
    await waitFor(() => {
      const root = context.canvasElement.querySelector(
        '[data-ui-component="markdown-mira-preview"]',
      );
      const preview = root?.querySelector(".mira-markdown-preview");
      const viewport = root?.querySelector(
        '[data-ui-part="scroll-area-viewport"]',
      );
      expect(preview).not.toBeNull();
      expect(viewport).not.toBeNull();
      expect(preview).not.toBeUndefined();
      expect(viewport).not.toBeUndefined();
      const bounds = preview!.getBoundingClientRect();
      const available = viewport!.getBoundingClientRect();
      expect(bounds.top).toBeLessThanOrEqual(available.top + 1);
      expect(bounds.bottom).toBeGreaterThanOrEqual(available.bottom - 1);
      expect(getComputedStyle(preview!).overflowY).toBe("visible");
    });
  },
};
export const ReadingNoteDark: Story = {
  ...ReadingNote,
  globals: { colorMode: "dark" },
};

export const PluginFileIcon: StoryObj<typeof PluginFileIconsDemo> = {
  render: () => ({ Component: PluginFileIconsDemo }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector('[data-file-icons-ready="true"]'),
        ).not.toBeNull(),
      { timeout: 30_000 },
    );
    const file = await canvas.findByRole("button", {
      name: "Projects.base",
    });
    await waitFor(() =>
      expect(
        file.querySelector('path[d="M3 7h18v13H3zM6 4h12M8 1h8"]'),
      ).not.toBeNull(),
    );
    expect(file).toHaveAccessibleName("Projects.base");
    await userEvent.click(file);
    await waitFor(() =>
      expect(
        canvasElement.querySelector('[data-ui-component="bases-view"]'),
      ).not.toBeNull(),
    );
  },
};

export const ResponsiveLayout: Story = {
  tags: ["visual-pending"],
  render: () => ({
    Component: NotesDemo,
    props: {
      files: {
        ".lapis/app.json": JSON.stringify({
          "workspace.mobile.mode": "always",
        }),
      },
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const mobile = () =>
      canvasElement.querySelector('[data-ui-component="workspace-mobile"]');
    const waitForMobile = async (present: boolean) => {
      await waitFor(
        () =>
          present
            ? expect(mobile()).not.toBeNull()
            : expect(mobile()).toBeNull(),
        { timeout: 30_000 },
      );
      if (present) await expect(mobile()).toBeVisible();
    };
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector('[data-notes-ready="true"]'),
        ).not.toBeNull(),
      { timeout: 30_000 },
    );
    await waitForMobile(true);
    const chooseMode = async (mode: string) => {
      if (mobile())
        await userEvent.click(
          canvas.getAllByRole("button", { name: "Open more actions" })[0],
        );
      await userEvent.click(
        canvas.getByRole("button", { name: "Open settings" }),
      );
      const workspace = canvas.queryByRole("button", { name: "Workspace" });
      if (workspace && workspace.getBoundingClientRect().width)
        await userEvent.click(workspace);
      await userEvent.click(
        canvas.getByRole("combobox", { name: "Mobile layout" }),
      );
      await userEvent.click(
        within(document.body).getByRole("option", { name: mode }),
      );
      const close = canvas.getByRole("button", { name: "Close settings" });
      await waitFor(() =>
        expect(getComputedStyle(close).pointerEvents).not.toBe("none"),
      );
      await userEvent.click(close);
    };
    await chooseMode("Never");
    await waitForMobile(false);
    await chooseMode("Always");
    await waitForMobile(true);
    const host = canvasElement.querySelector<HTMLElement>(".notes-demo")!;
    const shell = canvasElement.querySelector<HTMLElement>(
      '[data-ui-component="app-shell"]',
    )!;
    const previousHost = host.style.width;
    const previousShell = shell.style.width;
    const setWidth = (px: string) => {
      host.style.width = px;
      host.style.maxWidth = px;
      shell.style.width = px;
      shell.style.maxWidth = px;
    };
    try {
      setWidth("390px");
      await chooseMode("Auto");
      await waitForMobile(true);
      setWidth("900px");
      await waitForMobile(false);
      setWidth("495px");
      await waitForMobile(true);
    } finally {
      host.style.width = previousHost;
      host.style.maxWidth = "";
      shell.style.width = previousShell;
      shell.style.maxWidth = "";
    }
  },
};
