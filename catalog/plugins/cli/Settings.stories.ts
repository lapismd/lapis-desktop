import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { CliSettings } from "@lapis-notes/ui/cli";
import { cliFixture } from "../../support/cli/fixture.ts";
const meta = {
  title: "Desktop/CLI Settings",
  component: CliSettings,
  tags: ["visual-pending"],
  parameters: {
    docs: {
      source: {
        language: "svelte",
        type: "code",
        code: '<script>\nimport { CliSettings } from "@lapis-notes/ui/cli";\nexport let host;\n</script>\n<CliSettings {host} />',
      },
    },
  },
} satisfies Meta<typeof CliSettings>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Install: Story = { args: { host: cliFixture() } };
export const Installed: Story = { args: { host: cliFixture("installed") } };
export const Repair: Story = { args: { host: cliFixture("broken") } };
export const ScopedDesktopAccess: Story = {
  args: { host: cliFixture("installed") },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const access = within(
      canvas.getByRole("region", { name: "Desktop CLI access" }),
    );
    await waitFor(() =>
      expect(
        access.getByRole("button", { name: "Enable desktop access" }),
      ).toBeEnabled(),
    );
    await userEvent.click(
      access.getByRole("button", { name: "Enable desktop access" }),
    );
    const create = await access.findByRole("button", {
      name: "Create credential and save token file",
    });
    expect(create).toBeDisabled();
    await userEvent.click(access.getByRole("checkbox", { name: "Notes" }));
    await userEvent.click(create);
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
      access.getByRole("button", { name: "Disable desktop access" }),
    );
    await expect(
      await access.findByRole("button", { name: "Enable desktop access" }),
    ).toBeEnabled();
  },
};
