import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within, userEvent } from "storybook/test";
import VaultLauncher from "../../src/components/vaults/VaultLauncher.svelte";
import LauncherDemo from "../support/LauncherDemo.svelte";

const meta: Meta = {
  title: "Desktop/Vault launcher",
  component: VaultLauncher,
  tags: ["autodocs", "visual-pending"],
  render: (_args, { parameters }) => ({
    Component: LauncherDemo,
    props: { failure: parameters.failure, canReturn: parameters.canReturn },
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
