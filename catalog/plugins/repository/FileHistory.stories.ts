import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import RepositoryDemo from "../../support/repository/RepositoryDemo.svelte";
import { historyContext } from "../../support/repository/context.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { operation } from "../../support/repository/fixture.ts";
import { openHistory } from "../../support/repository/interactions.ts";

const meta: Meta = {
  title: "Desktop/Repository file history",
  component: RepositoryDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
};
export default meta;
async function sidebar(element: HTMLElement, file?: string) {
  const canvas = within(element);
  await waitFor(() =>
    expect(element.querySelector('[data-notes-ready="true"]')).not.toBeNull(),
  );
  await userEvent.click(
    await canvas.findByRole("tab", { name: "File history" }),
  );
  if (file)
    await userEvent.click(await canvas.findByRole("button", { name: file }));
  return within(
    await canvas.findByRole("region", { name: "Active file history" }),
  );
}
export const NoActiveFile: StoryObj = {
  play: async ({ canvasElement }) => {
    const panel = await sidebar(canvasElement);
    await expect(panel.getByText("No file selected")).toBeVisible();
    await expect(
      panel.getByRole("button", { name: "Blame file" }),
    ).toBeDisabled();
    expect(panel.getByRole("status").querySelector("svg")).not.toBeNull();
    await expect(panel.getByText(/Open a file in the editor/)).toBeVisible();
    expect(historyContext(canvasElement).fixture.calls).toHaveLength(0);
  },
};
export const NoRevisions: StoryObj = {
  args: { files: { "Other.md": "# Another note" } },
  play: async ({ canvasElement }) => {
    const panel = await sidebar(canvasElement, "Other.md");
    await expect(await panel.findByText("No file history")).toBeVisible();
    expect(panel.getByRole("status").querySelector("svg")).not.toBeNull();
    await expect(
      panel.getByText(/No revisions changed this file/),
    ).toBeVisible();
  },
};
export const FollowEditorAndOpenRevision: StoryObj = {
  args: { files: { "Other.md": "# Another note" } },
  play: async ({ canvasElement }) => {
    const panel = await sidebar(canvasElement, "Welcome.md"),
      canvas = within(canvasElement);
    const row = await panel.findByRole("button", {
      name: /Keep repository history beside the notes/,
    });
    expect(
      panel.queryByRole("combobox", { name: "File history operation" }),
    ).toBeNull();
    expect(panel.queryByRole("button", { name: /About Ada/ })).toBeNull();
    await userEvent.click(canvas.getByRole("tab", { name: "File history" }));
    await expect(row).toBeVisible();
    await userEvent.click(
      await canvas.findByRole("button", { name: "Other.md" }),
    );
    await expect(
      await panel.findByText(/No revisions changed this file/),
    ).toBeVisible();
    expect(
      panel.queryByRole("button", { name: /Keep repository history/ }),
    ).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Welcome.md" }));
    await userEvent.click(
      await panel.findByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    );
    const log = within(
      await canvas.findByRole("region", { name: "Repository history" }),
    );
    await expect(
      await log.findByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(log.getByRole("combobox", { name: "Operation" })).toHaveValue(
      operation,
    );
    await expect(panel.getByText(/Open a file in the editor/)).toBeVisible();
    await expect(
      panel.getByRole("button", { name: "Blame file" }),
    ).toBeDisabled();
  },
};
export const FailureAndRecovery: StoryObj = {
  args: { scenario: "file-history-failure" },
  play: async ({ canvasElement }) => {
    const panel = await sidebar(canvasElement, "Welcome.md"),
      body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByText("The file history could not be read"),
    ).toBeVisible();
    expect(panel.queryByText("The file history could not be read")).toBeNull();
    historyContext(canvasElement).fixture.recover();
    await userEvent.click(
      panel.getByRole("button", { name: "Refresh file history" }),
    );
    await expect(
      await panel.findByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    ).toBeVisible();
    await waitFor(() =>
      expect(body.queryByText("The file history could not be read")).toBeNull(),
    );
  },
};
export const OpenDuringLogPreparation: StoryObj = {
  play: async ({ canvasElement }) => {
    await openHistory(canvasElement);
    const panel = await sidebar(canvasElement, "Welcome.md");
    const { fixture } = historyContext(canvasElement);
    const read = fixture.reader.read;
    let release!: () => void;
    const pending = new Promise<void>((resolve) => (release = resolve));
    let requested = false;
    fixture.reader.read = async (handle, query) => {
      if (
        query.kind === "graph" &&
        query.query[0].graph === "log" &&
        query.query[0].revset === "all()"
      ) {
        requested = true;
        await pending;
      }
      return read(handle, query);
    };
    await userEvent.click(
      await panel.findByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    );
    const body = within(canvasElement.ownerDocument.body);
    try {
      await waitFor(() => expect(requested).toBe(true));
      expect(body.queryByText(/outside the bounded JJ Log history/)).toBeNull();
    } finally {
      release();
    }
    const log = within(
      await within(canvasElement).findByRole("region", {
        name: "Repository history",
      }),
    );
    await waitFor(() =>
      expect(
        log.getByRole("button", {
          name: /Keep repository history beside the notes/,
        }),
      ).toHaveAttribute("aria-pressed", "true"),
    );
    expect(body.queryByText(/outside the bounded JJ Log history/)).toBeNull();
  },
};
export const Preparing: StoryObj = {
  args: { scenario: "file-preparing" },
  play: async ({ canvasElement }) => {
    const panel = await sidebar(canvasElement, "Welcome.md");
    await expect(
      await panel.findByRole("status", { name: "Loading file history…" }),
    ).toBeVisible();
    await expect(
      panel.getByRole("button", { name: "Refresh file history" }),
    ).toBeDisabled();
    expect(
      historyContext(canvasElement).app.notifications.activeProgress.some(
        (status) => status.title === "Loading file history",
      ),
    ).toBe(true);
  },
};

export const RenameAndDelete: StoryObj = {
  play: async ({ canvasElement }) => {
    const panel = await sidebar(canvasElement, "Welcome.md");
    await panel.findByRole("button", {
      name: /Keep repository history beside the notes/,
    });
    await userEvent.click(
      within(canvasElement).getByRole("tab", { name: "File history" }),
    );
    const { app } = historyContext(canvasElement);
    const file = app.vault.getFileByPath("Welcome.md")!;
    await app.vault.rename(file, "Renamed.md");
    await expect(await panel.findByText("Renamed.md")).toBeVisible();
    await expect(
      await panel.findByText(/No revisions changed this file/),
    ).toBeVisible();
    await app.vault.delete(app.vault.getFileByPath("Renamed.md")!);
    await expect(
      await panel.findByText(/Open a file in the editor/),
    ).toBeVisible();
  },
};
