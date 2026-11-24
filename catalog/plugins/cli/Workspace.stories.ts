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
        fields: [
          {
            id: "advanced",
            type: "group",
            fields: [
              { id: "cli.status", type: "custom", adapter: "lapis.cli.status" },
              {
                id: "cli.installation",
                type: "custom",
                adapter: "lapis.cli.installation",
              },
              { id: "cli.refresh", type: "custom" },
            ],
          },
          {
            id: "cli.desktop-access",
            type: "group",
            fields: [{ id: "cli.access", type: "custom" }],
          },
        ],
        searchEntries: [{ id: "cli", path: ["General", "Advanced"] }],
      });
      expect(settings.values).toEqual({});
      expect(settings.search("CLI")).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            sectionId: "general",
            fieldId: "cli",
            title: "Command line interface",
          }),
          expect.objectContaining({
            sectionId: "general",
            fieldId: "cli.status",
            path: ["General", "Advanced", "Status"],
          }),
        ]),
      );
    } finally {
      dispose();
    }
    expect(
      settings.sections.find((section) => section.id === "general"),
    ).toBeUndefined();
    expect(settings.search("CLI")).toEqual([]);
    const disposeReplacement = registerCliSettings(settings, cliFixture());
    expect(
      settings.sections.find((section) => section.id === "general"),
    ).toBeDefined();
    disposeReplacement();
    expect(
      settings.sections.find((section) => section.id === "general"),
    ).toBeUndefined();
    expect(settings.search("CLI")).toEqual([]);
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
    const cli = within(await canvas.findByRole("dialog", { name: "Settings" }));
    await userEvent.click(cli.getByRole("button", { name: "General" }));
    await expect(cli.getByText("Advanced", { exact: true })).toBeVisible();
    await expect(
      cli.getByText("Desktop access", { exact: true }),
    ).toBeVisible();
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
      canvas.queryByRole("region", { name: "Desktop CLI access" }),
    ).toBeNull();
  },
};
