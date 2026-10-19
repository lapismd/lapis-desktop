// SPDX-License-Identifier: Apache-2.0
// Retained Shell.AgentSwitching play from lapis-plugins ee20d366.
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { WorkspaceShell } from "@lapis-notes/workspace";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiShellDemo from "../../../support/ai/shell/AiShellDemo.svelte";
import { demoApp } from "../../../support/ai/shell/assertions.ts";
import { LOCAL_CONVERSATION_ID } from "../../../support/ai/shell/types.ts";
import { shellParameters } from "../../../support/ai/shell/examples.ts";
import { cleanupCatalog } from "../../../support/lifecycle.ts";
import { hoverHarnessControl } from "../../../support/ai/menu-interactions.ts";
const meta = {
  title: "Desktop/AI/Shell/AgentSwitching",
  component: WorkspaceShell,
  tags: ["visual-pending", "autodocs"],
  beforeEach: () => cleanupCatalog,
  argTypes: { app: { control: false } },
  parameters: shellParameters("agent-switching", "desktop"),
} satisfies Meta<typeof WorkspaceShell>;
export default meta;
type Story = StoryObj<typeof AiShellDemo>;
export const AgentSwitching: Story = {
  render: () => ({
    Component: AiShellDemo,
    props: { scenario: "agent-switching", displayMode: "desktop" },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("ai-shell-demo")).toHaveAttribute(
        "data-status",
        "ready",
      ),
    );
    const panel = await canvas.findByTestId("ai-chat-panel");
    expect(panel.getBoundingClientRect().height).toBeGreaterThan(500);
    const codexDividers = await within(panel).findAllByText(
      "Codex ACP · gpt-5.6-terra",
      {},
      { timeout: 8_000 },
    );
    expect(codexDividers).toHaveLength(2);
    for (const divider of codexDividers) await expect(divider).toBeVisible();
    await expect(
      await within(panel).findByText("Cursor ACP · composer-2.5"),
    ).toBeVisible();
    await expect(
      await within(panel).findByText(
        "Cursor continued in the same local conversation.",
      ),
    ).toBeVisible();
    await expect(
      await within(panel).findByText(
        "Codex resumed its original binding with the Cursor delta.",
      ),
    ).toBeVisible();
    expect(
      await within(panel).findAllByRole("button", { name: "Copy response" }),
    ).toHaveLength(3);
    const context = within(panel).getByRole("button", {
      name: "Context window: 10% full",
    });
    await expect(context).toBeVisible();
    await hoverHarnessControl(context);
    await expect(
      within(canvasElement.ownerDocument.body).findByRole("tooltip"),
    ).resolves.toHaveTextContent("12,920 / 128,000 tokens used");
    await userEvent.unhover(context);
    const app = demoApp(canvasElement);
    const root = `Notes/.lapis/agents/sessions/${LOCAL_CONVERSATION_ID}`;
    await expect(
      app.vault.adapter.read(`${root}/agents.jsonl`),
    ).resolves.toContain('"projectionMode":"delta"');
    const transcript = await app.vault.adapter.read(`${root}/transcript.jsonl`);
    expect(transcript).toContain('"handoffMode":"full"');
    expect(transcript).toContain('"handoffMode":"delta"');
    expect(transcript).toContain('"type":"agent.config"');
    expect(transcript).not.toContain("<lapis-context");
    expect(transcript).not.toContain("Lapis conversation handoff");
  },
};
