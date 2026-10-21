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
    await expect(canvas.getAllByText("Lapis provider")).toHaveLength(1);
    await expect(canvas.getAllByText("Optional compute")).toHaveLength(1);
    const page = canvasElement.querySelector(".ai-settings-page")!;
    await expect(provider.getBoundingClientRect().width).toBeCloseTo(
      page.getBoundingClientRect().width,
      0,
    );
    await expect(await within(provider).findByLabelText("API key")).toHaveValue(
      "",
    );
    const compute = await canvas.findByRole("region", {
      name: "Optional compute",
    });
    await expect(compute.getBoundingClientRect().width).toBeCloseTo(
      page.getBoundingClientRect().width,
      0,
    );
    await expect(canvas.getAllByRole("heading", { name: "AI" })).toHaveLength(
      1,
    );
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
        name: "Optional compute",
      }),
    );
    const portal = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await compute.findByRole("tab", { name: "Resources" }),
    );
    await userEvent.type(compute.getByLabelText("Maximum memory / VRAM"), "4");
    await userEvent.click(compute.getByRole("tab", { name: "Models" }));
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

export const RequiredProviderModel: Story = {
  play: async ({ canvasElement }) => {
    const provider = within(
      await within(canvasElement).findByRole("region", {
        name: "Lapis provider",
      }),
    );
    const model = await provider.findByLabelText("Default model");
    await userEvent.clear(model);
    await expect(
      provider.getByRole("button", { name: "Save provider" }),
    ).toBeDisabled();
    await expect(model).toBeRequired();
    await userEvent.type(model, "qwen3.8-max");
    await userEvent.click(
      provider.getByRole("button", { name: "Save provider" }),
    );
    await waitFor(() =>
      expect(
        provider.getByRole("button", { name: "Save provider" }),
      ).toBeEnabled(),
    );
    await userEvent.click(
      provider.getByRole("button", { name: "Check again" }),
    );
    await expect(model).toHaveValue("qwen3.8-max");
    await userEvent.click(
      provider.getByRole("button", { name: "Provider: OpenAI" }),
    );
    await userEvent.click(
      await within(canvasElement.ownerDocument.body).findByRole("option", {
        name: "This machine",
      }),
    );
    await expect(provider.queryByLabelText("Default model")).toBeNull();
    await expect(
      provider.getByRole("button", { name: "Save provider" }),
    ).toBeEnabled();
  },
};
