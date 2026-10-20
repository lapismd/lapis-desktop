import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import SettingsDemo from "../../support/ai/SettingsDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { aiReviewAction, aiReviewValue } from "../../support/ai/review.ts";
const meta = {
  title: "Desktop/AI setup",
  component: SettingsDemo,
  args: { scenario: "setup" },
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
} satisfies Meta<typeof SettingsDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ProvidersAndCompute: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const provider = await canvas.findByRole("region", {
      name: "Lapis provider",
    });
    await expect(await within(provider).findByLabelText("API key")).toHaveValue(
      "",
    );
    const compute = await canvas.findByRole("region", {
      name: "Optional compute",
    });
    await waitFor(() =>
      expect(
        within(compute).getByRole("button", { name: "Start model" }),
      ).toBeEnabled(),
    );
    await userEvent.click(
      within(compute).getByRole("tab", { name: "Resources" }),
    );
    await userEvent.type(
      within(compute).getByLabelText("Maximum memory / VRAM"),
      "8",
    );
    await userEvent.click(
      within(compute).getByRole("button", { name: "Save compute settings" }),
    );
    await waitFor(() =>
      expect(
        within(compute).getByRole("button", { name: "Save compute settings" }),
      ).toBeEnabled(),
    );
    await userEvent.click(
      within(compute).getByRole("tab", { name: "Sharing" }),
    );
    await expect(
      within(compute).getByRole("switch", { name: "Share this machine" }),
    ).not.toBeChecked();
    await userEvent.click(within(compute).getByRole("tab", { name: "Models" }));
    await expect(
      within(compute).getByRole("button", { name: "Download model" }),
    ).toBeVisible();
  },
};
export const Loading: Story = {
  args: { scenario: "setup-loading" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByLabelText("Loading provider settings"),
    ).toBeVisible();
    await expect(
      await canvas.findByLabelText("Loading compute settings"),
    ).toBeVisible();
  },
};
export const SetupFailure: Story = {
  args: { scenario: "setup-error" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText("Provider settings unavailable"),
    ).toBeVisible();
    await expect(
      await canvas.findByText("Compute settings unavailable"),
    ).toBeVisible();
    await aiReviewAction(canvasElement, "Inspect saved settings");
    await expect(aiReviewValue(canvasElement, "AI notifications")).toContain(
      "Synthetic setup unavailable",
    );
  },
};
export const RunningCompute: Story = {
  args: { scenario: "setup-running" },
  play: async ({ canvasElement }) => {
    const compute = within(
      await within(canvasElement).findByRole("region", {
        name: "Optional compute",
      }),
    );
    await userEvent.click(
      await compute.findByRole("button", { name: "Stop compute" }),
    );
    await waitFor(() =>
      expect(
        compute.getByRole("button", { name: "Stop compute" }),
      ).toBeDisabled(),
    );
  },
};

export const ProviderSaveFailure: Story = {
  args: { scenario: "setup-save-error" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const provider = within(
      await canvas.findByRole("region", { name: "Lapis provider" }),
    );
    const key = await provider.findByLabelText("API key");
    await userEvent.type(key, "synthetic-unsaved-key");
    await userEvent.click(
      provider.getByRole("button", { name: "Save provider" }),
    );
    await expect(
      await provider.findByRole("button", { name: "Retry save" }),
    ).toBeEnabled();
    await expect(key).toHaveValue("synthetic-unsaved-key");
    await aiReviewAction(canvasElement, "Inspect saved settings");
    await expect(aiReviewValue(canvasElement, "AI notifications")).toContain(
      "Synthetic provider save failed",
    );
  },
};

export const Sharing: Story = {
  play: async ({ canvasElement }) => {
    const compute = within(
      await within(canvasElement).findByRole("region", {
        name: "Optional compute",
      }),
    );
    await userEvent.click(await compute.findByRole("tab", { name: "Sharing" }));
    await expect(
      compute.getByRole("switch", { name: "Share this machine" }),
    ).not.toBeChecked();
    await expect(
      compute.getByRole("button", { name: "Inference host: This machine" }),
    ).toBeVisible();
  },
};
