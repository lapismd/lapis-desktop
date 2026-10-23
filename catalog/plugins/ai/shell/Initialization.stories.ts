// SPDX-License-Identifier: Apache-2.0
// Retained Shell.ImmediateInitializingComposer, lapis-plugins ee20d366.
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor, within } from "storybook/test";
import AiWorkspaceDemo from "../../../support/ai/workspace/AiWorkspaceDemo.svelte";
import { aiWorkspaceFixture } from "../../../support/ai/workspace/fixture.ts";
import { cleanupCatalog } from "../../../support/lifecycle.ts";
const meta = {
  title: "Desktop/AI/Shell/Initialization",
  component: AiWorkspaceDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
  args: { kind: "ai-chat", layout: "right-sidebar", scenario: "initializing" },
} satisfies Meta<typeof AiWorkspaceDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ImmediateInitializingComposer: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("ai-workspace-demo")).toHaveAttribute(
        "data-status",
        "ready",
      ),
    );
    const panel = await canvas.findByTestId("ai-chat-panel");
    expect(panel).toHaveAttribute("data-initializing", "true");
    expect(
      panel.querySelectorAll('[data-ui-component="skeleton"]').length,
    ).toBeGreaterThan(4);
    expect(
      within(panel).getByRole("textbox", { name: /^Message$/ }),
    ).toHaveAttribute("aria-readonly", "true");
    expect(
      within(panel).getByRole("button", { name: /^Send message$/ }),
    ).toBeDisabled();
    const fixture = aiWorkspaceFixture(canvasElement);
    fixture.releaseModels();
    await waitFor(() => {
      expect(panel).toHaveAttribute("data-initializing", "false");
      expect(
        within(panel).getByRole("textbox", { name: /^Message$/ }),
      ).toHaveAttribute("contenteditable", "true");
    });
    expect(canvas.getByTestId("ai-chat-panel")).toBe(panel);
    expect(
      within(panel).getByRole("textbox", { name: /^Message$/ }),
    ).toBeVisible();
    expect(JSON.parse(await fixture.inspect()).sessions).toEqual([]);
  },
};
