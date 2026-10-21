import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import SettingsDemo from "../../support/ai/SettingsDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { aiReviewAction, aiReviewValue } from "../../support/ai/review.ts";
const meta = {
  title: "Desktop/AI/Agent providers",
  component: SettingsDemo,
  args: { scenario: "setup-agents" },
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
} satisfies Meta<typeof SettingsDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
async function edit(canvasElement: HTMLElement, name: string) {
  const body = within(canvasElement.ownerDocument.body);
  await waitFor(() =>
    expect(
      getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
    ).not.toBe("none"),
  );
  await userEvent.click(
    await within(canvasElement).findByRole("button", { name }),
  );
  const dialog = within(await body.findByRole("dialog"));
  await dialog.findByRole("button", { name: /^LLM provider:/ });
  return { body, dialog };
}
export const IndependentProviders: Story = {
  play: async ({ canvasElement }) => {
    const { body, dialog } = await edit(canvasElement, "Edit Qwen research");
    expect(dialog.getByLabelText("Endpoint")).toHaveValue(
      "https://models.example/v1",
    );
    expect(dialog.getByLabelText("API key")).toHaveValue("");
    expect(dialog.getByRole("combobox", { name: "Model" })).toHaveTextContent(
      /qwen|Qwen/,
    );
    await userEvent.click(dialog.getByRole("combobox", { name: "Model" }));
    await userEvent.click(
      await body.findByRole("option", { name: /Custom model ID/ }),
    );
    const custom = await dialog.findByRole("textbox", {
      name: "Custom model ID",
    });
    await userEvent.clear(custom);
    expect(dialog.getByRole("button", { name: "Save agent" })).toBeDisabled();
    await userEvent.type(custom, "qwen3.8-max-custom");
    await userEvent.click(dialog.getByRole("button", { name: "Save agent" }));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await aiReviewAction(canvasElement, "Inspect saved settings");
    const saved = JSON.parse(aiReviewValue(canvasElement, "Saved AI data"));
    expect(saved.settings.agentParticipants[0]).toMatchObject({
      providerProfileId: "qwen",
      model: "qwen3.8-max-custom",
    });
    expect(JSON.stringify(saved)).not.toContain("models.example");
    const next = await edit(canvasElement, "Edit Offline assistant");
    expect(
      next.dialog.getByRole("button", { name: /^LLM provider:/ }),
    ).toHaveTextContent("This machine");
    expect(next.dialog.queryByRole("combobox", { name: "Model" })).toBeNull();
  },
};
export const ExistingConfiguration: Story = {
  play: async ({ canvasElement }) => {
    const { dialog } = await edit(canvasElement, "Edit existing Lapis agent");
    expect(
      dialog.getByRole("button", { name: /^LLM provider:/ }),
    ).toHaveTextContent("OpenAI");
    expect(dialog.getByLabelText("API key")).toHaveValue("");
    expect(dialog.getByRole("combobox", { name: "Model" })).toHaveTextContent(
      /example|Example/,
    );
  },
};
export const ProviderSaveFailure: Story = {
  args: { scenario: "setup-save-error" },
  play: async ({ canvasElement }) => {
    const { dialog } = await edit(canvasElement, "Edit existing Lapis agent");
    const key = dialog.getByLabelText("API key");
    await userEvent.type(key, "synthetic-unsaved-key");
    await userEvent.click(dialog.getByRole("button", { name: "Save agent" }));
    await dialog.findByRole("button", { name: "Check provider save" });
    expect(key).toHaveValue("synthetic-unsaved-key");
    await aiReviewAction(canvasElement, "Inspect saved settings");
    expect(aiReviewValue(canvasElement, "AI notifications")).toContain(
      "Synthetic provider save failed",
    );
  },
};
