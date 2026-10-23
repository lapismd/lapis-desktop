import { messageEditor } from "../../support/ai/message-editor.ts";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import TranscriptReviewDemo from "../../support/ai/transcript/TranscriptReviewDemo.svelte";
import { aiReviewValue } from "../../support/ai/review.ts";

const meta = {
  title: "Desktop/AI/Comment history",
  component: TranscriptReviewDemo,
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
  args: { scenario: "restored-comments" },
} satisfies Meta<typeof TranscriptReviewDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const RestoredCodeAndTableFeedback: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("region", { name: "AI conversation" });
    await expect(
      canvas.findByText("Keep this code feedback after reopening."),
    ).resolves.toBeVisible();
    // Captured Markdown readers mount offscreen tables as their viewport enters.
    canvasElement
      .querySelector('[data-block-id="review-response/body"]')!
      .scrollIntoView({ block: "end" });
    await expect(
      canvas.findByText("Keep this table feedback and its original row."),
    ).resolves.toBeVisible();
    expect(
      canvas.queryByRole("group", { name: "Pending comments" }),
    ).toBeNull();
    const tableFeedback = canvas.getByText(
      "Keep this table feedback and its original row.",
    );
    const inline = tableFeedback.closest(
      '[data-chat-comment-area][data-placement="inline"]',
    ) as HTMLElement;
    expect(inline).not.toBeNull();
    expect(within(inline).getByRole("img", { name: /^Sent$/ })).toBeVisible();
    expect(aiReviewValue(canvasElement, "sessions")).toBe("[]");
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
    await expect(
      canvas.findByText("Keep this table feedback and its original row."),
    ).resolves.toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Document view" }),
    );
    await userEvent.click(messageEditor(canvas));
    await userEvent.keyboard("Continue using the saved feedback");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await waitFor(() => {
      const sessions = JSON.parse(aiReviewValue(canvasElement, "runtime"));
      expect(sessions.at(-1).prompts).toEqual([
        "Continue using the saved feedback",
      ]);
      const handoff = sessions
        .at(-1)
        .context[0].find(
          (block: { kind: string }) => block.kind === "conversation-handoff",
        );
      expect(handoff.content).toContain(
        "Keep this code feedback after reopening.",
      );
      expect(handoff.content).toContain(
        "Keep this table feedback and its original row.",
      );
    });
  },
};

export const LinkedCodeTableAndToolReplies: Story = {
  args: { scenario: "restored-discussions" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const areas = await c.findAllByRole("group", {
      name: "Inline comments on Assistant response",
    });
    expect(
      areas.some((area) =>
        within(area).queryByText("Keep this code feedback after reopening."),
      ),
    ).toBe(true);
    const reply = await c.findByText("A clarified daily review");
    const source = canvasElement.querySelector(
      '[data-block-id="review-response/body"]',
    )!;
    source.scrollIntoView({ block: "end" });
    let table: HTMLElement | undefined;
    await waitFor(() => {
      table = c
        .getAllByRole("group", {
          name: "Inline comments on Assistant response",
        })
        .find((area) =>
          within(area).queryByText(
            "Keep this table feedback and its original row.",
          ),
        );
      expect(table).toBeDefined();
    });
    const go = within(table!).getByRole("button", { name: "Go to reply" });
    await userEvent.click(go);
    await waitFor(() => {
      expect(reply.getBoundingClientRect().top).toBeGreaterThanOrEqual(0);
      expect(reply.getBoundingClientRect().top).toBeLessThan(
        window.innerHeight,
      );
    });
    await expect(reply).toBeVisible();
    expect(aiReviewValue(canvasElement, "sessions")).toBe("[]");
    await userEvent.click(
      c.getByRole("button", { name: "Switch to Classic view" }),
    );
    await expect(
      c.findByText("A clarified daily review"),
    ).resolves.toBeVisible();
    expect(c.queryByRole("group", { name: "Pending comments" })).toBeNull();
  },
};

export const ContinueRestoredThread: Story = {
  args: { scenario: "restored-discussions" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const areas = await c.findAllByRole("group", {
      name: "Inline comments on Assistant response",
    });
    const code = areas.find((area) =>
      within(area).queryByText("Keep this code feedback after reopening."),
    )!;
    expect(code).toBeDefined();
    await userEvent.click(
      within(code).getByRole("button", { name: /^Reply$/ }),
    );
    const text = "Keep the original example and explain cold recovery.";
    await userEvent.click(
      within(code).getByRole("textbox", {
        name: "Comment on Assistant response",
      }),
    );
    await userEvent.keyboard(text);
    const pending = c.getByRole("group", { name: "Pending comments" });
    expect(
      within(pending).getAllByRole("article", { name: "Comment by You" }),
    ).toHaveLength(1);
    expect(pending).toHaveTextContent(text);
    expect(pending).not.toHaveTextContent(
      "Keep this code feedback after reopening.",
    );
    await userEvent.click(
      c.getByRole("button", { name: "Switch to Classic view" }),
    );
    expect(
      c.getByRole("group", { name: "Pending comments" }),
    ).toHaveTextContent(text);
    await userEvent.click(c.getByRole("button", { name: "Send message" }));
    await waitFor(() => {
      const sessions = JSON.parse(aiReviewValue(canvasElement, "runtime"));
      expect(sessions.at(-1).prompts).toEqual([""]);
      const context = sessions
        .at(-1)
        .context[0].find(
          (block: { kind: string }) => block.kind === "transcript-comments",
        );
      const comments = JSON.parse(context.content).comments;
      expect(comments).toHaveLength(1);
      expect(comments[0]).toMatchObject({
        threadId: "saved-code",
        text,
        anchor: { blockId: "review-response/body", quote: "# Daily review" },
      });
      expect(comments[0].commentId).not.toBe("saved-code-comment");
    });
    expect(c.queryByRole("group", { name: "Pending comments" })).toBeNull();
    expect(aiReviewValue(canvasElement, "sessions")).not.toBe("[]");
  },
};
