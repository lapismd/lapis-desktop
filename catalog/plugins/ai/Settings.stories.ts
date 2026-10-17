// SPDX-License-Identifier: Apache-2.0
import { aiReviewAction, aiReviewValue } from "../../support/ai/review.ts";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import SettingsDemo from "../../support/ai/SettingsDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { clickHarnessControl } from "../../support/ai/menu-interactions.ts";

const meta = {
  title: "Desktop/AI/Settings",
  component: SettingsDemo,
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
  await settled(element);
  return within(element);
}
async function settled(element: HTMLElement) {
  await waitFor(() =>
    expect(getComputedStyle(element.ownerDocument.body).pointerEvents).not.toBe(
      "none",
    ),
  );
}
async function saved(element: HTMLElement) {
  await aiReviewAction(element, "Inspect saved settings");
  return JSON.parse(aiReviewValue(element, "Saved AI data"));
}
async function choose(element: HTMLElement, label: string, option: string) {
  const canvas = within(element);
  await userEvent.click(await canvas.findByRole("combobox", { name: label }));
  await clickHarnessControl(
    await within(element.ownerDocument.body).findByRole("option", {
      name: option,
    }),
  );
  await settled(element);
}

export const ControlledPreferences: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await choose(canvasElement, "ACP agent", "Cursor");
    await choose(canvasElement, "Default model", "cursor next");
    await choose(canvasElement, "Thinking", "High");
    await waitFor(async () =>
      expect((await saved(canvasElement)).settings).toMatchObject({
        acpAgent: "cursor",
        defaultModel: "cursor-next",
        thinking: "high",
        defaultModels: { codex: "codex-saved", cursor: "cursor-next" },
      }),
    );
    await choose(canvasElement, "ACP agent", "Codex");
    await waitFor(async () =>
      expect((await saved(canvasElement)).settings.defaultModel).toBe(
        "codex-saved",
      ),
    );
    const data = await saved(canvasElement);
    expect(data.sessions).toEqual([{ id: "retained-controller-history" }]);
    expect(data.futureValue).toEqual({ retained: true });
    const flat = JSON.parse(aiReviewValue(canvasElement, "Flat app settings"));
    expect(flat).not.toHaveProperty("ai.defaultModel");
    expect(flat).not.toHaveProperty("ai.thinking");
    expect(
      aiReviewValue(canvasElement, "Model catalog requests"),
    ).not.toContain("native");
  },
};

export const HistoricalRuntimePreferences: Story = {
  args: { scenario: "legacy" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    expect(
      canvas.getAllByText(/Saved preference: Codex native \(unavailable\)/),
    ).toHaveLength(3);
    await userEvent.click(
      canvas.getByRole("combobox", { name: "Default runtime" }),
    );
    const body = within(canvasElement.ownerDocument.body);
    expect(
      body.getAllByRole("option").map((option) => option.textContent?.trim()),
    ).toEqual(["Automatic", "ACP"]);
    await userEvent.keyboard("{Escape}");
    await settled(canvasElement);
    await choose(canvasElement, "Thinking", "High");
    await waitFor(async () =>
      expect((await saved(canvasElement)).settings).toMatchObject({
        defaultRuntime: "codex-native",
        memoryConsolidationRuntime: "codex-native",
        handoffSummaryRuntime: "codex-native",
        thinking: "high",
      }),
    );
    await choose(canvasElement, "Default runtime", "ACP");
    await waitFor(async () =>
      expect((await saved(canvasElement)).settings.defaultRuntime).toBe("acp"),
    );
  },
};

export const ToolRegistryAndCleanup: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    expect(canvas.getByRole("switch", { name: "read" })).toBeChecked();
    const community = canvas.getByRole("switch", {
      name: "community_count",
    });
    expect(community).not.toBeChecked();
    await userEvent.click(community);
    await waitFor(async () =>
      expect((await saved(canvasElement)).settings.enabledAppToolNames).toEqual(
        ["community_count"],
      ),
    );
    await aiReviewAction(canvasElement, "Register temporary tool");
    expect(
      await canvas.findByRole("switch", {
        name: "temporary_tool",
      }),
    ).not.toBeChecked();
    await aiReviewAction(canvasElement, "Unregister temporary tool");
    await waitFor(() =>
      expect(
        canvas.queryByRole("switch", { name: "temporary_tool" }),
      ).toBeNull(),
    );
    await aiReviewAction(canvasElement, "Disable AI settings");
    expect(
      canvas.queryByRole("combobox", { name: "Default runtime" }),
    ).toBeNull();
    expect(aiReviewValue(canvasElement, "AI model source registered")).toBe(
      "false",
    );
  },
};

export const SaveFailureAndRetry: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await aiReviewAction(canvasElement, "Fail next settings write");
    await userEvent.click(
      canvas.getByRole("switch", {
        name: "Automatic memory recall",
      }),
    );
    expect(
      await canvas.findByText("Fixture settings write failed"),
    ).toBeVisible();
    expect(
      (await saved(canvasElement)).settings.memoryAutomaticRecall ?? false,
    ).toBe(false);
    await userEvent.click(
      canvas.getByRole("switch", {
        name: "Automatic memory recall",
      }),
    );
    await waitFor(async () =>
      expect((await saved(canvasElement)).settings.memoryAutomaticRecall).toBe(
        true,
      ),
    );
  },
};

export const UnavailableModelCatalog: Story = {
  args: { scenario: "catalog-error" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await userEvent.click(
      canvas.getByRole("combobox", { name: "Default model" }),
    );
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() =>
      expect(body.getByRole("option", { name: /codex-saved/ })).toBeVisible(),
    );
    await userEvent.keyboard("{Escape}");
    await settled(canvasElement);
    expect((await saved(canvasElement)).settings.defaultModels.codex).toBe(
      "codex-saved",
    );
    expect(aiReviewValue(canvasElement, "AI notifications")).toContain(
      "Fixture provider unavailable",
    );
  },
};
