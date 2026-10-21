// SPDX-License-Identifier: Apache-2.0
// Retained Shell.Desktop play from lapis-plugins ee20d366.
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { WorkspaceShell } from "@lapis-notes/workspace";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiShellDemo from "../../../support/ai/shell/AiShellDemo.svelte";
import {
  demoApp,
  mainAiLeaves,
  assertStackedComposer,
  assertNoMessageOverlap,
} from "../../../support/ai/shell/assertions.ts";
import { shellParameters } from "../../../support/ai/shell/examples.ts";
import { cleanupCatalog } from "../../../support/lifecycle.ts";
const meta = {
  title: "Desktop/AI/Shell/Desktop",
  component: WorkspaceShell,
  tags: ["visual-pending", "autodocs"],
  beforeEach: () => cleanupCatalog,
  argTypes: { app: { control: false } },
  parameters: shellParameters("default", "desktop"),
} satisfies Meta<typeof WorkspaceShell>;
export default meta;
type Story = StoryObj<typeof AiShellDemo>;
export const Desktop: Story = {
  render: () => ({
    Component: AiShellDemo,
    props: { scenario: "default", displayMode: "desktop" },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () => {
        expect(canvas.getByTestId("ai-shell-demo")).toHaveAttribute(
          "data-status",
          "ready",
        );
      },
      { timeout: 12_000 },
    );

    const app = demoApp(canvasElement);
    expect(app.workspace.leftSplit.collapsed).toBe(false);
    expect(app.workspace.rightSplit.collapsed).toBe(true);
    expect(app.workspace.bottomPanel.collapsed).toBe(true);
    await expect(canvas.getByLabelText("Left sidebar")).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Open right sidebar" }),
    ).toBeVisible();
    await expect(
      canvasElement.querySelector('[data-ui-component="workspace-explorer"]'),
    ).toBeVisible();

    const ribbon = canvas.getByLabelText("left ribbon");
    const openChat = within(ribbon).getByRole("button", { name: "Open Chat" });
    await expect(openChat).toBeVisible();
    await userEvent.click(openChat);
    expect(mainAiLeaves(app)).toHaveLength(1);

    const panel = await canvas.findByTestId("ai-chat-panel");
    const demo = canvas.getByTestId("ai-shell-demo");
    const workspaceShell = demo.querySelector(
      '[data-ui-component="lapis-workspace-shell"]',
    ) as HTMLElement | null;
    expect(workspaceShell).not.toBeNull();
    expect(
      workspaceShell!.getBoundingClientRect().bottom,
    ).toBeGreaterThanOrEqual(demo.getBoundingClientRect().bottom - 2);
    const mainTabs = panel.closest(
      '[data-ui-component="workspace-tabs"]',
    ) as HTMLElement | null;
    expect(mainTabs).not.toBeNull();
    const surface = panel.closest("[data-workspace-surface]");
    expect(surface).toHaveAttribute("data-workspace-surface", "body");
    const panelStyles = getComputedStyle(panel);
    const viewPaint = panelStyles
      .getPropertyValue("--ui-workspace-view-background")
      .trim();
    const bodyPaint = panelStyles.getPropertyValue("--background").trim();
    expect(viewPaint === "var(--background)" || viewPaint === bodyPaint).toBe(
      true,
    );
    const composerBody = panel.querySelector(
      '[data-ui-component="ai-chat-composer"] [data-ui-part="body"]',
    ) as HTMLElement | null;
    const status = canvas.getByLabelText("Workspace status");
    expect(composerBody).not.toBeNull();
    expect(composerBody!.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      status.getBoundingClientRect().top - 8,
    );
    expect(getComputedStyle(panel).fontFamily).toMatch(/DM Sans/i);
    await waitFor(() =>
      expect(panel).toHaveAttribute("data-initializing", "false"),
    );
    await assertStackedComposer(panel);
    expect(within(panel).getByText("Start a conversation")).toBeVisible();
    expect(
      within(panel).getByRole("textbox", { name: "Message" }),
    ).toBeVisible();
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      within(panel).getByRole("button", { name: "Effort and model" }),
    );
    const modelMenu = body.getByTestId("ai-chat-model");
    await waitFor(() => expect(modelMenu).toBeVisible());
    await userEvent.hover(modelMenu);
    await expect(
      await body.findByRole("menuitemradio", { name: "gpt-5.6-sol" }),
    ).toHaveAttribute("data-state", "checked");
    await userEvent.hover(body.getByTestId("ai-chat-thinking"));
    await expect(
      await body.findByRole("menuitemradio", { name: "Medium" }),
    ).toHaveAttribute("data-state", "checked");
    await userEvent.keyboard("{Escape}");

    const input = within(panel).getByRole("textbox", { name: "Message" });
    await waitFor(() =>
      expect(getComputedStyle(input).pointerEvents).not.toBe("none"),
    );
    await userEvent.type(input, "Summarize this note");
    await userEvent.click(
      within(panel).getByRole("button", { name: /^Send message$/ }),
    );
    await expect(
      within(panel).findByRole("textbox", { name: /^Assistant response$/ }),
    ).resolves.toHaveTextContent("Summary");
    await expect(
      within(panel).getByRole("button", { name: /^Reasoning$/ }),
    ).toBeVisible();
    await expect(
      within(panel).getByRole("button", {
        name: /^Show details for vault.read · /,
      }),
    ).toBeVisible();
    await userEvent.click(
      within(panel).getByRole("button", {
        name: /^Show details for vault.read · /,
      }),
    );
    await expect(body.findByLabelText("Tool details")).resolves.toBeVisible();
    await userEvent.keyboard("{Escape}");
    await userEvent.click(
      within(panel).getByRole("button", {
        name: /^Show contents for vault.read · /,
      }),
    );
    expect(
      within(panel).getByRole("button", {
        name: /^Hide contents for vault.read · /,
      }),
    ).toBeVisible();
    await assertNoMessageOverlap(panel);
    const response = within(panel).getByRole("textbox", {
      name: /^Assistant response$/,
    });
    expect(getComputedStyle(response).fontFamily).toMatch(/DM Sans/i);
    expect(getComputedStyle(response).fontSize).toBe("14px");

    await userEvent.click(
      await canvas.findByRole("button", { name: "Open settings" }),
    );
    const dialog = canvas.getByRole("dialog", { name: "Settings" });
    await userEvent.click(
      await within(dialog).findByRole("button", { name: "AI" }),
    );
    await userEvent.click(
      await within(dialog).findByRole("tab", { name: "Models" }),
    );
    const runtimeLabel = within(dialog).getByText("Default runtime");
    await expect(runtimeLabel).toBeVisible();
    await expect(within(dialog).getByText("ACP agent")).toBeVisible();
    await expect(within(dialog).getByText("Default model")).toBeVisible();
    await expect(within(dialog).getByText("Thinking")).toBeVisible();
    expect(getComputedStyle(runtimeLabel).fontFamily).toMatch(/DM Sans/i);
    expect(getComputedStyle(runtimeLabel).fontFamily).toBe(
      getComputedStyle(dialog).fontFamily,
    );

    const modelField = within(dialog).getByRole("combobox", {
      name: "Default model",
    });
    await expect(modelField).toBeVisible();
    expect(
      within(dialog).queryByRole("textbox", { name: "Default model" }),
    ).toBeNull();

    const agentField = within(dialog).getByRole("combobox", {
      name: "ACP agent",
    });
    await userEvent.click(agentField);
    await userEvent.click(await body.findByRole("option", { name: "Cursor" }));
    await waitFor(async () => {
      const raw =
        await demoApp(canvasElement).vault.adapter.read(".lapis/ai.json");
      expect(JSON.parse(raw).settings.acpAgent).toBe("cursor");
    });
    const closeSettings = within(dialog).getByRole("button", {
      name: "Close settings",
    });
    await waitFor(() => {
      expect(getComputedStyle(closeSettings).pointerEvents).not.toBe("none");
    });
    await userEvent.click(closeSettings);
    const raw =
      await demoApp(canvasElement).vault.adapter.read(".lapis/ai.json");
    expect(JSON.parse(raw)).not.toHaveProperty("sessions");
    expect(app.workspace.rightSplit.collapsed).toBe(true);
  },
};
