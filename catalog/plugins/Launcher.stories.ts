import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within, userEvent, waitFor } from "storybook/test";
import VaultLauncher from "../../src/components/vaults/VaultLauncher.svelte";
import LauncherDemo from "../support/LauncherDemo.svelte";
import { cleanupCatalog } from "../support/lifecycle.ts";

const meta: Meta = {
  title: "Desktop/Vault launcher",
  component: VaultLauncher,
  tags: ["autodocs", "visual-pending"],
  beforeEach: () => cleanupCatalog,
  render: (_args, { parameters }) => ({
    Component: LauncherDemo,
    props: {
      failure: parameters.failure,
      canReturn: parameters.canReturn,
      scenario: parameters.scenario,
    },
  }),
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          "The production desktop vault launcher with an injected, disposable native client. No native process or saved profile is used.",
      },
      source: {
        type: "code",
        language: "svelte",
        code: `<script lang="ts">
  import VaultLauncher from "./src/components/vaults/VaultLauncher.svelte";
  import { VaultClient } from "./src/lib/native/vault-client";
  const client = new VaultClient();
  async function onOpenNotes(vault) { /* open the owned Notes session */ }
  function onError(error) { console.error(error); }
</script>
<VaultLauncher {client} {onOpenNotes} {onError} />`,
      },
    },
  },
};
export default meta;
type Story = StoryObj;

async function launcherAction(element: HTMLElement) {
  await waitFor(() =>
    expect(getComputedStyle(element).pointerEvents).not.toBe("none"),
  );
  await userEvent.click(element);
}

export const OpenVault: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /^Open Vault/ }),
    );
    await expect(await canvas.findByTestId("opened-vault")).toHaveTextContent(
      "Research notes",
    );
  },
};
export const Dark: Story = { ...OpenVault, globals: { colorMode: "dark" } };
export const FailedOpen: Story = {
  parameters: { failure: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /^Open Vault/ }),
    );
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "folder is unavailable",
    );
    await expect(
      canvas.getByRole("button", { name: /^Open Vault/ }),
    ).toBeEnabled();
  },
};
export const ReturnToVault: Story = {
  parameters: { canReturn: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /close|return/i }),
    );
    await expect(await canvas.findByTestId("opened-vault")).toHaveTextContent(
      "Research notes",
    );
  },
};

export const EmptyRecents: Story = {
  parameters: { scenario: "empty" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("New Desktop Vault")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "View all" })).toBeNull();
  },
};
export const CreateVault: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /^Create New Vault/ }),
    );
    await expect(await canvas.findByTestId("opened-vault")).toHaveTextContent(
      "New notes",
    );
  },
};
export const CancelledPicker: Story = {
  parameters: { scenario: "cancel" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const open = await canvas.findByRole("button", { name: /^Open Vault/ });
    await userEvent.click(open);
    await expect(open).toBeEnabled();
    await expect(canvas.queryByTestId("opened-vault")).toBeNull();
    await expect(canvas.queryByRole("alert")).toBeNull();
  },
};
export const OpeningVault: Story = {
  parameters: { scenario: "pending" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /^Open Vault/ }),
    );
    await expect(
      canvas.getByRole("button", { name: /^Open Vault/ }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole("button", { name: /^Create New Vault/ }),
    ).toBeDisabled();
  },
};
export const RecentVault: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /Research notes/ }),
    );
    await expect(await canvas.findByTestId("opened-vault")).toHaveTextContent(
      "Research notes",
    );
  },
};
export const MissingRecentVault: Story = {
  parameters: { failure: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /Research notes/ }),
    );
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "folder is unavailable",
    );
    await expect(
      canvas.getByRole("button", { name: /Research notes/ }),
    ).toBeEnabled();
  },
};
export const RecentSearch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "View all" }),
    );
    const dialog = await within(canvasElement.ownerDocument.body).findByRole(
      "dialog",
      { name: "Recent Projects" },
    );
    const search = within(dialog).getByRole("combobox", {
      name: "Search recent vaults",
    });
    await userEvent.type(search, "Research");
    await expect(
      within(dialog).getByRole("option", { name: /Research notes/ }),
    ).toBeVisible();
  },
};
export const NoMatchingRecents: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await launcherAction(
      await canvas.findByRole("button", { name: "View all" }),
    );
    const body = within(canvasElement.ownerDocument.body);
    const search = await body.findByRole("combobox", {
      name: "Search recent vaults",
    });
    await userEvent.type(search, "No matching vault");
    await expect(
      await body.findByText("No matching recent vaults"),
    ).toBeVisible();
  },
};
export const AppearanceSettings: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await launcherAction(
      await canvas.findByRole("button", { name: "Settings" }),
    );
    const dialog = await within(canvasElement.ownerDocument.body).findByRole(
      "dialog",
      { name: "Desktop Settings" },
    );
    await waitFor(() => expect(dialog).toBeVisible());
    for (const name of [/^Match System/, /^Light/, /^Dark/])
      await waitFor(() =>
        expect(within(dialog).getByRole("button", { name })).toBeVisible(),
      );
  },
};
