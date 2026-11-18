import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { WorkspaceSettingsController } from "@lapismd/design-core/workspace/settings";
import { registerCliSettings } from "@lapis-notes/ui/cli";
import NotesWorkspace from "../../../src/components/views/NotesWorkspace.svelte";
import NotesDemo from "../../support/NotesDemo.svelte";
import { cliFixture } from "../../support/cli/fixture.ts";
import { cleanupCatalog } from "../../support/lifecycle";
import { notesReady } from "../../support/notes/readiness.ts";

const meta = {
  title: "Desktop/CLI workspace settings",
  component: NotesWorkspace,
  tags: ["visual-pending", "!autodocs"],
  render: () => ({
    Component: NotesDemo,
    props: { cliSettings: cliFixture("installed") },
  }),
  beforeEach: () => cleanupCatalog,
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const GeneralAdvancedAndDisposal: Story = {
  play: async ({ canvasElement }) => {
    // Public controller state proves registration disposal independently of DOM removal.
    const settings = new WorkspaceSettingsController();
    const dispose = registerCliSettings(settings, cliFixture());
    try {
      expect(
        settings.sections.find((section) => section.id === "general"),
      ).toMatchObject({
        fields: [{ id: "advanced", fields: [{ id: "cli" }] }],
        searchEntries: [{ id: "cli", path: ["General", "Advanced"] }],
      });
    } finally {
      dispose();
    }
    expect(
      settings.sections.find((section) => section.id === "general"),
    ).toBeUndefined();
    const disposeReplacement = registerCliSettings(settings, cliFixture());
    disposeReplacement();
    settings.destroy();

    await notesReady(canvasElement);
    const canvas = within(canvasElement);
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector('[data-notes-ready="true"]'),
        ).not.toBeNull(),
      { timeout: 30_000 },
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Open settings" }),
    );
    await userEvent.click(canvas.getByRole("button", { name: "General" }));
    await expect(canvas.getByText("Advanced", { exact: true })).toBeVisible();
    const cli = within(
      await canvas.findByRole("region", { name: "Command line interface" }),
    );
    await expect(
      await cli.findByRole("button", { name: "Uninstall CLI" }),
    ).toBeEnabled();
    const access = within(
      cli.getByRole("region", { name: "Desktop CLI access" }),
    );
    await userEvent.click(
      await access.findByRole("button", { name: "Enable desktop access" }),
    );
    await userEvent.click(access.getByRole("checkbox", { name: "Notes" }));
    await userEvent.click(
      access.getByRole("button", {
        name: "Create credential and save token file",
      }),
    );
    await expect(
      await access.findByText(/lapis --target http:/),
    ).toHaveTextContent("--token-file");
    await userEvent.click(
      access.getByRole("button", { name: "Revoke CLI client" }),
    );
    await waitFor(() =>
      expect(
        access.queryByRole("button", { name: "Revoke CLI client" }),
      ).toBeNull(),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Close settings" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Current workspace: Catalog vault" }),
    );
    await userEvent.click(
      within(document.body).getByRole("menuitem", { name: "Back to vaults" }),
    );
    await waitFor(() =>
      expect(
        canvas.queryByRole("group", { name: "Notes workspace" }),
      ).toBeNull(),
    );
    expect(
      canvas.queryByRole("region", { name: "Command line interface" }),
    ).toBeNull();
  },
};
