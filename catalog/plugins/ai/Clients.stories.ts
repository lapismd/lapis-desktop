import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import SettingsDemo from "../../support/ai/SettingsDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { aiReviewAction, aiReviewValue } from "../../support/ai/review.ts";
const meta = {
  title: "Desktop/AI installed clients",
  component: SettingsDemo,
  args: { scenario: "clients" },
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
} satisfies Meta<typeof SettingsDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
async function ready(element: HTMLElement) {
  await waitFor(() =>
    expect(
      element.querySelector('[data-settings-ready="true"]'),
    ).not.toBeNull(),
  );
  return within(element);
}
async function selectCategory(element: HTMLElement, name: string) {
  const canvas = within(element);
  const sidebar = canvas.queryByRole("navigation", { name: "Settings" });
  if (sidebar) {
    await userEvent.click(within(sidebar).getByRole("button", { name }));
    return;
  }
  await userEvent.click(
    canvas.getByRole("button", { name: "Open settings navigation" }),
  );
  const navigation = await within(element.ownerDocument.body).findByRole(
    "dialog",
    {
      name: "Settings navigation",
    },
  );
  await userEvent.click(within(navigation).getByRole("button", { name }));
  await waitFor(() => expect(navigation).not.toBeInTheDocument());
}
export const InstalledClients: Story = {
  args: { scenario: "clients-ready" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await expect(
      await canvas.findByRole("heading", { name: "Agents" }),
    ).toBeVisible();
    await expect(
      await canvas.findByRole("region", { name: "Installed clients" }),
    ).toBeVisible();
    await expect(
      await canvas.findByText("ACP 1.13.1 · CLI 0.156.1 · Managed by Lapis"),
    ).toBeVisible();
  },
};
export const UpdateAvailable: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Update Codex runtime" }),
    );
    const dialog = within(canvasElement.ownerDocument.body);
    const confirmation = await dialog.findByRole("dialog", {
      name: "Update Codex runtime?",
    });
    await waitFor(() => expect(confirmation).toBeVisible());
    await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(dialog.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  },
};
export const UpdateAndRefresh: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Update Codex runtime" }),
    );
    await userEvent.click(
      await within(canvasElement.ownerDocument.body).findByRole("button", {
        name: "Update runtime",
      }),
    );
    await waitFor(() =>
      expect(
        canvas.queryByRole("button", { name: "Update Codex runtime" }),
      ).not.toBeInTheDocument(),
    );
    await expect(
      await canvas.findByText("ACP 1.13.1 · CLI 0.156.1 · Managed by Lapis"),
    ).toBeVisible();
  },
};
export const Loading: Story = {
  args: { scenario: "clients-loading" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await expect(
      await canvas.findByRole("status", { name: "Loading agent runtimes" }),
    ).toBeVisible();
  },
};
export const DiscoveryFailure: Story = {
  args: { scenario: "clients-error" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await expect(
      await canvas.findByText("Runtime status unavailable"),
    ).toBeVisible();
    await aiReviewAction(canvasElement, "Inspect saved settings");
    expect(aiReviewValue(canvasElement, "AI notifications")).toContain(
      "Fixture client discovery failed",
    );
  },
};

export const SettingsCategory: Story = {
  args: { scenario: "clients-ready" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await selectCategory(canvasElement, "AI");
    await expect(
      await canvas.findByRole("combobox", { name: "Default runtime" }),
    ).toBeVisible();
    expect(
      canvas.queryByRole("region", { name: "Installed clients" }),
    ).toBeNull();
    await selectCategory(canvasElement, "Agents");
    await expect(
      await canvas.findByRole("region", { name: "Installed clients" }),
    ).toBeVisible();
    await aiReviewAction(canvasElement, "Disable AI settings");
    expect(
      canvas.queryByRole("region", { name: "Installed clients" }),
    ).toBeNull();
  },
};
