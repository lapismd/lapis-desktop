import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import FileConflicts from "../../../src/components/files/FileConflicts.svelte";
import FileConflictsDemo from "../../support/desktop/FileConflictsDemo.svelte";
import { conflictFixture } from "../../support/desktop/file-conflicts.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";

const meta: Meta = {
  title: "Desktop/File conflicts",
  component: FileConflicts,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
  render: (_args, { parameters }) => ({
    Component: FileConflictsDemo,
    props: {
      scenario: parameters.scenario ?? "modified",
      leaving: parameters.leaving,
    },
  }),
};
export default meta;
type Story = StoryObj;
async function retained(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await waitFor(() =>
    expect(canvasElement.querySelector('[data-ready="true"]')).not.toBeNull(),
  );
  const fixture = conflictFixture(canvasElement);
  await waitFor(() => expect(fixture.app.workspace.diagnostics.size).toBe(1));
  const hidden = Boolean(canvasElement.querySelector(".shell[inert]"));
  if (hidden) {
    const leaf = fixture.app.workspace.getLeaf("tab");
    await leaf.setViewState({
      type: "desktop:file-conflict",
      state: { path: "Note.md" },
    });
    fixture.app.workspace.setActiveLeaf(leaf);
    await fixture.app.workspace.revealLeaf(leaf);
    fixture.app.workspace.requestSaveLayout();
  } else {
    await userEvent.click(
      await canvas.findByRole("button", {
        name: /Review (your|the retained) draft/,
      }),
    );
  }
  const conflict = await canvas.findByRole("region", {
    name: "File conflict: Note.md",
    hidden,
  });
  await expect(
    within(conflict).getByRole("region", { name: "Your version", hidden }),
  ).toHaveTextContent("# My unsaved draft");
  const editable = within(conflict).queryByRole("textbox", {
    name: "Edit Merged version",
    hidden,
  });
  if (editable) await expect(editable).toHaveValue("# Original note\n");
  else
    await expect(
      within(conflict).getByRole("region", {
        name: "Merged version",
        hidden,
      }),
    ).toHaveTextContent("# Original note");
  return { canvas, conflict };
}
export const ProblemsList: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("button", {
        name: /Review your draft before saving/,
      }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole("region", { name: "File conflict: Note.md" }),
    ).toBeNull();
  },
};
export const ModifiedOnDisk: Story = {
  play: async ({ canvasElement }) => {
    const { canvas } = await retained(canvasElement);
    await expect(
      canvas.getByRole("region", { name: "Disk version" }),
    ).toHaveTextContent("# Changed outside Lapis");
  },
};
export const DeletedOnDisk: Story = {
  parameters: { scenario: "deleted" },
  play: async ({ canvasElement }) => {
    const { canvas } = await retained(canvasElement);
    await expect(
      canvas.getByText("The file was deleted from disk."),
    ).toBeVisible();
  },
};
export const UnreadableDisk: Story = {
  parameters: { scenario: "unreadable" },
  play: async ({ canvasElement }) => {
    const { canvas } = await retained(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "The note is read-only",
    );
    await expect(
      canvas.getByRole("button", { name: "Save merged version" }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole("button", { name: "Check disk again" }),
    ).toBeEnabled();
  },
};
export const FailedRecovery: Story = {
  parameters: { scenario: "read-only" },
  play: async ({ canvasElement }) => {
    const { canvas } = await retained(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Accept All Incoming Changes from Left",
      }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Save merged version" }),
    );
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "The note is read-only",
    );
    await expect(
      canvas.getByRole("region", { name: "Your version" }),
    ).toHaveTextContent("# My unsaved draft");
  },
};
export const RecoveryInProgress: Story = {
  parameters: { scenario: "busy" },
  play: async ({ canvasElement }) => {
    const { canvas } = await retained(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Save merged version" }),
    );
    await waitFor(() =>
      expect(
        canvas.getByRole("region", { name: "File conflict: Note.md" }),
      ).toHaveAttribute("aria-busy", "true"),
    );
    for (const name of ["Save merged version", "Check disk again"])
      await expect(canvas.getByRole("button", { name })).toBeDisabled();
  },
};
export const KeepMyVersion: Story = {
  play: async ({ canvasElement }) => {
    const { canvas } = await retained(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Accept All Incoming Changes from Left",
      }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Save merged version" }),
    );
    await waitFor(() =>
      expect(
        canvas.queryByRole("region", { name: "File conflict: Note.md" }),
      ).toBeNull(),
    );
    await expect(
      await conflictFixture(canvasElement).adapter.read("Note.md"),
    ).toBe("# My unsaved draft\n");
  },
};
export const UseDiskVersion: Story = {
  play: async ({ canvasElement }) => {
    const { canvas } = await retained(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Accept All Incoming Changes from Right",
      }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Save merged version" }),
    );
    await waitFor(() =>
      expect(
        canvas.queryByRole("region", { name: "File conflict: Note.md" }),
      ).toBeNull(),
    );
    await expect(
      await conflictFixture(canvasElement).adapter.read("Note.md"),
    ).toBe("# Changed outside Lapis\n");
  },
};
export const FreshDiskSnapshot: Story = {
  play: async ({ canvasElement }) => {
    const { canvas } = await retained(canvasElement);
    await conflictFixture(canvasElement).adapter.write(
      "Note.md",
      "# Newest disk version\n",
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Check disk again" }),
    );
    await waitFor(() =>
      expect(
        canvas.getByRole("region", { name: "Disk version" }),
      ).toHaveTextContent("# Newest disk version"),
    );
    await expect(
      canvas.getByRole("region", { name: "Your version" }),
    ).toHaveTextContent("# My unsaved draft");
  },
};
export const StaleDecision: Story = {
  play: async ({ canvasElement }) => {
    const { canvas } = await retained(canvasElement);
    const fixture = conflictFixture(canvasElement);
    await fixture.adapter.write("Note.md", "# Changed again\n");
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Accept All Incoming Changes from Left",
      }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Save merged version" }),
    );
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "File changed on disk",
    );
    await expect(
      canvas.getByRole("region", { name: "Disk version" }),
    ).toHaveTextContent("# Changed again");
    await expect(await fixture.adapter.read("Note.md")).toBe(
      "# Changed again\n",
    );
  },
};
export const LeavingWorkspace: Story = {
  parameters: { leaving: true },
  play: async ({ canvasElement }) => {
    const { canvas } = await retained(canvasElement);
    for (const name of ["Save merged version", "Check disk again"])
      await expect(
        canvas.getByRole("button", { name, hidden: true }),
      ).toBeDisabled();
    await expect(canvasElement.querySelector(".shell")).toHaveAttribute(
      "inert",
    );
  },
};

export const EditedMergeResult: Story = {
  play: async ({ canvasElement }) => {
    const { canvas } = await retained(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Edit Merged version" });
    await userEvent.clear(input);
    await userEvent.type(
      input,
      "# Reviewed merged note\nIncludes both changes.\n",
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Save merged version" }),
    );
    await waitFor(() =>
      expect(
        canvas.queryByRole("region", { name: "File conflict: Note.md" }),
      ).toBeNull(),
    );
    await expect(
      await conflictFixture(canvasElement).adapter.read("Note.md"),
    ).toBe("# Reviewed merged note\nIncludes both changes.\n");
  },
};
export const MergeEditorSettings: Story = {
  play: async ({ canvasElement }) => {
    const { canvas } = await retained(canvasElement);
    for (const name of ["Wrap text", "Ignore whitespace", "Ignore case"]) {
      const toggle = canvas.getByRole("button", { name });
      await userEvent.click(toggle);
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
    }
    await expect(
      canvas.getByRole("textbox", { name: "Edit Merged version" }),
    ).toHaveValue("# Original note\n");
  },
};
