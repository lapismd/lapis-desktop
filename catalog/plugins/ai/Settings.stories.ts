import {
  expectPinnedSettingsTabs,
  selectSettingsTab,
} from "../../support/ai/settings-tabs.ts";
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
    await selectSettingsTab(canvasElement, "AI settings", "Models");
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
    await selectSettingsTab(canvasElement, "AI settings", "Models");
    expect(
      within(canvas.getByRole("tabpanel", { name: "Models" })).getAllByText(
        /Saved preference: Codex native \(unavailable\)/,
      ),
    ).toHaveLength(1);
    await selectSettingsTab(canvasElement, "AI settings", "Memory");
    expect(
      within(canvas.getByRole("tabpanel", { name: "Memory" })).getAllByText(
        /Saved preference: Codex native \(unavailable\)/,
      ),
    ).toHaveLength(1);
    await selectSettingsTab(canvasElement, "AI settings", "Models");
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
        memoryConsolidationRuntime: "acp",
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
    await selectSettingsTab(canvasElement, "AI settings", "Tools");
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
    await selectSettingsTab(canvasElement, "AI settings", "Memory");
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
      (await saved(canvasElement)).settings.memoryAutomaticRecall ?? true,
    ).toBe(true);
    await userEvent.click(
      canvas.getByRole("switch", {
        name: "Automatic memory recall",
      }),
    );
    await waitFor(async () =>
      expect((await saved(canvasElement)).settings.memoryAutomaticRecall).toBe(
        false,
      ),
    );
  },
};

export const UnavailableModelCatalog: Story = {
  args: { scenario: "catalog-error" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await selectSettingsTab(canvasElement, "AI settings", "Models");
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

export const GroupedSettings: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    expect(
      canvas.getByRole("tabpanel", { name: "Conversation" }),
    ).toBeVisible();
    expect(
      canvas.getByRole("switch", { name: "Automatically tag agents" }),
    ).toBeVisible();
    expect(canvas.queryByRole("heading", { name: "AI", level: 1 })).toBeNull();
    expect(canvas.queryByRole("heading", { name: "Conversation" })).toBeNull();
    expect(
      canvas.getByRole("tabpanel", { name: "Conversation" }),
    ).toHaveTextContent("Choose how conversations look");
    const before = await saved(canvasElement);
    await selectSettingsTab(canvasElement, "AI settings", "Models");
    expect(
      canvas.getByRole("combobox", { name: "Default model" }),
    ).toBeVisible();
    await aiReviewAction(canvasElement, "Reveal memory setting");
    await waitFor(() =>
      expect(canvas.getByRole("tabpanel", { name: "Memory" })).toBeVisible(),
    );
    expect(
      canvas.getByRole("heading", { name: "Handoff summaries" }),
    ).toBeVisible();
    await expectPinnedSettingsTabs(canvasElement);
    await selectSettingsTab(canvasElement, "AI settings", "Tools");
    expect(canvas.getByRole("switch", { name: "read" })).toBeVisible();
    expect(await saved(canvasElement)).toEqual(before);
    const tabs = canvasElement.querySelector<HTMLElement>(
      '[data-ui-component="responsive-tabs"]',
    )!;
    expect(tabs).toHaveAttribute("data-presentation", "pill");
    expect(tabs.scrollWidth).toBeLessThanOrEqual(tabs.clientWidth + 1);
    if (canvasElement.ownerDocument.documentElement.clientWidth < 600)
      expect(
        canvas.getByRole("button", { name: "More ai settings" }),
      ).toBeVisible();
    await selectSettingsTab(canvasElement, "AI settings", "Conversation");
  },
};

export const MarkdownMemory: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await selectSettingsTab(canvasElement, "AI settings", "Memory");
    await expect(
      canvas.getByRole("textbox", { name: "Memory folder" }),
    ).toHaveValue("Memory");
    const folderInput = canvas.getByRole("textbox", { name: "Memory folder" });
    await expect(folderInput.closest("[data-setting-layout]")).toHaveAttribute(
      "data-setting-layout",
      "stacked",
    );
    expect(folderInput.getBoundingClientRect().width).toBeGreaterThan(
      canvasElement.ownerDocument.documentElement.clientWidth < 600 ? 80 : 300,
    );
    await expect(
      canvas.getByRole("switch", { name: "Automatic memory capture" }),
    ).toBeChecked();
    await expect(
      canvas.getByRole("switch", { name: "Automatic memory recall" }),
    ).toBeChecked();
    await expect(
      canvas.getByRole("button", { name: "Daily memory" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Curated memory" }),
    ).toBeVisible();
    await userEvent.clear(
      canvas.getByRole("textbox", { name: "Memory folder" }),
    );
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Memory folder" }),
      "Journal/Memory",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await waitFor(async () =>
      expect((await saved(canvasElement)).settings.memoryFolder).toBe(
        "Journal/Memory",
      ),
    );
  },
};

export const ProcessorModels: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await selectSettingsTab(canvasElement, "AI settings", "Memory");
    const before = (await saved(canvasElement)).settings.defaultModels;
    await choose(canvasElement, "Memory processor model", "Example model");
    await choose(canvasElement, "Handoff summary model", "codex next");
    await waitFor(async () =>
      expect((await saved(canvasElement)).settings).toMatchObject({
        memoryConsolidationModel: "example-model",
        handoffSummaryModel: "codex-next",
        defaultModels: before,
      }),
    );
    await choose(canvasElement, "Handoff summary agent", "Lapis AI");
    await choose(canvasElement, "Handoff summary model", "Example model");
    await waitFor(async () =>
      expect((await saved(canvasElement)).settings).toMatchObject({
        memoryConsolidationModel: "example-model",
        handoffSummaryAgent: "local",
        handoffSummaryModel: "example-model",
        defaultModels: before,
      }),
    );
    expect(
      canvas.getByRole("combobox", { name: "Memory processor model" }),
    ).toHaveTextContent("Example model");
    expect(aiReviewValue(canvasElement, "Model catalog requests")).toContain(
      "local:acp",
    );
    expect(aiReviewValue(canvasElement, "Model catalog requests")).toContain(
      "codex:acp",
    );
  },
};
