// SPDX-License-Identifier: Apache-2.0
// Retained AI registry composition assertions from lapis-plugins ee20d366.
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { WorkspaceShell } from "@lapis-notes/workspace";
import { expect, waitFor, within } from "storybook/test";
import AiShellDemo from "../../../support/ai/shell/AiShellDemo.svelte";
import { shellParameters } from "../../../support/ai/shell/examples.ts";
import { shellFixture } from "../../../support/ai/shell/fixture.ts";
import { cleanupCatalog } from "../../../support/lifecycle.ts";
const meta = {
  title: "Desktop/AI/Shell/Compositions",
  component: WorkspaceShell,
  tags: ["visual-pending", "autodocs"],
  beforeEach: () => cleanupCatalog,
  argTypes: { app: { control: false } },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof WorkspaceShell>;
export default meta;
type Story = StoryObj<typeof AiShellDemo>;
export const ChatWithToolActivity: Story = {
  parameters: shellParameters("registry-chat", "desktop"),
  render: () => ({
    Component: AiShellDemo,
    props: { scenario: "registry-chat" },
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
    await waitFor(() => {
      const left = canvasElement.querySelector<HTMLElement>(
        '[data-workspace-surface="left-sidebar"]',
      );
      expect(left?.getBoundingClientRect().width ?? 0).toBeLessThan(2);
      expect(
        within(panel).getByText("vault.read", {
          selector: '[data-ui-part="call-name"]',
        }),
      ).toBeVisible();
      expect(
        within(panel).getByRole("article", { name: "Message from assistant" }),
      ).toHaveTextContent("Summary");
    });
    expect(
      shellFixture(canvasElement).runtimes.flatMap(
        (runtime) => runtime.sessions,
      ),
    ).toEqual([]);
  },
};
export const Overview: Story = {
  parameters: shellParameters("registry-overview", "desktop"),
  render: () => ({
    Component: AiShellDemo,
    props: { scenario: "registry-overview" },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByTestId("ai-shell-demo")).toHaveAttribute(
        "data-status",
        "ready",
      );
      expect(canvas.getByTestId("ai-chat-panel")).toHaveTextContent("Summary");
      expect(canvas.getByTestId("ai-conversation-history")).toBeVisible();
      expect(canvas.getByTestId("ai-catalog")).toBeVisible();
    });
    expect(
      shellFixture(canvasElement).runtimes.flatMap(
        (runtime) => runtime.sessions,
      ),
    ).toEqual([]);
  },
};
