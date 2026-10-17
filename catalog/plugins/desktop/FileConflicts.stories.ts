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
  const conflict = await canvas.findByRole("region", {
    name: "File conflict: Note.md",
  });
  await expect(canvas.getByLabelText("Your version of Note.md")).toHaveValue(
    "# My unsaved draft\n",
  );
  return { canvas, conflict };
}
export const ModifiedOnDisk: Story = {
  play: async ({ canvasElement }) => {
    const { canvas } = await retained(canvasElement);
    await expect(canvas.getByLabelText("Disk version of Note.md")).toHaveValue(
      "# Changed outside Lapis\n",
    );
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
      canvas.getByRole("button", { name: "Keep my version" }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole("button", { name: "Use disk version" }),
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
      canvas.getByRole("button", { name: "Keep my version" }),
    );
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "The note is read-only",
    );
    await expect(canvas.getByLabelText("Your version of Note.md")).toHaveValue(
      "# My unsaved draft\n",
    );
  },
};
export const RecoveryInProgress: Story = {
  parameters: { scenario: "busy" },
  play: async ({ canvasElement }) => {
    const { canvas } = await retained(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Use disk version" }),
    );
    await waitFor(() =>
      expect(canvas.getByLabelText("File conflicts")).toHaveAttribute(
        "aria-busy",
        "true",
      ),
    );
    for (const button of within(
      canvas.getByLabelText("File conflicts"),
    ).getAllByRole("button"))
      await expect(button).toBeDisabled();
  },
};
export const KeepMyVersion: Story = {
  play: async ({ canvasElement }) => {
    const { canvas } = await retained(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Keep my version" }),
    );
    await waitFor(() =>
      expect(canvas.queryByLabelText("File conflicts")).toBeNull(),
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
      canvas.getByRole("button", { name: "Use disk version" }),
    );
    await waitFor(() =>
      expect(canvas.queryByLabelText("File conflicts")).toBeNull(),
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
      expect(canvas.getByLabelText("Disk version of Note.md")).toHaveValue(
        "# Newest disk version\n",
      ),
    );
    await expect(canvas.getByLabelText("Your version of Note.md")).toHaveValue(
      "# My unsaved draft\n",
    );
  },
};
export const StaleDecision: Story = {
  play: async ({ canvasElement }) => {
    const { canvas } = await retained(canvasElement);
    const fixture = conflictFixture(canvasElement);
    await fixture.adapter.write("Note.md", "# Changed again\n");
    await userEvent.click(
      canvas.getByRole("button", { name: "Keep my version" }),
    );
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "File changed on disk",
    );
    await expect(canvas.getByLabelText("Disk version of Note.md")).toHaveValue(
      "# Changed again\n",
    );
    await expect(await fixture.adapter.read("Note.md")).toBe(
      "# Changed again\n",
    );
  },
};
export const LeavingWorkspace: Story = {
  parameters: { leaving: true },
  play: async ({ canvasElement }) => {
    const { canvas } = await retained(canvasElement);
    for (const button of within(
      canvas.getByLabelText("File conflicts"),
    ).getAllByRole("button"))
      await expect(button).toBeDisabled();
    await expect(canvasElement.querySelector(".shell")).toHaveAttribute(
      "inert",
    );
  },
};
