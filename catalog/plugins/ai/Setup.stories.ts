import {
  expectPinnedSettingsTabs,
  selectSettingsTab,
} from "../../support/ai/settings-tabs.ts";
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
export const ComputeSettings: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("tablist", { name: "Compute settings" });
    expect(canvas.queryByRole("heading", { name: "Compute" })).toBeNull();
    expect(canvas.queryByText("Lapis provider")).toBeNull();
    const compute = within(
      await canvas.findByRole("region", { name: "Local compute" }),
    );
    await selectSettingsTab(canvasElement, "Compute settings", "Models");
    expect(compute.getByRole("tabpanel", { name: "Models" })).toHaveTextContent(
      "Local inference stays off until you start it.",
    );
    const modelPanel = compute.getByRole("tabpanel", { name: "Models" });
    const rows = modelPanel.querySelectorAll(".compute-setting-row");
    expect(getComputedStyle(rows[rows.length - 1]!).borderBottomWidth).toBe(
      "0px",
    );
    expect(getComputedStyle(rows[0]!).borderBottomWidth).toBe("1px");
    await expectPinnedSettingsTabs(canvasElement);
    await selectSettingsTab(canvasElement, "Compute settings", "Resources");
    await userEvent.type(compute.getByLabelText("Max VRAM (GB)"), "8");
    await selectSettingsTab(canvasElement, "Compute settings", "Models");
    await selectSettingsTab(canvasElement, "Compute settings", "Resources");
    expect(compute.getByLabelText("Max VRAM (GB)")).toHaveValue(8);
    await userEvent.click(
      compute.getByRole("button", { name: "Save compute settings" }),
    );
    await waitFor(() =>
      expect(
        compute.getByRole("button", { name: "Save compute settings" }),
      ).toBeEnabled(),
    );
    expect(aiReviewValue(canvasElement, "Compute commands")).toBe(
      '["configure"]',
    );
  },
};
export const Loading: Story = {
  args: { scenario: "setup-loading" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
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
        name: "Local compute",
      }),
    );
    await expect(
      await compute.findByRole("combobox", { name: "Model" }),
    ).toBeDisabled();
    await expect(compute.getByLabelText("Custom model")).toBeDisabled();
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

export const Sharing: Story = {
  play: async ({ canvasElement }) => {
    const compute = within(
      await within(canvasElement).findByRole("region", {
        name: "Local compute",
      }),
    );
    await selectSettingsTab(canvasElement, "Compute settings", "Sharing");
    await expect(
      compute.getByRole("switch", { name: "Share this machine" }),
    ).not.toBeChecked();
    await expect(
      compute.getByRole("button", { name: "Inference host: This machine" }),
    ).toBeVisible();
  },
};

export const ModelPicker: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const portal = within(canvasElement.ownerDocument.body);
    const picker = await canvas.findByRole("combobox", { name: "Model" });
    await expect(picker).toHaveTextContent("Fits well");
    await userEvent.click(picker);
    const search = await portal.findByRole("combobox", {
      name: "Search local models",
    });
    const menu = canvasElement.ownerDocument.querySelector(
      ".compute-model-picker__menu",
    )!;
    await expect(menu.getBoundingClientRect().left).toBeGreaterThanOrEqual(0);
    await expect(menu.getBoundingClientRect().right).toBeLessThanOrEqual(
      canvasElement.ownerDocument.documentElement.clientWidth,
    );
    await expect(search).toHaveFocus();
    await expect(
      portal.getByRole("option", { name: /gemma-4-E4B/ }),
    ).toHaveTextContent("Recommended");
    await expect(
      portal.getByRole("option", { name: /Qwen3.8-27B/ }),
    ).toHaveTextContent("Too large");
    await userEvent.type(search, "Qwen2.5-Coder");
    await waitFor(() => expect(portal.getAllByRole("option")).toHaveLength(1));
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect(picker).toHaveFocus();
    await expect(canvas.getByLabelText("Custom model")).toHaveValue(
      "Qwen/Qwen2.5-Coder-7B-Instruct-GGUF:Q4_K_M",
    );
    await userEvent.clear(canvas.getByLabelText("Custom model"));
    await userEvent.type(canvas.getByLabelText("Custom model"), "my/model:Q8");
    await expect(picker).toHaveTextContent("my/model:Q8");
    await expect(picker).toHaveTextContent("Fit unknown");
    await expect(
      canvas.getByRole("button", { name: "Stop compute" }),
    ).toBeDisabled();
    await expect(aiReviewValue(canvasElement, "Compute commands")).toBe("[]");
  },
};

export const ModelMemoryLimits: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const compute = within(
      await canvas.findByRole("region", {
        name: "Local compute",
      }),
    );
    const portal = within(canvasElement.ownerDocument.body);
    await selectSettingsTab(canvasElement, "Compute settings", "Resources");
    await userEvent.type(compute.getByLabelText("Max VRAM (GB)"), "4");
    await selectSettingsTab(canvasElement, "Compute settings", "Models");
    await userEvent.click(compute.getByRole("combobox", { name: "Model" }));
    await expect(
      portal.getByRole("option", { name: /gemma-4-E4B/ }),
    ).toHaveTextContent("Too large");
    await userEvent.keyboard("{Escape}");
    await expect(aiReviewValue(canvasElement, "Compute commands")).toBe("[]");
  },
};

export const UnknownModelFit: Story = {
  args: { scenario: "setup-unknown-hardware" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const picker = await canvas.findByRole("combobox", { name: "Model" });
    await expect(picker).toHaveTextContent("custom/model:Q8");
    await expect(picker).toHaveTextContent("Fit unknown");
    await userEvent.click(picker);
    const portal = within(canvasElement.ownerDocument.body);
    await portal.findByRole("combobox", { name: "Search local models" });
    for (const option of portal.getAllByRole("option")) {
      await expect(option).toHaveTextContent("Fit unknown");
      await expect(option).not.toHaveTextContent("Recommended");
    }
    await waitFor(() =>
      expect(portal.getByText(/Machine memory unavailable/)).toBeVisible(),
    );
    await userEvent.keyboard("{Escape}");
  },
};
