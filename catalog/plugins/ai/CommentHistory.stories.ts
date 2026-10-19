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
    await userEvent.click(canvas.getByRole("button", { name: "Classic" }));
    await expect(
      canvas.findByText("Keep this table feedback and its original row."),
    ).resolves.toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Document" }));
    await userEvent.click(canvas.getByRole("textbox", { name: "Message" }));
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
