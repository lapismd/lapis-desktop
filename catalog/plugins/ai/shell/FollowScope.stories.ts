// SPDX-License-Identifier: Apache-2.0
// Retained Shell.FollowScope play from lapis-plugins ee20d366.
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { WorkspaceShell } from "@lapis-notes/workspace";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiShellDemo from "../../../support/ai/shell/AiShellDemo.svelte";
import { demoApp } from "../../../support/ai/shell/assertions.ts";
import { shellParameters } from "../../../support/ai/shell/examples.ts";
import { cleanupCatalog } from "../../../support/lifecycle.ts";
const meta = {
  title: "Desktop/AI/Shell/FollowScope",
  component: WorkspaceShell,
  tags: ["visual-pending", "autodocs"],
  beforeEach: () => cleanupCatalog,
  argTypes: { app: { control: false } },
  parameters: shellParameters("follow-scope", "desktop"),
} satisfies Meta<typeof WorkspaceShell>;
export default meta;
type Story = StoryObj<typeof AiShellDemo>;
export const FollowScope: Story = {
  render: () => ({
    Component: AiShellDemo,
    props: { scenario: "follow-scope", displayMode: "desktop" },
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
    const app = demoApp(canvasElement);
    const picker = await canvas.findByTestId("ai-chat-conversation-picker");
    await expect(within(picker).getByText("Near folder chat")).toBeVisible();
    await expect(within(picker).getByText("Atlas folder chat")).toBeVisible();
    await waitFor(() => {
      expect(canvas.getByTestId("ai-chat-scope-path")).toHaveTextContent(
        "Projects",
      );
    });
    const scopeTrigger = within(panel).getByRole("button", {
      name: "Change chat folder: Projects",
    });
    await waitFor(() =>
      expect(getComputedStyle(scopeTrigger).pointerEvents).not.toBe("none"),
    );
    await userEvent.click(scopeTrigger);
    const body = within(canvasElement.ownerDocument.body);
    const folderSearch = await body.findByPlaceholderText(
      "Search chat folders",
    );
    await waitFor(() => expect(folderSearch).toBeVisible());
    await userEvent.click(body.getByRole("option", { name: "Vault" }));
    await waitFor(() => {
      expect(canvas.getByTestId("ai-chat-scope-path")).toHaveTextContent(
        "Vault",
      );
      expect(canvas.getByTestId("ai-chat-conversation-picker")).toBeVisible();
      const explorer = app.workspace.getLeavesOfType("file-explorer")[0]
        ?.view as { selectedPath?: string } | undefined;
      expect(explorer?.selectedPath).toBe("");
    });
    await userEvent.click(within(picker).getByText("Near folder chat"));
    await waitFor(() => {
      expect(
        within(panel).getByText("The near folder chat is open."),
      ).toBeVisible();
      expect(canvas.queryByTestId("ai-chat-conversation-picker")).toBeNull();
      const folder = canvasElement.querySelector(
        '[data-path="Projects"][data-active]',
      );
      expect(folder).not.toBeNull();
      expect(canvas.getByTestId("ai-chat-scope-path")).toHaveTextContent(
        "Projects",
      );
    });
    await userEvent.click(
      within(panel).getByRole("button", { name: "Pin conversation" }),
    );
    await waitFor(() => {
      expect(
        within(panel).getByRole("button", { name: "Unpin conversation" }),
      ).toHaveAttribute("aria-pressed", "true");
    });
    const welcome = app.vault.getFileByPath("Notes/Welcome.md");
    if (!welcome) throw new Error("Notes/Welcome.md was not seeded");
    const noteLeaf = app.workspace.getLeaf("tab");
    await noteLeaf.openFile(welcome);
    await waitFor(() => {
      expect(
        within(panel).getByText("The near folder chat is open."),
      ).toBeVisible();
      expect(canvas.queryByTestId("ai-chat-conversation-picker")).toBeNull();
    });
  },
};
