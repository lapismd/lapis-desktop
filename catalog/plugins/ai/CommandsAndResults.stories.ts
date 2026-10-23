import {
  findMessageEditor,
  messageEditor,
} from "../../support/ai/message-editor.ts";
import { expandTranscriptActivity } from "../../support/ai/transcript/interactions.ts";
// SPDX-License-Identifier: Apache-2.0
import { aiReviewAction } from "../../support/ai/review.ts";
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
    const input = await findMessageEditor(canvas);
    await userEvent.type(input, "/research-notes authentication");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await canvas.findByRole("button", { name: "Skill activation" });
    await expandTranscriptActivity(canvasElement);
    await waitFor(() => {
      expect(canvas.getByText(/Skill research-notes/u)).toBeInTheDocument();
    });
    await userEvent.type(input, "/help");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await waitFor(async () => {
      await expandTranscriptActivity(canvasElement);
    });
    await waitFor(() => {
      const report = canvas.getByLabelText("Command output");
      expect(report).toHaveTextContent("App");
      expect(report).toHaveTextContent("/help");
    });
    await userEvent.type(input, "/skills");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await waitFor(async () => {
      await expandTranscriptActivity(canvasElement);
    });
    await waitFor(() => {
      const inventory = canvasElement.querySelector(
        '[data-ui-component="ai-inventory-result"]',
      );
      expect(inventory).toBeVisible();
      expect(inventory).toHaveAttribute("data-kind", "skills");
      expect(canvas.getByText("research-notes")).toBeInTheDocument();
    });
    await userEvent.type(input, "/open-daily-note");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await waitFor(async () => {
      await expandTranscriptActivity(canvasElement);
    });
    await waitFor(() => {
      expect(canvas.getAllByText("/open-daily-note").length).toBeGreaterThan(1);
    });
    await aiReviewAction(canvasElement, "Unload extension command");
    await userEvent.type(input, "/open-daily-note");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await waitFor(async () => {
      await expandTranscriptActivity(canvasElement);
    });
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
    const hit = await canvas.findByRole("button", {
      name: "Open auth.md Projects/auth.md",
    });
    await expect(hit).toBeVisible();
    await expect(canvas.getByText("OAuth tokens")).toBeVisible();
    await userEvent.click(hit);
    expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
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
    const transcript = panel.querySelector(
      '[data-ui-component="transcript"]',
    ) as HTMLElement;
    const viewport = panel.querySelector(
      '.ui-transcript-viewport > [data-ui-part="scroll-area-viewport"]',
    ) as HTMLElement;
    const composer = panel.querySelector(
      "[data-transcript-composer]",
    ) as HTMLElement;
    const footer = panel.querySelector(
      '[data-ui-component="transcript-footer"]',
    ) as HTMLElement;
    expect(transcript).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(composer).not.toBeNull();
    expect(footer).not.toBeNull();
    await waitFor(() => {
      expect(transcript.getBoundingClientRect().height).toBeGreaterThan(400);
      expect(viewport.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        footer.getBoundingClientRect().top + 2,
      );
      expect(composer.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        viewport.getBoundingClientRect().bottom + 2,
      );
    });
    expect(canvas.getByText("Start a conversation")).toBeVisible();
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
    await userEvent.keyboard("{Escape}");
    await waitFor(
      () => {
        expect(menu).toHaveAttribute("data-state", "closed");
        expect(
          getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
        ).not.toBe("none");
      },
      { timeout: 5000 },
    );
  },
};

export const SlashRetainsPendingComments: Story = {
  args: {
    enableSkills: true,
    seedItems: [
      {
        id: "comment-source",
        type: "message",
        role: "assistant",
        text: "Keep this captured context.",
        createdAt: "2026-10-19T09:00:00Z",
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () =>
        expect(
          getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
        ).not.toBe("none"),
      { timeout: 5000 },
    );
    await userEvent.hover(
      await canvas.findByRole("textbox", { name: "Assistant response" }),
    );
    const commentAction = await canvas.findByRole("button", {
      name: "Comment on Assistant response",
    });
    commentAction.focus();
    await userEvent.click(commentAction);
    const comment = await canvas.findByRole("textbox", {
      name: "Comment on Assistant response",
    });
    await userEvent.click(comment);
    await userEvent.keyboard("Preserve this feedback.");
    const composer = messageEditor(canvas);
    await userEvent.click(composer);
    await userEvent.keyboard("/model");
    await userEvent.keyboard("{Escape}");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await expect(
      canvas.findByRole("group", { name: "Composer feedback" }),
    ).resolves.toHaveTextContent(
      "Slash commands do not submit comment context",
    );
    expect(composer).toHaveTextContent("/model");
    expect(
      canvas.getByRole("group", { name: "Pending comments" }),
    ).toHaveTextContent("Preserve this feedback.");
  },
};
