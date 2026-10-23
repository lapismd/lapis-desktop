// SPDX-License-Identifier: Apache-2.0
// Retained Shell.CommunityToolOptIn play from lapis-plugins ee20d366.
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { WorkspaceShell } from "@lapis-notes/workspace";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiShellDemo from "../../../support/ai/shell/AiShellDemo.svelte";
import { demoApp } from "../../../support/ai/shell/assertions.ts";
import { shellParameters } from "../../../support/ai/shell/examples.ts";
import { cleanupCatalog } from "../../../support/lifecycle.ts";
import { selectSettingsTab } from "../../../support/ai/settings-tabs.ts";
const meta = {
  title: "Desktop/AI/Shell/CommunityToolOptIn",
  component: WorkspaceShell,
  tags: ["visual-pending", "autodocs"],
  beforeEach: () => cleanupCatalog,
  argTypes: { app: { control: false } },
  parameters: shellParameters("community-tools", "desktop"),
} satisfies Meta<typeof WorkspaceShell>;
export default meta;
type Story = StoryObj<typeof AiShellDemo>;
export const CommunityToolOptIn: Story = {
  render: () => ({
    Component: AiShellDemo,
    props: { scenario: "community-tools", displayMode: "desktop" },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("ai-shell-demo")).toHaveAttribute(
        "data-status",
        "ready",
      ),
    );
    const openSettings = await canvas.findByRole("button", {
      name: "Open settings",
    });
    await waitFor(() =>
      expect(getComputedStyle(openSettings).pointerEvents).not.toBe("none"),
    );
    await userEvent.click(openSettings);
    const dialog = canvas.getByRole("dialog", { name: "Settings" });
    await userEvent.click(
      await within(dialog).findByRole("button", { name: "AI" }),
    );
    await selectSettingsTab(dialog, "AI settings", "Tools");
    const master = await within(dialog).findByRole("switch", {
      name: "Application tools",
    });
    const community = within(dialog).getByRole("switch", {
      name: "story_word_count",
    });
    await expect(master).toHaveAttribute("data-state", "checked");
    await expect(community).toHaveAttribute("data-state", "unchecked");
    for (const [name, contributor] of [
      ["notes_search", "Search"],
      ["notes_list", "Markdown"],
      ["read", "AI"],
      ["write", "AI"],
      ["edit", "AI"],
      ["apply_patch", "AI"],
    ] as const) {
      const toggle = within(dialog).getByRole("switch", { name });
      await expect(toggle).toHaveAttribute("data-state", "checked");
      expect(
        dialog.querySelector(`[data-setting-id="ai.appTools.${name}"]`)
          ?.textContent,
      ).toContain(contributor);
    }
    expect(
      dialog.querySelector('[data-setting-id="ai.appTools.story_word_count"]')
        ?.textContent,
    ).toContain("story-community");
    await userEvent.click(community);
    await expect(community).toHaveAttribute("data-state", "checked");
    await waitFor(async () => {
      const raw =
        await demoApp(canvasElement).vault.adapter.read(".lapis/ai.json");
      const persisted = JSON.parse(raw).settings;
      expect(persisted.enabledAppToolNames).toContain("story_word_count");
      expect(persisted).not.toHaveProperty("enabledCommunityToolPluginIds");
    });
  },
};
