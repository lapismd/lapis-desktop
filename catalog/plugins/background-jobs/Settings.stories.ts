import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import NotesWorkspace from "../../../src/components/views/NotesWorkspace.svelte";
import NotesDemo from "../../support/NotesDemo.svelte";
import { backgroundJobsFixture } from "../../support/background/jobs.ts";
import { cleanupCatalog } from "../../support/lifecycle";
import { notesReady } from "../../support/notes/readiness.ts";
const meta = {
  title: "Desktop/Background jobs",
  component: NotesWorkspace,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
} satisfies Meta;
export default meta;
type Story = StoryObj;
async function settings(canvasElement: HTMLElement) {
  await notesReady(canvasElement);
  const canvas = within(canvasElement);
  await userEvent.click(
    await canvas.findByRole("button", { name: "Open settings" }),
  );
  const dialog = within(
    await canvas.findByRole("dialog", { name: "Settings" }),
  );
  await userEvent.click(
    dialog.getByRole("button", { name: /^Background jobs$/ }),
  );
  await dialog.findByRole("heading", { name: "Overdue task digest" });
  return dialog;
}
export const LocalAlertsAndPause: Story = {
  render: () => ({
    Component: NotesDemo,
    props: { nativeBackgroundJobs: backgroundJobsFixture() },
  }),
  play: async ({ canvasElement }) => {
    const dialog = await settings(canvasElement);
    await userEvent.click(
      dialog.getByLabelText("Also show local system alerts"),
    );
    await userEvent.click(
      dialog.getByRole("button", { name: "Approve and enable" }),
    );
    await waitFor(() =>
      expect(dialog.getByRole("button", { name: /^Pause$/ })).toBeEnabled(),
    );
    await expect(dialog.getByRole("button", { name: "Run now" })).toBeEnabled();
    await userEvent.click(dialog.getByRole("button", { name: /^Pause$/ }));
    await dialog.findByRole("button", { name: "Approve and enable" });
  },
};
export const UnavailableRunner: Story = {
  render: () => ({
    Component: NotesDemo,
    props: { nativeBackgroundJobs: backgroundJobsFixture(true) },
  }),
  play: async ({ canvasElement, step }) => {
    let dialog!: ReturnType<typeof within>;
    await step("Open background-job settings", async () => {
      dialog = await settings(canvasElement);
    });
    const settingsDialog = dialog;
    await step("Reject unavailable native approval", async () => {
      await userEvent.click(
        settingsDialog.getByRole("button", { name: "Approve and enable" }),
      );
    });
    await step("Retain visible failure and recovery", async () => {
      await expect(await settingsDialog.findByRole("alert")).toHaveTextContent(
        "native runner is unavailable",
      );
    });
    await expect(
      dialog.getByRole("button", { name: "Refresh status" }),
    ).toBeVisible();
  },
};
