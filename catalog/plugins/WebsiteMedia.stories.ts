import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within, userEvent, waitFor } from "storybook/test";
import NotesWorkspace from "../../src/components/views/NotesWorkspace.svelte";
import NotesDemo from "../support/NotesDemo.svelte";
import LauncherDemo from "../support/LauncherDemo.svelte";
import {
  readLauncherAppearance,
  saveLauncherAppearance,
} from "../../src/lib/launcher/launcher-appearance";
import { cleanupCatalog } from "../support/lifecycle";

const files = {
  "Research plan.md": `---
status: active
tags: [research, writing]
---
# A clearer place to think

Keep notes, references, and decisions together in ordinary Markdown files.

## This week

- [x] Collect the source material
- [ ] Connect the ideas in [[Project brief]]
- [ ] Write a first draft

> [!note] Keep your files
> Your notes stay in a folder you control.

## Questions worth following

What have we learned, and what should we explore next?
`,
  "Project brief.md": "# Project brief\n\nRelated: [[Research plan]]\n",
  "Reading list.md":
    "# Reading list\n\n- [[Research plan]]\n- [[Project brief]]\n",
};
const meta = {
  title: "Desktop/Website media",
  component: NotesWorkspace,
  tags: ["website-media", "visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
  parameters: { layout: "fullscreen" },
  render: () => ({ Component: NotesDemo, props: { files } }),
} satisfies Meta;
export default meta;
type Story = StoryObj;
export const Workspace: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector('[data-notes-ready="true"]'),
        ).not.toBeNull(),
      { timeout: 30000 },
    );
    await userEvent.click(
      await within(canvasElement).findByRole("button", {
        name: "Research plan.md",
      }),
    );
    await waitFor(() =>
      expect(
        canvasElement.querySelector('[contenteditable="true"]'),
      ).toHaveTextContent("A clearer place to think"),
    );
  },
};

export const Launcher: StoryObj = {
  beforeEach: ({ globals }) => {
    const previous = readLauncherAppearance();
    saveLauncherAppearance(globals.colorMode === "dark" ? "dark" : "light");
    return () => saveLauncherAppearance(previous);
  },
  render: () => ({ Component: LauncherDemo, props: { scenario: "empty" } }),
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText("New Desktop Vault"),
    ).toBeVisible();
  },
};
