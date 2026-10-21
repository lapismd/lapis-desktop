import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import SettingsDemo from "../../support/ai/SettingsDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { selectSettingsTab } from "../../support/ai/settings-tabs.ts";
import { aiReviewAction, aiReviewValue } from "../../support/ai/review.ts";
const meta = {
  title: "Desktop/AI/Model settings search",
  component: SettingsDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
} satisfies Meta<typeof SettingsDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SearchAllModelSettings: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    await waitFor(() =>
      expect(
        canvasElement.querySelector('[data-settings-ready="true"]'),
      ).not.toBeNull(),
    );
    const saved = async () => {
      await aiReviewAction(canvasElement, "Inspect saved settings");
      return JSON.parse(aiReviewValue(canvasElement, "Saved AI data")).settings;
    };
    const search = async (label: string, query: string) => {
      await waitFor(() =>
        expect(
          getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
        ).not.toBe("none"),
      );
      const trigger = await canvas.findByRole("combobox", { name: label });
      await waitFor(() => expect(trigger).toBeEnabled());
      await userEvent.click(trigger);
      const input = await body.findByRole("combobox", {
        name: "Search models",
      });
      await userEvent.type(input, query);
    };
    await selectSettingsTab(canvasElement, "AI settings", "Models");
    const before = await saved();
    await search("Default model", "codex-next");
    await expect(
      body.findByRole("option", { name: "codex next" }),
    ).resolves.toBeVisible();
    expect(body.queryByRole("option", { name: "codex saved" })).toBeNull();
    await userEvent.keyboard("{Escape}");
    expect(await saved()).toEqual(before);
    await search("Default model", "codex-next");
    await userEvent.click(
      await body.findByRole("option", { name: "codex next" }),
    );
    await waitFor(async () =>
      expect((await saved()).defaultModel).toBe("codex-next"),
    );
    await selectSettingsTab(canvasElement, "AI settings", "Memory");
    expect(
      canvas.getAllByText(
        /Only the built-in Lapis AI profile supports unattended processing/,
      ),
    ).toHaveLength(2);
    await search("Memory processor model", "example-model");
    await userEvent.click(
      await body.findByRole("option", { name: "Example model" }),
    );
    await userEvent.click(
      canvas.getByRole("combobox", { name: "Handoff summary agent" }),
    );
    await userEvent.click(
      await body.findByRole("option", { name: "Lapis AI" }),
    );
    await search("Handoff summary model", "example-model");
    await userEvent.click(
      await body.findByRole("option", { name: "Example model" }),
    );
    await waitFor(async () =>
      expect(await saved()).toMatchObject({
        defaultModel: "codex-next",
        memoryConsolidationModel: "example-model",
        handoffSummaryModel: "example-model",
        handoffSummaryAgent: "local",
      }),
    );
  },
};
