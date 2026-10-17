// SPDX-License-Identifier: Apache-2.0
// Retained from lapis-plugins tree 56b5d6c1; ACP-only runtime choices.
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiChatDemo from "../../support/ai/AiChatDemo.svelte";
import { createNotesSearchSeedItems } from "../../support/ai/seeds-2.ts";

const meta = {
  title: "Desktop/AI/Commands and results",
  component: AiChatDemo,
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof AiChatDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SkillsAndSlash: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { enableSkills: true },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole("combobox", { name: "Message" });
    await userEvent.type(input, "/research-notes authentication");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(canvas.getByText(/Skill research-notes/u)).toBeInTheDocument();
    });
    await userEvent.type(input, "/help");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(canvas.getByText(/App/u)).toBeInTheDocument();
      expect(canvas.getByText(/\/help/u)).toBeInTheDocument();
    });
    await userEvent.type(input, "/skills");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      const inventory = canvasElement.querySelector(
        '[data-ui-component="ai-inventory-result"]',
      );
      expect(inventory).toBeVisible();
      expect(inventory).toHaveAttribute("data-kind", "skills");
      expect(canvas.getByText("research-notes")).toBeInTheDocument();
    });
    await userEvent.type(input, "/open-daily-note");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(canvas.getByText("/open-daily-note")).toBeInTheDocument();
    });
    await userEvent.click(canvas.getByTestId("ai-chat-unload-extension"));
    await userEvent.type(input, "/open-daily-note");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(
        canvas.getAllByText(/Unknown command: \/open-daily-note/u).length,
      ).toBeGreaterThan(0);
    });
  },
};

export const SearchToolHits: Story = {
  tags: ["skip-visual", "test"],
  render: () => ({
    Component: AiChatDemo,
    props: {
      enableSearchResult: true,
      seedItems: createNotesSearchSeedItems(),
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole("button", {
      name: "Show details for notes_search",
    });
    await userEvent.click(trigger);
    const hit = await canvas.findByRole("button", { name: "Open auth.md" });
    await expect(hit).toBeVisible();
    await expect(canvas.getByText("OAuth tokens")).toBeVisible();
    await userEvent.click(hit);
    await waitFor(() => {
      expect(canvas.getByTestId("ai-chat-demo")).toHaveAttribute(
        "data-opened-paths",
        "Projects/auth.md",
      );
    });
    await expect(canvas.getByTestId("ai-chat-panel")).toBeVisible();
  },
};

export const ValidationAndEmptyState: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: {
      modelCatalogError: "Agent runtime socket closed unexpectedly.",
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = await canvas.findByTestId("ai-chat-panel");
    const alert = canvas.getByRole("alert");
    await expect(alert).toHaveTextContent(
      "Agent runtime socket closed unexpectedly.",
    );
    expect(alert).toHaveAttribute("data-ui-part", "status");
    expect(alert).toHaveAttribute("data-position", "top");

    const layout = panel.querySelector(
      '[data-ui-component="ai-chat-layout"]',
    ) as HTMLElement | null;
    const shell = panel.querySelector(
      '[data-ui-part="scroll-shell"]',
    ) as HTMLElement | null;
    const empty = panel.querySelector(
      '[data-ui-part="empty-state"]',
    ) as HTMLElement | null;
    const dock = panel.querySelector(
      '[data-ui-part="composer-dock"]',
    ) as HTMLElement | null;
    expect(layout).not.toBeNull();
    expect(shell).not.toBeNull();
    expect(empty).not.toBeNull();
    expect(dock).not.toBeNull();
    const layoutBox = layout!.getBoundingClientRect();
    const shellBox = shell!.getBoundingClientRect();
    const emptyBox = empty!.getBoundingClientRect();
    const dockBox = dock!.getBoundingClientRect();
    expect(layoutBox.height).toBeGreaterThan(400);
    expect(shellBox.height).toBeGreaterThanOrEqual(
      layoutBox.height - dockBox.height - 2,
    );
    expect(emptyBox.height).toBeGreaterThan(shellBox.height * 0.7);
    expect(shellBox.bottom).toBeLessThanOrEqual(dockBox.top + 2);
    expect(dockBox.bottom).toBeLessThanOrEqual(layoutBox.bottom + 2);
    await expect(canvas.getByTestId("ai-chat-scope-path")).toHaveTextContent(
      "Vault",
    );

    await userEvent.click(
      canvas.getByRole("button", { name: "Effort and model" }),
    );
    const menu = canvasElement.ownerDocument
      .querySelector('[data-testid="ai-chat-model"]')
      ?.closest('[role="menu"]') as HTMLElement | null;
    expect(menu).not.toBeNull();
    expect(
      within(menu!).queryByText("Agent runtime socket closed unexpectedly."),
    ).toBeNull();
  },
};
