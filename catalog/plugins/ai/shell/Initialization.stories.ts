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
    const composer = within(panel).getByRole("combobox", { name: "Message" });
    expect(panel).toHaveAttribute("data-initializing", "true");
    expect(within(panel).getByRole("status", { name: "" })).toHaveTextContent(
      "Preparing AI…",
    );
    expect(composer).toHaveAttribute("aria-disabled", "true");
    expect(composer).toHaveAttribute("contenteditable", "false");
    expect(
      within(panel).getByRole("button", { name: "Effort and model" }),
    ).toBeDisabled();
    const fixture = aiWorkspaceFixture(canvasElement);
    fixture.releaseModels();
    await waitFor(() => {
      expect(panel).toHaveAttribute("data-initializing", "false");
      expect(composer).toHaveAttribute("aria-disabled", "false");
      expect(composer).toHaveAttribute("contenteditable", "true");
    });
    expect(canvas.getByTestId("ai-chat-panel")).toBe(panel);
    expect(canvas.getByRole("combobox", { name: "Message" })).toBe(composer);
    expect(JSON.parse(await fixture.inspect()).sessions).toEqual([]);
  },
};
